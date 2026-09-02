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

    const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
    const [forgotData, setForgotData] = useState({
        NO_HP: '',
        NEW_PASSWORD: ''
    });
    const [forgotLoading, setForgotLoading] = useState(false);

    const handleForgotChange = (e) => {
        setForgotData({ ...forgotData, [e.target.name]: e.target.value });
    };

    const handleForgotSubmit = async (e) => {
        e.preventDefault();
        setForgotLoading(true);
        try {
            const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/auth/forgot-password`, forgotData);
            alert(res.data.message);
            setIsForgotModalOpen(false);
            setForgotData({ NO_HP: '', NEW_PASSWORD: '' });
        } catch (err) {
            alert("Gagal reset password: " + (err.response?.data?.message || err.message));
        } finally {
            setForgotLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/auth/login`, formData);

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

                        <div style={{ textAlign: 'right', marginBottom: '15px', marginTop: '-10px' }}>
                            <button
                                type="button"
                                onClick={() => setIsForgotModalOpen(true)}
                                style={styles.forgotLink}
                            >
                                Lupa Password?
                            </button>
                        </div>

                        <div style={styles.buttonRow}>
                            <button type="submit" style={styles.submitButton}>
                                Login
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Forgot Password Modal */}
            {isForgotModalOpen && (
                <div style={styles.modalOverlay} onClick={() => setIsForgotModalOpen(false)}>
                    <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => setIsForgotModalOpen(false)} style={styles.modalCloseBtn}>&times;</button>
                        <div style={styles.modalHeader}>
                            <h3 style={styles.modalTitle}>Atur Ulang Password</h3>
                            <p style={styles.modalSubtitle}>Masukkan nomor HP terdaftar Anda untuk membuat password baru</p>
                        </div>
                        <form onSubmit={handleForgotSubmit} style={styles.modalForm}>
                            <div style={styles.modalFormGroup}>
                                <label style={styles.modalLabel}>Nomor Handphone</label>
                                <input
                                    type="text"
                                    name="NO_HP"
                                    placeholder="Masukkan Nomor HP terdaftar"
                                    value={forgotData.NO_HP}
                                    onChange={handleForgotChange}
                                    required
                                    style={styles.modalInput}
                                />
                            </div>
                            <div style={styles.modalFormGroup}>
                                <label style={styles.modalLabel}>Password Baru</label>
                                <input
                                    type="password"
                                    name="NEW_PASSWORD"
                                    placeholder="Masukkan Password Baru"
                                    value={forgotData.NEW_PASSWORD}
                                    onChange={handleForgotChange}
                                    required
                                    style={styles.modalInput}
                                />
                            </div>
                            <div style={styles.modalButtonRow}>
                                <button type="button" onClick={() => setIsForgotModalOpen(false)} style={styles.modalCancelBtn}>
                                    Batal
                                </button>
                                <button type="submit" disabled={forgotLoading} style={styles.modalSubmitBtn}>
                                    {forgotLoading ? 'Memproses...' : 'Simpan Password'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

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
    logo: {
        height: '50px',
        objectFit: 'contain',
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
        background: '#5353FF',
        textAlign: 'center',
    },
    footerText: {
        color: '#fff',
        fontSize: '12px',
        margin: '2px 0',
        letterSpacing: '0.3px',
    },

    forgotLink: {
        background: 'none',
        border: 'none',
        color: '#fff',
        fontSize: '13px',
        fontWeight: '600',
        cursor: 'pointer',
        textDecoration: 'underline',
        padding: 0,
        opacity: '0.9',
        transition: 'opacity 0.2s',
    },

    /* ── Modal Lupa Password ── */
    modalOverlay: {
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(26, 26, 46, 0.75)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
    },
    modalContent: {
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        width: '420px',
        maxWidth: '90%',
        padding: '32px',
        position: 'relative',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
    },
    modalCloseBtn: {
        position: 'absolute',
        top: '16px',
        right: '20px',
        background: 'none',
        border: 'none',
        fontSize: '24px',
        color: '#666',
        cursor: 'pointer',
        transition: 'color 0.2s',
    },
    modalHeader: {
        marginBottom: '24px',
        textAlign: 'center',
    },
    modalTitle: {
        fontSize: '22px',
        fontWeight: '700',
        color: '#1a1a2e',
        margin: '0 0 8px 0',
    },
    modalSubtitle: {
        fontSize: '13px',
        color: '#666',
        margin: 0,
        lineHeight: '1.4',
    },
    modalForm: {
        display: 'flex',
        flexDirection: 'column',
        gap: '18px',
    },
    modalFormGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        textAlign: 'left',
    },
    modalLabel: {
        fontSize: '13px',
        fontWeight: '600',
        color: '#333',
    },
    modalInput: {
        padding: '12px 14px',
        borderRadius: '8px',
        border: '1px solid #d0d5dd',
        fontSize: '14px',
        color: '#333',
        outline: 'none',
        width: '100%',
        boxSizing: 'border-box',
    },
    modalButtonRow: {
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '12px',
        marginTop: '10px',
    },
    modalCancelBtn: {
        padding: '10px 18px',
        borderRadius: '8px',
        border: '1px solid #d0d5dd',
        backgroundColor: '#fff',
        color: '#333',
        fontSize: '14px',
        fontWeight: '600',
        cursor: 'pointer',
    },
    modalSubmitBtn: {
        padding: '10px 22px',
        borderRadius: '8px',
        border: 'none',
        background: 'linear-gradient(135deg, #5656F1 0%, #41B6FF 100%)',
        color: '#fff',
        fontSize: '14px',
        fontWeight: '600',
        cursor: 'pointer',
        boxShadow: '0 3px 8px rgba(86,86,241,0.2)',
    }
};

export default Login;
