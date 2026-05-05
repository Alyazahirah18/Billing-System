const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Paket = sequelize.define('Paket', {
    ID_PAKET: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    NAMA_PAKET: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    HARGA_PAKET: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    }
}, {
    tableName: 'paket',
    timestamps: false
});

module.exports = Paket;
