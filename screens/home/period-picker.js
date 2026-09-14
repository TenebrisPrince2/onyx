"use strict";

/* screens/home/period-picker.js — выбор периода для Home и Статистики (native iOS picker, custom periods, options HTML). */

function periodOptionsHTML(currentVal, presets, extraOption) {
  const customPeriods = S.settings.customPeriods || [];
  let html = extraOption || '';
  html += presets.map(p => {
    const id = p.id || p[0];
    const label = p.label || p[1];
    return '<option value="' + id + '"' + (currentVal === id ? ' selected' : '') + '>' + esc(label) + '</option>';
  }).join('');
  if (customPeriods.length > 0) {
    html += '<optgroup label="Пользовательские">';
    customPeriods.forEach(cp => {
      const cid = 'custom:' + cp.id;
      html += '<option value="' + cid + '"' + (currentVal === cid ? ' selected' : '') + '>' + esc(cp.label) + '</option>';
    });
    html += '</optgroup>';
  }
  html += '<option value="__custom__">Произвольный период…</option>';
  return html;
}

function onPeriodChange(val) {
  if (!val || val === '__day__') return;
  if (val === '__custom__') {
    const curV = (UI.ledger.period === 'custom' && UI.ledger.customId) ? ('custom:' + UI.ledger.customId) : (UI.ledger.period || 'month');
    const sel = document.getElementById('balperSelect');
    if (sel) sel.value = curV;
    openCustomPeriodNative();
    return;
  }
  let p, cid = null;
  if (val.startsWith('custom:')) {
    p = 'custom';
    cid = val.slice(7);
  } else {
    p = val;
  }
  if (UI.ledger.period === p && UI.ledger.customId === cid && !UI.ledger.day) {
    return;
  }
  UI.ledger.period = p;
  UI.ledger.customId = cid;
  UI.ledger.day = null;
  UI.ledger.limit = (p === 'all' ? 200 : 50);
  _ledgerModel = null;
  _ledgerGroups = null;
  if (typeof haptic === 'function') haptic('light');
  if (typeof render === 'function') {
    try { render(true); } catch (_) {}
  }
}

function onAsPeriodChange(val) {
  if (!val) return;
  if (val === '__custom__') {
    const curV = (AS.period === 'custom' && AS.custom) ? ('custom:' + AS.custom) : (AS.period || 'month');
    const sel = document.getElementById('asPeriodSelect');
    if (sel) sel.value = curV;
    openCustomPeriodNative(id => {
      AS.period = 'custom';
      AS.custom = id;
      AS.focus = null;
      AS.selDay = null;
      asRender();
    });
    return;
  }
  let p, cid = null;
  if (val.startsWith('custom:')) {
    p = 'custom';
    cid = val.slice(7);
  } else {
    p = val;
  }
  if (AS.period === p && AS.custom === cid) {
    return;
  }
  AS.period = p;
  AS.custom = cid;
  AS.focus = null;
  AS.selDay = null;
  if (typeof haptic === 'function') haptic('light');
  asRender();
}

function openPeriodPicker(id) {
  const sel = id ? document.getElementById(id) : document.getElementById('balperSelect');
  if (sel) {
    if (typeof sel.showPicker === 'function') {
      try { sel.showPicker(); return; } catch (_) {}
    }
    sel.focus();
    sel.click();
  }
}

function openCustomPeriodNative(onSelect) {
  const today = iso(sod(new Date()));
  const defFrom = iso(addD(sod(new Date()), -7));
  const saved = S.settings.customPeriods || [];

  const savedListHTML = saved.length > 0
    ? '<div style="font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--t3);margin:16px 0 8px;">Сохранённые периоды</div>' +
      '<div class="cp-saved-list">' +
        saved.map(cp =>
          '<div class="cp-saved-row" data-id="' + cp.id + '">' +
            '<span>' + esc(cp.label) + '</span>' +
            '<button type="button" class="iconbtn" data-del-cp="' + cp.id + '" style="width:32px;height:32px;background:transparent;color:var(--t3)" aria-label="Удалить">' +
              '<i data-lucide="trash" class="ic" style="width:15px;height:15px"></i>' +
            '</button>' +
          '</div>'
        ).join('') +
      '</div>'
    : '';

  const html =
    '<div class="cp-modal-bd">' +
      '<div class="cp-fields-grid">' +
        '<label class="field"><span>От</span><input type="date" class="inp" id="cpFromInp" value="' + defFrom + '"></label>' +
        '<label class="field"><span>До</span><input type="date" class="inp" id="cpToInp" value="' + today + '"></label>' +
      '</div>' +
      savedListHTML +
      '<button type="button" class="btn btn--chrome" id="cpApplyBtn" style="width:100%;margin-top:16px" disabled>Применить</button>' +
    '</div>';

  openSheet({
    title: 'Произвольный период',
    html: html,
    mount(sh) {
      const fromInp = sh.querySelector('#cpFromInp');
      const toInp = sh.querySelector('#cpToInp');
      const applyBtn = sh.querySelector('#cpApplyBtn');

      const check = () => {
        const ok = fromInp.value && toInp.value && fromInp.value <= toInp.value;
        applyBtn.disabled = !ok;
      };
      fromInp.oninput = check;
      toInp.oninput = check;
      check();

      sh.querySelectorAll('[data-del-cp]').forEach(btn => {
        btn.onclick = e => {
          e.stopPropagation();
          const id = btn.dataset.delCp;
          S.settings.customPeriods = (S.settings.customPeriods || []).filter(x => x.id !== id);
          if (UI.ledger.period === 'custom' && UI.ledger.customId === id) {
            UI.ledger.period = 'month';
            UI.ledger.customId = null;
          }
          if (AS.period === 'custom' && AS.custom === id) {
            AS.period = 'month';
            AS.custom = null;
            if (AS.el) asRender();
          }
          save();
          haptic('selection');
          const row = btn.closest('.cp-saved-row');
          if (row) row.remove();
        };
      });

      sh.querySelectorAll('.cp-saved-row').forEach(row => {
        row.onclick = e => {
          if (e.target.closest('[data-del-cp]')) return;
          const id = row.dataset.id;
          haptic('light');
          closeSheet();
          if (typeof onSelect === 'function') {
            onSelect(id);
          } else {
            UI.ledger.period = 'custom';
            UI.ledger.customId = id;
            UI.ledger.day = null;
            render(true);
          }
        };
      });

      applyBtn.onclick = () => {
        if (!fromInp.value || !toInp.value || fromInp.value > toInp.value) return;
        const d1 = new Date(fromInp.value + 'T00:00:00');
        const d2 = new Date(toInp.value + 'T00:00:00');
        const fmt = d => String(d.getDate()).padStart(2, '0') + '.' + String(d.getMonth() + 1).padStart(2, '0') + '.' + String(d.getFullYear()).slice(2);
        const cp = {
          id: uid(),
          s: fromInp.value,
          e: toInp.value,
          label: fmt(d1) + ' – ' + fmt(d2)
        };
        (S.settings.customPeriods || (S.settings.customPeriods = [])).push(cp);
        save();
        haptic('light');
        closeSheet();
        if (typeof onSelect === 'function') {
          onSelect(cp.id);
        } else {
          UI.ledger.period = 'custom';
          UI.ledger.customId = cp.id;
          UI.ledger.day = null;
          render(true);
        }
      };
    }
  });
}

if (typeof window !== 'undefined') {
  window.periodOptionsHTML = periodOptionsHTML;
  window.onPeriodChange = onPeriodChange;
  window.onAsPeriodChange = onAsPeriodChange;
  window.openPeriodPicker = openPeriodPicker;
  window.openCustomPeriodNative = openCustomPeriodNative;
}
