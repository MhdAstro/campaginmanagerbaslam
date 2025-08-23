// Selective Service Worker for Basalam Vendor Portal
const CACHE_NAME = 'basalam-vendor-portal-v3';

// Only cache static assets that rarely change
const STATIC_CACHE_URLS = [
  '/static/style.css',
  '/static/vendor-ui.js',
  '/static/persian-datepicker.js'
];

// URLs that should NEVER be cached (dynamic content)
const NO_CACHE_URLS = [
  '/api/',
  '/admin/',
  '/auth/',
  '/login',
  '/logout'
];

// Install - only cache essential static files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Caching essential static assets');
        return cache.addAll(STATIC_CACHE_URLS);
      })
  );
  // Skip waiting to activate immediately
  self.skipWaiting();
});

// Fetch - intelligent caching strategy
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Never cache API calls or dynamic content
  if (NO_CACHE_URLS.some(path => url.pathname.startsWith(path))) {
    event.respondWith(fetch(event.request));
    return;
  }
  
  // Only cache static assets
  if (url.pathname.startsWith('/static/')) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          // Serve from cache but also update in background
          fetch(event.request).then((fetchResponse) => {
            if (fetchResponse.status === 200) {
              const responseClone = fetchResponse.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, responseClone);
              });
            }
          }).catch(() => {}); // Ignore network errors
          return cachedResponse;
        }
        
        // Not in cache, fetch and cache
        return fetch(event.request).then((fetchResponse) => {
          if (fetchResponse.status === 200) {
            const responseClone = fetchResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return fetchResponse;
        });
      })
    );
    return;
  }
  
  // For all other requests, just fetch without caching
  event.respondWith(fetch(event.request));
});

// Activate - clean up old caches
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
  
  // Take control immediately
  return self.clients.claim();
});

