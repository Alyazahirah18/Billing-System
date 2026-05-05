import React, { useEffect, useState } from 'react';
import axios from 'axios';
import DashboardLayout from './DashboardLayout';

const TeknisiDashboard = ({ user }) => {
    const [stats, setStats] = useState({ selesai: 0, belumDitangani: 0 });
    const [loading, setLoading] = useState(true);

    const teknisiMenu = [
        { label: 'Dashboard', path: '/teknisi-dashboard' },
        { label: 'Penugasan', path: '/teknisi-penugasan' },
        { label: 'Riwayat Penugasan', path: '/teknisi-riwayat' }
    ];

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get('http://localhost:5000/api/dashboard/teknisi/stats', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setStats(res.data);
            } catch (err) {
                console.error("Gagal memuat statistik teknisi", err);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    // Ikon orang
    const PersonIcon = () => (
        <svg width="60" height="60" viewBox="0 0 24 24" fill="#000" xmlns="http://www.w3.org/2000/svg">
            <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
        </svg>
    );

    return (
        <DashboardLayout
            activeMenu="Dashboard"
            pageTitle="Dashboard"
            user={user}
            customMenuItems={teknisiMenu}
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
                    <h1 style={styles.welcomeText}>
                        Selamat Datang {user?.nama ? user.nama.split(' ')[0] : 'Teknisi'}!
                    </h1>

                    <div style={styles.cardsContainer}>
                        {/* Card Tugas Selesai */}
                        <div style={styles.cardWrapper}>
                            <div style={styles.card}>
                                <div style={styles.iconContainer}>
                                    <PersonIcon />
                                </div>
                                <div style={styles.infoContainer}>
                                    <div style={styles.cardTitle}>Jumlah Tugas Selesai</div>
                                    <div style={styles.cardValue}>{loading ? '...' : stats.selesai}</div>
                                    <div style={styles.cardSubtitle}>Pelanggan</div>
                                </div>
                            </div>
                        </div>

                        {/* Card Tugas Belum Ditangani */}
                        <div style={styles.cardWrapper}>
                            <div style={styles.card}>
                                <div style={styles.iconContainer}>
                                    <PersonIcon />
                                </div>
                                <div style={styles.infoContainer}>
                                    <div style={styles.cardTitle}>Jumlah Tugas Belum<br />Ditangani</div>
                                    <div style={styles.cardValue}>{loading ? '...' : stats.belumDitangani}</div>
                                    <div style={styles.cardSubtitle}>Pelanggan</div>
                                </div>
                            </div>
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
        backgroundColor: '#e9ebf0',
        padding: '50px 60px',
        flex: 1,
    },
    welcomeText: {
        fontSize: '42px',
        fontWeight: '800',
        color: '#000',
        marginTop: 0,
        marginBottom: '50px',
        textShadow: '2px 2px 4px rgba(0,0,0,0.1)'
    },
    cardsContainer: {
        display: 'flex',
        gap: '30px',
        flexWrap: 'wrap'
    },
    cardWrapper: {
        flex: 1,
        minWidth: '350px',
        backgroundColor: '#fff',
        padding: '12px',
        borderRadius: '4px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.05)'
    },
    card: {
        backgroundColor: '#dae3fa', // Light blue/periwinkle background
        display: 'flex',
        alignItems: 'center',
        padding: '30px 40px',
        height: '100%',
        boxSizing: 'border-box'
    },
    iconContainer: {
        marginRight: '30px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    },
    infoContainer: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center'
    },
    cardTitle: {
        fontSize: '20px',
        fontWeight: '600',
        color: '#2a2656', // Dark purple text
        marginBottom: '10px',
        lineHeight: '1.2'
    },
    cardValue: {
        fontSize: '48px',
        fontWeight: '700',
        color: '#2a2656',
        margin: '5px 0'
    },
    cardSubtitle: {
        fontSize: '16px',
        color: '#444',
        fontWeight: '500'
    }
};

export default TeknisiDashboard;
