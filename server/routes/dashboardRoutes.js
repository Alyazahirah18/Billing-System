const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/authMiddleware');

// Import models dengan aman
let Tagihan, Pelanggan, Paket, Pegawai, LogAktivitas;

try {
    const models = require('../models');
    Tagihan = models.Tagihan;
    Pelanggan = models.Pelanggan;
    Paket = models.Paket;
    Pegawai = models.Pegawai;
    LogAktivitas = models.LogAktivitas;
    console.log('Models loaded successfully in dashboardRoutes');
} catch (err) {
    console.error('Error loading models in dashboardRoutes:', err.message);
}

// Helper untuk mencatat log aktivitas staff
const logStaffActivity = async (req, activity, content) => {
    try {
        if (!LogAktivitas || !Pegawai) return;

        // pengecualian owner
        if (req.user && req.user.role === 'owner') {
            return;
        }

        // Ambil ID pegawai asli dari token
        const id_pegawai = req.user ? req.user.id_asli : null;
        let username = req.user ? req.user.nama : 'System';

        if (id_pegawai) {
            const peg = await Pegawai.findByPk(id_pegawai);
            if (peg && peg.USERNAME) {
                username = peg.USERNAME;
            }
        }

        await LogAktivitas.create({
            id_pegawai: id_pegawai,
            USERNAME: username,
            activity: activity,
            content: content,
            datetime: new Date()
        });
        console.log(`[LOG AKTIVITAS] Berhasil disimpan: [${username}] ${activity} - ${content}`);
    } catch (e) {
        console.error('Gagal mencatat log aktivitas staff:', e.message);
    }
};

// ============================================
// GET /api/dashboard/summary
// Data untuk Dashboard utama
// ============================================
router.get('/summary', verifyToken, async (req, res) => {
    try {
        console.log('Dashboard summary requested for user:', req.user.id);

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

        // 2. Ambil data paket
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

        // 1.5 PEMBERSIHAN TAGIHAN PREMATUR
        try {
            const { Op } = require('sequelize');
            const prematurTagihans = await Tagihan.findAll({
                where: {
                    ID_PELANGGAN: id_pelanggan,
                    STATUS_PEMBAYARAN: { [Op.ne]: 'berhasil' },
                    ID_TRANSAKSI: { [Op.like]: 'TAG-%' }
                }
            });

            const todayObj = new Date();
            const todayUTC = Date.UTC(todayObj.getFullYear(), todayObj.getMonth(), todayObj.getDate());
            const todayDate = new Date(todayUTC);

            for (const t of prematurTagihans) {
                const jatuhTempoDate = new Date(t.JATUH_TEMPO);
                const triggerDate = new Date(jatuhTempoDate);
                triggerDate.setUTCDate(triggerDate.getUTCDate() - 10);
                triggerDate.setHours(0, 0, 0, 0);

                if (todayDate < triggerDate) {
                    console.log(`Menghapus tagihan prematur ${t.ID_TRANSAKSI} karena belum memasuki H-10.`);
                    await t.destroy();
                }
            }
        } catch (purgeErr) {
            console.error("Gagal membersihkan tagihan prematur:", purgeErr);
        }

        // 3. Tentukan STATUS LAYANAN 
        let statusLayanan = 'CALON';
        if (pelanggan.ID_PAKET && pelanggan.STATUS_PELANGGAN === 'aktif') {
            statusLayanan = 'AKTIF';

            // Cek apakah ada tagihan reguler belum dibayar
            try {
                const { Op } = require('sequelize');
                const latestUnpaidTagihan = await Tagihan.findOne({
                    where: {
                        ID_PELANGGAN: id_pelanggan,
                        STATUS_PEMBAYARAN: { [Op.ne]: 'berhasil' },
                        ID_TRANSAKSI: { [Op.notLike]: 'UPG-%' }
                    },
                    order: [['JATUH_TEMPO', 'ASC']] // Cari tagihan yang belum dibayar
                });

                if (latestUnpaidTagihan) {
                    const todayCheck = new Date();
                    todayCheck.setHours(0, 0, 0, 0);

                    const billDueDate = new Date(latestUnpaidTagihan.JATUH_TEMPO);
                    billDueDate.setHours(0, 0, 0, 0);

                    // Hitung perbedaan hari
                    const diffMs = todayCheck.getTime() - billDueDate.getTime();
                    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

                    if (diffDays > 7) {
                        statusLayanan = 'BLOKIR';
                    } else if (diffDays >= -7) {
                        statusLayanan = 'JATUH TEMPO';
                    }
                }
            } catch (e) {
                console.error('Error calculating overdue status for summary:', e);
            }

            // Sync ke kolom STATUS_LAYANAN di database
            if (statusLayanan === 'BLOKIR' && pelanggan.STATUS_LAYANAN !== 'blokir') {
                await pelanggan.update({ STATUS_LAYANAN: 'blokir' });
            } else if ((statusLayanan === 'AKTIF' || statusLayanan === 'JATUH TEMPO') && pelanggan.STATUS_LAYANAN === 'blokir') {
                // Kembalikan ke aktif jika tidak lagi melewati batas blokir
                await pelanggan.update({ STATUS_LAYANAN: 'aktif' });
            }

            // Gunakan nilai dari database sebagai penentu utama
            if (pelanggan.STATUS_LAYANAN === 'blokir') {
                statusLayanan = 'BLOKIR';
            }
        }

        // 4. Tentukan JATUH TEMPO
        let jatuhTempo = '-';
        if (pelanggan.TANGGAL_AKTIVASI && pelanggan.ID_PAKET) {
            try {
                const latestTagihan = await Tagihan.findOne({
                    where: { ID_PELANGGAN: id_pelanggan, ID_TRANSAKSI: { [require('sequelize').Op.notLike]: 'UPG-%' } },
                    order: [['JATUH_TEMPO', 'DESC']] //terbaru
                });

                let targetJatuhTempoDate;
                if (latestTagihan) {
                    targetJatuhTempoDate = new Date(latestTagihan.JATUH_TEMPO);
                    if (latestTagihan.STATUS_PEMBAYARAN === 'berhasil') {
                        targetJatuhTempoDate.setMonth(targetJatuhTempoDate.getMonth() + 1);
                    }
                    if (pelanggan.TANGGAL_AKTIVASI) {
                        targetJatuhTempoDate.setDate(new Date(pelanggan.TANGGAL_AKTIVASI).getUTCDate());
                    }
                } else {
                    const tanggalAktivasi = new Date(pelanggan.TANGGAL_AKTIVASI);
                    targetJatuhTempoDate = new Date(tanggalAktivasi);
                    targetJatuhTempoDate.setMonth(targetJatuhTempoDate.getMonth() + 1);
                    targetJatuhTempoDate.setDate(tanggalAktivasi.getUTCDate());
                }

                targetJatuhTempoDate.setHours(0, 0, 0, 0);
                jatuhTempo = targetJatuhTempoDate.toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    timeZone: 'UTC'
                });
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
                        invoice: `INV/${item.TAHUN_TAGIHAN || '2024'}/${String(item.ID_TAGIHAN).padStart(4, '0')}`,
                        bulan_tagihan: item.BULAN_TAGIHAN,
                        tahun_tagihan: item.TAHUN_TAGIHAN,
                        metode_pembayaran: item.METODE_PEMBAYARAN || 'Midtrans / Online',
                        id_transaksi: item.ID_TRANSAKSI || '-',
                        jatuh_tempo: item.JATUH_TEMPO ? new Date(item.JATUH_TEMPO).toLocaleDateString('id-ID') : '-'
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
            id_paket: pelanggan.ID_PAKET,
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
// GET /api/dashboard/test (deadcode gadipanggil di frontend)
// Endpoint test untuk memastikan bahwa API dashboard dapat diakses
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
// GET /api/dashboard/admin/sidebar-notifications
// Menghitung jumlah notifikasi untuk setiap menu sidebar Admin
// ============================================
router.get('/admin/sidebar-notifications', verifyToken, async (req, res) => {
    try {
        const { Tagihan, Pelanggan, Aduan, UpgradeLayanan, Reschedule, Ticket } = require('../models');
        const { Op } = require('sequelize');

        // 1. Manajemen Tagihan: pelanggan masuk waktu jatuh tempo & melewati jatuh tempo
        const { lastOpenedTagihan } = req.query;
        let tagihanWhere = {
            STATUS_PEMBAYARAN: { [Op.ne]: 'berhasil' },
            JATUH_TEMPO: { [Op.lte]: new Date() }
        };
        if (lastOpenedTagihan && !isNaN(Date.parse(lastOpenedTagihan))) {
            tagihanWhere.JATUH_TEMPO = {
                [Op.between]: [new Date(lastOpenedTagihan), new Date()]
            };
        }

        const tagihanCount = await Tagihan.count({
            distinct: true,
            col: 'ID_PELANGGAN',
            where: tagihanWhere
        });

        // 2. Manajemen Pelanggan: pelanggan baru berstatus calon yang mendaftar/mengajukan data baru
        const { lastOpenedPelanggan } = req.query;
        let pelangganWhere = { STATUS_PELANGGAN: 'calon' };
        if (lastOpenedPelanggan && !isNaN(Date.parse(lastOpenedPelanggan))) {
            pelangganWhere.TANGGAL_AKTIVASI = {
                [Op.gt]: new Date(lastOpenedPelanggan)
            };
        }

        const pelangganCount = await Pelanggan.count({
            where: pelangganWhere
        });

        // 3. Manajemen Layanan: aduan pending, upgrade pending, reschedule pending
        const { lastOpenedLayanan } = req.query;
        let aduanWhere = {
            STATUS_ADUAN: { [Op.ne]: 'selesai' },
            SUBJEK: { [Op.ne]: 'Instalasi Pemasangan' }
        };
        let upgradeWhere = { STATUS_UPGRADE: 'pending' };
        let rescheduleWhere = { STATUS_RESCHEDULE: 'pending' };

        if (lastOpenedLayanan && !isNaN(Date.parse(lastOpenedLayanan))) {
            const lastViewedDate = new Date(lastOpenedLayanan);
            aduanWhere.TANGGAL_ADUAN = { [Op.gt]: lastViewedDate };
            upgradeWhere.TANGGAL_REQUEST = { [Op.gt]: lastViewedDate };
            rescheduleWhere.ID_RESCHEDULE = { [Op.eq]: -1 }; //gaada timestamp
        }

        const aduanCount = await Aduan.count({ where: aduanWhere });

        // Saring pengajuan upgrade yg blm dibayar gamasuk
        const rawUpgrades = await UpgradeLayanan.findAll({ where: upgradeWhere });
        const pendingUpgradeBillsCount = await Tagihan.findAll({
            where: {
                ID_TRANSAKSI: { [Op.like]: 'UPG-%' },
                STATUS_PEMBAYARAN: 'menunggu_verifikasi'
            }
        });
        const pendingUpgradeIds = new Set();
        for (const bill of pendingUpgradeBillsCount) {
            if (bill.ID_TRANSAKSI) {
                const parts = bill.ID_TRANSAKSI.split('-');
                if (parts[1]) {
                    pendingUpgradeIds.add(parseInt(parts[1], 10));
                }
            }
        }
        const filteredUpgrades = rawUpgrades.filter(item => !pendingUpgradeIds.has(item.ID_UPGRADE));
        const upgradeCount = filteredUpgrades.length;

        const rescheduleCount = await Reschedule.count({ where: rescheduleWhere });
        const layananCount = aduanCount + upgradeCount + rescheduleCount;

        // 4. Manajemen E-ticketing
        const { lastOpenedEticketing } = req.query;
        let eticketWhere = { STATUS_ADUAN: 'proses' };
        if (lastOpenedEticketing && !isNaN(Date.parse(lastOpenedEticketing))) {
            eticketWhere.TANGGAL_ADUAN = {
                [Op.gt]: new Date(lastOpenedEticketing)
            };
        }

        const aduanProsesList = await Aduan.findAll({
            where: eticketWhere,
            include: [{ model: Ticket, required: false }]
        });
        const eticketCount = aduanProsesList.filter(item => !item.Ticket).length;

        res.json({
            tagihan: tagihanCount,
            pelanggan: pelangganCount,
            layanan: layananCount,
            eticketing: eticketCount
        });
    } catch (err) {
        console.error("Gagal mengambil notifikasi sidebar:", err);
        res.status(500).json({ message: "Terjadi kesalahan", error: err.message });
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

        const { Op } = require('sequelize');
        const today = new Date();

        // Batas awal bulan berjalan
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        startOfMonth.setHours(0, 0, 0, 0);

        // Batas akhir hari ini
        const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

        // 1. Card Jumlah Pelanggan
        const jumlahPelanggan = await Pelanggan.count({
            where: {
                STATUS_PELANGGAN: 'aktif',

            }
        });

        // 2. Card Jatuh Tempo
        const tagihanJatuhTempo = await Tagihan.findAll({
            attributes: ['ID_PELANGGAN'],
            where: {
                STATUS_PEMBAYARAN: { [Op.ne]: 'berhasil' },
                JATUH_TEMPO: {
                    [Op.between]: [startOfMonth, endOfToday]
                }
            }
        });

        // Hitung pelanggan yang jatuh tempo
        const idPelangganJatuhTempo = [...new Set(tagihanJatuhTempo.map(t => t.ID_PELANGGAN))];
        const jatuhTempo = idPelangganJatuhTempo.length;

        // 3. Card Blokir
        const blokir = await Pelanggan.count({
            where: {
                STATUS_PELANGGAN: 'aktif',
                STATUS_LAYANAN: 'blokir',

            }
        });

        // 4. Card Aktif
        const aktif = await Pelanggan.count({
            where: {
                STATUS_PELANGGAN: 'aktif',
                STATUS_LAYANAN: 'aktif',

            }
        });

        // 5. Pelanggan Terbaru
        const pelangganTerbaruData = await Pelanggan.findAll({
            where: {
                STATUS_PELANGGAN: 'aktif',
                TANGGAL_AKTIVASI: {
                    [Op.between]: [startOfMonth, endOfToday]
                }
            },
            include: [{
                model: Paket,
                attributes: ['NAMA_PAKET']
            }],
            order: [['TANGGAL_AKTIVASI', 'DESC']],

        });

        const pelangganTerbaru = pelangganTerbaruData.map(p => ({
            userId: p.KODE_PELANGGAN,
            nama: p.NAMA_PELANGGAN,
            jenisPaket: p.Paket ? p.Paket.NAMA_PAKET : '-',
            noHandphone: p.NO_HP,
            alamat: p.ALAMAT ? `${p.ALAMAT}${p.ALAMAT_WILAYAH ? `, ${p.ALAMAT_WILAYAH}` : ''}` : '-',
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
        const { Pelanggan, Paket, Aduan, Tagihan, sequelize } = require('../models');
        const { Op } = require('sequelize');

        // 1. Total Pelanggan Aktif
        const totalPelanggan = await Pelanggan.count({
            where: { STATUS_PELANGGAN: 'aktif' }
        });

        // 2. Disconnect 
        const disconnect = await Pelanggan.count({
            where: {
                STATUS_PELANGGAN: 'aktif',
                STATUS_LAYANAN: 'blokir'
            }
        });

        // 3. Total Aduan 
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        startOfMonth.setHours(0, 0, 0, 0);
        const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

        const totalAduan = await Aduan.count({
            where: {
                TANGGAL_ADUAN: {
                    [Op.between]: [startOfMonth, endOfToday]
                },
                SUBJEK: { [Op.ne]: 'Instalasi Pemasangan' }
            }
        });

        // 4. Total Income pada bulan berjalan s/d hari ini
        const incomeResult = await Tagihan.findOne({
            where: {
                STATUS_PEMBAYARAN: 'berhasil',
                TANGGAL_PEMBAYARAN: {
                    [Op.between]: [startOfMonth, endOfToday]
                }
            },
            attributes: [
                [sequelize.fn('SUM', sequelize.col('JUMLAH_BAYAR')), 'totalIncome']
            ],
            raw: true
        });
        const totalIncome = parseFloat(incomeResult?.totalIncome || 0);

        // 5. Ambil data tren pelanggan
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
                totalIncome
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
// GET /api/dashboard/owner/laporan
// Data Laporan untuk Owner (Pelanggan, Pendapatan, Aduan)
// ============================================
router.get('/owner/laporan', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'owner') {
            return res.status(403).json({ message: "Akses ditolak. Hanya untuk Owner." });
        }

        const { jenis, startDate, endDate } = req.query;
        const { Pelanggan, Paket, Tagihan, Aduan, Ticket, Pegawai } = require('../models');
        const { Op } = require('sequelize');

        if (!jenis) {
            return res.status(400).json({ message: "Parameter jenis laporan harus diisi." });
        }

        let data = [];
        let dateFilter = {};

        if (startDate && endDate) {
            dateFilter = {
                [Op.between]: [new Date(`${startDate}T00:00:00.000Z`), new Date(`${endDate}T23:59:59.999Z`)]
            };
        }

        if (jenis === 'pelanggan') {
            const queryOptions = {
                include: [{ model: Paket, attributes: ['NAMA_PAKET', 'HARGA_PAKET'] }],
                order: [['TANGGAL_AKTIVASI', 'DESC']]
            };

            if (startDate && endDate) {
                queryOptions.where = {
                    TANGGAL_AKTIVASI: dateFilter,
                    STATUS_PELANGGAN: 'aktif'
                };
            } else {
                queryOptions.where = {
                    STATUS_PELANGGAN: 'aktif'
                };
            }

            const results = await Pelanggan.findAll(queryOptions);
            data = results.map(p => ({
                'Kode User': p.KODE_PELANGGAN || '-',
                'Nama Lengkap': p.NAMA_PELANGGAN || '-',
                'No Handphone': p.NO_HP || '-',
                'Alamat': p.ALAMAT || '-',
                'Wilayah': p.ALAMAT_WILAYAH || '-',
                'Paket Layanan': p.Paket ? p.Paket.NAMA_PAKET : '-',
                'Biaya Bulanan': p.Paket ? `Rp ${parseFloat(p.Paket.HARGA_PAKET).toLocaleString('id-ID')}` : 'Rp 0',
                'Tanggal Aktivasi': p.TANGGAL_AKTIVASI ? new Date(p.TANGGAL_AKTIVASI).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-',
                'Status': p.STATUS_LAYANAN?.toUpperCase() || '-'
            }));

        } else if (jenis === 'pendapatan') {
            const queryOptions = {
                where: { STATUS_PEMBAYARAN: 'berhasil' },
                include: [{ model: Pelanggan, attributes: ['KODE_PELANGGAN', 'NAMA_PELANGGAN'] }],
                order: [['TANGGAL_PEMBAYARAN', 'DESC']]
            };

            if (startDate && endDate) {
                queryOptions.where.TANGGAL_PEMBAYARAN = dateFilter;
            }

            const results = await Tagihan.findAll(queryOptions);
            data = results.map(t => ({
                'No Invoice': `INV/${t.TAHUN_TAGIHAN || '2024'}/${String(t.ID_TAGIHAN).padStart(4, '0')}`,
                'Kode User': t.Pelanggan ? t.Pelanggan.KODE_PELANGGAN : '-',
                'Nama Pelanggan': t.Pelanggan ? t.Pelanggan.NAMA_PELANGGAN : '-',
                'Jumlah Bayar': `Rp ${parseFloat(t.JUMLAH_BAYAR).toLocaleString('id-ID')}`,
                'Tanggal Pembayaran': t.TANGGAL_PEMBAYARAN ? new Date(t.TANGGAL_PEMBAYARAN).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-',
                'ID Transaksi': t.ID_TRANSAKSI || '-',
                'Status Pembayaran': 'Berhasil (Lunas)'
            }));

        } else if (jenis === 'aduan') {
            const queryOptions = {
                include: [
                    { model: Pelanggan, attributes: ['KODE_PELANGGAN', 'NAMA_PELANGGAN', 'NO_HP'] },
                    {
                        model: Ticket,
                        required: false,
                        include: [{ model: Pegawai, attributes: ['NAMA'] }]
                    }
                ],
                order: [['TANGGAL_ADUAN', 'DESC']]
            };

            if (startDate && endDate) {
                queryOptions.where = {
                    TANGGAL_ADUAN: dateFilter,
                    SUBJEK: { [Op.ne]: 'Instalasi Pemasangan' }
                };
            } else {
                queryOptions.where = {
                    SUBJEK: { [Op.ne]: 'Instalasi Pemasangan' }
                };
            }

            const results = await Aduan.findAll(queryOptions);
            data = results.map(a => ({
                'ID Aduan': `AD${String(a.ID_ADUAN).padStart(4, '0')}`,
                'Kode User': a.Pelanggan ? a.Pelanggan.KODE_PELANGGAN : '-',
                'Nama Pelanggan': a.Pelanggan ? a.Pelanggan.NAMA_PELANGGAN : '-',
                'No HP': a.Pelanggan ? a.Pelanggan.NO_HP : '-',
                'Kategori Kendala': a.SUBJEK || '-',
                'Deskripsi Masalah': a.DESKRIPSI_MASALAH || '-',
                'Tanggal Aduan': a.TANGGAL_ADUAN ? new Date(a.TANGGAL_ADUAN).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-',
                'Status Aduan': a.STATUS_ADUAN?.toUpperCase() || '-',
                'Teknisi yang Menangani': (a.Ticket && a.Ticket.Pegawai) ? a.Ticket.Pegawai.NAMA : 'Tidak Membutuhkan Perbaikan/Belum Ditugaskan'
            }));
        } else {
            return res.status(400).json({ message: "Jenis laporan tidak valid." });
        }

        res.json({
            jenis,
            startDate: startDate || null,
            endDate: endDate || null,
            totalRows: data.length,
            data
        });

    } catch (err) {
        console.error("Owner Laporan API Error:", err);
        res.status(500).json({
            message: "Terjadi kesalahan saat mengambil data laporan owner",
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
        const { sequelize, UpgradeLayanan, Tagihan } = require('../models');
        const { Op } = require('sequelize');

        const [aduanResult] = await sequelize.query("SELECT COUNT(*) as total FROM aduan WHERE STATUS_ADUAN IN ('pending', 'proses', 'pengajuan ulang') AND SUBJEK != 'Instalasi Pemasangan'");
        const [rescheduleResult] = await sequelize.query("SELECT COUNT(*) as total FROM reschedule WHERE STATUS_RESCHEDULE = 'pending'");

        // saring yg blm byr
        const rawUpgrades = await UpgradeLayanan.findAll({ where: { STATUS_UPGRADE: 'pending' } });
        const pendingUpgradeBillsCount = await Tagihan.findAll({
            where: {
                ID_TRANSAKSI: { [Op.like]: 'UPG-%' },
                STATUS_PEMBAYARAN: 'menunggu_verifikasi'
            }
        });
        const pendingUpgradeIds = new Set();
        for (const bill of pendingUpgradeBillsCount) {
            if (bill.ID_TRANSAKSI) {
                const parts = bill.ID_TRANSAKSI.split('-');
                if (parts[1]) {
                    pendingUpgradeIds.add(parseInt(parts[1], 10));
                }
            }
        }
        const filteredUpgrades = rawUpgrades.filter(item => !pendingUpgradeIds.has(item.ID_UPGRADE));
        const upgradeCount = filteredUpgrades.length;

        res.json({
            pengaduan: aduanResult[0].total,
            reschedule: rescheduleResult[0].total,
            upgrade: upgradeCount
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
        const { UpgradeLayanan, Pelanggan, Paket, Tagihan } = require('../models');
        const { Op } = require('sequelize');

        // Ambil data detail pengajuan yang masih berstatus pending di database
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

        // Ambil ID pelanggan yang memiliki tagihan upgrade khusus (UPG-) yang belum dibayar
        const pendingUpgradeBills = await Tagihan.findAll({
            where: {
                ID_TRANSAKSI: { [Op.like]: 'UPG-%' },
                STATUS_PEMBAYARAN: 'menunggu_verifikasi'
            }
        });

        const pendingUpgradeIds = new Set();
        for (const bill of pendingUpgradeBills) {
            if (bill.ID_TRANSAKSI) {
                const parts = bill.ID_TRANSAKSI.split('-');
                if (parts[1]) {
                    pendingUpgradeIds.add(parseInt(parts[1], 10));
                }
            }
        }

        // Saring keluar pengajuan yang sudah disetujui admin dan sedang menunggu pembayaran dari pelanggan
        const filteredUpgrade = dataUpgrade.filter(item => !pendingUpgradeIds.has(item.ID_UPGRADE));

        const formattedData = filteredUpgrade.map(item => ({
            id_upgrade: item.ID_UPGRADE,
            userId: item.Pelanggan ? item.Pelanggan.KODE_PELANGGAN : '-',
            nama: item.Pelanggan ? item.Pelanggan.NAMA_PELANGGAN : '-',
            paketSaatIni: (item.Pelanggan && item.Pelanggan.Paket) ? item.Pelanggan.Paket.NAMA_PAKET : '-',
            paketUpgrade: item.PaketBaru ? item.PaketBaru.NAMA_PAKET : '-'
        }));

        res.json({
            total: formattedData.length,
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
        const { UpgradeLayanan, Pelanggan, Paket, Tagihan, Notifikasi } = require('../models');

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

        const paketLama = await Paket.findByPk(pelanggan.ID_PAKET);
        const paketBaru = await Paket.findByPk(upgradeRequest.ID_PAKET_BARU);

        if (!paketBaru) {
            return res.status(404).json({ message: 'Paket baru tidak ditemukan.' });
        }

        // menentukan upgrade / downgrade
        const isUpgrade = paketBaru.HARGA_PAKET > (paketLama ? paketLama.HARGA_PAKET : 0);

        // ==========================================
        // ALUR KONFIRMASI UPGRADE / DOWNGRADE
        // ==========================================

        // 1. Update pelanggan ID_PAKET ke paket baru
        await pelanggan.update({ ID_PAKET: upgradeRequest.ID_PAKET_BARU });

        // 2. Update status upgrade_layanan menjadi 'berhasil'
        await upgradeRequest.update({
            STATUS_UPGRADE: 'berhasil',
            TANGGAL_COMPLETE: new Date()
        });

        // 3. Hapus tagihan bulanan reguler (TAG-) di masa mendatang yang belum dibayar,
        // karena tagihan tersebut dibuat berdasarkan paket lama.
        const { Op } = require('sequelize');
        const todayDateOnly = new Date();
        todayDateOnly.setHours(0, 0, 0, 0);

        await Tagihan.destroy({
            where: {
                ID_PELANGGAN: pelanggan.ID_PELANGGAN,
                ID_TRANSAKSI: { [Op.like]: 'TAG-%' },
                STATUS_PEMBAYARAN: 'menunggu_verifikasi',
                JATUH_TEMPO: { [Op.gt]: todayDateOnly }
            }
        });

        // 4. Buat Notifikasi untuk pelanggan
        const typeAction = isUpgrade ? 'Upgrade' : 'Downgrade';
        await Notifikasi.create({
            ID_PELANGGAN: pelanggan.ID_PELANGGAN,
            JUDUL: `${typeAction} Layanan Berhasil`,
            DESKRIPSI_PESAN: `Permintaan ${typeAction.toLowerCase()} layanan Anda ke paket "${paketBaru.NAMA_PAKET}" telah disetujui admin dan resmi diaktifkan.`,
            KATEGORI_NOTIFIKASI: 'upgrade',
            TANGGAL_NOTIFIKASI: new Date()
        });

        // 5. Catat Log Aktivitas Staff
        await logStaffActivity(req, `Menyetujui ${typeAction} Layanan`, `Menyetujui permintaan ${typeAction.toLowerCase()} ke paket "${paketBaru.NAMA_PAKET}" untuk pelanggan ${pelanggan.NAMA_PELANGGAN}. Berhasil diaktifkan.`);

        return res.json({
            type: typeAction.toLowerCase(),
            message: `Permintaan ${typeAction.toLowerCase()} berhasil dikonfirmasi dan layanan pelanggan telah diperbarui.`
        });
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
        const { Op } = require('sequelize');

        // Total aduan (semua aduan yang masuk)
        const total = await Aduan.count({ where: { SUBJEK: { [Op.ne]: 'Instalasi Pemasangan' } } });
        const pending = await Aduan.count({ where: { STATUS_ADUAN: 'pending', SUBJEK: { [Op.ne]: 'Instalasi Pemasangan' } } });
        const proses = await Aduan.count({ where: { STATUS_ADUAN: 'proses', SUBJEK: { [Op.ne]: 'Instalasi Pemasangan' } } });
        const selesai = await Aduan.count({ where: { STATUS_ADUAN: 'selesai', SUBJEK: { [Op.ne]: 'Instalasi Pemasangan' } } });
        const pengajuanUlang = await Aduan.count({ where: { STATUS_ADUAN: 'pengajuan ulang', SUBJEK: { [Op.ne]: 'Instalasi Pemasangan' } } });

        // Ambil semua data aduan agar dapat difilter di sisi client (termasuk yang 'selesai')
        const dataAduan = await Aduan.findAll({
            where: { SUBJEK: { [Op.ne]: 'Instalasi Pemasangan' } },
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
            stats: { total, pending, proses, selesai, pengajuanUlang },
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

        // Jika status diubah kembali menjadi menunggu perbaikan krn pengajuan ulang
        // hapus tiket lama agar admin dapat menjadwalkannya ulang.
        if (status === 'proses') {
            await Ticket.destroy({ where: { ID_ADUAN: id_aduan } });
        }

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

        // Catat Log Aktivitas Staff
        const actTitle = status === 'proses' ? 'Memproses Aduan' : (status === 'selesai' ? 'Menyelesaikan Aduan' : 'Mengupdate Aduan');
        await logStaffActivity(req, actTitle, `Mengubah status aduan mengenai "${aduan.SUBJEK}" menjadi "${status}"`);

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
// GET /api/dashboard/admin/layanan/pelanggan-all
// Ambil daftar semua pelanggan untuk form manual e-ticket
// ============================================
router.get('/admin/layanan/pelanggan-all', verifyToken, async (req, res) => {
    try {
        const { Pelanggan } = require('../models');
        const pelanggan = await Pelanggan.findAll({
            attributes: ['ID_PELANGGAN', 'KODE_PELANGGAN', 'NAMA_PELANGGAN', 'ALAMAT', 'ALAMAT_WILAYAH'],
            order: [['NAMA_PELANGGAN', 'ASC']]
        });
        res.json(pelanggan);
    } catch (err) {
        console.error("Pelanggan All Error:", err);
        res.status(500).json({ message: "Terjadi kesalahan", error: err.message });
    }
});

// ============================================
// POST /api/dashboard/admin/layanan/eticketing
// Buat tiket baru
// ============================================
router.post('/admin/layanan/eticketing', verifyToken, async (req, res) => {
    try {
        const { id_aduan, id_pegawai, tanggal, waktu, jenis_penugasan, prioritas, wilayah, deskripsi } = req.body;
        const { Ticket, Aduan } = require('../models');

        // Pastikan aduan ada dan statusnya proses
        const aduan = await Aduan.findByPk(id_aduan);
        if (!aduan) return res.status(404).json({ message: "Aduan tidak ditemukan" });

        // Format notes
        const notes = `Jenis Penugasan: ${jenis_penugasan || 'Perbaikan'}\nPrioritas: ${prioritas}\nWilayah: ${wilayah}\nDeskripsi Penanganan: ${deskripsi}`;

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
        const isInstalasi = aduan.SUBJEK === 'Instalasi Pemasangan';
        await Notifikasi.create({
            ID_PELANGGAN: aduan.ID_PELANGGAN,
            RELATED_ID: newTicket.ID_TICKET,
            JUDUL: isInstalasi ? 'Jadwal Pemasangan Layanan' : 'Jadwal Perbaikan Layanan',
            DESKRIPSI_PESAN: isInstalasi
                ? `Jadwal instalasi perangkat baru telah ditetapkan pada ${tanggal} pukul ${waktu}.`
                : `Jadwal perbaikan untuk aduan "${aduan.SUBJEK}" telah ditetapkan pada ${tanggal} pukul ${waktu}.`,
            KATEGORI_NOTIFIKASI: 'jadwal perbaikan',
            TANGGAL_NOTIFIKASI: new Date()
        });

        // 3. Catat Log Aktivitas Staff
        const pegTeknisi = await Pegawai.findByPk(id_pegawai);
        const namaTeknisi = pegTeknisi ? pegTeknisi.NAMA : 'Teknisi';
        await logStaffActivity(req, 'Membuat E-Ticket Perbaikan', `Membuat tiket perbaikan SGTKT${newTicket.ID_TICKET} untuk aduan "${aduan.SUBJEK}" dan ditugaskan ke ${namaTeknisi}`);

        res.status(201).json({ message: "E-ticket berhasil dibuat", ticket: newTicket });
    } catch (err) {
        console.error("Create Ticket Error:", err);
        res.status(500).json({ message: "Terjadi kesalahan", error: err.message });
    }
});

// ============================================
// POST /api/dashboard/admin/layanan/eticketing/manual
// Buat tiket baru manual (tanpa aduan sebelumnya)
// ============================================
router.post('/admin/layanan/eticketing/manual', verifyToken, async (req, res) => {
    try {
        const { id_pelanggan, id_pegawai, tanggal, waktu, jenis_penugasan, prioritas, wilayah, deskripsi } = req.body;
        const { Ticket, Aduan, Pelanggan, Pegawai } = require('../models');

        // Pastikan pelanggan ada
        const pelanggan = await Pelanggan.findByPk(id_pelanggan);
        if (!pelanggan) return res.status(404).json({ message: "Pelanggan tidak ditemukan" });

        // Buat Aduan Dummy
        const newAduan = await Aduan.create({
            ID_PELANGGAN: id_pelanggan,
            SUBJEK: `Penugasan Manual: ${jenis_penugasan}`,
            DESKRIPSI_MASALAH: `Dibuat oleh admin: ${deskripsi}`,
            STATUS_ADUAN: 'proses',
            TANGGAL_ADUAN: new Date()
        });

        // Format notes
        const notes = `Jenis Penugasan: ${jenis_penugasan}\nPrioritas: ${prioritas}\nWilayah: ${wilayah}\nDeskripsi Penanganan: ${deskripsi}`;

        const newTicket = await Ticket.create({
            ID_PEGAWAI: id_pegawai,
            ID_ADUAN: newAduan.ID_ADUAN,
            SCHEDULE_DATE: tanggal,
            SCHEDULE_TIME: waktu,
            TICKET_STATUS: 'open',
            NOTES: notes
        });

        // Buat Notifikasi untuk Pelanggan
        const { Notifikasi } = require('../models');
        await Notifikasi.create({
            ID_PELANGGAN: id_pelanggan,
            RELATED_ID: newTicket.ID_TICKET,
            JUDUL: `Jadwal ${jenis_penugasan} Layanan`,
            DESKRIPSI_PESAN: `Jadwal ${jenis_penugasan.toLowerCase()} telah ditetapkan pada ${tanggal} pukul ${waktu}.`,
            KATEGORI_NOTIFIKASI: 'jadwal perbaikan',
            TANGGAL_NOTIFIKASI: new Date()
        });

        // Catat Log Aktivitas Staff
        const pegTeknisi = await Pegawai.findByPk(id_pegawai);
        const namaTeknisi = pegTeknisi ? pegTeknisi.NAMA : 'Teknisi';
        await logStaffActivity(req, 'Membuat E-Ticket Manual', `Membuat tiket ${jenis_penugasan} SGTKT${newTicket.ID_TICKET} untuk pelanggan ${pelanggan.NAMA_PELANGGAN} dan ditugaskan ke ${namaTeknisi}`);

        res.status(201).json({ message: "E-ticket manual berhasil dibuat", ticket: newTicket });
    } catch (err) {
        console.error("Create Manual Ticket Error:", err);
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
            tanggal: new Date(t.SCHEDULE_DATE).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: '2-digit' }).replace(/\//g, '-'),
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
        const { status, notes_teknisi } = req.body;
        const { Ticket, Aduan } = require('../models');

        const ticket = await Ticket.findByPk(idTicket);
        if (!ticket) return res.status(404).json({ message: "Ticket tidak ditemukan" });

        let updateData = { TICKET_STATUS: status };
        if (status === 'selesai' && notes_teknisi) {
            updateData.NOTES = ticket.NOTES ? `${ticket.NOTES}\n\nCatatan Teknisi:\n${notes_teknisi}` : `Catatan Teknisi:\n${notes_teknisi}`;
        }

        await ticket.update(updateData);

        // Jika selesai, buat notifikasi untuk pelanggan bahwa perbaikan telah dilakukan (tetapi aduan tidak langsung diset 'selesai' agar dikonfirmasi oleh pelanggan)
        if (status === 'selesai') {
            const aduan = await Aduan.findByPk(ticket.ID_ADUAN);
            if (aduan) {
                // Buat Notifikasi bahwa perbaikan telah selesai dilakukan oleh teknisi, minta pelanggan konfirmasi
                const { Notifikasi } = require('../models');
                await Notifikasi.create({
                    ID_PELANGGAN: aduan.ID_PELANGGAN,
                    JUDUL: 'Perbaikan Selesai Dilakukan',
                    DESKRIPSI_PESAN: `Teknisi telah menyelesaikan perbaikan untuk tiket SGTKT${String(ticket.ID_TICKET).padStart(3, '0')}. Silakan lakukan konfirmasi penyelesaian pada menu Aduan Pelanggan jika sudah normal.`,
                    KATEGORI_NOTIFIKASI: 'aduan',
                    TANGGAL_NOTIFIKASI: new Date()
                });
            }
        }

        // Catat Log Aktivitas Staff
        let activityTitle = 'Mengupdate Penugasan';
        let detailText = `Mengubah status tiket perbaikan SGTKT${ticket.ID_TICKET} menjadi "${status}"`;
        if (status === 'on progress') {
            activityTitle = 'Memulai Penugasan';
            detailText = `Memulai penanganan kendala/perbaikan untuk tiket SGTKT${ticket.ID_TICKET}`;
        } else if (status === 'selesai') {
            activityTitle = 'Menyelesaikan Perbaikan';
            detailText = `Menyelesaikan perbaikan gangguan koneksi dan menutup tiket SGTKT${ticket.ID_TICKET}`;
        }
        await logStaffActivity(req, activityTitle, detailText);

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
            tanggal: new Date(t.SCHEDULE_DATE).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: '2-digit' }).replace(/\//g, '-'),
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
// GET /api/dashboard/pelanggan/reschedule/riwayat
// Ambil riwayat penjadwalan ulang milik pelanggan 
// ============================================
router.get('/pelanggan/reschedule/riwayat', verifyToken, async (req, res) => {
    try {
        const idPelanggan = req.user.id;
        const { Reschedule, Ticket, Aduan, Pelanggan, Pegawai } = require('../models');

        // Cari aduan milik pelanggan ini
        const aduanList = await Aduan.findAll({
            where: { ID_PELANGGAN: idPelanggan },
            attributes: ['ID_ADUAN']
        });

        const aduanIds = aduanList.map(a => a.ID_ADUAN);

        if (aduanIds.length === 0) {
            return res.json({ data: [] });
        }

        // Cari ticket aduan pelanggan
        const tickets = await Ticket.findAll({
            where: { ID_ADUAN: aduanIds },
            attributes: ['ID_TICKET']
        });

        const ticketIds = tickets.map(t => t.ID_TICKET);

        if (ticketIds.length === 0) {
            return res.json({ data: [] });
        }

        // Ambil riwayat reschedule untuk ticket-ticket tersebut
        const dataReschedule = await Reschedule.findAll({
            where: { ID_TICKET: ticketIds },
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
            tanggal_baru: item.TANGGAL_BARU,
            jam_baru: item.JAM_BARU ? item.JAM_BARU.substring(0, 5) : '-',
            deskripsi: item.DESKRIPSI || '-',
            status: item.STATUS_RESCHEDULE
        }));

        res.json({
            data: formattedData
        });
    } catch (err) {
        console.error("Pelanggan Reschedule History Error:", err);
        res.status(500).json({ message: "Terjadi kesalahan saat mengambil riwayat reschedule", error: err.message });
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
            where: { STATUS_RESCHEDULE: 'pending' },
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

        const totalPending = dataReschedule.length;
        const totalDisetujui = await Reschedule.count({ where: { STATUS_RESCHEDULE: 'disetujui' } });
        const totalDitolak = await Reschedule.count({ where: { STATUS_RESCHEDULE: 'ditolak' } });

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

        // Catat Log Aktivitas Staff
        const actTitle = status === 'disetujui' ? 'Menyetujui Reschedule' : 'Menolak Reschedule';
        await logStaffActivity(req, actTitle, `Mengubah status pengajuan reschedule tiket SGTKT${reschedule.ID_TICKET} menjadi "${status}"`);

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
        const { id_pegawai, tanggal, waktu, jenis_penugasan, prioritas, wilayah, deskripsi } = req.body;
        const { Ticket } = require('../models');

        const ticket = await Ticket.findByPk(req.params.id);
        if (!ticket) return res.status(404).json({ message: "Ticket tidak ditemukan" });

        // Format notes
        const notes = `Jenis Penugasan: ${jenis_penugasan || 'Perbaikan'}\nPrioritas: ${prioritas}\nWilayah: ${wilayah}\nDeskripsi Penanganan: ${deskripsi}`;

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
// Mendapatkan tagihan aktif dan melakukan auto-generate
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
        const todayUTC = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
        const todayDate = new Date(todayUTC);

        // 1.5 PEMBERSIHAN TAGIHAN PREMATUR (BELUM MASUK H-10)
        try {
            const prematurTagihans = await Tagihan.findAll({
                where: {
                    ID_PELANGGAN: pelanggan.ID_PELANGGAN,
                    STATUS_PEMBAYARAN: { [Op.ne]: 'berhasil' },
                    ID_TRANSAKSI: { [Op.like]: 'TAG-%' }
                }
            });

            for (const t of prematurTagihans) {
                const jatuhTempoDate = new Date(t.JATUH_TEMPO);
                const triggerDate = new Date(jatuhTempoDate);
                triggerDate.setUTCDate(triggerDate.getUTCDate() - 10);
                triggerDate.setHours(0, 0, 0, 0);

                if (todayDate < triggerDate) {
                    console.log(`Menghapus tagihan prematur ${t.ID_TRANSAKSI} karena belum memasuki H-10.`);
                    await t.destroy();
                }
            }
        } catch (purgeErr) {
            console.error("Gagal membersihkan tagihan prematur:", purgeErr);
        }

        const aktivasi = new Date(pelanggan.TANGGAL_AKTIVASI);
        const tanggalAktivasi = aktivasi.getUTCDate();

        const todayYear = todayDate.getUTCFullYear();
        const todayMonth = todayDate.getUTCMonth(); // 0-indexed

        // Cari tagihan dari 2 bulan lalu hingga 1 bulan ke depan
        const targetCycles = [];
        for (let offset = -2; offset <= 1; offset++) {
            const cycleDate = new Date(Date.UTC(todayYear, todayMonth + offset, 1));
            targetCycles.push({
                year: cycleDate.getUTCFullYear(),
                month: cycleDate.getUTCMonth()
            });
        }

        for (const cycle of targetCycles) {
            // Gunakan UTC Date untuk menghindari perbedaan zona waktu server
            const anniversaryDate = new Date(Date.UTC(cycle.year, cycle.month, tanggalAktivasi));

            // Jatuh tempo adalah tepat pada tanggal anniversary (tanggal aktivasi di periode/bulan berikutnya)
            const jatuhTempo = new Date(anniversaryDate);

            // sistem auto-generate tagihan baru
            const triggerDate = new Date(jatuhTempo);
            triggerDate.setUTCDate(triggerDate.getUTCDate() - 10);

            // Skip jika siklus ini terjadi sebelum atau sama dengan tanggal aktivasi
            if (anniversaryDate <= aktivasi) {
                continue;
            }

            // Jika tanggal hari ini sudah melewati atau sama dengan triggerDate (10 hari sebelum jatuh tempo),
            // maka tagihan baru tersebut wajib di-generate secara otomatis oleh sistem.
            if (todayDate >= triggerDate) {
                const billingMonth = anniversaryDate.getUTCMonth() + 1; // 1-indexed
                const billingYear = anniversaryDate.getUTCFullYear();

                const { Op } = require('sequelize');
                const exists = await Tagihan.findOne({
                    where: {
                        ID_PELANGGAN: pelanggan.ID_PELANGGAN,
                        BULAN_TAGIHAN: billingMonth,
                        TAHUN_TAGIHAN: billingYear,
                        ID_TRANSAKSI: {
                            [Op.notLike]: 'UPG-%'
                        }
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
        let tagihanList = await Tagihan.findAll({
            where: { ID_PELANGGAN: pelangganId },
            order: [
                ['TAHUN_TAGIHAN', 'DESC'],
                ['BULAN_TAGIHAN', 'DESC'],
                ['ID_TAGIHAN', 'DESC']
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

        // Cek jika sudah ada tagihan UPG- yang dibayar 
        const paidUpgBill = tagihanList.find(t => t.STATUS_PEMBAYARAN === 'berhasil' && t.ID_TRANSAKSI && t.ID_TRANSAKSI.startsWith('UPG-'));
        if (paidUpgBill) {
            const obsoleteUpgs = tagihanList.filter(t => t.STATUS_PEMBAYARAN !== 'berhasil' && t.ID_TRANSAKSI && t.ID_TRANSAKSI.startsWith('UPG-'));
            if (obsoleteUpgs.length > 0) {
                for (const obsolete of obsoleteUpgs) {
                    await Tagihan.destroy({ where: { ID_TAGIHAN: obsolete.ID_TAGIHAN } });
                }
                // Filter tagihanList yang akan diproses
                tagihanList = tagihanList.filter(t => !(t.STATUS_PEMBAYARAN !== 'berhasil' && t.ID_TRANSAKSI && t.ID_TRANSAKSI.startsWith('UPG-')));
            }
        }

        let activeBill = tagihanList.find(t => t.STATUS_PEMBAYARAN !== 'berhasil' && t.ID_TRANSAKSI && t.ID_TRANSAKSI.startsWith('UPG-'));

        if (!activeBill) {
            activeBill = tagihanList.find(t => t.STATUS_PEMBAYARAN !== 'berhasil');
        }

        // Jika semua tagihan sudah terbayar, ambil tagihan yang paling baru dibayar
        if (!activeBill) {
            activeBill = tagihanList[0];
        }

        // Sinkronisasi status dengan Midtrans jika masih menunggu verifikasi
        if (activeBill && activeBill.STATUS_PEMBAYARAN === 'menunggu_verifikasi' && activeBill.ID_TRANSAKSI) {
            try {
                const midtransClient = require('midtrans-client');
                const snap = new midtransClient.Snap({
                    isProduction: false,
                    serverKey: process.env.MIDTRANS_SERVER,
                    clientKey: process.env.MIDTRANS_CLIENT
                });

                const statusResponse = await snap.transaction.status(activeBill.ID_TRANSAKSI);
                if (statusResponse && (statusResponse.transaction_status === 'settlement' || statusResponse.transaction_status === 'capture')) {
                    // Update ke database
                    await activeBill.update({
                        STATUS_PEMBAYARAN: 'berhasil',
                        TANGGAL_PEMBAYARAN: statusResponse.settlement_time ? new Date(statusResponse.settlement_time) : new Date(),
                        METODE_PEMBAYARAN: statusResponse.payment_type,
                        STATUS_VERIFIKASI: statusResponse.transaction_status,
                        PAYMENT_TIME: statusResponse.settlement_time ? new Date(statusResponse.settlement_time) : new Date()
                    });

                    // Lakukan trigger success logic
                    const axios = require('axios');

                    // Karena kita butuh update Pelanggan dan Notifikasi, panggil internal logic yang ada di paymentRoutes.js
                    if (activeBill.ID_TRANSAKSI.startsWith('UPG-')) {
                        const parts = activeBill.ID_TRANSAKSI.split('-');
                        const id_upgrade = parts[1];
                        const { UpgradeLayanan, Paket: PaketModel, Notifikasi } = require('../models');
                        const upgradeRequest = await UpgradeLayanan.findByPk(id_upgrade);

                        if (upgradeRequest) {
                            const todayDateOnly = new Date();
                            todayDateOnly.setHours(0, 0, 0, 0);
                            const { Op } = require('sequelize');
                            await Tagihan.destroy({
                                where: {
                                    ID_PELANGGAN: pelanggan.ID_PELANGGAN,
                                    ID_TRANSAKSI: { [Op.like]: 'TAG-%' },
                                    STATUS_PEMBAYARAN: 'menunggu_verifikasi',
                                    JATUH_TEMPO: { [Op.gt]: todayDateOnly }
                                }
                            });

                            // Hapus tagihan UPG- lain yang mungkin double atau kadaluwarsa
                            await Tagihan.destroy({
                                where: {
                                    ID_PELANGGAN: pelanggan.ID_PELANGGAN,
                                    ID_TRANSAKSI: { [Op.like]: 'UPG-%', [Op.ne]: activeBill.ID_TRANSAKSI },
                                    STATUS_PEMBAYARAN: 'menunggu_verifikasi'
                                }
                            });

                            const paketBaru = await PaketModel.findByPk(upgradeRequest.ID_PAKET_BARU);
                            await Notifikasi.create({
                                ID_PELANGGAN: pelanggan.ID_PELANGGAN,
                                JUDUL: 'Pembayaran Upgrade Berhasil',
                                DESKRIPSI_PESAN: `Terima kasih! Pembayaran tagihan upgrade Anda telah berhasil diverifikasi (Auto-Sync). Pengajuan ke paket "${paketBaru ? paketBaru.NAMA_PAKET : '-'}" sedang menunggu konfirmasi admin.`,
                                KATEGORI_NOTIFIKASI: 'upgrade',
                                TANGGAL_NOTIFIKASI: new Date()
                            });
                        }
                    } else {
                        // Regular tagihan
                        const wasCalon = pelanggan.STATUS_PELANGGAN === 'calon';
                        await pelanggan.update({ STATUS_PELANGGAN: 'aktif', STATUS_LAYANAN: 'aktif' });

                        if (wasCalon) {
                            const { Aduan } = require('../models');
                            await Aduan.create({
                                ID_PELANGGAN: pelanggan.ID_PELANGGAN,
                                SUBJEK: 'Instalasi Pemasangan',
                                DESKRIPSI_MASALAH: 'Pemasangan perangkat baru setelah aktivasi pelanggan.',
                                STATUS_ADUAN: 'proses',
                                TANGGAL_ADUAN: new Date()
                            });
                        }

                        const { Notifikasi } = require('../models');
                        await Notifikasi.create({
                            ID_PELANGGAN: pelanggan.ID_PELANGGAN,
                            JUDUL: 'Pembayaran Berhasil',
                            DESKRIPSI_PESAN: `Terima kasih! Pembayaran tagihan Anda dengan Order ID ${activeBill.ID_TRANSAKSI} telah berhasil diverifikasi (Auto-Sync).`,
                            KATEGORI_NOTIFIKASI: 'pembayaran',
                            TANGGAL_NOTIFIKASI: new Date()
                        });
                    }
                }
            } catch (midtransError) {
            }
        }

        let targetLayananName = pelanggan.Paket ? pelanggan.Paket.NAMA_PAKET : "-";

        if (activeBill && activeBill.ID_TRANSAKSI && activeBill.ID_TRANSAKSI.startsWith('UPG-')) {
            const parts = activeBill.ID_TRANSAKSI.split('-');
            const id_upgrade = parts[1];
            if (id_upgrade) {
                const { UpgradeLayanan, Paket: PaketModel } = require('../models');
                const upgradeRequest = await UpgradeLayanan.findByPk(id_upgrade, {
                    include: [{ model: PaketModel, as: 'PaketBaru' }]
                });
                if (upgradeRequest && upgradeRequest.PaketBaru) {
                    targetLayananName = `Upgrade Ke: ${upgradeRequest.PaketBaru.NAMA_PAKET}`;
                }
            }
        }

        res.json({
            hasBill: true,
            bill: {
                id_tagihan: activeBill.ID_TAGIHAN,
                nomor_tagihan: activeBill.NOMOR_TAGIHAN,
                jumlah_bayar: activeBill.JUMLAH_BAYAR,
                status_pembayaran: activeBill.STATUS_PEMBAYARAN, // Akan mengembalikan 'berhasil' jika tersinkronisasi di atas
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
                layanan: targetLayananName
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
                    console.log(`Menghapus tagihan prematur ${t.ID_TRANSAKSI} karena belum memasuki H-10.`);
                    await t.destroy();
                }
            }
        } catch (purgeErr) {
            console.error("Gagal membersihkan tagihan prematur secara global:", purgeErr);
        }

        const pelangganList = await Pelanggan.findAll({
            where: { STATUS_PELANGGAN: 'aktif' },
            include: [
                { model: Paket },
                { model: Tagihan }
            ]
        });

        const totalTagihan = await Tagihan.count();

        // tagihan pending = tagihan yang sudah memasuki waktu jatuh tempo dan belum dibayar
        const tagihanPending = await Tagihan.count({
            where: {
                STATUS_PEMBAYARAN: { [Op.ne]: 'berhasil' },
                JATUH_TEMPO: { [Op.lte]: today }
            }
        });

        // tagihan terbayar
        const tagihanTerbayar = await Tagihan.count({
            where: { STATUS_PEMBAYARAN: 'berhasil' }
        });

        // 3. Format data pelanggan untuk tabel
        const formattedCustomers = pelangganList.map(p => {
            const tagihans = p.Tagihans || [];

            // Cari tagihan yang belum dibayar
            const unpaidBills = tagihans.filter(t => t.STATUS_PEMBAYARAN !== 'berhasil');

            // Tentukan status tampilan
            let displayStatus = 'AKTIF';
            if (p.STATUS_LAYANAN === 'blokir') {
                displayStatus = 'BLOCKIR';
            } else {
                // Cari tagihan reguler terlama yang belum dibayar
                const regularUnpaidBills = unpaidBills.filter(t => !t.ID_TRANSAKSI || !t.ID_TRANSAKSI.startsWith('UPG-'));
                if (regularUnpaidBills.length > 0) {
                    // Urutkan jatuh tempo
                    regularUnpaidBills.sort((a, b) => new Date(a.JATUH_TEMPO) - new Date(b.JATUH_TEMPO));
                    const oldestUnpaid = regularUnpaidBills[0];

                    const billDueDate = new Date(oldestUnpaid.JATUH_TEMPO);
                    billDueDate.setHours(0, 0, 0, 0);

                    const diffMs = today.getTime() - billDueDate.getTime();
                    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

                    if (diffDays > 7) {
                        displayStatus = 'BLOCKIR';
                    } else if (diffDays >= -7) {
                        displayStatus = 'JATUH TEMPO';
                    }
                }
            }

            // Sync ke kolom STATUS_LAYANAN di database
            if (displayStatus === 'BLOCKIR' && p.STATUS_LAYANAN !== 'blokir') {
                p.update({ STATUS_LAYANAN: 'blokir' }).catch(err => console.error(err));
                p.STATUS_LAYANAN = 'blokir';
            } else if ((displayStatus === 'AKTIF' || displayStatus === 'JATUH TEMPO') && p.STATUS_LAYANAN === 'blokir') {
                p.update({ STATUS_LAYANAN: 'aktif' }).catch(err => console.error(err));
                p.STATUS_LAYANAN = 'aktif';
            }

            if (p.STATUS_LAYANAN === 'blokir') {
                displayStatus = 'BLOCKIR';
            }

            // Tentukan tanggal jatuh tempo terdekat atau tanggal jatuh tempo terakhir (dihitung dinamis dari TANGGAL_AKTIVASI agar selaras sempurna dengan dashboard pelanggan)
            let displayJatuhTempo = '-';
            let jatuhTempoRaw = null;
            if (p.TANGGAL_AKTIVASI && p.ID_PAKET) {
                try {
                    const sortedTagihans = tagihans.filter(t => !t.ID_TRANSAKSI || !t.ID_TRANSAKSI.startsWith('UPG-')).sort((a, b) => new Date(b.JATUH_TEMPO) - new Date(a.JATUH_TEMPO));
                    let targetJatuhTempoDate;

                    if (sortedTagihans.length > 0) {
                        const latestTagihan = sortedTagihans[0];
                        targetJatuhTempoDate = new Date(latestTagihan.JATUH_TEMPO);
                        if (latestTagihan.STATUS_PEMBAYARAN === 'berhasil') {
                            targetJatuhTempoDate.setMonth(targetJatuhTempoDate.getMonth() + 1);
                        }
                        if (p.TANGGAL_AKTIVASI) {
                            targetJatuhTempoDate.setDate(new Date(p.TANGGAL_AKTIVASI).getUTCDate());
                        }
                    } else {
                        const tanggalAktivasi = new Date(p.TANGGAL_AKTIVASI);
                        targetJatuhTempoDate = new Date(tanggalAktivasi);
                        targetJatuhTempoDate.setMonth(targetJatuhTempoDate.getMonth() + 1);
                        targetJatuhTempoDate.setDate(tanggalAktivasi.getUTCDate());
                    }

                    targetJatuhTempoDate.setHours(0, 0, 0, 0);
                    jatuhTempoRaw = targetJatuhTempoDate.getTime();
                    displayJatuhTempo = targetJatuhTempoDate.toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        timeZone: 'UTC'
                    });
                } catch (err) {
                    console.error("Error formatting displayJatuhTempo for admin table:", err);
                }
            }

            return {
                id_pelanggan: p.ID_PELANGGAN,
                userId: p.KODE_PELANGGAN,
                nama: p.NAMA_PELANGGAN,
                jenisPaket: p.Paket ? p.Paket.NAMA_PAKET : '-',
                status: displayStatus,
                statusLayanan: p.STATUS_LAYANAN || 'aktif',
                jatuhTempo: displayJatuhTempo,
                jatuhTempoRaw: jatuhTempoRaw
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

        if (status === 'blokir') {
            const { Tagihan } = require('../models');
            const { Op } = require('sequelize');
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const tagihanPending = await Tagihan.findOne({
                where: {
                    ID_PELANGGAN: pelanggan.ID_PELANGGAN,
                    STATUS_PEMBAYARAN: { [Op.ne]: 'berhasil' },
                    JATUH_TEMPO: { [Op.lte]: today }
                }
            });

            if (!tagihanPending) {
                return res.status(400).json({ message: "Pelanggan belum memasuki waktu jatuh tempo atau tidak memiliki tagihan tertunda." });
            }
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

        // Catat Log Aktivitas Staff
        const actType = status === 'aktif' ? 'Mengaktifkan Layanan' : 'Memblokir Layanan';
        const detailMsg = status === 'aktif'
            ? `Mengaktifkan kembali layanan internet untuk pelanggan "${pelanggan.NAMA_PELANGGAN}"`
            : `Memblokir sementara layanan internet untuk pelanggan "${pelanggan.NAMA_PELANGGAN}" karena jatuh tempo`;
        await logStaffActivity(req, actType, detailMsg);

        res.json({ message: `Status layanan berhasil diubah menjadi ${status}.` });

    } catch (err) {
        console.error("Change Status Layanan Error:", err);
        res.status(500).json({ message: "Terjadi kesalahan saat mengubah status layanan.", error: err.message });
    }
});

// ============================================
// GET /api/dashboard/owner/logs
// Mengambil log aktivitas staff (admin & teknisi)
// ============================================
router.get('/owner/logs', verifyToken, async (req, res) => {
    try {
        if (!LogAktivitas || !Pegawai) {
            return res.status(500).json({ message: "Model LogAktivitas atau Pegawai tidak tersedia" });
        }

        await LogAktivitas.sync();

        // 1. Tarik semua pegawai dan semua logs
        const pegawais = await Pegawai.findAll({ raw: true });
        const logs = await LogAktivitas.findAll({ raw: true, order: [['datetime', 'DESC']] });

        // 2. Buat map index untuk pencarian 
        const idMap = {};
        const usernameMap = {};

        pegawais.forEach(p => {
            if (p.ID_PEGAWAI) {
                idMap[p.ID_PEGAWAI] = p;
            }
            if (p.USERNAME) {
                usernameMap[p.USERNAME.toLowerCase().trim()] = p;
            }
        });

        const formattedLogs = logs
            .map(log => {
                let matchedPegawai = null;

                // Prioritas 1: Cocokkan berdasarkan ID Pegawai
                if (log.id_pegawai && idMap[log.id_pegawai]) {
                    matchedPegawai = idMap[log.id_pegawai];
                }
                // Prioritas 2: Cocokkan berdasarkan USERNAME
                else if (log.USERNAME) {
                    const cleanUser = log.USERNAME.toLowerCase().trim();
                    if (usernameMap[cleanUser]) {
                        matchedPegawai = usernameMap[cleanUser];
                    }
                }

                // Resolusi role
                const role = matchedPegawai && matchedPegawai.ROLE
                    ? matchedPegawai.ROLE.toLowerCase().trim()
                    : 'staff';

                // username
                const displayUsername = matchedPegawai && matchedPegawai.USERNAME
                    ? matchedPegawai.USERNAME
                    : log.USERNAME;

                return {
                    id: log.id_LogAktivitas,
                    level: role,
                    user: displayUsername,
                    activity: log.activity,
                    context: log.content,
                    datetime: log.datetime
                };
            })
            // Filter role admin & teknisi
            .filter(log => ['admin', 'teknisi'].includes(log.level));

        res.json(formattedLogs);
    } catch (err) {
        console.error("Fetch Log Aktivitas Error:", err);
        res.status(500).json({ message: "Terjadi kesalahan saat memuat log aktivitas.", error: err.message });
    }
});

module.exports = router;