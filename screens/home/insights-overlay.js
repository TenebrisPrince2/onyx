"use strict";

/* screens/home/insights-overlay.js — полноэкранный оверлей инсайтов Home (openInsights, computeInsights, карточки и графики). */

function computeInsights(r, accId) {
  const rawList = scopeTxns(r, accId);
  const list = rawList.filter(t => isTxnOverviewVisible(t, accId));
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
  const hasExp = k => S.transactions.some(t => t.type === 'expense' && dkey(t) === k && (!accId || t.accountId === accId) && isTxnOverviewVisible(t, accId));
  let streak = 0, d = sod(endForStreak), expDays = null;
  while (streak < 365) {
    if (!expDays && streak >= 3) {
      expDays = new Set();
      S.transactions.forEach(t => { if (t.type === 'expense' && (!accId || t.accountId === accId) && isTxnOverviewVisible(t, accId)) expDays.add(dkey(t)); });
    }
    const k = iso(d);
    if (expDays ? expDays.has(k) : hasExp(k)) break;
    streak++; d = addD(d, -1);
  }

  const prevR = { from: addD(r.from, -days), to: addD(r.from, -1) };
  const prevExp = sum(scopeTxns(prevR, accId).filter(t => t.type === 'expense' && isTxnOverviewVisible(t, accId)).map(t => t.amount));

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
let insEl = null, insScrim = null, insOpen = false;
const INS_AC = { exp: '#ff453a', inc: '#30d158' };
const insPl = (n, o, f, m) => (n % 10 === 1 && n % 100 !== 11) ? o : ((n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)) ? f : m);

function openInsights() {
  if (insOpen) return;
  insOpen = true;
  const scrim = document.createElement('div');
  scrim.className = 'scrim';
  const el = document.createElement('div');
  el.className = 'ins-screen';
  el.innerHTML = insScreenHTML();
  $('#overlays').append(scrim, el);
  icons(el);
  insEl = el;
  insScrim = scrim;
  insBind(el);
  void el.offsetHeight;
  void scrim.offsetHeight;
  requestAnimationFrame(() => {
    scrim.classList.add('in');
    el.classList.add('show');
  });
  scrim.onclick = () => closeInsights();
  history.pushState({ depth: 'ins' }, '');
}

function closeInsights(fromHistory) {
  if (!insOpen) return;
  insOpen = false;
  const el = insEl, scrim = insScrim;
  insEl = null; insScrim = null;
  if (el) el.classList.remove('show');
  if (scrim) scrim.classList.remove('in');
  setTimeout(() => {
    if (el) el.remove();
    if (scrim) scrim.remove();
  }, 280);
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
    scopeTxns(rr, UI.accId).filter(t => isTxnOverviewVisible(t, UI.accId)).forEach(t => { if (t.type !== 'expense') return; const k = dkey(t); m[k] = (m[k] || 0) + t.amount; });
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
  h += std(i++, 'archive', 'Средние траты в день', amt(s.avgDaily, s.cur), amt(s.totalExp, s.cur) + ' за период');
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
        haptic('selection');
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
  if (p) p.onclick = () => { UI.insights.off--; haptic('light'); insRefresh(el); };
  const n = el.querySelector('[data-act="ins-next"]');
  if (n) n.onclick = () => { if (UI.insights.off < 0) { UI.insights.off++; haptic('light'); insRefresh(el); } };
  const g = el.querySelector('.ins-grab'); if (!g) return;
  let y0 = 0, dy = 0, on = false;
  const d0 = e => { on = true; y0 = e.clientY; dy = 0; el.classList.add('drag'); g.setPointerCapture(e.pointerId); };
  const d1 = e => { if (!on) return; dy = Math.max(0, e.clientY - y0); el.style.transform = 'translateY(' + dy + 'px)'; };
  const d2 = () => {
    if (!on) return;
    on = false; el.classList.remove('drag'); el.style.transform = '';
    if (dy > 90) { haptic('light'); closeInsights(); }
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
    insBtnHold = setTimeout(() => { insBtnHold = 'on'; b.classList.add('dragging'); haptic('light'); }, 240);
  });
  const insBtnClear = e => {
    const b = e.target.closest ? e.target.closest('.insbtn') : null;
    if (insBtnHold) { clearTimeout(insBtnHold); insBtnHold = null; }
    if (b) b.classList.remove('dragging');
  };
  $('#view').addEventListener('pointerup', insBtnClear);
  $('#view').addEventListener('pointercancel', insBtnClear);
}

if (typeof window !== 'undefined') {
  window.computeInsights = computeInsights;
  window.openInsights = openInsights;
  window.closeInsights = closeInsights;
  window.insRefresh = insRefresh;
  window.insScreenHTML = insScreenHTML;
}
