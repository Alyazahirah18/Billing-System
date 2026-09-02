// Import scripts untuk Firebase App dan Messaging versi compat (lebih stabil untuk SW)
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Inisialisasi Firebase di dalam Service Worker
firebase.initializeApp({
    apiKey: "AIzaSyBNqEs4PoopPsuLksQZWX_LPJgK0tKeLqs",
    authDomain: "billing-system-signal.firebaseapp.com",
    projectId: "billing-system-signal",
    storageBucket: "billing-system-signal.firebasestorage.app",
    messagingSenderId: "1033432144966",
    appId: "1:1033432144966:web:5fc77cefc4a04a40d8fe47"
});

const messaging = firebase.messaging();

// Menangani notifikasi saat aplikasi di background atau tertutup
messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);

    // Tampilkan push notification
    const notificationTitle = payload.notification?.title || 'Notifikasi Baru';
    const notificationOptions = {
        body: payload.notification?.body || 'Anda memiliki notifikasi baru.',
        icon: '/logo_signal.png',
        badge: '/logo_signal.png',
        data: payload.data || {},
        // Pastikan notifikasi tetap muncul walau browser sedang tidak aktif
        requireInteraction: true,
        tag: payload.data?.kategori || 'default'
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});

// Saat notifikasi diklik, buka halaman notifikasi
self.addEventListener('notificationclick', (event) => {
    console.log('[firebase-messaging-sw.js] Notification click received.');
    event.notification.close();

    // Buka halaman notifikasi di tab 
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            // Cari tab yang sudah terbuka
            for (const client of clientList) {
                if (client.url.includes('/notifikasi') && 'focus' in client) {
                    return client.focus();
                }
            }
            // Jika tidak ada tab yang terbuka, buka tab baru
            if (clients.openWindow) {
                return clients.openWindow('/notifikasi');
            }
        })
    );
});