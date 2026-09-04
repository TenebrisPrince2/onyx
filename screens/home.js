"use strict";
/* screens/home.js — home + ledger + аналитика (asRender) — секции «5. home».
   Вынесено байт-в-байт; все зависимости (utils/storage/domain/S/nav/toast…) разрешаются в момент вызова через общую глобальную область. */
/* ═══════════════════════════════ 5. home ═══════════════════════════════ */
let lastHeroBal = null, lastHeroCur = null;
/* PERF: токен поколения — если render() успел выполниться ещё раз, предыдущая цепочка
   requestAnimationFrame останавливается. Раньше при быстрых правках одновременно крутились
   несколько анимаций, каждая из которых 33 кадра писала textContent в уже откреплённый узел. */
let heroAnimToken = 0;
function animateNumber(el, from, to, cur) {
  const t0 = performance.now(), dur = 550;
  const ease = t => 1 - Math.pow(1 - t, 3);
  const numEl = el.querySelector('#heroNum');
  const isBYN = (cur || S.settings.currency) === 'BYN';
  const myToken = ++heroAnimToken;
  function step(now) {
    if (myToken !== heroAnimToken) return; /* устаревшая анимация — выходим */
    const t = Math.min(1, (now - t0) / dur);
    const val = from + (to - from) * ease(t);
    const round = !S.settings.roundTotals;
    const exact = !S.settings.roundTotals;
    let n = exact ? Math.round(val * 100) / 100 : Math.round(val);
    if (!isFinite(n)) n = 0;
    const dec = exact ? (Number.isInteger(n) ? 0 : 2) : 0;
    const numStr = (n < 0 ? '−' : '') + nf(Math.abs(n), dec);
    if (numEl) numEl.textContent = numStr;
    else el.textContent = numStr + (isBYN ? '\u00A0' : ' ') + (CUR[cur] ? (CUR[cur].html ? '' : CUR[cur].s) : cur);
    if (t < 1) requestAnimationFrame(step);
    else if (numEl) {
      const finalN = exact ? Math.round(to * 100) / 100 : Math.round(to);
      const fd = exact ? (Number.isInteger(finalN) ? 0 : 2) : 0;
      numEl.textContent = (finalN < 0 ? '−' : '') + nf(Math.abs(finalN), fd);
    }
  }
  requestAnimationFrame(step);
}
function render(keepScroll) {
  const view = $('#view');
  const sc = keepScroll ? view.scrollTop : 0;
  /* PERF: при частичном обновлении (keepScroll) не периграем каскадную анимацию появления
     строк — 50+ одновременных fadeUp на телефоне дают пропуск кадров. Полный рендер
     (открытие экрана) анимируется как раньше. */
  view.classList.toggle('no-stagger', !!keepScroll);
  /* FIX: openRow/delOpenRow — ссылки на DOM-узлы, которые живут дольше разметки.
     После подмены innerHTML они удерживали в памяти откреплённые поддеревья и
     заставляли браузер считать их «живыми». Чистим, если узел уже не в документе. */
  if (openRow && !openRow.isConnected) openRow = null;
  if (delOpenRow && !delOpenRow.isConnected) delOpenRow = null;
  view.innerHTML = viewLedger();
  renderTop(); icons(view); icons($('#topbar'));   /* PERF: скоуп вместо скана всего документа */
  view.scrollTop = sc;
  enableSwipe(view, true);
  const heroEl = view.querySelector('.hero__amt');
  if (heroEl && !S.settings.hideAmounts && lastHeroBal !== null && lastHeroCur === UI._heroCur && lastHeroBal !== UI._heroBal) {
    animateNumber(heroEl, lastHeroBal, UI._heroBal, UI._heroCur);
  }
  lastHeroBal = UI._heroBal; lastHeroCur = UI._heroCur;
}

/* ---------- ledger ---------- */
/* PERF: кэш подготовленной модели ledger: фильтрация по счёту/периоду/дню, потоки
   income/expense, валюта и баланс. Ключ кэша — ссылка на отсортированный массив
   (меняется ТОЛЬКО после save(), то есть при реальном изменении данных), плюс
   UI.accId и границы периода/день. Открытие модалок, скролл, лимит «Показать ещё»
   и прочие UI-флаги ключ не меняют — модель при них не пересчитывается. */
let _ledgerModel = null;
function ledgerModel(r, isAll) {
  const src = sortedTxns();
  const pk = r.key + ':' + iso(r.from) + ':' + iso(r.to);
  const day = UI.ledger.day || '';
  if (_ledgerModel && _ledgerModel.src === src && _ledgerModel.accId === UI.accId && _ledgerModel.pk === pk && _ledgerModel.day === day) return _ledgerModel;
  const list = isAll
    ? src.filter(t => !UI.accId || t.accountId === UI.accId || t.toAccountId === UI.accId)
    : scopeTxns(r, UI.accId, src);
  // day filter only when not all
  let dayList = list;
  if (!isAll && UI.ledger.day) {
    if (UI.ledger.day < iso(r.from) || UI.ledger.day > iso(r.to)) UI.ledger.day = null;
    else dayList = list.filter(t => dkey(t) === UI.ledger.day);
  } else if (isAll && UI.ledger.day) {
    dayList = list.filter(t => dkey(t) === UI.ledger.day);
  }
  const inc = flowOf(list, 'income'), exp = flowOf(list, 'expense');
  const cur = UI.accId ? accById(UI.accId).currency : S.settings.currency;
  const bal = UI.accId ? accBalance(UI.accId) : (totalsByCur()[cur] || 0);
  _ledgerModel = { src: src, accId: UI.accId, pk: pk, day: day, list: list, dayList: dayList, inc: inc, exp: exp, cur: cur, bal: bal };
  return _ledgerModel;
}
/* PERF: группировка по дням и дневные итоги кэшируются по ссылке на dayList (она новая
   только вместе с моделью). Порядок дней прежний: sort().reverse(). */
let _ledgerGroups = null;
function ledgerGroups(dayList) {
  if (_ledgerGroups && _ledgerGroups.src === dayList) return _ledgerGroups;
  const groups = {};
  dayList.forEach(t => { (groups[dkey(t)] = groups[dkey(t)] || []).push(t); });
  const dayKeys = Object.keys(groups).sort().reverse();
  const dayTot = {};
  dayKeys.forEach(k => { const g = groups[k]; dayTot[k] = { i: flowOf(g, 'income'), o: flowOf(g, 'expense') }; });
  _ledgerGroups = { src: dayList, groups: groups, dayKeys: dayKeys, dayTot: dayTot };
  return _ledgerGroups;
}
/* PERF: кэш HTML строк (txnRow). Строка зависит от самой транзакции, её позиции —
   только первых 12 (--i ограничен Math.min(i,12)), скрытия сумм и данных (счета/
   категории). Эпоха кэша — ссылка на отсортированный массив: любое изменение данных
   через save() даёт новый массив и сбрасывает кэш строк. */
let _rowCache = { src: null, hide: null, map: new Map() };
function txnRowCached(t, i, src) {
  const hide = !!S.settings.hideAmounts;
  if (_rowCache.src !== src || _rowCache.hide !== hide) { _rowCache.src = src; _rowCache.hide = hide; _rowCache.map = new Map(); }
  const k = (i < 12 ? i : 12) + '|' + t.id;
  let html = _rowCache.map.get(k);
  if (html === undefined) { html = txnRow(t, i); _rowCache.map.set(k, html); }
  return html;
}
function viewLedger() {
  const r = ledgerPeriodRange();
  const isAll = r.key === 'all';
  /* PERF: модель (фильтры, потоки, баланс) из кэша — пересчёт только при изменении
     данных (save()) или фильтров счёта/периода/дня (см. ledgerModel). */
  const m = ledgerModel(r, isAll);
  const list = m.list, dayList = m.dayList, inc = m.inc, exp = m.exp, cur = m.cur, bal = m.bal;
  /* hero всегда показывает суммарный баланс; выбранный период влияет только на потоки и список */
  UI._heroBal = bal; UI._heroCur = cur;

  const dayActive = !!UI.ledger.day;
  /* период на Home меняется ТОЛЬКО через шторку pick-period; стрелок mprev/mnext больше нет */
  let html = '<div class="balper">' +
    '<span class="balper__lab">Баланс за</span>' +
    '<button class="balper__pill" data-act="pick-period">' + esc(dayActive ? dayLabel(UI.ledger.day) : r.label) + '</button>' +
    (dayActive ? '<button class="iconbtn" data-act="clear-day" aria-label="Весь месяц"><i data-lucide="x" class="ic"></i></button>' : '') +
    '</div>';

  // split hero amount into num + icon so icon not recreated each frame — pure string ops (no DOM during ledger compute)
  const hm = money(bal, cur, { exact: !S.settings.roundTotals });
  const hasNbrb = hm.indexOf('nbrb-icon') !== -1;
  let heroAmtHTML = '';
  if (hasNbrb) {
    const iconHTML = '<i class="nbrb-icon">BYN</i>';
    const numPart = hm.replace(iconHTML, '').replace('\u00A0', ' ').trim() || hm.replace(/<[^>]+>/g,'').trim();
    // money for BYN is like "1 234,56\u00A0<i ...>BYN</i>" — strip tag, keep nbsp
    const cleanNum = hm.split('<i')[0].trim();
    heroAmtHTML = '<span id="heroNum" class="money-num">' + cleanNum + '</span><i class="nbrb-icon">BYN</i>';
  } else {
    /* без пробела между суммой и знаком валюты: убираем последний nbsp (знак-суффикс) или первый (знак-префикс, $) */
    const c = CUR[cur] || { s: cur, pre: false };
    heroAmtHTML = '<span id="heroNum" class="money-num">' + (c.pre ? hm.replace('\u00A0', '') : hm.replace(/\u00A0(?=[^\u00A0]*$)/, '')) + '</span>';
  }
  html += '<section class="hero hero--home">' +
    '<h1 class="hero__amt' + (S.settings.hideAmounts ? ' hidden-amt' : '') + '" data-act="toggle-hide">' + heroAmtHTML + '</h1>' +
'<div class="hero__flow">' +
    '<div class="flowi flowi--in">' + ARR_IN + '<b>' + amt(inc, cur) + '</b></div>' +
    '<div class="flowi flowi--out">' + ARR_OUT + '<b>' + amt(exp, cur) + '</b></div>' +
    '</div></section>' +
    '<button class="insbtn" data-act="insights"><i data-lucide="sparkles" class="ic"></i>Инсайты</button>';

  if (S.settings.demo) html += '<div class="banner"><span class="tile tile--sm" style="--c:var(--t2)"><i data-lucide="sparkles" class="ic"></i></span>' +
    '<p><b>Демо-данные</b>63 дня операций, чтобы всё пощупать</p><button class="btn btn--sm btn--ghost" style="min-height:36px;padding:0 14px" data-act="wipe-demo">Очистить</button></div>';

  html += '<div class="dayhead" style="padding-top:26px"><b>История</b><span>' + dayList.length + ' оп.</span></div>';

  if (!dayList.length) {
    html += UI.ledger.day ? emptyLedger(UI.ledger.day) : emptyLedger();
  } else {
    /* PERF: группы и дневные итоги — из кэша (ledgerGroups), строки — из кэша (txnRowCached);
       пересчёт только при изменении модели/данных */
    const gm = ledgerGroups(dayList);
    const groups = gm.groups, dayKeys = gm.dayKeys, dayTot = gm.dayTot;
    let n = 0;
    const hasMore = !UI.ledger.day && dayKeys.length > (UI.ledger.limit || 50);
    html += (hasMore ? dayKeys.slice(0, UI.ledger.limit || 50) : dayKeys).map(k => {
      const g = groups[k];
      const dIn = dayTot[k].i, dOut = dayTot[k].o;
      const tot = (dIn ? '+' + money(dIn, cur) + '  ' : '') + (dOut ? '−' + money(dOut, cur) : '');
      return '<div class="dayhead"><b>' + dayLabel(k) + '</b><span>' + (S.settings.hideAmounts ? '' : tot) + '</span></div>' +
        '<div class="group" style="gap:2px">' + g.map(t => txnRowCached(t, n++, m.src)).join('') + '</div>';
    }).join('');
    if (hasMore) html += '<button class="btn btn--ghost btn--sm" style="margin-top:12px" data-act="more"><i data-lucide="chevrons-down" class="ic"></i>Показать ещё (' + (dayKeys.length - (UI.ledger.limit || 50)) + ')</button>';
  }
  return html;
}
function loadMoreLedger() {
  const view = $('#view');
  if (!view) return false;
  const btn = view.querySelector('[data-act="more"]');
  if (!btn) return false;
  const oldLimit = UI.ledger.limit || 50;
  const newLimit = oldLimit + 50;
  UI.ledger.limit = newLimit;

  const r = ledgerPeriodRange();
  const isAll = r.key === 'all';
  const m = ledgerModel(r, isAll);
  const gm = ledgerGroups(m.dayList);
  const groups = gm.groups, dayKeys = gm.dayKeys, dayTot = gm.dayTot;
  const cur = m.cur;

  const newDayKeys = dayKeys.slice(oldLimit, newLimit);
  if (!newDayKeys.length) {
    btn.remove();
    return true;
  }

  let n = 0;
  for (let i = 0; i < oldLimit && i < dayKeys.length; i++) {
    n += groups[dayKeys[i]].length;
  }

  const chunkHtml = newDayKeys.map(k => {
    const g = groups[k];
    const dIn = dayTot[k].i, dOut = dayTot[k].o;
    const tot = (dIn ? '+' + money(dIn, cur) + '  ' : '') + (dOut ? '−' + money(dOut, cur) : '');
    return '<div class="dayhead"><b>' + dayLabel(k) + '</b><span>' + (S.settings.hideAmounts ? '' : tot) + '</span></div>' +
      '<div class="group" style="gap:2px">' + g.map(t => txnRowCached(t, n++, m.src)).join('') + '</div>';
  }).join('');

  const temp = document.createElement('div');
  temp.innerHTML = chunkHtml;
  while (temp.firstChild) {
    btn.parentNode.insertBefore(temp.firstChild, btn);
  }

  const remaining = dayKeys.length - newLimit;
  if (remaining > 0) {
    btn.innerHTML = '<i data-lucide="chevrons-down" class="ic"></i>Показать ещё (' + remaining + ')';
    icons(btn);
  } else {
    btn.remove();
  }
  enableSwipe(view, true);
  return true;
}
function monthOffsetFor(dateKey) {
  const d = new Date(dateKey + 'T00:00:00'), now = new Date();
  return (d.getFullYear() - now.getFullYear()) * 12 + (d.getMonth() - now.getMonth());
}
/* NEW period engine: supports day/week/2w/month/year/7d/30d/all + customPeriods */
function ledgerPeriodRange() {
  const p = UI.ledger.period || 'month';
  const now = new Date(), t = sod(now);
  let from, to, label;
  if (p === 'day') { from = t; to = t; label = 'День'; }
  else if (p === 'week') { from = sow(now); to = addD(from,6); label = 'Неделя'; }
  else if (p === '2w') { from = addD(t, -13); to = t; label = '2 недели'; }
  else if (p === 'month') { from = som(now); to = addD(addM(now,1),-1); label = MON_N[from.getMonth()] + (from.getFullYear()!==now.getFullYear()?' '+from.getFullYear():''); }
  else if (p === 'year') { from = new Date(now.getFullYear(),0,1); to = new Date(now.getFullYear(),11,31); label = String(now.getFullYear()); }
  else if (p === '7d') { from = addD(t,-6); to = t; label = 'Последние 7 дней'; }
  else if (p === '30d') { from = addD(t,-29); to = t; label = 'Последние 30 дней'; }
  else if (p === 'all') { from = new Date(2000,0,1); to = addD(t,3650); label = 'Все время'; }
  else if (p === 'custom') {
    const cp = (S.settings.customPeriods||[]).find(x=>x.id===UI.ledger.customId);
    if (cp) { from = new Date(cp.s+'T00:00:00'); to = new Date(cp.e+'T00:00:00'); label = cp.label; }
    else { from = som(now); to = addD(addM(now,1),-1); label = MON_N[from.getMonth()]; }
  } else { from = som(now); to = addD(addM(now,1),-1); label = MON_N[from.getMonth()]; }
  return { from, to, label, key:p };
}
const LEDGER_PERIODS = [
  ['day','День'],['week','Неделя'],['2w','2 недели'],['month','Месяц'],
  ['year','Год'],['7d','Последние 7 дней'],['30d','Последние 30 дней'],['all','Все время']
];
function openPeriodPicker() {
  // ledger period bottom sheet — grid 2 cols + custom chips + Add
  const active = UI.ledger.period || 'month';
  const hostHTML = '<div id="perHost"></div>';
  const rec = openSheet({
    title: '',
    html: hostHTML,
    mount(sh){ draw(sh); haptic(10); },
  });
  function draw(sh){
    const host = sh.querySelector('#perHost');
    const custom = S.settings.customPeriods || [];
    const chips = custom.map(cp=> '<button class="as-chip'+(active==='custom'&&UI.ledger.customId===cp.id ? ' on' : '')+'" data-c="'+cp.id+'">' + esc(cp.label) + '<span class="as-chip__x" data-del="'+cp.id+'"><i data-lucide="x" class="ic" style="width:12px;height:12px"></i></span></button>').join('');
    host.innerHTML =
      '<div class="per-grid">' + LEDGER_PERIODS.map(p=> {
        const on = active===p[0];
        return '<button class="per-btn'+(on?' on':'')+'" data-p="'+p[0]+'">' + esc(p[1]) + (on ? '<i data-lucide="check" class="ic ic-s"></i>' :'') + '</button>';
      }).join('') + '</div>' +
      '<div class="per-sec"><div class="per-lab">Пользовательский</div>' +
      '<div class="per-row">' + (chips || '<span class="per-none">Нет сохранённых периодов</span>') + '</div>' +
      '<button class="per-add" data-act="per-add"><i data-lucide="plus" class="ic ic-s"></i>Добавить</button></div>';
    icons(host);
    host.querySelectorAll('.per-btn').forEach(b=> b.onclick=()=>{
      const p = b.dataset.p;
      UI.ledger.period = p; UI.ledger.customId = null; UI.ledger.day = null;
      if (p==='all') UI.ledger.limit = 200;
      haptic(8); closeSheet(); render(true);
    });
    host.querySelectorAll('[data-c]').forEach(ch=> ch.onclick=e=>{
      if (e.target.closest('[data-del]')){
        const id = e.target.closest('[data-del]').dataset.del;
        S.settings.customPeriods = (S.settings.customPeriods||[]).filter(x=>x.id!==id);
        if (UI.ledger.period==='custom' && UI.ledger.customId===id){ UI.ledger.period='month'; UI.ledger.customId=null; }
        save(); haptic(6); draw(sh); return;
      }
      const id = ch.dataset.c;
      UI.ledger.period = 'custom'; UI.ledger.customId = id; UI.ledger.day = null;
      haptic(8); closeSheet(); render(true);
    });
    host.querySelector('[data-act="per-add"]').onclick=()=>{
      openCustomPeriodMini(()=> draw(sh));
    };
  }
}
function openCustomPeriodMini(onDone){
  const today = iso(sod(new Date()));
  const defFrom = iso(addD(sod(new Date()), -7));
  const scrim = document.createElement('div'); scrim.className='as-scrim';
  const sheet = document.createElement('div'); sheet.className='as-sheet';
  sheet.innerHTML = '<div class="as-sheet__grab"><i></i></div><div class="as-sheet__bd"><div class="cp-grid"><label class="cp-field"><small>От</small><input type="date" id="cpFrom" value="'+defFrom+'" class="inp"></label><label class="cp-field"><small>До</small><input type="date" id="cpTo" value="'+today+'" class="inp"></label></div><button id="cpSave" disabled class="save-btn" style="margin-top:16px;opacity:.4">Сохранить</button></div>';
  $('#overlays').appendChild(scrim); $('#overlays').appendChild(sheet);
  requestAnimationFrame(()=>{scrim.classList.add('in'); sheet.classList.add('in');});
  const close=()=>{scrim.classList.remove('in'); sheet.classList.remove('in'); setTimeout(()=>{scrim.remove(); sheet.remove();},380);};
  scrim.onclick=close;
  const f=sheet.querySelector('#cpFrom'), t=sheet.querySelector('#cpTo'), btn=sheet.querySelector('#cpSave');
  const upd=()=>{ const ok= f.value && t.value && f.value <= t.value; btn.disabled=!ok; btn.style.opacity= ok? '1' : '.4'; };
  f.oninput=upd; t.oninput=upd; upd();
  btn.onclick=()=>{
    if (!f.value || !t.value || f.value>t.value) return;
    const d1=new Date(f.value+'T00:00:00'), d2=new Date(t.value+'T00:00:00');
    const fmt=d=> String(d.getDate()).padStart(2,'0')+'.'+String(d.getMonth()+1).padStart(2,'0')+'.'+String(d.getFullYear()).slice(2);
    const cp={ id:uid(), s:f.value, e:t.value, label: fmt(d1)+' – '+fmt(d2) };
    (S.settings.customPeriods||(S.settings.customPeriods=[])).push(cp);
    save(); haptic(8);
    UI.ledger.period='custom'; UI.ledger.customId=cp.id; UI.ledger.day=null;
    close(); closeSheet(); render(true);
    if (onDone) onDone();
  };
}
function emptyLedger(day) {
  const title = day ? 'Операций за этот день нет' : 'Операций пока нет';
  const text = day ? 'Добавьте расход или доход за ' + shortDate(day) + ', и он сразу появится здесь.' : 'Добавьте первую за пару секунд: сумма, категория, готово. Всё хранится только на этом устройстве.';
  return '<div class="empty">' +
    '<svg width="96" height="76" viewBox="0 0 96 76" fill="none" stroke="var(--t3)" stroke-width="1.2" opacity=".7">' +
    '<path d="M12 24c0-5 4-9 9-9h54c5 0 9 4 9 9v34c0 5-4 9-9 9H21c-5 0-9-4-9-9V24Z"/>' +
    '<path d="M12 32h72M66 46h10" opacity=".6"/><circle cx="40" cy="56" r="11" opacity=".5"/><circle cx="58" cy="60" r="8" opacity=".35"/>' +
    '<path d="M22 15l14-9 26 9" opacity=".5"/></svg>' +
    '<h3>' + title + '</h3><p>' + text + '</p>' +
    '<div class="empty__cta"><button class="chip chip--flat" data-act="add" data-type="expense"' + (day ? ' data-date="' + day + '"' : '') + '><span style="color:var(--exp);display:flex">' + ARR_OUT + '</span>Расход</button>' +
    '<button class="chip chip--flat" data-act="add" data-type="income"' + (day ? ' data-date="' + day + '"' : '') + '><span style="color:var(--inc);display:flex">' + ARR_IN + '</span>Доход</button></div></div>';
}
function txnRow(t, i) {
  try {
    let title, iconName, color, sub, cls, sign;
    const a = accById(t.accountId);
    /* иконка счёта 16×16 перед названием счёта в подзаголовке строки */
    const accIco16 = x => x ? svgIcon(x.icon || 'wallet', 'ic ic-s acc-ic', 16) : '';
    if (t.type === 'transfer') {
      const b = accById(t.toAccountId);
      title = 'Перевод'; iconName = 'arrow-left-right'; color = 'var(--t2)';
      sub = (a ? accIco16(a) + esc(a.name) : '?') + ' → ' + (b ? accIco16(b) + esc(b.name) : '?') + (t.note ? ' · ' + esc(t.note) : '');
      cls = 'is-nt'; sign = '';
    } else if (t.type === 'adjust') {
      title = 'Корректировка'; iconName = 'sliders-horizontal'; color = 'var(--t2)';
      sub = (a ? accIco16(a) + esc(a.name) : '') + (t.note ? ' · ' + esc(t.note) : '');
      cls = 'is-nt'; sign = (t.adjustSign || 1) > 0 ? '+' : '−';
    } else {
      const c = catById(t.categoryId);
      title = c ? c.name : 'Без категории';
      iconName = c ? catLuc(c.icon) : 'circle-slash'; color = c ? c.color : 'var(--t3)';
      sub = (t.note ? esc(t.note) + ' · ' : '') + (a ? accIco16(a) + esc(a.name) : '');
      cls = t.type === 'income' ? 'is-in' : 'is-out'; sign = t.type === 'income' ? '+' : '−';
    }
    return '<div class="sw" data-id="' + t.id + '" style="--i:' + Math.min(i, 12) + '">' +
      '<div class="sw__acts"><button class="sw__act sw__act--del" data-act="del-txn" data-id="' + t.id + '" aria-label="Удалить">' + svgIcon('trash-2', 'ic', 20) + '</button></div>' +
      '<button class="sw__body" data-act="open-txn" data-id="' + t.id + '" style="min-height:0;max-height:56px;padding:8px 15px 8px 8px;background:#171717;border:0;box-shadow:none">' +
      '<span class="tile" style="--c:' + color + ';width:40px;height:40px;box-shadow:none;border:0">' + svgIcon(iconName, 'ic', 20) + '</span>' +
      '<span class="row__main"><span class="row__t">' + esc(title) + '</span><span class="row__s">' + sub + '</span></span>' +
      '<span class="row__amt ' + cls + '">' + (S.settings.hideAmounts ? '<span class="hidden-amt">' + sign + money(t.amount, catCur(t)) + '</span>' : sign + money(t.amount, catCur(t))) + '</span>' +
      '</button></div>';
  } catch (e) {
    const rid = (t && t.id) || '';
    return '<div class="sw" data-id="' + rid + '"><button class="sw__body" data-act="open-txn" data-id="' + rid + '" style="min-height:0;max-height:56px;padding:8px 15px 8px 8px;background:#171717;border:0;box-shadow:none">' +
      '<span class="tile" style="--c:var(--t3);width:40px;height:40px;box-shadow:none;border:0">' + svgIcon('circle-slash', 'ic', 20) + '</span>' +
      '<span class="row__main"><span class="row__t">Операция</span><span class="row__s">не удалось отобразить детали</span></span>' +
      '<span class="row__amt is-nt amt"></span></button></div>';
  }
}

/* ============================ analytics (v3 rebuild) ============================ */
const AS = { kind: 'expense', mode: 'donut', period: 'month', custom: null, compare: false, focus: null, selDay: null, el: null, _initial: true };
/* типы визуализации: круговая / линейный */
const AS_MODES = [
  ['donut', 'Круговая', 'pie-chart'],
  ['line', 'Линейный', 'line-chart']
];
const AS_MODE_ICON = Object.fromEntries(AS_MODES.map(m => [m[0], m[2]]));
/* inline-иконка для переключателя типа графика (не зависит от lucide re-render) */
function asModeIconSVG(name) {
  const raw = LUC[name] || LUC_FALLBACK;
  return '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
    (typeof raw === 'string' ? raw : raw.map(d => '<path d="' + d + '"></path>').join('')) + '</svg>';
}
const AS_PRESETS = [
  ['day', 'День'], ['week', 'Неделя'], ['2w', '2 недели'], ['month', 'Месяц'],
  ['year', 'Год'], ['7d', 'Последние 7 дней'], ['30d', 'Последние 30 дней'], ['all', 'Все время']
];
/* донат — ровно один знак; санкей вообще не привязан к переключателю (кнопка «Все» и сам переключатель скрыты) */
const asKindAllowed = mode => mode === 'donut' ? ['expense', 'income'] : ['expense', 'income', 'all'];
const asKind = (t, kind) => {
  const st = S.settings;
  if (t.type === kind) return true;
  if (t.type === 'transfer' && st.transferAsIO) { if (kind === 'income') return !!t.toAccountId; if (kind === 'expense') return !!t.accountId; }
  if (t.type === 'adjust' && st.adjustAsIO) {
    if (kind === 'income') return (t.adjustSign || 1) > 0;
    if (kind === 'expense') return (t.adjustSign || 1) < 0;
  }
  return false;
};
function asRange() {
  const now = new Date(), t = sod(now);
  const acc = UI.accId;
  let from, to, label;
  const p = AS.period;
  if (p === 'day') { from = t; to = t; label = dayLabel(iso(t)).split(',')[0]; }
  else if (p === 'week') { from = sow(now); to = addD(from, 6); label = from.getDate() + ' ' + MON_S[from.getMonth()] + ' – ' + to.getDate() + ' ' + MON_S[to.getMonth()]; }
  else if (p === '2w') { from = addD(t, -13); to = t; label = shortDate(iso(from)) + ' – ' + shortDate(iso(t)); }
  else if (p === 'month') { from = som(now); to = addD(addM(now, 1), -1); label = MON_N[from.getMonth()] + (from.getFullYear() !== now.getFullYear() ? ' ' + from.getFullYear() : ''); }
  else if (p === 'year') { from = new Date(now.getFullYear(), 0, 1); to = new Date(now.getFullYear(), 11, 31); label = String(now.getFullYear()); }
  else if (p === '7d') { from = addD(t, -6); to = t; label = shortDate(iso(from)) + ' – ' + shortDate(iso(t)); }
  else if (p === '30d') { from = addD(t, -29); to = t; label = shortDate(iso(from)) + ' – ' + shortDate(iso(t)); }
  else if (p === 'all') {
    let min = null;
    S.transactions.forEach(x => { if (!acc || x.accountId === acc || x.toAccountId === acc) { const k = dkey(x); if (!min || k < min) min = k; } });
    from = min ? new Date(min + 'T00:00:00') : t; to = t; label = 'Всё время';
  } else {
    const cp = (S.settings.customPeriods || []).find(x => x.id === AS.custom);
    if (cp) { from = new Date(cp.s + 'T00:00:00'); to = new Date(cp.e + 'T23:59:59'); label = cp.label; }
    else { AS.period = 'month'; AS.custom = null; from = som(now); to = addD(addM(now, 1), -1); label = MON_N[from.getMonth()]; }
  }
  return { from, to, label };
}
/* ── адаптивные бакеты периода: день ≤40 дней · неделя ≤210 дней · месяц дальше ──
   график всегда укладывается в разумное число точек вместо стены из ежедневных баров */
function asBucketPlan(from, to) {
  const f = sod(from), t = sod(to);
  const totalDays = Math.max(1, Math.round((t - f) / 864e5) + 1);
  const buckets = [];
  if (totalDays <= 40) {
    for (let i = 0; i < totalDays; i++) {
      const d0 = addD(f, i);
      buckets.push({ from: d0, to: d0, label: String(d0.getDate()), tip: shortDate(iso(d0)) });
    }
  } else if (totalDays <= 210) {
    let cur = f;
    while (cur <= t) {
      const end = addD(cur, 6) > t ? t : addD(cur, 6);
      buckets.push({ from: cur, to: end, label: cur.getDate() + '–' + end.getDate(), tip: shortDate(iso(cur)) + ' – ' + shortDate(iso(end)) });
      cur = addD(end, 1);
    }
  } else {
    let cur = som(f);
    while (cur <= t) {
      const mEnd = addD(addM(cur, 1), -1);
      const end = mEnd > t ? t : mEnd;
      const start = cur < f ? f : cur;
      buckets.push({ from: start, to: end, label: MON_S[cur.getMonth()], tip: MON_N[cur.getMonth()] + (cur.getFullYear() !== t.getFullYear() ? ' ' + cur.getFullYear() : '') });
      cur = addM(cur, 1);
    }
  }
  return buckets;
}
/* ── основной расчёт для одного знака (expense|income); 'all' на верхнем уровне сюда не попадает —
   для линии/столбцов при kind='all' вызывается дважды (income и expense) и совмещается на отрисовке ── */
function asCompute(kindArg) {
  const kind = kindArg || (AS.kind === 'all' ? 'expense' : AS.kind);
  const acc = UI.accId;
  const cur = acc ? (accById(acc) || {}).currency || S.settings.currency : S.settings.currency;
  const r = asRange();
  const excl = S.settings.statsExcluded || [];
  const scope = t => !acc || t.accountId === acc || t.toAccountId === acc;
  /* PERF: rootOf/catById — линейный поиск по категориям на КАЖДУЮ операцию (было 3+ раза
     на операцию). Мемоизируем по categoryId: дерево категорий внутри расчёта не меняется. */
  const _rootCache = Object.create(null);
  const rootId = t => {
    const cid = t.categoryId || '';
    let v = _rootCache[cid];
    if (v === undefined) { const rr = rootOf(catById(t.categoryId)); v = _rootCache[cid] = rr ? rr.id : 'none'; }
    return v;
  };
  const buckets = asBucketPlan(r.from, r.to);
  /* PERF: границы периода в строковом виде считаем ОДИН раз вместо iso() на каждое сравнение.
     Границы бакетов тоже — иначе iso() (аллокация Date + сборка строки) вызывалась
     N_операций × N_бакетов × 2 раз: при 2000 операций и 31 бакете это ~124 000 вызовов
     (~20 мс на десктопе, 80-150 мс на iPhone XR) на каждый проход. */
  const kFrom = iso(r.from), kTo = iso(r.to);
  const bucketAgg = bks => {
    const vals = bks.map(() => ({ v: 0, c: 0 }));
    const keys = bks.map(b => [iso(b.from), iso(b.to)]);
    S.transactions.forEach(t => {
      if (!scope(t) || !asKind(t, kind) || excl.includes(rootId(t))) return;
      const k = dkey(t);
      for (let i = 0; i < keys.length; i++) { if (k >= keys[i][0] && k <= keys[i][1]) { vals[i].v += t.amount; vals[i].c++; break; } }
    });
    return vals;
  };
  const agg = bucketAgg(buckets);
  const days = agg.map(a => a.v), counts = agg.map(a => a.c);
  let prev = null, prevTotal = 0;
  if (AS.compare) {
    const span = Math.round((sod(r.to) - sod(r.from)) / 864e5) + 1;
    const pf = addD(sod(r.from), -span), pe = addD(sod(r.from), -1);
    const pbuckets = asBucketPlan(pf, pe);
    prev = bucketAgg(pbuckets).map(a => a.v);
    while (prev.length < days.length) prev.push(0);
    prev = prev.slice(0, days.length);
    prevTotal = prev.reduce((a, v) => a + v, 0);
  }
  const byCat = {};
  S.transactions.forEach(t => {
    const k = dkey(t);
    if (!(k >= kFrom && k <= kTo)) return;
    if (!scope(t) || !asKind(t, kind)) return;
    const rid = rootId(t), c = catById(rid);
    if (!byCat[rid]) byCat[rid] = { id: rid, name: c ? c.name : 'Без категории', color: c ? c.color : '#8F8F97', icon: c ? catLuc(c.icon) : 'circle-slash', v: 0 };
    byCat[rid].v += t.amount;
  });
  const segs = Object.values(byCat).sort((a, b) => b.v - a.v);
  const visible = segs.filter(s => !excl.includes(s.id));
  const visTotal = visible.reduce((x, s) => x + s.v, 0);
  const focus = AS.focus ? segs.find(s => s.id === AS.focus) || null : null;
  /* ── производные метрики по дням (независимо от группировки графика — нужна суточная сетка) ── */
  const todayKey = iso(new Date());
  const dn = Math.max(1, Math.round((sod(r.to) - sod(r.from)) / 864e5) + 1);
  const dm = {};
  S.transactions.forEach(t => {
    const k = dkey(t);
    if (k >= kFrom && k <= kTo && scope(t) && asKind(t, kind) && !excl.includes(rootId(t))) {
      if (!dm[k]) dm[k] = { v: 0, c: 0 };
      dm[k].v += t.amount; dm[k].c++;
    }
  });
  const ddays = [], dcounts = [];
  for (let i = 0; i < dn; i++) { const k = iso(addD(sod(r.from), i)); const a = dm[k]; ddays.push(a ? a.v : 0); dcounts.push(a ? a.c : 0); }
  let lastIdx = dn - 1;
  while (lastIdx > 0 && iso(addD(sod(r.from), lastIdx)) > todayKey) lastIdx--;
  const opsCount = dcounts.reduce((x, c) => x + c, 0);
  const avgCheck = opsCount > 0 ? visTotal / opsCount : 0;
  let bigDay = null;
  for (let i = 0; i <= lastIdx; i++) if (ddays[i] > 0 && (!bigDay || ddays[i] > bigDay.v)) bigDay = { i, v: ddays[i] };
  let streak = 0;
  for (let i = lastIdx; i >= 0; i--) { if (ddays[i] === 0) streak++; else break; }
  const dowSum = [0, 0, 0, 0, 0, 0, 0], dowCnt = [0, 0, 0, 0, 0, 0, 0];
  for (let i = 0; i <= lastIdx; i++) { const dw = (addD(sod(r.from), i).getDay() + 6) % 7; dowSum[dw] += ddays[i]; dowCnt[dw]++; }
  const dowAvg = dowSum.map((s, i) => dowCnt[i] ? s / dowCnt[i] : 0);
  let bigTxn = null;
  S.transactions.forEach(t => {
    const k = dkey(t);
    if (!(k >= kFrom && k <= kTo)) return;
    if (!scope(t) || !asKind(t, kind) || excl.includes(rootId(t))) return;
    if (!bigTxn || t.amount > bigTxn.amount) bigTxn = t;
  });
  let expT = 0, incT = 0;
  S.transactions.forEach(t => {
    const k = dkey(t);
    if (!(k >= kFrom && k <= kTo) || !scope(t)) return;
    if (t.type === 'expense') expT += t.amount;
    else if (t.type === 'income') incT += t.amount;
  });
  return { r, kind, buckets, n: buckets.length, days, counts, prev, prevTotal, segs, visible, visTotal, focus, cur, opsCount, avgCheck, bigDay, streak, dowAvg, bigTxn, expT, incT };
}
/* ── helpers ── */
const AS_COL = k => (k || AS.kind) === 'income' ? '#30d158' : (k || AS.kind) === 'all' ? '#c9cdd3' : '#ff453a';
function asNiceMax(v) {
  if (!(v > 0)) return 3;
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  for (const m of [1, 1.5, 2, 2.5, 3, 4, 5, 7.5, 10]) if (m * p >= v) return m * p;
  return 10 * p;
}
const asShort = v => v >= 1000 ? (Math.round(v / 100) / 10).toString().replace('.', ',') + 'к' : String(Math.round(v));
function asMonotone(pts) {
  if (pts.length < 2) return pts.length ? 'M' + pts[0][0].toFixed(1) + ' ' + pts[0][1].toFixed(1) : '';
  const n = pts.length, xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
  const dx = [], m = [], t = new Array(n);
  for (let i = 0; i < n - 1; i++) { dx[i] = xs[i + 1] - xs[i] || 1e-6; m[i] = (ys[i + 1] - ys[i]) / dx[i]; }
  t[0] = m[0]; t[n - 1] = m[n - 2];
  for (let i = 1; i < n - 1; i++) {
    if (m[i - 1] * m[i] <= 0) t[i] = 0;
    else { const a = dx[i - 1], b = dx[i]; t[i] = (a + b) / (a / m[i - 1] + b / m[i]); }
  }
  let d = 'M' + xs[0].toFixed(1) + ' ' + ys[0].toFixed(1);
  for (let i = 0; i < n - 1; i++) {
    const h = dx[i] / 3;
    d += 'C' + (xs[i] + h).toFixed(1) + ' ' + (ys[i] + t[i] * h).toFixed(1) + ' ' + (xs[i + 1] - h).toFixed(1) + ' ' + (ys[i + 1] - t[i + 1] * h).toFixed(1) + ' ' + xs[i + 1].toFixed(1) + ' ' + ys[i + 1].toFixed(1);
  }
  return d;
}
/* ── line chart ── */
const AS_LG = { W: 360, H: 200, PL: 40, PR: 12, PT: 14, PB: 26 };
function asLineSVG(d, d2) {
  const W = AS_LG.W, H = AS_LG.H, PL = AS_LG.PL, PR = AS_LG.PR, PT = AS_LG.PT, PB = AS_LG.PB;
  const col = AS_COL(d.kind), col2 = d2 ? AS_COL(d2.kind) : null;
  const n = d.n;
  const raw = Math.max(1, ...d.days, ...(d.prev || []), ...(d2 ? d2.days : []));
  const mx = asNiceMax(raw);
  const x = i => PL + (n > 1 ? i * (W - PL - PR) / (n - 1) : (W - PL - PR) / 2);
  const y = v => PT + (H - PT - PB) * (1 - v / mx);
  const buildLine = (vals, gid, color, delayed) => {
    const pts = vals.map((v, i) => [x(i), y(v)]);
    const path = asMonotone(pts);
    let h = '';
    if (pts.length > 1) {
      h += '<path class="as-area" d="' + path + 'L' + x(n - 1).toFixed(1) + ' ' + y(0).toFixed(1) + 'L' + x(0).toFixed(1) + ' ' + y(0).toFixed(1) + 'Z" fill="url(#' + gid + ')"/>';
      h += '<path class="as-line' + (delayed ? ' as-line--b' : '') + '" pathLength="1" d="' + path + '" stroke="' + color + '" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>';
    } else if (pts.length === 1) {
      h += '<circle cx="' + pts[0][0].toFixed(1) + '" cy="' + pts[0][1].toFixed(1) + '" r="4.5" fill="' + color + '"/>';
    }
    if (pts.length > 1 && n <= 40) h += pts.map(p => '<circle class="as-dot" cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="2.4" fill="' + color + '"/>').join('');
    return h;
  };
  let html = '<defs><linearGradient id="asAreaG1" x1="0" y1="0" x2="0" y2="1">' +
    '<stop offset="0" stop-color="' + col + '" stop-opacity=".3"/><stop offset=".7" stop-color="' + col + '" stop-opacity=".06"/><stop offset="1" stop-color="' + col + '" stop-opacity="0"/></linearGradient>' +
    (col2 ? '<linearGradient id="asAreaG2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + col2 + '" stop-opacity=".22"/><stop offset=".7" stop-color="' + col2 + '" stop-opacity=".04"/><stop offset="1" stop-color="' + col2 + '" stop-opacity="0"/></linearGradient>' : '') +
    '</defs>';
  for (const f of [1, 2 / 3, 1 / 3, 0]) {
    const gy = y(mx * f).toFixed(1);
    html += '<line class="as-grid" x1="' + PL + '" x2="' + (W - PR) + '" y1="' + gy + '" y2="' + gy + '"/>' +
      '<text class="as-glab" x="' + (PL - 6) + '" y="' + (+gy + 3) + '" text-anchor="end">' + (f > 0 ? asShort(mx * f) : '0') + '</text>';
  }
  const total = d.days.reduce((a, v) => a + v, 0), avg = total / n;
  const total2 = d2 ? d2.days.reduce((a, v) => a + v, 0) : 0, avg2 = d2 ? total2 / n : 0;
  if (d.prev && d.prev.length > 1) html += '<path class="as-prev" d="' + asMonotone(d.prev.map((v, i) => [x(i), y(v)])) + '"/>';
  if (total > 0) {
    const avgY = y(avg);
    html += '<line class="as-avg" x1="' + PL + '" x2="' + (W - PR) + '" y1="' + avgY.toFixed(1) + '" y2="' + avgY.toFixed(1) + '" stroke="' + col + '" stroke-width="1.5"/>' +
      '<text class="as-avlab" x="' + (W - PR - 2) + '" y="' + (avgY - (d2 ? 9 : 5)).toFixed(1) + '" fill="' + col + '">ср ' + asShort(avg) + '</text>';
  }
  if (d2 && total2 > 0) {
    const avgY2 = y(avg2);
    html += '<line class="as-avg" x1="' + PL + '" x2="' + (W - PR) + '" y1="' + avgY2.toFixed(1) + '" y2="' + avgY2.toFixed(1) + '" stroke="' + col2 + '" stroke-width="1.5"/>' +
      '<text class="as-avlab" x="' + (W - PR - 2) + '" y="' + (avgY2 + 12).toFixed(1) + '" fill="' + col2 + '">ср ' + asShort(avg2) + '</text>';
  }
  html += buildLine(d.days, 'asAreaG1', col, false);
  if (d2) html += buildLine(d2.days, 'asAreaG2', col2, true);
  const step = Math.max(1, Math.floor(n / 6));
  for (let i = 0; i < n; i += step) html += '<text class="as-xlab" x="' + x(i).toFixed(1) + '" y="' + (H - 8) + '">' + esc(d.buckets[i].label) + '</text>';
  html += '<g id="asSelG" style="display:none"><line id="asSelGuide" class="as-guide" y1="' + PT + '" y2="' + (H - PB) + '"/>' +
    '<circle id="asSelDot" class="as-mark" r="5" fill="' + col + '" stroke="#000" stroke-width="2"/>' +
    (d2 ? '<circle id="asSelDot2" class="as-mark" r="5" fill="' + col2 + '" stroke="#000" stroke-width="2"/>' : '') + '</g>';
  return '<svg id="asLine" viewBox="0 0 ' + W + ' ' + H + '">' + html + '</svg>';
}
/* ── donut (один знак, без бакетов) ── */
const AS_TOPN = 10;
function asDonutSegs(d) {
  const segs = d.visible.slice(0, AS_TOPN);
  const rest = d.visible.slice(AS_TOPN);
  if (rest.length >= 2) segs.push({ id: 'other', name: 'Другое', color: '#8F8F97', icon: 'ellipsis', v: rest.reduce((a, s) => a + s.v, 0) });
  else if (rest.length === 1) segs.push(rest[0]);
  return segs;
}
function asDonutSVG(d) {
  const segs = asDonutSegs(d);
  const tot = d.visTotal || 1;
  let acc = 0;
  const isMulti = segs.length > 1;
  const bodyGap = isMulti ? 0.8 : 0;
  const rimGap = isMulti ? 1.5 : 0;
  const slices = segs.map((s, i) => {
    const len = s.v / tot * 100;
    const isFocused = AS.focus === s.id;
    const dashBody = Math.max(0.1, len - bodyGap);
    const offBody = -(acc + bodyGap / 2);
    const dashRim = Math.max(0.01, len - rimGap);
    const offRim = -(acc + rimGap / 2);
    const bodyCol = isFocused ? s.color : `color-mix(in srgb, ${s.color} 22%, #131316)`;
    const slice = '<g class="as-dslice' + (isFocused ? ' on' : '') + '" data-seg="' + s.id + '" style="--c:' + s.color + ';--k:' + i + '">' +
      '<circle class="as-dseg-body" cx="120" cy="120" r="100" pathLength="100" fill="none" stroke="' + bodyCol + '" stroke-width="46" stroke-linecap="butt" stroke-dasharray="' + dashBody.toFixed(2) + ' 100" stroke-dashoffset="' + offBody.toFixed(2) + '"/>' +
      '<circle class="as-dseg-rim" cx="120" cy="120" r="124" pathLength="100" fill="none" stroke="' + s.color + '" stroke-width="5" stroke-linecap="round" stroke-dasharray="' + dashRim.toFixed(2) + ' 100" stroke-dashoffset="' + offRim.toFixed(2) + '"/>' +
      '</g>';
    acc += len;
    return slice;
  }).join('');
  return '<svg id="asDonut" viewBox="-30 -30 300 300"><g class="as-donutspin">' +
    '<circle cx="120" cy="120" r="100" fill="none" stroke="rgba(255,255,255,.03)" stroke-width="46"/>' +
    '<g transform="rotate(-90 120 120)">' + slices + '</g></g></svg>';
}
function asFlowSummaryHTML(incTotal, expTotal, amtv) {
  return '<span class="flowi flowi--in">' + ARR_IN + '<b>' + amtv(incTotal) + '</b></span><span class="flowi flowi--out">' + ARR_OUT + '<b>' + amtv(expTotal) + '</b></span>';
}
/* авто-размер суммы в центре: длинные суммы сжимаются, никогда не переносятся */
function asCenterB(html, base) {
  const plain = String(html).replace(/<[^>]+>/g, '');
  const len = plain.replace(/\u00A0?BYN$/, '').trim().length + 3;
  const fs = len <= 8 ? base : len <= 11 ? base - 4 : base - 9;
  return '<b style="font-size:' + fs + 'px">' + html + '</b>';
}
function asCenterHTML(d, amtv) {
  if (AS.focus) {
    const segs = asDonutSegs(d);
    const s = segs.find(x => x.id === AS.focus);
    if (s) {
      const share = d.visTotal > 0 ? (s.v / d.visTotal * 100).toFixed(1) : '0';
      return '<div class="as-donut__hub"><span class="as-donut__ic" style="--cc:' + s.color + '"><i data-lucide="' + (s.icon || 'tag') + '" class="ic"></i></span>' +
        '<div class="as-donut__name" style="color:' + s.color + '">' + esc(s.name) + '</div>' +
        asCenterB(amtv(s.v), 32) +
        '<div class="as-donut__pct">' + share + '%</div></div>';
    }
  }
  return '<div class="as-donut__hub"><span class="as-donut__ic" style="--cc:var(--mut)"><i data-lucide="layers" class="ic"></i></span>' +
    '<div class="as-donut__name" style="color:var(--t2)">Всего за период</div>' +
    asCenterB(amtv(d.visTotal), 32) +
    '<div class="as-donut__pct">' + d.opsCount + ' ' + (d.opsCount % 10 === 1 && d.opsCount % 100 !== 11 ? 'операция' : 'операций') + '</div></div>';
}
function asHeaderFor(d) {
  if (AS.focus === 'other') {
    const rest = d.visible.slice(AS_TOPN);
    if (rest.length >= 2) return { name: 'Другое', val: rest.reduce((a, s) => a + s.v, 0) };
  } else if (AS.focus) {
    const f = d.segs.find(s => s.id === AS.focus);
    if (f) return { name: f.name, val: f.v };
  }
  return { name: 'Все категории', val: d.visTotal };
}
function asStatCard(i, ic, ac, lab, val, sub) {
  return '<div class="as-stat" style="--i:' + i + ';--ac:' + ac + '">' +
    '<span class="as-stat__hd"><span class="as-stat__ic"><i data-lucide="' + ic + '" class="ic"></i></span><span class="as-stat__lab">' + lab + '</span></span>' +
    '<b>' + val + '</b>' + (sub ? '<small>' + sub + '</small>' : '') + '</div>';
}
/* обновление фокуса без перерисовки (без повторных анимаций) */
function asApplyFocus() {
  const el = AS.el; if (!el) return;
  const d = AS._d; if (!d) return;
  const hide = S.settings.hideAmounts;
  const amtv = v => hide ? '•••' : money(v, d.cur);
  const wrap = el.querySelector('.as-donutwrap');
  if (wrap) {
    wrap.classList.toggle('as-dim', !!AS.focus);
    wrap.querySelectorAll('.as-dslice').forEach(sl => {
      const isOn = AS.focus === sl.dataset.seg;
      sl.classList.toggle('on', isOn);
      const b = sl.querySelector('.as-dseg-body');
      if (b) {
        const col = sl.style.getPropertyValue('--c');
        b.style.stroke = isOn ? col : `color-mix(in srgb, ${col} 22%, #131316)`;
      }
    });
    const c2 = wrap.querySelector('.as-donutc');
    if (c2) { c2.innerHTML = asCenterHTML(d, amtv); icons(c2); }
  }
  const chart = el.querySelector('.as__chart');
  if (chart) chart.classList.toggle('as-dim', !!AS.focus);
  const heroLab = el.querySelector('#asHeroLab'), heroNum = el.querySelector('#asHeroNum');
  if (heroLab && heroNum) {
    const h = asHeaderFor(d);
    heroLab.textContent = h.name === 'Все категории' ? 'Всего за период' : h.name;
    heroNum.innerHTML = amtv(h.val);
  }
  el.querySelectorAll('.as__cat').forEach(row => {
    if (row.dataset.id === '__all__') {
      row.classList.toggle('focus', !AS.focus);
      row.classList.toggle('dim', !!AS.focus);
      return;
    }
    const f = AS.focus === row.dataset.id;
    row.classList.toggle('focus', f);
    row.classList.toggle('dim', !!AS.focus && !f);
  });
}
/* ── строка категории (переиспользуется и для одиночного списка, и для секций «Доход/Расход» в совмещённом режиме) ── */
function asCatRowHTML(s, i, total, amtv) {
  const ex = (S.settings.statsExcluded || []).includes(s.id);
  const share = total > 0 ? s.v / total : 0;
  const pct = Math.round(share * 100);
  return '<div class="as__cat' + (AS.focus === s.id ? ' focus' : '') + (AS.focus && AS.focus !== s.id ? ' dim' : '') + '" style="--cc:' + s.color + ';--i:' + i + '" data-id="' + s.id + '">' +
    '<span class="as__cat-ic"><i data-lucide="' + s.icon + '" class="ic"></i></span>' +
    '<span class="as__cat-mn"><b>' + esc(s.name) + '</b>' +
    '<span class="as__bar"><span class="as__barfill" style="--p:' + share.toFixed(4) + ';--i:' + i + '"></span></span>' +
    '<span class="as__cat-ft"><span class="as__cat-pct">' + pct + '%</span>' + (ex ? '<span class="as__cat-x">исключена</span>' : '') + '</span></span>' +
    '<span class="as__cat-r"><span class="as__cat-v">' + amtv(s.v) + '</span><span class="as__cat-of">' + amtv(total) + '</span></span>' +
    '<button class="as__ck' + (ex ? '' : ' on') + '" type="button" aria-label="' + (ex ? 'Включить категорию' : 'Исключить категорию') + '"><i data-lucide="check" class="ic"></i></button></div>';
}
function asRender() {
  const el = AS.el; if (!el || !el.querySelector('#asbody')) return;
  const combined = AS.kind === 'all' && AS.mode === 'line';
  const d = asCompute();
  AS._d = d;
  const d2 = combined ? asCompute('income') : null;
  /* самолечение фокуса: категория исчезла (исключена/сменён период-тип-счёт) → сброс */
  const focusPool = d.visible;
  if (AS.focus && AS.focus !== 'other' && !focusPool.some(s => s.id === AS.focus)) AS.focus = null;
  if (AS.focus === 'other' && d.visible.length < AS_TOPN + 2) AS.focus = null;
  if (AS.mode === 'donut' && AS.focus === null && AS._initial && d.visible.length > 0) {
    AS.focus = d.visible[0].id;
    AS._initial = false;
  }
  const kind = AS.kind, cur = d.cur;
  const col = kind === 'income' ? 'var(--inc)' : kind === 'all' ? 'var(--txt)' : 'var(--exp)';
  const hide = S.settings.hideAmounts;
  const amtv = v => hide ? '•••' : money(v, cur);
  /* синхронизация переключателя типа графика и кнопок шапки */
  const mbtn = el.querySelector('#asModeBtn');
  if (mbtn) {
    const mic = mbtn.querySelector('.as-modebtn__ic');
    if (mic) mic.innerHTML = asModeIconSVG(AS_MODE_ICON[AS.mode] || 'pie-chart');
  }
  const cmpBtn = el.querySelector('#asCmpBtn');
  if (cmpBtn) { cmpBtn.classList.toggle('as-hid', AS.mode !== 'line' || AS.kind === 'all'); cmpBtn.classList.toggle('on', AS.compare); }
  const ctl = el.querySelector('#asCtl');
  if (ctl) {
    ctl.classList.toggle('as-donutmode', AS.mode === 'donut');
    const kindEl = el.querySelector('#asKind');
    if (kindEl) {
      kindEl.dataset.v = AS.kind;
      kindEl.querySelectorAll('[data-segv]').forEach(b => b.setAttribute('aria-selected', b.dataset.segv === AS.kind ? 'true' : 'false'));
    }
  }
  const pb = el.querySelector('#asPeriodBtn');
  if (pb) pb.innerHTML = '<span>' + esc(d.r.label) + '</span><i data-lucide="chevron-down" class="ic"></i>';
  const tit = el.querySelector('#asAccBtn');
  if (tit) {
    const acc0 = UI.accId ? accById(UI.accId) : null;
    const dot = tit.querySelector('.as-acc__dot');
    if (dot) dot.style.setProperty('--ac', acc0 ? acc0.color : 'var(--t2)');
    const nm = tit.querySelector('.as-acc__name');
    if (nm) nm.textContent = acc0 ? acc0.name : 'Все счета';
  }
  const body = el.querySelector('#asbody');
  let html = '';
  /* ── пустое состояние ── */
  const isEmpty = combined ? (d.visTotal === 0 && !d.opsCount && (!d2 || (d2.visTotal === 0 && !d2.opsCount))) : (d.visTotal === 0 && !d.opsCount);
  if (isEmpty) {
    body.innerHTML = '<div class="as-empty"><i data-lucide="pie-chart" class="ic"></i>' +
      '<h3>Нет данных за выбранный период</h3><p>Добавьте операции, чтобы увидеть аналитику.</p></div>';
    icons(body);
    return;
  }
  /* ── герой-число / совмещённая сумма (у бублика итог в центре, у линии — в герое) ── */
  const hd0 = asHeaderFor(d);
  if (AS.mode === 'line' && AS.kind === 'all') {
    html += '<div class="as-sankey__sum" style="border-top:none;margin-top:0;padding:14px 4px 2px">' + asFlowSummaryHTML(d2.visTotal, d.visTotal, amtv) + '</div>';
  } else if (AS.mode === 'line') {
    let deltaHTML = '';
    if (AS.compare && d.prevTotal > 0 && d.visTotal > 0 && !hide) {
      const dpct = Math.round((d.visTotal - d.prevTotal) / d.prevTotal * 100);
      const good = kind === 'expense' ? dpct <= 0 : dpct >= 0;
      const arrow = dpct > 0 ? '↑' : dpct < 0 ? '↓' : '→';
      deltaHTML = '<span class="as-hero__delta on" style="color:' + (good ? 'var(--inc)' : 'var(--exp)') + '">' + arrow + ' ' + Math.abs(dpct) + '% vs прошлый период</span>';
    }
    html += '<div class="as-hero"><span class="as-hero__lab" id="asHeroLab">' + esc(hd0.name === 'Все категории' ? 'Всего за период' : hd0.name) + '</span>' +
      '<div class="as-hero__num" id="asHeroNum" style="color:' + col + '">' + amtv(hd0.val) + '</div>' + deltaHTML + '</div>';
  }
  /* ── график ── */
  if (AS.mode === 'line') {
    html += '<div class="as__chart" id="asLineCard">' + asLineSVG(d, d2) +
      '<div class="as-tip" id="asTip" style="display:none"></div>' +
      (AS.compare && AS.kind !== 'all' ? '<div style="display:flex;justify-content:center;gap:18px;padding:8px 0 6px;font-size:11px;font-weight:700;color:var(--mut)">' +
        '<span style="display:flex;align-items:center;gap:6px"><i style="width:14px;height:3px;border-radius:99px;background:' + col + '"></i>Текущий</span>' +
        '<span style="display:flex;align-items:center;gap:6px"><i style="width:14px;height:3px;border-radius:99px;background:rgba(255,255,255,.35)"></i>Прошлый</span></div>' : '') +
      '</div>';
  } else {
    html += '<div class="as-donutwrap' + (AS.focus ? ' as-dim' : '') + '">' + asDonutSVG(d) +
      '<div class="as-donutc" id="asDonutCenter">' + asCenterHTML(d, amtv) + '</div></div>';
  }
  /* ── категории: список ── */
  if (combined) {
    html += '<div class="as__cat as__cat--all focus" style="--cc:var(--mut);--i:0" data-id="__all__">' +
      '<span class="as__cat-ic"><i data-lucide="layers" class="ic"></i></span>' +
      '<span class="as__cat-mn"><b>Все категории</b>' +
      '<span class="as__bar"><span class="as__barfill" style="--p:1;--i:0"></span></span>' +
      '<span class="as__cat-ft"><span class="as__cat-pct">итого</span></span></span>' +
      '<span class="as__cat-r"><span class="as__cat-v">' + amtv(d2.visTotal - d.visTotal) + '</span></span></div>';
    html += '<div class="as-sect"><span>Доход</span><small>' + d2.opsCount + ' оп.</small></div>' + d2.segs.map((s, i) => asCatRowHTML(s, i + 1, d2.visTotal, amtv)).join('');
    html += '<div class="as-sect"><span>Расход</span><small>' + d.opsCount + ' оп.</small></div>' + d.segs.map((s, i) => asCatRowHTML(s, i + 1, d.visTotal, amtv)).join('');
  } else {
    html += '<div class="as-sect"><span>По категориям</span><small>' + d.segs.length + ' ' + insPl(d.segs.length, 'категория', 'категории', 'категорий') + '</small></div>';
    html += '<div class="as__cat as__cat--all' + (AS.focus ? ' dim' : ' focus') + '" style="--cc:var(--mut);--i:0" data-id="__all__">' +
      '<span class="as__cat-ic"><i data-lucide="layers" class="ic"></i></span>' +
      '<span class="as__cat-mn"><b>Все категории</b>' +
      '<span class="as__bar"><span class="as__barfill" style="--p:1;--i:0"></span></span>' +
      '<span class="as__cat-ft"><span class="as__cat-pct">100%</span></span></span>' +
      '<span class="as__cat-r"><span class="as__cat-v">' + amtv(d.visTotal) + '</span><span class="as__cat-of">' + d.opsCount + ' оп.</span></span></div>';
    html += d.segs.map((s, i) => asCatRowHTML(s, i + 1, d.visTotal, amtv)).join('');
  }
  /* ── стат-карты 2×2 (используют одиночный набор d — тот же знак, что был выбран последним) ── */
  html += '<div class="as-stats">' +
    asStatCard(0, 'calculator', 'var(--inc)', 'Средний чек', d.opsCount ? amtv(d.avgCheck) : '—', d.opsCount ? d.opsCount + ' оп.' : 'нет операций') +
    asStatCard(1, 'flame', 'var(--exp)', kind === 'income' ? 'Пик дохода' : 'Макс. за день', d.bigDay ? amtv(d.bigDay.v) : '—', d.bigDay ? shortDate(iso(addD(sod(d.r.from), d.bigDay.i))) : 'без записей') +
    asStatCard(2, 'flame', 'var(--inc)', kind === 'income' ? 'Без доходов' : 'Без трат', d.streak + (d.streak === 1 ? ' день' : ' дн.'), 'дней подряд') +
    asStatCard(3, 'ellipsis', 'var(--mut)', 'Операций', d.opsCount, d.elapsed > 0 ? '≈ ' + (Math.round(d.opsCount / d.elapsed * 10) / 10).toString().replace('.', ',') + ' в день' : '') +
    '</div>';
  /* ── крупнейшая операция ── */
  if (d.bigTxn) {
    const bt = d.bigTxn;
    const bc = catById(bt.categoryId);
    const root = bc ? rootOf(bc) : null;
    const bcc = root ? root.color : 'var(--t2)';
    const bic = bt.type === 'transfer' ? 'arrow-left-right' : bt.type === 'adjust' ? 'sliders-horizontal' : (root ? catLuc(root.icon) : 'receipt');
    const ba = accById(bt.accountId);
    html += '<button class="as-big" data-act="open-big" data-id="' + bt.id + '" style="--cc:' + bcc + '">' +
      '<span class="as-big__tint"></span>' +
      '<span class="as-big__ic"><i data-lucide="' + bic + '" class="ic"></i></span>' +
      '<span class="as-big__mn"><span class="as-big__lab">' + (kind === 'income' ? 'Самый дорогой доход' : 'Самая дорогая') + '</span>' +
      '<span class="as-big__t">' + esc(root ? root.name : (bt.note || 'Без категории')) + '</span>' +
      '<span class="as-big__s">' + (bt.note ? esc(bt.note.slice(0, 20)) + (bt.note.length > 20 ? '…' : '') + ' · ' : '') + shortDate(dkey(bt)) + (ba ? ' · ' + esc(ba.name) : '') + '</span></span>' +
      '<span class="as-big__v">' + amtv(bt.amount) + '</span>' +
      '<i data-lucide="chevron-right" class="ic ic-s as-big__go"></i></button>';
  }
  /* ── тепловая карта по дням недели ── */
  const mxAvg = Math.max(...d.dowAvg, 0);
  html += '<div class="as-heat" style="--ac:' + col + '">' +
    '<div class="as-heat__hd"><span>По дням недели</span><small>' + (mxAvg > 0 ? (hide ? '•••' : 'макс ' + money(mxAvg, cur)) : 'нет данных') + '</small></div>' +
    '<div class="as-heat__grid">' + d.dowAvg.map((v, i) => {
      const p = mxAvg > 0 ? v / mxAvg : 0;
      return '<div class="as-hcol"><span class="as-hl">' + DOW[i].charAt(0).toUpperCase() + '</span>' +
        '<span class="as-hcirc" style="--p:' + p.toFixed(4) + ';--i:' + i + '">' +
        (!hide && v > 0 ? '<b style="--hc:' + (p > .5 ? '#000' : 'var(--mut)') + '">' + asShort(v) + '</b>' : '') +
        '</span></div>';
    }).join('') + '</div></div>';
  /* ── доходы vs расходы ── */
  if (d.expT > 0 || d.incT > 0) {
    const p = d.expT + d.incT > 0 ? d.expT / (d.expT + d.incT) : .5;
    const net = d.incT - d.expT;
    const netHtml = Math.abs(net) >= .005
      ? '<span class="as-flow__net" style="--nc:' + (net >= 0 ? 'var(--inc)' : 'var(--exp)') + '">' + (hide ? '���••' : (net >= 0 ? '+' : '−') + money(Math.abs(net), cur)) + '</span>'
      : '';
    html += '<div class="as-flow">' +
      '<div class="as-flow__row">' +
      '<div class="as-flow__col" style="--c:var(--exp)"><span class="as-flow__lab">Расходы</span><b class="as-flow__val">' + amtv(d.expT) + '</b></div>' +
      netHtml +
      '<div class="as-flow__col as-flow__col--r" style="--c:var(--inc)"><span class="as-flow__lab">Доходы</span><b class="as-flow__val">' + amtv(d.incT) + '</b></div>' +
      '</div>' +
      '<div class="as-flow__bar"><span class="as-flow__exp" style="--p:' + p.toFixed(4) + '"></span><span class="as-flow__inc"></span></div></div>';
  }
  body.innerHTML = html;
  icons(body);
  /* прорисовка сегментов бублика: каскад 40ms, transition 800ms */
  const dsegs = body.querySelectorAll('.as-dseg');
  if (dsegs.length) {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      dsegs.forEach((c, i) => setTimeout(() => { c.style.strokeDashoffset = c.dataset.off; }, 40 * i));
    }));
  }
  /* ── интерактив: линия ── */
  const svg = body.querySelector('#asLine');
  if (svg) {
    const updSel = () => {
      const gg = body.querySelector('#asSelG'), dot = body.querySelector('#asSelDot'), dot2 = body.querySelector('#asSelDot2'), guide = body.querySelector('#asSelGuide'), tip = body.querySelector('#asTip');
      const i = AS.selDay;
      if (i === null || i === undefined || d.days[i] === undefined) {
        if (gg) gg.style.display = 'none';
        if (tip) tip.style.display = 'none';
        return;
      }
      const W = AS_LG.W, H = AS_LG.H, PL = AS_LG.PL, PR = AS_LG.PR, PT = AS_LG.PT, PB = AS_LG.PB;
      const mx = asNiceMax(Math.max(1, ...d.days, ...(d.prev || []), ...(d2 ? d2.days : [])));
      const nn = d.n;
      const x = PL + (nn > 1 ? i * (W - PL - PR) / (nn - 1) : (W - PL - PR) / 2);
      const yv = PT + (H - PT - PB) * (1 - d.days[i] / mx);
      if (gg) {
        gg.style.display = '';
        dot.setAttribute('cx', x.toFixed(1)); dot.setAttribute('cy', yv.toFixed(1));
        guide.setAttribute('x1', x.toFixed(1)); guide.setAttribute('x2', x.toFixed(1));
        if (dot2 && d2) { const yv2 = PT + (H - PT - PB) * (1 - d2.days[i] / mx); dot2.setAttribute('cx', x.toFixed(1)); dot2.setAttribute('cy', yv2.toFixed(1)); }
      }
      if (tip) {
        tip.style.display = '';
        tip.innerHTML = '<small>' + esc(d.buckets[i].tip) + '</small>' +
          (d2 ? '<b style="color:' + AS_COL('income') + '">' + amtv(d2.days[i]) + '</b><b style="color:' + AS_COL('expense') + '">' + amtv(d.days[i]) + '</b>'
            : '<b>' + amtv(d.days[i]) + '</b><span>' + (d.counts[i] || 0) + ' ' + ((d.counts[i] || 0) % 10 === 1 && (d.counts[i] || 0) % 100 !== 11 ? 'операция' : 'операций') + '</span>');
        const card = body.querySelector('#asLineCard');
        const sx = card ? card.clientWidth : AS_LG.W;
        const tw = tip.offsetWidth || 110;
        const leftPx = clamp(x / W * sx, tw / 2 + 6, Math.max(tw / 2 + 6, sx - tw / 2 - 6));
        const topPct = clamp(yv / H * 100, 24, 88);
        tip.style.left = Math.round(leftPx) + 'px';
        tip.style.top = topPct + '%';
      }
    };
    svg.onclick = e => {
      const rect = svg.getBoundingClientRect();
      const relX = (e.clientX - rect.left) / rect.width * AS_LG.W;
      const W = AS_LG.W, PL = AS_LG.PL, PR = AS_LG.PR;
      let idx = 0;
      if (d.n > 1) idx = clamp(Math.round((relX - PL) / ((W - PL - PR) / (d.n - 1))), 0, d.n - 1);
      AS.selDay = AS.selDay === idx ? null : idx;
      haptic(6);
      updSel();
    };
    updSel();
  }
  /* ── интерактив: donut ── */
  const donut = body.querySelector('#asDonut');
  if (donut) donut.onclick = e => {
    const rect = donut.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width * 300 - 150;
    const py = (e.clientY - rect.top) / rect.height * 300 - 150;
    const dist = Math.hypot(px, py);
    const segs = asDonutSegs(d);
    // тап в отверстие по центру
    if (dist < 74) {
      if (AS.focus) AS.focus = null;
      else if (segs.length) AS.focus = segs[0].id;
      haptic(6);
      asApplyFocus();
      return;
    }
    // за пределами внешнего ободка
    if (dist > 135) return;
    // точный полярный угол: 12 часов = 0°, по часовой стрелке 0..360°
    let ang = Math.atan2(py, px) * 180 / Math.PI + 90;
    if (ang < 0) ang += 360;
    const hitPct = ang / 360 * 100;
    const tot = d.visTotal || 1;
    let acc = 0, hit = null;
    for (const s of segs) {
      const len = s.v / tot * 100;
      if (hitPct >= acc && hitPct < acc + len) { hit = s; break; }
      acc += len;
    }
    if (!hit) return;
    AS.focus = AS.focus === hit.id ? null : hit.id;
    haptic(8);
    asApplyFocus();
  };
  const donutC = body.querySelector('#asDonutCenter');
  if (donutC) donutC.onclick = e => {
    if (e.target.closest('.as-donut__hub')) {
      const segs = asDonutSegs(d);
      if (AS.focus) AS.focus = null;
      else if (segs.length) AS.focus = segs[0].id;
      haptic(6);
      asApplyFocus();
    }
  };
  /* ── интерактив: список категорий ── */
  body.querySelectorAll('.as__cat').forEach(row => row.onclick = e => {
    if (e.target.closest('.as__ck')) {
      const excl = S.settings.statsExcluded || (S.settings.statsExcluded = []);
      const id = row.dataset.id;
      if (excl.includes(id)) excl.splice(excl.indexOf(id), 1); else excl.push(id);
      save(); haptic(6); asRender();
      return;
    }
    const id = row.dataset.id;
    if (id === '__all__') {
      if (AS.focus) { AS.focus = null; haptic(6); asApplyFocus(); }
      return;
    }
    AS.focus = AS.focus === id ? null : id;
    haptic(10); asApplyFocus();
  });
  const bigBtn = body.querySelector('[data-act="open-big"]');
  if (bigBtn) bigBtn.onclick = () => { haptic(10); openEditor({ id: bigBtn.dataset.id }); };
}
function asSheetDrag(sh, cl) {
  let y0 = 0, dy = 0, on = false;
  const g = sh.querySelector('.as-sheet__grab');
  g.addEventListener('pointerdown', e => { on = true; y0 = e.clientY; dy = 0; sh.classList.add('drag'); g.setPointerCapture(e.pointerId); });
  g.addEventListener('pointermove', e => { if (!on) return; dy = Math.max(0, e.clientY - y0); sh.style.transform = 'translateY(' + dy + 'px)'; });
  const end = () => { if (!on) return; on = false; sh.classList.remove('drag'); sh.style.transform = ''; if (dy > 110) cl(); };
  g.addEventListener('pointerup', end); g.addEventListener('pointercancel', end);
}
function asSheetGrid(sheet, close) {
  const html = '<div class="as-pgrid">' + AS_PRESETS.map(p =>
    '<button class="as-pbtn' + (AS.period === p[0] ? ' on' : '') + '" data-p="' + p[0] + '">' + esc(p[1]) +
    (AS.period === p[0] ? '<i data-lucide="check" class="ic"></i>' : '') + '</button>').join('') + '</div>';
  const chips = (S.settings.customPeriods || []).map(cp =>
    '<button class="as-chip' + (AS.period === 'custom' && AS.custom === cp.id ? ' on' : '') + '" data-c="' + cp.id + '">' + esc(cp.label) +
    '<span class="as-chip-x" data-del="' + cp.id + '" role="button" aria-label="Удалить период"><i data-lucide="x" class="ic"></i></span></button>').join('');
  const bd = sheet.querySelector('.as-sheet__bd');
  bd.innerHTML = html +
    '<div class="as-seclab">Пользовательский</div>' +
    '<div class="as-chips">' + (chips || '<span style="font-size:14px;color:var(--mut)">Нет пользовательских периодов</span>') + '</div>' +
    '<button class="as-add" data-act="as-add"><i data-lucide="plus" class="ic"></i>Добавить</button>';
  icons(sheet);
  sheet.querySelectorAll('.as-pbtn').forEach(b => b.onclick = () => {
    haptic(6); AS.period = b.dataset.p; AS.custom = null; AS.focus = null; AS.selDay = null;
    close(); asRender();
  });
  sheet.querySelectorAll('.as-chip').forEach(ch => ch.onclick = e => {
    if (e.target.closest('[data-del]')) {
      haptic(6);
      const id = e.target.closest('[data-del]').dataset.del;
      const arr = S.settings.customPeriods || (S.settings.customPeriods = []);
      const i = arr.findIndex(x => x.id === id); if (i >= 0) arr.splice(i, 1);
      if (AS.period === 'custom' && AS.custom === id) { AS.period = 'month'; AS.custom = null; AS.focus = null; AS.selDay = null; asRender(); }
      save();
      asSheetGrid(sheet, close);
      return;
    }
    haptic(6); AS.period = 'custom'; AS.custom = ch.dataset.c; AS.focus = null; AS.selDay = null;
    close(); asRender();
  });
  sheet.querySelector('[data-act="as-add"]').onclick = () => asCustomSheet(close);
}
function asPeriodSheet() {
  const scrim = document.createElement('div'); scrim.className = 'as-scrim';
  const sheet = document.createElement('div'); sheet.className = 'as-sheet';
  sheet.innerHTML = '<div class="as-sheet__grab"><i></i></div><div class="as-sheet__bd"></div>';
  $('#overlays').append(scrim, sheet);
  requestAnimationFrame(() => { scrim.classList.add('in'); sheet.classList.add('in'); });
  const close = () => { scrim.classList.remove('in'); sheet.classList.remove('in'); setTimeout(() => { scrim.remove(); sheet.remove(); }, 380); };
  scrim.onclick = close;
  asSheetDrag(sheet, close);
  asSheetGrid(sheet, close);
}
/* dropdown выбора типа графика: список с текстовыми названиями, выезжает под иконкой в шапке */
function asModeDropdown(btn) {
  const host = AS.el;
  if (!host || host.querySelector('.as-pop')) return;
  const scrim = document.createElement('div'); scrim.className = 'as-pop-scrim';
  const pop = document.createElement('div'); pop.className = 'as-pop';
  pop.innerHTML = AS_MODES.map(m => {
    const on = AS.mode === m[0];
    return '<button class="as-pop__btn' + (on ? ' on' : '') + '" data-mode="' + m[0] + '" role="button" aria-pressed="' + on + '">' +
      '<i data-lucide="' + m[2] + '" class="ic"></i><b>' + m[1] + '</b>' +
      (on ? '<i data-lucide="check" class="ic as-pop__ck"></i>' : '<i class="ic as-pop__ck" style="opacity:0"></i>') + '</button>';
  }).join('');
  host.append(scrim, pop);
  const r = btn.getBoundingClientRect(), sr = host.getBoundingClientRect();
  pop.style.top = (r.bottom - sr.top + 8) + 'px';
  pop.style.right = Math.max(12, sr.right - r.right) + 'px';
  btn.setAttribute('aria-expanded', 'true');
  requestAnimationFrame(() => { scrim.classList.add('in'); pop.classList.add('in'); });
  const close = () => {
    btn.setAttribute('aria-expanded', 'false');
    scrim.classList.remove('in'); pop.classList.remove('in');
    setTimeout(() => { scrim.remove(); pop.remove(); }, 200);
  };
  scrim.onclick = close;
  icons(pop);
  pop.querySelectorAll('.as-pop__btn').forEach(b => b.onclick = () => {
    const v = b.dataset.mode;
    haptic(8);
    /* «Все» существует только у линии — при уходе в донат/бар/санкей откатываемся на «Расход» */
    if (!asKindAllowed(v).includes(AS.kind)) AS.kind = 'expense';
    AS.mode = v; AS.focus = null; AS.selDay = null;
    close(); asRender();
  });
}
/* выбор счёта/источника данных для статистики (не тронуто — вне периметра переработки) */
function asAccountSheet() {
  const t = totalsByCur();
  const list = S.accounts.filter(a => !a.archived).sort((a, b) => a.order - b.order);
  const mark = sel => '<i data-lucide="check" class="ic as-accsel"' + (sel ? '' : ' style="opacity:0"') + '></i>';
  const scrim = document.createElement('div'); scrim.className = 'as-scrim';
  const sheet = document.createElement('div'); sheet.className = 'as-sheet';
  sheet.innerHTML = '<div class="as-sheet__grab"><i></i></div>' +
    '<div class="as-sheet__bd"><div class="as-acclist">' +
    '<button class="as-accrow' + (!UI.accId ? ' on' : '') + '" data-acc="">' +
    '<span class="as-accrow__ic" style="--c:var(--mut);background:#000">' + ALL_ACC_IC + '</span>' +
    '<span class="as-accrow__t">Все счета</span>' +
    '<span class="as-accrow__v">' + (Object.keys(t).length ? Object.keys(t).map(c => money(t[c], c)).join(' · ') : '—') + '</span>' + mark(!UI.accId) + '</button>' +
    list.map(a => '<button class="as-accrow' + (UI.accId === a.id ? ' on' : '') + '" data-acc="' + a.id + '">' +
      '<span class="as-accrow__ic" style="--c:' + a.color + '"><i data-lucide="' + a.icon + '" class="ic"></i></span>' +
      '<span class="as-accrow__t">' + esc(a.name) + '</span>' +
      '<span class="as-accrow__v">' + money(accBalance(a.id), a.currency) + '</span>' + mark(UI.accId === a.id) + '</button>').join('') +
    '</div></div>';
  $('#overlays').append(scrim, sheet);
  requestAnimationFrame(() => { scrim.classList.add('in'); sheet.classList.add('in'); });
  const close = () => { scrim.classList.remove('in'); sheet.classList.remove('in'); setTimeout(() => { scrim.remove(); sheet.remove(); }, 380); };
  scrim.onclick = close;
  asSheetDrag(sheet, close);
  icons(sheet);
  sheet.querySelectorAll('[data-acc]').forEach(b => b.onclick = () => {
    UI.accId = b.dataset.acc || null;
    UI.ledger.day = null;
    AS.focus = null; AS.selDay = null;
    haptic(8);
    refreshTop();
    close(); asRender();
  });
}
function asCustomSheet(onDone) {
  const today = iso(sod(new Date()));
  const defFrom = iso(addD(sod(new Date()), -30));
  const scrim = document.createElement('div'); scrim.className = 'as-scrim';
  const sheet = document.createElement('div'); sheet.className = 'as-sheet';
  sheet.innerHTML = '<div class="as-sheet__grab"><i></i></div>' +
    '<div class="as-sheet__bd">' +
    '<div class="as-fgrid">' +
    '<label class="as-field"><small>От</small><input type="date" class="as-date" id="asFrom" value="' + defFrom + '"></label>' +
    '<label class="as-field"><small>До</small><input type="date" class="as-date" id="asTo" value="' + today + '"></label>' +
    '</div>' +
    '<button class="btn btn--chrome" id="asSaveC" style="width:100%;margin-top:16px" disabled>Сохранить</button>' +
    '</div>';
  $('#overlays').append(scrim, sheet);
  requestAnimationFrame(() => { scrim.classList.add('in'); sheet.classList.add('in'); });
  const close = () => { scrim.classList.remove('in'); sheet.classList.remove('in'); setTimeout(() => { scrim.remove(); sheet.remove(); }, 380); };
  scrim.onclick = close;
  asSheetDrag(sheet, close);
  const from = sheet.querySelector('#asFrom'), to = sheet.querySelector('#asTo'), saveB = sheet.querySelector('#asSaveC');
  const upd = () => { saveB.disabled = !from.value || !to.value || from.value > to.value; };
  from.oninput = upd; to.oninput = upd; upd();
  saveB.onclick = () => {
    if (!from.value || !to.value || from.value > to.value) return;
    const d1 = new Date(from.value + 'T00:00:00'), d2 = new Date(to.value + 'T00:00:00');
    const lab = d => String(d.getDate()).padStart(2, '0') + '.' + String(d.getMonth() + 1).padStart(2, '0') + '.' + String(d.getFullYear()).slice(2);
    const cp = { id: uid(), s: from.value, e: to.value, label: lab(d1) + ' – ' + lab(d2) };
    (S.settings.customPeriods || (S.settings.customPeriods = [])).push(cp);
    save(); haptic(6);
    AS.period = 'custom'; AS.custom = cp.id; AS.focus = null; AS.selDay = null;
    close(); if (onDone) onDone();
    asRender();
  };
}
/* ── экран: шапка (закрыть · счёт · сравнение · тип графика) + переключатель знака (скрыт для sankey) + период ── */
function asHTML() {
  const acc0 = UI.accId ? accById(UI.accId) : null;
  return '<div class="as">' +
    '<div class="as__grab"></div>' +
    '<div class="as__hd">' +
    '<button class="iconbtn" data-act="as-close" aria-label="Закрыть"><i data-lucide="x" class="ic"></i></button>' +
    '<button class="as-acc" id="asAccBtn" data-act="as-acc" aria-label="Источник данных">' +
    '<span class="as-acc__dot" style="--ac:' + (acc0 ? acc0.color : 'var(--t2)') + '"></span>' +
    '<span class="as-acc__name">' + esc(acc0 ? acc0.name : 'Все счета') + '</span>' +
    '<i data-lucide="chevron-down" class="ic"></i></button>' +
    '<div class="as__hacts">' +
    '<button class="as-cmp' + (AS.mode !== 'line' ? ' as-hid' : '') + (AS.compare ? ' on' : '') + '" id="asCmpBtn" data-act="as-compare" aria-label="Сравнение с прошлым периодом"><i data-lucide="arrow-left-right" class="ic"></i></button>' +
    '<button class="as-modebtn" id="asModeBtn" data-act="as-mode" aria-label="Тип графика" aria-haspopup="true" aria-expanded="false">' +
    '<span class="as-modebtn__ic">' + asModeIconSVG(AS_MODE_ICON[AS.mode]) + '</span>' +
    '</button>' +
    '</div>' +
    '</div>' +
    '<div class="as__ctl' + (AS.mode === 'donut' ? ' as-donutmode' : '') + '" id="asCtl">' +
    '<div class="as-kind" data-seg="askind" data-v="' + AS.kind + '" id="asKind">' +
    '<button type="button" data-segv="expense" aria-selected="' + (AS.kind === 'expense') + '">' + ARR_OUT + '<span>Расход</span></button>' +
    '<button type="button" data-segv="income" aria-selected="' + (AS.kind === 'income') + '">' + ARR_IN + '<span>Доход</span></button>' +
    '<button type="button" data-segv="all" class="as-kind__all" aria-selected="' + (AS.kind === 'all') + '"><i data-lucide="activity" class="ic"></i><span>Все</span></button>' +
    '</div>' +
    '<button class="as-perbtn" id="asPeriodBtn" data-act="as-period" aria-label="Период"></button>' +
    '</div>' +
    '<div class="as__body" id="asbody"></div>' +
    '</div>';
}
function openStats() {
  const rec = pushScreen({ id: 'stats', push: true, html: asHTML(), mount: asMount, refresh: () => asRender() });
  rec.el.classList.add('astats');
  AS.el = rec.el;
}
function asMount(el) {
  AS.el = el;
  el.querySelector('[data-act="as-close"]').onclick = () => { AS.el = null; popScreen(); };
  el.querySelector('[data-act="as-acc"]').onclick = () => asAccountSheet();
  const modeBtn = el.querySelector('[data-act="as-mode"]');
  if (modeBtn) modeBtn.onclick = () => asModeDropdown(modeBtn);
  el.querySelector('[data-act="as-compare"]').onclick = () => { AS.compare = !AS.compare; haptic(6); asRender(); };
  el.querySelector('[data-act="as-period"]').onclick = () => asPeriodSheet();
  const seg = el.querySelector('[data-seg="askind"]');
  if (seg) seg.querySelectorAll('[data-segv]').forEach(b => b.onclick = () => {
    if (b.getAttribute('aria-selected') === 'true') return;
    if (!asKindAllowed(AS.mode).includes(b.dataset.segv)) return;
    seg.dataset.v = b.dataset.segv;
    seg.querySelectorAll('[data-segv]').forEach(x => x.setAttribute('aria-selected', x === b ? 'true' : 'false'));
    haptic(8); AS.kind = b.dataset.segv; AS.focus = null; AS.selDay = null; AS.compare = false; asRender();
  });
  asRender();
}
/* ---------- накопления (бывшие цели) ---------- */
const dayPlural = n => { const a = n % 10, b = n % 100; return a === 1 && b !== 11 ? 'день' : (a >= 2 && a <= 4 && (b < 10 || b >= 20) ? 'дня' : 'дней'); };
/* требуемый темп накопления: хватит ли среднего темпа сбережений за 30 дней */
function goalPaceInfo(g) {
  try {
    if (!g.deadline || g.target <= 0 || g.saved >= g.target) return null;
    const dl = Math.round((new Date(g.deadline + 'T00:00:00') - sod(new Date())) / 864e5);
    if (dl <= 0) return null;
    const perDay = (g.target - g.saved) / dl;
    const hist30 = (g.history || []).filter(h => h.date >= iso(addD(sod(new Date()), -30))).reduce((x, h) => x + h.v, 0);
    const avg = hist30 > 0 ? hist30 / 30 : smartBase().savingsDaily;
    return { perDay, avg, hot: avg > 0 && perDay > avg, txt: 'откладывать ' + moneyPlain(perDay) + '/день (' + moneyPlain(perDay * 7) + '/нед, ' + moneyPlain(perDay * 30) + '/мес)' };
  } catch (e) { return null; }
}
const svIcon = n => (n && (LUC[n] || LUC[n.replace(/-([a-z])/g, (m, c) => c.toUpperCase())])) ? n : 'circle-slash';
function viewGoals() {
  let html = '<div class="hero" style="padding-bottom:0"><div class="hero__lab">Покупки</div>' +
    '<p style="margin:8px 0 0;color:var(--t2);font-size:14px;line-height:1.5">Добавляйте всё, что хотите купить. ИИ-советник подскажет, что брать сейчас, а что отложить; деньги копятся на защищённом счёте «Накопления»</p></div>';
  if (!S.goals.length) {
    html += '<div class="empty" style="padding-top:56px"><span class="tile" style="--c:var(--t2);width:64px;height:64px;border-radius:20px"><i data-lucide="shopping-bag" class="ic" style="width:30px;height:30px"></i></span>' +
      '<h3>Список покупок пуст</h3><p>Например: новые наушники, отпуск, ремонт. Спросите ИИ, что разумнее купить сейчас.</p>' +
      '<div class="empty__cta"><button class="chip chip--flat" data-act="edit-goal"><i data-lucide="plus" class="ic ic-s"></i>Добавить покупку</button></div></div>';
    return html;
  }
  const b30 = smartBase();
  const pots = ['fund', 'goals'].reduce((s, k) => { const a = sysAcc(k); return s + (a ? accBalance(a.id) : 0); }, 0);
  const free = b30.bal - pots;
  const savM = Math.max(0, b30.inc30 - b30.exp30);
  html += '<div style="display:flex;flex-direction:column;gap:10px;margin-top:18px" id="goalList">' + S.goals.slice().sort((a, b) => (a.order || 0) - (b.order || 0)).map((g, i) => {
    const p = g.target > 0 ? clamp(g.saved / g.target, 0, 1) : 0, pct = Math.round(p * 100), done = pct >= 100;
    const dl = g.deadline ? Math.round((new Date(g.deadline + 'T00:00:00') - sod(new Date())) / 864e5) : null;
    let dlTxt = '';
    if (g.deadline) dlTxt = 'до ' + shortDate(g.deadline);
    if (dl !== null) dlTxt += (dlTxt ? ' · ' : '') + (dl > 0 ? 'осталось ' + dl + ' ' + dayPlural(dl) : 'срок вышел');
    const pace = dl > 0 ? goalPaceInfo(g) : null;
    let aff = '';
    if (!done && g.target > 0) {
      const rem = g.target - g.saved;
      if (free >= rem) aff = '💰 Свободных денег хватает — можно брать';
      else if (savM > 0) aff = '≈ ' + Math.max(1, Math.ceil(rem / savM)) + ' мес. · откладывать ' + moneyPlain(rem / Math.max(1, Math.ceil(rem / savM))) + '/мес';
    }
    return '<div class="sw svrow" data-id="' + g.id + '" style="--i:' + i + '">' +
      '<div class="sw__acts sw__acts--full"><button class="sw__del" data-act="del-goal" data-id="' + g.id + '" aria-label="Удалить покупку"><i data-lucide="trash-2" class="ic"></i><span>Удалить</span></button></div>' +
      '<div class="sv' + (done ? ' sv--done' : '') + '" style="--c:' + g.color + '">' +
      '<div class="sv__hd">' +
      '<span class="sv__ic"><i data-lucide="' + svIcon(g.icon) + '" class="ic"></i></span>' +
      '<span class="sv__main"><span class="sv__name">' + esc(g.name) + '</span>' + (dlTxt ? '<span class="sv__dl">' + esc(dlTxt) + '</span>' : '') +
      (pace ? '<span class="sv__dl' + (pace.hot ? ' sv__dl--hot' : '') + '">' + esc(pace.txt) + '</span>' : '') +
      (aff && !pace ? '<span class="sv__dl">' + esc(aff) + '</span>' : '') + '</span>' +
      '<span class="sv__btns">' +
      '<button class="sv__btn" data-act="goal-add" data-id="' + g.id + '" aria-label="Пополнить"><i data-lucide="plus" class="ic ic-s"></i></button>' +
      '<button class="sv__btn" data-act="edit-goal" data-id="' + g.id + '" aria-label="Изменить"><i data-lucide="pencil" class="ic ic-s"></i></button>' +
      '</span></div>' +
      '<div class="sv__track"><div class="sv__fill" style="--p:' + p.toFixed(4) + '"></div></div>' +
      '<div class="sv__ft"><span class="sv__sum">' + money(g.saved) + ' / ' + money(g.target) + '</span>' +
      '<span class="sv__pct">' + (done ? 'Можно покупать 🎉' : pct + '%') + '</span></div></div></div>';
  }).join('') + '</div>' +
    '<div style="display:flex;gap:8px;margin-top:14px">' +
    '<button class="btn btn--ghost" style="flex:1" data-act="edit-goal"><i data-lucide="plus" class="ic"></i>Добавить покупку</button>' +
    '<button class="btn btn--chrome" style="flex:1" data-act="goals-ai"><i data-lucide="sparkles" class="ic"></i>Что купить сейчас?</button></div>';
  return html;
}

function goalsHTML() {
  return '<div class="shead"><button class="iconbtn" data-act="close"><i data-lucide="x" class="ic"></i></button><h2>Покупки</h2>' +
    '<span class="spacer"></span>' +
    '<button class="iconbtn" data-act="goals-ai" aria-label="Спросить ИИ"><i data-lucide="sparkles" class="ic"></i></button></div><div class="screen__body">' + viewGoals() + '</div>';
}
function openGoals() {
  const rec = pushScreen({ id: 'goals', push: true, html: goalsHTML(), mount: goalsMount, refresh: () => { rec.el.innerHTML = goalsHTML(); icons(rec.el); goalsMount(rec.el); } });
}
function goalsMount(el) {
  el.querySelector('[data-act="close"]').onclick = () => popScreen();
  el.querySelectorAll('[data-act="edit-goal"]').forEach(b => b.onclick = () => openGoalForm(b.dataset.id));
  el.querySelectorAll('[data-act="new-goal"]').forEach(b => b.onclick = () => openGoalForm());
  el.querySelectorAll('[data-act="goals-ai"]').forEach(b => b.onclick = () => {
    haptic(8);
    openAdvisor('Вот список моих желаемых покупок (см. activeGoals). Что разумнее купить сейчас, что отложить и сколько откладывать в месяц?');
  });
  el.querySelectorAll('[data-act="goal-add"]').forEach(b => b.onclick = () => goalContribute(b.dataset.id));
  enableDeleteSwipe(el.querySelector('#goalList'), { ask: (id, row) => swipeAskDeleteGoal(id, row), instant: (id, row) => swipeDeleteGoal(id, row) }, '.sv');
}

/* ═══════════════════════════════ insights ═══════════════════════════════ */
function computeInsights(r, accId) {
  const list = scopeTxns(r, accId);
  const cur = accId ? accById(accId).currency : S.settings.currency;
  const exp = list.filter(t => t.type === 'expense'), inc = list.filter(t => t.type === 'income');
  const days = Math.max(1, Math.round((r.to - r.from) / 86400000) + 1);
  const totalExp = sum(exp.map(t => t.amount)), totalInc = sum(inc.map(t => t.amount));

  /* PERF: sort() для поиска максимума — O(n log n) + копия массива; reduce — O(n).
     При равных суммах сохраняется первый элемент (sort стабилен) — поведение то же. */
  const biggestExp = exp.reduce((m, t) => (!m || t.amount > m.amount ? t : m), null) || undefined;
  const biggestInc = inc.reduce((m, t) => (!m || t.amount > m.amount ? t : m), null) || undefined;

  const byDay = {}; exp.forEach(t => { const k = dkey(t); byDay[k] = (byDay[k] || 0) + t.amount; });
  const topDayEntry = Object.entries(byDay).sort((a, b) => b[1] - a[1])[0];

  const byCat = {}; exp.forEach(t => { const k = t.categoryId || '__none'; byCat[k] = (byCat[k] || 0) + 1; });
  const topCatEntry = Object.entries(byCat).sort((a, b) => b[1] - a[1])[0];

  let weekendSum = 0;
  exp.forEach(t => { const wd = new Date(t.date).getDay(); if (wd === 0 || wd === 6) weekendSum += t.amount; });

  /* PERF: было O(дни × операции) — до 365 полных проходов по S.transactions плюс 2 аллокации
     Date на итерацию; при 900 операциях и длинном перерыве это 30-50 мс на iPhone XR.
     Гибрид: быстрый путь — прямой поиск с ранним выходом (типичная серия 0-3 дня, почти
     бесплатно); если перерыв затянулся — один раз строим множество дней с расходами
     и продолжаем по нему. Результат идентичен. */
  const endForStreak = r.to > new Date() ? new Date() : r.to;
  const hasExp = k => S.transactions.some(t => t.type === 'expense' && dkey(t) === k && (!accId || t.accountId === accId));
  let streak = 0, d = sod(endForStreak), expDays = null;
  while (streak < 365) {
    if (!expDays && streak >= 3) {
      expDays = new Set();
      S.transactions.forEach(t => { if (t.type === 'expense' && (!accId || t.accountId === accId)) expDays.add(dkey(t)); });
    }
    const k = iso(d);
    if (expDays ? expDays.has(k) : hasExp(k)) break;
    streak++; d = addD(d, -1);
  }

  const prevR = { from: addD(r.from, -days), to: addD(r.from, -1) };
  const prevExp = sum(scopeTxns(prevR, accId).filter(t => t.type === 'expense').map(t => t.amount));

  return {
    cur, days, totalExp, totalInc, txnCount: list.length,
    avgDaily: totalExp / days,
    biggestExp, biggestInc,
    topDay: topDayEntry ? { key: topDayEntry[0], v: topDayEntry[1] } : null,
    topCat: topCatEntry ? { cat: topCatEntry[0] === '__none' ? null : catById(topCatEntry[0]), n: topCatEntry[1] } : null,
    weekendPct: totalExp ? Math.round(weekendSum / totalExp * 100) : 0,
    savingsRate: totalInc ? Math.round((totalInc - totalExp) / totalInc * 100) : null,
    streak,
    cmpPct: prevExp ? Math.round((totalExp - prevExp) / prevExp * 100) : null
  };
}
/* ---------- insights · full-screen overlay ---------- */
let insEl = null, insOpen = false;
const INS_AC = { exp: '#ff453a', inc: '#30d158' };
const insPl = (n, o, f, m) => (n % 10 === 1 && n % 100 !== 11) ? o : ((n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)) ? f : m);
function openInsights() {
  if (insOpen) return;
  insOpen = true;
  const el = document.createElement('div');
  el.className = 'ins-screen';
  el.innerHTML = insScreenHTML();
  $('#overlays').appendChild(el);
  icons(el);
  insEl = el;
  insBind(el);
  requestAnimationFrame(() => el.classList.add('show'));
  history.pushState({ depth: 'ins' }, '');
}
function closeInsights(fromHistory) {
  if (!insOpen) return;
  insOpen = false;
  const el = insEl; insEl = null;
  el.classList.remove('show');
  setTimeout(() => el.remove(), 420);
  if (!fromHistory) { suppressPopstate = true; history.back(); }
}
function insRefresh(el) {
  if (!insOpen) return;
  el.innerHTML = insScreenHTML();
  icons(el);
  insBind(el);
}
function insScreenHTML() {
  const r = periodRange('month', UI.insights.off);
  const a = UI.accId ? accById(UI.accId) : null;
  return '<div class="ins-grab" aria-hidden="true"></div>' +
    '<div class="ins-hd">' +
    '<div class="ins-chip" data-act="ins-acc" role="button" aria-label="Выбрать счёт" style="--ac:' + (a ? a.color : 'var(--txt)') + '">' +
    '<span class="ins-chip__ic"' + (a ? '' : ' style="background:#000"') + '>' + (a ? '<i data-lucide="' + a.icon + '" class="ic"></i>' : ALL_ACC_IC) + '</span>' +
    '<span class="ins-chip__tx"><span class="ins-chip__t">' + esc(a ? a.name : 'Все счета') + '</span><span class="ins-chip__s">' + esc(r.label) + '</span></span>' +
    '<i data-lucide="chevron-down" class="ic ins-chip__chev"></i></div>' +
    '<button class="ins-close" data-act="ins-close" aria-label="Закрыть"><i data-lucide="x" class="ic"></i></button></div>' +
    insBodyHTML(r);
}
function insBodyHTML(r) {
  const s = computeInsights(r, UI.accId);
  const net = s.totalInc - s.totalExp;
  const barTotal = s.totalExp + s.totalInc;
  const ep = barTotal ? Math.round(s.totalExp / barTotal * 100) : 0;
  let html = '<div class="ins-body">' +
    '<div class="ins-nav">' +
    '<button data-act="ins-prev" aria-label="Предыдущий месяц"><i data-lucide="chevron-left" class="ic"></i></button>' +
    '<b>' + esc(r.label) + '</b>' +
    '<button data-act="ins-next" aria-label="Следующий месяц"' + (UI.insights.off >= 0 ? ' disabled' : '') + '><i data-lucide="chevron-right" class="ic"></i></button></div>' +
    '<div class="ins-net"><b>' + amt(net, s.cur) + '</b></div>';
  if (barTotal) {
    html += '<div class="ins-bar"><div class="ins-bar__exp" style="width:' + ep + '%"></div><div class="ins-bar__inc"></div></div>' +
      '<div class="ins-sav">' + (s.savingsRate !== null ? 'Норма сбережений ' + s.savingsRate + '% · доходы ' + money(s.totalInc, s.cur) : 'Расходы ' + money(s.totalExp, s.cur)) + '</div>';
  } else {
    html += '<div class="ins-sav">За этот период операций нет</div>';
  }
  html += insChartHTML(r, s.cur) + insCardsHTML(s) +
    '<div class="tips-lab">Умные подсказки</div>' +
    (tipsHTML() || '<p style="color:var(--mut);font-size:14px;margin:0">Пока советов нет — всё под контролем.</p>') +
    '</div>';
  return html;
}
function insChartHTML(r, cur) {
  const days = Math.max(1, Math.round((r.to - r.from) / 86400000) + 1);
  const prevR = { from: addD(r.from, -days), to: addD(r.from, -1) };
  const daily = rr => {
    const m = {};
    scopeTxns(rr, UI.accId).forEach(t => { if (t.type !== 'expense') return; const k = dkey(t); m[k] = (m[k] || 0) + t.amount; });
    const a = [];
    for (let i = 0; i < days; i++) a.push(m[iso(addD(rr.from, i))] || 0);
    return a;
  };
  const ca = daily(r), pa = daily(prevR);
  const maxV = Math.max.apply(null, ca.concat(pa).concat([1]));
  const p10 = Math.pow(10, Math.floor(Math.log10(maxV)));
  const rel = maxV / p10;
  const ymax = (rel <= 1 ? 1 : rel <= 2 ? 2 : rel <= 5 ? 5 : 10) * p10;
  const W = 340, H = 112, PL = 34, PR = 6, PT = 14, PB = 22;
  const iw = W - PL - PR, ih = H - PT - PB;
  const X = i => PL + (days === 1 ? iw / 2 : iw * i / (days - 1));
  const Y = v => PT + ih * (1 - v / ymax);
  const pts = arr => arr.map((v, i) => X(i).toFixed(1) + ',' + Y(v).toFixed(1)).join(' ');
  const kf = v => v >= 10000 ? Math.round(v / 1000) + 'k' : v >= 1000 ? (v / 1000).toFixed(1) + 'k' : Math.round(v);
  const grid = [0, .5, 1].map(f => {
    const y = Y(ymax * f);
    return '<line class="grid-line" x1="' + PL + '" y1="' + y.toFixed(1) + '" x2="' + (W - PR) + '" y2="' + y.toFixed(1) + '"/>' +
      '<text class="y-lab" x="' + (PL - 4) + '" y="' + (y + 3).toFixed(1) + '" text-anchor="end">' + (f === 0 ? '0' : kf(ymax * f)) + '</text>';
  }).join('');
  const xl = '<text class="x-lab" x="' + X(0).toFixed(1) + '" y="' + (H - 6) + '">' + r.from.getDate() + '</text>' +
    '<text class="x-lab" x="' + X(days - 1).toFixed(1) + '" y="' + (H - 6) + '">' + r.to.getDate() + '</text>';
  return '<div class="ins-chart"><svg viewBox="0 0 ' + W + ' ' + H + '">' + grid + xl +
    '<polyline class="l-prev" points="' + pts(pa) + '"/>' +
    '<polyline class="l-cur" pathLength="1" points="' + pts(ca) + '"/>' +
    '</svg><div class="ins-legend"><span class="cur"><i></i>Текущий</span><span class="prev"><i></i>Прошлый месяц</span></div></div>';
}
function insCardsHTML(s) {
  const std = (i, ic, lab, val, sub, ac) =>
    '<div class="ins-card" style="--i:' + i + ';--tint:' + (ac || '#a7aab3') + ';--ac:' + (ac || '#a7aab3') + '">' +
    '<span class="ins-card__tint"></span>' +
    '<div class="ins-card__top"><b>' + lab + '</b><span class="ins-card__ic"><i data-lucide="' + ic + '" class="ic"></i></span></div>' +
    (sub ? '<div class="ins-card__sub">' + sub + '</div>' : '') +
    '<span class="ins-card__val">' + val + '</span></div>';
  const mid = (i, ic, lab, name, v, ac, sub) =>
    '<div class="ins-card ins-card--mid" style="--i:' + i + ';--tint:' + (ac || '#a7aab3') + ';--ac:' + (ac || '#a7aab3') + '">' +
    '<span class="ins-card__tint"></span>' +
    '<div class="ins-card__top"><b>' + lab + '</b></div>' +
    '<div class="ins-card__mid"><span class="ins-card__big"><i data-lucide="' + ic + '" class="ic"></i></span>' +
    '<span class="ins-card__name">' + esc(name) + '</span><span class="ins-card__amt">' + v + '</span>' +
    (sub ? '<div class="ins-card__sub">' + sub + '</div>' : '') + '</div></div>';
  let h = '', i = 0;
  h += std(i++, 'calendar-days', 'Средние траты в день', amt(s.avgDaily, s.cur), amt(s.totalExp, s.cur) + ' за период');
  h += std(i++, 'receipt', 'Операций за период', String(s.txnCount), s.totalInc ? amt(s.totalInc, s.cur) + ' доходов' : 'без доходов');
  if (s.biggestExp) h += mid(i++, 'trending-up', 'Самая крупная трата', (catById(s.biggestExp.categoryId) || {}).name || 'Без категории', amt(s.biggestExp.amount, s.cur), INS_AC.exp, dayLabel(s.biggestExp.date.slice(0, 10)));
  if (s.biggestInc) h += mid(i++, 'trending-down', 'Самый крупный доход', (catById(s.biggestInc.categoryId) || {}).name || 'Без категории', amt(s.biggestInc.amount, s.cur), INS_AC.inc, dayLabel(s.biggestInc.date.slice(0, 10)));
  if (s.topDay) h += std(i++, 'flame', 'Самый затратный день', amt(s.topDay.v, s.cur), dayLabel(s.topDay.key));
  if (s.topCat) h += mid(i++, 'shapes', 'Частая категория', s.topCat.cat ? s.topCat.cat.name : 'Без категории', s.topCat.n + ' раз', null, 'за период');
  h += std(i++, 'sofa', 'Траты в выходные', s.weekendPct + '%', 'от всех расходов');
  h += std(i++, 'flame', 'Серия без трат', String(s.streak), insPl(s.streak, 'день подряд', 'дня подряд', 'дней подряд'));
  if (s.savingsRate !== null) h += std(i++, 'piggy-bank', 'Норма сбережений', s.savingsRate + '%', 'доходы минус расходы', INS_AC.inc);
  if (s.cmpPct !== null) {
    const z = s.cmpPct === 0, up = s.cmpPct > 0;
    h += std(i++, 'arrow-left-right', 'К прошлому периоду', (up ? '+' : '') + s.cmpPct + '%', z ? 'расходы не изменились' : (up ? 'расходы выросли' : 'расходы снизились'), z ? null : (up ? INS_AC.exp : INS_AC.inc));
  }
  return '<div class="ins-grid">' + h + '</div>';
}
function insPickAccount(el) {
  const t = totalsByCur();
  const list = S.accounts.filter(a => !a.archived).sort((a, b) => a.order - b.order);
  const mark = sel => sel ? '<i data-lucide="check" class="ic ic-s" style="color:var(--inc);flex:none;margin-left:-4px"></i>' : '';
  openSheet({
    title: 'Счёт для инсайтов',
    dark: true,
    html: '<div style="display:flex;flex-direction:column;gap:6px">' +
      '<button class="item" data-acc="" aria-selected="' + (!UI.accId) + '"><span class="tile tile--sm" style="background:#000">' + ALL_ACC_IC + '</span>' +
      '<span class="item__t">Все счета</span><span class="item__v">' + Object.keys(t).map(c => money(t[c], c)).join(' · ') + '</span>' + mark(!UI.accId) + '</button>' +
      list.map(a => '<button class="item" data-acc="' + a.id + '" aria-selected="' + (UI.accId === a.id) + '"><span class="tile tile--sm" style="--c:' + a.color + '"><i data-lucide="' + a.icon + '" class="ic"></i></span>' +
        '<span class="item__t">' + esc(a.name) + '</span><span class="item__v">' + money(accBalance(a.id), a.currency) + '</span>' + mark(UI.accId === a.id) + '</button>').join('') +
      '</div>',
    mount(sh) {
      icons(sh);
      sh.querySelectorAll('[data-acc]').forEach(b => b.onclick = () => {
        haptic();
        UI.accId = b.dataset.acc || null;
        closeSheet();
        insRefresh(el);
      });
    }
  });
}
function insBind(el) {
  const c = el.querySelector('[data-act="ins-close"]');
  if (c) c.onclick = () => closeInsights();
  bindTips(el);
  const chip = el.querySelector('[data-act="ins-acc"]');
  if (chip) chip.onclick = () => insPickAccount(el);
  const p = el.querySelector('[data-act="ins-prev"]');
  if (p) p.onclick = () => { UI.insights.off--; haptic(); insRefresh(el); };
  const n = el.querySelector('[data-act="ins-next"]');
  if (n) n.onclick = () => { if (UI.insights.off < 0) { UI.insights.off++; haptic(); insRefresh(el); } };
  const g = el.querySelector('.ins-grab'); if (!g) return;
  let y0 = 0, dy = 0, on = false;
  const d0 = e => { on = true; y0 = e.clientY; dy = 0; el.classList.add('drag'); g.setPointerCapture(e.pointerId); };
  const d1 = e => { if (!on) return; dy = Math.max(0, e.clientY - y0); el.style.transform = 'translateY(' + dy + 'px)'; };
  const d2 = () => {
    if (!on) return;
    on = false; el.classList.remove('drag'); el.style.transform = '';
    if (dy > 90) { haptic(); closeInsights(); }
  };
  if (el.__insGrab) { el.__insGrab.forEach(h => g.removeEventListener(h[0], h[1])); }
  const hs = [['pointerdown', d0], ['pointermove', d1], ['pointerup', d2], ['pointercancel', d2]];
  hs.forEach(h => g.addEventListener(h[0], h[1]));
  el.__insGrab = hs;
}
/* insbtn: hold to glow, tap/hold-release opens the overlay */
let insBtnHold = null;
if (typeof document !== 'undefined' && $('#view')) {
  $('#view').addEventListener('pointerdown', e => {
    const b = e.target.closest('.insbtn'); if (!b) return;
    if (insBtnHold !== null) return;
    try { b.setPointerCapture(e.pointerId); } catch (_err) {}
    insBtnHold = setTimeout(() => { insBtnHold = 'on'; b.classList.add('dragging'); haptic(8); }, 240);
  });
  const insBtnClear = e => {
    const b = e.target.closest ? e.target.closest('.insbtn') : null;
    if (insBtnHold) { clearTimeout(insBtnHold); insBtnHold = null; }
    if (b) b.classList.remove('dragging');
  };
  $('#view').addEventListener('pointerup', insBtnClear);
  $('#view').addEventListener('pointercancel', insBtnClear);
}
