"use strict";
/* screens/accounts.js — счета (секция «8») + форма счёта fullsheet (секция «9c»).
   Вынесено байт-в-байт; все зависимости (utils/storage/domain/S/nav/toast…) разрешаются в момент вызова через общую глобальную область. */
/* ═══════════════════════════════ 8. accounts ═══════════════════════════════ */
function openAccounts() {
  const rec = pushScreen({ id: 'accounts', push: true, html: accHTML(), mount: accMount, refresh: () => { rec.el.innerHTML = accHTML(); icons(rec.el); accMount(rec.el); } });
}
function accHTML() {
  const list = S.accounts.filter(a => !a.archived).sort((a, b) => a.order - b.order);
  const arch = S.accounts.filter(a => a.archived);
  const t = totalsByCur();
  return '<div class="shead"><button class="iconbtn" data-act="close"><i data-lucide="x" class="ic"></i></button><h2>Счета</h2><span class="spacer"></span>' +
    '<button class="iconbtn" data-act="new-acc" aria-label="Добавить"><i data-lucide="plus" class="ic"></i></button></div>' +
    '<div class="screen__body">' +
    '<div class="list" style="margin-bottom:12px"><button class="item" data-act="pick-all" aria-selected="' + (!UI.accId) + '"><span class="item__t" style="font-weight:500">Все счета</span>' +
    '<span style="font-size:18px;font-weight:600;letter-spacing:-.02em">' + Object.keys(t).map(c => money(t[c], c)).join(' · ') + '</span></button></div>' +
    '<div id="accList" style="display:flex;flex-direction:column;gap:6px">' +
    list.map(a => a.system
      ? '<div class="sw sw--sys" data-id="' + a.id + '" title="Защищённый системный счёт">' +
        '<div class="sw__body" data-act="pick-acc" data-id="' + a.id + '" aria-selected="' + (UI.accId === a.id) + '" style="cursor:pointer">' +
        '<span class="tile" style="--c:' + a.color + '"><i data-lucide="' + a.icon + '" class="ic"></i></span>' +
        '<span class="row__main"><span class="row__t">' + esc(a.name) + '</span><span class="row__s">защищённый счёт · ' + a.currency + '</span></span>' +
        '<span class="row__amt" style="margin-right:4px">' + amt(accBalance(a.id), a.currency) + '</span>' +
        '<span style="display:grid;place-items:center;width:34px;height:34px;color:var(--t3)"><i data-lucide="lock" class="ic ic-s"></i></span>' +
        '</div></div>'
      : '<div class="sw" data-id="' + a.id + '">' +
      '<div class="sw__acts sw__acts--full"><button class="sw__del" data-act="del-acc" data-id="' + a.id + '" aria-label="Удалить счёт"><i data-lucide="trash-2" class="ic"></i><span>Удалить</span></button></div>' +
      '<div class="sw__body" data-act="pick-acc" data-id="' + a.id + '" aria-selected="' + (UI.accId === a.id) + '" style="cursor:pointer">' +
      '<span class="tile" style="--c:' + a.color + '"><i data-lucide="' + a.icon + '" class="ic"></i></span>' +
      '<span class="row__main"><span class="row__t">' + esc(a.name) + '</span><span class="row__s">' + (a.hidden ? 'скрыт из обзора · ' : '') + a.currency + '</span></span>' +
      '<span class="row__amt" style="margin-right:4px">' + amt(accBalance(a.id), a.currency) + '</span>' +
      '<button class="iconbtn" style="width:34px;height:34px" data-act="edit-acc" data-id="' + a.id + '" aria-label="Изменить"><i data-lucide="pencil" class="ic ic-s"></i></button>' +
      '<span data-handle style="padding:8px 2px 8px 6px;color:var(--t3);touch-action:none"><i data-lucide="grip-vertical" class="ic ic-s"></i></span>' +
      '</div></div>').join('') + '</div>' +
    (arch.length ? '<div class="label">Архив</div><div class="list">' + arch.map(a => '<button class="item" data-act="edit-acc" data-id="' + a.id + '"><span class="tile tile--sm" style="--c:' + a.color + '"><i data-lucide="' + a.icon + '" class="ic"></i></span><span class="item__t">' + esc(a.name) + '</span><span class="item__v">' + money(accBalance(a.id), a.currency) + '</span></button>').join('') + '</div>' : '') +
    '<p style="color:var(--t3);font-size:13px;line-height:1.55;padding:18px 6px 0">Потяните за ручку, чтобы изменить порядок. Баланс считается от начального значения и всех операций.</p>' +
    '</div>';
}
function accMount(el) {
  el.querySelector('[data-act="close"]').onclick = () => popScreen();
  el.querySelector('[data-act="new-acc"]').onclick = () => openAccountForm();
  const pickAll = el.querySelector('[data-act="pick-all"]');
  if (pickAll) pickAll.onclick = () => { UI.accId = null; UI.ledger.day = null; UI.ledger.limit = 50; haptic(); render(); popScreen(); };
  el.querySelectorAll('[data-act="pick-acc"]').forEach(b => b.onclick = e => { if (b.dataset.swiped === '1') return; if (e.target.closest('[data-act="edit-acc"]') || e.target.closest('[data-handle]')) return; UI.accId = b.dataset.id; UI.ledger.day = null; UI.ledger.limit = 50; haptic(); render(); popScreen(); });
  el.querySelectorAll('[data-act="edit-acc"]').forEach(b => b.onclick = e => {
    e.stopPropagation();
    const a = accById(b.dataset.id);
    if (a && a.system) { toast('Системный счёт нельзя изменить', null, { tone: 'danger' }); return; }
    openAccountForm({ id: b.dataset.id });
  });
  enableDeleteSwipe(el.querySelector('#accList'), { ask: (id, row) => swipeAskDeleteAccount(id, row), instant: (id, row) => swipeDeleteAccount(id, row) });
  enableReorder(el.querySelector('#accList'), ids => { Store.reorderAccounts(ids); refreshTop(); render(true); setTimeout(() => nav[nav.length - 1].refresh(), 10); });
}

/* ═══════════════════════════════ 9c. account form screen (fullsheet) ═══════════════════════════════ */
const AccountFormScreen = (function () {
  const COLORS = FORM_COLORS;
  const CUR_LIST = {
    BYN: { s: BYN_SIGN, name: 'Белорусский рубль' },
    RUB: { s: '₽', name: 'Российский рубль' },
    PLN: { s: 'zł', name: 'Польский злотый' },
    USD: { s: '$', name: 'Доллар США' }
  };
  const SECTIONS = ICON_SECTIONS;

  const $id = id => document.getElementById(id);
  function icHtml(n, size) {
    return svgIcon(n, 'ic', size || 18);
  }

  const st = { name: '', icon: 'wallet', color: '#10b981', start: '0', currency: 'BYN', customOpen: false };
  let editing = null, onDone = null, fsEl = null, bsEl = null, bsOpen = false;

  const defaultCurrency = () => (S.settings && CUR_LIST[S.settings.currency]) ? S.settings.currency : 'BYN';

  function open(params, done) {
    params = params || {};
    onDone = done || null;
    if (bsEl) { bsEl.remove(); bsEl = null; bsOpen = false; }
    document.querySelectorAll('#account-form-screen').forEach(function (n) { n.remove(); });
    fsEl = null;
    st.customOpen = false;
    st.name = ''; st.icon = 'wallet'; st.color = '#10b981';
    st.start = '0'; st.currency = defaultCurrency();
    editing = null;
    if (params.id) {
      const a = accById(params.id);
      if (a) {
        editing = a;
        st.name = a.name || '';
        st.icon = a.icon || 'wallet';
        st.color = hexable(a.color) || '#10b981';
        st.currency = CUR_LIST[a.currency] ? a.currency : defaultCurrency();
        st.start = String(a.start !== undefined && a.start !== null ? a.start : (a.initial !== undefined && a.initial !== null ? a.initial : 0));
      }
    }
    const d = editing;
    fsEl = document.createElement('div');
    fsEl.className = 'fullsheet';
    fsEl.id = 'account-form-screen';
    fsEl.setAttribute('aria-hidden', 'false');
    fsEl.innerHTML =
      '<div class="grabber"></div>' +
      '<div class="fs-head">' +
        '<button class="fs-close" id="account-form-close" type="button" aria-label="Закрыть">' + icHtml('x', 20) + '</button>' +
        '<h1 class="fs-title" id="account-form-title">' + (d ? 'Счёт' : 'Новый счёт') + '</h1>' +
        '<span class="fs-spacer"></span>' +
      '</div>' +
      '<div class="fs-body fs-body--sec">' +
        '<div class="fs-sec fs-sec__nm">' +
          '<div class="name-card name-card__sigma">' +
            '<span class="name-tile" id="account-form-preview" style="background:' + hexToRgba(st.color, 0.15) + ';color:' + st.color + '">' + icHtml(st.icon, 19) + '</span>' +
            '<input id="account-form-name" placeholder="Название счета" maxlength="40" autocomplete="off" value="' + esc(st.name) + '">' +
          '</div>' +
        '</div>' +
        '<div class="fs-sec fs-sec__sigma"><div class="pal" id="account-form-palette"></div>' +
        '</div>' +
        '<div class="fs-sec fs-sec__icon"><div class="ipick" id="account-form-picker"></div>' +
        '</div>' +
        '<div class="fs-sec fs-sec__bal"><div class="bal-card">' +
            '<div class="bal-row">' +
              icHtml('landmark', 18, 'var(--mut)') +
              '<span class="bal-label">Начальный баланс</span>' +
              '<input class="bal-input" id="account-form-start" inputmode="decimal" value="' + esc(st.start) + '">' +
            '</div>' +
            '<button class="bal-row" id="account-form-currency" type="button">' +
              '<span class="bal-cur-sym" id="account-form-currency-sym">' + CUR_LIST[st.currency].s + '</span>' +
              '<span class="bal-label">Валюта</span>' +
              '<span class="bal-cur-code" id="account-form-currency-code">' + st.currency + '</span>' +
            '</button>' +
          '</div>' +
        '</div>' +
        (d && S.accounts.length > 1 ? '<button class="del-btn" id="account-form-delete" type="button">Удалить</button>' : '') +
      '</div>' +
      '<div class="fs-foot"><button class="save-btn" id="account-form-save" type="button">Сохранить</button></div>';
    $('#overlays').appendChild(fsEl);
    renderPalette();
    renderPicker();
    bind();
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
    var tile = $id('account-form-preview');
    if (!tile) return;
    tile.style.background = hexToRgba(st.color, 0.15);
    tile.style.color = st.color;
    tile.innerHTML = icHtml(st.icon, 19);
    icons(tile);
  }
  function renderPalette() {
    var prevScroll = null;
    var oldRow = $id('account-form-palette').querySelector('.pal-row');
    if (oldRow) prevScroll = oldRow.scrollLeft;
    const html = (st.customOpen ? customHTML() : '') +
      '<div class="pal-row">' +
      COLORS.map(function (c) {
        var on = c === st.color || c.toUpperCase() === String(st.color).toUpperCase();
        return '<button class="pal-sw' + (on ? ' on' : '') + '" data-c="' + c + '" type="button" style="background:' + c + '" aria-label="Цвет" aria-pressed="' + on + '">' +
          '</button>';
      }).join('') +
      '<button class="pal-custom' + (st.customOpen ? ' on' : '') + '" id="account-form-custom" type="button" aria-label="Свой цвет">' + icHtml('palette', 13) + '</button>' +
      '</div>';
    $id('account-form-palette').innerHTML = html;
    if (prevScroll !== null) {
      var row = $id('account-form-palette').querySelector('.pal-row');
      if (row) { row.style.scrollBehavior = 'auto'; row.scrollLeft = prevScroll; }
    }
    icons($id('account-form-palette'));
    bindPalette();
  }
  function customHTML() {
    var valid = /^#[0-9a-fA-F]{6}$/.test(st.color);
    return '<div class="pal-box">' +
      '<div class="pal-hd"><span>Свой цвет</span><button class="pal-close" id="account-form-pal-close" type="button" aria-label="Закрыть выбор цвета">' + icHtml('x', 14) + '</button></div>' +
      '<div class="pal-hexrow">' +
        '<label class="pal-lg" title="Выбрать цвет">' +
          '<span class="pal-prev" id="account-form-hex-preview" style="background:' + (valid ? st.color : '#ff453a') + '"></span>' +
          '<input type="color" class="pal-native" id="account-form-native" value="' + (valid ? st.color : '#ff453a') + '" aria-label="Выбрать цвет">' +
        '</label>' +
        '<input class="pal-hex" id="account-form-hex" maxlength="7" placeholder="#ff453a" value="' + esc(st.color) + '" spellcheck="false" autocomplete="off">' +
      '</div>' +
      '</div>';
  }
  function markRamp() {
    var box = $id('account-form-palette');
    if (!box) return;
    box.querySelectorAll('.pal-sw').forEach(function (s) {
      var on = s.dataset.c.toUpperCase() === String(st.color).toUpperCase();
      s.classList.toggle('on', on);
      s.setAttribute('aria-pressed', on);
    });
  }
  function bindPalette() {
    var box = $id('account-form-palette');
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
    $id('account-form-custom').onclick = function () {
      st.customOpen = !st.customOpen;
      haptic(5);
      renderPalette();
    };
    if (st.customOpen) {
      var hex = $id('account-form-hex');
      var prev = $id('account-form-hex-preview');
      var nat = $id('account-form-native');
      $id('account-form-pal-close').onclick = function () {
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
    $id('account-form-picker').innerHTML = html;
    icons($id('account-form-picker'));
    $id('account-form-picker').querySelectorAll('.ipick-btn').forEach(function (b) {
      b.onclick = function () {
        st.icon = b.dataset.i;
        haptic(4);
        renderPicker();
        renderNameTile();
      };
    });
  }
  function bind() {
    $id('account-form-close').onclick = close;
    $id('account-form-name').oninput = function () { st.name = $id('account-form-name').value; };
    $id('account-form-start').oninput = function () { st.start = $id('account-form-start').value; };
    $id('account-form-currency').onclick = openCurrencySheet;
    var del = $id('account-form-delete');
    if (del) del.onclick = openDeleteConfirm;
    $id('account-form-save').onclick = saveForm;
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
    icons(bsEl);
  }
  function closeBs() {
    if (!bsEl) return;
    bsEl.classList.remove('open');
    bsOpen = false;
    const host = bsEl;
    setTimeout(() => { host.setAttribute('aria-hidden', 'true'); const p = host.querySelector('.bs-panel'); if (p) p.innerHTML = ''; }, 380);
  }
  function renderCurrencyRow() {
    var sym = $id('account-form-currency-sym');
    var code = $id('account-form-currency-code');
    if (sym) sym.innerHTML = CUR_LIST[st.currency].s;
    if (code) code.textContent = st.currency;
  }
  function openCurrencySheet() {
    var html = '<div class="bs-body" id="account-form-currency-sheet">' +
      Object.keys(CUR_LIST).map(function (c) {
        var on = st.currency === c;
        var item = CUR_LIST[c];
        var sym = c === 'BYN'
          ? '<span style="display:inline-flex;align-items:center;justify-content:center;width:100%;font-size:28px">' + BYN_SIGN + '</span>'
          : item.s;
        return '<button class="bs-item bs-item--cat' + (on ? ' on' : '') + '" data-cur="' + c + '" type="button">' +
          '<span style="width:40px;text-align:center;font-size:18px;font-weight:700">' + sym + '</span>' +
          '<span class="bs-item-t" style="font-weight:600">' + item.name + '</span>' +
          '<span style="color:var(--mut);font-size:14px">' + c + '</span>' +
          '</button>';
      }).join('') + '</div>';
    openBs(html);
    bsEl.querySelectorAll('[data-cur]').forEach(function (b) {
      b.onclick = function () {
        st.currency = b.dataset.cur;
        haptic(5);
        closeBs();
        renderCurrencyRow();
      };
    });
  }
  async function openDeleteConfirm() {
    if (!editing) return;
    const ok = await confirmSheet({ title:'Удалить счёт', hint:'Счёт и все его операции будут удалены', entityName: editing.name, icon: editing.icon, color: editing.color, ok:'Удалить', danger:true });
    if (!ok) return;
    const id = editing.id;
    S.transactions = S.transactions.filter(function (t) { return t.accountId !== id && t.toAccountId !== id; });
    S.accounts = S.accounts.filter(function (a) { return a.id !== id; });
    if (UI.accId === id) UI.accId = null;
    save(); haptic(12);
    close();
    render(true); refreshTop();
    toast('Счёт удалён');
  }
  function saveForm() {
    if (!fsEl) return;
    const isEdit = !!editing;
    const startNumber = parseFloat(String(st.start).replace(',', '.')) || 0;
    const payload = {
      name: st.name.trim() || 'Кошелек',
      icon: st.icon || 'wallet',
      color: st.color,
      currency: st.currency,
      start: startNumber,
      hidden: false
    };
    payload.initial = startNumber;
    payload.inTotal = !payload.hidden;
    let saved;
    if (editing) {
      payload.id = editing.id;
      payload.order = editing.order;
      payload.archived = editing.archived;
      Object.assign(editing, payload);
      saved = editing;
    } else {
      payload.id = uid();
      payload.order = S.accounts.length;
      S.accounts.push(payload);
      saved = payload;
    }
    save(); haptic(12);
    close();
    render(true); refreshTop();
    toast(isEdit ? 'Счёт обновлён' : 'Счёт создан');
    if (onDone) { var cb = onDone; onDone = null; cb(saved); }
  }

  return { open: open, close: close, handleEscape: handleEscape };
})();
function openAccountForm(params, done) { AccountFormScreen.open(params, done); }
