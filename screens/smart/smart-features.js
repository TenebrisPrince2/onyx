/* global round2 */
"use strict";

/* screens/smart/smart-features.js — умные инструменты: Smart Plan (доход), скан чека, голосовой ввод, экспорт отчёта и настройки ИИ. */

/* ---------- FEATURE 1 · умный план при вводе дохода ---------- */
function forecastSeries(start, b) {
  const today = sod(new Date());
  const pts = [start];
  let bal = start;
  for (let i = 1; i <= 30; i++) {
    const d = addD(today, i);
    bal -= b.avgDaily;
    b.subs.forEach(s => { if (s.dayOfMonth === d.getDate()) bal -= s.amount; });
    pts.push(bal);
  }
  return pts;
}

function forecastSVG(pts, cur) {
  const W = 300, H = 48, pl = 6, pr = 6, pt = 8, pb = 8;
  let mn = Math.min.apply(null, pts), mx = Math.max.apply(null, pts);
  if (mx - mn < 1) { mx += 1; mn -= 1; }
  const X = i => pl + (W - pl - pr) * i / (pts.length - 1);
  const Y = v => pt + (H - pt - pb) * (1 - (v - mn) / (mx - mn));
  const line = pts.map((v, i) => X(i).toFixed(1) + ',' + Y(v).toFixed(1)).join(' ');
  const negIdx = pts.findIndex(v => v < 0);
  let extra = '';
  if (negIdx > -1) {
    const ty = clamp(Y(pts[negIdx]) - 6, 10, H - 4);
    extra = '<circle cx="' + X(negIdx).toFixed(1) + '" cy="' + Y(pts[negIdx]).toFixed(1) + '" r="3.5" fill="#ff453a"/>' +
      '<text x="' + clamp(X(negIdx), 48, W - 48).toFixed(1) + '" y="' + ty.toFixed(1) + '" fill="#ff453a" font-size="8.5" font-weight="700" text-anchor="middle">минус через ' + negIdx + ' дн</text>';
  } else {
    extra = '<text x="' + (W - pr) + '" y="13" fill="#30d158" font-size="8.5" font-weight="700" text-anchor="end">минус не грозит</text>';
  }
  const zero = (mn < 0 && mx > 0) ? '<line x1="' + pl + '" y1="' + Y(0).toFixed(1) + '" x2="' + (W - pr) + '" y2="' + Y(0).toFixed(1) + '" stroke="rgba(255,69,58,.5)" stroke-dasharray="3 3"/>' : '';
  return '<div class="sp__fc"><svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none">' + zero +
    '<polyline points="' + line + '" fill="none" stroke="#f5f6f8" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" opacity=".9"/>' + extra + '</svg></div>';
}

function smartPlanHTML(v, anim) {
  try {
    if (ED.type !== 'income' || !(v > 0)) return '';
    const b = smartBase(), cur = b.cur;
    const pc = payCycle();
    const safeDaily = Math.max(0, (v + b.bal - b.mandatory) / pc.days);
    const needs = v * .5, wants = v * .3, save = v * .2;
    const goals = S.goals.filter(g => g.target > 0 && g.saved < g.target);
    const remTot = sum(goals.map(g => Math.max(0, g.target - g.saved))) || 1;
    const cl = !!ED.spCollapsed;
    const pts = forecastSeries(v + b.bal, b);
    const fin = pts[pts.length - 1];
    let body = '';
    body += '<div class="sp-c" style="--i:0">' +
      '<span class="sp-lab"><span class="sp-lab__ic"><i data-lucide="shield" class="ic"></i></span>Безопасный лимит в день</span>' +
      '<div class="sp-big">' + money(safeDaily, cur) + '</div>' +
      '<div class="sp-sub">до следующей зарплаты · <b>' + pc.days + ' ' + insPl(pc.days, 'день', 'дня', 'дней') + '</b></div>' +
      (b.mandatory > 0 ? '<div class="sp-sub" style="font-size:11.5px">обязательные расходы за 30 дней: ' + money(b.mandatory, cur) + '</div>' : '') +
      '</div>';
    body += '<div class="sp-c" style="--i:1">' +
      '<span class="sp-lab">Распределение 50 / 30 / 20</span>' +
      '<div class="sp-bar"><span style="width:50%;background:#8b9097"></span><span style="width:30%;background:#ff453a"></span><span style="width:20%;background:#30d158"></span></div>' +
      '<div class="sp-grid3">' +
      '<div><small>Нужды · 50%</small><b style="color:#8b9097">' + money(needs, cur) + '</b></div>' +
      '<div><small>Желания · 30%</small><b style="color:#ff453a">' + money(wants, cur) + '</b></div>' +
      '<div><small>Накопления · 20%</small><b style="color:#30d158">' + money(save, cur) + '</b></div>' +
      '</div>' +
      (goals.length ? '<div class="sp-sub" style="font-size:11.5px">20% на цели: ' + goals.slice(0, 2).map(g => esc(g.name) + ' +' + money(save * Math.max(0, g.target - g.saved) / remTot, cur)).join(' · ') + (goals.length > 2 ? ' · …' : '') + '</div>' : '') +
      '</div>';
    body += '<div class="sp-c" style="--i:2">' +
      '<div class="sp-fc"><span class="sp-lab">Прогноз на 30 дней</span><span class="sp-fc__v">' + (fin < 0 ? '−' : '') + money(Math.abs(fin), cur) + '</span></div>' +
      forecastSVG(pts, cur) + '</div>';
    return '<div class="smart-plan' + (cl ? ' smart-plan--cl' : '') + (anim ? ' sp--anim' : '') + '">' +
      '<div class="glass smart-plan__shell">' +
      '<button class="sp-hd" data-act="sp-toggle" type="button">' +
      '<span class="sp-hd__ic"><i data-lucide="sparkle" class="ic"></i></span>' +
      '<span class="sp-hd__mn"><span class="sp-hd__t">Умный план</span>' +
      '<span class="sp-hd__s">' + money(safeDaily, cur) + '/день · 50/30/20 готово</span></span>' +
      '<span class="sp-hd__ch"><i data-lucide="chevron-down" class="ic"></i></span></button>' +
      '<div class="sp-line"></div>' +
      '<div class="sp-bd">' + body + '</div>' +
      '</div></div>';
  } catch (e) { return ''; }
}

function smartPlanUpdate(el) {
  const host = el && el.querySelector('#spHost');
  if (!host) return;
  const v = edVal();
  /* показываем ТОЛЬКО вручную (через меню «Ещё») — автоматически не вылазит */
  const show = !!ED.spVisible && ED.type === 'income' && v > 0;
  const had = !!host.querySelector('.smart-plan');
  if (!show) { if (had) host.innerHTML = ''; return; }
  host.innerHTML = smartPlanHTML(v, !had);
  icons(host);
  const tg = host.querySelector('[data-act="sp-toggle"]');
  if (tg) tg.onclick = () => { ED.spCollapsed = !ED.spCollapsed; haptic('selection'); smartPlanUpdate(el); };
}

/* ---------- FEATURE 5.1 · скан чека (камера → vision-ИИ → ручной фолбэк) ---------- */
function openScanner() {
  if (!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)) { toast('Камера недоступна в этом браузере', null, { tone: 'danger' }); return; }
  let stream = null;
  const stop = () => { if (stream) { stream.getTracks().forEach(tr => tr.stop()); stream = null; } };
  openSheet({
    title: '',
    hideGrab: true,
    html: '<div class="scn">' +
      '<div class="scn__cam"><video class="scn__vid" id="scnVid" autoplay playsinline muted></video>' +
      '<div class="scn__frame"><i></i></div>' +
      '<button class="scn__shot" id="scnShot" type="button" aria-label="Снять"></button>' +
      '<button class="scn__x" id="scnX" type="button" aria-label="Закрыть камеру"><i data-lucide="x" class="ic"></i></button>' +
      '</div>' +
      '<div class="scn__bd">' +
      '<div class="scn__t"><i data-lucide="sparkle" class="ic"></i>Сканировать чек</div>' +
      '<p class="scn__hint">Наведите камеру, поместите чек в рамку и нажмите кнопку — ИИ заполнит сумму, магазин и категорию</p>' +
      '</div></div>',
    mount(sh) {
      const vid = sh.querySelector('#scnVid');
      sh.querySelector('#scnX').onclick = () => { stop(); closeSheet(); };
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: { ideal: 1280 } }, audio: false })
        .then(st => { stream = st; vid.srcObject = st; })
        .catch(() => { toast('Нет доступа к камере', null, { tone: 'danger' }); closeSheet(); });
      sh.querySelector('#scnShot').onclick = () => {
        if (!vid || !vid.videoWidth) { toast('Камера ещё не готова'); return; }
        haptic('medium');
        const c = document.createElement('canvas');
        c.width = Math.min(1200, vid.videoWidth);
        c.height = Math.round(c.width * vid.videoHeight / vid.videoWidth);
        c.getContext('2d').drawImage(vid, 0, 0, c.width, c.height);
        const dataUrl = c.toDataURL('image/jpeg', .85);
        stop(); closeSheet();
        scanReceipt(dataUrl);
      };
    },
    onClose() { stop(); }
  });
}

async function scanReceipt(dataUrl) {
  if (aiReady()) {
    toast('Распознаю чек…', null, { icon: 'sparkle' });
    const cats = catsOf('expense').map(c => c.name).join(', ');
    try {
      const out = await aiChat([
        { role: 'system', content: 'Ты — сканер чеков. Из изображения извлеки: итоговую сумму, название магазина, дату и список позиций с ценами. Подбери категорию расходов строго из списка: ' + cats + '. Верни ТОЛЬКО валидный JSON без markdown и пояснений: {"amount": число, "merchant": "строка", "date": "YYYY-MM-DD", "items": [{"name": "строка", "price": число}], "category": "название из списка или null"}. Сумма — число без валюты.' },
        { role: 'user', content: [
          { type: 'text', text: 'Извлеки данные с этого чека и верни JSON.' },
          { type: 'image_url', image_url: { url: dataUrl } }
        ] }
      ], { max_tokens: 500, timeout: 60000 });
      applyReceipt(JSON.parse(out.replace(/```json|```/g, '').trim()));
      return;
    } catch (e) {
      toast('ИИ недоступен — заполните вручную', null, { icon: 'globe' });
    }
  }
  manualReceipt(dataUrl);
}

function applyReceipt(j) {
  const amount = Math.abs(parseFloat(j && j.amount)) || 0;
  const merchant = String((j && j.merchant) || '').slice(0, 60);
  let catId = null;
  if (j && j.category) {
    const c = S.categories.find(x => x.kind === 'expense' && x.name.toLowerCase() === String(j.category).toLowerCase().trim());
    if (c) catId = c.id;
  }
  if (!catId && j && Array.isArray(j.items)) {
    const blob = ' ' + j.items.map(i2 => i2 && i2.name).join(' ').toLowerCase() + ' ' + merchant.toLowerCase();
    let best = null;
    catsOf('expense').forEach(c => {
      c.name.toLowerCase().split(/[\s,-]+/).forEach(w => { if (w.length > 3 && blob.indexOf(w) > -1 && (!best || w.length > best.w.length)) best = { c, w }; });
    });
    if (best) catId = best.c.id;
  }
  if (amount > 0) { ED.entry = String(round2(amount)); ED.left = null; ED.op = null; }
  if (merchant) ED.note = merchant;
  if (catId) ED.categoryId = catId;
  if (ED.rec) ED.rec.refresh();
  toast('Чек распознан' + (merchant ? ' · ' + esc(merchant) : ''), null, { icon: 'sparkle' });
}

function manualReceipt(dataUrl) {
  openSheet({
    title: 'Чек — заполните вручную',
    html: '<div class="scn"><img class="scn__img" src="' + dataUrl + '" alt="Чек">' +
      '<input class="gp-inp" id="mrAmt" inputmode="decimal" placeholder="Сумма" style="margin-top:2px">' +
      '<input class="note" id="mrNote" placeholder="Магазин / заметка" maxlength="60" style="min-height:50px">' +
      '<button class="btn btn--chrome" id="mrOk" disabled>Заполнить операцию</button></div>',
    mount(sh) {
      const a = sh.querySelector('#mrAmt'), n = sh.querySelector('#mrNote'), ok = sh.querySelector('#mrOk');
      const sync = () => { ok.disabled = !(parseFloat(String(a.value).replace(',', '.')) > 0); };
      a.oninput = sync;
      sync();
      ok.onclick = () => {
        const v = parseFloat(String(a.value).replace(',', '.')) || 0;
        if (v <= 0) return;
        applyReceipt({ amount: v, merchant: n.value.trim(), items: [] });
        closeSheet();
      };
    }
  });
}

/* ---------- FEATURE 5.4 · голосовой ввод (+ ИИ-уточнение) ---------- */
function startVoice(onDone, onEnd) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) { toast('Голосовой ввод не поддерживается этим браузером', null, { tone: 'danger' }); if (onEnd) onEnd(); return null; }
  let rec = null;
  try { rec = new SR(); } catch (e) { toast('Микрофон недоступен', null, { tone: 'danger' }); if (onEnd) onEnd(); return null; }
  rec.lang = 'ru-RU';
  rec.interimResults = false;
  rec.maxAlternatives = 1;
  let got = false;
  rec.onresult = e => {
    got = true;
    const t = e.results && e.results[0] && e.results[0][0] && e.results[0][0].transcript;
    if (t && onDone) onDone(String(t).trim());
  };
  rec.onerror = e => {
    if (e.error === 'not-allowed' || e.error === 'service-not-allowed') toast('Нет доступа к микрофону', null, { tone: 'danger' });
    else if (!got) toast('Не удалось распознать речь', null, { tone: 'danger' });
  };
  rec.onend = () => { if (onEnd) onEnd(); };
  try { rec.start(); toast('Слушаю…', null, { icon: 'mic' }); } catch (e) { if (onEnd) onEnd(); }
  return rec;
}

function parseVoiceLocal(text) {
  const t = ' ' + String(text).toLowerCase() + ' ';
  const m = t.match(/(\d+(?:[.,]\d{1,2})?)/);
  const amount = m ? parseFloat(m[1].replace(',', '.')) : 0;
  let note = String(text);
  if (m) note = note.replace(m[1], ' ');
  note = note.replace(/\b(рублей|рубля|руб|руб\.|белорусских|копеек|на|за|это|вс[её]|купил|купила|купили|потратил|потратила|заплатил|заплатила|отдал|отдала|стоило|стоит)\b/gi, ' ');
  note = note.replace(/\s+/g, ' ').trim().slice(0, 60);
  let best = null;
  S.categories.filter(c => c.kind === 'expense').forEach(c => {
    c.name.toLowerCase().split(/[\s,-]+/).forEach(w => { if (w.length > 3 && t.indexOf(w) > -1 && (!best || w.length > best.w.length)) best = { c, w }; });
  });
  return { amount, note, categoryId: best ? best.c.id : null };
}

async function voiceToEditor(text) {
  const set = r => {
    if (r.amount > 0) { ED.entry = String(round2(r.amount)); ED.left = null; ED.op = null; }
    if (r.note) ED.note = r.note;
    if (r.categoryId) ED.categoryId = r.categoryId;
    if (ED.rec) ED.rec.refresh();
  };
  set(parseVoiceLocal(text));
  if (!aiReady()) return;
  try {
    const cats = catsOf('expense').map(c => c.name).join(', ');
    const out = await aiChat([
      { role: 'system', content: 'Из русской фразы о трате извлеки операцию. Верни ТОЛЬКО JSON {"amount": число, "note": "заметка до 4 слов", "category": "название из списка или null"}. Список категорий: ' + cats },
      { role: 'user', content: text }
    ], { max_tokens: 120 });
    const j = JSON.parse(out.replace(/```json|```/g, '').trim());
    const cat = j.category ? S.categories.find(c => c.kind === 'expense' && c.name.toLowerCase() === String(j.category).toLowerCase().trim()) : null;
    set({ amount: Math.abs(parseFloat(j.amount)) || 0, note: String(j.note || '').slice(0, 60), categoryId: cat ? cat.id : null });
    toast('ИИ уточнил детали', null, { icon: 'sparkle' });
  } catch (e) { /* остаётся локальный разбор */ }
}

/* ---------- FEATURE 5.3 · экспорт отчёта (печать → PDF) ---------- */
function exportReport() {
  const r = ledgerPeriodRange();
  const list = scopeTxns(r, null);
  const cur = S.settings.currency;
  const inc = flowOf(list, 'income'), exp = flowOf(list, 'expense');
  const h = healthCore();
  const M = v => moneyPlain(v, cur);
  const byCat = {};
  list.filter(t => t.type === 'expense').forEach(t => { const c = txnRootOf(t) || txnCatOf(t); const k = c ? c.id : '__none__'; const e = byCat[k] || (byCat[k] = { name: c ? c.name : 'Без категории', color: c ? (c.color || '') : '', sum: 0 }); e.sum += t.amount; });
  const cats = Object.keys(byCat).sort((a, b2) => byCat[b2].sum - byCat[a].sum);
  const maxC = cats.length ? byCat[cats[0]].sum : 1;
  const top = list.filter(t => t.type === 'expense').slice().sort((a, b2) => b2.amount - a.amount).slice(0, 5);
  const goals = S.goals.slice().sort((a, b2) => (a.order || 0) - (b2.order || 0));
  const b30 = smartBase();
  const savM = Math.max(0, b30.inc30 - b30.exp30);
  const row = (l, v) => '<tr><td>' + l + '</td><td class="n">' + v + '</td></tr>';
  /* сравнение с прошлым периодом — только для стандартных периодов */
  let cmp = null;
  if (['month', 'year', 'week', '2w', '7d', '30d'].indexOf(r.key) > -1) {
    try {
      const pr = periodRange(r.key, -1);
      const pl = scopeTxns(pr, null);
      const pInc = flowOf(pl, 'income'), pExp = flowOf(pl, 'expense');
      cmp = {
        label: pr.label,
        dInc: pInc > 0 ? (inc - pInc) / pInc : null,
        dExp: pExp > 0 ? (exp - pExp) / pExp : null,
        pInc, pExp
      };
    } catch (e) {}
  }
  const pct = v => v === null ? '' : (v > 0 ? '+' : '') + Math.round(v * 100) + '%';
  const hRow = c => '<tr><td style="border:0;padding:4px 0">' + (c.score === null ? '·' : c.score >= 80 ? '✓' : c.score >= 50 ? '⚠' : '✗') + ' ' + c.name + '<div class="bar"><i style="width:' + (c.score === null ? 0 : c.score) + '%"></i></div></td>' +
    '<td style="border:0;padding:4px 0" class="n">' + esc(c.value) + '</td></tr>';
  const accounts = S.accounts.filter(a => !a.archived).sort((a, b2) => (a.order || 0) - (b2.order || 0));
  const html = '<!doctype html><html lang="ru"><head><meta charset="utf-8"><title>ONYX · Отчёт</title><style>' +
    '@page{margin:14mm}body{background:#000;color:#f5f6f8;font-family:"SF Pro Rounded",sans-serif;margin:0;padding:28px 30px;-webkit-print-color-adjust:exact;print-color-adjust:exact}' +
    'h1{font-size:28px;margin:0;letter-spacing:-.02em}h2{font-size:14px;text-transform:uppercase;letter-spacing:.1em;color:#8b9097;margin:30px 0 10px}' +
    '.sub{color:#8b9097;font-size:14px;margin-top:6px}' +
    '.card{background:#131316;border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:16px 20px;margin-top:12px}' +
    'table{width:100%;border-collapse:collapse;font-size:14px}td{padding:7px 0;border-bottom:1px solid rgba(255,255,255,.06)}td:last-child{text-align:right}' +
    '.n{font-variant-numeric:tabular-nums;font-weight:700}.pos{color:#30d158}.neg{color:#ff453a}' +
    '.bar{height:8px;border-radius:99px;background:#26262b;overflow:hidden;margin:6px 0 2px}.bar i{display:block;height:100%;border-radius:99px;background:linear-gradient(90deg,#ff453a,#ff9500)}' +
    '.score{display:flex;align-items:center;gap:18px}.score b{font-size:46px;font-weight:800;line-height:1}' +
    '.small{font-size:12px;color:#8b9097}' +
    '.grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px}' +
    '.grid .card{margin-top:0}' +
    '</style></head><body>' +
    '<h1>ONYX · Финансовый отчёт</h1><div class="sub">Период: ' + esc(r.label) + ' · сформирован ' + dayLabel(iso(new Date())) + ' · ' + list.length + ' операций</div>' +
    '<div class="card"><table>' +
    row('Баланс сейчас', M(h.bal)) +
    row('Доходы за период', '<span class="pos">+' + M(inc) + '</span>') +
    row('Расходы за период', '<span class="neg">−' + M(exp) + '</span>') +
    row('Чистый поток', M(inc - exp)) +
    row('Норма сбережений', h.savRate === null ? '—' : Math.round(h.savRate * 100) + '%') +
    row('В среднем за день', list.length ? M(exp / Math.max(1, Math.round((r.to - r.from) / 864e5) || 1)) : '—') +
    row('Индекс здоровья', (h.score === null ? '—' : h.score + ' / 100') + ' · ' + hlWord(h)) +
    (cmp ? row('К прошлому периоду', 'доходы <span class="' + (cmp.dInc >= 0 ? 'pos' : 'neg') + '">' + pct(cmp.dInc) + '</span> · расходы <span class="' + (cmp.dExp <= 0 ? 'pos' : 'neg') + '">' + pct(cmp.dExp) + '</span>') : '') +
    '</table></div>' +
    '<h2>Составляющие здоровья</h2><div class="card score"><b>' + (h.score === null ? '—' : h.score) + '<span style="font-size:18px;color:#8b9097">/100</span></b>' +
    '<div><table style="font-size:13px">' + h.comps.map(hRow).join('') + '</table></div></div>' +
    '<h2>Счета</h2><div class="card"><table>' +
    (accounts.length ? accounts.map(a => row(esc(a.name) + (a.system ? ' <span class="small">🔒 защищённый</span>' : ''), M(accBalance(a.id)))).join('') : '<tr><td class="small">Счетов нет</td><td></td></tr>') +
    '</table></div>' +
    '<h2>Категории расходов</h2><div class="card"><table>' +
    (cats.length ? cats.map(k => {
      const e = byCat[k];
      const col = /^#?[0-9a-fA-F]{3,8}$/.test(String(e.color || '').trim()) ? (String(e.color).trim().charAt(0) === '#' ? e.color.trim() : '#' + String(e.color).trim()) : '#ff453a';
      return '<tr><td><span style="display:inline-block;width:9px;height:9px;border-radius:50%;background:' + col + ';margin-right:8px;vertical-align:1px"></span>' + esc(e.name) +
        '<div class="bar"><i style="width:' + Math.round(e.sum / maxC * 100) + '%;background:' + col + '"></i></div></td><td class="n">' + M(e.sum) + '</td></tr>';
    }).join('') : '<tr><td class="small">Нет расходов за период</td><td></td></tr>') +
    '</table></div>' +
    '<div class="grid">' +
    '<div><h2 style="margin-top:0">Крупнейшие операции</h2><div class="card"><table>' +
    (top.length ? top.map(t => {
      const c = txnCatOf(t);
      return row(esc(t.note || (c ? c.name : 'Операция')) + '<div class="small">' + esc(dayLabel(dkey(t))) + (c ? ' · ' + esc(c.name) : '') + '</div>', '−' + M(t.amount));
    }).join('') : '<tr><td class="small">Нет операций</td><td></td></tr>') +
    '</table></div></div>' +
    '<div><h2 style="margin-top:0">Покупки</h2><div class="card"><table>' +
    (goals.length ? goals.map(g => {
      const p = g.target > 0 ? Math.round(clamp(g.saved / g.target, 0, 1) * 100) : 0;
      const rem = Math.max(0, g.target - g.saved);
      const eta = rem <= 0 ? 'можно покупать' : savM > 0 ? '≈ ' + Math.max(1, Math.ceil(rem / savM)) + ' мес.' : '—';
      return '<tr><td>' + esc(g.name) + '<div class="bar"><i style="width:' + p + '%;background:linear-gradient(90deg,#1e9e50,#30d158)"></i></div>' +
        '<div class="small">' + p + '% · ' + eta + '</div></td><td class="n">' + M(g.saved) + ' / ' + M(g.target) + '</td></tr>';
    }).join('') : '<tr><td class="small">Список покупок пуст</td><td></td></tr>') +
    '</table></div></div>' +
    '</div>' +
    '<p class="small" style="margin-top:26px">Сформировано в ONYX · данные хранятся только на устройстве</p>' +
    '</body></html>';
  const w = window.open('', '_blank');
  if (!w) { toast('Разрешите всплывающие окна для печати', null, { tone: 'danger' }); return; }
  w.document.open(); w.document.write(html); w.document.close();
  setTimeout(() => { try { w.focus(); w.print(); } catch (e) {} }, 500);
}

/* ---------- настройки ИИ ---------- */
function openAISettings(after) {
  const ai = S.settings.ai || (S.settings.ai = DEF_AI());
  openSheet({
    title: 'AI-ассистент',
    html: '<div style="display:flex;flex-direction:column;gap:14px;padding-top:4px">' +
      '<div class="list" style="padding:16px;display:flex;flex-direction:column;gap:16px">' +
      '<div class="field"><span>API endpoint</span><input class="inp" id="aiEp" placeholder="https://api.openai.com/v1/chat/completions" value="' + esc(ai.endpoint) + '" autocapitalize="off" autocorrect="off" spellcheck="false"></div>' +
      '<div class="field"><span>API key</span><input class="inp" id="aiKey" type="password" placeholder="sk-…" value="' + esc(ai.key) + '" autocapitalize="off" autocorrect="off" spellcheck="false"></div>' +
      '<div class="field"><span>Модель</span><input class="inp" id="aiModel" placeholder="gpt-4o-mini" value="' + esc(ai.model) + '" autocapitalize="off" autocorrect="off" spellcheck="false"></div>' +
      '</div>' +
      '<button class="btn btn--chrome" id="aiTest" type="button">Проверить соединение</button>' +
      '<button class="btn btn--ghost" id="aiSave" type="button">Сохранить</button>' +
      '<p style="margin:0;color:var(--t3);font-size:13px;line-height:1.55;padding:0 4px">Ключ хранится только на этом устройстве и отправляется лишь в выбранный вами API. Укажите endpoint (например, https://api.openai.com/v1/chat/completions) и ваш ключ.</p></div>',
    mount(sh) {
      const ep = sh.querySelector('#aiEp'), key = sh.querySelector('#aiKey'), md = sh.querySelector('#aiModel');
      sh.querySelector('#aiSave').onclick = () => {
        ai.endpoint = ep.value.trim();
        ai.key = key.value.trim();
        ai.model = md.value.trim() || 'gpt-4o-mini';
        save(); haptic('success'); closeSheet();
        toast(ai.key ? 'ИИ-настройки сохранены' : 'Сохранено — работает офлайн-режим');
        if (after) after();
      };
      sh.querySelector('#aiTest').onclick = async () => {
        const btn = sh.querySelector('#aiTest');
        const old = { endpoint: ai.endpoint, key: ai.key, model: ai.model };
        ai.endpoint = ep.value.trim(); ai.key = key.value.trim(); ai.model = md.value.trim() || 'gpt-4o-mini';
        btn.disabled = true; btn.textContent = 'Проверяю…';
        try {
          await aiChat([{ role: 'user', content: 'ping' }], { max_tokens: 5, timeout: 20000 });
          toast('Подключение работает', null, { icon: 'sparkle' });
        } catch (e) {
          toast('Не удалось подключиться (' + e.message + ')', null, { tone: 'danger' });
        } finally {
          ai.endpoint = old.endpoint; ai.key = old.key; ai.model = old.model;
          btn.disabled = false; btn.textContent = 'Проверить соединение';
        }
      };
    }
  });
}

if (typeof window !== 'undefined') {
  window.forecastSeries = forecastSeries;
  window.forecastSVG = forecastSVG;
  window.smartPlanHTML = smartPlanHTML;
  window.smartPlanUpdate = smartPlanUpdate;
  window.openScanner = openScanner;
  window.scanReceipt = scanReceipt;
  window.applyReceipt = applyReceipt;
  window.manualReceipt = manualReceipt;
  window.startVoice = startVoice;
  window.parseVoiceLocal = parseVoiceLocal;
  window.voiceToEditor = voiceToEditor;
  window.exportReport = exportReport;
  window.openAISettings = openAISettings;
}
