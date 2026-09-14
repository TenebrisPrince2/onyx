/* app/i18n.js — минимальный слой локализации: словарь + t(key, params).
   Русский — базовый язык и fallback; новые языки добавляются в I18N частично,
   недостающие ключи автоматически берутся из ru. Перевод существующих строк —
   инкрементально: заменяем литерал на t('ключ') по мере касания кода. */
"use strict";
const I18N = {
  ru: {
    'lock.title': 'Введите код-пароль',
    'pin.newTitle': 'Новый код-пароль',
    'pin.setNew': 'Придумайте 4 цифры',
    'pin.repeat': 'Повторите код',
    'pin.mismatch': 'Не совпало, попробуйте снова',
    'pin.enabled': 'Код-пароль включён',
    'pin.off': 'Код-пароль отключён',
    'acc.system': 'Системный счёт — его нельзя удалить',
    'acc.needOne': 'Нужен хотя бы один счёт',
    'acc.deleted': 'Счёт удалён',
    'acc.restored': 'Счёт восстановлен',
    'cat.deleted': 'Категория удалена',
    'cat.restored': 'Категория восстановлена',
    'goal.deleted': 'Накопление удалено',
    'goal.restored': 'Накопление восстановлено',
    'tpl.deleted': 'Шаблон удалён',
    'recurring.added': 'Добавлено повторяющихся: {n}',
    'import.dropped': 'Пропущено некорректных записей: {n}',
    'import.tooMany': 'Слишком много операций в файле (макс. {max})'
  },
  en: {
    'lock.title': 'Enter passcode',
    'pin.setNew': 'Pick 4 digits',
    'pin.repeat': 'Repeat the code',
    'pin.mismatch': "Didn't match, try again",
    'pin.enabled': 'Passcode enabled',
    'tpl.deleted': 'Template deleted',
    'recurring.added': 'Recurring added: {n}',
    'import.dropped': 'Skipped invalid records: {n}',
    'import.tooMany': 'Too many operations in file (max {max})'
  }
};
let I18N_LANG = 'ru';
function setLang(lang) { if (I18N[lang]) I18N_LANG = lang; }
/** t('recurring.added', { n: 3 }) → подстановка {n}; неизвестный ключ возвращается как есть */
function t(key, params) {
  const dict = I18N[I18N_LANG] || {};
  let s = dict[key] !== undefined ? dict[key] : (I18N.ru[key] !== undefined ? I18N.ru[key] : key);
  if (params) for (const k in params) s = s.split('{' + k + '}').join(String(params[k]));
  return s;
}
window.App = window.App || {};
App.i18n = { t: t, setLang: setLang, dict: I18N };