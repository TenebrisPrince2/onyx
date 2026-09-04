/* storage/mutations.js — единственная точка мутаций состояния (Store).
   Экраны больше не мутируют S напрямую: методы Store нормализуют вход, мутируют S
   и вызывают save() (он инвалидирует кэши и планирует persist + emitStore).
   Сложные составные операции (undo, импорт, сброс) — через Store.commit(fn). */
"use strict";
const TXN_TYPES = ['expense', 'income', 'transfer', 'adjust'];
const money2 = v => Math.round((+v || 0) * 100) / 100;
const Store = {
  /** Создать операцию. Возвращает созданную запись (с id и нормализованной суммой). */
  addTransaction(t) {
    const type = TXN_TYPES.includes(t.type) ? t.type : 'expense';
    const rec = {
      id: t.id || uid(),
      type: type,
      amount: Math.max(0, money2(t.amount)),
      accountId: t.accountId || null,
      toAccountId: type === 'transfer' ? (t.toAccountId || null) : null,
      categoryId: (type === 'expense' || type === 'income') ? (t.categoryId || null) : null,
      note: String(t.note || ''),
      date: t.date || (iso(new Date()) + 'T12:00'),
      createdAt: t.createdAt || t.date || iso(new Date())
    };
    if (type === 'adjust') rec.adjustSign = t.adjustSign === -1 ? -1 : 1;
    if (t.currency) rec.currency = t.currency;
    S.transactions.push(rec);
    S.transactions.sort((a, b) => (b.date > a.date ? 1 : b.date < a.date ? -1 : 0));
    save();
    return rec;
  },
  updateTransaction(id, patch) {
    const t = S.transactions.find(x => x.id === id);
    if (!t) return null;
    if (patch.amount !== undefined) patch.amount = Math.max(0, money2(patch.amount));
    Object.assign(t, patch);
    S.transactions.sort((a, b) => (b.date > a.date ? 1 : b.date < a.date ? -1 : 0));
    save();
    return t;
  },
  deleteTransaction(id) {
    const i = S.transactions.findIndex(x => x.id === id);
    if (i === -1) return false;
    S.transactions.splice(i, 1);
    save();
    return true;
  },
  restoreTransaction(t, index) {
    if (typeof index === 'number' && index >= 0 && index <= S.transactions.length) {
      S.transactions.splice(index, 0, t);
    } else {
      S.transactions.push(t);
    }
    S.transactions.sort((a, b) => (b.date > a.date ? 1 : b.date < a.date ? -1 : 0));
    save();
    return t;
  },
  addAccount(a) {
    const rec = Object.assign({ id: a.id || uid(), name: '', currency: S.settings.currency, initial: 0, inTotal: true, order: S.accounts.length, archived: false }, a);
    S.accounts.push(rec);
    save();
    return rec;
  },
  updateAccount(id, patch) {
    const a = S.accounts.find(x => x.id === id);
    if (!a) return null;
    if (a.system) delete patch.system; /* системные счета защищены от смены роли */
    Object.assign(a, patch);
    save();
    return a;
  },
  deleteAccount(id) {
    const a = accById(id);
    if (!a || a.system) return false;
    S.transactions = S.transactions.filter(t => t.accountId !== id && t.toAccountId !== id);
    S.accounts = S.accounts.filter(x => x.id !== id);
    if (typeof UI !== 'undefined' && UI.accId === id) UI.accId = null;
    save();
    return true;
  },
  restoreAccount(snap, txns) {
    if (!snap) return;
    if (!S.accounts.some(x => x.id === snap.id)) {
      S.accounts.push(snap);
    }
    if (Array.isArray(txns) && txns.length) {
      const existingIds = new Set(S.transactions.map(t => t.id));
      for (let i = 0; i < txns.length; i++) {
        if (!existingIds.has(txns[i].id)) {
          S.transactions.push(txns[i]);
        }
      }
      S.transactions.sort((x, y) => (y.date > x.date ? 1 : y.date < x.date ? -1 : 0));
    }
    save();
  },
  reorderAccounts(ids) {
    if (!Array.isArray(ids)) return;
    for (let i = 0; i < ids.length; i++) {
      const a = accById(ids[i]);
      if (a) a.order = i;
    }
    save();
  },
  reorderCategories(ids) {
    if (!Array.isArray(ids)) return;
    for (let i = 0; i < ids.length; i++) {
      const c = catById(ids[i]);
      if (c) c.order = i;
    }
    save();
  },
  /** Создать или обновить категорию (по наличию c.id). */
  upsertCategory(c) {
    let cat = c.id ? S.categories.find(x => x.id === c.id) : null;
    if (cat) Object.assign(cat, c);
    else {
      cat = Object.assign({ id: uid(), name: '', kind: 'expense', parentId: null, order: S.categories.length, color: PALETTE[0], icon: 'circle-slash' }, c);
      S.categories.push(cat);
    }
    save();
    return cat;
  },
  /** Удалить категорию: операции → «Без категории», подкатегории — на верхний уровень. */
  deleteCategory(id) {
    S.transactions.forEach(x => { if (x.categoryId === id) x.categoryId = null; });
    S.categories.forEach(x => { if (x.parentId === id) x.parentId = null; });
    S.categories = S.categories.filter(x => x.id !== id);
    save();
  },
  restoreCategory(snap, kids, touched) {
    if (!snap) return;
    if (!S.categories.some(x => x.id === snap.id)) {
      S.categories.push(snap);
    }
    if (Array.isArray(kids)) {
      kids.forEach(k => {
        const kidId = typeof k === 'string' ? k : (k && k.id);
        const target = kidId ? S.categories.find(x => x.id === kidId) : k;
        if (target) target.parentId = snap.id;
      });
    }
    if (Array.isArray(touched)) {
      touched.forEach(r2 => {
        if (!r2) return;
        const target = r2.t || (r2.id ? S.transactions.find(x => x.id === r2.id) : null);
        if (target) target.categoryId = r2.was;
      });
    }
    save();
  },
  removeTemplate(id) { S.templates = S.templates.filter(x => x.id !== id); save(); },
  upsertTemplate(tpl) {
    let t = tpl.id ? S.templates.find(x => x.id === tpl.id) : null;
    if (t) Object.assign(t, tpl);
    else {
      t = Object.assign({ id: uid(), name: '', type: 'expense', amount: 0, every: 'month', next: iso(addM(new Date(), 1)) }, tpl);
      S.templates.push(t);
    }
    save();
    return t;
  },
  updateSetting(key, value) { S.settings[key] = value; save(); return value; },
  /** Составная мутация: fn(S) может менять состояние как угодно; save() — один раз в конце. */
  commit(fn) { fn(S); save(); }
};
if (typeof window !== 'undefined') {
  window.App = window.App || {};
  window.App.store = Store;
}
if (typeof globalThis !== 'undefined') {
  globalThis.App = globalThis.App || (typeof window !== 'undefined' ? window.App : {});
  globalThis.App.store = Store;
}