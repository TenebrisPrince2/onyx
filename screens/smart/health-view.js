"use strict";

/* screens/smart/health-view.js — экран «Финансовое здоровье» (индекс, кольцо прогресса, спарклайн, рекомендации). */

function hlRingSVG(score, color, inner) {
  const C = 2 * Math.PI * 34;
  return '<span class="hl-ring"><svg viewBox="0 0 80 80"><circle class="hl-track" cx="40" cy="40" r="34"/>' +
    '<circle class="hl-val" cx="40" cy="40" r="34" transform="rotate(-90 40 40)" style="--c:' + C.toFixed(1) + ';--off:' + (C * (1 - clamp(score, 0, 100) / 100)).toFixed(1) + '"/></svg>' + inner + '</span>';
}

function healthCardHTML(inMenu) {
  try {
    const h = healthCore();
    const tag = inMenu ? 'div' : 'button';
    const act = inMenu ? '' : ' data-act="health" type="button"';
    const extra = inMenu ? 'cursor:default;margin-bottom:14px;' : '';
    const go = inMenu ? '' : '<i data-lucide="chevron-right" class="ic hl-go"></i>';
    if (h.insufficient || h.score === null) {
      const p = Math.round(h.daysLogged / 30 * 100);
      return '<' + tag + ' class="hl-card"' + act + ' style="--tn:#0a84ff;' + extra + '">' +
        '<span class="hl-card__tint"></span>' +
        hlRingSVG(p, '', '<b>' + h.daysLogged + '<i style="font-style:normal;font-size:13px;color:#8b9097">/30</i></b>') +
        '<span class="hl-mn"><span class="hl-lab"><i data-lucide="heart" class="ic"></i>Финансовое здоровье</span>' +
        '<span class="hl-t">Собираем данные</span>' +
        '<span class="hl-s">Добавляйте операции 30 дней — и индекс станет точным</span></span>' + go + '</' + tag + '>';
    }
    const d = healthDelta();
    const trend = d === null || d === 0 ? '' :
      '<span class="hl-tr ' + (d > 0 ? 'hl-tr--up' : 'hl-tr--dn') + '"><i data-lucide="' + (d > 0 ? 'trending-up' : 'trending-down') + '" class="ic"></i>' + (d > 0 ? '+' + d : d) + '</span>';
    const col = hlColor(h);
    return '<' + tag + ' class="hl-card"' + act + ' style="--tn:' + col + ';' + extra + '">' +
      '<span class="hl-card__tint"></span>' +
      hlRingSVG(h.score, col, '<b>' + h.score + '</b>') +
      '<span class="hl-mn"><span class="hl-lab"><i data-lucide="heart" class="ic" style="color:' + col + '"></i>Финансовое здоровье</span>' +
      '<span class="hl-t">' + hlWord(h) + trend + '</span>' +
      '<span class="hl-s">Накопл. ' + (h.savRate === null ? '—' : Math.round(h.savRate * 100) + '%') + ' · серия ' + h.streak + ' дн.' + (h.varHasData ? ' · Δ ' + Math.round(h.variance * 100) + '%' : '') + '</span></span>' + go + '</' + tag + '>';
  } catch (e) { return ''; }
}

/* ── полный отчёт ── */
function healthScreenHTML() {
  const h = healthCore();
  const hd = '<div class="as__hd">' +
    '<button class="as__btn" data-act="close" aria-label="Закрыть"><i data-lucide="x" class="ic" style="width:20px;height:20px"></i></button>' +
    '<div class="as__ttl">Финансовое здоровье</div>' +
    '<span class="as__hsp"></span>' +
    '<button class="as__btn" data-act="hl-ai" aria-label="AI-советник"><i data-lucide="sparkle" class="ic" style="width:20px;height:20px"></i></button></div>';
  if (h.insufficient || h.score === null) {
    const p = Math.round(h.daysLogged / 30 * 100);
    const left = 30 - h.daysLogged;
    return '<div class="as"><div class="as__grab"></div>' + hd +
      '<div class="as__body hl-body">' + healthCardHTML(true) + '<div class="hl-empty">' +
      hlRingSVG(p, '', '<b style="font-size:22px">' + h.daysLogged + '<i style="font-style:normal;font-size:13px;color:#8b9097">/30</i></b>') +
      '<h3>Недостаточно данных</h3>' +
      '<p>Добавляйте операции 30 дней — тогда индекс будет точным и персональным. Записано дней: <b>' + h.daysLogged + '</b> из 30.</p>' +
      '<div class="hl-prog"><div class="hl-bar"><i data-w="' + p + '" style="--sc:#0a84ff"></i></div>' +
      '<small>' + (left > 0 ? 'Осталось ' + left + ' ' + insPl(left, 'день', 'дня', 'дней') : 'Почти готово!') + '</small></div>' +
      '<button class="btn btn--chrome" data-act="hl-add" style="margin-top:8px">Добавить операцию</button>' +
      '<p style="font-size:12px;max-width:320px">Что появится: норма сбережений, подушка безопасности, стабильность расходов, серия записей, цели и платежи вовремя.</p>' +
      '</div></div></div>';
  }
  const col = hlColor(h);
  const hist = healthHistory();
  const delta = healthDelta();
  const prev = hist.length >= 2 ? hist[hist.length - 2] : null;
  const acts = healthActions(h);
  HL_LAST = { acts, hist };
  /* герой */
  const trendLine = delta === null ? '' :
    '<div class="hl-hero__trend ' + (delta >= 0 ? 'up' : 'dn') + '"><i data-lucide="' + (delta >= 0 ? 'trending-up' : 'trending-down') + '" class="ic"></i>' +
    (delta > 0 ? '+' + delta : delta) + ' ' + insPl(Math.abs(delta), 'пункт', 'пункта', 'пунктов') + ' за месяц</div>';
  const cmpLine = prev && prev.score !== null
    ? '<div class="hl-hero__cmp">' + (delta > 0 ? 'Лучше, чем в ' : delta < 0 ? 'Хуже, чем в ' : 'На уровне ') + MON_PREP[prev.month] + '</div>'
    : '';
  const perfect = h.score >= 90 && h.comps.filter(c => c.score !== null).every(c => c.score >= 80) && (delta === null || delta >= 0);
  /* спарклайн */
  const W = 320, H = 92, pl = 14, pr = 14, pt = 18, pb = 22;
  const X = i => pl + (W - pl - pr) * (hist.length < 2 ? .5 : i / (hist.length - 1));
  const Y = v => pt + (H - pt - pb) * (1 - v / 100);
  const pts = hist.map((p2, i) => [X(i), Y(p2.score === null ? 0 : p2.score)]);
  const dLine = 'M' + pts.map(p2 => p2[0].toFixed(1) + ' ' + p2[1].toFixed(1)).join(' L');
  const dArea = pts.length > 1 ? dLine + ' L' + pts[pts.length - 1][0].toFixed(1) + ' ' + (H - pb) + ' L' + pts[0][0].toFixed(1) + ' ' + (H - pb) + ' Z' : '';
  let dots = '', labs = '';
  hist.forEach((p2, i) => {
    const x = X(i), y = Y(p2.score === null ? 0 : p2.score), last = i === hist.length - 1;
    if (last) dots += '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="8" fill="url(#hlGrad)" opacity=".2"/>';
    dots += '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="' + (last ? 4 : 3) + '" fill="' + (last ? '#f5f6f8' : 'url(#hlGrad)') + '" stroke="rgba(0,0,0,.35)" stroke-width="1"/>' +
      '<circle class="hl-hit" data-hi="' + i + '" data-x="' + x.toFixed(1) + '" cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="16" fill="transparent"/>';
    labs += '<text x="' + x.toFixed(1) + '" y="' + (H - 6) + '" fill="' + (last ? '#f5f6f8' : '#8b9097') + '" font-size="9.5" font-weight="600" text-anchor="middle">' + MON_S[p2.month] + '</text>';
  });
  const grid = '<line x1="' + pl + '" y1="' + Y(0).toFixed(1) + '" x2="' + (W - pr) + '" y2="' + Y(0).toFixed(1) + '" stroke="rgba(255,255,255,.1)"/>' +
    '<line x1="' + pl + '" y1="' + Y(50).toFixed(1) + '" x2="' + (W - pr) + '" y2="' + Y(50).toFixed(1) + '" stroke="rgba(255,255,255,.07)" stroke-dasharray="3 4"/>' +
    '<line x1="' + pl + '" y1="' + Y(100).toFixed(1) + '" x2="' + (W - pr) + '" y2="' + Y(100).toFixed(1) + '" stroke="rgba(255,255,255,.07)" stroke-dasharray="3 4"/>';
  /* составляющие */
  const stCol = { ok: '#30d158', warn: '#ff9500', bad: '#ff453a', skip: '#8b9097' };
  const stIco = { ok: 'check', warn: 'info', bad: 'x', skip: 'info' };
  const compsHTML = h.comps.map((c, i) =>
    '<div class="hl-comp hl-comp--' + c.status + '" style="--i:' + i + ';--sc:' + stCol[c.status] + '" data-v="' + (c.score === null ? 0 : c.score) + '">' +
    '<div class="hl-comp__hd"><span class="hl-comp__ic"><i data-lucide="' + c.icon + '" class="ic"></i></span>' +
    '<span class="hl-comp__name">' + c.name + '</span>' +
    (c.status === 'skip' ? '' : '<span class="hl-comp__st"><i data-lucide="' + stIco[c.status] + '" class="ic"></i></span>') + '</div>' +
    '<div class="hl-comp__val"><b>' + esc(c.value) + '</b><span>' + c.target + '</span></div>' +
    '<div class="hl-bar"><i data-w="' + (c.score === null ? 0 : c.score) + '"></i></div>' +
    '<div class="hl-comp__hint">' + esc(c.hint) + (c.sub ? ' · <span>' + esc(c.sub) + '</span>' : '') + '</div></div>').join('');
  /* действия */
  const actsHTML = acts.length ? '<div class="hl-sect">Что улучшить</div><div class="hl-acts">' +
    acts.map((a, i) =>
      '<div class="hl-act" style="--i:' + i + '">' +
      '<div class="hl-act__hd"><span class="hl-act__ic"><i data-lucide="' + a.icon + '" class="ic"></i></span>' +
      '<div class="hl-act__tt"><b>' + esc(a.title) + '</b>' +
      '<span>+' + a.gain + ' ' + insPl(a.gain, 'пункт', 'пункта', 'пунктов') + ' · ' + a.effort + ' · ' + a.time + '</span></div>' +
      '<button class="hl-act__btn" data-ai="' + i + '" type="button">' + esc(a.apply.label) + '<i data-lucide="chevron-right" class="ic"></i></button></div>' +
      '<p>' + esc(a.body) + '</p></div>').join('') + '</div>' : '';
  /* сравнение с прошлым месяцем */
  let cmpHTML = '';
  const prevH = prev ? healthCore(prev.asOf) : null;
  if (prevH) {
    const dSav = h.savRate === null || prevH.savRate === null ? null : Math.round((h.savRate - prevH.savRate) * 100);
    const dExp = prevH.exp30 > 0 ? Math.round((h.exp30 - prevH.exp30) / prevH.exp30 * 100) : null;
    let ins = 'Расходы держатся на уровне прошлого месяца.';
    try {
      const agg = off => {
        const m = {};
        scopeTxns(periodRange('month', off), null).filter(t => t.type === 'expense').forEach(t => {
          const c = txnRootOf(t) || txnCatOf(t);
          if (c) m[c.id] = { n: c.name, v: (m[c.id] ? m[c.id].v : 0) + t.amount };
        });
        return m;
      };
      const A = agg(0), B = agg(-1);
      let best = null, worst = null;
      Object.keys(A).forEach(id => {
        const b0 = B[id] ? B[id].v : 0;
        if (b0 < 15) return;
        const drop = b0 - A[id].v, rise = A[id].v - b0;
        if (drop / b0 >= .15 && (!best || drop > best.d)) best = { n: A[id].n, d: drop, p: Math.round(drop / b0 * 100) };
        if (rise / b0 >= .25 && (!worst || rise > worst.d)) worst = { n: A[id].n, d: rise, p: Math.round(rise / b0 * 100) };
      });
      if (best) ins = 'Вы стали тратить на <b>' + best.p + '%</b> меньше на «' + esc(best.n) + '» — отличная работа!';
      else if (worst) ins = 'Больше всего выросли «<b>' + esc(worst.n) + '</b>»: +' + worst.p + '% к прошлому месяцу. Пересмотрите бюджет категории.';
    } catch (e) {}
    cmpHTML = '<div class="hl-sect">Сравнение с прошлым месяцем</div><div class="hl-cmp">' +
      '<div class="hl-cmp__c"><span class="hl-cmp__l">' + MON_N[prev.month] + '</span>' +
      '<span class="hl-cmp__s">' + (prev.score === null ? '—' : prev.score) + '</span>' +
      '<div class="hl-cmp__r"><span>Сбережения</span><b>' + (prevH.savRate === null ? '—' : Math.round(prevH.savRate * 100) + '%') + '</b></div>' +
      '<div class="hl-cmp__r"><span>Расходы</span><b>' + money(prevH.exp30, h.cur) + '</b></div></div>' +
      '<div class="hl-cmp__c" style="border-color:color-mix(in srgb,' + col + ' 30%,transparent)">' +
      '<span class="hl-cmp__l" style="color:' + col + '">' + MON_N[new Date().getMonth()] + ' · сейчас</span>' +
      '<span class="hl-cmp__s" style="color:' + col + '">' + h.score + '</span>' +
      '<div class="hl-cmp__r"><span>Сбережения</span><b>' + (h.savRate === null ? '—' : Math.round(h.savRate * 100) + '%') +
      (dSav === null ? '' : '<i class="' + (dSav >= 0 ? 'gd' : 'bd') + '">' + (dSav > 0 ? '+' : '') + dSav + ' пп</i>') + '</b></div>' +
      '<div class="hl-cmp__r"><span>Расходы</span><b>' + money(h.exp30, h.cur) +
      (dExp === null ? '' : '<i class="' + (dExp <= 0 ? 'gd' : 'bd') + '">' + (dExp > 0 ? '+' : '') + dExp + '%</i>') + '</b></div></div>' +
      '<div class="hl-cmp__ins">' + ins + '</div></div>';
  }
  return '<div class="as"><div class="as__grab"></div>' + hd +
    '<div class="as__body hl-body">' + healthCardHTML(true) +
    '<div class="hl-hero">' +
    hlRingSVG(h.score, col, '<b data-n="' + h.score + '" style="color:' + col + '">' + 0 + '</b>') +
    '<div class="hl-hero__lab" style="color:' + col + '">' + hlWord(h) + '</div>' +
    trendLine + cmpLine +
    '<div class="hl-hero__sub">Сбережения ' + (h.savRate === null ? '—' : Math.round(h.savRate * 100) + '%') + ' · серия ' + h.streak + ' дн. · расходы 30 дн. ' + money(h.exp30, h.cur) + '</div></div>' +
    (perfect ? '<div class="hl-party"><i data-lucide="party-popper" class="ic"></i><div><b>🎉 Идеальное здоровье!</b><span>Все составляющие в норме — держите ритм</span></div></div>' : '') +
    '<div class="hl-chart"><div class="hl-chart__hd"><span class="hl-chart__t">Динамика индекса</span><span class="hl-chart__n">6 месяцев</span></div>' +
    '<div class="hl-tip" id="hlTip"></div>' +
    '<svg viewBox="0 0 ' + W + ' ' + H + '">' + grid +
    '<path class="hl-area" d="' + dArea + '" fill="url(#hlArea)"/>' +
    '<path id="hlLine" d="' + dLine + '" fill="none" stroke="url(#hlGrad)" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>' +
    dots + labs + '</svg></div>' +
    '<div class="hl-sect">Из чего складывается индекс</div><div class="hl-comps">' + compsHTML + '</div>' +
    actsHTML + cmpHTML +
    (acts.length ? '<button class="btn btn--chrome" data-act="hl-apply" style="margin-top:4px">Применить рекомендации</button>' : '') +
    '<p class="hl-note"><i data-lucide="refresh-cw" class="ic"></i>Обновляется автоматически при добавлении операций</p>' +
    '</div></div>';
}

function hlConfetti(host) {
  const box = document.createElement('div');
  box.className = 'hl-confetti';
  const cols = ['#30d158', '#ffd60a', '#0a84ff', '#ff9500', '#ff2d55'];
  for (let i = 0; i < 26; i++) {
    const s = document.createElement('i');
    s.style.left = Math.random() * 100 + '%';
    s.style.background = cols[i % cols.length];
    s.style.animationDelay = (Math.random() * .3) + 's';
    s.style.setProperty('--dx', (Math.random() * 60 - 30) + 'px');
    box.appendChild(s);
  }
  host.appendChild(box);
  setTimeout(() => box.remove(), 1600);
}

function mountHealth(el) {
  el.classList.add('astats');
  const closeBtn = el.querySelector('[data-act="close"]');
  if (closeBtn) closeBtn.onclick = () => popScreen();
  el.querySelectorAll('[data-act="hl-ai"]').forEach(b => b.onclick = () => { haptic('light'); openAdvisor('Как улучшить моё финансовое здоровье? С чего начать?'); });
  const addBtn = el.querySelector('[data-act="hl-add"]');
  if (addBtn) addBtn.onclick = () => { haptic('light'); openEditor({ type: 'expense' }); };
  /* count-up счёта (setTimeout — rAF замирает в фоновых вкладках) */
  const nb = el.querySelector('.hl-ring b[data-n]');
  if (nb) {
    const target = +nb.dataset.n, t0 = Date.now();
    const step = () => {
      const k = clamp((Date.now() - t0) / 900, 0, 1);
      nb.textContent = Math.round(target * (1 - Math.pow(1 - k, 3)));
      if (k < 1) setTimeout(step, 40); else nb.textContent = target;
    };
    step();
  }
  /* прогресс-бары: старт с 0 → ширина из data-w */
  el.querySelectorAll('.hl-bar i[data-w]').forEach((bar, i) => {
    bar.style.transitionDelay = (250 + i * 60) + 'ms';
    setTimeout(() => { bar.style.width = bar.dataset.w + '%'; }, 60);
  });
  /* спарклайн: прорисовка линии */
  const path = el.querySelector('#hlLine');
  if (path && path.getTotalLength) {
    const len = path.getTotalLength();
    if (len > 0) {
      path.style.strokeDasharray = len;
      path.style.strokeDashoffset = len;
      path.getBoundingClientRect();
      path.style.transition = 'stroke-dashoffset .8s cubic-bezier(.22,1,.36,1)';
      setTimeout(() => { path.style.strokeDashoffset = '0'; }, 60);
      setTimeout(() => { path.style.strokeDasharray = ''; path.style.transition = ''; }, 1000);
    }
  }
  /* тапы по месяцам → тултип */
  const tip = el.querySelector('#hlTip');
  const hist = HL_LAST ? HL_LAST.hist : [];
  const showTip = i => {
    if (!tip || !hist[i]) return;
    const p = hist[i];
    const d = i > 0 && hist[i - 1].score !== null && p.score !== null ? p.score - hist[i - 1].score : null;
    tip.innerHTML = MON_N[p.month] + ' · <b>' + (p.score === null ? '—' : p.score) + '</b>' +
      (d === null || d === 0 ? '' : ' · <span class="' + (d > 0 ? 'up' : 'dn') + '">' + (d > 0 ? '+' : '') + d + '</span>');
    const hit = el.querySelector('.hl-hit[data-hi="' + i + '"]');
    tip.style.left = clamp((hit ? +hit.dataset.x : 160) / 320 * 100, 13, 87) + '%';
    tip.classList.add('on');
  };
  el.querySelectorAll('.hl-hit').forEach(c => c.onclick = () => { haptic('selection'); showTip(+c.dataset.hi); });
  if (tip && hist.length) showTip(hist.length - 1);
  /* действия */
  const acts = HL_LAST ? HL_LAST.acts : [];
  el.querySelectorAll('[data-ai]').forEach(b => b.onclick = () => {
    const a = acts[+b.dataset.ai];
    if (a) { haptic('light'); a.apply.fn(); }
  });
  const big = el.querySelector('[data-act="hl-apply"]');
  if (big) big.onclick = () => { if (acts.length) { haptic('light'); acts[0].apply.fn(); } };
  /* праздник */
  const party = el.querySelector('.hl-party');
  if (party) hlConfetti(party);
}

function openHealth() {
  const rec = pushScreen({
    id: 'health', push: true, html: healthScreenHTML(),
    mount: mountHealth,
    refresh() {
      const bodyEl = rec.el.querySelector('.as__body');
      const sc = bodyEl ? bodyEl.scrollTop : 0;
      rec.el.innerHTML = healthScreenHTML();
      icons(rec.el);
      mountHealth(rec.el);
      const b2 = rec.el.querySelector('.as__body');
      if (b2) b2.scrollTop = sc;
    }
  });
}

if (typeof window !== 'undefined') {
  window.hlRingSVG = hlRingSVG;
  window.healthCardHTML = healthCardHTML;
  window.healthScreenHTML = healthScreenHTML;
  window.hlConfetti = hlConfetti;
  window.mountHealth = mountHealth;
  window.openHealth = openHealth;
}
