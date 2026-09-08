const CACHE='dandelyons-designs-v82-fullscreen-button-style';
const ASSETS=[
  './','./index.html','./styles.css?v=82','./data.js?v=82','./core.js?v=82',
  './calculator.js?v=82','./beads.js?v=82','./projects.js?v=82','./export.js?v=82','./app.js?v=82',
  './manifest.webmanifest','./icon-192.png','./icon-512.png','./apple-touch-icon.png'
];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)))});
self.addEventListener('activate',e=>e.waitUntil(
  caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())
));
self.addEventListener('fetch',e=>e.respondWith(
  fetch(e.request,{cache:'no-store'}).then(r=>{
    const copy=r.clone();
    caches.open(CACHE).then(c=>c.put(e.request,copy));
    return r;
  }).catch(()=>caches.match(e.request))
));
