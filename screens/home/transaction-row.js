"use strict";

/* screens/home/transaction-row.js — рендер и кэширование отдельной строки операции (txnRow, txnRowCached). */

function txnRowCached(t, i, src) {
  const hide = !!S.settings.hideAmounts;
  if (_rowCache.src !== src || _rowCache.hide !== hide) { _rowCache.src = src; _rowCache.hide = hide; _rowCache.map = new Map(); }
  const k = (i < 12 ? i : 12) + '|' + t.id;
  let html = _rowCache.map.get(k);
  if (html === undefined) { html = txnRow(t, i); _rowCache.map.set(k, html); }
  return html;
}

function txnRow(t, i) {
  try {
    let title, iconName, color, sub, cls, sign, tileStyle;
    const a = accById(t.accountId);
    /* иконка счёта 16×16: плашка с фоном и цветом счёта перед названием счёта в подзаголовке строки */
    const accIco16 = x => x ? '<span class="rsub__ic" style="--c:' + (x.color || 'var(--t3)') + '">' + svgIcon(x.icon || 'wallet', 'ic', 9) + '</span>' : '';
    const hasNote = !!(t.note && t.note.trim());
    const isTransfer = t.type === 'transfer';
    if (isTransfer) {
      const b = accById(t.toAccountId);
      title = 'Перевод'; iconName = 'arrow-left-right'; color = '#2b7fff';
      const noteHtml = hasNote ? '<span class="rsub">' + esc(t.note) + '</span>' : '';
      const arrowSvg = '<span class="rsub__arr" style="color:var(--t3);flex:none;display:inline-flex;align-items:center;margin-bottom:-1px"><svg width="15" height="12" viewBox="0 0 30 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12h22"/><path d="m18 5 7 7-7 7"/></svg></span>';
      const line1 = '<span class="rsub rsub--tr rsub--transfer">' + (a ? accIco16(a) + '<span class="rsub__n">' + esc(a.name) + '</span>' : '<span class="rsub__n">?</span>') + arrowSvg + '</span>';
      const line2 = '<span class="rsub rsub--tr rsub--transfer">' + (b ? accIco16(b) + '<span class="rsub__n">' + esc(b.name) + '</span>' : '<span class="rsub__n">?</span>') + '</span>';
      sub = noteHtml + line1 + line2;
      cls = 'is-nt'; sign = '';
      tileStyle = '--c:#2b7fff;color:#2b7fff;background:transparent;width:40px;height:20px;border:0;align-self:flex-start;margin-top:12px;display:flex;align-items:center;justify-content:center;';
    } else if (t.type === 'adjust') {
      title = 'Корректировка'; iconName = 'settings'; color = 'var(--t2)';
      sub = (hasNote ? '<span class="rsub">' + esc(t.note) + '</span>' : '') + (a ? '<span class="rsub">' + accIco16(a) + '<span class="rsub__n">' + esc(a.name) + '</span></span>' : '');
      cls = 'is-nt'; sign = (t.adjustSign || 1) > 0 ? '+' : '−';
      tileStyle = '--c:' + color + ';width:40px;height:40px;border:0';
    } else {
      const c = catById(t.categoryId);
      title = c ? c.name : 'Без категории';
      iconName = c ? catLuc(c.icon) : 'circle-slash'; color = c ? c.color : 'var(--t3)';
      sub = (hasNote ? '<span class="rsub">' + esc(t.note) + '</span>' : '') + (a ? '<span class="rsub">' + accIco16(a) + '<span class="rsub__n">' + esc(a.name) + '</span></span>' : '');
      cls = t.type === 'income' ? 'is-in' : 'is-out'; sign = t.type === 'income' ? '+' : '−';
      tileStyle = '--c:' + color + ';width:40px;height:40px;border:0';
    }
    const bodyHeightStyle = isTransfer
      ? (hasNote ? 'min-height:75px;align-items:flex-start;' : 'height:75px;min-height:75px;max-height:75px;align-items:flex-start;')
      : (hasNote ? 'min-height:68px;' : 'height:68px;min-height:68px;max-height:68px;');
    const swCls = 'sw' + (isTransfer ? ' sw--tr' : '');
    const bodyCls = 'sw__body' + (isTransfer ? ' sw__body--tr' : '');
    return '<div class="' + swCls + '" data-id="' + t.id + '" style="--i:' + Math.min(i, 12) + '">' +
      '<div class="sw__acts"><button class="sw__act sw__act--del" data-act="del-txn" data-id="' + t.id + '" aria-label="Удалить">' + svgIcon('trash', 'ic', 20) + '</button></div>' +
      '<button class="' + bodyCls + '" data-act="open-txn" data-id="' + t.id + '" style="' + bodyHeightStyle + 'padding:8px 15px 8px 8px;background:#171717;border:0">' +
      '<span class="tile" style="' + tileStyle + '">' + svgIcon(iconName, 'ic', 20) + '</span>' +
      '<span class="row__main"><span class="row__t">' + esc(title) + '</span><span class="row__s">' + sub + '</span></span>' +
      '<span class="row__amt ' + cls + '"' + (isTransfer ? ' style="align-self:flex-start"' : '') + '>' + (S.settings.hideAmounts ? '<span class="hidden-amt">' + sign + money(t.amount, catCur(t)) + '</span>' : sign + money(t.amount, catCur(t))) + '</span>' +
      '</button></div>';
  } catch (e) {
    const rid = (t && t.id) || '';
    return '<div class="sw" data-id="' + rid + '"><button class="sw__body" data-act="open-txn" data-id="' + rid + '" style="height:68px;min-height:68px;max-height:68px;padding:8px 15px 8px 8px;background:#171717;border:0">' +
      '<span class="tile" style="--c:var(--t3);width:40px;height:40px;border:0">' + svgIcon('circle-slash', 'ic', 20) + '</span>' +
      '<span class="row__main"><span class="row__t">Операция</span><span class="row__s">не удалось отобразить детали</span></span>' +
      '<span class="row__amt is-nt amt"></span></button></div>';
  }
}

if (typeof window !== 'undefined') {
  window.txnRow = txnRow;
  window.txnRowCached = txnRowCached;
}
