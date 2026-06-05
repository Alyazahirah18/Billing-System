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
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

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

    const getMonthName = (monthNum) => {
        const months = [
            'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
            'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
        ];
        return months[monthNum - 1] || 'Januari';
    };

    const handleViewInvoice = (row) => {
        setSelectedInvoice(row);
        setIsInvoiceModalOpen(true);
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
                                                onClick={() => handleViewInvoice(row)}
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

            {/* Modal Invoice */}
            {isInvoiceModalOpen && selectedInvoice && (
                <div style={styles.modalOverlay} onClick={() => setIsInvoiceModalOpen(false)}>
                    <div style={styles.invoiceModal} onClick={(e) => e.stopPropagation()}>
                        {/* Header Modal */}
                        <div style={styles.modalHeaderClose}>
                            <button onClick={() => setIsInvoiceModalOpen(false)} style={styles.closeBtn}>&times;</button>
                        </div>
                        
                        {/* Printable Area */}
                        <div id="invoice-print-area" style={styles.invoicePaper}>
                            <div style={styles.invoiceHeader}>
                                <div>
                                    <h2 style={styles.invoiceBrand}>PT Signal Kabel Media</h2>
                                    <p style={styles.invoiceSubtitle}>Koneksi WiFi Stabil & Cepat</p>
                                </div>
                                <div style={styles.invoiceBadgeContainer}>
                                    <span style={styles.invoiceStatusBadge}>{selectedInvoice.status.toUpperCase()}</span>
                                </div>
                            </div>

                            <hr style={styles.divider} />

                            <div style={styles.invoiceMetaRow}>
                                <div style={styles.metaCol}>
                                    <span style={styles.metaLabel}>KEPADA:</span>
                                    <strong style={styles.metaValue}>{user?.nama || 'Pelanggan'}</strong>
                                    <span style={styles.metaSubValue}>ID: {user?.kode_pelanggan || '-'}</span>
                                    <span style={styles.metaSubValue}>{user?.alamat || '-'}</span>
                                </div>
                                <div style={styles.metaColRight}>
                                    <span style={styles.metaLabel}>NO. INVOICE:</span>
                                    <strong style={styles.metaValueBlue}>{selectedInvoice.invoice}</strong>
                                    <span style={styles.metaSubValue}>Tanggal Bayar: {selectedInvoice.tanggal}</span>
                                    <span style={styles.metaSubValue}>Metode: {selectedInvoice.metode_pembayaran}</span>
                                    <span style={styles.metaSubValue}>ID Transaksi: {selectedInvoice.id_transaksi}</span>
                                </div>
                            </div>

                            <table style={styles.invoiceTable}>
                                <thead>
                                    <tr style={styles.invoiceTableHeader}>
                                        <th style={styles.invoiceTh}>Deskripsi Layanan</th>
                                        <th style={styles.invoiceThCenter}>Periode</th>
                                        <th style={styles.invoiceThRight}>Jumlah</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr style={styles.invoiceTableRow}>
                                        <td style={styles.invoiceTd}>
                                            <strong>Biaya Berlangganan Internet</strong>
                                            <div style={styles.itemSubtext}>Paket: {selectedInvoice.nama_paket}</div>
                                        </td>
                                        <td style={styles.invoiceTdCenter}>
                                            {selectedInvoice.bulan_tagihan ? `${getMonthName(selectedInvoice.bulan_tagihan)} ${selectedInvoice.tahun_tagihan}` : selectedInvoice.tanggal}
                                        </td>
                                        <td style={styles.invoiceTdRight}>
                                            {formatCurrency(selectedInvoice.harga_paket)}
                                        </td>
                                    </tr>
                                    <tr style={styles.invoiceTableRow}>
                                        <td colSpan="2" style={styles.invoiceTdRightTotal}><strong>Total Bayar:</strong></td>
                                        <td style={styles.invoiceTdRightTotalVal}><strong>{formatCurrency(selectedInvoice.harga_paket)}</strong></td>
                                    </tr>
                                </tbody>
                            </table>

                            <div style={styles.invoiceFooterSec}>
                                <p style={styles.invoiceThankyou}>Terima kasih atas pembayaran Anda!</p>
                                <p style={styles.invoiceFooterNote}>Invoice ini diterbitkan secara otomatis dan sah sebagai bukti pembayaran yang valid.</p>
                            </div>
                        </div>

                        {/* Modal Action Buttons */}
                        <div style={styles.modalActionRow}>
                            <button onClick={() => setIsInvoiceModalOpen(false)} style={styles.doneBtn}>
                                Selesai
                            </button>
                        </div>
                    </div>
                </div>
            )}
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
    },
    modalOverlay: {
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        padding: '20px',
    },
    invoiceModal: {
        backgroundColor: '#fff',
        borderRadius: '20px',
        width: '100%',
        maxWidth: '650px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        animation: 'fadeIn 0.3s ease-out',
    },
    modalHeaderClose: {
        display: 'flex',
        justifyContent: 'flex-end',
        padding: '12px 20px 0',
    },
    closeBtn: {
        background: 'none',
        border: 'none',
        fontSize: '28px',
        color: '#94a3b8',
        cursor: 'pointer',
        transition: 'color 0.2s',
        padding: 0,
        lineHeight: 1,
    },
    invoicePaper: {
        padding: '10px 40px 30px',
        backgroundColor: '#fff',
        color: '#1e293b',
    },
    invoiceHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '15px',
    },
    invoiceBrand: {
        fontSize: '24px',
        fontWeight: '800',
        color: '#5b6abf',
        margin: 0,
        letterSpacing: '-0.5px',
    },
    invoiceSubtitle: {
        fontSize: '13px',
        color: '#64748b',
        margin: '4px 0 0 0',
    },
    invoiceBadgeContainer: {
        display: 'flex',
    },
    invoiceStatusBadge: {
        backgroundColor: '#22c55e15',
        color: '#22c55e',
        border: '1px solid #22c55e30',
        padding: '6px 16px',
        borderRadius: '30px',
        fontSize: '12px',
        fontWeight: '700',
        letterSpacing: '1px',
    },
    divider: {
        border: 'none',
        borderTop: '2px dashed #e2e8f0',
        margin: '20px 0',
    },
    invoiceMetaRow: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '20px',
        marginBottom: '25px',
        textAlign: 'left',
    },
    metaCol: {
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
    },
    metaColRight: {
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        alignItems: 'flex-end',
        textAlign: 'right',
    },
    metaLabel: {
        fontSize: '11px',
        fontWeight: '700',
        color: '#94a3b8',
        letterSpacing: '0.5px',
        textTransform: 'uppercase',
    },
    metaValue: {
        fontSize: '15px',
        fontWeight: '700',
        color: '#1e293b',
    },
    metaValueBlue: {
        fontSize: '16px',
        fontWeight: '800',
        color: '#5b6abf',
    },
    metaSubValue: {
        fontSize: '13px',
        color: '#64748b',
    },
    invoiceTable: {
        width: '100%',
        borderCollapse: 'collapse',
        margin: '20px 0',
    },
    invoiceTableHeader: {
        borderBottom: '2px solid #e2e8f0',
    },
    invoiceTh: {
        padding: '10px 0',
        fontSize: '12px',
        fontWeight: '700',
        color: '#475569',
        textTransform: 'uppercase',
        textAlign: 'left',
    },
    invoiceThCenter: {
        padding: '10px 0',
        fontSize: '12px',
        fontWeight: '700',
        color: '#475569',
        textTransform: 'uppercase',
        textAlign: 'center',
    },
    invoiceThRight: {
        padding: '10px 0',
        fontSize: '12px',
        fontWeight: '700',
        color: '#475569',
        textTransform: 'uppercase',
        textAlign: 'right',
    },
    invoiceTableRow: {
        borderBottom: '1px solid #f1f5f9',
    },
    invoiceTd: {
        padding: '15px 0',
        fontSize: '14px',
        color: '#1e293b',
        textAlign: 'left',
    },
    invoiceTdCenter: {
        padding: '15px 0',
        fontSize: '14px',
        color: '#1e293b',
        textAlign: 'center',
    },
    invoiceTdRight: {
        padding: '15px 0',
        fontSize: '14px',
        fontWeight: '600',
        color: '#1e293b',
        textAlign: 'right',
    },
    itemSubtext: {
        fontSize: '12px',
        color: '#64748b',
        marginTop: '3px',
    },
    invoiceTdRightTotal: {
        padding: '20px 0 10px 0',
        fontSize: '14px',
        color: '#64748b',
        textAlign: 'right',
    },
    invoiceTdRightTotalVal: {
        padding: '20px 0 10px 0',
        fontSize: '18px',
        fontWeight: '800',
        color: '#5b6abf',
        textAlign: 'right',
    },
    invoiceFooterSec: {
        marginTop: '30px',
        textAlign: 'center',
    },
    invoiceThankyou: {
        fontSize: '15px',
        fontWeight: '700',
        color: '#5b6abf',
        margin: '0 0 6px 0',
    },
    invoiceFooterNote: {
        fontSize: '11px',
        color: '#94a3b8',
        margin: 0,
        lineHeight: '1.4',
    },
    modalActionRow: {
        display: 'flex',
        justifyContent: 'center',
        gap: '15px',
        padding: '20px 40px 30px',
        backgroundColor: '#f8fafc',
        borderTop: '1px solid #f1f5f9',
    },
    doneBtn: {
        padding: '12px 28px',
        borderRadius: '10px',
        border: 'none',
        backgroundColor: '#5b6abf',
        color: '#fff',
        fontSize: '14px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'background-color 0.2s',
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
    
    @keyframes fadeIn {
        from { opacity: 0; transform: scale(0.95); }
        to { opacity: 1; transform: scale(1); }
    }
`;
document.head.appendChild(styleSheet);

export default Dashboard;