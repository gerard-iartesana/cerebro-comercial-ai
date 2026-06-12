// Chat Service Worker - Network First + Push Notifications
const CACHE_VERSION = 'chat-v8';

self.addEventListener('install', event => {
    self.skipWaiting();
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k)))
        ).then(() => self.clients.claim())
    );
});

// Network-first strategy: always try network, fall back to cache
self.addEventListener('fetch', event => {
    if (event.request.method !== 'GET') return;
    if (event.request.url.startsWith('chrome-extension://')) return;

    event.respondWith(
        fetch(event.request)
            .then(response => {
                if (response.ok) {
                    const clone = response.clone();
                    caches.open(CACHE_VERSION).then(cache => {
                        cache.put(event.request, clone);
                    });
                }
                return response;
            })
            .catch(() => {
                return caches.match(event.request);
            })
    );
});

// ===== PUSH NOTIFICATIONS =====
self.addEventListener('push', event => {
    let data = { title: 'Nuevo mensaje', body: 'Tienes un mensaje nuevo' };
    
    try {
        if (event.data) {
            data = event.data.json();
        }
    } catch (e) {
        // If not JSON, use text
        if (event.data) {
            data.body = event.data.text();
        }
    }

    const options = {
        body: data.body || 'Tienes un mensaje nuevo',
        icon: data.icon || 'https://cdn-icons-png.flaticon.com/512/4712/4712035.png',
        badge: data.badge || 'https://cdn-icons-png.flaticon.com/512/4712/4712035.png',
        vibrate: [200, 100, 200],
        tag: 'chat-message',
        renotify: true,
        requireInteraction: false,
        data: data.data || {},
        actions: [
            { action: 'open', title: 'Abrir chat' },
            { action: 'close', title: 'Cerrar' }
        ]
    };

    event.waitUntil(
        self.registration.showNotification(data.title || 'Nuevo mensaje', options)
    );
});

// Handle notification click
self.addEventListener('notificationclick', event => {
    event.notification.close();

    if (event.action === 'close') return;

    // Open or focus the chat window
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
            // Try to find an existing chat window
            for (const client of windowClients) {
                if (client.url.includes('/chat') && 'focus' in client) {
                    return client.focus();
                }
            }
            // Open new window if none found
            if (clients.openWindow) {
                return clients.openWindow('/chat.html');
            }
        })
    );
});
