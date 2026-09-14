// Юнит-тесты инфраструктуры: createCache (domain/cache.js), V (storage/schema.js) и sw.js (decideReminder)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import vm from 'node:vm';
import { createApp } from './helpers/sandbox.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

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

test('sw: decideReminder возвращает корректные коды причин и SEND', () => {
  const ctx = vm.createContext({
    self: {
      registration: { scope: 'http://localhost/' },
      location: { origin: 'http://localhost' },
      addEventListener: () => {}
    },
    caches: {},
    indexedDB: {},
    console,
    URL,
    Date,
    String,
    Number,
    Math,
    Response: class Response {},
    Object
  });
  vm.runInContext(readFileSync(join(ROOT, 'sw.js'), 'utf8'), ctx);
  const { decideReminder, REMINDER_SKIP } = ctx.self;

  assert.equal(decideReminder({}, 'denied'), REMINDER_SKIP.NO_PERMISSION);
  assert.equal(decideReminder(null, 'granted'), REMINDER_SKIP.NO_DATA);
  assert.equal(decideReminder({}, 'granted'), REMINDER_SKIP.NO_DATA);
  assert.equal(decideReminder({ settings: {} }, 'granted'), REMINDER_SKIP.DISABLED);
  assert.equal(decideReminder({ settings: { reminder: { enabled: false } } }, 'granted'), REMINDER_SKIP.DISABLED);
  assert.equal(decideReminder({ settings: { reminder: { enabled: true, time: '20:00' } } }, 'granted', { now: new Date('2026-01-01T10:00:00') }), REMINDER_SKIP.TOO_EARLY);
  assert.equal(decideReminder({ settings: { reminder: { enabled: true, time: '09:00' } } }, 'granted', { alreadySent: true }), REMINDER_SKIP.ALREADY_SENT);
  assert.equal(decideReminder({ settings: { reminder: { enabled: true, time: '09:00' } } }, 'granted', { alreadySent: true, force: true }), 'SEND');
  assert.equal(decideReminder({ settings: { reminder: { enabled: true, time: '00:00' } } }, 'granted'), 'SEND');
});

test('net-status: переключает класс is-offline и aria-hidden при online/offline событиях', () => {
  const listeners = {};
  const el = {
    classList: {
      _classes: new Set(),
      toggle(name, val) {
        if (val) this._classes.add(name);
        else this._classes.delete(name);
      },
      contains(name) { return this._classes.has(name); }
    },
    _attrs: {},
    setAttribute(k, v) { this._attrs[k] = String(v); },
    getAttribute(k) { return this._attrs[k]; }
  };
  const ctx = vm.createContext({
    console,
    navigator: { onLine: false },
    document: {
      readyState: 'complete',
      getElementById: id => (id === 'net-status' ? el : null),
      addEventListener: () => {}
    },
    window: {
      addEventListener: (type, fn) => { listeners[type] = fn; }
    }
  });
  vm.runInContext(readFileSync(join(ROOT, 'app/net-status.js'), 'utf8'), ctx);

  // При начальной загрузке navigator.onLine = false -> баннер активен
  assert.equal(el.classList.contains('is-offline'), true);
  assert.equal(el.getAttribute('aria-hidden'), 'false');

  // Сеть восстановилась -> событие online
  ctx.navigator.onLine = true;
  listeners.online({ type: 'online' });
  assert.equal(el.classList.contains('is-offline'), false);
  assert.equal(el.getAttribute('aria-hidden'), 'true');

  // Сеть пропала -> событие offline
  ctx.navigator.onLine = false;
  listeners.offline({ type: 'offline' });
  assert.equal(el.classList.contains('is-offline'), true);
  assert.equal(el.getAttribute('aria-hidden'), 'false');
});