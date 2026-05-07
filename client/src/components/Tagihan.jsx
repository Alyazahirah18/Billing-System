import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DashboardLayout from './DashboardLayout';

const Tagihan = ({ user }) => {
    const [billData, setBillData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        fetchTagihan();
    }, []);

    const fetchTagihan = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5000/api/dashboard/pelanggan/tagihan-aktif', {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('Tagihan data received:', res.data);
            setBillData(res.data);
        } catch (err) {
            console.error('Gagal mengambil data tagihan:', err);
            alert('Gagal memuat tagihan. Pastikan koneksi internet stabil.');
        } finally {
            setLoading(false);
        }
    };

    const handleBayarTagihan = async () => {
        if (!billData || !billData.bill) return;

        setActionLoading(true);
        try {
            const token = localStorage.getItem('token');
            
            // 1. Buat Snap Token transaksi melalui API pay-bill
            const res = await axios.post('http://localhost:5000/api/payment/pay-bill', {
                id_tagihan: billData.bill.id_tagihan
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const snapToken = res.data.token;

            // 2. Tampilkan Pop-up Midtrans Snap
            window.snap.pay(snapToken, {
                onSuccess: async function (result) {
                    console.log('Payment success callback:', result);
                    try {
                        // 3. Konfirmasi pembayaran sukses ke backend
                        const confirmRes = await axios.post('http://localhost:5000/api/payment/success', {
                            order_id: result.order_id
                        }, {
                            headers: { Authorization: `Bearer ${token}` }
                        });
                        
                        alert('Pembayaran Berhasil! ' + confirmRes.data.message);
                        
                        // Muat ulang data tagihan agar tampil terbayar
                        fetchTagihan();
                    } catch (confirmErr) {
                        console.error('Gagal konfirmasi ke backend:', confirmErr);
                        alert('Pembayaran Anda berhasil di Midtrans, tetapi gagal diperbarui di database. Hubungi Admin.');
                        fetchTagihan();
                    }
                },
                onPending: function (result) {
                    console.log('Payment pending callback:', result);
                    alert("Pembayaran tertunda. Silakan selesaikan pembayaran Anda sesuai instruksi.");
                },
                onError: function (result) {
                    console.log('Payment error callback:', result);
                    alert("Pembayaran gagal!");
                },
                onClose: function () {
                    console.log('Customer closed Snap popup');
                    alert("Anda menutup jendela pembayaran sebelum selesai.");
                }
            });

        } catch (err) {
            console.error('Error on pay bill:', err);
            alert('Gagal menginisialisasi pembayaran: ' + (err.response?.data?.message || err.message));
        } finally {
            setActionLoading(false);
        }
    };

    // Formating helper functions
    const formatRupiah = (number) => {
        if (number === undefined || number === null) return 'Rp. 0,00';
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(number);
    };

    if (loading) {
        return (
            <DashboardLayout activeMenu="Tagihan" pageTitle="Tagihan" user={user}>
                <div style={styles.loadingContainer}>
                    <div style={styles.spinner}></div>
                    <p style={styles.loadingText}>Memuat tagihan aktif Anda...</p>
                </div>
            </DashboardLayout>
        );
    }

    const pelangganInfo = billData?.pelanggan || {};
    const billInfo = billData?.bill;
    const hasActiveBill = billData?.hasBill && billInfo;

    const displayUserId = pelangganInfo.kode_pelanggan || (user ? `SGP${String(user.id).padStart(4, '0')}` : '-');
    const displayUserName = pelangganInfo.nama_pelanggan || (user ? user.nama : '-');
    const displayLayanan = pelangganInfo.layanan || '-';
    
    // Status Tagihan Mapping
    const isPaid = billInfo?.status_pembayaran === 'berhasil';
    const displayStatus = hasActiveBill 
        ? (isPaid ? 'Sudah Terbayar' : 'Belum Terbayar')
        : 'Tidak Ada Tagihan Aktif';

    const displayJumlah = hasActiveBill ? formatRupiah(billInfo.jumlah_bayar) : 'Rp. 0,00';

    return (
        <DashboardLayout activeMenu="Tagihan" pageTitle="Tagihan" user={user}>
            <div style={styles.formCard}>
                {/* Row 1: User ID + Nama Pengguna */}
                <div style={styles.formRow}>
                    <div style={styles.formGroupHalf}>
                        <label style={styles.label}>User ID</label>
                        <input
                            type="text"
                            value={displayUserId}
                            readOnly
                            style={styles.inputReadOnly}
                        />
                    </div>
                    <div style={styles.formGroupHalf}>
                        <label style={styles.label}>Nama Pengguna</label>
                        <input
                            type="text"
                            value={displayUserName}
                            readOnly
                            style={styles.inputReadOnly}
                        />
                    </div>
                </div>

                {/* Row 2: Layanan Aktif + Status Tagihan */}
                <div style={styles.formRow}>
                    <div style={styles.formGroupHalf}>
                        <label style={styles.label}>Layanan Aktif</label>
                        <input
                            type="text"
                            value={displayLayanan}
                            readOnly
                            style={styles.inputReadOnly}
                        />
                    </div>
                    <div style={styles.formGroupHalf}>
                        <label style={styles.label}>Status Tagihan</label>
                        <input
                            type="text"
                            value={displayStatus}
                            readOnly
                            style={{
                                ...styles.inputReadOnly,
                                color: isPaid ? '#27ae60' : (hasActiveBill ? '#e74c3c' : '#888'),
                                fontWeight: 'bold'
                            }}
                        />
                    </div>
                </div>

                {/* Row 3: Jumlah Tagihan */}
                <div style={styles.formRow}>
                    <div style={styles.formGroupFull}>
                        <label style={styles.label}>Jumlah Tagihan</label>
                        <input
                            type="text"
                            value={displayJumlah}
                            readOnly
                            style={{ ...styles.inputReadOnly, fontWeight: 'bold' }}
                        />
                    </div>
                </div>

                {/* Action Row */}
                <div style={styles.buttonRow}>
                    <button
                        onClick={handleBayarTagihan}
                        style={{
                            ...styles.submitButton,
                            ...((!hasActiveBill || isPaid) ? styles.submitButtonDisabled : {})
                        }}
                        disabled={actionLoading || !hasActiveBill || isPaid}
                    >
                        {actionLoading ? 'Memproses...' : 'Bayar Tagihan'}
                    </button>
                </div>
            </div>
        </DashboardLayout>
    );
};

const styles = {
    loadingContainer: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '80px 0',
    },
    spinner: {
        width: '45px',
        height: '45px',
        border: '5px solid #e0e0e0',
        borderTop: '5px solid #5b4fcf',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        marginBottom: '20px',
    },
    loadingText: {
        fontSize: '15px',
        color: '#666',
        fontWeight: '500',
    },
    formCard: {
        backgroundColor: '#fff',
        borderRadius: '16px',
        padding: '36px 40px 32px',
        boxShadow: '0 4px 18px rgba(0,0,0,0.04)',
    },
    formRow: {
        display: 'flex',
        gap: '30px',
        marginBottom: '22px',
        flexWrap: 'wrap',
    },
    formGroupHalf: {
        flex: 1,
        minWidth: '280px',
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
        marginBottom: '10px',
        textAlign: 'left',
    },
    inputReadOnly: {
        padding: '13px 18px',
        borderRadius: '10px',
        border: '1px solid #ccd1d9',
        fontSize: '14px',
        color: '#333',
        backgroundColor: '#ffffff',
        boxSizing: 'border-box',
        width: '100%',
        outline: 'none',
        boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.02)',
    },
    buttonRow: {
        display: 'flex',
        justifyContent: 'flex-end',
        marginTop: '15px',
    },
    submitButton: {
        padding: '12px 36px',
        borderRadius: '10px',
        border: 'none',
        background: 'linear-gradient(135deg, #5b4fcf, #6c63ff)',
        color: '#fff',
        fontSize: '15px',
        fontWeight: '600',
        cursor: 'pointer',
        boxShadow: '0 4px 12px rgba(108,99,255,0.25)',
        letterSpacing: '0.3px',
        transition: 'all 0.3s ease',
    },
    submitButtonDisabled: {
        background: '#a0a0a0',
        color: '#ffffff',
        cursor: 'not-allowed',
        boxShadow: 'none',
        opacity: '0.9',
    },
};

export default Tagihan;
