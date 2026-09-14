"use strict";

/* screens/smart/smart-state.js — UI-состояние экрана Smart: сессия AI-советника и кэши здоровья. */

const ADV_CHIPS = [
  'Что разумнее купить сейчас?',
  'Где я перетрачиваю?',
  'Сколько можно тратить сегодня?',
  'Как быстрее достичь цели?',
  'Найти неиспользуемые подписки',
  'Сравни с прошлым месяцем'
];

var ADV = { msgs: [], busy: false, rec: null, ask: null };

/* история: score на конец каждого из последних 6 месяцев (кэш до изменения данных) */
var HL_HIST = { key: '', data: [] };

/* кэш последних рассчитанных рекомендаций здоровья */
var HL_LAST = null;

if (typeof window !== 'undefined') {
  window.ADV_CHIPS = ADV_CHIPS;
  window.ADV = ADV;
  window.HL_HIST = HL_HIST;
  window.HL_LAST = HL_LAST;
}
