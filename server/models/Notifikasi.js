const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Notifikasi = sequelize.define('Notifikasi', {
    ID_NOTIFIKASI: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    RELATED_ID: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    ID_PELANGGAN: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    JUDUL: {
        type: DataTypes.STRING(200),
        allowNull: false
    },
    DESKRIPSI_PESAN: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    KATEGORI_NOTIFIKASI: {
        type: DataTypes.ENUM('pembayaran', 'upgrade', 'aduan', 'reschedule perbaikan', 'jadwal perbaikan', 'jatuh tempo'),
        allowNull: false
    },
    TANGGAL_NOTIFIKASI: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    IS_READ: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    tableName: 'notifikasi',
    timestamps: false
});

module.exports = Notifikasi;
