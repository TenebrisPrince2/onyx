"use strict";
/* screens/settings.js — настройки (секция «13») + бэкап (секция «14»).
   Вынесено байт-в-байт; все зависимости (utils/storage/domain/S/nav/toast…) разрешаются в момент вызова через общую глобальную область. */
/* ═══════════════════════════════ 13. settings ═══════════════════════════════ */
function openSettings() {
  const rec = pushScreen({ id: 'settings', push: true, html: setHTML(), mount: setMount, refresh: () => { const sc = rec.el.querySelector('.screen__body').scrollTop; rec.el.innerHTML = setHTML(); icons(rec.el); setMount(rec.el); rec.el.querySelector('.screen__body').scrollTop = sc; } });
}
function openReminderSheet() {
  const st = S.settings;
  const isDenied = typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'denied';
  openSheet({
    title: 'Напоминание',
    html: '<div class="list"><div class="item"><i data-lucide="bell" class="ic item__ic"></i><span class="item__t">Напоминать вносить траты</span><button class="tg" id="on" aria-checked="' + st.reminder.enabled + '"></button></div>' +
      '<div class="item"><i data-lucide="clock" class="ic item__ic"></i><span class="item__t">Время</span><input type="time" id="tm" value="' + st.reminder.time + '" style="background:var(--s2);border:0;border-radius:12px;padding:8px 12px;font-size:15px"></div></div>' +
      (isDenied ? '<p style="color:var(--exp);font-size:13px;line-height:1.5;padding:12px 6px 0">Уведомления заблокированы в браузере. Разрешите их в настройках сайта.</p>' : '') +
      '<p style="color:var(--t3);font-size:13px;line-height:1.55;padding:14px 6px 0">Работает в фоне через Service Worker. Чтобы напоминания приходили даже при закрытом приложении, добавьте Onyx на экран «Домой» (PWA) и разрешите уведомления.</p>',
    mount(sh) {
      const on = sh.querySelector('#on');
      on.onclick = async () => {
        st.reminder.enabled = !st.reminder.enabled;
        on.setAttribute('aria-checked', st.reminder.enabled);
        haptic();
        save();
        refreshTop();
        render(true);
        if (st.reminder.enabled && typeof window !== 'undefined' && 'Notification' in window) {
          try {
            if (Notification.permission === 'default') await Notification.requestPermission();
          } catch (e) {}
        }
        if (typeof window !== 'undefined' && window.App && App.reminders && App.reminders.sync) {
          App.reminders.sync();
        }
      };
      sh.querySelector('#tm').onchange = e => {
        st.reminder.time = e.target.value;
        save();
        refreshTop();
        if (typeof window !== 'undefined' && window.App && App.reminders && App.reminders.sync) {
          App.reminders.sync();
        }
      };
    }
  });
}
function setHTML() {
  const st = S.settings;
  const row = (icon, title, val, act, extra) => '<button class="item" data-act="' + act + '"><i data-lucide="' + icon + '" class="ic item__ic"></i><span class="item__t">' + title + '</span>' +
    (val ? '<span class="item__v">' + esc(val) + '</span>' : '') + (extra || '<i data-lucide="chevron-right" class="ic ic-s item__ic"></i>') + '</button>';
  const tgl = (icon, title, key, sub) => '<div class="item"><i data-lucide="' + icon + '" class="ic item__ic"></i><span class="item__t">' + title + (sub ? '<small>' + sub + '</small>' : '') + '</span>' +
    '<button class="tg" data-tg="' + key + '" aria-checked="' + !!st[key] + '"></button></div>';
  return '<div class="shead"><button class="iconbtn" data-act="close"><i data-lucide="arrow-left" class="ic"></i></button><h2>Настройки</h2></div>' +
    '<div class="screen__body">' +

    '<div class="label">Основное</div><div class="list">' +
    row('layout-grid', 'Категории', catsOf('expense').length + ' + ' + catsOf('income').length, 'cats') +
    row('wallet-cards', 'Счета', String(S.accounts.length), 'accounts') +
    row('circle-dollar-sign', 'Валюта по умолчанию', st.currency, 'currency') +
    row('bell', 'Напоминание', st.reminder.enabled ? st.reminder.time : 'выкл.', 'reminder') +
    '</div>' +

    '<div class="label">Безопасность</div><div class="list">' +
    row('lock', 'Код-пароль', st.pin ? 'включён' : 'выкл.', 'pin') +
    '</div>' +

    '<div class="label">Данные</div><div class="list">' +
    row('download', 'Экспорт', st.lastBackup ? shortDate(st.lastBackup) : 'ещё не делали', 'export') +
    row('upload', 'Импорт', '', 'import') +
    '<button class="item" data-act="pdf"><i data-lucide="download" class="ic item__ic" style="color:#30d158"></i><span class="item__t">Экспорт отчёта (PDF)</span><span class="item__v">печать</span><i data-lucide="chevron-right" class="ic ic-s item__ic"></i></button>' +
    row('repeat', 'Повторяющиеся операции', String(S.templates.length), 'templates') +
    row('sparkles', 'Добавить демо-данные', 'полгода операций', 'demo-seed') +
    '</div>' +

    '<div class="label">AI-ассистент</div><div class="list">' +
    row('sparkles', 'AI-ассистент', st.ai && st.ai.key ? '' : 'офлайн-режим', 'ai') +
    '</div>' +

    '<div class="label">Приложение</div><div class="list">' +
    row('trash-2', 'Сбросить все данные', '', 'reset') +
    '</div>' +
    '</div>';
}
function setMount(el) {
  const st = S.settings;
  const refresh = () => nav[nav.length - 1].refresh();
  el.querySelector('[data-act="close"]').onclick = () => popScreen();
  el.querySelectorAll('[data-tg]').forEach(b => b.onclick = () => {
    const k = b.dataset.tg;
    Store.updateSetting(k, !st[k]);          /* мутация только через Store (Этап 2) */
    b.setAttribute('aria-checked', st[k]); haptic(); render(true);
  });
  const A = {
    cats: () => openCategories(),
    accounts: () => openAccounts(),
    currency: () => pickFromList('Валюта по умолчанию', Object.keys(CUR).map(c => [c, c + ' · ' + CUR[c].s, true]), st.currency, v => { Store.updateSetting('currency', v); refresh(); render(true); }),
    reminder: openReminderSheet,
    pin: () => st.pin ? confirmSheet({ title: 'Отключить код-пароль?', text: 'Приложение перестанет запрашивать код при запуске.', ok: 'Отключить', danger: true }).then(ok => { if (ok) { Store.updateSetting('pin', ''); refresh(); toast(t('pin.off')); } }) : setupPin(() => refresh()),
    export: doExport, import: doImport,
    templates: openTemplates,
    'demo-seed': async () => {
      if (!await confirmSheet({ title: 'Добавить демо-данные?', text: 'Добавим счета, категории, накопления и полгода операций — как будто приложением уже пользовались. Текущие данные не изменятся.', ok: 'Добавить' })) return;
      const r = seedDemo();
      /* переключаемся на «Все счета» и показываем результат сразу на главной */
      UI.accId = null; UI.ledger.day = null; UI.ledger.limit = 50;
      save(); haptic(10);
      while (nav.length) popScreen();
      render(); refreshTop();
      toast('Добавлено: ' + r.accs + ' счета, ' + r.cats + ' категорий, ' + r.goals + ' накопления, ' + r.ops + ' операций');
    },
    pdf: exportReport,
    ai: () => openAISettings(refresh),
    reset: async () => {
      if (!await confirmSheet({ title: 'Сбросить всё?', text: 'Будут удалены все счета, категории, операции, цели и настройки. Это действие необратимо — сначала сделайте резервную копию.', ok: 'Удалить всё', danger: true })) return;
      S = Object.assign(fresh(), { accounts: [], categories: [], transactions: [], goals: [], templates: [] });
      S.settings.demo = false;
      S.settings.demoRegenV2 = true; /* фикс: без флага load() при следующем входе принимал состояние за «до демо-миграции» и заново генерировал операции */
      save();
      ensureSysAccounts();
      while (nav.length) popScreen(); render(); toast('Все данные удалены');
    }
  };
  el.querySelectorAll('[data-act]').forEach(b => { const f = A[b.dataset.act]; if (f) b.onclick = f; });
}
function setupPin(done) {
  let first = '';
  const rec = openSheet({
    title: t('pin.newTitle'),
    html: '<div id="pinHost" style="display:flex;flex-direction:column;align-items:center;gap:22px;padding:8px 0 10px">' +
      '<p id="hint" style="margin:0;color:var(--t2);font-size:14px">' + t('pin.setNew') + '</p></div>',
    mount(sh) {
      const hint = sh.querySelector('#hint');
      const pad = createLockpad({
        host: sh.querySelector('#pinHost'),
        onComplete: async code => {
          if (!first) { first = code; pad.reset(); hint.textContent = t('pin.repeat'); }
          else if (first === code) {
            const hashed = await hashPin(first);
            Store.updateSetting('pin', hashed);
            closeSheet(); toast(t('pin.enabled')); if (done) done();
          }
          else { first = ''; pad.reset(); hint.textContent = t('pin.mismatch'); haptic(30); }
        }
      });
    }
  });
}
function openTemplates() {
  const rec = pushScreen({ id: 'tpl', push: true, html: body(), mount: mount, refresh: () => { rec.el.innerHTML = body(); icons(rec.el); mount(rec.el); } });
  function body() {
    return '<div class="shead"><button class="iconbtn" data-act="close"><i data-lucide="x" class="ic"></i></button><h2>Повторяющиеся</h2></div>' +
      '<div class="screen__body">' + (S.templates.length ? '<div style="display:flex;flex-direction:column;gap:8px;padding-top:6px">' + S.templates.map(t => {
        const c = catById(t.categoryId);
        return '<div class="bud"><span class="bud__hd"><span class="tile" style="--c:' + (c ? c.color : 'var(--t2)') + '"><i data-lucide="' + (c ? c.icon : 'repeat') + '" class="ic"></i></span>' +
          '<b>' + esc(t.name) + '</b><span class="bud__amt">' + money(t.amount) + '</span></span>' +
          '<span class="bud__ft"><span>' + (t.every === 'week' ? 'каждую неделю' : 'каждый месяц') + ' · след. ' + shortDate(t.next) + '</span>' +
          '<button data-del="' + t.id + '" style="color:var(--danger);font-size:13px">Удалить</button></span></div>';
      }).join('') + '</div>' : '<div class="empty" style="padding-top:60px"><h3>Пока пусто</h3><p>Откройте операцию, нажмите «Ещё» и выберите «Сделать повторяющейся».</p></div>') +
      '<p style="color:var(--t3);font-size:13px;line-height:1.55;padding:18px 6px 0">Повторы создаются автоматически при запуске приложения, когда наступает дата.</p></div>';
  }
  function mount(el) {
    el.querySelector('[data-act="close"]').onclick = () => popScreen();
    el.querySelectorAll('[data-del]').forEach(b => b.onclick = () => { Store.removeTemplate(b.dataset.del); rec.refresh(); toast(t('tpl.deleted')); });
  }
}

/* ═══════════════════════════════ 14. backup ═══════════════════════════════ */
function download(name, text, type) {
  const blob = new Blob([text], { type: type || 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
/* ---------- schema-валидация импорта (Этап 2, storage/schema.js) ---------- */
const BK_DATE_RE = /^\d{4}-\d{2}-\d{2}/;
const BK_COLOR_RE = /^#[0-9a-fA-F]{6}$/;
const BK_ACC_SCHEMA = V.object({
  id: V.string().trim().min(1).max(64),
  name: V.string().trim().max(60).default(''),
  color: V.string().trim().pattern(BK_COLOR_RE).optional(),
  icon: V.string().trim().max(40).optional(),
  currency: V.string().trim().max(3).optional(),
  start: V.number().min(-1e9).max(1e9).round2().default(0),
  order: V.number().integer().min(0).max(9999).default(0),
  archived: V.boolean().default(false),
  hidden: V.boolean().default(false),
  inTotal: V.boolean().default(true)
});
const BK_CAT_SCHEMA = V.object({
  id: V.string().trim().min(1).max(64),
  name: V.string().trim().max(60).default(''),
  color: V.string().trim().pattern(BK_COLOR_RE).optional(),
  icon: V.string().trim().max(40).optional(),
  kind: V.enum(['expense', 'income']).default('expense'),
  parentId: V.string().trim().max(64).nullable().optional(),
  order: V.number().integer().min(0).max(9999).default(0)
});
const BK_OP_SCHEMA = V.object({
  id: V.string().trim().max(64).optional(),
  type: V.enum(['expense', 'income', 'transfer', 'adjust']),
  amount: V.number().min(0).max(1e9).round2(),
  currency: V.string().trim().max(3).optional(),
  accountId: V.string().trim().max(64).nullable().optional(),
  toAccountId: V.string().trim().max(64).nullable().optional(),
  categoryId: V.string().trim().max(64).nullable().optional(),
  note: V.string().trim().max(300).default(''),
  date: V.string().trim().pattern(BK_DATE_RE, 'date: YYYY-MM-DD'),
  createdAt: V.string().trim().max(30).optional(),
  adjustSign: V.number().min(-1).max(1).optional()
});
const BK_GOAL_SCHEMA = V.object({
  id: V.string().trim().min(1).max(64),
  name: V.string().trim().max(60).default(''),
  target: V.number().min(0).max(1e9).round2().default(0),
  saved: V.number().min(0).max(1e9).round2().default(0),
  deadline: V.string().trim().pattern(BK_DATE_RE).nullable().optional(),
  color: V.string().trim().pattern(BK_COLOR_RE).optional(),
  icon: V.string().trim().max(40).optional(),
  order: V.number().integer().min(0).max(9999).default(0)
});
const BK_TPL_SCHEMA = V.object({
  id: V.string().trim().max(64).optional(),
  name: V.string().trim().max(60).default(''),
  type: V.enum(['expense', 'income', 'transfer', 'adjust']).default('expense'),
  amount: V.number().min(0).max(1e9).round2().default(0),
  accountId: V.string().trim().max(64).nullable().optional(),
  toAccountId: V.string().trim().max(64).nullable().optional(),
  categoryId: V.string().trim().max(64).nullable().optional(),
  note: V.string().trim().max(300).default(''),
  every: V.enum(['week', 'month']).default('month'),
  next: V.string().trim().pattern(BK_DATE_RE).optional()
});
/* жёсткие лимиты: защита состояния от переполнения импортом-гигантом */
const BK_LIMITS = { accs: 200, cats: 2000, ops: 20000, goals: 500, tpls: 500 };
const BK_SCHEMAS = { accs: BK_ACC_SCHEMA, cats: BK_CAT_SCHEMA, ops: BK_OP_SCHEMA, goals: BK_GOAL_SCHEMA, tpls: BK_TPL_SCHEMA };
/** Прогоняет массивы бэкапа через схемы. null — нарушение лимита; иначе sanitized-массивы + dropped. */
function validateBackup(data) {
  const out = {}, dropped = [];
  for (const key of ['accs', 'cats', 'ops', 'goals', 'tpls']) {
    const limit = BK_LIMITS[key];
    if (data[key].length > limit) return null;
    const r = V.array(BK_SCHEMAS[key], { max: limit }).check(data[key]);
    out[key] = r.value;
    dropped.push(...r.dropped.map(d => key + '#' + d.index));
  }
  out.dropped = dropped.length;
  return out;
}

/* ---------- полный бэкап/восстановление (ONYX) ---------- */
const BK_TYPES = ['expense', 'income', 'transfer', 'adjust'];
const bkR2 = n => Math.round((parseFloat(n) || 0) * 100) / 100;
const bkIcon = (v, fb) => {
  const s = String(v || '').trim();
  return /^[\w-]+$/.test(s) && (LUC[s] || CAT_LUCIDE[s]) ? s : fb;
};
function bkDate(v, fb) {
  const s = String(v == null ? '' : v).trim();
  const m = /^(\d{4})-(\d{2})-(\d{2})(?:[T ].*)?$/.exec(s);
  if (m) {
    const d = new Date(+m[1], +m[2] - 1, +m[3]);
    if (!isNaN(d.getTime()) && d.getFullYear() === +m[1] && d.getMonth() === +m[2] - 1 && d.getDate() === +m[3]) return s.slice(0, 10);
  }
  return fb ? iso(fb) : null;
}
function bkSettings(s) {
  const out = Object.assign(JSON.parse(JSON.stringify(DEF_SETTINGS)), (s && typeof s === 'object') ? s : {});
  out.currency = CUR[out.currency] ? out.currency : 'BYN';
  out.firstDay = isFinite(+out.firstDay) ? clamp(Math.round(+out.firstDay), 0, 6) : 1;
  ['roundTotals', 'calculator', 'alwaysShowIncome', 'transferAsIO', 'adjustAsIO', 'hideAmounts', 'demo'].forEach(k => out[k] = !!out[k]);
  out.quickTypes = ['expense', 'income', 'transfer', 'adjust'].filter(t => Array.isArray(out.quickTypes) && out.quickTypes.includes(t));
  out.reminder = Object.assign({ enabled: false, time: '20:00' }, (out.reminder && typeof out.reminder === 'object') ? out.reminder : {});
  out.ai = Object.assign(DEF_AI(), (out.ai && typeof out.ai === 'object') ? out.ai : {});
  out.ai.endpoint = String(out.ai.endpoint || '').trim().slice(0, 300);
  out.ai.key = String(out.ai.key || '').trim().slice(0, 200);
  out.ai.model = String(out.ai.model || 'gpt-4o-mini').trim().slice(0, 60);
  if (!Array.isArray(out.customPeriods)) out.customPeriods = [];
  if (!Array.isArray(out.statsExcluded)) out.statsExcluded = [];
  out.pin = String(out.pin || '');
  out.lastBackup = out.lastBackup || null;
  return out;
}
function bkSanAccount(x, i) {
  x = x || {};
  const st = (x.start !== undefined && x.start !== null) ? x.start : x.initial;
  return {
    id: String(x.id || uid()),
    name: String(x.name || 'Счёт').slice(0, 40),
    color: normalizeHex(x.color) || PALETTE[1],
    icon: bkIcon(x.icon, 'wallet'),
    currency: CUR[String(x.currency || '').toUpperCase()] ? String(x.currency).toUpperCase() : S.settings.currency,
    initial: bkR2(st),
    inTotal: x.inTotal !== false,
    order: isFinite(+x.order) ? +x.order : i,
    archived: !!(x.archived) || !!(x.hidden)
  };
}
function bkSanCat(x, i) {
  x = x || {};
  const kind = String(x.kind || x.type || '').trim().toLowerCase();
  return {
    id: String(x.id || uid()),
    name: String(x.name || 'Категория').slice(0, 40),
    color: normalizeHex(x.color) || PALETTE[11],
    icon: bkIcon(x.icon, 'star'),
    kind: kind === 'income' ? 'income' : 'expense',
    parentId: x.parentId ? String(x.parentId) : null,
    order: isFinite(+x.order) ? +x.order : i
  };
}
function bkFixParents() {
  S.categories.forEach(c => {
    if (!c.parentId || c.parentId === c.id) { c.parentId = null; return; }
    const p = catById(c.parentId);
    if (!p || p.kind !== c.kind || p.parentId) c.parentId = null;
  });
}
function bkSanGoal(x, i) {
  x = x || {};
  return {
    id: String(x.id || uid()),
    name: String(x.name || 'Накопление').slice(0, 40),
    target: bkR2(x.target),
    saved: bkR2(x.saved),
    deadline: bkDate(x.deadline, null),
    color: normalizeHex(x.color) || PALETTE[0],
    icon: bkIcon(x.icon, 'target'),
    order: isFinite(+x.order) ? +x.order : i,
    history: Array.isArray(x.history) ? x.history.filter(h => h && isFinite(+h.v)).map(h => ({ date: bkDate(h.date, new Date()) || iso(new Date()), v: bkR2(h.v) })) : []
  };
}
function bkSanTpl(x, i) {
  x = x || {};
  const acc = (x.accountId && accById(String(x.accountId))) || null;
  const to = (x.toAccountId && accById(String(x.toAccountId))) || null;
  const cat = (x.categoryId && catById(String(x.categoryId))) || null;
  return {
    id: String(x.id || uid()),
    name: String(x.name || 'Повтор').slice(0, 60),
    type: BK_TYPES.indexOf(String(x.type || '').toLowerCase()) > -1 ? String(x.type).toLowerCase() : 'expense',
    amount: bkR2(x.amount),
    accountId: acc ? acc.id : null,
    toAccountId: to ? to.id : null,
    categoryId: cat ? cat.id : null,
    note: String(x.note || ''),
    every: x.every === 'week' ? 'week' : 'month',
    next: bkDate(x.next, new Date()) || iso(new Date())
  };
}
function bkAccOf(x, create, isTo) {
  if (isTo ? x.toAccountId : x.accountId) {
    const a = accById(String(isTo ? x.toAccountId : x.accountId));
    if (a) return a;
  }
  const nm = String((isTo ? x.toAccountName : x.accountName) || '').trim();
  if (nm) {
    const l = nm.toLowerCase();
    const hit = S.accounts.find(a => String(a.name || '').trim().toLowerCase() === l);
    if (hit) return hit;
    if (create) {
      const a = { id: uid(), name: nm.slice(0, 40), icon: 'wallet', color: PALETTE[1], currency: CUR[String(x.currency || '').toUpperCase()] ? String(x.currency).toUpperCase() : S.settings.currency, initial: 0, inTotal: true, order: S.accounts.length, archived: false };
      S.accounts.push(a);
      return a;
    }
  }
  return null;
}
function bkCatOf(x, create) {
  if (x.categoryId) { const c = catById(String(x.categoryId)); if (c) return c; }
  const nm = String(x.categoryName || '').trim();
  if (nm) {
    const l = nm.toLowerCase();
    const hit = S.categories.find(c => String(c.name || '').trim().toLowerCase() === l);
    if (hit) return hit;
    if (create) {
      const c = { id: uid(), name: nm.slice(0, 40), icon: 'star', color: PALETTE[11], kind: x.type === 'income' ? 'income' : 'expense', parentId: null, order: S.categories.length };
      S.categories.push(c);
      return c;
    }
  }
  return null;
}
function bkSanOp(x, i, create) {
  x = x || {};
  const type = BK_TYPES.indexOf(String(x.type || '').toLowerCase()) > -1 ? String(x.type).toLowerCase() : 'expense';
  const acc = bkAccOf(x, create, false);
  const to = bkAccOf(x, create, true);
  const cat = bkCatOf(x, create);
  const date = bkDate(x.date, new Date()) || iso(new Date());
  return {
    id: String(x.id || uid()),
    type: type,
    amount: bkR2(x.amount),
    currency: acc ? acc.currency : (CUR[String(x.currency || '').toUpperCase()] ? String(x.currency).toUpperCase() : S.settings.currency),
    accountId: acc ? acc.id : null,
    toAccountId: type === 'transfer' && to ? to.id : null,
    categoryId: (type === 'expense' || type === 'income') && cat ? cat.id : null,
    note: String(x.note || ''),
    date: date,
    createdAt: String(x.createdAt || date),
    adjustSign: isFinite(+x.adjustSign) ? +x.adjustSign : 1
  };
}
function doExport() {
  const now = new Date();
  const payload = {
    app: 'ONYX',
    version: 1,
    exportedAt: now.toISOString(),
    /* SECURITY: из экспорта удаляем AI API-ключ и PIN-код — файл бэкапа может быть передан
       дальше (облако, почта, чат) и не должен содержать секретов. */
    settings: (function () {
      const s = JSON.parse(JSON.stringify(S.settings));
      if (s.ai) s.ai.key = '';
      s.pin = '';
      return s;
    })(),
    accounts: S.accounts.map(a => {
      const o = {};
      ['id', 'name', 'color', 'icon', 'currency', 'order', 'inTotal', 'archived', 'hidden'].forEach(k => { if (a[k] !== undefined && a[k] !== null) o[k] = a[k]; });
      o.start = (a.start !== undefined && a.start !== null) ? a.start : (a.initial !== undefined ? a.initial : 0);
      if (o.hidden === undefined) o.hidden = a.archived === true;
      return o;
    }),
    categories: S.categories.map(c => ({
      id: c.id, name: c.name, color: c.color, icon: c.icon,
      type: c.kind, kind: c.kind, parentId: c.parentId || null, order: c.order
    })),
    operations: S.transactions.map(t => {
      const a = accById(t.accountId), a2 = accById(t.toAccountId), c = catById(t.categoryId);
      const o = {
        id: t.id, type: t.type, amount: t.amount,
        currency: t.currency || (a && a.currency) || S.settings.currency,
        accountId: t.accountId || null, toAccountId: t.toAccountId || null, categoryId: t.categoryId || null,
        note: t.note || '', date: t.date, createdAt: t.createdAt || t.date,
        accountName: a ? a.name : '', toAccountName: a2 ? a2.name : '', categoryName: c ? c.name : ''
      };
      if (t.adjustSign !== undefined) o.adjustSign = t.adjustSign;
      return o;
    }),
    goals: S.goals.map(g => {
      const o = { id: g.id, name: g.name, target: g.target, saved: g.saved, deadline: g.deadline || null, color: g.color, icon: g.icon, order: g.order };
      if (Array.isArray(g.history)) o.history = g.history;
      return o;
    }),
    templates: S.templates.map(t => Object.assign({}, t))
  };
  const text = JSON.stringify(payload, null, 2);
  const name = 'onyx-backup-' + iso(now) + '.json';
  S.settings.lastBackup = iso(now); save();
  download(name, text, 'application/json');
  refreshTop();
  toast('Экспортировано: ' + S.transactions.length + ' операций');
  const r = nav[nav.length - 1]; if (r && r.id === 'settings') r.refresh();
}
function shareOrDownload(name, text, title) {
  if (navigator.share && navigator.canShare && navigator.canShare({ files: [new File([text], name, { type: 'application/json' })] })) {
    navigator.share({ files: [new File([text], name, { type: 'application/json' })], title: title || 'Onyx' }).catch(() => download(name, text));
  } else download(name, text);
}
function mergeArr(list, src) {
  (src || []).forEach(x => { if (x && x.id && !list.some(y => y.id === x.id)) list.push(x); });
}
function doImport() {
  const inp = document.createElement('input');
  inp.type = 'file'; inp.accept = '.json,.csv';
  inp.onchange = () => {
    const f = inp.files[0]; if (!f) return;
    const fr = new FileReader();
    fr.onload = () => { try { bkImport(String(fr.result || '')); } catch (e) { toast('Не удалось прочитать файл', null, { tone: 'danger' }); } };
    fr.onerror = () => toast('Не удалось прочитать файл', null, { tone: 'danger' });
    fr.readAsText(f);
  };
  inp.click();
}
async function bkImport(src) {
  const body = String(src || '').trim();
  if (!body || body.charAt(0) !== '{') { toast('Не удалось прочитать файл', null, { tone: 'danger' }); return; }
  let p;
  try { p = JSON.parse(body); } catch (e) { toast('Не удалось прочитать файл', null, { tone: 'danger' }); return; }
  const base = (p && p.data && typeof p.data === 'object' && !Array.isArray(p.data)) ? p.data : p;
  const raw = {
    accs: Array.isArray(base.accounts) ? base.accounts : null,
    cats: Array.isArray(base.categories) ? base.categories : null,
    ops: Array.isArray(base.operations) ? base.operations : (Array.isArray(base.transactions) ? base.transactions : null),
    goals: Array.isArray(base.goals) ? base.goals : [],
    tpls: Array.isArray(base.templates) ? base.templates : []
  };
  if (raw.ops === null || raw.accs === null || raw.cats === null) { toast('В файле нет данных Onyx', null, { tone: 'danger' }); return; }
  /* SCHEMA (Этап 2): жёсткая валидация входа до санитайзеров — битые строки отбрасываются,
     лимиты защищают состояние от импорта-гиганта; типы полей — в storage/schema.js. */
  const vr = validateBackup(raw);
  if (!vr) { toast(t('import.tooMany', { max: BK_LIMITS.ops }), null, { tone: 'danger' }); return; }
  const accs = vr.accs, cats = vr.cats, ops = vr.ops, goals = vr.goals, tpls = vr.tpls;
  if (vr.dropped) setTimeout(() => toast(t('import.dropped', { n: vr.dropped }), null, { tone: 'danger' }), 600);
  const desc = ops.length + ' операций, ' + accs.length + ' счетов, ' + cats.length + ' категорий, ' + goals.length + ' накоплений';
  const mode = await new Promise(res => {
    let done = false;
    openSheet({
      title: 'Импорт',
      html: '<p style="margin:0 6px 18px;color:var(--t2);font-size:14px;line-height:1.55">В файле: ' + esc(desc) + '. Как применить?</p>' +
        '<div style="display:flex;flex-direction:column;gap:9px">' +
        '<button class="btn btn--danger" data-m="replace">Заменить всё</button>' +
        '<button class="btn btn--chrome" data-m="merge">Объединить</button>' +
        '<button class="btn btn--ghost" data-m="">Отмена</button></div>',
      mount(sh) { sh.querySelectorAll('[data-m]').forEach(b => b.onclick = () => { done = true; haptic(); res(b.dataset.m); closeSheet(); }); },
      onClose() { if (!done) res(''); }
    });
  });
  if (!mode) return;
  const before = JSON.stringify(S);
  try {
    if (mode === 'replace') {
      S = { v: 1, accounts: [], categories: [], transactions: [], goals: [], templates: [], settings: bkSettings(base.settings) };
      S.accounts = accs.map(bkSanAccount);
      S.categories = cats.map(bkSanCat);
      bkFixParents();
      S.goals = goals.map(bkSanGoal);
      S.templates = tpls.map(bkSanTpl);
      S.transactions = ops.map((x, i) => bkSanOp(x, i, true));
    } else {
      const seenA = new Set(S.accounts.map(a => a.id));
      accs.forEach((x, i) => { if (x && x.id && seenA.has(String(x.id))) return; const a = bkSanAccount(x, i); seenA.add(a.id); S.accounts.push(a); });
      const seenC = new Set(S.categories.map(c => c.id));
      cats.forEach((x, i) => { if (x && x.id && seenC.has(String(x.id))) return; const c = bkSanCat(x, i); seenC.add(c.id); S.categories.push(c); });
      bkFixParents();
      const seenG = new Set(S.goals.map(g => g.id));
      goals.forEach((x, i) => { if (x && x.id && seenG.has(String(x.id))) return; const g = bkSanGoal(x, i); seenG.add(g.id); S.goals.push(g); });
      const seenT = new Set(S.templates.map(t => t.id));
      tpls.forEach((x, i) => { if (x && x.id && seenT.has(String(x.id))) return; const t = bkSanTpl(x, i); seenT.add(t.id); S.templates.push(t); });
      const seenO = new Set(S.transactions.map(t => t.id));
      ops.forEach((x, i) => { if (x && x.id && seenO.has(String(x.id))) return; const o = bkSanOp(x, i, true); seenO.add(o.id); S.transactions.push(o); });
    }
    S.settings.demo = false;
    S.transactions.sort((a, b) => {
      const da = a.date || '', db = b.date || '';
      return db < da ? -1 : (db > da ? 1 : 0);
    });
    ensureSysAccounts();
    save(); UI.accId = null;
    while (nav.length) popScreen();
    render(); haptic(20);
    toast('Импортировано: ' + S.transactions.length + ' операций', { label: 'Отменить', fn: () => { S = JSON.parse(before); save(); render(); toast('Возвращено как было'); } });
  } catch (e) {
    S = JSON.parse(before); save();
    toast('Не удалось импортировать', null, { tone: 'danger' });
  }
}
