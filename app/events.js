/* app/events.js */
"use strict";
/* Глобальная шина событий приложения и глобальные DOM-события.
   Код перенесён из inline-скрипта index.html байт-в-байт: subscribe/emitStore остаются
   глобальными (их вызывают storage/store.js и screens/editor.js через общую глобальную область),
   порядок и состав подписок не изменены. */

/* store subscription: any persisted change re-renders the visible ledger */
const storeSubs = [];
let storePaused = 0;
const subscribe = fn => { if (!storeSubs.includes(fn)) storeSubs.push(fn); };
const emitStore = () => { if (storePaused) return; storeSubs.slice().forEach(f => { try { f(); } catch (e) {} }); };

/* Escape: шит → формы → экран (тот же обработчик, что раньше завершал inline-скрипт) */
document.addEventListener('keydown', e => { if (e.key !== 'Escape') return; if (sheetStack.length) { closeSheet(); return; } if (AccountFormScreen && AccountFormScreen.handleEscape()) return; if (CategoryFormScreen && CategoryFormScreen.handleEscape()) return; if (GoalFormScreen && GoalFormScreen.handleEscape()) return; if (nav.length) popScreen(); });

/* фасад для отладки (не заменяет глобальные subscribe/emitStore) */
window.App = window.App || {};
App.events = { subscribe: subscribe, emit: emitStore, subs: storeSubs };
