"use strict";

/* screens/smart/index.js — фасад window.AppSmart для отладки и связывания подсистем Smart. */

window.AppSmart = {
  get model() {
    return {
      get moneyPlain() { return typeof moneyPlain !== 'undefined' ? moneyPlain : undefined; },
      get sumOf() { return typeof sumOf !== 'undefined' ? sumOf : undefined; },
      get detectSubscriptions() { return typeof detectSubscriptions !== 'undefined' ? detectSubscriptions : undefined; },
      get payCycle() { return typeof payCycle !== 'undefined' ? payCycle : undefined; },
      get smartBase() { return typeof smartBase !== 'undefined' ? smartBase : undefined; },
      get loggingStreak() { return typeof loggingStreak !== 'undefined' ? loggingStreak : undefined; },
      get healthCore() { return typeof healthCore !== 'undefined' ? healthCore : undefined; },
      get healthHistory() { return typeof healthHistory !== 'undefined' ? healthHistory : undefined; },
      get healthDelta() { return typeof healthDelta !== 'undefined' ? healthDelta : undefined; },
      get healthActions() { return typeof healthActions !== 'undefined' ? healthActions : undefined; }
    };
  },
  get advisor() {
    return {
      get open() { return typeof openAdvisor !== 'undefined' ? openAdvisor : undefined; },
      get send() { return typeof advSend !== 'undefined' ? advSend : undefined; }
    };
  },
  get health() {
    return {
      get open() { return typeof openHealth !== 'undefined' ? openHealth : undefined; },
      get cardHTML() { return typeof healthCardHTML !== 'undefined' ? healthCardHTML : undefined; }
    };
  },
  get features() {
    return {
      get planUpdate() { return typeof smartPlanUpdate !== 'undefined' ? smartPlanUpdate : undefined; },
      get scanner() { return typeof openScanner !== 'undefined' ? openScanner : undefined; },
      get voice() { return typeof startVoice !== 'undefined' ? startVoice : undefined; },
      get exportReport() { return typeof exportReport !== 'undefined' ? exportReport : undefined; },
      get aiSettings() { return typeof openAISettings !== 'undefined' ? openAISettings : undefined; }
    };
  }
};
