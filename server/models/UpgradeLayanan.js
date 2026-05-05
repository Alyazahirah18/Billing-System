const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const UpgradeLayanan = sequelize.define('UpgradeLayanan', {
    ID_UPGRADE: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    ID_PAKET_BARU: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    STATUS_UPGRADE: {
        type: DataTypes.ENUM('pending', 'berhasil', 'ditolak'),
        defaultValue: 'pending',
        allowNull: false
    },
    TANGGAL_REQUEST: {
        type: DataTypes.DATE,
        allowNull: true
    },
    TANGGAL_COMPLETE: {
        type: DataTypes.DATE,
        allowNull: true
    },
    ID_PELANGGAN: {
        type: DataTypes.INTEGER,
        allowNull: true
    }
}, {
    tableName: 'upgrade_layanan',
    timestamps: false
});

module.exports = UpgradeLayanan;
