const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Reschedule = sequelize.define('Reschedule', {
    ID_RESCHEDULE: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    ID_PEGAWAI: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    ID_TICKET: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    TANGGAL_LAMA: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    TANGGAL_BARU: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    JAM_LAMA: {
        type: DataTypes.TIME,
        allowNull: true
    },
    JAM_BARU: {
        type: DataTypes.TIME,
        allowNull: true
    },
    DESKRIPSI: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    STATUS_RESCHEDULE: {
        type: DataTypes.STRING(50),
        allowNull: true,
        defaultValue: 'pending'
    }
}, {
    tableName: 'reschedule',
    timestamps: false
});

module.exports = Reschedule;
