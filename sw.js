/* ONYX service worker v31: навигация отдаётся из кэша МГНОВЕННО (cache-first) с фоновой
   ревалидацией по сети — открытие сайта в браузере больше не ждёт ответ сервера и ощущается
   как запуск установленного приложения. Статика — cache-first с фоновым обновлением.
   Поддержка фоновых системных напоминаний через Periodic Background Sync и Web Notifications. */
const C = 'onyx-v31';
const BASE = new URL(self.registration.scope);
const u = p => new URL(p, BASE).href;
/* CORE — precache при install: вся оболочка приложения (HTML, CSS, шрифты WOFF2 и все JS-модули).
   TTF-фолбэки шрифтов сюда не включены (экономия ~205 КБ): WOFF2 поддерживают все браузеры с SW. */
const CORE = [
  u('./'), u('./index.html'), u('./manifest.webmanifest'), u('./favicon.svg'),
  u('./icon-192.png'), u('./icon-512.png'), u('./icon-maskable-512.png'), u('./apple-touch-icon.png'),
  /* fonts (WOFF2) */
  u('./fonts/Jellee-Roman.woff2'), u('./fonts/Nunito_ExtraBold.woff2'), u('./fonts/nbrb.woff2'),
  /* css */
  u('./css/tokens.css'), u('./css/base.css'), u('./css/layout.css'), u('./css/components.css'),
  u('./css/ledger.css'), u('./css/sheets.css'), u('./css/stats.css'), u('./css/screens.css'),
  /* js: utils + domain (базовые слои) */
  u('./utils.js'),
  u('./domain/currency.js'), u('./domain/periods.js'), u('./domain/cache.js'), u('./app/i18n.js'),
  /* js: storage */
  u('./storage/keys.js'), u('./storage/safe.js'), u('./storage/state.js'), u('./storage/store.js'),
  u('./storage/mutations.js'), u('./storage/schema.js'), u('./storage/index.js'),
  /* js: domain */
  u('./domain/factories.js'), u('./domain/entities.js'), u('./domain/calculations.js'), u('./domain/index.js'),
  /* js: screens */
  u('./app/lockpad.js'),
  u('./screens/home.js'), u('./screens/smart.js'), u('./screens/editor.js'), u('./screens/accounts.js'),
  u('./screens/categories.js'), u('./screens/goals.js'), u('./screens/search.js'), u('./screens/settings.js'),
  u('./screens/lock.js'), u('./screens/index.js'),
  /* js: app (core — бывший inline-скрипт index.html) */
  u('./app/core.js'),
  u('./app/events.js'), u('./app/viewport.js'), u('./app/reminders.js'), u('./app/recurring.js'),
  u('./app/deeplinks.js'), u('./app/pwa.js'), u('./app/boot.js')
];

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
    e.respondWith((async () => {
      const cache = await caches.open(C);
      /* мгновенный ответ из кэша (любой из двух ключей), сеть обновляет копию в фоне */
      const hit = (await cache.match(u('./index.html'))) || (await cache.match(u('./')));
      const net = fetch(req).then(res => {
        if (res && res.ok) return cache.put(u('./index.html'), res.clone()).then(() => res);
        return res;
      }).catch(() => null);
      e.waitUntil(net);
      return hit || net || Response.error();
    })());
    return;
  }
  e.respondWith(staleWhileRevalidate(req));
});

self.addEventListener('message', e => {
  if (!e.data) return;
  if (e.data.type === 'SKIP_WAITING') self.skipWaiting();
  if (e.data.type === 'CHECK_REMINDER') {
    e.waitUntil(checkAndSendReminder(e.data.force));
  }
});

/* ═══════════════════════════════ фоновые напоминания PWA ═══════════════════════════════ */
function getStoredState() {
  return new Promise(resolve => {
    try {
      if (!self.indexedDB) return resolve(null);
      const rq = indexedDB.open('onyx_db', 1);
      rq.onsuccess = () => {
        const db = rq.result;
        try {
          const tx = db.transaction('onyx_store', 'readonly');
          const getReq = tx.objectStore('onyx_store').get('state');
          getReq.onsuccess = () => resolve(getReq.result || null);
          getReq.onerror = () => resolve(null);
        } catch (_e) {
          resolve(null);
        }
      };
      rq.onerror = () => resolve(null);
    } catch (_e) {
      resolve(null);
    }
  });
}

async function checkAndSendReminder(force) {
  const state = await getStoredState();
  if (!state || !state.settings) return;
  const rem = state.settings.reminder;
  if (!rem || !rem.enabled) return;

  const now = new Date();
  const todayKey = now.toISOString().slice(0, 10);
  const curHM = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');

  if (!force && curHM < rem.time) return;

  const cache = await caches.open(C);
  const sentKey = u('./.rem-sent-' + todayKey);
  const alreadySent = await cache.match(sentKey);
  if (alreadySent && !force) return;

  await cache.put(sentKey, new Response('1'));

  let spent = 0;
  const cur = state.settings.currency || 'BYN';
  if (Array.isArray(state.transactions)) {
    for (const t of state.transactions) {
      if (t.type === 'expense' && String(t.date || '').slice(0, 10) === todayKey) {
        spent += Number(t.amount) || 0;
      }
    }
  }

  const title = 'Onyx';
  const body = spent > 0
    ? 'Сегодня потрачено ' + Math.round(spent) + ' ' + cur + '. Всё внесли?'
    : 'Сегодня трат не записано. Всё верно?';

  await self.registration.showNotification(title, {
    body,
    icon: u('./icon-192.png'),
    badge: u('./favicon.svg'),
    tag: 'onyx-daily-reminder',
    renotify: true,
    data: { date: todayKey, url: u('./') },
    actions: [
      { action: 'add', title: 'Внести' },
      { action: 'open', title: 'Открыть' }
    ]
  });
}

self.addEventListener('periodicsync', e => {
  if (e.tag === 'daily-reminder' || e.tag === 'onyx-reminder') {
    e.waitUntil(checkAndSendReminder(false));
  }
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const act = e.action;
  const targetUrl = u(act === 'add' ? './#add' : './');
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if ('focus' in client) {
          if (act === 'add' && 'navigate' in client) client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(targetUrl);
    })
  );
});
