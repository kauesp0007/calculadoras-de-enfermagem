/**
 * js/billing/payment-router.js
 * Roteamento canônico de pagamentos por idioma.
 * Regra absoluta: pt-BR -> Asaas; qualquer outro idioma suportado -> Stripe.
 * Também garante o rodapé localizado da área centralizada /conta/.
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
    var normalized = normalizeLanguage(language);
    if (normalized === "pt") return "asaas";
    if (INTERNATIONAL_LANGS.indexOf(normalized) !== -1) return "stripe";
    return null;
  }

  function currencyFor(language) {
    var lang = normalizeLanguage(language);
    if (["fr", "es", "de", "it", "tr", "nl", "pl", "ru", "uk", "sv"].indexOf(lang) !== -1) return "EUR";
    if (["en", "hi", "zh", "ja", "ar", "ko", "id", "vi"].indexOf(lang) !== -1) return "USD";
    return null;
  }

  function accountPath(page, language) {
    var lang = normalizeLanguage(language);
    var file = page || "assinatura.html";
    return "/conta/" + file + "?lang=" + encodeURIComponent(lang);
  }

  function accountLanguage() {
    var fromQuery = "";
    try { fromQuery = new URLSearchParams(window.location.search).get("lang") || ""; } catch (_) {}
    return normalizeLanguage(fromQuery || window.__LANG || "pt");
  }

  function fixLocalizedFooterLinks(container, lang) {
    if (!container || !container.querySelectorAll) return;
    var prefix = lang === "pt" ? "/" : "/" + lang + "/";
    container.querySelectorAll("a[href]").forEach(function (a) {
      var href = a.getAttribute("href") || "";
      if (!href || href.charAt(0) === "#" || href.charAt(0) === "/" || href.indexOf(":") !== -1) return;
      a.setAttribute("href", prefix + href.replace(/^\.\//, ""));
    });
  }

  function ensureAccountFooter() {
    if (!window.location.pathname.startsWith("/conta/")) return;
    var placeholder = document.getElementById("footer-placeholder");
    if (!placeholder || placeholder.querySelector("footer")) return;

    var lang = accountLanguage();
    var localizedUrl = lang === "pt" ? "/footer.html" : "/" + lang + "/footer.html";

    fetch(localizedUrl)
      .then(function (response) {
        if (!response.ok) throw new Error("localized_footer_unavailable");
        return response.text();
      })
      .then(function (html) {
        if (placeholder.querySelector("footer")) return;
        placeholder.innerHTML = html;
        fixLocalizedFooterLinks(placeholder, lang);
        placeholder.setAttribute("data-account-footer-loaded", "true");
      })
      .catch(function () {
        if (lang === "pt" || placeholder.querySelector("footer")) return;
        return fetch("/footer.html")
          .then(function (response) {
            if (!response.ok) throw new Error("root_footer_unavailable");
            return response.text();
          })
          .then(function (html) {
            if (placeholder.querySelector("footer")) return;
            placeholder.innerHTML = html;
            fixLocalizedFooterLinks(placeholder, "pt");
            placeholder.setAttribute("data-account-footer-loaded", "true");
          });
      })
      .catch(function (error) {
        console.warn("[PaymentRouter] Rodapé da área de conta não carregado:", error);
      });
  }

  window.PaymentRouter = {
    INTERNATIONAL_LANGS: INTERNATIONAL_LANGS.slice(),
    normalizeLanguage: normalizeLanguage,
    isBrazil: isBrazil,
    isInternational: isInternational,
    providerFor: providerFor,
    currencyFor: currencyFor,
    accountPath: accountPath,
    ensureAccountFooter: ensureAccountFooter
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", ensureAccountFooter);
  } else {
    ensureAccountFooter();
  }
})(window);
