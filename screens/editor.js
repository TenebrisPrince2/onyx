"use strict";
/* screens/editor.js — редактор операции — секция «6. transaction editor».
   Вынесено байт-в-байт; все зависимости (utils/storage/domain/S/nav/toast…) разрешаются в момент вызова через общую глобальную область. */
/* ═══════════════════════════════ 6. transaction editor ═══════════════════════════════ */
let ED = null;
let edSaving = false;
function openEditor(o) {
  o = o || {};
  edSaving = false;
  const t = o.id ? S.transactions.find(x => x.id === o.id) : null;
  const defAcc = UI.accId || (S.accounts.find(a => !a.archived) || {}).id;
  ED = {
    id: t ? t.id : null,
    type: t ? t.type : (o.type || 'expense'),
    accountId: t ? t.accountId : (o.accountId || defAcc),
    toAccountId: t ? t.toAccountId : (o.toAccountId || (S.accounts.filter(a => a.id !== defAcc)[0] || {}).id),
    categoryId: t ? t.categoryId : (o.categoryId || null),
    note: t ? (t.note || '') : (o.note || ''),
    date: t ? t.date.slice(0, 10) : (o.date || iso(new Date())),
    adjustSign: t ? (t.adjustSign || 1) : 1,
    currency: t ? (t.currency || (accById(t.accountId) || {}).currency || S.settings.currency) : (o.currency || (accById(o.accountId || defAcc) || {}).currency || S.settings.currency),
    entry: t ? String(t.amount) : (o.amount ? String(o.amount) : '0'),
    left: null, op: null,
    spVisible: false
  };
  const rec = pushScreen({ id: 'editor', push: true, html: edHTML(), mount: edMount, refresh: () => { rec.el.innerHTML = edHTML(); icons(rec.el); edMount(rec.el); } });
  ED.rec = rec;
  rec.dispose = () => { if (ED.pager) { try { ED.pager.destroy(); } catch (e) {} ED.pager = null; } };
}
const edVal = () => {
  const n = parseFloat(String(ED.entry).replace(',', '.')) || 0;
  if (ED.op !== null && ED.left !== null) return applyOp(ED.left, ED.op, n);
  return ED.left !== null && ED.entry === '' ? ED.left : n;
};
function applyOp(a, op, b) {
  const r = op === '+' ? a + b : op === '−' ? a - b : op === '×' ? a * b : (b === 0 ? a : a / b);
  return Math.round(r * 1e6) / 1e6;
}
/* ─── двухъярусный пейджер категорий: корневые + дети (peek) ─── */
const catChangeFns = [];
const notifyCatsChanged = () => { catChangeFns.slice().forEach(f => { try { f(); } catch (e) {} }); };
function pagerHTML() {
  return '<div class="ccp" id="ccp" role="listbox" aria-label="Категория операции">' +
    '<div class="ccp__box" id="ccpBox">' +
    '<div class="ccp__peek" id="ccpPeek" aria-hidden="true"></div>' +
    '<div class="ccp__stack" id="ccpStack">' +
    '<div class="ccp__lane ccp__lane--kid" id="ccpKidLane"><div class="ccp__track" id="ccpKidTrack"></div></div>' +
    '<div class="ccp__lane ccp__lane--par" id="ccpParLane"><div class="ccp__track" id="ccpParTrack"></div></div>' +
    '</div></div></div>';
}
const ccpRootItems = kind => { const a = [{ id: '__none', icon: 'circle-slash', color: 'var(--t3)', name: 'Без категории' }]; topCats(kind).forEach(c => a.push({ id: c.id, icon: catLuc(c.icon), color: c.color, name: c.name })); a.push({ id: '__add', icon: 'plus', color: 'var(--t1)', name: 'Новая категория', dash: true }); return a; };
const ccpKidItems = parentId => { const a = [{ id: '__up', icon: 'chevrons-down', color: 'var(--t3)', name: 'Наверх' }]; (parentId ? childrenOf(parentId) : []).forEach(c => a.push({ id: c.id, icon: catLuc(c.icon), color: c.color, name: c.name })); a.push({ id: '__add', icon: 'plus', color: 'var(--t1)', name: 'Новая категория', dash: true }); return a; };
function CenterCarousel(track, ops) {
  let STEP = 42; /* 40px плитка + 2px gap (.ccp__track) */
  let items = [], labels = [], n = 0, raf = 0, idleT = null, lastNear = -1, lastEmit = -1, animOn = false;
  /* кэш геометрии: центры элементов и половина ширины трека.
     Читается ТОЛЬКО при build/resize — в скролле одни transform/opacity */
  let centers = [], halfW = 0;
  const onResize = () => {
    if (!track.isConnected) { window.removeEventListener('resize', onResize); return; }
    measure(); paint();
  };
  const ci = i => i < 0 ? 0 : i > n - 1 ? n - 1 : i;
  const caption = i => items.forEach((it, k) => it.setAttribute('aria-selected', k === i ? 'true' : 'false'));
  function measure() {
    if (!n) { centers = []; return; }
    halfW = track.clientWidth / 2;
    centers = items.map(it => it.offsetLeft + it.offsetWidth / 2);
    if (n > 1) STEP = Math.max(1, (centers[n - 1] - centers[0]) / (n - 1));
  }
  function paint() {
    if (centers.length !== n) measure();
    const center = track.scrollLeft + halfW;
    let near = 0, best = Infinity;
    for (let i = 0; i < n; i++) {
      const d = Math.abs(centers[i] - center) / STEP;
      if (d < best) { best = d; near = i; }
      // выбранная (в центре) — 50px (scale 1.25 от базы 40px), остальные — 40px
      items[i].style.setProperty('--sc', Math.max(1, 1.25 - d * .25).toFixed(3));
      items[i].style.setProperty('--op', '1');
      labels[i].style.setProperty('--lop', Math.max(0, 1 - d * 1.4).toFixed(3));
    }
    if (near !== lastNear) { lastNear = near; haptic(5); caption(near); measure(); }
  }
  function clearWillChange() {
    /* PERF: снимаем флаг до forEach, чтобы следующий scroll снова включил will-change */
    animOn = false;
    items.forEach(it => { it.style.willChange = 'auto'; it.classList.remove('ccp--anim'); it.style.transform = 'none'; void it.offsetHeight; it.style.transform = ''; });
  }
  function emit(i) {
    if (i === lastEmit) return;
    lastEmit = i;
    caption(i);
    measure();
    const raw = items[i].dataset.id;
    if (raw === '__none') { ops.onChange(null); return; }
    if (raw.charAt(0) === '_') { haptic(8); (ops.onAction || ops.onAdd || function () {})(raw, i); return; }
    haptic(6);
    ops.onChange(raw);
  }
  function snap() {
    const i = ci(Math.round(track.scrollLeft / STEP));
    const target = i * STEP;
    if (Math.abs(track.scrollLeft - target) > 1) track.scrollTo({ left: target, behavior: 'smooth' });
    emit(i);
  }
  const onScroll = () => {
    /* PERF: scroll стреляет ~60 раз/с; раньше на КАЖДОЕ событие перезаписывались class и
       inline-стиль у всех плиток (при 20 категориях — ~2400 лишних DOM-записей в секунду).
       Включаем will-change один раз на жест, снимаем в clearWillChange по окончании. */
    if (!animOn) { animOn = true; items.forEach(it => { it.classList.add('ccp--anim'); it.style.willChange = 'transform,opacity'; }); }
    clearTimeout(idleT);
    idleT = setTimeout(()=>{ snap(); setTimeout(clearWillChange, 320); }, 140);
    if (!raf) raf = requestAnimationFrame(() => { raf = 0; paint(); });
  };
  track.addEventListener('scroll', onScroll, { passive: true });
  track.addEventListener('click', e => {
    const b = e.target.closest('.ccp__item');
    if (!b) return;
    const i = items.indexOf(b);
    if (i < 0) return;
    const raw = b.dataset.id;
    if (raw.charAt(0) === '_' && raw !== '__none') {
      if (i === lastEmit) { haptic(8); (ops.onAction || ops.onAdd || function () {})(raw, i); return; }
      emit(i);
      return;
    }
    const target = i * STEP;
    if (Math.abs(track.scrollLeft - target) < 2) { emit(i); return; }
    track.scrollTo({ left: target, behavior: 'smooth' });
  });
  function build(list) {
    clearTimeout(idleT); idleT = null;
    track.innerHTML = list.map(i => '<button class="ccp__item' + (i.dash ? ' ccp__item--dash' : '') + '" role="option" data-id="' + i.id + '" data-name="' + esc(i.name) + '" style="--c:' + i.color + '" aria-selected="false"><span class="ccp__tile"><i data-lucide="' + i.icon + '" class="ic"></i></span><span class="ccp__label">' + esc(i.name) + '</span></button>').join('');
    items = Array.from(track.children);
    labels = items.map(it => it.querySelector('.ccp__label'));
    n = items.length;
    measure();
    icons(track);
  }
  window.addEventListener('resize', onResize);
  return {
    setup(list, valueId) {
      build(list);
      clearTimeout(idleT); idleT = null;
      const idx = ci(items.findIndex(it => it.dataset.id === (valueId || '__none')));
      track.scrollLeft = idx * STEP;
      lastNear = lastEmit = idx;
      paint();
      caption(idx);
      measure();
    },
    cur() { return items[lastEmit] ? items[lastEmit].dataset.id : null; }
  };
}
/* эталонная обработка вертикального свайпа ярусов пикера категорий */
function initTierSwipe(zone, api) {
  let sx = 0, sy = 0, dx = 0, dy = 0, axis = null, ly = 0, lt = 0, vel = 0, active = false;
  const refresh = () => {
    /* вертикаль отдаём JS только когда переключение ВООБЩЕ возможно,
       иначе зона не мешает скроллу экрана */
    zone.style.touchAction = (api.isOpen() || api.canOpen()) ? 'pan-x' : 'pan-x pan-y';
  };
  api.refreshTouchAction = refresh;
  refresh();
  const onTouchStart = e => {
    if (e.touches.length !== 1) { axis = null; active = false; return; }
    const t = e.touches[0];
    sx = t.clientX; sy = t.clientY; ly = sy; lt = performance.now();
    dx = dy = 0; axis = null; vel = 0; active = false;
  };
  const onTouchMove = e => {
    const t = e.touches[0];
    if (!t) return;
    dx = t.clientX - sx; dy = t.clientY - sy;
    if (!axis && (Math.abs(dx) > 8 || Math.abs(dy) > 8))
      axis = Math.abs(dy) > Math.abs(dx) ? 'v' : 'h';
    if (axis !== 'v') return;
    const can = dy < 0 ? api.canOpen() : api.isOpen();
    if (!can) return;
    e.preventDefault();
    active = true;
    const now = performance.now();
    vel = .8 * vel + .2 * ((t.clientY - ly) / Math.max(1, now - lt));
    ly = t.clientY; lt = now;
    if (api.follow) api.follow(dy);
  };
  const onTouchEnd = () => {
    if (axis === 'v' && (active || Math.abs(dy) > 24)) {
      if (dy < -36 || vel < -.45) api.open();
      else if (dy > 36 || vel > .45) api.close();
      else api.snapBack();
    }
    axis = null; active = false;
  };
  const onWheel = e => {
    if (e.deltaY < -24 && api.canOpen()) api.open();
    else if (e.deltaY > 24 && api.isOpen()) api.close();
  };
  zone.addEventListener('touchstart', onTouchStart, { passive: true });
  zone.addEventListener('touchmove', onTouchMove, { passive: false });
  zone.addEventListener('touchend', onTouchEnd, { passive: true });
  zone.addEventListener('touchcancel', onTouchEnd, { passive: true });
  zone.addEventListener('wheel', onWheel, { passive: true });
  return {
    refresh,
    destroy() {
      zone.removeEventListener('touchstart', onTouchStart);
      zone.removeEventListener('touchmove', onTouchMove);
      zone.removeEventListener('touchend', onTouchEnd);
      zone.removeEventListener('touchcancel', onTouchEnd);
      zone.removeEventListener('wheel', onWheel);
    }
  };
}
let activePager = null;
function bindCatPager(el, opts) {
  if (activePager) { try { activePager.destroy(); } catch (e) {} }
  const getVal = typeof opts.get === 'function' ? opts.get : () => opts.value;
  const box = el.querySelector('#ccpBox');
  const stack = el.querySelector('#ccpStack');
  const peek = el.querySelector('#ccpPeek');
  const kidLane = el.querySelector('#ccpKidLane');
  const parLane = el.querySelector('#ccpParLane');
  const PEEK = 18;
  let state = 'top';
  let parentSel = null;
  let dead = false;
  let wcT = 0;
  const hasKidsOf = p => p ? childrenOf(p).length > 0 : false;

  const carPar = CenterCarousel(el.querySelector('#ccpParTrack'), {
    onAction: () => openCategoryScreen({ kind: opts.kind, parentId: parentSel }, pickDone),
    onChange: id => { opts.onChange(id); afterParPick(); }
  });
  const carKid = CenterCarousel(el.querySelector('#ccpKidTrack'), {
    onAction: raw => { if (raw === '__up') setState('top'); else openCategoryScreen({ kind: opts.kind, parentId: parentSel }, pickDone); },
    onChange: id => { opts.onChange(id); }
  });

  function recenterKids() {
    const kids = parentSel ? childrenOf(parentSel) : [];
    const val = getVal(), sel = val ? catById(val) : null;
    let center;
    if (sel && sel.parentId === parentSel) center = val;
    else if (kids.length) center = kids[0].id;
    else center = '__add';
    carKid.setup(ccpKidItems(parentSel), center);
  }
  function rebuildKids() {
    recenterKids();
    if (state === 'kids' && !hasKidsOf(parentSel)) { state = 'top'; haptic(6); }
    applyState();
  }
  function setState(s) {
    if (s === state) return false;
    if (s === 'kids' && !hasKidsOf(parentSel)) return false;
    state = s;
    haptic(6);
    if (s === 'kids') recenterKids();
    applyState();
    return true;
  }
  function applyState() {
    const h = parLane.offsetHeight;
    const peekOn = state === 'kids' || hasKidsOf(parentSel);
    el.classList.toggle('ccp--kids', state === 'kids');
    if (tierApi.refreshTouchAction) tierApi.refreshTouchAction();
    box.style.height = (h + (peekOn ? PEEK : 0)) + 'px';
    /* will-change только на время анимации трека, не постоянно */
    stack.style.willChange = 'transform';
    clearTimeout(wcT);
    wcT = setTimeout(() => { stack.style.willChange = ''; }, 380);
    stack.style.transform = 'translateY(' + (state === 'top' ? (peekOn ? -(h - PEEK) : -h) : 0) + 'px)';
    kidLane.classList.toggle('ccp__lane--dim', state === 'top');
    parLane.classList.toggle('ccp__lane--dim', state === 'kids');
    peek.style.height = (peekOn ? PEEK : 0) + 'px';
    peek.style.top = state === 'top' ? '0px' : 'auto';
    peek.style.bottom = state === 'kids' ? '0px' : 'auto';
    peek.style.opacity = peekOn ? '1' : '0';
    peek.style.pointerEvents = peekOn ? 'auto' : 'none';
  }
  function afterParPick() {
    const cur = carPar.cur();
    parentSel = (cur && cur !== '__none' && cur !== '__add') ? cur : null;
    rebuildKids();
  }
  function resync() {
    if (dead) return;
    let value = getVal();
    if (value && value !== '__none' && !catById(value)) { value = null; opts.onChange(null); }
    const sel = value ? catById(value) : null;
    let par = null;
    if (sel && sel.parentId) par = catById(sel.parentId) || null;
    else if (sel) par = sel;
    if (!par && parentSel) par = catById(parentSel) || null;
    if (par && par.parentId) par = null;
    parentSel = par ? par.id : null;
    carPar.setup(ccpRootItems(opts.kind), parentSel);
    let s = 'top';
    if (sel && sel.parentId && sel.parentId === parentSel) s = 'kids';
    else if (!sel && parentSel && hasKidsOf(parentSel)) s = 'kids';
    state = s;
    rebuildKids();
    applyState();
  }
  function pickDone(c) {
    opts.onChange(c.id);
    resync();
  }

  const centeredParentId = () => {
    const cur = carPar.cur();
    return (cur && cur !== '__none' && cur !== '__add') ? cur : null;
  };
  /* API эталонного свайпа ярусов: зона = весь пикер (оба яруса + кусочек) */
  const tierApi = {
    isOpen: () => state === 'kids',
    canOpen: () => {
      if (state !== 'top') return false;
      const pid = centeredParentId();
      if (!pid) return false;
      parentSel = pid;
      return hasKidsOf(pid);
    },
    open: () => { setState('kids'); },
    close: () => { setState('top'); },
    follow: dy => {
      const h = parLane.offsetHeight;
      const pk = hasKidsOf(parentSel) ? PEEK : 0;
      const base = state === 'top' ? -(h - pk) : 0;
      const dir = state === 'top' ? 1 : -1;
      stack.classList.add('dragging');
      stack.style.willChange = 'transform';
      clearTimeout(wcT);
      stack.style.transform = 'translateY(' + (base + dir * clamp(Math.abs(dy), 0, PEEK + 14)) + 'px)';
    },
    snapBack: () => { stack.classList.remove('dragging'); applyState(); }
  };
  const tierSwipe = initTierSwipe(el, tierApi);
  const onPeek = () => { if (state === 'top') setState('kids'); else setState('top'); };
  peek.addEventListener('click', onPeek);
  const onLoad = () => applyState();
  if (document.readyState === 'complete') onLoad();
  else window.addEventListener('load', onLoad, { once: true });

  const me = {
    resync,
    destroy() {
      dead = true;
      if (activePager === me) activePager = null;
      if (tierSwipe) tierSwipe.destroy();
      clearTimeout(wcT);
      peek.removeEventListener('click', onPeek);
      window.removeEventListener('load', onLoad);
      const i = catChangeFns.indexOf(resync);
      if (i > -1) catChangeFns.splice(i, 1);
    }
  };
  activePager = me;
  catChangeFns.push(resync);
  me.resync();
  return me;
}
function edHTML() {
  const isT = ED.type === 'transfer', isA = ED.type === 'adjust';
  const acc = accById(ED.accountId) || {}, to = accById(ED.toAccountId) || {};
  const types = [['expense', 'Расход', ARR_OUT], ['income', 'Доход', ARR_IN], ['transfer', 'Перевод', 'arrow-left-right']];
  const v = edVal();
  const vcur = ED.currency || acc.currency || S.settings.currency;
  const col = ED.type === 'income' ? '#00bc7d' : ED.type === 'expense' ? 'var(--t1)' : 'var(--t2)';
  const sign = v === 0 ? '' : ED.type === 'expense' ? '−' : ED.type === 'income' ? '+' : (isA && ED.adjustSign < 0 ? '−' : '');
  const curSym = CUR[vcur] ? CUR[vcur].s : esc(vcur);
  /* ── перевод: шапка-карточка как на референсе ── */
  const edTxn = ED.id ? S.transactions.find(x => x.id === ED.id) : null;
  const edTime = edTxn && edTxn.date.slice(11) ? edTxn.date.slice(11) : new Date().toTimeString().slice(0, 5);
  const trDate = '<i data-lucide="calendar" class="ic ic-s"></i>' + (ED.date === iso(new Date()) ? 'Сегодня, ' + edTime : shortDate(ED.date) + ', ' + edTime);
  const trTopHTML = '<div class="tr-top">' +
    '<button class="tr-card" data-act="ed-acc">' +
    '<span class="tr-pill"><span class="tr-pill__ic" style="--c:' + (acc.color || 'var(--t2)') + '"><i data-lucide="' + (acc.icon || 'wallet') + '" class="ic"></i></span>' +
    '<span class="tr-pill__tx"><b>' + esc(acc.name || 'Счёт') + '</b><small>' + money(accBalance(ED.accountId), acc.currency) + '</small></span></span>' +
    '<span class="tr-card__amt" id="edAmt" style="color:var(--t1)">' + money(v, vcur, { exact: true, trim: v % 1 === 0 }) + '</span>' +
    '</button>' +
    '<span class="ed__expr" style="display:none"></span>' +
    '<button class="tr-swap" data-act="tr-swap" aria-label="Поменять счета местами"><i data-lucide="arrow-up-down" class="ic"></i></button>' +
    '<button class="tr-pill" data-act="ed-acc2" style="--c:' + (to.color || 'var(--t2)') + ';margin-top:12px"><span class="tr-pill__ic"><i data-lucide="' + (to.icon || 'wallet') + '" class="ic"></i></span>' +
    '<span class="tr-pill__tx"><b>' + esc(to.name || 'Счёт') + '</b><small>' + money(accBalance(ED.toAccountId), to.currency) + '</small></span></button>' +
    '<div class="tr-mid"><div class="tr-amt2" id="trAmt2" style="color:var(--inc)">' + money(v, vcur, { exact: true, trim: v % 1 === 0 }) + '</div></div>' +
    '<div class="tr-foot"><button class="chip chip--flat" data-act="ed-date">' + trDate + '</button></div>' +
    '</div>';

  return '<div class="shead">' +
    '<button class="iconbtn" data-act="close" aria-label="Закрыть"><i data-lucide="x" class="ic"></i></button>' +
    '<div style="flex:1;max-width:290px;margin:0 auto;display:flex;justify-content:center">' + (isA ? '<div class="seg" style="--n:2;--i:' + (ED.adjustSign > 0 ? 0 : 1) + '" data-seg="asign" data-v="' + (ED.adjustSign > 0 ? 'p' : 'm') + '"><span class="seg__thumb"></span>' +
      '<button data-segv="p" aria-selected="' + (ED.adjustSign > 0) + '">Прибавить</button><button data-segv="m" aria-selected="' + (ED.adjustSign < 0) + '">Вычесть</button></div>'
      : pillSegHTML('type', ED.type, types)) + '</div>' +
    (isT ? '<span style="width:42px;flex:none"></span>' : '<button class="iconbtn" data-act="ed-more" aria-label="Ещё"><i data-lucide="ellipsis-vertical" class="ic"></i></button>') + '</div>' +

    '<div class="ed">' +
    (isT ? trTopHTML : '') +
    (isT ? '' :
    '<div class="ed__amtwrap">' +
    '<div class="ed__amt" style="color:' + col + '" id="edAmt">' + sign + money(v, vcur, { exact: true, trim: v % 1 === 0 }) + '</div>' +
    '<div class="ed__expr">' + (ED.left !== null && ED.op ? money(ED.left, null, { exact: true }) + ' ' + ED.op + ' ' + (ED.entry || '') : (isA ? 'Новый баланс: ' + money(accBalance(ED.accountId) + v * ED.adjustSign, acc.currency, { exact: true }) : '')) + '</div>' +
    '</div>' +
    '<div id="spHost"></div>') +

    (isT ? '' : '<div class="ed__meta">' +
      '<div class="ed__chips">' +
      '<button class="chip chip--flat" data-act="ed-acc" style="flex:1;min-width:0;max-width:174px;max-height:44px;padding:4px;"><span style="width:36px;height:36px;border-radius:50%;display:grid;place-items:center;flex:none;background:color-mix(in oklab,' + (acc.color || 'var(--t2)') + ' 15%,transparent);box-shadow:inset 0 0 0 .5px color-mix(in oklab,' + (acc.color || 'var(--t2)') + ' 22%,transparent),inset 0 1px 0 oklch(100% 0 0 / .05);color:' + (acc.color || 'var(--t2)') + '"><i data-lucide="' + (acc.icon || 'wallet') + '" class="ic" style="width:18px;height:18px"></i></span><span class="chip__tx" style="flex:1;min-width:0;overflow:hidden;text-align:left"><span class="chip__t" style="display:block;width:100%;text-align:left;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + esc(acc.name || 'Счёт') + '</span><span class="chip__s" style="display:block;width:100%;text-align:left;font-size:12px;color:#747474;font-variant-numeric:tabular-nums;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + money(accBalance(ED.accountId), acc.currency) + '</span></span></button>' +
      '<button class="chip chip--flat" data-act="ed-date">' + (ED.date === iso(new Date()) ? 'Сегодня' : shortDate(ED.date)) + '</button>' +
      '<button class="chip chip--flat" data-act="ed-cur">' + curSym + '</button>' +
      '</div>' +
      '<input class="note" id="edNote" placeholder="Заметка" value="' + esc(ED.note) + '" maxlength="120">' +
      (isA ? '' : pagerHTML()) +
      '</div>') +
    (isT ? '<div class="tr-note">' +
      '<input class="note" id="edNote" placeholder="Заметка" value="' + esc(ED.note) + '" maxlength="120">' +
      '</div>' : '') +

    '<div class="keypad" style="--cols:' + (S.settings.calculator ? 4 : 3) + '">' +
    ['1', '2', '3', '+', '4', '5', '6', '−', '7', '8', '9', '×', ',', '0', 'bs', '÷'].filter(k => S.settings.calculator || !'+−×÷'.includes(k)).map(k => {
      if (k === 'bs') return '<button class="key key--util" data-k="bs" aria-label="Стереть"><i data-lucide="delete" class="ic ic-l"></i></button>';
      const op = '+−×÷'.includes(k);
      return '<button class="key' + (op ? ' key--op' : (k === ',' ? ' key--util' : '')) + '" data-k="' + k + '"' + (op && ED.op === k ? ' data-armed="1"' : '') + '>' + k + '</button>';
    }).join('') + '</div>' +

    '<div class="sfoot"><button class="btn btn--chrome" id="edSave"' + (v <= 0 && !isA ? ' disabled' : '') + '>' + (ED.id ? 'Сохранить изменения' : 'Сохранить') + '</button></div>' +
    '</div>';
}
function edMount(el) {
  if (ED.pager) { try { ED.pager.destroy(); } catch (e) {} ED.pager = null; }
  const patch = () => { ED.rec.refresh(); };
  bindSeg(el, 'type', v => { ED.type = v; if (v !== 'expense' && v !== 'income') ED.categoryId = null; else { const c = catsOf(v); if (ED.categoryId && !c.some(x => x.id === ED.categoryId)) ED.categoryId = null; } patch(); });
  bindSeg(el, 'asign', v => { ED.adjustSign = v === 'p' ? 1 : -1; patch(); });
  const note = el.querySelector('#edNote');
  if (note) note.oninput = () => { ED.note = note.value; };
  const ccp = el.querySelector('#ccp');
  if (ccp) ED.pager = bindCatPager(ccp, {
    kind: ED.type === 'income' ? 'income' : 'expense',
    value: ED.categoryId,
    get: () => ED.categoryId,
    onChange: id => { ED.categoryId = id; }
  });
  const amtEl = el.querySelector('#edAmt');
  const redrawAmt = () => {
    const v = edVal(), acc = accById(ED.accountId) || {}, vcur = ED.currency || acc.currency || S.settings.currency;
    const sign = v === 0 ? '' : ED.type === 'expense' ? '−' : ED.type === 'income' ? '+' : (ED.type === 'adjust' && ED.adjustSign < 0 ? '−' : '');
    const col = ED.type === 'income' ? '#00bc7d' : ED.type === 'expense' || ED.type === 'transfer' ? 'var(--t1)' : 'var(--t2)';
    amtEl.style.color = col;
    amtEl.innerHTML = sign + money(v, vcur, { exact: true, trim: v % 1 === 0 });
    amtEl.classList.add('bump'); setTimeout(() => amtEl.classList.remove('bump'), 130);
    const m2 = el.querySelector('#trAmt2');
    if (m2) { m2.innerHTML = money(v, vcur, { exact: true, trim: v % 1 === 0 }); m2.classList.add('bump'); setTimeout(() => m2.classList.remove('bump'), 130); }
    el.querySelector('.ed__expr').innerHTML = ED.left !== null && ED.op ? money(ED.left, null, { exact: true }) + ' ' + ED.op + ' ' + (ED.entry || '')
      : (ED.type === 'adjust' ? 'Новый баланс: ' + money(accBalance(ED.accountId) + v * ED.adjustSign, acc.currency, { exact: true }) : '');
    el.querySelectorAll('.key--op').forEach(k => k.dataset.armed = k.dataset.k === ED.op ? '1' : '');
    el.querySelector('#edSave').disabled = v <= 0 && ED.type !== 'adjust';
    smartPlanUpdate(el);
  };
  el.querySelectorAll('.key').forEach(k => {
    let lp = null;
    const press = () => {
      const key = k.dataset.k; haptic(5);
      if (key === 'bs') { ED.entry = String(ED.entry).slice(0, -1) || '0'; }
      else if ('+−×÷'.includes(key)) {
        const n = parseFloat(String(ED.entry).replace(',', '.')) || 0;
        ED.left = ED.left !== null && ED.op ? applyOp(ED.left, ED.op, n) : n;
        ED.op = key; ED.entry = '';
      } else if (key === ',') { if (!String(ED.entry).includes(',')) ED.entry = (ED.entry || '0') + ','; }
      else {
        if (ED.entry === '0') ED.entry = key;
        else if (String(ED.entry).replace(/[^0-9]/g, '').length < 11) {
          const parts = String(ED.entry).split(',');
          if (parts[1] && parts[1].length >= 2) return;
          ED.entry = ED.entry + key;
        }
      }
      redrawAmt();
    };
    k.onclick = press;
    k.addEventListener('pointerdown', () => { if (k.dataset.k === 'bs') lp = setTimeout(() => { ED.entry = '0'; ED.left = null; ED.op = null; haptic(12); redrawAmt(); }, 480); });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(ev => k.addEventListener(ev, () => clearTimeout(lp)));
  });
  el.querySelector('#edSave').onclick = saveEditor;
  el.querySelectorAll('[data-act]').forEach(b => {
    const a = b.dataset.act;
    if (a === 'tr-swap') b.onclick = () => { haptic(10); const sw = ED.accountId; ED.accountId = ED.toAccountId; ED.toAccountId = sw; patch(); };
    if (a === 'ed-acc') b.onclick = () => pickAccount(id => { ED.accountId = id; patch(); }, { exclude: ED.type === 'transfer' ? ED.toAccountId : null, goals: true, amount: () => edVal() });
    if (a === 'ed-acc2') b.onclick = () => pickAccount(id => { ED.toAccountId = id; patch(); }, { exclude: ED.accountId, goals: true, amount: () => edVal() });
    if (a === 'ed-date') b.onclick = () => pickDate(ED.date, d => { ED.date = d; patch(); });
    if (a === 'ed-cur') b.onclick = () => { haptic(); ED.currency = CUR_ORDER[(CUR_ORDER.indexOf(ED.currency) + 1) % CUR_ORDER.length]; patch(); };
    if (a === 'all-cats') b.onclick = () => pickCategory(ED.type === 'income' ? 'income' : 'expense', id => { ED.categoryId = id; patch(); });
    if (a === 'new-cat') b.onclick = () => openCategoryScreen({ kind: ED.type === 'income' ? 'income' : 'expense' }, c => { ED.categoryId = c.id; patch(); });
    if (a === 'ed-more') b.onclick = edMore;
    if (a === 'close') b.onclick = () => popScreen();
  });
  smartPlanUpdate(el);
}
function edMore() {
  const items = [];
  if (ED.type === 'income') items.push(['sparkles', ED.spVisible ? 'Скрыть умный план' : 'Умный план', () => { ED.spVisible = !ED.spVisible; ED.rec.refresh(); }]);
  if (ED.type !== 'adjust') items.push(['sliders-horizontal', 'Корректировка баланса', () => { ED.type = 'adjust'; ED.categoryId = null; ED.rec.refresh(); }]);
  else items.push(['<span style="display:flex;color:var(--exp)">' + ARR_OUT + '</span>', 'Обычная операция', () => { ED.type = 'expense'; ED.rec.refresh(); }]);
  items.push(['repeat', 'Сделать повторяющейся', () => makeTemplate()]);
  items.push(['copy', 'Дублировать', () => { const v = edVal(); closeSheet(); popScreen(); setTimeout(() => openEditor({ type: ED.type, amount: v, accountId: ED.accountId, categoryId: ED.categoryId, note: ED.note, currency: ED.currency }), 260); }]);
  if (ED.id) items.push(['trash-2', 'Удалить операцию', async () => { closeSheet(); if (await confirmSheet({ title: 'Удалить операцию?', text: 'Действие можно отменить сразу после удаления.', ok: 'Удалить', danger: true })) { delTxn(ED.id); popScreen(); } }]);
  openSheet({
    title: 'Операция',
    html: '<div class="list">' + items.map((i, n) => '<button class="item" data-i="' + n + '">' + (String(i[0]).indexOf('<svg') === 0 ? '<span class="item__ic" style="display:flex">' + i[0] + '</span>' : '<i data-lucide="' + i[0] + '" class="ic item__ic"></i>') + '<span class="item__t">' + i[1] + '</span></button>').join('') + '</div>',
    mount(sh) { sh.querySelectorAll('[data-i]').forEach(b => b.onclick = () => { const f = items[+b.dataset.i][2]; if (items[+b.dataset.i][1].startsWith('Удалить') || items[+b.dataset.i][1] === 'Дублировать') { f(); } else { closeSheet(); f(); } }); }
  });
}
function makeTemplate() {
  const v = edVal();
  if (v <= 0) { toast('Сначала введите сумму'); return; }
  S.templates.push({ id: uid(), name: ED.note || (catById(ED.categoryId) || {}).name || 'Повтор', type: ED.type, amount: v, accountId: ED.accountId, toAccountId: ED.toAccountId, categoryId: ED.categoryId, note: ED.note, every: 'month', next: iso(addM(new Date(ED.date + 'T00:00:00'), 1)) });
  save(); closeSheet(); toast('Будет повторяться каждый месяц');
}
function saveEditor() {
  if (edSaving) return;
  edSaving = true;
  const saveBtn = ED.rec && ED.rec.el && ED.rec.el.querySelector('#edSave');
  if (saveBtn) saveBtn.disabled = true;
  const v = edVal();
  const edFail = msg => { edSaving = false; if (saveBtn) saveBtn.disabled = false; toast(msg); };
  if (ED.type === 'transfer' && ED.accountId === ED.toAccountId) { edFail('Выберите разные счета'); return; }
  if (!isFinite(v) || (v <= 0 && ED.type !== 'adjust')) { edFail('Введите сумму'); return; }
  const t = {
    id: ED.id || uid(), type: ED.type, amount: Math.abs(v), accountId: ED.accountId,
    toAccountId: ED.type === 'transfer' ? ED.toAccountId : undefined,
    categoryId: (ED.type === 'expense' || ED.type === 'income') ? ED.categoryId : undefined,
    adjustSign: ED.type === 'adjust' ? ED.adjustSign : undefined,
    currency: ED.currency && ED.currency !== (accById(ED.accountId) || {}).currency ? ED.currency : undefined,
    note: ED.note.trim(), date: ED.date + 'T' + new Date().toTimeString().slice(0, 5)
  };
  if (ED.id) {
    const existing = S.transactions.find(x => x.id === ED.id);
    if (existing) t.date = ED.date + 'T' + (existing.date.slice(11) || '12:00');
    Store.updateTransaction(ED.id, t);
  } else {
    Store.addTransaction(t);
  }
  haptic(12); popScreen();
  const label = t.type === 'income' ? '+' : t.type === 'expense' ? '−' : '';
  toast((ED.id ? 'Обновлено · ' : 'Добавлено · ') + label + money(t.amount, catCur(t)) + (t.note ? ' · ' + esc(t.note) : ''));
  setTimeout(() => { render(); refreshTop(); }, 60);
}
async function delTxn(id) {
  const t = S.transactions.find(x=>x.id===id);
  const title = t ? ( (catById(t.categoryId)||{}).name || (t.type==='transfer'?'Перевод':t.type==='income'?'Доход':'Расход')) : 'Операция';
  const hint = 'Операция будет удалена безвозвратно';
  const cat = t ? catById(t.categoryId) : null;
  const icon = t ? (t.type==='transfer'?'arrow-left-right': t.type==='income' ? 'trending-up' : (cat ? catLuc(cat.icon) : 'receipt')) : 'trash-2';
  const color = cat ? cat.color : 'var(--t2)';
  const ok = await confirmSheet({ title:'Удалить операцию', hint, entityName: t ? (t.note || title) : '', icon, color, ok:'Удалить', danger:true });
  if (!ok) return;
  const i = S.transactions.findIndex(x=>x.id===id);
  if (i < 0) return;
  const removed = Object.assign({}, S.transactions[i]);
  storePaused++; try { Store.deleteTransaction(id); } finally { storePaused--; }
  haptic(12);
  const node = $('#view').querySelector('.sw[data-id="' + id + '"]');
  if (node) { node.style.height = node.offsetHeight + 'px'; node.classList.add('gone'); requestAnimationFrame(() => { node.style.height = '0px'; node.style.marginTop = '-6px'; }); setTimeout(() => render(true), 280); }
  else render(true);
  toast('Удалено', { label: 'Вернуть', fn: () => { Store.restoreTransaction(removed, i); render(true); refreshTop(); toast('Операция восстановлена'); } }, { icon: 'trash-2' });
}
