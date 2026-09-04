"use strict";
/* screens/categories.js — категории (секция «9») + форма категории fullsheet (секция «9b»).
   Вынесено байт-в-байт; все зависимости (utils/storage/domain/S/nav/toast…) разрешаются в момент вызова через общую глобальную область. */
/* ═══════════════════════════════ 9. categories ═══════════════════════════════ */
function openCategories() {
  const rec = pushScreen({ id: 'cats', push: true, html: catsHTML(), mount: catsMount, refresh: () => { rec.el.innerHTML = catsHTML(); icons(rec.el); catsMount(rec.el); } });
}
function catsHTML() {
  const kind = UI.catKind;
  const tops = topCats(kind);
  /* PERF: раньше для КАЖДОЙ категории отдельно прогонялся filter по всем операциям,
     а внутри предиката на каждую операцию заново строился массив id ([c.id, ...kids.map()])
     и ДВАЖДЫ вызывался periodRange() — это ~15 аллокаций Date на операцию.
     При 20 категориях и 900 операциях: 18 000 итераций и ~270 000 аллокаций
     (300-800 мс на iPhone XR — экран «Категории» открывался с заметным фризом).
     Теперь: одна карта «категория → корень» и один проход по операциям. */
  const rootOfCat = new Map();
  tops.forEach(c => { rootOfCat.set(c.id, c.id); childrenOf(c.id).forEach(k => rootOfCat.set(k.id, c.id)); });
  const _pr = periodRange('month', 0), _kf = iso(_pr.from), _kt = iso(_pr.to);
  const spentBy = Object.create(null);
  S.transactions.forEach(t => {
    if (t.type !== kind) return;
    const k = String(t.date || '').slice(0, 10);
    if (k < _kf || k > _kt) return;
    const rid = t.categoryId && rootOfCat.get(t.categoryId);
    if (!rid) return;
    spentBy[rid] = (spentBy[rid] || 0) + t.amount;
  });
  return '<div class="shead"><button class="iconbtn" data-act="close"><i data-lucide="x" class="ic"></i></button><h2>Категории</h2><span class="spacer"></span>' +
    '<button class="iconbtn" data-act="new-cat" aria-label="Добавить"><i data-lucide="plus" class="ic"></i></button></div>' +
    '<div style="padding:calc(var(--top) + 66px) 14px 12px;max-width:300px;margin:0 auto;width:100%">' + segHTML('kind', kind, [['income', 'Доход', ARR_IN], ['expense', 'Расход', ARR_OUT]]) + '</div>' +
    '<div class="screen__body" style="padding-top:0"><div id="catList" style="display:flex;flex-direction:column;gap:6px;padding-top:4px">' +
    tops.map(c => {
      const kids = childrenOf(c.id);
      const spent = spentBy[c.id] || 0;
      return '<div class="sw" data-id="' + c.id + '">' +
        '<div class="sw__acts sw__acts--full"><button class="sw__del" data-act="del-cat" data-id="' + c.id + '" aria-label="Удалить категорию"><i data-lucide="trash-2" class="ic"></i><span>Удалить</span></button></div>' +
        '<div class="sw__body" style="cursor:default"><span class="tile" style="--c:' + c.color + '"><i data-lucide="' + catLuc(c.icon) + '" class="ic"></i></span>' +
        '<span class="row__main"><span class="row__t">' + esc(c.name) + '</span><span class="row__s">' + (kids.length ? kids.length + ' подкатегории · ' : '') + (spent ? money(spent) + ' за месяц' : 'нет операций в этом месяце') + '</span></span>' +
        '<button class="iconbtn" style="width:34px;height:34px" data-act="edit-cat" data-id="' + c.id + '"><i data-lucide="pencil" class="ic ic-s"></i></button>' +
        '<span data-handle style="padding:8px 2px 8px 6px;color:var(--t3);touch-action:none"><i data-lucide="grip-vertical" class="ic ic-s"></i></span></div></div>' +
        (kids.length ? '<div style="display:flex;flex-wrap:wrap;gap:6px;padding:2px 6px 6px 22px">' + kids.map(k =>
          '<button class="chip chip--flat" style="padding:7px 13px;font-size:13px" data-act="edit-cat" data-id="' + k.id + '"><i data-lucide="' + catLuc(k.icon) + '" class="ic ic-s" style="color:' + k.color + '"></i>' + esc(k.name) + '</button>').join('') + '</div>' : '');
    }).join('') + '</div>' +
    '<button class="btn btn--ghost btn--sm" style="margin-top:16px" data-act="new-cat"><i data-lucide="plus" class="ic"></i>Новая категория</button>' +
    '<p style="color:var(--t3);font-size:13px;line-height:1.55;padding:16px 6px 0">Подкатегории считаются внутри родителя в аналитике.</p></div>';
}
function catsMount(el) {
  el.querySelector('[data-act="close"]').onclick = () => popScreen();
  el.querySelectorAll('[data-act="new-cat"]').forEach(b => b.onclick = () => openCategoryScreen({ kind: UI.catKind }));
  el.querySelectorAll('[data-act="edit-cat"]').forEach(b => b.onclick = () => openCategoryScreen({ id: b.dataset.id }));
  bindSeg(el, 'kind', v => { UI.catKind = v; nav[nav.length - 1].refresh(); });
  enableDeleteSwipe(el.querySelector('#catList'), { ask: (id, row) => swipeAskDeleteCategory(id, row), instant: (id, row) => swipeDeleteCategory(id, row) });
  enableReorder(el.querySelector('#catList'), ids => { Store.reorderCategories(ids); nav[nav.length - 1].refresh(); });
}

/* ═══════════════════════════════ 9b. category form screen (fullsheet) ═══════════════════════════════ */
const CategoryFormScreen = (function () {
  const INC_RAMP = FORM_COLORS;
  const EXP_RAMP = FORM_COLORS;
  const RAMP = { income: INC_RAMP, expense: EXP_RAMP };
  const SECTIONS = ICON_SECTIONS;

  const $id = id => document.getElementById(id);
  function icon(name, size) {
    return svgIcon(name, 'ic', size || 18);
  }

  const st = { type: 'expense', name: '', icon: 'star', color: '#ff9500', parentId: null, customOpen: false };
  let editing = null, onDone = null, fsEl = null, bsEl = null, bsOpen = false;

  function open(params, done) {
    params = params || {};
    onDone = done || null;
    if (bsEl) { bsEl.remove(); bsEl = null; bsOpen = false; }
    document.querySelectorAll('#category-form-screen').forEach(function (n) { n.remove(); });
    fsEl = null;
    st.customOpen = false;
    st.type = 'expense'; st.name = ''; st.icon = 'star'; st.color = '#ff9500'; st.parentId = null;
    editing = null;
    if (params.id) {
      const c = catById(params.id);
      if (c) {
        editing = c;
        st.type = c.kind === 'income' ? 'income' : 'expense';
        st.name = c.name;
        st.icon = c.icon || 'star';
        st.color = hexable(c.color) || (st.type === 'income' ? '#30d158' : '#ff9500');
        st.parentId = c.parentId || null;
      }
    } else if (params.parentId) {
      st.parentId = params.parentId;
      const own = catById(st.parentId);
      if (own) st.type = own.kind === 'income' ? 'income' : 'expense';
      if (st.type === 'income') st.color = '#30d158';
    } else if (params.kind === 'income' || params.type === 'income') {
      st.type = 'income'; st.color = '#30d158';
    }
    const d = editing, t = st.type;
    fsEl = document.createElement('div');
    fsEl.className = 'fullsheet';
    fsEl.id = 'category-form-screen';
    fsEl.setAttribute('aria-hidden', 'false');
    fsEl.innerHTML =
      '<div class="grabber"></div>' +
      '<div class="fs-head">' +
        '<button class="fs-close" id="fsClose" aria-label="Закрыть">' + icon('x', 20) + '</button>' +
        '<h1 class="fs-title" id="fsTitle">' + (d ? 'Категория' : 'Новая категория') + '</h1>' +
        '<span class="fs-spacer"></span>' +
      '</div>' +
      '<div class="fs-body">' +
        '<button class="parent-btn' + (st.parentId ? ' sel' : '') + '" id="parentBtn">' + parentInner() + '</button>' +
        '<div class="name-card">' +
          '<span class="name-tile" id="nameTile" style="background:' + hexToRgba(st.color, 0.15) + ';color:' + st.color + '">' + icon(st.icon, 19) + '</span>' +
          '<input id="nameInp" placeholder="Название" maxlength="40" autocomplete="off" value="' + esc(st.name) + '">' +
        '</div>' +
        '<div class="type-wrap">' +
          '<div class="type-seg">' +
            '<button class="type-btn inc' + (t === 'income' ? ' on' : '') + '" id="tbIn" aria-pressed="' + (t === 'income') + '">' +
              '<span class="type-fill' + (t === 'income' ? ' onfill' : '') + '"></span>' +
              '<span class="type-in">' + ARR_IN + 'Доход</span>' +
            '</button>' +
            '<button class="type-btn exp' + (t === 'expense' ? ' on' : '') + '" id="tbEx" aria-pressed="' + (t === 'expense') + '">' +
              '<span class="type-fill' + (t === 'expense' ? ' onfill' : '') + '"></span>' +
              '<span class="type-in">' + ARR_OUT + 'Расход</span>' +
            '</button>' +
          '</div>' +
        '</div>' +
        '<div class="pal" id="palBox"></div>' +
        '<div class="ipick" id="ipick"></div>' +
        (d ? '<button class="del-btn" id="delBtn">Удалить</button>' : '') +
      '</div>' +
      '<div class="fs-foot"><button class="save-btn" id="saveBtn">Сохранить</button></div>';
    $('#overlays').appendChild(fsEl);
    renderPalette();
    renderPicker();
    bind();
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
  function parentInner() {
    var p = st.parentId ? catById(st.parentId) : null;
    if (p) {
      return icon('plus', 16) + '<span>' + esc(p.name) + '</span>';
    }
    return icon('plus', 16) + '<span>Родительская категория</span>';
  }
  function renderParent() {
    var p = catById(st.parentId);
    var btn = $id('parentBtn');
    if (!btn) return;
    btn.innerHTML = parentInner();
    btn.classList.toggle('sel', !!p);
  }
  function renderNameTile() {
    var tile = $id('nameTile');
    if (!tile) return;
    tile.style.background = hexToRgba(st.color, 0.15);
    tile.style.color = st.color;
    tile.innerHTML = icon(st.icon, 19);
  }
  function renderType() {
    var t = st.type;
    $id('tbIn').classList.toggle('on', t === 'income');
    $id('tbIn').setAttribute('aria-pressed', t === 'income');
    $id('tbIn').querySelector('.type-fill').classList.toggle('onfill', t === 'income');
    $id('tbEx').classList.toggle('on', t === 'expense');
    $id('tbEx').setAttribute('aria-pressed', t === 'expense');
    $id('tbEx').querySelector('.type-fill').classList.toggle('onfill', t === 'expense');
  }
  function renderPalette() {
    var ramp = RAMP[st.type];
    var prevScroll = null;
    var oldRow = $id('palRow');
    if (oldRow) prevScroll = oldRow.scrollLeft;
    var html = (st.customOpen ? customHTML() : '') +
      '<div class="pal-row" id="palRow">' +
      ramp.map(function (c) {
        var on = c === st.color;
        return '<button class="pal-sw' + (on ? ' on' : '') + '" data-c="' + c + '" style="background:' + c + '" aria-label="Цвет" aria-pressed="' + on + '">' +
          '</button>';
      }).join('') +
      '<button class="pal-custom' + (st.customOpen ? ' on' : '') + '" id="palCustom" aria-label="Свой цвет">' + icon('palette', 13) + '</button>' +
      '</div>';
    $id('palBox').innerHTML = html;
    if (prevScroll !== null) {
      var row = $id('palRow');
      if (row) { row.style.scrollBehavior = 'auto'; row.scrollLeft = prevScroll; }
    }
    bindPalette();
  }
  function customHTML() {
    var valid = /^#[0-9a-fA-F]{6}$/.test(st.color);
    return '<div class="pal-box">' +
      '<div class="pal-hd"><span>Свой цвет</span><button class="pal-close" id="palClose" aria-label="Закрыть выбор цвета">' + icon('x', 14) + '</button></div>' +
      '<div class="pal-hexrow">' +
        '<label class="pal-lg" title="Выбрать цвет">' +
          '<span class="pal-prev" id="palPrev" style="background:' + (valid ? st.color : '#ff453a') + '"></span>' +
          '<input type="color" class="pal-native" id="palNative" value="' + (valid ? st.color : '#ff453a') + '" aria-label="Выбрать цвет">' +
        '</label>' +
        '<input class="pal-hex" id="palHex" maxlength="7" placeholder="#ff453a" value="' + esc(st.color) + '" spellcheck="false" autocomplete="off">' +
      '</div>' +
      '</div>';
  }
  function renderPicker() {
    var html = '<div class="ipick-wrap">' + SECTIONS.map(function (sec) {
      var label = sec[0], names = sec[1];
      return '<div class="ipick-sec"><div class="ipick-t">' + esc(label) + '</div><div class="ipick-grid">' +
        names.map(function (n) {
          var on = st.icon === n;
          return '<button class="ipick-btn' + (on ? ' on' : '') + '" data-i="' + n + '" aria-label="' + esc(n) + '" aria-pressed="' + on + '">' + icon(n, 16) + '</button>';
        }).join('') + '</div></div>';
    }).join('') + '</div>';
    $id('ipick').innerHTML = html;
    $id('ipick').querySelectorAll('.ipick-btn').forEach(function (b) {
      b.onclick = function () {
        st.icon = b.dataset.i;
        haptic(4);
        renderPicker();
        renderNameTile();
      };
    });
  }
  function bindPalette() {
    var host = $id('palBox');
    host.querySelectorAll('.pal-sw').forEach(function (b) {
      b.onclick = function () {
        st.color = b.dataset.c;
        haptic(5);
        if (st.customOpen) {
          st.customOpen = false;
          var bx = host.querySelector('.pal-box');
          if (bx) bx.remove();
        }
        markRamp();
        renderNameTile();
      };
    });
    $id('palCustom').onclick = function () {
      st.customOpen = !st.customOpen;
      haptic(5);
      renderPalette();
    };
    if (st.customOpen) {
      var hex = $id('palHex');
      var prev = $id('palPrev');
      var nat = $id('palNative');
      $id('palClose').onclick = function () {
        st.customOpen = false;
        haptic(6);
        renderPalette();
      };
      hex.oninput = function () {
        var v = hex.value.trim();
        if (/^#[0-9a-fA-F]{6}$/.test(v)) {
          st.color = v.toLowerCase();
          haptic(5);
          prev.style.background = st.color;
          nat.value = st.color;
          renderNameTile();
          markRamp(false);
        }
      };
      nat.oninput = function () {
        st.color = nat.value;
        haptic(5);
        hex.value = st.color;
        prev.style.background = st.color;
        renderNameTile();
        markRamp(false);
      };
    }
  }
  function markRamp(match) {
    var row = $id('palRow');
    if (!row) return;
    row.querySelectorAll('.pal-sw').forEach(function (s) {
      var on = s.dataset.c === st.color;
      s.classList.toggle('on', on);
      s.setAttribute('aria-pressed', on);
    });
  }
  function bind() {
    $id('fsClose').onclick = close;
    $id('parentBtn').onclick = openParentSheet;
    $id('tbIn').onclick = function () {
      if (st.type === 'income') return;
      st.type = 'income';
      st.parentId = null;
      haptic(5);
      renderType();
      renderParent();
      renderPalette();
    };
    $id('tbEx').onclick = function () {
      if (st.type === 'expense') return;
      st.type = 'expense';
      st.parentId = null;
      haptic(5);
      renderType();
      renderParent();
      renderPalette();
    };
    var del = $id('delBtn');
    if (del) del.onclick = openConfirm;
    $id('saveBtn').onclick = saveForm;
  }
  function openBs(inner) {
    if (!bsEl) {
      bsEl = document.createElement('div');
      bsEl.className = 'bs-host';
      bsEl.setAttribute('aria-hidden', 'true');
      bsEl.innerHTML = '<div class="bs-backdrop"></div><div class="bs-panel"></div>';
      $('#overlays').appendChild(bsEl);
      bsEl.querySelector('.bs-backdrop').onclick = closeBs;
    }
    bsEl.querySelector('.bs-panel').innerHTML = '<div class="grabber"></div>' + inner;
    bsEl.classList.add('open');
    bsEl.setAttribute('aria-hidden', 'false');
    bsOpen = true;
  }
  function closeBs() {
    if (!bsEl) return;
    bsEl.classList.remove('open');
    bsOpen = false;
    const host = bsEl;
    setTimeout(() => { host.setAttribute('aria-hidden', 'true'); const p = host.querySelector('.bs-panel'); if (p) p.innerHTML = ''; }, 380);
  }
  function openParentSheet() {
    const opts = S.categories.filter(function (c) {
      return c.kind === st.type && c.parentId === null && c.id !== (editing ? editing.id : null);
    }).sort((a, b) => a.order - b.order);
    const noneOn = !st.parentId;
    const pRow = (id, tile, name, on) => '<button class="item" data-p="' + id + '"' + (on ? ' aria-selected="true"' : '') + '>' +
      tile +
      '<span class="item__t">' + name + '</span>' +
      (on ? '<i data-lucide="check" class="ic" style="color:var(--t1)"></i>' : '') + '</button>';
    const html = '<div class="list">' +
      pRow('', '<span class="tile tile--sm" style="--c:var(--t3)"><i data-lucide="slash" class="ic"></i></span>', 'Без родителя', noneOn) +
      opts.map(function (c) {
        return pRow(c.id, '<span class="tile tile--sm" style="--c:' + c.color + '"><i data-lucide="' + catLuc(c.icon) + '" class="ic"></i></span>', esc(c.name), st.parentId === c.id);
      }).join('') + '</div>';
    openSheet({
      title: editing && editing.parentId ? 'Родитель категории' : 'Родительская категория',
      html,
      mount(sh) {
        sh.querySelectorAll('[data-p]').forEach(function (b) {
          b.onclick = function () {
            st.parentId = b.dataset.p || null;
            haptic(5);
            closeSheet();
            renderParent();
          };
        });
      }
    });
  }
  async function openConfirm() {
    if (!editing) return;
    const cat = editing;
    const hint = cat.parentId ? 'Подкатегория будет удалена. Операции станут «Без категории».' : 'Категория и все её операции будут удалены. Подкатегории станут без родителя.';
    const ok = await confirmSheet({ title: cat.parentId ? 'Удалить подкатегорию' : 'Удалить категорию', hint, entityName: cat.name, icon: catLuc(cat.icon), color: cat.color, ok:'Удалить', danger:true });
    if (!ok) return;
    const id = cat.id;
    S.transactions.forEach(function (o) { if (o.categoryId === id) o.categoryId = null; });
    S.categories.forEach(function (c) { if (c.parentId === id) c.parentId = null; });
    S.categories = S.categories.filter(function (c) { return c.id !== id; });
    save();
    haptic(12);
    close();
    render(true); refreshTop();
    toast('Категория удалена');
    notifyCatsChanged();
  }
  function saveForm() {
    if (!fsEl) return;
    const isEdit = !!editing;
    const name = ($id('nameInp').value || '').trim();
    const payload = {
      name: name || 'Без категории',
      icon: st.icon,
      color: st.color,
      kind: st.type,
      parentId: st.parentId,
      order: editing ? editing.order : S.categories.length
    };
    let saved;
    if (editing) { Object.assign(editing, payload); saved = editing; }
    else { payload.id = uid(); S.categories.push(payload); saved = payload; }
    save(); haptic(12);
    close();
    render(true); refreshTop();
    toast(isEdit ? 'Категория обновлена' : 'Категория создана');
    if (onDone) { const cb = onDone; onDone = null; cb(saved); }
    notifyCatsChanged();
  }

  return { open: open, close: close, handleEscape: handleEscape };
})();
function openCategoryScreen(params, done) { CategoryFormScreen.open(params, done); }
