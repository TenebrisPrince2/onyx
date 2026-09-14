"use strict";

/* screens/home/ledger-model.js — подготовка данных Ledger (DOM-free): выборка, фильтрация, группировка по дням. */

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
  else if (p === 'week') { from = sow(now); to = addD(from, 6); label = 'Неделя'; }
  else if (p === '2w') { from = addD(t, -13); to = t; label = '2 недели'; }
  else if (p === 'month') { from = som(now); to = addD(addM(now, 1), -1); label = MON_N[from.getMonth()] + (from.getFullYear() !== now.getFullYear() ? ' ' + from.getFullYear() : ''); }
  else if (p === 'year') { from = new Date(now.getFullYear(), 0, 1); to = new Date(now.getFullYear(), 11, 31); label = String(now.getFullYear()); }
  else if (p === '7d') { from = addD(t, -6); to = t; label = 'Последние 7 дней'; }
  else if (p === '30d') { from = addD(t, -29); to = t; label = 'Последние 30 дней'; }
  else if (p === 'all') { from = new Date(2000, 0, 1); to = addD(t, 3650); label = 'Все время'; }
  else if (p === 'custom') {
    const cp = (S.settings.customPeriods || []).find(x => x.id === UI.ledger.customId);
    if (cp) { from = new Date(cp.s + 'T00:00:00'); to = new Date(cp.e + 'T00:00:00'); label = cp.label; }
    else { from = som(now); to = addD(addM(now, 1), -1); label = MON_N[from.getMonth()]; }
  } else { from = som(now); to = addD(addM(now, 1), -1); label = MON_N[from.getMonth()]; }
  return { from, to, label, key: p };
}

function ledgerModel(r, isAll) {
  const src = sortedTxns();
  const pk = r.key + ':' + iso(r.from) + ':' + iso(r.to);
  const day = UI.ledger.day || '';
  if (_ledgerModel && _ledgerModel.src === src && _ledgerModel.accId === UI.accId && _ledgerModel.pk === pk && _ledgerModel.day === day) return _ledgerModel;
  const rawList = isAll
    ? src.filter(t => !UI.accId || t.accountId === UI.accId || t.toAccountId === UI.accId)
    : scopeTxns(r, UI.accId, src);
  const list = rawList.filter(t => isTxnOverviewVisible(t, UI.accId));
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

if (typeof window !== 'undefined') {
  window.monthOffsetFor = monthOffsetFor;
  window.ledgerPeriodRange = ledgerPeriodRange;
  window.ledgerModel = ledgerModel;
  window.ledgerGroups = ledgerGroups;
}
