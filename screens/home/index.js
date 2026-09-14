"use strict";

/* screens/home/index.js — главный оркестратор экрана Home: рендеринг, скролл, свайпы и фасад HomeScreen. */

function render(keepScroll) {
  const view = $('#view');
  if (!view) return;
  const sc = keepScroll ? view.scrollTop : 0;
  /* PERF: при частичном обновлении (keepScroll) не переигрываем каскадную анимацию появления
     строк — 50+ одновременных fadeUp на телефоне дают пропуск кадров. Полный рендер
     (открытие экрана) анимируется как раньше. */
  view.classList.toggle('no-stagger', !!keepScroll);
  /* FIX: openRow/delOpenRow — ссылки на DOM-узлы, которые живут дольше разметки.
     После подмены innerHTML они удерживали в памяти откреплённые поддеревья и
     заставляли браузер считать их «живыми». Чистим, если узел уже не в документе. */
  if (openRow && !openRow.isConnected) openRow = null;
  if (delOpenRow && !delOpenRow.isConnected) delOpenRow = null;
  /* fresh-подсветка новой операции: id кладётся в sessionStorage при сохранении */
  let freshId = null;
  try { freshId = sessionStorage.getItem('onyx:freshTxn'); sessionStorage.removeItem('onyx:freshTxn'); } catch (e) {}
  view.innerHTML = viewLedger();
  renderTop(); icons(view); icons($('#topbar'));   /* PERF: скоуп вместо скана всего документа */
  view.scrollTop = sc;
  enableSwipe(view, true);
  if (freshId) {
    const fresh = view.querySelector('.sw[data-id="' + freshId + '"]');
    if (fresh) {
      fresh.classList.add('sw--fresh');
      try { fresh.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } catch (e) {}
      setTimeout(() => fresh.classList.remove('sw--fresh'), 900);
    }
  }
  const heroEl = view.querySelector('.hero__amt');
  if (heroEl && !S.settings.hideAmounts && lastHeroBal !== null && lastHeroCur === UI._heroCur && lastHeroBal !== UI._heroBal) {
    animateNumber(heroEl, lastHeroBal, UI._heroBal, UI._heroCur);
  }
  lastHeroBal = UI._heroBal; lastHeroCur = UI._heroCur;
  const sel = view.querySelector('#balperSelect');
  if (sel) {
    sel.addEventListener('change', () => onPeriodChange(sel.value));
    sel.addEventListener('blur', () => onPeriodChange(sel.value));
  }
}

window.HomeScreen = {
  get render() { return render; },
  get viewLedger() { return typeof viewLedger !== 'undefined' ? viewLedger : undefined; },
  get invalidateLedgerCache() { return typeof invalidateLedgerCache !== 'undefined' ? invalidateLedgerCache : undefined; },
  get ledgerModel() { return typeof ledgerModel !== 'undefined' ? ledgerModel : undefined; },
  get ledgerGroups() { return typeof ledgerGroups !== 'undefined' ? ledgerGroups : undefined; },
  get openStats() { return typeof openStats !== 'undefined' ? openStats : undefined; },
  get openInsights() { return typeof openInsights !== 'undefined' ? openInsights : undefined; },
  get openGoals() { return typeof openGoals !== 'undefined' ? openGoals : undefined; }
};

if (typeof window !== 'undefined') {
  window.render = render;
}
