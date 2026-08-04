/**
 * js/auth/auth-session.js
 * 
 * RESPONSABILIDADE: Gerenciamento de persistência e restauração de sessão.
 * 
 * O Firebase Auth já gerencia a sessão automaticamente via IndexedDB.
 * Este módulo complementa com:
 *   - Cache local do perfil do usuário (localStorage)
 *   - Detecção de expiração de sessão
 *   - Restauração do estado da UI após recarregar a página
 *   - Limpeza segura de dados locais no logout
 * 
 * COMPORTAMENTO:
 *   - Ao fechar e abrir o navegador: sessão restaurada automaticamente
 *   - Token inválido/expirado: Firebase notifica via onAuthStateChanged(null)
 *   - Logout manual: limpa cache local + Firebase
 * 
 * USO (interno - chamado por auth-core.js):
 *   AuthModules.session.persistProfile(profileData);
 *   AuthModules.session.getCachedProfile();
 *   AuthModules.session.clearCache();
 */

(function (window) {
  "use strict";

  // ─── Garante que o namespace existe ───────────────────────────
  window.AuthModules = window.AuthModules || {};

  // ─── Constantes ────────────────────────────────────────────────
  var STORAGE_PREFIX = "auth_";
  var PROFILE_KEY = STORAGE_PREFIX + "profile";
  var LAST_LOGIN_KEY = STORAGE_PREFIX + "last_login";
  var SESSION_EXPIRY_DAYS = 30; // Sessão expira após 30 dias de inatividade

  // ─── API Pública ────────────────────────────────────────────────

  /**
   * Persiste o perfil do usuário no localStorage.
   * 
   * ATENÇÃO: Apenas dados NÃO SENSÍVEIS são armazenados aqui.
   * Nunca armazenar: tokens, senhas, dados de pagamento.
   * 
   * @param {object} profileData - Dados do perfil do Firestore.
   */
  function persistProfile(profileData) {
    if (!profileData) {
      return;
    }

    try {
      // Filtra apenas campos seguros para cache local
      var safeProfile = {
        displayName: profileData.displayName || "",
        photoURL: profileData.photoURL || "",
        language: profileData.language || "pt",
        plan: profileData.plan || "free",
        permissions: profileData.permissions || {},
        cachedAt: Date.now()
      };

      localStorage.setItem(PROFILE_KEY, JSON.stringify(safeProfile));
      localStorage.setItem(LAST_LOGIN_KEY, String(Date.now()));
    } catch (e) {
      console.warn("[Session] Não foi possível persistir o perfil:", e);
    }
  }

  /**
   * Recupera o perfil em cache do localStorage.
   * Útil para exibir nome/foto antes do Firestore responder.
   * 
   * @returns {object|null} Perfil em cache ou null.
   */
  function getCachedProfile() {
    try {
      var raw = localStorage.getItem(PROFILE_KEY);
      if (!raw) {
        return null;
      }

      var profile = JSON.parse(raw);

      // Verifica se o cache ainda é válido (30 dias)
      var age = Date.now() - (profile.cachedAt || 0);
      var maxAge = SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000;

      if (age > maxAge) {
        clearCache();
        return null;
      }

      return profile;
    } catch (e) {
      return null;
    }
  }

  /**
   * Verifica se existe uma sessão em cache.
   * Mais rápido que verificar via Firebase (não requer rede).
   * 
   * @returns {boolean}
   */
  function hasCachedSession() {
    return getCachedProfile() !== null;
  }

  /**
   * Limpa todo o cache local de autenticação.
   * Chamado durante o logout.
   */
  function clearCache() {
    try {
      // Remove apenas chaves com prefixo auth_
      var keysToRemove = [];
      for (var i = 0; i < localStorage.length; i++) {
        var key = localStorage.key(i);
        if (key && key.indexOf(STORAGE_PREFIX) === 0) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach(function (key) {
        localStorage.removeItem(key);
      });

      console.log("[Session] Cache local limpo.");
    } catch (e) {
      console.warn("[Session] Erro ao limpar cache:", e);
    }
  }

  /**
   * Retorna a data do último login (timestamp).
   * @returns {number|null}
   */
  function getLastLogin() {
    try {
      var ts = localStorage.getItem(LAST_LOGIN_KEY);
      return ts ? parseInt(ts, 10) : null;
    } catch (e) {
      return null;
    }
  }

  // ─── Sincronização com Firebase Auth ────────────────────────────

  /**
   * Configura a sincronização entre Firebase Auth e o cache local.
   * 
   * Quando o Firebase detecta mudança de estado (login/logout),
   * o cache local é atualizado automaticamente.
   * 
   * @param {object} auth - Instância do Firebase Auth.
   */
  function syncWithFirebase(auth) {
    if (!auth || !auth.onAuthStateChanged) {
      return;
    }

    auth.onAuthStateChanged(function (user) {
      if (user) {
        // Usuário logou: garante que há cache
        if (!getCachedProfile()) {
          persistProfile({
            displayName: user.displayName,
            photoURL: user.photoURL,
            email: user.email
          });
        }
      } else {
        // Usuário deslogou (sessão expirada): limpa cache
        clearCache();
      }
    });
  }

  // ─── Exportação ─────────────────────────────────────────────────
  /** @namespace AuthModules.session */
  window.AuthModules.session = {
    persistProfile: persistProfile,
    getCachedProfile: getCachedProfile,
    hasCachedSession: hasCachedSession,
    clearCache: clearCache,
    getLastLogin: getLastLogin,
    syncWithFirebase: syncWithFirebase
  };

  console.log("[Auth] Módulo auth-session.js carregado.");

})(window);
