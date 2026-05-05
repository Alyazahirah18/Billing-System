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

        // Buat record di tabel upgrade_layanan
        await UpgradeLayanan.create({
            ID_PELANGGAN: id_pelanggan,
            ID_PAKET_BARU: id_paket,
            STATUS_UPGRADE: 'pending',
            TANGGAL_REQUEST: new Date()
        });

        // Buat Notifikasi
        const { Notifikasi } = require('../models');
        await Notifikasi.create({
            ID_PELANGGAN: id_pelanggan,
            JUDUL: 'Upgrade Layanan Diajukan',
            DESKRIPSI_PESAN: `Permintaan upgrade layanan ke paket "${paketBaru.NAMA_PAKET}" telah berhasil diajukan dan sedang menunggu konfirmasi admin.`,
            KATEGORI_NOTIFIKASI: 'upgrade',
            TANGGAL_NOTIFIKASI: new Date()
        });

        res.json({
            message: 'Pengajuan layanan berhasil disimpan. Menunggu konfirmasi admin.',
            paketBaru: paketBaru.NAMA_PAKET
        });

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
        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

        const listWithStatus = await Promise.all(pelangganList.map(async (p) => {
            let status = 'AKTIF';
            let jatuhTempoFormatted = '-';

            // Dapatkan tagihan terakhir (Jatuh tempo tertinggi)
            const tagihan = await Tagihan.findOne({
                where: { ID_PELANGGAN: p.ID_PELANGGAN },
                order: [['JATUH_TEMPO', 'DESC']]
            });

            if (tagihan) {
                const jtDate = new Date(tagihan.JATUH_TEMPO);
                jatuhTempoFormatted = jtDate.toLocaleDateString('id-ID', {
                    day: 'numeric', month: 'long', year: 'numeric'
                });

                if (tagihan.STATUS_PEMBAYARAN !== 'berhasil') {
                    if (jtDate <= threeDaysAgo) {
                        status = 'BLOCKIR';
                    } else if (jtDate <= today) {
                        status = 'JATUH TEMPO';
                    }
                }
            } else if (p.STATUS_PELANGGAN === 'calon') {
                status = 'CALON';
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
        res.json({ message: 'Pelanggan berhasil dihapus (soft delete).' });

    } catch (err) {
        console.error('Error delete pelanggan:', err);
        res.status(500).json({ message: 'Gagal menghapus pelanggan.', error: err.message });
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
