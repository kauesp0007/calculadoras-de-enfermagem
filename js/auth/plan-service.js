/**
 * js/auth/plan-service.js
 * Fonte única dos planos contratáveis do projeto.
 * Apenas free e junior existem. Junior custa R$ 10,00/mês.
 */
(function (window) {
  "use strict";
  window.AuthorizationModules = window.AuthorizationModules || {};

  // ── PREMIUM TEMPORARIAMENTE DESATIVADO ──
  // Todos os usuários são tratados como "free" e têm acesso total.
  // Altere para true quando o sistema premium for reativado.
  var PREMIUM_ENABLED = false;

  var LEVELS = { free: 0, junior: 10 };
  var PREMIUM_PLANS = PREMIUM_ENABLED ? ["junior"] : [];
  var PLANS = {
    free: { label: "Gratuito", level: 0, available: true, price: 0, priceLabel: "Grátis", permissions: ["viewPremium", "downloadPremium"] },
    junior: { label: "Júnior", level: 10, available: PREMIUM_ENABLED, price: 10.00, priceLabel: "R$ 10,00", permissions: ["viewPremium", "downloadPremium"] }
  };

  function levelOf(plan) { return LEVELS[plan] !== undefined ? LEVELS[plan] : -1; }
  function hasPlan(userPlan, required) {
    if (!PREMIUM_ENABLED) return true; // free tem acesso total
    if (!required || required === "free") return true;
    return levelOf(userPlan) >= levelOf(required);
  }
  function permissionsFor(plan) { return (PLANS[plan] || PLANS.free).permissions.slice(); }
  function isPremium(plan) { return PREMIUM_ENABLED && PREMIUM_PLANS.indexOf(plan) !== -1; }
  function isAvailable(plan) { return !!(PLANS[plan] && PLANS[plan].available); }
  function list() { return Object.keys(PLANS); }
  function label(plan) { return (PLANS[plan] || {}).label || plan; }

  window.AuthorizationModules.planService = {
    LEVELS: LEVELS, PLANS: PLANS, PREMIUM_PLANS: PREMIUM_PLANS, PREMIUM_ENABLED: PREMIUM_ENABLED,
    levelOf: levelOf, hasPlan: hasPlan, permissionsFor: permissionsFor,
    isPremium: isPremium, isAvailable: isAvailable, list: list, label: label
  };

  // Compatibilidade temporária com o código global de anúncios.
  // Com premium desativado, nenhum plano oculta anúncios.
  window.PREMIUM_AD_FREE_PLANS = PREMIUM_ENABLED ? ["junior"] : [];

  console.log("[Auth] Módulo plan-service.js carregado.");
})(window);
