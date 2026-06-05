const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const LogAktivitas = sequelize.define('LogAktivitas', {
    id_LogAktivitas: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    id_pegawai: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    USERNAME: {
        type: DataTypes.STRING(200),
        allowNull: false
    },
    activity: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    datetime: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'logaktivitas',
    timestamps: false
});

module.exports = LogAktivitas;
