"use strict";
/* domain/entities.js — селекторы и правила сущностей: поиск по id, сортировка, системные защищённые счета. Читают глобальное состояние S в момент вызова; DOM и localStorage не трогают. */
const SYS_ACC_DEFS = [
  { id: 'sys-fund', name: 'Подушка безопасности', icon: 'shield', color: PALETTE[11], system: 'fund' },
  { id: 'sys-goals', name: 'Накопления', icon: 'piggy-bank', color: PALETTE[6], system: 'goals' }
];
const sysAcc = kind => S.accounts.find(a => a.system === kind) || null;

/* selectors c O(1) Map-кэшем */
let _accMap = null, _accSrc = null;
function getAccMap() {
  const arr = (typeof S !== 'undefined' && S && S.accounts) || [];
  if (!_accMap || _accSrc !== arr || _accMap.size !== arr.length) {
    _accMap = new Map();
    for (let i = 0; i < arr.length; i++) { const a = arr[i]; if (a && a.id) _accMap.set(a.id, a); }
    _accSrc = arr;
  }
  return _accMap;
}

let _catMap = null, _catSrc = null;
function getCatMap() {
  const arr = (typeof S !== 'undefined' && S && S.categories) || [];
  if (!_catMap || _catSrc !== arr || _catMap.size !== arr.length) {
    _catMap = new Map();
    for (let i = 0; i < arr.length; i++) { const c = arr[i]; if (c && c.id) _catMap.set(c.id, c); }
    _catSrc = arr;
  }
  return _catMap;
}

function invalidateEntityIndices() {
  _accMap = null; _accSrc = null;
  _catMap = null; _catSrc = null;
}

const accById = id => id ? (getAccMap().get(id) || null) : null;
const catById = id => id ? (getCatMap().get(id) || null) : null;
const catsOf = kind => S.categories.filter(c => c.kind === kind).sort((a, b) => a.order - b.order);
const topCats = kind => catsOf(kind).filter(c => !c.parentId);
const childrenOf = id => S.categories.filter(c => c.parentId === id).sort((a, b) => a.order - b.order);
const rootOf = c => c && c.parentId ? (catById(c.parentId) || c) : c;
const catCur = t => t.currency || (accById(t.accountId) || {}).currency || S.settings.currency;
