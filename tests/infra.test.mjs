// Юнит-тесты инфраструктуры: createCache (domain/cache.js) и V (storage/schema.js)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from './helpers/sandbox.mjs';

test('createCache: пересчёт только при смене сигнатуры или invalidate()', () => {
  const app = createApp({});
  app.load('domain/cache.js');
  const r = app.run(`(function () {
    let calls = 0;
    const c = createCache(() => ++calls);
    c.get('a'); c.get('a');
    const v1 = c.get('a');
    c.get('b');            // другая сигнатура → пересчёт
    c.invalidate(); c.get('b'); // принудительный сброс → пересчёт
    return { v1: v1, calls: calls };
  })()`);
  assert.equal(r.v1, 1);
  assert.equal(r.calls, 3);
});

test('schema: number — coerce, round2, лимиты суммы', () => {
  const app = createApp({});
  app.load('storage/schema.js');
  const r = app.run(`V.number().min(0).max(1e9).round2().check('12.34')`);
  assert.equal(r.ok, true);
  assert.equal(r.value, 12.34);
  assert.equal(app.run(`V.number().min(0).check('-5')`).ok, false);
  assert.equal(app.run(`V.number().max(1e9).check('2e12')`).ok, false);
  assert.equal(app.run(`V.number().check('abc')`).ok, false);
});

test('schema: enum и required — неизвестный тип операции отбраковывается', () => {
  const app = createApp({});
  app.load('storage/schema.js');
  assert.equal(app.run(`V.enum(['expense', 'income']).check('income').ok`), true);
  assert.equal(app.run(`V.enum(['expense', 'income']).check('ref')`).ok, false);
  const r = app.run(`V.object({ amount: V.number() }).check({})`);
  assert.equal(r.ok, false);
  assert.match(r.errors[0], /amount/);
});

test('schema: object срезает неизвестные ключи и подставляет defaults', () => {
  const app = createApp({});
  app.load('storage/schema.js');
  const r = app.run(`V.object({
    name: V.string().trim().max(10).default(''),
    archived: V.boolean().default(false)
  }).check({ name: '  Кошелёк ', hacked: '<script>', archived: 'true' })`);
  assert.equal(r.ok, true);
  assert.equal(r.value.name, 'Кошелёк');
  assert.equal(r.value.archived, true);
  assert.equal('hacked' in r.value, false);
});

test('schema: array-sanitize — битые элементы отбрасываются, лимит массива работает', () => {
  const app = createApp({});
  app.load('storage/schema.js');
  const r = app.run(`V.array(V.number().min(0), { max: 100 }).check([5, 'x', -1, 7])`);
  assert.equal(r.ok, true);
  assert.equal(JSON.stringify(r.value), '[5,7]');
  assert.equal(r.dropped.length, 2);
});