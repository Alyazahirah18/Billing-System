import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import DashboardLayout from './DashboardLayout';

const AdminManajemenPelanggan = ({ user }) => {
    const [pelanggan, setPelanggan] = useState([]);
    const [paketList, setPaketList] = useState([]);
    const [search, setSearch] = useState('');

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editData, setEditData] = useState(null);
    const location = useLocation();

    const adminMenu = [
        { label: 'Dashboard', path: '/admin-dashboard' },
        { label: 'Manajemen Tagihan', path: '/admin/manajemen-tagihan' },
        { label: 'Manajemen Pelanggan', path: '/admin/manajemen-pelanggan' },
        { label: 'Manajemen Layanan', path: '/admin/manajemen-layanan' },
        { label: 'Manajemen E-ticketing', path: '/admin/manajemen-eticketing' },
    ];

    useEffect(() => {
        fetchPelanggan();
        fetchPaket();
        // Logika agar notifikasi manajemen pelanggan ditandai sudah dibaca saat admin membuka halaman ini
        localStorage.setItem('adminLastOpenedPelanggan', new Date().toISOString());
        window.dispatchEvent(new CustomEvent('refetchSidebarBadges'));
    }, []);

    useEffect(() => {
        if (location.state?.autoEditUser && pelanggan.length > 0) {
            const userToEdit = pelanggan.find(p => p.kode_user === location.state.autoEditUser);
            if (userToEdit) {
                openEditModal(userToEdit);
                // Hapus state agar tidak terbuka terus menerus saat re-render
                window.history.replaceState({}, document.title);
            }
        }
    }, [pelanggan, location.state]);

    const fetchPelanggan = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/pelanggan/admin/list`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPelanggan(res.data);
        } catch (err) {
            console.error("Gagal mengambil data pelanggan", err);
        }
    };

    const fetchPaket = async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/paket`);
            setPaketList(res.data);
        } catch (err) {
            console.error("Gagal mengambil data paket", err);
        }
    };

    const handleDelete = async (id) => {
        if (!await window.confirm("Apakah Anda yakin ingin menghapus pelanggan ini?")) return;

        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/api/pelanggan/admin/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('Pelanggan berhasil dihapus.');
            fetchPelanggan();
        } catch (err) {
            alert(err.response?.data?.message || 'Gagal menghapus pelanggan');
        }
    };

    const openEditModal = (p) => {
        setEditData({
            id: p.id_pelanggan,
            kode_user: p.kode_user,
            nama: p.nama,
            no_hp: p.no_hp,
            alamat: p.alamat,
            id_paket: p.id_paket || ''
        });
        setIsEditModalOpen(true);
    };

    const closeEditModal = () => {
        setIsEditModalOpen(false);
        setEditData(null);
    };

    const handleSaveEdit = async () => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(`${import.meta.env.VITE_BACKEND_URL}/api/pelanggan/admin/${editData.id}`, {
                KODE_PELANGGAN: editData.kode_user,
                ID_PAKET: editData.id_paket
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('Data pelanggan berhasil diupdate.');
            closeEditModal();
            fetchPelanggan();
        } catch (err) {
            alert(err.response?.data?.message || 'Gagal mengupdate pelanggan');
        }
    };

    const filteredPelanggan = pelanggan.filter(p =>
        p.nama.toLowerCase().includes(search.toLowerCase()) ||
        p.kode_user.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <DashboardLayout
            activeMenu="Manajemen Pelanggan"
            pageTitle="Manajemen Pelanggan"
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
                    <h2 style={styles.pageTitle}>Manajemen Pelanggan</h2>
                </div>

                <div style={styles.contentArea}>
                    <input
                        type="text"
                        placeholder="Search"
                        style={styles.searchInput}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />

                    <div style={styles.tableContainer}>
                        <table style={styles.table}>
                            <thead>
                                <tr>
                                    <th style={styles.th}>Kode User</th>
                                    <th style={styles.th}>Nama</th>
                                    <th style={styles.th}>Nomor Handphone</th>
                                    <th style={styles.th}>Alamat</th>
                                    <th style={styles.th}>Paket Layanan</th>
                                    <th style={styles.th}>Status</th>
                                    <th style={styles.th}>Jatuh Tempo</th>
                                    <th style={styles.th}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredPelanggan.length > 0 ? (
                                    filteredPelanggan.map((p, idx) => (
                                        <tr key={idx} style={styles.tr}>
                                            <td style={styles.td}>{p.kode_user}</td>
                                            <td style={styles.td}>{p.nama}</td>
                                            <td style={styles.td}>{p.no_hp}</td>
                                            <td style={styles.td}>{p.alamat}</td>
                                            <td style={styles.td}>{p.paket_layanan}</td>
                                            <td style={{ ...styles.td, color: p.status === 'AKTIF' ? '#2ecc71' : (p.status === 'BLOCKIR' ? '#000' : '#e74c3c'), fontWeight: 'bold' }}>
                                                {p.status}
                                            </td>
                                            <td style={styles.td}>{p.jatuh_tempo}</td>
                                            <td style={styles.td}>
                                                <span style={styles.actionLink} onClick={() => openEditModal(p)}>Edit</span>{' '}
                                                <span style={styles.actionLink} onClick={() => handleDelete(p.id_pelanggan)}>Delete</span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr style={styles.tr}>
                                        <td colSpan="8" style={{ ...styles.td, color: '#888', padding: '30px' }}>
                                            Pelanggan tidak terdaftar
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Edit Modal */}
            {isEditModalOpen && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modalContent}>
                        <h3 style={styles.modalTitle}>Edit Data Pelanggan</h3>

                        <div style={styles.formRow}>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Kode User</label>
                                <input
                                    type="text"
                                    value={editData.kode_user}
                                    onChange={(e) => setEditData({ ...editData, kode_user: e.target.value })}
                                    style={styles.input}
                                />
                            </div>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Nama</label>
                                <input type="text" value={editData.nama} disabled style={styles.inputDisabled} />
                            </div>
                        </div>

                        <div style={styles.formGroupFull}>
                            <label style={styles.label}>Nomor Handphone</label>
                            <input type="text" value={editData.no_hp} disabled style={styles.inputDisabled} />
                        </div>

                        <div style={styles.formGroupFull}>
                            <label style={styles.label}>Alamat</label>
                            <input type="text" value={editData.alamat} disabled style={styles.inputDisabled} />
                        </div>

                        <div style={styles.formGroupFull}>
                            <label style={styles.label}>Paket Layanan</label>
                            <select
                                value={editData.id_paket}
                                onChange={(e) => setEditData({ ...editData, id_paket: e.target.value })}
                                style={styles.input}
                            >
                                <option value="">Pilih Paket</option>
                                {paketList.map(pkt => (
                                    <option key={pkt.ID_PAKET} value={pkt.ID_PAKET}>{pkt.NAMA_PAKET}</option>
                                ))}
                            </select>
                        </div>

                        <button style={styles.saveBtn} onClick={handleSaveEdit}>Simpan</button>
                        <button style={styles.cancelBtn} onClick={closeEditModal}>Batal</button>
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
    searchInput: {
        width: '100%',
        padding: '12px 20px',
        borderRadius: '8px',
        border: '1px solid #ccc',
        marginBottom: '20px',
        fontSize: '14px',
        boxSizing: 'border-box'
    },
    tableContainer: {
        backgroundColor: '#fff',
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse',
    },
    th: {
        backgroundColor: '#f8f9fa',
        color: '#495057',
        padding: '15px',
        textAlign: 'center',
        fontWeight: '600',
        fontSize: '14px',
        borderBottom: '2px solid #dee2e6'
    },
    tr: {
        borderBottom: '1px solid #dee2e6',
    },
    td: {
        padding: '15px',
        textAlign: 'center',
        fontSize: '13px',
        color: '#333'
    },
    actionLink: {
        color: '#3498db',
        cursor: 'pointer',
        textDecoration: 'underline',
        marginRight: '5px'
    },
    modalOverlay: {
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
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
        boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
    },
    modalTitle: {
        marginTop: 0,
        marginBottom: '25px',
        fontSize: '20px',
        color: '#000'
    },
    formRow: {
        display: 'flex',
        gap: '20px',
        marginBottom: '15px'
    },
    formGroup: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column'
    },
    formGroupFull: {
        display: 'flex',
        flexDirection: 'column',
        marginBottom: '15px'
    },
    label: {
        fontSize: '13px',
        fontWeight: '600',
        marginBottom: '5px',
        color: '#333'
    },
    input: {
        padding: '10px',
        border: '1px solid #ccc',
        borderRadius: '5px',
        fontSize: '14px'
    },
    inputDisabled: {
        padding: '10px',
        border: '1px solid #ddd',
        borderRadius: '5px',
        fontSize: '14px',
        backgroundColor: '#f9f9f9',
        color: '#777'
    },
    saveBtn: {
        width: '100%',
        padding: '12px',
        backgroundColor: '#5b6abf',
        color: '#fff',
        border: 'none',
        borderRadius: '5px',
        fontSize: '14px',
        fontWeight: '600',
        cursor: 'pointer',
        marginTop: '10px'
    },
    cancelBtn: {
        width: '100%',
        padding: '12px',
        backgroundColor: '#e74c3c',
        color: '#fff',
        border: 'none',
        borderRadius: '5px',
        fontSize: '14px',
        fontWeight: '600',
        cursor: 'pointer',
        marginTop: '10px'
    }
};

export default AdminManajemenPelanggan;
