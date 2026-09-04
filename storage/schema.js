/* storage/schema.js — мини-валидатор в стиле Zod (аналог: проект без сборки, npm-пакет
   в браузер без бандлера не подключить). Только то, что нужно для импорта бэкапов:
   цепочки проверок, coerce из строк, nullable/optional/default, sanitize-массивы. */
"use strict";
const V = (() => {
  function base(kind, extra) {
    const st = { kind: kind, optional: false, nullable: false, def: undefined, checks: [], extra: extra || {} };
    const api = {
      optional() { st.optional = true; return api; },
      nullable() { st.nullable = true; return api; },
      default(d) { st.optional = true; st.def = d; return api; },
      min(n, msg) { st.checks.push(v => v < n ? (msg || ('min: ' + n)) : null); return api; },
      max(n, msg) { st.checks.push(v => v > n ? (msg || ('max: ' + n)) : null); return api; },
      pattern(re, msg) { st.checks.push(v => re.test(v) ? null : (msg || 'pattern')); return api; },
      refine(fn, msg) { st.checks.push(v => fn(v) ? null : (msg || 'refine')); return api; },
      trim() { st.extra.trim = true; return api; },
      round2() { st.extra.round2 = true; return api; },
      integer() { st.checks.push(v => Number.isInteger(v) ? null : 'integer'); return api; },
      /** @returns {{ok: boolean, value?: any, errors?: string[]}} */
      check(input) {
        if (input === undefined || input === null) {
          if (st.optional || st.nullable) return { ok: true, value: st.optional && input === undefined ? st.def : null };
          return { ok: false, errors: ['required'] };
        }
        let val = input;
        if (st.kind === 'string') {
          if (typeof val !== 'string' && typeof val !== 'number' && typeof val !== 'boolean') return { ok: false, errors: ['type:string'] };
          val = String(val);
          if (st.extra.trim) val = val.trim();
        } else if (st.kind === 'number') {
          val = typeof val === 'number' ? val : (typeof val === 'string' && val.trim() !== '' ? Number(val) : NaN);
          if (!isFinite(val)) return { ok: false, errors: ['type:number'] };
          if (st.extra.round2) val = Math.round(val * 100) / 100;
        } else if (st.kind === 'boolean') {
          if (val === true || val === 'true' || val === 1) val = true;
          else if (val === false || val === 'false' || val === 0) val = false;
          else return { ok: false, errors: ['type:boolean'] };
        } else if (st.kind === 'enum') {
          if (!st.extra.vals.includes(val)) return { ok: false, errors: ['enum:' + st.extra.vals.join('|')] };
        }
        const errors = [];
        for (const c of st.checks) { const e = c(val); if (e) errors.push(e); }
        return errors.length ? { ok: false, errors: errors } : { ok: true, value: val };
      }
    };
    return api;
  }
  return {
    string: () => base('string'),
    number: () => base('number'),
    boolean: () => base('boolean'),
    enum: vals => base('enum', { vals: vals }),
    /** Массив с санитайзингом: битые элементы отбрасываются, не валят весь импорт. */
    array: (el, opts) => ({
      check(input) {
        if (!Array.isArray(input)) return { ok: false, errors: ['type:array'] };
        const max = (opts && opts.max) || Infinity;
        const value = [], dropped = [];
        for (let i = 0; i < input.length && value.length < max; i++) {
          const r = el.check(input[i]);
          if (r.ok) value.push(r.value);
          else dropped.push({ index: i, errors: r.errors });
        }
        return { ok: true, value: value, dropped: dropped, total: input.length };
      }
    }),
    /** Объект по схеме: типы полей строго, неизвестные ключи срезаются, defaults подставляются. */
    object: shape => ({
      check(input) {
        if (!input || typeof input !== 'object' || Array.isArray(input)) return { ok: false, errors: ['type:object'] };
        const value = {}, errors = [];
        for (const key of Object.keys(shape)) {
          const r = shape[key].check(input[key]);
          if (r.ok) value[key] = r.value;
          else errors.push(key + ': ' + r.errors.join(', '));
        }
        return errors.length ? { ok: false, errors: errors, value: value } : { ok: true, value: value };
      }
    })
  };
})();