/* app/ui-primitives.js — базовые UI-примитивы: toast, ripple, sheet, confirmSheet */
"use strict";

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
    // allow safe money() output (<svg class="byn-icon">) and svg, escape others
    const held = [];
    const tmpMsg = String(msg).replace(/<svg[\s\S]*?\/svg>/g, s => { held.push(s); return '\uE000' + held.length + '\uE001'; });
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
  try { if (typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches) return; } catch (_e) {}
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
  setTimeout(() => sp.remove(), 450);
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
  void sh.offsetHeight;
  void scrim.offsetHeight;
  requestAnimationFrame(() => {
    scrim.classList.add('in');
    sh.classList.add('in');
  });
  scrim.onclick = () => closeSheet();
  const grab = sh.querySelector('.sheet__grab');
  if (grab) dragDismiss(sh, grab, () => closeSheet());
  if (o.mount) o.mount(sh);
  return rec;
}
function closeSheet() {
  const rec = sheetStack.pop(); if (!rec) return false;
  rec.sh.classList.remove('in'); rec.scrim.classList.remove('in');
  setTimeout(() => { rec.sh.remove(); rec.scrim.remove(); }, 240);
  if (rec.onClose) rec.onClose();
  return true;
}
function dragDismiss(sh, handle, close) {
  let y0 = 0, dy = 0, on = false;
  handle.addEventListener('pointerdown', e => {
    on = true; y0 = e.clientY; dy = 0;
    sh.classList.add('dragging');
    try { handle.setPointerCapture(e.pointerId); } catch (_err) {}
  });
  handle.addEventListener('pointermove', e => {
    if (!on) return;
    dy = Math.max(0, e.clientY - y0);
    sh.style.transform = 'translateY(' + dy + 'px)';
  });
  const end = () => {
    if (!on) return;
    on = false;
    sh.classList.remove('dragging');
    sh.style.transform = '';
    if (dy > 80) { haptic('light'); close(); }
  };
  handle.addEventListener('pointerup', end);
  handle.addEventListener('pointercancel', end);
}
window.dragDismiss = dragDismiss;
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
        '<span class="cf__badge"><i data-lucide="' + (o.badgeIcon || 'trash') + '" class="ic"></i></span>' +
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
        haptic('warning');
        sh.querySelectorAll('[data-x]').forEach(b => b.onclick = () => {
          done = true;
          const isOk = b.dataset.x === '1';
          haptic(isOk ? 'warning' : 'light');
          if (isOk) { try { b.animate([{ transform: 'scale(1)' }, { transform: 'scale(.95)' }, { transform: 'scale(1)' }], { duration: 180, easing: 'ease-out' }); } catch (e) {} }
          res(isOk);
          closeSheet();
        });
      },
      onClose() { if (!done) res(false); }
    });
  });
}
