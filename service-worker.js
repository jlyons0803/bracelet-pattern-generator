const CACHE='dandelyons-designs-v89-color-image-graph';
const ASSETS=['./','./index.html','./styles.css?v=89','./data.js?v=89','./core.js?v=89','./calculator.js?v=89','./beads.js?v=89','./projects.js?v=89','./export.js?v=89','./app.js?v=89','./manifest.webmanifest','./icon-192.png','./icon-512.png','./apple-touch-icon.png'];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)))});
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>e.respondWith(fetch(e.request,{cache:'no-store'}).then(r=>{const copy=r.clone(); caches.open(CACHE).then(c=>c.put(e.request,copy)); return r;}).catch(()=>caches.match(e.request))));
