"use strict";
/* screens/search.js — поиск (секция «11») + drill-down (секция «12»).
   Вынесено байт-в-байт; все зависимости (utils/storage/domain/S/nav/toast…) разрешаются в момент вызова через общую глобальную область. */
/* ═══════════════════════════════ 11. search ═══════════════════════════════ */
function openSearch() {
  const st = { q: '' };
  const rec = pushScreen({
    id: 'search', push: true,
    html: '<div class="shead"><button class="iconbtn" data-act="close"><i data-lucide="x" class="ic"></i></button></div>' +
      '<div class="screen__body" id="res" style="padding-top:0"></div>' +
      '<div class="search-foot"><input class="inp" id="q" placeholder="Поиск" style="min-height:42px" autofocus></div>',
    mount(el) {
      el.querySelector('[data-act="close"]').onclick = () => popScreen();
      const q = el.querySelector('#q'), res = el.querySelector('#res');
      const draw = () => {
        const s = st.q.trim().toLowerCase();
        if (!s) {
          res.innerHTML = '<div class="empty"><h3>Начните вводить</h3><p>Поиск по заметкам, категориям, счетам и суммам.</p></div>';
          icons(res); return;
        }
        let list = S.transactions.filter(t => {
          const c = catById(t.categoryId), a = accById(t.accountId);
          return (t.note || '').toLowerCase().includes(s) || (c && c.name.toLowerCase().includes(s)) ||
            (a && a.name.toLowerCase().includes(s)) || String(t.amount).includes(s);
        });
        list = list.slice(0, 120);
        if (!list.length) {
          res.innerHTML = '<div class="empty"><h3>Ничего не найдено</h3><p>Попробуйте другое слово или сумму.</p></div>';
          icons(res); return;
        }
        const total = flowOf(list, 'expense'), inc = flowOf(list, 'income');
        const groups = {};
        list.forEach(t => { (groups[dkey(t)] = groups[dkey(t)] || []).push(t); });
        res.innerHTML = '<div class="banner" style="margin:0 0 12px"><p><b>' + list.length + ' операций</b>−' + money(total) + (inc ? '  +' + money(inc) : '') + '</p></div>' +
          Object.keys(groups).sort().reverse().map(k => '<div class="dayhead"><b>' + dayLabel(k) + '</b></div><div class="group">' + groups[k].map((t, i) => txnRow(t, i)).join('') + '</div>').join('');
        icons(res);
      };
      let qT = null;
      q.oninput = () => { clearTimeout(qT); qT = setTimeout(() => { st.q = q.value; draw(); }, 200); };
      enableSwipe(res, true);
      res.addEventListener('click', e => { const b = e.target.closest('[data-act]'); if (!b) return; if (b.dataset.act === 'open-txn' || b.dataset.act === 'edit-txn') openEditor({ id: b.dataset.id }); if (b.dataset.act === 'del-txn') { delTxn(b.dataset.id); draw(); } });
      draw();
      setTimeout(() => q.focus(), 320);
    }
  });
}

/* ═══════════════════════════════ 12. drill-down ═══════════════════════════════ */
function openDrill(catId) {
  const r = asRange();
  const c = catId === 'none' ? null : catById(catId);
  const ids = c ? [c.id, ...childrenOf(c.id).map(x => x.id)] : [null, undefined];
  const list = scopeTxns(r, UI.accId).filter(t => asKind(t, AS.kind) && (c ? ids.includes(t.categoryId) : !t.categoryId)).sort((a, b) => (b.date > a.date ? 1 : b.date < a.date ? -1 : 0));
  const total = sum(list.map(t => t.amount));
  const groups = {};
  list.forEach(t => { (groups[dkey(t)] = groups[dkey(t)] || []).push(t); });
  const rec = pushScreen({
    id: 'drill', push: true,
    html: '<div class="shead"><button class="iconbtn" data-act="close"><i data-lucide="x" class="ic"></i></button><h2>' + esc(c ? c.name : 'Без категории') + '</h2></div>' +
      '<div class="screen__body"><div class="hero" style="padding-top:4px"><div class="hero__lab">' + esc(r.label) + '</div>' +
      '<h1 class="hero__amt">' + money(total) + '</h1><div class="hero__alt">' + list.length + ' операций · в среднем ' + money(total / Math.max(1, list.length)) + '</div></div>' +
      Object.keys(groups).sort().reverse().map(k => '<div class="dayhead"><b>' + dayLabel(k) + '</b><span>' + money(sum(groups[k].map(t => t.amount))) + '</span></div><div class="group">' + groups[k].map((t, i) => txnRow(t, i)).join('') + '</div>').join('') + '</div>',
    mount(el) {
      el.querySelector('[data-act="close"]').onclick = () => popScreen();
      enableSwipe(el, true);
      el.addEventListener('click', e => {
        const b = e.target.closest('[data-act]'); if (!b) return;
        if (b.dataset.act === 'open-txn' || b.dataset.act === 'edit-txn') openEditor({ id: b.dataset.id });
        if (b.dataset.act === 'del-txn') { delTxn(b.dataset.id); popScreen(); }
      });
    }
  });
}
