/**
 * js/account-routing.js
 * Canonical helpers for localized account navigation.
 * Canonicaliza a navegação da área de conta.
 * Perfil, configurações, histórico e favoritos possuem cópias localizadas;
 * login, assinatura e cobrança permanecem centralizados com ?lang=xx.
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
    var localizedPages = {
      "perfil.html": "perfil.html",
      "configuracoes.html": "configuracoes.html",
      "historico.html": "historico.html",
      "favoritos.html": "favoritos.html"
    };
    Object.keys(extra || {}).forEach(function (key) {
      if (extra[key] !== undefined && extra[key] !== null && extra[key] !== "") params.set(key, extra[key]);
    });
    if (getLanguage() !== "pt" && localizedPages[file]) {
      url = "/" + encodeURIComponent(getLanguage()) + "/conta/" + localizedPages[file];
    }
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
