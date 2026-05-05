const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { Aduan, Notifikasi } = require('../models');
const verifyToken = require('../middleware/authMiddleware');

// Konfigurasi Multer untuk upload foto
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'aduan-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // Max 5MB
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Hanya file gambar (JPG, JPEG, PNG) yang diperbolehkan!'));
        }
    }
});

// ============================================
// POST /api/aduan
// Buat aduan baru
// ============================================
router.post('/', verifyToken, upload.single('foto'), async (req, res) => {
    try {
        const id_pelanggan = req.user.id;
        const { subjek, deskripsi } = req.body;

        if (!subjek || !deskripsi) {
            return res.status(400).json({ message: 'Judul keluhan dan deskripsi wajib diisi.' });
        }

        let fotoUrl = null;
        if (req.file) {
            fotoUrl = `/uploads/${req.file.filename}`;
        }

        const aduan = await Aduan.create({
            ID_PELANGGAN: id_pelanggan,
            SUBJEK: subjek,
            DESKRIPSI_MASALAH: deskripsi,
            FOTO_KENDALA: fotoUrl,
            STATUS_ADUAN: 'pending',
            TANGGAL_ADUAN: new Date()
        });

        // Buat Notifikasi
        await Notifikasi.create({
            ID_PELANGGAN: id_pelanggan,
            JUDUL: 'Aduan Berhasil Diajukan',
            DESKRIPSI_PESAN: `Aduan mengenai "${subjek}" telah berhasil diajukan dan sedang menunggu konfirmasi admin.`,
            KATEGORI_NOTIFIKASI: 'aduan',
            TANGGAL_NOTIFIKASI: new Date()
        });

        res.status(201).json({
            message: 'Aduan berhasil diajukan.',
            aduan: aduan
        });

    } catch (err) {
        console.error('Error submit aduan:', err);
        res.status(500).json({ message: 'Gagal mengajukan aduan.', error: err.message });
    }
});

// ============================================
// GET /api/aduan/riwayat
// Ambil 5 riwayat aduan terakhir
// ============================================
router.get('/riwayat', verifyToken, async (req, res) => {
    try {
        const id_pelanggan = req.user.id;

        const riwayat = await Aduan.findAll({
            where: { ID_PELANGGAN: id_pelanggan },
            order: [['TANGGAL_ADUAN', 'DESC']],
            limit: 5
        });

        res.json(riwayat);
    } catch (err) {
        console.error('Error get riwayat aduan:', err);
        res.status(500).json({ message: 'Gagal mengambil riwayat aduan.', error: err.message });
    }
});

module.exports = router;
