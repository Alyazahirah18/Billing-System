import { Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';

// Komponen Proteksi Route
const ProtectedRoute = ({ children, user, setUser }) => {
    const [isVerified, setIsVerified] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const verifyUser = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                setIsLoading(false);
                return;
            }

            try {
                // Verifikasi token ke server
                const res = await axios.get('http://localhost:5000/api/auth/me', {
                    headers: { Authorization: `Bearer ${token}` }
                });

                // Update state jika data server berbeda (opsional tapi disarankan)
                setUser(res.data.user);
                setIsVerified(true);
            } catch (err) {
                console.error("Token invalid/expired:", err);
                // Clear data jika token expired/invalid
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                setUser(null);
            } finally {
                setIsLoading(false);
            }
        };

        verifyUser();
    }, [setUser]);

    if (isLoading) {
        return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading...</div>;
    }

    // Jika belum login atau token invalid, lempar ke halaman login
    if (!user || !isVerified) {
        return <Navigate to="/login" />;
    }

    // Jika status calon pelanggan, hanya bisa akses halaman mulai berlangganan
    if (user.status_langganan === 'calon') {
        return <Navigate to="/mulai-berlangganan" />;
    }

    // Jika cp sudah bayar, baru bisa akses semua menu di sidebar
    return children;
};

export default ProtectedRoute;