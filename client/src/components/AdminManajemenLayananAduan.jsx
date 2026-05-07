import React, { useEffect, useState } from 'react';
import axios from 'axios';
import DashboardLayout from './DashboardLayout';

const AdminManajemenLayananAduan = ({ user }) => {
    const [data, setData] = useState([]);
    const [stats, setStats] = useState({ total: 0, pending: 0, proses: 0, selesai: 0 });
    const [loading, setLoading] = useState(true);

    // Filter & Search
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('Semua Status');

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);

    const adminMenu = [
        { label: 'Dashboard', path: '/admin-dashboard' },
        { label: 'Manajemen Tagihan', path: '/admin/manajemen-tagihan' },
        { label: 'Manajemen Pelanggan', path: '/admin/manajemen-pelanggan' },
        { label: 'Manajemen Layanan', path: '/admin/manajemen-layanan' },
        { label: 'Manajemen E-ticketing', path: '/admin/manajemen-eticketing' },
    ];

    useEffect(() => {
        fetchAduanData();
    }, []);

    const fetchAduanData = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5000/api/dashboard/admin/layanan/aduan', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStats(res.data.stats);
            setData(res.data.data);
            setLoading(false);
        } catch (err) {
            console.error("Gagal mengambil data aduan", err);
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
        if (!window.confirm(`Apakah Anda yakin mengubah status menjadi ${newStatus === 'proses' ? 'Menunggu Perbaikan' : 'Selesai'}?`)) return;

        try {
            const token = localStorage.getItem('token');
            await axios.post('http://localhost:5000/api/dashboard/admin/layanan/aduan/update',
                { id_aduan: selectedItem.id_aduan, status: newStatus },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            alert('Status aduan berhasil diperbarui.');
            closeDetailModal();
            fetchAduanData(); // Refresh data
        } catch (err) {
            console.error('Gagal update status aduan', err);
            alert('Terjadi kesalahan saat mengupdate aduan.');
        }
    };

    // Filter data based on search term and status
    const filteredData = data.filter(item => {
        const matchSearch = item.userId.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.subjek.toLowerCase().includes(searchTerm.toLowerCase());

        let matchStatus = true;
        if (statusFilter !== 'Semua Status') {
            if (statusFilter === 'Pending') matchStatus = item.status === 'pending';
            if (statusFilter === 'Menunggu Perbaikan') matchStatus = item.status === 'proses';
            if (statusFilter === 'Selesai') matchStatus = item.status === 'selesai';
        }

        return matchSearch && matchStatus;
    });

    const getStatusText = (status) => {
        if (status === 'pending') return 'Pending';
        if (status === 'proses') return 'Menunggu Perbaikan';
        if (status === 'selesai') return 'Selesai';
        return status;
    };

    const getStatusColor = (status) => {
        if (status === 'pending') return '#f1c40f'; // Yellow
        if (status === 'proses') return '#e74c3c';  // Red
        if (status === 'selesai') return '#2ecc71'; // Green
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
                    <h2 style={styles.pageTitle}>Manajemen Layanan</h2>
                </div>

                <div style={styles.contentArea}>

                    {/* Stats Cards Row */}
                    <div style={styles.statsRow}>
                        <div style={{ ...styles.statCard, backgroundColor: '#e2ebfa' }}>
                            <div style={styles.statIconWrapper}>
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2b2a4c" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                                    <line x1="12" y1="8" x2="12" y2="12" />
                                    <line x1="12" y1="16" x2="12.01" y2="16" />
                                </svg>
                            </div>
                            <div style={styles.statInfo}>
                                <div style={styles.statLabel}>Total Aduan</div>
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

                        <div style={{ ...styles.statCard, backgroundColor: '#e9e6fa' }}>
                            <div style={styles.statIconWrapper}>
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2b2a4c" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                                </svg>
                            </div>
                            <div style={styles.statInfo}>
                                <div style={styles.statLabel}>Menunggu Perbaikan</div>
                                <div style={styles.statValue}>{stats.proses}</div>
                            </div>
                        </div>

                        <div style={{ ...styles.statCard, backgroundColor: '#e2fcf2' }}>
                            <div style={styles.statIconWrapper}>
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2b2a4c" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                            </div>
                            <div style={styles.statInfo}>
                                <div style={styles.statLabel}>Selesai</div>
                                <div style={styles.statValue}>{stats.selesai}</div>
                            </div>
                        </div>
                    </div>

                    {/* Filter Row */}
                    <div style={styles.filterRow}>
                        <input
                            type="text"
                            placeholder="Cari Laporan Aduan"
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
                            <option value="Menunggu Perbaikan">Menunggu Perbaikan</option>
                            <option value="Selesai">Selesai</option>
                        </select>
                    </div>

                    {/* Table Container */}
                    <div style={styles.tableContainer}>
                        <table style={styles.table}>
                            <thead>
                                <tr>
                                    <th style={styles.th}>No Aduan</th>
                                    <th style={styles.th}>User ID</th>
                                    <th style={styles.th}>Kategori</th>
                                    <th style={styles.th}>Tanggal</th>
                                    <th style={styles.th}>Deskripsi</th>
                                    <th style={styles.th}>Status</th>
                                    <th style={styles.th}>Action</th>
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
                                            <td style={styles.td}>{item.noAduan}</td>
                                            <td style={styles.td}>{item.userId}</td>
                                            <td style={styles.td}>{item.kategori}</td>
                                            <td style={styles.td}>{item.tanggal}</td>
                                            <td style={{ ...styles.td, textDecoration: 'underline', cursor: 'pointer' }} onClick={() => handleDetailClick(item)}>
                                                {item.subjek}
                                            </td>
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
                                        <td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>Tidak ada data aduan ditemukan.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal Detail Aduan */}
            {isModalOpen && selectedItem && (
                <div style={styles.modalOverlay} onClick={closeDetailModal}>
                    <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <div style={styles.modalHeader}>
                            <h3 style={styles.modalTitle}>Detail Pengaduan</h3>
                            <button onClick={closeDetailModal} style={styles.closeBtn}>&times;</button>
                        </div>
                        <div style={styles.modalBody}>
                            <div style={styles.detailRow}>
                                <div style={styles.detailLabel}>User ID:</div>
                                <div style={styles.detailValue}>{selectedItem.userId}</div>
                            </div>
                            <div style={styles.detailRow}>
                                <div style={styles.detailLabel}>Nama Pelanggan:</div>
                                <div style={styles.detailValue}>{selectedItem.nama}</div>
                            </div>
                            <div style={styles.detailRow}>
                                <div style={styles.detailLabel}>Judul Aduan:</div>
                                <div style={styles.detailValue}>{selectedItem.subjek}</div>
                            </div>
                            <div style={styles.detailRow}>
                                <div style={styles.detailLabel}>Status Saat Ini:</div>
                                <div style={{ ...styles.detailValue, color: getStatusColor(selectedItem.status), fontWeight: 'bold' }}>
                                    {getStatusText(selectedItem.status)}
                                </div>
                            </div>
                            <div style={{ marginTop: '15px' }}>
                                <div style={styles.detailLabel}>Deskripsi Lengkap:</div>
                                <div style={styles.descBox}>{selectedItem.deskripsi || '-'}</div>
                            </div>
                            {selectedItem.foto && (
                                <div style={{ marginTop: '15px' }}>
                                    <div style={styles.detailLabel}>Foto Kendala:</div>
                                    <img src={`http://localhost:5000${selectedItem.foto}`} alt="Bukti Kendala" style={styles.fotoBukti} />
                                </div>
                            )}

                            {/* Tombol Aksi - Hanya tampil jika status masih pending */}
                            {selectedItem.status === 'pending' && (
                                <div style={styles.actionButtonsContainer}>
                                    <button
                                        style={styles.menungguBtn}
                                        onClick={() => handleUpdateStatus('proses')}
                                    >
                                        Menunggu Perbaikan
                                    </button>
                                    <button
                                        style={styles.selesaiBtn}
                                        onClick={() => handleUpdateStatus('selesai')}
                                    >
                                        Selesai
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
        color: '#333'
    },
    detailRow: {
        display: 'flex',
        marginBottom: '10px'
    },
    detailLabel: {
        width: '140px',
        fontWeight: '600',
        color: '#555'
    },
    detailValue: {
        flex: 1
    },
    descBox: {
        backgroundColor: '#f5f5f5',
        padding: '15px',
        borderRadius: '6px',
        whiteSpace: 'pre-wrap',
        marginTop: '8px',
        border: '1px solid #eee'
    },
    fotoBukti: {
        maxWidth: '100%',
        marginTop: '8px',
        borderRadius: '6px',
        border: '1px solid #ddd'
    },
    actionButtonsContainer: {
        display: 'flex',
        gap: '15px',
        marginTop: '30px',
        paddingTop: '20px',
        borderTop: '1px solid #eee'
    },
    menungguBtn: {
        flex: 1,
        padding: '12px',
        backgroundColor: '#e9e6fa',
        color: '#5b4fcf',
        border: '1px solid #5b4fcf',
        borderRadius: '6px',
        fontWeight: '600',
        cursor: 'pointer',
        fontSize: '14px',
        transition: 'all 0.2s'
    },
    selesaiBtn: {
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

export default AdminManajemenLayananAduan;
