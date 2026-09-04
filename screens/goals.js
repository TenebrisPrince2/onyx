"use strict";
/* screens/goals.js — форма цели fullsheet (секция «9d») + редактор накоплений (секция «10»).
   Вынесено байт-в-байт; все зависимости (utils/storage/domain/S/nav/toast…) разрешаются в момент вызова через общую глобальную область. */
/* ═══════════════════════════════ 9d. goal form screen (fullsheet) ═══════════════════════════════ */
const GoalFormScreen = (function () {
  const COLORS = FORM_COLORS;
  const SECTIONS = ICON_SECTIONS;

  const $id = id => document.getElementById(id);
  function icHtml(n, size) {
    return svgIcon(n, 'ic', size || 18);
  }
  function parseNum(v) {
    const n = parseFloat(String(v == null ? '' : v).replace(',', '.'));
    return isNaN(n) || n < 0 ? 0 : Math.round(n * 100) / 100;
  }

  const st = { name: '', target: '', saved: '0', deadline: '', color: '#30d158', icon: 'target', customOpen: false };
  let editing = null, onDone = null, fsEl = null, bsEl = null, bsOpen = false;

  function open(params, done) {
    params = params || {};
    onDone = done || null;
    if (bsEl) { bsEl.remove(); bsEl = null; bsOpen = false; }
    document.querySelectorAll('#goal-form-screen').forEach(function (n) { n.remove(); });
    fsEl = null;
    st.customOpen = false;
    st.name = ''; st.target = ''; st.saved = '0'; st.deadline = '';
    st.color = '#30d158'; st.icon = 'target';
    editing = null;
    if (params.id) {
      const g = S.goals.find(x => x.id === params.id);
      if (g) {
        editing = g;
        st.name = g.name || '';
        st.target = (g.target != null && g.target !== '') ? String(g.target) : '';
        st.saved = (g.saved != null && g.saved !== '') ? String(g.saved) : '0';
        st.deadline = g.deadline || '';
        st.color = hexable(g.color) || '#30d158';
        st.icon = g.icon || 'target';
      }
    }
    /* пресет из подсказок здоровья: подушка безопасности и т.п. */
    if (params.preset) {
      const p = params.preset;
      if (p.name) st.name = String(p.name);
      if (p.target != null && p.target !== '') st.target = String(p.target);
      if (p.icon) st.icon = p.icon;
      if (p.color && hexable(p.color)) st.color = p.color;
    }
    const d = editing;
    fsEl = document.createElement('div');
    fsEl.className = 'gfscreen';
    fsEl.id = 'goal-form-screen';
    fsEl.setAttribute('aria-hidden', 'false');
    fsEl.innerHTML =
      '<div class="grabber"></div>' +
      '<div class="fs-head">' +
        '<button class="fs-close" id="goal-form-close" type="button" aria-label="Закрыть">' + icHtml('x', 20) + '</button>' +
        '<h1 class="fs-title" id="goal-form-title">' + (d ? 'Редактировать' : 'Новая покупка') + '</h1>' +
        '<span class="fs-spacer"></span>' +
      '</div>' +
      '<div class="fs-body">' +
        '<div class="name-card">' +
          '<span class="name-tile" id="goal-form-preview" style="background:' + hexToRgba(st.color, 0.15) + ';color:' + st.color + '">' + icHtml(st.icon, 19) + '</span>' +
          '<input id="goal-form-name" placeholder="Что хотите купить?" maxlength="40" autocomplete="off" value="' + esc(st.name) + '">' +
        '</div>' +
        '<div class="amt-grid">' +
          '<div class="amt-card"><small>Цена</small>' +
            '<input id="goal-form-target" inputmode="decimal" placeholder="0" autocomplete="off" value="' + esc(st.target) + '">' +
          '</div>' +
          '<div class="amt-card"><small>Отложено</small>' +
            '<input id="goal-form-saved" inputmode="decimal" placeholder="0" autocomplete="off" value="' + esc(st.saved) + '">' +
          '</div>' +
        '</div>' +
        '<div class="date-card"><small>Дата (необязательно)</small>' +
          '<input type="date" id="goal-form-deadline" value="' + esc(st.deadline) + '">' +
        '</div>' +
        '<div class="gp-pace" id="goal-form-pace"></div>' +
        '<div class="pal" id="goal-form-palette"></div>' +
        '<div class="ipick" id="goal-form-picker"></div>' +
        (d ? '<button class="del-btn" id="goal-form-delete" type="button">Удалить</button>' : '') +
      '</div>' +
      '<div class="fs-foot"><button class="save-btn" id="goal-form-save" type="button">Сохранить</button></div>';
    $('#overlays').appendChild(fsEl);
    renderPalette();
    renderPicker();
    bind();
    updatePace();
    icons(fsEl);   /* PERF: вся форма обрабатывается один раз; внутренние перерисовки скоупятся к своим контейнерам */
    let shown = false;
    const reveal = () => { if (shown) return; shown = true; if (fsEl) fsEl.classList.add('show'); };
    requestAnimationFrame(() => requestAnimationFrame(reveal));
    setTimeout(reveal, 120);
  }
  function close() {
    if (bsEl) { bsEl.remove(); bsEl = null; bsOpen = false; }
    if (!fsEl) return;
    const el = fsEl;
    fsEl = null;
    el.classList.remove('show');
    el.setAttribute('aria-hidden', 'true');
    setTimeout(() => el.remove(), 390);
  }
  function handleEscape() {
    if (bsOpen) { closeBs(); return true; }
    if (fsEl) { close(); return true; }
    return false;
  }
  function renderNameTile() {
    var tile = $id('goal-form-preview');
    if (!tile) return;
    tile.style.background = hexToRgba(st.color, 0.15);
    tile.style.color = st.color;
    tile.innerHTML = icHtml(st.icon, 19);
    icons(tile);
  }
  function renderPalette() {
    var prevScroll = null;
    var oldRow = $id('goal-form-palette').querySelector('.pal-row');
    if (oldRow) prevScroll = oldRow.scrollLeft;
    const html = (st.customOpen ? customHTML() : '') +
      '<div class="pal-row">' +
      COLORS.map(function (c) {
        var on = c === st.color || c.toUpperCase() === String(st.color).toUpperCase();
        return '<button class="pal-sw' + (on ? ' on' : '') + '" data-c="' + c + '" type="button" style="background:' + c + '" aria-label="Цвет" aria-pressed="' + on + '">' +
          '</button>';
      }).join('') +
      '<button class="pal-custom' + (st.customOpen ? ' on' : '') + '" id="goal-form-custom" type="button" aria-label="Свой цвет">' + icHtml('palette', 13) + '</button>' +
      '</div>';
    $id('goal-form-palette').innerHTML = html;
    if (prevScroll !== null) {
      var row = $id('goal-form-palette').querySelector('.pal-row');
      if (row) { row.style.scrollBehavior = 'auto'; row.scrollLeft = prevScroll; }
    }
    icons($id('goal-form-palette'));
    bindPalette();
  }
  function customHTML() {
    var valid = /^#[0-9a-fA-F]{6}$/.test(st.color);
    return '<div class="pal-box">' +
      '<div class="pal-hd"><span>Свой цвет</span><button class="pal-close" id="goal-form-pal-close" type="button" aria-label="Закрыть выбор цвета">' + icHtml('x', 14) + '</button></div>' +
      '<div class="pal-hexrow">' +
        '<label class="pal-lg" title="Выбрать цвет">' +
          '<span class="pal-prev" id="goal-form-hex-preview" style="background:' + (valid ? st.color : '#ff453a') + '"></span>' +
          '<input type="color" class="pal-native" id="goal-form-native" value="' + (valid ? st.color : '#ff453a') + '" aria-label="Выбрать цвет">' +
        '</label>' +
        '<input class="pal-hex" id="goal-form-hex" maxlength="7" placeholder="#ff453a" value="' + esc(st.color) + '" spellcheck="false" autocomplete="off">' +
      '</div>' +
      '</div>';
  }
  function markRamp() {
    var box = $id('goal-form-palette');
    if (!box) return;
    box.querySelectorAll('.pal-sw').forEach(function (s) {
      var on = s.dataset.c.toUpperCase() === String(st.color).toUpperCase();
      s.classList.toggle('on', on);
      s.setAttribute('aria-pressed', on);
    });
  }
  function bindPalette() {
    var box = $id('goal-form-palette');
    box.querySelectorAll('.pal-sw').forEach(function (b) {
      b.onclick = function () {
        st.color = b.dataset.c;
        haptic(5);
        if (st.customOpen) {
          st.customOpen = false;
          var pb = box.querySelector('.pal-box');
          if (pb) pb.remove();
        }
        markRamp();
        renderNameTile();
      };
    });
    $id('goal-form-custom').onclick = function () {
      st.customOpen = !st.customOpen;
      haptic(5);
      renderPalette();
    };
    if (st.customOpen) {
      var hex = $id('goal-form-hex');
      var prev = $id('goal-form-hex-preview');
      var nat = $id('goal-form-native');
      $id('goal-form-pal-close').onclick = function () {
        st.customOpen = false;
        haptic(6);
        renderPalette();
      };
      hex.oninput = function () {
        var v = hex.value.trim();
        if (/^#[0-9a-f]{6}$/i.test(v)) {
          st.color = v.toLowerCase();
          haptic(5);
          prev.style.background = st.color;
          nat.value = st.color;
          renderNameTile();
          markRamp();
        }
      };
      nat.oninput = function () {
        st.color = nat.value;
        haptic(5);
        hex.value = st.color;
        prev.style.background = st.color;
        renderNameTile();
        markRamp();
      };
    }
  }
  function renderPicker() {
    var html = '<div class="ipick-wrap">' + SECTIONS.map(function (sec) {
      var names = sec[1];
      return '<div class="ipick-sec"><div class="ipick-t">' + esc(sec[0]) + '</div><div class="ipick-grid">' +
        names.map(function (n) {
          var on = n === st.icon;
          return '<button class="ipick-btn' + (on ? ' on' : '') + '" data-i="' + n + '" type="button" aria-label="' + esc(n) + '" aria-pressed="' + on + '">' + icHtml(n, 16) + '</button>';
        }).join('') + '</div></div>';
    }).join('') + '</div>';
    $id('goal-form-picker').innerHTML = html;
    icons($id('goal-form-picker'));
    $id('goal-form-picker').querySelectorAll('.ipick-btn').forEach(function (b) {
      b.onclick = function () {
        st.icon = b.dataset.i;
        haptic(4);
        renderPicker();
        renderNameTile();
      };
    });
  }
  function updatePace() {
    var el = $id('goal-form-pace');
    if (!el) return;
    var target = parseNum(st.target), saved = parseNum(st.saved);
    if (!st.deadline || target <= 0 || saved >= target) { el.classList.remove('on'); return; }
    var dl = Math.round((new Date(st.deadline + 'T00:00:00') - sod(new Date())) / 864e5);
    if (dl <= 0) { el.classList.remove('on'); return; }
    var perDay = (target - saved) / dl;
    var avg = 0;
    try { avg = smartBase().savingsDaily; } catch (e) {}
    var hot = avg > 0 && perDay > avg;
    el.classList.add('on');
    el.classList.toggle('hot', hot);
    el.innerHTML = '<span class="gp-pace__lab">Необходимый темп · до ' + shortDate(st.deadline) + '</span>' +
      '<div class="gp-pace__grid">' +
      '<div><small>в день</small><b>' + money(perDay) + '</b></div>' +
      '<div><small>в неделю</small><b>' + money(perDay * 7) + '</b></div>' +
      '<div><small>в месяц</small><b>' + money(perDay * 30) + '</b></div>' +
      '</div>' +
      '<div class="gp-pace__warn">Превышает ваш средний темп накоплений (' + money(avg) + '/день)</div>';
  }
  function bind() {
    $id('goal-form-close').onclick = close;
    $id('goal-form-name').oninput = function () { st.name = $id('goal-form-name').value; };
    $id('goal-form-target').oninput = function () { st.target = $id('goal-form-target').value; updatePace(); };
    $id('goal-form-saved').oninput = function () { st.saved = $id('goal-form-saved').value; updatePace(); };
    $id('goal-form-deadline').oninput = function () { st.deadline = $id('goal-form-deadline').value; updatePace(); };
    var del = $id('goal-form-delete');
    if (del) del.onclick = openDeleteConfirm;
    $id('goal-form-save').onclick = saveForm;
  }
  function openBs(inner) {
    if (!bsEl) {
      bsEl = document.createElement('div');
      bsEl.className = 'bs-host';
      bsEl.setAttribute('aria-hidden', 'true');
      bsEl.innerHTML = '<div class="bs-backdrop"></div><div class="bs-panel"></div>';
      fsEl.appendChild(bsEl);
      bsEl.querySelector('.bs-backdrop').onclick = closeBs;
    }
    bsEl.querySelector('.bs-panel').innerHTML = '<div class="grabber"></div>' + inner;
    bsEl.classList.add('open');
    bsEl.setAttribute('aria-hidden', 'false');
    bsOpen = true;
    icons(bsEl);
  }
  function closeBs() {
    if (!bsEl) return;
    bsEl.classList.remove('open');
    bsOpen = false;
    const host = bsEl;
    setTimeout(() => { host.setAttribute('aria-hidden', 'true'); const p = host.querySelector('.bs-panel'); if (p) p.innerHTML = ''; }, 380);
  }
  async function openDeleteConfirm() {
    if (!editing) return;
    const ok = await confirmSheet({ title:'Удалить накопление', hint:'Накопление и его история пополнений будут удалены', entityName: editing.name, icon: editing.icon, color: editing.color, ok:'Удалить', danger:true });
    if (!ok) return;
    const id = editing.id;
    S.goals = S.goals.filter(function (g) { return g.id !== id; });
    save(); haptic(12);
    close();
    render(true); refreshTop();
    toast('Накопление удалено');
  }
  function saveForm() {
    if (!fsEl) return;
    const isEdit = !!editing;
    const payload = {
      name: st.name.trim() || 'Новая покупка',
      target: parseNum(st.target),
      saved: parseNum(st.saved),
      deadline: st.deadline || null,
      color: st.color,
      icon: st.icon || 'target',
      order: editing ? (editing.order !== undefined && editing.order !== null ? editing.order : S.goals.indexOf(editing)) : S.goals.length
    };
    let saved;
    if (editing) { Object.assign(editing, payload); saved = editing; }
    else { payload.id = uid(); S.goals.push(payload); saved = payload; }
    save(); haptic(12);
    close();
    render(true); refreshTop();
    toast(isEdit ? 'Накопление обновлено' : 'Накопление создано');
    if (onDone) { const cb = onDone; onDone = null; cb(saved); }
  }

  return { open: open, close: close, handleEscape: handleEscape };
})();
function openGoalForm(params, done) { const p = (params && typeof params === 'string') ? { id: params } : (params || {}); GoalFormScreen.open(p, done); }

/* ═══════════════════════════════ 10. goals editor ═══════════════════════════════ */
function goalContribute(id) {
  const g = S.goals.find(x => x.id === id); if (!g) return;
  openSheet({
    title: 'Пополнить: ' + g.name,
    html: '<div style="display:flex;flex-direction:column;gap:14px">' +
      '<input class="gp-inp" id="v" inputmode="decimal" placeholder="0" autofocus>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap">' + [50, 100, 200, 500].map(n => '<button class="chip chip--flat" data-q="' + n + '">+' + money(n) + '</button>').join('') + '</div>' +
      '<p style="margin:0 4px;color:var(--t3);font-size:13px;line-height:1.5">Осталось накопить ' + money(Math.max(0, g.target - g.saved)) + '</p>' +
      '<button class="btn btn--chrome" id="ok" disabled>Сохранить</button></div>',
    mount(sh) {
      const inp = sh.querySelector('#v'), ok = sh.querySelector('#ok');
      const sync = () => { ok.disabled = !(parseFloat(String(inp.value).replace(',', '.')) > 0); };
      inp.oninput = sync;
      sh.querySelectorAll('[data-q]').forEach(b => b.onclick = () => { inp.value = b.dataset.q; haptic(); sync(); });
      ok.onclick = () => {
        const v = parseFloat(String(inp.value).replace(',', '.')) || 0;
        if (v <= 0) { toast('Введите сумму'); return; }
        g.saved = Math.round((g.saved + v) * 100) / 100;
        (g.history = g.history || []).push({ date: iso(new Date()), v });
        /* деньги уезжают на защищённый счёт «Накопления» (перевод с обычного счёта) */
        const sysG = sysAcc('goals');
        const src = [UI.accId ? accById(UI.accId) : null].concat(S.accounts.filter(x => !x.system && !x.archived))
          .filter(Boolean).find(x => x.currency === S.settings.currency && (!sysG || x.id !== sysG.id));
        if (sysG && src && sysG.currency === S.settings.currency) {
          Store.addTransaction({
            type: 'transfer',
            amount: v,
            accountId: src.id,
            toAccountId: sysG.id,
            note: 'Покупка: ' + g.name,
            date: iso(new Date()) + 'T' + new Date().toTimeString().slice(0, 5)
          });
        }
        closeSheet(); haptic(10); refreshTop();
        toast(g.saved >= g.target && g.target > 0 ? 'Достигнуто 🎉 Можно покупать!' : g.name + ': +' + money(v));
      };
    }
  });
}
