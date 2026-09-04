"use strict";
/* domain/calculations.js — расчёты: балансы счетов (с кэшем), итоги по валютам, границы периодов, отбор операций, потоки доход/расход. Зависимости — utils (iso, sod, sum), domain/periods (MON_*), domain/cache (createCache); S читается в момент вызова. */
/* PERF: кэши на фабрике createCache (domain/cache.js) вместо ручных пар «_XCache/_XDirty».
   Инвалидация — balCache.invalidate()/txnSortCache.invalidate() в storage/store.js
   (save() и load()), то есть при реальном изменении данных. */
const balCache = createCache(() => {
  const m = {};
  S.accounts.forEach(a => { m[a.id] = +((a.start !== undefined && a.start !== null) ? a.start : a.initial) || 0; });
  for (const t of S.transactions) {
    if (t.type === 'expense') { if (m[t.accountId] !== undefined) m[t.accountId] -= t.amount; }
    else if (t.type === 'income') { if (m[t.accountId] !== undefined) m[t.accountId] += t.amount; }
    else if (t.type === 'transfer') { if (m[t.accountId] !== undefined) m[t.accountId] -= t.amount; if (m[t.toAccountId] !== undefined) m[t.toAccountId] += t.amount; }
    else if (t.type === 'adjust') { if (m[t.accountId] !== undefined) m[t.accountId] += t.amount * (t.adjustSign || 1); }
  }
  return m;
});
function accBalances() {
  /* сигнатура: количество операций + id первой (для дешёвых UI-перерисовок без save());
     реальная инвалидация — balCache.invalidate() из save()/load() */
  const sig = S.transactions.length + ':' + (S.transactions[0] ? S.transactions[0].id : '');
  return balCache.get(sig);
}
function accBalance(id) {
  const a = accById(id); if (!a) return 0;
  return accBalances()[id] || 0;
}
function totalsByCur() {
  const m = {};
  S.accounts.filter(a => a.hidden !== true && a.inTotal !== false && !a.archived).forEach(a => { m[a.currency] = (m[a.currency] || 0) + accBalance(a.id); });
  return m;
}
function inRange(t, from, to) { const k = t.date.slice(0, 10); return k >= iso(from) && k <= iso(to); }
function periodRange(unit, off) {
  const now = new Date();
  if (unit === 'all') return { from: new Date(2000, 0, 1), to: addD(sod(now), 3650), label: 'Всё время' };
  if (unit === 'day') { const d = addD(sod(now), off); return { from: d, to: d, label: dayLabel(iso(d)).split(',')[0] }; }
  if (unit === 'week') { const f = addD(sow(now), off * 7); const t = addD(f, 6); return { from: f, to: t, label: f.getDate() + ' ' + MON_S[f.getMonth()] + ' – ' + t.getDate() + ' ' + MON_S[t.getMonth()] }; }
  if (unit === 'year') { const y = now.getFullYear() + off; return { from: new Date(y, 0, 1), to: new Date(y, 11, 31), label: String(y) }; }
  const f = addM(now, off), t = addD(addM(f, 1), -1);
  return { from: f, to: t, label: MON_N[f.getMonth()] + (f.getFullYear() !== now.getFullYear() ? ' ' + f.getFullYear() : '') };
}
/* PERF: кэш отсортированного (desc по дате) списка транзакций — на createCache.
   Инвалидация — txnSortCache.invalidate() в storage/store.js (save()/load()).
   Прямое сравнение строк ISO-дат вместо ресурсоёмкого localeCompare. */
const txnSortCache = createCache(() =>
  S.transactions.slice().sort((a, b) => {
    const da = a.date || '', db = b.date || '';
    return db < da ? -1 : (db > da ? 1 : 0);
  })
);
function sortedTxns() {
  return txnSortCache.get('_');
}
/* PERF: границы периода переводим в строки ОДИН раз на вызов вместо iso() на каждую
   операцию (было 2 аллокации Date × N; функция вызывается ~20 раз за сессию, в т.ч.
   4 раза подряд в smartTips). Логика отбора не изменилась.
   src — необязательный источник вместо S.transactions (viewLedger передаёт уже
   отсортированный кэш; filter сохраняет порядок, поэтому результат тот же). */
function scopeTxns(r, accId, src) {
  const list = src || S.transactions;
  const kf = iso(r.from), kt = iso(r.to);
  return list.filter(t => {
    const k = String(t.date || '').slice(0, 10);
    return k >= kf && k <= kt && (!accId || t.accountId === accId || t.toAccountId === accId);
  });
}
function flowOf(list, kind) {
  const st = S.settings;
  const transferAsIO = !!(st && st.transferAsIO);
  const adjustAsIO = !!(st && st.adjustAsIO);
  let total = 0;
  for (let i = 0; i < list.length; i++) {
    const t = list[i];
    const type = t.type;
    if (type === kind) {
      total += t.amount;
    } else if (type === 'transfer' && transferAsIO) {
      if (kind === 'expense' ? !!t.accountId : !!t.toAccountId) total += t.amount;
    } else if (type === 'adjust' && adjustAsIO) {
      const sign = t.adjustSign || 1;
      if (kind === 'income' ? sign > 0 : sign < 0) total += t.amount;
    }
  }
  return total;
}
