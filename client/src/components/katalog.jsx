import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import logo_signal from '../assets/logo_signal.png';

const Katalog = () => {
    const [paket, setPaket] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchPaket = async () => {
            try {
                const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/paket`);
                setPaket(res.data);
            } catch (err) {
                console.error("Gagal memuat paket", err);
            }
        };
        fetchPaket();
    }, []);

    return (
        <div style={styles.pageWrapper}>
            {/* Navbar */}
            <nav style={styles.navbar}>
                <div style={styles.navLeft}>
                    <img src={logo_signal} alt="Logo" style={styles.logo} />
                </div>
                <div style={styles.navRight}>
                    <Link to="/register" style={styles.navLink}>Registrasi</Link>
                    <Link to="/login" style={styles.navLink}>Login</Link>
                </div>
            </nav>

            {/* Content */}
            <div style={styles.contentArea}>
                <header style={{ textAlign: 'center', padding: '40px 0 30px' }}>
                    <h1 style={{ color: '#1a1a2e', fontSize: '28px', fontWeight: '700' }}>Pilih Paket Internet Anda</h1>
                    <p style={{ color: '#666', fontSize: '16px' }}>Nikmati koneksi WiFi stabil dari PT Signal Kabel Media</p>
                </header>

                <div style={styles.cardsContainer}>
                    {paket.map((item) => (
                        <div key={item.ID_PAKET} style={styles.card}>
                            <h2 style={{ color: '#5b4fcf', fontSize: '20px', marginBottom: '16px' }}>{item.NAMA_PAKET}</h2>
                            <h3 style={{ fontSize: '24px', margin: '16px 0', color: '#1a1a2e' }}>
                                Rp {item.HARGA_PAKET} <span style={{ fontSize: '14px', color: '#888' }}>/bulan</span>
                            </h3>
                            <ul style={{ listStyle: 'none', padding: 0, marginBottom: '24px', textAlign: 'left' }}>
                                <li style={{ padding: '4px 0', color: '#555' }}>✅ Speed up </li>
                                <li style={{ padding: '4px 0', color: '#555' }}>✅ Unlimited Quota</li>
                                <li style={{ padding: '4px 0', color: '#555' }}>✅ Free Instalasi</li>
                            </ul>
                            <button
                                onClick={() => navigate('/register')}
                                style={styles.cardButton}>
                                Langganan Sekarang
                            </button>
                        </div>
                    ))}
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
        background: 'linear-gradient(135deg, #5656F1 0%, #41B6FF 100%)',
        boxShadow: '0 2px 8px rgba(86,86,241,0.25)',
    },
    navLeft: {
        display: 'flex',
        alignItems: 'center',
    },
    navRight: {
        display: 'flex',
        alignItems: 'center',
        gap: '28px',
    },
    navLink: {
        color: '#fff',
        textDecoration: 'none',
        fontSize: '16px',
        fontWeight: '600',
        letterSpacing: '0.3px',
    },

    /* ── Content ── */
    contentArea: {
        flex: 1,
        padding: '0 50px 40px',
    },
    cardsContainer: {
        display: 'flex',
        justifyContent: 'center',
        gap: '24px',
        flexWrap: 'wrap',
    },
    card: {
        border: '1px solid #e8e8e8',
        borderRadius: '14px',
        padding: '30px',
        width: '280px',
        textAlign: 'center',
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        backgroundColor: '#fff',
        transition: 'transform 0.2s, box-shadow 0.2s',
    },
    cardButton: {
        background: 'linear-gradient(135deg, #5b4fcf, #6c63ff)',
        color: 'white',
        border: 'none',
        padding: '12px 20px',
        borderRadius: '8px',
        cursor: 'pointer',
        width: '100%',
        fontWeight: '600',
        fontSize: '14px',
        boxShadow: '0 3px 10px rgba(108,99,255,0.3)',
    },

    /* ── Footer ── */
    footer: {
        padding: '16px 40px',
        background: '#5353FF',
        textAlign: 'center',
    },
    footerText: {
        color: '#fff',
        fontSize: '12px',
        margin: '2px 0',
        letterSpacing: '0.3px',
    },
};

export default Katalog;