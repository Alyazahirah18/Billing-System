import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import DashboardLayout from './DashboardLayout';

const OwnerLaporan = () => {
    const navigate = useNavigate();
    const [selectedJenis, setSelectedJenis] = useState('pelanggan'); // 'pelanggan', 'pendapatan', 'aduan'
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [reportData, setReportData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [hasQueried, setHasQueried] = useState(false);

    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));

    const ownerMenu = [
        { label: 'Dashboard', path: '/owner-dashboard' },
        { label: 'Log Activity', path: '/owner-log-activity' },
        { label: 'Laporan', path: '/owner/laporan' }
    ];

    useEffect(() => {
        if (!token) {
            navigate('/staff-login');
            return;
        }
    }, [token]);

    const handleFetchReport = async (e) => {
        e.preventDefault();
        if (!startDate || !endDate) {
            alert('Silakan pilih rentang tanggal laporan terlebih dahulu.');
            return;
        }

        try {
            setLoading(true);
            setHasQueried(true);
            const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/dashboard/owner/laporan`, {
                params: {
                    jenis: selectedJenis,
                    startDate,
                    endDate
                },
                headers: { Authorization: `Bearer ${token}` }
            });
            setReportData(res.data.data || []);
        } catch (err) {
            console.error('Gagal mengambil laporan:', err);
            alert('Gagal mengambil data laporan. Pastikan sesi Anda aktif.');
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadCSV = () => {
        if (reportData.length === 0) {
            alert('Tidak ada data untuk didownload.');
            return;
        }

        const headers = Object.keys(reportData[0]);
        const csvRows = [];

        // Add UTF-8 BOM so Excel opens it with correct Indonesian characters
        csvRows.push('\uFEFF' + headers.map(h => `"${h.replace(/"/g, '""')}"`).join(','));

        for (const row of reportData) {
            const values = headers.map(header => {
                const val = row[header] === null || row[header] === undefined ? '' : row[header];
                const escaped = ('' + val).replace(/"/g, '""');
                return `"${escaped}"`;
            });
            csvRows.push(values.join(','));
        }

        const csvContent = csvRows.join('\r\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);

        const formatJenisName = selectedJenis.charAt(0).toUpperCase() + selectedJenis.slice(1);
        const filename = `Laporan_Data_${formatJenisName}_${startDate}_sd_${endDate}.csv`;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <DashboardLayout
            activeMenu="Laporan"
            pageTitle="Laporan Owner"
            user={user}
            customMenuItems={ownerMenu}
            hideHeader={true}
            noPadding={true}
        >
            <div style={styles.pageContainer}>
                {/* Custom Header */}
                <div style={styles.customHeader}>
                    <button onClick={() => navigate('/owner-dashboard')} style={styles.backButton}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="15 18 9 12 15 6"></polyline>
                        </svg>
                    </button>
                    <h2 style={styles.pageTitle}>Laporan Eksekutif</h2>
                </div>

                {/* Content Section */}
                <div style={styles.contentArea}>
                    
                    {/* Filter Card */}
                    <div style={styles.filterCard}>
                        <form onSubmit={handleFetchReport} style={styles.formGrid}>
                            
                            {/* ComboBox Laporan */}
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Pilih Jenis Laporan</label>
                                <select 
                                    value={selectedJenis} 
                                    onChange={(e) => {
                                        setSelectedJenis(e.target.value);
                                        setReportData([]);
                                        setHasQueried(false);
                                    }} 
                                    style={styles.select}
                                >
                                    <option value="pelanggan">Data Pelanggan (Aktif)</option>
                                    <option value="pendapatan">Data Pendapatan (Pembayaran Lunas)</option>
                                    <option value="aduan">Data Aduan Keluhan & Kinerja Teknisi</option>
                                </select>
                            </div>

                            {/* Start Date */}
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Tanggal Mulai</label>
                                <input 
                                    type="date" 
                                    value={startDate} 
                                    onChange={(e) => setStartDate(e.target.value)} 
                                    style={styles.inputDate}
                                />
                            </div>

                            {/* End Date */}
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Tanggal Akhir</label>
                                <input 
                                    type="date" 
                                    value={endDate} 
                                    onChange={(e) => setEndDate(e.target.value)} 
                                    style={styles.inputDate}
                                />
                            </div>

                            {/* Actions */}
                            <div style={styles.formActions}>
                                <button type="submit" style={styles.primaryBtn} disabled={loading}>
                                    {loading ? 'Memuat...' : 'Sajikan Laporan'}
                                </button>
                            </div>

                        </form>
                    </div>

                    {/* Table View Card */}
                    {hasQueried && (
                        <div style={styles.reportCard}>
                            <div style={styles.reportCardHeader}>
                                <div style={styles.headerInfo}>
                                    <h3 style={styles.reportTitle}>
                                        Pratinjau Laporan {selectedJenis.charAt(0).toUpperCase() + selectedJenis.slice(1)}
                                    </h3>
                                    <p style={styles.reportSubtitle}>
                                        Periode: <strong style={{ color: '#1e293b' }}>{new Date(startDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</strong> s/d <strong style={{ color: '#1e293b' }}>{new Date(endDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</strong> ({reportData.length} baris data ditemukan)
                                    </p>
                                </div>
                                
                                {reportData.length > 0 && (
                                    <button onClick={handleDownloadCSV} style={styles.downloadBtn}>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
                                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                            <polyline points="7 10 12 15 17 10" />
                                            <line x1="12" y1="15" x2="12" y2="3" />
                                        </svg>
                                        Unduh Laporan (CSV)
                                    </button>
                                )}
                            </div>

                            <div style={styles.tableWrapper}>
                                {loading ? (
                                    <div style={styles.loadingContainer}>Memproses data laporan...</div>
                                ) : reportData.length > 0 ? (
                                    <table style={styles.table}>
                                        <thead>
                                            <tr>
                                                {Object.keys(reportData[0]).map((key, i) => (
                                                    <th key={i} style={styles.th}>{key}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {reportData.map((row, i) => {
                                                return (
                                                    <tr key={i} style={styles.tr}>
                                                        {Object.entries(row).map(([key, val], idx) => {
                                                            const isStatusBlokir = selectedJenis === 'pelanggan' && key === 'Status' && val === 'BLOKIR';
                                                            const cellStyle = isStatusBlokir 
                                                                ? { ...styles.td, color: '#e74c3c', fontWeight: '700' } 
                                                                : styles.td;
                                                            return (
                                                                <td key={idx} style={cellStyle}>
                                                                    {val !== null && val !== undefined ? val.toString() : '-'}
                                                                </td>
                                                            );
                                                        })}
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                ) : (
                                    <div style={styles.emptyContainer}>
                                        <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                            <circle cx="12" cy="12" r="10" />
                                            <line x1="12" y1="8" x2="12" y2="12" />
                                            <line x1="12" y1="16" x2="12.01" y2="16" />
                                        </svg>
                                        <p style={{ marginTop: '14px', fontSize: '15px', color: '#64748b', fontWeight: '500' }}>
                                            Tidak ada data laporan yang ditemukan pada rentang waktu tersebut.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </DashboardLayout>
    );
};

// Styles
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
    filterCard: {
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        padding: '28px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
        marginBottom: '26px'
    },
    formGrid: {
        display: 'grid',
        gridTemplateColumns: '1.5fr 1fr 1fr auto',
        gap: '20px',
        alignItems: 'flex-end'
    },
    formGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
    },
    label: {
        fontSize: '13px',
        fontWeight: '700',
        color: '#475569',
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
    },
    select: {
        padding: '12px 16px',
        borderRadius: '8px',
        border: '1px solid #cbd5e1',
        fontSize: '14px',
        fontWeight: '600',
        color: '#1e293b',
        backgroundColor: '#fff',
        outline: 'none',
        cursor: 'pointer',
        boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
        transition: 'all 0.15s'
    },
    inputDate: {
        padding: '11px 16px',
        borderRadius: '8px',
        border: '1px solid #cbd5e1',
        fontSize: '14px',
        fontWeight: '600',
        color: '#1e293b',
        outline: 'none',
        boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
        transition: 'all 0.15s'
    },
    formActions: {
        display: 'flex',
        alignItems: 'center'
    },
    primaryBtn: {
        padding: '12px 24px',
        backgroundColor: '#5b4fcf',
        color: '#fff',
        border: 'none',
        borderRadius: '8px',
        fontWeight: '700',
        fontSize: '14px',
        cursor: 'pointer',
        boxShadow: '0 3px 10px rgba(91,79,207,0.25)',
        transition: 'all 0.15s'
    },
    reportCard: {
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        padding: '28px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
    },
    reportCardHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '22px',
        borderBottom: '1px solid #f1f5f9',
        paddingBottom: '18px'
    },
    headerInfo: {
        display: 'flex',
        flexDirection: 'column',
        gap: '4px'
    },
    reportTitle: {
        fontSize: '17px',
        fontWeight: '800',
        color: '#0f172a',
        margin: 0
    },
    reportSubtitle: {
        fontSize: '13.5px',
        color: '#64748b',
        margin: 0
    },
    downloadBtn: {
        display: 'inline-flex',
        alignItems: 'center',
        padding: '10px 18px',
        backgroundColor: '#10b981',
        color: '#fff',
        border: 'none',
        borderRadius: '8px',
        fontWeight: '700',
        fontSize: '13.5px',
        cursor: 'pointer',
        boxShadow: '0 3px 8px rgba(16,185,129,0.25)',
        transition: 'all 0.15s'
    },
    tableWrapper: {
        overflowX: 'auto'
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse',
        textAlign: 'left',
        fontSize: '13.5px'
    },
    th: {
        padding: '14px 16px',
        backgroundColor: '#f8fafc',
        borderBottom: '2px solid #e2e8f0',
        color: '#475569',
        fontWeight: '700',
        whiteSpace: 'nowrap'
    },
    tr: {
        borderBottom: '1px solid #f1f5f9',
        transition: 'all 0.15s'
    },
    td: {
        padding: '14px 16px',
        color: '#475569',
        verticalAlign: 'middle',
        lineHeight: '1.4'
    },
    loadingContainer: {
        textAlign: 'center',
        padding: '40px 0',
        color: '#64748b',
        fontWeight: '600'
    },
    emptyContainer: {
        textAlign: 'center',
        padding: '60px 0',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
    }
};

export default OwnerLaporan;
