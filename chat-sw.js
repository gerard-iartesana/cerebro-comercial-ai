// Service Worker for Chat PWA
const CACHE_NAME = 'chat-v1';
const ASSETS = ['/chat'];

self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
    );
    self.skipWaiting();
});

self.addEventListener('activate', (e) => {
    e.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (e) => {
    // Network-first strategy for API/realtime, cache-first for assets
    if (e.request.url.includes('supabase') || e.request.url.includes('/api/')) {
        return;
    }
    e.respondWith(
        fetch(e.request).catch(() => caches.match(e.request))
    );
});

// Handle push notifications
self.addEventListener('push', (e) => {
    const data = e.data?.json() || {};
    const title = data.title || 'Nuevo mensaje';
    const options = {
        body: data.body || 'Tienes un nuevo mensaje en el chat',
        icon: 'https://cdn-icons-png.flaticon.com/512/4712/4712035.png',
        badge: 'https://cdn-icons-png.flaticon.com/512/4712/4712035.png',
        vibrate: [100, 50, 100],
        data: { url: data.url || '/chat' }
    };
    e.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (e) => {
    e.notification.close();
    const url = e.notification.data?.url || '/chat';
    e.waitUntil(
        clients.matchAll({ type: 'window' }).then(windowClients => {
            for (const client of windowClients) {
                if (client.url.includes('/chat') && 'focus' in client) return client.focus();
            }
            return clients.openWindow(url);
        })
    );
});
