"use strict";
/* storage/store.js — загрузка/сохранение состояния (localStorage + зеркало + IndexedDB). Зависимости из index.html (S, fresh, demoTxns, toast, emitStore, balCache/txnSortCache из domain/) разрешаются в момент вызова через общую глобальную область. */
async function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const p = JSON.parse(raw);
      if (!p || typeof p !== 'object' || !Array.isArray(p.transactions)) throw new Error('corrupt');
      S = Object.assign(fresh(), p);
      S.settings = Object.assign(JSON.parse(JSON.stringify(DEF_SETTINGS)), p.settings || {});
      S.settings.reminder = Object.assign({ enabled: false, time: '20:00' }, (p.settings || {}).reminder || {});
      S.settings.ai = Object.assign(DEF_AI(), (p.settings || {}).ai || {});
      /* SECURITY: разовая миграция — у пользователей со старой версии мог остаться дефолтный
         endpoint-прокси (chatanywhere). Сбрасываем его: ключ пользователя не должен уходить
         на сторонний сервис без явного повторного выбора endpoint в настройках ИИ. */
      if (S.settings.ai.endpoint === 'https://api.chatanywhere.tech/v1/chat/completions') S.settings.ai.endpoint = '';
      ['accounts', 'categories', 'transactions', 'goals', 'templates'].forEach(k => { if (!Array.isArray(S[k])) S[k] = []; });
      delete S.budgets;
    } else {
      /* Основного ключа нет — браузер/ОС могли очистить localStorage (главная причина
         «пропали операции»). Пробуем вернуть данные из IndexedDB-бэкапа. */
      const idb = await idbGet();
      if (idb && Array.isArray(idb.transactions)) {
        S = normState(idb);
        S.settings.demoRegenV2 = true;
        persist({ silent: true });
        toast('Данные восстановлены из резервной копии');
      } else {
        S = fresh();
        S.settings.demoRegenV2 = true;
        save();
        return;
      }
    }
  } catch (e) {
    const b = restoreFromBackup() || (await idbGet());
    if (b && Array.isArray(b.transactions)) {
      S = normState(b);
      S.settings.demoRegenV2 = true;
      persist({ silent: true });
      toast('Данные повреждены — восстановлено из резервной копии', null, { tone: 'danger' });
    } else {
      S = fresh();
      S.settings.demoRegenV2 = true;
      save();
      toast('Хранилище повреждено — начали заново', null, { tone: 'danger' });
    }
  }
  /* разовая перегенерация операций (демо v2): удалить все и наполнить разнообразным набором заново.
     Генерируем только если набор ещё помечен как демо (settings.demo): после сброса всех данных,
     очистки демо или импорта старой копии флага нет — без этой проверки мы бы молча дописали
     демо-операции поверх пустых/пользовательских данных */
  if (!S.settings.demoRegenV2) {
    S.settings.demoRegenV2 = true;
    if (S.settings.demo) S.transactions = demoTxns(S);
    try { save(); } catch (e2) {}
  }
  txnSortCache.invalidate();   /* состояние могло быть полностью заменено (localStorage/idb/backup) — кэш сортировки сбрасываем */
  if (typeof invalidateEntityIndices === 'function') invalidateEntityIndices();
}
let saveT = null;
let dirty = false;
/* PERF: зеркало-бэкап (KEY_BAK) раньше писалось СИНХРОННО при каждом persist — двойная
   запись всего состояния (сотни КБ на демо-данных) в главном потоке давала фриз через
   ~200 мс после каждого действия. Теперь: основная копия пишется сразу, зеркало —
   раз в 30 сек и принудительно на выходе/скрытии страницы. */
let lastMirror = 0;
function persistMirror(force) {
  const now = Date.now();
  if (!force && now - lastMirror < 30000) return;
  lastMirror = now;
  try { const raw = localStorage.getItem(KEY); if (raw) localStorage.setItem(KEY_BAK, raw); } catch (e) {}
}
function persist(opts) {
  try {
    const json = JSON.stringify(S);
    localStorage.setItem(KEY, json);
    persistMirror();                        // троттлинг: не чаще раза в 30 сек
    dirty = false;                          // снимаем флаг только после успешной записи
    try { idbPut(S); } catch (e2) {}        // внешний бэкап в IndexedDB — переживает очистку localStorage
  } catch (e) {
    toast('Не удалось сохранить: хранилище переполнено', null, { tone: 'danger' });
  }
  if (!(opts && opts.silent)) emitStore();
}
function save() {
  balCache.invalidate(); txnSortCache.invalidate();   /* PERF: данные изменились — кэши (domain/calculations.js) устарели */
  if (typeof invalidateEntityIndices === 'function') invalidateEntityIndices();
  dirty = true;
  clearTimeout(saveT);
  /* PERF: пишем в «простой» браузера (requestIdleCallback, не дольше 700 мс) —
     синхронная запись не вклинивается в скролл/тап и не даёт фриза */
  saveT = setTimeout(() => {
    if (window.requestIdleCallback) window.requestIdleCallback(persist, { timeout: 700 });
    else persist();
  }, 200);
  if (saveT && typeof saveT.unref === 'function') saveT.unref();
}
/* Сбрасываем отложенную запись синхронно при выходе/сворачивании приложения на
   телефоне: без этого debounce-таймер может не дожить до закрытия страницы, и
   последние операции (добавленные прямо перед выходом) теряются. */
(function persistOnExit() {
  if (typeof window === 'undefined' || typeof document === 'undefined' || !document.addEventListener) return;
  const flush = () => { if (dirty) { clearTimeout(saveT); persist(); } persistMirror(true); };
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flush(); });
  window.addEventListener('pagehide', flush);
  window.addEventListener('beforeunload', flush);
  setInterval(() => { if (dirty) persistMirror(); }, 30000);
})();
