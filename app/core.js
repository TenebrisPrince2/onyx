/* app/core.js — ядро приложения (секции «1. data» … «4. ui») — перенесено из inline-скрипта
   index.html байт-в-байт (Этап 2). Загружается ПОСЛЕ screens/* (нужен их DOM-хелперы)
   и ДО app/events.js, как раньше завершался inline-скрипт. */
/* global round2 */
"use strict";
/* ═══════════════════════════════ 1. data ═══════════════════════════════ */

/* SECURITY: дефолтный endpoint пуст — пользователь сам задаёт свой OpenAI-совместимый API.
   Сторонний прокси по умолчанию (chatanywhere) убран: финансовые данные не должны уходить
   на третий сервис, пока пользователь явно не настроит endpoint в настройках ИИ. */
const DEF_AI = () => ({ endpoint: '', key: '', model: 'gpt-4o-mini' });
const DEF_SETTINGS = {
  currency: 'BYN', firstDay: 1, roundTotals: false, calculator: true, alwaysShowIncome: false,
  transferAsIO: false, adjustAsIO: false, hideAmounts: false,
  quickTypes: ['expense', 'income', 'transfer', 'adjust'], reminder: { enabled: false, time: '20:00' },
  pin: '', lastBackup: null, demo: true,
  customPeriods: [], statsExcluded: [], ai: DEF_AI()
};
let S = null;
/* ── системные защищённые счета: подушка (фин. здоровье) + накопления (покупки) ──
   нельзя удалить/изменить; наполняются переводами, видны в общем балансе */
function ensureSysAccounts() {
  let changed = false;
  SYS_ACC_DEFS.forEach(def => {
    if (S.accounts.some(a => a.id === def.id || a.system === def.system)) return;
    S.accounts.push(Object.assign({ currency: S.settings.currency, initial: 0, inTotal: true, order: 900 + SYS_ACC_DEFS.indexOf(def), archived: false }, def));
    changed = true;
  });
  if (changed) { try { save(); } catch (e) {} }
}
/* resolveLucide — единый резолвер Lucide registry (см. utils.js). catLuc/svIcon оставлены
   как алиасы, чтобы не трогать все вызовы в pickers/списках. Старая ONYX custom system удалена. */
const catLuc = (typeof resolveLucide === 'function') ? ((n) => resolveLucide(n, n || 'circle-slash')) : (n => {
  if (!n) return 'circle-slash';
  if (typeof LUCIDE_SVG !== 'undefined' && LUCIDE_SVG[n]) return n;
  if (typeof ICON_MIGRATION_MAP !== 'undefined' && ICON_MIGRATION_MAP[n]) return ICON_MIGRATION_MAP[n];
  return n;
});
/* ═══════════════════════════════ 2. ui primitives ═══════════════════════════════ */
/* swipe rows */
let openRow = null;
function enableSwipe(root, once) {
  if (once) {
    if (root.__swipeBound) return;
    root.__swipeBound = true;
  }
  let el = null, body = null, x0 = 0, y0 = 0, dx = 0, lock = null, base = 0, actsW = 54;
  root.addEventListener('pointerdown', e => {
    const b = e.target.closest('.sw__body'); if (!b) return;
    el = b.closest('.sw'); body = b; x0 = e.clientX; y0 = e.clientY; dx = 0; lock = null;
    const acts = el ? el.querySelector('.sw__acts') : null;
    actsW = acts ? acts.offsetWidth : 54;
    base = el === openRow ? -actsW : 0;
  }, { passive: true });
  root.addEventListener('pointermove', e => {
    if (!el) return;
    const mx = e.clientX - x0, my = e.clientY - y0;
    if (lock === null) { if (Math.abs(mx) < 9 && Math.abs(my) < 9) return; lock = Math.abs(mx) > Math.abs(my) * 1.3 ? 'x' : 'y'; if (lock === 'x') el.classList.add('dragging'); }
    if (lock !== 'x') return;
    dx = clamp(base + mx, -(actsW + 24), 22);
    body.style.transform = 'translate3d(' + dx + 'px,0,0)';
  }, { passive: true });
  const end = () => {
    if (!el) return;
    el.classList.remove('dragging');
    if (lock === 'x') {
      const open = dx < -actsW * .45;
      if (openRow && openRow !== el) { const ob = openRow.querySelector('.sw__body'); if (ob) ob.style.transform = ''; }
      body.style.transform = open ? 'translate3d(' + (-actsW) + 'px,0,0)' : '';
      openRow = open ? el : null;
      if (open) haptic('medium');
      body.dataset.swiped = open ? '1' : '';
    }
    el = null; body = null; actsW = 54;
  };
  root.addEventListener('pointerup', end); root.addEventListener('pointercancel', end);
}
/* swipe-to-delete — счета/категории/накопления: ось-лок на первых 12px,
   софт-порог 72px (ряд остаётся открытым), жёсткий 140px/флик — мгновенное
   удаление с тостом-отменой; не конфликтует со скроллом, тапами и reorder */
let delOpenRow = null;
function closeDelRow(row) {
  if (!row) return;
  const b = row.querySelector('.sw__body') || row.querySelector('.sv');
  if (b) b.style.transform = '';
  row.classList.remove('armed');
  if (delOpenRow === row) delOpenRow = null;
}
function collapseRow(row, cb) {
  if (!row || !row.isConnected) { if (cb) cb(); return; }
  row.style.height = row.offsetHeight + 'px';
  row.classList.add('gone');
  requestAnimationFrame(() => { row.style.height = '0px'; row.style.marginTop = '-6px'; });
  setTimeout(() => { if (cb) cb(); }, 250);
}
function enableDeleteSwipe(list, handlers, bodySel) {
  if (!list) return;
  if (list.__delBound) return;
  list.__delBound = true;
  bodySel = bodySel || '.sw__body';
  const ZONE = 86, OPEN = 72, HARD = 140, FLICK = -0.9;
  let row = null, body = null, x0 = 0, y0 = 0, t0 = 0, dx = 0, raw = 0, lock = null, base = 0;
  let lastX = 0, lastT = 0, vx = 0, moved = false;
  const reset = () => { row = null; body = null; lock = null; dx = 0; raw = 0; moved = false; vx = 0; };
  list.addEventListener('pointerdown', e => {
    if (e.button !== undefined && e.button !== 0) return;
    const b = e.target.closest(bodySel); if (!b) return;
    if (e.target.closest('[data-handle],.iconbtn,.sv__btn,.as__ck,.chip')) return;
    const r = b.closest('.sw'); if (!r || !list.contains(r) || r.classList.contains('sw--sys')) return;
    row = r; body = b;
    x0 = lastX = e.clientX; y0 = e.clientY;
    t0 = lastT = performance.now(); vx = 0; dx = 0; moved = false; lock = null;
    base = row === delOpenRow ? -ZONE : 0;
  }, { passive: true });
  list.addEventListener('pointermove', e => {
    if (!row) return;
    /* reorder(long-press) мог активироваться под пальцем — не мешаем */
    if (row.classList.contains('dragging') || row.style.touchAction === 'none') { reset(); return; }
    const mx = e.clientX - x0, my = e.clientY - y0;
    if (lock === null) {
      if (Math.abs(mx) < 12 && Math.abs(my) < 12) return;
      lock = Math.abs(mx) > my ? 'x' : 'y';
      if (lock === 'x') { row.classList.add('dragging'); if (delOpenRow && delOpenRow !== row) closeDelRow(delOpenRow); }
    }
    if (lock !== 'x') return;
    moved = true;
    const now = performance.now();
    if (now - lastT > 4) { vx = (e.clientX - lastX) / (now - lastT); lastX = e.clientX; lastT = now; }
    raw = base + mx;
    let shown = raw;
    if (shown < -(ZONE + 30)) shown = -(ZONE + 30) + (shown + ZONE + 30) * .45; /* резинка */
    dx = clamp(shown, -(ZONE + 78), 16);
    body.style.transform = 'translateX(' + dx + 'px)';
    row.classList.toggle('armed', dx < -OPEN * .6);
  }, { passive: true });
  const end = () => {
    if (!row) return;
    const r = row, b = body;
    const wasOpen = delOpenRow === r;
    row.classList.remove('dragging');
    if (lock === 'x') {
      if (raw <= -HARD || (vx < FLICK && raw < -40)) {
        /* жёсткая тяга / флик — мгновенное удаление */
        haptic('warning');
        const id = r.dataset.id;
        reset(); delOpenRow = null;
        if (handlers.instant) handlers.instant(id, r);
        return;
      }
      if (dx <= -OPEN) {
        r.classList.add('armed');
        b.style.transform = 'translateX(' + (-ZONE) + 'px)';
        delOpenRow = r;
        b.dataset.swiped = '1';
        haptic('medium');
      } else if (moved) {
        closeDelRow(r);
        b.dataset.swiped = '1';
        setTimeout(() => { if (b.isConnected) delete b.dataset.swiped; }, 350);
      } else {
        closeDelRow(r);
      }
    } else if (wasOpen) {
      /* чистый тап по открытому ряду — закрыть и не кликать */
      closeDelRow(r);
      b.dataset.swiped = '1';
      setTimeout(() => { if (b.isConnected) delete b.dataset.swiped; }, 350);
    }
    reset();
  };
  list.addEventListener('pointerup', end, { passive: true });
  list.addEventListener('pointercancel', () => { if (row && lock === 'x') { row.classList.remove('dragging'); closeDelRow(row); } reset(); }, { passive: true });
  /* тап по кнопке удаления в зоне */
  list.addEventListener('click', e => {
    const del = e.target.closest('.sw__del'); if (!del) return;
    e.stopPropagation();
    const r = del.closest('.sw');
    const id = del.dataset.id;
    haptic('light');
    if (handlers.ask) handlers.ask(id, r);
  });
}
/* удаление счёта из списка (свайп/кнопка) с отменой */
function swipeDeleteAccount(id, row) {
  const a = accById(id);
  if (!a) return;
  if (a.system) { toast('Системный счёт — его нельзя удалить', null, { tone: 'danger' }); closeDelRow(row); return; }
  if (S.accounts.filter(x => !x.archived).length <= 1) { toast('Нужен хотя бы один счёт', null, { tone: 'danger' }); closeDelRow(row); return; }
  const snap = JSON.parse(JSON.stringify(a));
  const txns = S.transactions.filter(t => t.accountId === id || t.toAccountId === id);
  collapseRow(row, () => {
    Store.deleteAccount(id);
    haptic('warning'); render(true); refreshTop();
  });
  toast('Счёт удалён', { label: 'Вернуть', fn: () => {
    Store.restoreAccount(snap, txns);
    render(true); refreshTop(); toast('Счёт восстановлен');
  } }, { icon: 'trash', tone: 'danger' });
}
async function swipeAskDeleteAccount(id, row) {
  const a = accById(id);
  if (!a) return;
  if (a.system) { toast('Системный счёт — его нельзя удалить', null, { tone: 'danger' }); closeDelRow(row); return; }
  if (S.accounts.filter(x => !x.archived).length <= 1) { toast('Нужен хотя бы один счёт', null, { tone: 'danger' }); closeDelRow(row); return; }
  const ok = await confirmSheet({ title: 'Удалить счёт', hint: 'Счёт и все его операции будут удалены', entityName: a.name, icon: a.icon, color: a.color, ok: 'Удалить', danger: true });
  if (!ok) { closeDelRow(row); return; }
  swipeDeleteAccount(id, row);
}
function swipeDeleteCategory(id, row) {
  const c = catById(id);
  if (!c) return;
  const snap = JSON.parse(JSON.stringify(c));
  const touched = S.transactions.filter(t => t.categoryId === id).map(t => ({ t, was: t.categoryId }));
  const kids = S.categories.filter(x => x.parentId === id);
  collapseRow(row, () => {
    Store.deleteCategory(id);
    haptic('warning'); render(true); refreshTop(); notifyCatsChanged();
  });
  toast('Категория удалена', { label: 'Вернуть', fn: () => {
    Store.restoreCategory(snap, kids, touched);
    render(true); refreshTop(); notifyCatsChanged(); toast('Категория восстановлена');
  } }, { icon: 'trash', tone: 'danger' });
}
async function swipeAskDeleteCategory(id, row) {
  const c = catById(id);
  if (!c) return;
  const hint = c.parentId ? 'Подкатегория будет удалена. Операции станут «Без категории».' : 'Категория и все её операции будут удалены. Подкатегории станут без родителя.';
  const ok = await confirmSheet({ title: c.parentId ? 'Удалить подкатегорию' : 'Удалить категорию', hint, entityName: c.name, icon: catLuc(c.icon), color: c.color, ok: 'Удалить', danger: true });
  if (!ok) { closeDelRow(row); return; }
  swipeDeleteCategory(id, row);
}
function swipeDeleteGoal(id, row) {
  const g = S.goals.find(x => x.id === id);
  if (!g) return;
  const idx = S.goals.indexOf(g);
  collapseRow(row, () => {
    S.goals = S.goals.filter(x => x.id !== id);
    save(); haptic('warning'); render(true); refreshTop();
  });
  toast('Накопление удалено', { label: 'Вернуть', fn: () => {
    S.goals.splice(Math.min(idx, S.goals.length), 0, g);
    save(); render(true); refreshTop(); toast('Накопление восстановлено');
  } }, { icon: 'trash', tone: 'danger' });
}
async function swipeAskDeleteGoal(id, row) {
  const g = S.goals.find(x => x.id === id);
  if (!g) return;
  const ok = await confirmSheet({ title: 'Удалить накопление', hint: 'Накопление и его история пополнений будут удалены', entityName: g.name, icon: svIcon(g.icon), color: g.color, ok: 'Удалить', danger: true });
  if (!ok) { closeDelRow(row); return; }
  swipeDeleteGoal(id, row);
}
/* reorder — Pointer Events, long-press 200ms или grip-ручка, плавное раздвигание */
function enableReorder(list, onOrder) {
  if (!list) return;
  if (list.__reorderBound) return; list.__reorderBound = true;
  let dragEl = null, items = [], y0 = 0, x0 = 0, from = 0, to = 0, h = 0, pid = null;
  let holdTimer = null, armed = false, moved = false, startTarget = null, startHandle = null;
  let origTouchAction = '', scrollEl = null;

  function gap() { return parseFloat(getComputedStyle(list).rowGap) || 6; }
  function refreshGeom() {
    items = [...list.querySelectorAll(':scope > [data-id]')];
    if (!items.length) { h = 48; return; }
    const r = dragEl ? dragEl.getBoundingClientRect() : items[0].getBoundingClientRect();
    h = r.height + gap();
  }
  function clearHold() { if (holdTimer) { clearTimeout(holdTimer); holdTimer = null; } }
  function activate(e) {
    if (!dragEl) return;
    armed = true; moved = true;
    dragEl.classList.add('dragging');
    dragEl.style.zIndex = '30';
    dragEl.style.transition = 'none';
    dragEl.style.touchAction = 'none';
    dragEl.style.willChange = 'transform';
    dragEl.style.transformOrigin = 'center';
    // lock scroll
    scrollEl = list.closest('.screen__body') || list.parentElement;
    if (scrollEl) { origTouchAction = scrollEl.style.touchAction; scrollEl.style.touchAction = 'none'; scrollEl.style.overflow = 'hidden'; }
    // other items smooth gap
    items.forEach(it => { if (it !== dragEl) { it.style.transition = 'transform 200ms cubic-bezier(.22,1,.36,1)'; } });
    try { if (e && e.pointerId !== undefined) dragEl.setPointerCapture(e.pointerId); } catch(_){}
    haptic('medium');
    e && e.preventDefault && e.preventDefault();
  }
  function onDown(e) {
    if (e.button !== undefined && e.button !== 0) return;
    const handle = e.target.closest('[data-handle]');
    const row = e.target.closest('[data-id]');
    if (!row || !list.contains(row)) return;
    // click without drag must still open edit → do not hijack unless handle or long-press
    if (!handle && e.target.closest('[data-act="edit-cat"]')) {
      // still allow long-press on row itself
    }
    if (!handle && !row) return;
    dragEl = row; startHandle = handle; startTarget = e.target;
    refreshGeom();
    from = to = items.indexOf(dragEl);
    if (from < 0) { dragEl = null; return; }
    y0 = e.clientY; x0 = e.clientX; moved = false; armed = false; pid = e.pointerId;
    // immediate if grip, else long-press 200ms
    if (handle) {
      activate(e);
    } else {
      holdTimer = setTimeout(()=> { if (dragEl && !armed) activate(e); }, 200);
      try { dragEl.setPointerCapture(e.pointerId); } catch(_){}
    }
  }
  function onMove(e) {
    if (!dragEl) return;
    if (!armed) {
      const dx = Math.abs(e.clientX - x0), dy = Math.abs(e.clientY - y0);
      if (dx > 8 || dy > 8) { clearHold(); // too much move before activation → cancel drag, allow scroll
        if (dx > dy) { /* horizontal? keep */ }
        // vertical movement threshold cancels long-press
        if (dy > 10) { dragEl = null; startTarget = null; return; }
      }
      return;
    }
    e.preventDefault();
    const dy = e.clientY - y0;
    moved = true;
    dragEl.style.transform = 'translateY(' + dy + 'px) scale(1.04)';
    // compute target index by center Y
    const centerY = dragEl.getBoundingClientRect().top + dragEl.offsetHeight/2;
    // find insertion index via comparing centers
    let nt = from;
    for (let i = 0; i < items.length; i++) {
      if (items[i] === dragEl) continue;
      const r = items[i].getBoundingClientRect();
      const mid = r.top + r.height/2;
      if (centerY > mid) {
        if (i > from) nt = Math.max(nt, i);
        else if (i < from) { /* crossing upward */ }
      }
    }
    // simpler: use dy/h rounding but clamped, works with translateY
    const approx = clamp(from + Math.round(dy / h), 0, items.length - 1);
    // choose the more accurate of both
    nt = approx;
    if (nt !== to) {
      to = nt; haptic('selection');
      items.forEach((it, i) => {
        if (it === dragEl) return;
        let sh = 0;
        if (from < to && i > from && i <= to) sh = -h;
        if (from > to && i < from && i >= to) sh = h;
        it.style.transform = sh ? 'translateY(' + sh + 'px)' : 'translateY(0)';
      });
    }
  }
  function cleanupStyles() {
    items.forEach(it => {
      it.style.transition = '';
      it.style.transform = '';
      it.style.willChange = '';
    });
    if (dragEl) {
      dragEl.style.zIndex = ''; dragEl.style.transition = ''; dragEl.style.touchAction = '';
      dragEl.style.willChange = ''; dragEl.style.transform = '';
      dragEl.classList.remove('dragging');
    }
    if (scrollEl) { scrollEl.style.touchAction = origTouchAction; scrollEl.style.overflow = ''; }
  }
  function onUp(e) {
    if (!dragEl) { clearHold(); return; }
    clearHold();
    const wasArmed = armed;
    const wasMoved = moved;
    const curDrag = dragEl;
    const curFrom = from, curTo = to;
    const target = startTarget;
    // release capture
    try { if (curDrag.hasPointerCapture && pid !== null && curDrag.hasPointerCapture(pid)) curDrag.releasePointerCapture(pid); } catch(_){}
    if (!wasArmed) {
      // not a drag → treat as tap; let click handler fire
      dragEl = null; pid = null; armed = false; moved = false;
      return;
    }
    // animate snap into place
    curDrag.style.transition = 'transform 260ms cubic-bezier(.22,1,.36,1)';
    curDrag.style.transform = 'translateY(' + ((curTo - curFrom) * h) + 'px) scale(1.04)';
    // keep gap transforms for others during snap
    setTimeout(() => {
      cleanupStyles();
      if (curTo !== curFrom) {
        const ids = items.map(i => i.dataset.id);
        const [m] = ids.splice(curFrom, 1);
        ids.splice(curTo, 0, m);
        haptic('selection');
        onOrder(ids);
      } else if (wasMoved) {
        haptic('light');
      }
      // restore list gap animation cleanly
      list.style.willChange = 'auto';
      dragEl = null; pid = null; armed = false; moved = false;
    }, 30);
    // also clear transform after transition for smoothness
    setTimeout(()=> { if (curDrag) { curDrag.style.transform = 'none'; curDrag.style.willChange = 'auto'; setTimeout(()=> curDrag.style.transform='', 380); } }, 280);
  }
  function onCancel(e) {
    clearHold();
    if (!dragEl) return;
    if (armed) {
      dragEl.style.transition = 'transform 240ms cubic-bezier(.22,1,.36,1)';
      dragEl.style.transform = 'translateY(0) scale(1)';
      setTimeout(cleanupStyles, 260);
      haptic('light');
    }
    dragEl = null; pid = null; armed = false; moved = false;
  }
  list.addEventListener('pointerdown', onDown, { passive: false });
  list.addEventListener('pointermove', onMove, { passive: false });
  list.addEventListener('pointerup', onUp, { passive: false });
  list.addEventListener('pointercancel', onCancel, { passive: false });
  list.addEventListener('pointerleave', (e)=> { if (armed) onCancel(e); });
  // prevent contextmenu on long press
  list.addEventListener('contextmenu', e => { if (armed) e.preventDefault(); });
  // CSS helper for dragging state
  const style = document.createElement('style');
  style.textContent = '.sw.dragging{ z-index:30; will-change:transform }';
  if (!document.querySelector('#reorder-style')) { style.id='reorder-style'; document.head.appendChild(style); }
}

/* ═══════════════════════════════ 3. app state ═══════════════════════════════ */
const UI = { ledger: { off: 0, day: null, limit: 50, period: 'month', customId: null }, insights: { off: 0 }, per: { unit: 'month', off: 0 }, accId: null, catKind: 'expense' };

function segHTML(name, val, opts) {
  const i = opts.findIndex(o => o[0] === val);
  return '<div class="seg seg--collapse" data-seg="' + name + '" data-v="' + val + '" style="--n:' + opts.length + ';--i:' + Math.max(0, i) + '">' +
    opts.map(o => '<button type="button" data-segv="' + o[0] + '" aria-selected="' + (o[0] === val) + '">' +
      (o[2] ? (String(o[2]).indexOf('<svg') === 0 ? o[2] : '<i data-lucide="' + o[2] + '" class="ic ic-s"></i>') : '') + '<span>' + esc(o[1]) + '</span></button>').join('') + '</div>';
}
/* пилюля-сегмент: у невыбранных — только иконка, выбранная подсвечена цветом (CSS по data-v) */
function pillSegHTML(name, val, opts) {
  return '<div class="pseg" data-seg="' + name + '" data-v="' + val + '">' +
    opts.map(o => '<button type="button" data-segv="' + o[0] + '" aria-selected="' + (o[0] === val) + '">' +
      (o[2] ? (String(o[2]).indexOf('<svg') === 0 ? o[2] : '<i data-lucide="' + o[2] + '" class="ic ic-s"></i>') : '') + '<span>' + esc(o[1]) + '</span></button>').join('') + '</div>';
}
function bindSeg(root, name, fn) {
  const seg = root.querySelector('[data-seg="' + name + '"]'); if (!seg) return;
  seg.querySelectorAll('[data-segv]').forEach((b, i) => b.onclick = () => {
    if (b.getAttribute('aria-selected') === 'true') return;
    haptic('selection');
    seg.style.setProperty('--i', i); seg.dataset.v = b.dataset.segv;
    seg.querySelectorAll('[data-segv]').forEach(x => x.setAttribute('aria-selected', x === b));
    fn(b.dataset.segv);
  });
}

/* ═══════════════════════════════ 4. top bar + dock ═══════════════════════════════ */
function renderTop() {
  const a = UI.accId ? accById(UI.accId) : null;
  const t = totalsByCur();
  const main = a ? accBalance(a.id) : (t[S.settings.currency] || 0);
  $('#topbar').innerHTML =
    '<button class="chip chip--lg" data-act="pick-account"><span class="tile tile--round" style="' + (a ? '--c:' + a.color : '--c:var(--t2);background:#000') + '">' + (a ? '<i data-lucide="' + a.icon + '" class="ic"></i>' : ALL_ACC_IC) + '</span>' +
    '<span class="chip__tx"><span class="chip__t">' + esc(a ? a.name : 'Все счета') + '</span><span class="chip__s">' + money(main, a ? a.currency : S.settings.currency) + '</span></span></button>' +
    '<span style="flex:1"></span>' +
    '<div style="display:flex;align-items:center;gap:8px">' +
    '<div class="pill" style="height:44px;padding:2px">' +
    '<button class="iconbtn" data-act="search" aria-label="Поиск"><i data-lucide="search" class="ic"></i></button>' +
    '<button class="iconbtn" data-act="stats" aria-label="Аналитика"><i data-lucide="chart-pie" class="ic"></i></button>' +
    '<button class="iconbtn" data-act="goals" aria-label="Покупки"><i data-lucide="shopping-bag" class="ic"></i></button>' +
    '<button class="iconbtn" data-act="health" aria-label="Финансовое здоровье"><i data-lucide="heart" class="ic"></i></button>' +
    '</div>' +
    '<button class="iconbtn" data-act="settings" aria-label="Настройки"><i data-lucide="settings" class="ic"></i></button>' +
    '</div>';
}

/* ═══════════════════════════════ 7. pickers ═══════════════════════════════ */
function pickAccount(fn, o) {
  o = o || {};
  const list = S.accounts.filter(a => !a.archived && a.id !== o.exclude).sort((a, b) => a.order - b.order);
  /* секция «Накопления»: только когда явно запрошена и есть что показать */
  const gs = o.goals ? S.goals.slice().sort((a, b) => (a.order || 0) - (b.order || 0)) : [];
  const gpHTML = gs.length ? '<div class="gp-lab">Накопления</div><div class="gp-list">' + gs.map(g => {
    return '<div class="gp-row" style="--c:' + g.color + '">' +
      '<span class="gp-ic"><i data-lucide="' + svIcon(g.icon) + '" class="ic"></i></span>' +
      '<span class="gp-main"><b>' + esc(g.name) + '</b><small class="num">' + money(g.saved) + ' / ' + money(g.target) + '</small></span>' +
      '<button class="gp-plus" data-gp="' + g.id + '" aria-label="Пополнить ' + esc(g.name) + '"><i data-lucide="plus" class="ic ic-s"></i></button>' +
      '</div>';
  }).join('') + '</div>' : '';
  openSheet({
    title: 'Счёт',
    html: gpHTML + '<div class="list">' + (o.all ? '<button class="item" data-id=""><span class="tile tile--sm" style="--c:var(--t2);background:#000">' + ALL_ACC_IC + '</span><span class="item__t">Все счета</span><span class="item__v">' + money(totalsByCur()[S.settings.currency] || 0) + '</span></button>' : '') +
      list.map(a => '<button class="item" data-id="' + a.id + '"><span class="tile tile--sm" style="--c:' + a.color + '"><i data-lucide="' + a.icon + '" class="ic"></i></span>' +
        '<span class="item__t">' + esc(a.name) + '</span><span class="item__v">' + money(accBalance(a.id), a.currency) + '</span></button>').join('') + '</div>' +
      '<button class="btn btn--ghost btn--sm" style="margin-top:12px" data-new="1"><i data-lucide="plus" class="ic"></i>Новый счёт</button>',
    mount(sh) {
      if (gs.length) {
        let gpOpen = null;
        const gpClose = () => { if (!gpOpen) return; gpOpen.classList.remove('gp--open'); const x = gpOpen.querySelector('.gp-x'); if (x) x.remove(); gpOpen = null; };
        sh.querySelectorAll('[data-gp]').forEach(b => b.onclick = e => {
          e.stopPropagation();
          const row = b.closest('.gp-row');
          if (gpOpen === row) { gpClose(); haptic('light'); return; }
          gpClose();
          const g = S.goals.find(x => x.id === b.dataset.gp); if (!g) return;
          gpOpen = row;
          row.classList.add('gp--open');
          haptic('light');
          const pre = (typeof o.amount === 'function' && o.amount() > 0) ? String(o.amount()) : '';
          const x = document.createElement('div');
          x.className = 'gp-x';
          x.innerHTML = '<input class="gp-x-inp" inputmode="decimal" placeholder="0" value="' + esc(pre) + '">' +
            '<button class="gp-x-ok" disabled>Пополнить</button>';
          row.appendChild(x);
          const inp = x.querySelector('input'), ok = x.querySelector('button');
          const sync = () => { ok.disabled = !(parseFloat(String(inp.value).replace(',', '.')) > 0); };
          inp.oninput = sync;
          sync();
          ok.onclick = () => {
            const v = parseFloat(String(inp.value).replace(',', '.')) || 0;
            if (v <= 0) return;
            g.saved = round2(g.saved + v);
            (g.history = g.history || []).push({ date: iso(new Date()), v });
            save(); closeSheet(); haptic('success'); refreshTop();
            /* операция НЕ создаётся: накопления ведутся отдельно */
            toast(g.saved >= g.target && g.target > 0 ? 'Достигнуто 🎉' : g.name + ': +' + money(v));
          };
          setTimeout(() => inp.focus(), 260);
        });
      }
      sh.querySelectorAll('[data-id]').forEach(b => b.onclick = () => { haptic('selection'); closeSheet(); fn(b.dataset.id || null); });
      sh.querySelector('[data-new]').onclick = () => { closeSheet(); openAccountForm({}, a => fn(a.id)); };
    }
  });
}
function pickCategory(kind, fn) {
  const tops = topCats(kind);
  openSheet({
    title: kind === 'income' ? 'Категория дохода' : 'Категория расхода',
    html: '<div style="display:flex;flex-direction:column;gap:2px">' + tops.map(c => {
      const kids = childrenOf(c.id);
      return '<div><button class="item" style="border-radius:var(--r);background:var(--s1)" data-id="' + c.id + '"><span class="tile tile--sm" style="--c:' + c.color + '"><i data-lucide="' + catLuc(c.icon) + '" class="ic"></i></span><span class="item__t">' + esc(c.name) + '</span></button>' +
        (kids.length ? '<div style="display:flex;flex-wrap:wrap;gap:2px;padding:8px 0 0 14px">' + kids.map(k => '<button class="chip chip--flat" style="padding:7px 13px;font-size:13px" data-id="' + k.id + '"><i data-lucide="' + catLuc(k.icon) + '" class="ic ic-s" style="color:' + k.color + '"></i>' + esc(k.name) + '</button>').join('') + '</div>' : '') + '</div>';
    }).join('') + '<button class="item" style="border-radius:var(--r);background:var(--s1)" data-id=""><span class="tile tile--sm" style="--c:var(--t3)"><i data-lucide="circle-slash" class="ic"></i></span><span class="item__t">Без категории</span></button></div>',
    mount(sh) { sh.querySelectorAll('[data-id]').forEach(b => b.onclick = () => { haptic('selection'); closeSheet(); fn(b.dataset.id || null); }); }
  });
}
function pickDate(cur, fn) {
  let anchor = som(new Date(cur + 'T00:00:00'));
  const rec = openSheet({ title: 'Дата', html: '<div id="calHost"></div>', mount(sh) { draw(sh); } });
  function draw(sh) {
    const host = sh.querySelector('#calHost');
    const first = som(anchor), start = sow(first);
    const cells = [];
    for (let i = 0; i < 42; i++) {
      const d = addD(start, i);
      cells.push({ d, out: d.getMonth() !== first.getMonth() });
      if (i > 34 && addD(start, i + 1).getMonth() !== first.getMonth()) break;
    }
    const dows = []; for (let i = 0; i < 7; i++) dows.push(DOW[(S.settings.firstDay - 1 + i + 7) % 7]);
    host.innerHTML = '<div style="display:flex;gap:8px;padding:0 2px 12px;overflow-x:auto;scrollbar-width:none">' +
      [['Сегодня', 0], ['Вчера', -1], ['2 дня назад', -2], ['Неделю назад', -7]].map(q => '<button class="chip chip--flat" style="flex:none" data-q="' + q[1] + '">' + q[0] + '</button>').join('') + '</div>' +
      '<div class="cal"><div class="cal__hd"><button class="iconbtn" data-m="-1"><i data-lucide="chevron-left" class="ic"></i></button>' +
      '<b>' + MON_N[first.getMonth()] + ' ' + first.getFullYear() + '</b>' +
      '<button class="iconbtn" data-m="1"><i data-lucide="chevron-right" class="ic"></i></button></div>' +
      '<div class="cal__grid">' + dows.map(d => '<span class="cal__dow">' + d + '</span>').join('') +
      cells.map(c => '<button class="cal__d" data-d="' + iso(c.d) + '" data-out="' + (c.out ? 1 : 0) + '" data-today="' + (iso(c.d) === iso(new Date()) ? 1 : 0) + '" aria-selected="' + (iso(c.d) === cur) + '">' + c.d.getDate() + '</button>').join('') + '</div></div>';
    icons(sh);
    host.querySelectorAll('[data-m]').forEach(b => b.onclick = () => { anchor = addM(anchor, +b.dataset.m); draw(sh); });
    host.querySelectorAll('[data-d]').forEach(b => b.onclick = () => { haptic('selection'); closeSheet(); fn(b.dataset.d); });
    host.querySelectorAll('[data-q]').forEach(b => b.onclick = () => { haptic('light'); closeSheet(); fn(iso(addD(new Date(), +b.dataset.q))); });
  }
}
function pickFromList(title, opts, cur, fn) {
  openSheet({
    title, html: '<div class="list">' + opts.map(o => '<button class="item" data-v="' + esc(o[0]) + '"><span class="item__t">' + (o[2] ? o[1] : esc(o[1])) + '</span>' +
      (String(o[0]) === String(cur) ? '<i data-lucide="check" class="ic" style="color:var(--t1)"></i>' : '') + '</button>').join('') + '</div>',
    mount(sh) { sh.querySelectorAll('[data-v]').forEach(b => b.onclick = () => { haptic('selection'); closeSheet(); fn(b.dataset.v); }); }
  });
}
const COLOR_PRESETS = ['#ff453a', '#ff375f', '#ff9500', '#ffd60a', '#30d158', '#0ac97a', '#06b6d4', '#0a84ff', '#5e5ce6', '#9ca3af'];
function pickCustomColor(o) {
  let hex = normalizeHex(o.current) || '#8F8F97';
  openSheet({
    title: o.title || 'Цвет',
    html: '<div style="display:flex;flex-direction:column;gap:22px">' +
      '<div style="display:flex;align-items:center;gap:16px">' +
      '<label style="position:relative;flex:none;display:block">' +
      '<span id="acSwatch" style="display:block;width:60px;height:60px;border-radius:20px;border:1px solid var(--line2)"></span>' +
      '<input type="color" id="acNative" style="position:absolute;inset:0;width:100%;height:100%;opacity:0;cursor:pointer;border:0;padding:0">' +
      '</label>' +
      '<div class="field" style="flex:1"><span>HEX</span><input class="inp" id="acHex" maxlength="7" autocapitalize="off" autocorrect="off" spellcheck="false"></div>' +
      '</div>' +
      '<div style="display:flex;flex-direction:column;gap:14px">' +
      ['R', 'G', 'B'].map(ch => '<div style="display:flex;align-items:center;gap:12px">' +
        '<span style="width:14px;font-size:13px;font-weight:600;color:var(--t3)">' + ch + '</span>' +
        '<input type="range" min="0" max="255" step="1" id="ac' + ch + '" style="flex:1">' +
        '<span class="num" id="ac' + ch + 'v" style="width:32px;text-align:right;font-size:13px;color:var(--t2)">0</span></div>').join('') +
      '</div>' +
      '<div><span class="label" style="padding:0 0 8px 0">Быстрый выбор</span><div class="swatches">' +
      (o.presets || COLOR_PRESETS).map(c => '<button class="swatch" style="--c:' + c + '" data-c="' + c + '" aria-selected="false"></button>').join('') + '</div></div>' +
      '</div>',
    mount(sh) {
      const swatch = sh.querySelector('#acSwatch'), native = sh.querySelector('#acNative'), hexInp = sh.querySelector('#acHex');
      const rI = sh.querySelector('#acR'), gI = sh.querySelector('#acG'), bI = sh.querySelector('#acB');
      const rV = sh.querySelector('#acRv'), gV = sh.querySelector('#acGv'), bV = sh.querySelector('#acBv');
      const presets = sh.querySelectorAll('.swatch');
      function paint(live) {
        swatch.style.background = hex;
        native.value = hex; hexInp.value = hex;
        const { r, g, b } = hexToRgb(hex);
        rI.value = r; gI.value = g; bI.value = b; rV.textContent = r; gV.textContent = g; bV.textContent = b;
        presets.forEach(p => p.setAttribute('aria-selected', p.dataset.c.toUpperCase() === hex));
        if (live !== false && o.onPick) o.onPick(hex);
      }
      function fromRgb() { hex = rgbToHex(rI.value, gI.value, bI.value); paint(); }
      paint(false);
      native.oninput = () => { hex = normalizeHex(native.value) || hex; paint(); };
      hexInp.oninput = () => { const n = normalizeHex(hexInp.value); if (n) { hex = n; paint(); } };
      [rI, gI, bI].forEach(inp => inp.oninput = fromRgb);
      presets.forEach(p => p.onclick = () => { haptic('selection'); hex = p.dataset.c; paint(); });
    },
    onClose: o.onClose
  });
}

/* ═══════════════════════════════ 16. quick menu + global events ═══════════════════════════════ */
let quickOpen = false;
function toggleQuick(force) {
  const host = $('#quickhost');
  if (quickOpen && force !== true) { host.classList.remove('in'); setTimeout(() => host.innerHTML = '', 220); quickOpen = false; return; }
  const items = [['expense', 'Расход', ARR_OUT, 'var(--exp)'], ['income', 'Доход', ARR_IN, 'var(--inc)'],
    ['transfer', 'Перевод', 'arrow-left-right', 'var(--t2)'], ['adjust', 'Корректировка', 'settings', 'var(--t2)']]
    .filter(i => S.settings.quickTypes.includes(i[0]));
  host.innerHTML = '<div class="scrim quick-scrim"></div><div class="quick">' + items.map((i, n) => '<button data-type="' + i[0] + '" style="--i:' + (items.length - n - 1) + '">' +
    (String(i[2]).indexOf('<svg') === 0 ? '<span style="color:' + i[3] + ';display:flex">' + i[2] + '</span>' : '<i data-lucide="' + i[2] + '" class="ic" style="color:' + i[3] + '"></i>') + i[1] + '</button>').join('') + '</div>';
  requestAnimationFrame(() => host.classList.add('in'));
  icons(host); quickOpen = true; haptic('medium');
  host.querySelectorAll('[data-type]').forEach(b => b.onclick = () => { toggleQuick(); openEditor({ type: b.dataset.type }); });
  host.querySelector('.quick-scrim').onclick = () => toggleQuick();
  setTimeout(() => document.addEventListener('pointerdown', once, { once: true }), 30);
  function once(e) { if (!e.target.closest('.quick') && !e.target.closest('.fab')) toggleQuick(); }
}
$('#fabhost').addEventListener('click', e => {
  const fab = e.target.closest('[data-act="add"]');
  if (fab) { if (quickOpen) toggleQuick(); else openEditor({ type: 'expense' }); }
});
let fabLP = null;
$('#fabhost').addEventListener('pointerdown', e => {
  if (!e.target.closest('[data-act="add"]')) return;
  fabLP = setTimeout(() => { fabLP = 'done'; toggleQuick(true); }, 380);
});
['pointerup', 'pointercancel', 'pointerleave'].forEach(ev => $('#fabhost').addEventListener(ev, () => { if (fabLP && fabLP !== 'done') clearTimeout(fabLP); setTimeout(() => fabLP = null, 10); }));
$('#fabhost').addEventListener('click', e => { if (fabLP === 'done') e.stopPropagation(); }, true);

$('#topbar').addEventListener('click', e => {
  const b = e.target.closest('[data-act]'); if (!b) return;
  const a = b.dataset.act;
  if (a === 'pick-account') openAccounts();
  if (a === 'search') openSearch();
  if (a === 'stats') openStats();
  if (a === 'goals') openGoals();
  if (a === 'advisor') openAdvisor();
  if (a === 'settings') openSettings();
  if (a === 'health') openHealth();
});
let holdBal = null;
$('#view').addEventListener('click', e => {
  const b = e.target.closest('[data-act]'); if (!b) return;
  const a = b.dataset.act, id = b.dataset.id;
  if (a === 'open-txn' || a === 'edit-txn') { if (b.dataset.swiped === '1') return; openEditor({ id }); }
  else if (a === 'del-txn') delTxn(id);
  else if (a === 'add') openEditor({ type: b.dataset.type || 'expense', date: b.dataset.date });
  else if (a === 'pick-period') openPeriodPicker();
  else if (a === 'clear-day') { UI.ledger.day = null; UI.ledger.limit = 50; haptic('light'); render(true); }
  else if (a === 'more') {
    haptic('light');
    if (typeof loadMoreLedger !== 'function' || !loadMoreLedger()) {
      UI.ledger.limit = (UI.ledger.limit || 50) + 50;
      render(true);
    }
  }
  else if (a === 'insights') openInsights();
  else if (a === 'health') openHealth();
  else if (a === 'toggle-hide') { S.settings.hideAmounts = !S.settings.hideAmounts; save(); haptic('light'); render(true); }
  else if (a === 'wipe-demo') wipeDemo();
});

$('#view').addEventListener('change', e => {
  const sel = e.target && (e.target.id === 'balperSelect' || e.target.id === 'asPeriodSelect') ? e.target : (e.target && e.target.closest ? e.target.closest('#balperSelect, #asPeriodSelect') : null);
  if (sel) {
    if (sel.id === 'asPeriodSelect' && typeof onAsPeriodChange === 'function') onAsPeriodChange(sel.value);
    else if (typeof onPeriodChange === 'function') onPeriodChange(sel.value);
  }
});
document.addEventListener('change', e => {
  const sel = e.target && (e.target.id === 'balperSelect' || e.target.id === 'asPeriodSelect') ? e.target : (e.target && e.target.closest ? e.target.closest('#balperSelect, #asPeriodSelect') : null);
  if (sel) {
    if (sel.id === 'asPeriodSelect' && typeof onAsPeriodChange === 'function') onAsPeriodChange(sel.value);
    else if (typeof onPeriodChange === 'function') onPeriodChange(sel.value);
  }
});

async function wipeDemo() {
  if (!await confirmSheet({ title: 'Очистить демо-данные?', text: 'Удалим сгенерированные операции и цели. Счета и категории останутся.', ok: 'Очистить' })) return;
  S.transactions = []; S.goals = []; S.templates = [];
  S.accounts.forEach(a => a.initial = 0);
  S.settings.demo = false; save(); render(); toast('Готово, можно начинать с нуля');
}
/* ── демо-данные из настроек: добавить счета, категории, накопления и полгода операций ──
   ничего не удаляет: новые сущности дописываются к текущим данным с уникальными id */
function seedDemo() {
  const cur = S.settings.currency;
  const today = sod(new Date());
  let seed = Math.floor(Math.random() * 2147483000) + 1;
  const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
  const pick = a => a[Math.floor(rnd() * a.length)];
  const m2 = (a, b) => round2(a + rnd() * (b - a));
  const nid = p => p + uid();
  /* счета (order с запасом, чтобы не пересекаться с текущими) */
  const cash = nid('da'), card = nid('da'), reserve = nid('da'), cube = nid('da');
  const newAccs = [
    { id: cash, name: 'Наличные', icon: 'wallet', color: PALETTE[5], currency: cur, initial: 190, inTotal: true, order: 200, archived: false },
    { id: card, name: 'Основная карта', icon: 'credit-card', color: PALETTE[7], currency: cur, initial: 1520, inTotal: true, order: 201, archived: false },
    { id: reserve, name: 'Резервная карта', icon: 'landmark', color: PALETTE[9], currency: cur, initial: 640, inTotal: true, order: 202, archived: false },
    { id: cube, name: 'Кубышка', icon: 'piggy-bank', color: PALETTE[3], currency: cur, initial: 2600, inTotal: true, order: 203, archived: false }
  ];
  /* категории (только иконки из нового эталонного набора ONYX) */
  const cHome = nid('dc'), cShop = nid('dc'), cRest = nid('dc'), cTrans = nid('dc'), cCar = nid('dc'),
    cHobby = nid('dc'), cPets = nid('dc'), cEdu = nid('dc'), cWear = nid('dc'), cBonus = nid('dc');
  const newCats = [
    { id: cHome, name: 'Дом и аренда', icon: 'house', color: PALETTE[11], kind: 'expense', parentId: null, order: 200 },
    { id: cShop, name: 'Супермаркет', icon: 'shopping-basket', color: PALETTE[7], kind: 'expense', parentId: null, order: 201 },
    { id: cRest, name: 'Рестораны и кафе', icon: 'utensils', color: PALETTE[5], kind: 'expense', parentId: null, order: 202 },
    { id: cTrans, name: 'Транспорт', icon: 'bus', color: PALETTE[10], kind: 'expense', parentId: null, order: 203 },
    { id: cCar, name: 'Авто', icon: 'car', color: PALETTE[13], kind: 'expense', parentId: null, order: 204 },
    { id: cHobby, name: 'Хобби и игры', icon: 'gamepad-2', color: PALETTE[12], kind: 'expense', parentId: null, order: 205 },
    { id: cPets, name: 'Питомцы', icon: 'paw-print', color: PALETTE[9], kind: 'expense', parentId: null, order: 206 },
    { id: cEdu, name: 'Обучение', icon: 'graduation-cap', color: PALETTE[8], kind: 'expense', parentId: null, order: 207 },
    { id: cWear, name: 'Одежда и уход', icon: 'shopping-bag', color: PALETTE[4], kind: 'expense', parentId: null, order: 208 },
    { id: cBonus, name: 'Бонусы и премии', icon: 'coins', color: PALETTE[6], kind: 'income', parentId: null, order: 209 }
  ];

  /* накопления: saved соберём из истории пополнений */
  const gAcc = sysAcc('goals');
  const g1 = nid('dg'), g2 = nid('dg');
  const goals = [
    { id: g1, name: 'Наушники Sony', target: 540, saved: 0, icon: 'headphones', color: PALETTE[12], deadline: iso(addM(today, 2)), history: [] },
    { id: g2, name: 'Отпуск в Италии', target: 4200, saved: 0, icon: 'plane', color: PALETTE[6], deadline: iso(addM(today, 6)), history: [] }
  ];
  /* полгода операций: будни реже, выходные чаще */
  const ops = [];
  const rows = [
    [cShop, card, 14, 85, ['Евроопт', 'Санта', 'Green', 'Продукты на неделю', 'Корзина'], .85],
    [cShop, card, 6, 35, ['Хлеб и молоко', 'Быстрая покупка', 'Вода и снеки'], .35],
    [cRest, card, 12, 65, ['Обед в кафе', 'Ужин с друзьями', 'Доставка пиццы', 'Бизнес-ланч'], .3],
    [cRest, cash, 4, 18, ['Кофе с собой', 'Пирожное', 'Сэндвич'], .32],
    [cTrans, cash, 2, 12, ['Проезд', 'Метро', 'Маршрутка'], .45],
    [cTrans, card, 6, 28, ['Такси', 'Яндекс Go', 'Поездка домой'], .12],
    [cCar, card, 22, 95, ['Заправка', 'Парковка', 'Мойка'], .12],
    [cWear, card, 25, 180, ['Zara', 'Кроссовки', 'Косметика', 'Бытовая мелочь'], .07],
    [cHobby, reserve, 15, 120, ['Steam', 'Настолки', 'Кино', 'Книги'], .08],
    [cPets, card, 12, 85, ['Корм', 'Наполнитель', 'Ветаптека'], .1],
    [cEdu, card, 45, 150, ['Курс английского', 'Онлайн-курс', 'Учебники'], .04]
  ];
  for (let i = 181; i >= 0; i--) {
    const d = addD(today, -i), k = iso(d);
    rows.forEach(r => {
      if (rnd() < r[5] * (d.getDay() === 0 || d.getDay() === 6 ? 1.3 : .85))
        ops.push({ id: uid(), type: 'expense', amount: m2(r[2], r[3]), accountId: r[1], categoryId: r[0], note: pick(r[4]), date: k + 'T' + String(8 + Math.floor(rnd() * 13)).padStart(2, '0') + ':' + String(Math.floor(rnd() * 60)).padStart(2, '0') });
    });
    /* регулярные платежи, как у живого пользователя */
    if (d.getDate() === 3) ops.push({ id: uid(), type: 'expense', amount: m2(9, 25), accountId: reserve, categoryId: cHobby, note: pick(['Подписка Netflix', 'Подписка Spotify', 'Облако 200 ГБ']), date: k + 'T08:15' });
    if (d.getDate() === 5) ops.push({ id: uid(), type: 'expense', amount: 750, accountId: card, categoryId: cHome, note: 'Аренда квартиры', date: k + 'T10:00' });
    if (d.getDate() === 7) ops.push({ id: uid(), type: 'expense', amount: m2(78, 130), accountId: card, categoryId: cHome, note: 'Коммуналка и интернет', date: k + 'T11:20' });
    if (d.getDate() === 10) ops.push({ id: uid(), type: 'income', amount: 1400, accountId: card, categoryId: cBonus, note: 'Аванс', date: k + 'T09:05' });
    if (d.getDate() === 25) ops.push({ id: uid(), type: 'income', amount: m2(1560, 1720), accountId: card, categoryId: cBonus, note: 'Зарплата', date: k + 'T09:05' });
    if (d.getDate() === 12 && i > 20) ops.push({ id: uid(), type: 'income', amount: m2(280, 680), accountId: card, categoryId: cBonus, note: 'Фриланс-проект', date: k + 'T18:40' });
    if (d.getDate() === 15) ops.push({ id: uid(), type: 'transfer', amount: m2(120, 220), accountId: card, toAccountId: cash, note: 'Снятие наличных', date: k + 'T13:10' });
    if (d.getDate() === 20) ops.push({ id: uid(), type: 'transfer', amount: m2(150, 320), accountId: card, toAccountId: cube, note: 'В кубышку', date: k + 'T12:05' });
    if (d.getDate() === 26) ops.push({ id: uid(), type: 'transfer', amount: m2(40, 130), accountId: cash, toAccountId: card, note: 'Внести наличные', date: k + 'T19:45' });
    /* крупные нерегулярные покупки: техника и гаджеты */
    if (rnd() < .015) ops.push({ id: uid(), type: 'expense', amount: m2(120, 450), accountId: card, categoryId: cWear, note: pick(['Наушники', 'Чехол и стекло', 'Зарядка и кабели', 'Клавиатура', 'Лампа']), date: k + 'T' + String(10 + Math.floor(rnd() * 9)).padStart(2, '0') + ':' + String(Math.floor(rnd() * 60)).padStart(2, '0') });
    /* пополнения покупок: перевод на защищённый счёт «Накопления» + запись в истории цели */
    if (d.getDate() === 22 && gAcc) {
      const v1 = m2(40, 90), v2 = m2(90, 180);
      ops.push({ id: uid(), type: 'transfer', amount: v1, accountId: card, toAccountId: gAcc.id, note: 'На покупку: Наушники Sony', date: k + 'T20:10' });
      goals[0].history.push({ date: k, v: v1 });
      ops.push({ id: uid(), type: 'transfer', amount: v2, accountId: card, toAccountId: gAcc.id, note: 'На покупку: Отпуск в Италии', date: k + 'T20:15' });
      goals[1].history.push({ date: k, v: v2 });
    }
    /* пара корректировок за полгода */
    if (i === 100) ops.push({ id: uid(), type: 'adjust', amount: 15, adjustSign: -1, accountId: cash, note: 'Сверка наличных', date: k + 'T21:30' });
    if (i === 60) ops.push({ id: uid(), type: 'adjust', amount: 30, adjustSign: 1, accountId: card, note: 'Поправка баланса', date: k + 'T12:00' });
  }
  goals.forEach(g => g.saved = round2(g.history.reduce((s, h) => s + h.v, 0)));
  S.accounts.push(...newAccs);
  S.categories.push(...newCats);
  S.goals.push(...goals);
  S.transactions = S.transactions.concat(ops).sort(byDateDesc);
  /* баннер «Демо-данные» с кнопкой «Очистить» отключаем: он стёр бы и пользовательские операции */
  S.settings.demo = false;
  return { accs: newAccs.length, cats: newCats.length, goals: goals.length, ops: ops.length };
}
