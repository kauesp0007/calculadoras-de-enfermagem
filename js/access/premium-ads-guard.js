/*
 * Guarda canônica de publicidade.
 * Regra: assinantes Júnior/lifetime nunca devem permitir AdSense.
 * Estado autenticado não resolvido é tratado como bloqueado.
 */
(function (window, document) {
  "use strict";

  return; // DESATIVADO: global-scripts.js é o único gestor de anúncios (multiplex + display).

  window.AccessModules = window.AccessModules || {};

  var ADS_SRC = "pagead2.googlesyndication.com/pagead/js/adsbygoogle.js";

  function accountPage() {
    return (window.location.pathname || "").indexOf("/conta/") === 0;
  }

  function premium(profile) {
    // Premium temporariamente desativado: todos tratados como free.
    return false;
  }

  function state() {
    var auth = window.Auth;
    if (!auth || typeof auth.isInitialized !== "function" || !auth.isInitialized()) {
      return { resolved: false, premium: false, authenticated: false };
    }
    var user = typeof auth.currentUser === "function" ? auth.currentUser() : null;
    if (!user) return { resolved: true, premium: false, authenticated: false };
    var profile = typeof auth.profile === "function" ? auth.profile() : null;
    if (!profile) return { resolved: false, premium: false, authenticated: true };
    return { resolved: true, premium: premium(profile), authenticated: true };
  }

  function adsAllowed() {
    var s = state();
    if (accountPage() || !s.resolved) return false;
    return !s.authenticated || !s.premium;
  }

  function removeAdSenseScripts() {
    document.querySelectorAll('script[src*="' + ADS_SRC + '"]').forEach(function (script) {
      if (script.parentNode) script.parentNode.removeChild(script);
    });
  }

  function guardExisting() {
    var s = state();
    if (accountPage() || (s.resolved && s.authenticated && s.premium)) {
      removeAdSenseScripts();
      window.__adsenseLoaded = false;
      return false;
    }
    return adsAllowed();
  }

  function installScriptCreationGuard() {
    if (window.__premiumAdsGuardInstalled) return;
    window.__premiumAdsGuardInstalled = true;
    var originalAppendChild = Node.prototype.appendChild;
    Node.prototype.appendChild = function (node) {
      try {
        if (node && node.tagName === "SCRIPT" && typeof node.src === "string" && node.src.indexOf(ADS_SRC) !== -1) {
          if (!guardExisting()) return node;
        }
      } catch (_) { }
      return originalAppendChild.call(this, node);
    };
  }

  function installMutationGuard() {
    if (window.__premiumAdsMutationGuardInstalled) return;
    window.__premiumAdsMutationGuardInstalled = true;
    if (!window.MutationObserver) return;
    var observer = new MutationObserver(function () {
      var s = state();
      if (accountPage() || (s.resolved && s.authenticated && s.premium)) {
        removeAdSenseScripts();
        window.__adsenseLoaded = false;
      }
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  function bindAuth() {
    var auth = window.Auth;
    if (!auth) return;
    var sync = function () { guardExisting(); };
    if (auth.onAuthChange) auth.onAuthChange(sync);
    if (auth.onProfileChange) auth.onProfileChange(sync);
    sync();
  }

  window.AccessModules.premiumAdsGuard = {
    isAllowed: adsAllowed,
    sync: guardExisting
  };

  guardExisting();
  installScriptCreationGuard();
  installMutationGuard();

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bindAuth, { once: true });
  } else {
    bindAuth();
  }
})(window, document);
