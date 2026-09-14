/**
 * js/account-routing.js
 * Canonical helpers for localized account navigation.
 * Account pages remain centralized under /conta/ and carry the language
 * explicitly as ?lang=xx; this avoids 18 duplicated account implementations.
 */
(function (window) {
  "use strict";

  function getLanguage() {
    try {
      if (window.AccountI18n && typeof window.AccountI18n.getLanguage === "function") {
        var value = String(window.AccountI18n.getLanguage() || "pt-BR").toLowerCase();
        return value === "pt-br" ? "pt" : value;
      }
    } catch (_) {}
    var param = "pt";
    try { param = new URLSearchParams(window.location.search).get("lang") || "pt"; } catch (_) {}
    return String(param).toLowerCase() === "pt-br" ? "pt" : String(param).toLowerCase();
  }

  function page(file, extra) {
    var url = "/conta/" + String(file || "login.html");
    var params = new URLSearchParams();
    params.set("lang", getLanguage());
    Object.keys(extra || {}).forEach(function (key) {
      if (extra[key] !== undefined && extra[key] !== null && extra[key] !== "") params.set(key, extra[key]);
    });
    return url + "?" + params.toString();
  }

  window.AccountRouting = {
    getLanguage: getLanguage,
    page: page,
    login: function (returnUrl) { return page("login.html", { returnUrl: returnUrl || "" }); },
    profile: function () { return page("perfil.html"); },
    settings: function () { return page("configuracoes.html"); },
    favorites: function () { return page("favoritos.html"); },
    history: function () { return page("historico.html"); },
    subscription: function () { return page("assinatura.html"); }
  };
})(window);
