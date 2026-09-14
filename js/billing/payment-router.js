/**
 * js/billing/payment-router.js
 * Roteamento canônico de pagamentos por idioma.
 * Regra absoluta: pt-BR -> Asaas; qualquer outro idioma -> Stripe.
 */
(function (window) {
  "use strict";

  var INTERNATIONAL_LANGS = [
    "en", "es", "fr", "de", "it", "hi", "zh", "ja", "ru",
    "ko", "tr", "nl", "pl", "sv", "id", "vi", "uk", "ar"
  ];

  function normalizeLanguage(value) {
    var raw = String(value || "pt").trim().toLowerCase();
    if (raw === "pt-br" || raw === "pt_br") return "pt";
    return raw;
  }

  function isBrazil(language) {
    return normalizeLanguage(language) === "pt";
  }

  function isInternational(language) {
    return INTERNATIONAL_LANGS.indexOf(normalizeLanguage(language)) !== -1;
  }

  function providerFor(language) {
    return isBrazil(language) ? "asaas" : "stripe";
  }

  function currencyFor(language) {
    var lang = normalizeLanguage(language);
    return ["fr", "es", "de", "it", "tr", "nl", "pl", "ru", "uk", "sv"].indexOf(lang) !== -1 ? "EUR" : "USD";
  }

  function accountPath(page, language) {
    var lang = normalizeLanguage(language);
    var file = page || "assinatura.html";
    return "/conta/" + file + "?lang=" + encodeURIComponent(lang);
  }

  window.PaymentRouter = {
    INTERNATIONAL_LANGS: INTERNATIONAL_LANGS.slice(),
    normalizeLanguage: normalizeLanguage,
    isBrazil: isBrazil,
    isInternational: isInternational,
    providerFor: providerFor,
    currencyFor: currencyFor,
    accountPath: accountPath
  };
})(window);
