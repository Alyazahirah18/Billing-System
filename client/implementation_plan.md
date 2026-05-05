# Perbaikan 3 Masalah Fatal Billing System

## Masalah yang Ditemukan

Setelah menganalisis seluruh codebase, berikut 3 masalah fatal yang harus diperbaiki:

### 1. 🔴 Backend menggunakan Raw SQL — bukan Sequelize ORM
**Status saat ini**: Semua routes (`authRoutes.js`, `pelangganRoutes.js`, `paketRoutes.js`) menggunakan `db.query('SELECT ...')` — SQL mentah via `mysql2`.  
**Masalah**: Sequelize sudah terpasang di `package.json` tapi tidak digunakan sama sekali. Raw SQL rawan SQL injection dan tidak sesuai standar ORM.

### 2. 🔴 ProtectedRoute hanya cek `localStorage` — bisa di-bypass
**Status saat ini**: `ProtectedRoute.jsx` hanya mengecek prop `user` yang berasal dari `localStorage.getItem('user')`.  
**Masalah**: Siapapun bisa membuka browser console dan mengetik `localStorage.setItem('user', '{"status_langganan":"aktif"}')` untuk masuk ke Dashboard tanpa login.

### 3. 🔴 Token JWT tidak disimpan & tidak dikirim
**Status saat ini**: Backend sudah generate JWT token pada register/login, tapi frontend **tidak menyimpan token** dan **tidak mengirimkannya** di header API call.  
**Masalah**: Endpoint `POST /api/pelanggan/bayar` dilindungi `verifyToken` middleware tapi frontend tidak pernah mengirim token.

---

## Proposed Changes

### Backend — Sequelize ORM Setup

#### [NEW] [models/Pelanggan.js](file:///c:/Users/user/OneDrive/Documents/Skripsi%20Alya/billingsystemdevelop/server/models/Pelanggan.js)
- Model Sequelize untuk tabel `pelanggan`
- Definisi kolom: `ID_PELANGGAN`, `NAMA`, `PASSWORD`, `TELEPON`, `ALAMAT`, `ALAMAT_WILAYAH`, `STATUS_LANGGANAN`, `ID_PAKET`, `TANGGAL_DAFTAR`
- `tableName: 'pelanggan'`, `timestamps: false`

#### [NEW] [models/Paket.js](file:///c:/Users/user/OneDrive/Documents/Skripsi%20Alya/billingsystemdevelop/server/models/Paket.js)
- Model Sequelize untuk tabel `paket`
- Definisi kolom: `ID_PAKET`, `NAMA_PAKET`, `HARGA`

#### [NEW] [models/index.js](file:///c:/Users/user/OneDrive/Documents/Skripsi%20Alya/billingsystemdevelop/server/models/index.js)
- Export semua models
- Setup asosiasi: `Pelanggan.belongsTo(Paket)`, `Paket.hasMany(Pelanggan)`

#### [NEW] [config/database.js](file:///c:/Users/user/OneDrive/Documents/Skripsi%20Alya/billingsystemdevelop/server/config/database.js)
- Inisialisasi Sequelize instance dengan config dari `.env`
- Menggantikan peran `config/db.js` (raw mysql2 pool)

---

### Backend — Refactor Routes ke Sequelize

#### [MODIFY] [authRoutes.js](file:///c:/Users/user/OneDrive/Documents/Skripsi%20Alya/billingsystemdevelop/server/routes/authRoutes.js)
- Ganti semua `db.query(...)` → `Pelanggan.findOne(...)`, `Pelanggan.create(...)` dll
- Tambah endpoint `GET /api/auth/me` — validasi token dan return user data (untuk ProtectedRoute)
- Register & Login tetap return JWT token

#### [MODIFY] [pelangganRoutes.js](file:///c:/Users/user/OneDrive/Documents/Skripsi%20Alya/billingsystemdevelop/server/routes/pelangganRoutes.js)
- Ganti semua `db.query(...)` → `Pelanggan.findByPk(...)`, `Pelanggan.update(...)`, `Paket.findByPk(...)` dll

#### [MODIFY] [paketRoutes.js](file:///c:/Users/user/OneDrive/Documents/Skripsi%20Alya/billingsystemdevelop/server/routes/paketRoutes.js)
- Ganti `db.query('SELECT ... FROM paket')` → `Paket.findAll(...)`

#### [MODIFY] [server.js](file:///c:/Users/user/OneDrive/Documents/Skripsi%20Alya/billingsystemdevelop/server/server.js)
- Ganti test koneksi dari `db.query('SELECT 1')` → `sequelize.authenticate()`
- Import Sequelize instance dari `config/database.js`

---

### Frontend — JWT-based Auth & Token Management

#### [MODIFY] [ProtectedRoute.jsx](file:///c:/Users/user/OneDrive/Documents/Skripsi%20Alya/billingsystemdevelop/client/src/components/ProtectedRoute.jsx)
- Tambah validasi JWT: panggil `GET /api/auth/me` dengan token dari `localStorage`
- Jika token invalid/expired → redirect ke `/login` dan hapus localStorage
- Tampilkan loading state saat memvalidasi

#### [MODIFY] [Login.jsx](file:///c:/Users/user/OneDrive/Documents/Skripsi%20Alya/billingsystemdevelop/client/src/components/Login.jsx)
- Simpan `token` dari response ke `localStorage.setItem('token', res.data.token)`

#### [MODIFY] [register.jsx](file:///c:/Users/user/OneDrive/Documents/Skripsi%20Alya/billingsystemdevelop/client/src/components/register.jsx)
- Simpan `token` dari response ke `localStorage.setItem('token', res.data.token)`

#### [MODIFY] [MulaiBerlangganan.jsx](file:///c:/Users/user/OneDrive/Documents/Skripsi%20Alya/billingsystemdevelop/client/src/components/MulaiBerlangganan.jsx)
- Kirim `Authorization: Bearer <token>` header saat POST `/api/pelanggan/bayar`
- Setelah bayar berhasil, update user state dan redirect ke dashboard

#### [MODIFY] [App.jsx](file:///c:/Users/user/OneDrive/Documents/Skripsi%20Alya/billingsystemdevelop/client/src/App.jsx)
- Tambah fungsi `handleLogout` yang menghapus `token` dan `user` dari localStorage
- Pass `setUser` ke ProtectedRoute agar bisa clear state jika token invalid

---

## Verification Plan

### Automated Tests
1. Jalankan server: `npm run dev` di folder server
2. Test flow dengan curl:
   - `POST /api/auth/register` → pastikan return token + user
   - `POST /api/auth/login` → pastikan return token + user  
   - `GET /api/auth/me` (dengan header Authorization) → pastikan return user data
   - `GET /api/auth/me` (tanpa token) → pastikan return 401
   - `GET /api/paket` → pastikan return data paket via Sequelize

### Manual Verification
- Test bypass: buka console → set localStorage → refresh → harus redirect ke login (token invalid)
- Test flow lengkap: Register → auto-login → Mulai Berlangganan → Bayar → Dashboard
