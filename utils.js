"use strict";
/* Вынесено из index.html (секция «0. utils») без изменений.
   Загружается до основного скрипта; зависящие от состояния S функции
   (money, amt, sow, dayLabel) читают S в момент вызова, как и раньше. */
/* ═══════════════════════════════ 0. utils ═══════════════════════════════ */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
/* ── ONYX unified haptics ─────────────────────────────────────────────
   Единый тактильный язык приложения. UI вызывает только haptic(level):
     'selection' — переключение категории/иконки/сегмента (очень лёгкий)
     'light'     — обычный tap (клавиша, чип, строка)
     'medium'    — заметное подтверждение (свайп открыт, swap счетов)
     'success'   — сохранение/создание завершено
     'warning'   — destructive confirm открыт / удаление подтверждено
     'error'     — неверный PIN / невозможное действие
   Для обратной совместимости принимаются и старые числа (мс) — они
   маппятся на ближайший уровень. Прямой navigator.vibrate вне этого
   модуля запрещён.
   Платформы: Android/десктоп — navigator.vibrate; iOS Safari/PWA его
   не даёт — тихий no-op без ошибок (iOS сама даёт системный haptic
   на нативных <select>/wheels, мы с ней не конкурируем).
   reduced-motion: selection/light подавляются, остальные — до 1 импульса.
   selection троттлится: не чаще 1 раза в 50мс (защита от спама при
   быстром скролле карусели категорий). */
const HAPTIC_PATTERNS = {
  selection: 6,
  light: 8,
  medium: 12,
  success: [10, 40, 10],
  warning: 18,
  error: [25, 50, 25]
};
const __hapticState = { lastSelection: 0, lastAny: 0 };
function __hapticReduced() {
  try { return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; }
}
function __hapticFire(pattern) {
  try {
    if (typeof navigator === 'undefined' || !navigator.vibrate) return false;
    return !!navigator.vibrate(pattern);
  } catch (e) { return false; }
}
const haptic = (level = 'light') => {
  /* legacy: haptic(ms) — маппим число на уровень */
  if (typeof level === 'number' && isFinite(level)) {
    const ms = level;
    level = ms <= 5 ? 'selection' : ms <= 9 ? 'light' : ms <= 12 ? 'medium' : ms <= 25 ? 'warning' : 'error';
    /* старые точные вызовы 10/12 (confirm/save) сохраняют ощущение успеха */
    if (ms === 10 || ms === 12) level = 'success';
    if (ms >= 30) level = 'error';
  }
  if (typeof level !== 'string' || !HAPTIC_PATTERNS[level]) level = 'light';
  const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
  /* selection: не чаще раза в 50мс — скролл карусели даёт haptic только
     на реальный переход к новой категории, без пулемёта */
  if (level === 'selection') {
    if (now - __hapticState.lastSelection < 50) return false;
    __hapticState.lastSelection = now;
  }
  /* глобальный предохранитель: не чаще раза в 25мс для любых уровней */
  if (now - __hapticState.lastAny < 25 && level !== 'error') return false;
  __hapticState.lastAny = now;
  let pattern = HAPTIC_PATTERNS[level];
  if (__hapticReduced()) {
    if (level === 'selection' || level === 'light') return false;
    pattern = 8;
  }
  return __hapticFire(pattern);
};
/* явный предикат для кода, которому нужно знать о поддержке (тесты/фолбэки) */
const hapticSupported = () => {
  try { return typeof navigator !== 'undefined' && !!navigator.vibrate; } catch (e) { return false; }
};
/**
 * Округление числа до 2 знаков после запятой (копейки/центы).
 * Компенсирует неточности floating-point через Number.EPSILON,
 * корректно обрабатывает отрицательные числа и возвращает число (Number).
 */
const round2 = value => {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return (n < 0 ? -1 : 1) * (Math.round((Math.abs(n) + Number.EPSILON) * 100) / 100);
};
if (typeof window !== 'undefined') window.round2 = round2;
/* ---------- Lucide icon engine (официальные Lucide SVG, локальный subset) ----------
   Единый реестр: LUCIDE_SVG (domain/icons-data.js) + ICON_MIGRATION_MAP для старых ID.
   Стиль: оригинальные Lucide SVG, viewBox 0 0 24 24, stroke currentColor, width 2, round caps/joins.
   Без CDN, offline/PWA: только используемые иконки, инлайн в registry. */
const LUCIDE_FALLBACK = '<circle cx="12" cy="12" r="10"></circle><line x1="4.9" x2="19.1" y1="4.9" y2="19.1"></line>';

function getLucideEntry(n) {
  const icons = (typeof LUCIDE_SVG !== 'undefined' ? LUCIDE_SVG : (typeof window !== 'undefined' && window.LUCIDE_SVG) ? window.LUCIDE_SVG : null);
  const mig = (typeof ICON_MIGRATION_MAP !== 'undefined' ? ICON_MIGRATION_MAP : (typeof window !== 'undefined' && window.ICON_MIGRATION_MAP) ? window.ICON_MIGRATION_MAP : null);
  if (!icons) return LUCIDE_FALLBACK;
  if (icons[n]) return icons[n];
  if (mig && mig[n] && icons[mig[n]]) return icons[mig[n]];
  return LUCIDE_FALLBACK;
}

/* Центральный резолвер Lucide ID (новый набор + миграция старых). */
function resolveLucide(n, fb) {
  const fbIcon = fb || 'circle-slash';
  if (!n) return fbIcon;
  if (typeof LUCIDE_SVG !== 'undefined' && LUCIDE_SVG[n]) return n;
  if (typeof window !== 'undefined' && window.LUCIDE_SVG && window.LUCIDE_SVG[n]) return n;
  const mig = (typeof ICON_MIGRATION_MAP !== 'undefined' ? ICON_MIGRATION_MAP : (typeof window !== 'undefined' && window.ICON_MIGRATION_MAP) ? window.ICON_MIGRATION_MAP : null);
  if (mig && mig[n]) return mig[n];
  return fbIcon;
}

function lucidePascal(n) { return n.replace(/(^|-)([a-z])/g, (m, p, c) => c.toUpperCase()); }

window.lucide = {
  get icons() {
    const icons = (typeof LUCIDE_SVG !== 'undefined' ? LUCIDE_SVG : (typeof window !== 'undefined' && window.LUCIDE_SVG)) || {};
    return Object.fromEntries(Object.keys(icons).map(n => [lucidePascal(n), true]));
  },
  createIcons: function (root) {
    (root && root.querySelectorAll ? root : document).querySelectorAll('[data-lucide],[data-icon]').forEach(el => {
      if (el.tagName.toLowerCase() === 'svg') return;
      const n = el.getAttribute('data-icon') || el.getAttribute('data-lucide') || 'circle-slash';
      const inner = getLucideEntry(n);
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      svg.setAttribute('width', '20');
      svg.setAttribute('height', '20');
      svg.setAttribute('viewBox', '0 0 24 24');
      svg.setAttribute('fill', 'none');
      svg.setAttribute('stroke', 'currentColor');
      svg.setAttribute('stroke-width', '2');
      svg.setAttribute('stroke-linecap', 'round');
      svg.setAttribute('stroke-linejoin', 'round');
      svg.setAttribute('shape-rendering', 'geometricPrecision');
      svg.style.shapeRendering = 'geometricPrecision';
      for (let i = 0; i < el.attributes.length; i++) {
        const a = el.attributes[i];
        if (a.name === 'width' || a.name === 'height') continue;
        if (!svg.hasAttribute(a.name)) svg.setAttribute(a.name, a.value);
        if (a.name === 'class' && a.value.includes('ic-s')) { svg.setAttribute('width','16'); svg.setAttribute('height','16'); }
        if (a.name === 'class' && a.value.includes('ic-l')) { svg.setAttribute('width','24'); svg.setAttribute('height','24'); }
      }
      const cl = el.getAttribute('class')||'';
      if (cl.includes('ic-s')) { svg.setAttribute('width','16'); svg.setAttribute('height','16'); }
      else if (cl.includes('ic-l')) { svg.setAttribute('width','24'); svg.setAttribute('height','24'); }
      else if (cl.includes('ic') && !cl.includes('ic-s') && !cl.includes('ic-l')) { svg.setAttribute('width','20'); svg.setAttribute('height','20'); }
      svg.innerHTML = inner;
      el.replaceWith(svg);
    });
  }
};

const icons = (root) => { try { window.lucide && window.lucide.createIcons(root); } catch (e) {} };

function svgIcon(name, cls, size) {
  const n = name || 'circle-slash';
  const inner = getLucideEntry(n);
  const c = cls || 'ic';
  const s = size || (c.includes('ic-s') ? 16 : c.includes('ic-l') ? 24 : 20);
  const vb = '0 0 24 24';
  return '<svg xmlns="http://www.w3.org/2000/svg" class="' + c + '" width="' + s + '" height="' + s + '" viewBox="' + vb + '" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" shape-rendering="geometricPrecision">' + inner + '</svg>';
}

const sum = a => a.reduce((x, y) => x + y, 0);
const ARR_IN = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M17 7.5L7 17.5M17 15.5V7.5H9"></path></svg>';
const ARR_OUT = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ff8904" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M16.5 7.5L6.5 17.5M14.5 17.5H6.5V9.5"></path></svg>';
/* иконка «Все счета» — официальный Lucide wallet (локальный registry, без CDN). */
const ALL_ACC_IC = '<svg class="ic ic-18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" shape-rendering="geometricPrecision"><path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"></path><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"></path></svg>';
/* ---------- hex/rgb color helpers (used by account/category/goal color pickers) ---------- */
function normalizeHex(s) {
  s = String(s || '').trim().replace(/^#/, '');
  if (/^[0-9a-fA-F]{3}$/.test(s)) s = s.split('').map(c => c + c).join('');
  if (!/^[0-9a-fA-F]{6}$/.test(s)) return null;
  return '#' + s.toUpperCase();
}
function hexToRgb(hex) {
  const h = normalizeHex(hex) || '#8F8F97';
  return { r: parseInt(h.slice(1, 3), 16), g: parseInt(h.slice(3, 5), 16), b: parseInt(h.slice(5, 7), 16) };
}
function rgbToHex(r, g, b) {
  const c = v => clamp(Math.round(+v || 0), 0, 255).toString(16).padStart(2, '0');
  return ('#' + c(r) + c(g) + c(b)).toUpperCase();
}
function hexToRgba(hex, a) {
  hex = String(hex || '').replace('#', '');
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  if (!/^[0-9a-fA-F]{6}$/.test(hex)) hex = '10b981';
  const n = parseInt(hex, 16);
  return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')';
}
function isLight(hex) {
  hex = String(hex || '').replace('#', '');
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  if (!/^[0-9a-fA-F]{6}$/.test(hex)) return false;
  const n = parseInt(hex, 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  return (r * 299 + g * 587 + b * 114) / 255000 > 0.65;
}
function oklchToHex(s) {
  const m = /oklch\(\s*([\d.]+%?)\s+([\d.]+)\s+([\d.]+)\s*\)/i.exec(String(s || '').trim());
  if (!m) return null;
  let L = parseFloat(m[1]);
  if (m[1].indexOf('%') > -1) L /= 100;
  else if (L > 1) L /= 100;
  const C = parseFloat(m[2]), H = parseFloat(m[3]) * Math.PI / 180;
  const a = C * Math.cos(H), b = C * Math.sin(H);
  const l = Math.cbrt(L + 0.3963377774 * a + 0.2158037573 * b);
  const mm = Math.cbrt(L - 0.1055613458 * a - 0.0638541728 * b);
  const ss = Math.cbrt(L - 0.0894841775 * a - 1.2914855480 * b);
  const r = 4.0767416621 * l - 3.3077115913 * mm + 0.2309699292 * ss;
  const g = -1.2684380046 * l + 2.6097574011 * mm - 0.3413193965 * ss;
  const bb = -0.0041960863 * l - 0.7034186147 * mm + 1.7076147010 * ss;
  const gamma = v => { v = clamp(v, 0, 1); return v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055; };
  const ch = v => Math.round(gamma(v) * 255).toString(16).padStart(2, '0');
  return '#' + ch(r) + ch(g) + ch(bb);
}

/* ---------- security: PIN-код хеширование (SHA-256 + salt) ---------- */
const PIN_SALT = 'onyx_salt_v1_secure_pin';
async function hashPin(pin) {
  if (!pin) return '';
  const s = String(pin).trim();
  if (typeof crypto !== 'undefined' && crypto.subtle && typeof TextEncoder !== 'undefined') {
    const data = new TextEncoder().encode(PIN_SALT + ':' + s);
    const buf = await crypto.subtle.digest('SHA-256', data);
    return 'sha256:' + Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  }
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return 'fnv:' + (h >>> 0).toString(16);
}

async function verifyPin(enteredCode, storedPin) {
  if (!storedPin) return true;
  const entered = String(enteredCode || '').trim();
  const stored = String(storedPin || '').trim();
  /* Обратная совместимость: если пароль был сохранён открытым текстом (например 4 цифры) */
  if (/^\d{4}$/.test(stored)) {
    if (entered === stored) {
      /* Прозрачная миграция в фоне на SHA-256 */
      try {
        const hashed = await hashPin(entered);
        if (typeof Store !== 'undefined' && Store.updateSetting) {
          Store.updateSetting('pin', hashed);
        }
      } catch (e) {}
      return true;
    }
    return false;
  }
  const hashed = await hashPin(entered);
  return hashed === stored;
}

/* ---------- shared form presets (used by account/category/goal form screens) ---------- */
const FORM_COLORS = ['#ffffff', '#fb2c36', '#ff6902', '#fe9900', '#eeb100', '#7dd002', '#00c951', '#00bd7d', '#00bbaa', '#03b5db', '#00a5f5', '#2b7efe', '#6260ff', '#8d51ff', '#ac46ff', '#e22afc', '#f6339b', '#ff2157'];

function hexable(c) {
  c = String(c || '').trim();
  if (/^#[0-9a-fA-F]{6}$/.test(c)) return c.toLowerCase();
  if (/^oklch\(/i.test(c)) return oklchToHex(c);
  if (typeof document !== 'undefined' && document.createElement) {
    try {
      const p = document.createElement('span');
      p.style.display = 'none'; p.style.color = c;
      document.body.appendChild(p);
      const rgb = getComputedStyle(p).color;
      p.remove();
      const m = /rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/.exec(rgb);
      if (m) return '#' + [m[1], m[2], m[3]].map(v => (+v).toString(16).padStart(2, '0')).join('');
    } catch (e) {}
  }
  return null;
}

