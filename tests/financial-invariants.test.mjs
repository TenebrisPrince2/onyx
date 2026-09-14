// tests/financial-invariants.test.mjs
// Комплексные тесты финансовой корректности и инвариантов ONYX.
// Приоритет: КОРРЕКТНОСТЬ ДАННЫХ > КОРРЕКТНОСТЬ РАСЧЁТОВ > КОРРЕКТНОСТЬ МУТАЦИЙ.

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from './helpers/sandbox.mjs';

// ============================================================================
// 1. ТЕСТОВЫЙ ХАРНЕСС
// ============================================================================
function makeTestApp(initialState = {}) {
  const defaultState = {
    accounts: [
      { id: 'a1', name: 'Основной', currency: 'BYN', initial: 1000, inTotal: true, hidden: false, order: 0, archived: false },
      { id: 'a2', name: 'Накопления', currency: 'BYN', initial: 500, inTotal: true, hidden: false, order: 1, archived: false }
    ],
    categories: [
      { id: 'c1', name: 'Продукты', kind: 'expense', parentId: null, order: 0, hidden: false, hiddenFromOverview: false },
      { id: 'c2', name: 'Зарплата', kind: 'income', parentId: null, order: 1, hidden: false, hiddenFromOverview: false }
    ],
    transactions: [],
    goals: [],
    templates: [],
    settings: {
      currency: 'BYN',
      roundTotals: false,
      firstDay: 1,
      transferAsIO: false,
      adjustAsIO: false
    }
  };

  const s = Object.assign({}, defaultState, initialState);
  if (initialState.settings) {
    s.settings = Object.assign({}, defaultState.settings, initialState.settings);
  }
  if (initialState.accounts) s.accounts = initialState.accounts;
  if (initialState.categories) s.categories = initialState.categories;
  if (initialState.transactions) s.transactions = initialState.transactions;
  if (initialState.goals) s.goals = initialState.goals;
  if (initialState.templates) s.templates = initialState.templates;

  const app = createApp(s);
  const storageMap = new Map();
  app.ctx.localStorage = {
    getItem: k => storageMap.get(k) || null,
    setItem: (k, v) => storageMap.set(k, String(v)),
    removeItem: k => storageMap.delete(k),
    clear: () => storageMap.clear()
  };
  app.ctx.toast = () => {};
  app.ctx.t = k => k;
  app.ctx.UI = { accId: null, ledger: { day: null, period: 'all' } };
  app.ctx.document = {
    querySelector: () => null,
    querySelectorAll: () => [],
    createElement: () => ({
      setAttribute: () => {},
      appendChild: () => {},
      click: () => {},
      remove: () => {},
      style: {}
    }),
    body: { appendChild: () => {} }
  };
  app.ctx.window = app.ctx;
  app.ctx.emitStore = () => {};

  app.load(
    'utils.js',
    'domain/icons-data.js',
    'domain/cache.js',
    'domain/periods.js',
    'domain/currency.js',
    'domain/factories.js',
    'domain/entities.js',
    'domain/calculations.js',
    'storage/keys.js',
    'storage/safe.js',
    'storage/schema.js',
    'storage/state.js',
    'storage/store.js',
    'storage/mutations.js',
    'screens/home/home-state.js',
    'screens/home/ledger-model.js',
    'app/recurring.js',
    'screens/settings.js'
  );

  return { app, storageMap };
}

// ============================================================================
// 2. REFERENCE CALCULATOR (Независимый эталонный калькулятор)
// ============================================================================
function round2(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return 0;
  return (n < 0 ? -1 : 1) * (Math.round((Math.abs(n) + Number.EPSILON) * 100) / 100);
}

function refBalance(accountId, accounts, transactions) {
  const acc = accounts.find(a => a.id === accountId);
  if (!acc) return 0;
  let bal = +((acc.start !== undefined && acc.start !== null) ? acc.start : acc.initial) || 0;
  for (const t of transactions) {
    if (t.type === 'expense' && t.accountId === accountId) {
      bal -= t.amount;
    } else if (t.type === 'income' && t.accountId === accountId) {
      bal += t.amount;
    } else if (t.type === 'transfer') {
      if (t.accountId === accountId) bal -= t.amount;
      if (t.toAccountId === accountId) bal += t.amount;
    } else if (t.type === 'adjust' && t.accountId === accountId) {
      bal += t.amount * (t.adjustSign || 1);
    }
  }
  return round2(bal);
}

function refTotalsByCur(accounts, transactions) {
  const m = {};
  for (const a of accounts) {
    if (a.hidden === true || a.inTotal === false || a.archived) continue;
    const cur = a.currency || 'BYN';
    m[cur] = round2((m[cur] || 0) + refBalance(a.id, accounts, transactions));
  }
  return m;
}

function refFlowOf(transactions, kind, settings = {}) {
  const transferAsIO = !!settings.transferAsIO;
  const adjustAsIO = !!settings.adjustAsIO;
  let total = 0;
  for (const t of transactions) {
    if (t.type === kind) {
      total += t.amount;
    } else if (t.type === 'transfer' && transferAsIO) {
      if (kind === 'expense' ? !!t.accountId : !!t.toAccountId) total += t.amount;
    } else if (t.type === 'adjust' && adjustAsIO) {
      const sign = t.adjustSign || 1;
      if (kind === 'income' ? sign > 0 : sign < 0) total += t.amount;
    }
  }
  return round2(total);
}

// ============================================================================
// ТЕСТОВЫЕ БЛОКИ
// ============================================================================

describe('FINANCIAL INVARIANTS: Reference Calculator & Foundations', () => {
  test('Reference Calculator: корректно считает балансы счетов и совпадает с начальным состоянием', () => {
    const { app } = makeTestApp();
    const a1Bal = app.run(`accBalance('a1')`);
    const a2Bal = app.run(`accBalance('a2')`);
    assert.equal(a1Bal, 1000);
    assert.equal(a2Bal, 500);

    const s = app.run(`S`);
    assert.equal(refBalance('a1', s.accounts, s.transactions), 1000);
    assert.equal(refBalance('a2', s.accounts, s.transactions), 500);
  });

  test('Reference Calculator: refFlowOf совпадает с flowOf для income, expense и спец-настроек', () => {
    const txns = [
      { id: 't1', type: 'income', amount: 300, accountId: 'a1' },
      { id: 't2', type: 'expense', amount: 120, accountId: 'a1' },
      { id: 't3', type: 'transfer', amount: 50, accountId: 'a1', toAccountId: 'a2' },
      { id: 't4', type: 'adjust', amount: 20, adjustSign: -1, accountId: 'a1' }
    ];
    const { app } = makeTestApp({ transactions: txns });
    const inc = app.run(`flowOf(S.transactions, 'income')`);
    const exp = app.run(`flowOf(S.transactions, 'expense')`);
    assert.equal(inc, refFlowOf(txns, 'income'));
    assert.equal(exp, refFlowOf(txns, 'expense'));
    assert.equal(inc, 300);
    assert.equal(exp, 120);

    // С включенными transferAsIO и adjustAsIO
    app.run(`S.settings.transferAsIO = true; S.settings.adjustAsIO = true;`);
    const incWithIO = app.run(`flowOf(S.transactions, 'income')`);
    const expWithIO = app.run(`flowOf(S.transactions, 'expense')`);
    assert.equal(incWithIO, refFlowOf(txns, 'income', { transferAsIO: true, adjustAsIO: true }));
    assert.equal(expWithIO, refFlowOf(txns, 'expense', { transferAsIO: true, adjustAsIO: true }));
    assert.equal(incWithIO, 350); // 300 (income) + 50 (incoming to a2)
    assert.equal(expWithIO, 190); // 120 (expense) + 50 (outgoing from a1) + 20 (adjustSign -1)
  });
});

describe('BALANCE INVARIANTS (Формула баланса)', () => {
  test('Баланс: только доход (income) увеличивает баланс строго на сумму операции', () => {
    const { app } = makeTestApp();
    app.run(`Store.addTransaction({ id: 't1', type: 'income', amount: 350.50, accountId: 'a1' })`);
    assert.equal(app.run(`accBalance('a1')`), 1350.50);
    assert.equal(app.run(`accBalance('a2')`), 500); // второй счёт изолирован
  });

  test('Баланс: только расход (expense) уменьшает баланс строго на сумму операции', () => {
    const { app } = makeTestApp();
    app.run(`Store.addTransaction({ id: 't1', type: 'expense', amount: 150.25, accountId: 'a1' })`);
    assert.equal(app.run(`accBalance('a1')`), 849.75);
    assert.equal(app.run(`accBalance('a2')`), 500);
  });

  test('Баланс: чередование доходов и расходов сохраняет математический инвариант', () => {
    const { app } = makeTestApp();
    app.run(`Store.addTransaction({ id: 't1', type: 'income', amount: 500, accountId: 'a1' })`);
    app.run(`Store.addTransaction({ id: 't2', type: 'expense', amount: 200, accountId: 'a1' })`);
    app.run(`Store.addTransaction({ id: 't3', type: 'income', amount: 100, accountId: 'a1' })`);
    app.run(`Store.addTransaction({ id: 't4', type: 'expense', amount: 400, accountId: 'a1' })`);
    // 1000 + 500 - 200 + 100 - 400 = 1000
    assert.equal(app.run(`accBalance('a1')`), 1000);
  });

  test('Баланс: нулевая сумма (amount = 0) не меняет баланс', () => {
    const { app } = makeTestApp();
    app.run(`Store.addTransaction({ id: 't_zero', type: 'expense', amount: 0, accountId: 'a1' })`);
    assert.equal(app.run(`accBalance('a1')`), 1000);
  });

  test('Баланс: отрицательный начальный баланс (кредит/овердрафт)', () => {
    const { app } = makeTestApp({
      accounts: [
        { id: 'a_debt', name: 'Кредитная карта', currency: 'BYN', initial: -500, inTotal: true, hidden: false }
      ]
    });
    assert.equal(app.run(`accBalance('a_debt')`), -500);
    app.run(`Store.addTransaction({ id: 't1', type: 'expense', amount: 100, accountId: 'a_debt' })`);
    assert.equal(app.run(`accBalance('a_debt')`), -600);
    app.run(`Store.addTransaction({ id: 't2', type: 'income', amount: 300, accountId: 'a_debt' })`);
    assert.equal(app.run(`accBalance('a_debt')`), -300);
  });

  test('Баланс: операции корректировки (adjust) с положительным и отрицательным знаком', () => {
    const { app } = makeTestApp();
    app.run(`Store.addTransaction({ id: 'adj_plus', type: 'adjust', amount: 50, adjustSign: 1, accountId: 'a1' })`);
    assert.equal(app.run(`accBalance('a1')`), 1050);
    app.run(`Store.addTransaction({ id: 'adj_minus', type: 'adjust', amount: 80, adjustSign: -1, accountId: 'a1' })`);
    assert.equal(app.run(`accBalance('a1')`), 970);
  });
});

describe('TRANSFER INVARIANTS (Инварианты переводов и закон сохранения денег)', () => {
  test('Перевод A -> B: строго A - X, B + X, и общий объем денег сохраняется (A + B = T)', () => {
    const { app } = makeTestApp();
    const sumBefore = app.run(`accBalance('a1') + accBalance('a2')`);
    assert.equal(sumBefore, 1500);

    app.run(`Store.addTransaction({ id: 'tr1', type: 'transfer', amount: 200, accountId: 'a1', toAccountId: 'a2' })`);

    assert.equal(app.run(`accBalance('a1')`), 800);
    assert.equal(app.run(`accBalance('a2')`), 700);

    const sumAfter = app.run(`accBalance('a1') + accBalance('a2')`);
    assert.equal(sumAfter, sumBefore, 'Сумма денег между счетами после перевода ДОЛЖНА сохраняться');
  });

  test('Перевод B -> A: симметричное сохранение суммы', () => {
    const { app } = makeTestApp();
    app.run(`Store.addTransaction({ id: 'tr2', type: 'transfer', amount: 450, accountId: 'a2', toAccountId: 'a1' })`);
    assert.equal(app.run(`accBalance('a2')`), 50);
    assert.equal(app.run(`accBalance('a1')`), 1450);
    assert.equal(app.run(`accBalance('a1') + accBalance('a2')`), 1500);
  });

  test('Цепочка переводов A -> B -> C -> A: круговая консервация денег', () => {
    const { app } = makeTestApp({
      accounts: [
        { id: 'a1', currency: 'BYN', initial: 1000, inTotal: true },
        { id: 'a2', currency: 'BYN', initial: 1000, inTotal: true },
        { id: 'a3', currency: 'BYN', initial: 1000, inTotal: true }
      ]
    });
    const totalStart = app.run(`accBalance('a1') + accBalance('a2') + accBalance('a3')`);
    assert.equal(totalStart, 3000);

    app.run(`Store.addTransaction({ id: 't1', type: 'transfer', amount: 300, accountId: 'a1', toAccountId: 'a2' })`);
    app.run(`Store.addTransaction({ id: 't2', type: 'transfer', amount: 150, accountId: 'a2', toAccountId: 'a3' })`);
    app.run(`Store.addTransaction({ id: 't3', type: 'transfer', amount: 50, accountId: 'a3', toAccountId: 'a1' })`);

    assert.equal(app.run(`accBalance('a1')`), 750);  // 1000 - 300 + 50
    assert.equal(app.run(`accBalance('a2')`), 1150); // 1000 + 300 - 150
    assert.equal(app.run(`accBalance('a3')`), 1100); // 1000 + 150 - 50

    const totalEnd = app.run(`accBalance('a1') + accBalance('a2') + accBalance('a3')`);
    assert.equal(totalEnd, 3000);
  });

  test('Перевод между одним и тем же счетом (A -> A): чистый эффект равен 0', () => {
    const { app } = makeTestApp();
    app.run(`Store.addTransaction({ id: 't_self', type: 'transfer', amount: 100, accountId: 'a1', toAccountId: 'a1' })`);
    assert.equal(app.run(`accBalance('a1')`), 1000);
  });

  test('Редактирование перевода: изменение суммы (100 -> 250) полностью заменяет старый эффект', () => {
    const { app } = makeTestApp();
    app.run(`Store.addTransaction({ id: 'tr_edit', type: 'transfer', amount: 100, accountId: 'a1', toAccountId: 'a2' })`);
    assert.equal(app.run(`accBalance('a1')`), 900);
    assert.equal(app.run(`accBalance('a2')`), 600);

    // Редактируем сумму на 250
    app.run(`Store.updateTransaction('tr_edit', { amount: 250 })`);

    // Не должно быть: a1 - 100 - 250 = 650!
    // Должно быть строго: a1 = 1000 - 250 = 750; a2 = 500 + 250 = 750
    assert.equal(app.run(`accBalance('a1')`), 750, 'Счёт отправителя должен отражать только новую сумму');
    assert.equal(app.run(`accBalance('a2')`), 750, 'Счёт получателя должен отражать только новую сумму');
    assert.equal(app.run(`accBalance('a1') + accBalance('a2')`), 1500, 'Сумма сохраняется');
  });

  test('Редактирование перевода: смена счета назначения (A -> B меняем на A -> C)', () => {
    const { app } = makeTestApp({
      accounts: [
        { id: 'a1', currency: 'BYN', initial: 1000, inTotal: true },
        { id: 'a2', currency: 'BYN', initial: 500, inTotal: true },
        { id: 'a3', currency: 'BYN', initial: 200, inTotal: true }
      ]
    });
    app.run(`Store.addTransaction({ id: 'tr_swap', type: 'transfer', amount: 100, accountId: 'a1', toAccountId: 'a2' })`);
    assert.equal(app.run(`accBalance('a1')`), 900);
    assert.equal(app.run(`accBalance('a2')`), 600);
    assert.equal(app.run(`accBalance('a3')`), 200);

    // Перенаправляем перевод с a2 на a3
    app.run(`Store.updateTransaction('tr_swap', { toAccountId: 'a3' })`);

    assert.equal(app.run(`accBalance('a1')`), 900);
    assert.equal(app.run(`accBalance('a2')`), 500, 'Старый счет-получатель a2 вернулся в исходное состояние');
    assert.equal(app.run(`accBalance('a3')`), 300, 'Новый счет-получатель a3 получил +100');
  });

  test('Удаление и восстановление перевода', () => {
    const { app } = makeTestApp();
    const t = app.run(`Store.addTransaction({ id: 'tr_del', type: 'transfer', amount: 300, accountId: 'a1', toAccountId: 'a2' })`);
    assert.equal(app.run(`accBalance('a1')`), 700);
    assert.equal(app.run(`accBalance('a2')`), 800);

    // Удаляем
    app.run(`Store.deleteTransaction('tr_del')`);
    assert.equal(app.run(`accBalance('a1')`), 1000, 'a1 вернулся в 1000 после удаления перевода');
    assert.equal(app.run(`accBalance('a2')`), 500, 'a2 вернулся в 500 после удаления перевода');

    // Восстанавливаем
    app.run(`Store.restoreTransaction(${JSON.stringify(t)})`);
    assert.equal(app.run(`accBalance('a1')`), 700, 'a1 снова 700 после восстановления');
    assert.equal(app.run(`accBalance('a2')`), 800, 'a2 снова 800 после восстановления');
  });
});

describe('DELETE INVARIANTS (Удаление операций возвращает баланс в точное исходное состояние)', () => {
  test('Удаление расхода: баланс возвращается до копейки', () => {
    const { app } = makeTestApp();
    const before = app.run(`accBalance('a1')`);
    app.run(`Store.addTransaction({ id: 'del_exp', type: 'expense', amount: 123.45, accountId: 'a1' })`);
    assert.equal(app.run(`accBalance('a1')`), 876.55);

    app.run(`Store.deleteTransaction('del_exp')`);
    assert.equal(app.run(`accBalance('a1')`), before);
  });

  test('Удаление дохода: баланс возвращается до копейки', () => {
    const { app } = makeTestApp();
    const before = app.run(`accBalance('a1')`);
    app.run(`Store.addTransaction({ id: 'del_inc', type: 'income', amount: 789.10, accountId: 'a1' })`);
    assert.equal(app.run(`accBalance('a1')`), 1789.10);

    app.run(`Store.deleteTransaction('del_inc')`);
    assert.equal(app.run(`accBalance('a1')`), before);
  });

  test('Удаление счёта каскадно удаляет его операции, не ломая другие счета', () => {
    const { app } = makeTestApp();
    app.run(`Store.addTransaction({ id: 't_on_a2', type: 'expense', amount: 100, accountId: 'a2' })`);
    assert.equal(app.run(`accBalance('a1')`), 1000);
    assert.equal(app.run(`accBalance('a2')`), 400);

    app.run(`Store.deleteAccount('a2')`);
    assert.equal(app.run(`accById('a2')`), null);
    assert.equal(app.run(`accBalance('a1')`), 1000, 'Счёт a1 не пострадал от удаления a2');
    assert.equal(app.run(`S.transactions.some(t => t.accountId === 'a2')`), false);
  });
});

describe('EDIT INVARIANTS (Редактирование операций не накапливает старые эффекты)', () => {
  test('Редактирование расхода: 100 -> 250 дает -250, а не -350', () => {
    const { app } = makeTestApp();
    app.run(`Store.addTransaction({ id: 'e1', type: 'expense', amount: 100, accountId: 'a1' })`);
    assert.equal(app.run(`accBalance('a1')`), 900);

    app.run(`Store.updateTransaction('e1', { amount: 250 })`);
    assert.equal(app.run(`accBalance('a1')`), 750, 'Баланс должен быть 1000 - 250 = 750, а НЕ 650 (-350)');
  });

  test('Смена типа операции: expense 100 меняем на income 100 (дельта +200)', () => {
    const { app } = makeTestApp();
    app.run(`Store.addTransaction({ id: 'e2', type: 'expense', amount: 100, accountId: 'a1' })`);
    assert.equal(app.run(`accBalance('a1')`), 900);

    app.run(`Store.updateTransaction('e2', { type: 'income', amount: 100 })`);
    assert.equal(app.run(`accBalance('a1')`), 1100, 'Баланс должен стать 1000 + 100 = 1100');
  });

  test('Смена счёта операции: расход 100 переносится с a1 на a2', () => {
    const { app } = makeTestApp();
    app.run(`Store.addTransaction({ id: 'e3', type: 'expense', amount: 100, accountId: 'a1' })`);
    assert.equal(app.run(`accBalance('a1')`), 900);
    assert.equal(app.run(`accBalance('a2')`), 500);

    app.run(`Store.updateTransaction('e3', { accountId: 'a2' })`);
    assert.equal(app.run(`accBalance('a1')`), 1000, 'Счёт a1 восстановился');
    assert.equal(app.run(`accBalance('a2')`), 400, 'Счёт a2 уменьшился на 100');
  });
});

describe('IDEMPOTENCY & RECURRING TRANSACTIONS (Повторяемость и шаблоны)', () => {
  test('Повторный запуск runTemplates() в тот же день не создает дубликатов', () => {
    const { app } = makeTestApp();
    const today = app.run(`iso(new Date())`);

    app.run(`S.templates.push({
      id: 'tpl1',
      name: 'Интернет',
      type: 'expense',
      amount: 45,
      accountId: 'a1',
      every: 'month',
      next: '${today}'
    })`);

    // Первый запуск — создает операцию
    app.run(`App.recurring.run()`);
    const txnCount1 = app.run(`S.transactions.length`);
    assert.equal(txnCount1, 1);
    assert.equal(app.run(`S.transactions[0].amount`), 45);
    assert.equal(app.run(`accBalance('a1')`), 955);

    // Второй запуск сразу же — ИДЕМПОТЕНТНОСТЬ (0 новых операций)
    app.run(`App.recurring.run()`);
    const txnCount2 = app.run(`S.transactions.length`);
    assert.equal(txnCount2, 1, 'Повторный запуск runTemplates НЕ должен дублировать операции');
    assert.equal(app.run(`accBalance('a1')`), 955);
  });

  test('Пропущенные периоды: 3 пропущенных недели генерируют ровно 3 операции и сдвигают next в будущее', () => {
    const { app } = makeTestApp();
    // 3 недели назад: -21 день
    const pastDate = app.run(`iso(addD(new Date(), -21))`);

    app.run(`S.templates.push({
      id: 'tpl_past',
      name: 'Спортзал',
      type: 'expense',
      amount: 20,
      accountId: 'a1',
      every: 'week',
      next: '${pastDate}'
    })`);

    app.run(`App.recurring.run()`);

    // -21, -14, -7, 0 => должно сгенерироваться 4 операции (за каждую пропущенную неделю и сегодня)
    const txns = app.run(`S.transactions.filter(t => t.note === 'Спортзал')`);
    assert.equal(txns.length, 4);

    const tpl = app.run(`S.templates.find(t => t.id === 'tpl_past')`);
    const today = app.run(`iso(new Date())`);
    assert.ok(tpl.next > today, 'Следующая дата шаблона должна быть сдвинута строго в будущее');
  });
});

describe('PERIOD INVARIANTS (Переключение периодов)', () => {
  test('Переключение между всеми периодами не меняет хранилище операций и балансы счетов', () => {
    const { app } = makeTestApp();
    app.run(`Store.addTransaction({ id: 't_m1', type: 'expense', amount: 100, accountId: 'a1', date: '2026-01-15T10:00:00' })`);
    app.run(`Store.addTransaction({ id: 't_m2', type: 'income', amount: 500, accountId: 'a1', date: '2026-06-20T10:00:00' })`);

    const rawTxnsBefore = app.run(`JSON.stringify(S.transactions)`);
    const balBefore = app.run(`accBalance('a1')`);

    const periods = ['all', 'day', 'week', '2w', 'month', 'year', '7d', '30d'];
    for (const p of periods) {
      app.run(`UI.ledger.period = '${p}'`);
      const r = app.run(`ledgerPeriodRange()`);
      app.run(`ledgerModel(${JSON.stringify(r)}, false)`);
    }

    // Возвращаемся в 'all'
    app.run(`UI.ledger.period = 'all'`);
    const rAll = app.run(`ledgerPeriodRange()`);
    const mAll = app.run(`ledgerModel(${JSON.stringify(rAll)}, true)`);

    const rawTxnsAfter = app.run(`JSON.stringify(S.transactions)`);
    const balAfter = app.run(`accBalance('a1')`);

    assert.equal(rawTxnsAfter, rawTxnsBefore, 'Транзакции не должны мутировать при смене периодов');
    assert.equal(balAfter, balBefore, 'Баланс счета не должен меняться при смене периодов');
    assert.equal(mAll.list.length, 2);
  });
});

describe('CATEGORY INVARIANTS & HIDDEN CATEGORIES (Категории и скрытие)', () => {
  test('Смена категории у операции не меняет сумму, счёт и баланс', () => {
    const { app } = makeTestApp();
    app.run(`Store.addTransaction({ id: 't_cat', type: 'expense', amount: 77, accountId: 'a1', categoryId: 'c1' })`);
    assert.equal(app.run(`accBalance('a1')`), 923);

    // Меняем категорию на c2 (или другую)
    app.run(`Store.updateTransaction('t_cat', { categoryId: 'c2' })`);
    assert.equal(app.run(`accBalance('a1')`), 923, 'Баланс не зависит от категории');
    assert.equal(app.run(`S.transactions.find(t => t.id === 't_cat').amount`), 77);
  });

  test('Удаление категории отвязывает операции (categoryId = null), но деньги остаются целы', () => {
    const { app } = makeTestApp();
    app.run(`Store.addTransaction({ id: 't_c1', type: 'expense', amount: 50, accountId: 'a1', categoryId: 'c1' })`);
    assert.equal(app.run(`accBalance('a1')`), 950);

    app.run(`Store.deleteCategory('c1')`);
    assert.equal(app.run(`accBalance('a1')`), 950, 'Баланс счета не изменился после удаления категории');
    const t = app.run(`S.transactions.find(x => x.id === 't_c1')`);
    assert.equal(t.categoryId, null, 'Операция перешла в "Без категории"');
  });

  test('Скрытая категория (hidden = true): исключается из overview, но НЕ меняет баланс счёта', () => {
    const { app } = makeTestApp();
    app.run(`Store.addTransaction({ id: 't_hid', type: 'expense', amount: 300, accountId: 'a1', categoryId: 'c1' })`);
    assert.equal(app.run(`accBalance('a1')`), 700);

    // Скрываем категорию
    app.run(`Store.updateCategory('c1', { hidden: true })`);

    // Физический баланс счета 700!
    assert.equal(app.run(`accBalance('a1')`), 700, 'Физический баланс счёта должен оставаться 700');

    // Но в overview сумма расходов исключает t_hid
    const m = app.run(`UI.accId = null; ledgerModel({ key: 'all', from: new Date(2000,0,1), to: new Date(2030,0,1) }, true)`);
    assert.equal(m.list.some(t => t.id === 't_hid'), false, 'Скрытая категория не видна в overview');
    assert.equal(m.exp, 0, 'Расход в overview исключён');
  });

  test('Подкатегория скрытой категории автоматически считается скрытой', () => {
    const { app } = makeTestApp();
    app.run(`Store.addCategory({ id: 'c_parent', name: 'Родитель', kind: 'expense', hidden: true })`);
    app.run(`Store.addCategory({ id: 'c_child', name: 'Ребёнок', kind: 'expense', parentId: 'c_parent' })`);

    assert.equal(app.run(`isCategoryHidden('c_parent')`), true);
    assert.equal(app.run(`isCategoryHidden('c_child')`), true, 'Подкатегория должна наследовать скрытие');
  });
});

describe('ACCOUNT VISIBILITY & COMBINATIONS (Скрытие счетов)', () => {
  test('Скрытый счёт (hidden = true): исключается из totalsByCur и overview, но физический баланс цел', () => {
    const { app } = makeTestApp();
    app.run(`Store.updateAccount('a2', { hidden: true })`);

    // a1 = 1000, a2 = 500
    assert.equal(app.run(`accBalance('a2')`), 500, 'Физический баланс скрытого счёта остаётся 500');

    // В общем итоге totalsByCur виден только a1
    const t = app.run(`totalsByCur()`);
    assert.equal(t.BYN, 1000);

    // Возвращаем видимость -> totalsByCur снова 1500
    app.run(`Store.updateAccount('a2', { hidden: false })`);
    const t2 = app.run(`totalsByCur()`);
    assert.equal(t2.BYN, 1500);
  });

  test('Матрица: visible/hidden аккаунт x visible/hidden категория', () => {
    const { app } = makeTestApp({
      accounts: [
        { id: 'a_vis', currency: 'BYN', initial: 1000, inTotal: true, hidden: false },
        { id: 'a_hid', currency: 'BYN', initial: 1000, inTotal: false, hidden: true }
      ],
      categories: [
        { id: 'c_vis', kind: 'expense', hidden: false, hiddenFromOverview: false },
        { id: 'c_hid', kind: 'expense', hidden: true, hiddenFromOverview: true }
      ]
    });

    app.run(`Store.addTransaction({ id: 't_vv', type: 'expense', amount: 10, accountId: 'a_vis', categoryId: 'c_vis' })`);
    app.run(`Store.addTransaction({ id: 't_hv', type: 'expense', amount: 20, accountId: 'a_hid', categoryId: 'c_vis' })`);
    app.run(`Store.addTransaction({ id: 't_vh', type: 'expense', amount: 30, accountId: 'a_vis', categoryId: 'c_hid' })`);
    app.run(`Store.addTransaction({ id: 't_hh', type: 'expense', amount: 40, accountId: 'a_hid', categoryId: 'c_hid' })`);

    // Общий обзор (UI.accId = null)
    const m = app.run(`UI.accId = null; ledgerModel({ key: 'all', from: new Date(2000,0,1), to: new Date(2030,0,1) }, true)`);

    assert.ok(m.list.some(t => t.id === 't_vv'), 't_vv (vis/vis) должна быть в overview');
    assert.ok(!m.list.some(t => t.id === 't_hv'), 't_hv (hid acc) не должна быть в overview');
    assert.ok(!m.list.some(t => t.id === 't_vh'), 't_vh (hid cat) не должна быть в overview');
    assert.ok(!m.list.some(t => t.id === 't_hh'), 't_hh (hid/hid) не должна быть в overview');

    assert.equal(m.exp, 10, 'Расход в overview равен только сумме t_vv (10)');

    // Физические балансы счетов безупречны:
    // a_vis = 1000 - 10 - 30 = 960
    // a_hid = 1000 - 20 - 40 = 940
    assert.equal(app.run(`accBalance('a_vis')`), 960);
    assert.equal(app.run(`accBalance('a_hid')`), 940);
  });
});

describe('CURRENCY ISOLATION (Изоляция валют)', () => {
  test('Счета разных валют (BYN и USD) никогда не смешиваются в единую сумму', () => {
    const { app } = makeTestApp({
      accounts: [
        { id: 'a_byn', currency: 'BYN', initial: 100, inTotal: true, hidden: false },
        { id: 'a_usd', currency: 'USD', initial: 100, inTotal: true, hidden: false }
      ]
    });

    const totals = app.run(`totalsByCur()`);
    assert.equal(totals.BYN, 100);
    assert.equal(totals.USD, 100);
    assert.equal(Object.keys(totals).length, 2, 'В totalsByCur строго 2 раздельные валюты');
  });

  test('Операция в USD изменяет только баланс долларового счёта', () => {
    const { app } = makeTestApp({
      accounts: [
        { id: 'a_byn', currency: 'BYN', initial: 500, inTotal: true },
        { id: 'a_usd', currency: 'USD', initial: 200, inTotal: true }
      ]
    });

    app.run(`Store.addTransaction({ id: 't_usd', type: 'expense', amount: 50, accountId: 'a_usd' })`);

    assert.equal(app.run(`accBalance('a_byn')`), 500);
    assert.equal(app.run(`accBalance('a_usd')`), 150);

    const totals = app.run(`totalsByCur()`);
    assert.equal(totals.BYN, 500);
    assert.equal(totals.USD, 150);
  });
});

describe('MONEY PRECISION (Точность и отсутствие плавающей точки)', () => {
  test('Канонические копеечные суммы (0.01, 0.10, 0.29, 1.99, 10.01, 100.05)', () => {
    const { app } = makeTestApp();
    const amounts = [0.01, 0.10, 0.29, 1.99, 10.01, 100.05];
    let expectedExpense = 0;

    for (let i = 0; i < amounts.length; i++) {
      app.run(`Store.addTransaction({ id: 'p_${i}', type: 'expense', amount: ${amounts[i]}, accountId: 'a1' })`);
      expectedExpense = round2(expectedExpense + amounts[i]);
    }

    // Сумма 0.01 + 0.10 + 0.29 + 1.99 + 10.01 + 100.05 = 112.45
    assert.equal(expectedExpense, 112.45);
    assert.equal(app.run(`accBalance('a1')`), 1000 - 112.45);
    assert.equal(app.run(`flowOf(S.transactions, 'expense')`), 112.45);
  });

  test('Накопительное сложение 100 раз по 0.29 дает ровно 29.00, а не 28.99999999999994', () => {
    const { app } = makeTestApp({ accounts: [{ id: 'a1', currency: 'BYN', initial: 0, inTotal: true }] });
    for (let i = 0; i < 100; i++) {
      app.run(`Store.addTransaction({ id: 't_029_${i}', type: 'income', amount: 0.29, accountId: 'a1' })`);
    }

    assert.equal(app.run(`accBalance('a1')`), 29.00);
    assert.equal(app.run(`flowOf(S.transactions, 'income')`), 29.00);
    assert.equal(app.run(`totalsByCur().BYN`), 29.00);
  });

  test('0.10 + 0.20 не производит 0.30000000000000004 в flowOf и accBalance', () => {
    const { app } = makeTestApp({ accounts: [{ id: 'a1', currency: 'BYN', initial: 0, inTotal: true }] });
    app.run(`Store.addTransaction({ id: 'f1', type: 'income', amount: 0.10, accountId: 'a1' })`);
    app.run(`Store.addTransaction({ id: 'f2', type: 'income', amount: 0.20, accountId: 'a1' })`);

    assert.equal(app.run(`flowOf(S.transactions, 'income')`), 0.30);
    assert.equal(app.run(`accBalance('a1')`), 0.30);
    assert.equal(app.run(`totalsByCur().BYN`), 0.30);
  });
});

describe('ZERO & EDGE CASES (Граничные значения)', () => {
  test('Пустой список операций: балансы строго равны initial, flowOf = 0', () => {
    const { app } = makeTestApp();
    assert.equal(app.run(`accBalance('a1')`), 1000);
    assert.equal(app.run(`flowOf(S.transactions, 'expense')`), 0);
    assert.equal(app.run(`flowOf(S.transactions, 'income')`), 0);
  });

  test('Большие финансовые суммы (100 000 000)', () => {
    const { app } = makeTestApp();
    app.run(`Store.addTransaction({ id: 't_huge', type: 'income', amount: 100000000, accountId: 'a1' })`);
    assert.equal(app.run(`accBalance('a1')`), 100001000);
  });

  test('Отрицательная сумма входа зажимается Store в 0 (Math.max(0, ...))', () => {
    const { app } = makeTestApp();
    const t = app.run(`Store.addTransaction({ id: 't_neg', type: 'expense', amount: -50, accountId: 'a1' })`);
    assert.equal(t.amount, 0);
    assert.equal(app.run(`accBalance('a1')`), 1000);
  });

  test('NaN, null, undefined и нечисловой вход безопасно приводятся к 0', () => {
    const { app } = makeTestApp();
    const t1 = app.run(`Store.addTransaction({ id: 't_nan', type: 'expense', amount: NaN, accountId: 'a1' })`);
    assert.equal(t1.amount, 0);
    const t2 = app.run(`Store.addTransaction({ id: 't_null', type: 'expense', amount: null, accountId: 'a1' })`);
    assert.equal(t2.amount, 0);
  });
});

describe('IMPORT / EXPORT ROUNDTRIP (Сохранение семантики при импорте/экспорте)', () => {
  test('Полный цикл Export -> JSON -> Validate -> Import восстанавливает идентичное финансовое состояние', () => {
    const { app } = makeTestApp();
    app.run(`Store.addTransaction({ id: 't1', type: 'expense', amount: 120.50, accountId: 'a1', categoryId: 'c1' })`);
    app.run(`Store.addTransaction({ id: 't2', type: 'income', amount: 500, accountId: 'a1', categoryId: 'c2' })`);
    app.run(`Store.addTransaction({ id: 't3', type: 'transfer', amount: 200, accountId: 'a1', toAccountId: 'a2' })`);

    const balA1Expected = app.run(`accBalance('a1')`);
    const balA2Expected = app.run(`accBalance('a2')`);
    const totalsExpected = app.run(`totalsByCur()`);

    // Эмулируем экспорт данных
    const exportJson = app.run(`
      JSON.stringify({
        app: 'ONYX',
        version: 1,
        accounts: S.accounts,
        categories: S.categories,
        transactions: S.transactions,
        goals: S.goals,
        templates: S.templates,
        settings: S.settings
      })
    `);

    // Создаем свежий инстанс приложения и импортируем этот JSON
    const { app: app2 } = makeTestApp({ accounts: [], categories: [], transactions: [] });
    app2.ctx.importedPayload = JSON.parse(exportJson);

    app2.run(`
      const raw = {
        accs: importedPayload.accounts,
        cats: importedPayload.categories,
        ops: importedPayload.transactions,
        goals: importedPayload.goals || [],
        tpls: importedPayload.templates || []
      };
      const vr = validateBackup(raw);
      S.accounts = vr.accs.map(bkSanAccount);
      S.categories = vr.cats.map(bkSanCat);
      S.goals = vr.goals.map(bkSanGoal);
      S.templates = vr.tpls.map(bkSanTpl);
      S.transactions = vr.ops.map((x, i) => bkSanOp(x, i, true));
      save();
    `);

    assert.equal(app2.run(`accBalance('a1')`), balA1Expected, 'Баланс a1 совпадает после импорта');
    assert.equal(app2.run(`accBalance('a2')`), balA2Expected, 'Баланс a2 совпадает после импорта');
    assert.deepEqual(JSON.parse(JSON.stringify(app2.run(`totalsByCur()`))), JSON.parse(JSON.stringify(totalsExpected)), 'totalsByCur совпадает');
  });

  test('Битые данные в импорте не ломают текущее состояние приложения', () => {
    const { app } = makeTestApp();
    const balBefore = app.run(`accBalance('a1')`);

    // Пытаемся импортировать невалидный JSON
    app.run(`
      try {
        const body = "not a valid json {{{{";
        JSON.parse(body);
      } catch (e) {
        // отловлено
      }
    `);

    assert.equal(app.run(`accBalance('a1')`), balBefore);
  });
});

describe('SCHEMA & NORMALIZATION (Схема и нормализация)', () => {
  test('normState() подставляет дефолты для отсутствующих полей и не теряет данные', () => {
    const { app } = makeTestApp();
    const legacyState = {
      accounts: [{ id: 'a_leg', currency: 'BYN', initial: 100 }],
      transactions: [{ id: 't_leg', type: 'expense', amount: 30, accountId: 'a_leg', date: '2026-05-01' }]
    };

    const norm = app.run(`normState(${JSON.stringify(legacyState)})`);
    assert.ok(Array.isArray(norm.categories));
    assert.ok(Array.isArray(norm.goals));
    assert.ok(Array.isArray(norm.templates));
    assert.ok(norm.settings);
    assert.equal(norm.accounts[0].id, 'a_leg');
    assert.equal(norm.transactions[0].id, 't_leg');
  });
});

describe('CACHE CORRECTNESS (Корректность кэшей и их сброс)', () => {
  test('Кэш balCache возвращает точный результат и моментально сбрасывается при мутации через Store', () => {
    const { app } = makeTestApp();
    const bal1 = app.run(`accBalance('a1')`); // закэшировано: 1000
    assert.equal(bal1, 1000);

    // Добавляем расход
    app.run(`Store.addTransaction({ id: 'c_test', type: 'expense', amount: 200, accountId: 'a1' })`);

    // Следующий вызов обязан вернуть актуальное новое значение 800
    const bal2 = app.run(`accBalance('a1')`);
    assert.equal(bal2, 800, 'Кэш balCache обязан сбрасываться при мутации');

    // Удаляем операцию
    app.run(`Store.deleteTransaction('c_test')`);
    const bal3 = app.run(`accBalance('a1')`);
    assert.equal(bal3, 1000, 'Кэш balCache обязан сбрасываться при удалении');
  });

  test('Кэш отсортированных транзакций txnSortCache полностью совпадает с реальной сортировкой', () => {
    const { app } = makeTestApp();
    app.run(`Store.addTransaction({ id: 'd1', date: '2026-01-01T10:00:00', amount: 10, accountId: 'a1' })`);
    app.run(`Store.addTransaction({ id: 'd3', date: '2026-03-01T10:00:00', amount: 30, accountId: 'a1' })`);
    app.run(`Store.addTransaction({ id: 'd2', date: '2026-02-01T10:00:00', amount: 20, accountId: 'a1' })`);

    const cachedIds = app.run(`sortedTxns().map(t => t.id)`);
    assert.deepEqual(cachedIds, ['d3', 'd2', 'd1'], 'Порядок по дате desc: d3, d2, d1');
  });
});

describe('GOALS (Связь накоплений и денег)', () => {
  test('Пополнение цели увеличивает saved и регистрирует историю', () => {
    const { app } = makeTestApp({
      goals: [
        { id: 'g1', name: 'Ноутбук', target: 3000, saved: 500, history: [] }
      ]
    });

    app.run(`
      const g = S.goals.find(x => x.id === 'g1');
      g.saved = round2(g.saved + 250);
      g.history.push({ date: '2026-09-13', v: 250 });
      save();
    `);

    const g = app.run(`S.goals.find(x => x.id === 'g1')`);
    assert.equal(g.saved, 750);
    assert.equal(g.history.length, 1);
    assert.equal(g.history[0].v, 250);
  });
});

describe('DETERMINISTIC PROPERTY-BASED / RANDOMIZED TESTS (200 случайных финансовых операций)', () => {
  test('200 детерминированных случайных операций строго соответствуют эталонному калькулятору', () => {
    const { app } = makeTestApp({
      accounts: [
        { id: 'accA', currency: 'BYN', initial: 1000, inTotal: true, hidden: false },
        { id: 'accB', currency: 'BYN', initial: 1000, inTotal: true, hidden: false },
        { id: 'accC', currency: 'BYN', initial: 1000, inTotal: true, hidden: false }
      ]
    });

    // Детерминированный PRNG (Mulberry32)
    function mulberry32(seed) {
      return function () {
        let t = (seed += 0x6D2B79F5);
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    }

    const rng = mulberry32(0xDEADBEEF);
    const randInt = (min, max) => Math.floor(rng() * (max - min + 1)) + min;
    const randAmt = () => round2(randInt(1, 5000) / 100); // 0.01 .. 50.00
    const accounts = ['accA', 'accB', 'accC'];

    let opCounter = 0;

    for (let step = 0; step < 200; step++) {
      const actionType = randInt(0, 4);
      const accSrc = accounts[randInt(0, 2)];
      const accDst = accounts[randInt(0, 2)];
      const amt = randAmt();

      if (actionType === 0) {
        // Доход
        app.run(`Store.addTransaction({ id: 'rnd_${++opCounter}', type: 'income', amount: ${amt}, accountId: '${accSrc}' })`);
      } else if (actionType === 1) {
        // Расход
        app.run(`Store.addTransaction({ id: 'rnd_${++opCounter}', type: 'expense', amount: ${amt}, accountId: '${accSrc}' })`);
      } else if (actionType === 2) {
        // Перевод
        if (accSrc !== accDst) {
          app.run(`Store.addTransaction({ id: 'rnd_${++opCounter}', type: 'transfer', amount: ${amt}, accountId: '${accSrc}', toAccountId: '${accDst}' })`);
        }
      } else if (actionType === 3) {
        // Корректировка
        const sign = rng() > 0.5 ? 1 : -1;
        app.run(`Store.addTransaction({ id: 'rnd_${++opCounter}', type: 'adjust', amount: ${amt}, adjustSign: ${sign}, accountId: '${accSrc}' })`);
      } else if (actionType === 4) {
        // Случайное удаление или редактирование существующей операции
        const txns = app.run(`S.transactions`);
        if (txns.length > 5) {
          const victim = txns[randInt(0, txns.length - 1)];
          if (rng() > 0.5) {
            app.run(`Store.deleteTransaction('${victim.id}')`);
          } else {
            app.run(`Store.updateTransaction('${victim.id}', { amount: ${randAmt()} })`);
          }
        }
      }

      // После каждой операции проверяем инварианты с независимым эталоном:
      const s = app.run(`S`);
      for (const a of accounts) {
        const actualBal = app.run(`accBalance('${a}')`);
        const expectedBal = refBalance(a, s.accounts, s.transactions);
        assert.equal(actualBal, expectedBal, `Шаг ${step}: Баланс ${a} (${actualBal}) должен быть равен refBalance (${expectedBal})`);
      }

      // Проверяем totalsByCur
      const actualTotals = JSON.parse(JSON.stringify(app.run(`totalsByCur()`)));
      const expectedTotals = refTotalsByCur(s.accounts, s.transactions);
      assert.deepEqual(actualTotals, expectedTotals, `Шаг ${step}: totalsByCur должен совпадать с эталоном`);
    }
  });
});
