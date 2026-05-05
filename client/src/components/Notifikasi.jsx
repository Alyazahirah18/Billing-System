import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from './DashboardLayout';

const Notifikasi = ({ user }) => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal state for Jadwal Perbaikan
    const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
    const [ticketDetail, setTicketDetail] = useState(null);
    const [modalLoading, setModalLoading] = useState(false);

    const navigate = useNavigate();

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5000/api/notifikasi', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications(res.data);
            setLoading(false);

            // Mark all as read when opening this page
            await axios.post('http://localhost:5000/api/notifikasi/mark-as-read', {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
        } catch (err) {
            console.error("Gagal mengambil notifikasi", err);
            setLoading(false);
        }
    };

    const handleNotifClick = async (notif) => {
        if (notif.KATEGORI_NOTIFIKASI === 'jadwal perbaikan' && notif.RELATED_ID) {
            setModalLoading(true);
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get(`http://localhost:5000/api/dashboard/pelanggan/ticket-detail/${notif.RELATED_ID}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setTicketDetail(res.data);
                setIsTicketModalOpen(true);
            } catch (err) {
                console.error("Gagal mengambil detail ticket", err);
                alert("Gagal memuat detail jadwal perbaikan.");
            } finally {
                setModalLoading(false);
            }
        }
    };

    const handleConfirmTicket = async () => {
        try {
            const token = localStorage.getItem('token');
            await axios.post('http://localhost:5000/api/dashboard/pelanggan/ticket-confirm', {
                id_ticket: ticketDetail.id_ticket
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert("Jadwal perbaikan telah disetujui.");
            setIsTicketModalOpen(false);
        } catch (err) {
            console.error("Gagal konfirmasi ticket", err);
            alert("Terjadi kesalahan.");
        }
    };

    const handleRescheduleRedirect = () => {
        navigate('/penjadwalan-ulang', { state: { ticket: ticketDetail } });
        setIsTicketModalOpen(false);
    };

    const getIcon = (kategori) => {
        switch (kategori) {
            case 'pembayaran':
                return (
                    <div style={{ ...styles.iconCircle, backgroundColor: '#e2fcf2' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#27ae60" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                            <line x1="1" y1="10" x2="23" y2="10" />
                        </svg>
                    </div>
                );
            case 'upgrade':
                return (
                    <div style={{ ...styles.iconCircle, backgroundColor: '#eef2ff' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#5b4fcf" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="17 11 12 6 7 11" />
                            <polyline points="17 18 12 13 7 18" />
                        </svg>
                    </div>
                );
            case 'aduan':
                return (
                    <div style={{ ...styles.iconCircle, backgroundColor: '#fff5f5' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#e74c3c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                            <line x1="12" y1="9" x2="12" y2="13" />
                            <line x1="12" y1="17" x2="12.01" y2="17" />
                        </svg>
                    </div>
                );
            case 'reschedule perbaikan':
            case 'jadwal perbaikan':
                return (
                    <div style={{ ...styles.iconCircle, backgroundColor: '#fff9e6' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f39c12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                            <line x1="16" y1="2" x2="16" y2="6" />
                            <line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                    </div>
                );
            case 'jatuh tempo':
                return (
                    <div style={{ ...styles.iconCircle, backgroundColor: '#ffeaea' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#e74c3c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                        </svg>
                    </div>
                );
            default:
                return (
                    <div style={{ ...styles.iconCircle, backgroundColor: '#f0f0f0' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                        </svg>
                    </div>
                );
        }
    };

    const formatDate = (dateString) => {
        const options = { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' };
        return new Date(dateString).toLocaleDateString('id-ID', options);
    };

    return (
        <DashboardLayout
            activeMenu=""
            pageTitle="Notifikasi"
            user={user}
            hideHeader={true}
            noPadding={true}
        >
            <div style={styles.pageContainer}>
                {/* Custom Header */}
                <div style={styles.customHeader}>
                    <button onClick={() => window.history.back()} style={styles.backButton}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="15 18 9 12 15 6"></polyline>
                        </svg>
                    </button>
                    <h2 style={styles.pageTitle}>Notifikasi</h2>
                </div>

                <div style={styles.contentArea}>
                    <div style={styles.notificationList}>
                        {loading ? (
                            <div style={styles.emptyState}>Memuat notifikasi...</div>
                        ) : notifications.length > 0 ? (
                            notifications.map((notif) => (
                                <div key={notif.ID_NOTIFIKASI}
                                    style={{
                                        ...styles.notificationCard,
                                        backgroundColor: notif.IS_READ ? '#fff' : '#f0f4ff',
                                        cursor: notif.KATEGORI_NOTIFIKASI === 'jadwal perbaikan' ? 'pointer' : 'default'
                                    }}
                                    onClick={() => handleNotifClick(notif)}
                                >
                                    <div style={styles.cardLeft}>
                                        {getIcon(notif.KATEGORI_NOTIFIKASI)}
                                    </div>
                                    <div style={styles.cardRight}>
                                        <div style={styles.cardHeader}>
                                            <h4 style={styles.notifTitle}>{notif.JUDUL}</h4>
                                            <span style={styles.notifTime}>{formatDate(notif.TANGGAL_NOTIFIKASI)}</span>
                                        </div>
                                        <p style={styles.notifMessage}>{notif.DESKRIPSI_PESAN}</p>
                                        {!notif.IS_READ && <div style={styles.unreadDot}></div>}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div style={styles.emptyState}>
                                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                                </svg>
                                <p style={{ marginTop: '15px', color: '#666' }}>Belum ada notifikasi.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Ticket Confirmation Modal */}
            {isTicketModalOpen && ticketDetail && (
                <div style={styles.modalOverlay} onClick={() => setIsTicketModalOpen(false)}>
                    <div style={styles.ticketModal} onClick={(e) => e.stopPropagation()}>
                        <h2 style={styles.modalHeading}>Jadwal Perbaikan Layanan</h2>

                        <div style={styles.modalRow}>
                            <div style={styles.modalCol}>
                                <label style={styles.modalLabel}>User ID</label>
                                <div style={styles.modalInput}>{ticketDetail.userId}</div>
                            </div>
                            <div style={styles.modalCol}>
                                <label style={styles.modalLabel}>Nama</label>
                                <div style={styles.modalInput}>{ticketDetail.nama}</div>
                            </div>
                        </div>

                        <div style={styles.modalFullRow}>
                            <label style={styles.modalLabel}>Nomor Handphone</label>
                            <div style={styles.modalInput}>{ticketDetail.telepon}</div>
                        </div>

                        <div style={styles.modalFullRow}>
                            <label style={styles.modalLabel}>Alamat</label>
                            <div style={styles.modalInput}>{ticketDetail.alamat}</div>
                        </div>

                        <div style={styles.modalFullRow}>
                            <label style={styles.modalLabel}>Nama Teknisi</label>
                            <div style={styles.modalInput}>{ticketDetail.nama_teknisi}</div>
                        </div>

                        <div style={styles.modalRow}>
                            <div style={styles.modalCol}>
                                <label style={styles.modalLabel}>Tanggal</label>
                                <div style={styles.modalInput}>
                                    {new Date(ticketDetail.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'numeric', year: 'numeric' })}
                                </div>
                            </div>
                            <div style={styles.modalCol}>
                                <label style={styles.modalLabel}>Waktu</label>
                                <div style={styles.modalInput}>{ticketDetail.waktu}</div>
                            </div>
                        </div>

                        <div style={styles.modalActions}>
                            <button style={styles.setujuBtn} onClick={handleConfirmTicket}>Setuju</button>
                            <button style={styles.rescheduleBtn} onClick={handleRescheduleRedirect}>Reschedule</button>
                        </div>
                    </div>
                </div>
            )}

            {modalLoading && (
                <div style={styles.modalOverlay}>
                    <div style={{ color: '#fff', fontSize: '18px' }}>Memuat detail...</div>
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
        backgroundColor: '#5b4fcf',
        border: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        boxShadow: '0 2px 6px rgba(91,79,207,0.3)',
        padding: 0,
    },
    pageTitle: {
        fontSize: '20px',
        fontWeight: '700',
        color: '#000',
        margin: 0,
    },
    contentArea: {
        backgroundColor: '#f5f7fb',
        padding: '30px 40px',
        flex: 1,
    },
    notificationList: {
        maxWidth: '800px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '15px'
    },
    notificationCard: {
        display: 'flex',
        padding: '20px',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        transition: 'transform 0.2s',
        position: 'relative'
    },
    cardLeft: {
        marginRight: '20px'
    },
    iconCircle: {
        width: '44px',
        height: '44px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    },
    cardRight: {
        flex: 1
    },
    cardHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '6px'
    },
    notifTitle: {
        margin: 0,
        fontSize: '16px',
        fontWeight: '700',
        color: '#2c3e50'
    },
    notifTime: {
        fontSize: '12px',
        color: '#95a5a6'
    },
    notifMessage: {
        margin: 0,
        fontSize: '14px',
        color: '#7f8c8d',
        lineHeight: '1.5'
    },
    unreadDot: {
        position: 'absolute',
        top: '20px',
        right: '20px',
        width: '10px',
        height: '10px',
        borderRadius: '50%',
        backgroundColor: '#e74c3c'
    },
    emptyState: {
        textAlign: 'center',
        padding: '80px 0',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
    },
    modalOverlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
    },
    ticketModal: {
        backgroundColor: '#fff',
        padding: '30px',
        borderRadius: '12px',
        width: '90%',
        maxWidth: '500px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
    },
    modalHeading: {
        fontSize: '24px',
        fontWeight: '700',
        color: '#1a1a2e',
        marginBottom: '20px',
        marginTop: 0
    },
    modalRow: {
        display: 'flex',
        gap: '20px',
        marginBottom: '15px'
    },
    modalCol: {
        flex: 1
    },
    modalFullRow: {
        marginBottom: '15px'
    },
    modalLabel: {
        display: 'block',
        fontSize: '14px',
        fontWeight: '600',
        color: '#333',
        marginBottom: '6px'
    },
    modalInput: {
        padding: '12px 16px',
        borderRadius: '8px',
        border: '1px solid #d1d8e0',
        backgroundColor: '#fff',
        fontSize: '14px',
        color: '#2c3e50',
        fontWeight: '500'
    },
    modalActions: {
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '12px',
        marginTop: '25px'
    },
    setujuBtn: {
        padding: '10px 24px',
        backgroundColor: '#52d852',
        color: '#fff',
        border: 'none',
        borderRadius: '8px',
        fontWeight: '700',
        cursor: 'pointer',
        boxShadow: '0 2px 6px rgba(82,216,82,0.3)'
    },
    rescheduleBtn: {
        padding: '10px 24px',
        backgroundColor: '#8d8d8d',
        color: '#fff',
        border: 'none',
        borderRadius: '8px',
        fontWeight: '700',
        cursor: 'pointer',
        boxShadow: '0 2px 6px rgba(141,141,141,0.3)'
    }
};

export default Notifikasi;
