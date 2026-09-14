/**
 * js/auth/auth-permissions.js
 *
 * RESPONSABILIDADE: Compatibilidade da camada legada de permissões.
 * A decisão efetiva de acesso premium é centralizada em Authorization.
 *
 * REGRA DE SEGURANÇA:
 * - plano expirado nunca concede recurso premium;
 * - lifetime=true permanece válido;
 * - permissões de papel podem continuar sendo resolvidas pelo RBAC central.
 */
(function (window) {
  "use strict";

  window.AuthModules = window.AuthModules || {};

  var PLAN_PERMISSIONS = {
    free: {
      canAccessPremium: false,
      canDownload: false,
      canViewCertificates: false,
      canSaveFavorites: true,
      canViewHistory: true
    },
    junior: {
      canAccessPremium: true,
      canDownload: true,
      canViewCertificates: true,
      canSaveFavorites: true,
      canViewHistory: true
    }
  };

  function _effectivePlan() {
    try {
      if (window.Authorization && typeof window.Authorization.getPlan === "function") {
        return window.Authorization.getPlan();
      }
    } catch (_) { }

    var profile = window.Auth ? window.Auth.profile() : null;
    if (!profile) return "free";
    if (profile.lifetime === true) return "junior";
    if (profile.plan !== "junior") return "free";

    if (!profile.planExpiresAt) return "junior";
    try {
      var expiry = profile.planExpiresAt && typeof profile.planExpiresAt.toDate === "function"
        ? profile.planExpiresAt.toDate()
        : new Date(profile.planExpiresAt);
      return !Number.isNaN(expiry.getTime()) && expiry.getTime() > Date.now() ? "junior" : "free";
    } catch (_) {
      return "free";
    }
  }

  function canAccess(resource) {
    var user = window.Auth ? window.Auth.currentUser() : null;
    if (!user) return false;

    var profile = window.Auth ? window.Auth.profile() : null;
    if (!profile) return false;

    // O RBAC central é a autoridade para administradores.
    if (window.Authorization && typeof window.Authorization.hasRole === "function" && window.Authorization.hasRole("administrator")) {
      return true;
    }

    var permissionMap = {
      "premium-content": "canAccessPremium",
      downloads: "canDownload",
      certificates: "canViewCertificates",
      favorites: "canSaveFavorites",
      history: "canViewHistory"
    };

    var permissionKey = permissionMap[resource];
    if (!permissionKey) {
      console.warn("[Permissions] Recurso desconhecido:", resource);
      return false;
    }

    var plan = _effectivePlan();
    var planPerms = PLAN_PERMISSIONS[plan] || PLAN_PERMISSIONS.free;
    return planPerms[permissionKey] === true;
  }

  function isAdmin() {
    if (window.Authorization && typeof window.Authorization.hasRole === "function") {
      return window.Authorization.hasRole("administrator");
    }
    return false;
  }

  function getCurrentPlan() {
    return _effectivePlan();
  }

  function isPlanExpired() {
    var profile = window.Auth ? window.Auth.profile() : null;
    if (!profile || profile.lifetime === true || profile.plan !== "junior") return false;
    if (!profile.planExpiresAt) return false;

    try {
      var expiry = profile.planExpiresAt && typeof profile.planExpiresAt.toDate === "function"
        ? profile.planExpiresAt.toDate()
        : new Date(profile.planExpiresAt);
      return Number.isFinite(expiry.getTime()) && Date.now() >= expiry.getTime();
    } catch (_) {
      return true;
    }
  }

  window.AuthModules.permissions = {
    canAccess: canAccess,
    isAdmin: isAdmin,
    getCurrentPlan: getCurrentPlan,
    isPlanExpired: isPlanExpired,
    PLAN_PERMISSIONS: PLAN_PERMISSIONS
  };

  console.log("[Auth] Módulo auth-permissions.js carregado.");
})(window);
