/*
 * Carregador central do Google AdSense.
 * Regra: visitante não autenticado e usuário free podem carregar anúncios.
 * Júnior/lifetime: anúncios não carregam.
 * Recusa explícita de publicidade: respeitada.
 */
(function (window, document) {
  "use strict";

  var CLIENT = "ca-pub-6472730056006847";
  var LOADED_ATTR = "data-calculadoras-adsense-loaded";

  function storage(key) {
    try { return localStorage.getItem(key); } catch (_) { return null; }
  }

  function isExplicitAdRefusal() {
    var consent = storage("cookieConsent");
    if (consent === "refused") return true;
    return consent === "managed" && storage("ad_storage") === "denied";
  }

  function hasPremium() {
    try {
      var auth = window.Auth;
      if (!auth || !auth.currentUser) return false;
      var user = auth.currentUser();
      if (!user) return false;

      var profile = auth.profile ? auth.profile() : null;
      if (!profile) return false;
      if (profile.lifetime === true) return true;
      if (profile.plan !== "junior") return false;
      if (!profile.planExpiresAt) return true;

      var expires = typeof profile.planExpiresAt.toDate === "function"
        ? profile.planExpiresAt.toDate()
        : new Date(profile.planExpiresAt);
      return !Number.isNaN(expires.getTime()) && expires.getTime() > Date.now();
    } catch (_) {
      return false;
    }
  }

  function alreadyLoaded() {
    return !!(
      document.querySelector("script[data-calculadoras-adsense-loaded=\"true\"]") ||
      document.querySelector("script[src*='pagead2.googlesyndication.com/pagead/js/adsbygoogle.js']") ||
      window.adsbygoogle
    );
  }

  function load() {
    if (isExplicitAdRefusal() || hasPremium() || alreadyLoaded()) return;

    var script = document.createElement("script");
    script.async = true;
    script.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=" + CLIENT;
    script.crossOrigin = "anonymous";
    script.setAttribute(LOADED_ATTR, "true");
    script.onload = function () {
      window.__adsenseLoaded = true;
    };
    document.head.appendChild(script);
  }

  function schedule() {
    load();
    window.setTimeout(load, 1500);
    window.setTimeout(load, 4000);
    window.setTimeout(load, 8000);
  }

  window.CalculadorasAdsense = {
    load: load,
    refresh: schedule
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", schedule, { once: true });
  } else {
    schedule();
  }
})(window, document);
