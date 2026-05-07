import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { requestForToken, onMessageListener } from './firebase';
import Katalog from './components/katalog.jsx';
import Register from './components/register.jsx';
import Login from './components/Login.jsx';
import Dashboard from './components/Dashboard.jsx';
import MulaiBerlangganan from './components/MulaiBerlangganan.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import LihatProduk from './components/LihatProduk.jsx';
import UpgradeLayanan from './components/UpgradeLayanan.jsx';
import AduanKeluhan from './components/AduanKeluhan.jsx';
import PenjadwalanUlang from './components/PenjadwalanUlang.jsx';
import Notifikasi from './components/Notifikasi.jsx';
import Tagihan from './components/Tagihan.jsx';
import StaffLogin from './components/StaffLogin.jsx';
import AdminDashboard from './components/AdminDashboard.jsx';
import AdminManajemenPelanggan from './components/AdminManajemenPelanggan.jsx';
import AdminManajemenTagihan from './components/AdminManajemenTagihan.jsx';
import AdminManajemenLayanan from './components/AdminManajemenLayanan.jsx';
import AdminManajemenLayananUpgrade from './components/AdminManajemenLayananUpgrade.jsx';
import AdminManajemenLayananAduan from './components/AdminManajemenLayananAduan.jsx';
import AdminManajemenLayananReschedule from './components/AdminManajemenLayananReschedule.jsx';
import AdminManajemenETicketing from './components/AdminManajemenETicketing.jsx';
import TeknisiDashboard from './components/TeknisiDashboard.jsx';
import TeknisiPenugasan from './components/TeknisiPenugasan.jsx';
import TeknisiRiwayatPenugasan from './components/TeknisiRiwayatPenugasan.jsx';
import OwnerDashboard from './components/OwnerDashboard.jsx';
import './App.css';

// Komponen inner yang bisa menggunakan useLocation
function AppContent() {
  // Ambil user dari localStorage jika ada (persist saat refresh)
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });

  const location = useLocation();

  useEffect(() => {
    // 1. Register Service Worker secara eksplisit
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/firebase-messaging-sw.js')
        .then((registration) => {
          console.log('Service Worker registered:', registration.scope);
        })
        .catch((err) => {
          console.error('Service Worker registration failed:', err);
        });
    }

    // 2. Meminta izin notifikasi dan mendapatkan FCM token
    requestForToken().then((token) => {
      if (token && user && !user.isStaff) {
        const authToken = localStorage.getItem('token');
        fetch('http://localhost:5000/api/auth/save-fcm-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({ fcm_token: token })
        })
          .then(res => res.json())
          .then(data => console.log("FCM Token saved:", data))
          .catch(err => console.error("Error saving FCM token:", err));
      }
    });

    // 3. Listener untuk pesan masuk saat aplikasi terbuka (foreground)
    const unsubscribe = onMessageListener()
      .then((payload) => {
        console.log("Notifikasi diterima di foreground:", payload);
        // Tampilkan notifikasi browser saat foreground
        if (Notification.permission === 'granted') {
          new Notification(payload.notification?.title || 'Notifikasi Baru', {
            body: payload.notification?.body || 'Anda memiliki notifikasi baru.',
            icon: '/logo_signal.png'
          });
        } else {
          alert(`${payload.notification?.title}: ${payload.notification?.body}`);
        }
      })
      .catch((err) => console.log("Gagal menerima pesan:", err));
  }, [user]);

  // Semua halaman sudah punya navbar sendiri, jadi sembunyikan nav default
  const hideDefaultNav = ['/', '/register', '/login', '/dashboard', '/mulai-berlangganan', '/lihat-produk', '/upgrade-layanan', '/penjadwalan-ulang', '/notifikasi', '/staff-login', '/admin-dashboard', '/admin/manajemen-pelanggan', '/admin/manajemen-layanan', '/admin/layanan/upgrade', '/admin/layanan/aduan', '/admin/layanan/reschedule', '/admin/manajemen-eticketing', '/teknisi-dashboard', '/teknisi-penugasan', '/teknisi-riwayat', '/owner-dashboard'].includes(location.pathname);

  return (
    <div className="App">
      {/* Navigasi default — disembunyikan di halaman yang punya navbar sendiri */}
      {!hideDefaultNav && (
        <nav style={navStyle}>
          <div style={{ fontWeight: 'bold', fontSize: '20px' }}>PT Signal Media</div>
        </nav>
      )}

      <Routes>
        {/* Landing Page (Katalog) */}
        <Route path="/" element={<Katalog />} />

        {/* Registrasi — setelah regis auto-login ke mulai-berlangganan */}
        <Route path="/register" element={<Register setUser={setUser} />} />

        {/* Login */}
        <Route path="/login" element={<Login setUser={setUser} />} />

        {/* Mulai Berlangganan — untuk calon pelanggan */}
        <Route path="/mulai-berlangganan" element={<MulaiBerlangganan user={user} />} />

        {/* Dashboard — hanya untuk pelanggan aktif */}
        <Route path="/dashboard" element={
          <ProtectedRoute user={user} setUser={setUser}>
            <Dashboard user={user} />
          </ProtectedRoute>
        } />

        {/* Lihat Produk — diakses melalui sidebar dashboard */}
        <Route path="/lihat-produk" element={
          <ProtectedRoute user={user} setUser={setUser}>
            <LihatProduk user={user} />
          </ProtectedRoute>
        } />

        {/* Tagihan — diakses melalui sidebar dashboard */}
        <Route path="/tagihan" element={
          <ProtectedRoute user={user} setUser={setUser}>
            <Tagihan user={user} />
          </ProtectedRoute>
        } />

        {/* Upgrade Layanan — diakses melalui sidebar dashboard */}
        <Route path="/upgrade-layanan" element={
          <ProtectedRoute user={user} setUser={setUser}>
            <UpgradeLayanan user={user} />
          </ProtectedRoute>
        } />

        {/* Aduan Keluhan — diakses melalui sidebar dashboard */}
        <Route path="/aduan-keluhan" element={
          <ProtectedRoute user={user} setUser={setUser}>
            <AduanKeluhan user={user} />
          </ProtectedRoute>
        } />

        {/* Penjadwalan Ulang — diakses melalui sidebar dashboard */}
        <Route path="/penjadwalan-ulang" element={
          <ProtectedRoute user={user} setUser={setUser}>
            <PenjadwalanUlang user={user} />
          </ProtectedRoute>
        } />

        {/* Notifikasi — diakses melalui navbar lonceng */}
        <Route path="/notifikasi" element={
          <ProtectedRoute user={user} setUser={setUser}>
            <Notifikasi user={user} />
          </ProtectedRoute>
        } />

        {/* RBAC Staff Routes */}
        <Route path="/staff-login" element={<StaffLogin setUser={setUser} />} />

        <Route path="/admin-dashboard" element={
          <ProtectedRoute user={user} setUser={setUser}>
            <AdminDashboard user={user} />
          </ProtectedRoute>
        } />

        <Route path="/admin/manajemen-pelanggan" element={
          <ProtectedRoute user={user} setUser={setUser}>
            <AdminManajemenPelanggan user={user} />
          </ProtectedRoute>
        } />

        <Route path="/admin/manajemen-tagihan" element={
          <ProtectedRoute user={user} setUser={setUser}>
            <AdminManajemenTagihan user={user} />
          </ProtectedRoute>
        } />

        <Route path="/admin/manajemen-layanan" element={
          <ProtectedRoute user={user} setUser={setUser}>
            <AdminManajemenLayanan user={user} />
          </ProtectedRoute>
        } />

        <Route path="/admin/layanan/upgrade" element={
          <ProtectedRoute user={user} setUser={setUser}>
            <AdminManajemenLayananUpgrade user={user} />
          </ProtectedRoute>
        } />

        <Route path="/admin/layanan/aduan" element={
          <ProtectedRoute user={user} setUser={setUser}>
            <AdminManajemenLayananAduan user={user} />
          </ProtectedRoute>
        } />

        <Route path="/admin/layanan/reschedule" element={
          <ProtectedRoute user={user} setUser={setUser}>
            <AdminManajemenLayananReschedule user={user} />
          </ProtectedRoute>
        } />

        <Route path="/admin/manajemen-eticketing" element={
          <ProtectedRoute user={user} setUser={setUser}>
            <AdminManajemenETicketing user={user} />
          </ProtectedRoute>
        } />

        <Route path="/teknisi-dashboard" element={
          <ProtectedRoute user={user} setUser={setUser}>
            <TeknisiDashboard user={user} />
          </ProtectedRoute>
        } />

        <Route path="/teknisi-penugasan" element={
          <ProtectedRoute user={user} setUser={setUser}>
            <TeknisiPenugasan user={user} />
          </ProtectedRoute>
        } />

        <Route path="/teknisi-riwayat" element={
          <ProtectedRoute user={user} setUser={setUser}>
            <TeknisiRiwayatPenugasan user={user} />
          </ProtectedRoute>
        } />

        <Route path="/owner-dashboard" element={
          <ProtectedRoute user={user} setUser={setUser}>
            <OwnerDashboard user={user} />
          </ProtectedRoute>
        } />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

// Styling navigasi simpel (fallback, biasanya disembunyikan)
const navStyle = {
  padding: '15px 50px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  backgroundColor: '#fff',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  marginBottom: '20px'
};

export default App;