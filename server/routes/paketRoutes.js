const express = require('express');
const router = express.Router();
const { Paket } = require('../models');
// const verifyToken = require('../middleware/authMiddleware');

// API untuk mengambil data katalog paket
router.get('/', async (req, res) => {
    try {
        const paket = await Paket.findAll({
            attributes: ['ID_PAKET', 'NAMA_PAKET', 'HARGA_PAKET']
        });
        res.json(paket);
    } catch (err) {
        res.status(500).json({ message: "Gagal mengambil data paket", error: err.message });
    }
});

// POST /api/paket - Tambah paket baru (Khusus staff/owner) - Tidak digunakan
// router.post('/', verifyToken, async (req, res) => {
//     try {
//         const { NAMA_PAKET, HARGA_PAKET } = req.body;
//         if (!NAMA_PAKET || HARGA_PAKET === undefined) {
//             return res.status(400).json({ message: "Nama paket dan harga paket wajib diisi." });
//         }
//         const newPaket = await Paket.create({
//             NAMA_PAKET,
//             HARGA_PAKET: parseFloat(HARGA_PAKET)
//         });
//         res.status(201).json({ message: "Paket berhasil ditambahkan.", paket: newPaket });
//     } catch (err) {
//         console.error("Error creating package:", err);
//         res.status(500).json({ message: "Gagal membuat paket baru", error: err.message });
//     }
// });

// PUT /api/paket/:id - Edit paket (Khusus staff/owner) - Tidak digunakan
// router.put('/:id', verifyToken, async (req, res) => {
//     try {
//         const { id } = req.params;
//         const { NAMA_PAKET, HARGA_PAKET } = req.body;
//         const paket = await Paket.findByPk(id);
//         if (!paket) {
//             return res.status(404).json({ message: "Paket tidak ditemukan." });
//         }
//         await paket.update({
//             NAMA_PAKET: NAMA_PAKET !== undefined ? NAMA_PAKET : paket.NAMA_PAKET,
//             HARGA_PAKET: HARGA_PAKET !== undefined ? parseFloat(HARGA_PAKET) : paket.HARGA_PAKET
//         });
//         res.json({ message: "Paket berhasil diperbarui.", paket });
//     } catch (err) {
//         console.error("Error updating package:", err);
//         res.status(500).json({ message: "Gagal memperbarui paket", error: err.message });
//     }
// });

// DELETE /api/paket/:id - Hapus paket (Khusus staff/owner) - Tidak digunakan
// router.delete('/:id', verifyToken, async (req, res) => {
//     try {
//         const { id } = req.params;
//         const paket = await Paket.findByPk(id);
//         if (!paket) {
//             return res.status(404).json({ message: "Paket tidak ditemukan." });
//         }
//         await paket.destroy();
//         res.json({ message: "Paket berhasil dihapus." });
//     } catch (err) {
//         console.error("Error deleting package:", err);
//         res.status(500).json({ message: "Gagal menghapus paket", error: err.message });
//     }
// });

module.exports = router;