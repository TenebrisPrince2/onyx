/* smart/ai.js — ИИ-клиент и локальные эвристики (советник, снепшоты, рекомендации).
   Вынесено из screens/smart.js в рамках модульной декомпозиции. */
/* global round2 */
"use strict";

/* ═══════════════════════════════ smart: ai client & heuristics ═══════════════════════════════ */
window.SmartAI = (function () {
  /* ---------- FEATURE 2 · ИИ-клиент (OpenAI-совместимый, ключ пользователя) ---------- */
  const AI_SYS = 'Ты — финансовый советник приложения ONYX. Правила: отвечай ВСЕГДА на русском языке; пользуйся ТОЛЬКО данными из сообщения пользователя, никогда не выдумывай операции, суммы, категории или даты; давай конкретные числа, названия категорий и даты из предоставленных данных; будь дружелюбным и практичным; ответ до 150 слов; без markdown — только обычный текст. Если спрашивают про покупки или цели (activeGoals): сравни каждую покупку с балансом, подушкой безопасности и свободными деньгами за 30 дней; советуй, что разумнее купить сейчас, что отложить и сколько откладывать в месяц; учитывай, что деньги на покупки копятся на защищённом счёте «Накопления», а подушка безопасности — отдельный счёт, который трогать не стоит.';

  const aiReady = () => {
    const a = (S.settings && S.settings.ai) || {};
    return !!(a.key && a.endpoint);
  };

  async function aiChat(messages, opts = {}) {
    const ai = (S.settings && S.settings.ai) || {};
    if (!ai.key || !ai.endpoint) throw new Error('нет ключа');
    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), opts.timeout || 45000);
    try {
      const res = await fetch(ai.endpoint, {
        method: 'POST',
        signal: ctrl.signal,
        headers: { 'Authorization': 'Bearer ' + ai.key, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: ai.model || 'gpt-4o-mini',
          messages,
          temperature: opts.temperature === undefined ? 0.4 : opts.temperature,
          max_tokens: opts.max_tokens || 600
        })
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const j = await res.json();
      const txt = j && j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content;
      if (!txt) throw new Error('пустой ответ');
      return String(txt).trim();
    } finally {
      clearTimeout(to);
    }
  }

  function aiSnapshot() {
    const b = smartBase();
    const byCat = {};
    b.l30.filter(t => t.type === 'expense').forEach(t => {
      const c = txnRootOf(t) || txnCatOf(t);
      const n = c ? c.name : 'Без категории';
      byCat[n] = round2((byCat[n] || 0) + t.amount);
    });
    const ranked = Object.keys(byCat).sort((a, b2) => byCat[b2] - byCat[a]);
    const biggest = b.l30.filter(t => t.type === 'expense').slice().sort((a, b2) => b2.amount - a.amount)[0] || null;
    return {
      currency: b.cur,
      period: 'последние 30 дней',
      currentBalance: round2(b.bal),
      last30days: {
        income: round2(b.inc30),
        expense: round2(b.exp30),
        byCategory: byCat
      },
      recurringSubscriptions: b.subs.map(s => ({ name: s.name, amount: s.amount, dayOfMonth: s.dayOfMonth })),
      protectedAccounts: {
        emergencyFund: sysAcc('fund') ? round2(accBalance(sysAcc('fund').id)) : null,
        savingsPot: sysAcc('goals') ? round2(accBalance(sysAcc('goals').id)) : null
      },
      activeGoals: S.goals.filter(g => g.saved < g.target).map(g => ({
        name: g.name,
        target: g.target,
        saved: g.saved,
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
    const cur = b.cur;
    const M = v => moneyPlain(v, cur);
    const thisM = scopeTxns(periodRange('month', 0), null);
    const mExp = sumOf(thisM, 'expense');
    const mInc = sumOf(thisM, 'income');
    const byCat = {};
    thisM.filter(t => t.type === 'expense').forEach(t => {
      const c = txnRootOf(t) || txnCatOf(t);
      const n = c ? c.name : 'Без категории';
      byCat[n] = (byCat[n] || 0) + t.amount;
    });
    const ranked = Object.keys(byCat).sort((a, b2) => byCat[b2] - byCat[a]);
    const prevByCat = {};
    scopeTxns(periodRange('month', -1), null).filter(t => t.type === 'expense').forEach(t => {
      const c = txnRootOf(t) || txnCatOf(t);
      const n = c ? c.name : 'Без категории';
      prevByCat[n] = (prevByCat[n] || 0) + t.amount;
    });

    if (/перетра|трат.*(мног|меньш|растут)|где.*деньги|overspend|эконом/.test(s)) {
      if (!ranked.length) return 'За этот месяц расходов пока нет — вернитесь с вопросом через пару недель.';
      const top = ranked.slice(0, 3);
      let txt = 'Топ трат месяца: ' + top.map(n => n + ' — ' + M(byCat[n])).join(', ') + '. За 30 дней всего расходов: ' + M(b.exp30) + '.';
      const grow = top.filter(n => prevByCat[n] > 0 && byCat[n] > prevByCat[n] * 1.15);
      if (grow.length) txt += ' Сильнее всего выросло: ' + grow.slice(0, 2).map(n => n + ' (+' + Math.round((byCat[n] / prevByCat[n] - 1) * 100) + '%)').join(', ') + '.';
      txt += ' Совет: сократите первую категорию на 20% — это ' + M(byCat[ranked[0]] * 0.2) + ' экономии в месяц.';
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
      if (perDay && sav30 / 30 < perDay) txt += ' Ускорение: минус один кофе в день ≈ +' + M(135) + '/мес к цели, а сокращение желаний на 15% даст ещё ~' + M(Math.max(0, (b.exp30 - b.must30) * 0.15)) + '/мес.';
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

  return {
    AI_SYS,
    aiReady,
    aiChat,
    aiSnapshot,
    localAdvice
  };
})();

// Обратная совместимость с глобальной областью видимости
window.AI_SYS = window.SmartAI.AI_SYS;
window.aiReady = window.SmartAI.aiReady;
window.aiChat = window.SmartAI.aiChat;
window.aiSnapshot = window.SmartAI.aiSnapshot;
window.localAdvice = window.SmartAI.localAdvice;
