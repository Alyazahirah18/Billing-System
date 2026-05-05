import React, { useEffect, useState } from 'react';
import axios from 'axios';
import DashboardLayout from './DashboardLayout';

const TeknisiRiwayatPenugasan = ({ user }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);

    const teknisiMenu = [
        { label: 'Dashboard', path: '/teknisi-dashboard' },
        { label: 'Penugasan', path: '/teknisi-penugasan' },
        { label: 'Riwayat Penugasan', path: '/teknisi-riwayat' }
    ];

    useEffect(() => {
        fetchRiwayat();
    }, []);

    const fetchRiwayat = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5000/api/dashboard/teknisi/riwayat', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setData(res.data);
        } catch (err) {
            console.error("Gagal mengambil data riwayat penugasan", err);
        } finally {
            setLoading(false);
        }
    };

    const handleTicketClick = (item) => {
        setSelectedItem(item);
        setIsTicketModalOpen(true);
    };

    const closeTicketModal = () => {
        setIsTicketModalOpen(false);
        setSelectedItem(null);
    };

    // Filter data based on search term and date range
    const filteredData = data.filter(item => {
        // Search Filter (by Nama or Kategori or E-ticket)
        const term = searchTerm.toLowerCase();
        const matchSearch = item.e_ticket.toLowerCase().includes(term) || 
                            item.nama.toLowerCase().includes(term) ||
                            item.kategori.toLowerCase().includes(term);

        // Date Filter
        let matchDate = true;
        if (startDate && endDate) {
            const itemDate = new Date(item.raw_tanggal);
            const start = new Date(startDate);
            const end = new Date(endDate);
            // reset time for proper comparison
            start.setHours(0,0,0,0);
            end.setHours(23,59,59,999);
            matchDate = itemDate >= start && itemDate <= end;
        }

        return matchSearch && matchDate;
    });

    return (
        <DashboardLayout
            activeMenu="Riwayat Penugasan"
            pageTitle="Riwayat Penugasan"
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
                    <h2 style={styles.pageTitle}>Riwayat Penugasan</h2>
                </div>

                <div style={styles.contentArea}>
                    
                    {/* Filters Row */}
                    <div style={styles.filterRow}>
                        <input 
                            type="text" 
                            placeholder="Search" 
                            style={styles.searchInput} 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <div style={styles.dateFilterContainer}>
                            <input 
                                type="date" 
                                style={styles.dateInput} 
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                            <span style={{ margin: '0 10px', color: '#555' }}>-</span>
                            <input 
                                type="date" 
                                style={styles.dateInput} 
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </div>
                    </div>

                    <h3 style={styles.sectionTitle}>Riwayat Penugasan</h3>

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
                                    <th style={styles.th}>Kategori</th>
                                    <th style={styles.th}>Status</th>
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
                                                style={{...styles.td, textDecoration: 'underline', cursor: 'pointer', color: '#5b6abf', fontWeight: 'bold'}}
                                                onClick={() => handleTicketClick(item)}
                                            >
                                                {item.e_ticket}
                                            </td>
                                            <td style={styles.td}>{item.nama}</td>
                                            <td style={styles.td}>{item.alamat}</td>
                                            <td style={styles.td}>{item.tanggal}</td>
                                            <td style={styles.td}>{item.waktu}</td>
                                            <td style={styles.td}>{item.kategori}</td>
                                            <td style={{ ...styles.td, color: '#2ecc71' }}>
                                                {item.status}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>Tidak ada riwayat penugasan ditemukan.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* E-Ticket Modal */}
            {isTicketModalOpen && selectedItem && (
                <div style={styles.modalOverlay} onClick={closeTicketModal}>
                    <div style={styles.ticketContent} onClick={(e) => e.stopPropagation()}>
                        <button onClick={closeTicketModal} style={styles.ticketCloseBtn}>&times;</button>
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
                                <strong style={{ color: '#2ecc71', textTransform: 'uppercase' }}>{selectedItem.status}</strong>
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
    filterRow: {
        display: 'flex',
        gap: '20px',
        marginBottom: '20px',
    },
    searchInput: {
        flex: 2,
        padding: '12px 20px',
        borderRadius: '8px',
        border: '1px solid #ccc',
        fontSize: '14px',
    },
    dateFilterContainer: {
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        backgroundColor: '#fff',
        border: '1px solid #ccc',
        borderRadius: '8px',
        padding: '0 10px'
    },
    dateInput: {
        border: 'none',
        padding: '12px 5px',
        outline: 'none',
        fontSize: '14px',
        flex: 1,
        backgroundColor: 'transparent'
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
    modalOverlay: {
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
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

export default TeknisiRiwayatPenugasan;
