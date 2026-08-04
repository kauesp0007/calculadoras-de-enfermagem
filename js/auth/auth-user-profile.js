/**
 * js/auth/auth-user-profile.js
 * 
 * RESPONSABILIDADE: Gerenciamento do perfil do usuário no Firestore.
 * 
 * Este módulo gerencia a leitura e escrita dos dados do perfil
 * na coleção "users" do Firestore.
 * 
 * ESTRUTURA DO DOCUMENTO (Firestore: /users/{uid}):
 *   {
 *     uid: string,
 *     email: string,
 *     displayName: string,
 *     photoURL: string,
 *     language: string,
 *     country: string,
 *     createdAt: Timestamp,
 *     lastLoginAt: Timestamp,
 *     accountType: string,
 *     status: string,
 *     plan: string,
 *     planExpiresAt: Timestamp|null,
 *     permissions: {
 *       canAccessPremium: boolean,
 *       canDownload: boolean,
 *       canViewCertificates: boolean,
 *       canSaveFavorites: boolean,
 *       canViewHistory: boolean,
 *       role: string
 *     }
 *   }
 * 
 * USO:
 *   var profile = await AuthModules.userProfile.loadProfile(uid);
 *   await AuthModules.userProfile.updateProfile(uid, { language: "en" });
 */

(function (window) {
  "use strict";

  // ─── Constantes ────────────────────────────────────────────────
  var COLLECTION = "users";

  // ─── Funções auxiliares ────────────────────────────────────────

  /**
   * Obtém a instância do Firestore.
   * Firestore é carregado sob demanda.
   */
  async function _getFirestore() {
    // Como Firestore ainda não é crítico na Fase 1, retornamos null
    // e operamos apenas com o perfil do Firebase Auth + cache local.
    // 
    // TODO Fase 2: Implementar carregamento do Firestore SDK.
    console.warn("[Profile] Firestore não configurado na Fase 1.");
    return null;
  }

  // ─── API Pública ────────────────────────────────────────────────

  /**
   * Carrega o perfil completo do usuário.
   * 
   * Na Fase 1, retorna dados básicos do Firebase Auth + cache.
   * Na Fase 2, buscará do Firestore.
   * 
   * @param {string} uid - ID do usuário.
   * @returns {Promise<object|null>} Perfil completo ou null.
   */
  async function loadProfile(uid) {
    if (!uid) {
      return null;
    }

    // Tenta do cache local primeiro (resposta instantânea)
    var cached = window.AuthModules.session
      ? window.AuthModules.session.getCachedProfile()
      : null;

    if (cached) {
      return cached;
    }

    // Se não há cache, retorna dados básicos do Auth
    var user = window.Auth ? window.Auth.currentUser() : null;
    if (user && user.uid === uid) {
      return {
        uid: user.uid,
        email: user.email || "",
        displayName: user.displayName || "",
        photoURL: user.photoURL || "",
        plan: "free",
        status: "active",
        permissions: {
          role: "user"
        }
      };
    }

    return null;
  }

  /**
   * Atualiza campos do perfil.
   * 
   * @param {string} uid - ID do usuário.
   * @param {object} updates - Campos a atualizar.
   * @returns {Promise<void>}
   */
  async function updateProfile(uid, updates) {
    if (!uid || !updates) {
      return;
    }

    // Atualiza o cache local
    if (window.AuthModules.session) {
      var current = window.AuthModules.session.getCachedProfile() || {};
      var merged = Object.assign({}, current, updates);
      window.AuthModules.session.persistProfile(merged);
    }

    // TODO Fase 2: Persistir no Firestore
    console.log("[Profile] Perfil atualizado (cache local):", updates);
  }

  /**
   * Cria o documento do perfil no Firestore (usuário novo).
   * Chamado após primeiro login.
   * 
   * @param {object} user - Objeto Firebase User.
   * @returns {Promise<object>} Perfil criado.
   */
  async function createProfile(user) {
    if (!user) {
      return null;
    }

    var profile = {
      uid: user.uid,
      email: user.email || "",
      displayName: user.displayName || "",
      photoURL: user.photoURL || "",
      language: _detectLanguage(),
      country: _detectCountry(),
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      accountType: user.providerData && user.providerData[0]
        ? user.providerData[0].providerId
        : "email",
      status: "active",
      plan: "free",
      planExpiresAt: null,
      permissions: {
        canAccessPremium: false,
        canDownload: false,
        canViewCertificates: false,
        canSaveFavorites: true,
        canViewHistory: true,
        role: "user"
      }
    };

    // Persiste no cache local
    if (window.AuthModules.session) {
      window.AuthModules.session.persistProfile(profile);
    }

    // TODO Fase 2: Persistir no Firestore
    console.log("[Profile] Novo perfil criado:", profile.email);

    return profile;
  }

  // ─── Detecção de localização ────────────────────────────────────

  /**
   * Detecta o idioma do navegador e mapeia para os suportados.
   * @returns {string}
   */
  function _detectLanguage() {
    try {
      var lang = (navigator.language || navigator.userLanguage || "pt").toLowerCase();
      // Mapeia para idiomas suportados no site
      var supported = ["pt", "en", "es", "de", "it", "fr", "hi", "zh", "ar", "ja", "ru", "ko", "tr", "nl", "pl", "sv", "id", "vi", "uk"];
      var code = lang.split("-")[0];
      return supported.indexOf(code) !== -1 ? code : "pt";
    } catch (e) {
      return "pt";
    }
  }

  /**
   * Detecta o país pelo idioma do navegador.
   * @returns {string}
   */
  function _detectCountry() {
    try {
      var locale = navigator.language || "pt-BR";
      var parts = locale.split("-");
      return parts.length > 1 ? parts[1].toUpperCase() : "BR";
    } catch (e) {
      return "BR";
    }
  }

  // ─── Exportação ─────────────────────────────────────────────────
  window.AuthModules.userProfile = {
    loadProfile: loadProfile,
    updateProfile: updateProfile,
    createProfile: createProfile
  };

  console.log("[Auth] Módulo auth-user-profile.js carregado.");

})(window);
