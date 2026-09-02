const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Pelanggan = require('./Pelanggan');

const Aduan = sequelize.define('Aduan', {
    ID_ADUAN: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    ID_PELANGGAN: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Pelanggan,
            key: 'ID_PELANGGAN'
        }
    },
    SUBJEK: {
        type: DataTypes.STRING(300),
        allowNull: false
    },
    DESKRIPSI_MASALAH: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    FOTO_KENDALA: {
        type: DataTypes.STRING(500),
        allowNull: true
    },
    STATUS_ADUAN: {
        type: DataTypes.ENUM('pending', 'proses', 'selesai', 'pengajuan ulang'),
        defaultValue: 'pending'
    },
    TANGGAL_ADUAN: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'aduan',
    timestamps: false
});

module.exports = Aduan;
