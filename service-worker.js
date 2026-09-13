
const CACHE='speed-avaliacao-v7';
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
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET') return;
  event.respondWith(
    caches.match(event.request).then(cached=>cached||fetch(event.request).then(res=>{
      const copy=res.clone(); caches.open(CACHE).then(c=>c.put(event.request,copy)); return res;
    }).catch(()=>caches.match('./index.html')))
  );
});
