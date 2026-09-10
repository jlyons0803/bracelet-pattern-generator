const CACHE='dandelyons-designs-v85-visible-image-upload';
const ASSETS=[
  './','./index.html','./styles.css?v=85','./data.js?v=85','./core.js?v=85',
  './calculator.js?v=85','./beads.js?v=85','./projects.js?v=85','./export.js?v=85','./app.js?v=85',
  './manifest.webmanifest','./icon-192.png','./icon-512.png','./apple-touch-icon.png'
];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)))});
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>e.respondWith(fetch(e.request,{cache:'no-store'}).then(r=>{const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));return r;}).catch(()=>caches.match(e.request))));
