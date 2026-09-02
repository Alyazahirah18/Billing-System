import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useLocation } from 'react-router-dom';
import DashboardLayout from './DashboardLayout';

const AdminManajemenETicketing = ({ user }) => {
    const location = useLocation();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState('table'); // 'table' or 'form'
    const [selectedAduan, setSelectedAduan] = useState(null);
    const [isRescheduleMode, setIsRescheduleMode] = useState(false);
    const [isManualMode, setIsManualMode] = useState(false);
    const [originalTicketId, setOriginalTicketId] = useState(null);
    const [pelangganList, setPelangganList] = useState([]);
    
    // Form States
    const [wilayahList, setWilayahList] = useState([]);
    const [teknisiList, setTeknisiList] = useState([]);
    const [formData, setFormData] = useState({
        jenis_penugasan: 'Perbaikan',
        id_pelanggan: '',
        prioritas: 'Sedang',
        wilayah: '',
        id_pegawai: '',
        tanggal: '',
        waktu: '',
        deskripsi: '',
        nomorEticket: ''
    });

    const adminMenu = [
        { label: 'Dashboard', path: '/admin-dashboard' },
        { label: 'Manajemen Tagihan', path: '/admin/manajemen-tagihan' },
        { label: 'Manajemen Pelanggan', path: '/admin/manajemen-pelanggan' },
        { label: 'Manajemen Layanan', path: '/admin/manajemen-layanan' },
        { label: 'Manajemen E-ticketing', path: '/admin/manajemen-eticketing' },
    ];

    useEffect(() => {
        fetchAduan();
        fetchWilayah();

        // Logika agar notifikasi manajemen e-ticketing ditandai sudah dibaca saat admin membuka halaman ini
        localStorage.setItem('adminLastOpenedEticketing', new Date().toISOString());
        window.dispatchEvent(new CustomEvent('refetchSidebarBadges'));

        // Handle direct from reschedule
        if (location.state && location.state.rescheduleData) {
            const rd = location.state.rescheduleData;
            setIsRescheduleMode(true);
            setOriginalTicketId(rd.id_ticket);
            
            // Mock an aduan object for the form
            setSelectedAduan({
                id_aduan: rd.id_aduan || null, // We might need to ensure id_aduan is in rd
                noAduan: `AD${String(rd.id_ticket).padStart(2, '0')}`, // Fallback
                status: 'Reschedule',
                kategori: rd.kategori
            });

            setFormData({
                ...formData,
                nomorEticket: rd.e_ticket,
                jenis_penugasan: 'Perbaikan', // default fallback for reschedule
                prioritas: 'Sedang',
                wilayah: '', // Will be filled by admin
                id_pegawai: rd.id_pegawai || '',
                tanggal: rd.tanggal_baru,
                waktu: rd.jam_baru,
                deskripsi: rd.deskripsi
            });
            setView('form');
        }
    }, [location.state]);

    const fetchAduan = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/dashboard/admin/layanan/eticketing`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setData(res.data);
        } catch (err) {
            console.error("Gagal mengambil data aduan eticketing", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchWilayah = async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/auth/wilayah`);
            setWilayahList(res.data);
        } catch (err) {
            console.error("Gagal mengambil data wilayah", err);
        }
    };

    const fetchTeknisi = async (wilayah) => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/dashboard/admin/layanan/teknisi/${encodeURIComponent(wilayah)}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTeknisiList(res.data);
        } catch (err) {
            console.error("Gagal mengambil data teknisi", err);
        }
    };

    const fetchPelangganAll = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/dashboard/admin/layanan/pelanggan-all`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPelangganList(res.data);
        } catch (err) {
            console.error("Gagal mengambil data pelanggan", err);
        }
    };

    const handleWilayahChange = (e) => {
        const selectedWilayah = e.target.value;
        setFormData({ ...formData, wilayah: selectedWilayah, id_pegawai: '' });
        if (selectedWilayah) {
            fetchTeknisi(selectedWilayah);
        } else {
            setTeknisiList([]);
        }
    };

    const handleJadwalkan = (aduan) => {
        setIsManualMode(false);
        setSelectedAduan(aduan);
        setFormData({
            ...formData,
            nomorEticket: `SGJL${Math.floor(Math.random() * 1000) + 100}`, // Format SGJLxxx
            jenis_penugasan: 'Perbaikan',
            id_pelanggan: '',
            prioritas: 'Sedang',
            wilayah: '',
            id_pegawai: '',
            tanggal: '',
            waktu: '',
            deskripsi: ''
        });
        setTeknisiList([]);
        setView('form');
    };

    const handleBuatManual = () => {
        setIsManualMode(true);
        setSelectedAduan(null);
        fetchPelangganAll();
        setFormData({
            ...formData,
            nomorEticket: `SGJL${Math.floor(Math.random() * 1000) + 100}`, // Format SGJLxxx
            jenis_penugasan: 'Instalasi Pemasangan',
            id_pelanggan: '',
            prioritas: 'Sedang',
            wilayah: '',
            id_pegawai: '',
            tanggal: '',
            waktu: '',
            deskripsi: ''
        });
        setTeknisiList([]);
        setView('form');
    };

    const handleBack = () => {
        setView('table');
        setSelectedAduan(null);
        setIsManualMode(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.id_pegawai || !formData.tanggal || !formData.waktu || !formData.deskripsi) {
            alert("Harap lengkapi semua field yang diperlukan.");
            return;
        }

        try {
            const token = localStorage.getItem('token');
            
            if (isManualMode) {
                if (!formData.id_pelanggan) {
                    alert("Harap pilih pelanggan.");
                    return;
                }
                const payload = {
                    id_pelanggan: formData.id_pelanggan,
                    id_pegawai: formData.id_pegawai,
                    tanggal: formData.tanggal,
                    waktu: formData.waktu,
                    jenis_penugasan: formData.jenis_penugasan,
                    prioritas: formData.prioritas,
                    wilayah: formData.wilayah,
                    deskripsi: formData.deskripsi
                };
                await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/dashboard/admin/layanan/eticketing/manual`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                alert('E-ticket manual berhasil dibuat dan ditugaskan.');
            } else {
                const payload = {
                    id_aduan: selectedAduan.id_aduan,
                    id_pegawai: formData.id_pegawai,
                    tanggal: formData.tanggal,
                    waktu: formData.waktu,
                    jenis_penugasan: formData.jenis_penugasan,
                    prioritas: formData.prioritas,
                    wilayah: formData.wilayah,
                    deskripsi: formData.deskripsi
                };

                if (isRescheduleMode && originalTicketId) {
                    await axios.put(`${import.meta.env.VITE_BACKEND_URL}/api/dashboard/admin/layanan/eticketing/${originalTicketId}`, payload, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    alert('E-ticket berhasil diperbarui sesuai jadwal reschedule.');
                } else {
                    await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/dashboard/admin/layanan/eticketing`, payload, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    alert('E-ticket berhasil dibuat dan ditugaskan.');
                }
            }
            
            setView('table');
            setIsRescheduleMode(false);
            setIsManualMode(false);
            setOriginalTicketId(null);
            fetchAduan(); // Refresh data table
        } catch (err) {
            console.error("Gagal memproses e-ticket", err);
            alert(err.response?.data?.message || 'Gagal memproses e-ticket');
        }
    };

    return (
        <DashboardLayout
            activeMenu="Manajemen E-ticketing"
            pageTitle="Manajemen E-ticketing"
            user={user}
            customMenuItems={adminMenu}
            hideHeader={true}
            noPadding={true}
        >
            <div style={styles.pageContainer}>
                {/* Custom Header */}
                <div style={styles.customHeader}>
                    <button 
                        onClick={() => view === 'form' ? handleBack() : window.history.back()} 
                        style={styles.backButton}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="15 18 9 12 15 6"></polyline>
                        </svg>
                    </button>
                    <h2 style={styles.pageTitle}>E-ticketing</h2>
                </div>

                <div style={styles.contentArea}>
                    {view === 'table' ? (
                        <div style={styles.tableSection}>
                            <div style={styles.tableHeaderContainer}>
                                <h3 style={styles.tableTitle}>Daftar Aduan (Menunggu E-ticket)</h3>
                                <button onClick={handleBuatManual} style={styles.buatManualBtn}>
                                    + Buat E-ticket
                                </button>
                            </div>
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
                                    ) : data.length > 0 ? (
                                        data.map((item, idx) => (
                                            <tr key={idx} style={styles.tr}>
                                                <td style={styles.td}>{item.noAduan}</td>
                                                <td style={styles.td}>{item.userId}</td>
                                                <td style={styles.td}>{item.kategori}</td>
                                                <td style={styles.td}>{item.tanggal}</td>
                                                <td style={{...styles.td, textDecoration: 'underline'}}>{item.subjek}</td>
                                                <td style={{ ...styles.td, color: '#e74c3c' }}>{item.status}</td>
                                                <td style={styles.td}>
                                                    <span style={styles.actionLink} onClick={() => handleJadwalkan(item)}>Jadwalkan</span>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>Tidak ada aduan yang menunggu perbaikan.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        </div>
                    ) : (
                        // Form Penjadwalan View
                        <div style={styles.formContainer}>
                            <form onSubmit={handleSubmit}>
                                <div style={styles.formRow}>
                                    <div style={styles.formGroup}>
                                        <label style={styles.label}>Nomor E-ticket</label>
                                        <input 
                                            type="text" 
                                            value={formData.nomorEticket} 
                                            disabled 
                                            style={styles.inputDisabled} 
                                        />
                                    </div>
                                    {isManualMode ? (
                                        <div style={styles.formGroup}>
                                            <label style={styles.label}>Pilih Pelanggan</label>
                                            <div style={styles.selectWrapper}>
                                                <select 
                                                    value={formData.id_pelanggan}
                                                    onChange={(e) => setFormData({...formData, id_pelanggan: e.target.value})}
                                                    style={styles.select}
                                                    required
                                                >
                                                    <option value="">Pilih Pelanggan</option>
                                                    {pelangganList.map(p => (
                                                        <option key={p.ID_PELANGGAN} value={p.ID_PELANGGAN}>
                                                            {p.KODE_PELANGGAN} - {p.NAMA_PELANGGAN}
                                                        </option>
                                                    ))}
                                                </select>
                                                <div style={styles.dropdownIcon}>▼</div>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div style={styles.formGroup}>
                                                <label style={styles.label}>Nomor Aduan</label>
                                                <input 
                                                    type="text" 
                                                    value={selectedAduan?.noAduan || ''} 
                                                    disabled 
                                                    style={styles.inputDisabled} 
                                                />
                                            </div>
                                            <div style={styles.formGroup}>
                                                <label style={styles.label}>Status</label>
                                                <input 
                                                    type="text" 
                                                    value={selectedAduan?.status || ''} 
                                                    disabled 
                                                    style={styles.inputDisabled} 
                                                />
                                            </div>
                                        </>
                                    )}
                                </div>

                                <div style={styles.formRow}>
                                    <div style={styles.formGroup}>
                                        <label style={styles.label}>Jenis Penugasan</label>
                                        <div style={styles.selectWrapper}>
                                            <select 
                                                value={formData.jenis_penugasan}
                                                onChange={(e) => setFormData({...formData, jenis_penugasan: e.target.value})}
                                                style={styles.select}
                                            >
                                                <option value="Perbaikan">Perbaikan</option>
                                                <option value="Instalasi Pemasangan">Instalasi Pemasangan</option>
                                                <option value="Pemutusan">Pemutusan</option>
                                            </select>
                                            <div style={styles.dropdownIcon}>▼</div>
                                        </div>
                                    </div>
                                    <div style={styles.formGroup}>
                                        <label style={styles.label}>Prioritas</label>
                                        <div style={styles.selectWrapper}>
                                            <select 
                                                value={formData.prioritas}
                                                onChange={(e) => setFormData({...formData, prioritas: e.target.value})}
                                                style={styles.select}
                                            >
                                                <option value="Rendah">Rendah</option>
                                                <option value="Sedang">Sedang</option>
                                                <option value="Tinggi">Tinggi</option>
                                                <option value="Darurat">Darurat</option>
                                            </select>
                                            <div style={styles.dropdownIcon}>▼</div>
                                        </div>
                                    </div>
                                </div>

                                <div style={styles.formRow}>
                                    <div style={styles.formGroup}>
                                        <label style={styles.label}>Wilayah</label>
                                        <div style={styles.selectWrapper}>
                                            <select 
                                                value={formData.wilayah}
                                                onChange={handleWilayahChange}
                                                style={styles.select}
                                                required
                                            >
                                                <option value="">Pilih Wilayah</option>
                                                {wilayahList.map((w, idx) => (
                                                    <option key={idx} value={w}>{w}</option>
                                                ))}
                                            </select>
                                            <div style={styles.dropdownIcon}>▼</div>
                                        </div>
                                    </div>
                                    <div style={styles.formGroup}>
                                        <label style={styles.label}>Nama Teknisi</label>
                                        <div style={styles.selectWrapper}>
                                            <select 
                                                value={formData.id_pegawai}
                                                onChange={(e) => setFormData({...formData, id_pegawai: e.target.value})}
                                                style={styles.select}
                                                required
                                                disabled={!formData.wilayah}
                                            >
                                                <option value="">{formData.wilayah ? "Pilih Teknisi" : "Pilih Wilayah Terlebih Dahulu"}</option>
                                                {teknisiList.map(t => (
                                                    <option key={t.ID_PEGAWAI} value={t.ID_PEGAWAI}>{t.NAMA}</option>
                                                ))}
                                            </select>
                                            {formData.wilayah && <div style={styles.dropdownIcon}>▼</div>}
                                        </div>
                                    </div>
                                </div>

                                <div style={styles.formRow}>
                                    <div style={styles.formGroup}>
                                        <label style={styles.label}>Tanggal</label>
                                        <input 
                                            type="date" 
                                            value={formData.tanggal}
                                            onChange={(e) => setFormData({...formData, tanggal: e.target.value})}
                                            style={styles.input} 
                                            required
                                        />
                                    </div>
                                    <div style={styles.formGroup}>
                                        <label style={styles.label}>Waktu</label>
                                        <input 
                                            type="time" 
                                            value={formData.waktu}
                                            onChange={(e) => setFormData({...formData, waktu: e.target.value})}
                                            style={styles.input} 
                                            required
                                        />
                                    </div>
                                </div>

                                <div style={styles.formRow}>
                                    <div style={styles.formGroupFull}>
                                        <label style={styles.label}>Deskripsi</label>
                                        <input 
                                            type="text" 
                                            placeholder="Tuliskan Status Penanganan"
                                            value={formData.deskripsi}
                                            onChange={(e) => setFormData({...formData, deskripsi: e.target.value})}
                                            style={styles.input} 
                                            required
                                        />
                                    </div>
                                </div>

                                <div style={styles.submitRow}>
                                    <button type="submit" style={styles.submitBtn}>
                                        Ajukan
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
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
    tableSection: {
        display: 'flex',
        flexDirection: 'column',
    },
    tableHeaderContainer: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px',
    },
    tableTitle: {
        fontSize: '16px',
        fontWeight: '600',
        color: '#1a1a2e',
        margin: 0,
    },
    buatManualBtn: {
        backgroundColor: '#5b6abf',
        color: '#fff',
        border: 'none',
        borderRadius: '6px',
        padding: '8px 16px',
        fontSize: '13px',
        fontWeight: '600',
        cursor: 'pointer',
        boxShadow: '0 2px 4px rgba(91,106,191,0.3)',
        transition: 'background-color 0.2s',
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
        color: '#333',
        fontWeight: '500'
    },
    actionLink: {
        color: '#3498db',
        textDecoration: 'none',
        cursor: 'pointer',
        fontSize: '13px',
        fontWeight: '500'
    },
    formContainer: {
        backgroundColor: 'transparent',
        maxWidth: '900px'
    },
    formRow: {
        display: 'flex',
        gap: '20px',
        marginBottom: '20px'
    },
    formGroup: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column'
    },
    formGroupFull: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column'
    },
    label: {
        fontSize: '14px',
        fontWeight: '600',
        color: '#333',
        marginBottom: '8px'
    },
    input: {
        padding: '12px 16px',
        borderRadius: '8px',
        border: '1px solid #ccc',
        fontSize: '14px',
        backgroundColor: '#fff',
        boxSizing: 'border-box'
    },
    inputDisabled: {
        padding: '12px 16px',
        borderRadius: '8px',
        border: '1px solid #ccc',
        fontSize: '14px',
        backgroundColor: '#fff', // Looks white in image even if disabled
        color: '#333',
        boxSizing: 'border-box'
    },
    selectWrapper: {
        position: 'relative',
        display: 'flex',
        alignItems: 'center'
    },
    select: {
        width: '100%',
        padding: '12px 16px',
        paddingRight: '40px',
        borderRadius: '8px',
        border: '1px solid #ccc',
        fontSize: '14px',
        backgroundColor: '#fff',
        appearance: 'none',
        boxSizing: 'border-box'
    },
    dropdownIcon: {
        position: 'absolute',
        right: '16px',
        pointerEvents: 'none',
        fontSize: '12px',
        color: '#555'
    },
    submitRow: {
        display: 'flex',
        justifyContent: 'flex-end',
        marginTop: '30px'
    },
    submitBtn: {
        backgroundColor: '#5b6abf',
        color: '#fff',
        border: 'none',
        padding: '12px 36px',
        borderRadius: '8px',
        fontSize: '15px',
        fontWeight: '600',
        cursor: 'pointer',
        boxShadow: '0 4px 10px rgba(91,106,191,0.3)',
    }
};

export default AdminManajemenETicketing;
