// Тестовый харнесс: грузит global-scope скрипты приложения в общий vm-контекст —
// так же, как браузер исполняет <script>-теги по порядку (проект без сборки/модулей).
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import vm from 'node:vm';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

/**
 * @param {object} state — объект состояния S (достаточно полей, читаемых тестируемым кодом)
 * @returns {{ load: (...files: string[]) => void, run: <T>(code: string) => T, ctx: vm.Context }}
 */
export function createApp(state) {
  const ctx = vm.createContext({
    console, Intl, JSON, Math, Date, Number, String, Object, Array, RegExp, Set, Map, Boolean,
    isNaN, isFinite, parseFloat, parseInt, Promise, Uint8Array,
    crypto: globalThis.crypto,
    TextEncoder: globalThis.TextEncoder,
    setTimeout: globalThis.setTimeout,
    clearTimeout: globalThis.clearTimeout,
    setInterval: globalThis.setInterval,
    clearInterval: globalThis.clearInterval,
    window: {},
    S: state
  });
  return {
    ctx,
    load: (...files) => {
      for (const f of files) vm.runInContext(readFileSync(join(ROOT, f), 'utf8'), ctx, { filename: f });
    },
    run: code => vm.runInContext(code, ctx)
  };
}