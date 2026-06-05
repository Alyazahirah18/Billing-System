import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import DashboardLayout from './DashboardLayout';

const OwnerLogActivity = () => {
    const navigate = useNavigate();
    const [logs, setLogs] = useState([]);
    const [filteredLogs, setFilteredLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterRole, setFilterRole] = useState('semua'); // 'semua', 'admin', 'teknisi'
    const [searchTerm, setSearchTerm] = useState('');

    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));

    const ownerMenu = [
        { label: 'Dashboard', path: '/owner-dashboard' },
        { label: 'Log Activity', path: '/owner-log-activity' },
        { label: 'Laporan', path: '/owner/laporan' }
    ];

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const res = await axios.get('http://localhost:5000/api/dashboard/owner/logs', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setLogs(res.data || []);
            setFilteredLogs(res.data || []);
        } catch (err) {
            console.error('Gagal memuat log aktivitas:', err);
            alert('Sesi Anda berakhir atau server tidak dapat dihubungi. Silakan login kembali.');
            navigate('/staff-login');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!token) {
            navigate('/staff-login');
            return;
        }
        fetchLogs();
    }, [token]);

    // Handle filtering & searching
    useEffect(() => {
        let result = logs;

        if (filterRole !== 'semua') {
            result = result.filter(log => log.level?.toLowerCase() === filterRole);
        }

        if (searchTerm.trim() !== '') {
            const term = searchTerm.toLowerCase();
            result = result.filter(log => 
                log.user?.toLowerCase().includes(term) ||
                log.activity?.toLowerCase().includes(term) ||
                log.context?.toLowerCase().includes(term)
            );
        }

        setFilteredLogs(result);
    }, [filterRole, searchTerm, logs]);

    const formatDatetime = (dateStr) => {
        if (!dateStr) return '-';
        const d = new Date(dateStr);
        return d.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div style={styles.loadingScreen}>
                <div style={styles.spinner}></div>
                <p style={{ marginTop: '15px', color: '#5b4fcf', fontWeight: 'bold' }}>Memuat Log Aktivitas...</p>
            </div>
        );
    }

    return (
        <DashboardLayout
            activeMenu="Log Activity"
            pageTitle="Log Aktivitas Staff"
            user={user}
            customMenuItems={ownerMenu}
            hideHeader={true}
            noPadding={true}
        >
            <div style={styles.pageContainer}>
                {/* Header */}
                <div style={styles.customHeader}>
                    <button onClick={() => navigate('/owner-dashboard')} style={styles.backButton}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="15 18 9 12 15 6"></polyline>
                        </svg>
                    </button>
                    <h2 style={styles.pageTitle}>Log Aktivitas Staff (Admin & Teknisi)</h2>
                </div>

                {/* Content Area with Grey background */}
                <div style={styles.contentArea}>
                    
                    {/* Controls Card */}
                    <div style={styles.controlsCard}>
                        <div style={styles.searchContainer}>
                            <input
                                type="text"
                                placeholder="Cari berdasarkan user, aktivitas, detail..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={styles.searchInput}
                            />
                        </div>

                        <div style={styles.filterContainer}>
                            <span style={styles.filterLabel}>Filter Peran:</span>
                            <button 
                                onClick={() => setFilterRole('semua')}
                                style={{
                                    ...styles.filterBtn,
                                    ...(filterRole === 'semua' ? styles.filterBtnActive : {})
                                }}
                            >
                                Semua
                            </button>
                            <button 
                                onClick={() => setFilterRole('admin')}
                                style={{
                                    ...styles.filterBtn,
                                    ...(filterRole === 'admin' ? styles.filterBtnActiveAdmin : {})
                                }}
                            >
                                Admin
                            </button>
                            <button 
                                onClick={() => setFilterRole('teknisi')}
                                style={{
                                    ...styles.filterBtn,
                                    ...(filterRole === 'teknisi' ? styles.filterBtnActiveTeknisi : {})
                                }}
                            >
                                Teknisi
                            </button>
                        </div>
                    </div>

                    {/* Table Card */}
                    <div style={styles.tableCard}>
                        {filteredLogs.length > 0 ? (
                            <div style={{ overflowX: 'auto' }}>
                                <table style={styles.table}>
                                    <thead>
                                        <tr>
                                            <th style={{ ...styles.th, width: '150px' }}>Level</th>
                                            <th style={{ ...styles.th, width: '150px' }}>User</th>
                                            <th style={{ ...styles.th, width: '220px' }}>Activity</th>
                                            <th style={styles.th}>Context</th>
                                            <th style={{ ...styles.th, width: '200px' }}>Datetime</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredLogs.map((log) => {
                                            const role = log.level?.toLowerCase();
                                            const badgeStyle = role === 'admin' 
                                                ? styles.badgeAdmin 
                                                : styles.badgeTeknisi;

                                            return (
                                                <tr key={log.id} style={styles.tr}>
                                                    <td style={styles.td}>
                                                        <span style={badgeStyle}>
                                                            {log.level?.toUpperCase()}
                                                        </span>
                                                    </td>
                                                    <td style={{ ...styles.td, fontWeight: '700', color: '#1a1a2e' }}>
                                                        @{log.user}
                                                    </td>
                                                    <td style={{ ...styles.td, fontWeight: '600', color: '#1e293b' }}>
                                                        {log.activity}
                                                    </td>
                                                    <td style={{ ...styles.td, color: '#475569', lineHeight: '1.4' }}>
                                                        {log.context}
                                                    </td>
                                                    <td style={{ ...styles.td, color: '#64748b', fontSize: '13px', fontWeight: '500' }}>
                                                        {formatDatetime(log.datetime)}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div style={styles.emptyState}>
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10" />
                                    <line x1="12" y1="8" x2="12" y2="12" />
                                    <line x1="12" y1="16" x2="12.01" y2="16" />
                                </svg>
                                <p style={styles.emptyText}>Tidak ada data log aktivitas yang cocok dengan pencarian.</p>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </DashboardLayout>
    );
};

// Premium Styles
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
    controlsCard: {
        backgroundColor: '#ffffff',
        borderRadius: '8px',
        padding: '20px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
        marginBottom: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '15px'
    },
    searchContainer: {
        flex: '1',
        minWidth: '280px',
    },
    searchInput: {
        width: '100%',
        padding: '11px 16px',
        borderRadius: '8px',
        border: '1px solid #cbd5e1',
        fontSize: '14px',
        color: '#1e293b',
        outline: 'none',
        boxSizing: 'border-box',
        transition: 'all 0.15s',
    },
    filterContainer: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
    },
    filterLabel: {
        fontSize: '13.5px',
        fontWeight: '700',
        color: '#475569',
        marginRight: '6px',
    },
    filterBtn: {
        padding: '7px 16px',
        border: '1px solid #e2e8f0',
        borderRadius: '6px',
        backgroundColor: '#f8fafc',
        color: '#475569',
        fontWeight: '600',
        fontSize: '13px',
        cursor: 'pointer',
        transition: 'all 0.15s',
    },
    filterBtnActive: {
        backgroundColor: '#5b4fcf',
        color: '#ffffff',
        borderColor: '#5b4fcf',
    },
    filterBtnActiveAdmin: {
        backgroundColor: '#7c3aed',
        color: '#ffffff',
        borderColor: '#7c3aed',
    },
    filterBtnActiveTeknisi: {
        backgroundColor: '#16a34a',
        color: '#ffffff',
        borderColor: '#16a34a',
    },
    tableCard: {
        backgroundColor: '#ffffff',
        borderRadius: '8px',
        padding: '24px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse',
        textAlign: 'left',
        fontSize: '14px',
    },
    th: {
        padding: '14px 16px',
        backgroundColor: '#f8fafc',
        borderBottom: '2px solid #e2e8f0',
        color: '#475569',
        fontWeight: '700',
    },
    tr: {
        borderBottom: '1px solid #f1f5f9',
        transition: 'background-color 0.15s',
        '&:hover': {
            backgroundColor: '#f8fafc',
        }
    },
    td: {
        padding: '16px',
        color: '#475569',
        verticalAlign: 'middle',
    },
    badgeAdmin: {
        padding: '5px 12px',
        borderRadius: '12px',
        fontSize: '11px',
        fontWeight: '700',
        backgroundColor: '#f5f3ff',
        color: '#7c3aed',
        border: '1px solid #ddd6fe',
        display: 'inline-block',
    },
    badgeTeknisi: {
        padding: '5px 12px',
        borderRadius: '12px',
        fontSize: '11px',
        fontWeight: '700',
        backgroundColor: '#f0fdf4',
        color: '#16a34a',
        border: '1px solid #bbf7d0',
        display: 'inline-block',
    },
    emptyState: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
    },
    emptyText: {
        marginTop: '12px',
        color: '#64748b',
        fontSize: '14px',
        fontWeight: '500',
    },
    loadingScreen: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        backgroundColor: '#f5f7fb',
    },
    spinner: {
        width: '45px',
        height: '45px',
        border: '4px solid #f3f3f3',
        borderTop: '4px solid #5b4fcf',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
    },
};

export default OwnerLogActivity;
