const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Pegawai = require('./Pegawai');
const Aduan = require('./Aduan');

const Ticket = sequelize.define('Ticket', {
    ID_TICKET: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    ID_PEGAWAI: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Pegawai,
            key: 'ID_PEGAWAI'
        }
    },
    ID_ADUAN: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true, // Assuming one ticket per aduan
        references: {
            model: Aduan,
            key: 'ID_ADUAN'
        }
    },
    SCHEDULE_DATE: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    SCHEDULE_TIME: {
        type: DataTypes.TIME,
        allowNull: true
    },
    TICKET_STATUS: {
        type: DataTypes.ENUM('open', 'on progress', 'selesai'),
        allowNull: false,
        defaultValue: 'open'
    },
    NOTES: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    KONFIRMASI_SENT: {
        type: DataTypes.DATE,
        allowNull: true
    },
    IS_READ: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    IS_CONFIRMED: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    }
}, {
    tableName: 'ticket',
    timestamps: false
});

module.exports = Ticket;
