"use strict";

/* screens/home/analytics.js — экран «Статистика» (v3 rebuild): графики donut / line, сравнение периодов, категории. */

const AS = { kind: 'expense', mode: 'donut', period: 'month', custom: null, compare: false, focus: null, selDay: null, el: null };
/* типы визуализации: круговая / линейный */
const AS_MODES = [
  ['donut', 'Круговая', 'chart-pie'],
  ['line', 'Линейный', 'chart-candlestick']
];
const AS_MODE_ICON = Object.fromEntries(AS_MODES.map(m => [m[0], m[2]]));
/* inline-иконка для переключателя типа графика (не зависит от lucide re-render) */
function asModeIconSVG(name) {
  return svgIcon(name, '', 24);
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
    (S.transactions || []).forEach(x => { if (!acc || x.accountId === acc || x.toAccountId === acc) { const k = dkey(x); if (!min || k < min) min = k; } });
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
  const opsCount = counts.reduce((x, c) => x + c, 0);
  return { r, kind, buckets, n: buckets.length, days, counts, prev, prevTotal, segs, visible, visTotal, focus, cur, opsCount };
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
function roundedDonutSlicePath(cx, cy, r0, r1, a0, a1, cr) {
  const span = a1 - a0;
  if (span <= 0) return '';
  const maxCr = Math.min((r1 - r0) / 2, (span * r0) / 2.2);
  const r = Math.max(0, Math.min(cr, maxCr));
  const pt = (R, a) => [
    (cx + R * Math.sin(a)).toFixed(3),
    (cy - R * Math.cos(a)).toFixed(3)
  ];
  if (r < 0.5) {
    const p1 = pt(r1, a0), p2 = pt(r1, a1), p3 = pt(r0, a1), p4 = pt(r0, a0);
    const large = span > Math.PI ? 1 : 0;
    return 'M ' + p1[0] + ' ' + p1[1] + ' A ' + r1 + ' ' + r1 + ' 0 ' + large + ' 1 ' + p2[0] + ' ' + p2[1] +
      ' L ' + p3[0] + ' ' + p3[1] + ' A ' + r0 + ' ' + r0 + ' 0 ' + large + ' 0 ' + p4[0] + ' ' + p4[1] + ' Z';
  }
  const daOut = Math.asin(r / (r1 - r));
  const daIn = Math.asin(r / (r0 + r));
  const lOut = Math.sqrt((r1 - r) * (r1 - r) - r * r);
  const lIn = Math.sqrt((r0 + r) * (r0 + r) - r * r);

  const pStartRadIn = pt(lIn, a0);
  const pStartRadOut = pt(lOut, a0);
  const pArcOutStart = pt(r1, a0 + daOut);
  const pArcOutEnd = pt(r1, a1 - daOut);
  const pEndRadOut = pt(lOut, a1);
  const pEndRadIn = pt(lIn, a1);
  const pArcInStart = pt(r0, a1 - daIn);
  const pArcInEnd = pt(r0, a0 + daIn);

  const largeOut = (a1 - daOut - (a0 + daOut)) > Math.PI ? 1 : 0;
  const largeIn = (a1 - daIn - (a0 + daIn)) > Math.PI ? 1 : 0;

  return [
    'M ' + pStartRadIn[0] + ' ' + pStartRadIn[1],
    'L ' + pStartRadOut[0] + ' ' + pStartRadOut[1],
    'A ' + r + ' ' + r + ' 0 0 1 ' + pArcOutStart[0] + ' ' + pArcOutStart[1],
    'A ' + r1 + ' ' + r1 + ' 0 0 1 ' + pArcOutEnd[0] + ' ' + pArcOutEnd[1],
    'A ' + r + ' ' + r + ' 0 0 1 ' + pEndRadOut[0] + ' ' + pEndRadOut[1],
    'L ' + pEndRadIn[0] + ' ' + pEndRadIn[1],
    'A ' + r + ' ' + r + ' 0 0 1 ' + pArcInStart[0] + ' ' + pArcInStart[1],
    'A ' + r0 + ' ' + r0 + ' 0 0 1 ' + pArcInEnd[0] + ' ' + pArcInEnd[1],
    'A ' + r + ' ' + r + ' 0 0 1 ' + pStartRadIn[0] + ' ' + pStartRadIn[1],
    'Z'
  ].join(' ');
}
function asDonutSVG(d) {
  const segs = asDonutSegs(d);
  const tot = d.visTotal || 1;
  const isMulti = segs.length > 1;
  const cx = 172, cy = 172, r0 = 110, r1 = 170;
  const gapRad = isMulti ? (2 / 140) : 0;
  const rimGap = isMulti ? (6 / (2 * Math.PI * 168) * 100) : 0;
  let acc = 0;

  const slices = segs.map((s, i) => {
    const span = (s.v / tot) * 2 * Math.PI;
    const len = (s.v / tot) * 100;
    const isFocused = AS.focus === s.id;
    const a0 = acc + gapRad / 2;
    const a1 = Math.max(a0 + 0.02, acc + span - gapRad / 2);

    const rimDash = Math.max(0.01, len - rimGap);
    const rimOff = -(acc / (2 * Math.PI) * 100 + rimGap / 2);

    acc += span;
    const dPath = roundedDonutSlicePath(cx, cy, r0, r1, a0, a1, 2);
    const bodyCol = isFocused ? s.color : `color-mix(in srgb, ${s.color} 22%, #131316)`;
    const slice =
      '<g class="as-dslice' +
      (isFocused ? ' on' : '') +
      '" data-seg="' +
      s.id +
      '" style="--c:' +
      s.color +
      ';--k:' +
      i +
      '">' +
      '<path class="as-dseg-body" fill="' +
      bodyCol +
      '" d="' +
      dPath +
      '"/>' +
      '<g transform="rotate(-90 172 172)">' +
      '<circle class="as-dseg-rim" cx="172" cy="172" r="168" pathLength="100" fill="none" stroke="' +
      s.color +
      '" stroke-width="4" stroke-linecap="round" stroke-dasharray="' +
      rimDash.toFixed(3) +
      ' 100" stroke-dashoffset="' +
      rimOff.toFixed(3) +
      '"/>' +
      '</g>' +
      '</g>';
    return slice;
  }).join('');

  return '<svg id="asDonut" viewBox="0 0 344 344" width="344" height="344"><g class="as-donutspin">' +
    '<circle cx="172" cy="172" r="140" fill="none" stroke="rgba(255,255,255,.03)" stroke-width="60"/>' +
    slices +
    '</g></svg>';
}
function asFlowSummaryHTML(incTotal, expTotal, amtv) {
  return '<span class="flowi flowi--in">' + ARR_IN + '<b>' + amtv(incTotal) + '</b></span><span class="flowi flowi--out">' + ARR_OUT + '<b>' + amtv(expTotal) + '</b></span>';
}
/* авто-размер суммы в центре: длинные суммы сжимаются, никогда не переносятся */
function asCenterB(html, base) {
  return '<b style="font-size:23px">' + html + '</b>';
}
function asCenterHTML(d, amtv) {
  if (AS.focus) {
    const segs = asDonutSegs(d);
    const s = segs.find(x => x.id === AS.focus);
    if (s) {
      const share = d.visTotal > 0 ? (s.v / d.visTotal * 100).toFixed(1).replace('.', ',') : '0';
      return '<div class="as-donut__hub"><span class="as-donut__ic" style="--cc:' + s.color + '"><i data-lucide="' + (s.icon || 'shopping-bag') + '" class="ic"></i></span>' +
        '<div class="as-donut__name" style="color:' + s.color + ';margin-bottom:9px">' + esc(s.name) + '</div>' +
        asCenterB(amtv(s.v), 32) +
        '<div class="as-donut__pct">' + share + '%</div></div>';
    }
  }
  return '<div class="as-donut__hub">' +
    '<div class="as-donut__name" style="color:var(--mut);font-size:14px;font-weight:600;margin-bottom:8px">Итого</div>' +
    asCenterB(amtv(d.visTotal), 32) +
    '</div>';
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
        b.setAttribute('fill', isOn ? col : `color-mix(in srgb, ${col} 22%, #131316)`);
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
function asCatRowHTML(s, i, total, amtv) {
  const isAll = s.id === '__all__' || s.isAll;
  const ex = !isAll && (S.settings.statsExcluded || []).includes(s.id);
  const color = isAll ? '#FFFFFF' : (s.color || '#8E8E93');
  const icon = s.icon || 'circle-slash';
  const share = (!isAll && !ex && total > 0) ? Math.min(1, Math.max(0, s.v / total)) : 0;
  const cls = 'as__cat' + (isAll ? ' as__cat--all' : '') +
    (isAll ? (AS.focus ? ' dim' : ' focus') : (AS.focus === s.id ? ' focus' : (AS.focus ? ' dim' : '')));
  return '<div class="' + cls + '" style="--cc:' + color + ';--p:' + share.toFixed(4) + ';--i:' + i + '" data-id="' + s.id + '">' +
    (!isAll ? '<span class="as__cat-fill"></span>' : '') +
    (!isAll ? '<span class="as__cat-ic"><i data-lucide="' + icon + '" class="ic"></i></span>' : '') +
    '<span class="as__cat-name">' + esc(s.name) + '</span>' +
    '<span class="as__cat-sp"></span>' +
    '<span class="as__cat-v">' + amtv(s.v) + '</span>' +
    '<button class="as__ck' + (ex ? '' : ' on') + '" type="button" aria-label="' + (ex ? 'Включить категорию' : 'Исключить категорию') + '"><i data-lucide="check" class="ic"></i></button>' +
    '</div>';
}
function asAccBtnContentHTML() {
  const a = UI.accId ? accById(UI.accId) : null;
  const t = totalsByCur();
  const main = a ? accBalance(a.id) : (t[S.settings.currency] || 0);
  return '<span class="tile tile--round" style="' + (a ? '--c:' + a.color : '--c:var(--t2);background:#000') + '">' +
    (a ? '<i data-lucide="' + a.icon + '" class="ic"></i>' : ALL_ACC_IC) + '</span>' +
    '<span class="chip__tx"><span class="chip__t">' + esc(a ? a.name : 'Все счета') + '</span><span class="chip__s">' + money(main, a ? a.currency : S.settings.currency) + '</span></span>';
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
  const kind = AS.kind, cur = d.cur;
  const col = kind === 'income' ? 'var(--inc)' : kind === 'all' ? 'var(--txt)' : 'var(--exp)';
  const hide = S.settings.hideAmounts;
  const amtv = v => hide ? '•••' : money(v, cur);
  /* синхронизация переключателя типа графика и кнопок шапки */
  const mbtn = el.querySelector('#asModeBtn');
  if (mbtn) {
    const mic = mbtn.querySelector('.as-modebtn__ic');
    if (mic) mic.innerHTML = asModeIconSVG(AS_MODE_ICON[AS.mode] || 'chart-pie');
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
  if (pb) {
    const curV = (AS.period === 'custom' && AS.custom) ? ('custom:' + AS.custom) : (AS.period || 'month');
    const lab = pb.querySelector('#asPeriodLabel');
    if (lab) {
      lab.textContent = d.r.label;
    }
    const sel = pb.querySelector('#asPeriodSelect');
    if (sel) {
      sel.innerHTML = periodOptionsHTML(curV, AS_PRESETS);
      sel.value = curV;
    } else {
      pb.innerHTML = '<span id="asPeriodLabel">' + esc(d.r.label) + '</span>' +
        '<select class="balper__select" id="asPeriodSelect" aria-label="Период" onchange="onAsPeriodChange(this.value)" onblur="onAsPeriodChange(this.value)">' +
        periodOptionsHTML(curV, AS_PRESETS) +
        '</select>';
    }
  }
  const tit = el.querySelector('#asAccBtn');
  if (tit) {
    tit.innerHTML = asAccBtnContentHTML();
    icons(tit);
  }
  const content = el.querySelector('#asContent');
  if (!content) return;
  let html = '';
  /* ── пустое состояние ── */
  const isEmpty = combined ? (d.visTotal === 0 && !d.opsCount && (!d2 || (d2.visTotal === 0 && !d2.opsCount))) : (d.visTotal === 0 && !d.opsCount);
  if (isEmpty) {
    content.innerHTML = '<div class="as-empty"><i data-lucide="chart-pie" class="ic"></i>' +
      '<h3>Нет данных за выбранный период</h3><p>Добавьте операции, чтобы увидеть аналитику.</p></div>';
    icons(content);
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
    html += asCatRowHTML({ id: '__all__', name: 'Все категории', isAll: true, v: d2.visTotal - d.visTotal }, 0, 0, amtv);
    html += '<div class="as-sect"><span>Доход</span><small>' + d2.opsCount + ' оп.</small></div>' +
      '<div class="as-cats">' + d2.segs.map((s, i) => asCatRowHTML(s, i + 1, d2.visTotal, amtv)).join('') + '</div>';
    html += '<div class="as-sect"><span>Расход</span><small>' + d.opsCount + ' оп.</small></div>' +
      '<div class="as-cats">' + d.segs.map((s, i) => asCatRowHTML(s, i + 1, d.visTotal, amtv)).join('') + '</div>';
  } else {
    html += asCatRowHTML({ id: '__all__', name: 'Все категории', isAll: true, v: d.visTotal }, 0, 0, amtv);
    html += '<div class="as-cats">' + d.segs.map((s, i) => asCatRowHTML(s, i + 1, d.visTotal, amtv)).join('') + '</div>';
  }

  content.innerHTML = html;
  icons(content);
  /* прорисовка сегментов бублика: каскад 40ms, transition 800ms */
  const dsegs = content.querySelectorAll('.as-dseg');
  if (dsegs.length) {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      dsegs.forEach((c, i) => setTimeout(() => { c.style.strokeDashoffset = c.dataset.off; }, 40 * i));
    }));
  }
  /* ── интерактив: линия ── */
  const svg = content.querySelector('#asLine');
  if (svg) {
    const updSel = () => {
      const gg = content.querySelector('#asSelG'), dot = content.querySelector('#asSelDot'), dot2 = content.querySelector('#asSelDot2'), guide = content.querySelector('#asSelGuide'), tip = content.querySelector('#asTip');
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
        const card = content.querySelector('#asLineCard');
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
      haptic('selection');
      updSel();
    };
    updSel();
  }
  /* ── интерактив: donut ── */
  const donut = content.querySelector('#asDonut');
  if (donut) donut.onclick = e => {
    const rect = donut.getBoundingClientRect();
    const scale = rect.width / 344 || 1;
    const px = (e.clientX - (rect.left + rect.width / 2)) / scale;
    const py = (e.clientY - (rect.top + rect.height / 2)) / scale;
    const dist = Math.hypot(px, py);
    const segs = asDonutSegs(d);
    // тап в отверстие по центру
    if (dist < 105) {
      if (AS.focus) AS.focus = null;
      else if (segs.length) AS.focus = segs[0].id;
      haptic('selection');
      asApplyFocus();
      return;
    }
    // за пределами внешнего ободка
    if (dist > 178) return;
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
    haptic('light');
    asApplyFocus();
  };
  const donutC = content.querySelector('#asDonutCenter');
  if (donutC) donutC.onclick = e => {
    if (e.target.closest('.as-donut__hub')) {
      const segs = asDonutSegs(d);
      if (AS.focus) AS.focus = null;
      else if (segs.length) AS.focus = segs[0].id;
      haptic('selection');
      asApplyFocus();
    }
  };
  /* ── интерактив: список категорий ── */
  content.querySelectorAll('.as__cat').forEach(row => row.onclick = e => {
    if (e.target.closest('.as__ck')) {
      const excl = S.settings.statsExcluded || (S.settings.statsExcluded = []);
      const id = row.dataset.id;
      if (excl.includes(id)) excl.splice(excl.indexOf(id), 1); else excl.push(id);
      save(); haptic('selection'); asRender();
      return;
    }
    const id = row.dataset.id;
    if (id === '__all__') {
      if (AS.focus) { AS.focus = null; haptic('selection'); asApplyFocus(); }
      return;
    }
    AS.focus = AS.focus === id ? null : id;
    haptic('selection'); asApplyFocus();
  });
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
    haptic('light');
    /* «Все» существует только у линии — при уходе в донат/бар/санкей откатываемся на «Расход» */
    if (!asKindAllowed(v).includes(AS.kind)) AS.kind = 'expense';
    AS.mode = v; AS.focus = null; AS.selDay = null;
    close(); asRender();
  });
}

/* ── экран: шапка (закрыть · счёт · сравнение · тип графика) + переключатель знака (скрыт для sankey) + период ── */
function asHTML() {
  const curV = (AS.period === 'custom' && AS.custom) ? ('custom:' + AS.custom) : (AS.period || 'month');
  return '<div class="as">' +
    '<div class="as__hd">' +
    '<button class="iconbtn" data-act="as-close" aria-label="Закрыть"><i data-lucide="x" class="ic"></i></button>' +
    '<button class="chip chip--lg as-acc" id="asAccBtn" data-act="as-acc" aria-label="Источник данных">' +
    asAccBtnContentHTML() +
    '</button>' +
    '<div class="as__hacts">' +
    '<button class="as-cmp' + (AS.mode !== 'line' ? ' as-hid' : '') + (AS.compare ? ' on' : '') + '" id="asCmpBtn" data-act="as-compare" aria-label="Сравнение с прошлым периодом"><i data-lucide="arrow-left-right" class="ic"></i></button>' +
    '<button class="as-modebtn" id="asModeBtn" data-act="as-mode" aria-label="Тип графика" aria-haspopup="true" aria-expanded="false">' +
    '<span class="as-modebtn__ic">' + asModeIconSVG(AS_MODE_ICON[AS.mode]) + '</span>' +
    '</button>' +
    '</div>' +
    '</div>' +
    '<div class="as__body" id="asbody">' +
    '<div class="as__ctl' + (AS.mode === 'donut' ? ' as-donutmode' : '') + '" id="asCtl">' +
    '<div class="as-kind" data-seg="askind" data-v="' + AS.kind + '" id="asKind">' +
    '<button type="button" data-segv="expense" aria-selected="' + (AS.kind === 'expense') + '">' + ARR_OUT + '<span>Расход</span></button>' +
    '<button type="button" data-segv="income" aria-selected="' + (AS.kind === 'income') + '">' + ARR_IN + '<span>Доход</span></button>' +
    '<button type="button" data-segv="all" class="as-kind__all" aria-selected="' + (AS.kind === 'all') + '"><i data-lucide="activity" class="ic"></i><span>Все</span></button>' +
    '</div>' +
    '<div class="as-perbtn" id="asPeriodBtn" data-act="as-period">' +
    '<span id="asPeriodLabel">' + esc(asRange().label) + '</span>' +
    '<select class="balper__select" id="asPeriodSelect" aria-label="Период" onchange="onAsPeriodChange(this.value)" onblur="onAsPeriodChange(this.value)">' +
    periodOptionsHTML(curV, AS_PRESETS) +
    '</select>' +
    '</div>' +
    '</div>' +
    '<div class="as__content" id="asContent"></div>' +
    '</div>' +
    '</div>';
}

function openStats() {
  AS.focus = null;
  AS.selDay = null;
  const rec = pushScreen({
    id: 'stats',
    push: true,
    html: asHTML(),
    mount: asMount,
    refresh: () => asRender(),
    dispose: () => { AS.focus = null; AS.selDay = null; AS.el = null; }
  });
  rec.el.classList.add('astats');
  AS.el = rec.el;
}

function asMount(el) {
  AS.el = el;
  el.querySelector('[data-act="as-close"]').onclick = () => {
    AS.focus = null;
    AS.selDay = null;
    AS.el = null;
    popScreen();
  };
  el.querySelector('[data-act="as-acc"]').onclick = () => openAccounts();
  const modeBtn = el.querySelector('[data-act="as-mode"]');
  if (modeBtn) modeBtn.onclick = () => asModeDropdown(modeBtn);
  el.querySelector('[data-act="as-compare"]').onclick = () => { AS.compare = !AS.compare; haptic('selection'); asRender(); };
  const asSel = el.querySelector('#asPeriodSelect');
  if (asSel) {
    asSel.addEventListener('change', () => onAsPeriodChange(asSel.value));
    asSel.addEventListener('blur', () => onAsPeriodChange(asSel.value));
  }
  const asPerBtn = el.querySelector('[data-act="as-period"]');
  if (asPerBtn) {
    asPerBtn.onclick = e => {
      if (e.target && e.target.id === 'asPeriodSelect') return;
      openPeriodPicker('asPeriodSelect');
    };
  }
  const seg = el.querySelector('[data-seg="askind"]');
  if (seg) seg.querySelectorAll('[data-segv]').forEach(b => b.onclick = () => {
    if (b.getAttribute('aria-selected') === 'true') return;
    if (!asKindAllowed(AS.mode).includes(b.dataset.segv)) return;
    seg.dataset.v = b.dataset.segv;
    seg.querySelectorAll('[data-segv]').forEach(x => x.setAttribute('aria-selected', x === b ? 'true' : 'false'));
    haptic('selection'); AS.kind = b.dataset.segv; AS.focus = null; AS.selDay = null; AS.compare = false; asRender();
  });
  asRender();
}

if (typeof window !== 'undefined') {
  window.AS = AS;
  window.AS_MODES = AS_MODES;
  window.AS_MODE_ICON = AS_MODE_ICON;
  window.AS_PRESETS = AS_PRESETS;
  window.asKindAllowed = asKindAllowed;
  window.asKind = asKind;
  window.asRange = asRange;
  window.asBucketPlan = asBucketPlan;
  window.asCompute = asCompute;
  window.asNiceMax = asNiceMax;
  window.asShort = asShort;
  window.asMonotone = asMonotone;
  window.asLineSVG = asLineSVG;
  window.asDonutSVG = asDonutSVG;
  window.asFlowSummaryHTML = asFlowSummaryHTML;
  window.asCenterHTML = asCenterHTML;
  window.asHeaderFor = asHeaderFor;
  window.asApplyFocus = asApplyFocus;
  window.asCatRowHTML = asCatRowHTML;
  window.asAccBtnContentHTML = asAccBtnContentHTML;
  window.asRender = asRender;
  window.asModeDropdown = asModeDropdown;
  window.asHTML = asHTML;
  window.openStats = openStats;
  window.asMount = asMount;
}
