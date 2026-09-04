/* app/deeplinks.js */
"use strict";
/* Глубокие ссылки. Формат не изменён: #/add?type=…&amount=…&cat=…&acc=…&note=…,
   #/stats, #/goals, #/advisor, #/health — после применения hash сбрасывается.
   Перенесено из inline-скрипта index.html байт-в-байт; обработчик hashchange один. */
function handleHash() {
  const h = location.hash.replace(/^#\/?/, '');
  if (!h) return;
  const [path, qs] = h.split('?');
  const p = new URLSearchParams(qs || '');
  if (path === 'add') {
    openEditor({
      type: ['expense', 'income', 'transfer', 'adjust'].includes(p.get('type')) ? p.get('type') : 'expense',
      amount: p.get('amount') ? parseFloat(p.get('amount').replace(',', '.')) : 0,
      categoryId: p.get('cat') && catById(p.get('cat')) ? p.get('cat') : null,
      accountId: p.get('acc') && accById(p.get('acc')) ? p.get('acc') : undefined,
      note: p.get('note') || ''
    });
  } else if (path === 'stats') openStats();
  else if (path === 'goals') openGoals();
  else if (path === 'advisor') openAdvisor();
  else if (path === 'health') openHealth();
  history.replaceState({}, '', location.pathname + location.search);
}
window.addEventListener('hashchange', handleHash);
window.App = window.App || {};
App.deeplinks = { handleHash: handleHash };
