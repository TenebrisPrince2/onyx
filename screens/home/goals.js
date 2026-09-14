"use strict";

/* screens/home/goals.js — экран списка накоплений и покупок (openGoals, viewGoals, темп сбережений). */

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

/* svIcon — алиас единого resolveLucide (Lucide registry + миграция старых ID) */
const svIcon = (typeof resolveLucide === 'function') ? ((n) => resolveLucide(n, 'circle-slash')) : (n => (n && (typeof LUCIDE_SVG !== 'undefined' ? (LUCIDE_SVG[n] ? n : ((typeof ICON_MIGRATION_MAP !== 'undefined' && ICON_MIGRATION_MAP[n]) || n)) : n)) || 'circle-slash');

function viewGoals() {
  let html = '';
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
      '<div class="sw__acts sw__acts--full"><button class="sw__del" data-act="del-goal" data-id="' + g.id + '" aria-label="Удалить покупку"><i data-lucide="trash" class="ic"></i><span>Удалить</span></button></div>' +
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
    '<button class="btn btn--chrome" style="flex:1" data-act="goals-ai"><i data-lucide="sparkle" class="ic"></i>Что купить сейчас?</button></div>';
  return html;
}

function goalsHTML() {
  return '<div class="shead"><button class="iconbtn" data-act="close"><i data-lucide="x" class="ic"></i></button><h2>Покупки</h2>' +
    '<span class="spacer"></span>' +
    '<button class="iconbtn" data-act="goals-ai" aria-label="Спросить ИИ"><i data-lucide="sparkle" class="ic"></i></button></div><div class="screen__body">' + viewGoals() + '</div>';
}

function openGoals() {
  const rec = pushScreen({ id: 'goals', push: true, html: goalsHTML(), mount: goalsMount, refresh: () => { rec.el.innerHTML = goalsHTML(); icons(rec.el); goalsMount(rec.el); } });
}

function goalsMount(el) {
  el.querySelector('[data-act="close"]').onclick = () => popScreen();
  el.querySelectorAll('[data-act="edit-goal"]').forEach(b => b.onclick = () => openGoalForm(b.dataset.id));
  el.querySelectorAll('[data-act="new-goal"]').forEach(b => b.onclick = () => openGoalForm());
  el.querySelectorAll('[data-act="goals-ai"]').forEach(b => b.onclick = () => {
    haptic('light');
    openAdvisor('Вот список моих желаемых покупок (см. activeGoals). Что разумнее купить сейчас, что отложить и сколько откладывать в месяц?');
  });
  el.querySelectorAll('[data-act="goal-add"]').forEach(b => b.onclick = () => goalContribute(b.dataset.id));
  enableDeleteSwipe(el.querySelector('#goalList'), { ask: (id, row) => swipeAskDeleteGoal(id, row), instant: (id, row) => swipeDeleteGoal(id, row) }, '.sv');
}

if (typeof window !== 'undefined') {
  window.dayPlural = dayPlural;
  window.goalPaceInfo = goalPaceInfo;
  window.viewGoals = viewGoals;
  window.goalsHTML = goalsHTML;
  window.openGoals = openGoals;
  window.goalsMount = goalsMount;
}
