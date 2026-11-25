/* Code Club service worker — lets the app install and open faster.
   • The page itself: network first (so updates arrive), cached copy when offline.
   • Libraries/fonts from CDNs (sql.js, Pyodide, jsPDF, Firebase SDK, Google Fonts): cache first.
   • Firebase database traffic is never cached. */
const CACHE = 'codeclub-acca5fb369';
const CDN = /^https:\/\/(cdnjs\.cloudflare\.com|cdn\.jsdelivr\.net|fonts\.googleapis\.com|fonts\.gstatic\.com)\//;
self.addEventListener('install', e => { self.skipWaiting(); e.waitUntil(caches.open(CACHE).then(c => c.addAll(['./', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png']).catch(() => {}))); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = req.url;
  if (CDN.test(url)) {
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => { if (res.ok || res.type === 'opaque') { const cp = res.clone(); caches.open(CACHE).then(c => c.put(req, cp)); } return res; })));
    return;
  }
  if (new URL(url).origin !== location.origin) return;          // Firebase etc. go straight to the network
  e.respondWith(fetch(req).then(res => { if (res.ok) { const cp = res.clone(); caches.open(CACHE).then(c => c.put(req, cp)); } return res; })
    .catch(() => caches.match(req).then(hit => hit || caches.match('./'))));
});
