import React, { useState, useEffect } from 'react';
import DashboardLayout from './DashboardLayout';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const UpgradeLayanan = ({ user }) => {
    const [layananAktif, setLayananAktif] = useState('Memuat...');
    const [hargaAktif, setHargaAktif] = useState(0);
    const [idPaketAktif, setIdPaketAktif] = useState(null);
    const [paketList, setPaketList] = useState([]);
    const [selectedPaket, setSelectedPaket] = useState('');
    const [loading, setLoading] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('token');
                const summaryRes = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/dashboard/summary`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setLayananAktif(summaryRes.data.jenis_layanan || 'Belum ada layanan aktif');
                setIdPaketAktif(summaryRes.data.id_paket || null);

                const paketRes = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/paket`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setPaketList(paketRes.data);

                if (summaryRes.data.id_paket) {
                    const paketAktif = paketRes.data.find(p => parseInt(p.ID_PAKET) === parseInt(summaryRes.data.id_paket));
                    if (paketAktif) setHargaAktif(parseFloat(paketAktif.HARGA_PAKET) || 0);
                }
            } catch (err) {
                console.error('Gagal mengambil data:', err);
                setLayananAktif('Gagal memuat');
            }
        };
        fetchData();
    }, []);

    const userId = user ? `SGP${String(user.id).padStart(4, '0')}` : 'SGP0000';
    const userName = user ? user.nama : 'Nama Pengguna';

    const selectedPaketData = paketList.find(p => parseInt(p.ID_PAKET) === parseInt(selectedPaket));
    const hargaBaru = selectedPaketData ? parseFloat(selectedPaketData.HARGA_PAKET) : 0;
    const isUpgrade = hargaBaru > hargaAktif;
    const selisihHarga = Math.abs(hargaBaru - hargaAktif);

    const formatRupiah = (num) =>
        new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

    const handleKonfirmasiClick = () => {
        if (!selectedPaket) { alert('Silakan pilih produk layanan yang ingin di upgrade/downgrade'); return; }
        if (idPaketAktif && parseInt(selectedPaket) === parseInt(idPaketAktif)) {
            alert('Anda tidak dapat memilih paket layanan yang sama dengan paket yang sedang aktif saat ini.'); return;
        }
        setShowConfirmModal(true);
    };

    const handleUpgrade = async () => {
        setShowConfirmModal(false);
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/pelanggan/upgrade`, { id_paket: selectedPaket }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert(res.data.message || 'Pengajuan berhasil dikirim!');
            setLayananAktif(res.data.paketBaru || 'Memuat...');
            setIdPaketAktif(parseInt(selectedPaket));
            setSelectedPaket('');
            if (res.data.redirect === 'tagihan') navigate('/tagihan');
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || 'Terjadi kesalahan saat mengajukan perubahan layanan.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardLayout activeMenu="Upgrade Layanan" pageTitle="Upgrade Layanan" user={user} hideHeader={true} noPadding={true}>
            <div style={styles.pageContainer}>
                <div style={styles.customHeader}>
                    <button onClick={() => window.history.back()} style={styles.backButton}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="15 18 9 12 15 6"></polyline>
                        </svg>
                    </button>
                    <h2 style={styles.pageTitle}>Upgrade Layanan</h2>
                </div>

                <div style={styles.container}>
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Nama Pelanggan</label>
                        <input type="text" value={userName} readOnly style={styles.input} />
                    </div>
                    <div style={styles.formGroup}>
                        <label style={styles.label}>User ID</label>
                        <input type="text" value={userId} readOnly style={styles.input} />
                    </div>
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Layanan Aktif</label>
                        <input type="text" value={layananAktif} readOnly style={styles.input} />
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
                                        {p.NAMA_PAKET} — {formatRupiah(p.HARGA_PAKET)}/bulan
                                    </option>
                                ))}
                            </select>
                            <div style={styles.dropdownIcon}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="#666" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M7 10l5 5 5-5H7z" />
                                </svg>
                            </div>
                        </div>
                    </div>
                    <div style={styles.buttonContainer}>
                        <button onClick={handleKonfirmasiClick} style={styles.button} disabled={loading}>
                            {loading ? 'Memproses...' : 'Upgrade Layanan'}
                        </button>
                    </div>
                </div>
            </div>

            {showConfirmModal && selectedPaketData && (
                <div style={styles.modalOverlay} onClick={() => setShowConfirmModal(false)}>
                    <div style={styles.modalBox} onClick={(e) => e.stopPropagation()}>

                        <div style={{ ...styles.modalHeader, background: isUpgrade ? 'linear-gradient(135deg, #5b4fcf, #6c63ff)' : 'linear-gradient(135deg, #e67e22, #f39c12)' }}>
                            <div style={styles.modalHeaderIcon}>
                                {isUpgrade ? (
                                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="17 11 12 6 7 11" /><polyline points="17 18 12 13 7 18" />
                                    </svg>
                                ) : (
                                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="17 6 12 11 7 6" /><polyline points="17 13 12 18 7 13" />
                                    </svg>
                                )}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={styles.modalHeaderTitle}>Konfirmasi {isUpgrade ? 'Upgrade' : 'Downgrade'} Layanan</div>
                                <div style={styles.modalHeaderSubtitle}>Pastikan Anda sudah membaca detail perubahan di bawah ini</div>
                            </div>
                            <button style={styles.modalCloseBtn} onClick={() => setShowConfirmModal(false)}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>

                        <div style={styles.modalBody}>
                            <div style={styles.compareRow}>
                                <div style={{ ...styles.compareCard, ...styles.compareCardOld }}>
                                    <div style={styles.compareCardLabel}>Paket Saat Ini</div>
                                    <div style={styles.compareCardName}>{layananAktif}</div>
                                    <div style={styles.compareCardPrice}>
                                        {hargaAktif > 0 ? formatRupiah(hargaAktif) : 'Rp 0'}
                                        <span style={styles.compareCardPerMonth}>/bulan</span>
                                    </div>
                                </div>
                                <div style={styles.compareArrow}>
                                    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke={isUpgrade ? '#6c63ff' : '#e67e22'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                                    </svg>
                                </div>
                                <div style={{ ...styles.compareCard, ...(isUpgrade ? styles.compareCardUpgrade : styles.compareCardDowngrade) }}>
                                    <div style={styles.compareCardLabel}>Paket Baru</div>
                                    <div style={styles.compareCardName}>{selectedPaketData.NAMA_PAKET}</div>
                                    <div style={styles.compareCardPrice}>
                                        {formatRupiah(hargaBaru)}
                                        <span style={styles.compareCardPerMonth}>/bulan</span>
                                    </div>
                                </div>
                            </div>

                            <div style={styles.detailSection}>
                                <div style={styles.detailTitle}>Perincian Perubahan</div>
                                <div style={styles.detailRow}>
                                    <span style={styles.detailKey}>Nama Paket</span>
                                    <span style={styles.detailValue}>
                                        <span style={styles.detailOld}>{layananAktif}</span>
                                        <span style={styles.detailArrowSmall}>→</span>
                                        <span style={{ ...styles.detailNew, color: isUpgrade ? '#5b4fcf' : '#e67e22' }}>{selectedPaketData.NAMA_PAKET}</span>
                                    </span>
                                </div>
                                <div style={{ ...styles.detailRow, borderBottom: 'none' }}>
                                    <span style={styles.detailKey}>Biaya Bulanan</span>
                                    <span style={styles.detailValue}>
                                        <span style={styles.detailOld}>{hargaAktif > 0 ? formatRupiah(hargaAktif) : 'Rp 0'}</span>
                                        <span style={styles.detailArrowSmall}>→</span>
                                        <span style={{ ...styles.detailNew, color: isUpgrade ? '#5b4fcf' : '#e67e22' }}>{formatRupiah(hargaBaru)}</span>
                                    </span>
                                </div>
                                <div style={{ ...styles.selisihBadge, background: isUpgrade ? '#f0eeff' : '#fff4e6', borderColor: isUpgrade ? '#c4b8ff' : '#ffd9a0' }}>
                                    <span style={{ fontSize: '20px' }}>{isUpgrade ? '⬆️' : '⬇️'}</span>
                                    <div>
                                        <div style={{ fontWeight: '700', color: isUpgrade ? '#5b4fcf' : '#e67e22', fontSize: '14px' }}>
                                            Biaya {isUpgrade ? 'bertambah' : 'berkurang'} {formatRupiah(selisihHarga)}/bulan
                                        </div>
                                        <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>
                                            Dari {formatRupiah(hargaAktif > 0 ? hargaAktif : 0)} menjadi {formatRupiah(hargaBaru)} per bulan
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div style={{ ...styles.infoBox, background: isUpgrade ? '#f0eeff' : '#fff8f0', borderLeft: `4px solid ${isUpgrade ? '#6c63ff' : '#e67e22'}` }}>
                                {isUpgrade ? (
                                    <>
                                        <div style={{ fontWeight: '700', color: '#5b4fcf', marginBottom: '8px', fontSize: '13px' }}>ℹ️ Informasi Upgrade</div>
                                        <ul style={styles.infoList}>
                                            <li>Tagihan upgrade sebesar <strong>{formatRupiah(hargaBaru)}</strong> akan dibuat dan harus dibayar terlebih dahulu.</li>
                                            <li>Setelah pembayaran dikonfirmasi admin, paket Anda diperbarui ke <strong>{selectedPaketData.NAMA_PAKET}</strong>.</li>
                                            <li>Anda akan diarahkan ke halaman Tagihan untuk melakukan pembayaran.</li>
                                        </ul>
                                    </>
                                ) : (
                                    <>
                                        <div style={{ fontWeight: '700', color: '#e67e22', marginBottom: '8px', fontSize: '13px' }}>ℹ️ Informasi Downgrade</div>
                                        <ul style={styles.infoList}>
                                            <li>Pengajuan downgrade ke paket <strong>{selectedPaketData.NAMA_PAKET}</strong> akan dikirim ke admin.</li>
                                            <li>Perubahan layanan aktif setelah mendapat persetujuan dari admin.</li>
                                            <li>Biaya bulanan berkurang <strong>{formatRupiah(selisihHarga)}</strong> mulai periode berikutnya.</li>
                                        </ul>
                                    </>
                                )}
                            </div>
                        </div>

                        <div style={styles.modalFooter}>
                            <button style={styles.btnBatal} onClick={() => setShowConfirmModal(false)}>Batal</button>
                            <button
                                style={{ ...styles.btnKonfirmasi, background: isUpgrade ? 'linear-gradient(135deg, #5b4fcf, #6c63ff)' : 'linear-gradient(135deg, #e67e22, #f39c12)' }}
                                onClick={handleUpgrade}
                            >
                                {isUpgrade ? '✅ Ya, Ajukan Upgrade' : '✅ Ya, Ajukan Downgrade'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
};

const styles = {
    pageContainer: { display: 'flex', flexDirection: 'column', height: '100%', minHeight: '80vh' },
    customHeader: { backgroundColor: '#fff', padding: '24px 40px', display: 'flex', alignItems: 'center', gap: '14px', borderBottom: '1px solid #f0f0f0' },
    backButton: { width: '38px', height: '38px', borderRadius: '50%', backgroundColor: '#5b6abf', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 6px rgba(91,106,191,0.3)', padding: 0 },
    pageTitle: { fontSize: '20px', fontWeight: '700', color: '#1a1a2e', margin: 0 },
    container: { backgroundColor: '#f9f5f7', padding: '40px', flex: 1 },
    formGroup: { marginBottom: '20px', display: 'flex', flexDirection: 'column' },
    label: { fontSize: '15px', fontWeight: '500', color: '#333', marginBottom: '8px', textAlign: 'left' },
    input: { padding: '12px 16px', borderRadius: '8px', border: '1px solid #555', fontSize: '15px', color: '#000', outline: 'none', backgroundColor: '#fff', boxSizing: 'border-box', width: '100%', fontWeight: '500' },
    selectWrapper: { position: 'relative', display: 'flex', alignItems: 'center' },
    select: { padding: '12px 16px', paddingRight: '40px', borderRadius: '8px', border: '1px solid #555', fontSize: '15px', outline: 'none', backgroundColor: '#fff', appearance: 'none', WebkitAppearance: 'none', boxSizing: 'border-box', width: '100%', cursor: 'pointer', fontWeight: '500' },
    dropdownIcon: { position: 'absolute', right: '12px', pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    buttonContainer: { display: 'flex', justifyContent: 'flex-end', marginTop: '24px' },
    button: { padding: '12px 32px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg, #5b4fcf, #6c63ff)', color: '#fff', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 10px rgba(91,106,191,0.3)' },
    modalOverlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' },
    modalBox: { backgroundColor: '#fff', borderRadius: '20px', width: '100%', maxWidth: '540px', boxShadow: '0 20px 60px rgba(0,0,0,0.25)', overflow: 'hidden', maxHeight: '90vh', overflowY: 'auto' },
    modalHeader: { padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '14px', position: 'relative' },
    modalHeaderIcon: { width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    modalHeaderTitle: { fontSize: '16px', fontWeight: '700', color: '#fff', lineHeight: '1.3' },
    modalHeaderSubtitle: { fontSize: '12px', color: 'rgba(255,255,255,0.8)', marginTop: '3px' },
    modalCloseBtn: { position: 'absolute', top: '14px', right: '14px', background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 },
    modalBody: { padding: '20px 24px 8px' },
    compareRow: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' },
    compareCard: { flex: 1, borderRadius: '12px', padding: '14px 12px', border: '1.5px solid', textAlign: 'center' },
    compareCardOld: { borderColor: '#e0e0e0', backgroundColor: '#fafafa' },
    compareCardUpgrade: { borderColor: '#a89bff', backgroundColor: '#f4f2ff' },
    compareCardDowngrade: { borderColor: '#ffc080', backgroundColor: '#fff9f0' },
    compareCardLabel: { fontSize: '10px', fontWeight: '700', color: '#999', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' },
    compareCardName: { fontSize: '13px', fontWeight: '700', color: '#1a1a2e', marginBottom: '6px', lineHeight: '1.3' },
    compareCardPrice: { fontSize: '15px', fontWeight: '800', color: '#333' },
    compareCardPerMonth: { fontSize: '11px', fontWeight: '400', color: '#999' },
    compareArrow: { flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' },
    detailSection: { backgroundColor: '#f8f8f8', borderRadius: '12px', padding: '14px 16px', marginBottom: '14px' },
    detailTitle: { fontSize: '11px', fontWeight: '700', color: '#555', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' },
    detailRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #ececec' },
    detailKey: { fontSize: '13px', color: '#666', fontWeight: '500', flexShrink: 0, marginRight: '10px' },
    detailValue: { fontSize: '13px', fontWeight: '600', color: '#333', display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap', justifyContent: 'flex-end', textAlign: 'right' },
    detailOld: { color: '#bbb', textDecoration: 'line-through', fontSize: '12px', fontWeight: '400' },
    detailArrowSmall: { color: '#ccc', fontSize: '13px' },
    detailNew: { fontWeight: '700', fontSize: '13px' },
    selisihBadge: { display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid', marginTop: '12px' },
    infoBox: { borderRadius: '10px', padding: '14px 16px', fontSize: '13px', color: '#555', lineHeight: '1.6', marginBottom: '4px' },
    infoList: { margin: '0', paddingLeft: '18px', color: '#555', fontSize: '13px', lineHeight: '1.9' },
    modalFooter: { padding: '16px 24px 24px', display: 'flex', gap: '10px', justifyContent: 'flex-end' },
    btnBatal: { padding: '11px 22px', borderRadius: '10px', border: '1.5px solid #e0e0e0', backgroundColor: '#fff', color: '#555', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
    btnKonfirmasi: { padding: '11px 26px', borderRadius: '10px', border: 'none', color: '#fff', fontSize: '14px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 14px rgba(0,0,0,0.15)' },
};

export default UpgradeLayanan;
