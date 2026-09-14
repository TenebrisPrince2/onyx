/* app/reminders.js */
"use strict";
/* Ежедневное напоминание о записи трат с поддержкой фоновых системных уведомлений PWA. */
(function reminders() {
  /* очистка ключей напоминаний старше 7 дней */
  try {
    if (typeof localStorage !== 'undefined') {
      const cut = iso(addD(new Date(), -7));
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i);
        if (k && k.indexOf('onyx.rem.') === 0 && k.slice(9) < cut) localStorage.removeItem(k);
      }
    }
  } catch (e) {}

  async function sendNotification(title, body) {
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      try {
        const reg = await navigator.serviceWorker.ready;
        if (reg && 'showNotification' in reg) {
          await reg.showNotification(title, {
            body,
            icon: './icon-192.png',
            badge: './favicon.svg',
            tag: 'onyx-daily-reminder',
            renotify: true,
            data: { url: './' },
            actions: [
              { action: 'add', title: 'Внести' },
              { action: 'open', title: 'Открыть' }
            ]
          });
          return true;
        }
      } catch (e) {}
    }
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, { body });
        return true;
      } catch (e) {}
    }
    if (typeof toast === 'function') toast(body);
    return false;
  }

  async function registerPeriodicSync() {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
    try {
      const reg = await navigator.serviceWorker.ready;
      if (reg && 'periodicSync' in reg) {
        const status = await navigator.permissions.query({ name: 'periodic-background-sync' }).catch(() => null);
        if (!status || status.state === 'granted') {
          await reg.periodicSync.register('daily-reminder', {
            minInterval: 4 * 60 * 60 * 1000 /* 4 часа */
          });
        }
      }
    } catch (e) {}
  }

  async function syncReminderConfig() {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
    try {
      const reg = await navigator.serviceWorker.ready;
      if (reg && reg.active) {
        reg.active.postMessage({
          type: 'CHECK_REMINDER',
          force: false
        });
      }
    } catch (e) {}
    if (typeof S !== 'undefined' && S && S.settings && S.settings.reminder && S.settings.reminder.enabled) {
      registerPeriodicSync();
    }
  }

  function reminderTick() {
    if (typeof S === 'undefined' || !S || !S.settings) return;
    const r = S.settings.reminder;
    if (!r || !r.enabled) return;
    const now = new Date(), hm = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
    if (hm !== r.time) return;
    const kNow = iso(now);
    const key = 'onyx.rem.' + kNow;
    if (typeof localStorage !== 'undefined' && localStorage.getItem(key)) return;
    if (typeof localStorage !== 'undefined') localStorage.setItem(key, '1');
    const spent = sum(S.transactions.filter(t => t.type === 'expense' && dkey(t) === kNow).map(t => t.amount));
    const msg = spent ? 'Сегодня потрачено ' + money(spent) + '. Всё внесли?' : 'Сегодня трат не записано. Всё верно?';
    sendNotification('Onyx', msg);
  }

  if (typeof window !== 'undefined' && typeof navigator !== 'undefined') {
    setInterval(reminderTick, 30000);
    if (typeof document !== 'undefined') {
      if (document.readyState === 'complete') {
        setTimeout(syncReminderConfig, 1500);
      } else {
        window.addEventListener('load', () => setTimeout(syncReminderConfig, 1500));
      }
    }
  }

  if (typeof window !== 'undefined') {
    window.App = window.App || {};
    window.App.reminders = { tick: reminderTick, sync: syncReminderConfig, sendNotification: sendNotification };
  }
})();
