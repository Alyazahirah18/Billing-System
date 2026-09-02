import React, { useEffect, useState } from 'react';
import axios from 'axios';
import DashboardLayout from './DashboardLayout';

const TeknisiPenugasan = ({ user }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [notesTeknisi, setNotesTeknisi] = useState('');

    const teknisiMenu = [
        { label: 'Dashboard', path: '/teknisi-dashboard' },
        { label: 'Penugasan', path: '/teknisi-penugasan' },
        { label: 'Riwayat Penugasan', path: '/teknisi-riwayat' }
    ];

    useEffect(() => {
        fetchPenugasan();
    }, []);

    const fetchPenugasan = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/dashboard/teknisi/penugasan`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setData(res.data);
        } catch (err) {
            console.error("Gagal mengambil data penugasan", err);
        } finally {
            setLoading(false);
        }
    };

    const handleDetailClick = (item) => {
        setSelectedItem(item);
        setIsModalOpen(true);
    };

    const handleTicketClick = (item) => {
        setSelectedItem(item);
        setIsTicketModalOpen(true);
    };

    const closeDetailModal = () => {
        setIsModalOpen(false);
        setIsTicketModalOpen(false);
        setSelectedItem(null);
        setNotesTeknisi('');
    };

    const handleUpdateStatus = async (newStatus) => {
        if (newStatus === 'selesai' && !notesTeknisi.trim()) {
            alert('Mohon isi catatan penanganan terlebih dahulu sebelum menyelesaikan penugasan.');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            await axios.put(`${import.meta.env.VITE_BACKEND_URL}/api/dashboard/teknisi/penugasan/${selectedItem.id_ticket}`,
                { status: newStatus, notes_teknisi: notesTeknisi },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            alert('Status penugasan berhasil diperbarui.');
            closeDetailModal();
            fetchPenugasan(); // Refresh table
        } catch (err) {
            console.error('Gagal update status penugasan', err);
            alert('Terjadi kesalahan saat mengupdate status.');
        }
    };

    // Filter data based on search term
    const filteredData = data.filter(item => {
        const term = searchTerm.toLowerCase();
        return item.e_ticket.toLowerCase().includes(term) ||
            item.nama.toLowerCase().includes(term);
    });

    const getStatusColor = (status) => {
        if (status.toLowerCase() === 'open') return '#f1c40f'; // Yellow
        if (status.toLowerCase() === 'on progress') return '#e74c3c'; // Red
        if (status.toLowerCase() === 'selesai') return '#2ecc71'; // Green
        return '#333';
    };

    return (
        <DashboardLayout
            activeMenu="Penugasan"
            pageTitle="Penugasan"
            user={user}
            customMenuItems={teknisiMenu}
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
                    <h2 style={styles.pageTitle}>Penugasan</h2>
                </div>

                <div style={styles.contentArea}>

                    {/* Search Bar */}
                    <div style={styles.searchContainer}>
                        <input
                            type="text"
                            placeholder="Search"
                            style={styles.searchInput}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <h3 style={styles.sectionTitle}>Jadwal Penugasan</h3>

                    {/* Table Container */}
                    <div style={styles.tableContainer}>
                        <table style={styles.table}>
                            <thead>
                                <tr>
                                    <th style={styles.th}>No E-ticket</th>
                                    <th style={styles.th}>Nama</th>
                                    <th style={styles.th}>Alamat</th>
                                    <th style={styles.th}>Tanggal</th>
                                    <th style={styles.th}>Waktu</th>
                                    <th style={styles.th}>Status</th>
                                    <th style={styles.th}>Status</th> {/* Header ke-2 untuk aksi sesuai gambar */}
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>Memuat data...</td>
                                    </tr>
                                ) : filteredData.length > 0 ? (
                                    filteredData.map((item, idx) => (
                                        <tr key={idx} style={styles.tr}>
                                            <td
                                                style={{ ...styles.td, textDecoration: 'underline', cursor: 'pointer', color: '#5b6abf', fontWeight: 'bold' }}
                                                onClick={() => handleTicketClick(item)}
                                            >
                                                {item.e_ticket}
                                            </td>
                                            <td style={styles.td}>{item.nama}</td>
                                            <td style={styles.td}>{item.alamat}</td>
                                            <td style={styles.td}>{item.tanggal}</td>
                                            <td style={styles.td}>{item.waktu}</td>
                                            <td style={{ ...styles.td, color: getStatusColor(item.status) }}>
                                                {item.status}
                                            </td>
                                            <td style={styles.td}>
                                                <span style={styles.detailLink} onClick={() => handleDetailClick(item)}>Detail</span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>Tidak ada penugasan yang aktif.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal Detail Penugasan */}
            {isModalOpen && selectedItem && (
                <div style={styles.modalOverlay} onClick={closeDetailModal}>
                    <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <div style={styles.modalHeader}>
                            <h3 style={styles.modalTitle}>Detail Penugasan</h3>
                            <button onClick={closeDetailModal} style={styles.closeBtn}>&times;</button>
                        </div>
                        <div style={styles.modalBody}>
                            <p><strong>E-ticket:</strong> {selectedItem.e_ticket}</p>
                            <p><strong>Nama Pelanggan:</strong> {selectedItem.nama}</p>
                            <p><strong>Alamat:</strong> {selectedItem.alamat}</p>
                            <p><strong>Jadwal:</strong> {selectedItem.tanggal} - {selectedItem.waktu}</p>
                            <p><strong>Deskripsi Aduan:</strong></p>
                            <div style={styles.descBox}>{selectedItem.deskripsi || '-'}</div>

                            <p><strong>Status Saat Ini:</strong> <span style={{ color: getStatusColor(selectedItem.status), fontWeight: 'bold' }}>{selectedItem.status}</span></p>

                            {selectedItem.raw_status === 'on progress' && (
                                <div style={styles.notesContainer}>
                                    <p><strong>Catatan Penanganan:</strong></p>
                                    <textarea
                                        style={styles.textarea}
                                        placeholder="Tuliskan detail perbaikan atau penugasan yang telah dilakukan..."
                                        value={notesTeknisi}
                                        onChange={(e) => setNotesTeknisi(e.target.value)}
                                        rows="4"
                                    />
                                </div>
                            )}

                            <div style={styles.actionButtonsContainer}>
                                {selectedItem.raw_status === 'open' && (
                                    <button
                                        style={styles.onProgressBtn}
                                        onClick={() => handleUpdateStatus('on progress')}
                                    >
                                        Kerjakan (On Progress)
                                    </button>
                                )}
                                {(selectedItem.raw_status === 'open' || selectedItem.raw_status === 'on progress') && (
                                    <button
                                        style={styles.selesaiBtn}
                                        onClick={() => handleUpdateStatus('selesai')}
                                    >
                                        Selesai
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* E-Ticket Modal */}
            {isTicketModalOpen && selectedItem && (
                <div style={styles.modalOverlay} onClick={closeDetailModal}>
                    <div style={styles.ticketContent} onClick={(e) => e.stopPropagation()}>
                        <button onClick={closeDetailModal} style={styles.ticketCloseBtn}>&times;</button>
                        <div style={styles.ticketHeader}>
                            <h2>E-Ticket Penugasan</h2>
                        </div>
                        <div style={styles.ticketBody}>
                            <div style={styles.ticketRow}>
                                <span>No Tiket</span>
                                <strong>{selectedItem.e_ticket}</strong>
                            </div>
                            <div style={styles.ticketRow}>
                                <span>Kategori</span>
                                <strong>{selectedItem.kategori}</strong>
                            </div>
                            <div style={styles.ticketRow}>
                                <span>Jadwal</span>
                                <strong>{selectedItem.tanggal} - {selectedItem.waktu}</strong>
                            </div>
                            <div style={styles.ticketRow}>
                                <span>Status</span>
                                <strong style={{ color: '#e74c3c', textTransform: 'uppercase' }}>{selectedItem.status}</strong>
                            </div>
                        </div>
                        <div style={styles.ticketFooter}>
                            <p>Tiket tugas resmi Teknisi Signal Vision</p>
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
        backgroundColor: '#e9ebf0',
        padding: '30px 40px',
        flex: 1,
    },
    searchContainer: {
        marginBottom: '20px',
    },
    searchInput: {
        width: '100%',
        maxWidth: '800px',
        padding: '12px 20px',
        borderRadius: '8px',
        border: '1px solid #ccc',
        fontSize: '14px',
    },
    sectionTitle: {
        fontSize: '16px',
        fontWeight: '700',
        color: '#2a2656', // Purple color matching image
        marginBottom: '15px'
    },
    tableContainer: {
        backgroundColor: 'transparent',
    },
    table: {
        width: '100%',
        borderCollapse: 'separate',
        borderSpacing: '0 8px',
    },
    th: {
        textAlign: 'center',
        color: '#2a2656',
        fontSize: '15px',
        fontWeight: '600',
        padding: '0 16px 8px 16px',
        borderBottom: 'none',
    },
    tr: {
        backgroundColor: '#fff',
        boxShadow: '0 2px 5px rgba(0,0,0,0.02)',
    },
    td: {
        padding: '16px',
        textAlign: 'center',
        fontSize: '13px',
        color: '#333',
        fontWeight: '500'
    },
    detailLink: {
        color: '#3498db',
        textDecoration: 'underline',
        cursor: 'pointer',
        fontWeight: '500'
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
        width: '400px',
        maxWidth: '90%',
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
    descBox: {
        backgroundColor: '#f5f5f5',
        padding: '12px',
        borderRadius: '6px',
        margin: '10px 0',
        border: '1px solid #eee'
    },
    actionButtonsContainer: {
        display: 'flex',
        gap: '15px',
        marginTop: '25px'
    },
    onProgressBtn: {
        flex: 1,
        padding: '10px',
        backgroundColor: '#e74c3c',
        color: '#fff',
        border: 'none',
        borderRadius: '6px',
        fontWeight: '600',
        cursor: 'pointer'
    },
    selesaiBtn: {
        flex: 1,
        padding: '10px',
        backgroundColor: '#2ecc71',
        color: '#fff',
        border: 'none',
        borderRadius: '6px',
        fontWeight: '600',
        cursor: 'pointer'
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
    },
    notesContainer: {
        marginTop: '15px',
        marginBottom: '10px'
    },
    textarea: {
        width: '100%',
        padding: '10px',
        borderRadius: '6px',
        border: '1px solid #ccc',
        fontFamily: 'inherit',
        fontSize: '14px',
        resize: 'vertical'
    }
};

export default TeknisiPenugasan;
