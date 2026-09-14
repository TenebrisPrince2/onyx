"use strict";
/* screens/index.js — фасад window.AppScreens для отладки.
   Экраны остаются простыми глобальными функциями, как раньше; инициализация — в boot() основного скрипта. */
window.AppScreens = {
  categoryForm: CategoryFormScreen,
  accountForm: AccountFormScreen,
  goalForm: GoalFormScreen
};
