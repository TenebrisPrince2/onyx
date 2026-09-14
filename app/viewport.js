/* app/viewport.js */
"use strict";
/* Автокоррекция застрявшего layout-вьюпорта в iOS standalone:
   если окно (outerHeight) заметно выше layout-вьюпорта — растягиваем корень на окно.
   Пересчитывается на каждый resize/поворот, чтобы не залипать в одной ориентации.
   Перенесено из inline-скрипта index.html без изменений поведения. */
(function viewportFix() {
  const applyFix = () => {
    const gap = (window.outerHeight || 0) - document.documentElement.clientHeight;
    if (matchMedia('(display-mode: standalone)').matches && gap > 20) {
      document.documentElement.style.setProperty('--appH', window.outerHeight + 'px');
    } else {
      document.documentElement.style.removeProperty('--appH');
    }
  };
  applyFix();
  if (window.visualViewport) window.visualViewport.addEventListener('resize', applyFix);
  window.addEventListener('resize', applyFix);
  window.addEventListener('orientationchange', applyFix);
  window.App = window.App || {};
  App.viewport = { applyFix: applyFix };
})();
