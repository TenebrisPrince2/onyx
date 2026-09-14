/* domain/currency.js — валюты и форматирование денег. Вынесено из utils.js (Этап 2);
   зависит от utils (esc, nf? нет: nf здесь), S читается в момент вызова. */
/* global round2 */
"use strict";

const BYN_PATH = 'M475.61,528.84c0-72.5-62.75-131.27-140.16-131.27H227.58V284.37H426v-49.6H178v269h-63.1v49.7H178V660.17h49.54l107.92-.07c77.36,0,140.11-58.77,140.11-131.26Zm-248-25.1V447.1c35.89,0,72.35.07,107.87.07,50,0,90.56,36.57,90.56,81.67s-40.54,81.67-90.56,81.7l-107.87,0V553.44h112.7v-49.7Z';
const BYN_SVG = '<svg class="byn-icon" xmlns="http://w3.org" viewBox="-10 -10 380.67 466.4" aria-hidden="true"><path d="' + BYN_PATH + '" transform="translate(-114.94 -213.77)" fill="currentColor" stroke="currentColor" stroke-width="10" stroke-linejoin="round"></path></svg>';
const BYN_SIGN = BYN_SVG;
const CUR = {
  BYN: { s: BYN_SIGN, pre: false, html: true }, RUB: { s: '₽', pre: false },
  PLN: { s: 'zł', pre: false }, USD: { s: '$', pre: true }
};
const CUR_ORDER = ['BYN', 'RUB', 'PLN', 'USD'];
/* PERF: раньше Intl.NumberFormat создавался на КАЖДЫЙ вызов (~56 мкс/шт; только на Home
   ~270 вызовов за рендер => 12 мс CPU на десктопе, 40-60 мс на iPhone XR).
   Форматтеры кэшируются по числу знаков (всегда 0 или 2) — вывод .format() идентичен. */
const _nfCache = new Map();
const _nfGet = d => {
  let f = _nfCache.get(d);
  if (!f) { f = new Intl.NumberFormat('ru-RU', { minimumFractionDigits: d, maximumFractionDigits: d }); _nfCache.set(d, f); }
  return f;
};
const nf = (n, d) => _nfGet(d).format(n);
function money(v, cur, o = {}) {
  cur = cur || S.settings.currency;
  const round = o.exact ? false : S.settings.roundTotals;
  let n = round ? Math.round(v) : round2(v);
  if (typeof n !== 'number' || !isFinite(n)) n = 0;
  const dec = round ? 0 : (Number.isInteger(n) && o.trim !== false ? 0 : 2);
  const c = CUR[cur] || { s: cur, pre: false };
  const num = nf(Math.abs(n), dec);
  const curHtml = c.html ? c.s : esc(c.s);
  /* BYN (html/SVG): отступ даёт .byn-icon (margin-left в em) — без nbsp, единый стандарт spacing.
     Текстовые валюты: классический nbsp между числом и знаком. */
  const body = c.html ? num + curHtml : (c.pre ? curHtml + ' ' + num : num + ' ' + curHtml);
  return (n < 0 ? '−' : '') + body;
}
const amt = (v, cur, o) => '<span class="amt' + (S.settings.hideAmounts ? ' hidden-amt' : '') + '">' + money(v, cur, o) + '</span>';
