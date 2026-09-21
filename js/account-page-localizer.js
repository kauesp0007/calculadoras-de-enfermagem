/**
 * js/account-page-localizer.js
 * Internacionalização semântica da área de contas.
 *
 * A página é identificada por sua rota e os elementos são associados a chaves
 * estáveis do AccountI18n. Não há varredura por texto em português.
 */
(function (window, document) {
  "use strict";

  var PAGE_CONFIG = {
    "login.html": {
      h1: "myAccount",
      heroText: "accountHero",
      fields: {
        "input-displayname": { label: "fullName", placeholder: "fullNamePlaceholder" },
        "input-email": { label: "email" },
        "input-password": { label: "password", placeholder: "passwordPlaceholder" }
      },
      buttons: {
        "btn-google-login": "google",
        "btn-microsoft-login": "microsoft",
        "btn-apple-login": "apple",
        }
    },
    "perfil.html": {
      h1: "profile",
      heroText: "profileHero"
    },
    "configuracoes.html": {
      h1: "settings",
      heroText: "settingsHero"
    },
    "favoritos.html": {
      h1: "favorites",
      heroText: "favoritesHero"
    },
    "historico.html": {
      h1: "history",
      heroText: "historyHero"
    },
    "assinatura.html": {
      h1: null
    }
  };

  var COMMON_SELECTOR_KEYS = [
    ["a[href='/']", "home"],
    ["a[href='/conta/perfil.html']", "profile"],
    ["a[href^='/conta/assinatura.html']", "subscription"],
    ["a[href^='/conta/configuracoes.html']", "settings"],
    ["a[href^='/conta/favoritos.html']", "favorites"],
    ["a[href^='/conta/historico.html']", "history"],
    ["a[href^='/conta/login.html']", "signIn"]
  ];

  var COMMON_TEXT_SELECTORS = {
    ".breadcrumb li span": "account",
    "#account-language-select": null
  };

  function pageName() {
    var pathname = String(window.location && window.location.pathname || "");
    var parts = pathname.split("/");
    return parts[parts.length - 1] || "login.html";
  }

  function i18n() {
    return window.AccountI18n && typeof window.AccountI18n.t === "function"
      ? window.AccountI18n
      : null;
  }

  function language() {
    var api = i18n();
    return api && typeof api.getLanguage === "function" ? api.getLanguage() : "pt-BR";
  }

  function keyExists(key) {
    var api = i18n();
    if (!api || typeof api.t !== "function") return false;
    var value = api.t(key);
    return value && value !== key;
  }

  function mark(element, key) {
    if (!element || !key || !keyExists(key)) return;
    element.setAttribute("data-conta-i18n", key);
  }

  function markPlaceholder(element, key) {
    if (!element || !key || !keyExists(key)) return;
    element.setAttribute("data-conta-i18n-placeholder", key);
  }

  function annotate(root) {
    var api = i18n();
    if (!api || !document || !document.body) return;

    var cfg = PAGE_CONFIG[pageName()] || {};
    var scope = root && root.querySelectorAll ? root : document;

    if (cfg.h1) {
      var h1 = document.querySelector("main h1");
      if (h1) mark(h1, cfg.h1);
    }

    if (cfg.heroText) {
      var h1Node = document.querySelector("main h1");
      if (h1Node) {
        var section = h1Node.closest("section");
        if (section) {
          var candidates = section.querySelectorAll("p,h2");
          for (var i = 0; i < candidates.length; i++) {
            var el = candidates[i];
            var text = (el.textContent || "").trim();
            if (text && !/^(PREMIUM|MINHA CONTA|SISTEMA DE CONTAS|PLANOS?)$/i.test(text)) {
              mark(el, cfg.heroText);
              break;
            }
          }
        }
      }
    }

    COMMON_SELECTOR_KEYS.forEach(function (pair) {
      Array.prototype.forEach.call(scope.querySelectorAll ? scope.querySelectorAll(pair[0]) : [], function (el) {
        mark(el, pair[1]);
      });
    });

    Object.keys(COMMON_TEXT_SELECTORS).forEach(function (selector) {
      var key = COMMON_TEXT_SELECTORS[selector];
      if (!key) return;
      Array.prototype.forEach.call(scope.querySelectorAll ? scope.querySelectorAll(selector) : [], function (el) {
        mark(el, key);
      });
    });

    if (cfg.fields) {
      Object.keys(cfg.fields).forEach(function (id) {
        var field = document.getElementById(id);
        var config = cfg.fields[id];
        if (!field || !config) return;

        var label = document.querySelector('label[for="' + id + '"]');
        if (label) mark(label, config.label);

        if (config.placeholder) markPlaceholder(field, config.placeholder);
      });
    }

    if (cfg.buttons) {
      Object.keys(cfg.buttons).forEach(function (id) {
        var button = document.getElementById(id);
        if (button) mark(button, cfg.buttons[id]);
      });
    }

    // Shared account controls that are stable by ID.
    [
      ["link-reset-password", "forgotPassword"],
      ["link-back-to-login", "backToLogin"],
      ["btn-save-preferences", "savePreferences"],
      ["btn-clear-history", "deleteHistory"],
      ["history-prev", "previous"],
      ["history-next", "next"],
      ["fav-search", "searchFavorites"],
      ["history-search", "searchHistory"],
      ["history-filter-category", "filterCategory"],
      ["history-filter-type", "filterType"],
      ["history-filter-language", "filterLanguage"]
    ].forEach(function (entry) {
      var el = document.getElementById(entry[0]);
      if (el) mark(el, entry[1]);
    });

    // Known profile/settings metadata labels.
    Array.prototype.forEach.call(document.querySelectorAll("dt"), function (el) {
      var value = (el.textContent || "").trim();
      var map = {
        "Nome de exibição": "displayName",
        "Nome completo": "fullName",
        "País": "country",
        "Método de login": "signInMethod",
        "Data de cadastro": "registrationDate",
        "Último acesso": "lastAccess"
      };
      if (map[value]) mark(el, map[value]);
    });

    document.documentElement.lang = language();
    document.documentElement.dir = language() === "ar" ? "rtl" : "ltr";
  }

  function translateMarked(root) {
    var api = i18n();
    if (!api || typeof api.t !== "function") return;

    root = root && root.querySelectorAll ? root : document;
    var nodes = root.querySelectorAll("[data-conta-i18n]");
    Array.prototype.forEach.call(nodes, function (el) {
      var key = el.getAttribute("data-conta-i18n");
      if (key) el.textContent = api.t(key);
    });

    var placeholders = root.querySelectorAll("[data-conta-i18n-placeholder]");
    Array.prototype.forEach.call(placeholders, function (el) {
      var key = el.getAttribute("data-conta-i18n-placeholder");
      if (key) el.setAttribute("placeholder", api.t(key));
    });
  }

  function localize() {
    annotate(document);
    translateMarked(document);
  }

  window.AccountPageI18n = {
    localize: localize,
    annotate: annotate,
    translate: translateMarked,
    currentLanguage: language
  };

  function init() {
    localize();

    if (window.MutationObserver && document.body) {
      var observer = new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
          Array.prototype.forEach.call(mutation.addedNodes, function (node) {
            if (node && node.nodeType === 1) {
              annotate(node);
              translateMarked(node);
            }
          });
        });
      });
      observer.observe(document.body, { childList: true, subtree: true });
    }

    document.addEventListener("conta:languagechange", localize);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})(window, document);
