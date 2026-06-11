// Chat Service Worker - Network First (always fresh content)
const CACHE_VERSION = 'chat-v3';

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
    // Skip non-GET and chrome-extension requests
    if (event.request.method !== 'GET') return;
    if (event.request.url.startsWith('chrome-extension://')) return;

    event.respondWith(
        fetch(event.request)
            .then(response => {
                // Cache successful responses
                if (response.ok) {
                    const clone = response.clone();
                    caches.open(CACHE_VERSION).then(cache => {
                        cache.put(event.request, clone);
                    });
                }
                return response;
            })
            .catch(() => {
                // Offline: try cache
                return caches.match(event.request);
            })
    );
});
