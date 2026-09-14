/* app/navigation.js — навигация по экранам: pushScreen, popScreen, nav */
"use strict";

/* ═══════════════════════════════ screens / navigation ═══════════════════════════════ */
const nav = [];

function renderScreenGrab(el) {
  if (!el.querySelector('.screen__grab')) {
    const grab = document.createElement('div');
    grab.className = 'screen__grab';
    grab.setAttribute('aria-hidden', 'true');
    el.prepend(grab);
    if (typeof dragDismiss === 'function') {
      dragDismiss(el, grab, () => popScreen());
    }
  }
  const head = el.querySelector('.shead');
  if (head && !head.__dragBound) {
    head.__dragBound = true;
    let y0 = 0, dy = 0, on = false;
    head.addEventListener('pointerdown', e => {
      if (e.target.closest('button, input, select, a, [role="button"], .iconbtn')) return;
      on = true; y0 = e.clientY; dy = 0;
      el.classList.add('dragging');
      try { head.setPointerCapture(e.pointerId); } catch (_err) {}
    });
    head.addEventListener('pointermove', e => {
      if (!on) return;
      dy = Math.max(0, e.clientY - y0);
      el.style.transform = 'translateY(' + dy + 'px)';
    });
    const end = () => {
      if (!on) return;
      on = false;
      el.classList.remove('dragging');
      el.style.transform = '';
      if (dy > 80) { haptic('light'); popScreen(); }
    };
    head.addEventListener('pointerup', end);
    head.addEventListener('pointercancel', end);
  }
}

function bindFullscreenEdgeSwipe(el) {
  let x0 = 0, dx = 0, active = false;
  el.addEventListener('pointerdown', e => {
    if (e.clientX > 32) return;
    if (e.target.closest('button, input, select, a, [role="button"], .iconbtn')) return;
    active = true;
    x0 = e.clientX;
    dx = 0;
    el.classList.add('dragging');
    try { el.setPointerCapture(e.pointerId); } catch (_err) {}
  });
  el.addEventListener('pointermove', e => {
    if (!active) return;
    dx = Math.max(0, e.clientX - x0);
    el.style.transform = 'translate3d(' + dx + 'px, 0, 0)';
  });
  const end = () => {
    if (!active) return;
    active = false;
    el.classList.remove('dragging');
    el.style.transform = '';
    if (dx > 80) {
      haptic('light');
      popScreen();
    }
  };
  el.addEventListener('pointerup', end);
  el.addEventListener('pointercancel', end);
}

function pushScreen(o) {
  const isFullscreen = o.fullscreen || o.id === 'settings';
  let scrim = null;
  const el = document.createElement('div');
  if (isFullscreen) {
    el.className = 'screen screen--fullscreen' + (o.push ? ' push' : '');
    if (o.id) el.id = o.id;
    el.innerHTML = o.html;
    $('#overlays').append(el);
    bindFullscreenEdgeSwipe(el);
  } else {
    scrim = document.createElement('div');
    scrim.className = 'scrim';
    const baseZ = 60 + nav.length * 2;
    scrim.style.zIndex = baseZ - 1;
    el.style.zIndex = baseZ;
    el.className = 'screen' + (o.push ? ' push' : '');
    if (o.id) el.id = o.id;
    el.innerHTML = o.html;
    renderScreenGrab(el);
    $('#overlays').append(scrim, el);
    scrim.onclick = () => popScreen();
  }
  icons(el);
  const origRefresh = o.refresh;
  const refresh = origRefresh ? () => {
    origRefresh();
    if (!isFullscreen) renderScreenGrab(el);
  } : undefined;
  const rec = { el, scrim, id: o.id, refresh, dispose: o.dispose, fullscreen: isFullscreen };
  nav.push(rec);
  void el.offsetHeight;
  if (scrim) void scrim.offsetHeight;
  requestAnimationFrame(() => {
    if (scrim) scrim.classList.add('in');
    el.classList.add('in');
  });
  if (o.mount) o.mount(el);
  history.pushState({ depth: nav.length }, '');
  return rec;
}

let suppressPopstate = false;
function popScreen(fromHistory) {
  const rec = nav.pop(); if (!rec) return false;
  if (rec.dispose) rec.dispose();
  rec.el.classList.remove('in');
  if (rec.scrim) rec.scrim.classList.remove('in');
  setTimeout(() => {
    rec.el.remove();
    if (rec.scrim) rec.scrim.remove();
    /* PERF/память: экран удалён — сбрасываем ссылки на его открытые swipe-ряды,
       чтобы отсоединённое поддерево не удерживалось глобальным состоянием
       (тот же паттерн очистки, что в render()) */
    if (typeof openRow !== 'undefined' && openRow && !openRow.isConnected) openRow = null;
    if (typeof delOpenRow !== 'undefined' && delOpenRow && !delOpenRow.isConnected) delOpenRow = null;
  }, 280);
  if (!fromHistory) { suppressPopstate = true; history.back(); }
  return true;
}

window.addEventListener('popstate', () => {
  if (suppressPopstate) { suppressPopstate = false; return; }
  if (typeof sheetStack !== 'undefined' && sheetStack.length) { closeSheet(); history.pushState({}, ''); return; }
  if (typeof insOpen !== 'undefined' && insOpen) { closeInsights(true); return; }
  if (nav.length) popScreen(true);
});

function refreshTop() { const r = nav[nav.length - 1]; if (r && r.refresh) r.refresh(); }
