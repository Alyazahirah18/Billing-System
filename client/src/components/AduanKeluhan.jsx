import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DashboardLayout from './DashboardLayout';

const AduanKeluhan = ({ user }) => {
    const [subjek, setSubjek] = useState('');
    const [deskripsi, setDeskripsi] = useState('');
    const [foto, setFoto] = useState(null);
    const [riwayat, setRiwayat] = useState([]);
    const [loading, setLoading] = useState(false);

    // Modal state
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
    const [selectedAduan, setSelectedAduan] = useState(null);

    useEffect(() => {
        fetchRiwayat();
    }, []);

    const fetchRiwayat = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5000/api/aduan/riwayat', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setRiwayat(res.data);
        } catch (err) {
            console.error("Gagal mengambil riwayat aduan", err);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                alert("Ukuran file maksimal 5MB");
                e.target.value = null; // reset input
                return;
            }
            setFoto(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!subjek || !deskripsi) {
            alert('Judul dan deskripsi wajib diisi');
            return;
        }

        setLoading(true);
        const formData = new FormData();
        formData.append('subjek', subjek);
        formData.append('deskripsi', deskripsi);
        if (foto) {
            formData.append('foto', foto);
        }

        try {
            const token = localStorage.getItem('token');
            await axios.post('http://localhost:5000/api/aduan', formData, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            alert('Aduan berhasil diajukan');
            setSubjek('');
            setDeskripsi('');
            setFoto(null);
            document.getElementById('fileUpload').value = '';
            fetchRiwayat();
        } catch (err) {
            alert(err.response?.data?.message || 'Gagal mengajukan aduan');
        } finally {
            setLoading(false);
        }
    };

    const openDetailModal = (aduan) => {
        setSelectedAduan(aduan);
        setIsDetailModalOpen(true);
    };

    const openTicketModal = (aduan) => {
        setSelectedAduan(aduan);
        setIsTicketModalOpen(true);
    };

    const closeModals = () => {
        setIsDetailModalOpen(false);
        setIsTicketModalOpen(false);
        setSelectedAduan(null);
    };

    const handleKonfirmasiSelesai = async (idAduan) => {
        const confirmAction = await window.confirm("Apakah Anda yakin ingin menyatakan bahwa aduan ini telah selesai ditangani?");
        if (!confirmAction) return;

        try {
            const token = localStorage.getItem('token');
            await axios.post(`http://localhost:5000/api/aduan/konfirmasi/${idAduan}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('Aduan berhasil dikonfirmasi selesai.');
            fetchRiwayat();
        } catch (err) {
            console.error("Gagal mengonfirmasi aduan", err);
            alert(err.response?.data?.message || 'Gagal mengonfirmasi aduan selesai');
        }
    };

    const formatDate = (dateStr) => {
        const d = new Date(dateStr);
        return `${d.getDate()}-${d.getMonth() + 1}-${d.getFullYear()}`;
    };

    return (
        <DashboardLayout
            activeMenu="Aduan Keluhan"
            pageTitle="Aduan Keluhan"
            user={user}
            hideHeader={true}
            noPadding={true}
        >
            <div style={styles.pageContainer}>
                {/* Header */}
                <div style={styles.customHeader}>
                    <button onClick={() => window.history.back()} style={styles.backButton}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="15 18 9 12 15 6"></polyline>
                        </svg>
                    </button>
                    <h2 style={styles.pageTitle}>Pengaduan Keluhan</h2>
                </div>

                <div style={styles.contentArea}>
                    <div style={styles.splitLayout}>

                        {/* Form Section */}
                        <div style={styles.formSection}>
                            <form onSubmit={handleSubmit}>
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Judul Keluhan</label>
                                    <select
                                        style={styles.input}
                                        value={subjek}
                                        onChange={(e) => setSubjek(e.target.value)}
                                        required
                                    >
                                        <option value="" disabled hidden>Pilih Judul Keluhan</option>
                                        <option value="Jaringan Lambat">Jaringan Lambat</option>
                                        <option value="Jaringan Terputus">Jaringan Terputus</option>
                                        <option value="Router Rusak">Router Rusak</option>
                                        <option value="Kabel Putus">Kabel Putus</option>
                                        <option value="Router Mati">Router Mati</option>
                                    </select>
                                </div>
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Deskripsi</label>
                                    <textarea
                                        style={styles.textarea}
                                        placeholder="Tuliskan Detail Keluhan..."
                                        value={deskripsi}
                                        onChange={(e) => setDeskripsi(e.target.value)}
                                        required
                                    ></textarea>
                                </div>

                                <div style={styles.fileUploadContainer}>
                                    <span style={styles.fileLabel}>
                                        {foto ? foto.name : "Upload File IMG, PNG, JPEG"}
                                    </span>
                                    <div style={styles.fileAction}>
                                        <span style={styles.maxSize}>Max 5MB</span>
                                        <label htmlFor="fileUpload" style={styles.uploadIconLabel}>
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                                <polyline points="17 8 12 3 7 8" />
                                                <line x1="12" y1="3" x2="12" y2="15" />
                                            </svg>
                                        </label>
                                        <input
                                            id="fileUpload"
                                            type="file"
                                            accept="image/png, image/jpeg, image/jpg"
                                            style={{ display: 'none' }}
                                            onChange={handleFileChange}
                                        />
                                    </div>
                                </div>

                                <div style={styles.submitContainer}>
                                    <button type="submit" style={styles.submitBtn} disabled={loading}>
                                        {loading ? 'Mengajukan...' : 'Ajukan Keluhan'}
                                    </button>
                                </div>
                            </form>
                        </div>

                        {/* History Section */}
                        <div style={styles.historySection}>
                            <h3 style={styles.historyTitle}>Riwayat Keluhan</h3>
                            <div style={styles.historyBox}>
                                <p style={styles.historyNote}>Hanya menampilkan riwayat keluhan 5 terakhir*</p>

                                <div style={styles.historyList}>
                                    {riwayat.map((aduan) => (
                                        <div key={aduan.ID_ADUAN} style={styles.historyCard}>
                                            <div style={styles.cardLeft}>
                                                <div style={styles.cardTitle}>{aduan.SUBJEK}</div>
                                                <div style={styles.cardStatus}>
                                                    {aduan.STATUS_ADUAN === 'pending' ? 'Pending' :
                                                        aduan.STATUS_ADUAN === 'proses' ? 'Menunggu Perbaikan' : 'Selesai'}
                                                </div>
                                                <div style={styles.cardActions}>
                                                    <span style={styles.lihatDetailText}>Lihat Detail</span>
                                                    <button type="button" style={styles.iconBtn} onClick={() => openDetailModal(aduan)} title="Detail Keluhan">
                                                        {/* Document/Note Icon */}
                                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="#333" xmlns="http://www.w3.org/2000/svg">
                                                            <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
                                                        </svg>
                                                    </button>
                                                    <button type="button" style={styles.iconBtn} onClick={() => openTicketModal(aduan)} title="E-Ticket">
                                                        {/* Ticket/Receipt Icon */}
                                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="#333" xmlns="http://www.w3.org/2000/svg">
                                                            <path d="M22 10V6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v4c1.1 0 2 .9 2 2s-.9 2-2 2v4c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2v-4c-1.1 0-2-.9-2-2s.9-2 2-2zm-2 7.5c-1.88 0-3.41-1.53-3.41-3.41S18.12 10.68 20 10.68V7h-3v2h-2V7H9v2H7V7H5v3.68c1.88 0 3.41 1.53 3.41 3.41S6.88 17.5 5 17.5V19h15v-1.5z" />
                                                        </svg>
                                                    </button>
                                                    {aduan.STATUS_ADUAN === 'proses' && aduan.Ticket?.TICKET_STATUS === 'selesai' && (
                                                        <button
                                                            type="button"
                                                            style={styles.iconBtn}
                                                            onClick={() => handleKonfirmasiSelesai(aduan.ID_ADUAN)}
                                                            title="Konfirmasi Selesai"
                                                        >
                                                            {/* Check Circle Icon */}
                                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2ecc71" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
                                                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                                                <polyline points="22 4 12 14.01 9 11.01"></polyline>
                                                            </svg>
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                            <div style={styles.cardRight}>
                                                <div style={styles.cardDate}>Tanggal Pengajuan : {formatDate(aduan.TANGGAL_ADUAN)}</div>
                                            </div>
                                        </div>
                                    ))}
                                    {riwayat.length === 0 && (
                                        <div style={{ textAlign: 'center', color: '#666', marginTop: '20px' }}>
                                            Belum ada riwayat keluhan.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            {/* Detail Modal */}
            {isDetailModalOpen && selectedAduan && (
                <div style={styles.modalOverlay} onClick={closeModals}>
                    <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <div style={styles.modalHeader}>
                            <h3 style={styles.modalTitle}>Detail Keluhan</h3>
                            <button onClick={closeModals} style={styles.closeBtn}>&times;</button>
                        </div>
                        <div style={styles.modalBody}>
                            <p><strong>Judul:</strong> {selectedAduan.SUBJEK}</p>
                            <p><strong>Tanggal:</strong> {new Date(selectedAduan.TANGGAL_ADUAN).toLocaleString('id-ID')}</p>
                            <p><strong>Status:</strong> {selectedAduan.STATUS_ADUAN}</p>
                            <p><strong>Deskripsi:</strong></p>
                            <div style={styles.descBox}>{selectedAduan.DESKRIPSI_MASALAH}</div>
                            {selectedAduan.FOTO_KENDALA && (
                                <div style={styles.fotoContainer}>
                                    <p><strong>Foto Bukti:</strong></p>
                                    <img src={`http://localhost:5000${selectedAduan.FOTO_KENDALA}`} alt="Bukti Kendala" style={styles.fotoBukti} />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* E-Ticket Modal */}
            {isTicketModalOpen && selectedAduan && (
                <div style={styles.modalOverlay} onClick={closeModals}>
                    <div style={styles.ticketContent} onClick={(e) => e.stopPropagation()}>
                        <button onClick={closeModals} style={styles.ticketCloseBtn}>&times;</button>
                        <div style={styles.ticketHeader}>
                            <h2>E-Ticket Pengaduan</h2>
                        </div>
                        <div style={styles.ticketBody}>
                            <div style={styles.ticketRow}>
                                <span>No Tiket</span>
                                <strong>TKT-{selectedAduan.ID_ADUAN.toString().padStart(4, '0')}</strong>
                            </div>
                            <div style={styles.ticketRow}>
                                <span>Tanggal</span>
                                <strong>{formatDate(selectedAduan.TANGGAL_ADUAN)}</strong>
                            </div>
                            <div style={styles.ticketRow}>
                                <span>Judul</span>
                                <strong>{selectedAduan.SUBJEK}</strong>
                            </div>
                            <div style={styles.ticketRow}>
                                <span>Status</span>
                                <strong style={{ color: '#5b6abf', textTransform: 'uppercase' }}>{selectedAduan.STATUS_ADUAN}</strong>
                            </div>
                        </div>
                        <div style={styles.ticketFooter}>
                            <p>Simpan tiket ini untuk melacak status aduan Anda.</p>
                        </div>
                    </div>
                </div>
            )}

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
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
        zIndex: 1,
    },
    backButton: {
        width: '36px',
        height: '36px',
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
        color: '#000',
        margin: 0,
    },
    contentArea: {
        backgroundColor: '#fdf8f9', // Slight pinkish/gray background based on image
        padding: '40px',
        flex: 1,
    },
    splitLayout: {
        display: 'flex',
        gap: '40px',
        alignItems: 'flex-start'
    },
    formSection: {
        flex: '1',
        maxWidth: '500px'
    },
    formGroup: {
        marginBottom: '20px'
    },
    label: {
        display: 'block',
        fontSize: '15px',
        fontWeight: '600',
        color: '#333',
        marginBottom: '8px'
    },
    input: {
        width: '100%',
        padding: '12px 16px',
        borderRadius: '8px',
        border: '1px solid #666',
        fontSize: '14px',
        boxSizing: 'border-box'
    },
    textarea: {
        width: '100%',
        padding: '12px 16px',
        borderRadius: '8px',
        border: '1px solid #666',
        fontSize: '14px',
        minHeight: '200px',
        resize: 'vertical',
        boxSizing: 'border-box'
    },
    fileUploadContainer: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        border: '1px solid #666',
        borderRadius: '8px',
        marginBottom: '30px',
        backgroundColor: '#fff'
    },
    fileLabel: {
        color: '#888',
        fontSize: '13px'
    },
    fileAction: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
    },
    maxSize: {
        color: '#888',
        fontSize: '13px'
    },
    uploadIconLabel: {
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center'
    },
    submitContainer: {
        display: 'flex',
        justifyContent: 'flex-end'
    },
    submitBtn: {
        backgroundColor: '#5b6abf',
        color: '#fff',
        padding: '12px 24px',
        borderRadius: '8px',
        border: 'none',
        fontSize: '15px',
        fontWeight: '600',
        cursor: 'pointer',
        boxShadow: '0 4px 6px rgba(91,106,191,0.3)',
    },
    historySection: {
        flex: '1'
    },
    historyTitle: {
        fontSize: '18px',
        fontWeight: '600',
        color: '#333',
        marginTop: 0,
        marginBottom: '15px'
    },
    historyBox: {
        backgroundColor: '#fff',
        border: '1px solid #ccc',
        borderRadius: '12px',
        padding: '20px',
        minHeight: '400px'
    },
    historyNote: {
        fontSize: '11px',
        color: '#666',
        marginTop: 0,
        marginBottom: '15px',
        fontStyle: 'italic'
    },
    historyList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '15px'
    },
    historyCard: {
        backgroundColor: '#e0e0e0',
        borderRadius: '24px',
        padding: '16px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    cardLeft: {
        display: 'flex',
        flexDirection: 'column',
        gap: '4px'
    },
    cardTitle: {
        fontWeight: '700',
        fontSize: '14px',
        color: '#000'
    },
    cardStatus: {
        fontSize: '12px',
        color: '#555'
    },
    cardActions: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginTop: '8px'
    },
    lihatDetailText: {
        fontSize: '12px',
        color: '#333'
    },
    iconBtn: {
        background: 'none',
        border: 'none',
        padding: '0',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center'
    },
    cardRight: {
        alignSelf: 'flex-start'
    },
    cardDate: {
        fontSize: '12px',
        color: '#333'
    },
    modalOverlay: {
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
    },
    modalContent: {
        backgroundColor: '#fff',
        padding: '30px',
        borderRadius: '8px',
        width: '500px',
        maxWidth: '90%',
        maxHeight: '90vh',
        overflowY: 'auto'
    },
    modalHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        borderBottom: '1px solid #eee',
        paddingBottom: '10px'
    },
    modalTitle: {
        margin: 0,
        fontSize: '18px'
    },
    closeBtn: {
        background: 'none',
        border: 'none',
        fontSize: '24px',
        cursor: 'pointer',
        color: '#666'
    },
    modalBody: {
        fontSize: '14px',
        color: '#333',
        lineHeight: '1.6'
    },
    descBox: {
        backgroundColor: '#f5f5f5',
        padding: '15px',
        borderRadius: '6px',
        whiteSpace: 'pre-wrap',
        marginBottom: '15px'
    },
    fotoContainer: {
        marginTop: '15px'
    },
    fotoBukti: {
        maxWidth: '100%',
        borderRadius: '6px',
        border: '1px solid #ddd'
    },
    ticketContent: {
        backgroundColor: '#fff',
        borderRadius: '12px',
        width: '350px',
        padding: '0',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
    },
    ticketCloseBtn: {
        position: 'absolute',
        top: '10px',
        right: '15px',
        background: 'none',
        border: 'none',
        fontSize: '20px',
        color: '#fff',
        cursor: 'pointer'
    },
    ticketHeader: {
        backgroundColor: '#5b6abf',
        color: '#fff',
        padding: '20px',
        textAlign: 'center'
    },
    ticketBody: {
        padding: '25px',
        display: 'flex',
        flexDirection: 'column',
        gap: '15px'
    },
    ticketRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px dashed #ddd',
        paddingBottom: '10px',
        fontSize: '14px'
    },
    ticketFooter: {
        backgroundColor: '#f5f5f5',
        padding: '15px',
        textAlign: 'center',
        fontSize: '12px',
        color: '#666'
    }
};

export default AduanKeluhan;
