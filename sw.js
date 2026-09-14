// CRITICAL: Must be strictly synchronized with storage/keys.js
const IDB_NAME = 'onyx-finance';
const IDB_STORE = 'kv';

/* ONYX service worker v48: РЅР°РІРёРіР°С†РёСЏ РѕС‚РґР°С‘С‚СЃСЏ РёР· РєСЌС€Р° РњР“РќРћР’Р•РќРќРћ (cache-first) СЃ С„РѕРЅРѕРІРѕР№
   СЂРµРІР°Р»РёРґР°С†РёРµР№ РїРѕ СЃРµС‚Рё вЂ” РѕС‚РєСЂС‹С‚РёРµ СЃР°Р№С‚Р° РІ Р±СЂР°СѓР·РµСЂРµ Р±РѕР»СЊС€Рµ РЅРµ Р¶РґС‘С‚ РѕС‚РІРµС‚ СЃРµСЂРІРµСЂР° Рё РѕС‰СѓС‰Р°РµС‚СЃСЏ
   РєР°Рє Р·Р°РїСѓСЃРє СѓСЃС‚Р°РЅРѕРІР»РµРЅРЅРѕРіРѕ РїСЂРёР»РѕР¶РµРЅРёСЏ. РЎС‚Р°С‚РёРєР° вЂ” cache-first СЃ С„РѕРЅРѕРІС‹Рј РѕР±РЅРѕРІР»РµРЅРёРµРј.
   РџРѕРґРґРµСЂР¶РєР° С„РѕРЅРѕРІС‹С… СЃРёСЃС‚РµРјРЅС‹С… РЅР°РїРѕРјРёРЅР°РЅРёР№ С‡РµСЂРµР· Periodic Background Sync Рё Web Notifications. */
const SW_VERSION = 'v58';
const CACHE_PREFIX = 'onyx-v58-';
let currentCacheName = null;
async function getCache() {
  if (!currentCacheName) {
    const ks = await caches.keys();
    currentCacheName = ks.find(k => k.startsWith(CACHE_PREFIX)) || (CACHE_PREFIX + 'app');
  }
  return caches.open(currentCacheName);
}
const BASE = new URL(self.registration.scope);
const u = p => new URL(p, BASE).href;
/* CORE — precache при install: вся оболочка приложения (HTML, CSS, единственный шрифт TTF, SVG рубля и все JS-модули). */
const CORE = [
  u('./'), u('./index.html'), u('./manifest.webmanifest'), u('./favicon.svg'),
  u('./icon-192.png'), u('./icon-512.png'), u('./icon-maskable-512.png'), u('./apple-touch-icon.png'),
  /* fonts (единственный шрифт) + знак рубля */
  u('./fonts/SF%20Pro%20Rounded.ttf'), u('./icons/belarus-ruble.svg'),
  /* css */
  u('./css/tokens.css?v=53'), u('./css/base.css?v=53'), u('./css/layout.css?v=53'), u('./css/components.css?v=53'),
  u('./css/ledger.css?v=53'), u('./css/sheets.css?v=53'), u('./css/stats.css?v=53'), u('./css/screens.css?v=53'),
  /* js: utils + domain (базовые слои) */
  u('./domain/icons-data.js'),
  u('./utils.js'),
  u('./domain/currency.js'), u('./domain/periods.js'), u('./domain/cache.js'), u('./app/i18n.js'),
  /* js: storage */
  u('./storage/keys.js'), u('./storage/safe.js'), u('./storage/state.js'), u('./storage/store.js'),
  u('./storage/mutations.js'), u('./storage/schema.js'), u('./storage/index.js'),
  /* js: domain */
  u('./domain/factories.js'), u('./domain/entities.js'), u('./domain/calculations.js'), u('./domain/index.js'),
  /* js: screens */
  u('./app/lockpad.js'),
  u('./smart/ai.js'), u('./smart/insights.js'),
  /* js: screens/home */
  u('./screens/home/home-state.js'), u('./screens/home/ledger-model.js'), u('./screens/home/transaction-row.js'),
  u('./screens/home/period-picker.js'), u('./screens/home/ledger.js'), u('./screens/home/analytics.js'),
  u('./screens/home/insights-overlay.js'), u('./screens/home/goals.js'), u('./screens/home/index.js'),
  /* js: screens/smart */
  u('./screens/smart/smart-state.js'), u('./screens/smart/smart-model.js'), u('./screens/smart/smart-features.js'),
  u('./screens/smart/advisor-view.js'), u('./screens/smart/health-view.js'), u('./screens/smart/index.js'),
  u('./screens/editor.js'), u('./screens/accounts.js'),
  u('./screens/categories.js'), u('./screens/goals.js'), u('./screens/search.js'), u('./screens/settings.js'),
  u('./screens/lock.js'), u('./screens/index.js'),
  /* js: app (core вЂ” Р±С‹РІС€РёР№ inline-СЃРєСЂРёРїС‚ index.html) */
  u('./app/core.js'),
  u('./app/events.js'), u('./app/viewport.js'), u('./app/reminders.js'), u('./app/recurring.js'),
  u('./app/deeplinks.js'), u('./app/pwa.js'), u('./app/net-status.js'), u('./app/boot.js')
];

self.addEventListener('install', e => {
  if (self.skipWaiting) self.skipWaiting();
  e.waitUntil((async () => {
    let h = 2166136261;
    const items = await Promise.allSettled(CORE.map(async url => {
      const res = await fetch(url, { cache: 'reload' });
      if (!res.ok) throw new Error('Fetch failed: ' + url);
      const clone = res.clone();
      const buf = await res.arrayBuffer();
      const bytes = new Uint8Array(buf);
      for (let i = 0; i < bytes.length; i++) {
        h = (h + bytes[i]) & 0xffffffff;
      }
      for (let i = 0; i < url.length; i++) {
        h = (h + url.charCodeAt(i)) & 0xffffffff;
      }
      return { url, clone };
    }));
    currentCacheName = CACHE_PREFIX + (h >>> 0).toString(36);
    const cache = await caches.open(currentCacheName);
    await Promise.allSettled(items.filter(r => r.status === 'fulfilled').map(r => cache.put(r.value.url, r.value.clone)));
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    if (!currentCacheName) await getCache();
    const ks = await caches.keys();
    await Promise.all(ks.filter(k => k.startsWith('onyx-') && k !== currentCacheName).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

function staleWhileRevalidate(req) {
  return getCache().then(async c => {
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
      const cache = await getCache();
      /* РјРіРЅРѕРІРµРЅРЅС‹Р№ РѕС‚РІРµС‚ РёР· РєСЌС€Р° (Р»СЋР±РѕР№ РёР· РґРІСѓС… РєР»СЋС‡РµР№), СЃРµС‚СЊ РѕР±РЅРѕРІР»СЏРµС‚ РєРѕРїРёСЋ РІ С„РѕРЅРµ */
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
  if (e.data.type === 'DEBUG_REMINDER') {
    e.waitUntil((async () => {
      const scenario = e.data.scenario;
      let mockState = null;
      let mockPermission = 'granted';
      let mockOpts = {};

      if (scenario === 'no_permission') {
        mockState = { settings: { reminder: { enabled: true, time: '00:00' }, currency: 'BYN' } };
        mockPermission = 'denied';
      } else if (scenario === 'no_data') {
        mockState = null;
        mockPermission = 'granted';
      } else if (scenario === 'disabled') {
        mockState = { settings: { reminder: { enabled: false, time: '00:00' }, currency: 'BYN' } };
        mockPermission = 'granted';
      } else if (scenario === 'too_early') {
        mockState = { settings: { reminder: { enabled: true, time: '23:59' }, currency: 'BYN' } };
        mockPermission = 'granted';
        mockOpts = { now: new Date('2026-01-01T12:00:00') };
      } else if (scenario === 'already_sent') {
        mockState = { settings: { reminder: { enabled: true, time: '00:00' }, currency: 'BYN' } };
        mockPermission = 'granted';
        mockOpts = { alreadySent: true };
      } else {
        // scenario === 'ok'
        mockState = {
          settings: { reminder: { enabled: true, time: '00:00' }, currency: 'BYN' },
          transactions: []
        };
        mockPermission = 'granted';
        mockOpts = { force: true };
      }

      const decision = decideReminder(mockState, mockPermission, mockOpts);
      const hadData = !!(mockState && mockState.settings);
      const record = await logReminder(decision, hadData, mockPermission);

      const responsePayload = {
        type: 'DEBUG_REMINDER_RESULT',
        scenario,
        decision,
        record
      };

      if (e.source && typeof e.source.postMessage === 'function') {
        e.source.postMessage(responsePayload);
      } else {
        const windowClients = await self.clients.matchAll({ type: 'window' });
        for (const client of windowClients) {
          client.postMessage(responsePayload);
        }
      }
    })());
  }
});

/* в•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђ С„РѕРЅРѕРІС‹Рµ РЅР°РїРѕРјРёРЅР°РЅРёСЏ PWA в•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђ */
const IDB_STATE_KEY = 'state';
const DEBUG_REMINDER_KEY = 'debug:reminder-last';

const REMINDER_SKIP = Object.freeze({
  NO_PERMISSION: 'NO_PERMISSION',
  NO_DATA: 'NO_DATA',
  DISABLED: 'DISABLED',
  TOO_EARLY: 'TOO_EARLY',
  ALREADY_SENT: 'ALREADY_SENT'
});

function getStoredState() {
  return new Promise(resolve => {
    try {
      if (!self.indexedDB) return resolve(null);
      const rq = indexedDB.open(IDB_NAME, 1);
      rq.onsuccess = () => {
        const db = rq.result;
        try {
          const tx = db.transaction(IDB_STORE, 'readonly');
          const getReq = tx.objectStore(IDB_STORE).get(IDB_STATE_KEY);
          getReq.onsuccess = () => resolve(getReq.result || null);
          getReq.onerror = () => resolve(null);
        } catch {
          resolve(null);
        }
      };
      rq.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

function setStoredDebugReminder(record) {
  return new Promise(resolve => {
    try {
      if (!self.indexedDB) return resolve(false);
      const rq = indexedDB.open(IDB_NAME, 1);
      rq.onsuccess = () => {
        const db = rq.result;
        try {
          const tx = db.transaction(IDB_STORE, 'readwrite');
          const putReq = tx.objectStore(IDB_STORE).put(record, DEBUG_REMINDER_KEY);
          putReq.onsuccess = () => resolve(true);
          putReq.onerror = () => resolve(false);
        } catch {
          resolve(false);
        }
      };
      rq.onerror = () => resolve(false);
    } catch {
      resolve(false);
    }
  });
}

async function logReminder(reason, hadData, permission) {
  if (reason === 'SEND') {
    console.info('[ONYX-SW][REMINDER] SEND: notification dispatched');
  } else {
    console.warn('[ONYX-SW][REMINDER] SKIP: ' + reason);
  }
  const record = {
    reason,
    ts: Date.now(),
    hadData: !!hadData,
    permission: permission || 'unknown'
  };
  await setStoredDebugReminder(record);
  return record;
}

/**
 * Р§РёСЃС‚Р°СЏ С„СѓРЅРєС†РёСЏ РїСЂРёРЅСЏС‚РёСЏ СЂРµС€РµРЅРёСЏ Рѕ РїРѕРєР°Р·Рµ РЅР°РїРѕРјРёРЅР°РЅРёСЏ.
 * РќРµ РёРјРµРµС‚ РїРѕР±РѕС‡РЅС‹С… СЌС„С„РµРєС‚РѕРІ: РЅРµ РѕР±СЂР°С‰Р°РµС‚СЃСЏ Рє DOM, IDB РёР»Рё Notification API.
 *
 * @param {object|null} state - РЎРѕСЃС‚РѕСЏРЅРёРµ РїСЂРёР»РѕР¶РµРЅРёСЏ РёР· IndexedDB
 * @param {string} permission - РЎС‚Р°С‚СѓСЃ СЂР°Р·СЂРµС€РµРЅРёСЏ СѓРІРµРґРѕРјР»РµРЅРёР№ ('granted' | 'denied' | 'default')
 * @param {object} [opts={}] - РћРїС†РёРё РїСЂРѕРІРµСЂРєРё
 * @param {boolean} [opts.force=false] - РџСЂРёРЅСѓРґРёС‚РµР»СЊРЅС‹Р№ РїРѕРєР°Р·
 * @param {Date} [opts.now=new Date()] - РўРµРєСѓС‰РµРµ РІСЂРµРјСЏ
 * @param {boolean} [opts.alreadySent=false] - Р‘С‹Р»Рѕ Р»Рё СѓР¶Рµ РѕС‚РїСЂР°РІР»РµРЅРѕ СЃРµРіРѕРґРЅСЏ
 * @returns {string} РљРѕРґ РїСЂРёС‡РёРЅС‹ РїСЂРѕРїСѓСЃРєР° РёР· REMINDER_SKIP РёР»Рё 'SEND'
 */
function decideReminder(state, permission, opts = {}) {
  if (permission !== 'granted') {
    return REMINDER_SKIP.NO_PERMISSION;
  }
  if (!state || !state.settings) {
    return REMINDER_SKIP.NO_DATA;
  }
  const rem = state.settings.reminder;
  if (!rem || !rem.enabled) {
    return REMINDER_SKIP.DISABLED;
  }
  const { force = false, now = new Date(), alreadySent = false } = opts;
  if (alreadySent && !force) {
    return REMINDER_SKIP.ALREADY_SENT;
  }
  if (!force && rem.time) {
    const curHM = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
    if (curHM < rem.time) {
      return REMINDER_SKIP.TOO_EARLY;
    }
  }
  return 'SEND';
}

if (typeof self !== 'undefined') {
  self.REMINDER_SKIP = REMINDER_SKIP;
  self.decideReminder = decideReminder;
}

async function checkAndSendReminder(force) {
  const permission = (self.Notification && self.Notification.permission) || 'default';
  const state = await getStoredState();
  const hadData = !!(state && state.settings);

  const now = new Date();
  const todayKey = now.toISOString().slice(0, 10);
  const cache = await getCache();
  const sentKey = u('./.rem-sent-' + todayKey);
  const alreadySent = !!(await cache.match(sentKey));

  const decision = decideReminder(state, permission, { force: !!force, now, alreadySent });
  if (decision !== 'SEND') {
    await logReminder(decision, hadData, permission);
    return decision;
  }

  await cache.put(sentKey, new Response('1'));
  await logReminder('SEND', hadData, permission);

  let spent = 0;
  const cur = (state && state.settings && state.settings.currency) || 'BYN';
  if (state && Array.isArray(state.transactions)) {
    for (const t of state.transactions) {
      if (t.type === 'expense' && String(t.date || '').slice(0, 10) === todayKey) {
        spent += Number(t.amount) || 0;
      }
    }
  }

  const title = 'Onyx';
  const body = spent > 0
    ? 'РЎРµРіРѕРґРЅСЏ РїРѕС‚СЂР°С‡РµРЅРѕ ' + Math.round(spent) + ' ' + cur + '. Р’СЃС‘ РІРЅРµСЃР»Рё?'
    : 'РЎРµРіРѕРґРЅСЏ С‚СЂР°С‚ РЅРµ Р·Р°РїРёСЃР°РЅРѕ. Р’СЃС‘ РІРµСЂРЅРѕ?';

  await self.registration.showNotification(title, {
    body,
    icon: u('./icon-192.png'),
    badge: u('./favicon.svg'),
    tag: 'onyx-daily-reminder',
    renotify: true,
    data: { date: todayKey, url: u('./') },
    actions: [
      { action: 'add', title: 'Р’РЅРµСЃС‚Рё' },
      { action: 'open', title: 'РћС‚РєСЂС‹С‚СЊ' }
    ]
  });

  return 'SEND';
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
