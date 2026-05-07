import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import DashboardLayout from './DashboardLayout';

const OwnerDashboard = () => {
    const navigate = useNavigate();
    const [view, setView] = useState('dashboard'); // 'dashboard' atau 'paket'
    const [stats, setStats] = useState({
        totalPelanggan: 0,
        disconnect: 0,
        totalAduan: 0,
        totalPaket: 0
    });
    const [trendData, setTrendData] = useState([]);
    const [areaData, setAreaData] = useState([]);
    const [loading, setLoading] = useState(true);

    // State untuk CRUD Paket
    const [paketList, setPaketList] = useState([]);
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);
    const [formData, setFormData] = useState({
        NAMA_PAKET: '',
        HARGA_PAKET: ''
    });
    const [paketLoading, setPaketLoading] = useState(false);

    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));

    const ownerMenu = [
        { label: 'Dashboard', path: '/owner-dashboard' },
        { label: 'Log Activity', path: '#' }
    ];

    // Fetch data dashboard
    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const res = await axios.get('http://localhost:5000/api/dashboard/owner', {
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

    // Fetch daftar paket untuk CRUD
    const fetchPaketList = async () => {
        try {
            setPaketLoading(true);
            const res = await axios.get('http://localhost:5000/api/paket');
            setPaketList(res.data);
        } catch (err) {
            console.error('Gagal memuat daftar paket:', err);
        } finally {
            setPaketLoading(false);
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

    useEffect(() => {
        if (view === 'paket') {
            fetchPaketList();
        }
    }, [view]);

    // Download Data Aduan sebagai CSV
    const handleDownloadAduan = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/dashboard/admin/layanan/aduan', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const rawAduan = res.data.data || [];

            if (rawAduan.length === 0) {
                alert('Tidak ada data aduan untuk diunduh.');
                return;
            }

            // Generate CSV string
            const headers = ["No Aduan", "ID Pelanggan", "Nama Pelanggan", "Subjek/Kategori", "Deskripsi Masalah", "Tanggal", "Status"];
            const rows = rawAduan.map(item => [
                item.noAduan,
                item.userId,
                `"${item.nama.replace(/"/g, '""')}"`,
                `"${item.subjek.replace(/"/g, '""')}"`,
                `"${item.deskripsi.replace(/"/g, '""')}"`,
                item.tanggal,
                item.status
            ]);

            const csvContent = "data:text/csv;charset=utf-8," 
                + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");

            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", `laporan_aduan_pelanggan_${new Date().toISOString().slice(0, 10)}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (err) {
            console.error('Gagal mengunduh aduan:', err);
            alert('Gagal mengunduh data aduan.');
        }
    };

    // CRUD Paket Handlers
    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleAddOrUpdatePaket = async (e) => {
        e.preventDefault();
        if (!formData.NAMA_PAKET || !formData.HARGA_PAKET) {
            alert('Harap isi semua kolom!');
            return;
        }

        try {
            if (isEditing) {
                // Update Paket
                await axios.put(`http://localhost:5000/api/paket/${editId}`, formData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                alert('Paket berhasil diperbarui!');
            } else {
                // Tambah Paket Baru
                await axios.post('http://localhost:5000/api/paket', formData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                alert('Paket baru berhasil ditambahkan!');
            }
            setFormData({ NAMA_PAKET: '', HARGA_PAKET: '' });
            setIsEditing(false);
            setEditId(null);
            fetchPaketList();
            fetchDashboardData(); // Update total paket di dashboard
        } catch (err) {
            alert('Gagal menyimpan paket: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleEditClick = (p) => {
        setIsEditing(true);
        setEditId(p.ID_PAKET);
        setFormData({
            NAMA_PAKET: p.NAMA_PAKET,
            HARGA_PAKET: p.HARGA_PAKET
        });
    };

    const handleDeletePaket = async (id) => {
        if (!window.confirm('Apakah Anda yakin ingin menghapus paket ini?')) return;
        try {
            await axios.delete(`http://localhost:5000/api/paket/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('Paket berhasil dihapus!');
            fetchPaketList();
            fetchDashboardData();
        } catch (err) {
            alert('Gagal menghapus paket: ' + (err.response?.data?.message || err.message));
        }
    };

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
                    <button onClick={() => setView('dashboard')} style={styles.backButton}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="15 18 9 12 15 6"></polyline>
                        </svg>
                    </button>
                    <h2 style={styles.pageTitle}>{view === 'dashboard' ? 'Dashboard' : 'Manajemen Paket Layanan'}</h2>
                </div>

                {/* Content Area with Grey background */}
                <div style={styles.contentArea}>

                    {/* View Switcher: Dashboard View */}
                    {view === 'dashboard' && (
                        <div style={styles.dashboardViewWrapper}>
                            
                            {/* Cards Container (Grid-aligned exactly with Admin) */}
                            <div style={styles.statsContainer}>
                                
                                {/* Card 1: Total Pelanggan */}
                                <div style={{ ...styles.statBox, backgroundColor: '#e2e8fa' }}>
                                    <div style={styles.statTitle}>Total Pelanggan</div>
                                    <div style={styles.statBody}>
                                        <svg width="36" height="36" viewBox="0 0 24 24" fill="#4f46e5" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                                        </svg>
                                        <div style={styles.statValueContainer}>
                                            <span style={styles.statNumber}>{stats.totalPelanggan}</span>
                                            <span style={styles.statSubtitle}>Pelanggan</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Card 2: Disconnect */}
                                <div style={{ ...styles.statBox, backgroundColor: '#f0fdf4' }}>
                                    <div style={styles.statTitle}>Disconnect</div>
                                    <div style={styles.statBody}>
                                        <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
                                <div 
                                    style={{ ...styles.statBox, backgroundColor: '#f5f3ff', cursor: 'pointer' }}
                                    onClick={handleDownloadAduan}
                                    title="Klik untuk Unduh Data Aduan (CSV)"
                                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.03)'}
                                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                >
                                    <div style={styles.statTitle}>Total Aduan 📥</div>
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

                                {/* Card 4: Total Paket Layanan */}
                                <div 
                                    style={{ ...styles.statBox, backgroundColor: '#fffbeb', cursor: 'pointer' }}
                                    onClick={() => setView('paket')}
                                    title="Klik untuk Kelola Paket Layanan (CRUD)"
                                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.03)'}
                                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                >
                                    <div style={styles.statTitle}>Total Paket Layanan ⚙️</div>
                                    <div style={styles.statBody}>
                                        <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#b45309" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                                            <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                                            <line x1="12" y1="22.08" x2="12" y2="12" />
                                        </svg>
                                        <div style={styles.statValueContainer}>
                                            <span style={styles.statNumber}>{stats.totalPaket}</span>
                                            <span style={styles.statSubtitle}>Paket</span>
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
                                                        return { x, y, ...d };
                                                    });

                                                    const polylinePoints = points.map(p => `${p.x},${p.y}`).join(' ');

                                                    return (
                                                        <>
                                                            <polyline points={polylinePoints} fill="none" stroke="#5b4fcf" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                                                            {points.map((p, i) => (
                                                                <g key={i}>
                                                                    <circle cx={p.x} cy={p.y} r="5.5" fill="#5b4fcf" stroke="#ffffff" strokeWidth="2.5" />
                                                                    <text x={p.x} y={p.y - 10} fontSize="11" fontWeight="700" fill="#5b4fcf" textAnchor="middle">{p.count}</text>
                                                                    <text x={p.x} y="235" fontSize="10.5" fontWeight="600" fill="#475569" textAnchor="middle">{p.month}</text>
                                                                </g>
                                                            ))}
                                                        </>
                                                    );
                                                })()}
                                            </svg>
                                        ) : (
                                            <p style={styles.noData}>Tidak ada data tren untuk ditampilkan</p>
                                        )}
                                    </div>
                                </div>

                                {/* Pie Chart Card */}
                                <div style={styles.chartCard}>
                                    <div style={styles.chartHeaderRow}>
                                        <h4 style={styles.chartTitle}>Customer Area Segments</h4>
                                        <div style={styles.downloadButtons}>
                                            <button onClick={() => downloadChart('areaSVG', 'png', 'segmen_wilayah')} style={styles.chartDlBtn}>PNG</button>
                                            <button onClick={() => downloadChart('areaSVG', 'svg', 'segmen_wilayah')} style={styles.chartDlBtn}>SVG</button>
                                        </div>
                                    </div>

                                    <div style={{ ...styles.chartContent, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                        {areaData.length > 0 ? (
                                            <>
                                                <svg id="areaSVG" width="220" height="220" viewBox="0 0 220 220" style={{ maxHeight: '200px' }}>
                                                    {(() => {
                                                        const total = areaData.reduce((sum, d) => sum + d.count, 0);
                                                        let cumulativePercent = 0;

                                                        const getCoordinatesForPercent = (percent) => {
                                                            const x = Math.cos(2 * Math.PI * percent - Math.PI / 2);
                                                            const y = Math.sin(2 * Math.PI * percent - Math.PI / 2);
                                                            return [x, y];
                                                        };

                                                        const colors = ['#6366f1', '#f87171', '#38bdf8', '#fbbf24', '#34d399', '#a78bfa', '#f472b6', '#cbd5e1'];

                                                        return areaData.map((d, index) => {
                                                            const percent = d.count / total;
                                                            const [startX, startY] = getCoordinatesForPercent(cumulativePercent);
                                                            cumulativePercent += percent;
                                                            const [endX, endY] = getCoordinatesForPercent(cumulativePercent);
                                                            
                                                            const largeArcFlag = percent > 0.5 ? 1 : 0;
                                                            const r = 90;
                                                            const cx = 110;
                                                            const cy = 110;

                                                            const x1 = cx + startX * r;
                                                            const y1 = cy + startY * r;
                                                            const x2 = cx + endX * r;
                                                            const y2 = cy + endY * r;

                                                            if (percent >= 0.999) {
                                                                return <circle key={index} cx={cx} cy={cy} r={r} fill={colors[index % colors.length]} />;
                                                            }

                                                            const pathData = [
                                                                `M ${cx} ${cy}`,
                                                                `L ${x1} ${y1}`,
                                                                `A ${r} ${r} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                                                                `Z`
                                                            ].join(' ');

                                                            return (
                                                                <path 
                                                                    key={index} 
                                                                    d={pathData} 
                                                                    fill={colors[index % colors.length]} 
                                                                    stroke="#ffffff" 
                                                                    strokeWidth="1.5"
                                                                />
                                                            );
                                                        });
                                                    })()}
                                                </svg>

                                                <div style={styles.legendGrid}>
                                                    {(() => {
                                                        const colors = ['#6366f1', '#f87171', '#38bdf8', '#fbbf24', '#34d399', '#a78bfa', '#f472b6', '#cbd5e1'];
                                                        return areaData.map((d, index) => (
                                                            <div key={index} style={styles.legendItem}>
                                                                <span style={{ ...styles.legendDot, backgroundColor: colors[index % colors.length] }}></span>
                                                                <span style={styles.legendText}>{d.wilayah} ({d.count})</span>
                                                            </div>
                                                        ));
                                                    })()}
                                                </div>
                                            </>
                                        ) : (
                                            <p style={styles.noData}>Tidak ada data sebaran wilayah</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* View Switcher: Paket CRUD View */}
                    {view === 'paket' && (
                        <div style={styles.crudWrapper}>
                            
                            {/* Form Card */}
                            <div style={styles.crudFormCard}>
                                <h4 style={styles.formCardTitle}>{isEditing ? '✏️ Edit Paket Layanan' : '➕ Tambah Paket Layanan Baru'}</h4>
                                <form onSubmit={handleAddOrUpdatePaket} style={styles.inlineForm}>
                                    <div style={styles.formGroup}>
                                        <label style={styles.inputLabel}>Nama Paket</label>
                                        <input 
                                            type="text" 
                                            name="NAMA_PAKET" 
                                            value={formData.NAMA_PAKET} 
                                            onChange={handleInputChange} 
                                            placeholder="Contoh: Paket Premium Gold" 
                                            style={styles.formInput} 
                                        />
                                    </div>

                                    <div style={styles.formGroup}>
                                        <label style={styles.inputLabel}>Harga Bulanan (IDR)</label>
                                        <input 
                                            type="number" 
                                            name="HARGA_PAKET" 
                                            value={formData.HARGA_PAKET} 
                                            onChange={handleInputChange} 
                                            placeholder="Contoh: 150000" 
                                            style={styles.formInput} 
                                        />
                                    </div>

                                    <div style={styles.formButtons}>
                                        <button type="submit" style={styles.saveBtn}>
                                            {isEditing ? 'Simpan Perubahan' : 'Tambahkan Paket'}
                                        </button>
                                        {isEditing && (
                                            <button 
                                                type="button" 
                                                onClick={() => {
                                                    setIsEditing(false);
                                                    setEditId(null);
                                                    setFormData({ NAMA_PAKET: '', HARGA_PAKET: '' });
                                                }} 
                                                style={styles.cancelBtn}
                                            >
                                                Batal
                                            </button>
                                        )}
                                    </div>
                                </form>
                            </div>

                            {/* Table List Card */}
                            <div style={styles.crudTableCard}>
                                <h4 style={{ margin: '0 0 15px 0', fontSize: '16px', color: '#1e293b' }}>Daftar Paket Terdaftar</h4>
                                {paketLoading ? (
                                    <p style={{ color: '#64748b', fontSize: '14px' }}>Memuat paket...</p>
                                ) : paketList.length > 0 ? (
                                    <div style={{ overflowX: 'auto' }}>
                                        <table style={styles.table}>
                                            <thead>
                                                <tr>
                                                    <th style={styles.th}>ID</th>
                                                    <th style={styles.th}>Nama Paket</th>
                                                    <th style={styles.th}>Harga Layanan</th>
                                                    <th style={styles.th}>Aksi</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {paketList.map(p => (
                                                    <tr key={p.ID_PAKET} style={styles.tr}>
                                                        <td style={styles.td}>{p.ID_PAKET}</td>
                                                        <td style={{ ...styles.td, fontWeight: 'bold', color: '#1e293b' }}>{p.NAMA_PAKET}</td>
                                                        <td style={styles.td}>Rp {Number(p.HARGA_PAKET).toLocaleString('id-ID')} / bulan</td>
                                                        <td style={styles.td}>
                                                            <button onClick={() => handleEditClick(p)} style={styles.editBtn}>Edit</button>
                                                            <button onClick={() => handleDeletePaket(p.ID_PAKET)} style={styles.deleteBtn}>Hapus</button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <p style={{ color: '#94a3b8', textAlign: 'center', padding: '20px' }}>Belum ada paket layanan terdaftar di database.</p>
                                )}
                            </div>
                        </div>
                    )}

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
        transition: 'transform 0.2s',
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
        fontSize: '28px',
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

    // Package CRUD Section Spacing
    crudWrapper: {
        display: 'flex',
        flexDirection: 'column',
        gap: '24px'
    },
    crudFormCard: {
        backgroundColor: '#ffffff',
        borderRadius: '8px',
        padding: '24px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
    },
    formCardTitle: {
        margin: '0 0 18px 0',
        fontSize: '15px',
        fontWeight: '800',
        color: '#1e293b'
    },
    inlineForm: {
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'flex-end',
        gap: '20px'
    },
    formGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        flex: '1',
        minWidth: '220px'
    },
    inputLabel: {
        fontSize: '12px',
        fontWeight: '700',
        color: '#475569'
    },
    formInput: {
        padding: '11px 14px',
        borderRadius: '8px',
        border: '1px solid #cbd5e1',
        fontSize: '14px',
        color: '#1e293b',
        outline: 'none',
        transition: 'all 0.15s'
    },
    formButtons: {
        display: 'flex',
        gap: '10px',
        minWidth: '220px'
    },
    saveBtn: {
        flex: 1,
        padding: '11px 20px',
        backgroundColor: '#5b4fcf',
        color: '#ffffff',
        fontWeight: '700',
        fontSize: '14px',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        boxShadow: '0 4px 8px rgba(91, 79, 207, 0.2)'
    },
    cancelBtn: {
        padding: '11px 16px',
        backgroundColor: '#f1f5f9',
        color: '#475569',
        fontWeight: '600',
        fontSize: '14px',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer'
    },
    crudTableCard: {
        backgroundColor: '#ffffff',
        borderRadius: '8px',
        padding: '24px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse',
        textAlign: 'left',
        fontSize: '14px'
    },
    th: {
        padding: '12px 16px',
        backgroundColor: '#f8fafc',
        borderBottom: '2px solid #e2e8f0',
        color: '#475569',
        fontWeight: '700'
    },
    tr: {
        borderBottom: '1px solid #f1f5f9',
        transition: 'background-color 0.15s'
    },
    td: {
        padding: '12px 16px',
        color: '#475569'
    },
    editBtn: {
        padding: '6px 12px',
        marginRight: '8px',
        backgroundColor: '#eff6ff',
        color: '#2563eb',
        fontWeight: '700',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '12.5px'
    },
    deleteBtn: {
        padding: '6px 12px',
        backgroundColor: '#fef2f2',
        color: '#dc2626',
        fontWeight: '700',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '12.5px'
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
