/* domain/cache.js — фабрика мемо-кэшей с сигнатурой зависимостей.
   Заменяет ручные пары «_XCache/_XDirty» (раньше копировались в 3 местах кода). */
"use strict";
/**
 * @template T
 * @param {() => T} compute — чистый пересчёт значения (читает S; DOM и localStorage не трогает)
 * @returns {{
 *   get: (sig?: string|number) => T,
 *   invalidate: () => void
 * }}
 * get(sig) — возвращает кэш, пока сигнатура зависимостей совпадает; иначе пересчитывает.
 * invalidate() — принудительный сброс (мутация данных, не меняющая сигнатуру).
 */
function createCache(compute) {
  let _v = null, _sig = null, _ok = false;
  return {
    get(sig) {
      const s = sig === undefined ? '_' : String(sig);
      if (_ok && _sig === s) return _v;
      _v = compute();
      _sig = s;
      _ok = true;
      return _v;
    },
    invalidate() { _ok = false; _sig = null; }
  };
}