import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from './DashboardLayout';

const AdminManajemenLayananReschedule = ({ user }) => {
    const navigate = useNavigate();
    const [data, setData] = useState([]);
    const [stats, setStats] = useState({ total: 0, pending: 0, disetujui: 0, ditolak: 0 });
    const [loading, setLoading] = useState(true);

    // Filter & Search
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('Semua Status');

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);

    const adminMenu = [
        { label: 'Dashboard', path: '/admin-dashboard' },
        { label: 'Manajemen Tagihan', path: '#' },
        { label: 'Manajemen Pelanggan', path: '/admin/manajemen-pelanggan' },
        { label: 'Manajemen Layanan', path: '/admin/manajemen-layanan' },
        { label: 'Manajemen E-ticketing', path: '/admin/manajemen-eticketing' },
    ];

    useEffect(() => {
        fetchRescheduleData();
    }, []);

    const fetchRescheduleData = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5000/api/dashboard/admin/layanan/reschedule', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStats(res.data.stats);
            setData(res.data.data);
            setLoading(false);
        } catch (err) {
            console.error("Gagal mengambil data reschedule", err);
            setLoading(false);
        }
    };

    const handleDetailClick = (item) => {
        setSelectedItem(item);
        setIsModalOpen(true);
    };

    const closeDetailModal = () => {
        setIsModalOpen(false);
        setSelectedItem(null);
    };

    const handleUpdateStatus = async (newStatus) => {
        const label = newStatus === 'disetujui' ? 'Menyetujui' : 'Menolak';
        if (!window.confirm(`Apakah Anda yakin ${label} reschedule ini?`)) return;

        try {
            const token = localStorage.getItem('token');
            await axios.post('http://localhost:5000/api/dashboard/admin/layanan/reschedule/update',
                { id_reschedule: selectedItem.id_reschedule, status: newStatus },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            alert(`Reschedule berhasil ${newStatus === 'disetujui' ? 'disetujui' : 'ditolak'}.`);
            
            if (newStatus === 'disetujui') {
                // Direct to e-ticketing with data
                navigate('/admin/manajemen-eticketing', { state: { rescheduleData: selectedItem } });
            } else {
                closeDetailModal();
                fetchRescheduleData();
            }
        } catch (err) {
            console.error('Gagal update status reschedule', err);
            alert('Terjadi kesalahan saat mengupdate reschedule.');
        }
    };

    // Filter data
    const filteredData = data.filter(item => {
        const matchSearch = item.userId.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.e_ticket.toLowerCase().includes(searchTerm.toLowerCase());

        let matchStatus = true;
        if (statusFilter !== 'Semua Status') {
            if (statusFilter === 'Pending') matchStatus = item.status === 'pending';
            if (statusFilter === 'Disetujui') matchStatus = item.status === 'disetujui';
            if (statusFilter === 'Ditolak') matchStatus = item.status === 'ditolak';
        }

        return matchSearch && matchStatus;
    });

    const getStatusText = (status) => {
        if (status === 'pending') return 'Pending';
        if (status === 'disetujui') return 'Disetujui';
        if (status === 'ditolak') return 'Ditolak';
        return status;
    };

    const getStatusColor = (status) => {
        if (status === 'pending') return '#f1c40f';
        if (status === 'disetujui') return '#2ecc71';
        if (status === 'ditolak') return '#e74c3c';
        return '#333';
    };

    return (
        <DashboardLayout
            activeMenu="Manajemen Layanan"
            pageTitle="Manajemen Layanan"
            user={user}
            customMenuItems={adminMenu}
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
                    <h2 style={styles.pageTitle}>Manajemen Layanan — Reschedule</h2>
                </div>

                <div style={styles.contentArea}>

                    {/* Stats Cards Row */}
                    <div style={styles.statsRow}>
                        <div style={{ ...styles.statCard, backgroundColor: '#e2ebfa' }}>
                            <div style={styles.statIconWrapper}>
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2b2a4c" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                    <line x1="16" y1="2" x2="16" y2="6" />
                                    <line x1="8" y1="2" x2="8" y2="6" />
                                    <line x1="3" y1="10" x2="21" y2="10" />
                                </svg>
                            </div>
                            <div style={styles.statInfo}>
                                <div style={styles.statLabel}>Total Reschedule</div>
                                <div style={styles.statValue}>{stats.total}</div>
                            </div>
                        </div>

                        <div style={{ ...styles.statCard, backgroundColor: '#dff6f9' }}>
                            <div style={styles.statIconWrapper}>
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2b2a4c" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
                                    <path d="M22 12A10 10 0 0 0 12 2v10z" />
                                </svg>
                            </div>
                            <div style={styles.statInfo}>
                                <div style={styles.statLabel}>Pending</div>
                                <div style={styles.statValue}>{stats.pending}</div>
                            </div>
                        </div>

                        <div style={{ ...styles.statCard, backgroundColor: '#e2fcf2' }}>
                            <div style={styles.statIconWrapper}>
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2b2a4c" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                            </div>
                            <div style={styles.statInfo}>
                                <div style={styles.statLabel}>Disetujui</div>
                                <div style={styles.statValue}>{stats.disetujui}</div>
                            </div>
                        </div>

                        <div style={{ ...styles.statCard, backgroundColor: '#fce4e4' }}>
                            <div style={styles.statIconWrapper}>
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2b2a4c" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </div>
                            <div style={styles.statInfo}>
                                <div style={styles.statLabel}>Ditolak</div>
                                <div style={styles.statValue}>{stats.ditolak}</div>
                            </div>
                        </div>
                    </div>

                    {/* Filter Row */}
                    <div style={styles.filterRow}>
                        <input
                            type="text"
                            placeholder="Cari Reschedule (User ID, Nama, E-ticket)"
                            style={styles.searchInput}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <select
                            style={styles.selectFilter}
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="Semua Status">Semua Status</option>
                            <option value="Pending">Pending</option>
                            <option value="Disetujui">Disetujui</option>
                            <option value="Ditolak">Ditolak</option>
                        </select>
                    </div>

                    {/* Table Container */}
                    <div style={styles.tableContainer}>
                        <table style={styles.table}>
                            <thead>
                                <tr>
                                    <th style={styles.th}>No</th>
                                    <th style={styles.th}>E-Ticket</th>
                                    <th style={styles.th}>User ID</th>
                                    <th style={styles.th}>Kategori</th>
                                    <th style={styles.th}>Jadwal Lama</th>
                                    <th style={styles.th}>Jadwal Baru</th>
                                    <th style={styles.th}>Status</th>
                                    <th style={styles.th}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan="8" style={{ textAlign: 'center', padding: '20px' }}>Memuat data...</td>
                                    </tr>
                                ) : filteredData.length > 0 ? (
                                    filteredData.map((item, idx) => (
                                        <tr key={idx} style={styles.tr}>
                                            <td style={styles.td}>{item.noReschedule}</td>
                                            <td style={styles.td}>{item.e_ticket}</td>
                                            <td style={styles.td}>{item.userId}</td>
                                            <td style={styles.td}>{item.kategori}</td>
                                            <td style={styles.td}>{item.tanggal_lama} {item.jam_lama}</td>
                                            <td style={{ ...styles.td, fontWeight: '600', color: '#5b6abf' }}>{item.tanggal_baru} {item.jam_baru}</td>
                                            <td style={{ ...styles.td, color: getStatusColor(item.status) }}>
                                                {getStatusText(item.status)}
                                            </td>
                                            <td style={styles.td}>
                                                <button style={styles.detailLink} onClick={() => handleDetailClick(item)}>Detail</button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="8" style={{ textAlign: 'center', padding: '20px' }}>Tidak ada data reschedule ditemukan.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal Detail Reschedule */}
            {isModalOpen && selectedItem && (
                <div style={styles.modalOverlay} onClick={closeDetailModal}>
                    <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <div style={styles.modalHeader}>
                            <h3 style={styles.modalTitle}>Detail Reschedule</h3>
                            <button onClick={closeDetailModal} style={styles.closeBtn}>&times;</button>
                        </div>
                        <div style={styles.modalBody}>
                            <div style={styles.detailRow}>
                                <div style={styles.detailLabel}>No. Reschedule:</div>
                                <div style={styles.detailValue}>{selectedItem.noReschedule}</div>
                            </div>
                            <div style={styles.detailRow}>
                                <div style={styles.detailLabel}>E-Ticket:</div>
                                <div style={styles.detailValue}>{selectedItem.e_ticket}</div>
                            </div>
                            <div style={styles.detailRow}>
                                <div style={styles.detailLabel}>User ID:</div>
                                <div style={styles.detailValue}>{selectedItem.userId}</div>
                            </div>
                            <div style={styles.detailRow}>
                                <div style={styles.detailLabel}>Nama Pelanggan:</div>
                                <div style={styles.detailValue}>{selectedItem.nama}</div>
                            </div>
                            <div style={styles.detailRow}>
                                <div style={styles.detailLabel}>Kategori Aduan:</div>
                                <div style={styles.detailValue}>{selectedItem.kategori}</div>
                            </div>
                            <div style={styles.detailRow}>
                                <div style={styles.detailLabel}>Teknisi:</div>
                                <div style={styles.detailValue}>{selectedItem.teknisi}</div>
                            </div>

                            <div style={styles.divider}></div>

                            <div style={styles.detailRow}>
                                <div style={styles.detailLabel}>Jadwal Lama:</div>
                                <div style={styles.detailValue}>{selectedItem.tanggal_lama} — {selectedItem.jam_lama}</div>
                            </div>
                            <div style={styles.detailRow}>
                                <div style={styles.detailLabel}>Jadwal Baru:</div>
                                <div style={{ ...styles.detailValue, fontWeight: '700', color: '#5b6abf' }}>
                                    {selectedItem.tanggal_baru} — {selectedItem.jam_baru}
                                </div>
                            </div>

                            <div style={styles.divider}></div>

                            <div style={{ marginTop: '10px' }}>
                                <div style={styles.detailLabel}>Alasan Reschedule:</div>
                                <div style={styles.descBox}>{selectedItem.deskripsi}</div>
                            </div>

                            <div style={styles.detailRow}>
                                <div style={styles.detailLabel}>Status Saat Ini:</div>
                                <div style={{ ...styles.detailValue, color: getStatusColor(selectedItem.status), fontWeight: 'bold' }}>
                                    {getStatusText(selectedItem.status)}
                                </div>
                            </div>

                            {/* Action Buttons - Only show for pending */}
                            {selectedItem.status === 'pending' && (
                                <div style={styles.actionButtonsContainer}>
                                    <button
                                        style={styles.tolakBtn}
                                        onClick={() => handleUpdateStatus('ditolak')}
                                    >
                                        Tolak
                                    </button>
                                    <button
                                        style={styles.setujuBtn}
                                        onClick={() => handleUpdateStatus('disetujui')}
                                    >
                                        Setujui
                                    </button>
                                </div>
                            )}
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
    statsRow: {
        display: 'flex',
        gap: '20px',
        marginBottom: '20px',
        backgroundColor: '#fff',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
    },
    statCard: {
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        padding: '20px',
        borderRadius: '8px',
        gap: '15px'
    },
    statIconWrapper: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    },
    statInfo: {
        display: 'flex',
        flexDirection: 'column'
    },
    statLabel: {
        fontSize: '14px',
        color: '#2b2a4c',
        fontWeight: '600',
        marginBottom: '4px'
    },
    statValue: {
        fontSize: '24px',
        fontWeight: '800',
        color: '#2b2a4c',
    },
    filterRow: {
        display: 'flex',
        gap: '20px',
        marginBottom: '20px',
    },
    searchInput: {
        flex: 1,
        padding: '12px 20px',
        borderRadius: '8px',
        border: '1px solid #ccc',
        fontSize: '14px',
    },
    selectFilter: {
        width: '200px',
        padding: '12px 20px',
        borderRadius: '8px',
        border: '1px solid #ccc',
        fontSize: '14px',
        backgroundColor: '#fff'
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
        color: '#5a5c69',
        fontSize: '14px',
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
        color: '#000',
        fontWeight: '500'
    },
    detailLink: {
        background: 'none',
        border: 'none',
        color: '#3498db',
        textDecoration: 'underline',
        cursor: 'pointer',
        fontSize: '13px',
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
        width: '550px',
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
        color: '#333'
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
    },
    actionButtonsContainer: {
        display: 'flex',
        gap: '15px',
        marginTop: '30px',
        paddingTop: '20px',
        borderTop: '1px solid #eee'
    },
    tolakBtn: {
        flex: 1,
        padding: '12px',
        backgroundColor: '#fce4e4',
        color: '#e74c3c',
        border: '1px solid #e74c3c',
        borderRadius: '6px',
        fontWeight: '600',
        cursor: 'pointer',
        fontSize: '14px',
        transition: 'all 0.2s'
    },
    setujuBtn: {
        flex: 1,
        padding: '12px',
        backgroundColor: '#2ecc71',
        color: '#fff',
        border: 'none',
        borderRadius: '6px',
        fontWeight: '600',
        cursor: 'pointer',
        fontSize: '14px',
        transition: 'all 0.2s'
    }
};

export default AdminManajemenLayananReschedule;
