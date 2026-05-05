import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import DashboardLayout from './DashboardLayout';

const AdminManajemenLayananUpgrade = ({ user }) => {
    const [data, setData] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const adminMenu = [
        { label: 'Dashboard', path: '/admin-dashboard' },
        { label: 'Manajemen Tagihan', path: '#' },
        { label: 'Manajemen Pelanggan', path: '/admin/manajemen-pelanggan' },
        { label: 'Manajemen Layanan', path: '/admin/manajemen-layanan' },
        { label: 'Manajemen E-ticketing', path: '/admin/manajemen-eticketing' },
    ];

    useEffect(() => {
        const fetchUpgradeData = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get('http://localhost:5000/api/dashboard/admin/layanan/upgrade', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setTotal(res.data.total);
                setData(res.data.data);
                setLoading(false);
            } catch (err) {
                console.error("Gagal mengambil data upgrade", err);
                setLoading(false);
            }
        };
        fetchUpgradeData();
    }, []);

    const handleConfirm = async (id_upgrade, nama_pelanggan, userId) => {
        if (!window.confirm(`Konfirmasi permintaan upgrade untuk ${nama_pelanggan}?`)) return;
        
        try {
            const token = localStorage.getItem('token');
            await axios.post('http://localhost:5000/api/dashboard/admin/layanan/upgrade/confirm', 
                { id_upgrade }, 
                { headers: { Authorization: `Bearer ${token}` } }
            );
            alert('Permintaan upgrade berhasil dikonfirmasi.');
            navigate('/admin/manajemen-pelanggan', { state: { autoEditUser: userId } });
        } catch (err) {
            console.error('Gagal konfirmasi', err);
            alert('Terjadi kesalahan saat mengkonfirmasi upgrade.');
        }
    };

    return (
        <DashboardLayout
            activeMenu="Manajemen Layanan"
            pageTitle="Manajemen Layanan"
            user={user}
            customMenuItems={adminMenu}
            hideHeader={true}
            noPadding={true}
        >
            <div style={styles.pageContainer}>
                {/* Custom Header */}
                <div style={styles.customHeader}>
                    <button onClick={() => window.history.back()} style={styles.backButton}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="15 18 9 12 15 6"></polyline>
                        </svg>
                    </button>
                    <h2 style={styles.pageTitle}>Manajemen Layanan</h2>
                </div>

                <div style={styles.contentArea}>
                    {/* Top Stat Card */}
                    <div style={styles.statCard}>
                        <div style={styles.iconWrapper}>
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="12" y1="19" x2="12" y2="5" />
                                <polyline points="5 12 12 5 19 12" />
                                <line x1="5" y1="22" x2="19" y2="22" />
                            </svg>
                        </div>
                        <div style={styles.statInfo}>
                            <div style={styles.statLabel}>Permintaan Upgrade Layanan</div>
                            <div style={styles.statNumberContainer}>
                                <span style={styles.statNumber}>{total}</span>
                                <span style={styles.statSubText}>Pelanggan</span>
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div style={styles.tableWrapper}>
                        <table style={styles.table}>
                            <thead>
                                <tr>
                                    <th style={styles.th}>User ID</th>
                                    <th style={styles.th}>Nama</th>
                                    <th style={styles.th}>Paket Saat Ini</th>
                                    <th style={styles.th}>Paket Upgrade</th>
                                    <th style={styles.th}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>Memuat data...</td>
                                    </tr>
                                ) : data.length > 0 ? (
                                    data.map((item, idx) => (
                                        <tr key={idx} style={styles.tr}>
                                            <td style={styles.td}>{item.userId}</td>
                                            <td style={styles.td}>{item.nama}</td>
                                            <td style={styles.td}>{item.paketSaatIni}</td>
                                            <td style={styles.td}>{item.paketUpgrade}</td>
                                            <td style={styles.td}>
                                                <button 
                                                    style={styles.actionBtn} 
                                                    onClick={() => handleConfirm(item.id_upgrade, item.nama, item.userId)}
                                                >
                                                    Detail
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>Tidak ada permintaan upgrade.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

const styles = {
    pageContainer: {
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: '80vh',
    },
    customHeader: {
        backgroundColor: '#fff',
        padding: '24px 40px',
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
        zIndex: 1,
    },
    backButton: {
        width: '36px',
        height: '36px',
        borderRadius: '50%',
        backgroundColor: '#5b6abf',
        border: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        boxShadow: '0 2px 6px rgba(91,106,191,0.3)',
        padding: 0,
    },
    pageTitle: {
        fontSize: '20px',
        fontWeight: '700',
        color: '#000',
        margin: 0,
    },
    contentArea: {
        backgroundColor: '#e9ebf0',
        padding: '30px 40px',
        flex: 1,
    },
    statCard: {
        backgroundColor: '#e6eeff',
        padding: '24px 30px',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        gap: '24px',
        width: 'fit-content',
        minWidth: '350px',
        marginBottom: '30px'
    },
    iconWrapper: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    statInfo: {
        display: 'flex',
        flexDirection: 'column'
    },
    statLabel: {
        fontSize: '16px',
        fontWeight: '700',
        color: '#444a6b',
        marginBottom: '4px'
    },
    statNumberContainer: {
        display: 'flex',
        alignItems: 'baseline',
        gap: '8px'
    },
    statNumber: {
        fontSize: '32px',
        fontWeight: '800',
        color: '#342c5c',
        lineHeight: 1
    },
    statSubText: {
        fontSize: '12px',
        color: '#444a6b',
        fontWeight: '500'
    },
    tableWrapper: {
        backgroundColor: 'transparent',
    },
    table: {
        width: '100%',
        borderCollapse: 'separate',
        borderSpacing: '0 8px',
    },
    th: {
        textAlign: 'center',
        color: '#5a5c69',
        fontSize: '14px',
        fontWeight: '600',
        padding: '0 16px 8px 16px',
        borderBottom: 'none',
    },
    tr: {
        backgroundColor: '#fff',
        boxShadow: '0 2px 5px rgba(0,0,0,0.02)',
    },
    td: {
        padding: '16px',
        textAlign: 'center',
        fontSize: '13px',
        color: '#000',
        fontWeight: '500'
    },
    actionBtn: {
        background: 'none',
        border: 'none',
        color: '#3b82f6',
        cursor: 'pointer',
        fontSize: '13px',
        fontWeight: '500',
        textDecoration: 'none'
    }
};

export default AdminManajemenLayananUpgrade;
