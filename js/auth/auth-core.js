/**
 * js/auth/auth-core.js
 *
 * FACADE centralizada de autenticação. Acesso ao conteúdo é decidido por
 * Authorization/Access; este módulo NÃO redireciona usuários free para planos.
 *
 * Controle de anúncios:
 * - Enquanto o estado de autenticação/plano não foi resolvido, anúncios ficam
 *   visualmente retidos para evitar qualquer exposição prematura a assinantes.
 * - Usuário free/sem assinatura: anúncios automáticos e multiplex são liberados.
 * - Usuário junior válido: anúncios permanecem ocultos.
 * - Se o perfil de um usuário autenticado não puder ser lido, o estado fica
 *   retido (fail-closed) para nunca liberar anúncio por engano a um assinante.
 */
(function (window) {
  "use strict";

  window.AuthModules = window.AuthModules || {};

  var _initialized = false;
  var _currentUser = null;
  var _userProfile = null;
  var _currentPlan = null;
  var _listeners = [];
  var _profileListeners = [];
  var _adState = "pending";

  function _installAdGate() {
    if (document.getElementById("auth-premium-ad-gate")) return;
    var style = document.createElement("style");
    style.id = "auth-premium-ad-gate";
    style.textContent = [
      "html.auth-ad-pending ins.adsbygoogle,",
      "html.auth-ad-pending .google-auto-placed,",
      "html.auth-ad-pending .ads-multiplex-container,",
      "html.auth-ad-pending #multiplex-ad-reserved,",
      "html.auth-ad-pending .multiplex-ad-reserved,",
      "html.auth-premium-no-ads ins.adsbygoogle,",
      "html.auth-premium-no-ads .google-auto-placed,",
      "html.auth-premium-no-ads .ads-multiplex-container,",
      "html.auth-premium-no-ads #multiplex-ad-reserved,",
      "html.auth-premium-no-ads .multiplex-ad-reserved",
      "{display:none !important;height:0 !important;min-height:0 !important;margin:0 !important;padding:0 !important;overflow:hidden !important;visibility:hidden !important;}"
    ].join("");
    (document.head || document.documentElement).appendChild(style);
    document.documentElement.classList.add("auth-ad-pending");
  }

  function _clearExistingAdMarkup() {
    var selectors = [
      "ins.adsbygoogle",
      ".google-auto-placed",
      ".ads-multiplex-container",
      "#multiplex-ad-reserved",
      ".multiplex-ad-reserved"
    ];
    document.querySelectorAll(selectors.join(",")).forEach(function (el) {
      el.style.setProperty("display", "none", "important");
      el.style.setProperty("visibility", "hidden", "important");
      el.setAttribute("data-auth-ad-hidden", "true");
    });
  }

  function _setAdState(state) {
    _installAdGate();
    _adState = state;
    var root = document.documentElement;
    root.classList.remove("auth-ad-pending", "auth-premium-no-ads");

    if (state === "premium") {
      root.classList.add("auth-premium-no-ads");
      _clearExistingAdMarkup();
    } else if (state === "pending") {
      root.classList.add("auth-ad-pending");
    } else {
      document.querySelectorAll("[data-auth-ad-hidden=\"true\"]").forEach(function (el) {
        el.style.removeProperty("display");
        el.style.removeProperty("visibility");
        el.removeAttribute("data-auth-ad-hidden");
      });
    }
  }

  function _syncAdStateFromProfile(profile) {
    if (!profile) {
      return;
    }

    var isLifetime = profile.lifetime === true;
    var hasJunior = profile.plan === "junior";
    var expiresOk = true;

    if (hasJunior && profile.planExpiresAt) {
      try {
        var expires = profile.planExpiresAt instanceof Date
          ? profile.planExpiresAt
          : (typeof profile.planExpiresAt.toDate === "function"
              ? profile.planExpiresAt.toDate()
              : new Date(profile.planExpiresAt));
        expiresOk = !Number.isNaN(expires.getTime()) && expires.getTime() > Date.now();
      } catch (_) {
        expiresOk = false;
      }
    }

    _setAdState(isLifetime || (hasJunior && expiresOk) ? "premium" : "free");
  }

  async function init() {
    if (_initialized) return;
    _setAdState("pending");

    var fb = await window.FirebaseInit.init();
    var auth = fb.auth;

    await new Promise(function (resolve) {
      var done = false;
      function finish() {
        if (!done) { done = true; resolve(); }
      }
      auth.onAuthStateChanged(function (user) {
        _handleAuthState(user);
        finish();
      });
      setTimeout(finish, 5000);
    });

    auth.getRedirectResult().catch(function (error) {
      if (error && error.code !== "auth/no-redirect-result") {
        console.error("[Auth] Erro no redirect:", error.code, error.message);
      }
    });

    _initialized = true;
  }

  function _handleAuthState(user) {
    _currentUser = user || null;
    _setAdState(user ? "pending" : "free");

    if (!user) {
      _userProfile = null;
      _currentPlan = null;
      _clearLocalCache();
      _notifyListeners(null);
      return;
    }

    if (window.AuthModules.userProfile && window.AuthModules.userProfile.loadProfile) {
      window.AuthModules.userProfile.loadProfile(user.uid).then(function (profile) {
        _userProfile = profile;
        _currentPlan = profile && profile.plan ? profile.plan : "free";
        _syncAdStateFromProfile(profile || { plan: "free" });
        _notifyProfileListeners(profile);
      }).catch(function (error) {
        console.warn("[Auth] Perfil indisponível; anúncios mantidos retidos por segurança:", error && error.message ? error.message : error);
        _userProfile = null;
        _currentPlan = null;
        _setAdState("pending");
      });
    } else {
      console.warn("[Auth] Módulo de perfil indisponível; anúncios mantidos retidos por segurança.");
      _currentPlan = null;
      _setAdState("pending");
    }

    _notifyListeners(user);
  }

  function onAuthChange(callback) {
    if (typeof callback === "function") _listeners.push(callback);
  }

  function onProfileChange(callback) {
    if (typeof callback === "function") _profileListeners.push(callback);
  }

  function _notifyListeners(user) {
    _listeners.forEach(function (cb) {
      try { cb(user); } catch (e) { console.error("[Auth] Erro em listener:", e); }
    });
  }

  function _notifyProfileListeners(profile) {
    _profileListeners.forEach(function (cb) {
      try { cb(profile); } catch (e) { console.error("[Auth] Erro em listener de perfil:", e); }
    });
  }

  function isLoggedIn() {
    return !!_currentUser;
  }

  function currentUser() {
    return _currentUser;
  }

  function profile() {
    return _userProfile;
  }

  function hasPlan(planName) {
    if (!_currentPlan) return false;
    if (planName === "premium") return _currentPlan === "junior";
    return _currentPlan === planName;
  }

  function hasPermission(permission) {
    return !!(_userProfile && _userProfile.permissions && _userProfile.permissions[permission] === true);
  }

  async function signIn(providerName, options) {
    if (!_initialized) await init();
    var providerModule = window.AuthModules.providers && window.AuthModules.providers.getProvider
      ? window.AuthModules.providers.getProvider(providerName)
      : null;
    if (!providerModule) throw new Error("Provedor não disponível: " + providerName);
    return providerModule.signIn(options);
  }

  async function signOut() {
    if (!_initialized) return;
    var auth = window.FirebaseInit.getAuthSync();
    if (!auth) return;
    await auth.signOut();
    _currentUser = null;
    _userProfile = null;
    _currentPlan = null;
    _setAdState("free");
    _clearLocalCache();
  }

  function _clearLocalCache() {
    if (window.AuthModules.session && window.AuthModules.session.clearCache) {
      window.AuthModules.session.clearCache();
    }
    if (window.AuthModules.userCache && window.AuthModules.userCache.clear) {
      window.AuthModules.userCache.clear();
    }
  }

  function isInitialized() {
    return _initialized;
  }

  function refreshProfile() {
    var user = _currentUser;
    if (!user || !user.uid) return Promise.resolve(null);
    if (window.AuthModules.userCache && window.AuthModules.userCache.clear) {
      window.AuthModules.userCache.clear();
    }
    if (window.AuthorizationModules && window.AuthorizationModules.permissionCache && window.AuthorizationModules.permissionCache.invalidate) {
      window.AuthorizationModules.permissionCache.invalidate();
    }
    _setAdState("pending");
    if (window.AuthModules.userProfile && window.AuthModules.userProfile.loadProfile) {
      return window.AuthModules.userProfile.loadProfile(user.uid).then(function (profile) {
        _userProfile = profile;
        _currentPlan = profile && profile.plan ? profile.plan : "free";
        _syncAdStateFromProfile(profile || { plan: "free" });
        _notifyProfileListeners(profile);
        return profile;
      }).catch(function (error) {
        console.warn("[Auth] Falha ao atualizar perfil; anúncios mantidos retidos por segurança:", error && error.message ? error.message : error);
        _setAdState("pending");
        throw error;
      });
    }
    _setAdState("pending");
    return Promise.resolve(null);
  }

  window.Auth = {
    init: init,
    isLoggedIn: isLoggedIn,
    currentUser: currentUser,
    profile: profile,
    hasPlan: hasPlan,
    hasPermission: hasPermission,
    signIn: signIn,
    signOut: signOut,
    onAuthChange: onAuthChange,
    onProfileChange: onProfileChange,
    isInitialized: isInitialized,
    refreshProfile: refreshProfile
  };

  window.AuthModules.core = window.Auth;
  console.log("[Auth] Módulo auth-core.js carregado.");
})(window);
