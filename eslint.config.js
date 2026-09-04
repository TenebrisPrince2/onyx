/* ESLint flat config (ESLint 9).
   Особенность проекта: приложение без сборки — все модули делят общую глобальную область
   (S, UI, save(), toast() и т.д. объявлены в других файлах или в inline-скрипте index.html).
   Поэтому список глобалов приложения вынесен в eslint-globals.json (генерируется
   одноразовым скриптом .zcode/extract-globals.mjs) и подключается ниже. */
const js = require('@eslint/js');
const appGlobals = require('./eslint-globals.json');

const globals = {};
for (const n of appGlobals) globals[n] = 'writable';

const browserGlobals = {
  window: 'readonly', document: 'readonly', documentElement: 'readonly', navigator: 'readonly',
  location: 'writable', history: 'readonly', localStorage: 'writable', sessionStorage: 'writable',
  indexedDB: 'readonly', caches: 'readonly', self: 'readonly', clients: 'readonly',
  skipWaiting: 'readonly', Response: 'readonly', Request: 'readonly', fetch: 'readonly',
  AbortController: 'readonly', URL: 'readonly', URLSearchParams: 'readonly', Blob: 'readonly',
  File: 'readonly', FileReader: 'readonly', FormData: 'readonly', performance: 'readonly',
  TextEncoder: 'readonly',
  console: 'readonly', setTimeout: 'writable', clearTimeout: 'readonly', setInterval: 'writable',
  clearInterval: 'readonly', requestAnimationFrame: 'readonly', cancelAnimationFrame: 'readonly',
  requestIdleCallback: 'readonly', matchMedia: 'readonly', getComputedStyle: 'readonly',
  Notification: 'readonly', CustomEvent: 'readonly', Event: 'readonly', KeyboardEvent: 'readonly',
  TouchEvent: 'readonly', PointerEvent: 'readonly', MutationObserver: 'readonly',
  ResizeObserver: 'readonly', IntersectionObserver: 'readonly', DOMParser: 'readonly',
  Image: 'readonly', Option: 'readonly', crypto: 'readonly', atob: 'readonly', btoa: 'readonly',
  structuredClone: 'readonly', queueMicrotask: 'readonly', screen: 'readonly',
  devicePixelRatio: 'readonly', visualViewport: 'readonly', CSS: 'readonly',
  Element: 'readonly', Node: 'readonly', HTMLElement: 'readonly', SVGElement: 'readonly',
  SVGPathElement: 'readonly', WebAssembly: 'readonly'
};

module.exports = [
  /* глобальные исключения: dev-скрипты и инструментарий */
  { ignores: ['node_modules/**', '.zcode/**', 'tools/**', '.zcode*.js'] },

  js.configs.recommended,

  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'script',
      globals: Object.assign({}, browserGlobals, globals)
    },
    rules: {
      /* ядро: ловим опечатки в именах глобалов */
      'no-undef': 'error',
      /* off легитимно: все файлы делят общую глобальную область, объявление
         (const S) в одном файле и «повторное объявление»-объявление в другом —
         это контракт no-build архитектуры, а не ошибка */
      'no-redeclare': 'off',
      /* шум понижаем до warn: кодовая база сознательно использует
         пустые catch (feature detection) и var-совместимый стиль */
      'no-unused-vars': ['warn', { args: 'none', varsIgnorePattern: '^_' }],
      'no-empty': ['warn', { allowEmptyCatch: true }],
      'no-var': 'warn',
      'prefer-const': 'off',
      'no-useless-escape': 'warn',
      'no-control-regex': 'off',
      'no-misleading-character-class': 'off'
    }
  },
  {
    /* сам конфиг — CommonJS под Node */
    files: ['eslint.config.js'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'commonjs',
      globals: { require: 'readonly', module: 'writable', process: 'readonly', __dirname: 'readonly' }
    },
    rules: { 'no-unused-vars': 'off' }
  },
  {
    /* тесты и харнесс — ESM под Node */
    files: ['tests/**/*.mjs', '*.mjs'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: {
        console: 'readonly', process: 'readonly', URL: 'readonly', Buffer: 'readonly',
        setTimeout: 'writable', clearTimeout: 'readonly', TextEncoder: 'readonly', TextDecoder: 'readonly'
      }
    }
  }
];