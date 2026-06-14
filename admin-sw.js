// Admin Chat Service Worker - Network First + Push Notifications + Badge
const CACHE_VERSION = 'admin-chat-v14-client-dashboard-1718458600';

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

self.addEventListener('fetch', event => {
    if (event.request.method !== 'GET') return;
    if (event.request.url.startsWith('chrome-extension://')) return;
    event.respondWith(
        fetch(event.request)
            .then(response => {
                if (response.ok) {
                    const clone = response.clone();
                    caches.open(CACHE_VERSION).then(cache => cache.put(event.request, clone));
                }
                return response;
            })
            .catch(() => caches.match(event.request))
    );
});

// Push notifications
self.addEventListener('push', event => {
    let data = { title: 'Nuevo mensaje', body: 'Un lead te ha enviado un mensaje' };
    try {
        if (event.data) data = event.data.json();
    } catch (e) {
        if (event.data) data.body = event.data.text();
    }
    const options = {
        body: data.body || 'Tienes un mensaje nuevo',
        icon: data.icon || '/admin-icon.png',
        badge: '/admin-icon.png',
        vibrate: [200, 100, 200],
        tag: 'admin-chat-' + Date.now(),
        renotify: true,
        requireInteraction: true,
        data: data.data || {},
    };
    event.waitUntil(
        Promise.all([
            self.registration.showNotification(data.title || 'Nuevo mensaje', options),
            (async () => {
                try {
                    const notifs = await self.registration.getNotifications();
                    if (navigator.setAppBadge) await navigator.setAppBadge(notifs.length + 1);
                } catch(e) {}
            })()
        ])
    );
});

self.addEventListener('notificationclick', event => {
    event.notification.close();
    if (event.action === 'close') return;
    event.waitUntil(
        Promise.all([
            (async () => {
                try {
                    const notifs = await self.registration.getNotifications();
                    notifs.forEach(n => n.close());
                    if (navigator.clearAppBadge) await navigator.clearAppBadge();
                } catch(e) {}
            })(),
            clients.matchAll({ type: 'window', includeUncontrolled: true }).then(wc => {
                for (const c of wc) {
                    if (c.url.includes('/admin-chat') && 'focus' in c) return c.focus();
                }
                if (clients.openWindow) return clients.openWindow('/admin-chat.html');
            })
        ])
    );
});
