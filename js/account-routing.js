/**
 * js/account-routing.js
 * Autoridade canônica de roteamento da área de contas.
 *
 * A área /conta/ é única para todos os idiomas. O idioma é transportado
 * explicitamente por ?lang=xx e nunca depende apenas de estado residual.
 */
(function (window) {
  "use strict";

  var ACCOUNT_FILES = {
    "login.html": 1,
    "perfil.html": 1,
    "configuracoes.html": 1,
    "favoritos.html": 1,
    "historico.html": 1,
    "assinatura.html": 1
  };

  var LANGUAGE_ALIASES = {
    "pt": "pt", "pt-br": "pt", "pt_br": "pt",
    "en": "en", "es": "es", "fr": "fr", "de": "de", "it": "it",
    "hi": "hi", "zh": "zh", "zh-cn": "zh", "ja": "ja", "ru": "ru",
    "ko": "ko", "tr": "tr", "nl": "nl", "pl": "pl", "sv": "sv",
    "id": "id", "vi": "vi", "uk": "uk", "ar": "ar"
  };

  function normalizeLanguage(value) {
    return LANGUAGE_ALIASES[String(value || "").trim().toLowerCase()] || null;
  }

  function languageFromUrl(value) {
    if (!value) return null;
    try {
      var url = new URL(value, window.location && window.location.origin || "https://local.invalid");
      return normalizeLanguage(url.searchParams.get("lang")) ||
        normalizeLanguage(url.pathname.split("/").filter(Boolean)[0]) ||
        null;
    } catch (_) {
      return null;
    }
  }

  function getLanguage() {
    var queryLanguage = null;
    try {
      queryLanguage = normalizeLanguage(
        new URLSearchParams(window.location.search || "").get("lang")
      );
    } catch (_) {}

    if (queryLanguage) return queryLanguage;

    var returnLanguage = null;
    try {
      returnLanguage = languageFromUrl(
        new URLSearchParams(window.location.search || "").get("returnUrl")
      );
    } catch (_) {}

    if (returnLanguage) return returnLanguage;

    try {
      if (window.AccountI18n && typeof window.AccountI18n.getLanguage === "function") {
        var accountLanguage = normalizeLanguage(window.AccountI18n.getLanguage());
        if (accountLanguage) return accountLanguage;
      }
    } catch (_) {}

    return normalizeLanguage(window.__ACCOUNT_LANG) ||
      normalizeLanguage(window.__LANG) ||
      "pt";
  }

  function page(file, extra) {
    var filename = String(file || "login.html");
    if (!ACCOUNT_FILES[filename]) filename = "login.html";

    var params = new URLSearchParams();
    params.set("lang", getLanguage());

    Object.keys(extra || {}).forEach(function (key) {
      var value = extra[key];
      if (key === "lang") return;
      if (value !== undefined && value !== null && value !== "") {
        params.set(key, value);
      }
    });

    return "/conta/" + filename + "?" + params.toString();
  }

  function localizedHome(language) {
    var lang = normalizeLanguage(language || getLanguage()) || "pt";
    return lang === "pt" ? "/" : "/" + lang + "/";
  }

  function bindLinks(root) {
    if (!window.document) return;
    root = root || window.document;

    var current = getLanguage();
    var anchors = [];
    if (root && root.nodeType === 1 && String(root.tagName || "").toLowerCase() === "a" && root.hasAttribute("href")) {
      anchors.push(root);
    }
    if (root && root.querySelectorAll) {
      Array.prototype.forEach.call(root.querySelectorAll("a[href]"), function (anchor) {
        if (anchors.indexOf(anchor) === -1) anchors.push(anchor);
      });
    }

    Array.prototype.forEach.call(anchors, function (anchor) {
      var href = anchor.getAttribute("href");
      if (!href || href.indexOf("#") === 0 ||
          /^(mailto:|tel:|javascript:|data:)/i.test(href)) return;

      var url;
      try {
        url = new URL(href, window.location.origin);
      } catch (_) {
        return;
      }

      if (url.origin !== window.location.origin) return;

      var pathname = url.pathname.replace(/\/+$/, "");
      if (!pathname) pathname = "/";

      if (pathname === "/") {
        url.pathname = localizedHome(current);
        anchor.setAttribute("href", url.pathname + url.search + url.hash);
        return;
      }

      var match = pathname.match(/^\/conta\/([^/]+)$/i);
      if (!match || !ACCOUNT_FILES[match[1]]) return;

      url.searchParams.set("lang", current);
      anchor.setAttribute("href", url.pathname + "?" + url.searchParams.toString() + url.hash);
    });
  }

  function init() {
    bindLinks();
  }

  var api = {
    getLanguage: getLanguage,
    normalizeLanguage: normalizeLanguage,
    languageFromUrl: languageFromUrl,
    page: page,
    localizedHome: localizedHome,
    bindLinks: bindLinks,
    login: function (returnUrl) { return page("login.html", { returnUrl: returnUrl || "" }); },
    profile: function () { return page("perfil.html"); },
    settings: function () { return page("configuracoes.html"); },
    favorites: function () { return page("favoritos.html"); },
    history: function () { return page("historico.html"); },
    subscription: function () { return page("assinatura.html"); }
  };

  window.AccountRouting = api;

  function observeDynamicLinks() {
    if (!window.document || !window.MutationObserver || !window.document.body) return;
    if (window.__ACCOUNT_ROUTING_OBSERVER) return;
    var observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        Array.prototype.forEach.call(mutation.addedNodes || [], function (node) {
          if (!node || node.nodeType !== 1) return;
          bindLinks(node);
        });
      });
    });
    observer.observe(window.document.body, { childList: true, subtree: true });
    window.__ACCOUNT_ROUTING_OBSERVER = observer;
  }

  if (window.document) {
    if (window.document.readyState === "loading") {
      window.document.addEventListener("DOMContentLoaded", function () {
        init();
        observeDynamicLinks();
      }, { once: true });
    } else {
      init();
      observeDynamicLinks();
    }

    window.document.addEventListener("conta:languagechange", function () {
      bindLinks();
    });
  }
})(window);
