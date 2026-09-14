"use strict";

/* screens/smart/advisor-view.js — экран «AI-советник» (чат с ИИ / локальным советником, голосовой ввод, чипсы). */

function openAdvisor(ask) {
  ADV.ask = ask || null;
  if (ADV.rec && nav.includes(ADV.rec)) {
    if (ADV.ask) { const q = ADV.ask; ADV.ask = null; const i2 = ADV.rec.el && ADV.rec.el.querySelector('#advInp'); if (i2) i2.value = q; }
    return;
  }
  ADV.busy = false;
  const rec = pushScreen({ id: 'advisor', push: true, html: advHTML(), mount: advMount, refresh: () => { rec.el.innerHTML = advHTML(); icons(rec.el); advMount(rec.el); } });
  rec.el.classList.add('astats');
  ADV.rec = rec;
}

function advHTML() {
  return '<div class="as">' +
    '<div class="as__grab"></div>' +
    '<div class="as__hd">' +
    '<button class="as__btn" data-act="adv-close" aria-label="Закрыть"><i data-lucide="x" class="ic" style="width:20px;height:20px"></i></button>' +
    '<div class="as__ttl">AI-советник</div>' +
    '<span class="as__hsp"></span>' +
    '<button class="as__btn" data-act="adv-cfg" aria-label="ИИ-настройки"><i data-lucide="sparkle" class="ic" style="width:20px;height:20px"></i></button>' +
    '</div>' +
    '<div class="adv-chips">' + ADV_CHIPS.map(c => '<button class="adv-chip glass" type="button" data-chip="' + esc(c) + '"><i data-lucide="sparkle" class="ic"></i>' + esc(c) + '</button>').join('') + '</div>' +
    '<div class="as__body" style="padding-top:14px">' +
    '<div id="advList" style="display:flex;flex-direction:column;min-height:100%">' + advListHTML() + '</div>' +
    '</div>' +
    '<div class="adv-bar">' +
    '<div class="adv-in glass">' +
    '<button type="button" data-act="adv-mic" aria-label="Голосом"><i data-lucide="mic" class="ic"></i></button>' +
    '<input id="advInp" placeholder="Спросите что-нибудь…" maxlength="300" autocomplete="off">' +
    '<button type="button" class="adv-send" data-act="adv-send" aria-label="Отправить"><i data-lucide="arrow-up" class="ic"></i></button>' +
    '</div></div>' +
    '</div>';
}

function advListHTML(typing) {
  const on = aiReady();
  let h = '';
  if (!ADV.msgs.length) {
    h += '<div class="adv-empty">' +
      '<span class="adv-empty__ic lgs"><i data-lucide="sparkle" class="ic"></i></span>' +
      '<h3>' + (on ? 'Спросите что угодно о финансах' : 'Нужен API-ключ') + '</h3>' +
      '<p>' + (on ? 'ИИ видит только ваш срез данных за 30 дней и отвечает по-русски, с конкретными цифрами.' : 'Укажите в настройках свой OpenAI-совместимый endpoint и API-ключ. Без ключа работает офлайн-режим.') + '</p>' +
      (on ? '' : '<button class="btn btn--chrome" type="button" data-act="adv-key">Открыть настройки</button>') +
      '</div>';
  }
  h += '<div class="adv-msgs">';
  ADV.msgs.forEach(m => {
    if (m.role === 'user') h += '<div class="adv-row"><div class="adv-u lgs">' + esc(m.text) + '</div></div>';
    else h += '<div class="adv-ai"><span class="adv-ai__av"><i data-lucide="sparkle" class="ic"></i></span>' +
      '<div class="adv-ai__b">' +
      (m.off ? '<span class="adv-tag"><i data-lucide="' + (m.off === 'err' ? 'globe' : 'shield') + '" class="ic"></i>' + (m.off === 'err' ? 'ИИ недоступен · офлайн-ответ' : 'офлайн-ответ') + '</span>' : '') +
      esc(m.text) + '</div></div>';
  });
  if (typing) h += '<div class="adv-ai"><span class="adv-ai__av"><i data-lucide="sparkle" class="ic"></i></span><div class="adv-ai__b"><span class="adv-typ"><i></i><i></i><i></i></span></div></div>';
  h += '</div>';
  return h;
}

function advScroll(el) {
  const body = el.querySelector('.as__body');
  if (body) requestAnimationFrame(() => { body.scrollTop = body.scrollHeight; });
}

function advMount(el) {
  el.querySelector('[data-act="adv-close"]').onclick = () => popScreen();
  const cfg = el.querySelector('[data-act="adv-cfg"]');
  if (cfg) cfg.onclick = () => openAISettings();
  const kb = el.querySelector('[data-act="adv-key"]');
  if (kb) kb.onclick = () => openAISettings();
  const inp = el.querySelector('#advInp');
  const send = () => { const t = inp.value.trim(); if (!t || ADV.busy) return; inp.value = ''; advSend(t); };
  el.querySelector('[data-act="adv-send"]').onclick = send;
  inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); send(); } });
  el.querySelectorAll('[data-chip]').forEach(b => b.onclick = () => { if (!ADV.busy) advSend(b.dataset.chip); });
  el.querySelector('[data-act="adv-mic"]').onclick = () => {
    const btn = el.querySelector('[data-act="adv-mic"]');
    btn.style.color = 'var(--exp)';
    haptic('light');
    startVoice(text => { btn.style.color = ''; if (!ADV.busy) advSend(text); }, () => { btn.style.color = ''; });
  };
  advScroll(el);
  /* вопрос от кнопок ИИ: подставляем в поле ввода, без автопостановки */
  if (ADV.ask) { const q = ADV.ask; ADV.ask = null; const i2 = el.querySelector('#advInp'); if (i2) i2.value = q; }
}

async function advSend(text) {
  if (ADV.busy) return;
  ADV.busy = true;
  ADV.msgs.push({ role: 'user', text });
  const el = ADV.rec && ADV.rec.el;
  if (el && el.isConnected) { const list = el.querySelector('#advList'); if (list) { list.innerHTML = advListHTML(true); icons(list); advScroll(el); } }
  let answer = null, off = false, err = false;
  if (aiReady()) {
    try {
      answer = await aiChat([
        { role: 'system', content: AI_SYS },
        { role: 'user', content: 'Мои финансовые данные (JSON):\n' + JSON.stringify(aiSnapshot()) + '\n\nМой вопрос: ' + text }
      ]);
    } catch (e) { err = true; }
  } else off = true;
  if (answer === null) {
    try { answer = localAdvice(text); } catch (e) { answer = 'Не удалось посчитать ответ по вашим данным.'; }
    off = err ? 'err' : true;
    if (err) toast('ИИ недоступен — отвечаю офлайн', null, { icon: 'globe' });
  }
  ADV.msgs.push({ role: 'ai', text: answer, off: off || undefined });
  ADV.busy = false;
  if (el && el.isConnected) { const list = el.querySelector('#advList'); if (list) { list.innerHTML = advListHTML(); icons(list); advScroll(el); } }
}

if (typeof window !== 'undefined') {
  window.openAdvisor = openAdvisor;
  window.advHTML = advHTML;
  window.advListHTML = advListHTML;
  window.advScroll = advScroll;
  window.advMount = advMount;
  window.advSend = advSend;
}
