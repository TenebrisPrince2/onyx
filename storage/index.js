"use strict";
/* storage/index.js — фасад window.AppStorage для отладки и будущего использования.
   Существующий код продолжает вызывать save()/load()/persist() напрямую как раньше. */
window.AppStorage = {
  keys: { KEY: KEY, KEY_BAK: KEY_BAK },
  idb: { open: idbOpen, put: idbPut, get: idbGet },
  normState: normState,
  restoreFromBackup: restoreFromBackup,
  persist: persist,
  persistMirror: persistMirror,
  save: save,
  load: load
};
