const express = require('express');
const router = express.Router();
const { Pelanggan, Paket, UpgradeLayanan, Tagihan } = require('../models');
const verifyToken = require('../middleware/authMiddleware');
const { Op } = require('sequelize');

// ============================================
// POST /api/pelanggan/bayar
// Pembayaran berlangganan — status calon → aktif
// ============================================
router.post('/bayar', verifyToken, async (req, res) => {
    try {
        const { id_pelanggan, id_paket } = req.body;

        // Validasi input
        if (!id_pelanggan || !id_paket) {
            return res.status(400).json({ message: 'ID pelanggan dan ID paket wajib diisi.' });
        }

        // Cek apakah pelanggan ada
        const pelanggan = await Pelanggan.findByPk(id_pelanggan);

        if (!pelanggan) {
            return res.status(404).json({ message: 'Pelanggan tidak ditemukan.' });
        }

        // Cek apakah paket valid
        const paket = await Paket.findByPk(id_paket);

        if (!paket) {
            return res.status(404).json({ message: 'Paket tidak ditemukan.' });
        }

        // Update status pelanggan: calon → aktif + set paket
        await pelanggan.update({
            STATUS_LANGGANAN: 'aktif',
            ID_PAKET: id_paket
        });

        res.json({
            message: 'Pembayaran berhasil! Status berlangganan diaktifkan.',
            user: {
                id: pelanggan.ID_PELANGGAN,
                nama: pelanggan.NAMA,
                telepon: pelanggan.TELEPON,
                alamat: pelanggan.ALAMAT,
                alamat_wilayah: pelanggan.ALAMAT_WILAYAH,
                status_langganan: pelanggan.STATUS_LANGGANAN,
                id_paket: pelanggan.ID_PAKET
            }
        });

    } catch (err) {
        console.error('Error pembayaran:', err);
        res.status(500).json({ message: 'Gagal memproses pembayaran.', error: err.message });
    }
});

// ============================================
// POST /api/pelanggan/upgrade
// Upgrade atau Downgrade paket layanan pelanggan
// ============================================
router.post('/upgrade', verifyToken, async (req, res) => {
    try {
        const id_pelanggan = req.user.id;
        const { id_paket } = req.body;

        if (!id_paket) {
            return res.status(400).json({ message: 'ID Paket tidak boleh kosong.' });
        }

        const pelanggan = await Pelanggan.findByPk(id_pelanggan);
        if (!pelanggan) {
            return res.status(404).json({ message: 'Pelanggan tidak ditemukan.' });
        }

        const paketBaru = await Paket.findByPk(id_paket);
        if (!paketBaru) {
            return res.status(404).json({ message: 'Paket yang dipilih tidak ditemukan.' });
        }

        // Cek apakah paket yang dipilih sama dengan paket yang aktif saat ini
        if (pelanggan.ID_PAKET && parseInt(pelanggan.ID_PAKET) === parseInt(id_paket)) {
            return res.status(400).json({ message: 'Anda tidak dapat memilih paket layanan yang sama dengan paket yang sedang aktif saat ini.' });
        }

        // Cek apakah pelanggan sudah memiliki pengajuan upgrade yang pending
        const { Op } = require('sequelize');
        const existingUpgrade = await UpgradeLayanan.findOne({
            where: {
                ID_PELANGGAN: id_pelanggan,
                STATUS_UPGRADE: 'pending'
            }
        });

        if (existingUpgrade) {
            return res.status(400).json({ message: 'Anda masih memiliki pengajuan perubahan layanan yang belum selesai. Harap lunasi tagihan sebelumnya atau hubungi admin.' });
        }

        const newUpgrade = await UpgradeLayanan.create({
            ID_PELANGGAN: id_pelanggan,
            ID_PAKET_BARU: id_paket,
            STATUS_UPGRADE: 'pending',
            TANGGAL_REQUEST: new Date()
        });

        // Tentukan apakah ini upgrade atau downgrade 
        let paketLama = null;
        if (pelanggan.ID_PAKET) {
            paketLama = await Paket.findByPk(pelanggan.ID_PAKET);
        }
        const isUpgrade = paketBaru.HARGA_PAKET > (paketLama ? paketLama.HARGA_PAKET : 0);

        if (isUpgrade) {
            // Buat Tagihan Baru untuk Upgrade Layanan
            const today = new Date();
            const jatuhTempo = new Date(today);
            jatuhTempo.setDate(jatuhTempo.getDate() + 3);
            jatuhTempo.setHours(0, 0, 0, 0);

            const nomorTagihan = Math.floor(100000 + Math.random() * 900000);

            // Format ID_TRANSAKSI khusus
            const orderId = `UPG-${newUpgrade.ID_UPGRADE}-${pelanggan.ID_PELANGGAN}-${Date.now()}`;

            await Tagihan.create({
                ID_PELANGGAN: pelanggan.ID_PELANGGAN,
                JUMLAH_BAYAR: paketBaru.HARGA_PAKET,
                JATUH_TEMPO: jatuhTempo,
                STATUS_PEMBAYARAN: 'menunggu_verifikasi',
                BULAN_TAGIHAN: today.getMonth() + 1,
                TAHUN_TAGIHAN: today.getFullYear(),
                NOMOR_TAGIHAN: nomorTagihan,
                ID_TRANSAKSI: orderId
            });

            // Buat Notifikasi untuk pelanggan
            const { Notifikasi } = require('../models');
            await Notifikasi.create({
                ID_PELANGGAN: pelanggan.ID_PELANGGAN,
                JUDUL: 'Tagihan Upgrade Layanan',
                DESKRIPSI_PESAN: `Anda telah mengajukan upgrade ke paket "${paketBaru.NAMA_PAKET}". Silakan lakukan pembayaran tagihan upgrade di menu Tagihan agar pengajuan dapat diteruskan ke admin.`,
                KATEGORI_NOTIFIKASI: 'upgrade',
                TANGGAL_NOTIFIKASI: new Date()
            });

            res.json({
                message: 'Pengajuan upgrade berhasil! Anda akan dialihkan ke halaman tagihan untuk melakukan pembayaran terlebih dahulu.',
                paketBaru: paketBaru.NAMA_PAKET,
                redirect: 'tagihan'
            });
        } else {
            // Downgrade
            // Buat Notifikasi
            const { Notifikasi } = require('../models');
            await Notifikasi.create({
                ID_PELANGGAN: id_pelanggan,
                JUDUL: 'Downgrade Layanan Diajukan',
                DESKRIPSI_PESAN: `Permintaan perubahan layanan ke paket "${paketBaru.NAMA_PAKET}" telah berhasil diajukan dan sedang menunggu konfirmasi admin.`,
                KATEGORI_NOTIFIKASI: 'upgrade',
                TANGGAL_NOTIFIKASI: new Date()
            });

            res.json({
                message: 'Pengajuan downgrade berhasil disimpan. Menunggu konfirmasi admin.',
                paketBaru: paketBaru.NAMA_PAKET
            });
        }

    } catch (err) {
        console.error('Error upgrade layanan:', err);
        res.status(500).json({ message: 'Gagal mengajukan layanan.', error: err.message });
    }
});

// ============================================
// GET /api/pelanggan/admin/list
// Ambil daftar pelanggan untuk admin
// ============================================
router.get('/admin/list', verifyToken, async (req, res) => {
    try {
        const pelangganList = await Pelanggan.findAll({
            include: [{
                model: Paket,
                attributes: ['NAMA_PAKET']
            }],
            order: [['TANGGAL_AKTIVASI', 'DESC']]
        });

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // 0. PEMBERSIHAN TAGIHAN PREMATUR (BELUM MASUK H-10) SECARA GLOBAL
        try {
            const prematurTagihans = await Tagihan.findAll({
                where: {
                    STATUS_PEMBAYARAN: { [Op.ne]: 'berhasil' },
                    ID_TRANSAKSI: { [Op.like]: 'TAG-%' }
                }
            });

            const todayUTC = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
            const todayDate = new Date(todayUTC);

            for (const t of prematurTagihans) {
                const jatuhTempoDate = new Date(t.JATUH_TEMPO);
                const triggerDate = new Date(jatuhTempoDate);
                triggerDate.setUTCDate(triggerDate.getUTCDate() - 10);
                triggerDate.setHours(0, 0, 0, 0);

                if (todayDate < triggerDate) {
                    console.log(`🧹 Menghapus tagihan prematur ${t.ID_TRANSAKSI} karena belum memasuki H-10.`);
                    await t.destroy();
                }
            }
        } catch (purgeErr) {
            console.error("Gagal membersihkan tagihan prematur secara global di admin pelanggan list:", purgeErr);
        }

        const listWithStatus = await Promise.all(pelangganList.map(async (p) => {
            let status = 'AKTIF';
            let jatuhTempoFormatted = '-';

            // Dapatkan tagihan terakhir (Jatuh tempo tertinggi) yang bukan tagihan upgrade
            const tagihan = await Tagihan.findOne({
                where: {
                    ID_PELANGGAN: p.ID_PELANGGAN,
                    ID_TRANSAKSI: { [Op.notLike]: 'UPG-%' }
                },
                order: [['JATUH_TEMPO', 'DESC']]
            });

            let targetJatuhTempoDate = null;

            if (tagihan) {
                targetJatuhTempoDate = new Date(tagihan.JATUH_TEMPO);
                if (tagihan.STATUS_PEMBAYARAN === 'berhasil') {
                    targetJatuhTempoDate.setMonth(targetJatuhTempoDate.getMonth() + 1);
                }
                // Paksa tanggal agar selalu konsisten dengan tanggal aktivasi (mengatasi bug tagihan lama)
                if (p.TANGGAL_AKTIVASI) {
                    targetJatuhTempoDate.setDate(new Date(p.TANGGAL_AKTIVASI).getUTCDate());
                }
            } else if (p.TANGGAL_AKTIVASI && p.ID_PAKET) {
                const tanggalAktivasi = new Date(p.TANGGAL_AKTIVASI);
                targetJatuhTempoDate = new Date(tanggalAktivasi);
                targetJatuhTempoDate.setMonth(targetJatuhTempoDate.getMonth() + 1);
                targetJatuhTempoDate.setDate(tanggalAktivasi.getUTCDate());
            }

            if (targetJatuhTempoDate) {
                targetJatuhTempoDate.setHours(0, 0, 0, 0);
                jatuhTempoFormatted = targetJatuhTempoDate.toLocaleDateString('id-ID', {
                    day: 'numeric', month: 'long', year: 'numeric'
                });
            }

            // Tentukan status berdasarkan aturan H-7 dan H+7 jika ada tagihan tertunggak
            if (p.STATUS_PELANGGAN === 'calon') {
                status = 'CALON';
            } else if (p.STATUS_LAYANAN === 'blokir') {
                status = 'BLOCKIR';
            } else {
                const unpaidBills = await Tagihan.findAll({
                    where: {
                        ID_PELANGGAN: p.ID_PELANGGAN,
                        STATUS_PEMBAYARAN: { [Op.ne]: 'berhasil' },
                        ID_TRANSAKSI: { [Op.notLike]: 'UPG-%' }
                    },
                    order: [['JATUH_TEMPO', 'ASC']]
                });

                if (unpaidBills.length > 0) {
                    const oldestUnpaid = unpaidBills[0];
                    const billDueDate = new Date(oldestUnpaid.JATUH_TEMPO);
                    billDueDate.setHours(0, 0, 0, 0);

                    const diffMs = today.getTime() - billDueDate.getTime();
                    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

                    if (diffDays > 7) {
                        status = 'BLOCKIR';
                    } else if (diffDays >= -7) {
                        status = 'JATUH TEMPO';
                    }
                }
            }

            // Sync ke kolom STATUS_LAYANAN di database agar tersimpan permanen & konsisten
            if (status === 'BLOCKIR' && p.STATUS_LAYANAN !== 'blokir') {
                await p.update({ STATUS_LAYANAN: 'blokir' });
            } else if ((status === 'AKTIF' || status === 'JATUH TEMPO') && p.STATUS_LAYANAN === 'blokir') {
                await p.update({ STATUS_LAYANAN: 'aktif' });
            }

            if (p.STATUS_LAYANAN === 'blokir') {
                status = 'BLOCKIR';
            }

            return {
                id_pelanggan: p.ID_PELANGGAN,
                kode_user: p.KODE_PELANGGAN,
                nama: p.NAMA_PELANGGAN,
                no_hp: p.NO_HP,
                alamat: p.ALAMAT,
                paket_layanan: p.Paket ? p.Paket.NAMA_PAKET : '-',
                id_paket: p.ID_PAKET,
                status: status,
                jatuh_tempo: jatuhTempoFormatted,
                jatuh_tempo_raw: tagihan ? tagihan.JATUH_TEMPO : null
            };
        }));

        res.json(listWithStatus);
    } catch (err) {
        console.error('Error get admin list:', err);
        res.status(500).json({ message: 'Gagal mengambil daftar pelanggan', error: err.message });
    }
});

// ============================================
// PUT /api/pelanggan/admin/:id
// Edit data pelanggan (KODE_PELANGGAN dan ID_PAKET)
// ============================================
router.put('/admin/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { KODE_PELANGGAN, ID_PAKET } = req.body;

        const pelanggan = await Pelanggan.findByPk(id);
        if (!pelanggan) {
            return res.status(404).json({ message: 'Pelanggan tidak ditemukan.' });
        }

        // Cek jika KODE_PELANGGAN sudah digunakan oleh orang lain
        if (KODE_PELANGGAN && KODE_PELANGGAN !== pelanggan.KODE_PELANGGAN) {
            const existing = await Pelanggan.findOne({ where: { KODE_PELANGGAN } });
            if (existing) {
                return res.status(400).json({ message: 'Kode Pelanggan sudah digunakan.' });
            }
        }

        await pelanggan.update({
            KODE_PELANGGAN: KODE_PELANGGAN || pelanggan.KODE_PELANGGAN,
            ID_PAKET: ID_PAKET || pelanggan.ID_PAKET
        });

        // Catat Log Aktivitas Staff
        try {
            const { LogAktivitas, Pegawai } = require('../models');
            if (LogAktivitas && Pegawai && req.user && req.user.role !== 'owner') {
                const id_pegawai = req.user.id_asli;
                const peg = await Pegawai.findByPk(id_pegawai);
                const username = peg ? peg.USERNAME : req.user.nama;

                await LogAktivitas.create({
                    id_pegawai: id_pegawai,
                    USERNAME: username,
                    activity: 'Mengedit Pelanggan',
                    content: `Mengubah data kode pelanggan atau paket untuk pelanggan "${pelanggan.NAMA_PELANGGAN}"`,
                    datetime: new Date()
                });
            }
        } catch (logErr) {
            console.error('Gagal mencatat log edit pelanggan:', logErr.message);
        }

        res.json({ message: 'Data pelanggan berhasil diupdate.' });
    } catch (err) {
        console.error('Error update pelanggan:', err);
        res.status(500).json({ message: 'Gagal mengupdate pelanggan.', error: err.message });
    }
});

// ============================================
// DELETE /api/pelanggan/admin/:id
// Soft delete pelanggan jika jatuh tempo > 1 bulan
// ============================================
router.delete('/admin/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const pelanggan = await Pelanggan.findByPk(id);
        if (!pelanggan) {
            return res.status(404).json({ message: 'Pelanggan tidak ditemukan.' });
        }

        await pelanggan.destroy(); // Soft delete via paranoid

        // Catat Log Aktivitas Staff
        try {
            const { LogAktivitas, Pegawai } = require('../models');
            if (LogAktivitas && Pegawai && req.user && req.user.role !== 'owner') {
                const id_pegawai = req.user.id_asli;
                const peg = await Pegawai.findByPk(id_pegawai);
                const username = peg ? peg.USERNAME : req.user.nama;

                await LogAktivitas.create({
                    id_pegawai: id_pegawai,
                    USERNAME: username,
                    activity: 'Menghapus Pelanggan',
                    content: `Menghapus data pelanggan (soft delete) untuk pelanggan "${pelanggan.NAMA_PELANGGAN}"`,
                    datetime: new Date()
                });
            }
        } catch (logErr) {
            console.error('Gagal mencatat log hapus pelanggan:', logErr.message);
        }

        res.json({ message: 'Pelanggan berhasil dihapus (soft delete).' });

    } catch (err) {
        console.error('Error delete pelanggan:', err);
        res.status(500).json({ message: 'Gagal menghapus pelanggan.', error: err.message });
    }
});


// ============================================
// PUT /api/pelanggan/profile
// Edit profile oleh pelanggan sendiri
// ============================================
router.put('/profile', verifyToken, async (req, res) => {
    try {
        const id_pelanggan = req.user.id;
        const { nama, NO_HP, alamat, alamat_wilayah, PASSWORD } = req.body;

        // Validasi input minimal
        if (!nama || !NO_HP || !alamat) {
            return res.status(400).json({ message: 'Nama, nomor telepon, dan alamat wajib diisi.' });
        }

        const pelanggan = await Pelanggan.findByPk(id_pelanggan);
        if (!pelanggan) {
            return res.status(404).json({ message: 'Pelanggan tidak ditemukan.' });
        }

        // Cek jika NO_HP sudah digunakan oleh pelanggan lain
        const existing = await Pelanggan.findOne({
            where: {
                NO_HP: NO_HP,
                ID_PELANGGAN: { [Op.ne]: id_pelanggan }
            }
        });
        if (existing) {
            return res.status(400).json({ message: 'Nomor HP sudah digunakan oleh akun lain.' });
        }

        const updateData = {
            NAMA_PELANGGAN: nama,
            NO_HP: NO_HP,
            ALAMAT: alamat,
            ALAMAT_WILAYAH: alamat_wilayah || null
        };

        // Jika password diisi, hash passwordnya
        if (PASSWORD && PASSWORD.trim() !== '') {
            const bcrypt = require('bcryptjs');
            const salt = await bcrypt.genSalt(10);
            updateData.PASSWORD = await bcrypt.hash(PASSWORD, salt);
        }

        await pelanggan.update(updateData);

        // Buat Notifikasi bahwa edit profile berhasil dilakukan
        const { Notifikasi } = require('../models');
        await Notifikasi.create({
            ID_PELANGGAN: id_pelanggan,
            JUDUL: 'Profil Berhasil Diperbarui',
            DESKRIPSI_PESAN: `Profil Anda berhasil diperbarui pada ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}.`,
            KATEGORI_NOTIFIKASI: 'aduan',
            TANGGAL_NOTIFIKASI: new Date()
        });

        res.json({
            message: 'Profil berhasil diperbarui.',
            user: {
                id: pelanggan.ID_PELANGGAN,
                nama: pelanggan.NAMA_PELANGGAN,
                NO_HP: pelanggan.NO_HP,
                alamat: pelanggan.ALAMAT,
                alamat_wilayah: pelanggan.ALAMAT_WILAYAH,
                status_langganan: pelanggan.STATUS_PELANGGAN,
                kode_pelanggan: pelanggan.KODE_PELANGGAN,
                id_paket: pelanggan.ID_PAKET
            }
        });

    } catch (err) {
        console.error('Error update profile pelanggan:', err);
        res.status(500).json({ message: 'Gagal memperbarui profil.', error: err.message });
    }
});

// ============================================
// GET /api/pelanggan/:id
// Ambil data pelanggan berdasarkan ID
// ============================================
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;

        const pelanggan = await Pelanggan.findByPk(id, {
            include: [{
                model: Paket,
                attributes: ['NAMA_PAKET', 'HARGA']
            }]
        });

        if (!pelanggan) {
            return res.status(404).json({ message: 'Pelanggan tidak ditemukan.' });
        }

        res.json({
            id: pelanggan.ID_PELANGGAN,
            nama: pelanggan.NAMA,
            telepon: pelanggan.TELEPON,
            alamat: pelanggan.ALAMAT,
            alamat_wilayah: pelanggan.ALAMAT_WILAYAH,
            status_langganan: pelanggan.STATUS_LANGGANAN,
            id_paket: pelanggan.ID_PAKET,
            nama_paket: pelanggan.Paket ? pelanggan.Paket.NAMA_PAKET : null,
            harga_paket: pelanggan.Paket ? pelanggan.Paket.HARGA : null,
            tanggal_daftar: pelanggan.TANGGAL_DAFTAR
        });

    } catch (err) {
        console.error('Error get pelanggan:', err);
        res.status(500).json({ message: 'Gagal mengambil data pelanggan.', error: err.message });
    }
});

// Endpoint untuk Soft Delete Pelanggan
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Mencari pelanggan berdasarkan ID
        const pelanggan = await Pelanggan.findByPk(id);

        if (!pelanggan) {
            return res.status(404).json({ message: "Pelanggan tidak ditemukan" });
        }

        // Melakukan Soft Delete
        // Ini akan mengisi kolom deletedAt di database, bukan menghapus barisnya
        await pelanggan.destroy();

        res.json({ message: "Data pelanggan berhasil dihapus (Soft Delete)" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Terjadi kesalahan server" });
    }
});

// Endpoint untuk mengambil data yang belum dihapus (Otomatis terfilter)
router.get('/', async (req, res) => {
    try {
        const pelanggan = await Pelanggan.findAll();
        res.json(pelanggan);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});
module.exports = router;
