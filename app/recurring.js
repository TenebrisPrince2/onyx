/* app/recurring.js */
"use strict";
/* Регулярные операции (шаблоны-повторы): применение пропущенных при запуске.
   Перенесено из inline-скрипта index.html байт-в-байт: формат правила (every: 'week'|'month',
   next: ISO-дата) и защита от повторного применения (while t.next <= today с guard'ом) сохранены.
   Вызывается один раз из boot(). */
function runTemplates() {
  let n = 0;
  const today = iso(new Date());
  S.templates.forEach(tpl => {
    let guard = 0;
    while (tpl.next && tpl.next <= today && guard++ < 24) {
      Store.addTransaction({ type: tpl.type, amount: tpl.amount, accountId: tpl.accountId, toAccountId: tpl.toAccountId, categoryId: tpl.categoryId, note: tpl.note || tpl.name, date: tpl.next + 'T09:00' });
      n++;
      tpl.next = tpl.every === 'week' ? iso(addD(new Date(tpl.next + 'T00:00:00'), 7)) : iso(addM(new Date(tpl.next + 'T00:00:00'), 1));
    }
  });
  if (n) { S.transactions.sort((a, b) => (b.date > a.date ? 1 : b.date < a.date ? -1 : 0)); save(); setTimeout(() => toast(t('recurring.added', { n: n })), 900); }
}
if (typeof window !== 'undefined') {
  window.App = window.App || {};
  window.App.recurring = { run: runTemplates };
}
if (typeof globalThis !== 'undefined') {
  globalThis.App = globalThis.App || (typeof window !== 'undefined' ? window.App : {});
  globalThis.App.recurring = { run: runTemplates };
}
