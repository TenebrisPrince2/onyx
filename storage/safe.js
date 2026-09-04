"use strict";
/* storage/safe.js — безопасная обёртка IndexedDB-бэкапа, соединение переиспользуется */
/* Резервная копия в IndexedDB: хранится отдельно от localStorage и переживает его
   очистку браузером/ОС — самая частая причина «пропавших операций» на телефоне. */
/* PERF + FIX: раньше КАЖДОЕ сохранение (debounce 200 мс) вызывало indexedDB.open() заново и
   никогда не закрывало соединение — накапливались живые IDBDatabase и платилось за
   handshake каждый раз (5-20 мс на iOS). Соединение открывается один раз и переиспользуется;
   при закрытии/ошибке/смене версии кэш сбрасывается, следующая попытка откроет заново. */
let _idbP = null;
function idbOpen() {
  if (_idbP) return _idbP;
  _idbP = new Promise(res => {
    try {
      if (!window.indexedDB) return res(null);
      const rq = indexedDB.open(IDB_NAME, 1);
      rq.onupgradeneeded = () => {
        try { if (!rq.result.objectStoreNames.contains(IDB_STORE)) rq.result.createObjectStore(IDB_STORE); } catch (e) {}
      };
      rq.onsuccess = () => {
        const db = rq.result;
        try {
          db.onclose = () => { _idbP = null; };
          db.onversionchange = () => { try { db.close(); } catch (e) {} _idbP = null; };
        } catch (e) {}
        res(db);
      };
      rq.onerror = () => { _idbP = null; res(null); };
      rq.onblocked = () => { _idbP = null; res(null); };
    } catch (e) { _idbP = null; res(null); }
  });
  return _idbP;
}
function idbPut(st) {
  idbOpen().then(db => {
    if (!db) return;
    try {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      tx.objectStore(IDB_STORE).put(st, IDB_STATE_KEY);
    } catch (e) {}
  }).catch(() => {});
}
function idbGet() {
  return idbOpen().then(db => new Promise(res => {
    if (!db) return res(null);
    try {
      const rq = db.transaction(IDB_STORE, 'readonly').objectStore(IDB_STORE).get(IDB_STATE_KEY);
      rq.onsuccess = () => res(rq.result || null);
      rq.onerror = () => res(null);
    } catch (e) { res(null); }
  })).catch(() => null);
}
