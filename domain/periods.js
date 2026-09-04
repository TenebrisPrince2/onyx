/* domain/periods.js — календарные периоды: месяцы, дни недели, границы, лейблы.
   Вынесено из utils.js (Этап 2); S.settings.firstDay читается в момент вызова (sow). */
"use strict";

const MON_G = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
const MON_N = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
const MON_S = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
const DOW = ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс'];
const sod = d => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
const som = d => { const x = sod(d); x.setDate(1); return x; };
const sow = d => { const x = sod(d), fd = S.settings.firstDay; x.setDate(x.getDate() - ((x.getDay() - fd + 7) % 7)); return x; };
const addD = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const addM = (d, n) => { const x = som(d); x.setMonth(x.getMonth() + n); return x; };
const iso = d => { const x = new Date(d); return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0'); };
const dkey = t => String((t && t.date) || '').slice(0, 10);
function dayLabel(k) {
  const d = new Date(k + 'T00:00:00');
  if (isNaN(d.getTime())) return String(k || '');
  const t = sod(new Date());
  const diff = Math.round((sod(d) - t) / 864e5);
  if (diff === 0) return 'Сегодня';
  if (diff === -1) return 'Вчера';
  if (diff === 1) return 'Завтра';
  const dw = DOW[(d.getDay() + 6) % 7];
  return d.getDate() + ' ' + MON_G[d.getMonth()] + (d.getFullYear() !== t.getFullYear() ? ' ' + d.getFullYear() : '') + ', ' + dw;
}
const shortDate = k => { const d = new Date(k + 'T00:00:00'); return d.getDate() + ' ' + MON_S[d.getMonth()]; };
