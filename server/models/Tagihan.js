const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Tagihan = sequelize.define('Tagihan', {
    ID_TAGIHAN: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    ID_PELANGGAN: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    JUMLAH_BAYAR: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false
    },
    JATUH_TEMPO: {
        type: DataTypes.DATE,
        allowNull: false
    },
    TANGGAL_PEMBAYARAN: {
        type: DataTypes.DATE,
        allowNull: true
    },
    STATUS_PEMBAYARAN: {
        type: DataTypes.ENUM('berhasil', 'menunggu_verifikasi'),
        defaultValue: 'menunggu_verifikasi'
    },
    BULAN_TAGIHAN: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    TAHUN_TAGIHAN: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    METODE_PEMBAYARAN: {
        type: DataTypes.STRING(200),
        allowNull: true
    },
    NOMOR_TAGIHAN: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    STATUS_VERIFIKASI: {
        type: DataTypes.STRING(20),
        allowNull: true
    },
    ID_TRANSAKSI: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    PAYMENT_TIME: {
        type: DataTypes.DATE,
        allowNull: true
    },
    PAYMENT_URL: {
        type: DataTypes.STRING(200),
        allowNull: true
    }
}, {
    tableName: 'tagihan',
    timestamps: false
});

module.exports = Tagihan;