"use strict";

/* screens/home/ledger.js — рендер списка операций (viewLedger), пустое состояние (emptyLedger) и догрузка (loadMoreLedger). */

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
  const pActive = UI.ledger.period || 'month';
  const customIdActive = UI.ledger.customId;
  const currentVal = (pActive === 'custom' && customIdActive) ? ('custom:' + customIdActive) : pActive;

  const basePeriods = [
    { id: 'all', label: 'Все время' },
    { id: 'month', label: 'Месяц' },
    { id: 'week', label: 'Неделя' },
    { id: 'day', label: 'День' },
    { id: '2w', label: '2 недели' },
    { id: '7d', label: 'Последние 7 дней' },
    { id: '30d', label: 'Последние 30 дней' },
    { id: 'year', label: 'Год' }
  ];

  const extraOpt = dayActive ? '<option value="__day__" selected disabled hidden>' + esc(dayLabel(UI.ledger.day)) + '</option>' : '';
  const selectOptionsHTML = periodOptionsHTML(dayActive ? '__day__' : currentVal, basePeriods, extraOpt);

  let html = '<div class="balper">' +
    '<span class="balper__lab" data-act="pick-period" style="cursor:pointer">Баланс за</span>' +
    '<div class="balper__wrap">' +
      '<span class="balper__pill">' + esc(dayActive ? dayLabel(UI.ledger.day) : r.label) + '</span>' +
      '<select class="balper__select" id="balperSelect" aria-label="Период" onchange="onPeriodChange(this.value)" onblur="onPeriodChange(this.value)">' +
        selectOptionsHTML +
      '</select>' +
    '</div>' +
    (dayActive ? '<button class="iconbtn" data-act="clear-day" aria-label="Весь месяц"><i data-lucide="x" class="ic"></i></button>' : '') +
    '</div>';

  // split hero amount into num + icon so icon not recreated each frame — pure string ops (no DOM during ledger compute)
  const hm = money(bal, cur, { exact: !S.settings.roundTotals });
  const hasByn = hm.indexOf('byn-icon') !== -1;
  let heroAmtHTML = '';
  if (hasByn) {
    // money for BYN is like "1 234,50<svg class="byn-icon" ...> — strip svg, keep num
    const cleanNum = hm.split('<svg')[0].trim();
    heroAmtHTML = '<span id="heroNum" class="money-num">' + cleanNum + '</span>' + BYN_SIGN;
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
    '<button class="insbtn" data-act="insights"><i data-lucide="sparkle" class="ic"></i>Инсайты</button>';

  if (S.settings.demo) html += '<div class="banner"><span class="tile tile--sm" style="--c:var(--t2)"><i data-lucide="sparkle" class="ic"></i></span>' +
    '<p><b>Демо-данные</b>63 дня операций, чтобы всё пощупать</p><button class="btn btn--sm btn--ghost" style="min-height:36px;padding:0 14px" data-act="wipe-demo">Очистить</button></div>';

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

if (typeof window !== 'undefined') {
  window.emptyLedger = emptyLedger;
  window.viewLedger = viewLedger;
  window.loadMoreLedger = loadMoreLedger;
}
