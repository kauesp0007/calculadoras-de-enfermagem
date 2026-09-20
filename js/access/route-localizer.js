/**
 * js/access/route-localizer.js
 * Centraliza URLs da área de conta preservando o idioma atual.
 */
(function (window) {
  "use strict";
  var LANGS = ["en","es","fr","de","it","hi","zh","ja","ru","ko","tr","nl","pl","sv","id","vi","uk","ar"];
  function normalizeLanguage(value) {
    var raw = String(value || "pt").trim().toLowerCase();
    return raw === "pt-br" || raw === "pt_br" ? "pt" : raw;
  }
  function currentLanguage() {
    try {
      if (window.AccountI18n && window.AccountI18n.getLanguage) return normalizeLanguage(window.AccountI18n.getLanguage());
    } catch (_) {}
    var params = new URLSearchParams(window.location.search || "");
    return normalizeLanguage(params.get("lang") || window.__LANG || "pt");
  }
  function isInternational(language) { return LANGS.indexOf(normalizeLanguage(language)) !== -1; }
  function accountUrl(page, language, query) {
    var file = page || "login.html";
    var lang = normalizeLanguage(language || currentLanguage());
    var params = new URLSearchParams(query || "");
    // A área de contas usa pt-BR como identificador canônico do português.\n    // Mantemos o idioma explícito também no português para evitar que links internos\n    // dependam de estado residual de localStorage ou de __LANG.\n    params.set("lang", lang === "pt" ? "pt-BR" : lang);
    var suffix = params.toString();
    return "/conta/" + file + (suffix ? "?" + suffix : "");
  }
  window.AccountRoutes = { currentLanguage: currentLanguage, normalizeLanguage: normalizeLanguage, isInternational: isInternational, accountUrl: accountUrl };
})(window);
