/* app/pwa.js */
"use strict";
/* PWA-слой: динамические иконки, beforeinstallprompt/appinstalled, регистрация service worker
   (путь './sw.js' не изменён, регистрация выполняется один раз), онлайн/офлайн-тосты.
   Перенесено из inline-скрипта index.html байт-в-байт. */
const APP_ICON = size => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="' + size + '" height="' + size + '">' +
  '<defs><linearGradient id="a" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#17171b"/><stop offset="1" stop-color="#050507"/></linearGradient>' +
  '<linearGradient id="b" x1="0" y1="0" x2=".8" y2="1"><stop offset="0" stop-color="#ffffff" stop-opacity=".95"/><stop offset=".5" stop-color="#8e8e97" stop-opacity=".7"/><stop offset="1" stop-color="#ffffff" stop-opacity=".9"/></linearGradient></defs>' +
  '<rect width="512" height="512" rx="112" fill="url(#a)"/>' +
  '<path d="M96 232c0-58 46-92 128-80s112 30 176 14 32 96-12 132-108 60-176 46S96 290 96 232Z" fill="url(#b)" opacity=".9"/>' +
  '<path d="M104 246c0-52 44-84 122-72s110 28 172 13" stroke="#fff" stroke-opacity=".5" stroke-width="7" fill="none"/></svg>';
const dataURI = s => 'data:image/svg+xml,' + encodeURIComponent(s);
(function pwa() {
  /* icons */
  const l1 = document.createElement('link'); l1.rel = 'icon'; l1.type = 'image/svg+xml'; l1.href = dataURI(APP_ICON(64)); document.head.appendChild(l1);
  const l2 = document.createElement('link'); l2.rel = 'apple-touch-icon'; l2.sizes = '180x180'; l2.href = dataURI(APP_ICON(180)); document.head.appendChild(l2);
  /* установка как приложение (PWA): Chrome/Android сами дают сигнал beforeinstallprompt —
     показываем тост с кнопкой; на iOS установка делается вручную: Поделиться → «На экран "Домой"». */
  let installEvt = null;
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault(); installEvt = e;
    toast('Установить ONYX как приложение?', { label: 'Установить', fn: () => { const p = installEvt; installEvt = null; if (p) p.prompt(); } }, { icon: 'download' });
  });
  window.addEventListener('appinstalled', () => { installEvt = null; toast('ONYX установлен — ищи на главном экране', null, { icon: 'check' }); });
  /* service worker: versioned cache, cache-first навигация с фоновой ревалидацией */
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => { if (refreshing) return; refreshing = true; location.reload(); });
    const onWaiting = w => { toast('Доступна новая версия', { label: 'Обновить', fn: () => w.postMessage({ type: 'SKIP_WAITING' }) }); };
    navigator.serviceWorker.register('./sw.js').then(reg => {
      if (reg.waiting) onWaiting(reg.waiting);
      reg.addEventListener('updatefound', () => {
        const w = reg.installing;
        if (w) w.addEventListener('statechange', () => { if (w.state === 'installed' && navigator.serviceWorker.controller) onWaiting(w); });
      });
      navigator.serviceWorker.addEventListener('message', e => { if (e.data && e.data.type === 'NEW_VERSION') onWaiting(reg.waiting); });
    }).catch(() => {});
    window.addEventListener('load', () => {
      window.addEventListener('online', () => toast('Снова в сети'));
      window.addEventListener('offline', () => toast('Нет соединения — работаем офлайн', null, { icon: 'wifi-off' }));
    });
  }
})();
window.App = window.App || {};
App.pwa = { APP_ICON: APP_ICON, dataURI: dataURI };
