/* ONYX service worker v2: network-first навигация, cache-first статика с фоновым обновлением.
   Обновление применяется только по явному согласию пользователя (тост «Доступна новая версия»). */
const C = 'onyx-v13';
const BASE = new URL(self.registration.scope);
const u = p => new URL(p, BASE).href;
const CORE = [u('./'), u('./index.html'), u('./manifest.webmanifest'), u('./favicon.svg'),
  u('./icon-192.png'), u('./icon-512.png'), u('./icon-maskable-512.png'), u('./apple-touch-icon.png'), u('./nbrb.ttf')];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(C)
      .then(c => Promise.allSettled(CORE.map(url => c.add(url))))
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== C).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function staleWhileRevalidate(req) {
  return caches.open(C).then(async c => {
    const hit = await c.match(req);
    const fetchPromise = fetch(req).then(res => {
      if (res && res.ok) c.put(req, res.clone());
      return res;
    }).catch(() => hit);
    return hit || fetchPromise;
  });
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).catch(() => caches.match(u('./index.html')).then(r => r || Response.error()))
    );
    return;
  }
  e.respondWith(staleWhileRevalidate(req));
});

self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});
