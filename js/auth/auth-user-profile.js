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
 */
(function (window) {
  "use strict";
  window.AuthModules = window.AuthModules || {};

  function _emit(event, payload) {
    if (window.AuthModules.userEvents) window.AuthModules.userEvents.emit(event, payload);
  }

  function _cacheProfile(profile) {
    if (window.AuthModules.userCache) window.AuthModules.userCache.set(profile);
    if (window.AuthModules.session) window.AuthModules.session.persistProfile(profile);
  }

  async function loadProfile(uid) {
    if (!uid) return null;

    var cached = window.AuthModules.userCache ? window.AuthModules.userCache.get() : null;
    if (cached && cached.uid === uid) {
      _emit(window.AuthModules.userEvents.EVENTS.PROFILE_LOADED, cached);
      return cached;
    }

    if (window.AuthModules.firestoreUser) {
      var profile = await window.AuthModules.firestoreUser.getUserDoc(uid);
      if (profile) {
        _touchLastLogin(uid);
        profile = _ensureProfileShape(profile, uid);
        _cacheProfile(profile);
        _emit(window.AuthModules.userEvents.EVENTS.PROFILE_LOADED, profile);
        return profile;
      }
    }

    var user = window.Auth ? window.Auth.currentUser() : null;
    if (user && user.uid === uid) {
      var created = await createProfile(user);
      _emit(window.AuthModules.userEvents.EVENTS.PROFILE_LOADED, created);
      return created;
    }

    return null;
  }

  async function updateProfile(uid, updates) {
    if (!uid || !updates) return null;
    if (window.AuthModules.firestoreUser) await window.AuthModules.firestoreUser.updateUserDoc(uid, updates);
    var cached = window.AuthModules.userCache ? window.AuthModules.userCache.get() : null;
    var merged = Object.assign({}, cached || {}, updates);
    _cacheProfile(merged);
    _emit(window.AuthModules.userEvents.EVENTS.PROFILE_UPDATED, merged);
    return merged;
  }

  async function createProfile(user) {
    if (!user) return null;

    var serverTs = window.AuthModules.firestoreUser ? window.AuthModules.firestoreUser.serverTimestamp() : null;
    var prefs = window.AuthModules.preferences ? window.AuthModules.preferences.getDefaults() : {};
    prefs.language = _detectLanguage();

    var profile = {
      uid: user.uid,
      email: user.email || "",
      displayName: user.displayName || "",
      photoURL: user.photoURL || "",
      provider: user.providerData && user.providerData[0] ? user.providerData[0].providerId : "email",
      language: _detectLanguage(),
      country: _detectCountry(),
      createdAt: serverTs || new Date().toISOString(),
      lastLoginAt: serverTs || new Date().toISOString(),
      role: "user",
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

    // Usa o documento efetivamente persistido. Se outra execução acabou de criar
    // ou atualizar o perfil, seus dados (inclusive assinatura) prevalecem.
    var persisted = profile;
    if (window.AuthModules.firestoreUser) {
      persisted = await window.AuthModules.firestoreUser.createUserDoc(user.uid, profile) || profile;
    }

    var effective = _ensureProfileShape(persisted, user.uid);
    var response = Object.assign({}, effective, {
      createdAt: effective.createdAt instanceof Date ? effective.createdAt : new Date(),
      lastLoginAt: effective.lastLoginAt instanceof Date ? effective.lastLoginAt : new Date()
    });

    _cacheProfile(response);
    _emit(window.AuthModules.userEvents.EVENTS.PROFILE_UPDATED, response);
    return response;
  }

  function _detectLanguage() {
    try {
      if (window.AccountI18n) {
        var selected = window.AccountI18n.getLanguage();
        return selected === "pt-BR" ? "pt" : selected;
      }
      var lang = (navigator.language || navigator.userLanguage || "pt").toLowerCase();
      var supported = ["pt", "en", "es", "de", "it", "fr", "hi", "zh", "ar", "ja", "ru", "ko", "tr", "nl", "pl", "sv", "id", "vi", "uk"];
      var code = lang.split("-")[0];
      return supported.indexOf(code) !== -1 ? code : "pt";
    } catch (e) { return "pt"; }
  }

  function _detectCountry() {
    try {
      if (window.AccountI18n) {
        var countries = { "pt-BR":"BR", en:"US", es:"ES", de:"DE", it:"IT", fr:"FR", hi:"IN", zh:"CN", ar:"SA", ja:"JP", ru:"RU", ko:"KR", tr:"TR", nl:"NL", pl:"PL", sv:"SE", id:"ID", vi:"VN", uk:"UA" };
        return countries[window.AccountI18n.getLanguage()] || "BR";
      }
      var locale = navigator.language || "pt-BR";
      var parts = locale.split("-");
      return parts.length > 1 ? parts[1].toUpperCase() : "BR";
    } catch (e) { return "BR"; }
  }

  function _touchLastLogin(uid) {
    if (!window.AuthModules.firestoreUser) return;
    var serverTs = window.AuthModules.firestoreUser.serverTimestamp();
    window.AuthModules.firestoreUser.updateUserDoc(uid, { lastLoginAt: serverTs || new Date() }).catch(function (e) {
      console.warn("[Profile] Falha ao atualizar lastLoginAt:", e);
    });
  }

  function _ensureProfileShape(profile, uid) {
    var out = Object.assign({}, profile || {});
    out.uid = out.uid || uid;
    // O plano comercial não pertence ao perfil Firestore. A autoridade é
    // billing-access/Supabase e auth-core aplica o entitlement após o billing.
    // Permissões comerciais não devem ser herdadas de um cache de perfil.
    // O objeto permanece apenas como fallback estrutural para compatibilidade.
    out.permissions = out.permissions || {
      canAccessPremium: false,
      canDownload: false,
      canViewCertificates: false,
      canSaveFavorites: true,
      canViewHistory: true,
      role: "user"
    };
    out.preferences = window.AuthModules.preferences ? window.AuthModules.preferences.normalize(out.preferences) : {};
    return out;
  }

  function _detectBrowser() {
    try { var ua = navigator.userAgent || ""; if (ua.indexOf("Edg") !== -1) return "Edge"; if (ua.indexOf("Chrome") !== -1) return "Chrome"; if (ua.indexOf("Firefox") !== -1) return "Firefox"; if (ua.indexOf("Safari") !== -1) return "Safari"; if (ua.indexOf("Opera") !== -1 || ua.indexOf("OPR") !== -1) return "Opera"; return "unknown"; } catch (e) { return "unknown"; }
  }
  function _detectDevice() { try { return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent || "") ? "mobile" : "desktop"; } catch (e) { return "unknown"; } }
  function _detectOS() { try { var ua = navigator.userAgent || ""; if (ua.indexOf("Windows") !== -1) return "Windows"; if (ua.indexOf("Mac") !== -1) return "macOS"; if (ua.indexOf("Linux") !== -1) return "Linux"; if (ua.indexOf("Android") !== -1) return "Android"; if (/iPhone|iPad|iPod/.test(ua)) return "iOS"; return "unknown"; } catch (e) { return "unknown"; } }
  function _detectTimezone() { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || "unknown"; } catch (e) { return "unknown"; } }

  window.AuthModules.userProfile = { loadProfile: loadProfile, updateProfile: updateProfile, createProfile: createProfile };
  console.log("[Auth] Módulo auth-user-profile.js carregado.");
})(window);