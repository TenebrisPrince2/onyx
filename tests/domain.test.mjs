// Юнит-тесты domain-слоя: currency (форматирование денег) и periods (календарь)
import { test} from 'node:test';
import assert from 'node:assert/strict';
import { createApp} from './helpers/sandbox.mjs';
const state = () => ({
  settings: {
    currency: 'BYN', roundTotals: false, firstDay: 1
  }
});
const load = app => app.load('utils.js', 'domain/currency.js', 'domain/periods.js');
test('currency: money форматирует по ru-RU (nbsp-группы, десятичная запятая)', () => {
  const app = createApp(state());
  load(app);
  assert.equal(app.run(`money(1234.5, 'RUB')`), '1\u00A0234,50\u00A0₽');
  assert.equal(app.run(`money(1234.5, 'RUB', { exact: true })`), '1\u00A0234,50\u00A0₽');
});
test('currency: roundTotals отбрасывает копейки', () => {
  const app = createApp({
    settings: {
      currency: 'BYN', roundTotals: true, firstDay: 1
    }
  });
  load(app);
  assert.equal(app.run(`money(1234.5, 'RUB')`), '1\u00A0235\u00A0₽');
});
test('currency: USD — префиксная валюта; нечисловой вход → 0', () => {
  const app = createApp(state());
  load(app);
  assert.equal(app.run(`money(9.5, 'USD')`), '$\u00A09,50');
  assert.equal(app.run(`money(NaN, 'RUB')`), '0\u00A0₽');
});
test('currency: BYN использует новый официальный SVG и корректные значения', () => {
  const app = createApp(state());
  load(app);
  const bynSvg = app.run(`BYN_SIGN`);
  assert.ok(bynSvg.includes('xmlns="http://w3.org"'));
  assert.ok(bynSvg.includes('viewBox="-10 -10 380.67 466.4"'));
  assert.ok(bynSvg.includes('V284.37H426v-49.6H178v269h-63.1v49.7H178V660.17'));
  assert.ok(!bynSvg.includes('V263.37'));
  assert.ok(!bynSvg.includes('v290'));
  assert.equal(app.run(`money(123.45, 'BYN')`), '123,45' + bynSvg);
  assert.equal(app.run(`money(1234.56, 'BYN')`), '1\u00A0234,56' + bynSvg);
  assert.equal(app.run(`money(-123.45, 'BYN')`), '−123,45' + bynSvg);
  assert.equal(app.run(`money(0, 'BYN')`), '0' + bynSvg);
  assert.equal(app.run(`money(0, 'BYN', { trim: false })`), '0,00' + bynSvg);
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
    accounts: [{
      id: 'a1', name: 'Наличные', currency: 'RUB'
    }], categories: [{
      id: 'c1', name: 'Еда', kind: 'expense'
    }], settings: {
      currency: 'RUB'
    }
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
    accounts: [{
      id: 'a1', currency: 'RUB', initial: 100
    }], categories: [{
      id: 'c1', name: 'Еда'
    }], transactions: [ {
      id: 't1', type: 'expense', amount: 30, accountId: 'a1', date: '2026-01-01T10:00'
    }, {
      id: 't2', type: 'income', amount: 50, accountId: 'a1', date: '2026-01-02T10:00'
    }, {
      id: 't3', type: 'expense', amount: 20, accountId: 'a1', date: '2026-01-03T10:00'
    }], settings: {
      currency: 'RUB', transferAsIO: false, adjustAsIO: false
    }
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
  app.load('domain/icons-data.js', 'utils.js');
  const svg = app.run(`svgIcon('wallet', 'ic ic-s acc-ic', 16)`);
  assert.match(svg, /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
  assert.match(svg, /class="ic ic-s acc-ic"/);
  assert.match(svg, /width="16"/);
  assert.match(svg, /<(path|circle|rect|line|polyline|polygon)[ >]/);
});
test('store: addTransaction и restoreTransaction сохраняют порядок сортировки', () => {
  const s = {
    accounts: [{
      id: 'a1', currency: 'RUB', initial: 100
    }], categories: [], transactions: [ {
      id: 't1', type: 'expense', amount: 30, accountId: 'a1', date: '2026-01-01T10:00'
    }], goals: [], templates: [], settings: {
      currency: 'RUB'
    }
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
  const s = {
    settings: {
      pin: '1234'
    }
  };
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
    accounts: [{
      id: 'a1', order: 0
    }, {
      id: 'a2', order: 1
    }], categories: [{
      id: 'c1', order: 0
    }, {
      id: 'c2', order: 1
    }], settings: {
      currency: 'RUB'
    }
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
test('presets: FORM_COLORS, ICON_CATEGORIES и hexable валидны и консистентны', () => {
  const app = createApp(state());
  app.load('domain/icons-data.js', 'utils.js');
  assert.equal(app.run(`FORM_COLORS.length`), 18);
  assert.equal(app.run(`ICON_CATEGORIES.length`), 20);
  assert.deepEqual( [...app.run(`ICON_CATEGORIES.map(c => c.name)`)], ['Еда', 'Транспорт', 'Покупки', 'Развлечения', 'Здоровье', 'Спорт', 'Дом', 'Коммунальные услуги', 'Красота', 'Дети', 'Образование', 'Финансы', 'Здания', 'Люди', 'Устройства', 'Инструменты', 'Природа', 'Животные', 'Фигуры', 'Другое'] );
  const allIconsOk = app.run(`(() => {    for (const cat of ICON_CATEGORIES) {      for (const row of cat.rows) {        for (const ic of row) {          if (ic && !LUCIDE_SVG[ic]) return false;        }      }    }    return true;  })()`);
  assert.equal(allIconsOk, true);
  const allSvgsValid = app.run(`(() => {    for (const cat of ICON_CATEGORIES) {      for (const row of cat.rows) {        for (const ic of row) {          if (!ic) continue;          const svg = svgIcon(ic);          if (!svg.startsWith('<svg') || !/<(path|circle|rect|line|polyline|polygon|g|ellipse)[ >]/.test(svg)) return false;        }      }    }    return true;  })()`);
  assert.equal(allSvgsValid, true);
  assert.equal(app.run(`svgIcon('wallet').includes('<path')`), true);
  assert.equal(app.run(`svgIcon('shopping-basket').includes('<path')`), true);
  assert.equal(app.run(`hexable('#FF0000')`), '#ff0000');
  assert.match(app.run(`hexable('oklch(0.6 0.25 30)')`), /^#[0-9a-fA-F]{6}$/);
  assert.equal(app.run(`hexable('invalid-color-value')`), null);
});
test('store: deleteAccount каскадно удаляет операции, restoreAccount восстанавливает', () => {
  const a1 = {
    id: 'a1', name: 'Card', system: false
  };
  const a2 = {
    id: 'a2', name: 'Cash', system: false
  };
  const t1 = {
    id: 't1', accountId: 'a1', date: '2026-01-01T10:00'
  };
  const t2 = {
    id: 't2', accountId: 'a2', toAccountId: 'a1', date: '2026-01-02T10:00'
  };
  const t3 = {
    id: 't3', accountId: 'a2', date: '2026-01-03T10:00'
  };
  const s = {
    accounts: [a1, a2], transactions: [t1, t2, t3], categories: [], settings: {
      currency: 'RUB'
    }
  };
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
  const c1 = {
    id: 'c1', name: 'Food'
  };
  const c2 = {
    id: 'c2', name: 'Snacks', parentId: 'c1'
  };
  const t1 = {
    id: 't1', categoryId: 'c1', date: '2026-01-01T10:00'
  };
  const s = {
    accounts: [], categories: [c1, c2], transactions: [t1], settings: {
      currency: 'RUB'
    }
  };
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
  app.load('utils.js', 'domain/cache.js', 'domain/currency.js', 'domain/periods.js', 'domain/factories.js', 'domain/entities.js', 'domain/calculations.js', 'screens/home/home-state.js', 'screens/home/ledger-model.js', 'screens/home/period-picker.js', 'screens/home/analytics.js');
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
test('native period picker: openPeriodPicker и openCustomPeriodNative определены и переключают периоды', () => {
  const s = {
    settings: {
      currency: 'BYN', roundTotals: false, firstDay: 1, customPeriods: [{
        id: 'cp1', s: '2026-01-01', e: '2026-01-10', label: '01.01.26 – 10.01.26'
      }]
    }
  };
  const app = createApp(s);
  app.run(`    var document = {      getElementById: () => null,      querySelector: () => null,      querySelectorAll: () => [],      createElement: (tag) => ({        className: '',        style: {},        setAttribute: () => {},        getAttribute: () => null,        appendChild: () => {},        append: () => {},        querySelector: () => ({ onclick: null, addEventListener: () => {}, querySelectorAll: () => [] }),        querySelectorAll: () => [],        classList: { add: () => {}, remove: () => {}, contains: () => false }      }),      body: { append: () => {} }    };    var requestAnimationFrame = cb => setTimeout(cb, 0);    var cancelAnimationFrame = id => clearTimeout(id);    var UI = { ledger: { period: 'month', customId: null, day: null } };  `);
  app.load('utils.js', 'domain/cache.js', 'domain/currency.js', 'domain/periods.js', 'domain/factories.js', 'domain/entities.js', 'domain/calculations.js', 'screens/home/home-state.js', 'screens/home/ledger-model.js', 'screens/home/period-picker.js', 'screens/home/index.js');
  assert.equal(app.run(`typeof openPeriodPicker`), 'function');
  assert.equal(app.run(`typeof openCustomPeriodNative`), 'function');
  assert.equal(app.run(`typeof onPeriodChange`), 'function');
  // Проверяем вычисление границ периодов
  app.run(`UI.ledger.period = 'all'`);
  const rAll = app.run(`ledgerPeriodRange()`);
  assert.equal(rAll.key, 'all');
  assert.equal(rAll.label, 'Все время');
  app.run(`UI.ledger.period = 'custom'; UI.ledger.customId = 'cp1'`);
  const rCustom = app.run(`ledgerPeriodRange()`);
  assert.equal(rCustom.key, 'custom');
  assert.equal(rCustom.label, '01.01.26 – 10.01.26');
  // Проверяем onPeriodChange: переключение периодов, сброс дня и лимиты
  app.run(`UI.ledger.day = '2026-01-05'`);
  app.run(`onPeriodChange('week')`);
  assert.equal(app.run(`UI.ledger.period`), 'week');
  assert.equal(app.run(`UI.ledger.day`), null);
  assert.equal(app.run(`UI.ledger.limit`), 50);
  app.run(`onPeriodChange('all')`);
  assert.equal(app.run(`UI.ledger.period`), 'all');
  assert.equal(app.run(`UI.ledger.limit`), 200);
  app.run(`onPeriodChange('custom:cp1')`);
  assert.equal(app.run(`UI.ledger.period`), 'custom');
  assert.equal(app.run(`UI.ledger.customId`), 'cp1');
});
test('stats period picker: onAsPeriodChange переключает все периоды Статистики, старый код удалён', () => {
  const s = {
    transactions: [], accounts: [], categories: [], settings: {
      currency: 'BYN', roundTotals: false, firstDay: 1, customPeriods: [{
        id: 'cp1', s: '2026-01-01', e: '2026-01-10', label: '01.01.26 – 10.01.26'
      }]
    }
  };
  const app = createApp(s);
  app.run(`    var document = {      getElementById: () => null,      querySelector: () => null,      querySelectorAll: () => [],      createElement: () => ({        className: '', style: {}, setAttribute: () => {}, getAttribute: () => null,        appendChild: () => {}, append: () => {}, querySelector: () => ({ onclick: null, addEventListener: () => {}, querySelectorAll: () => [] }),        querySelectorAll: () => [], classList: { add: () => {}, remove: () => {}, contains: () => false }      }),      body: { append: () => {} }    };    var requestAnimationFrame = cb => setTimeout(cb, 0);    var cancelAnimationFrame = id => clearTimeout(id);    var UI = { ledger: { period: 'month', customId: null, day: null } };  `);
  app.load('utils.js', 'domain/cache.js', 'domain/currency.js', 'domain/periods.js', 'domain/factories.js', 'domain/entities.js', 'domain/calculations.js', 'screens/home/home-state.js', 'screens/home/ledger-model.js', 'screens/home/period-picker.js', 'screens/home/analytics.js');
  assert.equal(app.run(`typeof onAsPeriodChange`), 'function');
  assert.equal(app.run(`typeof asPeriodSheet`), 'undefined');
  assert.equal(app.run(`typeof asSheetDrag`), 'undefined');
  assert.equal(app.run(`typeof asSheetGrid`), 'undefined');
  assert.equal(app.run(`typeof asCustomSheet`), 'undefined');
  // Проверяем переключение всех периодов
  const periods = ['day', 'week', '2w', 'month', 'year', '7d', '30d', 'all'];
  for (const p of periods) {
    app.run(`onAsPeriodChange('${p}')`);
    assert.equal(app.run(`AS.period`), p);
    assert.equal(app.run(`AS.custom`), null);
    assert.ok(app.run(`asRange().label`));
  }
  // Проверяем пользовательский период
  app.run(`onAsPeriodChange('custom:cp1')`);
  assert.equal(app.run(`AS.period`), 'custom');
  assert.equal(app.run(`AS.custom`), 'cp1');
  assert.equal(app.run(`asRange().label`), '01.01.26 – 10.01.26');
  // Проверяем генерацию options
  const optHtml = app.run(`periodOptionsHTML('month', AS_PRESETS)`);
  assert.match(optHtml, /<option value="month" selected>/);
  assert.match(optHtml, /<optgroup label="Пользовательские">/);
  assert.match(optHtml, /<option value="custom:cp1">/);
  assert.match(optHtml, /<option value="__custom__">/);
});
test('lucide icons: 20 категорий в явном порядке, 334 позиции reference, локальный subset без CDN', () => {
  const app = createApp(state());
  app.load('domain/icons-data.js', 'utils.js', 'storage/keys.js', 'storage/safe.js', 'storage/state.js', 'storage/store.js');
  const EXPECTED_CATEGORIES = [ 'Еда', 'Транспорт', 'Покупки', 'Развлечения', 'Здоровье', 'Спорт', 'Дом', 'Коммунальные услуги', 'Красота', 'Дети', 'Образование', 'Финансы', 'Здания', 'Люди', 'Устройства', 'Инструменты', 'Природа', 'Животные', 'Фигуры', 'Другое' ];
  // Явный CATEGORY_ORDER, не алфавит и не порядок ключей объекта (все 20 категорий)
  assert.deepEqual([...app.run(`CATEGORY_ORDER`)], EXPECTED_CATEGORIES);
  // Новая система: все 20 категорий реализованы
  assert.equal(app.run(`ICON_CATEGORIES.length`), 20);
  const foodCat = app.run(`ICON_CATEGORIES[0]`);
  assert.equal(foodCat.name, 'Еда');
  assert.equal(foodCat.rows.length, 4, 'Еда должна содержать ровно 4 строки');
  const EXPECTED_FOOD_ROWS = [ ['apple', 'bottle-wine', 'candy', 'chef-hat', 'cup-to-go', 'ham', 'kebab', 'salad', 'utensils'], ['avocado', 'bowl-chopsticks', 'candy-cane', 'cherry', 'egg', 'hamburger', 'pepper-chilli', 'sandwich', 'wine'], ['banana', 'cake', 'carrot', 'coffee', 'egg-fried', 'hand-platter', 'pie', 'shopping-basket', 'bottle-champagne'], ['beer', 'cake-slice', 'cheese', 'croissant', 'grape', 'ice-cream-cone', 'pizza', 'strawberry', 'peach'] ];
  for (let r = 0;
  r < 4;
  r++) {
    assert.deepEqual([...foodCat.rows[r]], EXPECTED_FOOD_ROWS[r], `Строка ${r + 1} категории «Еда» должна в точности совпадать со схемой`);
    assert.equal(foodCat.rows[r].length, 9, `В строке ${r + 1} должно быть ровно 9 ячеек`);
  }
  assert.equal(foodCat.rows[2][5], 'hand-platter', 'Вместо пустой ячейки должна стоять hand-platter');
  assert.equal(foodCat.rows.flat().filter(Boolean).length, 36, 'Всего в категории «Еда» должно быть 36 иконок');
  // Категория 2: Транспорт
  const transCat = app.run(`ICON_CATEGORIES[1]`);
  assert.equal(transCat.name, 'Транспорт');
  assert.equal(transCat.rows.length, 4);
  const EXPECTED_TRANS_ROWS = [ ['bike', 'circle-parking', 'motorbike', 'ship', 'train-front'], ['bus', 'ev-charger', 'plane', 'ship-cargo', 'train-track'], ['car', 'forklift', 'rocket', 'truck', 'tram-front'], ['car-taxi-front', 'fuel', 'scooter', 'tractor', 'helicopter'] ];
  for (let r = 0;
  r < 4;
  r++) {
    assert.deepEqual([...transCat.rows[r]], EXPECTED_TRANS_ROWS[r], `Строка ${r + 1} категории «Транспорт» должна в точности совпадать со схемой`);
    assert.equal(transCat.rows[r].length, 5, `В строке ${r + 1} должно быть ровно 5 ячеек`);
  }
  assert.equal(transCat.rows.flat().filter(Boolean).length, 20);
  // Категория 3: Покупки
  const shopCat = app.run(`ICON_CATEGORIES[2]`);
  assert.equal(shopCat.name, 'Покупки');
  assert.equal(shopCat.rows.length, 4);
  const EXPECTED_SHOP_ROWS = [ ['bag-hand', 'handbag', 'jacket', 'shirt', 'sneaker', 'watch'], ['coat-hanger', 'hat-beanie', 'lingerie', 'shopping-bag', 'socks', 'dress'], ['hat-bowler', 'shirt-t', 'shorts-boxer', 'store', 'glasses', 'high-heel'], ['shirt-folded-buttons', 'skirt', 'top-crop', 'vest', 'sweater', 'hat-top'] ];
  for (let r = 0;
  r < 4;
  r++) {
    assert.deepEqual([...shopCat.rows[r]], EXPECTED_SHOP_ROWS[r], `Строка ${r + 1} категории «Покупки» должна в точности совпадать со схемой`);
    assert.equal(shopCat.rows[r].length, 6, `В строке ${r + 1} должно быть ровно 6 ячеек`);
  }
  assert.equal(shopCat.rows.flat().filter(Boolean).length, 24);
  // Категория 4: Развлечения
  const entCat = app.run(`ICON_CATEGORIES[3]`);
  assert.equal(entCat.name, 'Развлечения');
  assert.equal(entCat.rows.length, 4);
  const EXPECTED_ENT_ROWS = [ ['balloon', 'drama', 'mic-vocal', 'roller-coaster'], ['bowling', 'ferris-wheel', 'music-4', 'theater'], ['chess-knight', 'film', 'popcorn', 'projector'], ['clapperboard', 'gamepad-2', 'pumpkin', 'barbecue'] ];
  for (let r = 0;
  r < 4;
  r++) {
    assert.deepEqual([...entCat.rows[r]], EXPECTED_ENT_ROWS[r], `Строка ${r + 1} категории «Развлечения» должна в точности совпадать со схемой`);
    assert.equal(entCat.rows[r].length, 4, `В строке ${r + 1} должно быть ровно 4 ячейки`);
  }
  assert.equal(entCat.rows[0][3], 'roller-coaster', 'Ячейка 4 в строке 1 должна содержать roller-coaster');
  assert.equal(entCat.rows.flat().filter(Boolean).length, 16);
  // Категория 5: Здоровье
  const healthCat = app.run(`ICON_CATEGORIES[4]`);
  assert.equal(healthCat.name, 'Здоровье');
  assert.equal(healthCat.rows.length, 4);
  const EXPECTED_HEALTH_ROWS = [ ['accessibility', 'dna', 'stethoscope'], ['activity', 'heart', 'syringe'], ['ambulance', 'pill', 'tablets'], ['hugeicons:dental-tooth', 'pill-bottle', 'hospital'] ];
  for (let r = 0;
  r < 4;
  r++) {
    assert.deepEqual([...healthCat.rows[r]], EXPECTED_HEALTH_ROWS[r], `Строка ${r + 1} категории «Здоровье» должна в точности совпадать со схемой`);
    assert.equal(healthCat.rows[r].length, 3, `В строке ${r + 1} должно быть ровно 3 ячейки`);
  }
  assert.equal(healthCat.rows.flat().filter(Boolean).length, 12);
  // Категория 6: Спорт
  const sportCat = app.run(`ICON_CATEGORIES[5]`);
  assert.equal(sportCat.name, 'Спорт');
  assert.equal(sportCat.rows.length, 4);
  const EXPECTED_SPORT_ROWS = [ ['award', 'dumbbell', 'ice-hockey', 'skis', 'volleyball'], ['baseball', 'football', 'ice-skate', 'soccer-ball', 'waves-ladder'], ['basketball', 'football-helmet', 'medal', 'tennis-ball', 'mask-snorkel'], ['bat-ball', 'golf-driver', 'motor-racing-helmet', 'trophy', 'beach-ball'] ];
  for (let r = 0;
  r < 4;
  r++) {
    assert.deepEqual([...sportCat.rows[r]], EXPECTED_SPORT_ROWS[r], `Строка ${r + 1} категории «Спорт» должна в точности совпадать со схемой`);
    assert.equal(sportCat.rows[r].length, 5, `В строке ${r + 1} должно быть ровно 5 ячеек`);
  }
  assert.equal(sportCat.rows.flat().filter(Boolean).length, 20);
  // Категория 7: Дом
  const homeCat = app.run(`ICON_CATEGORIES[6]`);
  assert.equal(homeCat.name, 'Дом');
  assert.equal(homeCat.rows.length, 4);
  const EXPECTED_HOME_ROWS = [ ['armchair', 'blender', 'fence', 'lamp', 'rocking-chair', 'wardrobe'], ['bath', 'cabinet-filing', 'heater', 'lamp-desk', 'shower-head', 'washing-machine'], ['bed', 'door-closed', 'iron', 'microwave', 'sofa', 'houses'], ['bed-double', 'door-open', 'ironing-board', 'refrigerator', 'toilet', 'mirror-rectangular'] ];
  for (let r = 0;
  r < 4;
  r++) {
    assert.deepEqual([...homeCat.rows[r]], EXPECTED_HOME_ROWS[r], `Строка ${r + 1} категории «Дом» должна в точности совпадать со схемой`);
    assert.equal(homeCat.rows[r].length, 6, `В строке ${r + 1} должно быть ровно 6 ячеек`);
  }
  assert.equal(homeCat.rows.flat().filter(Boolean).length, 24);
  // Категория 8: Коммунальные услуги
  const utilCat = app.run(`ICON_CATEGORIES[7]`);
  assert.equal(utilCat.name, 'Коммунальные услуги');
  assert.equal(utilCat.rows.length, 4);
  const EXPECTED_UTIL_ROWS = [ ['antenna', 'plug', 'trash'], ['droplet', 'radio-tower', 'house-wifi'], ['flame', 'zap', 'house-plug'], ['globe', 'phone-call', 'recycle'] ];
  for (let r = 0;
  r < 4;
  r++) {
    assert.deepEqual([...utilCat.rows[r]], EXPECTED_UTIL_ROWS[r], `Строка ${r + 1} категории «Коммунальные услуги» должна в точности совпадать со схемой`);
    assert.equal(utilCat.rows[r].length, 3, `В строке ${r + 1} должно быть ровно 3 ячейки`);
  }
  assert.equal(utilCat.rows.flat().filter(Boolean).length, 12);
  // Категория 9: Красота
  const beautyCat = app.run(`ICON_CATEGORIES[8]`);
  assert.equal(beautyCat.name, 'Красота');
  assert.equal(beautyCat.rows.length, 4);
  const EXPECTED_BEAUTY_ROWS = [ ['barber-pole', 'mustache'], ['bottle-dispenser', 'scissors'], ['bottle-perfume', 'scissors-hair-comb'], ['hairdryer', 'soap-dispenser-droplet'] ];
  for (let r = 0;
  r < 4;
  r++) {
    assert.deepEqual([...beautyCat.rows[r]], EXPECTED_BEAUTY_ROWS[r], `Строка ${r + 1} категории «Красота» должна в точности совпадать со схемой`);
    assert.equal(beautyCat.rows[r].length, 2, `В строке ${r + 1} должно быть ровно 2 ячейки`);
  }
  assert.equal(beautyCat.rows.flat().filter(Boolean).length, 8);
  // Категория 10: Дети
  const kidsCat = app.run(`ICON_CATEGORIES[9]`);
  assert.equal(kidsCat.name, 'Дети');
  assert.equal(kidsCat.rows.length, 4);
  const EXPECTED_KIDS_ROWS = [ ['baby', 'stroller'], ['bottle-baby', 'baby-pacifier'], ['diaper', 'toy-brick'], ['pram', 'backpack'] ];
  for (let r = 0;
  r < 4;
  r++) {
    assert.deepEqual([...kidsCat.rows[r]], EXPECTED_KIDS_ROWS[r], `Строка ${r + 1} категории «Дети» должна в точности совпадать со схемой`);
    assert.equal(kidsCat.rows[r].length, 2, `В строке ${r + 1} должно быть ровно 2 ячейки`);
  }
  assert.equal(kidsCat.rows.flat().filter(Boolean).length, 8);
  // Категория 11: Образование
  const eduCat = app.run(`ICON_CATEGORIES[10]`);
  assert.equal(eduCat.name, 'Образование');
  assert.equal(eduCat.rows.length, 4);
  const EXPECTED_EDU_ROWS = [ ['book-bookmark', 'library-big'], ['book-open-text', 'microscope'], ['brain', 'arrow-big-up'], ['graduation-cap', 'book-lock'] ];
  for (let r = 0;
  r < 4;
  r++) {
    assert.deepEqual([...eduCat.rows[r]], EXPECTED_EDU_ROWS[r], `Строка ${r + 1} категории «Образование» должна в точности совпадать со схемой`);
    assert.equal(eduCat.rows[r].length, 2, `В строке ${r + 1} должно быть ровно 2 ячейки`);
  }
  assert.equal(eduCat.rows.flat().filter(Boolean).length, 8);
  // Категория 12: Финансы
  const finCat = app.run(`ICON_CATEGORIES[11]`);
  assert.equal(finCat.name, 'Финансы');
  assert.equal(finCat.rows.length, 4);
  const EXPECTED_FIN_ROWS = [ ['banknote', 'coins-stack', 'dollar-sign', 'handshake', 'receipt-text', 'wallet-minimal'], ['briefcase-business', 'credit-card', 'gem', 'landmark', 'scale', 'credit-card-reader'], ['chart-candlestick', 'crown', 'goal', 'percent', 'wallet', 'tab-check'], ['coins', 'currency', 'hand-coins', 'piggy-bank', 'wallet-cards', 'russian-ruble'] ];
  for (let r = 0;
  r < 4;
  r++) {
    assert.deepEqual([...finCat.rows[r]], EXPECTED_FIN_ROWS[r], `Строка ${r + 1} категории «Финансы» должна в точности совпадать со схемой`);
    assert.equal(finCat.rows[r].length, 6, `В строке ${r + 1} должно быть ровно 6 ячеек`);
  }
  assert.equal(finCat.rows.flat().filter(Boolean).length, 24);
  // Категория 13: Здания
  const buildCat = app.run(`ICON_CATEGORIES[12]`);
  assert.equal(buildCat.name, 'Здания');
  assert.equal(buildCat.rows.length, 4);
  const EXPECTED_BUILD_ROWS = [ ['barn', 'factory', 'hotel', 'university'], ['building-complex', 'farm', 'house-plus', 'warehouse'], ['castle', 'house', 'houses', 'house-roof'], ['church', 'hospital', 'school', 'dome'] ];
  for (let r = 0;
  r < 4;
  r++) {
    assert.deepEqual([...buildCat.rows[r]], EXPECTED_BUILD_ROWS[r], `Строка ${r + 1} категории «Здания» должна в точности совпадать со схемой`);
    assert.equal(buildCat.rows[r].length, 4, `В строке ${r + 1} должно быть ровно 4 ячейки`);
  }
  assert.equal(buildCat.rows.flat().filter(Boolean).length, 16);
  // Категория 14: Люди
  const peopleCat = app.run(`ICON_CATEGORIES[13]`);
  assert.equal(peopleCat.name, 'Люди');
  assert.equal(peopleCat.rows.length, 4);
  const EXPECTED_PEOPLE_ROWS = [ ['person-standing', 'square-user-round'], ['speech', 'ear'], ['user', 'user-star'], ['users', 'user-group'] ];
  for (let r = 0;
  r < 4;
  r++) {
    assert.deepEqual([...peopleCat.rows[r]], EXPECTED_PEOPLE_ROWS[r], `Строка ${r + 1} категории «Люди» должна в точности совпадать со схемой`);
    assert.equal(peopleCat.rows[r].length, 2, `В строке ${r + 1} должно быть ровно 2 ячейки`);
  }
  assert.equal(peopleCat.rows.flat().filter(Boolean).length, 8);
  // Категория 15: Устройства
  const devCat = app.run(`ICON_CATEGORIES[14]`);
  assert.equal(devCat.name, 'Устройства');
  assert.equal(devCat.rows.length, 4);
  const EXPECTED_DEV_ROWS = [ ['camera', 'headset', 'monitor', 'printer', 'tv'], ['cpu', 'keyboard', 'monitor-smartphone', 'smartphone', 'video'], ['drone', 'laptop', 'mouse', 'tablet', 'router'], ['headphones', 'mic', 'phone', 'tablet-smartphone', 'projector'] ];
  for (let r = 0;
  r < 4;
  r++) {
    assert.deepEqual([...devCat.rows[r]], EXPECTED_DEV_ROWS[r], `Строка ${r + 1} категории «Устройства» должна в точности совпадать со схемой`);
    assert.equal(devCat.rows[r].length, 5, `В строке ${r + 1} должно быть ровно 5 ячеек`);
  }
  assert.equal(devCat.rows.flat().filter(Boolean).length, 20);
  // Категория 16: Инструменты
  const toolsCat = app.run(`ICON_CATEGORIES[15]`);
  assert.equal(toolsCat.name, 'Инструменты');
  assert.equal(toolsCat.rows.length, 4);
  const EXPECTED_TOOLS_ROWS = [ ['axe', 'drill', 'paint-bucket', 'ruler'], ['bolt', 'hammer', 'paint-roller', 'shovel'], ['broom', 'paintbrush', 'pencil', 'wrench'], ['brush-cleaning', 'paintbrush-vertical', 'pencil-ruler', 'gavel'] ];
  for (let r = 0;
  r < 4;
  r++) {
    assert.deepEqual([...toolsCat.rows[r]], EXPECTED_TOOLS_ROWS[r], `Строка ${r + 1} категории «Инструменты» должна в точности совпадать со схемой`);
    assert.equal(toolsCat.rows[r].length, 4, `В строке ${r + 1} должно быть ровно 4 ячейки`);
  }
  assert.equal(toolsCat.rows.flat().filter(Boolean).length, 16);
  // Категория 17: Природа
  const natureCat = app.run(`ICON_CATEGORIES[16]`);
  assert.equal(natureCat.name, 'Природа');
  assert.equal(natureCat.rows.length, 4);
  const EXPECTED_NATURE_ROWS = [ ['cactus', 'flower-stem', 'mountain-snow', 'sprout', 'waves-horizontal'], ['cloud', 'flower-lotus', 'flower-rose-single', 'tree-palm', 'tent-tree'], ['flame-kindling', 'leaf', 'shrub', 'tree-pine', 'trees'], ['barbecue', 'flower', 'moon', 'snowflake', null] ];
  for (let r = 0;
  r < 4;
  r++) {
    assert.deepEqual([...natureCat.rows[r]], EXPECTED_NATURE_ROWS[r], `Строка ${r + 1} категории «Природа» должна в точности совпадать со схемой`);
    assert.equal(natureCat.rows[r].length, 5, `В строке ${r + 1} должно быть ровно 5 ячеек`);
  }
  assert.equal(natureCat.rows[3][4], null, 'Ячейка 5 в строке 4 должна быть пустой');
  assert.equal(natureCat.rows.flat().filter(Boolean).length, 19);
  // Категория 18: Животные
  const animalsCat = app.run(`ICON_CATEGORIES[17]`);
  assert.equal(animalsCat.name, 'Животные');
  assert.equal(animalsCat.rows.length, 4);
  const EXPECTED_ANIMALS_ROWS = [ ['bird', 'butterfly', 'elephant-face', 'paw-print', 'turtle'], ['bone', 'cat', 'fish', 'rat', 'rabbit'], ['bug', 'cow-head', 'horse-head', 'shrimp', 'bear-face'], ['panda', 'bull-head', 'dog', 'owl', 'squirrel'] ];
  for (let r = 0;
  r < 4;
  r++) {
    assert.deepEqual([...animalsCat.rows[r]], EXPECTED_ANIMALS_ROWS[r], `Строка ${r + 1} категории «Животные» должна в точности совпадать со схемой`);
    assert.equal(animalsCat.rows[r].length, 5, `В строке ${r + 1} должно быть ровно 5 ячеек`);
  }
  assert.equal(animalsCat.rows.flat().filter(Boolean).length, 20);
  // Категория 19: Фигуры
  const shapesCat = app.run(`ICON_CATEGORIES[18]`);
  assert.equal(shapesCat.name, 'Фигуры');
  assert.equal(shapesCat.rows.length, 4);
  const EXPECTED_SHAPES_ROWS = [ ['astroid', 'boxes', 'club', 'cylinder', 'line-squiggle', 'shapes', 'star'], ['badge', 'circle', 'cone', 'diamond', 'octagon', 'spade', 'triangle'], ['blocks', 'circle-dashed', 'cross', 'hexagon', 'pentagon', 'sparkle', 'ungroup'], ['box', 'circle-small', 'cuboid', 'hexagons-7', 'pyramid', 'square', 'sparkles'] ];
  for (let r = 0;
  r < 4;
  r++) {
    assert.deepEqual([...shapesCat.rows[r]], EXPECTED_SHAPES_ROWS[r], `Строка ${r + 1} категории «Фигуры» должна в точности совпадать со схемой`);
    assert.equal(shapesCat.rows[r].length, 7, `В строке ${r + 1} должно быть ровно 7 ячеек`);
  }
  assert.equal(shapesCat.rows.flat().filter(Boolean).length, 28);
  // Категория 20: Другое
  const otherCat = app.run(`ICON_CATEGORIES[19]`);
  assert.equal(otherCat.name, 'Другое');
  assert.equal(otherCat.rows.length, 4);
  const EXPECTED_OTHER_ROWS = [ ['archive', 'bow-arrow', 'ear', 'galaxy', 'hand-heart', 'pac-man', 'recycle', 'waves-ladder', 'umbrella'], ['atom', 'bubbles', 'fingerprint-pattern', 'ghost', 'hand-helping', 'peace-sign', 'refresh-ccw', 'siren', 'yarn-ball'], ['bell', 'cigarette', 'flag', 'gift', 'hand-metal', 'planet', 'shield-half', 'telescope', 'yin-yang'], ['biceps-flexed', 'compass', 'folder', 'hand-fist', 'megaphone', 'police-cap', 'sigma', 'pen-box', 'clover'] ];
  for (let r = 0;
  r < 4;
  r++) {
    assert.deepEqual([...otherCat.rows[r]], EXPECTED_OTHER_ROWS[r], `Строка ${r + 1} категории «Другое» должна в точности совпадать со схемой`);
    assert.equal(otherCat.rows[r].length, 9, `В строке ${r + 1} должно быть ровно 9 ячеек`);
  }
  assert.equal(otherCat.rows.flat().filter(Boolean).length, 36);
  // Все иконки из всех категорий имеют валидный SVG в LUCIDE_SVG
  const allCatIcons = app.run(`ICON_CATEGORIES.flatMap(c => c.rows.flat().filter(Boolean))`);
  for (const id of allCatIcons) {
    const inner = app.run(`LUCIDE_SVG['${id}']`);
    assert.ok(typeof inner === 'string' && inner.length > 0, `Иконка ${id} должна быть непустой SVG-строкой`);
    assert.ok(/<(path|circle|rect|line|polyline|polygon|ellipse|g)[ >]/.test(inner), `Иконка ${id} должна содержать SVG-элемент`);
    const svg = app.run(`svgIcon('${id}', 'ic', 20)`);
    assert.ok(svg.includes('viewBox="0 0 24 24"'), `SVG для ${id} должен иметь viewBox="0 0 24 24"`);
    assert.ok(svg.includes('width="20" height="20"'), `SVG для ${id} должен иметь размер 20x20`);
    assert.ok(svg.includes('stroke="currentColor"'), `SVG для ${id} должен иметь stroke="currentColor"`);
    assert.ok(!/jsdelivr|unpkg|<script|src="http/i.test(svg), `SVG для ${id} не должен содержать внешних ссылок/CDN`);
  }
  // Официальные Lucide SVG: wallet и shopping-basket содержат path из lucide
  assert.equal(app.run(`LUCIDE_SVG['wallet'].includes('<path')`), true);
  assert.equal(app.run(`svgIcon('wallet').includes('M19 7V4')`), true);
  assert.equal(app.run(`svgIcon('shopping-basket').includes('<path')`), true);
  // Все системные UI иконки присутствуют
  const uiIcons = ['x', 'plus', 'chevron-left', 'chevron-right', 'chevron-down', 'chevrons-down', 'trash', 'pencil', 'search', 'chart-pie', 'settings', 'grip-vertical', 'lock', 'delete', 'check', 'arrow-left-right', 'arrow-left', 'arrow-right', 'arrow-up', 'arrow-up-right', 'arrow-down-left', 'ellipsis-vertical', 'palette', 'circle-slash'];
  for (const uiIc of uiIcons) {
    assert.equal(app.run(`!!LUCIDE_SVG['${uiIc}']`), true, `UI icon ${uiIc} must exist`);
    const svg = app.run(`svgIcon('${uiIc}')`);
    assert.equal(svg.startsWith('<svg'), true);
  }
  // Старые UI-имена мигрируют: trash-2->trash, gear->settings, pie-chart->chart-pie
  assert.equal(app.run(`svgIcon('trash-2').includes('M3 6h18')`), true);
  assert.equal(app.run(`ICON_MIGRATION_MAP['trash-2']`), 'trash');
  assert.equal(app.run(`ICON_MIGRATION_MAP['gear']`), 'settings');
  assert.equal(app.run(`ICON_MIGRATION_MAP['pie-chart']`), 'chart-pie');
  // Миграция старых данных: custom IDs и legacy IDs -> Lucide
  const st = {
    accounts: [{
      id: 'a1', icon: 'fin-wallet'
    }, {
      id: 'a2', icon: 'fin-card'
    }, {
      id: 'a3', icon: 'fin-piggy-bank'
    }, {
      id: 'a4', icon: 'fin-usdt'
    }], categories: [{
      id: 'c1', icon: 'food-grocery-basket'
    }, {
      id: 'c2', icon: 'food-cutlery'
    }, {
      id: 'c3', icon: 'build-house'
    }], goals: [{
      id: 'g1', icon: 'fin-target'
    }, {
      id: 'g2', icon: 'devices-headphones'
    }]
  };
  app.run(`const testSt = ${JSON.stringify(st)}; migrateIcons(testSt); globalThis._migrated = testSt;`);
  assert.equal(app.run(`_migrated.accounts[0].icon`), 'wallet');
  assert.equal(app.run(`_migrated.accounts[1].icon`), 'credit-card');
  assert.equal(app.run(`_migrated.accounts[2].icon`), 'piggy-bank');
  assert.equal(app.run(`_migrated.accounts[3].icon`), 'circle-dollar-sign');
  assert.equal(app.run(`_migrated.categories[0].icon`), 'shopping-basket');
  assert.equal(app.run(`_migrated.categories[1].icon`), 'utensils');
  assert.equal(app.run(`_migrated.categories[2].icon`), 'house');
  assert.equal(app.run(`_migrated.goals[0].icon`), 'target');
  assert.equal(app.run(`_migrated.goals[1].icon`), 'headphones');
});
test('sorting: сценарии 1 и 2 — добавление операции сегодня и добавление нескольких операций подряд сохраняют правильный порядок', () => {
  const s = {
    accounts: [{
      id: 'a1', currency: 'RUB', initial: 1000
    }], categories: [], transactions: [], goals: [], templates: [], settings: {
      currency: 'RUB'
    }
  };
  const app = createApp(s);
  app.load('utils.js', 'domain/cache.js', 'domain/periods.js', 'domain/factories.js', 'domain/entities.js', 'domain/calculations.js', 'storage/keys.js', 'storage/safe.js', 'storage/schema.js', 'storage/state.js', 'storage/store.js', 'storage/mutations.js');
  // Сценарий 1: добавить операцию сегодня
  app.run(`Store.addTransaction({ id: 't1', type: 'expense', amount: 10, accountId: 'a1', date: '2026-09-10T10:00:00' })`);
  assert.equal(app.run(`S.transactions[0].id`), 't1');
  assert.equal(app.run(`sortedTxns()[0].id`), 't1');
  // Сценарий 2: добавить несколько операций подряд (10:01, 10:02, 10:03)
  app.run(`Store.addTransaction({ id: 't2', type: 'expense', amount: 20, accountId: 'a1', date: '2026-09-10T10:01:00' })`);
  app.run(`Store.addTransaction({ id: 't3', type: 'expense', amount: 30, accountId: 'a1', date: '2026-09-10T10:02:00' })`);
  app.run(`Store.addTransaction({ id: 't4', type: 'expense', amount: 40, accountId: 'a1', date: '2026-09-10T10:03:00' })`);
  // Порядок в S.transactions и в sortedTxns() должен быть: t4 (10:03), t3 (10:02), t2 (10:01), t1 (10:00)
  assert.deepEqual(app.run(`S.transactions.map(t => t.id)`), ['t4', 't3', 't2', 't1']);
  assert.deepEqual(app.run(`sortedTxns().map(t => t.id)`), ['t4', 't3', 't2', 't1']);
  // Также проверим добавление нескольких операций в ОДНУ И ТУ ЖЕ минуту/секунду с разными createdAt:
  app.run(`Store.addTransaction({ id: 't5a', type: 'expense', amount: 5, accountId: 'a1', date: '2026-09-10T12:00:00', createdAt: '2026-09-10T12:00:01.000Z' })`);
  app.run(`Store.addTransaction({ id: 't5b', type: 'expense', amount: 6, accountId: 'a1', date: '2026-09-10T12:00:00', createdAt: '2026-09-10T12:00:02.000Z' })`);
  app.run(`Store.addTransaction({ id: 't5c', type: 'expense', amount: 7, accountId: 'a1', date: '2026-09-10T12:00:00', createdAt: '2026-09-10T12:00:03.000Z' })`);
  // t5c создана позже t5b, t5b создана позже t5a — t5c должна быть выше t5b, а t5b выше t5a
  const idsAfterSameMinute = app.run(`sortedTxns().slice(0, 3).map(t => t.id)`);
  assert.deepEqual(idsAfterSameMinute, ['t5c', 't5b', 't5a']);
});
test('sorting: сценарии 3 и 4 — добавление сегодняшней операции при наличии старых и операция в прошлом', () => {
  const s = {
    accounts: [{
      id: 'a1', currency: 'RUB', initial: 1000
    }], categories: [], transactions: [ {
      id: 't_today_early', type: 'expense', amount: 10, accountId: 'a1', date: '2026-09-10T08:00:00', createdAt: '2026-09-10T08:00:00.000Z'
    }], goals: [], templates: [], settings: {
      currency: 'RUB'
    }
  };
  const app = createApp(s);
  app.load('utils.js', 'domain/cache.js', 'domain/periods.js', 'domain/factories.js', 'domain/entities.js', 'domain/calculations.js', 'storage/keys.js', 'storage/safe.js', 'storage/schema.js', 'storage/state.js', 'storage/store.js', 'storage/mutations.js');
  // Сценарий 3: добавляем операцию сегодня с более поздним временем (14:00)
  app.run(`Store.addTransaction({ id: 't_today_afternoon', type: 'expense', amount: 50, accountId: 'a1', date: '2026-09-10T14:00:00' })`);
  assert.equal(app.run(`sortedTxns()[0].id`), 't_today_afternoon');
  assert.equal(app.run(`sortedTxns()[1].id`), 't_today_early');
  // Сценарий 4: добавляем операцию с датой в прошлом (2026-08-01)
  // Она создаётся прямо сейчас (createdAt = now), но дата операции в августе.
  // Она НЕ должна становиться наверх!
  app.run(`Store.addTransaction({ id: 't_august', type: 'expense', amount: 100, accountId: 'a1', date: '2026-08-01T12:00:00' })`);
  assert.equal(app.run(`sortedTxns()[0].id`), 't_today_afternoon');
  assert.equal(app.run(`sortedTxns()[1].id`), 't_today_early');
  assert.equal(app.run(`sortedTxns()[2].id`), 't_august');
});
test('sorting: сценарии 5, 6, 7 — редактирование даты, удаление и перезагрузка состояния', () => {
  const s = {
    accounts: [{
      id: 'a1', currency: 'RUB', initial: 1000
    }], categories: [], transactions: [ {
      id: 't1', type: 'expense', amount: 10, accountId: 'a1', date: '2026-09-01T10:00:00', createdAt: '2026-09-01T10:00:00.000Z'
    }, {
      id: 't2', type: 'expense', amount: 20, accountId: 'a1', date: '2026-09-02T10:00:00', createdAt: '2026-09-02T10:00:00.000Z'
    }, {
      id: 't3', type: 'expense', amount: 30, accountId: 'a1', date: '2026-09-03T10:00:00', createdAt: '2026-09-03T10:00:00.000Z'
    }], goals: [], templates: [], settings: {
      currency: 'RUB'
    }
  };
  const app = createApp(s);
  app.load('utils.js', 'domain/cache.js', 'domain/periods.js', 'domain/factories.js', 'domain/entities.js', 'domain/calculations.js', 'storage/keys.js', 'storage/safe.js', 'storage/schema.js', 'storage/state.js', 'storage/store.js', 'storage/mutations.js');
  // Изначальный порядок: t3 (03 сен), t2 (02 сен), t1 (01 сен)
  assert.deepEqual(app.run(`sortedTxns().map(t => t.id)`), ['t3', 't2', 't1']);
  // Сценарий 5: редактируем дату t1, переносим её на 2026-09-05 (станет самой новой)
  app.run(`Store.updateTransaction('t1', { date: '2026-09-05T10:00:00' })`);
  assert.deepEqual(app.run(`sortedTxns().map(t => t.id)`), ['t1', 't3', 't2']);
  // Сценарий 6: удаляем операцию t3
  app.run(`Store.deleteTransaction('t3')`);
  assert.deepEqual(app.run(`sortedTxns().map(t => t.id)`), ['t1', 't2']);
  // Сценарий 7: перезагрузка (normState) — порядок детерминирован и неизменен
  const normalized = app.run(`normState(JSON.parse(JSON.stringify(S))).transactions.map(t => t.id)`);
  assert.deepEqual(normalized, ['t1', 't2']);
});
test('sorting: разные форматы дат (YYYY-MM-DD и YYYY-MM-DDTHH:MM:SS) и детерминированность', () => {
  const s = {
    accounts: [{
      id: 'a1', currency: 'RUB', initial: 1000
    }], categories: [], transactions: [
    // Операция без времени, но с createdAt в 15:00
    {
      id: 't_notime', type: 'expense', amount: 10, accountId: 'a1', date: '2026-09-10', createdAt: '2026-09-10T15:00:00.000Z'
    },
    // Операция с ранним утренним временем 00:01:23
    {
      id: 't_early', type: 'expense', amount: 20, accountId: 'a1', date: '2026-09-10T00:01:23', createdAt: '2026-09-10T00:01:23.000Z'
    },
    // Операция с временем в HH:MM (без секунд)
    {
      id: 't_mid', type: 'expense', amount: 30, accountId: 'a1', date: '2026-09-10T12:00', createdAt: '2026-09-10T12:00:00.000Z'
    }], goals: [], templates: [], settings: {
      currency: 'RUB'
    }
  };
  const app = createApp(s);
  app.load('utils.js', 'domain/cache.js', 'domain/periods.js', 'domain/factories.js', 'domain/entities.js', 'domain/calculations.js', 'storage/keys.js', 'storage/safe.js', 'storage/schema.js', 'storage/state.js', 'storage/store.js', 'storage/mutations.js');
  // t_notime была создана в 15:00, t_mid была в 12:00, t_early была в 00:01:23
  // t_notime не должна ошибочно проваливаться под 00:01:23 из-за строкового отсутствия "T"!
  const sorted = app.run(`sortedTxns().map(t => t.id)`);
  assert.deepEqual(sorted, ['t_notime', 't_mid', 't_early']);
});
test('cache: txnSortCache сбрасывается и обновляет sortedTxns() при каждой мутации Store', () => {
  const s = {
    accounts: [{
      id: 'a1', currency: 'RUB', initial: 1000
    }], categories: [], transactions: [ {
      id: 't1', type: 'expense', amount: 10, accountId: 'a1', date: '2026-09-10T10:00:00', createdAt: '2026-09-10T10:00:00.000Z'
    }], goals: [], templates: [], settings: {
      currency: 'RUB'
    }
  };
  const app = createApp(s);
  app.load('utils.js', 'domain/cache.js', 'domain/periods.js', 'domain/factories.js', 'domain/entities.js', 'domain/calculations.js', 'storage/keys.js', 'storage/safe.js', 'storage/schema.js', 'storage/state.js', 'storage/store.js', 'storage/mutations.js');
  const cache1 = app.run(`sortedTxns()`);
  assert.equal(cache1.length, 1);
  // Добавляем операцию
  app.run(`Store.addTransaction({ id: 't2', type: 'income', amount: 100, accountId: 'a1', date: '2026-09-10T11:00:00' })`);
  const cache2 = app.run(`sortedTxns()`);
  assert.equal(cache2.length, 2);
  assert.equal(cache2[0].id, 't2');
  assert.notEqual(cache1, cache2, 'sortedTxns() должен вернуть новую ссылку на массив после addTransaction');
  // Обновляем операцию
  app.run(`Store.updateTransaction('t1', { date: '2026-09-10T12:00:00' })`);
  const cache3 = app.run(`sortedTxns()`);
  assert.equal(cache3[0].id, 't1');
  assert.notEqual(cache2, cache3, 'sortedTxns() должен вернуть новую ссылку на массив после updateTransaction');
  // Удаляем операцию
  app.run(`Store.deleteTransaction('t1')`);
  const cache4 = app.run(`sortedTxns()`);
  assert.equal(cache4.length, 1);
  assert.equal(cache4[0].id, 't2');
  assert.notEqual(cache3, cache4, 'sortedTxns() должен вернуть новую ссылку на массив после deleteTransaction');
});

test('Hidden account (Скрыть из обзора): exclusion from totalsByCur, persistence, and balance integrity', () => {
  const s = {
    accounts: [
      { id: 'a1', name: 'Основной', currency: 'BYN', initial: 1000, inTotal: true, hidden: false, order: 0, archived: false },
      { id: 'a2', name: 'Скрытый', currency: 'BYN', initial: 500, inTotal: false, hidden: true, order: 1, archived: false }
    ],
    categories: [],
    transactions: [
      { id: 't1', type: 'expense', amount: 50, accountId: 'a2', date: '2026-09-10T10:00:00', createdAt: '2026-09-10T10:00:00.000Z' }
    ],
    goals: [],
    templates: [],
    settings: { currency: 'BYN' }
  };
  const app = createApp(s);
  app.load('utils.js', 'domain/icons-data.js', 'domain/cache.js', 'domain/periods.js', 'domain/currency.js', 'domain/factories.js', 'domain/entities.js', 'domain/calculations.js', 'storage/keys.js', 'storage/safe.js', 'storage/schema.js', 'storage/state.js', 'storage/store.js', 'storage/mutations.js');

  // 1. Проверяем, что иконки eye-off и hat-glasses резолвятся через встроенную icon system
  const eyeOffSvg = app.run(`svgIcon('eye-off')`);
  assert.ok(eyeOffSvg.includes('viewBox="0 0 24 24"'));
  assert.ok(eyeOffSvg.includes('<path'));
  const hatGlassesSvg = app.run(`svgIcon('hat-glasses', 'ic', 18)`);
  assert.ok(hatGlassesSvg.includes('viewBox="0 0 24 24"'));
  assert.ok(hatGlassesSvg.includes('width="18" height="18"'));
  assert.ok(hatGlassesSvg.includes('<path'));

  // 2. Баланс скрытого счёта рассчитывается корректно (500 - 50 = 450)
  const a2Bal = app.run(`accBalance('a2')`);
  assert.equal(a2Bal, 450);

  // 3. Общий обзор (totalsByCur) исключает скрытый счёт (только a1 = 1000)
  const t1 = app.run(`totalsByCur()`);
  assert.equal(t1.BYN, 1000);

  // 4. Скрытый счёт остаётся в общем списке счетов S.accounts
  const accList = app.run(`S.accounts.filter(a => !a.archived)`);
  assert.equal(accList.length, 2);
  assert.equal(accList[1].id, 'a2');
  assert.equal(accList[1].hidden, true);

  // 5. Создание нового счёта через Store.addAccount с hidden: true
  app.run(`Store.addAccount({ id: 'a3', name: 'Копилка', currency: 'BYN', initial: 300, hidden: true })`);
  const a3 = app.run(`accById('a3')`);
  assert.equal(a3.hidden, true);
  assert.equal(a3.inTotal, false);
  const t2 = app.run(`totalsByCur()`);
  assert.equal(t2.BYN, 1000); // totals всё ещё 1000

  // 6. Редактирование: выключаем скрытие (hidden: false) -> счёт возвращается в обзор
  app.run(`Store.updateAccount('a2', { hidden: false })`);
  const a2Updated = app.run(`accById('a2')`);
  assert.equal(a2Updated.hidden, false);
  assert.equal(a2Updated.inTotal, true);
  const t3 = app.run(`totalsByCur()`);
  assert.equal(t3.BYN, 1450); // 1000 (a1) + 450 (a2) = 1450

  // 7. Проверка дефолта для старых счетов без поля hidden
  app.run(`Store.addAccount({ id: 'a4', name: 'Старый счёт', currency: 'BYN', initial: 100 })`);
  const a4 = app.run(`accById('a4')`);
  assert.equal(a4.hidden, false);
  assert.equal(a4.inTotal, true);
  const t4 = app.run(`totalsByCur()`);
  assert.equal(t4.BYN, 1550);
});

test('Overview Visibility (Скрыть из обзора) для счетов и категорий: 10 тестовых сценариев', () => {
  const s = {
    accounts: [
      { id: 'a1', name: 'Основной', currency: 'BYN', initial: 1000, inTotal: true, hidden: false, order: 0, archived: false },
      { id: 'a_hid', name: 'Скрытый счёт', currency: 'BYN', initial: 500, inTotal: false, hidden: true, order: 1, archived: false }
    ],
    categories: [
      { id: 'c_vis', name: 'Продукты', kind: 'expense', parentId: null, order: 0, hidden: false, hiddenFromOverview: false },
      { id: 'c_hid', name: 'Кафе', kind: 'expense', parentId: null, order: 1, hidden: true, hiddenFromOverview: true }
    ],
    transactions: [
      { id: 't1', type: 'expense', amount: 100, accountId: 'a1', categoryId: 'c_vis', date: '2026-09-10T10:00:00' },
      { id: 't2', type: 'expense', amount: 500, accountId: 'a1', categoryId: 'c_hid', date: '2026-09-10T11:00:00' },
      { id: 't3', type: 'expense', amount: 200, accountId: 'a_hid', categoryId: 'c_vis', date: '2026-09-10T12:00:00' },
      { id: 't4', type: 'expense', amount: 300, accountId: 'a_hid', categoryId: 'c_hid', date: '2026-09-10T13:00:00' }
    ],
    goals: [],
    templates: [],
    settings: { currency: 'BYN', transferAsIO: false, adjustAsIO: false }
  };
  const app = createApp(s);
  app.ctx.UI = { accId: null, ledger: { day: null, period: 'all' } };
  const storageMap = new Map();
  app.ctx.localStorage = {
    getItem: k => storageMap.get(k) || null,
    setItem: (k, v) => storageMap.set(k, String(v)),
    removeItem: k => storageMap.delete(k),
    clear: () => storageMap.clear()
  };
  app.load(
    'utils.js', 'domain/icons-data.js', 'domain/cache.js', 'domain/periods.js',
    'domain/currency.js', 'domain/factories.js', 'domain/entities.js', 'domain/calculations.js',
    'storage/keys.js', 'storage/safe.js', 'storage/schema.js', 'storage/state.js',
    'storage/store.js', 'storage/mutations.js', 'screens/home/home-state.js', 'screens/home/ledger-model.js'
  );

  // Test 1: Обычная категория на обычном счете -> операция видна в overview
  let m = app.run(`ledgerModel({ key: 'all', from: new Date(2000, 0, 1), to: new Date(2030, 0, 1) }, true)`);
  assert.ok(m.list.some(t => t.id === 't1'), 'Test 1: t1 (видная категория на видном счете) должна быть в overview');

  // Test 2: Скрыть категорию -> операция t2 (категория c_hid) исчезает из главного overview
  assert.ok(!m.list.some(t => t.id === 't2'), 'Test 2: t2 (скрытая категория) не должна быть в overview');

  // Test 3: Скрыть категорию -> сумма t2 (500) НЕ учитывается в overview расходах
  // В overview видна только t1 (100). t2 (500), t3 (со скрытого счёта a_hid: 200), t4 (со скрытого счёта: 300) исключены.
  assert.equal(m.exp, 100, 'Test 3: обзорный расход должен быть 100 (только t1), а не 600 или 1100');

  // Test 4: Снова показать категорию c_hid -> операция t2 возвращается в overview и суммы
  app.run(`Store.updateCategory('c_hid', { hidden: false })`);
  m = app.run(`ledgerModel({ key: 'all', from: new Date(2000, 0, 1), to: new Date(2030, 0, 1) }, true)`);
  assert.ok(m.list.some(t => t.id === 't2'), 'Test 4: после включения видимости t2 возвращается в overview');
  assert.equal(m.exp, 600, 'Test 4: обзорный расход стал 100 + 500 = 600');

  // Test 5: Скрыть account -> account остаётся в списке, исключается из overview ("Все счета"),
  // но при выборе этого счёта (UI.accId = 'a_hid') его операции отображаются
  app.run(`Store.updateCategory('c_hid', { hidden: true })`);
  // В режиме "Все счета" (UI.accId = null)
  m = app.run(`UI.accId = null; ledgerModel({ key: 'all', from: new Date(2000, 0, 1), to: new Date(2030, 0, 1) }, true)`);
  assert.ok(!m.list.some(t => t.id === 't3'), 'Test 5: t3 (со скрытого счёта) не должна быть в общем обзоре "Все счета"');
  // При переключении на счёт a_hid
  const mAcc = app.run(`UI.accId = 'a_hid'; ledgerModel({ key: 'all', from: new Date(2000, 0, 1), to: new Date(2030, 0, 1) }, true)`);
  assert.ok(mAcc.list.some(t => t.id === 't3'), 'Test 5: при выборе счета a_hid операция t3 должна отображаться');
  assert.equal(mAcc.exp, 200, 'Test 5: расход по счету a_hid равен 200 (t3)');

  // Test 6: Скрыть одновременно account + category -> операция t4 исключена из overview
  app.run(`UI.accId = null`);
  m = app.run(`ledgerModel({ key: 'all', from: new Date(2000, 0, 1), to: new Date(2030, 0, 1) }, true)`);
  assert.ok(!m.list.some(t => t.id === 't4'), 'Test 6: t4 (скрытый счет + скрытая категория) исключена из overview');

  // Test 7: Перезагрузка страницы -> состояние сохраняется в storage и восстанавливается
  app.run(`persist()`);
  const rawJson = storageMap.get('onyx.finance.v1');
  assert.ok(rawJson, 'Test 7: состояние сериализовано в storage');

  const restored = JSON.parse(rawJson);
  const hidCat = restored.categories.find(c => c.id === 'c_hid');
  assert.equal(hidCat.hidden, true, 'Test 7: c_hid.hidden сохранился в storage');
  const hidAcc = restored.accounts.find(a => a.id === 'a_hid');
  assert.equal(hidAcc.hidden, true, 'Test 7: a_hid.hidden сохранился в storage');

  // Test 8: Существующие старые операции корректно реагируют на изменение visibility
  app.run(`Store.updateCategory('c_vis', { hidden: true })`);
  m = app.run(`UI.accId = null; ledgerModel({ key: 'all', from: new Date(2000, 0, 1), to: new Date(2030, 0, 1) }, true)`);
  assert.ok(!m.list.some(t => t.id === 't1'), 'Test 8: старая операция t1 исчезает из overview при скрытии категории');
  assert.equal(m.exp, 0, 'Test 8: обзорный расход стал 0');
  // Возвращаем видимость c_vis
  app.run(`Store.updateCategory('c_vis', { hidden: false })`);
  m = app.run(`ledgerModel({ key: 'all', from: new Date(2000, 0, 1), to: new Date(2030, 0, 1) }, true)`);
  assert.ok(m.list.some(t => t.id === 't1'), 'Test 8: t1 снова видна в overview');
  assert.equal(m.exp, 100, 'Test 8: обзорный расход вернулся к 100');

  // Test 9: Создание новой операции со скрытой категорией -> сохраняется, но не появляется в overview
  const tNew = app.run(`Store.addTransaction({ id: 't_new', type: 'expense', amount: 777, accountId: 'a1', categoryId: 'c_hid', date: '2026-09-11T10:00:00' })`);
  assert.equal(tNew.amount, 777);
  assert.ok(app.run(`S.transactions.some(t => t.id === 't_new')`), 'Test 9: операция сохранена в истории');
  m = app.run(`ledgerModel({ key: 'all', from: new Date(2000, 0, 1), to: new Date(2030, 0, 1) }, true)`);
  assert.ok(!m.list.some(t => t.id === 't_new'), 'Test 9: t_new не появляется в overview');
  assert.equal(m.exp, 100, 'Test 9: обзорный расход остался 100 (t_new не прибавилась)');

  // Test 10: Изменение категории существующей операции visible -> hidden и hidden -> visible
  // Переключаем t1 из c_vis в c_hid (hidden)
  app.run(`Store.updateTransaction('t1', { categoryId: 'c_hid' })`);
  m = app.run(`ledgerModel({ key: 'all', from: new Date(2000, 0, 1), to: new Date(2030, 0, 1) }, true)`);
  assert.ok(!m.list.some(t => t.id === 't1'), 'Test 10: t1 исчезла из overview после смены категории на скрытую');
  assert.equal(m.exp, 0, 'Test 10: обзорный расход стал 0');
  // Переключаем t1 обратно в c_vis (visible)
  app.run(`Store.updateTransaction('t1', { categoryId: 'c_vis' })`);
  m = app.run(`ledgerModel({ key: 'all', from: new Date(2000, 0, 1), to: new Date(2030, 0, 1) }, true)`);
  assert.ok(m.list.some(t => t.id === 't1'), 'Test 10: t1 вернулась в overview после смены категории на видимую');
  assert.equal(m.exp, 100, 'Test 10: обзорный расход вернулся к 100');
});

