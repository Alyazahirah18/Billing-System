import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from './DashboardLayout';
import axios from 'axios';

const EditProfile = ({ user, setUser }) => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        nama: '',
        NO_HP: '',
        alamat: '',
        alamat_wilayah: '',
        password: '',
        confirmPassword: ''
    });
    const [kodePelanggan, setKodePelanggan] = useState('');
    const [layananAktif, setLayananAktif] = useState('');
    const [wilayahList, setWilayahList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchProfileData = async () => {
            try {
                const token = localStorage.getItem('token');
                
                // Fetch current profile details
                const meRes = await axios.get('http://localhost:5000/api/auth/me', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const userData = meRes.data.user;

                // Fetch current active service package from dashboard summary
                const summaryRes = await axios.get('http://localhost:5000/api/dashboard/summary', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                
                // Fetch list of areas (wilayah)
                const wilayahRes = await axios.get('http://localhost:5000/api/auth/wilayah');

                setFormData({
                    nama: userData.nama || '',
                    NO_HP: userData.NO_HP || '',
                    alamat: userData.alamat || '',
                    alamat_wilayah: userData.alamat_wilayah || '',
                    password: '',
                    confirmPassword: ''
                });
                setKodePelanggan(userData.kode_pelanggan || `SGP${String(userData.id).padStart(3, '0')}`);
                setLayananAktif(summaryRes.data.jenis_layanan || 'Belum ada layanan aktif');
                setWilayahList(wilayahRes.data || []);
                setLoading(false);
            } catch (err) {
                console.error('Gagal mengambil data profil:', err);
                alert('Gagal memuat data profil.');
                setLoading(false);
            }
        };

        fetchProfileData();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSave = async (e) => {
        e.preventDefault();

        // Validasi input
        if (!formData.nama.trim() || !formData.NO_HP.trim() || !formData.alamat.trim()) {
            alert('Nama, Nomor HP, dan Alamat wajib diisi.');
            return;
        }

        if (formData.password) {
            if (formData.password.length < 5) {
                alert('Password baru minimal harus terdiri dari 5 karakter.');
                return;
            }
            if (formData.password !== formData.confirmPassword) {
                alert('Konfirmasi password tidak cocok.');
                return;
            }
        }

        setSaving(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.put('http://localhost:5000/api/pelanggan/profile', {
                nama: formData.nama,
                NO_HP: formData.NO_HP,
                alamat: formData.alamat,
                alamat_wilayah: formData.alamat_wilayah,
                PASSWORD: formData.password || undefined
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Update user state in localStorage and App context
            const updatedUser = res.data.user;
            localStorage.setItem('user', JSON.stringify(updatedUser));
            if (setUser) {
                setUser(updatedUser);
            }

            // Tampilkan pesan sukses premium dengan SweetAlert2
            alert('Profil Anda berhasil diperbarui!');
            
            // Redirect back to dashboard
            navigate('/dashboard');
        } catch (err) {
            console.error('Error updating profile:', err);
            alert(err.response?.data?.message || 'Terjadi kesalahan saat menyimpan perubahan profil.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <DashboardLayout activeMenu="Dashboard" pageTitle="Edit Profil" user={user} hideHeader={true} noPadding={true}>
                <div style={{ padding: '40px', textAlign: 'center', fontSize: '16px', color: '#666' }}>
                    Memuat data profil...
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout activeMenu="Dashboard" pageTitle="Edit Profil" user={user} hideHeader={true} noPadding={true}>
            <div style={styles.pageContainer}>
                {/* Custom Full-Width Header */}
                <div style={styles.customHeader}>
                    <button onClick={() => window.history.back()} style={styles.backButton}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="15 18 9 12 15 6"></polyline>
                        </svg>
                    </button>
                    <h2 style={styles.pageTitle}>Edit Profil Pelanggan</h2>
                </div>

                {/* Main Content Area */}
                <div style={styles.container}>
                    <div style={styles.card}>
                        <div style={styles.cardHeaderArea}>
                            <div style={styles.avatarCircle}>
                                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#5b6abf" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                    <circle cx="12" cy="7" r="4" />
                                </svg>
                            </div>
                            <div style={styles.headerTextContainer}>
                                <h3 style={styles.cardHeadline}>{formData.nama || 'Nama Pengguna'}</h3>
                                <p style={styles.cardSubheadline}>Lengkapi data diri Anda di bawah ini</p>
                            </div>
                        </div>

                        <form onSubmit={handleSave} style={styles.form}>
                            {/* Row 1: Kode User (Disabled) & Layanan Aktif (Disabled) */}
                            <div style={styles.formRow}>
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Kode User (ID Pelanggan)</label>
                                    <input
                                        type="text"
                                        value={kodePelanggan}
                                        disabled
                                        style={styles.inputDisabled}
                                    />
                                    <span style={styles.helpText}>Kode User tidak dapat diubah</span>
                                </div>

                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Paket Layanan Aktif</label>
                                    <input
                                        type="text"
                                        value={layananAktif}
                                        disabled
                                        style={styles.inputDisabled}
                                    />
                                    <span style={styles.helpText}>Paket Layanan tidak dapat diubah langsung</span>
                                </div>
                            </div>

                            {/* Row 2: Nama Pelanggan & Nomor HP */}
                            <div style={styles.formRow}>
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Nama Lengkap</label>
                                    <input
                                        type="text"
                                        name="nama"
                                        value={formData.nama}
                                        onChange={handleChange}
                                        placeholder="Nama Lengkap Anda"
                                        style={styles.input}
                                        required
                                    />
                                </div>

                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Nomor Handphone (Telepon)</label>
                                    <input
                                        type="text"
                                        name="NO_HP"
                                        value={formData.NO_HP}
                                        onChange={handleChange}
                                        placeholder="Contoh: 08123456789"
                                        style={styles.input}
                                        required
                                    />
                                </div>
                            </div>

                            {/* Row 3: Alamat & Wilayah */}
                            <div style={styles.formRow}>
                                <div style={{ ...styles.formGroup, flex: 2 }}>
                                    <label style={styles.label}>Alamat Lengkap Rumah</label>
                                    <input
                                        type="text"
                                        name="alamat"
                                        value={formData.alamat}
                                        onChange={handleChange}
                                        placeholder="Nama jalan, Nomor rumah, RT/RW"
                                        style={styles.input}
                                        required
                                    />
                                </div>

                                <div style={{ ...styles.formGroup, flex: 1 }}>
                                    <label style={styles.label}>Wilayah / Kecamatan</label>
                                    <div style={styles.selectWrapper}>
                                        <select
                                            name="alamat_wilayah"
                                            value={formData.alamat_wilayah}
                                            onChange={handleChange}
                                            style={styles.select}
                                            required
                                        >
                                            <option value="" disabled hidden>Pilih Wilayah</option>
                                            {wilayahList.map((wil, idx) => (
                                                <option key={idx} value={wil}>
                                                    {wil}
                                                </option>
                                            ))}
                                        </select>
                                        <div style={styles.dropdownIcon}>
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="#666">
                                                <path d="M7 10l5 5 5-5H7z" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div style={styles.divider}></div>

                            {/* Row 4: Password Baru (Optional) */}
                            <div style={styles.formRow}>
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Password Baru (Kosongkan jika tidak diubah)</label>
                                    <input
                                        type="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        placeholder="Masukkan password baru"
                                        style={styles.input}
                                    />
                                </div>

                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Konfirmasi Password Baru</label>
                                    <input
                                        type="password"
                                        name="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        placeholder="Ketik ulang password baru"
                                        style={styles.input}
                                    />
                                </div>
                            </div>

                            {/* Form Action Buttons */}
                            <div style={styles.buttonContainer}>
                                <button
                                    type="button"
                                    onClick={() => navigate('/dashboard')}
                                    style={styles.cancelBtn}
                                    disabled={saving}
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    style={styles.saveBtn}
                                    disabled={saving}
                                >
                                    {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                                </button>
                            </div>
                        </form>
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
        borderBottom: '1px solid #f0f0f0',
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
    container: {
        backgroundColor: '#f9f5f7',
        padding: '40px',
        flex: 1,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: '16px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
        width: '100%',
        maxWidth: '850px',
        padding: '36px',
    },
    cardHeaderArea: {
        display: 'flex',
        alignItems: 'center',
        gap: '20px',
        marginBottom: '30px',
        borderBottom: '1px solid #f0f0f0',
        paddingBottom: '20px',
    },
    avatarCircle: {
        width: '70px',
        height: '70px',
        borderRadius: '50%',
        backgroundColor: '#eef0fc',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTextContainer: {
        display: 'flex',
        flexDirection: 'column',
        textAlign: 'left'
    },
    cardHeadline: {
        fontSize: '22px',
        fontWeight: '700',
        color: '#1a1a2e',
        margin: '0 0 4px 0',
    },
    cardSubheadline: {
        fontSize: '14px',
        color: '#666',
        margin: 0,
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
    },
    formRow: {
        display: 'flex',
        gap: '24px',
        marginBottom: '20px',
        flexWrap: 'wrap',
    },
    formGroup: {
        flex: 1,
        minWidth: '250px',
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
        padding: '12px 16px',
        borderRadius: '8px',
        border: '1px solid #ccc',
        fontSize: '14px',
        color: '#000',
        outline: 'none',
        backgroundColor: '#fff',
        boxSizing: 'border-box',
        width: '100%',
        fontWeight: '500',
        transition: 'border-color 0.2s',
    },
    inputDisabled: {
        padding: '12px 16px',
        borderRadius: '8px',
        border: '1px solid #ddd',
        fontSize: '14px',
        color: '#666',
        backgroundColor: '#f5f5f5',
        boxSizing: 'border-box',
        width: '100%',
        fontWeight: '500',
        cursor: 'not-allowed',
    },
    helpText: {
        fontSize: '11px',
        color: '#888',
        marginTop: '4px',
        textAlign: 'left',
    },
    selectWrapper: {
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
    },
    select: {
        padding: '12px 16px',
        paddingRight: '40px',
        borderRadius: '8px',
        border: '1px solid #ccc',
        fontSize: '14px',
        outline: 'none',
        backgroundColor: '#fff',
        appearance: 'none',
        WebkitAppearance: 'none',
        boxSizing: 'border-box',
        width: '100%',
        cursor: 'pointer',
        fontWeight: '500',
    },
    dropdownIcon: {
        position: 'absolute',
        right: '12px',
        pointerEvents: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    divider: {
        height: '1px',
        backgroundColor: '#f0f0f0',
        margin: '10px 0 24px 0',
    },
    buttonContainer: {
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '16px',
        marginTop: '10px',
    },
    cancelBtn: {
        padding: '12px 28px',
        borderRadius: '8px',
        border: '1px solid #ccc',
        backgroundColor: '#fff',
        color: '#666',
        fontSize: '14px',
        fontWeight: '600',
        cursor: 'pointer',
    },
    saveBtn: {
        padding: '12px 32px',
        borderRadius: '8px',
        border: 'none',
        background: 'linear-gradient(135deg, #5b4fcf, #6c63ff)',
        color: '#fff',
        fontSize: '14px',
        fontWeight: 'bold',
        cursor: 'pointer',
        boxShadow: '0 4px 10px rgba(91,106,191,0.3)',
    }
};

export default EditProfile;
