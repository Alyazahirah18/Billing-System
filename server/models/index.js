const sequelize = require('../config/db');
const Pelanggan = require('./Pelanggan');
const Paket = require('./Paket');
const Tagihan = require('./Tagihan');
const Pegawai = require('./Pegawai');
const UpgradeLayanan = require('./UpgradeLayanan');
const Aduan = require('./Aduan');
const Ticket = require('./Ticket');
const Reschedule = require('./Reschedule');
const Notifikasi = require('./Notifikasi');

// Definisikan Relasi
Pelanggan.belongsTo(Paket, { foreignKey: 'ID_PAKET' });
Paket.hasMany(Pelanggan, { foreignKey: 'ID_PAKET' });

Pelanggan.hasMany(Tagihan, { foreignKey: 'ID_PELANGGAN' });
Tagihan.belongsTo(Pelanggan, { foreignKey: 'ID_PELANGGAN' });

// Relasi Upgrade Layanan
UpgradeLayanan.belongsTo(Pelanggan, { foreignKey: 'ID_PELANGGAN' });
Pelanggan.hasMany(UpgradeLayanan, { foreignKey: 'ID_PELANGGAN' });
UpgradeLayanan.belongsTo(Paket, { foreignKey: 'ID_PAKET_BARU', as: 'PaketBaru' });

// Relasi Aduan
Aduan.belongsTo(Pelanggan, { foreignKey: 'ID_PELANGGAN' });
Pelanggan.hasMany(Aduan, { foreignKey: 'ID_PELANGGAN' });

// Relasi Ticket
Ticket.belongsTo(Aduan, { foreignKey: 'ID_ADUAN' });
Aduan.hasOne(Ticket, { foreignKey: 'ID_ADUAN' });

Ticket.belongsTo(Pegawai, { foreignKey: 'ID_PEGAWAI' });
Pegawai.hasMany(Ticket, { foreignKey: 'ID_PEGAWAI' });

// Relasi Reschedule
Reschedule.belongsTo(Ticket, { foreignKey: 'ID_TICKET' });
Ticket.hasMany(Reschedule, { foreignKey: 'ID_TICKET' });
Reschedule.belongsTo(Pegawai, { foreignKey: 'ID_PEGAWAI' });

// Relasi Notifikasi
Notifikasi.belongsTo(Pelanggan, { foreignKey: 'ID_PELANGGAN' });
Pelanggan.hasMany(Notifikasi, { foreignKey: 'ID_PELANGGAN' });

module.exports = {
    sequelize,
    Pelanggan,
    Paket,
    Tagihan,
    Pegawai,
    UpgradeLayanan,
    Aduan,
    Ticket,
    Reschedule,
    Notifikasi
};