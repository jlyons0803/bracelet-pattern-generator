const CACHE='dandelyons-designs-v81-fullscreen-button-position';
const ASSETS=[
  './','./index.html','./styles.css?v=81','./data.js?v=81','./core.js?v=81',
  './calculator.js?v=81','./beads.js?v=81','./projects.js?v=81','./export.js?v=81','./app.js?v=81',
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
