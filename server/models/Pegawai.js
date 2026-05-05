const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Pegawai = sequelize.define('Pegawai', {
    ID_PEGAWAI: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    NAMA: {
        type: DataTypes.STRING(200),
        allowNull: false
    },
    USERNAME: {
        type: DataTypes.STRING(100),
        allowNull: true,
        unique: true
    },
    PASSWORD: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    ROLE: {
        type: DataTypes.CHAR(20),
        allowNull: false
    },
    WILAYAH: {
        type: DataTypes.STRING(50),
        allowNull: true
    }
}, {
    tableName: 'pegawai',
    timestamps: false
});

module.exports = Pegawai;
