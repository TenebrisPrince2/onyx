/* smart/insights.js — UI инсайтов, умные советы и рекомендации.
   Вынесено из screens/smart.js в рамках модульной декомпозиции. */
"use strict";

/* ═══════════════════════════════ smart: insights ui ═══════════════════════════════ */
window.SmartInsights = (function () {
  /* ---------- FEATURE 3 · умные советы (инсайты) ---------- */
  function smartTips() {
    const tips = [];
    const cur = S.settings.currency;
    const M = v => moneyPlain(v, cur);
    const today = sod(new Date());
    const thisM = scopeTxns(periodRange('month', 0), null);
    const mInc = sumOf(thisM, 'income');
    const rootSpend = list => {
      const m = {};
      list.filter(t => t.type === 'expense').forEach(t => {
        const c = txnRootOf(t) || txnCatOf(t);
        if (c) m[c.name] = (m[c.name] || 0) + t.amount;
      });
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
      if (avg > 0 && curSpend[n] > avg * 1.8 && mInc > 0 && curSpend[n] > mInc * 0.2) {
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
      if (pct >= 0.15 && (!bestSelf || pct > bestSelf.pct)) bestSelf = { n, pct, d: prevSpend[n] - curSpend[n] };
    });
    if (bestSelf) tips.push({ icon: 'trending-up', color: '#0a84ff', title: bestSelf.n + ': −' + Math.round(bestSelf.pct * 100) + '% к прошлому месяцу', body: 'Экономия ' + M(bestSelf.d) + ' — держите темп, это ваша лучшая категория месяца.' });

    return tips.slice(0, 5);
  }

  function tipsHTML() {
    let tips = [];
    try { tips = smartTips(); } catch {}
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
    try { tips = smartTips(); } catch {}
    root.querySelectorAll('[data-tip]').forEach(b => b.onclick = () => {
      const t = tips[+b.dataset.tip];
      if (t && t.apply) { haptic('light'); t.apply.fn(); }
    });
  }

  return {
    smartTips,
    tipsHTML,
    bindTips
  };
})();

// Обратная совместимость с глобальной областью видимости
window.smartTips = window.SmartInsights.smartTips;
window.tipsHTML = window.SmartInsights.tipsHTML;
window.bindTips = window.SmartInsights.bindTips;
