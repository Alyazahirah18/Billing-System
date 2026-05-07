const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/authMiddleware');

// Import models dengan aman
let Tagihan, Pelanggan, Paket;

try {
    const models = require('../models');
    Tagihan = models.Tagihan;
    Pelanggan = models.Pelanggan;
    Paket = models.Paket;
    console.log('Models loaded successfully in dashboardRoutes');
} catch (err) {
    console.error('Error loading models in dashboardRoutes:', err.message);
}

// ============================================
// GET /api/dashboard/summary
// Data untuk Dashboard utama
// ============================================
router.get('/summary', verifyToken, async (req, res) => {
    try {
        console.log('Dashboard summary requested for user:', req.user.id);

        // Cek apakah models tersedia
        if (!Pelanggan || !Paket) {
            console.error('Models not available:', { Pelanggan: !!Pelanggan, Paket: !!Paket, Tagihan: !!Tagihan });
            return res.status(500).json({
                message: "Model database tidak tersedia",
                error: "Models not loaded correctly"
            });
        }

        const id_pelanggan = req.user.id;

        // 1. Ambil data pelanggan
        const pelanggan = await Pelanggan.findByPk(id_pelanggan);

        if (!pelanggan) {
            console.log('Pelanggan not found:', id_pelanggan);
            return res.status(404).json({ message: "Data pelanggan tidak ditemukan" });
        }

        console.log('Pelanggan found:', {
            id: pelanggan.ID_PELANGGAN,
            nama: pelanggan.NAMA_PELANGGAN,
            id_paket: pelanggan.ID_PAKET,
            status: pelanggan.STATUS_PELANGGAN
        });

        // 2. Ambil data paket jika ada
        let paketData = null;
        let tagihanAktif = 0;
        let jenisLayanan = 'Belum Memilih Paket';

        if (pelanggan.ID_PAKET) {
            paketData = await Paket.findByPk(pelanggan.ID_PAKET);
            if (paketData) {
                tagihanAktif = parseFloat(paketData.HARGA_PAKET) || 0;
                jenisLayanan = paketData.NAMA_PAKET || 'Paket Tidak Diketahui';
            }
        }

        // 3. Tentukan STATUS LAYANAN
        const statusLayanan = (pelanggan.ID_PAKET && pelanggan.STATUS_PELANGGAN === 'aktif') ? 'AKTIF' : 'CALON';

        // 4. Tentukan JATUH TEMPO
        let jatuhTempo = '-';
        if (pelanggan.TANGGAL_AKTIVASI && pelanggan.ID_PAKET) {
            try {
                const tanggalAktivasi = new Date(pelanggan.TANGGAL_AKTIVASI);
                const tanggalTagihan = new Date(tanggalAktivasi);
                tanggalTagihan.setMonth(tanggalTagihan.getMonth() + 1);
                const tanggalJatuhTempo = new Date(tanggalTagihan);
                tanggalJatuhTempo.setDate(tanggalJatuhTempo.getDate() - 3);
                jatuhTempo = tanggalJatuhTempo.toLocaleDateString('id-ID');
            } catch (e) {
                console.error('Error calculating jatuh tempo:', e);
            }
        }

        // 5. Ambil HISTORI PEMBAYARAN (5 terakhir) - cek apakah Tagihan tersedia
        let histori = [];
        if (Tagihan) {
            try {
                const historiData = await Tagihan.findAll({
                    where: {
                        ID_PELANGGAN: id_pelanggan,
                        STATUS_PEMBAYARAN: 'berhasil'
                    },
                    order: [['TANGGAL_PEMBAYARAN', 'DESC']],
                    limit: 5
                });

                console.log('Histori data found:', historiData ? historiData.length : 0);

                if (historiData && historiData.length > 0) {
                    histori = historiData.map(item => ({
                        id_tagihan: item.ID_TAGIHAN,
                        nama_paket: jenisLayanan,
                        harga_paket: parseFloat(item.JUMLAH_BAYAR) || 0,
                        tanggal: item.TANGGAL_PEMBAYARAN ?
                            new Date(item.TANGGAL_PEMBAYARAN).toLocaleDateString('id-ID') : '-',
                        status: 'Lunas',
                        invoice: `INV/${item.TAHUN_TAGIHAN || '2024'}/${String(item.ID_TAGIHAN).padStart(4, '0')}`
                    }));
                }
            } catch (e) {
                console.error('Error fetching histori:', e.message);
            }
        } else {
            console.warn('Tagihan model is not available');
        }

        // Response
        const response = {
            status_layanan: statusLayanan,
            tagihan_aktif: tagihanAktif,
            jatuh_tempo: jatuhTempo,
            jenis_layanan: jenisLayanan,
            histori: histori
        };

        console.log('Sending response success');
        res.json(response);

    } catch (err) {
        console.error("Dashboard Error:", err);
        res.status(500).json({
            message: "Terjadi kesalahan pada server",
            error: err.message
        });
    }
});

// ============================================
// GET /api/dashboard/test
// Endpoint test untuk cek koneksi
// ============================================
router.get('/test', verifyToken, async (req, res) => {
    try {
        // Cek ketersediaan models
        const modelsStatus = {
            Pelanggan: !!Pelanggan,
            Paket: !!Paket,
            Tagihan: !!Tagihan
        };

        res.json({
            message: 'Dashboard API is working!',
            user: req.user,
            models: modelsStatus
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// ============================================
// GET /api/dashboard/admin
// Data untuk Admin Dashboard
// ============================================
router.get('/admin', verifyToken, async (req, res) => {
    try {
        if (!Pelanggan || !Paket || !Tagihan) {
            return res.status(500).json({ message: "Model database tidak tersedia" });
        }

        // 1. Jumlah Pelanggan (hanya status_pelanggan: 'aktif')
        const jumlahPelanggan = await Pelanggan.count({
            where: { STATUS_PELANGGAN: 'aktif' }
        });

        // 2. Jatuh Tempo
        const { Op } = require('sequelize');
        const today = new Date();
        
        // Ambil ID pelanggan yang memiliki tagihan jatuh tempo
        const tagihanJatuhTempo = await Tagihan.findAll({
            attributes: ['ID_PELANGGAN', 'JATUH_TEMPO'],
            where: {
                STATUS_PEMBAYARAN: { [Op.ne]: 'berhasil' },
                JATUH_TEMPO: { [Op.lte]: today }
            }
        });
        
        // Hitung unik pelanggan yang jatuh tempo
        const idPelangganJatuhTempo = [...new Set(tagihanJatuhTempo.map(t => t.ID_PELANGGAN))];
        const jatuhTempo = idPelangganJatuhTempo.length;

        // 3. Blokir
        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
        
        // Cari pelanggan yang tagihannya sudah lewat 3 hari dari jatuh tempo
        const tagihanBlokir = await Tagihan.findAll({
            attributes: ['ID_PELANGGAN'],
            where: {
                STATUS_PEMBAYARAN: { [Op.ne]: 'berhasil' },
                JATUH_TEMPO: { [Op.lte]: threeDaysAgo }
            }
        });
        const idPelangganBlokir = [...new Set(tagihanBlokir.map(t => t.ID_PELANGGAN))];

        const blokir = await Pelanggan.count({
            where: {
                STATUS_PELANGGAN: 'aktif', // Pastikan hanya yang status_pelanggan aktif
                [Op.or]: [
                    { STATUS_LAYANAN: 'blokir' },
                    { ID_PELANGGAN: { [Op.in]: idPelangganBlokir } }
                ]
            }
        });

        // 4. Aktif
        const aktif = await Pelanggan.count({
            where: {
                STATUS_PELANGGAN: 'aktif',
                STATUS_LAYANAN: 'aktif',
                ID_PELANGGAN: { [Op.notIn]: idPelangganJatuhTempo.length > 0 ? idPelangganJatuhTempo : [0] }
            }
        });

        // 5. Pelanggan Terbaru (5 data terakhir)
        const pelangganTerbaruData = await Pelanggan.findAll({
            where: { STATUS_PELANGGAN: 'aktif' },
            include: [{
                model: Paket,
                attributes: ['NAMA_PAKET']
            }],
            order: [['TANGGAL_AKTIVASI', 'DESC']],
            limit: 5
        });

        const pelangganTerbaru = pelangganTerbaruData.map(p => ({
            userId: p.KODE_PELANGGAN,
            nama: p.NAMA_PELANGGAN,
            jenisPaket: p.Paket ? p.Paket.NAMA_PAKET : '-',
            noHandphone: p.NO_HP,
            tanggal: new Date(p.TANGGAL_AKTIVASI).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            })
        }));

        res.json({
            stats: {
                jumlahPelanggan,
                jatuhTempo,
                blokir,
                aktif
            },
            pelangganTerbaru
        });

    } catch (err) {
        console.error("Admin Dashboard Error:", err);
        res.status(500).json({
            message: "Terjadi kesalahan pada server",
            error: err.message
        });
    }
});

// ============================================
// GET /api/dashboard/owner
// Data untuk Owner Dashboard
// ============================================
router.get('/owner', verifyToken, async (req, res) => {
    try {
        const { Pelanggan, Paket, Aduan } = require('../models');
        const { Op } = require('sequelize');

        // 1. Total Pelanggan Aktif
        const totalPelanggan = await Pelanggan.count({
            where: { STATUS_PELANGGAN: 'aktif' }
        });

        // 2. Disconnect (Pelanggan aktif yang terblokir layanannya)
        const disconnect = await Pelanggan.count({
            where: {
                STATUS_PELANGGAN: 'aktif',
                STATUS_LAYANAN: 'blokir'
            }
        });

        // 3. Total Aduan
        const totalAduan = await Aduan.count();

        // 4. Total Paket Layanan
        const totalPaket = await Paket.count();

        // 5. Ambil data tren pelanggan (pelanggan mulai berlangganan per bulan)
        const pelangganAktif = await Pelanggan.findAll({
            where: { STATUS_PELANGGAN: 'aktif' },
            attributes: ['TANGGAL_AKTIVASI', 'ALAMAT_WILAYAH']
        });

        // Inisialisasi hitungan per bulan (Jan - Des)
        const monthlyCounts = Array(12).fill(0);
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agst', 'Sept', 'Okt', 'Nov', 'Des'];

        // Inisialisasi hitungan per wilayah
        const wilayahCounts = {};

        pelangganAktif.forEach(p => {
            // Grouping Bulan berdasarkan TANGGAL_AKTIVASI
            if (p.TANGGAL_AKTIVASI) {
                const date = new Date(p.TANGGAL_AKTIVASI);
                const monthIndex = date.getMonth(); // 0-11
                if (monthIndex >= 0 && monthIndex < 12) {
                    monthlyCounts[monthIndex]++;
                }
            }

            // Grouping Wilayah berdasarkan ALAMAT_WILAYAH
            const wilayah = p.ALAMAT_WILAYAH || 'Lainnya';
            wilayahCounts[wilayah] = (wilayahCounts[wilayah] || 0) + 1;
        });

        // Format data untuk grafik tren
        const trendData = months.map((month, index) => ({
            month,
            count: monthlyCounts[index]
        }));

        // Format data untuk wilayah segments
        const areaData = Object.keys(wilayahCounts).map(wilayah => ({
            wilayah,
            count: wilayahCounts[wilayah]
        }));

        res.json({
            stats: {
                totalPelanggan,
                disconnect,
                totalAduan,
                totalPaket
            },
            trendData,
            areaData
        });
    } catch (err) {
        console.error("Owner Dashboard Error:", err);
        res.status(500).json({
            message: "Terjadi kesalahan saat mengambil data dashboard owner",
            error: err.message
        });
    }
});

// ============================================
// GET /api/dashboard/admin/layanan
// Data untuk Admin Manajemen Layanan
// ============================================
router.get('/admin/layanan', verifyToken, async (req, res) => {
    try {
        const { sequelize } = require('../models');

        const [aduanResult] = await sequelize.query('SELECT COUNT(*) as total FROM aduan');
        const [rescheduleResult] = await sequelize.query('SELECT COUNT(*) as total FROM reschedule');
        const [upgradeResult] = await sequelize.query('SELECT COUNT(*) as total FROM upgrade_layanan');

        res.json({
            pengaduan: aduanResult[0].total,
            reschedule: rescheduleResult[0].total,
            upgrade: upgradeResult[0].total
        });
    } catch (err) {
        console.error("Layanan Dashboard Error:", err);
        res.status(500).json({
            message: "Terjadi kesalahan saat mengambil data layanan",
            error: err.message
        });
    }
});

// ============================================
// GET /api/dashboard/admin/layanan/upgrade
// Data untuk halaman Manajemen Layanan Upgrade
// ============================================
router.get('/admin/layanan/upgrade', verifyToken, async (req, res) => {
    try {
        const { UpgradeLayanan, Pelanggan, Paket } = require('../models');

        // Total pengajuan (pending)
        const totalPending = await UpgradeLayanan.count({
            where: { STATUS_UPGRADE: 'pending' }
        });

        // Ambil data detail pengajuan
        const dataUpgrade = await UpgradeLayanan.findAll({
            where: { STATUS_UPGRADE: 'pending' },
            include: [
                {
                    model: Pelanggan,
                    attributes: ['KODE_PELANGGAN', 'NAMA_PELANGGAN', 'ID_PAKET'],
                    include: [{ model: Paket, attributes: ['NAMA_PAKET'] }]
                },
                {
                    model: Paket,
                    as: 'PaketBaru',
                    attributes: ['NAMA_PAKET']
                }
            ],
            order: [['TANGGAL_REQUEST', 'DESC']]
        });

        const formattedData = dataUpgrade.map(item => ({
            id_upgrade: item.ID_UPGRADE,
            userId: item.Pelanggan ? item.Pelanggan.KODE_PELANGGAN : '-',
            nama: item.Pelanggan ? item.Pelanggan.NAMA_PELANGGAN : '-',
            paketSaatIni: (item.Pelanggan && item.Pelanggan.Paket) ? item.Pelanggan.Paket.NAMA_PAKET : '-',
            paketUpgrade: item.PaketBaru ? item.PaketBaru.NAMA_PAKET : '-'
        }));

        res.json({
            total: totalPending,
            data: formattedData
        });
    } catch (err) {
        console.error("Layanan Upgrade Error:", err);
        res.status(500).json({
            message: "Terjadi kesalahan saat mengambil data upgrade",
            error: err.message
        });
    }
});

// ============================================
// POST /api/dashboard/admin/layanan/upgrade/confirm
// Konfirmasi permintaan upgrade
// ============================================
router.post('/admin/layanan/upgrade/confirm', verifyToken, async (req, res) => {
    try {
        const { id_upgrade } = req.body;
        const { UpgradeLayanan, Pelanggan } = require('../models');

        const upgradeRequest = await UpgradeLayanan.findByPk(id_upgrade);
        if (!upgradeRequest) {
            return res.status(404).json({ message: 'Data upgrade tidak ditemukan.' });
        }

        if (upgradeRequest.STATUS_UPGRADE !== 'pending') {
            return res.status(400).json({ message: 'Permintaan ini sudah diproses.' });
        }

        const pelanggan = await Pelanggan.findByPk(upgradeRequest.ID_PELANGGAN);
        if (!pelanggan) {
            return res.status(404).json({ message: 'Data pelanggan tidak ditemukan.' });
        }

        // 1. Update pelanggan ID_PAKET
        await pelanggan.update({ ID_PAKET: upgradeRequest.ID_PAKET_BARU });

        // 2. Update status upgrade
        await upgradeRequest.update({ 
            STATUS_UPGRADE: 'berhasil',
            TANGGAL_COMPLETE: new Date()
        });

        // 3. Buat Notifikasi
        const { Notifikasi, Paket } = require('../models');
        const paketBaru = await Paket.findByPk(upgradeRequest.ID_PAKET_BARU);
        await Notifikasi.create({
            ID_PELANGGAN: upgradeRequest.ID_PELANGGAN,
            JUDUL: 'Upgrade Layanan Berhasil',
            DESKRIPSI_PESAN: `Selamat! Permintaan upgrade layanan Anda telah disetujui. Sekarang Anda menggunakan paket "${paketBaru ? paketBaru.NAMA_PAKET : '-' }".`,
            KATEGORI_NOTIFIKASI: 'upgrade',
            TANGGAL_NOTIFIKASI: new Date()
        });

        res.json({ message: 'Permintaan upgrade berhasil dikonfirmasi.' });
    } catch (err) {
        console.error("Confirm Upgrade Error:", err);
        res.status(500).json({
            message: "Terjadi kesalahan saat mengkonfirmasi upgrade",
            error: err.message
        });
    }
});

// ============================================
// GET /api/dashboard/admin/layanan/aduan
// Data untuk halaman Manajemen Layanan Aduan
// ============================================
router.get('/admin/layanan/aduan', verifyToken, async (req, res) => {
    try {
        const { Aduan, Pelanggan } = require('../models');

        // Total aduan
        const total = await Aduan.count();
        const pending = await Aduan.count({ where: { STATUS_ADUAN: 'pending' } });
        const proses = await Aduan.count({ where: { STATUS_ADUAN: 'proses' } });
        const selesai = await Aduan.count({ where: { STATUS_ADUAN: 'selesai' } });

        // Ambil data aduan
        const dataAduan = await Aduan.findAll({
            include: [
                {
                    model: Pelanggan,
                    attributes: ['KODE_PELANGGAN', 'NAMA_PELANGGAN']
                }
            ],
            order: [['TANGGAL_ADUAN', 'DESC']]
        });

        const formattedData = dataAduan.map((item, index) => ({
            noAduan: `AD${String(index + 1).padStart(2, '0')}`, // Simulasi No Aduan
            id_aduan: item.ID_ADUAN,
            userId: item.Pelanggan ? item.Pelanggan.KODE_PELANGGAN : '-',
            nama: item.Pelanggan ? item.Pelanggan.NAMA_PELANGGAN : '-',
            kategori: item.SUBJEK,
            subjek: item.SUBJEK,
            deskripsi: item.DESKRIPSI_MASALAH,
            foto: item.FOTO_KENDALA,
            status: item.STATUS_ADUAN,
            tanggal: new Date(item.TANGGAL_ADUAN).toLocaleDateString('id-ID', {
                day: '2-digit', month: '2-digit', year: '2-digit'
            }).replace(/\//g, '-')
        }));

        res.json({
            stats: { total, pending, proses, selesai },
            data: formattedData
        });
    } catch (err) {
        console.error("Layanan Aduan Error:", err);
        res.status(500).json({
            message: "Terjadi kesalahan saat mengambil data aduan",
            error: err.message
        });
    }
});

// ============================================
// POST /api/dashboard/admin/layanan/aduan/update
// Update status aduan
// ============================================
router.post('/admin/layanan/aduan/update', verifyToken, async (req, res) => {
    try {
        const { id_aduan, status } = req.body;
        const { Aduan, Ticket } = require('../models');

        const aduan = await Aduan.findByPk(id_aduan);
        if (!aduan) {
            return res.status(404).json({ message: 'Data aduan tidak ditemukan.' });
        }

        await aduan.update({ STATUS_ADUAN: status });

        // Buat Notifikasi jika selesai
        if (status === 'selesai') {
            const { Notifikasi } = require('../models');
            await Notifikasi.create({
                ID_PELANGGAN: aduan.ID_PELANGGAN,
                JUDUL: 'Aduan Telah Selesai',
                DESKRIPSI_PESAN: `Aduan Anda mengenai "${aduan.SUBJEK}" telah selesai ditangani oleh tim teknisi kami.`,
                KATEGORI_NOTIFIKASI: 'aduan',
                TANGGAL_NOTIFIKASI: new Date()
            });
        }
        
        res.json({ message: 'Status aduan berhasil diupdate.' });
    } catch (err) {
        console.error("Update Aduan Error:", err);
        res.status(500).json({
            message: "Terjadi kesalahan saat mengupdate aduan",
            error: err.message
        });
    }
});

// ============================================
// GET /api/dashboard/admin/layanan/eticketing
// Data aduan untuk e-ticketing (menunggu perbaikan & belum ada tiket)
// ============================================
router.get('/admin/layanan/eticketing', verifyToken, async (req, res) => {
    try {
        const { Aduan, Pelanggan, Ticket } = require('../models');

        const dataAduan = await Aduan.findAll({
            where: { STATUS_ADUAN: 'proses' },
            include: [
                {
                    model: Pelanggan,
                    attributes: ['KODE_PELANGGAN', 'NAMA_PELANGGAN']
                },
                {
                    model: Ticket,
                    required: false // LEFT JOIN
                }
            ],
            order: [['TANGGAL_ADUAN', 'DESC']]
        });

        // Filter out yang sudah punya tiket
        const aduanBelumTicket = dataAduan.filter(item => !item.Ticket);

        const formattedData = aduanBelumTicket.map((item, index) => ({
            noAduan: `AD${String(item.ID_ADUAN).padStart(2, '0')}`,
            id_aduan: item.ID_ADUAN,
            userId: item.Pelanggan ? item.Pelanggan.KODE_PELANGGAN : '-',
            kategori: item.SUBJEK, 
            subjek: item.SUBJEK,
            deskripsi: item.DESKRIPSI_MASALAH,
            status: item.STATUS_ADUAN === 'proses' ? 'Menunggu Perbaikan' : item.STATUS_ADUAN,
            tanggal: new Date(item.TANGGAL_ADUAN).toLocaleDateString('id-ID', {
                day: '2-digit', month: '2-digit', year: '2-digit'
            }).replace(/\//g, '-')
        }));

        res.json(formattedData);
    } catch (err) {
        console.error("E-ticketing Data Error:", err);
        res.status(500).json({ message: "Terjadi kesalahan", error: err.message });
    }
});

// ============================================
// GET /api/dashboard/admin/layanan/teknisi/:wilayah
// Ambil daftar teknisi berdasarkan wilayah
// ============================================
router.get('/admin/layanan/teknisi/:wilayah', verifyToken, async (req, res) => {
    try {
        const { Pegawai } = require('../models');
        const teknisi = await Pegawai.findAll({
            where: {
                ROLE: 'teknisi',
                WILAYAH: req.params.wilayah
            },
            attributes: ['ID_PEGAWAI', 'NAMA']
        });
        res.json(teknisi);
    } catch (err) {
        console.error("Teknisi Error:", err);
        res.status(500).json({ message: "Terjadi kesalahan", error: err.message });
    }
});

// ============================================
// POST /api/dashboard/admin/layanan/eticketing
// Buat tiket baru
// ============================================
router.post('/admin/layanan/eticketing', verifyToken, async (req, res) => {
    try {
        const { id_aduan, id_pegawai, tanggal, waktu, prioritas, wilayah, deskripsi } = req.body;
        const { Ticket, Aduan } = require('../models');

        // Pastikan aduan ada dan statusnya proses
        const aduan = await Aduan.findByPk(id_aduan);
        if (!aduan) return res.status(404).json({ message: "Aduan tidak ditemukan" });

        // Format notes
        const notes = `Prioritas: ${prioritas}\nWilayah: ${wilayah}\nDeskripsi Penanganan: ${deskripsi}`;

        const newTicket = await Ticket.create({
            ID_PEGAWAI: id_pegawai,
            ID_ADUAN: id_aduan,
            SCHEDULE_DATE: tanggal,
            SCHEDULE_TIME: waktu,
            TICKET_STATUS: 'open',
            NOTES: notes
        });

        // Buat Notifikasi untuk Pelanggan
        const { Notifikasi } = require('../models');
        await Notifikasi.create({
            ID_PELANGGAN: aduan.ID_PELANGGAN,
            RELATED_ID: newTicket.ID_TICKET,
            JUDUL: 'Jadwal Perbaikan Layanan',
            DESKRIPSI_PESAN: `Jadwal perbaikan untuk aduan "${aduan.SUBJEK}" telah ditetapkan pada ${tanggal} pukul ${waktu}.`,
            KATEGORI_NOTIFIKASI: 'jadwal perbaikan',
            TANGGAL_NOTIFIKASI: new Date()
        });

        res.status(201).json({ message: "E-ticket berhasil dibuat", ticket: newTicket });
    } catch (err) {
        console.error("Create Ticket Error:", err);
        res.status(500).json({ message: "Terjadi kesalahan", error: err.message });
    }
});

// ============================================
// GET /api/dashboard/teknisi/stats
// Ambil statistik tugas teknisi (Selesai vs Belum ditangani)
// ============================================
router.get('/teknisi/stats', verifyToken, async (req, res) => {
    try {
        const idPegawai = req.user.id_asli; // diambil dari JWT payload
        const { Ticket } = require('../models');

        const selesai = await Ticket.count({
            where: {
                ID_PEGAWAI: idPegawai,
                TICKET_STATUS: 'selesai'
            }
        });

        const belumDitangani = await Ticket.count({
            where: {
                ID_PEGAWAI: idPegawai,
                TICKET_STATUS: ['open', 'on progress']
            }
        });

        res.json({
            selesai,
            belumDitangani
        });
    } catch (err) {
        console.error("Teknisi Stats Error:", err);
        res.status(500).json({ message: "Terjadi kesalahan", error: err.message });
    }
});

// ============================================
// GET /api/dashboard/teknisi/penugasan
// Ambil daftar penugasan aktif (open, on progress)
// ============================================
router.get('/teknisi/penugasan', verifyToken, async (req, res) => {
    try {
        const idPegawai = req.user.id_asli;
        const { Ticket, Aduan, Pelanggan } = require('../models');

        const penugasan = await Ticket.findAll({
            where: {
                ID_PEGAWAI: idPegawai,
                TICKET_STATUS: ['open', 'on progress']
            },
            include: [{
                model: Aduan,
                include: [{
                    model: Pelanggan,
                    attributes: ['NAMA_PELANGGAN', 'ALAMAT']
                }]
            }],
            order: [['SCHEDULE_DATE', 'ASC'], ['SCHEDULE_TIME', 'ASC']]
        });

        const formatted = penugasan.map(t => ({
            id_ticket: t.ID_TICKET,
            e_ticket: `SGTKT${String(t.ID_TICKET).padStart(3, '0')}`,
            nama: t.Aduan?.Pelanggan?.NAMA_PELANGGAN || '-',
            alamat: t.Aduan?.Pelanggan?.ALAMAT || '-',
            tanggal: new Date(t.SCHEDULE_DATE).toLocaleDateString('id-ID', {day: '2-digit', month: '2-digit', year: '2-digit'}).replace(/\//g, '-'),
            waktu: t.SCHEDULE_TIME ? t.SCHEDULE_TIME.substring(0, 5) : '-',
            status: t.TICKET_STATUS === 'on progress' ? 'On Progress' : (t.TICKET_STATUS.charAt(0).toUpperCase() + t.TICKET_STATUS.slice(1)),
            raw_status: t.TICKET_STATUS,
            id_aduan: t.ID_ADUAN,
            deskripsi: t.Aduan?.DESKRIPSI_MASALAH || '',
            kategori: t.Aduan?.SUBJEK || 'Jaringan Lambat'
        }));

        res.json(formatted);
    } catch (err) {
        console.error("Penugasan Error:", err);
        res.status(500).json({ message: "Terjadi kesalahan", error: err.message });
    }
});

// ============================================
// PUT /api/dashboard/teknisi/penugasan/:id
// Update status penugasan
// ============================================
router.put('/teknisi/penugasan/:id', verifyToken, async (req, res) => {
    try {
        const idTicket = req.params.id;
        const { status } = req.body;
        const { Ticket, Aduan } = require('../models');

        const ticket = await Ticket.findByPk(idTicket);
        if (!ticket) return res.status(404).json({ message: "Ticket tidak ditemukan" });

        await ticket.update({ TICKET_STATUS: status });

        // Jika selesai, update juga aduan menjadi selesai
        if (status === 'selesai') {
            const aduan = await Aduan.findByPk(ticket.ID_ADUAN);
            if (aduan) {
                await aduan.update({ STATUS_ADUAN: 'selesai' });

                // Buat Notifikasi
                const { Notifikasi } = require('../models');
                await Notifikasi.create({
                    ID_PELANGGAN: aduan.ID_PELANGGAN,
                    JUDUL: 'Aduan Telah Selesai',
                    DESKRIPSI_PESAN: `Teknisi telah menyelesaikan perbaikan untuk tiket ${String(ticket.ID_TICKET).padStart(3, '0')}. Silakan cek layanan Anda.`,
                    KATEGORI_NOTIFIKASI: 'aduan',
                    TANGGAL_NOTIFIKASI: new Date()
                });
            }
        }

        res.json({ message: "Status berhasil diupdate" });
    } catch (err) {
        console.error("Update Penugasan Error:", err);
        res.status(500).json({ message: "Terjadi kesalahan", error: err.message });
    }
});

// ============================================
// GET /api/dashboard/teknisi/riwayat
// Ambil daftar penugasan selesai
// ============================================
router.get('/teknisi/riwayat', verifyToken, async (req, res) => {
    try {
        const idPegawai = req.user.id_asli;
        const { Ticket, Aduan, Pelanggan } = require('../models');

        const riwayat = await Ticket.findAll({
            where: {
                ID_PEGAWAI: idPegawai,
                TICKET_STATUS: 'selesai'
            },
            include: [{
                model: Aduan,
                include: [{
                    model: Pelanggan,
                    attributes: ['NAMA_PELANGGAN', 'ALAMAT']
                }]
            }],
            order: [['SCHEDULE_DATE', 'DESC'], ['SCHEDULE_TIME', 'DESC']]
        });

        const formatted = riwayat.map(t => ({
            id_ticket: t.ID_TICKET,
            e_ticket: `SGTKT${String(t.ID_TICKET).padStart(3, '0')}`,
            nama: t.Aduan?.Pelanggan?.NAMA_PELANGGAN || '-',
            alamat: t.Aduan?.Pelanggan?.ALAMAT || '-',
            tanggal: new Date(t.SCHEDULE_DATE).toLocaleDateString('id-ID', {day: '2-digit', month: '2-digit', year: '2-digit'}).replace(/\//g, '-'),
            raw_tanggal: t.SCHEDULE_DATE,
            waktu: t.SCHEDULE_TIME ? t.SCHEDULE_TIME.substring(0, 5) : '-',
            status: 'Selesai',
            kategori: t.Aduan?.SUBJEK || 'Jaringan Lambat' // Subjek aduan sebagai kategori
        }));

        res.json(formatted);
    } catch (err) {
        console.error("Riwayat Error:", err);
        res.status(500).json({ message: "Terjadi kesalahan", error: err.message });
    }
});

// ============================================
// GET /api/dashboard/pelanggan/tickets
// Ambil daftar ticket milik pelanggan (untuk form reschedule)
// ============================================
router.get('/pelanggan/tickets', verifyToken, async (req, res) => {
    try {
        const idPelanggan = req.user.id;
        const { Ticket, Aduan, Pelanggan, Pegawai } = require('../models');

        // Ambil semua aduan milik pelanggan
        const aduanIds = await Aduan.findAll({
            where: { ID_PELANGGAN: idPelanggan },
            attributes: ['ID_ADUAN']
        });

        const ids = aduanIds.map(a => a.ID_ADUAN);

        if (ids.length === 0) {
            return res.json([]);
        }

        const { Op } = require('sequelize');

        // Ambil ticket yang terkait aduan pelanggan & masih aktif (open/on progress)
        const tickets = await Ticket.findAll({
            where: {
                ID_ADUAN: { [Op.in]: ids },
                TICKET_STATUS: ['open', 'on progress']
            },
            include: [
                {
                    model: Aduan,
                    attributes: ['SUBJEK', 'DESKRIPSI_MASALAH']
                },
                {
                    model: Pegawai,
                    attributes: ['ID_PEGAWAI', 'NAMA']
                }
            ],
            order: [['SCHEDULE_DATE', 'DESC']]
        });

        // Ambil nama pelanggan
        const pelanggan = await Pelanggan.findByPk(idPelanggan, {
            attributes: ['NAMA_PELANGGAN', 'KODE_PELANGGAN']
        });

        const formatted = tickets.map(t => ({
            id_ticket: t.ID_TICKET,
            e_ticket: `SGTKT${String(t.ID_TICKET).padStart(3, '0')}`,
            kategori: t.Aduan?.SUBJEK || '-',
            tanggal_lama: t.SCHEDULE_DATE,
            jam_lama: t.SCHEDULE_TIME ? t.SCHEDULE_TIME.substring(0, 5) : '-',
            status: t.TICKET_STATUS,
            id_pegawai: t.Pegawai?.ID_PEGAWAI || null,
            nama_teknisi: t.Pegawai?.NAMA || '-',
            nama_pelanggan: pelanggan ? pelanggan.NAMA_PELANGGAN : '-',
            kode_pelanggan: pelanggan ? pelanggan.KODE_PELANGGAN : '-'
        }));

        res.json(formatted);
    } catch (err) {
        console.error("Pelanggan Tickets Error:", err);
        res.status(500).json({ message: "Terjadi kesalahan", error: err.message });
    }
});

// ============================================
// POST /api/dashboard/pelanggan/reschedule
// Ajukan penjadwalan ulang oleh pelanggan
// ============================================
router.post('/pelanggan/reschedule', verifyToken, async (req, res) => {
    try {
        const { id_ticket, tanggal_baru, jam_baru, deskripsi } = req.body;
        const { Ticket, Reschedule } = require('../models');

        if (!id_ticket || !tanggal_baru || !jam_baru || !deskripsi) {
            return res.status(400).json({ message: 'Semua field wajib diisi.' });
        }

        // Cari ticket
        const ticket = await Ticket.findByPk(id_ticket);
        if (!ticket) {
            return res.status(404).json({ message: 'Ticket tidak ditemukan.' });
        }

        // Cek limit reschedule 1x
        const existingReschedule = await Reschedule.findOne({
            where: {
                ID_TICKET: id_ticket,
                STATUS_RESCHEDULE: ['pending', 'disetujui']
            }
        });

        if (existingReschedule) {
            return res.status(400).json({ message: "Batas penjadwalan ulang untuk tiket ini telah tercapai (maksimal 1x)." });
        }

        // Buat reschedule record
        const reschedule = await Reschedule.create({
            ID_PEGAWAI: ticket.ID_PEGAWAI,
            ID_TICKET: id_ticket,
            TANGGAL_LAMA: ticket.SCHEDULE_DATE,
            TANGGAL_BARU: tanggal_baru,
            JAM_LAMA: ticket.SCHEDULE_TIME,
            JAM_BARU: jam_baru,
            DESKRIPSI: deskripsi,
            STATUS_RESCHEDULE: 'pending'
        });

        // Buat Notifikasi
        const { Notifikasi } = require('../models');
        await Notifikasi.create({
            ID_PELANGGAN: req.user.id,
            JUDUL: 'Penjadwalan Ulang Berhasil Diajukan',
            DESKRIPSI_PESAN: `Permintaan penjadwalan ulang untuk tiket SGTKT${String(id_ticket).padStart(3, '0')} telah diajukan ke tanggal ${tanggal_baru}.`,
            KATEGORI_NOTIFIKASI: 'reschedule perbaikan',
            TANGGAL_NOTIFIKASI: new Date()
        });

        res.status(201).json({
            message: 'Pengajuan penjadwalan ulang berhasil.',
            reschedule
        });
    } catch (err) {
        console.error("Reschedule Submit Error:", err);
        res.status(500).json({ message: "Terjadi kesalahan", error: err.message });
    }
});

// ============================================
// GET /api/dashboard/admin/layanan/reschedule
// Data reschedule untuk admin
// ============================================
router.get('/admin/layanan/reschedule', verifyToken, async (req, res) => {
    try {
        const { Reschedule, Ticket, Aduan, Pelanggan, Pegawai } = require('../models');

        const dataReschedule = await Reschedule.findAll({
            include: [
                {
                    model: Ticket,
                    include: [
                        {
                            model: Aduan,
                            include: [{
                                model: Pelanggan,
                                attributes: ['KODE_PELANGGAN', 'NAMA_PELANGGAN']
                            }]
                        },
                        {
                            model: Pegawai,
                            attributes: ['NAMA']
                        }
                    ]
                }
            ],
            order: [['ID_RESCHEDULE', 'DESC']]
        });

        const totalPending = dataReschedule.filter(r => r.STATUS_RESCHEDULE === 'pending').length;
        const totalDisetujui = dataReschedule.filter(r => r.STATUS_RESCHEDULE === 'disetujui').length;
        const totalDitolak = dataReschedule.filter(r => r.STATUS_RESCHEDULE === 'ditolak').length;

        const formattedData = dataReschedule.map((item, index) => ({
            id_reschedule: item.ID_RESCHEDULE,
            id_ticket: item.ID_TICKET,
            id_aduan: item.Ticket?.ID_ADUAN || null,
            noReschedule: `RS${String(index + 1).padStart(2, '0')}`,
            e_ticket: item.Ticket ? `SGTKT${String(item.Ticket.ID_TICKET).padStart(3, '0')}` : '-',
            userId: item.Ticket?.Aduan?.Pelanggan?.KODE_PELANGGAN || '-',
            nama: item.Ticket?.Aduan?.Pelanggan?.NAMA_PELANGGAN || '-',
            kategori: item.Ticket?.Aduan?.SUBJEK || '-',
            teknisi: item.Ticket?.Pegawai?.NAMA || '-',
            tanggal_lama: item.TANGGAL_LAMA ? new Date(item.TANGGAL_LAMA).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: '2-digit' }).replace(/\//g, '-') : '-',
            jam_lama: item.JAM_LAMA ? item.JAM_LAMA.substring(0, 5) : '-',
            tanggal_baru: item.TANGGAL_BARU, // Keep raw date for form
            jam_baru: item.JAM_BARU ? item.JAM_BARU.substring(0, 5) : '-',
            deskripsi: item.DESKRIPSI || '-',
            status: item.STATUS_RESCHEDULE
        }));

        res.json({
            stats: {
                total: dataReschedule.length,
                pending: totalPending,
                disetujui: totalDisetujui,
                ditolak: totalDitolak
            },
            data: formattedData
        });
    } catch (err) {
        console.error("Admin Reschedule Error:", err);
        res.status(500).json({ message: "Terjadi kesalahan", error: err.message });
    }
});

// ============================================
// POST /api/dashboard/admin/layanan/reschedule/update
// Admin setujui / tolak reschedule
// ============================================
router.post('/admin/layanan/reschedule/update', verifyToken, async (req, res) => {
    try {
        const { id_reschedule, status } = req.body;
        const { Reschedule, Ticket } = require('../models');

        const reschedule = await Reschedule.findByPk(id_reschedule);
        if (!reschedule) {
            return res.status(404).json({ message: 'Data reschedule tidak ditemukan.' });
        }

        await reschedule.update({ STATUS_RESCHEDULE: status });

        // Jika disetujui, update jadwal ticket
        if (status === 'disetujui' && reschedule.ID_TICKET) {
            const ticket = await Ticket.findByPk(reschedule.ID_TICKET);
            if (ticket) {
                await ticket.update({
                    SCHEDULE_DATE: reschedule.TANGGAL_BARU,
                    SCHEDULE_TIME: reschedule.JAM_BARU
                });

                // Cari aduan untuk dapat ID_PELANGGAN
                const { Aduan, Notifikasi } = require('../models');
                const aduan = await Aduan.findByPk(ticket.ID_ADUAN);
                
                if (aduan) {
                    // Notifikasi Penjadwalan Ulang Dikonfirmasi
                    await Notifikasi.create({
                        ID_PELANGGAN: aduan.ID_PELANGGAN,
                        JUDUL: 'Penjadwalan Ulang Dikonfirmasi',
                        DESKRIPSI_PESAN: `Admin telah menyetujui permintaan penjadwalan ulang Anda untuk tiket SGTKT${String(ticket.ID_TICKET).padStart(3, '0')}.`,
                        KATEGORI_NOTIFIKASI: 'reschedule perbaikan',
                        TANGGAL_NOTIFIKASI: new Date()
                    });

                    // Notifikasi Jadwal Terbaru
                    await Notifikasi.create({
                        ID_PELANGGAN: aduan.ID_PELANGGAN,
                        JUDUL: 'Jadwal Perbaikan Terbaru',
                        DESKRIPSI_PESAN: `Jadwal perbaikan terbaru Anda adalah tanggal ${reschedule.TANGGAL_BARU} pukul ${reschedule.JAM_BARU.substring(0, 5)}.`,
                        KATEGORI_NOTIFIKASI: 'jadwal perbaikan',
                        TANGGAL_NOTIFIKASI: new Date()
                    });
                }
            }
        }

        res.json({ message: `Reschedule berhasil ${status === 'disetujui' ? 'disetujui' : 'ditolak'}.` });
    } catch (err) {
        console.error("Update Reschedule Error:", err);
        res.status(500).json({ message: "Terjadi kesalahan", error: err.message });
    }
});


// ============================================
// GET /api/dashboard/pelanggan/ticket-detail/:id
// Ambil detail ticket untuk modal konfirmasi
// ============================================
router.get('/pelanggan/ticket-detail/:id', verifyToken, async (req, res) => {
    try {
        const { Ticket, Aduan, Pelanggan, Pegawai } = require('../models');
        const ticket = await Ticket.findByPk(req.params.id, {
            include: [
                {
                    model: Aduan,
                    include: [{ model: Pelanggan }]
                },
                { model: Pegawai }
            ]
        });

        if (!ticket) return res.status(404).json({ message: "Ticket tidak ditemukan" });

        const formatted = {
            id_ticket: ticket.ID_TICKET,
            userId: ticket.Aduan?.Pelanggan?.KODE_PELANGGAN || '-',
            nama: ticket.Aduan?.Pelanggan?.NAMA_PELANGGAN || '-',
            telepon: ticket.Aduan?.Pelanggan?.NO_HP || '-',
            alamat: ticket.Aduan?.Pelanggan?.ALAMAT || '-',
            nama_teknisi: ticket.Pegawai?.NAMA || '-',
            tanggal: ticket.SCHEDULE_DATE,
            waktu: ticket.SCHEDULE_TIME ? ticket.SCHEDULE_TIME.substring(0, 5) : '-',
            is_confirmed: ticket.IS_CONFIRMED
        };

        res.json(formatted);
    } catch (err) {
        console.error("Ticket Detail Error:", err);
        res.status(500).json({ message: "Terjadi kesalahan", error: err.message });
    }
});

// ============================================
// POST /api/dashboard/pelanggan/ticket-confirm
// Pelanggan menyetujui jadwal perbaikan
// ============================================
router.post('/pelanggan/ticket-confirm', verifyToken, async (req, res) => {
    try {
        const { id_ticket } = req.body;
        const { Ticket } = require('../models');

        const ticket = await Ticket.findByPk(id_ticket);
        if (!ticket) return res.status(404).json({ message: "Ticket tidak ditemukan." });

        await ticket.update({ IS_CONFIRMED: true });

        res.json({ message: "Jadwal berhasil dikonfirmasi." });
    } catch (err) {
        console.error("Ticket Confirm Error:", err);
        res.status(500).json({ message: "Terjadi kesalahan", error: err.message });
    }
});


// ============================================
// PUT /api/dashboard/admin/layanan/eticketing/:id
// Update detail ticket (untuk reschedule approval flow)
// ============================================
router.put('/admin/layanan/eticketing/:id', verifyToken, async (req, res) => {
    try {
        const { id_pegawai, tanggal, waktu, prioritas, wilayah, deskripsi } = req.body;
        const { Ticket } = require('../models');

        const ticket = await Ticket.findByPk(req.params.id);
        if (!ticket) return res.status(404).json({ message: "Ticket tidak ditemukan" });

        // Format notes
        const notes = `Prioritas: ${prioritas}\nWilayah: ${wilayah}\nDeskripsi Penanganan: ${deskripsi}`;

        await ticket.update({
            ID_PEGAWAI: id_pegawai,
            SCHEDULE_DATE: tanggal,
            SCHEDULE_TIME: waktu,
            NOTES: notes
        });

        res.json({ message: "E-ticket berhasil diperbarui" });
    } catch (err) {
        console.error("Update Ticket Error:", err);
        res.status(500).json({ message: "Terjadi kesalahan", error: err.message });
    }
});

// ============================================
// GET /api/dashboard/pelanggan/tagihan-aktif
// Mendapatkan tagihan aktif dan melakukan auto-generate jika diperlukan
// ============================================
router.get('/pelanggan/tagihan-aktif', verifyToken, async (req, res) => {
    try {
        const pelangganId = req.user.id;
        const { Pelanggan, Paket, Tagihan } = require('../models');
        const { Op } = require('sequelize');

        // 1. Ambil data pelanggan lengkap beserta paketnya
        const pelanggan = await Pelanggan.findByPk(pelangganId, {
            include: [{ model: Paket }]
        });

        if (!pelanggan) {
            return res.status(404).json({ message: "Pelanggan tidak ditemukan." });
        }

        // Jika status pelanggan bukan aktif atau tidak punya paket, dia tidak punya tagihan bulanan berjalan
        if (pelanggan.STATUS_PELANGGAN !== 'aktif' || !pelanggan.ID_PAKET) {
            return res.json({ 
                hasBill: false, 
                message: "Anda tidak memiliki tagihan aktif saat ini karena status belum aktif atau belum berlangganan produk.",
                pelanggan: {
                    id_pelanggan: pelanggan.ID_PELANGGAN,
                    kode_pelanggan: pelanggan.KODE_PELANGGAN,
                    nama_pelanggan: pelanggan.NAMA_PELANGGAN,
                    layanan: "-"
                }
            });
        }

        // 2. SISTEM AUTO GENERATE TAGIHAN PELANGGAN
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const todayYear = today.getFullYear();
        const todayMonth = today.getMonth(); // 0-indexed

        const aktivasi = new Date(pelanggan.TANGGAL_AKTIVASI);
        const tanggalAktivasi = aktivasi.getDate();

        // Cari tagihan dari 2 bulan lalu hingga 1 bulan ke depan
        const targetCycles = [];
        for (let offset = -2; offset <= 1; offset++) {
            const cycleDate = new Date(todayYear, todayMonth + offset, 1);
            targetCycles.push({
                year: cycleDate.getFullYear(),
                month: cycleDate.getMonth()
            });
        }

        for (const cycle of targetCycles) {
            const anniversaryDate = new Date(cycle.year, cycle.month, tanggalAktivasi);
            
            // Jatuh tempo adalah 3 hari sebelum anniversary
            const jatuhTempo = new Date(anniversaryDate);
            jatuhTempo.setDate(jatuhTempo.getDate() - 3);
            jatuhTempo.setHours(0, 0, 0, 0);

            // Pembayaran diperbolehkan mulai 10 hari sebelum jatuh tempo
            // Ini juga waktu di mana sistem auto-generate tagihan baru!
            const triggerDate = new Date(jatuhTempo);
            triggerDate.setDate(triggerDate.getDate() - 10);
            triggerDate.setHours(0, 0, 0, 0);

            // Skip jika siklus ini terjadi sebelum atau sama dengan tanggal aktivasi asli
            if (anniversaryDate <= aktivasi) {
                continue;
            }

            // Jika tanggal hari ini sudah melewati atau sama dengan triggerDate (10 hari sebelum jatuh tempo),
            // maka tagihan baru tersebut wajib di-generate secara otomatis oleh sistem.
            if (today >= triggerDate) {
                const billingMonth = anniversaryDate.getMonth() + 1; // 1-indexed
                const billingYear = anniversaryDate.getFullYear();

                const exists = await Tagihan.findOne({
                    where: {
                        ID_PELANGGAN: pelanggan.ID_PELANGGAN,
                        BULAN_TAGIHAN: billingMonth,
                        TAHUN_TAGIHAN: billingYear
                    }
                });

                if (!exists) {
                    const nomorTagihan = Math.floor(100000 + Math.random() * 900000);
                    await Tagihan.create({
                        ID_PELANGGAN: pelanggan.ID_PELANGGAN,
                        JUMLAH_BAYAR: pelanggan.Paket ? pelanggan.Paket.HARGA_PAKET : 0,
                        JATUH_TEMPO: jatuhTempo,
                        STATUS_PEMBAYARAN: 'menunggu_verifikasi',
                        BULAN_TAGIHAN: billingMonth,
                        TAHUN_TAGIHAN: billingYear,
                        NOMOR_TAGIHAN: nomorTagihan,
                        ID_TRANSAKSI: `TAG-${pelanggan.ID_PELANGGAN}-${billingMonth}-${billingYear}`
                    });
                }
            }
        }

        // 3. AMBIL TAGIHAN TERBARU UNTUK DITAMPILKAN
        // Ambil semua tagihan diurutkan dari yang terbaru
        const tagihanList = await Tagihan.findAll({
            where: { ID_PELANGGAN: pelangganId },
            order: [
                ['TAHUN_TAGIHAN', 'DESC'],
                ['BULAN_TAGIHAN', 'DESC']
            ]
        });

        if (tagihanList.length === 0) {
            return res.json({ 
                hasBill: false, 
                message: "Belum ada tagihan yang dibuat untuk akun Anda.",
                pelanggan: {
                    id_pelanggan: pelanggan.ID_PELANGGAN,
                    kode_pelanggan: pelanggan.KODE_PELANGGAN,
                    nama_pelanggan: pelanggan.NAMA_PELANGGAN,
                    layanan: pelanggan.Paket ? pelanggan.Paket.NAMA_PAKET : "-"
                }
            });
        }

        // Prioritaskan mengambil tagihan yang belum terbayar (status 'menunggu_verifikasi')
        let activeBill = tagihanList.find(t => t.STATUS_PEMBAYARAN !== 'berhasil');

        // Jika semua tagihan sudah terbayar, ambil tagihan yang paling baru dibayar
        if (!activeBill) {
            activeBill = tagihanList[0];
        }

        res.json({
            hasBill: true,
            bill: {
                id_tagihan: activeBill.ID_TAGIHAN,
                nomor_tagihan: activeBill.NOMOR_TAGIHAN,
                jumlah_bayar: activeBill.JUMLAH_BAYAR,
                status_pembayaran: activeBill.STATUS_PEMBAYARAN, // 'berhasil' atau 'menunggu_verifikasi'
                jatuh_tempo: activeBill.JATUH_TEMPO,
                bulan_tagihan: activeBill.BULAN_TAGIHAN,
                tahun_tagihan: activeBill.TAHUN_TAGIHAN,
                id_transaksi: activeBill.ID_TRANSAKSI,
                payment_url: activeBill.PAYMENT_URL
            },
            pelanggan: {
                id_pelanggan: pelanggan.ID_PELANGGAN,
                kode_pelanggan: pelanggan.KODE_PELANGGAN,
                nama_pelanggan: pelanggan.NAMA_PELANGGAN,
                layanan: pelanggan.Paket ? pelanggan.Paket.NAMA_PAKET : "-"
            }
        });

    } catch (err) {
        console.error("Fetch Tagihan Aktif Error:", err);
        res.status(500).json({ message: "Terjadi kesalahan saat mengambil data tagihan.", error: err.message });
    }
});

// ============================================
// GET /api/dashboard/admin/tagihan
// Mendapatkan rangkuman manajemen tagihan dan list pelanggan untuk Admin
// ============================================
router.get('/admin/tagihan', verifyToken, async (req, res) => {
    try {
        const { Pelanggan, Paket, Tagihan } = require('../models');
        const { Op } = require('sequelize');

        const today = new Date();
        today.setHours(0,0,0,0);

        // 1. Ambil semua pelanggan aktif beserta Paket dan Tagihan mereka
        const pelangganList = await Pelanggan.findAll({
            where: { STATUS_PELANGGAN: 'aktif' },
            include: [
                { model: Paket },
                { model: Tagihan }
            ]
        });

        // 2. Hitung statistik yang diperlukan
        // total tagihan = jumlah tagihan pelanggan yang sudah bisa dibayar
        const totalTagihan = await Tagihan.count();

        // tagihan pending = tagihan yang sudah memasuki waktu jatuh tempo dan belum dibayar
        const tagihanPending = await Tagihan.count({
            where: {
                STATUS_PEMBAYARAN: { [Op.ne]: 'berhasil' },
                JATUH_TEMPO: { [Op.lte]: today }
            }
        });

        // tagihan terbayar = jumlah tagihan yang sudah sukses terbayar
        const tagihanTerbayar = await Tagihan.count({
            where: { STATUS_PEMBAYARAN: 'berhasil' }
        });

        // 3. Format data pelanggan untuk tabel
        const formattedCustomers = pelangganList.map(p => {
            const tagihans = p.Tagihans || [];
            
            // Cari tagihan yang belum dibayar (status_pembayaran != 'berhasil')
            const unpaidBills = tagihans.filter(t => t.STATUS_PEMBAYARAN !== 'berhasil');
            
            // Tentukan status tampilan di UI
            let displayStatus = 'AKTIF';
            if (p.STATUS_LAYANAN === 'blokir') {
                displayStatus = 'BLOCKIR';
            } else {
                // Cek apakah ada tagihan belum dibayar yang sudah lewat jatuh tempo
                const hasOverdue = unpaidBills.some(t => new Date(t.JATUH_TEMPO) <= today);
                if (hasOverdue) {
                    displayStatus = 'JATUH TEMPO';
                }
            }

            // Tentukan tanggal jatuh tempo terdekat atau tanggal jatuh tempo terakhir
            let displayJatuhTempo = '-';
            if (tagihans.length > 0) {
                // Urutkan tagihan berdasarkan jatuh tempo terbaru
                const sortedTagihans = [...tagihans].sort((a, b) => new Date(b.JATUH_TEMPO) - new Date(a.JATUH_TEMPO));
                const latestBill = sortedTagihans[0];
                if (latestBill && latestBill.JATUH_TEMPO) {
                    displayJatuhTempo = new Date(latestBill.JATUH_TEMPO).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                    });
                }
            }

            return {
                id_pelanggan: p.ID_PELANGGAN,
                userId: p.KODE_PELANGGAN,
                nama: p.NAMA_PELANGGAN,
                jenisPaket: p.Paket ? p.Paket.NAMA_PAKET : '-',
                status: displayStatus,
                statusLayanan: p.STATUS_LAYANAN || 'aktif',
                jatuhTempo: displayJatuhTempo
            };
        });

        res.json({
            stats: {
                totalTagihan,
                tagihanPending,
                tagihanTerbayar
            },
            customers: formattedCustomers
        });

    } catch (err) {
        console.error("Admin Fetch Tagihan Error:", err);
        res.status(500).json({ message: "Terjadi kesalahan saat memuat data manajemen tagihan.", error: err.message });
    }
});

// ============================================
// PUT /api/dashboard/admin/tagihan/status/:id
// Mengubah status layanan pelanggan (aktif / blokir)
// ============================================
router.put('/admin/tagihan/status/:id', verifyToken, async (req, res) => {
    try {
        const { status } = req.body;
        const { Pelanggan } = require('../models');

        if (!['aktif', 'blokir'].includes(status)) {
            return res.status(400).json({ message: "Status tidak valid. Harus 'aktif' atau 'blokir'." });
        }

        const pelanggan = await Pelanggan.findByPk(req.params.id);
        if (!pelanggan) {
            return res.status(404).json({ message: "Pelanggan tidak ditemukan." });
        }

        await pelanggan.update({ STATUS_LAYANAN: status });

        // Tambah notifikasi untuk pelanggan tentang perubahan layanan
        const { Notifikasi } = require('../models');
        const judul = status === 'aktif' ? 'Layanan Diaktifkan Kembali' : 'Layanan Diblokir';
        const pesan = status === 'aktif' 
            ? 'Layanan internet Anda telah diaktifkan kembali. Terima kasih atas kerja samanya!'
            : 'Layanan internet Anda sementara dinonaktifkan (diblokir) karena melewati masa jatuh tempo pembayaran. Harap segera lakukan pembayaran.';
        
        await Notifikasi.create({
            ID_PELANGGAN: pelanggan.ID_PELANGGAN,
            JUDUL: judul,
            DESKRIPSI_PESAN: pesan,
            KATEGORI_NOTIFIKASI: status === 'aktif' ? 'pembayaran' : 'jatuh tempo',
            TANGGAL_NOTIFIKASI: new Date()
        });

        res.json({ message: `Status layanan berhasil diubah menjadi ${status}.` });

    } catch (err) {
        console.error("Change Status Layanan Error:", err);
        res.status(500).json({ message: "Terjadi kesalahan saat mengubah status layanan.", error: err.message });
    }
});

module.exports = router;