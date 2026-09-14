"use strict";

/* screens/smart/smart-model.js — подготовка данных и чистые финансовые модели (DOM-free): подписки, цикл зарплаты, 30-дневная база, индекс здоровья. */

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
  add('bills', 'archive', 'Платежи вовремя', 10, billsPct,
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
      icon: 'archive', title: 'Проверьте регулярные платежи',
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

if (typeof window !== 'undefined') {
  window.moneyPlain = moneyPlain;
  window.sumOf = sumOf;
  window.txnCatOf = txnCatOf;
  window.txnRootOf = txnRootOf;
  window.MUSTHAVE_RE = MUSTHAVE_RE;
  window.isMustHaveCat = isMustHaveCat;
  window.detectSubscriptions = detectSubscriptions;
  window.payCycle = payCycle;
  window.smartBase = smartBase;
  window.loggingStreak = loggingStreak;
  window.MON_PREP = MON_PREP;
  window.healthCore = healthCore;
  window.hlWord = hlWord;
  window.hlColor = hlColor;
  window.healthHistory = healthHistory;
  window.healthDelta = healthDelta;
  window.healthActions = healthActions;
}
