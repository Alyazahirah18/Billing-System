import React, { useEffect, useState } from 'react';
import DashboardLayout from './DashboardLayout';
import axios from 'axios';

const Dashboard = ({ user }) => {
    const [data, setData] = useState({
        status_layanan: '...',
        tagihan_aktif: 0,
        jatuh_tempo: '...',
        jenis_layanan: '...',
        histori: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get('http://localhost:5000/api/dashboard/summary', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                console.log('Dashboard data:', res.data);
                setData(res.data);
                setLoading(false);
            } catch (err) {
                console.error("Gagal mengambil data dashboard", err);
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, []);

    if (loading) return (
        <DashboardLayout activeMenu="Dashboard" pageTitle="Dashboard" user={user}>
            <div style={{ padding: '20px', textAlign: 'center' }}>Memuat Data Dashboard...</div>
        </DashboardLayout>
    );

    // Format currency
    const formatCurrency = (amount) => {
        if (!amount || amount === 0) return 'Rp 0';
        return `Rp ${Number(amount).toLocaleString('id-ID')}`;
    };

    return (
        <DashboardLayout activeMenu="Dashboard" pageTitle="Dashboard" user={user}>
            {/* 4 Cards Status */}
            <div style={styles.cardsRow}>
                {/* Card 1: STATUS LAYANAN */}
                <div style={styles.statusCard}>
                    <div style={styles.cardHeader}>
                        <div style={styles.cardIcon}>
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <polyline points="12 6 12 12 16 14" />
                            </svg>
                        </div>
                        <span style={styles.cardTitle}>STATUS LAYANAN</span>
                    </div>
                    <div style={styles.cardValue}>{data.status_layanan}</div>
                </div>

                {/* Card 2: TAGIHAN AKTIF */}
                <div style={styles.statusCard}>
                    <div style={styles.cardHeader}>
                        <div style={styles.cardIcon}>
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                <polyline points="14 2 14 8 20 8" />
                            </svg>
                        </div>
                        <span style={styles.cardTitle}>TAGIHAN AKTIF</span>
                    </div>
                    <div style={styles.cardValue}>{formatCurrency(data.tagihan_aktif)}</div>
                </div>

                {/* Card 3: JATUH TEMPO */}
                <div style={styles.statusCard}>
                    <div style={styles.cardHeader}>
                        <div style={styles.cardIcon}>
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                <line x1="16" y1="2" x2="16" y2="6" />
                                <line x1="8" y1="2" x2="8" y2="6" />
                                <line x1="3" y1="10" x2="21" y2="10" />
                            </svg>
                        </div>
                        <span style={styles.cardTitle}>JATUH TEMPO</span>
                    </div>
                    <div style={styles.cardValue}>{data.jatuh_tempo}</div>
                </div>

                {/* Card 4: JENIS LAYANAN */}
                <div style={styles.statusCard}>
                    <div style={styles.cardHeader}>
                        <div style={styles.cardIcon}>
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                                <path d="M5 12.55a11 11 0 0 1 14.08 0" />
                                <path d="M1.42 9a16 16 0 0 1 21.16 0" />
                            </svg>
                        </div>
                        <span style={styles.cardTitle}>JENIS LAYANAN</span>
                    </div>
                    <div style={styles.cardValue}>{data.jenis_layanan}</div>
                </div>
            </div>

            {/* Tabel Histori Pembayaran */}
            <div style={styles.historySection}>
                <h3 style={styles.historyTitle}>Histori Pembayaran</h3>

                {data.histori && data.histori.length > 0 ? (
                    <div style={styles.tableWrapper}>
                        <table style={styles.table}>
                            <thead>
                                <tr style={styles.tableHeaderRow}>
                                    <th style={styles.th}>NAMA PAKET</th>
                                    <th style={styles.th}>HARGA PAKET</th>
                                    <th style={styles.th}>TANGGAL</th>
                                    <th style={styles.th}>STATUS</th>
                                    <th style={styles.th}>INVOICE</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.histori.map((row, index) => (
                                    <tr key={index} style={styles.tableRow}>
                                        <td style={styles.td}>{row.nama_paket}</td>
                                        <td style={styles.td}>{formatCurrency(row.harga_paket)}</td>
                                        <td style={styles.td}>{row.tanggal}</td>
                                        <td style={styles.td}>
                                            <span style={styles.statusLunas}>
                                                {row.status}
                                            </span>
                                        </td>
                                        <td style={styles.td}>
                                            <button
                                                onClick={() => alert(`Invoice: ${row.invoice}`)}
                                                style={styles.invoiceButton}
                                            >
                                                📄
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div style={styles.emptyState}>
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                            <line x1="16" y1="13" x2="8" y2="13" />
                            <line x1="16" y1="17" x2="8" y2="17" />
                        </svg>
                        <p>Belum ada histori pembayaran</p>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

const styles = {
    cardsRow: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '20px',
        marginBottom: '30px'
    },
    statusCard: {
        background: 'linear-gradient(135deg, #5b6abf 0%, #6c6cf7 50%, #5b6abf 100%)',
        borderRadius: '16px',
        padding: '20px',
        color: '#fff',
        boxShadow: '0 4px 15px rgba(91,106,191,0.25)',
        transition: 'transform 0.2s, box-shadow 0.2s',
        cursor: 'pointer',
    },
    cardHeader: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        marginBottom: '16px',
        borderBottom: '1px solid rgba(255,255,255,0.2)',
        paddingBottom: '10px'
    },
    cardIcon: {
        display: 'flex',
        alignItems: 'center',
        opacity: 0.9
    },
    cardTitle: {
        fontSize: '11px',
        fontWeight: '600',
        letterSpacing: '0.5px',
        opacity: 0.85
    },
    cardValue: {
        fontSize: '16px',
        fontWeight: '700',
        textAlign: 'left',
        paddingLeft: '38px',
        wordBreak: 'break-word'
    },

    historySection: {
        backgroundColor: '#fff',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)'
    },
    historyTitle: {
        fontSize: '18px',
        fontWeight: '700',
        marginBottom: '20px',
        color: '#1e293b',
        borderLeft: '4px solid #5b6abf',
        paddingLeft: '12px'
    },
    tableWrapper: {
        overflowX: 'auto',
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse',
        minWidth: '500px'
    },
    tableHeaderRow: {
        background: '#f1f5f9',
        borderBottom: '2px solid #e2e8f0'
    },
    th: {
        padding: '12px 16px',
        fontSize: '12px',
        fontWeight: '600',
        color: '#475569',
        textAlign: 'left',
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
    },
    tableRow: {
        borderBottom: '1px solid #e2e8f0',
        transition: 'background-color 0.2s',
    },
    td: {
        padding: '12px 16px',
        fontSize: '14px',
        color: '#334155'
    },
    statusLunas: {
        display: 'inline-block',
        padding: '4px 12px',
        borderRadius: '20px',
        fontSize: '12px',
        fontWeight: '600',
        backgroundColor: '#22c55e20',
        color: '#22c55e'
    },
    invoiceButton: {
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        fontSize: '18px',
        padding: '6px 10px',
        borderRadius: '8px',
        transition: 'background-color 0.2s',
    },
    emptyState: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 20px',
        color: '#94a3b8',
        textAlign: 'center'
    }
};

// Add hover effects
const styleSheet = document.createElement("style");
styleSheet.textContent = `
    .status-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(91,106,191,0.35);
    }
    .table-row:hover {
        background-color: #f8fafc;
    }
    .invoice-button:hover {
        background-color: #f1f5f9;
    }
`;
document.head.appendChild(styleSheet);

export default Dashboard;