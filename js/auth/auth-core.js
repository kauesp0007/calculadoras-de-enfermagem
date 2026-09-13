/**
 * js/auth/auth-core.js
 *
 * FACADE centralizada de autenticação. Acesso ao conteúdo é decidido por
 * Authorization/Access; este módulo NÃO redireciona usuários free para planos.
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

  async function init() {
    if (_initialized) return;
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
        _notifyProfileListeners(profile);
      }).catch(function (error) {
        console.warn("[Auth] Perfil indisponível; usando free:", error && error.message ? error.message : error);
        _userProfile = null;
        _currentPlan = "free";
      });
    } else {
      _currentPlan = "free";
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
    if (window.AuthModules.userProfile && window.AuthModules.userProfile.loadProfile) {
      return window.AuthModules.userProfile.loadProfile(user.uid).then(function (profile) {
        _userProfile = profile;
        _currentPlan = profile && profile.plan ? profile.plan : "free";
        _notifyProfileListeners(profile);
        return profile;
      });
    }
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
