import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DashboardLayout from './DashboardLayout';

const MulaiBerlangganan = ({ user }) => {
    const [paketList, setPaketList] = useState([]);
    const [selectedPaket, setSelectedPaket] = useState('');
    const [jumlahTagihan, setJumlahTagihan] = useState('');
    const [loading, setLoading] = useState(false);

    // Fetch paket dari API
    useEffect(() => {
        const fetchPaket = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get('http://localhost:5000/api/paket', {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                console.log('Paket data:', res.data);
                setPaketList(res.data);
            } catch (err) {
                console.error('Gagal mengambil data paket:', err);
                alert('Gagal mengambil data paket. Pastikan server backend berjalan.');
            }
        };
        fetchPaket();
    }, []);

    // Update jumlah tagihan saat paket berubah
    const handlePaketChange = (e) => {
        const paketId = parseInt(e.target.value);
        setSelectedPaket(paketId);

        console.log('Selected Paket ID:', paketId);
        console.log('Available paketList:', paketList);

        const paket = paketList.find(p => p.ID_PAKET === paketId);
        console.log('Found paket:', paket);

        if (paket && paket.HARGA_PAKET) {
            // Format harga ke Rupiah
            const formatted = new Intl.NumberFormat('id-ID', {
                style: 'currency',
                currency: 'IDR',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
            }).format(paket.HARGA_PAKET);
            setJumlahTagihan(formatted);
        } else {
            setJumlahTagihan('');
        }
    };

    const handleBayar = async () => {
        if (!selectedPaket) {
            alert('Silakan pilih produk layanan terlebih dahulu');
            return;
        }

        setLoading(true);

        try {
            const token = localStorage.getItem('token');
            console.log('Sending payment request:', {
                id_pelanggan: user?.id,
                id_paket: selectedPaket
            });

            // 1. Dapatkan token Snap dari backend
            const res = await axios.post('http://localhost:5000/api/payment/create-transaction', {
                id_pelanggan: user?.id,
                id_paket: selectedPaket
            }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            const snapToken = res.data.token;
            console.log('Snap Token:', snapToken);

            // 2. Tampilkan Pop-up Midtrans
            window.snap.pay(snapToken, {
                onSuccess: async function (result) {
                    console.log('Payment success:', result);
                    
                    try {
                        // 3. Konfirmasi ke backend
                        const confirmRes = await axios.post('http://localhost:5000/api/payment/success', {
                            order_id: result.order_id,
                            id_paket: selectedPaket
                        }, {
                            headers: { Authorization: `Bearer ${token}` }
                        });
                        
                        alert(confirmRes.data.message);
                        
                        // Update user state di localStorage
                        const updatedUser = confirmRes.data.user;
                        if (updatedUser) {
                            localStorage.setItem('user', JSON.stringify(updatedUser));
                            if (window.updateUserContext) {
                                window.updateUserContext(updatedUser);
                            }
                        }
                        
                        // Pindah ke dashboard
                        window.location.href = '/dashboard';
                    } catch (confirmErr) {
                        console.error('Konfirmasi pembayaran gagal:', confirmErr);
                        alert('Pembayaran berhasil di Midtrans, tetapi gagal diupdate di sistem. Hubungi Admin.');
                    } finally {
                        setLoading(false);
                    }
                },
                onPending: function (result) {
                    console.log('Payment pending:', result);
                    alert("Pembayaran tertunda. Silakan selesaikan pembayaran Anda.");
                    setLoading(false);
                },
                onError: function (result) {
                    console.log('Payment error:', result);
                    alert("Pembayaran gagal!");
                    setLoading(false);
                },
                onClose: function () {
                    console.log('Customer closed the popup without finishing the payment');
                    alert("Anda menutup jendela sebelum menyelesaikan pembayaran.");
                    setLoading(false);
                }
            });

        } catch (err) {
            console.error('Payment initialization error:', err);
            console.error('Error response:', err.response);
            alert("Gagal menginisialisasi pembayaran: " + (err.response?.data?.message || err.message));
            setLoading(false);
        }
    };

    // Generate User ID display
    const userId = user ? `SGP${String(user.id).padStart(4, '0')}` : 'SGP0000';
    const userName = user ? user.nama : 'Nama Pengguna';

    return (
        <DashboardLayout activeMenu="Mulai Berlangganan" pageTitle="Mulai Berlangganan" user={user}>
            {/* Form Card */}
            <div style={styles.formCard}>
                {/* Row 1: User ID + Nama Pengguna */}
                <div style={styles.formRow}>
                    <div style={styles.formGroupHalf}>
                        <label style={styles.label}>User ID</label>
                        <input
                            type="text"
                            value={userId}
                            readOnly
                            style={{ ...styles.input, backgroundColor: '#f5f5f5', color: '#888' }}
                        />
                    </div>
                    <div style={styles.formGroupHalf}>
                        <label style={styles.label}>Nama Pengguna</label>
                        <input
                            type="text"
                            value={userName}
                            readOnly
                            style={{ ...styles.input, backgroundColor: '#f5f5f5', color: '#888' }}
                        />
                    </div>
                </div>

                {/* Row 2: Produk Layanan */}
                <div style={styles.formRow}>
                    <div style={styles.formGroupFull}>
                        <label style={styles.label}>Produk Layanan</label>
                        <select
                            value={selectedPaket}
                            onChange={handlePaketChange}
                            style={styles.select}
                        >
                            <option value="">Pilih Produk Layanan yang ingin di aktivasi</option>
                            {paketList.map((p) => (
                                <option key={p.ID_PAKET} value={p.ID_PAKET}>
                                    {p.NAMA_PAKET}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Row 3: Jumlah Tagihan */}
                <div style={styles.formRow}>
                    <div style={styles.formGroupFull}>
                        <label style={styles.label}>Jumlah Tagihan</label>
                        <input
                            type="text"
                            value={jumlahTagihan || (selectedPaket ? 'Memuat...' : '')}
                            readOnly
                            placeholder="Pilih paket terlebih dahulu"
                            style={{ ...styles.input, backgroundColor: '#f5f5f5', color: '#888', fontWeight: 'bold', fontSize: '16px' }}
                        />
                    </div>
                </div>

                {/* Button */}
                <div style={styles.buttonRow}>
                    <button
                        onClick={handleBayar}
                        style={{
                            ...styles.submitButton,
                            ...(user?.status_langganan !== 'calon' ? { background: '#a0a0a0', cursor: 'not-allowed', boxShadow: 'none' } : {})
                        }}
                        disabled={loading || !selectedPaket || user?.status_langganan !== 'calon'}
                    >
                        {user?.status_langganan !== 'calon'
                            ? 'Sudah Berlangganan'
                            : (loading ? 'Memproses...' : 'Bayar Tagihan')}
                    </button>
                </div>
            </div>
        </DashboardLayout>
    );
};

const styles = {
    formCard: {
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
        backgroundColor: '#fff',
        boxSizing: 'border-box',
        width: '100%',
    },
    select: {
        padding: '13px 16px',
        borderRadius: '8px',
        border: '1px solid #d0d5dd',
        fontSize: '14px',
        color: '#555',
        outline: 'none',
        backgroundColor: '#fff',
        appearance: 'none',
        WebkitAppearance: 'none',
        MozAppearance: 'none',
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 16px center',
        backgroundSize: '18px',
        boxSizing: 'border-box',
        width: '100%',
        cursor: 'pointer',
    },
    buttonRow: {
        display: 'flex',
        justifyContent: 'flex-end',
        marginTop: '8px',
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
        boxShadow: '0 3px 10px rgba(108,99,255,0.3)',
        letterSpacing: '0.3px',
        transition: 'opacity 0.3s',
    },
};

export default MulaiBerlangganan;