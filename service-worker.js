
const CACHE = 'speed-avaliacao-v10';
const ASSETS=[
  './','index.html','manifest.json','css/styles.css','js/database.js','js/pdf.js','js/app.js',
  'assets/logo.png','assets/icons/icon-192.png','assets/icons/icon-512.png',
  'https://cdn.jsdelivr.net/npm/jspdf@2.5.2/dist/jspdf.umd.min.js'
];
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      return fetch(event.request)
        .then(response => {
          if (response && (response.ok || response.type === 'opaque')) {
            const copy = response.clone();
            caches.open(CACHE).then(cache => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(async () => {
          // Só devolve o app shell para navegação. Chamadas de API devem falhar
          // normalmente para o app conseguir exibir a mensagem de indisponibilidade.
          if (event.request.mode === 'navigate') {
            return (await caches.match('./index.html')) || (await caches.match('./'));
          }
          throw new Error('Recurso indisponível offline');
        });
    })
  );
});
