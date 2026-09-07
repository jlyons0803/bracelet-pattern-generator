const CACHE='dandelyons-designs-v64-revised-from-v62';
const ASSETS=[
  './','./index.html','./styles.css?v=64','./data.js?v=64','./core.js?v=64',
  './calculator.js?v=64','./beads.js?v=64','./projects.js?v=64','./export.js?v=64','./app.js?v=64',
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
