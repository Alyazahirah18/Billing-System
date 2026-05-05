import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import logo_signal from '../assets/logo_signal.png';
import axios from 'axios';
import { useEffect } from 'react';

const DashboardLayout = ({ children, activeMenu, pageTitle, user, hideHeader = false, noPadding = false, customMenuItems }) => {
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        // Only fetch if user is logged in
        if (localStorage.getItem('token')) {
            fetchUnreadCount();
        }
    }, []);

    const fetchUnreadCount = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5000/api/notifikasi/unread-count', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUnreadCount(res.data.unreadCount);
        } catch (err) {
            console.error("Gagal mengambil jumlah notifikasi", err);
        }
    };

    const defaultMenuItems = [
        { label: 'Dashboard', path: '/dashboard' },
        { label: 'Lihat Produk', path: '/lihat-produk' },
        { label: 'Tagihan', path: '/tagihan' },
        { label: 'Upgrade Layanan', path: '/upgrade-layanan' },
        { label: 'Mulai Berlangganan', path: '/mulai-berlangganan' },
        { label: 'Aduan Keluhan', path: '/aduan-keluhan' },
        { label: 'Penjadwalan Ulang', path: '/penjadwalan-ulang' },
    ];

    const menuItems = customMenuItems || defaultMenuItems;

    return (
        <div style={styles.pageWrapper}>
            {/* Navbar */}
            <nav style={styles.navbar}>
                <div style={styles.navLeft}>
                    <img src={logo_signal} alt="Logo" style={styles.logo} />
                </div>
                <div style={styles.navRight}>
                    {/* Notification Bell */}
                    <button 
                        style={{ ...styles.iconButton, position: 'relative' }}
                        onClick={() => navigate('/notifikasi')}
                    >
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                        </svg>
                        {unreadCount > 0 && (
                            <div style={styles.badge}>{unreadCount}</div>
                        )}
                    </button>
                    {/* Profile Icon */}
                    <button style={styles.iconButton}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                        </svg>
                    </button>
                </div>
            </nav>

            {/* Main Body */}
            <div style={styles.mainBody}>
                {/* Sidebar */}
                <aside style={{
                    ...styles.sidebar,
                    width: sidebarOpen ? '200px' : '0px',
                    padding: sidebarOpen ? '20px 0' : '0',
                    overflow: 'hidden',
                }}>
                    {/* Hamburger */}
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        style={styles.hamburger}
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round">
                            <line x1="3" y1="6" x2="21" y2="6" />
                            <line x1="3" y1="12" x2="21" y2="12" />
                            <line x1="3" y1="18" x2="21" y2="18" />
                        </svg>
                    </button>

                    {/* Menu Items */}
                    <nav style={styles.sidebarNav}>
                        {menuItems.map((item) => (
                            <Link
                                key={item.path}
                                to={item.path}
                                style={{
                                    ...styles.menuItem,
                                    ...(activeMenu === item.label ? styles.menuItemActive : {}),
                                }}
                            >
                                {item.label}
                            </Link>
                        ))}
                    </nav>
                </aside>

                {/* Hamburger when sidebar is closed */}
                {!sidebarOpen && (
                    <button
                        onClick={() => setSidebarOpen(true)}
                        style={{ ...styles.hamburger, position: 'absolute', left: '10px', top: '90px', zIndex: 10 }}
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round">
                            <line x1="3" y1="6" x2="21" y2="6" />
                            <line x1="3" y1="12" x2="21" y2="12" />
                            <line x1="3" y1="18" x2="21" y2="18" />
                        </svg>
                    </button>
                )}

                {/* Content Area */}
                <div style={{ ...styles.contentArea, ...(noPadding ? { padding: 0 } : {}) }}>
                    {/* Back Button + Page Title */}
                    {!hideHeader && (
                        <div style={{ ...styles.headerRow, ...(noPadding ? { padding: '24px 40px 0' } : {}) }}>
                            <button onClick={() => navigate(-1)} style={styles.backButton}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="15 18 9 12 15 6"></polyline>
                                </svg>
                            </button>
                            <h2 style={styles.pageTitle}>{pageTitle}</h2>
                        </div>
                    )}

                    {/* Page Content */}
                    {children}
                </div>
            </div>

            {/* Footer */}
            <footer style={styles.footer}>
                <p style={styles.footerText}>© 2000 - Company, Inc. All rights reserved. Address Address</p>
                <p style={styles.footerText}>Contact Us: 08xx-xxx-xxx</p>
            </footer>
        </div>
    );
};

const styles = {
    pageWrapper: {
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        backgroundColor: '#f5f7fb',
        fontFamily: "'Segoe UI', 'Roboto', 'Helvetica Neue', sans-serif",
    },

    /* ── Navbar ── */
    navbar: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 40px',
        background: 'linear-gradient(135deg, #5b4fcf 0%, #6c63ff 30%, #7b9cf7 70%, #a8d8ea 100%)',
        boxShadow: '0 2px 8px rgba(91,79,207,0.25)',
    },
    navLeft: {
        display: 'flex',
        alignItems: 'center',
    },
    navRight: {
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
    },
    iconButton: {
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: '6px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    badge: {
        position: 'absolute',
        top: '0px',
        right: '0px',
        backgroundColor: '#e74c3c',
        color: 'white',
        fontSize: '10px',
        fontWeight: 'bold',
        padding: '2px 5px',
        borderRadius: '50%',
        minWidth: '14px',
        height: '14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '2px solid #5b4fcf'
    },

    /* ── Main Body ── */
    mainBody: {
        display: 'flex',
        flex: 1,
        position: 'relative',
    },

    /* ── Sidebar ── */
    sidebar: {
        backgroundColor: '#fff',
        borderRight: '1px solid #e8e8e8',
        transition: 'width 0.3s ease, padding 0.3s ease',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
    },
    hamburger: {
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: '8px 16px',
        display: 'flex',
        alignItems: 'center',
        marginBottom: '10px',
    },
    sidebarNav: {
        display: 'flex',
        flexDirection: 'column',
    },
    menuItem: {
        padding: '10px 24px',
        fontSize: '14px',
        color: '#555',
        textDecoration: 'none',
        transition: 'background-color 0.2s, color 0.2s',
        borderLeft: '3px solid transparent',
        whiteSpace: 'nowrap',
    },
    menuItemActive: {
        color: '#5b4fcf',
        fontWeight: '700',
        borderLeft: '3px solid #5b4fcf',
        backgroundColor: 'rgba(91,79,207,0.05)',
    },

    /* ── Content ── */
    contentArea: {
        flex: 1,
        padding: '24px 40px 40px',
    },
    headerRow: {
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        marginBottom: '20px',
    },
    backButton: {
        width: '38px',
        height: '38px',
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
        color: '#1a1a2e',
        margin: 0,
    },

    /* ── Footer ── */
    footer: {
        padding: '16px 40px',
        background: 'linear-gradient(135deg, #5b4fcf 0%, #6c63ff 30%, #7b9cf7 70%, #a8d8ea 100%)',
        textAlign: 'center',
    },
    footerText: {
        color: '#fff',
        fontSize: '12px',
        margin: '2px 0',
        letterSpacing: '0.3px',
    },
};

export default DashboardLayout;
