"use strict";
/* domain/index.js — фасад window.AppDomain для отладки и будущего использования.
   Существующий код продолжает вызывать accBalances()/accById()/fresh() напрямую как раньше. */
window.AppDomain = {
  entities: { accById: accById, catById: catById, catsOf: catsOf, topCats: topCats, childrenOf: childrenOf, rootOf: rootOf, catCur: catCur, sysAcc: sysAcc, SYS_ACC_DEFS: SYS_ACC_DEFS },
  calc: { accBalances: accBalances, accBalance: accBalance, totalsByCur: totalsByCur, inRange: inRange, periodRange: periodRange, scopeTxns: scopeTxns, flowOf: flowOf },
  factories: { fresh: fresh, demoTxns: demoTxns, DEF_CATS: DEF_CATS, PALETTE: PALETTE }
};
