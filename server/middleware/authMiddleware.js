const jwt = require('jsonwebtoken');
require('dotenv').config();

// Middleware untuk verifikasi JWT token
const verifyToken = (req, res, next) => {
    // Ambil token dari header Authorization: Bearer <token>
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Akses ditolak. Token tidak ditemukan.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // { id, nama, status_langganan }
        next();
    } catch (err) {
        return res.status(403).json({ message: 'Token tidak valid atau sudah expired.' });
    }
};

module.exports = verifyToken;
