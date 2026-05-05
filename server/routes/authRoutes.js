const express = require('express');
const router = express.Router();
const { Pelanggan, Pegawai } = require('../models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const verifyToken = require('../middleware/authMiddleware');
require('dotenv').config();

// Helper to generate KODE_PELANGGAN (format: SGP + random number, atau sesuai kebutuhan)
const generateKodePelanggan = async () => {
    // Cari kode pelanggan terakhir
    const lastPelanggan = await Pelanggan.findOne({
        order: [['ID_PELANGGAN', 'DESC']],
        attributes: ['KODE_PELANGGAN']
    });

    let newNumber = 1;
    if (lastPelanggan && lastPelanggan.KODE_PELANGGAN) {
        const lastCode = lastPelanggan.KODE_PELANGGAN;
        // Extract angka dari kode (contoh: SGP123 -> 123)
        const match = lastCode.match(/\d+$/);
        if (match) {
            newNumber = parseInt(match[0]) + 1;
        }
    }

    // Format: SGP + 3 digit angka (SGP001, SGP002, dll)
    const kodePelanggan = `SGP${newNumber.toString().padStart(3, '0')}`;
    return kodePelanggan;
};

// ============================================
// POST /api/auth/register
// Registrasi calon pelanggan
// ============================================
router.post('/register', async (req, res) => {
    try {
        const { nama, PASSWORD, NO_HP, alamat, alamat_wilayah } = req.body;

        console.log('Received registration data:', { nama, NO_HP, alamat, alamat_wilayah });

        // Validasi input
        if (!nama || !PASSWORD || !NO_HP || !alamat) {
            return res.status(400).json({ message: 'Nama, password, nomor telepon, dan alamat wajib diisi.' });
        }

        // Cek apakah nomor telepon sudah terdaftar
        const existing = await Pelanggan.findOne({ where: { NO_HP: NO_HP } });

        if (existing) {
            return res.status(409).json({ message: 'Nomor telepon sudah terdaftar.' });
        }

        // Hash password dengan bcryptjs
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(PASSWORD, salt);

        console.log('Password hashed successfully');

        const kodePelanggan = await generateKodePelanggan();
        console.log('Generated KODE_PELANGGAN:', kodePelanggan);

        // Simpan ke database dengan status 'calon'
        const newPelanggan = await Pelanggan.create({
            NAMA_PELANGGAN: nama,
            PASSWORD: hashedPassword,
            NO_HP: NO_HP,
            ALAMAT: alamat,
            ALAMAT_WILAYAH: alamat_wilayah || null,
            STATUS_PELANGGAN: 'calon',
            KODE_PELANGGAN: kodePelanggan,
            TANGGAL_AKTIVASI: new Date(),
            ID_PAKET: null // Default null untuk calon pelanggan
        });

        console.log('User created with ID:', newPelanggan.ID_PELANGGAN);

        // Generate JWT token
        const token = jwt.sign(
            {
                id: newPelanggan.ID_PELANGGAN,
                nama: newPelanggan.NAMA_PELANGGAN,
                status_langganan: newPelanggan.STATUS_PELANGGAN
            },
            process.env.JWT_SECRET || 'secret_key',
            { expiresIn: '24h' }
        );

        // Return user data (tanpa password) untuk auto-login di frontend
        res.status(201).json({
            message: 'Registrasi berhasil!',
            token,
            user: {
                id: newPelanggan.ID_PELANGGAN,
                nama: newPelanggan.NAMA_PELANGGAN,
                NO_HP: newPelanggan.NO_HP,
                alamat: newPelanggan.ALAMAT,
                alamat_wilayah: newPelanggan.ALAMAT_WILAYAH,
                status_langganan: newPelanggan.STATUS_PELANGGAN,
                kode_pelanggan: newPelanggan.KODE_PELANGGAN,
                id_paket: newPelanggan.ID_PAKET
            }
        });

    } catch (err) {
        console.error('Error registrasi:', err);
        res.status(500).json({ message: 'Gagal melakukan registrasi.', error: err.message });
    }
});

// ============================================
// POST /api/auth/login
// Login pelanggan (calon & aktif)
// ============================================
router.post('/login', async (req, res) => {
    try {
        const { NO_HP, PASSWORD } = req.body;

        console.log('Login attempt for NO_HP:', NO_HP);

        // Validasi input
        if (!NO_HP || !PASSWORD) {
            return res.status(400).json({ message: 'Nomor telepon dan password wajib diisi.' });
        }

        // Cari pelanggan berdasarkan nomor telepon
        const pelanggan = await Pelanggan.findOne({ where: { NO_HP: NO_HP } });

        if (!pelanggan) {
            console.log('User not found with NO_HP:', NO_HP);
            return res.status(401).json({ message: 'Nomor telepon tidak ditemukan.' });
        }

        console.log('User found:', pelanggan.NAMA_PELANGGAN);
        console.log('Stored password type:', typeof pelanggan.PASSWORD);
        console.log('Stored password length:', pelanggan.PASSWORD ? pelanggan.PASSWORD.length : 0);

        let isMatch = false;

        // Cek apakah password di database sudah dalam bentuk hash (bcrypt) atau masih plain text
        // Hash bcrypt biasanya diawali dengan '$2a$', '$2b$', atau '$2y$' dan panjangnya 60 karakter
        const isHashed = pelanggan.PASSWORD &&
            (pelanggan.PASSWORD.startsWith('$2a$') ||
                pelanggan.PASSWORD.startsWith('$2b$') ||
                pelanggan.PASSWORD.startsWith('$2y$'));

        if (isHashed) {
            // Password sudah di-hash, gunakan bcrypt compare
            console.log('Password is hashed, using bcrypt compare');
            isMatch = await bcrypt.compare(PASSWORD, pelanggan.PASSWORD);
        } else {
            // Password masih plain text (seperti data lama: 'alya123')
            console.log('Password is plain text, comparing directly');
            isMatch = (PASSWORD === pelanggan.PASSWORD);

            // Optional: Jika login berhasil dengan plain text, update ke hash untuk keamanan
            if (isMatch) {
                console.log('Migrating plain text password to hash');
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash(PASSWORD, salt);
                await pelanggan.update({ PASSWORD: hashedPassword });
                console.log('Password migrated to hash successfully');
            }
        }

        console.log('Password match result:', isMatch);

        if (!isMatch) {
            return res.status(401).json({ message: 'Password salah.' });
        }

        // Generate JWT token
        const token = jwt.sign(
            {
                id: pelanggan.ID_PELANGGAN,
                nama: pelanggan.NAMA_PELANGGAN,
                status_langganan: pelanggan.STATUS_PELANGGAN
            },
            process.env.JWT_SECRET || 'secret_key',
            { expiresIn: '24h' }
        );

        // Return user data (tanpa password)
        res.json({
            message: 'Login berhasil!',
            token,
            user: {
                id: pelanggan.ID_PELANGGAN,
                nama: pelanggan.NAMA_PELANGGAN,
                NO_HP: pelanggan.NO_HP,
                alamat: pelanggan.ALAMAT,
                alamat_wilayah: pelanggan.ALAMAT_WILAYAH,
                status_langganan: pelanggan.STATUS_PELANGGAN,
                kode_pelanggan: pelanggan.KODE_PELANGGAN,
                id_paket: pelanggan.ID_PAKET
            }
        });

    } catch (err) {
        console.error('Error login:', err);
        res.status(500).json({ message: 'Gagal melakukan login.', error: err.message });
    }
});

// ============================================
// POST /api/auth/staff-login
// Login untuk Admin, Teknisi, dan Owner
// ============================================
router.post('/staff-login', async (req, res) => {
    try {
        const { role, username, password } = req.body;

        if (!role || !username || !password) {
            return res.status(400).json({ message: 'Role, username, dan password wajib diisi.' });
        }

        const validRole = role.toLowerCase();

        // Cari pegawai yang username dan role-nya cocok
        const pegawai = await Pegawai.findOne({ where: { USERNAME: username, ROLE: validRole } });

        if (!pegawai) {
            return res.status(401).json({ message: 'Username, role, atau password salah.' });
        }

        // Cek password (bisa bcrypt, bisa plain text)
        let isMatch = false;
        const isHashed = pegawai.PASSWORD && (
            pegawai.PASSWORD.startsWith('$2a$') ||
            pegawai.PASSWORD.startsWith('$2b$') ||
            pegawai.PASSWORD.startsWith('$2y$')
        );

        if (isHashed) {
            isMatch = await bcrypt.compare(password, pegawai.PASSWORD);
        } else {
            isMatch = (password === pegawai.PASSWORD);
        }

        if (!isMatch) {
            return res.status(401).json({ message: 'Password salah.' });
        }

        // Generate JWT token
        const token = jwt.sign(
            {
                id: `pegawai-${pegawai.ID_PEGAWAI}`,
                id_asli: pegawai.ID_PEGAWAI,
                nama: pegawai.NAMA,
                role: validRole,
                isStaff: true
            },
            process.env.JWT_SECRET || 'secret_key',
            { expiresIn: '24h' }
        );

        res.json({
            message: `Login berhasil sebagai ${pegawai.NAMA} (${validRole})`,
            token,
            user: {
                id: `pegawai-${pegawai.ID_PEGAWAI}`,
                id_asli: pegawai.ID_PEGAWAI,
                nama: pegawai.NAMA,
                role: validRole,
                isStaff: true
            }
        });

    } catch (err) {
        console.error('Error staff login:', err);
        res.status(500).json({ message: 'Gagal melakukan login staff.', error: err.message });
    }
});

// ============================================
// GET /api/auth/me
// Verifikasi token dan ambil data user
// ============================================
router.get('/me', verifyToken, async (req, res) => {
    try {
        if (req.user.isStaff) {
            return res.json({
                user: {
                    id: req.user.id,
                    nama: req.user.nama,
                    role: req.user.role,
                    isStaff: true
                }
            });
        }

        const pelanggan = await Pelanggan.findByPk(req.user.id, {
            attributes: { exclude: ['PASSWORD'] }
        });

        if (!pelanggan) {
            return res.status(404).json({ message: 'User tidak ditemukan.' });
        }

        res.json({
            user: {
                id: pelanggan.ID_PELANGGAN,
                nama: pelanggan.NAMA_PELANGGAN,
                NO_HP: pelanggan.NO_HP,
                alamat: pelanggan.ALAMAT,
                alamat_wilayah: pelanggan.ALAMAT_WILAYAH,
                status_langganan: pelanggan.STATUS_PELANGGAN,
                kode_pelanggan: pelanggan.KODE_PELANGGAN,
                id_paket: pelanggan.ID_PAKET
            }
        });
    } catch (err) {
        console.error('Error me:', err);
        res.status(500).json({ message: 'Gagal mengambil data user.', error: err.message });
    }
});

// ============================================
// GET /api/auth/wilayah
// Daftar wilayah untuk dropdown registrasi
// ============================================
router.get('/wilayah', (req, res) => {
    const wilayah = [
        'Batam Center',
        'Nagoya',
        'Batu Ampar',
        'Sekupang',
        'Bengkong',
        'Sagulung',
        'Batu Aji'
    ];
    res.json(wilayah);
});

// ============================================
// POST /api/auth/migrate-passwords
// Endpoint untuk migrasi password dari plain text ke hash (admin only)
// ============================================
router.post('/migrate-passwords', async (req, res) => {
    try {
        const allPelanggan = await Pelanggan.findAll();
        let migrated = 0;

        for (const pelanggan of allPelanggan) {
            // Cek apakah password masih plain text (bukan hash bcrypt)
            const isHashed = pelanggan.PASSWORD &&
                (pelanggan.PASSWORD.startsWith('$2a$') ||
                    pelanggan.PASSWORD.startsWith('$2b$') ||
                    pelanggan.PASSWORD.startsWith('$2y$'));

            if (!isHashed && pelanggan.PASSWORD) {
                console.log(`Migrating password for user: ${pelanggan.NAMA_PELANGGAN}`);
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash(pelanggan.PASSWORD, salt);
                await pelanggan.update({ PASSWORD: hashedPassword });
                migrated++;
            }
        }

        res.json({
            message: `Migrasi selesai. ${migrated} password berhasil di-hash.`,
            total_migrated: migrated
        });
    } catch (err) {
        console.error('Error migrating passwords:', err);
        res.status(500).json({ message: 'Gagal migrasi password', error: err.message });
    }
});

// ============================================
// POST /api/auth/save-fcm-token
// Simpan Token FCM pelanggan untuk Push Notification
// ============================================
router.post('/save-fcm-token', verifyToken, async (req, res) => {
    try {
        const { fcm_token } = req.body;
        const id_pelanggan = req.user.id;

        if (req.user.isStaff) {
            return res.status(400).json({ message: 'FCM token hanya untuk pelanggan.' });
        }

        if (!fcm_token) {
            return res.status(400).json({ message: 'Token FCM tidak boleh kosong.' });
        }

        await Pelanggan.update({ FCM_TOKEN: fcm_token }, { where: { ID_PELANGGAN: id_pelanggan } });

        res.json({ message: 'Token FCM berhasil disimpan.' });
    } catch (err) {
        console.error('Error saving FCM token:', err);
        res.status(500).json({ message: 'Gagal menyimpan token FCM.', error: err.message });
    }
});

module.exports = router;