const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Paket = require('./Paket');

const Pelanggan = sequelize.define('Pelanggan', {
    ID_PELANGGAN: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    // Sesuai SQL: NAMA_PELANGGAN
    NAMA_PELANGGAN: {
        type: DataTypes.STRING(200),
        allowNull: false
    },
    // Sesuai SQL: ALAMAT
    ALAMAT: {
        type: DataTypes.STRING(200),
        allowNull: false
    },
    // Sesuai SQL: ALAMAT_WILAYAH
    ALAMAT_WILAYAH: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    // Sesuai SQL: KODE_PELANGGAN
    KODE_PELANGGAN: {
        type: DataTypes.STRING(10),
        allowNull: false,
        unique: true
    },
    // Sesuai SQL: NO_HP
    NO_HP: {
        type: DataTypes.STRING(15),
        allowNull: false
    },
    PASSWORD: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    // Sesuai SQL: STATUS_PELANGGAN
    STATUS_PELANGGAN: {
        type: DataTypes.ENUM('calon', 'aktif'),
        defaultValue: 'calon'
    },
    // Sesuai SQL: STATUS_LAYANAN
    STATUS_LAYANAN: {
        type: DataTypes.ENUM('aktif', 'blokir'),
        allowNull: true
    },
    ID_PAKET: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: Paket,
            key: 'ID_PAKET'
        }
    },
    // Sesuai SQL: TANGGAL_AKTIVASI
    TANGGAL_AKTIVASI: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    FCM_TOKEN: {
        type: DataTypes.STRING(255),
        allowNull: true
    }
}, {
    tableName: 'pelanggan',
    // Timestamps harus TRUE agar fitur paranoid (Soft Delete) aktif
    timestamps: true,
    // Paranoid mengaktifkan Soft Delete (data tidak benar-benar dihapus)
    paranoid: true,
    // Nonaktifkan kolom createdAt dan updatedAt jika tidak ada di tabel SQL Anda
    createdAt: false,
    updatedAt: false,
    // Menentukan nama kolom untuk soft delete sesuai di DB
    deletedAt: 'deletedAt'
});

module.exports = Pelanggan;