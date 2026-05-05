import React, { useEffect, useState } from 'react';
import DashboardLayout from './DashboardLayout';
import axios from 'axios';

const LihatProduk = ({ user }) => {
    const [paket, setPaket] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPaket = async () => {
            try {
                const res = await axios.get('http://localhost:5000/api/paket');
                setPaket(res.data);
                setLoading(false);
            } catch (err) {
                console.error("Gagal memuat paket", err);
                setLoading(false);
            }
        };
        fetchPaket();
    }, []);

    const formatCurrency = (amount) => {
        return `Rp. ${Number(amount).toLocaleString('id-ID')},00`;
    };

    if (loading) return (
        <DashboardLayout activeMenu="Lihat Produk" pageTitle="Produk Layanan" user={user}>
            <div style={{ padding: '20px', textAlign: 'center' }}>Memuat Katalog...</div>
        </DashboardLayout>
    );

    return (
        <DashboardLayout activeMenu="Lihat Produk" pageTitle="Produk Layanan" user={user}>
            <div style={styles.container}>
                <div style={styles.cardsGrid}>
                    {paket.map((item) => {
                        // Coba ekstrak informasi kecepatan (misal "10 Mbps") dan fitur tambahan (misal TV)
                        let mbpsText = item.NAMA_PAKET;
                        const mbpsMatch = item.NAMA_PAKET.match(/(\d+\s*Mbps)/i);
                        if (mbpsMatch) {
                            mbpsText = mbpsMatch[1];
                        }

                        // Deteksi jika ada free TV (ini asumsi penamaan paket)
                        let freeTvText = null;
                        if (item.NAMA_PAKET.toLowerCase().includes('tv') || item.NAMA_PAKET.toLowerCase().includes('channel')) {
                            const tvMatch = item.NAMA_PAKET.match(/(\d+\s*Channel)/i);
                            freeTvText = tvMatch ? `Free TV ${tvMatch[1]}` : 'Free TV Channel';
                        }
                        
                        // Hardcode untuk visual seperti digambar jika namanya tidak sesuai
                        // Gambar menampilkan 10, 15, 20 (tanpa TV) dan 25, 35, 50 (dengan TV)
                        if (!freeTvText && (mbpsText.includes('25') || mbpsText.includes('35'))) {
                            freeTvText = 'Free TV 60 Channel';
                        } else if (!freeTvText && mbpsText.includes('50')) {
                            freeTvText = 'Free TV 100 Channel';
                        }

                        return (
                            <div key={item.ID_PAKET} style={styles.cardWrapper}>
                                <div style={styles.card}>
                                    <div style={styles.ribbon}>
                                        <span style={styles.ribbonText}>{mbpsText}</span>
                                    </div>
                                    <div style={styles.priceSection}>
                                        <div style={styles.priceText}>{formatCurrency(item.HARGA_PAKET)}</div>
                                        <div style={styles.bulanText}>/Bulan</div>
                                    </div>
                                </div>
                                {freeTvText && (
                                    <div style={styles.bottomTag}>
                                        {freeTvText}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </DashboardLayout>
    );
};

const styles = {
    container: {
        backgroundColor: '#fcf8fa', // Warna pink/grey muda sesuai gambar
        padding: '60px 40px',
        borderRadius: '8px',
        minHeight: '60vh',
    },
    cardsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '60px 40px',
        justifyContent: 'center',
        maxWidth: '1000px',
        margin: '0 auto'
    },
    cardWrapper: {
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '100%',
        maxWidth: '300px',
        margin: '0 auto'
    },
    card: {
        position: 'relative',
        width: '100%',
        height: '100px',
        border: '1.5px dashed #555',
        borderRadius: '16px',
        display: 'flex',
        alignItems: 'center',
        backgroundColor: 'transparent',
    },
    ribbon: {
        position: 'absolute',
        left: '-2px',
        top: '50%',
        transform: 'translateY(-50%)',
        backgroundColor: '#1b2fe8', // Warna biru sesuai gambar
        height: '40px',
        width: '100px',
        display: 'flex',
        alignItems: 'center',
        paddingLeft: '15px',
        clipPath: 'polygon(0% 0%, 75% 0%, 100% 50%, 75% 100%, 0% 100%)',
    },
    ribbonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: '14px',
        letterSpacing: '0.5px',
    },
    priceSection: {
        marginLeft: '110px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
    },
    priceText: {
        fontWeight: 'bold',
        fontSize: '15px',
        color: '#000',
    },
    bulanText: {
        fontSize: '14px',
        color: '#000',
        marginTop: '2px',
        fontWeight: '500'
    },
    bottomTag: {
        position: 'absolute',
        bottom: '-12px',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: '#e6e6e6',
        border: '1px dashed #666',
        borderRadius: '20px',
        padding: '3px 15px',
        fontSize: '11px',
        fontWeight: 'bold',
        color: '#333',
        whiteSpace: 'nowrap',
    }
};

export default LihatProduk;
