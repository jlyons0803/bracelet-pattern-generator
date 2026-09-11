const CACHE='dandelyons-designs-v83-clean-header';
const ASSETS=[
  './','./index.html','./styles.css?v=83clean','./data.js?v=83clean','./core.js?v=83clean',
  './calculator.js?v=83clean','./beads.js?v=83clean','./projects.js?v=83clean','./export.js?v=83clean','./app.js?v=83clean',
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
