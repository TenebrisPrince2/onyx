// Юнит-тесты domain-слоя: currency (форматирование денег) и periods (календарь)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from './helpers/sandbox.mjs';

const state = () => ({ settings: { currency: 'BYN', roundTotals: false, firstDay: 1 } });
const load = app => app.load('utils.js', 'domain/currency.js', 'domain/periods.js');

test('currency: money форматирует по ru-RU (nbsp-группы, десятичная точка)', () => {
  const app = createApp(state());
  load(app);
  assert.equal(app.run(`money(1234.5, 'RUB')`), '1\u00A0234.50\u00A0₽');
  assert.equal(app.run(`money(1234.5, 'RUB', { exact: true })`), '1\u00A0234.50\u00A0₽');
});

test('currency: roundTotals отбрасывает копейки', () => {
  const app = createApp({ settings: { currency: 'BYN', roundTotals: true, firstDay: 1 } });
  load(app);
  assert.equal(app.run(`money(1234.5, 'RUB')`), '1\u00A0235\u00A0₽');
});

test('currency: USD — префиксная валюта; нечисловой вход → 0', () => {
  const app = createApp(state());
  load(app);
  assert.equal(app.run(`money(9.5, 'USD')`), '$\u00A09.50');
  assert.equal(app.run(`money(NaN, 'RUB')`), '0\u00A0₽');
});

test('periods: addM зажимает день на коротком месяце (31 янв → 1 фев)', () => {
  const app = createApp(state());
  load(app);
  assert.equal(app.run(`iso(addM(new Date(2026, 0, 31), 1))`), '2026-02-01');
});

test('periods: addD через границу месяца', () => {
  const app = createApp(state());
  load(app);
  assert.equal(app.run(`iso(addD(new Date(2026, 0, 31), 1))`), '2026-02-01');
});

test('periods: dkey обрезает дату-время, dayLabel знает Сегодня', () => {
  const app = createApp(state());
  load(app);
  assert.equal(app.run(`dkey({ date: '2026-03-05T10:00' })`), '2026-03-05');
  assert.equal(app.run(`dayLabel(iso(new Date()))`), 'Сегодня');
});

test('entities: accById и catById находят элементы через Map и возвращают null при отсутствии', () => {
  const s = {
    accounts: [{ id: 'a1', name: 'Наличные', currency: 'RUB' }],
    categories: [{ id: 'c1', name: 'Еда', kind: 'expense' }],
    settings: { currency: 'RUB' }
  };
  const app = createApp(s);
  app.load('utils.js', 'domain/factories.js', 'domain/entities.js');
  assert.equal(app.run(`accById('a1').name`), 'Наличные');
  assert.equal(app.run(`accById('unknown')`), null);
  assert.equal(app.run(`catById('c1').name`), 'Еда');
  assert.equal(app.run(`catById('unknown')`), null);
});

test('calculations: flowOf и сортировка txnSortCache корректно считают суммы и порядок дат', () => {
  const s = {
    accounts: [{ id: 'a1', currency: 'RUB', initial: 100 }],
    categories: [{ id: 'c1', name: 'Еда' }],
    transactions: [
      { id: 't1', type: 'expense', amount: 30, accountId: 'a1', date: '2026-01-01T10:00' },
      { id: 't2', type: 'income', amount: 50, accountId: 'a1', date: '2026-01-02T10:00' },
      { id: 't3', type: 'expense', amount: 20, accountId: 'a1', date: '2026-01-03T10:00' }
    ],
    settings: { currency: 'RUB', transferAsIO: false, adjustAsIO: false }
  };
  const app = createApp(s);
  app.load('utils.js', 'domain/cache.js', 'domain/periods.js', 'domain/factories.js', 'domain/entities.js', 'domain/calculations.js');
  assert.equal(app.run(`flowOf(S.transactions, 'expense')`), 50);
  assert.equal(app.run(`flowOf(S.transactions, 'income')`), 50);
  const sortedIds = app.run(`sortedTxns().map(t => t.id)`);
  assert.deepEqual(sortedIds, ['t3', 't2', 't1']);
});

test('icons: svgIcon генерирует валидный SVG инлайн без обращения к DOM', () => {
  const app = createApp(state());
  app.load('utils.js');
  const svg = app.run(`svgIcon('wallet', 'ic ic-s acc-ic', 16)`);
  assert.match(svg, /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
  assert.match(svg, /class="ic ic-s acc-ic"/);
  assert.match(svg, /width="16"/);
  assert.match(svg, /<path d="/);
});

test('store: addTransaction и restoreTransaction сохраняют порядок сортировки', () => {
  const s = {
    accounts: [{ id: 'a1', currency: 'RUB', initial: 100 }],
    categories: [],
    transactions: [
      { id: 't1', type: 'expense', amount: 30, accountId: 'a1', date: '2026-01-01T10:00' }
    ],
    goals: [],
    templates: [],
    settings: { currency: 'RUB' }
  };
  const app = createApp(s);
  app.load('utils.js', 'domain/cache.js', 'domain/periods.js', 'domain/factories.js', 'domain/entities.js', 'domain/calculations.js', 'storage/keys.js', 'storage/safe.js', 'storage/schema.js', 'storage/state.js', 'storage/store.js', 'storage/mutations.js');
  app.run(`Store.addTransaction({ id: 't2', type: 'income', amount: 50, accountId: 'a1', date: '2026-01-05T10:00' })`);
  assert.equal(app.run(`S.transactions[0].id`), 't2');
  app.run(`Store.deleteTransaction('t2')`);
  assert.equal(app.run(`S.transactions.length`), 1);
  app.run(`Store.restoreTransaction({ id: 't2', type: 'income', amount: 50, accountId: 'a1', date: '2026-01-05T10:00' }, 0)`);
  assert.equal(app.run(`S.transactions[0].id`), 't2');
});

test('security: hashPin и verifyPin корректно хешируют и мигрируют legacy PIN', async () => {
  const s = { settings: { pin: '1234' } };
  const app = createApp(s);
  app.load('utils.js', 'domain/cache.js', 'domain/periods.js', 'domain/factories.js', 'domain/entities.js', 'domain/calculations.js', 'storage/keys.js', 'storage/safe.js', 'storage/schema.js', 'storage/state.js', 'storage/store.js', 'storage/mutations.js');
  const h1 = await app.run(`hashPin('1234')`);
  assert.match(h1, /^(sha256|fnv):/);
  const ok1 = await app.run(`verifyPin('1234', '${h1}')`);
  assert.equal(ok1, true);
  const fail1 = await app.run(`verifyPin('9999', '${h1}')`);
  assert.equal(fail1, false);

  // Проверка прозрачной авто-миграции старого пароля:
  const okMigrate = await app.run(`verifyPin('1234', S.settings.pin)`);
  assert.equal(okMigrate, true);
  assert.notEqual(app.run(`S.settings.pin`), '1234');
  assert.match(app.run(`S.settings.pin`), /^(sha256|fnv):/);
});

test('colors: hexToRgba, isLight, oklchToHex вычисляют цвета корректно', () => {
  const app = createApp(state());
  app.load('utils.js');
  assert.equal(app.run(`hexToRgba('#ff0000', 0.5)`), 'rgba(255,0,0,0.5)');
  assert.equal(app.run(`isLight('#ffffff')`), true);
  assert.equal(app.run(`isLight('#000000')`), false);
  assert.match(app.run(`oklchToHex('oklch(0.6 0.25 30)')`), /^#[0-9a-fA-F]{6}$/);
});

test('store: reorderAccounts и reorderCategories обновляют order', () => {
  const s = {
    accounts: [{ id: 'a1', order: 0 }, { id: 'a2', order: 1 }],
    categories: [{ id: 'c1', order: 0 }, { id: 'c2', order: 1 }],
    settings: { currency: 'RUB' }
  };
  const app = createApp(s);
  app.load('utils.js', 'domain/cache.js', 'domain/periods.js', 'domain/factories.js', 'domain/entities.js', 'domain/calculations.js', 'storage/keys.js', 'storage/safe.js', 'storage/schema.js', 'storage/state.js', 'storage/store.js', 'storage/mutations.js');
  app.run(`Store.reorderAccounts(['a2', 'a1'])`);
  assert.equal(app.run(`accById('a2').order`), 0);
  assert.equal(app.run(`accById('a1').order`), 1);
  app.run(`Store.reorderCategories(['c2', 'c1'])`);
  assert.equal(app.run(`catById('c2').order`), 0);
  assert.equal(app.run(`catById('c1').order`), 1);
});

test('presets: FORM_COLORS, ICON_SECTIONS и hexable валидны и консистентны', () => {
  const app = createApp(state());
  app.load('utils.js');
  assert.equal(app.run(`FORM_COLORS.length`), 18);
  assert.equal(app.run(`ICON_SECTIONS.length`), 16);
  const allIconsOk = app.run(`(() => {
    for (const [sec, list] of ICON_SECTIONS) {
      for (const ic of list) {
        if (!LUC[ic]) return false;
      }
    }
    return true;
  })()`);
  assert.equal(allIconsOk, true);
  const allSvgsValid = app.run(`(() => {
    for (const [sec, list] of ICON_SECTIONS) {
      for (const ic of list) {
        const svg = svgIcon(ic);
        if (!svg.startsWith('<svg') || !svg.includes('<path')) return false;
      }
    }
    return true;
  })()`);
  assert.equal(allSvgsValid, true);
  assert.equal(app.run(`hexable('#FF0000')`), '#ff0000');
  assert.match(app.run(`hexable('oklch(0.6 0.25 30)')`), /^#[0-9a-fA-F]{6}$/);
  assert.equal(app.run(`hexable('invalid-color-value')`), null);
});

test('store: deleteAccount каскадно удаляет операции, restoreAccount восстанавливает', () => {
  const a1 = { id: 'a1', name: 'Card', system: false };
  const a2 = { id: 'a2', name: 'Cash', system: false };
  const t1 = { id: 't1', accountId: 'a1', date: '2026-01-01T10:00' };
  const t2 = { id: 't2', accountId: 'a2', toAccountId: 'a1', date: '2026-01-02T10:00' };
  const t3 = { id: 't3', accountId: 'a2', date: '2026-01-03T10:00' };
  const s = { accounts: [a1, a2], transactions: [t1, t2, t3], categories: [], settings: { currency: 'RUB' } };
  const app = createApp(s);
  app.load('utils.js', 'domain/cache.js', 'domain/periods.js', 'domain/factories.js', 'domain/entities.js', 'domain/calculations.js', 'storage/keys.js', 'storage/safe.js', 'storage/schema.js', 'storage/state.js', 'storage/store.js', 'storage/mutations.js');

  const delOk = app.run(`Store.deleteAccount('a1')`);
  assert.equal(delOk, true);
  assert.equal(app.run(`S.accounts.length`), 1);
  assert.equal(app.run(`S.transactions.length`), 1);
  assert.equal(app.run(`S.transactions[0].id`), 't3');

  app.run(`Store.restoreAccount(${JSON.stringify(a1)}, [${JSON.stringify(t1)}, ${JSON.stringify(t2)}])`);
  assert.equal(app.run(`S.accounts.length`), 2);
  assert.equal(app.run(`S.transactions.length`), 3);
  assert.equal(app.run(`accById('a1').name`), 'Card');
});

test('store: deleteCategory отвязывает операции, restoreCategory восстанавливает', () => {
  const c1 = { id: 'c1', name: 'Food' };
  const c2 = { id: 'c2', name: 'Snacks', parentId: 'c1' };
  const t1 = { id: 't1', categoryId: 'c1', date: '2026-01-01T10:00' };
  const s = { accounts: [], categories: [c1, c2], transactions: [t1], settings: { currency: 'RUB' } };
  const app = createApp(s);
  app.load('utils.js', 'domain/cache.js', 'domain/periods.js', 'domain/factories.js', 'domain/entities.js', 'domain/calculations.js', 'storage/keys.js', 'storage/safe.js', 'storage/schema.js', 'storage/state.js', 'storage/store.js', 'storage/mutations.js');

  app.run(`Store.deleteCategory('c1')`);
  assert.equal(app.run(`S.categories.length`), 1);
  assert.equal(app.run(`S.categories[0].parentId`), null);
  assert.equal(app.run(`S.transactions[0].categoryId`), null);

  app.run(`Store.restoreCategory(${JSON.stringify(c1)}, [{ id: 'c2', parentId: 'c1' }], [{ t: S.transactions[0], was: 'c1' }])`);
  assert.equal(app.run(`S.categories.length`), 2);
  assert.equal(app.run(`catById('c1').name`), 'Food');
  assert.equal(app.run(`catById('c2').parentId`), 'c1');
  assert.equal(app.run(`S.transactions[0].categoryId`), 'c1');
});

test('stats: в AS_MODES только donut и line, asFlowSummaryHTML форматирует итоги', () => {
  const app = createApp(state());
  app.load('utils.js', 'domain/cache.js', 'domain/currency.js', 'domain/periods.js', 'domain/factories.js', 'domain/entities.js', 'domain/calculations.js', 'screens/home.js');
  const modes = app.run(`AS_MODES.map(m => m[0])`);
  assert.deepEqual([...modes], ['donut', 'line']);
  const flow = app.run(`asFlowSummaryHTML(100, 50, v => String(v))`);
  assert.match(flow, /100/);
  assert.match(flow, /50/);
});

test('reminders: App.reminders инициализируется с sync и tick', () => {
  const app = createApp(state());
  app.load('utils.js', 'domain/cache.js', 'domain/currency.js', 'domain/periods.js', 'domain/factories.js', 'domain/entities.js', 'domain/calculations.js', 'app/reminders.js');
  assert.equal(app.run(`typeof window.App.reminders.tick`), 'function');
  assert.equal(app.run(`typeof window.App.reminders.sync`), 'function');
  assert.equal(app.run(`typeof window.App.reminders.sendNotification`), 'function');
});