const CACHE = 'speed-avaliacao-v5';

const ASSETS = [
  './',
  'index.html',
  'manifest.json',
  'css/styles.css',
  'js/database.js',
  'js/pdf.js',
  'js/app.js',
  'assets/logo.png',
  'assets/icons/icon-192.png',
  'assets/icons/icon-512.png',
  'https://cdn.jsdelivr.net/npm/jspdf@2.5.2/dist/jspdf.umd.min.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches
      .keys()
      .then(keys =>
        Promise.all(
          keys
            .filter(key => key !== CACHE)
            .map(key => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) {
        return cached;
      }

      return fetch(event.request)
        .then(response => {
          const copy = response.clone();

          caches.open(CACHE).then(cache => {
            cache.put(event.request, copy);
          });

          return response;
        })
        .catch(() => caches.match('./index.html'));
    })
  );
});
