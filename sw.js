/* ============================================
   HYPNO - Service Worker for PWA
   ============================================ */

const CACHE_NAME = 'hypno-v1';
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/css/styles.css',
    '/css/menu.css',
    '/css/animations.css',
    '/js/main.js',
    '/js/config.js',
    '/js/utils.js',
    '/js/scene.js',
    '/js/shapes.js',
    '/js/emotions.js',
    '/js/user.js',
    '/js/connections.js',
    '/js/firebase.js',
    '/js/ui.js',
    '/manifest.json',
    '/assets/icons/icon.svg',
    '/assets/icons/icon-192.png',
    '/assets/icons/icon-512.png'
];

// External resources to cache
const EXTERNAL_ASSETS = [
    'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Outfit:wght@200;300;400;500&display=swap',
    'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js',
    'https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    console.log('🌌 Service Worker: Installing...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('🌌 Service Worker: Caching static assets');
                // Cache static assets (don't fail if some are missing)
                return Promise.allSettled(
                    STATIC_ASSETS.map(url => 
                        cache.add(url).catch(err => console.log('Cache miss:', url))
                    )
                );
            })
            .then(() => {
                console.log('🌌 Service Worker: Installed');
                return self.skipWaiting();
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('🌌 Service Worker: Activating...');
    
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter((name) => name !== CACHE_NAME)
                        .map((name) => {
                            console.log('🌌 Service Worker: Deleting old cache:', name);
                            return caches.delete(name);
                        })
                );
            })
            .then(() => {
                console.log('🌌 Service Worker: Activated');
                return self.clients.claim();
            })
    );
});

// Fetch event - network first, fallback to cache
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }
    
    // Skip Firebase requests (need real-time data)
    if (url.hostname.includes('firebase') || 
        url.hostname.includes('firebaseio') ||
        url.hostname.includes('googleapis')) {
        return;
    }
    
    // For navigation requests, try network first
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request)
                .catch(() => caches.match('/index.html'))
        );
        return;
    }
    
    // For other requests, use stale-while-revalidate strategy
    event.respondWith(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.match(request).then((cachedResponse) => {
                const fetchPromise = fetch(request).then((networkResponse) => {
                    // Update cache with fresh response
                    if (networkResponse.ok) {
                        cache.put(request, networkResponse.clone());
                    }
                    return networkResponse;
                }).catch(() => {
                    // Network failed, return cached if available
                    return cachedResponse;
                });
                
                // Return cached response immediately, update in background
                return cachedResponse || fetchPromise;
            });
        })
    );
});

// Handle push notifications (future feature)
self.addEventListener('push', (event) => {
    if (event.data) {
        const data = event.data.json();
        
        const options = {
            body: data.body || 'A soul is resonating with you...',
            icon: '/assets/icons/icon-192.png',
            badge: '/assets/icons/icon-72.png',
            vibrate: [100, 50, 100],
            data: {
                url: data.url || '/'
            }
        };
        
        event.waitUntil(
            self.registration.showNotification(data.title || 'HYPNO', options)
        );
    }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((clientList) => {
                // Focus existing window if available
                for (const client of clientList) {
                    if (client.url === event.notification.data.url && 'focus' in client) {
                        return client.focus();
                    }
                }
                // Otherwise open new window
                if (clients.openWindow) {
                    return clients.openWindow(event.notification.data.url);
                }
            })
    );
});

console.log('🌌 Service Worker: Script loaded');
