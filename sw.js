const CACHE_NAME = 'photon-pwa-v1';
const APP_SHELL_URLS = [
  '/',
  '/index.html',
  '/manifest.json'
];

// On install, cache the core application shell files.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Opened cache and caching app shell');
      return cache.addAll(APP_SHELL_URLS);
    })
  );
});

// On activate, clean up any old caches.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// On fetch, serve from cache first, falling back to the network.
// Cache new successful GET requests for offline use.
self.addEventListener('fetch', (event) => {
  // Ignore non-GET requests (e.g., POST requests to the Gemini API)
  if (event.request.method !== 'GET') {
    return;
  }
  
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // If the resource is in the cache, return it
      if (cachedResponse) {
        return cachedResponse;
      }

      // Otherwise, fetch from the network
      return fetch(event.request).then((networkResponse) => {
        // Clone the response stream because we need to use it twice
        const responseToCache = networkResponse.clone();

        caches.open(CACHE_NAME).then((cache) => {
          // Cache the new resource for future use
          // We cache opaque responses (from third-party CDNs) as well
          if (networkResponse.ok || networkResponse.type === 'opaque') {
            cache.put(event.request, responseToCache);
          }
        });

        return networkResponse;
      }).catch(error => {
          console.error("Fetch failed; user is likely offline.", error);
          // Optional: Return a fallback offline page here if one exists
      });
    })
  );
});
