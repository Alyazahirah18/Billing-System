import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DashboardLayout from './DashboardLayout';

const AdminManajemenTagihan = ({ user }) => {
    const [data, setData] = useState({
        stats: {
            totalTagihan: 0,
            tagihanPending: 0,
            tagihanTerbayar: 0
        },
        customers: []
    });
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('Semua Status');

    const adminMenu = [
        { label: 'Dashboard', path: '/admin-dashboard' },
        { label: 'Manajemen Tagihan', path: '/admin/manajemen-tagihan' },
        { label: 'Manajemen Pelanggan', path: '/admin/manajemen-pelanggan' },
        { label: 'Manajemen Layanan', path: '/admin/manajemen-layanan' },
        { label: 'Manajemen E-ticketing', path: '/admin/manajemen-eticketing' },
    ];

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5000/api/dashboard/admin/tagihan', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setData(res.data);
        } catch (err) {
            console.error("Gagal mengambil data manajemen tagihan:", err);
            alert("Terjadi kesalahan saat memuat data manajemen tagihan.");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (customerId, newStatus) => {
        const confirmMessage = newStatus === 'aktif' 
            ? "Apakah Anda yakin ingin mengaktifkan kembali layanan untuk pelanggan ini?"
            : "Apakah Anda yakin ingin memblokir layanan untuk pelanggan ini?";
            
        if (!window.confirm(confirmMessage)) return;

        try {
            const token = localStorage.getItem('token');
            const res = await axios.put(`http://localhost:5000/api/dashboard/admin/tagihan/status/${customerId}`, {
                status: newStatus
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert(res.data.message);
            fetchData(); // Refresh data setelah aksi sukses
        } catch (err) {
            console.error("Gagal mengubah status layanan:", err);
            alert(err.response?.data?.message || "Gagal memperbarui status layanan.");
        }
    };

    // Filter Logic
    const filteredCustomers = data.customers.filter(c => {
        const matchesSearch = c.nama.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              c.userId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              c.jenisPaket.toLowerCase().includes(searchTerm.toLowerCase());
                              
        if (statusFilter === 'Semua Status') {
            return matchesSearch;
        }
        return matchesSearch && c.status.toUpperCase() === statusFilter.toUpperCase();
    });

    return (
        <DashboardLayout
            activeMenu="Manajemen Tagihan"
            pageTitle="Manajemen Tagihan"
            user={user}
            customMenuItems={adminMenu}
            hideHeader={true}
            noPadding={true}
        >
            <div style={styles.pageContainer}>
                {/* Header Row */}
                <div style={styles.customHeader}>
                    <button onClick={() => window.history.back()} style={styles.backButton}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="15 18 9 12 15 6"></polyline>
                        </svg>
                    </button>
                    <h2 style={styles.pageTitle}>Manajemen Tagihan</h2>
                </div>

                {/* Main Content Area */}
                <div style={styles.contentArea}>
                    <h3 style={styles.sectionHeadline}>Overview</h3>

                    {/* Overview Cards Container */}
                    <div style={styles.statsCardContainer}>
                        {/* Total Tagihan Card */}
                        <div style={styles.statCard}>
                            <div style={{ ...styles.statHeader, backgroundColor: '#9fa5b4' }}>
                                Total Tagihan
                            </div>
                            <div style={styles.statBody}>
                                {data.stats.totalTagihan}
                            </div>
                        </div>

                        {/* Tagihan Pending Card */}
                        <div style={styles.statCard}>
                            <div style={{ ...styles.statHeader, backgroundColor: '#ff4747' }}>
                                Tagihan Pending
                            </div>
                            <div style={styles.statBody}>
                                {data.stats.tagihanPending}
                            </div>
                        </div>

                        {/* Tagihan Terbayar Card */}
                        <div style={styles.statCard}>
                            <div style={{ ...styles.statHeader, backgroundColor: '#2ecc71' }}>
                                Tagihan Terbayar
                            </div>
                            <div style={styles.statBody}>
                                {data.stats.tagihanTerbayar}
                            </div>
                        </div>
                    </div>

                    {/* Filter and Search Bar Row */}
                    <div style={styles.filterRow}>
                        {/* Search Input */}
                        <input
                            type="text"
                            placeholder="Search"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={styles.searchInput}
                        />

                        {/* Status Select Dropdown */}
                        <div style={styles.selectWrapper}>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                style={styles.statusSelect}
                            >
                                <option value="Semua Status">Semua Status</option>
                                <option value="AKTIF">AKTIF</option>
                                <option value="JATUH TEMPO">JATUH TEMPO</option>
                                <option value="BLOCKIR">BLOCKIR</option>
                            </select>
                        </div>
                    </div>

                    {/* Customer Data Table */}
                    <div style={styles.tableWrapper}>
                        <table style={styles.table}>
                            <thead>
                                <tr>
                                    <th style={styles.th}>User ID</th>
                                    <th style={styles.th}>Nama</th>
                                    <th style={styles.th}>Jenis Paket</th>
                                    <th style={styles.th}>Status</th>
                                    <th style={styles.th}>Jatuh Tempo</th>
                                    <th style={styles.th}>Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr style={styles.tr}>
                                        <td colSpan="6" style={{ ...styles.td, color: '#666', padding: '30px' }}>
                                            Memuat data...
                                        </td>
                                    </tr>
                                ) : filteredCustomers.length > 0 ? (
                                    filteredCustomers.map((customer, index) => {
                                        const isStatusActive = customer.status === 'AKTIF';
                                        const isStatusOverdue = customer.status === 'JATUH TEMPO';
                                        const isStatusBlocked = customer.status === 'BLOCKIR';

                                        let statusColor = '#333';
                                        if (isStatusActive) statusColor = '#2ecc71';
                                        if (isStatusOverdue) statusColor = '#ff4747';

                                        return (
                                            <tr key={index} style={styles.tr}>
                                                <td style={{ ...styles.td, fontWeight: '600' }}>{customer.userId}</td>
                                                <td style={styles.td}>{customer.nama}</td>
                                                <td style={styles.td}>{customer.jenisPaket}</td>
                                                <td style={{ ...styles.td, color: statusColor, fontWeight: '700' }}>
                                                    {customer.status}
                                                </td>
                                                <td style={styles.td}>{customer.jatuhTempo}</td>
                                                <td style={styles.td}>
                                                    <div style={styles.actionIconContainer}>
                                                        {/* Wifi Signal Icon (Aktifkan) */}
                                                        <button
                                                            onClick={() => handleUpdateStatus(customer.id_pelanggan, 'aktif')}
                                                            style={styles.actionButton}
                                                            title="Aktifkan Layanan"
                                                            disabled={customer.statusLayanan === 'aktif'}
                                                        >
                                                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={customer.statusLayanan === 'aktif' ? '#2ecc71' : '#b0b5be'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                                <path d="M5 12.55a11 11 0 0 1 14.08 0" />
                                                                <path d="M1.42 9a16 16 0 0 1 21.16 0" />
                                                                <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
                                                                <circle cx="12" cy="20" r="1" fill={customer.statusLayanan === 'aktif' ? '#2ecc71' : '#b0b5be'} />
                                                            </svg>
                                                        </button>

                                                        {/* Forbidden Block Icon (Blokir) */}
                                                        <button
                                                            onClick={() => handleUpdateStatus(customer.id_pelanggan, 'blokir')}
                                                            style={styles.actionButton}
                                                            title="Blokir Layanan"
                                                            disabled={customer.statusLayanan === 'blokir'}
                                                        >
                                                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={customer.statusLayanan === 'blokir' ? '#ff4747' : '#555555'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                                <circle cx="12" cy="12" r="10" />
                                                                <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr style={styles.tr}>
                                        <td colSpan="6" style={{ ...styles.td, color: '#888', padding: '30px' }}>
                                            Tidak ditemukan data pelanggan untuk kriteria filter ini.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

const styles = {
    pageContainer: {
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: '82vh',
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
        backgroundColor: '#e9ebf0', // Greyish blue canvas
        padding: '30px 40px',
        flex: 1,
    },
    sectionHeadline: {
        fontSize: '16px',
        fontWeight: '600',
        color: '#1a1a2e',
        margin: '0 0 16px 0',
        textAlign: 'left'
    },
    statsCardContainer: {
        display: 'flex',
        backgroundColor: '#fff',
        padding: '30px 24px',
        borderRadius: '10px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
        marginBottom: '30px',
        justifyContent: 'space-around',
        gap: '30px',
        flexWrap: 'wrap'
    },
    statCard: {
        flex: 1,
        minWidth: '220px',
        maxWidth: '320px',
        border: '1px solid #e0e5eb',
        borderRadius: '8px',
        overflow: 'hidden',
        textAlign: 'center',
        boxShadow: '0 2px 6px rgba(0,0,0,0.01)'
    },
    statHeader: {
        color: '#fff',
        fontSize: '15px',
        fontWeight: '600',
        padding: '12px 10px',
    },
    statBody: {
        padding: '22px 10px',
        fontSize: '32px',
        fontWeight: '700',
        color: '#2c3e50',
    },
    filterRow: {
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '16px',
        marginBottom: '24px',
        flexWrap: 'wrap'
    },
    searchInput: {
        padding: '10px 16px',
        borderRadius: '10px',
        border: '1px solid #ccd1d9',
        fontSize: '14px',
        outline: 'none',
        width: '260px',
        backgroundColor: '#fff',
    },
    selectWrapper: {
        position: 'relative',
        display: 'inline-block',
    },
    statusSelect: {
        padding: '10px 40px 10px 16px',
        borderRadius: '10px',
        border: '1px solid #ccd1d9',
        fontSize: '14px',
        outline: 'none',
        cursor: 'pointer',
        backgroundColor: '#fff',
        appearance: 'none',
        fontWeight: '600',
        color: '#333',
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23333' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 16px center',
        backgroundSize: '16px',
    },
    tableWrapper: {
        overflowX: 'auto',
    },
    table: {
        width: '100%',
        borderCollapse: 'separate',
        borderSpacing: '0 10px', // Space between rows exactly like the image
    },
    th: {
        color: '#656d78',
        fontSize: '14px',
        fontWeight: '600',
        padding: '0 20px 8px',
        textAlign: 'center',
    },
    tr: {
        backgroundColor: '#fff',
        boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
        borderRadius: '8px',
    },
    td: {
        padding: '18px 20px',
        textAlign: 'center',
        fontSize: '14px',
        color: '#1a1a2e',
        verticalAlign: 'middle',
    },
    actionIconContainer: {
        display: 'flex',
        gap: '16px',
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionButton: {
        background: 'none',
        border: 'none',
        padding: '4px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'transform 0.2s',
    },
};

export default AdminManajemenTagihan;
