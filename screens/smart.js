"use strict";
/* screens/smart.js — smart core: план дохода, советы, советник, здоровье, ИИ — секция «5b».
   Вынесено байт-в-байт; все зависимости (utils/storage/domain/S/nav/toast…) разрешаются в момент вызова через общую глобальную область. */
/* ═══════════════════════════════ 5b. smart core: план дохода, советы, здоровье, ИИ ═══════════════════════════════ */
const moneyPlain = (v, cur, o) => money(v, cur, o).replace(/<[^>]+>/g, '').replace(/\u00A0/g, ' ');
const sumOf = (list, type) => sum(list.filter(t => t.type === type).map(t => t.amount));
const txnCatOf = t => catById(t.categoryId) || null;
const txnRootOf = t => { const c = txnCatOf(t); return c ? rootOf(c) : null; };
/* «нужные» категории: еда-продукты, транспорт, жильё, коммуналка, здоровье, связь */
const MUSTHAVE_RE = /продукт|еда|супермаркет|рынок|транспорт|метро|такси|жиль[её]|дом|коммунал|аренд|ипотек|здоров|аптек|врач|медицин|стоматолог|связ[ьи]|интернет|утилит|электроэн|газ|вод[аы]/i;
const isMustHaveCat = c => { try { const r = rootOf(c); return r ? MUSTHAVE_RE.test(r.name) : false; } catch (e) { return false; } };
/* подписки: одинаковая сумма + один и тот же merchant ≥2 раз с шагом 20–42 дня */
function detectSubscriptions() {
  const from = iso(addD(sod(new Date()), -95));
  const map = {};
  S.transactions.forEach(t => {
    if (t.type !== 'expense' || !t.note) return;
    if (dkey(t) < from) return;
    const key = t.amount.toFixed(2) + '|' + t.note.trim().toLowerCase().slice(0, 24);
    (map[key] = map[key] || []).push(t);
  });
  const subs = [];
  Object.keys(map).forEach(k => {
    const arr = map[k];
    if (arr.length < 2) return;
    const ds = arr.map(t => dkey(t)).sort();
    for (let i = 1; i < ds.length; i++) {
      const gap = (new Date(ds[i] + 'T00:00:00') - new Date(ds[i - 1] + 'T00:00:00')) / 864e5;
      if (gap < 20 || gap > 42) return;
    }
    subs.push({ name: arr[0].note.trim(), amount: arr[0].amount, dayOfMonth: +ds[ds.length - 1].slice(8, 10), last: ds[ds.length - 1], categoryId: arr[0].categoryId });
  });
  S.templates.forEach(t => {
    if (t.type !== 'expense') return;
    if (subs.some(s => Math.abs(s.amount - t.amount) < .01 && s.name.toLowerCase() === String(t.note || t.name).trim().toLowerCase())) return;
    subs.push({ name: t.name, amount: t.amount, dayOfMonth: +String(t.next).slice(8, 10), last: iso(new Date()), categoryId: t.categoryId, tpl: true });
  });
  return subs;
}
/* цикл зарплаты: средний зазор последних операций «зарплатных» категорий */
function payCycle() {
  const salIds = new Set(S.categories.filter(c => c.kind === 'income' && /зарплат|salary|аванс|оклад/i.test(c.name)).map(c => c.id));
  const ops = [];
  if (salIds.size) {
    for (let i = 0; i < S.transactions.length; i++) {
      const t = S.transactions[i];
      if (t.type === 'income' && salIds.has(t.categoryId)) ops.push(t);
    }
  }
  ops.sort((a, b) => (b.date > a.date ? 1 : b.date < a.date ? -1 : 0));
  if (ops.length >= 2) {
    const ds = ops.slice(0, 4).map(t => new Date(t.date.slice(0, 10) + 'T00:00:00').getTime()).sort((a, b) => b - a);
    const gaps = [];
    for (let i = 1; i < ds.length; i++) gaps.push(Math.round((ds[i - 1] - ds[i]) / 864e5));
    const cyc = clamp(Math.round(gaps.reduce((a, b) => a + b, 0) / Math.max(1, gaps.length)) || 30, 7, 90);
    let next = addD(new Date(ds[0]), cyc), guard = 0;
    while (next < sod(new Date()) && guard++ < 12) next = addD(next, cyc);
    return { days: Math.max(1, Math.round((next - sod(new Date())) / 864e5)), cycle: cyc };
  }
  return { days: 30, cycle: 30 };
}
function smartBase() {
  const cur = S.settings.currency;
  const to = sod(new Date());
  const wFrom = iso(addD(to, -29)), wTo = iso(to);
  const l30 = S.transactions.filter(t => { const k = dkey(t); return k >= wFrom && k <= wTo; });
  const exp30 = sumOf(l30, 'expense'), inc30 = sumOf(l30, 'income');
  const bal = totalsByCur()[cur] || 0;
  const must30 = sum(l30.filter(t => t.type === 'expense' && txnRootOf(t) && isMustHaveCat(txnRootOf(t))).map(t => t.amount));
  const subs = detectSubscriptions();
  const subsExtra = sum(subs.filter(s => { const c = s.categoryId ? catById(s.categoryId) : null; return !(c && isMustHaveCat(c)); }).map(s => s.amount));
  return {
    cur, l30, exp30, inc30, bal, must30, subs, subsExtra,
    mandatory: must30 + subsExtra,
    avgDaily: exp30 / 30,
    savingsDaily: Math.max(0, (inc30 - exp30) / 30)
  };
}
function loggingStreak(asOf) {
  const keys = new Set(S.transactions.filter(t => t.type === 'expense' || t.type === 'income').map(t => dkey(t)));
  let d = sod(asOf || new Date()), n = 0;
  if (!keys.has(iso(d))) d = addD(d, -1);
  while (keys.has(iso(d)) && n < 366) { n++; d = addD(d, -1); }
  return n;
}

/* ---------- FEATURE 1 · умный план при вводе дохода ---------- */
function forecastSeries(start, b) {
  const today = sod(new Date());
  const pts = [start];
  let bal = start;
  for (let i = 1; i <= 30; i++) {
    const d = addD(today, i);
    bal -= b.avgDaily;
    b.subs.forEach(s => { if (s.dayOfMonth === d.getDate()) bal -= s.amount; });
    pts.push(bal);
  }
  return pts;
}
function forecastSVG(pts, cur) {
  const W = 300, H = 48, pl = 6, pr = 6, pt = 8, pb = 8;
  let mn = Math.min.apply(null, pts), mx = Math.max.apply(null, pts);
  if (mx - mn < 1) { mx += 1; mn -= 1; }
  const X = i => pl + (W - pl - pr) * i / (pts.length - 1);
  const Y = v => pt + (H - pt - pb) * (1 - (v - mn) / (mx - mn));
  const line = pts.map((v, i) => X(i).toFixed(1) + ',' + Y(v).toFixed(1)).join(' ');
  const negIdx = pts.findIndex(v => v < 0);
  let extra = '';
  if (negIdx > -1) {
    const ty = clamp(Y(pts[negIdx]) - 6, 10, H - 4);
    extra = '<circle cx="' + X(negIdx).toFixed(1) + '" cy="' + Y(pts[negIdx]).toFixed(1) + '" r="3.5" fill="#ff453a"/>' +
      '<text x="' + clamp(X(negIdx), 48, W - 48).toFixed(1) + '" y="' + ty.toFixed(1) + '" fill="#ff453a" font-size="8.5" font-weight="700" text-anchor="middle">минус через ' + negIdx + ' дн</text>';
  } else {
    extra = '<text x="' + (W - pr) + '" y="13" fill="#30d158" font-size="8.5" font-weight="700" text-anchor="end">минус не грозит</text>';
  }
  const zero = (mn < 0 && mx > 0) ? '<line x1="' + pl + '" y1="' + Y(0).toFixed(1) + '" x2="' + (W - pr) + '" y2="' + Y(0).toFixed(1) + '" stroke="rgba(255,69,58,.5)" stroke-dasharray="3 3"/>' : '';
  return '<div class="sp__fc"><svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none">' + zero +
    '<polyline points="' + line + '" fill="none" stroke="#f5f6f8" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" opacity=".9"/>' + extra + '</svg></div>';
}
function smartPlanHTML(v, anim) {
  try {
    if (ED.type !== 'income' || !(v > 0)) return '';
    const b = smartBase(), cur = b.cur;
    const pc = payCycle();
    const safeDaily = Math.max(0, (v + b.bal - b.mandatory) / pc.days);
    const needs = v * .5, wants = v * .3, save = v * .2;
    const goals = S.goals.filter(g => g.target > 0 && g.saved < g.target);
    const remTot = sum(goals.map(g => Math.max(0, g.target - g.saved))) || 1;
    const cl = !!ED.spCollapsed;
    const pts = forecastSeries(v + b.bal, b);
    const fin = pts[pts.length - 1];
    let body = '';
    body += '<div class="sp-c" style="--i:0">' +
      '<span class="sp-lab"><span class="sp-lab__ic"><i data-lucide="shield" class="ic"></i></span>Безопасный лимит в день</span>' +
      '<div class="sp-big">' + money(safeDaily, cur) + '</div>' +
      '<div class="sp-sub">до следующей зарплаты · <b>' + pc.days + ' ' + insPl(pc.days, 'день', 'дня', 'дней') + '</b></div>' +
      (b.mandatory > 0 ? '<div class="sp-sub" style="font-size:11.5px">обязательные расходы за 30 дней: ' + money(b.mandatory, cur) + '</div>' : '') +
      '</div>';
    body += '<div class="sp-c" style="--i:1">' +
      '<span class="sp-lab">Распределение 50 / 30 / 20</span>' +
      '<div class="sp-bar"><span style="width:50%;background:#8b9097"></span><span style="width:30%;background:#ff453a"></span><span style="width:20%;background:#30d158"></span></div>' +
      '<div class="sp-grid3">' +
      '<div><small>Нужды · 50%</small><b style="color:#8b9097">' + money(needs, cur) + '</b></div>' +
      '<div><small>Желания · 30%</small><b style="color:#ff453a">' + money(wants, cur) + '</b></div>' +
      '<div><small>Накопления · 20%</small><b style="color:#30d158">' + money(save, cur) + '</b></div>' +
      '</div>' +
      (goals.length ? '<div class="sp-sub" style="font-size:11.5px">20% на цели: ' + goals.slice(0, 2).map(g => esc(g.name) + ' +' + money(save * Math.max(0, g.target - g.saved) / remTot, cur)).join(' · ') + (goals.length > 2 ? ' · …' : '') + '</div>' : '') +
      '</div>';
    body += '<div class="sp-c" style="--i:2">' +
      '<div class="sp-fc"><span class="sp-lab">Прогноз на 30 дней</span><span class="sp-fc__v">' + (fin < 0 ? '−' : '') + money(Math.abs(fin), cur) + '</span></div>' +
      forecastSVG(pts, cur) + '</div>';
    return '<div class="smart-plan' + (cl ? ' smart-plan--cl' : '') + (anim ? ' sp--anim' : '') + '">' +
      '<div class="glass smart-plan__shell">' +
      '<button class="sp-hd" data-act="sp-toggle" type="button">' +
      '<span class="sp-hd__ic"><i data-lucide="sparkles" class="ic"></i></span>' +
      '<span class="sp-hd__mn"><span class="sp-hd__t">Умный план</span>' +
      '<span class="sp-hd__s">' + money(safeDaily, cur) + '/день · 50/30/20 готово</span></span>' +
      '<span class="sp-hd__ch"><i data-lucide="chevron-down" class="ic"></i></span></button>' +
      '<div class="sp-line"></div>' +
      '<div class="sp-bd">' + body + '</div>' +
      '</div></div>';
  } catch (e) { return ''; }
}
function smartPlanUpdate(el) {
  const host = el && el.querySelector('#spHost');
  if (!host) return;
  const v = edVal();
  /* показываем ТОЛЬКО вручную (через меню «Ещё») — автоматически не вылазит */
  const show = !!ED.spVisible && ED.type === 'income' && v > 0;
  const had = !!host.querySelector('.smart-plan');
  if (!show) { if (had) host.innerHTML = ''; return; }
  host.innerHTML = smartPlanHTML(v, !had);
  icons(host);
  const tg = host.querySelector('[data-act="sp-toggle"]');
  if (tg) tg.onclick = () => { ED.spCollapsed = !ED.spCollapsed; haptic(6); smartPlanUpdate(el); };
}

/* ---------- FEATURE 2 · ИИ-клиент (OpenAI-совместимый, ключ пользователя) ---------- */
const AI_SYS = 'Ты — финансовый советник приложения ONYX. Правила: отвечай ВСЕГДА на русском языке; пользуйся ТОЛЬКО данными из сообщения пользователя, никогда не выдумывай операции, суммы, категории или даты; давай конкретные числа, названия категорий и даты из предоставленных данных; будь дружелюбным и практичным; ответ до 150 слов; без markdown — только обычный текст. Если спрашивают про покупки или цели (activeGoals): сравни каждую покупку с балансом, подушкой безопасности и свободными деньгами за 30 дней; советуй, что разумнее купить сейчас, что отложить и сколько откладывать в месяц; учитывай, что деньги на покупки копятся на защищённом счёте «Накопления», а подушка безопасности — отдельный счёт, который трогать не стоит.';
const aiReady = () => { const a = S.settings.ai || {}; return !!(a.key && a.endpoint); };
async function aiChat(messages, opts = {}) {
  const ai = S.settings.ai || {};
  if (!ai.key || !ai.endpoint) throw new Error('нет ключа');
  const ctrl = new AbortController();
  const to = setTimeout(() => ctrl.abort(), opts.timeout || 45000);
  try {
    const res = await fetch(ai.endpoint, {
      method: 'POST', signal: ctrl.signal,
      headers: { 'Authorization': 'Bearer ' + ai.key, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: ai.model || 'gpt-4o-mini', messages, temperature: opts.temperature === undefined ? .4 : opts.temperature, max_tokens: opts.max_tokens || 600 })
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const j = await res.json();
    const txt = j && j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content;
    if (!txt) throw new Error('пустой ответ');
    return String(txt).trim();
  } finally { clearTimeout(to); }
}
function aiSnapshot() {
  const b = smartBase();
  const byCat = {};
  b.l30.filter(t => t.type === 'expense').forEach(t => { const c = txnRootOf(t) || txnCatOf(t); const n = c ? c.name : 'Без категории'; byCat[n] = Math.round(((byCat[n] || 0) + t.amount) * 100) / 100; });
  const ranked = Object.keys(byCat).sort((a, b2) => byCat[b2] - byCat[a]);
  const biggest = b.l30.filter(t => t.type === 'expense').slice().sort((a, b2) => b2.amount - a.amount)[0] || null;
  return {
    currency: b.cur, period: 'последние 30 дней', currentBalance: Math.round(b.bal * 100) / 100,
    last30days: { income: Math.round(b.inc30 * 100) / 100, expense: Math.round(b.exp30 * 100) / 100, byCategory: byCat },
    recurringSubscriptions: b.subs.map(s => ({ name: s.name, amount: s.amount, dayOfMonth: s.dayOfMonth })),
    protectedAccounts: {
      emergencyFund: sysAcc('fund') ? Math.round(accBalance(sysAcc('fund').id) * 100) / 100 : null,
      savingsPot: sysAcc('goals') ? Math.round(accBalance(sysAcc('goals').id) * 100) / 100 : null
    },
    activeGoals: S.goals.filter(g => g.saved < g.target).map(g => ({
      name: g.name, target: g.target, saved: g.saved,
      daysLeft: g.deadline ? Math.max(0, Math.round((new Date(g.deadline + 'T00:00:00') - sod(new Date())) / 864e5)) : null
    })),
    topExpenseCategory: ranked[0] || null,
    biggestSingleExpense: biggest ? { amount: biggest.amount, note: biggest.note || '', date: dkey(biggest) } : null
  };
}
/* ---------- FEATURE 2 · локальные эвристики (офлайн-базлайн) ---------- */
function localAdvice(q) {
  const s = String(q).toLowerCase();
  const b = smartBase();
  const cur = b.cur, M = v => moneyPlain(v, cur);
  const thisM = scopeTxns(periodRange('month', 0), null);
  const mExp = sumOf(thisM, 'expense'), mInc = sumOf(thisM, 'income');
  const byCat = {};
  thisM.filter(t => t.type === 'expense').forEach(t => { const c = txnRootOf(t) || txnCatOf(t); const n = c ? c.name : 'Без категории'; byCat[n] = (byCat[n] || 0) + t.amount; });
  const ranked = Object.keys(byCat).sort((a, b2) => byCat[b2] - byCat[a]);
  const prevByCat = {};
  scopeTxns(periodRange('month', -1), null).filter(t => t.type === 'expense').forEach(t => { const c = txnRootOf(t) || txnCatOf(t); const n = c ? c.name : 'Без категории'; prevByCat[n] = (prevByCat[n] || 0) + t.amount; });
  if (/перетра|трат.*(мног|меньш|растут)|где.*деньги|overspend|эконом/.test(s)) {
    if (!ranked.length) return 'За этот месяц расходов пока нет — вернитесь с вопросом через пару недель.';
    const top = ranked.slice(0, 3);
    let txt = 'Топ трат месяца: ' + top.map(n => n + ' — ' + M(byCat[n])).join(', ') + '. За 30 дней всего расходов: ' + M(b.exp30) + '.';
    const grow = top.filter(n => prevByCat[n] > 0 && byCat[n] > prevByCat[n] * 1.15);
    if (grow.length) txt += ' Сильнее всего выросло: ' + grow.slice(0, 2).map(n => n + ' (+' + Math.round((byCat[n] / prevByCat[n] - 1) * 100) + '%)').join(', ') + '.';
    txt += ' Совет: сократите первую категорию на 20% — это ' + M(byCat[ranked[0]] * .2) + ' экономии в месяц.';
    return txt;
  }
  if (/сколько.*можно|можно.*тратить|лимит.*день|сегодня/.test(s)) {
    const me = addD(addM(som(new Date()), 1), -1);
    const dl = clamp(Math.round((me - sod(new Date())) / 864e5) + 1, 1, 31);
    const free = Math.max(0, b.bal - b.mandatory);
    const safe = free / dl;
    return 'До конца месяца ' + dl + ' ' + insPl(dl, 'день', 'дня', 'дней') + '. Баланс ' + M(b.bal) + ', обязательные расходы (30 дней) — ' + M(b.mandatory) + '. Безопасно тратить около ' + M(safe) + ' в день. Фактическое среднее за 30 дней — ' + M(b.avgDaily) + ' в день' + (b.avgDaily > safe ? ': вы выходите за лимит, начните с желаний, а не с нужного.' : ' — вы укладываетесь в лимит.') + '.';
  }
  if (/цель|быстр|накоп|goal/.test(s)) {
    const act = S.goals.filter(g => g.target > 0 && g.saved < g.target);
    if (!act.length) return 'Список покупок пуст. Добавьте желаемое в разделе «Покупки» — сразу посчитаю темп и подскажу, что разумнее взять сейчас.';
    const g = act[0];
    const rem = g.target - g.saved;
    const dl = g.deadline ? Math.max(1, Math.round((new Date(g.deadline + 'T00:00:00') - sod(new Date())) / 864e5)) : null;
    const perDay = dl ? rem / dl : null;
    const sav30 = b.inc30 - b.exp30;
    let txt = 'Цель «' + g.name + '»: осталось ' + M(rem) + ' из ' + M(g.target);
    if (perDay) txt += ', до ' + shortDate(g.deadline) + ' — ' + dl + ' ' + insPl(dl, 'день', 'дня', 'дней') + ', темп ' + M(perDay) + '/день';
    txt += '. За 30 дней свободные деньги: ' + M(sav30) + '.';
    if (perDay && sav30 / 30 < perDay) txt += ' Ускорение: минус один кофе в день ≈ +' + M(135) + '/мес к цели, а сокращение желаний на 15% даст ещё ~' + M(Math.max(0, (b.exp30 - b.must30) * .15)) + '/мес.';
    return txt;
  }
  if (/подписк/.test(s)) {
    if (!b.subs.length) return 'Повторяющихся одинаковых платежей за последние 3 месяца не нашёл. Когда появится подписка (одинаковая сумма у одного продавца 2+ месяца), я её замечу.';
    const total = sum(b.subs.map(x => x.amount));
    return 'Нашёл подписок: ' + b.subs.length + ' на сумму ' + M(total) + '/мес (' + M(total * 12) + '/год): ' + b.subs.slice(0, 6).map(x => x.name + ' — ' + M(x.amount)).join(', ') + '. Отказ от самой дорогой сэкономит ' + M(Math.max.apply(null, b.subs.map(x => x.amount)) * 12) + ' в год.';
  }
  if (/сравн|прошл|месяц/.test(s)) {
    const pExp = sumOf(scopeTxns(periodRange('month', -1), null), 'expense');
    const pInc = sumOf(scopeTxns(periodRange('month', -1), null), 'income');
    const d = pExp > 0 ? Math.round((mExp - pExp) / pExp * 100) : null;
    let txt = 'Этот месяц: расходы ' + M(mExp) + ', доходы ' + M(mInc) + '. Прошлый месяц: расходы ' + M(pExp) + ', доходы ' + M(pInc) + '.';
    if (d !== null) txt += ' Расходы ' + (d > 0 ? 'выросли на ' + d + '%' : d < 0 ? 'снизились на ' + (-d) + '% — отличная работа' : 'не изменились') + '.';
    const dif = ranked.filter(n => prevByCat[n] > 0).map(n => [n, byCat[n] - prevByCat[n]]).sort((a, b2) => Math.abs(b2[1]) - Math.abs(a[1]))[0];
    if (dif) txt += ' Самое большое изменение: ' + dif[0] + ' ' + (dif[1] >= 0 ? '+' : '−') + M(Math.abs(dif[1])) + '.';
    return txt;
  }
  const h = healthCore();
  return 'Кратко о вас: баланс ' + M(b.bal) + '; за 30 дней доходы ' + M(b.inc30) + ', расходы ' + M(b.exp30) + '; сбережения ' + (h.savRate === null ? 'нет данных' : Math.round(h.savRate * 100) + '%') + '. Главная категория расходов: ' + (ranked[0] || 'нет трат') + '. Индекс финансового здоровья: ' + (h.score === null ? 'недостаточно данных' : h.score + '/100') + '. Спросите точнее: «где я перетрачиваю», «сколько можно тратить сегодня», «найди подписки» или «сравни с прошлым месяцем».';
}
/* ---------- FEATURE 2 · экран «Советник» ---------- */
const ADV_CHIPS = ['Что разумнее купить сейчас?', 'Где я перетрачиваю?', 'Сколько можно тратить сегодня?', 'Как быстрее достичь цели?', 'Найти неиспользуемые подписки', 'Сравни с прошлым месяцем'];
let ADV = { msgs: [], busy: false, rec: null };
function openAdvisor(ask) {
  ADV.ask = ask || null;
  if (ADV.rec && nav.includes(ADV.rec)) {
    if (ADV.ask) { const q = ADV.ask; ADV.ask = null; const i2 = ADV.rec.el && ADV.rec.el.querySelector('#advInp'); if (i2) i2.value = q; }
    return;
  }
  ADV.busy = false;
  const rec = pushScreen({ id: 'advisor', push: true, html: advHTML(), mount: advMount, refresh: () => { rec.el.innerHTML = advHTML(); icons(rec.el); advMount(rec.el); } });
  rec.el.classList.add('astats');
  ADV.rec = rec;
}
function advHTML() {
  return '<div class="as">' +
    '<div class="as__grab"></div>' +
    '<div class="as__hd">' +
    '<button class="as__btn" data-act="adv-close" aria-label="Закрыть"><i data-lucide="x" class="ic" style="width:20px;height:20px"></i></button>' +
    '<div class="as__ttl">AI-советник</div>' +
    '<span class="as__hsp"></span>' +
    '<button class="as__btn" data-act="adv-cfg" aria-label="ИИ-настройки"><i data-lucide="sparkles" class="ic" style="width:20px;height:20px"></i></button>' +
    '</div>' +
    '<div class="adv-chips">' + ADV_CHIPS.map(c => '<button class="adv-chip glass" type="button" data-chip="' + esc(c) + '"><i data-lucide="sparkles" class="ic"></i>' + esc(c) + '</button>').join('') + '</div>' +
    '<div class="as__body" style="padding-top:14px">' +
    '<div id="advList" style="display:flex;flex-direction:column;min-height:100%">' + advListHTML() + '</div>' +
    '</div>' +
    '<div class="adv-bar">' +
    '<div class="adv-in glass">' +
    '<button type="button" data-act="adv-mic" aria-label="Голосом"><i data-lucide="mic" class="ic"></i></button>' +
    '<input id="advInp" placeholder="Спросите что-нибудь…" maxlength="300" autocomplete="off">' +
    '<button type="button" class="adv-send" data-act="adv-send" aria-label="Отправить"><i data-lucide="arrow-up" class="ic"></i></button>' +
    '</div></div>' +
    '</div>';
}
function advListHTML(typing) {
  const on = aiReady();
  let h = '';
  if (!ADV.msgs.length) {
    h += '<div class="adv-empty">' +
      '<span class="adv-empty__ic lgs"><i data-lucide="sparkles" class="ic"></i></span>' +
      '<h3>' + (on ? 'Спросите что угодно о финансах' : 'Нужен API-ключ') + '</h3>' +
      '<p>' + (on ? 'ИИ видит только ваш срез данных за 30 дней и отвечает по-русски, с конкретными цифрами.' : 'Укажите в настройках свой OpenAI-совместимый endpoint и API-ключ. Без ключа работает офлайн-режим.') + '</p>' +
      (on ? '' : '<button class="btn btn--chrome" type="button" data-act="adv-key">Открыть настройки</button>') +
      '</div>';
  }
  h += '<div class="adv-msgs">';
  ADV.msgs.forEach(m => {
    if (m.role === 'user') h += '<div class="adv-row"><div class="adv-u lgs">' + esc(m.text) + '</div></div>';
    else h += '<div class="adv-ai"><span class="adv-ai__av"><i data-lucide="sparkles" class="ic"></i></span>' +
      '<div class="adv-ai__b">' +
      (m.off ? '<span class="adv-tag"><i data-lucide="' + (m.off === 'err' ? 'wifi-off' : 'shield') + '" class="ic"></i>' + (m.off === 'err' ? 'ИИ недоступен · офлайн-ответ' : 'офлайн-ответ') + '</span>' : '') +
      esc(m.text) + '</div></div>';
  });
  if (typing) h += '<div class="adv-ai"><span class="adv-ai__av"><i data-lucide="sparkles" class="ic"></i></span><div class="adv-ai__b"><span class="adv-typ"><i></i><i></i><i></i></span></div></div>';
  h += '</div>';
  return h;
}
function advScroll(el) {
  const body = el.querySelector('.as__body');
  if (body) requestAnimationFrame(() => { body.scrollTop = body.scrollHeight; });
}
function advMount(el) {
  el.querySelector('[data-act="adv-close"]').onclick = () => popScreen();
  const cfg = el.querySelector('[data-act="adv-cfg"]');
  if (cfg) cfg.onclick = () => openAISettings();
  const kb = el.querySelector('[data-act="adv-key"]');
  if (kb) kb.onclick = () => openAISettings();
  const inp = el.querySelector('#advInp');
  const send = () => { const t = inp.value.trim(); if (!t || ADV.busy) return; inp.value = ''; advSend(t); };
  el.querySelector('[data-act="adv-send"]').onclick = send;
  inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); send(); } });
  el.querySelectorAll('[data-chip]').forEach(b => b.onclick = () => { if (!ADV.busy) advSend(b.dataset.chip); });
  el.querySelector('[data-act="adv-mic"]').onclick = () => {
    const btn = el.querySelector('[data-act="adv-mic"]');
    btn.style.color = 'var(--exp)';
    haptic(8);
    startVoice(text => { btn.style.color = ''; if (!ADV.busy) advSend(text); }, () => { btn.style.color = ''; });
  };
  advScroll(el);
  /* вопрос от кнопок ИИ: подставляем в поле ввода, без автопостановки */
  if (ADV.ask) { const q = ADV.ask; ADV.ask = null; const i2 = el.querySelector('#advInp'); if (i2) i2.value = q; }
}
async function advSend(text) {
  if (ADV.busy) return;
  ADV.busy = true;
  ADV.msgs.push({ role: 'user', text });
  const el = ADV.rec && ADV.rec.el;
  if (el && el.isConnected) { const list = el.querySelector('#advList'); if (list) { list.innerHTML = advListHTML(true); icons(list); advScroll(el); } }
  let answer = null, off = false, err = false;
  if (aiReady()) {
    try {
      answer = await aiChat([
        { role: 'system', content: AI_SYS },
        { role: 'user', content: 'Мои финансовые данные (JSON):\n' + JSON.stringify(aiSnapshot()) + '\n\nМой вопрос: ' + text }
      ]);
    } catch (e) { err = true; }
  } else off = true;
  if (answer === null) {
    try { answer = localAdvice(text); } catch (e) { answer = 'Не удалось посчитать ответ по вашим данным.'; }
    off = err ? 'err' : true;
    if (err) toast('ИИ недоступен — отвечаю офлайн', null, { icon: 'wifi-off' });
  }
  ADV.msgs.push({ role: 'ai', text: answer, off: off || undefined });
  ADV.busy = false;
  if (el && el.isConnected) { const list = el.querySelector('#advList'); if (list) { list.innerHTML = advListHTML(); icons(list); advScroll(el); } }
}

/* ---------- FEATURE 3/* ---------- FEATURE 3 · умные советы (инсайты) ---------- */
function smartTips() {
  const tips = [];
  const cur = S.settings.currency;
  const M = v => moneyPlain(v, cur);
  const today = sod(new Date());
  const thisM = scopeTxns(periodRange('month', 0), null);
  const mInc = sumOf(thisM, 'income');
  const rootSpend = list => {
    const m = {};
    list.filter(t => t.type === 'expense').forEach(t => { const c = txnRootOf(t) || txnCatOf(t); if (c) m[c.name] = (m[c.name] || 0) + t.amount; });
    return m;
  };
  const curSpend = rootSpend(thisM);
  /* 3.1 аномалии: месяц против среднего за 3 месяца — tint --exp, flame */
  const trailSpend = rootSpend(scopeTxns(periodRange('month', -1), null)
    .concat(scopeTxns(periodRange('month', -2), null))
    .concat(scopeTxns(periodRange('month', -3), null)));
  const anomalies = [];
  Object.keys(curSpend).forEach(n => {
    const avg = (trailSpend[n] || 0) / 3;
    if (avg > 0 && curSpend[n] > avg * 1.8 && mInc > 0 && curSpend[n] > mInc * .2) {
      const c = S.categories.find(x => x.name === n && x.kind === 'expense' && !x.parentId);
      anomalies.push({ n, v: curSpend[n], avg, c });
    }
  });
  anomalies.sort((a, b2) => b2.v - a.v).slice(0, 2).forEach(a =>
    tips.push({
      icon: 'flame', color: '#ff453a',
      title: a.n + ': ' + M(a.v),
      body: 'Это на ' + M(a.v - a.avg) + ' больше обычного (среднее за 3 месяца — ' + M(a.avg) + '). Пересмотреть траты?',
      apply: a.c ? { label: 'Категория', fn: () => openCategoryScreen({ id: a.c.id }) } : null
    }));
  /* 3.2 заброшенные подписки — tint mut, refresh */
  const subs = detectSubscriptions();
  subs.filter(s2 => s2.last && (today - new Date(s2.last + 'T00:00:00')) / 864e5 >= 45).slice(0, 2).forEach(s2 =>
    tips.push({
      icon: 'refresh-cw', color: '#8b9097',
      title: s2.name + ' — ' + M(s2.amount) + '/мес',
      body: 'Похоже на подписку, но активности нет уже ' + Math.round((today - new Date(s2.last + 'T00:00:00')) / 864e5) + ' дней. Отменить?',
      apply: { label: 'Повторы', fn: () => openTemplates() }
    }));
  /* 3.3 ускорение целей — tint inc, target */
  const b30 = smartBase();
  S.goals.filter(g => g.target > 0 && g.saved < g.target && g.deadline).forEach(g => {
    const dl = Math.round((new Date(g.deadline + 'T00:00:00') - today) / 864e5);
    if (dl <= 30) return;
    const need = (g.target - g.saved) / dl;
    const hist30 = (g.history || []).filter(hh => hh.date >= iso(addD(today, -30))).reduce((x, hh) => x + hh.v, 0);
    const pace = hist30 > 0 ? hist30 / 30 : b30.savingsDaily;
    if (need > pace) tips.push({
      icon: 'target', color: '#30d158',
      title: '«' + g.name + '» отстаёт от графика',
      body: 'Чтобы успеть к ' + shortDate(g.deadline) + ', добавляйте +' + M(need - pace) + '/день к текущему темпу (нужно ' + M(need) + '/день, сейчас ' + M(pace) + ').',
      apply: { label: 'К цели', fn: () => openGoalForm(g.id) }
    });
  });
  /* 3.4 серия дней — tint #ff9500, flame */
  const st = loggingStreak();
  if (st >= 5) tips.push({ icon: 'flame', color: '#ff9500', title: '🔥 ' + st + '-дневная серия записей', body: 'Вы возвращаетесь каждый день — именно так привычка контроля денег становится несокрушимой. Продолжайте!' });
  /* 3.5 сравнение с собственным прошлым месяцем — tint #0a84ff, trend */
  const prevSpend = rootSpend(scopeTxns(periodRange('month', -1), null));
  let bestSelf = null;
  Object.keys(prevSpend).forEach(n => {
    if (!curSpend[n] || prevSpend[n] < 15) return;
    const pct = (prevSpend[n] - (curSpend[n] || 0)) / prevSpend[n];
    if (pct >= .15 && (!bestSelf || pct > bestSelf.pct)) bestSelf = { n, pct, d: prevSpend[n] - curSpend[n] };
  });
  if (bestSelf) tips.push({ icon: 'trending-up', color: '#0a84ff', title: bestSelf.n + ': −' + Math.round(bestSelf.pct * 100) + '% к прошлому месяцу', body: 'Экономия ' + M(bestSelf.d) + ' — держите темп, это ваша лучшая категория месяца.' });
  return tips.slice(0, 5);
}
function tipsHTML() {
  let tips = [];
  try { tips = smartTips(); } catch (e) {}
  if (!tips.length) return '';
  return '<div class="tips">' + tips.map((t, i) =>
    '<div class="tipc" style="--i:' + i + ';--tn:' + t.color + '">' +
    '<span class="tipc__tint"></span>' +
    '<div class="tipc__top"><span class="tipc__t">' + esc(t.title) + '</span>' +
    '<span class="tipc__ic"><i data-lucide="' + t.icon + '" class="ic"></i></span></div>' +
    '<div class="tipc__b">' + esc(t.body) + '</div><div style="flex:1"></div>' +
    (t.apply ? '<button class="tipc__apply" type="button" data-tip="' + i + '" style="background:color-mix(in srgb,' + t.color + ' 15%,transparent);color:' + t.color + '">' + esc(t.apply.label) + '<i data-lucide="chevron-right" class="ic"></i></button>' : '') +
    '</div>').join('') + '</div>';
}
function bindTips(root) {
  let tips = [];
  try { tips = smartTips(); } catch (e) {}
  root.querySelectorAll('[data-tip]').forEach(b => b.onclick = () => {
    const t = tips[+b.dataset.tip];
    if (t && t.apply) { haptic(8); t.apply.fn(); }
  });
}

/* ---------- FEATURE 4 · индекс финансового здоровья v2 ----------
   Шесть взвешенных составляющих, каждая 0–100 (current/target);
   итог = Σ(score·w)/Σw по доступным компонентам (пропущенные
   перераспределяют вес). Каждая цифра ведёт к действию. */
const MON_PREP = ['январе', 'феврале', 'марте', 'апреле', 'мае', 'июне', 'июле', 'августе', 'сентябре', 'октябре', 'ноябре', 'декабре'];
function healthCore(asOf) {
  const today = sod(asOf || new Date());
  const isNow = !asOf;
  const cur = S.settings.currency;
  const accIds = new Set(S.accounts.filter(a => a.currency === cur && a.archived !== true).map(a => a.id));
  const inScope = t => accIds.has(t.accountId) || (t.toAccountId && accIds.has(t.toAccountId));
  const k30 = iso(addD(today, -29)), k60 = iso(addD(today, -59)), k90 = iso(addD(today, -89)), kT = iso(today);
  const l30 = S.transactions.filter(t => inScope(t) && dkey(t) >= k30 && dkey(t) <= kT);
  const p30 = S.transactions.filter(t => inScope(t) && dkey(t) >= k60 && dkey(t) < k30);
  const l90 = S.transactions.filter(t => inScope(t) && dkey(t) >= k90 && dkey(t) <= kT);
  const exp30 = sumOf(l30, 'expense'), inc30 = sumOf(l30, 'income'), expPrev = sumOf(p30, 'expense'), exp90 = sumOf(l90, 'expense');
  const balNow = sum(Array.from(accIds).map(id => accBalance(id)));
  /* подушка живёт на защищённом счёте; если его нет — считаем по всей ликвидности */
  const fundAcc = sysAcc('fund');
  const fundBal = fundAcc && accIds.has(fundAcc.id) ? accBalance(fundAcc.id) : balNow;
  const monthlyExp = exp90 > 0 ? exp90 / 3 : exp30; /* средние месячные расходы за 90 дней */
  const daysLogged = new Set(l30.concat(p30).filter(t => t.type === 'expense' || t.type === 'income').map(t => dkey(t))).size;
  const streak = loggingStreak(today);
  const savRate = inc30 > 0 ? (inc30 - exp30) / inc30 : null;
  const variance = expPrev > 0 ? Math.abs(exp30 - expPrev) / expPrev : (exp30 > 0 ? 1 : 0);
  const varHasData = exp30 > 0 || expPrev > 0;
  const fundMonths = monthlyExp > 0 ? fundBal / monthlyExp : null;
  const savPerDay = Math.max(0, (inc30 - exp30) / 30);
  /* цели: доля в графике + худший отстающий */
  const active = S.goals.filter(g => g.target > 0 && g.saved < g.target);
  let goalsOk = 0, behind = null;
  active.forEach(g => {
    if (!g.deadline) { goalsOk++; return; }
    const dl = Math.round((new Date(g.deadline + 'T00:00:00') - today) / 864e5);
    if (dl <= 0) { if (!behind) behind = { g, expired: true, gap: 0, need: 0 }; return; }
    const need = (g.target - g.saved) / dl;
    const hist30 = (g.history || []).filter(hh => hh.date >= iso(addD(today, -30))).reduce((x, hh) => x + hh.v, 0);
    const pace = hist30 > 0 ? hist30 / 30 : savPerDay;
    if (need <= pace) goalsOk++;
    else if (!behind || need - pace > behind.gap) behind = { g, gap: need - pace, need, pace };
  });
  const goalsPct = active.length ? Math.round(goalsOk / active.length * 100) : null;
  /* регулярные платежи: шаблоны (+ обнаруженные подписки для «сейчас») */
  const billSrcs = [];
  S.templates.forEach(t => {
    if (t.type !== 'expense' || !t.next) return;
    billSrcs.push({ name: t.note || t.name, late: t.next < iso(addD(today, -7)) });
  });
  if (isNow) {
    try {
      detectSubscriptions().forEach(s => {
        if (s.tpl) return;
        const since = (today - new Date(s.last + 'T00:00:00')) / 864e5;
        billSrcs.push({ name: s.name, late: since > 45 });
      });
    } catch (e) {}
  }
  const billsPct = billSrcs.length ? Math.round(billSrcs.filter(s => !s.late).length / billSrcs.length * 100) : null;
  /* шесть составляющих */
  const stOf = sc => sc === null ? 'skip' : sc >= 80 ? 'ok' : sc >= 50 ? 'warn' : 'bad';
  const comps = [];
  const add = (key, icon, name, w, score, value, target, hint, sub) =>
    comps.push({ key, icon, name, w, score, value, target, hint, sub, status: stOf(score) });
  const savScore = savRate === null ? null : clamp(Math.round(savRate / .2 * 100), 0, 100);
  add('sav', 'piggy', 'Накопления', 20, savScore,
    savRate === null ? '—' : Math.round(savRate * 100) + '%', 'цель 20%',
    savRate === null ? 'Нет данных о доходах' : savRate < .1 ? 'Критически мало' : savRate < .2 ? 'Можно лучше' : 'Отлично',
    savRate !== null && inc30 - exp30 > 0 ? 'Остается ' + moneyPlain(Math.round(inc30 - exp30), cur) + ' из ' + moneyPlain(Math.round(inc30), cur) : '');
  const fundScore = fundMonths === null ? null : clamp(Math.round(fundMonths / 3 * 100), 0, 100);
  const fd = fundMonths === null ? 0 : Math.round(fundMonths * 30);
  add('fund', 'shield', 'Подушка безопасности', 15, fundScore,
    fundMonths === null ? '—' : (Math.round(fundMonths * 10) / 10).toFixed(1).replace('.', ',') + ' мес.', 'цель 3 мес.',
    fundMonths === null ? 'Нет данных о расходах' : fundMonths < 1 ? 'Нужны срочные меры' : fundMonths < 3 ? 'Соберите запас' : 'Прочно',
    fundMonths !== null ? 'Хватит на ' + fd + ' ' + insPl(fd, 'день', 'дня', 'дней') + ' без дохода' : '');
  const varScore = !varHasData ? null : variance <= .2 ? 100 : variance >= .6 ? 25 : Math.round(100 - (variance - .2) / .4 * 75);
  add('var', 'activity', 'Стабильность расходов', 15, varScore,
    varHasData ? Math.round(variance * 100) + '%' : '—', 'до 20%',
    !varHasData ? 'Нет данных' : variance > .4 ? 'Резкие скачки — пересмотрите бюджет' : variance >= .2 ? 'Есть колебания' : 'Стабильно', '');
  const strScore = clamp(Math.round(streak / 7 * 100), 0, 100);
  add('streak', 'flame', 'Серия записей', 15, strScore,
    streak + ' дн.' + (streak > 5 ? ' 🔥' : ''), 'цель 7 дн.',
    streak === 0 ? 'Запишите операцию сегодня' : streak < 7 ? 'Ещё ' + (7 - streak) + ' ' + insPl(7 - streak, 'день', 'дня', 'дней') + ' до привычки!' : 'Привычка закреплена',
    'Дней подряд с записями');
  add('goals', 'target', 'Цели', 15, goalsPct,
    goalsPct === null ? '—' : goalsPct + '%', 'цель 100%',
    goalsPct === null ? 'Нет активных целей' : behind ? (behind.expired ? 'Срок «' + behind.g.name + '» истёк' : '«' + behind.g.name + '» отстаёт на ' + moneyPlain(Math.round(behind.gap), cur) + '/день') : 'Все цели в графике',
    active.length ? 'Активных: ' + active.length : '');
  add('bills', 'calendar', 'Платежи вовремя', 10, billsPct,
    billsPct === null ? '—' : billsPct + '%', 'цель 100%',
    billsPct === null ? 'Нет регулярных платежей' : billsPct < 80 ? 'Есть просрочки — проверьте автоплатежи' : billsPct < 100 ? 'Почти идеально' : 'Все вовремя', '');
  const present = comps.filter(c => c.score !== null);
  const wTotal = sum(present.map(c => c.w)) || 1;
  const score = present.length ? Math.round(sum(present.map(c => c.score * c.w)) / wTotal) : null;
  return {
    score, comps, wTotal,
    parts: comps.map(c => ({ ok: c.score !== null && c.score >= 80, label: c.name, val: c.value + (c.score === null ? ' · нет данных' : '') })),
    savRate, streak, variance, varHasData, exp30, inc30, expPrev, monthlyExp, fundMonths, fundBal,
    bal: balNow, cur, goalsPct, billsPct, behind, active, daysLogged, insufficient: daysLogged < 30
  };
}
const hlWord = h => h.score === null ? 'Мало данных' : h.score >= 80 ? 'Отлично' : h.score >= 60 ? 'Хорошо' : h.score >= 40 ? 'Требует внимания' : 'Нужны меры';
const hlColor = h => h.score === null ? '#8b9097' : h.score >= 80 ? '#30d158' : h.score >= 60 ? '#0ac97a' : h.score >= 40 ? '#ff9500' : '#ff453a';
/* история: score на конец каждого из последних 6 месяцев (кэш до изменения данных) */
let HL_HIST = { key: '', data: [] };
function healthHistory() {
  const t0 = S.transactions[0];
  const key = [S.transactions.length, t0 ? t0.id + t0.date : '0', S.goals.length, S.templates.length, iso(new Date())].join('|');
  if (HL_HIST.key === key) return HL_HIST.data;
  const now = sod(new Date());
  const data = [];
  for (let i = 5; i >= 0; i--) {
    const asOf = i === 0 ? now : addD(addM(now, -(i - 1)), -1); /* конец месяца i месяцев назад */
    if (asOf > now) continue;
    const h = healthCore(asOf);
    data.push({ asOf, month: asOf.getMonth(), year: asOf.getFullYear(), score: h.score });
  }
  HL_HIST = { key, data };
  return data;
}
function healthDelta() {
  const hist = healthHistory();
  if (hist.length < 2) return null;
  const pr = hist[hist.length - 2].score, cu = hist[hist.length - 1].score;
  return pr === null || cu === null ? null : cu - pr;
}
/* приоритизированные действия: потенциал = вес·(100−score)/Σвес */
let HL_LAST = null;
function healthActions(h) {
  const acts = [];
  const gain = c => Math.max(1, Math.round((100 - c.score) * c.w / h.wTotal));
  const byKey = {}; h.comps.forEach(c => byKey[c.key] = c);
  const cand = h.comps.filter(c => c.score !== null && c.score < 95)
    .sort((a, b) => (100 - b.score) * b.w - (100 - a.score) * a.w);
  cand.forEach(c => {
    if (c.key === 'sav' && c.score < 80) acts.push({
      icon: 'piggy', title: 'Доведите сбережения до 20%',
      body: 'Сейчас ' + c.value + '. Освободите ~' + moneyPlain(Math.round(h.inc30 * .2 - (h.inc30 - h.exp30)), h.cur) + '/мес — и норма будет выполнена.',
      gain: gain(c), effort: 'Средне', time: '1 месяц',
      apply: { label: 'Записать доход', fn: () => openEditor({ type: 'income' }) }
    });
    else if (c.key === 'fund' && c.score < 80) {
      const fAcc = sysAcc('fund');
      acts.push({
        icon: 'shield', title: 'Пополните подушку безопасности',
        body: 'На счёте подушки ' + moneyPlain(Math.round(h.fundBal || 0), h.cur) + ' (хватит на ' + Math.round((h.fundMonths || 0) * 30) + ' дн.). До цели — 3 месяца расходов (' + moneyPlain(Math.round(h.monthlyExp * 3), h.cur) + ').',
        gain: gain(c), effort: 'Легко', time: '1 месяц',
        apply: { label: 'Перевести', fn: () => openEditor(fAcc ? { type: 'transfer', toAccountId: fAcc.id } : { type: 'transfer' }) }
      });
    }
    else if (c.key === 'var' && c.score < 80) acts.push({
      icon: 'activity', title: 'Стабилизируйте расходы',
      body: 'Колебания ' + c.value + ' месяц к месяцу. Посмотрите в статистике, какая категория выбивается из ритма.',
      gain: gain(c), effort: 'Средне', time: '1 неделя',
      apply: { label: 'Статистика', fn: () => openStats() }
    });
    else if (c.key === 'streak' && c.score < 100) acts.push({
      icon: 'flame', title: h.streak === 0 ? 'Добавьте операцию сегодня' : 'Не прерывайте серию',
      body: h.streak === 0 ? 'Серия не начата. Одна запись в день — и через неделю привычка контроля закрепится.' : 'Серия ' + h.streak + ' дн. — запишите сегодняшние траты, чтобы продлить.',
      gain: gain(c), effort: 'Легко', time: '1 день',
      apply: { label: 'Добавить операцию', fn: () => openEditor({ type: 'expense' }) }
    });
    else if (c.key === 'goals' && c.score < 100 && h.behind && h.behind.g) acts.push({
      icon: 'target', title: 'Верните «' + h.behind.g.name + '» в график',
      body: h.behind.expired
        ? 'Срок истёк, осталось накопить ' + moneyPlain(Math.round(h.behind.g.target - h.behind.g.saved), h.cur) + '. Сдвиньте дедлайн или пополните цель.'
        : 'Нужно ' + moneyPlain(Math.round(h.behind.need), h.cur) + '/день, текущий темп ' + moneyPlain(Math.round(h.behind.pace), h.cur) + '/день — добавьте ещё ' + moneyPlain(Math.round(h.behind.gap), h.cur) + '/день.',
      gain: gain(c), effort: 'Средне', time: '1 месяц',
      apply: { label: 'К цели', fn: () => openGoalForm({ id: h.behind.g.id }) }
    });
    else if (c.key === 'bills' && c.score < 100) acts.push({
      icon: 'calendar', title: 'Проверьте регулярные платежи',
      body: h.billsPct < 80 ? 'Есть просроченные автоплатежи. Откройте «Повторы» и сверьте даты списаний.' : 'Почти все платежи вовремя — сверьте расписание в «Повторах».',
      gain: gain(c), effort: 'Легко', time: '1 день',
      apply: { label: 'Повторы', fn: () => openTemplates() }
    });
  });
  /* нет целей — предложим создать */
  if (byKey.goals.score === null) {
    const w = byKey.goals.w;
    acts.push({
      icon: 'target', title: 'Добавьте первую покупку',
      body: 'Список желаемых покупок + ИИ-советник решат, что брать сейчас, а что отложить. Пополнения уходят на защищённый счёт «Накопления».',
      gain: Math.max(1, Math.round(100 * w / (h.wTotal + w))), effort: 'Легко', time: '1 день',
      apply: { label: 'Новая покупка', fn: () => openGoalForm() }
    });
  }
  /* растущая категория месяца — контекстный совет */
  try {
    const cur = S.settings.currency;
    const agg = off => {
      const m = {};
      scopeTxns(periodRange('month', off), null).filter(t => t.type === 'expense').forEach(t => {
        const c = txnRootOf(t) || txnCatOf(t);
        if (c) m[c.id] = { n: c.name, v: (m[c.id] ? m[c.id].v : 0) + t.amount };
      });
      return m;
    };
    const A = agg(0), B = agg(-1);
    let hot = null;
    Object.keys(A).forEach(id => {
      const b0 = B[id] ? B[id].v : 0, d = A[id].v - b0;
      if (d >= 30 && (b0 === 0 || d / b0 >= .3) && (!hot || d > hot.d)) hot = { id, n: A[id].n, d, pct: b0 > 0 ? Math.round(d / b0 * 100) : null };
    });
    if (hot) acts.push({
      icon: 'trending-up', title: 'Пересмотрите категорию «' + hot.n + '»',
      body: (hot.pct ? '+' + hot.pct + '% к прошлому месяцу, ' : '') + 'перерасход ' + moneyPlain(Math.round(hot.d), cur) + '. Загляните в категорию и верните бюджет.',
      gain: 3, effort: 'Средне', time: '1 неделя',
      apply: { label: 'Категория', fn: () => openCategoryScreen({ id: hot.id }) }
    });
  } catch (e) {}
  /* напоминание — когда серия хромает */
  if (!S.settings.reminder.enabled && byKey.streak.score !== null && byKey.streak.score < 100) {
    acts.push({
      icon: 'bell', title: 'Настройте напоминания',
      body: 'Ежедневный пуш в ' + (S.settings.reminder.time || '20:00') + ' поможет не пропускать записи — основа точной статистики.',
      gain: Math.max(2, Math.round(gain(byKey.streak) / 2)), effort: 'Легко', time: '1 неделя',
      apply: { label: 'Напоминания', fn: () => openReminderSheet() }
    });
  }
  acts.sort((a, b) => b.gain - a.gain);
  return acts.slice(0, 5);
}
/* ── карточка: на главной убрана, живёт в меню финансового здоровья (inMenu = некликабельный вариант) ── */
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
    '<button class="as__btn" data-act="hl-ai" aria-label="AI-советник"><i data-lucide="sparkles" class="ic" style="width:20px;height:20px"></i></button></div>';
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
  el.querySelectorAll('[data-act="hl-ai"]').forEach(b => b.onclick = () => { haptic(8); openAdvisor('Как улучшить моё финансовое здоровье? С чего начать?'); });
  const addBtn = el.querySelector('[data-act="hl-add"]');
  if (addBtn) addBtn.onclick = () => { haptic(8); openEditor({ type: 'expense' }); };
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
  el.querySelectorAll('.hl-hit').forEach(c => c.onclick = () => { haptic(6); showTip(+c.dataset.hi); });
  if (tip && hist.length) showTip(hist.length - 1);
  /* действия */
  const acts = HL_LAST ? HL_LAST.acts : [];
  el.querySelectorAll('[data-ai]').forEach(b => b.onclick = () => {
    const a = acts[+b.dataset.ai];
    if (a) { haptic(8); a.apply.fn(); }
  });
  const big = el.querySelector('[data-act="hl-apply"]');
  if (big) big.onclick = () => { if (acts.length) { haptic(8); acts[0].apply.fn(); } };
  /* праздник */
  const party = el.querySelector('.hl-party');
  if (party) hlConfetti(party);
}
function openHealth() {
  haptic(10);
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

/* ---------- FEATURE 5.1 · скан чека (камера → vision-ИИ → ручной фолбэк) ---------- */
function openScanner() {
  if (!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)) { toast('Камера недоступна в этом браузере', null, { tone: 'danger' }); return; }
  let stream = null;
  const stop = () => { if (stream) { stream.getTracks().forEach(tr => tr.stop()); stream = null; } };
  openSheet({
    title: '',
    hideGrab: true,
    html: '<div class="scn">' +
      '<div class="scn__cam"><video class="scn__vid" id="scnVid" autoplay playsinline muted></video>' +
      '<div class="scn__frame"><i></i></div>' +
      '<button class="scn__shot" id="scnShot" type="button" aria-label="Снять"></button>' +
      '<button class="scn__x" id="scnX" type="button" aria-label="Закрыть камеру"><i data-lucide="x" class="ic"></i></button>' +
      '</div>' +
      '<div class="scn__bd">' +
      '<div class="scn__t"><i data-lucide="sparkles" class="ic"></i>Сканировать чек</div>' +
      '<p class="scn__hint">Наведите камеру, поместите чек в рамку и нажмите кнопку — ИИ заполнит сумму, магазин и категорию</p>' +
      '</div></div>',
    mount(sh) {
      const vid = sh.querySelector('#scnVid');
      sh.querySelector('#scnX').onclick = () => { stop(); closeSheet(); };
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: { ideal: 1280 } }, audio: false })
        .then(st => { stream = st; vid.srcObject = st; })
        .catch(() => { toast('Нет доступа к камере', null, { tone: 'danger' }); closeSheet(); });
      sh.querySelector('#scnShot').onclick = () => {
        if (!vid || !vid.videoWidth) { toast('Камера ещё не готова'); return; }
        haptic(10);
        const c = document.createElement('canvas');
        c.width = Math.min(1200, vid.videoWidth);
        c.height = Math.round(c.width * vid.videoHeight / vid.videoWidth);
        c.getContext('2d').drawImage(vid, 0, 0, c.width, c.height);
        const dataUrl = c.toDataURL('image/jpeg', .85);
        stop(); closeSheet();
        scanReceipt(dataUrl);
      };
    },
    onClose() { stop(); }
  });
}
async function scanReceipt(dataUrl) {
  if (aiReady()) {
    toast('Распознаю чек…', null, { icon: 'sparkles' });
    const cats = catsOf('expense').map(c => c.name).join(', ');
    try {
      const out = await aiChat([
        { role: 'system', content: 'Ты — сканер чеков. Из изображения извлеки: итоговую сумму, название магазина, дату и список позиций с ценами. Подбери категорию расходов строго из списка: ' + cats + '. Верни ТОЛЬКО валидный JSON без markdown и пояснений: {"amount": число, "merchant": "строка", "date": "YYYY-MM-DD", "items": [{"name": "строка", "price": число}], "category": "название из списка или null"}. Сумма — число без валюты.' },
        { role: 'user', content: [
          { type: 'text', text: 'Извлеки данные с этого чека и верни JSON.' },
          { type: 'image_url', image_url: { url: dataUrl } }
        ] }
      ], { max_tokens: 500, timeout: 60000 });
      applyReceipt(JSON.parse(out.replace(/```json|```/g, '').trim()));
      return;
    } catch (e) {
      toast('ИИ недоступен — заполните вручную', null, { icon: 'wifi-off' });
    }
  }
  manualReceipt(dataUrl);
}
function applyReceipt(j) {
  const amount = Math.abs(parseFloat(j && j.amount)) || 0;
  const merchant = String((j && j.merchant) || '').slice(0, 60);
  let catId = null;
  if (j && j.category) {
    const c = S.categories.find(x => x.kind === 'expense' && x.name.toLowerCase() === String(j.category).toLowerCase().trim());
    if (c) catId = c.id;
  }
  if (!catId && j && Array.isArray(j.items)) {
    const blob = ' ' + j.items.map(i2 => i2 && i2.name).join(' ').toLowerCase() + ' ' + merchant.toLowerCase();
    let best = null;
    catsOf('expense').forEach(c => {
      c.name.toLowerCase().split(/[\s,-]+/).forEach(w => { if (w.length > 3 && blob.indexOf(w) > -1 && (!best || w.length > best.w.length)) best = { c, w }; });
    });
    if (best) catId = best.c.id;
  }
  if (amount > 0) { ED.entry = String(Math.round(amount * 100) / 100); ED.left = null; ED.op = null; }
  if (merchant) ED.note = merchant;
  if (catId) ED.categoryId = catId;
  if (ED.rec) ED.rec.refresh();
  haptic(12);
  toast('Чек распознан' + (merchant ? ' · ' + esc(merchant) : ''), null, { icon: 'sparkles' });
}
function manualReceipt(dataUrl) {
  openSheet({
    title: 'Чек — заполните вручную',
    html: '<div class="scn"><img class="scn__img" src="' + dataUrl + '" alt="Чек">' +
      '<input class="gp-inp" id="mrAmt" inputmode="decimal" placeholder="Сумма" style="margin-top:2px">' +
      '<input class="note" id="mrNote" placeholder="Магазин / заметка" maxlength="60" style="min-height:50px">' +
      '<button class="btn btn--chrome" id="mrOk" disabled>Заполнить операцию</button></div>',
    mount(sh) {
      const a = sh.querySelector('#mrAmt'), n = sh.querySelector('#mrNote'), ok = sh.querySelector('#mrOk');
      const sync = () => { ok.disabled = !(parseFloat(String(a.value).replace(',', '.')) > 0); };
      a.oninput = sync;
      sync();
      ok.onclick = () => {
        const v = parseFloat(String(a.value).replace(',', '.')) || 0;
        if (v <= 0) return;
        applyReceipt({ amount: v, merchant: n.value.trim(), items: [] });
        closeSheet();
      };
    }
  });
}

/* ---------- FEATURE 5.4 · голосовой ввод (+ ИИ-уточнение) ---------- */
function startVoice(onDone, onEnd) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) { toast('Голосовой ввод не поддерживается этим браузером', null, { tone: 'danger' }); if (onEnd) onEnd(); return null; }
  let rec = null;
  try { rec = new SR(); } catch (e) { toast('Микрофон недоступен', null, { tone: 'danger' }); if (onEnd) onEnd(); return null; }
  rec.lang = 'ru-RU';
  rec.interimResults = false;
  rec.maxAlternatives = 1;
  let got = false;
  rec.onresult = e => {
    got = true;
    const t = e.results && e.results[0] && e.results[0][0] && e.results[0][0].transcript;
    if (t && onDone) onDone(String(t).trim());
  };
  rec.onerror = e => {
    if (e.error === 'not-allowed' || e.error === 'service-not-allowed') toast('Нет доступа к микрофону', null, { tone: 'danger' });
    else if (!got) toast('Не удалось распознать речь', null, { tone: 'danger' });
  };
  rec.onend = () => { if (onEnd) onEnd(); };
  try { rec.start(); toast('Слушаю…', null, { icon: 'mic' }); } catch (e) { if (onEnd) onEnd(); }
  return rec;
}
function parseVoiceLocal(text) {
  const t = ' ' + String(text).toLowerCase() + ' ';
  const m = t.match(/(\d+(?:[.,]\d{1,2})?)/);
  const amount = m ? parseFloat(m[1].replace(',', '.')) : 0;
  let note = String(text);
  if (m) note = note.replace(m[1], ' ');
  note = note.replace(/\b(рублей|рубля|руб|руб\.|белорусских|копеек|на|за|это|вс[её]|купил|купила|купили|потратил|потратила|заплатил|заплатила|отдал|отдала|стоило|стоит)\b/gi, ' ');
  note = note.replace(/\s+/g, ' ').trim().slice(0, 60);
  let best = null;
  S.categories.filter(c => c.kind === 'expense').forEach(c => {
    c.name.toLowerCase().split(/[\s,-]+/).forEach(w => { if (w.length > 3 && t.indexOf(w) > -1 && (!best || w.length > best.w.length)) best = { c, w }; });
  });
  return { amount, note, categoryId: best ? best.c.id : null };
}
async function voiceToEditor(text) {
  const set = r => {
    if (r.amount > 0) { ED.entry = String(Math.round(r.amount * 100) / 100); ED.left = null; ED.op = null; }
    if (r.note) ED.note = r.note;
    if (r.categoryId) ED.categoryId = r.categoryId;
    if (ED.rec) ED.rec.refresh();
  };
  set(parseVoiceLocal(text));
  if (!aiReady()) return;
  try {
    const cats = catsOf('expense').map(c => c.name).join(', ');
    const out = await aiChat([
      { role: 'system', content: 'Из русской фразы о трате извлеки операцию. Верни ТОЛЬКО JSON {"amount": число, "note": "заметка до 4 слов", "category": "название из списка или null"}. Список категорий: ' + cats },
      { role: 'user', content: text }
    ], { max_tokens: 120 });
    const j = JSON.parse(out.replace(/```json|```/g, '').trim());
    const cat = j.category ? S.categories.find(c => c.kind === 'expense' && c.name.toLowerCase() === String(j.category).toLowerCase().trim()) : null;
    set({ amount: Math.abs(parseFloat(j.amount)) || 0, note: String(j.note || '').slice(0, 60), categoryId: cat ? cat.id : null });
    toast('ИИ уточнил детали', null, { icon: 'sparkles' });
  } catch (e) { /* остаётся локальный разбор */ }
}

/* ---------- FEATURE 5.3 · экспорт отчёта (печать → PDF) ---------- */
function exportReport() {
  const r = ledgerPeriodRange();
  const list = scopeTxns(r, null);
  const cur = S.settings.currency;
  const inc = flowOf(list, 'income'), exp = flowOf(list, 'expense');
  const h = healthCore();
  const M = v => moneyPlain(v, cur);
  const byCat = {};
  list.filter(t => t.type === 'expense').forEach(t => { const c = txnRootOf(t) || txnCatOf(t); const k = c ? c.id : '__none__'; const e = byCat[k] || (byCat[k] = { name: c ? c.name : 'Без категории', color: c ? (c.color || '') : '', sum: 0 }); e.sum += t.amount; });
  const cats = Object.keys(byCat).sort((a, b2) => byCat[b2].sum - byCat[a].sum);
  const maxC = cats.length ? byCat[cats[0]].sum : 1;
  const top = list.filter(t => t.type === 'expense').slice().sort((a, b2) => b2.amount - a.amount).slice(0, 5);
  const goals = S.goals.slice().sort((a, b2) => (a.order || 0) - (b2.order || 0));
  const b30 = smartBase();
  const savM = Math.max(0, b30.inc30 - b30.exp30);
  const row = (l, v) => '<tr><td>' + l + '</td><td class="n">' + v + '</td></tr>';
  /* сравнение с прошлым периодом — только для стандартных периодов */
  let cmp = null;
  if (['month', 'year', 'week', '2w', '7d', '30d'].indexOf(r.key) > -1) {
    try {
      const pr = periodRange(r.key, -1);
      const pl = scopeTxns(pr, null);
      const pInc = flowOf(pl, 'income'), pExp = flowOf(pl, 'expense');
      cmp = {
        label: pr.label,
        dInc: pInc > 0 ? (inc - pInc) / pInc : null,
        dExp: pExp > 0 ? (exp - pExp) / pExp : null,
        pInc, pExp
      };
    } catch (e) {}
  }
  const pct = v => v === null ? '' : (v > 0 ? '+' : '') + Math.round(v * 100) + '%';
  const hRow = c => '<tr><td style="border:0;padding:4px 0">' + (c.score === null ? '·' : c.score >= 80 ? '✓' : c.score >= 50 ? '⚠' : '✗') + ' ' + c.name + '<div class="bar"><i style="width:' + (c.score === null ? 0 : c.score) + '%"></i></div></td>' +
    '<td style="border:0;padding:4px 0" class="n">' + esc(c.value) + '</td></tr>';
  const accounts = S.accounts.filter(a => !a.archived).sort((a, b2) => (a.order || 0) - (b2.order || 0));
  const html = '<!doctype html><html lang="ru"><head><meta charset="utf-8"><title>ONYX · Отчёт</title><style>' +
    '@page{margin:14mm}body{background:#000;color:#f5f6f8;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;margin:0;padding:28px 30px;-webkit-print-color-adjust:exact;print-color-adjust:exact}' +
    'h1{font-size:28px;margin:0;letter-spacing:-.02em}h2{font-size:14px;text-transform:uppercase;letter-spacing:.1em;color:#8b9097;margin:30px 0 10px}' +
    '.sub{color:#8b9097;font-size:14px;margin-top:6px}' +
    '.card{background:#131316;border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:16px 20px;margin-top:12px}' +
    'table{width:100%;border-collapse:collapse;font-size:14px}td{padding:7px 0;border-bottom:1px solid rgba(255,255,255,.06)}td:last-child{text-align:right}' +
    '.n{font-variant-numeric:tabular-nums;font-weight:700}.pos{color:#30d158}.neg{color:#ff453a}' +
    '.bar{height:8px;border-radius:99px;background:#26262b;overflow:hidden;margin:6px 0 2px}.bar i{display:block;height:100%;border-radius:99px;background:linear-gradient(90deg,#ff453a,#ff9500)}' +
    '.score{display:flex;align-items:center;gap:18px}.score b{font-size:46px;font-weight:800;line-height:1}' +
    '.small{font-size:12px;color:#8b9097}' +
    '.grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px}' +
    '.grid .card{margin-top:0}' +
    '</style></head><body>' +
    '<h1>ONYX · Финансовый отчёт</h1><div class="sub">Период: ' + esc(r.label) + ' · сформирован ' + dayLabel(iso(new Date())) + ' · ' + list.length + ' операций</div>' +
    '<div class="card"><table>' +
    row('Баланс сейчас', M(h.bal)) +
    row('Доходы за период', '<span class="pos">+' + M(inc) + '</span>') +
    row('Расходы за период', '<span class="neg">−' + M(exp) + '</span>') +
    row('Чистый поток', M(inc - exp)) +
    row('Норма сбережений', h.savRate === null ? '—' : Math.round(h.savRate * 100) + '%') +
    row('В среднем за день', list.length ? M(exp / Math.max(1, Math.round((r.to - r.from) / 864e5) || 1)) : '—') +
    row('Индекс здоровья', (h.score === null ? '—' : h.score + ' / 100') + ' · ' + hlWord(h)) +
    (cmp ? row('К прошлому периоду', 'доходы <span class="' + (cmp.dInc >= 0 ? 'pos' : 'neg') + '">' + pct(cmp.dInc) + '</span> · расходы <span class="' + (cmp.dExp <= 0 ? 'pos' : 'neg') + '">' + pct(cmp.dExp) + '</span>') : '') +
    '</table></div>' +
    '<h2>Составляющие здоровья</h2><div class="card score"><b>' + (h.score === null ? '—' : h.score) + '<span style="font-size:18px;color:#8b9097">/100</span></b>' +
    '<div><table style="font-size:13px">' + h.comps.map(hRow).join('') + '</table></div></div>' +
    '<h2>Счета</h2><div class="card"><table>' +
    (accounts.length ? accounts.map(a => row(esc(a.name) + (a.system ? ' <span class="small">🔒 защищённый</span>' : ''), M(accBalance(a.id)))).join('') : '<tr><td class="small">Счетов нет</td><td></td></tr>') +
    '</table></div>' +
    '<h2>Категории расходов</h2><div class="card"><table>' +
    (cats.length ? cats.map(k => {
      const e = byCat[k];
      const col = /^#?[0-9a-fA-F]{3,8}$/.test(String(e.color || '').trim()) ? (String(e.color).trim().charAt(0) === '#' ? e.color.trim() : '#' + String(e.color).trim()) : '#ff453a';
      return '<tr><td><span style="display:inline-block;width:9px;height:9px;border-radius:50%;background:' + col + ';margin-right:8px;vertical-align:1px"></span>' + esc(e.name) +
        '<div class="bar"><i style="width:' + Math.round(e.sum / maxC * 100) + '%;background:' + col + '"></i></div></td><td class="n">' + M(e.sum) + '</td></tr>';
    }).join('') : '<tr><td class="small">Нет расходов за период</td><td></td></tr>') +
    '</table></div>' +
    '<div class="grid">' +
    '<div><h2 style="margin-top:0">Крупнейшие операции</h2><div class="card"><table>' +
    (top.length ? top.map(t => {
      const c = txnCatOf(t);
      return row(esc(t.note || (c ? c.name : 'Операция')) + '<div class="small">' + esc(dayLabel(dkey(t))) + (c ? ' · ' + esc(c.name) : '') + '</div>', '−' + M(t.amount));
    }).join('') : '<tr><td class="small">Нет операций</td><td></td></tr>') +
    '</table></div></div>' +
    '<div><h2 style="margin-top:0">Покупки</h2><div class="card"><table>' +
    (goals.length ? goals.map(g => {
      const p = g.target > 0 ? Math.round(clamp(g.saved / g.target, 0, 1) * 100) : 0;
      const rem = Math.max(0, g.target - g.saved);
      const eta = rem <= 0 ? 'можно покупать' : savM > 0 ? '≈ ' + Math.max(1, Math.ceil(rem / savM)) + ' мес.' : '—';
      return '<tr><td>' + esc(g.name) + '<div class="bar"><i style="width:' + p + '%;background:linear-gradient(90deg,#1e9e50,#30d158)"></i></div>' +
        '<div class="small">' + p + '% · ' + eta + '</div></td><td class="n">' + M(g.saved) + ' / ' + M(g.target) + '</td></tr>';
    }).join('') : '<tr><td class="small">Список покупок пуст</td><td></td></tr>') +
    '</table></div></div>' +
    '</div>' +
    '<p class="small" style="margin-top:26px">Сформировано в ONYX · данные хранятся только на устройстве</p>' +
    '</body></html>';
  const w = window.open('', '_blank');
  if (!w) { toast('Разрешите всплывающие окна для печати', null, { tone: 'danger' }); return; }
  w.document.open(); w.document.write(html); w.document.close();
  setTimeout(() => { try { w.focus(); w.print(); } catch (e) {} }, 500);
}

/* ---------- настройки ИИ ---------- */
function openAISettings(after) {
  const ai = S.settings.ai || (S.settings.ai = DEF_AI());
  openSheet({
    title: 'AI-ассистент',
    html: '<div style="display:flex;flex-direction:column;gap:14px;padding-top:4px">' +
      '<div class="list" style="padding:16px;display:flex;flex-direction:column;gap:16px">' +
      '<div class="field"><span>API endpoint</span><input class="inp" id="aiEp" placeholder="https://api.openai.com/v1/chat/completions" value="' + esc(ai.endpoint) + '" autocapitalize="off" autocorrect="off" spellcheck="false"></div>' +
      '<div class="field"><span>API key</span><input class="inp" id="aiKey" type="password" placeholder="sk-…" value="' + esc(ai.key) + '" autocapitalize="off" autocorrect="off" spellcheck="false"></div>' +
      '<div class="field"><span>Модель</span><input class="inp" id="aiModel" placeholder="gpt-4o-mini" value="' + esc(ai.model) + '" autocapitalize="off" autocorrect="off" spellcheck="false"></div>' +
      '</div>' +
      '<button class="btn btn--chrome" id="aiTest" type="button">Проверить соединение</button>' +
      '<button class="btn btn--ghost" id="aiSave" type="button">Сохранить</button>' +
      '<p style="margin:0;color:var(--t3);font-size:13px;line-height:1.55;padding:0 4px">Ключ хранится только на этом устройстве и отправляется лишь в выбранный вами API. Укажите endpoint (например, https://api.openai.com/v1/chat/completions) и ваш ключ.</p></div>',
    mount(sh) {
      const ep = sh.querySelector('#aiEp'), key = sh.querySelector('#aiKey'), md = sh.querySelector('#aiModel');
      sh.querySelector('#aiSave').onclick = () => {
        ai.endpoint = ep.value.trim();
        ai.key = key.value.trim();
        ai.model = md.value.trim() || 'gpt-4o-mini';
        save(); haptic(10); closeSheet();
        toast(ai.key ? 'ИИ-настройки сохранены' : 'Сохранено — работает офлайн-режим');
        if (after) after();
      };
      sh.querySelector('#aiTest').onclick = async () => {
        const btn = sh.querySelector('#aiTest');
        const old = { endpoint: ai.endpoint, key: ai.key, model: ai.model };
        ai.endpoint = ep.value.trim(); ai.key = key.value.trim(); ai.model = md.value.trim() || 'gpt-4o-mini';
        btn.disabled = true; btn.textContent = 'Проверяю…';
        try {
          await aiChat([{ role: 'user', content: 'ping' }], { max_tokens: 5, timeout: 20000 });
          toast('Подключение работает', null, { icon: 'sparkles' });
        } catch (e) {
          toast('Не удалось подключиться (' + e.message + ')', null, { tone: 'danger' });
        } finally {
          ai.endpoint = old.endpoint; ai.key = old.key; ai.model = old.model;
          btn.disabled = false; btn.textContent = 'Проверить соединение';
        }
      };
    }
  });
}
