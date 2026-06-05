import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import logo_signal from '../assets/logo_signal.png';

const Register = ({ setUser }) => {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        nama: '',
        PASSWORD: '',      // Diubah dari 'password' menjadi 'PASSWORD'
        NO_HP: '',         // Diubah dari 'telepon' menjadi 'NO_HP'
        alamat: '',
        alamat_wilayah: '',
    });

    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    // List wilayah sesuai permintaan
    const listWilayah = ["Batam Center", "Nagoya", "Batu Ampar", "Sekupang", "Bengkong", "Sagulung", "Batu Aji"];

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setErrorMessage(''); // Clear error when user types
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setErrorMessage('');

        // Validasi tambahan di frontend
        if (!formData.nama || !formData.PASSWORD || !formData.NO_HP || !formData.alamat) {
            setErrorMessage('Semua field wajib diisi!');
            setIsLoading(false);
            return;
        }

        // Validasi nomor telepon (minimal 10 digit)
        if (formData.NO_HP.length < 10) {
            setErrorMessage('Nomor telepon minimal 10 digit');
            setIsLoading(false);
            return;
        }

        // Validasi password (minimal 6 karakter dan kombinasi huruf & angka)
        const hasLetter = /[a-zA-Z]/.test(formData.PASSWORD);
        const hasNumber = /[0-9]/.test(formData.PASSWORD);
        if (formData.PASSWORD.length < 6 || !hasLetter || !hasNumber) {
            setErrorMessage('Password minimal 6 karakter dan berupa kombinasi huruf dan angka');
            setIsLoading(false);
            return;
        }

        try {
            console.log('Sending registration data:', {
                nama: formData.nama,
                NO_HP: formData.NO_HP,
                alamat: formData.alamat,
                alamat_wilayah: formData.alamat_wilayah
            });

            const res = await axios.post('http://localhost:5000/api/auth/register', {
                nama: formData.nama,
                PASSWORD: formData.PASSWORD,
                NO_HP: formData.NO_HP,
                alamat: formData.alamat,
                alamat_wilayah: formData.alamat_wilayah
            });

            console.log('Registration response:', res.data);
            alert(res.data.message);

            // Auto-login: simpan data user dari response registrasi
            const userData = res.data.user;
            setUser(userData);
            localStorage.setItem('user', JSON.stringify(userData));
            localStorage.setItem('token', res.data.token);

            // Set axios default header
            axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;

            // Setelah regis, langsung arahkan ke halaman mulai berlangganan
            navigate('/mulai-berlangganan');
        } catch (err) {
            console.error('Registration error:', err);
            console.error('Error response:', err.response);

            let message = 'Terjadi kesalahan saat registrasi';
            if (err.response) {
                message = err.response.data?.message || `Error ${err.response.status}: ${err.response.statusText}`;
            } else if (err.request) {
                message = 'Tidak dapat terhubung ke server. Pastikan server backend berjalan.';
            } else {
                message = err.message;
            }

            setErrorMessage(message);
            alert("Gagal Registrasi: " + message);
        } finally {
            setIsLoading(false);
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
                    <h2 style={styles.pageTitle}>Registrasi</h2>
                </div>

                {/* Error Message */}
                {errorMessage && (
                    <div style={styles.errorMessage}>
                        {errorMessage}
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} style={styles.form}>
                    {/* Row 1: Nama Lengkap + Wilayah */}
                    <div style={styles.formRow}>
                        <div style={styles.formGroupHalf}>
                            <label style={styles.label}>Nama Lengkap *</label>
                            <input
                                type="text"
                                name="nama"
                                placeholder="Nama Lengkap"
                                value={formData.nama}
                                onChange={handleChange}
                                required
                                style={styles.input}
                            />
                        </div>
                        <div style={styles.formGroupHalf}>
                            <label style={styles.label}>Wilayah *</label>
                            <select
                                name="alamat_wilayah"
                                value={formData.alamat_wilayah}
                                onChange={handleChange}
                                required
                                style={styles.select}
                            >
                                <option value="">Pilih Kecamatan</option>
                                {listWilayah.map((w, index) => (
                                    <option key={index} value={w}>{w}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Row 2: Alamat Lengkap */}
                    <div style={styles.formRow}>
                        <div style={styles.formGroupFull}>
                            <label style={styles.label}>Alamat Lengkap *</label>
                            <input
                                type="text"
                                name="alamat"
                                placeholder="Alamat Lengkap (Jalan, No. Rumah, RT/RW)"
                                value={formData.alamat}
                                onChange={handleChange}
                                required
                                style={styles.input}
                            />
                        </div>
                    </div>

                    {/* Row 3: Nomor Handphone + Password */}
                    <div style={styles.formRow}>
                        <div style={styles.formGroupHalf}>
                            <label style={styles.label}>Nomor Handphone *</label>
                            <input
                                type="tel"
                                name="NO_HP"
                                placeholder="Contoh: 081234567890"
                                value={formData.NO_HP}
                                onChange={handleChange}
                                required
                                style={styles.input}
                            />
                            <small style={styles.helperText}>Minimal 10 digit angka</small>
                        </div>
                        <div style={styles.formGroupHalf}>
                            <label style={styles.label}>Password *</label>
                            <input
                                type="password"
                                name="PASSWORD"
                                placeholder="Minimal 6 karakter"
                                value={formData.PASSWORD}
                                onChange={handleChange}
                                required
                                style={styles.input}
                            />
                            <small style={styles.helperText}>Gunakan kombinasi huruf dan angka</small>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div style={styles.buttonRow}>
                        <button
                            type="submit"
                            style={styles.submitButton}
                            disabled={isLoading}
                        >
                            {isLoading ? 'Memproses...' : 'Registrasi'}
                        </button>
                    </div>
                </form>
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
        transition: 'opacity 0.2s',
    },

    contentArea: {
        flex: 1,
        padding: '24px 50px 40px',
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
        transition: 'background-color 0.2s, transform 0.15s',
        boxShadow: '0 2px 6px rgba(91,106,191,0.3)',
        padding: 0,
    },
    pageTitle: {
        fontSize: '20px',
        fontWeight: '700',
        color: '#1a1a2e',
        margin: 0,
    },

    errorMessage: {
        backgroundColor: '#ff4444',
        color: 'white',
        padding: '12px',
        borderRadius: '8px',
        marginBottom: '20px',
        textAlign: 'center',
        fontWeight: '500',
    },

    form: {
        backgroundColor: '#fff',
        borderRadius: '14px',
        padding: '36px 40px 32px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
    },
    formRow: {
        display: 'flex',
        gap: '30px',
        marginBottom: '22px',
        flexWrap: 'wrap',
    },
    formGroupHalf: {
        flex: 1,
        minWidth: '200px',
        display: 'flex',
        flexDirection: 'column',
    },
    formGroupFull: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
    },
    label: {
        fontSize: '14px',
        fontWeight: '600',
        color: '#333',
        marginBottom: '8px',
        textAlign: 'left',
    },
    input: {
        padding: '13px 16px',
        borderRadius: '8px',
        border: '1px solid #d0d5dd',
        fontSize: '14px',
        color: '#333',
        outline: 'none',
        transition: 'border-color 0.2s, box-shadow 0.2s',
        backgroundColor: '#fff',
        boxSizing: 'border-box',
        width: '100%',
    },
    select: {
        padding: '13px 16px',
        borderRadius: '8px',
        border: '1px solid #d0d5dd',
        fontSize: '14px',
        color: '#333',
        outline: 'none',
        transition: 'border-color 0.2s, box-shadow 0.2s',
        backgroundColor: '#fff',
        appearance: 'none',
        WebkitAppearance: 'none',
        MozAppearance: 'none',
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 16px center',
        backgroundSize: '14px',
        boxSizing: 'border-box',
        width: '100%',
        cursor: 'pointer',
    },
    helperText: {
        fontSize: '11px',
        color: '#666',
        marginTop: '4px',
        textAlign: 'left',
    },

    buttonRow: {
        display: 'flex',
        justifyContent: 'flex-end',
        marginTop: '18px',
    },
    submitButton: {
        padding: '12px 36px',
        borderRadius: '8px',
        border: 'none',
        background: 'linear-gradient(135deg, #5b4fcf, #6c63ff)',
        color: '#fff',
        fontSize: '15px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'transform 0.15s, box-shadow 0.2s',
        boxShadow: '0 3px 10px rgba(108,99,255,0.3)',
        letterSpacing: '0.3px',
    },

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

export default Register;