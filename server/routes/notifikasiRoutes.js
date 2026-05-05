const express = require('express');
const router = express.Router();
const { Notifikasi } = require('../models');
const verifyToken = require('../middleware/authMiddleware');

// ============================================
// GET /api/notifikasi
// Ambil semua notifikasi milik pelanggan yang login
// ============================================
router.get('/', verifyToken, async (req, res) => {
    try {
        const id_pelanggan = req.user.id;

        const notifications = await Notifikasi.findAll({
            where: { ID_PELANGGAN: id_pelanggan },
            order: [['TANGGAL_NOTIFIKASI', 'DESC']]
        });

        res.json(notifications);
    } catch (err) {
        console.error('Error fetching notifications:', err);
        res.status(500).json({ message: 'Gagal mengambil notifikasi.', error: err.message });
    }
});

// ============================================
// POST /api/notifikasi/mark-as-read
// Tandai satu atau semua notifikasi sebagai terbaca
// ============================================
router.post('/mark-as-read', verifyToken, async (req, res) => {
    try {
        const id_pelanggan = req.user.id;
        const { id_notifikasi } = req.body;

        if (id_notifikasi) {
            // Tandai satu
            await Notifikasi.update(
                { IS_READ: true },
                { where: { ID_NOTIFIKASI: id_notifikasi, ID_PELANGGAN: id_pelanggan } }
            );
        } else {
            // Tandai semua
            await Notifikasi.update(
                { IS_READ: true },
                { where: { ID_PELANGGAN: id_pelanggan, IS_READ: false } }
            );
        }

        res.json({ message: 'Notifikasi diperbarui.' });
    } catch (err) {
        console.error('Error marking notifications as read:', err);
        res.status(500).json({ message: 'Gagal memperbarui notifikasi.', error: err.message });
    }
});

// ============================================
// GET /api/notifikasi/unread-count
// Ambil jumlah notifikasi yang belum terbaca
// ============================================
router.get('/unread-count', verifyToken, async (req, res) => {
    try {
        const id_pelanggan = req.user.id;

        const count = await Notifikasi.count({
            where: { ID_PELANGGAN: id_pelanggan, IS_READ: false }
        });

        res.json({ unreadCount: count });
    } catch (err) {
        console.error('Error fetching unread count:', err);
        res.status(500).json({ message: 'Gagal mengambil jumlah notifikasi.', error: err.message });
    }
});

module.exports = router;
