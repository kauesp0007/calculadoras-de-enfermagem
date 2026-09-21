/**
 * js/account-language-bootstrap.js
 * Bootstrap síncrono e mínimo para a área de contas.
 *
 * Define lang/dir antes dos scripts deferred e antes da pintura inicial do DOM.
 * Não carrega dependências externas e não altera a estratégia de fontes locais.
 */
(function (window, document) {
  "use strict";

  var aliases = {
    "pt": "pt-BR", "pt-br": "pt-BR", "pt_br": "pt-BR",
    "en": "en", "es": "es", "fr": "fr", "de": "de", "it": "it",
    "hi": "hi", "zh": "zh", "zh-cn": "zh", "ja": "ja", "ru": "ru",
    "ko": "ko", "tr": "tr", "nl": "nl", "pl": "pl", "sv": "sv",
    "id": "id", "vi": "vi", "uk": "uk", "ar": "ar"
  };

  function normalize(value) {
    return aliases[String(value || "").trim().toLowerCase()] || null;
  }

  function fromUrl(value) {
    if (!value) return null;
    try {
      var url = new URL(value, window.location && window.location.origin || "https://local.invalid");
      return normalize(url.searchParams.get("lang")) ||
        normalize(url.pathname.split("/").filter(Boolean)[0]);
    } catch (_) {
      return null;
    }
  }

  function detect() {
    var query = null;
    try {
      query = normalize(new URLSearchParams(window.location.search || "").get("lang"));
    } catch (_) {}

    if (query) return query;

    var returnLanguage = null;
    try {
      returnLanguage = fromUrl(new URLSearchParams(window.location.search || "").get("returnUrl"));
    } catch (_) {}

    if (returnLanguage) return returnLanguage;

    try {
      var stored = normalize(window.localStorage.getItem("conta.language"));
      if (stored) return stored;
    } catch (_) {}

    var pathLanguage = fromUrl(window.location && window.location.pathname);
    if (pathLanguage) return pathLanguage;

    return normalize(window.navigator && window.navigator.language) || "pt-BR";
  }

  var language = detect();
  document.documentElement.lang = language;
  document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
  window.__ACCOUNT_LANG = language === "pt-BR" ? "pt" : language;

  try {
    document.documentElement.setAttribute("data-account-language", window.__ACCOUNT_LANG);
  } catch (_) {}
})(window, document);
