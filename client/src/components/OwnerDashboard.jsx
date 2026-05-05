import React from 'react';
import { useNavigate } from 'react-router-dom';

const OwnerDashboard = ({ user }) => {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/staff-login');
    };

    return (
        <div style={styles.container}>
            <header style={styles.header}>
                <h2>Owner Dashboard</h2>
                <button onClick={handleLogout} style={styles.logoutButton}>Logout</button>
            </header>
            <div style={styles.content}>
                <h3>Selamat datang, {user?.nama || 'Owner'}!</h3>
                <p>Ini adalah halaman khusus Owner. Anda dapat melihat rekapitulasi keuangan dan performa bisnis secara keseluruhan.</p>
                {/* Tambahkan grafik laporan di sini */}
            </div>
        </div>
    );
};

const styles = {
    container: { fontFamily: 'sans-serif', padding: '20px', backgroundColor: '#fcf3cf', minHeight: '100vh' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#d35400', padding: '15px 30px', color: 'white', borderRadius: '8px' },
    logoutButton: { backgroundColor: '#333', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' },
    content: { marginTop: '20px', padding: '20px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }
};

export default OwnerDashboard;
