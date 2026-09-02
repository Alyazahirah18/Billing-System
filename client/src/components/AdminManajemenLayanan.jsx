import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import DashboardLayout from './DashboardLayout';

const AdminManajemenLayanan = ({ user }) => {
    const [counts, setCounts] = useState({
        pengaduan: 0,
        reschedule: 0,
        upgrade: 0
    });

    const adminMenu = [
        { label: 'Dashboard', path: '/admin-dashboard' },
        { label: 'Manajemen Tagihan', path: '/admin/manajemen-tagihan' },
        { label: 'Manajemen Pelanggan', path: '/admin/manajemen-pelanggan' },
        { label: 'Manajemen Layanan', path: '/admin/manajemen-layanan' },
        { label: 'Manajemen E-ticketing', path: '/admin/manajemen-eticketing' },
    ];

    useEffect(() => {
        const fetchLayananData = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/dashboard/admin/layanan`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setCounts({
                    pengaduan: res.data.pengaduan || 0,
                    reschedule: res.data.reschedule || 0,
                    upgrade: res.data.upgrade || 0
                });
            } catch (err) {
                console.error("Gagal mengambil data layanan admin", err);
            }
        };
        fetchLayananData();
        // Logika agar notifikasi manajemen layanan ditandai sudah dibaca saat admin membuka halaman ini
        localStorage.setItem('adminLastOpenedLayanan', new Date().toISOString());
        window.dispatchEvent(new CustomEvent('refetchSidebarBadges'));
    }, []);

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
                    <h3 style={styles.subHeading}>Kelola Layanan Pelanggan</h3>

                    {/* Cards Container */}
                    <div style={styles.cardsContainer}>

                        {/* Pengaduan Card */}
                        <div style={{ ...styles.card, background: 'linear-gradient(180deg, #d8f1f7 0%, #cee6ef 100%)' }}>
                            <div style={styles.cardTitle}>Layanan Pengaduan</div>
                            <div style={styles.iconWrapper}>
                                <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#2c3e50" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                                    <circle cx="12" cy="12" r="3" fill="none" stroke="#2c3e50" strokeWidth="1" />
                                    <line x1="12" y1="8" x2="12" y2="12" strokeWidth="1" />
                                    <line x1="12" y1="16" x2="12.01" y2="16" strokeWidth="1" />
                                    <path d="M12 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" strokeWidth="1" />
                                    <path d="M6 20v-1a6 6 0 0 1 12 0v1" strokeWidth="1" />
                                </svg>
                            </div>
                            <div style={styles.cardNumber}>{counts.pengaduan}</div>
                            <Link to="/admin/layanan/aduan" style={styles.detailLink}>Detail →</Link>
                        </div>

                        {/* Reschedule Card */}
                        <div style={{ ...styles.card, background: 'linear-gradient(180deg, #d8f1f7 0%, #cee6ef 100%)' }}>
                            <div style={styles.cardTitle}>Layanan Reschedule</div>
                            <div style={styles.iconWrapper}>
                                <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" fill="none" />
                                    <line x1="16" y1="2" x2="16" y2="6" />
                                    <line x1="8" y1="2" x2="8" y2="6" />
                                    <line x1="3" y1="10" x2="21" y2="10" />
                                    <path d="M3 10h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V10z" fill="#fff" />
                                </svg>
                            </div>
                            <div style={styles.cardNumber}>{counts.reschedule}</div>
                            <Link to="/admin/layanan/reschedule" style={styles.detailLink}>Detail →</Link>
                        </div>

                        {/* Upgrade Card */}
                        <div style={{ ...styles.card, background: 'linear-gradient(180deg, #e4f7f0 0%, #d8eadf 100%)' }}>
                            <div style={styles.cardTitle}>Layanan Upgrade</div>
                            <div style={styles.iconWrapper}>
                                <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="12" y1="19" x2="12" y2="5" />
                                    <polyline points="5 12 12 5 19 12" />
                                    <line x1="5" y1="22" x2="19" y2="22" />
                                </svg>
                            </div>
                            <div style={styles.cardNumber}>{counts.upgrade}</div>
                            <Link to="/admin/layanan/upgrade" style={styles.detailLink}>Detail →</Link>
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
        padding: '30px 40px',
        flex: 1,
    },
    subHeading: {
        fontSize: '18px',
        fontWeight: '600',
        color: '#1a1a2e',
        marginBottom: '30px',
        marginTop: '0'
    },
    cardsContainer: {
        display: 'flex',
        gap: '40px',
        justifyContent: 'flex-start',
    },
    card: {
        width: '260px',
        height: '320px',
        borderRadius: '12px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '30px 20px',
        position: 'relative',
        boxSizing: 'border-box'
    },
    cardTitle: {
        fontSize: '18px',
        fontWeight: '800',
        color: '#2b2a4c',
        textAlign: 'center',
        marginBottom: '30px',
    },
    iconWrapper: {
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardNumber: {
        fontSize: '28px',
        fontWeight: '700',
        color: '#2b2a4c',
        marginTop: '20px',
        marginBottom: '30px',
    },
    detailLink: {
        fontSize: '12px',
        color: '#5b4fcf',
        textDecoration: 'none',
        position: 'absolute',
        bottom: '20px',
        fontWeight: '500'
    }
};

export default AdminManajemenLayanan;
