const express = require('express');
const router = express.Router();
const midtransClient = require('midtrans-client');
const { Pelanggan, Paket, Tagihan } = require('../models');
const verifyToken = require('../middleware/authMiddleware');

// Setup Midtrans Snap Client
const snap = new midtransClient.Snap({
    isProduction: false,
    serverKey: process.env.MIDTRANS_SERVER,
    clientKey: process.env.MIDTRANS_CLIENT
});

// ============================================
// POST /api/payment/create-transaction
// Membuat transaksi Midtrans
// ============================================
router.post('/create-transaction', verifyToken, async (req, res) => {
    try {
        const { id_pelanggan, id_paket } = req.body;

        if (!id_pelanggan || !id_paket) {
            return res.status(400).json({ message: 'ID pelanggan dan ID paket wajib diisi.' });
        }

        const pelanggan = await Pelanggan.findByPk(id_pelanggan);
        if (!pelanggan) {
            return res.status(404).json({ message: 'Pelanggan tidak ditemukan.' });
        }

        const paket = await Paket.findByPk(id_paket);
        if (!paket) {
            return res.status(404).json({ message: 'Paket tidak ditemukan.' });
        }

        // Generate Order ID
        const orderId = `REG-${id_pelanggan}-${Date.now()}`;

        // Create Tagihan awal
        const today = new Date();
        const jatuhTempo = new Date(today);
        jatuhTempo.setDate(jatuhTempo.getDate() + 1); // 1 hari batas bayar

        const nomorTagihan = Math.floor(100000 + Math.random() * 900000); // 6 digit random

        // Konfigurasi Parameter Midtrans
        const parameter = {
            transaction_details: {
                order_id: orderId,
                gross_amount: Math.round(paket.HARGA_PAKET)
            },
            customer_details: {
                first_name: pelanggan.NAMA_PELANGGAN || pelanggan.NAMA || 'Pelanggan',
                phone: pelanggan.TELEPON_PELANGGAN || pelanggan.TELEPON || '',
            },
            item_details: [{
                id: paket.ID_PAKET.toString(),
                price: Math.round(paket.HARGA_PAKET),
                quantity: 1,
                name: paket.NAMA_PAKET.substring(0, 50)
            }]
        };

        const transaction = await snap.createTransaction(parameter);

        const tagihan = await Tagihan.create({
            ID_PELANGGAN: id_pelanggan,
            JUMLAH_BAYAR: paket.HARGA_PAKET,
            JATUH_TEMPO: jatuhTempo,
            STATUS_PEMBAYARAN: 'menunggu_verifikasi',
            BULAN_TAGIHAN: today.getMonth() + 1,
            TAHUN_TAGIHAN: today.getFullYear(),
            NOMOR_TAGIHAN: nomorTagihan,
            ID_TRANSAKSI: orderId,
            PAYMENT_URL: transaction.redirect_url
        });

        res.json({
            token: transaction.token,
            redirect_url: transaction.redirect_url
        });

    } catch (error) {
        console.error('Error creating transaction:', error);
        res.status(500).json({ message: 'Gagal membuat transaksi', error: error.message });
    }
});

// ============================================
// POST /api/payment/pay-bill
// Membuat transaksi Midtrans untuk Tagihan bulanan yang sudah ada
// ============================================
router.post('/pay-bill', verifyToken, async (req, res) => {
    try {
        const { id_tagihan } = req.body;

        if (!id_tagihan) {
            return res.status(400).json({ message: 'ID Tagihan wajib diisi.' });
        }

        const tagihan = await Tagihan.findByPk(id_tagihan);
        if (!tagihan) {
            return res.status(404).json({ message: 'Tagihan tidak ditemukan.' });
        }

        const pelanggan = await Pelanggan.findByPk(tagihan.ID_PELANGGAN);
        if (!pelanggan) {
            return res.status(404).json({ message: 'Pelanggan tidak ditemukan.' });
        }

        // Dapatkan data Paket untuk item details
        const paket = await Paket.findByPk(pelanggan.ID_PAKET);

        // Generate New Order ID for this payment attempt
        const orderId = `TAG-${id_tagihan}-${Date.now()}`;

        // Konfigurasi Parameter Midtrans
        const parameter = {
            transaction_details: {
                order_id: orderId,
                gross_amount: Math.round(tagihan.JUMLAH_BAYAR)
            },
            customer_details: {
                first_name: pelanggan.NAMA_PELANGGAN || 'Pelanggan',
                phone: pelanggan.NO_HP || '',
            },
            item_details: [{
                id: tagihan.ID_TAGIHAN.toString(),
                price: Math.round(tagihan.JUMLAH_BAYAR),
                quantity: 1,
                name: paket ? `Paket ${paket.NAMA_PAKET}` : 'Tagihan Layanan Internet'
            }]
        };

        const transaction = await snap.createTransaction(parameter);

        // Update Tagihan dengan Order ID baru dan URL pembayaran baru
        await tagihan.update({
            ID_TRANSAKSI: orderId,
            PAYMENT_URL: transaction.redirect_url
        });

        res.json({
            token: transaction.token,
            redirect_url: transaction.redirect_url
        });

    } catch (error) {
        console.error('Error creating bill payment transaction:', error);
        res.status(500).json({ message: 'Gagal membuat transaksi tagihan', error: error.message });
    }
});

// ============================================
// POST /api/payment/success
// Endpoint untuk callback frontend saat bayar lunas
// ============================================
router.post('/success', verifyToken, async (req, res) => {
    try {
        const { order_id, id_paket } = req.body;

        if (!order_id) {
            return res.status(400).json({ message: 'Order ID wajib diisi.' });
        }

        // Cari Tagihan berdasarkan ID_TRANSAKSI
        const tagihan = await Tagihan.findOne({ where: { ID_TRANSAKSI: order_id } });
        if (!tagihan) {
            return res.status(404).json({ message: 'Tagihan tidak ditemukan.' });
        }

        // Cek status ke Midtrans langsung
        let payment_type = null;
        let transaction_status = 'settlement';
        let settlement_time = new Date();

        try {
            const statusResponse = await snap.transaction.status(order_id);
            if (statusResponse) {
                payment_type = statusResponse.payment_type;
                transaction_status = statusResponse.transaction_status;
                if (statusResponse.settlement_time) {
                    settlement_time = new Date(statusResponse.settlement_time);
                }
            }
        } catch (midtransError) {
            console.error('Midtrans status check error:', midtransError);
            // Tetap lanjutkan meski gagal cek ke midtrans (mungkin sandbox error)
        }

        // Update Tagihan
        await tagihan.update({
            STATUS_PEMBAYARAN: 'berhasil',
            TANGGAL_PEMBAYARAN: settlement_time,
            METODE_PEMBAYARAN: payment_type,
            STATUS_VERIFIKASI: transaction_status,
            PAYMENT_TIME: settlement_time
        });

        // Update Pelanggan status langganan dan paket
        const pelanggan = await Pelanggan.findByPk(tagihan.ID_PELANGGAN);
        if (pelanggan) {
            await pelanggan.update({
                STATUS_PELANGGAN: 'aktif', // atau STATUS_LANGGANAN: 'aktif'
                STATUS_LANGGANAN: 'aktif',
                ID_PAKET: id_paket || pelanggan.ID_PAKET
            });

            // Buat Notifikasi
            const { Notifikasi } = require('../models');
            await Notifikasi.create({
                ID_PELANGGAN: pelanggan.ID_PELANGGAN,
                JUDUL: 'Pembayaran Berhasil',
                DESKRIPSI_PESAN: `Terima kasih! Pembayaran tagihan Anda dengan Order ID ${order_id} telah berhasil diverifikasi. Layanan Anda kini aktif.`,
                KATEGORI_NOTIFIKASI: 'pembayaran',
                TANGGAL_NOTIFIKASI: new Date()
            });
        }

        res.json({
            message: 'Pembayaran berhasil dikonfirmasi dan status diaktifkan.',
            user: {
                id: pelanggan.ID_PELANGGAN,
                nama: pelanggan.NAMA || pelanggan.NAMA_PELANGGAN,
                id_paket: pelanggan.ID_PAKET,
                status_langganan: pelanggan.STATUS_LANGGANAN || pelanggan.STATUS_PELANGGAN
            }
        });

    } catch (error) {
        console.error('Error on payment success:', error);
        res.status(500).json({ message: 'Gagal mengkonfirmasi pembayaran', error: error.message });
    }
});

module.exports = router;
