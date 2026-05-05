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
        console.log('✅ Koneksi ke Database MySQL Berhasil (Sequelize)!');

        // Sync model
        await sequelize.sync({ alter: false });
        console.log('✅ Sinkronisasi Model Sequelize Berhasil!');
    } catch (err) {
        console.error('❌ Koneksi Database Gagal:', err.message);
    }
}
testConnection();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server berjalan di http://localhost:${PORT}`);

    const admin = require("firebase-admin");
    const serviceAccount = require("./config/serviceAccountKey.json");

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });

    // ============================================
    // PUSH NOTIFICATION: Cek Jatuh Tempo Tagihan (Khusus Jatuh Tempo)
    // Jatuh tempo dihitung sebulan setelah tanggal aktivasi minus 3 hari.
    // ============================================
    const checkJatuhTempo = async () => {
        try {
            const { Pelanggan, Paket, Notifikasi } = require('./models');
            const { Op } = require('sequelize');

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const todayYear = today.getFullYear();
            const todayMonth = today.getMonth();
            const todayDate = today.getDate();

            console.log(`\n📅 [${new Date().toLocaleString('id-ID')}] Memulai pengecekan jatuh tempo harian...`);

            // Ambil semua pelanggan aktif yang memiliki Paket dan FCM Token
            const pelangganList = await Pelanggan.findAll({
                where: {
                    STATUS_PELANGGAN: 'aktif',
                    ID_PAKET: { [Op.ne]: null },
                    FCM_TOKEN: { [Op.ne]: null }
                },
                include: [{ model: Paket }]
            });

            console.log(`👥 Ditemukan ${pelangganList.length} pelanggan aktif dengan FCM token.`);

            for (const pelanggan of pelangganList) {
                const aktivasi = new Date(pelanggan.TANGGAL_AKTIVASI);
                const tanggalAktivasi = aktivasi.getDate();

                // Kita hitung kemungkinan jatuh tempo di siklus bulan ini dan siklus bulan depan
                // untuk mengatasi pergeseran tanggal/bulan secara aman (misal akhir bulan).
                const targetMonths = [todayMonth, todayMonth + 1];

                for (const targetMonth of targetMonths) {
                    // 1. Dapatkan tanggal anniversary (tanggal aktivasi di bulan target)
                    const anniversaryDate = new Date(todayYear, targetMonth, tanggalAktivasi);

                    // 2. Jatuh tempo = tanggal anniversary dikurangi 3 hari
                    const jatuhTempo = new Date(anniversaryDate);
                    jatuhTempo.setDate(jatuhTempo.getDate() - 3);
                    jatuhTempo.setHours(0, 0, 0, 0);

                    // Pastikan jatuh tempo terjadi setelah tanggal aktivasi asli
                    if (jatuhTempo <= aktivasi) {
                        continue;
                    }

                    // Cocokkan apakah hari ini adalah hari H jatuh tempo tersebut
                    if (jatuhTempo.getTime() === today.getTime()) {
                        const tanggalJTFormatted = jatuhTempo.toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                        });

                        console.log(`⏰ [HARI H] Pelanggan ${pelanggan.NAMA_PELANGGAN} memasuki jatuh tempo hari ini: ${tanggalJTFormatted}`);

                        // Cek apakah sudah pernah kirim notifikasi jatuh tempo hari ini agar tidak double
                        const todayStart = new Date(todayYear, todayMonth, todayDate, 0, 0, 0);
                        const todayEnd = new Date(todayYear, todayMonth, todayDate, 23, 59, 59);

                        const alreadySent = await Notifikasi.findOne({
                            where: {
                                ID_PELANGGAN: pelanggan.ID_PELANGGAN,
                                KATEGORI_NOTIFIKASI: 'jatuh tempo',
                                TANGGAL_NOTIFIKASI: { [Op.between]: [todayStart, todayEnd] }
                            }
                        });

                        if (alreadySent) {
                            console.log(`   ⏭️  Notifikasi jatuh tempo hari ini untuk ${pelanggan.NAMA_PELANGGAN} sudah dikirim. Skip.`);
                            continue;
                        }

                        const hargaPaket = pelanggan.Paket ? Number(pelanggan.Paket.HARGA_PAKET).toLocaleString('id-ID') : '0';
                        const namaPaket = pelanggan.Paket ? pelanggan.Paket.NAMA_PAKET : 'Layanan';

                        const judul = '⚠️ Tagihan Jatuh Tempo Hari Ini!';
                        const bodyText = `Tagihan paket ${namaPaket} Anda sebesar Rp ${hargaPaket} jatuh tempo HARI INI (${tanggalJTFormatted}). Mohon segera lakukan pembayaran.`;

                        // 1. Kirim Push Notification FCM ke device (walau tidak login)
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
                                console.log(`   ✅ Push notification berhasil dikirim ke ${pelanggan.NAMA_PELANGGAN}:`, response);
                            })
                            .catch((error) => {
                                console.error(`   ❌ Gagal mengirim push notification ke ${pelanggan.NAMA_PELANGGAN}:`, error.message);
                            });

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

            console.log(`✅ Selesai mengecek jatuh tempo.\n`);
        } catch (error) {
            console.error("❌ Error pada fungsi checkJatuhTempo:", error);
        }
    };

    // Jalankan setiap 24 jam (86400000 ms)
    setInterval(checkJatuhTempo, 24 * 60 * 60 * 1000);

    // Jalankan sekali saat server start
    checkJatuhTempo();
});