/* app/boot.js */
"use strict";
/* Точка входа приложения. Перенесено из inline-скрипта index.html байт-в-байт:
   PERF-губернатор, boot() и вызов boot() в конце (все зависимости уже определены —
   файл подключается последним, как раньше завершался inline-скрипт). */

/* PERF-губернатор: слабый телефон сам сообщает о лагах. Меряем реальные кадры в первые
   секунды работы; если много кадров длиннее 40 мс — включаем лайт-режим (data-perf="low"):
   анимации становятся мгновенными, UI перестаёт дёргаться. Оценка на каждую сессию заново. */
(function perfGovernor() {
  try {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let frames = 0, janky = 0, prev = 0, t0 = 0;
    const tick = now => {
      if (prev) { frames++; if (now - prev > 40) janky++; }
      prev = now;
      if (now - t0 < 5000) requestAnimationFrame(tick);
      else if (frames > 50 && janky / frames > .4) {
        document.documentElement.setAttribute('data-perf', 'low');
      }
    };
    setTimeout(() => { t0 = performance.now(); requestAnimationFrame(tick); }, 2000);
  } catch (e) {}
})();

async function boot() {
  subscribe(() => { if (!nav.length && !sheetStack.length) render(true); });
  await load();
  ensureSysAccounts();
  runTemplates();
  render();
  icons();
  history.replaceState({ depth: 0 }, '');
  const start = () => { handleHash(); };
  if (S.settings.pin) { $('#phone').style.visibility = 'hidden'; showLock(() => { $('#phone').style.visibility = ''; start(); }); }
  else start();
  const sp = $('#splash');
  setTimeout(() => { sp.classList.add('gone'); setTimeout(() => sp.remove(), 700); }, 480);
}
if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => setTimeout(icons, 20));

window.App = window.App || {};
App.boot = { start: boot };

boot();
