import React, { useEffect, useState } from 'react';
import axios from 'axios';
import DashboardLayout from './DashboardLayout';

const AdminDashboard = ({ user }) => {
    const [stats, setStats] = useState({
        jumlahPelanggan: 0,
        jatuhTempo: 0,
        blokir: 0,
        aktif: 0
    });
    const [recentCustomers, setRecentCustomers] = useState([]);
    const [loading, setLoading] = useState(true);

    const adminMenu = [
        { label: 'Dashboard', path: '/admin-dashboard' },
        { label: 'Manajemen Tagihan', path: '/admin/manajemen-tagihan' },
        { label: 'Manajemen Pelanggan', path: '/admin/manajemen-pelanggan' },
        { label: 'Manajemen Layanan', path: '/admin/manajemen-layanan' },
        { label: 'Manajemen E-ticketing', path: '/admin/manajemen-eticketing' },
    ];

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get('http://localhost:5000/api/dashboard/admin', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setStats(res.data.stats);
                setRecentCustomers(res.data.pelangganTerbaru);
                setLoading(false);
            } catch (err) {
                console.error("Gagal mengambil data dashboard admin", err);
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, []);

    return (
        <DashboardLayout
            activeMenu="Dashboard"
            pageTitle="Dashboard"
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
                    <h2 style={styles.pageTitle}>Dashboard</h2>
                </div>

                <div style={styles.contentArea}>
                    {/* Stats Card Container */}
                    <div style={styles.statsContainer}>
                        {/* Jumlah Pelanggan */}
                        <div style={{ ...styles.statBox, backgroundColor: '#e2e8fa' }}>
                            <div style={styles.statTitle}>Jumlah Pelanggan</div>
                            <div style={styles.statBody}>
                                <svg width="36" height="36" viewBox="0 0 24 24" fill="#000" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                                    <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-.32 0-.63.05-.91.14.57.81.91 1.79.91 2.86s-.34 2.04-.91 2.86c.28.09.59.14.91.14zm4 6.11V19h-3v-2c0-.98-.62-1.95-1.76-2.67 1.49.52 2.65 1.51 2.65 2.78z" opacity="0.6" />
                                </svg>
                                <div style={styles.statValueContainer}>
                                    <span style={styles.statNumber}>{stats.jumlahPelanggan}</span>
                                    <span style={styles.statSubtitle}>Pelanggan</span>
                                </div>
                            </div>
                        </div>

                        {/* Jatuh Tempo */}
                        <div style={{ ...styles.statBox, backgroundColor: '#dff6fc' }}>
                            <div style={styles.statTitle}>Jatuh Tempo</div>
                            <div style={styles.statBody}>
                                <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#2c3e50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                    <line x1="16" y1="2" x2="16" y2="6" />
                                    <line x1="8" y1="2" x2="8" y2="6" />
                                    <line x1="3" y1="10" x2="21" y2="10" />
                                    <polyline points="9 16 12 19 16 13" stroke="#2c3e50" />
                                </svg>
                                <div style={styles.statValueContainer}>
                                    <span style={styles.statNumber}>{stats.jatuhTempo}</span>
                                    <span style={styles.statSubtitle}>Pelanggan</span>
                                </div>
                            </div>
                        </div>

                        {/* Blokir */}
                        <div style={{ ...styles.statBox, backgroundColor: '#e8eefc' }}>
                            <div style={styles.statTitle}>Blokir</div>
                            <div style={styles.statBody}>
                                <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10" />
                                    <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                                </svg>
                                <div style={styles.statValueContainer}>
                                    <span style={styles.statNumber}>{stats.blokir}</span>
                                    <span style={styles.statSubtitle}>Pelanggan</span>
                                </div>
                            </div>
                        </div>

                        {/* Aktif */}
                        <div style={{ ...styles.statBox, backgroundColor: '#e2fcf2' }}>
                            <div style={styles.statTitle}>Aktif</div>
                            <div style={styles.statBody}>
                                <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M5 12.55a11 11 0 0 1 14.08 0" />
                                    <path d="M1.42 9a16 16 0 0 1 21.16 0" />
                                    <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
                                    <circle cx="12" cy="20" r="1" />
                                </svg>
                                <div style={styles.statValueContainer}>
                                    <span style={styles.statNumber}>{stats.aktif}</span>
                                    <span style={styles.statSubtitle}>Pelanggan</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tabel Pelanggan Terbaru */}
                    <div style={styles.tableSection}>
                        <h3 style={styles.tableTitle}>Pelanggan Terbaru</h3>
                        <div style={styles.tableWrapper}>
                            <table style={styles.table}>
                                <thead>
                                    <tr>
                                        <th style={styles.th}>User ID</th>
                                        <th style={styles.th}>Nama</th>
                                        <th style={styles.th}>Jenis Paket</th>
                                        <th style={styles.th}>No Handphone</th>
                                        <th style={styles.th}>Tanggal</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>Memuat data...</td>
                                        </tr>
                                    ) : recentCustomers.length > 0 ? (
                                        recentCustomers.map((c, idx) => (
                                            <tr key={idx} style={styles.tr}>
                                                <td style={styles.td}>{c.userId}</td>
                                                <td style={styles.td}>{c.nama}</td>
                                                <td style={styles.td}>{c.jenisPaket}</td>
                                                <td style={styles.td}>{c.noHandphone}</td>
                                                <td style={styles.td}>{c.tanggal}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>Belum ada pelanggan</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
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
        backgroundColor: '#e9ebf0', // Light greyish blue background
        padding: '30px 40px',
        flex: 1,
    },
    statsContainer: {
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '20px',
        backgroundColor: '#fff',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
        marginBottom: '30px',
    },
    statBox: {
        padding: '20px',
        borderRadius: '8px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
    },
    statTitle: {
        fontSize: '15px',
        color: '#333',
        marginBottom: '16px',
    },
    statBody: {
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
    },
    statValueContainer: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
    },
    statNumber: {
        fontSize: '28px',
        fontWeight: '700',
        color: '#1a1a2e',
        lineHeight: '1.1',
    },
    statSubtitle: {
        fontSize: '11px',
        color: '#555',
        marginTop: '4px',
    },
    tableSection: {
        marginTop: '10px',
    },
    tableTitle: {
        fontSize: '16px',
        fontWeight: '600',
        color: '#1a1a2e',
        marginBottom: '16px',
    },
    tableWrapper: {
        backgroundColor: 'transparent',
    },
    table: {
        width: '100%',
        borderCollapse: 'separate',
        borderSpacing: '0 8px', // Space between rows like in the image
    },
    th: {
        textAlign: 'center',
        color: '#555',
        fontSize: '14px',
        fontWeight: '500',
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
    }
};

export default AdminDashboard;
