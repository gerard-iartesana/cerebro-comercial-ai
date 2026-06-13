// Chat Service Worker - Network First + Push Notifications + Badge
const CACHE_VERSION = 'chat-v13-badges';

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
        if (event.data) {
            data.body = event.data.text();
        }
    }

    const options = {
        body: data.body || 'Tienes un mensaje nuevo',
        icon: data.icon || 'https://cdn-icons-png.flaticon.com/512/4712/4712035.png',
        badge: data.badge || 'https://cdn-icons-png.flaticon.com/512/4712/4712035.png',
        vibrate: [200, 100, 200],
        tag: 'chat-message-' + Date.now(), // unique tag so each message shows
        renotify: true,
        requireInteraction: true, // keep notification visible until user interacts
        data: data.data || {},
    };

    event.waitUntil(
        Promise.all([
            self.registration.showNotification(data.title || 'Nuevo mensaje', options),
            // Set app badge with unread count
            updateBadge()
        ])
    );
});

// Count unread notifications and set badge
async function updateBadge() {
    try {
        const notifications = await self.registration.getNotifications();
        const count = notifications.length + 1; // +1 for the one being added
        if (navigator.setAppBadge) {
            await navigator.setAppBadge(count);
        }
    } catch (e) {
        // Badge API not supported, ignore
    }
}

// Clear badge when notification is clicked
self.addEventListener('notificationclick', event => {
    event.notification.close();

    if (event.action === 'close') return;

    event.waitUntil(
        Promise.all([
            // Clear badge
            (async () => {
                try {
                    // Clear all notifications
                    const notifications = await self.registration.getNotifications();
                    notifications.forEach(n => n.close());
                    // Clear badge
                    if (navigator.clearAppBadge) {
                        await navigator.clearAppBadge();
                    }
                } catch (e) {}
            })(),
            // Open or focus chat window
            clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
                for (const client of windowClients) {
                    if (client.url.includes('/chat') && 'focus' in client) {
                        return client.focus();
                    }
                }
                if (clients.openWindow) {
                    return clients.openWindow('/chat.html');
                }
            })
        ])
    );
});
