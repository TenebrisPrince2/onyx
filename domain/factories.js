"use strict";
/* domain/factories.js — фабрики сущностей: дефолтное состояние, демо-операции, палитра/дефолтные категории. DEF_SETTINGS остаётся в index.html (используется UI и storage), читается в момент вызова. */
const PALETTE = ['#ffffff', '#f5f5f7', '#ff453a', '#ff375f', '#ff2d55', '#e8395b', '#30d158', '#34c759', '#0ac97a', '#10b981', '#64d2ff', '#0a84ff', '#007aff', '#5e5ce6'];

const DEF_CATS = [
  ['Продукты', 'shopping-basket', 2, 'expense'], ['Кафе и рестораны', 'utensils', 10, 'expense'],
  ['Шоппинг', 'shopping-bag', 9, 'expense'], ['Развлечения', 'popcorn', 8, 'expense'],
  ['Здоровье', 'heart-pulse', 5, 'expense'], ['Спорт', 'dumbbell', 7, 'expense'],
  ['Транспорт', 'car-front', 6, 'expense'], ['Жильё и связь', 'home', 11, 'expense'],
  ['Образование', 'graduation-cap', 8, 'expense'], ['Путешествия', 'plane', 6, 'expense'],
  ['Подписки', 'refresh-cw', 11, 'expense'],
  ['Зарплата', 'banknote', 5, 'income'], ['Подработка', 'briefcase', 4, 'income'],
  ['Подарки', 'gift', 9, 'income'], ['Проценты', 'percent', 3, 'income'], ['Возвраты', 'hand-coins', 0, 'income'],
  ['Супермаркет', 'shopping-basket', 2, 'expense', 'c0'], ['Рынок', 'store', 11, 'expense', 'c0'], ['Кофейни', 'coffee', 10, 'expense', 'c1']
];

function fresh() {
  const cats = DEF_CATS.map((c, i) => ({ id: 'c' + i, name: c[0], icon: c[1], color: PALETTE[c[2]], kind: c[3], parentId: c[4] || null, order: i }));
  const accs = [
    { id: 'a0', name: 'Кошелёк', icon: 'wallet', color: PALETTE[5], currency: 'BYN', initial: 180, inTotal: true, order: 0, archived: false },
    { id: 'a1', name: 'Карта BYN', icon: 'credit-card', color: PALETTE[7], currency: 'BYN', initial: 1240, inTotal: true, order: 1, archived: false },
    { id: 'a2', name: 'Сбережения', icon: 'piggy-bank', color: PALETTE[3], currency: 'BYN', initial: 4800, inTotal: true, order: 2, archived: false }
  ];
  const st = {
    v: 1, accounts: accs, categories: cats, transactions: [], goals: [], templates: [],
    settings: JSON.parse(JSON.stringify(DEF_SETTINGS))
  };
  st.goals = [
    { id: 'g0', name: 'MacBook Pro', target: 7200, saved: 3150, icon: 'laptop', color: PALETTE[0], deadline: iso(addM(new Date(), 6)), history: [] },
    { id: 'g1', name: 'Отпуск, Тбилиси', target: 3400, saved: 1980, icon: 'plane-takeoff', color: PALETTE[6], deadline: iso(addM(new Date(), 3)), history: [] }
  ];
  st.templates = [{ id: 't0', name: 'Подписки: музыка и облако', type: 'expense', amount: 24.9, accountId: 'a1', categoryId: 'c10', note: 'Автоплатёж', every: 'month', next: iso(addM(new Date(), 1)) }];
  st.transactions = demoTxns(st);
  return st;
}

function demoTxns(st) {
  let seed = 20260730;
  const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
  const pick = a => a[Math.floor(rnd() * a.length)];
  const money2 = (a, b) => Math.round((a + rnd() * (b - a)) * 100) / 100;
  const rows = [
    ['c0', 'a1', 14, 78, ['Евроопт', 'Санта', 'Green', 'Домашние продукты'], .85],
    ['c1', 'a0', 9, 46, ['Кофе с собой', 'Обед', 'Ужин с друзьями', 'Пекарня'], .55],
    ['c6', 'a0', 1.1, 14, ['Метро', 'Автобус', 'Такси'], .6],
    ['c2', 'a1', 22, 190, ['Zara', 'Кроссовки', 'Бытовая мелочь'], .18],
    ['c3', 'a1', 12, 70, ['Кино', 'Настолки', 'Концерт'], .16],
    ['c4', 'a1', 8, 95, ['Аптека', 'Стоматолог', 'Анализы'], .12],
    ['c5', 'a1', 25, 65, ['Зал', 'Бассейн'], .1],
    ['c10', 'a1', 4.9, 29.9, ['Подписка', 'Облако', 'Музыка'], .12],
    ['c9', 'a1', 40, 260, ['Билеты', 'Хостел'], .05]
  ];
  const out = [];
  const today = sod(new Date());
  for (let i = 62; i >= 0; i--) {
    const d = addD(today, -i), k = iso(d);
    rows.forEach(r => {
      if (rnd() < r[5] * (d.getDay() === 0 || d.getDay() === 6 ? 1.25 : .9)) {
        out.push({ id: uid(), type: 'expense', amount: money2(r[2], r[3]), accountId: r[1], categoryId: r[0], note: pick(r[4]), date: k + 'T' + String(8 + Math.floor(rnd() * 13)).padStart(2, '0') + ':' + String(Math.floor(rnd() * 60)).padStart(2, '0') });
      }
    });
    if (d.getDate() === 1) out.push({ id: uid(), type: 'expense', amount: 680, accountId: 'a1', categoryId: 'c7', note: 'Аренда квартиры', date: k + 'T10:00' });
    if (d.getDate() === 4) out.push({ id: uid(), type: 'expense', amount: 96.4, accountId: 'a1', categoryId: 'c7', note: 'Коммуналка и интернет', date: k + 'T11:20' });
    if (d.getDate() === 10 || d.getDate() === 25) out.push({ id: uid(), type: 'income', amount: d.getDate() === 10 ? 1420 : 1180, accountId: 'a1', categoryId: 'c11', note: d.getDate() === 10 ? 'Аванс' : 'Зарплата', date: k + 'T09:05' });
    if (d.getDate() === 12 && i < 40) out.push({ id: uid(), type: 'income', amount: 460, accountId: 'a1', categoryId: 'c12', note: 'Фриланс-проект', date: k + 'T18:40' });
    if (d.getDate() === 26) out.push({ id: uid(), type: 'transfer', amount: 400, accountId: 'a1', toAccountId: 'a2', note: 'В сбережения', date: k + 'T09:30' });
    if (d.getDate() === 15) out.push({ id: uid(), type: 'transfer', amount: 200, accountId: 'a1', toAccountId: 'a0', note: 'Снятие наличных', date: k + 'T13:10' });
    if (d.getDate() % 7 === 3 && i > 3) out.push({ id: uid(), type: 'transfer', amount: money2(30, 120), accountId: 'a0', toAccountId: 'a1', note: 'Внести наличные', date: k + 'T19:45' });
    if (d.getDate() === 8 && i < 45) out.push({ id: uid(), type: 'transfer', amount: money2(50, 250), accountId: 'a1', toAccountId: 'a2', note: 'На накопления', date: k + 'T12:05' });
    if (d.getDate() === 20 && i < 45) out.push({ id: uid(), type: 'income', amount: money2(25, 90), accountId: 'a2', categoryId: 'c12', note: 'Возврат долга', date: k + 'T14:15' });
    if (d.getDate() === 17 && i < 30) out.push({ id: uid(), type: 'income', amount: money2(15, 60), accountId: 'a1', categoryId: 'c12', note: 'Кэшбэк и проценты', date: k + 'T10:25' });
  }
  out.push({ id: uid(), type: 'adjust', amount: 12.35, adjustSign: -1, accountId: 'a0', note: 'Сверка наличных', date: iso(addD(today, -9)) + 'T21:00' });
  out.push({ id: uid(), type: 'adjust', amount: 5, adjustSign: 1, accountId: 'a2', note: 'Поправка баланса', date: iso(addD(today, -20)) + 'T12:30' });
  return out.sort((a, b) => (b.date > a.date ? 1 : b.date < a.date ? -1 : 0));
}
