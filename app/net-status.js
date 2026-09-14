/* app/net-status.js */
"use strict";

/**
 * PWA Network Status Indicator:
 * Отслеживает состояние сети (online/offline) и управляет неблокирующим
 * пилюля-баннером «Нет соединения».
 */
(function () {
  function update(e) {
    const el = document.getElementById('net-status');
    if (!el) return;
    const isOffline = e && e.type === 'offline'
      ? true
      : (e && e.type === 'online'
        ? false
        : (typeof navigator !== 'undefined' && navigator.onLine === false));

    el.classList.toggle('is-offline', isOffline);
    el.setAttribute('aria-hidden', isOffline ? 'false' : 'true');
  }

  window.addEventListener('online', update);
  window.addEventListener('offline', update);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', update);
  } else {
    update();
  }

  window.App = window.App || {};
  window.App.netStatus = { update: update };
})();
