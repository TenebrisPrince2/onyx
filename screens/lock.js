"use strict";
/* screens/lock.js — экран блокировки (секция «15»). Клавиатура/точки — общий
   компонент createLockpad (app/lockpad.js), здесь только рамка экрана и проверка кода. */
/* ═══════════════════════════════ 15. lock screen ═══════════════════════════════ */
function showLock(onOk) {
  const el = document.createElement('div');
  el.className = 'lock';
  el.innerHTML = '<div class="mark"><span class="mark__g"></span>Onyx</div>' +
    '<p style="margin:0;color:var(--t2);font-size:14px">' + t('lock.title') + '</p>';
  document.body.appendChild(el);
  const pad = createLockpad({
    host: el,
    onComplete: async code => {
      const ok = await verifyPin(code, S.settings.pin);
      if (ok) {
        el.style.transition = 'opacity .35s var(--eo), transform .45s var(--eo)';
        el.style.opacity = '0';
        el.style.transform = 'scale(1.04)';
        setTimeout(() => el.remove(), 460);
        onOk();
      } else pad.fail();
    }
  });
}
