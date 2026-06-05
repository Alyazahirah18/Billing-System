const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Paket = require('./Paket');

const Pelanggan = sequelize.define('Pelanggan', {
    ID_PELANGGAN: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    NAMA_PELANGGAN: {
        type: DataTypes.STRING(200),
        allowNull: false
    },
    ALAMAT: {
        type: DataTypes.STRING(200),
        allowNull: false
    },
    ALAMAT_WILAYAH: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    KODE_PELANGGAN: {
        type: DataTypes.STRING(10),
        allowNull: false,
        unique: true
    },
    NO_HP: {
        type: DataTypes.STRING(15),
        allowNull: false
    },
    PASSWORD: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    STATUS_PELANGGAN: {
        type: DataTypes.ENUM('calon', 'aktif'),
        defaultValue: 'calon'
    },
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
    timestamps: true,
    paranoid: true,
    createdAt: false,
    updatedAt: false,
    deletedAt: 'deletedAt'
});

module.exports = Pelanggan;