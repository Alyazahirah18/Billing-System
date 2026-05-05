import React, { useState, useEffect } from 'react';
import DashboardLayout from './DashboardLayout';
import axios from 'axios';

const UpgradeLayanan = ({ user }) => {
    const [layananAktif, setLayananAktif] = useState('Memuat...');
    const [paketList, setPaketList] = useState([]);
    const [selectedPaket, setSelectedPaket] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('token');
                
                // Mengambil paket layanan aktif dari dashboard summary
                const summaryRes = await axios.get('http://localhost:5000/api/dashboard/summary', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                
                // Summary mengembalikan { jenis_layanan: '...' }
                setLayananAktif(summaryRes.data.jenis_layanan || 'Belum ada layanan aktif');

                // Mengambil daftar produk/paket layanan
                const paketRes = await axios.get('http://localhost:5000/api/paket', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setPaketList(paketRes.data);
            } catch (err) {
                console.error('Gagal mengambil data:', err);
                setLayananAktif('Gagal memuat');
            }
        };
        fetchData();
    }, []);

    const userId = user ? `SGP${String(user.id).padStart(4, '0')}` : 'SGP0000';
    const userName = user ? user.nama : 'Nama Pengguna';

    const handleUpgrade = async () => {
        if (!selectedPaket) {
            alert('Silakan pilih produk layanan yang ingin di upgrade/downgrade');
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post('http://localhost:5000/api/pelanggan/upgrade', { id_paket: selectedPaket }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            alert(res.data.message || 'Pengajuan upgrade layanan berhasil dikirim!');
            setSelectedPaket('');
            // Update layanan aktif secara lokal agar UI tidak perlu direfresh penuh
            setLayananAktif(res.data.paketBaru || 'Memuat...');
        } catch (err) {
            console.error(err);
            alert('Terjadi kesalahan saat mengajukan upgrade layanan.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardLayout activeMenu="Upgrade Layanan" pageTitle="Upgrade Layanan" user={user} hideHeader={true} noPadding={true}>
            <div style={styles.pageContainer}>
                {/* Custom Full-Width Header */}
                <div style={styles.customHeader}>
                    <button onClick={() => window.history.back()} style={styles.backButton}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="15 18 9 12 15 6"></polyline>
                        </svg>
                    </button>
                    <h2 style={styles.pageTitle}>Upgrade Layanan</h2>
                </div>

                {/* Main Content Area */}
                <div style={styles.container}>
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Nama Pelanggan</label>
                        <input
                            type="text"
                            value={userName}
                            readOnly
                            style={styles.input}
                        />
                    </div>

                    <div style={styles.formGroup}>
                        <label style={styles.label}>User ID</label>
                        <input
                            type="text"
                            value={userId}
                            readOnly
                            style={styles.input}
                        />
                    </div>

                    <div style={styles.formGroup}>
                        <label style={styles.label}>Layanan Aktif</label>
                        <input
                            type="text"
                            value={layananAktif}
                            readOnly
                            style={styles.input}
                        />
                    </div>

                    <div style={styles.formGroup}>
                        <label style={styles.label}>Produk Layanan</label>
                        <div style={styles.selectWrapper}>
                            <select
                                value={selectedPaket}
                                onChange={(e) => setSelectedPaket(e.target.value)}
                                style={{ ...styles.select, color: selectedPaket ? '#000' : '#888' }}
                            >
                                <option value="" disabled hidden>Pilih Produk Layanan yang ingin di upgrade</option>
                                {paketList.map((p) => (
                                    <option key={p.ID_PAKET} value={p.ID_PAKET} style={{ color: '#000' }}>
                                        {p.NAMA_PAKET}
                                    </option>
                                ))}
                            </select>
                            {/* Custom Dropdown Arrow */}
                            <div style={styles.dropdownIcon}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="#666" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M7 10l5 5 5-5H7z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div style={styles.buttonContainer}>
                        <button 
                            onClick={handleUpgrade} 
                            style={styles.button}
                            disabled={loading}
                        >
                            {loading ? 'Memproses...' : 'Upgrade Layanan'}
                        </button>
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
        borderBottom: '1px solid #f0f0f0', // Slight border if needed, or remove
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
        backgroundColor: '#f9f5f7', // Matching the pinkish white from the image
        padding: '40px',
        flex: 1,
    },
    formGroup: {
        marginBottom: '20px',
        display: 'flex',
        flexDirection: 'column',
    },
    label: {
        fontSize: '15px',
        fontWeight: '500',
        color: '#333',
        marginBottom: '8px',
        textAlign: 'left',
    },
    input: {
        padding: '12px 16px',
        borderRadius: '8px',
        border: '1px solid #555',
        fontSize: '15px',
        color: '#000',
        outline: 'none',
        backgroundColor: '#fff',
        boxSizing: 'border-box',
        width: '100%',
        fontWeight: '500'
    },
    selectWrapper: {
        position: 'relative',
        display: 'flex',
        alignItems: 'center'
    },
    select: {
        padding: '12px 16px',
        paddingRight: '40px',
        borderRadius: '8px',
        border: '1px solid #555',
        fontSize: '15px',
        outline: 'none',
        backgroundColor: '#fff',
        appearance: 'none',
        WebkitAppearance: 'none',
        boxSizing: 'border-box',
        width: '100%',
        cursor: 'pointer',
        fontWeight: '500'
    },
    dropdownIcon: {
        position: 'absolute',
        right: '12px',
        pointerEvents: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonContainer: {
        display: 'flex',
        justifyContent: 'flex-end',
        marginTop: '24px'
    },
    button: {
        padding: '12px 32px',
        borderRadius: '8px',
        border: 'none',
        background: 'linear-gradient(135deg, #5b4fcf, #6c63ff)',
        color: '#fff',
        fontSize: '15px',
        fontWeight: 'bold',
        cursor: 'pointer',
        boxShadow: '0 4px 10px rgba(91,106,191,0.3)',
    }
};

export default UpgradeLayanan;
