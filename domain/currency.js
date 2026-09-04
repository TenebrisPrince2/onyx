/* domain/currency.js — валюты и форматирование денег. Вынесено из utils.js (Этап 2);
   зависит от utils (esc, nf? нет: nf здесь), S читается в момент вызова. */
"use strict";

const BYN_SIGN = '<i class="nbrb-icon">BYN</i>';
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
const nf = (n, d) => _nfGet(d).format(n).replace(/,/g, '.');
function money(v, cur, o = {}) {
  cur = cur || S.settings.currency;
  const round = o.exact ? false : S.settings.roundTotals;
  let n = round ? Math.round(v) : Math.round(v * 100) / 100;
  if (typeof n !== 'number' || !isFinite(n)) n = 0;
  const dec = round ? 0 : (Number.isInteger(n) && o.trim !== false ? 0 : 2);
  const c = CUR[cur] || { s: cur, pre: false };
  const num = nf(Math.abs(n), dec);
  const curHtml = c.html ? c.s : esc(c.s);
  const body = c.pre ? curHtml + '\u00A0' + num : num + '\u00A0' + curHtml;
  return (n < 0 ? '−' : '') + body;
}
const amt = (v, cur, o) => '<span class="amt' + (S.settings.hideAmounts ? ' hidden-amt' : '') + '">' + money(v, cur, o) + '</span>';
