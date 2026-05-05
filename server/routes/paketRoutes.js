const express = require('express');
const router = express.Router();
const { Paket } = require('../models');

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

module.exports = router;