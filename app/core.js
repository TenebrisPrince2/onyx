/* app/core.js — ядро приложения (секции «1. data» … «4. ui») — перенесено из inline-скрипта
   index.html байт-в-байт (Этап 2). Загружается ПОСЛЕ screens/* (нужен их DOM-хелперы)
   и ДО app/events.js, как раньше завершался inline-скрипт. */
"use strict";
/* ═══════════════════════════════ 1. data ═══════════════════════════════ */
const ICON_SETS = [
  ['Еда', ['shopping-basket', 'utensils', 'coffee', 'cake', 'apple', 'beer', 'sandwich', 'ice-cream-cone', 'milk', 'wine', 'cookie', 'soup', 'pizza', 'egg', 'cherry', 'banana', 'orange', 'pear']],
  ['Фастфуд', ['hamburger', 'pizza', 'sandwich', 'beer', 'cocktail', 'ice-cream-cone', 'milk', 'cookie', 'cake', 'coffee', 'wine', 'soup']],
  ['Транспорт', ['car-front', 'bus', 'train-front', 'bike', 'plane', 'fuel', 'ship', 'truck', 'map-pin', 'navigation', 'ticket', 'car', 'taxi', 'tram-front', 'subway', 'boat', 'motorcycle', 'rocket']],
  ['Дом', ['home', 'lightbulb', 'droplets', 'flame', 'wifi', 'sofa', 'wrench', 'key', 'trash-2', 'shower-head', 'lamp', 'bed', 'oven', 'radiator', 'armchair', 'air-vent']],
  ['Здоровье', ['heart-pulse', 'pill', 'stethoscope', 'syringe', 'brain', 'glasses', 'bandage', 'microscope', 'bone']],
  ['Спорт', ['dumbbell', 'activity', 'football', 'basketball', 'volleyball', 'medal', 'trophy', 'timer', 'person-standing', 'heart-pulse']],
  ['Развлечения', ['popcorn', 'film', 'music', 'gamepad-2', 'book', 'palette', 'camera', 'party-popper', 'tv', 'headphones', 'guitar', 'mic', 'drama', 'clapperboard']],
  ['Покупки', ['shopping-bag', 'shirt', 'watch', 'gem', 'package', 'gift', 'store', 'baby', 'dog', 'flower', 'shopping-cart', 'tags', 'handbag', 'crown']],
  ['Красота', ['scissors', 'sparkles', 'bath', 'droplet', 'spray-can', 'flower', 'heart', 'star', 'gem', 'hand']],
  ['Образование', ['graduation-cap', 'book', 'book-open', 'pencil', 'library', 'school', 'backpack', 'clipboard-check']],
  ['Работа', ['briefcase', 'users', 'building-2', 'presentation', 'file-text', 'folder', 'inbox', 'badge-check', 'id-card', 'fingerprint', 'building', 'hand-coins']],
  ['Путешествия', ['plane', 'plane-takeoff', 'luggage', 'tent', 'compass', 'map', 'mountain', 'sun', 'palmtree', 'trees', 'navigation', 'map-pin']],
  ['Финансы', ['wallet', 'credit-card', 'banknote', 'piggy-bank', 'landmark', 'coins', 'receipt', 'percent', 'trending-up', 'trending-down', 'hand-coins', 'briefcase']],
  ['Техника', ['smartphone', 'laptop', 'tv', 'monitor', 'cpu', 'hard-drive', 'printer', 'tablet', 'battery-charging', 'plug-zap', 'headphones', 'camera', 'watch']],
  ['Ремонт', ['hammer', 'wrench', 'paintbrush', 'ruler', 'axe', 'pickaxe', 'cog', 'hard-hat', 'paint-roller', 'shield']],
  ['Сад', ['leaf', 'sprout', 'flower-2', 'shovel', 'sun', 'trees', 'wind', 'bug', 'droplet', 'bee']],
  ['Праздники', ['party-popper', 'gift', 'cake', 'balloon', 'star', 'sparkles', 'music', 'crown', 'heart']],
  ['Питомцы', ['dog', 'cat', 'bird', 'fish', 'paw-print', 'rabbit', 'turtle', 'bone']],
  ['Связь', ['phone', 'phone-call', 'wifi', 'signal', 'radio', 'mail', 'send', 'message-circle', 'messages-square', 'smartphone']],
  ['Прочее', ['refresh-cw', 'star', 'heart', 'flag', 'shield', 'circle-slash', 'ellipsis', 'infinity', 'link', 'globe', 'moon', 'zap']]
];
const iconSet = arr => {
  try {
    const r = window.lucide && window.lucide.icons;
    if (!r || typeof r !== 'object') return arr;
    return arr.filter(n => r[n]);
  } catch (e) { return arr; }
};
/* SECURITY: дефолтный endpoint пуст — пользователь сам задаёт свой OpenAI-совместимый API.
   Сторонний прокси по умолчанию (chatanywhere) убран: финансовые данные не должны уходить
   на третий сервис, пока пользователь явно не настроит endpoint в настройках ИИ. */
const DEF_AI = () => ({ endpoint: '', key: '', model: 'gpt-4o-mini' });
const DEF_SETTINGS = {
  currency: 'BYN', firstDay: 1, roundTotals: false, calculator: true, alwaysShowIncome: false,
  transferAsIO: false, adjustAsIO: false, hideAmounts: false,
  quickTypes: ['expense', 'income', 'transfer', 'adjust'], reminder: { enabled: false, time: '20:00' },
  pin: '', lastBackup: null, demo: true,
  customPeriods: [], statsExcluded: [], ai: DEF_AI()
};
let S = null;
/* ── системные защищённые счета: подушка (фин. здоровье) + накопления (покупки) ──
   нельзя удалить/изменить; наполняются переводами, видны в общем балансе */
function ensureSysAccounts() {
  let changed = false;
  SYS_ACC_DEFS.forEach(def => {
    if (S.accounts.some(a => a.id === def.id || a.system === def.system)) return;
    S.accounts.push(Object.assign({ currency: S.settings.currency, initial: 0, inTotal: true, order: 900 + SYS_ACC_DEFS.indexOf(def), archived: false }, def));
    changed = true;
  });
  if (changed) { try { save(); } catch (e) {} }
}
/* icon names of the category form screen -> lucide names (for tiles/chips across the app) */
const CAT_LUCIDE = {
  'apple':'apple','bottle':'bottle','candy':'candy','chef':'chef','coffee':'coffee','meat':'meat','skewer':'skewer','salad':'salad','cutlery':'utensils',
  'eggFried':'egg-fried','noodles':'noodles','cherry':'cherry','egg':'egg','burger':'hamburger','chili':'chili','sandwich':'sandwich','wine':'wine',
  'banana':'banana','cake':'cake','carrot':'carrot','cup':'cup','cloche':'cloche','pot':'pot','basket':'shopping-basket','beer':'beer','slice':'slice',
  'cheese':'cheese','croissant':'croissant','grapes':'grapes','icecream':'ice-cream-cone','pizza':'pizza','strawberry':'strawberry','cookie':'cookie',
  'tea':'tea','car':'car-front','bus':'bus','plane':'plane','train':'train-front','fuel':'fuel','parking':'parking','bike':'bike','bolt':'zap',
  'taxi':'taxi','truck':'truck','ship':'ship','rocket':'rocket','home':'home','bulb':'lightbulb','key':'key','sofa':'sofa','drop':'droplets',
  'wrench':'wrench','wifi':'wifi','cloud':'cloud','heartPulse':'heart-pulse','pill':'pill','steth':'stethoscope','heart':'heart','leaf':'leaf',
  'baby':'baby','dumbbell':'dumbbell','trophy':'trophy','target':'target','gamepad':'gamepad-2','film':'film','music':'music','ticket':'ticket',
  'star':'star','dice':'dice','bag':'shopping-bag','cart':'shopping-cart','tag':'tags','gift':'gift','shirt':'shirt','scissors':'scissors',
  'flower':'flower','sparkle':'sparkles','book':'book','cap':'graduation-cap','laptop':'laptop','briefcase':'briefcase','mail':'mail','calc':'calculator',
  'map':'map','hotel':'hotel','wallet':'wallet','banknote':'banknote','card':'credit-card','coins':'coins','bank':'landmark','trend':'trending-up',
  'percent':'percent','phone':'phone','headphones':'headphones','watch':'watch','tools':'wrench','seedling':'sprout','tree':'tree','party':'party-popper',
  'paw':'paw-print','bone':'bone','fish':'fish','globe':'globe','moon':'moon','sun':'sun','info':'info','slash':'circle-slash','plus':'plus',
  'check':'check','arrow-up-right':'arrow-up-right','arrow-down-left':'arrow-down-left','palette':'palette','x':'x'
};
const LUCIDE2CAT = {};
Object.keys(CAT_LUCIDE).forEach(k => { LUCIDE2CAT[CAT_LUCIDE[k]] = k; });
const catLuc = n => CAT_LUCIDE[n] || n || 'circle-slash';
/* ---------- extra brand icons (stroke style) ---------- */
const EXTRA_BRANDS = {
  'telegram': ['M21 3L10.5 14.5', 'M21 3L3 10.5l7 2.8', 'M21 3l-3 16.5-7.5-5'],
  'whatsapp': ['M12 3.5C6.2 3.5 2 7.3 2 11.9c0 2.3 1 4.4 2.8 5.9L4 20.5l3-1.1c1.5.8 3.2 1.2 5 1.2 5.8 0 10-3.8 10-8.4S17.8 3.5 12 3.5Z', 'M9.2 9c.4 2.4 2.6 4.8 5 5.1l1.3.1c.5 0 .8-.4.8-1l-.3-1.2c-.1-.5-.6-.7-1-.5l-.5.2c-.4.2-.9.1-1.3-.3l-1.4-1.4c-.4-.4-.5-.9-.3-1.3l.2-.5c.2-.4 0-.9-.5-1l-1.2-.3c-.6-.1-1 .2-1 .7l.2.9Z'],
  'discord': ['M6.5 8.5h11a3 3 0 0 1 3 3v2.5a3 3 0 0 1-3 3H17l-1.6 1.8h-2.3L12 17.2l-1.1 1.6H8.6L7 17h-.5a3 3 0 0 1-3-3v-2.5a3 3 0 0 1 3-3Z', 'M8.8 12.2h.01M15.2 12.2h.01', 'M10.2 14.2c.6.5 1.4.8 2 .8s1.4-.3 2-.8'],
  'tiktok': ['M14.5 4.5v9.2a3.2 3.2 0 1 1-3.2-3.2', 'M14.5 4.5c.6 2.3 2.4 3.7 4.5 4.2', 'M16.2 10.2c.6.8 1 1.7 1.1 2.7', 'M18.3 8.3c1.2 1.3 1.9 2.9 2 4.8'],
  'vk': ['M4.5 9A2.5 2.5 0 0 1 7 6.5h10A2.5 2.5 0 0 1 19.5 9v4a2.5 2.5 0 0 1-2.5 2.5h-7.5L6 19v-3.5h-1A2.5 2.5 0 0 1 2.5 13V9Z', 'M6.8 11l1.6 3M8.4 14l1.6-3', 'M12.5 11v3', 'M12.5 12.5l2.4-1.6', 'M12.5 12.5l2.4 1.6'],
  'spotify': ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z', 'M7.8 10.3c2.8-.8 5.6-.9 8.4-.2', 'M8.4 13.5c2.4-.6 4.8-.7 7.2 0', 'M9 16.6c2-.4 4-.5 6 0'],
  'netflix': ['M7 4v16', 'M17 4v16', 'M17 4L7 20'],
  'steam': ['M12 20.5a8.5 8.5 0 1 0 0-17 8.5 8.5 0 0 0 0 17Z', 'M12 8.5a3.5 3.5 0 0 1 3.5 3.5c0 1.9-1.5 3.5-3.5 3.5-1.4 0-2.5-.9-2.9-2.1', 'M16.9 15.5c1.4-.6 2.3-1.9 2.6-3.4'],
  'xbox': ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z', 'M9 9l6 6M15 9l-6 6'],
  'playstation': ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z', 'M8.2 17.5v-9.5h3a3.2 3.2 0 0 1 0 6.4H8.2'],
  'amazon': ['M5 13.5a7 7 0 0 1 14 0', 'M18.9 17.9c1.2-.9 2-2.2 2.4-3.7', 'M18.9 17.9l2.2.1-1.1-1.9'],
  'apple-logo': ['M12 20.5c-4.3 0-7.8-2.4-7.8-5.7 0-2.4 1.7-4.5 4.1-5C9.5 6.4 10.6 4.5 12 4.5c1.4 0 2.5 1.9 3.7 5.3 2.4.5 4.1 2.6 4.1 5 0 3.3-3.5 5.7-7.8 5.7Z', 'M12 5.2c1.6-.6 2.7-1.7 3.2-3.2', 'M15.9 14.9a1.9 1.9 0 0 0 .6-2.5']
};
try {
  const __L = window.lucide;
  if (__L && __L.icons) {
    const pascal = n => String(n).split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('');
    const extra = {};
    Object.keys(EXTRA_BRANDS).forEach(n => { extra[pascal(n)] = EXTRA_BRANDS[n]; });
    Object.keys(extra).forEach(k => { if (__L.icons && typeof __L.icons === 'object') __L.icons[k] = true; });
    const orig = __L.createIcons;
    __L.createIcons = function (opts) {
      try {
        /* PERF: брендовые <i> обрабатываем первыми, внутри переданного root (не во всём
           документе); затем базовый движок — он пропускает уже заменённые <svg>, дублей нет */
        (opts && opts.querySelectorAll ? opts : document).querySelectorAll('[data-lucide]').forEach(el => {
          if (el.tagName.toLowerCase() === 'svg') return;
          const name = el.getAttribute('data-lucide');
          if (!name || !extra[pascal(name)]) return;
          const paths = extra[pascal(name)].map(d => '<path d="' + d + '"></path>').join('');
          const cls = 'lucide lucide-' + name + (el.getAttribute('class') ? ' ' + el.getAttribute('class') : '');
          const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="' + cls + '" data-lucide="' + name + '">' + paths + '</svg>';
          const tmp = document.createElement('div');
          tmp.innerHTML = svg;
          if (el.parentNode) el.parentNode.replaceChild(tmp.firstChild, el);
        });
      } catch (e2) {}
      if (orig) orig(opts);
    };
  }
} catch (e) {}
/* ═══════════════════════════════ 2. ui primitives ═══════════════════════════════ */
function toast(msg, action, opts) {
  opts = opts || {};
  const icon = opts.icon || (opts.tone === 'danger' ? 'circle-alert' : 'check');
  const tone = opts.tone === 'danger' ? 'var(--danger)' : 'var(--t2)';
  const host = $('#toasts');
  const el = document.createElement('div');
  el.className = 'toast';
  el.style.setProperty('--c', tone);
  const isHTML = /<[^>]+>/.test(String(msg));
  let content = msg;
  if (!isHTML) {
    content = esc(String(msg));
  } else {
    // allow safe money() output (<i class="nbrb-icon">) and svg, escape others
    const held = [];
    const tmpMsg = String(msg).replace(/<(?:svg[\s\S]*?\/svg|i class="nbrb-icon"[^>]*>.*?<\/i>)/g, s => { held.push(s); return '\uE000' + held.length + '\uE001'; });
    const escaped = esc(tmpMsg);
    content = escaped.replace(/\uE000(\d+)\uE001/g, (m,k)=> held[+k-1] || '');
  }
  el.innerHTML = '<span class="toast__ic"><i data-lucide="' + icon + '" class="ic"></i></span><span style="flex:1">' + content + '</span>' + (action ? '<button type="button">' + esc(action.label) + '</button>' : '');
  host.appendChild(el);
  icons(el);
  let killed = false;
  const kill = () => { if (killed) return; killed = true; el.classList.add('out'); setTimeout(() => el.remove(), 260); };
  el.onclick = e => { if (!e.target.closest('button')) kill(); };
  if (action) el.querySelector('button').onclick = e => { e.stopPropagation(); action.fn(); kill(); };
  setTimeout(kill, action ? 5200 : 2800);
  return kill;
}
function ripple(e, el) {
  if (!el) return;
  /* ripple-спан обязан жить в position:relative + overflow:hidden своего же элемента,
     иначе absolute уедет к случайному позиционированному предку (баг кнопки периода) */
  if (getComputedStyle(el).position === 'static') {
    el.style.position = 'relative';
    el.style.overflow = 'hidden';
  }
  const r = el.getBoundingClientRect(), s = Math.max(r.width, r.height);
  if (!s) return;
  const px = e.clientX || r.left + r.width / 2, py = e.clientY || r.top + r.height / 2;
  const sp = document.createElement('span');
  sp.className = 'rip';
  sp.style.cssText = 'width:' + s + 'px;height:' + s + 'px;left:' + (px - r.left - s / 2) + 'px;top:' + (py - r.top - s / 2) + 'px';
  el.appendChild(sp);
  sp.addEventListener('animationend', () => sp.remove(), { once: true });
  setTimeout(() => sp.remove(), 700);
}
document.addEventListener('pointerdown', e => {
  const ccp = e.target.closest('.ccp__item');
  if (ccp) { ripple(e, ccp.querySelector('.ccp__tile') || ccp); return; }
  const el = e.target.closest('.key,.iconbtn,.fab,.sw__act,.sw__del,.lockpad button,.chip,.btn,.item,.swatch,.quick button,.pnav__label,.sv__btn,.gp-plus,.gp-x-ok');
  if (el) ripple(e, el);
}, { passive: true });
/* iOS/zoom guards: no pinch, no double-tap zoom, no rubber-band on body */
['gesturestart', 'gesturechange', 'gestureend'].forEach(ev => document.addEventListener(ev, e => e.preventDefault(), { passive: false }));
document.addEventListener('dblclick', e => e.preventDefault(), { passive: false });

/* sheet */
let sheetStack = [];
function openSheet(o) {
  const scrim = document.createElement('div'); scrim.className = 'scrim';
  const sh = document.createElement('div'); sh.className = 'sheet' + (o.full ? ' sheet--full' : '') + (o.dark ? ' sheet--dark' : '');
  sh.innerHTML = (o.hideGrab ? '' : '<div class="sheet__grab"><i></i></div>') +
    (o.title ? '<div class="sheet__hd"><h3>' + esc(o.title) + '</h3>' + (o.action || '') + '</div>' : '') +
    '<div class="sheet__bd">' + o.html + '</div>';
  $('#overlays').append(scrim, sh);
  icons(sh);
  const rec = { scrim, sh, onClose: o.onClose };
  sheetStack.push(rec);
  requestAnimationFrame(() => { scrim.classList.add('in'); sh.classList.add('in'); });
  scrim.onclick = () => closeSheet();
  const grab = sh.querySelector('.sheet__grab');
  if (grab) dragDismiss(sh, grab, () => closeSheet());
  if (o.mount) o.mount(sh);
  return rec;
}
function closeSheet() {
  const rec = sheetStack.pop(); if (!rec) return false;
  rec.sh.classList.remove('in'); rec.scrim.classList.remove('in');
  setTimeout(() => { rec.sh.remove(); rec.scrim.remove(); }, 320);
  if (rec.onClose) rec.onClose();
  return true;
}
function dragDismiss(sh, handle, close) {
  let y0 = 0, dy = 0, on = false;
  handle.addEventListener('pointerdown', e => { on = true; y0 = e.clientY; dy = 0; sh.classList.add('dragging'); handle.setPointerCapture(e.pointerId); });
  handle.addEventListener('pointermove', e => { if (!on) return; dy = Math.max(0, e.clientY - y0); sh.style.transform = 'translateY(' + dy + 'px)'; });
  const end = () => { if (!on) return; on = false; sh.classList.remove('dragging'); sh.style.transform = ''; if (dy > 90) { haptic(); close(); } };
  handle.addEventListener('pointerup', end); handle.addEventListener('pointercancel', end);
}
/* unified Confirm — liquid-glass-strong, z-index поверх fullsheet/bs-host (95/96),
   монтируется последним элементом #overlays, поэтому виден сразу над любой формой */
function confirmSheet(o) {
  return new Promise(res => {
    let done = false;
    const hasEntity = !!(o.entityName || o.icon);
    const entityHTML = hasEntity ? '<div class="cf__entity">' +
      (o.icon ? '<span class="tile" style="--c:' + (o.color || 'var(--t2)') + '"><i data-lucide="' + o.icon + '" class="ic"></i></span>' : '') +
      '<span class="cf__name">' + esc(o.entityName || o.entity || '') + '</span></div>' : '';
    openSheet({
      title: '',
      hideGrab: true,
      html: '<div class="cf">' +
        '<span class="cf__badge"><i data-lucide="' + (o.badgeIcon || 'trash-2') + '" class="ic"></i></span>' +
        '<h3 class="cf__title">' + esc(o.title || 'Подтвердите действие') + '</h3>' +
        (o.hint || o.text ? '<p class="cf__hint">' + esc(o.hint || o.text) + '</p>' : '') +
        entityHTML +
        '<div class="cf__actions">' +
        '<button class="cf__cancel" data-x="0" type="button">Отмена</button>' +
        '<button class="cf__ok" data-x="1" type="button">' + esc(o.ok || 'Удалить') + '</button></div></div>',
      mount(sh) {
        const sheet = sh.closest('.sheet') || sh;
        sheet.classList.add('sheet--confirm');
        sh.style.paddingBottom = '0';
        icons(sheet);
        haptic(10);
        sh.querySelectorAll('[data-x]').forEach(b => b.onclick = () => {
          done = true;
          const isOk = b.dataset.x === '1';
          haptic(isOk ? 12 : 6);
          if (isOk) { try { b.animate([{ transform: 'scale(1)' }, { transform: 'scale(.95)' }, { transform: 'scale(1)' }], { duration: 180, easing: 'ease-out' }); } catch (e) {} }
          res(isOk);
          closeSheet();
        });
      },
      onClose() { if (!done) res(false); }
    });
  });
}
/* screens */
const nav = [];
function pushScreen(o) {
  const el = document.createElement('div');
  el.className = 'screen' + (o.push ? ' push' : '');
  if (o.id) el.id = o.id;
  el.innerHTML = o.html;
  $('#overlays').appendChild(el);
  icons(el);
  const rec = { el, id: o.id, refresh: o.refresh };
  nav.push(rec);
  if (!o.push) $('#phone').classList.add('behind');
  requestAnimationFrame(() => el.classList.add('in'));
  if (o.mount) o.mount(el);
  history.pushState({ depth: nav.length }, '');
  return rec;
}
let suppressPopstate = false;
function popScreen(fromHistory) {
  const rec = nav.pop(); if (!rec) return false;
  if (rec.dispose) rec.dispose();
  rec.el.classList.remove('in');
  setTimeout(() => {
    rec.el.remove();
    /* PERF/память: экран удалён — сбрасываем ссылки на его открытые swipe-ряды,
       чтобы отсоединённое поддерево не удерживалось глобальным состоянием
       (тот же паттерн очистки, что в render()) */
    if (openRow && !openRow.isConnected) openRow = null;
    if (delOpenRow && !delOpenRow.isConnected) delOpenRow = null;
  }, 320);
  if (!nav.some(r => !r.el.classList.contains('push'))) $('#phone').classList.remove('behind');
  if (!fromHistory) { suppressPopstate = true; history.back(); }
  return true;
}
window.addEventListener('popstate', () => {
  if (suppressPopstate) { suppressPopstate = false; return; }
  if (sheetStack.length) { closeSheet(); history.pushState({}, ''); return; }
  if (insOpen) { closeInsights(true); return; }
  if (nav.length) popScreen(true);
});
function refreshTop() { const r = nav[nav.length - 1]; if (r && r.refresh) r.refresh(); }

/* swipe rows */
let openRow = null;
function enableSwipe(root, once) {
  if (once) {
    if (root.__swipeBound) return;
    root.__swipeBound = true;
  }
  let el = null, body = null, x0 = 0, y0 = 0, dx = 0, lock = null, base = 0, actsW = 54;
  root.addEventListener('pointerdown', e => {
    const b = e.target.closest('.sw__body'); if (!b) return;
    el = b.closest('.sw'); body = b; x0 = e.clientX; y0 = e.clientY; dx = 0; lock = null;
    const acts = el ? el.querySelector('.sw__acts') : null;
    actsW = acts ? acts.offsetWidth : 54;
    base = el === openRow ? -actsW : 0;
  }, { passive: true });
  root.addEventListener('pointermove', e => {
    if (!el) return;
    const mx = e.clientX - x0, my = e.clientY - y0;
    if (lock === null) { if (Math.abs(mx) < 9 && Math.abs(my) < 9) return; lock = Math.abs(mx) > Math.abs(my) * 1.3 ? 'x' : 'y'; if (lock === 'x') el.classList.add('dragging'); }
    if (lock !== 'x') return;
    dx = clamp(base + mx, -(actsW + 24), 22);
    body.style.transform = 'translate3d(' + dx + 'px,0,0)';
  }, { passive: true });
  const end = () => {
    if (!el) return;
    el.classList.remove('dragging');
    if (lock === 'x') {
      const open = dx < -actsW * .45;
      if (openRow && openRow !== el) { const ob = openRow.querySelector('.sw__body'); if (ob) ob.style.transform = ''; }
      body.style.transform = open ? 'translate3d(' + (-actsW) + 'px,0,0)' : '';
      openRow = open ? el : null;
      if (open) haptic(6);
      body.dataset.swiped = open ? '1' : '';
    }
    el = null; body = null; actsW = 54;
  };
  root.addEventListener('pointerup', end); root.addEventListener('pointercancel', end);
}
/* swipe-to-delete — счета/категории/накопления: ось-лок на первых 12px,
   софт-порог 72px (ряд остаётся открытым), жёсткий 140px/флик — мгновенное
   удаление с тостом-отменой; не конфликтует со скроллом, тапами и reorder */
let delOpenRow = null;
function closeDelRow(row) {
  if (!row) return;
  const b = row.querySelector('.sw__body') || row.querySelector('.sv');
  if (b) b.style.transform = '';
  row.classList.remove('armed');
  if (delOpenRow === row) delOpenRow = null;
}
function collapseRow(row, cb) {
  if (!row || !row.isConnected) { if (cb) cb(); return; }
  row.style.height = row.offsetHeight + 'px';
  row.classList.add('gone');
  requestAnimationFrame(() => { row.style.height = '0px'; row.style.marginTop = '-6px'; });
  setTimeout(() => { if (cb) cb(); }, 250);
}
function enableDeleteSwipe(list, handlers, bodySel) {
  if (!list) return;
  if (list.__delBound) return;
  list.__delBound = true;
  bodySel = bodySel || '.sw__body';
  const ZONE = 86, OPEN = 72, HARD = 140, FLICK = -0.9;
  let row = null, body = null, x0 = 0, y0 = 0, t0 = 0, dx = 0, raw = 0, lock = null, base = 0;
  let lastX = 0, lastT = 0, vx = 0, moved = false;
  const reset = () => { row = null; body = null; lock = null; dx = 0; raw = 0; moved = false; vx = 0; };
  list.addEventListener('pointerdown', e => {
    if (e.button !== undefined && e.button !== 0) return;
    const b = e.target.closest(bodySel); if (!b) return;
    if (e.target.closest('[data-handle],.iconbtn,.sv__btn,.as__ck,.chip')) return;
    const r = b.closest('.sw'); if (!r || !list.contains(r) || r.classList.contains('sw--sys')) return;
    row = r; body = b;
    x0 = lastX = e.clientX; y0 = e.clientY;
    t0 = lastT = performance.now(); vx = 0; dx = 0; moved = false; lock = null;
    base = row === delOpenRow ? -ZONE : 0;
  }, { passive: true });
  list.addEventListener('pointermove', e => {
    if (!row) return;
    /* reorder(long-press) мог активироваться под пальцем — не мешаем */
    if (row.classList.contains('dragging') || row.style.touchAction === 'none') { reset(); return; }
    const mx = e.clientX - x0, my = e.clientY - y0;
    if (lock === null) {
      if (Math.abs(mx) < 12 && Math.abs(my) < 12) return;
      lock = Math.abs(mx) > my ? 'x' : 'y';
      if (lock === 'x') { row.classList.add('dragging'); if (delOpenRow && delOpenRow !== row) closeDelRow(delOpenRow); }
    }
    if (lock !== 'x') return;
    moved = true;
    const now = performance.now();
    if (now - lastT > 4) { vx = (e.clientX - lastX) / (now - lastT); lastX = e.clientX; lastT = now; }
    raw = base + mx;
    let shown = raw;
    if (shown < -(ZONE + 30)) shown = -(ZONE + 30) + (shown + ZONE + 30) * .45; /* резинка */
    dx = clamp(shown, -(ZONE + 78), 16);
    body.style.transform = 'translateX(' + dx + 'px)';
    row.classList.toggle('armed', dx < -OPEN * .6);
  }, { passive: true });
  const end = () => {
    if (!row) return;
    const r = row, b = body;
    const wasOpen = delOpenRow === r;
    row.classList.remove('dragging');
    if (lock === 'x') {
      if (raw <= -HARD || (vx < FLICK && raw < -40)) {
        /* жёсткая тяга / флик — мгновенное удаление */
        haptic(12);
        const id = r.dataset.id;
        reset(); delOpenRow = null;
        if (handlers.instant) handlers.instant(id, r);
        return;
      }
      if (dx <= -OPEN) {
        r.classList.add('armed');
        b.style.transform = 'translateX(' + (-ZONE) + 'px)';
        delOpenRow = r;
        b.dataset.swiped = '1';
        haptic(8);
      } else if (moved) {
        closeDelRow(r);
        b.dataset.swiped = '1';
        setTimeout(() => { if (b.isConnected) delete b.dataset.swiped; }, 350);
      } else {
        closeDelRow(r);
      }
    } else if (wasOpen) {
      /* чистый тап по открытому ряду — закрыть и не кликать */
      closeDelRow(r);
      b.dataset.swiped = '1';
      setTimeout(() => { if (b.isConnected) delete b.dataset.swiped; }, 350);
    }
    reset();
  };
  list.addEventListener('pointerup', end, { passive: true });
  list.addEventListener('pointercancel', () => { if (row && lock === 'x') { row.classList.remove('dragging'); closeDelRow(row); } reset(); }, { passive: true });
  /* тап по кнопке удаления в зоне */
  list.addEventListener('click', e => {
    const del = e.target.closest('.sw__del'); if (!del) return;
    e.stopPropagation();
    const r = del.closest('.sw');
    const id = del.dataset.id;
    haptic(8);
    if (handlers.ask) handlers.ask(id, r);
  });
}
/* удаление счёта из списка (свайп/кнопка) с отменой */
function swipeDeleteAccount(id, row) {
  const a = accById(id);
  if (!a) return;
  if (a.system) { toast('Системный счёт — его нельзя удалить', null, { tone: 'danger' }); closeDelRow(row); return; }
  if (S.accounts.filter(x => !x.archived).length <= 1) { toast('Нужен хотя бы один счёт', null, { tone: 'danger' }); closeDelRow(row); return; }
  const snap = JSON.parse(JSON.stringify(a));
  const txns = S.transactions.filter(t => t.accountId === id || t.toAccountId === id);
  collapseRow(row, () => {
    Store.deleteAccount(id);
    haptic(12); render(true); refreshTop();
  });
  toast('Счёт удалён', { label: 'Вернуть', fn: () => {
    Store.restoreAccount(snap, txns);
    render(true); refreshTop(); toast('Счёт восстановлен');
  } }, { icon: 'trash-2', tone: 'danger' });
}
async function swipeAskDeleteAccount(id, row) {
  const a = accById(id);
  if (!a) return;
  if (a.system) { toast('Системный счёт — его нельзя удалить', null, { tone: 'danger' }); closeDelRow(row); return; }
  if (S.accounts.filter(x => !x.archived).length <= 1) { toast('Нужен хотя бы один счёт', null, { tone: 'danger' }); closeDelRow(row); return; }
  const ok = await confirmSheet({ title: 'Удалить счёт', hint: 'Счёт и все его операции будут удалены', entityName: a.name, icon: a.icon, color: a.color, ok: 'Удалить', danger: true });
  if (!ok) { closeDelRow(row); return; }
  swipeDeleteAccount(id, row);
}
function swipeDeleteCategory(id, row) {
  const c = catById(id);
  if (!c) return;
  const snap = JSON.parse(JSON.stringify(c));
  const touched = S.transactions.filter(t => t.categoryId === id).map(t => ({ t, was: t.categoryId }));
  const kids = S.categories.filter(x => x.parentId === id);
  collapseRow(row, () => {
    Store.deleteCategory(id);
    haptic(12); render(true); refreshTop(); notifyCatsChanged();
  });
  toast('Категория удалена', { label: 'Вернуть', fn: () => {
    Store.restoreCategory(snap, kids, touched);
    render(true); refreshTop(); notifyCatsChanged(); toast('Категория восстановлена');
  } }, { icon: 'trash-2', tone: 'danger' });
}
async function swipeAskDeleteCategory(id, row) {
  const c = catById(id);
  if (!c) return;
  const hint = c.parentId ? 'Подкатегория будет удалена. Операции станут «Без категории».' : 'Категория и все её операции будут удалены. Подкатегории станут без родителя.';
  const ok = await confirmSheet({ title: c.parentId ? 'Удалить подкатегорию' : 'Удалить категорию', hint, entityName: c.name, icon: catLuc(c.icon), color: c.color, ok: 'Удалить', danger: true });
  if (!ok) { closeDelRow(row); return; }
  swipeDeleteCategory(id, row);
}
function swipeDeleteGoal(id, row) {
  const g = S.goals.find(x => x.id === id);
  if (!g) return;
  const idx = S.goals.indexOf(g);
  collapseRow(row, () => {
    S.goals = S.goals.filter(x => x.id !== id);
    save(); haptic(12); render(true); refreshTop();
  });
  toast('Накопление удалено', { label: 'Вернуть', fn: () => {
    S.goals.splice(Math.min(idx, S.goals.length), 0, g);
    save(); render(true); refreshTop(); toast('Накопление восстановлено');
  } }, { icon: 'trash-2', tone: 'danger' });
}
async function swipeAskDeleteGoal(id, row) {
  const g = S.goals.find(x => x.id === id);
  if (!g) return;
  const ok = await confirmSheet({ title: 'Удалить накопление', hint: 'Накопление и его история пополнений будут удалены', entityName: g.name, icon: svIcon(g.icon), color: g.color, ok: 'Удалить', danger: true });
  if (!ok) { closeDelRow(row); return; }
  swipeDeleteGoal(id, row);
}
/* reorder — Pointer Events, long-press 200ms или grip-ручка, плавное раздвигание */
function enableReorder(list, onOrder) {
  if (!list) return;
  if (list.__reorderBound) return; list.__reorderBound = true;
  let dragEl = null, items = [], y0 = 0, x0 = 0, from = 0, to = 0, h = 0, pid = null;
  let holdTimer = null, armed = false, moved = false, startTarget = null, startHandle = null;
  let origTouchAction = '', scrollEl = null;

  function gap() { return parseFloat(getComputedStyle(list).rowGap) || 6; }
  function refreshGeom() {
    items = [...list.querySelectorAll(':scope > [data-id]')];
    if (!items.length) { h = 48; return; }
    const r = dragEl ? dragEl.getBoundingClientRect() : items[0].getBoundingClientRect();
    h = r.height + gap();
  }
  function clearHold() { if (holdTimer) { clearTimeout(holdTimer); holdTimer = null; } }
  function activate(e) {
    if (!dragEl) return;
    armed = true; moved = true;
    dragEl.classList.add('dragging');
    dragEl.style.zIndex = '30';
    dragEl.style.transition = 'none';
    dragEl.style.touchAction = 'none';
    dragEl.style.willChange = 'transform';
    dragEl.style.boxShadow = '0 16px 40px rgba(0,0,0,.45), 0 0 0 .5px rgba(255,255,255,.08)';
    dragEl.style.transformOrigin = 'center';
    // lock scroll
    scrollEl = list.closest('.screen__body') || list.parentElement;
    if (scrollEl) { origTouchAction = scrollEl.style.touchAction; scrollEl.style.touchAction = 'none'; scrollEl.style.overflow = 'hidden'; }
    // other items smooth gap
    items.forEach(it => { if (it !== dragEl) { it.style.transition = 'transform 200ms cubic-bezier(.22,1,.36,1)'; } });
    try { if (e && e.pointerId !== undefined) dragEl.setPointerCapture(e.pointerId); } catch(_){}
    haptic(8);
    e && e.preventDefault && e.preventDefault();
  }
  function onDown(e) {
    if (e.button !== undefined && e.button !== 0) return;
    const handle = e.target.closest('[data-handle]');
    const row = e.target.closest('[data-id]');
    if (!row || !list.contains(row)) return;
    // click without drag must still open edit → do not hijack unless handle or long-press
    if (!handle && e.target.closest('[data-act="edit-cat"]')) {
      // still allow long-press on row itself
    }
    if (!handle && !row) return;
    dragEl = row; startHandle = handle; startTarget = e.target;
    refreshGeom();
    from = to = items.indexOf(dragEl);
    if (from < 0) { dragEl = null; return; }
    y0 = e.clientY; x0 = e.clientX; moved = false; armed = false; pid = e.pointerId;
    // immediate if grip, else long-press 200ms
    if (handle) {
      activate(e);
    } else {
      holdTimer = setTimeout(()=> { if (dragEl && !armed) activate(e); }, 200);
      try { dragEl.setPointerCapture(e.pointerId); } catch(_){}
    }
  }
  function onMove(e) {
    if (!dragEl) return;
    if (!armed) {
      const dx = Math.abs(e.clientX - x0), dy = Math.abs(e.clientY - y0);
      if (dx > 8 || dy > 8) { clearHold(); // too much move before activation → cancel drag, allow scroll
        if (dx > dy) { /* horizontal? keep */ }
        // vertical movement threshold cancels long-press
        if (dy > 10) { dragEl = null; startTarget = null; return; }
      }
      return;
    }
    e.preventDefault();
    const dy = e.clientY - y0;
    moved = true;
    dragEl.style.transform = 'translateY(' + dy + 'px) scale(1.04)';
    // compute target index by center Y
    const centerY = dragEl.getBoundingClientRect().top + dragEl.offsetHeight/2;
    // find insertion index via comparing centers
    let nt = from;
    for (let i = 0; i < items.length; i++) {
      if (items[i] === dragEl) continue;
      const r = items[i].getBoundingClientRect();
      const mid = r.top + r.height/2;
      if (centerY > mid) {
        if (i > from) nt = Math.max(nt, i);
        else if (i < from) { /* crossing upward */ }
      }
    }
    // simpler: use dy/h rounding but clamped, works with translateY
    const approx = clamp(from + Math.round(dy / h), 0, items.length - 1);
    // choose the more accurate of both
    nt = approx;
    if (nt !== to) {
      to = nt; haptic(6);
      items.forEach((it, i) => {
        if (it === dragEl) return;
        let sh = 0;
        if (from < to && i > from && i <= to) sh = -h;
        if (from > to && i < from && i >= to) sh = h;
        it.style.transform = sh ? 'translateY(' + sh + 'px)' : 'translateY(0)';
      });
    }
  }
  function cleanupStyles() {
    items.forEach(it => {
      it.style.transition = '';
      it.style.transform = '';
      it.style.willChange = '';
    });
    if (dragEl) {
      dragEl.style.zIndex = ''; dragEl.style.transition = ''; dragEl.style.touchAction = '';
      dragEl.style.willChange = ''; dragEl.style.boxShadow = ''; dragEl.style.transform = '';
      dragEl.classList.remove('dragging');
    }
    if (scrollEl) { scrollEl.style.touchAction = origTouchAction; scrollEl.style.overflow = ''; }
  }
  function onUp(e) {
    if (!dragEl) { clearHold(); return; }
    clearHold();
    const wasArmed = armed;
    const wasMoved = moved;
    const curDrag = dragEl;
    const curFrom = from, curTo = to;
    const target = startTarget;
    // release capture
    try { if (curDrag.hasPointerCapture && pid !== null && curDrag.hasPointerCapture(pid)) curDrag.releasePointerCapture(pid); } catch(_){}
    if (!wasArmed) {
      // not a drag → treat as tap; let click handler fire
      dragEl = null; pid = null; armed = false; moved = false;
      return;
    }
    // animate snap into place
    curDrag.style.transition = 'transform 260ms cubic-bezier(.22,1,.36,1), box-shadow 260ms ease';
    curDrag.style.transform = 'translateY(' + ((curTo - curFrom) * h) + 'px) scale(1.04)';
    // keep gap transforms for others during snap
    setTimeout(() => {
      cleanupStyles();
      if (curTo !== curFrom) {
        const ids = items.map(i => i.dataset.id);
        const [m] = ids.splice(curFrom, 1);
        ids.splice(curTo, 0, m);
        haptic(6);
        onOrder(ids);
      } else if (wasMoved) {
        haptic(4);
      }
      // restore list gap animation cleanly
      list.style.willChange = 'auto';
      dragEl = null; pid = null; armed = false; moved = false;
    }, 30);
    // also clear transform after transition for smoothness
    setTimeout(()=> { if (curDrag) { curDrag.style.transform = 'none'; curDrag.style.willChange = 'auto'; setTimeout(()=> curDrag.style.transform='', 380); } }, 280);
  }
  function onCancel(e) {
    clearHold();
    if (!dragEl) return;
    if (armed) {
      dragEl.style.transition = 'transform 240ms cubic-bezier(.22,1,.36,1)';
      dragEl.style.transform = 'translateY(0) scale(1)';
      setTimeout(cleanupStyles, 260);
      haptic(8);
    }
    dragEl = null; pid = null; armed = false; moved = false;
  }
  list.addEventListener('pointerdown', onDown, { passive: false });
  list.addEventListener('pointermove', onMove, { passive: false });
  list.addEventListener('pointerup', onUp, { passive: false });
  list.addEventListener('pointercancel', onCancel, { passive: false });
  list.addEventListener('pointerleave', (e)=> { if (armed) onCancel(e); });
  // prevent contextmenu on long press
  list.addEventListener('contextmenu', e => { if (armed) e.preventDefault(); });
  // CSS helper for dragging state
  const style = document.createElement('style');
  style.textContent = '.sw.dragging{ z-index:30; will-change:transform } .sw.dragging .sw__body{ box-shadow:0 16px 40px rgba(0,0,0,.45) }';
  if (!document.querySelector('#reorder-style')) { style.id='reorder-style'; document.head.appendChild(style); }
}

/* ═══════════════════════════════ 3. app state ═══════════════════════════════ */
const UI = { ledger: { off: 0, day: null, limit: 50, period: 'month', customId: null }, insights: { off: 0 }, per: { unit: 'month', off: 0 }, accId: null, catKind: 'expense' };

function segHTML(name, val, opts) {
  const i = opts.findIndex(o => o[0] === val);
  return '<div class="seg seg--collapse" data-seg="' + name + '" data-v="' + val + '" style="--n:' + opts.length + ';--i:' + Math.max(0, i) + '">' +
    opts.map(o => '<button type="button" data-segv="' + o[0] + '" aria-selected="' + (o[0] === val) + '">' +
      (o[2] ? (String(o[2]).indexOf('<svg') === 0 ? o[2] : '<i data-lucide="' + o[2] + '" class="ic ic-s"></i>') : '') + '<span>' + esc(o[1]) + '</span></button>').join('') + '</div>';
}
/* пилюля-сегмент: у невыбранных — только иконка, выбранная подсвечена цветом (CSS по data-v) */
function pillSegHTML(name, val, opts) {
  return '<div class="pseg" data-seg="' + name + '" data-v="' + val + '">' +
    opts.map(o => '<button type="button" data-segv="' + o[0] + '" aria-selected="' + (o[0] === val) + '">' +
      (o[2] ? (String(o[2]).indexOf('<svg') === 0 ? o[2] : '<i data-lucide="' + o[2] + '" class="ic ic-s"></i>') : '') + '<span>' + esc(o[1]) + '</span></button>').join('') + '</div>';
}
function bindSeg(root, name, fn) {
  const seg = root.querySelector('[data-seg="' + name + '"]'); if (!seg) return;
  seg.querySelectorAll('[data-segv]').forEach((b, i) => b.onclick = () => {
    if (b.getAttribute('aria-selected') === 'true') return;
    haptic();
    seg.style.setProperty('--i', i); seg.dataset.v = b.dataset.segv;
    seg.querySelectorAll('[data-segv]').forEach(x => x.setAttribute('aria-selected', x === b));
    fn(b.dataset.segv);
  });
}

/* ═══════════════════════════════ 4. top bar + dock ═══════════════════════════════ */
function renderTop() {
  const a = UI.accId ? accById(UI.accId) : null;
  const t = totalsByCur();
  const main = a ? accBalance(a.id) : (t[S.settings.currency] || 0);
  $('#topbar').innerHTML =
    '<button class="chip chip--lg" data-act="pick-account"><span class="tile tile--round" style="' + (a ? '--c:' + a.color : '--c:var(--t2);background:#000') + '">' + (a ? '<i data-lucide="' + a.icon + '" class="ic"></i>' : ALL_ACC_IC) + '</span>' +
    '<span class="chip__tx"><span class="chip__t">' + esc(a ? a.name : 'Все счета') + '</span><span class="chip__s">' + money(main, a ? a.currency : S.settings.currency) + '</span></span></button>' +
    '<span style="flex:1"></span>' +
    '<div style="display:flex;align-items:center;gap:8px">' +
    '<div class="pill" style="height:44px;padding:2px">' +
    '<button class="iconbtn" data-act="search" aria-label="Поиск"><i data-lucide="search" class="ic"></i></button>' +
    '<button class="iconbtn" data-act="stats" aria-label="Аналитика"><i data-lucide="pie-chart" class="ic"></i></button>' +
    '<button class="iconbtn" data-act="goals" aria-label="Покупки"><i data-lucide="shopping-bag" class="ic"></i></button>' +
    '<button class="iconbtn" data-act="health" aria-label="Финансовое здоровье"><i data-lucide="heart" class="ic"></i></button>' +
    '</div>' +
    '<button class="iconbtn" data-act="settings" aria-label="Настройки"><i data-lucide="gear" class="ic"></i></button>' +
    '</div>';
}

/* ═══════════════════════════════ 7. pickers ═══════════════════════════════ */
function pickAccount(fn, o) {
  o = o || {};
  const list = S.accounts.filter(a => !a.archived && a.id !== o.exclude).sort((a, b) => a.order - b.order);
  /* секция «Накопления»: только когда явно запрошена и есть что показать */
  const gs = o.goals ? S.goals.slice().sort((a, b) => (a.order || 0) - (b.order || 0)) : [];
  const gpHTML = gs.length ? '<div class="gp-lab">Накопления</div><div class="gp-list">' + gs.map(g => {
    return '<div class="gp-row" style="--c:' + g.color + '">' +
      '<span class="gp-ic"><i data-lucide="' + svIcon(g.icon) + '" class="ic"></i></span>' +
      '<span class="gp-main"><b>' + esc(g.name) + '</b><small class="num">' + money(g.saved) + ' / ' + money(g.target) + '</small></span>' +
      '<button class="gp-plus" data-gp="' + g.id + '" aria-label="Пополнить ' + esc(g.name) + '"><i data-lucide="plus" class="ic ic-s"></i></button>' +
      '</div>';
  }).join('') + '</div>' : '';
  openSheet({
    title: 'Счёт',
    html: gpHTML + '<div class="list">' + (o.all ? '<button class="item" data-id=""><span class="tile tile--sm" style="--c:var(--t2);background:#000">' + ALL_ACC_IC + '</span><span class="item__t">Все счета</span><span class="item__v">' + money(totalsByCur()[S.settings.currency] || 0) + '</span></button>' : '') +
      list.map(a => '<button class="item" data-id="' + a.id + '"><span class="tile tile--sm" style="--c:' + a.color + '"><i data-lucide="' + a.icon + '" class="ic"></i></span>' +
        '<span class="item__t">' + esc(a.name) + '</span><span class="item__v">' + money(accBalance(a.id), a.currency) + '</span></button>').join('') + '</div>' +
      '<button class="btn btn--ghost btn--sm" style="margin-top:12px" data-new="1"><i data-lucide="plus" class="ic"></i>Новый счёт</button>',
    mount(sh) {
      if (gs.length) {
        let gpOpen = null;
        const gpClose = () => { if (!gpOpen) return; gpOpen.classList.remove('gp--open'); const x = gpOpen.querySelector('.gp-x'); if (x) x.remove(); gpOpen = null; };
        sh.querySelectorAll('[data-gp]').forEach(b => b.onclick = e => {
          e.stopPropagation();
          const row = b.closest('.gp-row');
          if (gpOpen === row) { gpClose(); haptic(); return; }
          gpClose();
          const g = S.goals.find(x => x.id === b.dataset.gp); if (!g) return;
          gpOpen = row;
          row.classList.add('gp--open');
          haptic();
          const pre = (typeof o.amount === 'function' && o.amount() > 0) ? String(o.amount()) : '';
          const x = document.createElement('div');
          x.className = 'gp-x';
          x.innerHTML = '<input class="gp-x-inp" inputmode="decimal" placeholder="0" value="' + esc(pre) + '">' +
            '<button class="gp-x-ok" disabled>Пополнить</button>';
          row.appendChild(x);
          const inp = x.querySelector('input'), ok = x.querySelector('button');
          const sync = () => { ok.disabled = !(parseFloat(String(inp.value).replace(',', '.')) > 0); };
          inp.oninput = sync;
          sync();
          ok.onclick = () => {
            const v = parseFloat(String(inp.value).replace(',', '.')) || 0;
            if (v <= 0) return;
            g.saved = Math.round((g.saved + v) * 100) / 100;
            (g.history = g.history || []).push({ date: iso(new Date()), v });
            save(); closeSheet(); haptic(10); refreshTop();
            /* операция НЕ создаётся: накопления ведутся отдельно */
            toast(g.saved >= g.target && g.target > 0 ? 'Достигнуто 🎉' : g.name + ': +' + money(v));
          };
          setTimeout(() => inp.focus(), 260);
        });
      }
      sh.querySelectorAll('[data-id]').forEach(b => b.onclick = () => { haptic(); closeSheet(); fn(b.dataset.id || null); });
      sh.querySelector('[data-new]').onclick = () => { closeSheet(); openAccountForm({}, a => fn(a.id)); };
    }
  });
}
function pickCategory(kind, fn) {
  const tops = topCats(kind);
  openSheet({
    title: kind === 'income' ? 'Категория дохода' : 'Категория расхода',
    html: '<div style="display:flex;flex-direction:column;gap:2px">' + tops.map(c => {
      const kids = childrenOf(c.id);
      return '<div><button class="item" style="border-radius:var(--r);background:var(--s1)" data-id="' + c.id + '"><span class="tile tile--sm" style="--c:' + c.color + '"><i data-lucide="' + catLuc(c.icon) + '" class="ic"></i></span><span class="item__t">' + esc(c.name) + '</span></button>' +
        (kids.length ? '<div style="display:flex;flex-wrap:wrap;gap:2px;padding:8px 0 0 14px">' + kids.map(k => '<button class="chip chip--flat" style="padding:7px 13px;font-size:13px" data-id="' + k.id + '"><i data-lucide="' + catLuc(k.icon) + '" class="ic ic-s" style="color:' + k.color + '"></i>' + esc(k.name) + '</button>').join('') + '</div>' : '') + '</div>';
    }).join('') + '<button class="item" style="border-radius:var(--r);background:var(--s1)" data-id=""><span class="tile tile--sm" style="--c:var(--t3)"><i data-lucide="circle-slash" class="ic"></i></span><span class="item__t">Без категории</span></button></div>',
    mount(sh) { sh.querySelectorAll('[data-id]').forEach(b => b.onclick = () => { haptic(); closeSheet(); fn(b.dataset.id || null); }); }
  });
}
function pickDate(cur, fn) {
  let anchor = som(new Date(cur + 'T00:00:00'));
  const rec = openSheet({ title: 'Дата', html: '<div id="calHost"></div>', mount(sh) { draw(sh); } });
  function draw(sh) {
    const host = sh.querySelector('#calHost');
    const first = som(anchor), start = sow(first);
    const cells = [];
    for (let i = 0; i < 42; i++) {
      const d = addD(start, i);
      cells.push({ d, out: d.getMonth() !== first.getMonth() });
      if (i > 34 && addD(start, i + 1).getMonth() !== first.getMonth()) break;
    }
    const dows = []; for (let i = 0; i < 7; i++) dows.push(DOW[(S.settings.firstDay - 1 + i + 7) % 7]);
    host.innerHTML = '<div style="display:flex;gap:8px;padding:0 2px 12px;overflow-x:auto;scrollbar-width:none">' +
      [['Сегодня', 0], ['Вчера', -1], ['2 дня назад', -2], ['Неделю назад', -7]].map(q => '<button class="chip chip--flat" style="flex:none" data-q="' + q[1] + '">' + q[0] + '</button>').join('') + '</div>' +
      '<div class="cal"><div class="cal__hd"><button class="iconbtn" data-m="-1"><i data-lucide="chevron-left" class="ic"></i></button>' +
      '<b>' + MON_N[first.getMonth()] + ' ' + first.getFullYear() + '</b>' +
      '<button class="iconbtn" data-m="1"><i data-lucide="chevron-right" class="ic"></i></button></div>' +
      '<div class="cal__grid">' + dows.map(d => '<span class="cal__dow">' + d + '</span>').join('') +
      cells.map(c => '<button class="cal__d" data-d="' + iso(c.d) + '" data-out="' + (c.out ? 1 : 0) + '" data-today="' + (iso(c.d) === iso(new Date()) ? 1 : 0) + '" aria-selected="' + (iso(c.d) === cur) + '">' + c.d.getDate() + '</button>').join('') + '</div></div>';
    icons(sh);
    host.querySelectorAll('[data-m]').forEach(b => b.onclick = () => { anchor = addM(anchor, +b.dataset.m); draw(sh); });
    host.querySelectorAll('[data-d]').forEach(b => b.onclick = () => { haptic(); closeSheet(); fn(b.dataset.d); });
    host.querySelectorAll('[data-q]').forEach(b => b.onclick = () => { haptic(); closeSheet(); fn(iso(addD(new Date(), +b.dataset.q))); });
  }
}
function pickFromList(title, opts, cur, fn) {
  openSheet({
    title, html: '<div class="list">' + opts.map(o => '<button class="item" data-v="' + esc(o[0]) + '"><span class="item__t">' + (o[2] ? o[1] : esc(o[1])) + '</span>' +
      (String(o[0]) === String(cur) ? '<i data-lucide="check" class="ic" style="color:var(--t1)"></i>' : '') + '</button>').join('') + '</div>',
    mount(sh) { sh.querySelectorAll('[data-v]').forEach(b => b.onclick = () => { haptic(); closeSheet(); fn(b.dataset.v); }); }
  });
}
const COLOR_PRESETS = ['#ff453a', '#ff375f', '#ff9500', '#ffd60a', '#30d158', '#0ac97a', '#06b6d4', '#0a84ff', '#5e5ce6', '#9ca3af'];
function pickCustomColor(o) {
  let hex = normalizeHex(o.current) || '#8F8F97';
  openSheet({
    title: o.title || 'Цвет',
    html: '<div style="display:flex;flex-direction:column;gap:22px">' +
      '<div style="display:flex;align-items:center;gap:16px">' +
      '<label style="position:relative;flex:none;display:block">' +
      '<span id="acSwatch" style="display:block;width:60px;height:60px;border-radius:20px;box-shadow:inset 0 0 0 1px var(--line2)"></span>' +
      '<input type="color" id="acNative" style="position:absolute;inset:0;width:100%;height:100%;opacity:0;cursor:pointer;border:0;padding:0">' +
      '</label>' +
      '<div class="field" style="flex:1"><span>HEX</span><input class="inp" id="acHex" maxlength="7" autocapitalize="off" autocorrect="off" spellcheck="false"></div>' +
      '</div>' +
      '<div style="display:flex;flex-direction:column;gap:14px">' +
      ['R', 'G', 'B'].map(ch => '<div style="display:flex;align-items:center;gap:12px">' +
        '<span style="width:14px;font-size:13px;font-weight:600;color:var(--t3)">' + ch + '</span>' +
        '<input type="range" min="0" max="255" step="1" id="ac' + ch + '" style="flex:1">' +
        '<span class="num" id="ac' + ch + 'v" style="width:32px;text-align:right;font-size:13px;color:var(--t2)">0</span></div>').join('') +
      '</div>' +
      '<div><span class="label" style="padding:0 0 8px 0">Быстрый выбор</span><div class="swatches">' +
      (o.presets || COLOR_PRESETS).map(c => '<button class="swatch" style="--c:' + c + '" data-c="' + c + '" aria-selected="false"></button>').join('') + '</div></div>' +
      '</div>',
    mount(sh) {
      const swatch = sh.querySelector('#acSwatch'), native = sh.querySelector('#acNative'), hexInp = sh.querySelector('#acHex');
      const rI = sh.querySelector('#acR'), gI = sh.querySelector('#acG'), bI = sh.querySelector('#acB');
      const rV = sh.querySelector('#acRv'), gV = sh.querySelector('#acGv'), bV = sh.querySelector('#acBv');
      const presets = sh.querySelectorAll('.swatch');
      function paint(live) {
        swatch.style.background = hex; swatch.style.boxShadow = 'inset 0 0 0 1px var(--line2), 0 10px 26px color-mix(in oklab, ' + hex + ' 45%, transparent)';
        native.value = hex; hexInp.value = hex;
        const { r, g, b } = hexToRgb(hex);
        rI.value = r; gI.value = g; bI.value = b; rV.textContent = r; gV.textContent = g; bV.textContent = b;
        presets.forEach(p => p.setAttribute('aria-selected', p.dataset.c.toUpperCase() === hex));
        if (live !== false && o.onPick) o.onPick(hex);
      }
      function fromRgb() { hex = rgbToHex(rI.value, gI.value, bI.value); paint(); }
      paint(false);
      native.oninput = () => { hex = normalizeHex(native.value) || hex; paint(); };
      hexInp.oninput = () => { const n = normalizeHex(hexInp.value); if (n) { hex = n; paint(); } };
      [rI, gI, bI].forEach(inp => inp.oninput = fromRgb);
      presets.forEach(p => p.onclick = () => { haptic(); hex = p.dataset.c; paint(); });
    },
    onClose: o.onClose
  });
}

/* ═══════════════════════════════ 16. quick menu + global events ═══════════════════════════════ */
let quickOpen = false;
function toggleQuick(force) {
  const host = $('#quickhost');
  if (quickOpen && force !== true) { host.classList.remove('in'); setTimeout(() => host.innerHTML = '', 220); quickOpen = false; return; }
  const items = [['expense', 'Расход', ARR_OUT, 'var(--exp)'], ['income', 'Доход', ARR_IN, 'var(--inc)'],
    ['transfer', 'Перевод', 'arrow-left-right', 'var(--t2)'], ['adjust', 'Корректировка', 'sliders-horizontal', 'var(--t2)']]
    .filter(i => S.settings.quickTypes.includes(i[0]));
  host.innerHTML = '<div class="scrim quick-scrim"></div><div class="quick">' + items.map((i, n) => '<button data-type="' + i[0] + '" style="--i:' + (items.length - n - 1) + '">' +
    (String(i[2]).indexOf('<svg') === 0 ? '<span style="color:' + i[3] + ';display:flex">' + i[2] + '</span>' : '<i data-lucide="' + i[2] + '" class="ic" style="color:' + i[3] + '"></i>') + i[1] + '</button>').join('') + '</div>';
  requestAnimationFrame(() => host.classList.add('in'));
  icons(host); quickOpen = true; haptic(12);
  host.querySelectorAll('[data-type]').forEach(b => b.onclick = () => { toggleQuick(); openEditor({ type: b.dataset.type }); });
  host.querySelector('.quick-scrim').onclick = () => toggleQuick();
  setTimeout(() => document.addEventListener('pointerdown', once, { once: true }), 30);
  function once(e) { if (!e.target.closest('.quick') && !e.target.closest('.fab')) toggleQuick(); }
}
$('#fabhost').addEventListener('click', e => {
  const fab = e.target.closest('[data-act="add"]');
  if (fab) { if (quickOpen) toggleQuick(); else openEditor({ type: 'expense' }); }
});
let fabLP = null;
$('#fabhost').addEventListener('pointerdown', e => {
  if (!e.target.closest('[data-act="add"]')) return;
  fabLP = setTimeout(() => { fabLP = 'done'; toggleQuick(true); }, 380);
});
['pointerup', 'pointercancel', 'pointerleave'].forEach(ev => $('#fabhost').addEventListener(ev, () => { if (fabLP && fabLP !== 'done') clearTimeout(fabLP); setTimeout(() => fabLP = null, 10); }));
$('#fabhost').addEventListener('click', e => { if (fabLP === 'done') e.stopPropagation(); }, true);

$('#topbar').addEventListener('click', e => {
  const b = e.target.closest('[data-act]'); if (!b) return;
  const a = b.dataset.act;
  if (a === 'pick-account') openAccounts();
  if (a === 'search') openSearch();
  if (a === 'stats') openStats();
  if (a === 'goals') openGoals();
  if (a === 'advisor') openAdvisor();
  if (a === 'settings') openSettings();
  if (a === 'health') openHealth();
});
let holdBal = null;
$('#view').addEventListener('click', e => {
  const b = e.target.closest('[data-act]'); if (!b) return;
  const a = b.dataset.act, id = b.dataset.id;
  if (a === 'open-txn' || a === 'edit-txn') { if (b.dataset.swiped === '1') return; openEditor({ id }); }
  else if (a === 'del-txn') delTxn(id);
  else if (a === 'add') openEditor({ type: b.dataset.type || 'expense', date: b.dataset.date });
  else if (a === 'pick-period') openPeriodPicker();
  else if (a === 'clear-day') { UI.ledger.day = null; UI.ledger.limit = 50; haptic(); render(true); }
  else if (a === 'more') {
    haptic();
    if (typeof loadMoreLedger !== 'function' || !loadMoreLedger()) {
      UI.ledger.limit = (UI.ledger.limit || 50) + 50;
      render(true);
    }
  }
  else if (a === 'insights') openInsights();
  else if (a === 'health') openHealth();
  else if (a === 'toggle-hide') { S.settings.hideAmounts = !S.settings.hideAmounts; save(); haptic(); render(true); }
  else if (a === 'wipe-demo') wipeDemo();
});

async function wipeDemo() {
  if (!await confirmSheet({ title: 'Очистить демо-данные?', text: 'Удалим сгенерированные операции и цели. Счета и категории останутся.', ok: 'Очистить' })) return;
  S.transactions = []; S.goals = []; S.templates = [];
  S.accounts.forEach(a => a.initial = 0);
  S.settings.demo = false; save(); render(); toast('Готово, можно начинать с нуля');
}
/* ── демо-данные из настроек: добавить счета, категории, накопления и полгода операций ──
   ничего не удаляет: новые сущности дописываются к текущим данным с уникальными id */
function seedDemo() {
  const cur = S.settings.currency;
  const today = sod(new Date());
  let seed = Math.floor(Math.random() * 2147483000) + 1;
  const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
  const pick = a => a[Math.floor(rnd() * a.length)];
  const m2 = (a, b) => Math.round((a + rnd() * (b - a)) * 100) / 100;
  const nid = p => p + uid();
  /* счета (order с запасом, чтобы не пересекаться с текущими) */
  const cash = nid('da'), card = nid('da'), reserve = nid('da'), cube = nid('da');
  const newAccs = [
    { id: cash, name: 'Наличные', icon: 'wallet', color: PALETTE[5], currency: cur, initial: 190, inTotal: true, order: 200, archived: false },
    { id: card, name: 'Основная карта', icon: 'credit-card', color: PALETTE[7], currency: cur, initial: 1520, inTotal: true, order: 201, archived: false },
    { id: reserve, name: 'Резервная карта', icon: 'landmark', color: PALETTE[9], currency: cur, initial: 640, inTotal: true, order: 202, archived: false },
    { id: cube, name: 'Кубышка', icon: 'piggy-bank', color: PALETTE[3], currency: cur, initial: 2600, inTotal: true, order: 203, archived: false }
  ];
  /* категории (только иконки, валидные во вс��х подсистемах: LUC + CAT_LUCIDE + форма категории) */
  const cHome = nid('dc'), cShop = nid('dc'), cRest = nid('dc'), cTrans = nid('dc'), cCar = nid('dc'),
    cHobby = nid('dc'), cPets = nid('dc'), cEdu = nid('dc'), cWear = nid('dc'), cBonus = nid('dc');
  const newCats = [
    { id: cHome, name: 'Дом и аренда', icon: 'home', color: PALETTE[11], kind: 'expense', parentId: null, order: 200 },
    { id: cShop, name: 'Супермаркет', icon: 'shopping-basket', color: PALETTE[7], kind: 'expense', parentId: null, order: 201 },
    { id: cRest, name: 'Рестораны и кафе', icon: 'utensils', color: PALETTE[5], kind: 'expense', parentId: null, order: 202 },
    { id: cTrans, name: 'Транспорт', icon: 'bus', color: PALETTE[10], kind: 'expense', parentId: null, order: 203 },
    { id: cCar, name: 'Авто', icon: 'car-front', color: PALETTE[13], kind: 'expense', parentId: null, order: 204 },
    { id: cHobby, name: 'Хобби и игры', icon: 'gamepad-2', color: PALETTE[12], kind: 'expense', parentId: null, order: 205 },
    { id: cPets, name: 'Питомцы', icon: 'paw-print', color: PALETTE[9], kind: 'expense', parentId: null, order: 206 },
    { id: cEdu, name: 'Обучение', icon: 'graduation-cap', color: PALETTE[8], kind: 'expense', parentId: null, order: 207 },
    { id: cWear, name: 'Одежда и уход', icon: 'shopping-bag', color: PALETTE[4], kind: 'expense', parentId: null, order: 208 },
    { id: cBonus, name: 'Бонусы и премии', icon: 'coins', color: PALETTE[6], kind: 'income', parentId: null, order: 209 }
  ];

  /* накопления: saved соберём из истории пополнений */
  const gAcc = sysAcc('goals');
  const g1 = nid('dg'), g2 = nid('dg');
  const goals = [
    { id: g1, name: 'Наушники Sony', target: 540, saved: 0, icon: 'headphones', color: PALETTE[12], deadline: iso(addM(today, 2)), history: [] },
    { id: g2, name: 'Отпуск в Италии', target: 4200, saved: 0, icon: 'plane-takeoff', color: PALETTE[6], deadline: iso(addM(today, 6)), history: [] }
  ];
  /* полгода операций: будни реже, выходные чаще */
  const ops = [];
  const rows = [
    [cShop, card, 14, 85, ['Евроопт', 'Санта', 'Green', 'Продукты на неделю', 'Корзина'], .85],
    [cShop, card, 6, 35, ['Хлеб и молоко', 'Быстрая покупка', 'Вода и снеки'], .35],
    [cRest, card, 12, 65, ['Обед в кафе', 'Ужин с друзьями', 'Доставка пиццы', 'Бизнес-ланч'], .3],
    [cRest, cash, 4, 18, ['Кофе с собой', 'Пирожное', 'Сэндвич'], .32],
    [cTrans, cash, 2, 12, ['Проезд', 'Метро', 'Маршрутка'], .45],
    [cTrans, card, 6, 28, ['Такси', 'Яндекс Go', 'Поездка домой'], .12],
    [cCar, card, 22, 95, ['Заправка', 'Парковка', 'Мойка'], .12],
    [cWear, card, 25, 180, ['Zara', 'Кроссовки', 'Косметика', 'Бытовая мелочь'], .07],
    [cHobby, reserve, 15, 120, ['Steam', 'Настолки', 'Кино', 'Книги'], .08],
    [cPets, card, 12, 85, ['Корм', 'Наполнитель', 'Ветаптека'], .1],
    [cEdu, card, 45, 150, ['Курс английского', 'Онлайн-курс', 'Учебники'], .04]
  ];
  for (let i = 181; i >= 0; i--) {
    const d = addD(today, -i), k = iso(d);
    rows.forEach(r => {
      if (rnd() < r[5] * (d.getDay() === 0 || d.getDay() === 6 ? 1.3 : .85))
        ops.push({ id: uid(), type: 'expense', amount: m2(r[2], r[3]), accountId: r[1], categoryId: r[0], note: pick(r[4]), date: k + 'T' + String(8 + Math.floor(rnd() * 13)).padStart(2, '0') + ':' + String(Math.floor(rnd() * 60)).padStart(2, '0') });
    });
    /* регулярные платежи, как у живого пользователя */
    if (d.getDate() === 3) ops.push({ id: uid(), type: 'expense', amount: m2(9, 25), accountId: reserve, categoryId: cHobby, note: pick(['Подписка Netflix', 'Подписка Spotify', 'Облако 200 ГБ']), date: k + 'T08:15' });
    if (d.getDate() === 5) ops.push({ id: uid(), type: 'expense', amount: 750, accountId: card, categoryId: cHome, note: 'Аренда квартиры', date: k + 'T10:00' });
    if (d.getDate() === 7) ops.push({ id: uid(), type: 'expense', amount: m2(78, 130), accountId: card, categoryId: cHome, note: 'Коммуналка и интернет', date: k + 'T11:20' });
    if (d.getDate() === 10) ops.push({ id: uid(), type: 'income', amount: 1400, accountId: card, categoryId: cBonus, note: 'Аванс', date: k + 'T09:05' });
    if (d.getDate() === 25) ops.push({ id: uid(), type: 'income', amount: m2(1560, 1720), accountId: card, categoryId: cBonus, note: 'Зарплата', date: k + 'T09:05' });
    if (d.getDate() === 12 && i > 20) ops.push({ id: uid(), type: 'income', amount: m2(280, 680), accountId: card, categoryId: cBonus, note: 'Фриланс-проект', date: k + 'T18:40' });
    if (d.getDate() === 15) ops.push({ id: uid(), type: 'transfer', amount: m2(120, 220), accountId: card, toAccountId: cash, note: 'Снятие наличных', date: k + 'T13:10' });
    if (d.getDate() === 20) ops.push({ id: uid(), type: 'transfer', amount: m2(150, 320), accountId: card, toAccountId: cube, note: 'В кубышку', date: k + 'T12:05' });
    if (d.getDate() === 26) ops.push({ id: uid(), type: 'transfer', amount: m2(40, 130), accountId: cash, toAccountId: card, note: 'Внести наличные', date: k + 'T19:45' });
    /* крупные нерегулярные покупки: техника и гаджеты */
    if (rnd() < .015) ops.push({ id: uid(), type: 'expense', amount: m2(120, 450), accountId: card, categoryId: cWear, note: pick(['Наушники', 'Чехол и стекло', 'Зарядка и кабели', 'Клавиатура', 'Лампа']), date: k + 'T' + String(10 + Math.floor(rnd() * 9)).padStart(2, '0') + ':' + String(Math.floor(rnd() * 60)).padStart(2, '0') });
    /* пополнения покупок: перевод на защищённый счёт «Накопления» + запись в истории цели */
    if (d.getDate() === 22 && gAcc) {
      const v1 = m2(40, 90), v2 = m2(90, 180);
      ops.push({ id: uid(), type: 'transfer', amount: v1, accountId: card, toAccountId: gAcc.id, note: 'На покупку: Наушники Sony', date: k + 'T20:10' });
      goals[0].history.push({ date: k, v: v1 });
      ops.push({ id: uid(), type: 'transfer', amount: v2, accountId: card, toAccountId: gAcc.id, note: 'На покупку: Отпуск в Италии', date: k + 'T20:15' });
      goals[1].history.push({ date: k, v: v2 });
    }
    /* пара корректировок за полгода */
    if (i === 100) ops.push({ id: uid(), type: 'adjust', amount: 15, adjustSign: -1, accountId: cash, note: 'Сверка наличных', date: k + 'T21:30' });
    if (i === 60) ops.push({ id: uid(), type: 'adjust', amount: 30, adjustSign: 1, accountId: card, note: 'Поправка баланса', date: k + 'T12:00' });
  }
  goals.forEach(g => g.saved = Math.round(g.history.reduce((s, h) => s + h.v, 0) * 100) / 100);
  S.accounts.push(...newAccs);
  S.categories.push(...newCats);
  S.goals.push(...goals);
  S.transactions = S.transactions.concat(ops).sort((a, b) => {
    const da = a.date || '', db = b.date || '';
    return db < da ? -1 : (db > da ? 1 : 0);
  });
  /* баннер «Демо-данные» с кнопкой «Очистить» отключаем: он стёр бы и пользовательские операции */
  S.settings.demo = false;
  return { accs: newAccs.length, cats: newCats.length, goals: goals.length, ops: ops.length };
}
