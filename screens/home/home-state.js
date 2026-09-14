/* global round2 */
"use strict";

/* screens/home/home-state.js — UI-состояние экрана Home, токены анимации и кэши Ledger. */
var lastHeroBal = null, lastHeroCur = null;
/* PERF: токен поколения — если render() успел выполниться ещё раз, предыдущая цепочка
   requestAnimationFrame останавливается. Раньше при быстрых правках одновременно крутились
   несколько анимаций, каждая из которых 33 кадра писала textContent в уже откреплённый узел. */
var heroAnimToken = 0;

function animateNumber(el, from, to, cur) {
  const t0 = performance.now(), dur = 550;
  const ease = t => 1 - Math.pow(1 - t, 3);
  const numEl = el.querySelector('#heroNum');
  const isBYN = (cur || S.settings.currency) === 'BYN';
  const myToken = ++heroAnimToken;
  function step(now) {
    if (myToken !== heroAnimToken) return; /* устаревшая анимация — выходим */
    const t = Math.min(1, (now - t0) / dur);
    const val = from + (to - from) * ease(t);
    const exact = !S.settings.roundTotals;
    let n = exact ? round2(val) : Math.round(val);
    if (!isFinite(n)) n = 0;
    const dec = exact ? (Number.isInteger(n) ? 0 : 2) : 0;
    const numStr = (n < 0 ? '−' : '') + nf(Math.abs(n), dec);
    if (numEl) numEl.textContent = numStr;
    else el.textContent = numStr + (isBYN ? '\u00A0' : ' ') + (CUR[cur] ? (CUR[cur].html ? '' : CUR[cur].s) : cur);
    if (t < 1) requestAnimationFrame(step);
    else if (numEl) {
      const finalN = exact ? round2(to) : Math.round(to);
      const fd = exact ? (Number.isInteger(finalN) ? 0 : 2) : 0;
      numEl.textContent = (finalN < 0 ? '−' : '') + nf(Math.abs(finalN), fd);
    }
  }
  requestAnimationFrame(step);
}

/* PERF: кэш подготовленной модели ledger: фильтрация по счёту/периоду/дню, потоки
   income/expense, валюта и баланс. Ключ кэша — ссылка на отсортированный массив
   (меняется ТОЛЬКО после save(), то есть при реальном изменении данных), плюс
   UI.accId и границы периода/день. Открытие модалок, скролл, лимит «Показать ещё»
   и прочие UI-флаги ключ не меняют — модель при них не пересчитывается. */
var _ledgerModel = null;
var _ledgerGroups = null;
var _rowCache = { src: null, hide: null, map: new Map() };

function invalidateLedgerCache() {
  _ledgerModel = null;
  _ledgerGroups = null;
  if (typeof _rowCache !== 'undefined' && _rowCache) {
    _rowCache.src = null;
    if (_rowCache.map && _rowCache.map.clear) _rowCache.map.clear();
  }
}

if (typeof window !== 'undefined') {
  window.animateNumber = animateNumber;
  window.invalidateLedgerCache = invalidateLedgerCache;
}
