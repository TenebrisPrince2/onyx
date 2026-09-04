"use strict";
/* storage/state.js — нормализация/валидация состояния и восстановление из бэкапа. DEF_SETTINGS объявлен в index.html, читается в момент вызова. */
const DEF_BACKUP_STATE = () => ({ accounts: [], categories: [], transactions: [], goals: [], templates: [], settings: JSON.parse(JSON.stringify(DEF_SETTINGS)), v: 1 });
/* Нормализация состояния из любой резервной копии (localStorage / IndexedDB) */
function normState(p) {
  const st = Object.assign(DEF_BACKUP_STATE(), p);
  if (Array.isArray(st.transactions)) {
    st.transactions.sort((a, b) => {
      const da = a.date || '', db = b.date || '';
      return db < da ? -1 : (db > da ? 1 : 0);
    });
  }
  if (st.settings) st.settings = Object.assign(JSON.parse(JSON.stringify(DEF_SETTINGS)), st.settings || {});
  return st;
}

function restoreFromBackup() {
  try {
    const raw = localStorage.getItem(KEY_BAK);
    if (!raw) return null;
    return normState(JSON.parse(raw));
  } catch (e) { return null; }
}
