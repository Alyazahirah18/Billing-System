const express = require('express'); // 1. Import express
const cors = require('cors');
const { sequelize } = require('./models');
require('dotenv').config();

const app = express();

// 3. Gunakan Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// 4. Import Routes (Pindahkan ke bawah setelah 'app' didefinisikan)
const paketRoutes = require('./routes/paketRoutes');
const authRoutes = require('./routes/authRoutes');
const pelangganRoutes = require('./routes/pelangganRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const aduanRoutes = require('./routes/aduanRoutes');
const notifikasiRoutes = require('./routes/notifikasiRoutes');

// 5. Gunakan Routes
app.use('/api/paket', paketRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/pelanggan', pelangganRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/aduan', aduanRoutes);
app.use('/api/notifikasi', notifikasiRoutes);

// Test koneksi database dan sinkronisasi model
async function testConnection() {
    try {
        await sequelize.authenticate();
        console.log(' Koneksi ke Database MySQL Berhasil (Sequelize)!');

        // Sync model
        await sequelize.sync({ alter: false });
        console.log(' Sinkronisasi Model Sequelize Berhasil!');

        // Pemulihan Mandiri (Database Heal): Perbarui STATUS_LAYANAN yang NULL bagi pelanggan yang sudah 'aktif'
        const { Pelanggan } = require('./models');
        const pelangganList = await Pelanggan.findAll({
            attributes: ['ID_PELANGGAN', 'NAMA_PELANGGAN', 'STATUS_PELANGGAN', 'STATUS_LAYANAN']
        });
        console.log('--- DATABASE HEAL DIAGNOSTIC ---');
        let nullLayananCount = 0;
        for (const p of pelangganList) {
            console.log(`Pelanggan: ${p.NAMA_PELANGGAN} | Status: ${p.STATUS_PELANGGAN} | Layanan: ${p.STATUS_LAYANAN}`);
            if (p.STATUS_PELANGGAN === 'aktif' && !p.STATUS_LAYANAN) {
                await p.update({ STATUS_LAYANAN: 'aktif' });
                console.log(`   Healed status_layanan to 'aktif' for ${p.NAMA_PELANGGAN}`);
                nullLayananCount++;
            }
        }
        console.log(`🧹 [DATABASE HEAL] Selesai. Memulihkan ${nullLayananCount} pelanggan.`);
        console.log('---------------------------------');
    } catch (err) {
        console.error(' Koneksi Database Gagal:', err.message);
    }
}
testConnection();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(` Server berjalan di http://localhost:${PORT}`);

    const admin = require("firebase-admin");
    const serviceAccount = require("./config/serviceAccountKey.json");

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });

    // ============================================
    // PUSH NOTIFICATION: Cek Jatuh Tempo Tagihan (Khusus Jatuh Tempo)
    // ============================================
    const checkJatuhTempo = async () => {
        try {
            const { Pelanggan, Paket, Notifikasi, Tagihan } = require('./models');
            const { Op } = require('sequelize');

            const today = new Date();
            const todayUTC = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
            const todayDate = new Date(todayUTC);

            const todayYear = todayDate.getUTCFullYear();
            const todayMonth = todayDate.getUTCMonth();

            console.log(`\n [${new Date().toLocaleString('id-ID')}] Memulai pengecekan jatuh tempo harian...`);

            // 0. PEMBERSIHAN TAGIHAN PREMATUR (BELUM MASUK H-10) SECARA GLOBAL
            try {
                const prematurTagihans = await Tagihan.findAll({
                    where: {
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
                        console.log(` [CRON] Menghapus tagihan prematur ${t.ID_TRANSAKSI} karena belum memasuki H-10.`);
                        await t.destroy();
                    }
                }
            } catch (purgeErr) {
                console.error("Gagal membersihkan tagihan prematur secara global di cron:", purgeErr);
            }

            // Ambil semua pelanggan aktif yang memiliki Paket
            const pelangganList = await Pelanggan.findAll({
                where: {
                    STATUS_PELANGGAN: 'aktif',
                    ID_PAKET: { [Op.ne]: null }
                },
                include: [{ model: Paket }]
            });

            console.log(` Ditemukan ${pelangganList.length} pelanggan aktif.`);

            for (const pelanggan of pelangganList) {
                const aktivasi = new Date(pelanggan.TANGGAL_AKTIVASI);
                const tanggalAktivasi = aktivasi.getUTCDate();

                // Kita hitung kemungkinan jatuh tempo di siklus bulan ini dan siklus bulan depan
                // untuk mengatasi pergeseran tanggal/bulan secara aman (misal akhir bulan).
                const targetMonths = [todayMonth, todayMonth + 1];

                for (const targetMonth of targetMonths) {
                    // 1. Jatuh tempo (Due Date) adalah tepat pada tanggal anniversary (tanggal aktivasi di bulan target)
                    const jatuhTempo = new Date(Date.UTC(todayYear, targetMonth, tanggalAktivasi));

                    // Pastikan jatuh tempo terjadi setelah tanggal aktivasi asli
                    if (jatuhTempo <= aktivasi) {
                        continue;
                    }

                    // --- LOGIKA AUTO-GENERATE TAGIHAN (H-10) ---
                    const triggerDate = new Date(jatuhTempo);
                    triggerDate.setUTCDate(triggerDate.getUTCDate() - 10);

                    if (todayDate >= triggerDate) {
                        const billingMonth = jatuhTempo.getUTCMonth() + 1;
                        const billingYear = jatuhTempo.getUTCFullYear();

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
                            console.log(` Auto-generate tagihan berhasil untuk ${pelanggan.NAMA_PELANGGAN} periode ${billingMonth}/${billingYear}.`);
                        }
                    }
                    // ------------------------------------------

                    // 2. Hitung selisih hari antara jatuh tempo dan hari ini dalam UTC
                    const diffInTime = jatuhTempo.getTime() - todayDate.getTime();
                    const diffInDays = Math.round(diffInTime / (1000 * 60 * 60 * 24));

                    // Cocokkan hari H jatuh tempo
                    if (diffInDays >= 0 && diffInDays <= 6) {
                        // Cek apakah ada tagihan yang belum lunas untuk siklus/bulan ini
                        const billingMonth = jatuhTempo.getUTCMonth() + 1;
                        const billingYear = jatuhTempo.getUTCFullYear();
                        const unpaidBill = await Tagihan.findOne({
                            where: {
                                ID_PELANGGAN: pelanggan.ID_PELANGGAN,
                                BULAN_TAGIHAN: billingMonth,
                                TAHUN_TAGIHAN: billingYear,
                                STATUS_PEMBAYARAN: {
                                    [Op.ne]: 'berhasil'
                                }
                            }
                        });

                        if (!unpaidBill) {
                            console.log(` Pelanggan ${pelanggan.NAMA_PELANGGAN} tidak memiliki tagihan aktif/belum lunas untuk bulan ${billingMonth}/${billingYear}. Push notifikasi dibatalkan.`);
                            continue;
                        }

                        const tanggalJTFormatted = jatuhTempo.toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            timeZone: 'UTC'
                        });

                        const sisaHariText = diffInDays === 0
                            ? "HARI INI"
                            : `${diffInDays} hari lagi`;

                        console.log(` [NOTIF JATUH TEMPO] Pelanggan ${pelanggan.NAMA_PELANGGAN} jatuh tempo pada ${tanggalJTFormatted} (${sisaHariText}).`);

                        // Cek apakah sudah pernah kirim notifikasi jatuh tempo
                        const todayStart = new Date(todayYear, todayMonth, todayDate.getUTCDate(), 0, 0, 0);
                        const todayEnd = new Date(todayYear, todayMonth, todayDate.getUTCDate(), 23, 59, 59);

                        const alreadySent = await Notifikasi.findOne({
                            where: {
                                ID_PELANGGAN: pelanggan.ID_PELANGGAN,
                                KATEGORI_NOTIFIKASI: 'jatuh tempo',
                                TANGGAL_NOTIFIKASI: { [Op.between]: [todayStart, todayEnd] }
                            }
                        });

                        if (alreadySent) {
                            console.log(`  Notifikasi jatuh tempo hari ini untuk ${pelanggan.NAMA_PELANGGAN} sudah dikirim.`);
                            continue;
                        }

                        const hargaPaket = pelanggan.Paket ? Number(pelanggan.Paket.HARGA_PAKET).toLocaleString('id-ID') : '0';
                        const namaPaket = pelanggan.Paket ? pelanggan.Paket.NAMA_PAKET : 'Layanan';

                        const judul = diffInDays === 0
                            ? ' Tagihan Jatuh Tempo HARI INI!'
                            : ` Pengingat Tagihan: ${diffInDays} Hari Lagi Jatuh Tempo`;

                        const bodyText = diffInDays === 0
                            ? `Tagihan paket ${namaPaket} Anda sebesar Rp ${hargaPaket} jatuh tempo HARI INI (${tanggalJTFormatted}). Mohon segera lakukan pembayaran.`
                            : `Tagihan paket ${namaPaket} Anda sebesar Rp ${hargaPaket} akan jatuh tempo dalam ${diffInDays} hari (${tanggalJTFormatted}). Mohon persiapkan pembayaran Anda.`;

                        // 1. Kirim Push Notification FCM ke device (walau tidak login)
                        if (pelanggan.FCM_TOKEN) {
                            const message = {
                                notification: {
                                    title: judul,
                                    body: bodyText
                                },
                                token: pelanggan.FCM_TOKEN,
                                data: {
                                    kategori: 'jatuh tempo',
                                    id_pelanggan: String(pelanggan.ID_PELANGGAN)
                                }
                            };

                            admin.messaging().send(message)
                                .then((response) => {
                                    console.log(`Push notification berhasil dikirim ke ${pelanggan.NAMA_PELANGGAN}:`, response);
                                })
                                .catch((error) => {
                                    console.error(`Gagal mengirim push notification ke ${pelanggan.NAMA_PELANGGAN}:`, error.message);
                                });
                        }

                        // 2. Buat record notifikasi di database
                        await Notifikasi.create({
                            ID_PELANGGAN: pelanggan.ID_PELANGGAN,
                            JUDUL: judul,
                            DESKRIPSI_PESAN: bodyText,
                            KATEGORI_NOTIFIKASI: 'jatuh tempo',
                            TANGGAL_NOTIFIKASI: new Date()
                        });

                        console.log(`   📨 Record notifikasi disimpan di database.`);
                    }
                }
            }

            console.log(` Selesai mengecek jatuh tempo.\n`);
        } catch (error) {
            console.error(" Error pada fungsi checkJatuhTempo:", error);
        }
    };

    // Jalankan setiap 24 jam (86400000 ms)
    setInterval(checkJatuhTempo, 24 * 60 * 60 * 1000);

    // Jalankan sekali saat server start
    checkJatuhTempo();
});