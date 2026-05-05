import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLocation } from 'react-router-dom';
import DashboardLayout from './DashboardLayout';

const PenjadwalanUlang = ({ user }) => {
    const location = useLocation();
    const [tickets, setTickets] = useState([]);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [kategori, setKategori] = useState('');
    const [tanggalBaru, setTanggalBaru] = useState('');
    const [waktuBaru, setWaktuBaru] = useState('');
    const [deskripsi, setDeskripsi] = useState('');
    const [loading, setLoading] = useState(false);
    const [namaPelanggan, setNamaPelanggan] = useState('');
    const [riwayat, setRiwayat] = useState([]);

    // Modal
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedRiwayat, setSelectedRiwayat] = useState(null);

    useEffect(() => {
        fetchTickets();
        fetchRiwayatReschedule();
    }, []);

    const fetchTickets = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5000/api/dashboard/pelanggan/tickets', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTickets(res.data);
            
            // Auto-fill if passed from notification modal
            if (location.state && location.state.ticket) {
                const passedTicket = location.state.ticket;
                // Find matching ticket in the list (to ensure we have all data)
                const found = res.data.find(t => t.id_ticket === passedTicket.id_ticket);
                if (found) {
                    setSelectedTicket(found);
                    setKategori(found.kategori);
                    setNamaPelanggan(found.nama_pelanggan);
                }
            } else if (res.data.length > 0) {
                setNamaPelanggan(res.data[0].nama_pelanggan);
            }
        } catch (err) {
            console.error("Gagal mengambil data ticket", err);
        }
    };

    const fetchRiwayatReschedule = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5000/api/dashboard/admin/layanan/reschedule', {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Filter hanya milik pelanggan ini berdasarkan userId
            const userData = JSON.parse(localStorage.getItem('user'));
            if (userData && res.data.data) {
                setRiwayat(res.data.data);
            }
        } catch (err) {
            console.error("Gagal mengambil riwayat reschedule", err);
        }
    };

    const handleTicketChange = (e) => {
        const ticketId = parseInt(e.target.value);
        const ticket = tickets.find(t => t.id_ticket === ticketId);
        setSelectedTicket(ticket || null);
        if (ticket) {
            setKategori(ticket.kategori);
        } else {
            setKategori('');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedTicket || !kategori || !tanggalBaru || !waktuBaru || !deskripsi) {
            alert('Semua field wajib diisi.');
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            await axios.post('http://localhost:5000/api/dashboard/pelanggan/reschedule', {
                id_ticket: selectedTicket.id_ticket,
                tanggal_baru: tanggalBaru,
                jam_baru: waktuBaru,
                deskripsi: deskripsi
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('Pengajuan penjadwalan ulang berhasil diajukan!');
            setSelectedTicket(null);
            setKategori('');
            setTanggalBaru('');
            setWaktuBaru('');
            setDeskripsi('');
            fetchRiwayatReschedule();
        } catch (err) {
            alert(err.response?.data?.message || 'Gagal mengajukan penjadwalan ulang.');
        } finally {
            setLoading(false);
        }
    };

    const openDetailModal = (item) => {
        setSelectedRiwayat(item);
        setIsDetailModalOpen(true);
    };

    const closeModals = () => {
        setIsDetailModalOpen(false);
        setSelectedRiwayat(null);
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'pending': return { color: '#f39c12', text: 'Pending' };
            case 'disetujui': return { color: '#2ecc71', text: 'Disetujui' };
            case 'ditolak': return { color: '#e74c3c', text: 'Ditolak' };
            default: return { color: '#333', text: status };
        }
    };

    return (
        <DashboardLayout
            activeMenu="Penjadwalan Ulang"
            pageTitle="Penjadwalan Ulang"
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
                    <h2 style={styles.pageTitle}>Penjadwalan Ulang</h2>
                </div>

                <div style={styles.contentArea}>
                    <div style={styles.splitLayout}>

                        {/* Form Section */}
                        <div style={styles.formSection}>
                            <form onSubmit={handleSubmit}>
                                {/* Nomor E-Ticket */}
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Nomor E-Ticket</label>
                                    <select
                                        style={styles.input}
                                        value={selectedTicket ? selectedTicket.id_ticket : ''}
                                        onChange={handleTicketChange}
                                        required
                                    >
                                        <option value="" disabled hidden>Pilih Nomor E-Ticket</option>
                                        {tickets.map(t => (
                                            <option key={t.id_ticket} value={t.id_ticket}>{t.e_ticket}</option>
                                        ))}
                                    </select>
                                    {tickets.length === 0 && (
                                        <p style={styles.helperText}>Belum ada e-ticket aktif untuk dijadwalkan ulang.</p>
                                    )}
                                </div>

                                {/* Nama Pelanggan */}
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Nama Pelanggan</label>
                                    <input
                                        type="text"
                                        style={{ ...styles.input, backgroundColor: '#f0f0f0' }}
                                        value={selectedTicket ? selectedTicket.nama_pelanggan : namaPelanggan || ''}
                                        disabled
                                    />
                                </div>

                                {/* Kategori Aduan */}
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Kategori Aduan</label>
                                    <select
                                        style={styles.input}
                                        value={kategori}
                                        onChange={(e) => setKategori(e.target.value)}
                                        required
                                    >
                                        <option value="" disabled hidden>Pilih Kategori Aduan</option>
                                        <option value="Jaringan Lambat">Jaringan Lambat</option>
                                        <option value="Jaringan Terputus">Jaringan Terputus</option>
                                        <option value="Router Rusak">Router Rusak</option>
                                        <option value="Kabel Putus">Kabel Putus</option>
                                        <option value="Router Mati">Router Mati</option>
                                    </select>
                                </div>

                                {/* Tanggal Perbaikan Baru */}
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Tanggal Perbaikan Baru</label>
                                    <input
                                        type="date"
                                        style={styles.input}
                                        value={tanggalBaru}
                                        onChange={(e) => setTanggalBaru(e.target.value)}
                                        required
                                    />
                                </div>

                                {/* Waktu Perbaikan Baru */}
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Waktu Perbaikan Baru</label>
                                    <input
                                        type="time"
                                        style={styles.input}
                                        value={waktuBaru}
                                        onChange={(e) => setWaktuBaru(e.target.value)}
                                        required
                                    />
                                </div>

                                {/* Deskripsi Alasan */}
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Deskripsi Alasan</label>
                                    <textarea
                                        style={styles.textarea}
                                        placeholder="Tuliskan alasan penjadwalan ulang..."
                                        value={deskripsi}
                                        onChange={(e) => setDeskripsi(e.target.value)}
                                        required
                                    ></textarea>
                                </div>

                                <div style={styles.submitContainer}>
                                    <button type="submit" style={styles.submitBtn} disabled={loading}>
                                        {loading ? 'Mengajukan...' : 'Ajukan Reschedule'}
                                    </button>
                                </div>
                            </form>
                        </div>

                        {/* Riwayat Section */}
                        <div style={styles.historySection}>
                            <h3 style={styles.historyTitle}>Riwayat Penjadwalan Ulang</h3>
                            <div style={styles.historyBox}>
                                <p style={styles.historyNote}>Menampilkan riwayat pengajuan penjadwalan ulang*</p>

                                <div style={styles.historyList}>
                                    {riwayat.map((item) => {
                                        const statusInfo = getStatusStyle(item.status);
                                        return (
                                            <div key={item.id_reschedule} style={styles.historyCard}>
                                                <div style={styles.cardLeft}>
                                                    <div style={styles.cardTitle}>{item.e_ticket} — {item.kategori}</div>
                                                    <div style={{ ...styles.cardStatus, color: statusInfo.color }}>
                                                        {statusInfo.text}
                                                    </div>
                                                    <div style={styles.cardActions}>
                                                        <span style={styles.lihatDetailText}>Lihat Detail</span>
                                                        <button type="button" style={styles.iconBtn} onClick={() => openDetailModal(item)} title="Detail Reschedule">
                                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="#333" xmlns="http://www.w3.org/2000/svg">
                                                                <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </div>
                                                <div style={styles.cardRight}>
                                                    <div style={styles.cardDate}>Jadwal Baru: {item.tanggal_baru} {item.jam_baru}</div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {riwayat.length === 0 && (
                                        <div style={{ textAlign: 'center', color: '#666', marginTop: '20px' }}>
                                            Belum ada riwayat penjadwalan ulang.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            {/* Detail Modal */}
            {isDetailModalOpen && selectedRiwayat && (
                <div style={styles.modalOverlay} onClick={closeModals}>
                    <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <div style={styles.modalHeader}>
                            <h3 style={styles.modalTitle}>Detail Penjadwalan Ulang</h3>
                            <button onClick={closeModals} style={styles.closeBtn}>&times;</button>
                        </div>
                        <div style={styles.modalBody}>
                            <div style={styles.detailRow}>
                                <div style={styles.detailLabel}>No. Reschedule:</div>
                                <div style={styles.detailValue}>{selectedRiwayat.noReschedule}</div>
                            </div>
                            <div style={styles.detailRow}>
                                <div style={styles.detailLabel}>Nomor E-Ticket:</div>
                                <div style={styles.detailValue}>{selectedRiwayat.e_ticket}</div>
                            </div>
                            <div style={styles.detailRow}>
                                <div style={styles.detailLabel}>Nama Pelanggan:</div>
                                <div style={styles.detailValue}>{selectedRiwayat.nama}</div>
                            </div>
                            <div style={styles.detailRow}>
                                <div style={styles.detailLabel}>Kategori Aduan:</div>
                                <div style={styles.detailValue}>{selectedRiwayat.kategori}</div>
                            </div>
                            <div style={styles.detailRow}>
                                <div style={styles.detailLabel}>Teknisi:</div>
                                <div style={styles.detailValue}>{selectedRiwayat.teknisi}</div>
                            </div>

                            <div style={styles.divider}></div>

                            <div style={styles.detailRow}>
                                <div style={styles.detailLabel}>Jadwal Lama:</div>
                                <div style={styles.detailValue}>{selectedRiwayat.tanggal_lama} — {selectedRiwayat.jam_lama}</div>
                            </div>
                            <div style={styles.detailRow}>
                                <div style={styles.detailLabel}>Jadwal Baru:</div>
                                <div style={{ ...styles.detailValue, fontWeight: '700', color: '#5b6abf' }}>
                                    {selectedRiwayat.tanggal_baru} — {selectedRiwayat.jam_baru}
                                </div>
                            </div>

                            <div style={styles.divider}></div>

                            <div style={{ marginTop: '10px' }}>
                                <div style={styles.detailLabel}>Alasan Reschedule:</div>
                                <div style={styles.descBox}>{selectedRiwayat.deskripsi}</div>
                            </div>

                            <div style={styles.detailRow}>
                                <div style={styles.detailLabel}>Status:</div>
                                <div style={{
                                    ...styles.detailValue,
                                    color: getStatusStyle(selectedRiwayat.status).color,
                                    fontWeight: 'bold',
                                    textTransform: 'capitalize'
                                }}>
                                    {getStatusStyle(selectedRiwayat.status).text}
                                </div>
                            </div>
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
        backgroundColor: '#fdf8f9',
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
        boxSizing: 'border-box',
        backgroundColor: '#fff'
    },
    textarea: {
        width: '100%',
        padding: '12px 16px',
        borderRadius: '8px',
        border: '1px solid #666',
        fontSize: '14px',
        minHeight: '120px',
        resize: 'vertical',
        boxSizing: 'border-box'
    },
    helperText: {
        fontSize: '12px',
        color: '#e74c3c',
        marginTop: '6px',
        fontStyle: 'italic'
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
        fontWeight: '600'
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
        overflowY: 'auto',
        boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
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
        fontSize: '18px',
        fontWeight: '700'
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
    detailRow: {
        display: 'flex',
        marginBottom: '10px'
    },
    detailLabel: {
        width: '150px',
        fontWeight: '600',
        color: '#555',
        flexShrink: 0
    },
    detailValue: {
        flex: 1
    },
    divider: {
        borderBottom: '1px dashed #ddd',
        margin: '15px 0'
    },
    descBox: {
        backgroundColor: '#f5f5f5',
        padding: '15px',
        borderRadius: '6px',
        whiteSpace: 'pre-wrap',
        marginTop: '8px',
        marginBottom: '15px',
        border: '1px solid #eee'
    }
};

export default PenjadwalanUlang;
