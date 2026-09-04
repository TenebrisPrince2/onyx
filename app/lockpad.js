/* app/lockpad.js — переиспользуемый компонент код-пароля (dots + цифровая клавиатура).
   До Этапа 2 разметка и логика дублировались в screens/lock.js и screens/settings.js (setupPin).
   CSS: .dots/.lockpad/.bad — без изменений, рендерится внутрь props.host. */
"use strict";
/**
 * @param {{
 *   host: Element,                              // контейнер: сюда рендерятся .dots и .lockpad
 *   length?: number,                            // длина кода, по умолчанию 4
 *   onComplete?: (code: string) => void,        // набран полный код
 *   onInput?: (code: string) => void            // ввод изменился (для «Повторите код» и т.п.)
 * }} props
 * @returns {{ code: () => string, reset: () => void, fail: () => void, el: Element }}
 * fail() — тряска + haptic + сброс (внешняя проверка кода оказалась неверной).
 */
function createLockpad(props) {
  const len = props.length || 4;
  const host = props.host;
  host.innerHTML =
    '<div class="dots">' + Array.from({ length: len }, () => '<i></i>').join('') + '</div>' +
    '<div class="lockpad">' + [1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => '<button data-n="' + n + '">' + n + '</button>').join('') +
    '<button class="plain"></button><button data-n="0">0</button><button class="plain" data-bs="1"><i data-lucide="delete" class="ic ic-l"></i></button></div>';
  icons(host);
  let cur = '';
  const dots = host.querySelectorAll('.dots i');
  const paint = () => dots.forEach((d, i) => { d.dataset.on = i < cur.length ? '1' : ''; });
  const api = {
    el: host,
    code: () => cur,
    reset() { cur = ''; paint(); },
    fail() {
      haptic(40);
      host.classList.add('bad');
      setTimeout(() => host.classList.remove('bad'), 420);
      api.reset();
    }
  };
  host.querySelectorAll('.lockpad button').forEach(b => b.onclick = () => {
    haptic(6);
    if (b.dataset.bs) { cur = cur.slice(0, -1); paint(); if (props.onInput) props.onInput(cur); return; }
    if (!b.dataset.n || cur.length >= len) return;
    cur += b.dataset.n;
    paint();
    if (props.onInput) props.onInput(cur);
    if (cur.length === len) setTimeout(() => { if (props.onComplete) props.onComplete(cur); }, 140);
  });
  return api;
}