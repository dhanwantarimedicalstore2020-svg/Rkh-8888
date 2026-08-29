// RKH 8888 Service Worker - Offline & PWA Caching Engine
const CACHE_VERSION = 'rkh8888-v1.0.0';
const STATIC_CACHE_NAME = `static-${CACHE_VERSION}`;
const DYNAMIC_CACHE_NAME = `dynamic-${CACHE_VERSION}`;

// Core application shell assets to pre-cache on install
const PRECACHE_ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './favicon.svg',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-192.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png'
];

// Install Event: Cache Core App Shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[SW] Pre-caching non-fatal warning:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate Event: Purge Previous Cache Versions & Claim Clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name.startsWith('rkh8888-') || name.startsWith('static-') || name.startsWith('dynamic-'))
          .filter((name) => name !== STATIC_CACHE_NAME && name !== DYNAMIC_CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event: Safe Network-First for Navigation, Cache-First/Stale-While-Revalidate for Static Assets
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only handle HTTP/HTTPS GET requests
  if (request.method !== 'GET' || !request.url.startsWith('http')) {
    return;
  }

  const url = new URL(request.url);

  // 1. Navigation Requests (HTML Pages / Cold Start)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(DYNAMIC_CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          // Offline fallback: match navigation request or return cached index.html
          const cachedResponse = await caches.match(request);
          if (cachedResponse) return cachedResponse;

          const cachedIndex = await caches.match('./index.html') || await caches.match('/');
          if (cachedIndex) return cachedIndex;

          return new Response('RKH 8888 is operating in offline mode. Please reload once cached.', {
            headers: { 'Content-Type': 'text/html' }
          });
        })
    );
    return;
  }

  // 2. Static Assets (JS, CSS, Fonts, Images, Icons)
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        // Return from cache, and refresh cache in background if online (Stale-While-Revalidate)
        fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
              const responseClone = networkResponse.clone();
              caches.open(DYNAMIC_CACHE_NAME).then((cache) => {
                cache.put(request, responseClone);
              });
            }
          })
          .catch(() => {
            // Offline - ignore background refresh failure
          });

        return cachedResponse;
      }

      // If not in cache, fetch from network and cache for subsequent offline sessions
      return fetch(request)
        .then((networkResponse) => {
          if (
            networkResponse &&
            networkResponse.status === 200 &&
            (networkResponse.type === 'basic' || networkResponse.type === 'cors')
          ) {
            const responseClone = networkResponse.clone();
            caches.open(DYNAMIC_CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Non-critical asset fetch failed while offline
          return new Response('', { status: 408, statusText: 'Offline Resource Unavailable' });
        });
    })
  );
});
