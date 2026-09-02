import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import DashboardLayout from './DashboardLayout';

const OwnerDashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        totalPelanggan: 0,
        disconnect: 0,
        totalAduan: 0,
        totalIncome: 0
    });
    const [trendData, setTrendData] = useState([]);
    const [areaData, setAreaData] = useState([]);
    const [loading, setLoading] = useState(true);

    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));

    const ownerMenu = [
        { label: 'Dashboard', path: '/owner-dashboard' },
        { label: 'Log Activity', path: '/owner-log-activity' },
        { label: 'Laporan', path: '/owner/laporan' }
    ];

    // Fetch data dashboard
    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/dashboard/owner`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStats(res.data.stats);
            setTrendData(res.data.trendData || []);
            setAreaData(res.data.areaData || []);
        } catch (err) {
            console.error('Gagal memuat data dashboard:', err);
            alert('Sesi Anda berakhir atau server tidak dapat dihubungi. Silakan login kembali.');
            navigate('/staff-login');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Inject dynamic keyframes for the spinner
        const styleSheet = document.createElement("style");
        styleSheet.innerText = `
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(styleSheet);

        if (!token) {
            navigate('/staff-login');
            return;
        }
        fetchDashboardData();

        return () => {
            try {
                document.head.removeChild(styleSheet);
            } catch (e) {
                // Ignore if already removed
            }
        };
    }, [token]);

    // Download Chart SVG/PNG Helper
    const downloadChart = (svgId, format, filename) => {
        const svgElement = document.getElementById(svgId);
        if (!svgElement) return;

        const svgClone = svgElement.cloneNode(true);
        svgClone.setAttribute('style', 'background-color: #ffffff; padding: 10px; border-radius: 8px;');

        const svgString = new XMLSerializer().serializeToString(svgClone);
        const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
        const URL = window.URL || window.webkitURL || window;
        const blobURL = URL.createObjectURL(svgBlob);

        if (format === 'svg') {
            const downloadLink = document.createElement("a");
            downloadLink.href = blobURL;
            downloadLink.download = `${filename}.svg`;
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
        } else {
            // PNG Export
            const image = new Image();
            image.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = svgElement.clientWidth * 2 || 1000;
                canvas.height = svgElement.clientHeight * 2 || 500;
                const context = canvas.getContext('2d');
                context.fillStyle = '#ffffff';
                context.fillRect(0, 0, canvas.width, canvas.height);
                context.drawImage(image, 0, 0, canvas.width, canvas.height);
                const png = canvas.toDataURL('image/png');
                const downloadLink = document.createElement('a');
                downloadLink.href = png;
                downloadLink.download = `${filename}.png`;
                document.body.appendChild(downloadLink);
                downloadLink.click();
                document.body.removeChild(downloadLink);
            };
            image.src = blobURL;
        }
    };

    // --- RENDER ---

    if (loading) {
        return (
            <div style={styles.loadingScreen}>
                <div style={styles.spinner}></div>
                <p style={{ marginTop: '15px', color: '#5b4fcf', fontWeight: 'bold' }}>Memuat Dashboard Owner...</p>
            </div>
        );
    }

    return (
        <DashboardLayout
            activeMenu="Dashboard"
            pageTitle="Dashboard"
            user={user}
            customMenuItems={ownerMenu}
            hideHeader={true}
            noPadding={true}
        >
            <div style={styles.pageContainer}>
                {/* Custom Header (Matching Admin/Teknisi) */}
                <div style={styles.customHeader}>
                    <h2 style={styles.pageTitle}>Dashboard</h2>
                </div>

                {/* Content Area with Grey background */}
                <div style={styles.contentArea}>
                    <div style={styles.dashboardViewWrapper}>
                        
                        {/* Cards Container (Grid-aligned exactly with Admin) */}
                        <div style={styles.statsContainer}>
                            
                            {/* Card 1: Total Pelanggan */}
                            <div style={{ ...styles.statBox, backgroundColor: '#e2e8fa' }}>
                                <div style={styles.statTitle}>Total Pelanggan</div>
                                <div style={styles.statBody}>
                                    <svg width="36" height="36" viewBox="0 0 24 24" fill="#000" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                                        <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-.32 0-.63.05-.91.14.57.81.91 1.79.91 2.86s-.34 2.04-.91 2.86c.28.09.59.14.91.14zm4 6.11V19h-3v-2c0-.98-.62-1.95-1.76-2.67 1.49.52 2.65 1.51 2.65 2.78z" opacity="0.6" />
                                    </svg>
                                    <div style={styles.statValueContainer}>
                                        <span style={styles.statNumber}>{stats.totalPelanggan}</span>
                                        <span style={styles.statSubtitle}>Pelanggan</span>
                                    </div>
                                </div>
                            </div>

                            {/* Card 2: Disconnect */}
                            <div style={{ ...styles.statBox, backgroundColor: '#fef2f2' }}>
                                <div style={styles.statTitle}>Disconnect</div>
                                <div style={styles.statBody}>
                                    <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="10" />
                                        <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                                    </svg>
                                    <div style={styles.statValueContainer}>
                                        <span style={styles.statNumber}>{stats.disconnect}</span>
                                        <span style={styles.statSubtitle}>Pelanggan</span>
                                    </div>
                                </div>
                            </div>

                            {/* Card 3: Total Aduan */}
                            <div style={{ ...styles.statBox, backgroundColor: '#f5f3ff' }}>
                                <div style={styles.statTitle}>Total Aduan Bulan Ini</div>
                                <div style={styles.statBody}>
                                    <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                        <polyline points="14 2 14 8 20 8" />
                                        <line x1="16" y1="13" x2="8" y2="13" />
                                        <line x1="16" y1="17" x2="8" y2="17" />
                                        <polyline points="10 9 9 9 8 9" />
                                    </svg>
                                    <div style={styles.statValueContainer}>
                                        <span style={styles.statNumber}>{stats.totalAduan}</span>
                                        <span style={styles.statSubtitle}>Aduan</span>
                                    </div>
                                </div>
                            </div>

                            {/* Card 4: Total Income Bulan Ini */}
                            <div style={{ ...styles.statBox, backgroundColor: '#dcfce7' }}>
                                <div style={styles.statTitle}>Total Income Bulan Ini</div>
                                <div style={styles.statBody}>
                                    <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="12" y1="1" x2="12" y2="23" />
                                        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                                    </svg>
                                    <div style={styles.statValueContainer}>
                                        <span style={styles.statNumber}>Rp {Number(stats.totalIncome || 0).toLocaleString('id-ID')}</span>
                                        <span style={styles.statSubtitle}>Pendapatan</span>
                                    </div>
                                </div>
                            </div>

                        </div>

                        {/* Charts Grid */}
                        <div style={styles.chartsGrid}>
                            
                            {/* Trend Chart Card */}
                            <div style={styles.chartCard}>
                                <div style={styles.chartHeaderRow}>
                                    <h4 style={styles.chartTitle}>Subscribed Customers Trend</h4>
                                    <div style={styles.downloadButtons}>
                                        <button onClick={() => downloadChart('trendSVG', 'png', 'trend_pelanggan')} style={styles.chartDlBtn}>PNG</button>
                                        <button onClick={() => downloadChart('trendSVG', 'svg', 'trend_pelanggan')} style={styles.chartDlBtn}>SVG</button>
                                    </div>
                                </div>

                                <div style={styles.chartContent}>
                                    {trendData.length > 0 ? (
                                        <svg id="trendSVG" width="100%" height="100%" viewBox="0 0 540 260" style={{ maxHeight: '250px' }}>
                                            {/* Grid Lines */}
                                            <line x1="40" y1="30" x2="520" y2="30" stroke="#f1f5f9" strokeWidth="1" />
                                            <line x1="40" y1="75" x2="520" y2="75" stroke="#f1f5f9" strokeWidth="1" />
                                            <line x1="40" y1="120" x2="520" y2="120" stroke="#f1f5f9" strokeWidth="1" />
                                            <line x1="40" y1="165" x2="520" y2="165" stroke="#f1f5f9" strokeWidth="1" />
                                            <line x1="40" y1="210" x2="520" y2="210" stroke="#cbd5e1" strokeWidth="1.5" />

                                            {/* Y Axis Labels */}
                                            <text x="15" y="35" fontSize="11" fill="#64748b" textAnchor="middle">70</text>
                                            <text x="15" y="80" fontSize="11" fill="#64748b" textAnchor="middle">50</text>
                                            <text x="15" y="125" fontSize="11" fill="#64748b" textAnchor="middle">30</text>
                                            <text x="15" y="170" fontSize="11" fill="#64748b" textAnchor="middle">10</text>
                                            <text x="15" y="215" fontSize="11" fill="#64748b" textAnchor="middle">0</text>

                                            {(() => {
                                                const points = trendData.map((d, i) => {
                                                    const x = 40 + i * 43.6;
                                                    const y = 210 - (d.count / 70) * 180;
                                                    return { x, y };
                                                });

                                                const polylinePoints = points.map(p => `${p.x},${p.y}`).join(' ');

                                                return (
                                                    <>
                                                        <polyline points={polylinePoints} fill="none" stroke="#5b4fcf" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                                                        {points.map((p, i) => (
                                                            <g key={i}>
                                                                <circle cx={p.x} cy={p.y} r="5.5" fill="#5b4fcf" stroke="#ffffff" strokeWidth="2.5" />
                                                                <title>{trendData[i].month}: {trendData[i].count} Pelanggan</title>
                                                            </g>
                                                        ))}
                                                    </>
                                                );
                                            })()}

                                            {/* X Axis Labels */}
                                            {trendData.map((d, i) => (
                                                <text key={i} x={40 + i * 43.6} y="235" fontSize="11.5" fontWeight="600" fill="#64748b" textAnchor="middle">
                                                    {d.month}
                                                </text>
                                            ))}
                                        </svg>
                                    ) : (
                                        <p style={styles.noData}>No trend data available</p>
                                    )}
                                </div>
                            </div>

                            {/* Area Segment Distribution Card */}
                            <div style={styles.chartCard}>
                                <div style={styles.chartHeaderRow}>
                                    <h4 style={styles.chartTitle}>Customer Distribution by Area</h4>
                                    <div style={styles.downloadButtons}>
                                        <button onClick={() => downloadChart('areaSVG', 'png', 'distribusi_wilayah')} style={styles.chartDlBtn}>PNG</button>
                                        <button onClick={() => downloadChart('areaSVG', 'svg', 'distribusi_wilayah')} style={styles.chartDlBtn}>SVG</button>
                                    </div>
                                </div>

                                <div style={styles.chartContent}>
                                    {areaData.length > 0 ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                                            <svg id="areaSVG" width="220" height="220" viewBox="0 0 200 200">
                                                {(() => {
                                                    const total = areaData.reduce((sum, d) => sum + d.count, 0);
                                                    let accumulatedAngle = 0;
                                                    const colors = ['#5b4fcf', '#38bdf8', '#fb923c', '#f43f5e', '#10b981', '#a855f7'];

                                                    return areaData.map((d, i) => {
                                                        const percentage = d.count / total;
                                                        const angle = percentage * 360;

                                                        const r = 80;
                                                        const cx = 100;
                                                        const cy = 100;

                                                        const x1 = cx + r * Math.cos((accumulatedAngle - 90) * Math.PI / 180);
                                                        const y1 = cy + r * Math.sin((accumulatedAngle - 90) * Math.PI / 180);

                                                        accumulatedAngle += angle;

                                                        const x2 = cx + r * Math.cos((accumulatedAngle - 90) * Math.PI / 180);
                                                        const y2 = cy + r * Math.sin((accumulatedAngle - 90) * Math.PI / 180);

                                                        const largeArcFlag = angle > 180 ? 1 : 0;

                                                        const pathData = `
                                                            M ${cx} ${cy}
                                                            L ${x1} ${y1}
                                                            A ${r} ${r} 0 ${largeArcFlag} 1 ${x2} ${y2}
                                                            Z
                                                        `;

                                                        return (
                                                            <path
                                                                key={i}
                                                                d={pathData}
                                                                fill={colors[i % colors.length]}
                                                                stroke="#ffffff"
                                                                strokeWidth="2"
                                                            >
                                                                <title>{d.wilayah}: {d.count} Pelanggan ({Math.round(percentage * 100)}%)</title>
                                                            </path>
                                                        );
                                                    });
                                                })()}
                                                <circle cx="100" cy="100" r="45" fill="#ffffff" />
                                            </svg>

                                            <div style={styles.legendGrid}>
                                                {areaData.map((d, i) => {
                                                    const colors = ['#5b4fcf', '#38bdf8', '#fb923c', '#f43f5e', '#10b981', '#a855f7'];
                                                    const total = areaData.reduce((sum, item) => sum + item.count, 0);
                                                    const pct = total > 0 ? Math.round((d.count / total) * 100) : 0;
                                                    return (
                                                        <div key={i} style={styles.legendItem} title={`${d.wilayah}: ${d.count} Pelanggan`}>
                                                            <span style={{ ...styles.legendDot, backgroundColor: colors[i % colors.length] }}></span>
                                                            <span style={styles.legendText}>{d.wilayah} ({pct}%)</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ) : (
                                        <p style={styles.noData}>No distribution data available</p>
                                    )}
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

// --- SYNCHRONIZED PREMIUM LAYOUT STYLES (Identical dimensions with Admin/Teknisi) ---

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
    pageTitle: {
        fontSize: '20px',
        fontWeight: '700',
        color: '#000',
        margin: 0,
    },
    contentArea: {
        backgroundColor: '#e9ebf0', // Identical light greyish blue background
        padding: '30px 40px', // Identical content padding
        flex: 1,
    },
    statsContainer: {
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)', // Pixel-perfect identical 4-card grid layout
        gap: '20px',
        backgroundColor: '#fff',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
        marginBottom: '30px',
    },
    statBox: {
        padding: '20px',
        borderRadius: '8px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
    },
    statTitle: {
        fontSize: '15px',
        color: '#333',
        fontWeight: '600',
        marginBottom: '16px',
    },
    statBody: {
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
    },
    statValueContainer: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
    },
    statNumber: {
        fontSize: '22px', // Reduced slightly for long currency strings
        fontWeight: '700',
        color: '#1a1a2e',
        lineHeight: '1.1',
    },
    statSubtitle: {
        fontSize: '11px',
        color: '#555',
        marginTop: '4px',
    },

    // Charts Section Grid Sizing
    chartsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: '28px'
    },
    chartCard: {
        backgroundColor: '#ffffff',
        borderRadius: '8px',
        padding: '24px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '320px'
    },
    chartHeaderRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px'
    },
    chartTitle: {
        fontSize: '16px',
        fontWeight: '800',
        color: '#1e293b',
        margin: 0
    },
    downloadButtons: {
        display: 'flex',
        gap: '8px'
    },
    chartDlBtn: {
        padding: '4px 10px',
        fontSize: '11px',
        fontWeight: '700',
        color: '#5b4fcf',
        backgroundColor: '#f5f3ff',
        border: '1px solid #e0e7ff',
        borderRadius: '4px',
        cursor: 'pointer',
        transition: 'all 0.15s'
    },
    chartContent: {
        flex: 1,
        width: '100%',
        height: '100%',
        minHeight: '220px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    },
    noData: {
        color: '#94a3b8',
        fontSize: '13px',
        fontWeight: '500'
    },
    legendGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '10px',
        marginTop: '15px',
        width: '100%',
        padding: '10px',
        backgroundColor: '#f8fafc',
        borderRadius: '8px'
    },
    legendItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '6px'
    },
    legendDot: {
        width: '10px',
        height: '10px',
        borderRadius: '50%',
        flexShrink: 0
    },
    legendText: {
        fontSize: '11px',
        fontWeight: '600',
        color: '#475569',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap'
    },

    // Spinner Loading
    loadingScreen: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        backgroundColor: '#f5f7fb'
    },
    spinner: {
        width: '45px',
        height: '45px',
        border: '4px solid #f3f3f3',
        borderTop: '4px solid #5b4fcf',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
    }
};

export default OwnerDashboard;
