import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import logo_signal from '../assets/logo_signal.png';

const Login = ({ setUser }) => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        NO_HP: '',
        PASSWORD: '',
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post('http://localhost:5000/api/auth/login', formData);

            const userData = res.data.user;
            setUser(userData);

            // Simpan ke localStorage agar persist saat refresh
            localStorage.setItem('user', JSON.stringify(userData));
            localStorage.setItem('token', res.data.token);

            // Redirect berdasarkan status
            if (userData.status_langganan === 'calon') {
                navigate('/mulai-berlangganan');
            } else {
                navigate('/dashboard');
            }
        } catch (err) {
            alert("Login Gagal: " + (err.response?.data?.message || err.message));
        }
    };

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
                {/* Back Button + Title */}
                <div style={styles.headerRow}>
                    <button onClick={() => navigate(-1)} style={styles.backButton}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="15 18 9 12 15 6"></polyline>
                        </svg>
                    </button>
                    <h2 style={styles.pageTitle}>Login</h2>
                </div>

                {/* Login Card */}
                <div style={styles.loginCard}>
                    <form onSubmit={handleSubmit} style={styles.form}>
                        <div style={styles.formGroup}>
                            <label style={styles.label}>Nomor Handphone</label>
                            <input
                                type="text"
                                name="NO_HP"
                                placeholder="Nomor Handphone"
                                value={formData.NO_HP}
                                onChange={handleChange}
                                required
                                style={styles.input}
                            />
                        </div>

                        <div style={styles.formGroup}>
                            <label style={styles.label}>Password</label>
                            <input
                                type="password"
                                name="PASSWORD"
                                placeholder="Password"
                                value={formData.PASSWORD}
                                onChange={handleChange}
                                required
                                style={styles.input}
                            />
                        </div>

                        <div style={styles.buttonRow}>
                            <button type="submit" style={styles.submitButton}>
                                Login
                            </button>
                        </div>
                    </form>
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
        gap: '28px',
    },
    navLink: {
        color: '#fff',
        textDecoration: 'none',
        fontSize: '16px',
        fontWeight: '600',
        letterSpacing: '0.3px',
    },

    /* ── Content Area ── */
    contentArea: {
        flex: 1,
        padding: '24px 50px 40px',
    },

    /* ── Header Row ── */
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

    /* ── Login Card (Blue) ── */
    loginCard: {
        background: 'linear-gradient(135deg, #5b6abf 0%, #6c7af7 50%, #5b6abf 100%)',
        borderRadius: '14px',
        padding: '50px 80px',
        maxWidth: '700px',
        margin: '0 auto',
        boxShadow: '0 4px 20px rgba(91,106,191,0.3)',
    },

    /* ── Form ── */
    form: {
        display: 'flex',
        flexDirection: 'column',
    },
    formGroup: {
        marginBottom: '22px',
    },
    label: {
        fontSize: '14px',
        fontWeight: '600',
        color: '#fff',
        marginBottom: '8px',
        display: 'block',
        textAlign: 'left',
    },
    input: {
        padding: '13px 16px',
        borderRadius: '8px',
        border: '1px solid rgba(255,255,255,0.3)',
        fontSize: '14px',
        color: '#333',
        outline: 'none',
        backgroundColor: '#fff',
        boxSizing: 'border-box',
        width: '100%',
    },

    /* ── Button ── */
    buttonRow: {
        display: 'flex',
        justifyContent: 'flex-end',
        marginTop: '8px',
    },
    submitButton: {
        padding: '12px 40px',
        borderRadius: '8px',
        border: 'none',
        background: 'linear-gradient(135deg, #7c6fd4, #9b8ce8)',
        color: '#fff',
        fontSize: '15px',
        fontWeight: '600',
        cursor: 'pointer',
        boxShadow: '0 3px 10px rgba(108,99,255,0.3)',
        letterSpacing: '0.3px',
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

export default Login;
