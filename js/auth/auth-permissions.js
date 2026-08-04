/**
 * js/auth/auth-permissions.js
 * 
 * RESPONSABILIDADE: Verificação de permissões e nível de acesso.
 * 
 * Este módulo implementa a lógica de controle de acesso baseada em:
 *   - Plano do usuário (free, premium_monthly, premium_annual)
 *   - Status da conta (active, suspended)
 *   - Papel (user, admin)
 * 
 * ESTRUTURA DE PERMISSÕES:
 * 
 *   Plano "free":
 *     canAccessPremium: false
 *     canDownload: false (downloads premium)
 *     canViewCertificates: false
 * 
 *   Plano "premium_monthly" / "premium_annual":
 *     canAccessPremium: true
 *     canDownload: true
 *     canViewCertificates: true
 * 
 *   Papel "admin":
 *     Todas as permissões + acesso ao painel administrativo
 * 
 * USO:
 *   var perms = AuthModules.permissions;
 *   if (perms.canAccess("premium-content")) { ... }
 *   if (perms.isAdmin()) { ... }
 */

(function (window) {
  "use strict";

  // ─── Garante que o namespace existe ───────────────────────────
  window.AuthModules = window.AuthModules || {};

  // ─── Mapa de permissões por plano ───────────────────────────────

  /**
   * Define quais permissões cada plano possui.
   * 
   * 🔧 FUTURO: Para adicionar novas permissões, adicione a chave
   *    nos objetos abaixo e na estrutura do Firestore.
   */
  var PLAN_PERMISSIONS = {
    free: {
      canAccessPremium: false,
      canDownload: false,
      canViewCertificates: false,
      canSaveFavorites: true,
      canViewHistory: true
    },
    premium_monthly: {
      canAccessPremium: true,
      canDownload: true,
      canViewCertificates: true,
      canSaveFavorites: true,
      canViewHistory: true
    },
    premium_annual: {
      canAccessPremium: true,
      canDownload: true,
      canViewCertificates: true,
      canSaveFavorites: true,
      canViewHistory: true
    }
  };

  // ─── API Pública ────────────────────────────────────────────────

  /**
   * Verifica se o usuário pode acessar um recurso específico.
   * 
   * @param {string} resource - Identificador do recurso.
   * @returns {boolean}
   * 
   * EXEMPLOS:
   *   canAccess("premium-content")
   *   canAccess("downloads")
   *   canAccess("certificates")
   */
  function canAccess(resource) {
    var user = window.Auth ? window.Auth.currentUser() : null;
    if (!user) {
      return false;
    }

    // Busca o perfil do cache ou do Auth.core
    var profile = window.Auth ? window.Auth.profile() : null;

    // Se não tem perfil carregado, assume free
    var plan = profile ? profile.plan : "free";

    // Admin sempre tem acesso total
    if (profile && profile.permissions && profile.permissions.role === "admin") {
      return true;
    }

    // Mapeia recurso → permissão
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

    // Verifica a permissão no plano
    var planPerms = PLAN_PERMISSIONS[plan] || PLAN_PERMISSIONS.free;
    return planPerms[permissionKey] === true;
  }

  /**
   * Verifica se o usuário é administrador.
   * @returns {boolean}
   */
  function isAdmin() {
    var profile = window.Auth ? window.Auth.profile() : null;
    if (!profile || !profile.permissions) {
      return false;
    }
    return profile.permissions.role === "admin";
  }

  /**
   * Retorna o plano atual do usuário.
   * @returns {string} "free" | "premium_monthly" | "premium_annual" | "unknown"
   */
  function getCurrentPlan() {
    var profile = window.Auth ? window.Auth.profile() : null;
    return profile ? profile.plan : "unknown";
  }

  /**
   * Verifica se o plano do usuário expirou.
   * @returns {boolean}
   */
  function isPlanExpired() {
    var profile = window.Auth ? window.Auth.profile() : null;
    if (!profile || !profile.planExpiresAt) {
      return false;
    }

    var now = new Date();
    var expiry = profile.planExpiresAt.toDate
      ? profile.planExpiresAt.toDate()
      : new Date(profile.planExpiresAt);

    return now > expiry;
  }

  // ─── Exportação ─────────────────────────────────────────────────
  window.AuthModules.permissions = {
    canAccess: canAccess,
    isAdmin: isAdmin,
    getCurrentPlan: getCurrentPlan,
    isPlanExpired: isPlanExpired,
    PLAN_PERMISSIONS: PLAN_PERMISSIONS
  };

  console.log("[Auth] Módulo auth-permissions.js carregado.");

})(window);
