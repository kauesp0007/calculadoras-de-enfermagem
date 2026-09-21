/**
 * js/access/route-localizer.js
 * Camada de compatibilidade. AccountRouting é a autoridade única.
 */
(function (window) {
  "use strict";

  var LANGS = ["en","es","fr","de","it","hi","zh","ja","ru","ko","tr","nl","pl","sv","id","vi","uk","ar"];

  function normalizeLanguage(value) {
    if (window.AccountRouting && typeof window.AccountRouting.normalizeLanguage === "function") {
      return window.AccountRouting.normalizeLanguage(value);
    }
    var raw = String(value || "").trim().toLowerCase();
    if (raw === "pt-br" || raw === "pt_br") return "pt";
    return raw || "pt";
  }

  function currentLanguage() {
    if (window.AccountRouting && typeof window.AccountRouting.getLanguage === "function") {
      return window.AccountRouting.getLanguage();
    }
    try {
      var params = new URLSearchParams(window.location.search || "");
      var explicit = normalizeLanguage(params.get("lang"));
      if (explicit) return explicit;
    } catch (_) {}
    return normalizeLanguage(window.__ACCOUNT_LANG || window.__LANG) || "pt";
  }

  function isInternational(language) {
    return LANGS.indexOf(normalizeLanguage(language)) !== -1;
  }

  function accountUrl(page, language, query) {
    var file = String(page || "login.html");
    var lang = normalizeLanguage(language || currentLanguage()) || "pt";
    var params = new URLSearchParams(query || "");
    var extra = {};
    params.forEach(function (value, key) {
      if (key !== "lang") extra[key] = value;
    });

    if (window.AccountRouting && typeof window.AccountRouting.page === "function") {
      var target = window.AccountRouting.page(file, extra);
      var targetUrl = new URL(target, window.location.origin);
      targetUrl.searchParams.set("lang", lang);
      return targetUrl.pathname + "?" + targetUrl.searchParams.toString();
    }

    params.set("lang", lang === "pt" ? "pt-BR" : lang);
    return "/conta/" + file + "?" + params.toString();
  }

  window.AccountRoutes = {
    currentLanguage: currentLanguage,
    normalizeLanguage: normalizeLanguage,
    isInternational: isInternational,
    accountUrl: accountUrl
  };
})(window);
