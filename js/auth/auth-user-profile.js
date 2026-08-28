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

  // ─── Garante que o namespace existe ───────────────────────────
  window.AuthModules = window.AuthModules || {};

  // ─── Constantes ────────────────────────────────────────────────
  var COLLECTION = "users";

  // ─── Funções auxiliares ────────────────────────────────────────

  /**
   * Emite um evento no barramento central.
   * @param {string} event
   * @param {*} payload
   */
  function _emit(event, payload) {
    if (window.AuthModules.userEvents) {
      window.AuthModules.userEvents.emit(event, payload);
    }
  }

  /**
   * Persiste o perfil no cache temporário (espelho do Firestore).
   * Também mantém o cache resumido da sessão (nome, foto, plano).
   * @param {object} profile
   */
  function _cacheProfile(profile) {
    if (window.AuthModules.userCache) {
      window.AuthModules.userCache.set(profile);
    }
    if (window.AuthModules.session) {
      window.AuthModules.session.persistProfile(profile);
    }
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

    // 1. Tenta o cache temporário primeiro (resposta instantânea)
    var cached = window.AuthModules.userCache
      ? window.AuthModules.userCache.get()
      : null;

    if (cached && cached.uid === uid) {
      _emit(window.AuthModules.userEvents.EVENTS.PROFILE_LOADED, cached);
      return cached;
    }

    // 2. Busca no Firestore (fonte oficial)
    if (window.AuthModules.firestoreUser) {
      var profile = await window.AuthModules.firestoreUser.getUserDoc(uid);

      if (profile) {
        // Usuário existente: atualiza o último acesso (não bloqueia a UI)
        _touchLastLogin(uid);
        profile = _ensureProfileShape(profile, uid);
        _cacheProfile(profile);
        _emit(window.AuthModules.userEvents.EVENTS.PROFILE_LOADED, profile);
        return profile;
      }
    }

    // 3. Usuário novo: cria o documento automaticamente
    var user = window.Auth ? window.Auth.currentUser() : null;
    if (user && user.uid === uid) {
      var created = await createProfile(user);
      _emit(window.AuthModules.userEvents.EVENTS.PROFILE_LOADED, created);
      return created;
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
      return null;
    }

    // Grava no Firestore (fonte oficial)
    if (window.AuthModules.firestoreUser) {
      await window.AuthModules.firestoreUser.updateUserDoc(uid, updates);
    }

    // Atualiza o cache local
    var cached = window.AuthModules.userCache
      ? window.AuthModules.userCache.get()
      : null;
    var merged = Object.assign({}, cached || {}, updates);
    _cacheProfile(merged);

    _emit(window.AuthModules.userEvents.EVENTS.PROFILE_UPDATED, merged);

    return merged;
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

    var serverTs = window.AuthModules.firestoreUser
      ? window.AuthModules.firestoreUser.serverTimestamp()
      : null;

    var prefs = window.AuthModules.preferences
      ? window.AuthModules.preferences.getDefaults()
      : {};

    // Usa o idioma do navegador como preferência inicial
    prefs.language = _detectLanguage();

    var profile = {
      uid: user.uid,
      email: user.email || "",
      displayName: user.displayName || "",
      photoURL: user.photoURL || "",
      provider: user.providerData && user.providerData[0]
        ? user.providerData[0].providerId
        : "email",
      language: _detectLanguage(),
      country: _detectCountry(),
      createdAt: serverTs || new Date().toISOString(),
      lastLoginAt: serverTs || new Date().toISOString(),
      role: "user",
      plan: "free",
      status: "active",
      preferences: prefs,
      permissions: {
        canAccessPremium: false,
        canDownload: false,
        canViewCertificates: false,
        canSaveFavorites: true,
        canViewHistory: true,
        role: "user"
      },
      metadata: {
        browser: _detectBrowser(),
        device: _detectDevice(),
        os: _detectOS(),
        timezone: _detectTimezone()
      }
    };

    // Cria o documento no Firestore
    if (window.AuthModules.firestoreUser) {
      await window.AuthModules.firestoreUser.createUserDoc(user.uid, profile);
    }

    // Para exibição imediata, usa data local (serverTimestamp ainda não resolveu)
    var response = Object.assign({}, profile, {
      createdAt: new Date(),
      lastLoginAt: new Date()
    });

    _cacheProfile(response);
    _emit(window.AuthModules.userEvents.EVENTS.PROFILE_UPDATED, response);

    return response;
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

  /**
   * Atualiza o último acesso no Firestore (fire-and-forget, não bloqueia a UI).
   * @param {string} uid
   */
  function _touchLastLogin(uid) {
    if (!window.AuthModules.firestoreUser) {
      return;
    }

    var serverTs = window.AuthModules.firestoreUser.serverTimestamp();
    window.AuthModules.firestoreUser
      .updateUserDoc(uid, { lastLoginAt: serverTs || new Date() })
      .catch(function (e) {
        console.warn("[Profile] Falha ao atualizar lastLoginAt:", e);
      });
  }

  /**
   * Garante que o perfil tenha a estrutura mínima esperada.
   * @param {object} profile
   * @param {string} uid
   * @returns {object}
   */
  function _ensureProfileShape(profile, uid) {
    var out = Object.assign({}, profile);
    out.uid = out.uid || uid;
    out.permissions = out.permissions || {
      canAccessPremium: false,
      canDownload: false,
      canViewCertificates: false,
      canSaveFavorites: true,
      canViewHistory: true,
      role: "user"
    };
    out.preferences = window.AuthModules.preferences
      ? window.AuthModules.preferences.normalize(out.preferences)
      : {};
    return out;
  }

  /**
   * Detecta o navegador do usuário.
   * @returns {string}
   */
  function _detectBrowser() {
    try {
      var ua = navigator.userAgent || "";
      if (ua.indexOf("Edg") !== -1) return "Edge";
      if (ua.indexOf("Chrome") !== -1) return "Chrome";
      if (ua.indexOf("Firefox") !== -1) return "Firefox";
      if (ua.indexOf("Safari") !== -1) return "Safari";
      if (ua.indexOf("Opera") !== -1 || ua.indexOf("OPR") !== -1) return "Opera";
      return "unknown";
    } catch (e) {
      return "unknown";
    }
  }

  /**
   * Detecta o tipo de dispositivo.
   * @returns {string}
   */
  function _detectDevice() {
    try {
      return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent || "")
        ? "mobile"
        : "desktop";
    } catch (e) {
      return "unknown";
    }
  }

  /**
   * Detecta o sistema operacional.
   * @returns {string}
   */
  function _detectOS() {
    try {
      var ua = navigator.userAgent || "";
      if (ua.indexOf("Windows") !== -1) return "Windows";
      if (ua.indexOf("Mac") !== -1) return "macOS";
      if (ua.indexOf("Linux") !== -1) return "Linux";
      if (ua.indexOf("Android") !== -1) return "Android";
      if (/iPhone|iPad|iPod/.test(ua)) return "iOS";
      return "unknown";
    } catch (e) {
      return "unknown";
    }
  }

  /**
   * Detecta o fuso horário do usuário.
   * @returns {string}
   */
  function _detectTimezone() {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || "unknown";
    } catch (e) {
      return "unknown";
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
