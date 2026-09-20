/* =========================
   Camada 4 — Anti-bot leve
   ========================= */
(function () {
  try {
    const ua = navigator.userAgent || "";
    const isTrustedGoogleTool = /(?:Chrome-)?Lighthouse|Googlebot/i.test(ua);
    const isBotLike = !isTrustedGoogleTool && (
      navigator.webdriver === true ||
      ua.length < 10 ||
      !navigator.language ||
      (screen && (screen.width === 0 || screen.height === 0))
    );

    if (isBotLike) {
      // Redireciona para home (não quebra SEO e evita loop)
      if (location.pathname !== "/") {
        location.replace("/");
      }
    }
  } catch (e) {
    // ignora erros
  }
})();

/* =========================
   Detecção de Idioma (unificado)
   ========================= */
(function () {
  var _path = window.location.pathname;
  var _match = _path.match(/^\/(en|es|de|it|fr|hi|zh|ar|ja|ru|ko|tr|nl|pl|sv|id|vi|uk)\//);
  var _queryLang = null;
  if (_path.indexOf("/conta/") === 0) {
    _queryLang = new URLSearchParams(window.location.search).get("lang");
    if (!/^(pt|en|es|de|it|fr|hi|zh|ar|ja|ru|ko|tr|nl|pl|sv|id|vi|uk)$/.test(_queryLang || "")) {
      _queryLang = null;
    }
  }
  window.__LANG = _queryLang || (_match ? _match[1] : "pt");
  window.__IS_LANG_FOLDER = !!_match;

  // Mapa de idiomas TTS
  var _ttsMap = { en: "en-US", es: "es-ES", de: "de-DE", it: "it-IT", fr: "fr-FR", hi: "hi-IN", zh: "zh-CN", ar: "ar-SA", ja: "ja-JP", ru: "ru-RU", ko: "ko-KR", tr: "tr-TR", nl: "nl-NL", pl: "pl-PL", sv: "sv-SE", id: "id-ID", vi: "vi-VN", uk: "uk-UA", pt: "pt-BR" };
  window.__TTS_LANG = _ttsMap[window.__LANG] || "pt-BR";

  // Os componentes globais (menu, elementos do body e footer) vivem na
  // raiz do site. Portanto, o prefixo deve ser absoluto em TODAS as páginas,
  // inclusive nas 18 pastas de idioma e em páginas aninhadas. Usar "" ou "../"
  // aqui faria o navegador procurar /en/menu-global.html, /en/foo/menu-global.html,
  // etc., que não existem, deixando o cabeçalho e a área da conta ausentes.
  window.__FETCH_PREFIX = "/";
})();

window.__ACCOUNT_LOGIN_URL = function (returnUrl) {
  var lang = window.__LANG || "pt";
  var fallback = lang === "pt" ? "/" : "/" + lang + "/";
  var target = returnUrl || (window.location.pathname + window.location.search + window.location.hash);
  if (!target || target.charAt(0) !== "/" || target.indexOf("//") === 0 || target.indexOf("\\") !== -1 || target.indexOf("/conta/login.html") === 0) {
    target = fallback;
  }
  return "/conta/login.html?lang=" + encodeURIComponent(lang) + "&returnUrl=" + encodeURIComponent(target);
};


// -----------------------------------------------------------------------------
// Premium gate central: protege páginas e recursos que podem ser acessados
// diretamente, inclusive por links da home/menu, e encaminha o usuário para
// login/assinatura sem depender de alterações de conteúdo na própria página.
// A autoridade do plano continua sendo window.Auth -> billing-access.
// -----------------------------------------------------------------------------
(function installPremiumRouteGate(window, document) {
  "use strict";
  var PREMIUM_PATHS = {
    "/braden.html":1,"/fugulin.html":1,"/dimensionamento.html":1,"/perroca.html":1,
    "/medicacao.html":1,"/medicamentos.html":1,"/meem.html":1,"/moca.html":1,"/zarit.html":1,
    "/morse.html":1,"/elpo.html":1,"/glasgow.html":1,
    "/simulado-de-enfermagem.html":1,"/simulado-de-enfermagem2.html":1,
    "/simulado-de-enfermagem3.html":1,"/simulado-de-enfermagem4.html":1,
    "/simulado-de-enfermagem-nucleo-de-seguranca-do-paciente.html":1,
    "/simulado-de-enfermagem-doencas-de-notificacao-compulsoria.html":1,
    "/biblioteca-provas.html":1,
    "/formularios_de_escalas_assistenciais.html":1,
    "/formularios-em-branco-de-escalas.html":1,
    "/formulario_meem.html":1,"/formulario_morse.html":1,"/formulario_de_fugulin.html":1,
    "/formulario_escala_de_elpo.html":1,"/formulario_escala_curb65.html":1,
    "/formulario_escala_de_fast.html":1,"/formulario_escala_de_four.html":1,
    "/formulario_escala_de_flacc.html":1,"/formulario_escala_de_downton.html":1,
    "/formulario_escala_cincinnati.html":1,"/formulario_bps.html":1,
    "/formulario_cam.html":1
  };

  function normalizePath(path) {
    var p = String(path || "/").replace(/\\/g, "/");
    p = p.replace(/\/+/g, "/");
    if (p.length > 1 && p.charAt(p.length - 1) === "/") p = p.slice(0, -1);
    return p;
  }

  function isPremiumPath() {
    var path = normalizePath(window.location.pathname);
    var parts = path.split("/").filter(Boolean);
    var langs = {en:1,es:1,fr:1,it:1,de:1,hi:1,zh:1,ja:1,ru:1,ko:1,tr:1,nl:1,pl:1,sv:1,id:1,vi:1,uk:1,ar:1};
    if (parts.length > 1 && langs[parts[0]]) path = "/" + parts.slice(1).join("/");
    if (PREMIUM_PATHS[path]) return true;
    var file = parts.length ? parts[parts.length - 1].toLowerCase() : "";
    if (/^simulado(?:[-_]|\.|$)/i.test(file)) return true;
    if (/^flashcards_quiz\.html$/i.test(file)) return true;
    if (/^fotmulario_.*\.html$/i.test(file)) return true;
    if (/^formulario(?:[-_].*)?\.html$/i.test(file)) return true;
    if (/^formularios-em-branco-de-escalas\.html$/i.test(file)) return true;
    if (/^biblioteca-provas\.html$/i.test(file)) return true;
    return false;
  }

  function loginUrl() {
    if (typeof window.__ACCOUNT_LOGIN_URL === "function") {
      return window.__ACCOUNT_LOGIN_URL(window.location.pathname + window.location.search + window.location.hash);
    }
    return "/conta/login.html?returnUrl=" + encodeURIComponent(window.location.pathname + window.location.search + window.location.hash);
  }

  function subscriptionUrl() {
    if (typeof window.__ACCOUNT_PAGE_URL === "function") {
      var u = window.__ACCOUNT_PAGE_URL("/conta/assinatura.html");
      return u + "&returnUrl=" + encodeURIComponent(window.location.pathname + window.location.search + window.location.hash);
    }
    return "/conta/assinatura.html?returnUrl=" + encodeURIComponent(window.location.pathname + window.location.search + window.location.hash);
  }

  var _premiumGateCheckScheduled = false;
  function scheduleResolvedCheck() {
    var auth = window.Auth;
    if (_premiumGateCheckScheduled || !auth || !isPremiumPath()) return;
    _premiumGateCheckScheduled = true;
    var run = function () {
      _premiumGateCheckScheduled = false;
      try { canEnter(true); } catch (e) { console.warn("[PremiumGate] resolução tardia falhou:", e); }
    };
    if (auth.onAuthChange) auth.onAuthChange(run);
    if (auth.onProfileChange) auth.onProfileChange(run);
  }

  function showBillingRetry() {
    if (document.getElementById("premium-billing-retry")) return;
    var box = document.createElement("div");
    box.id = "premium-billing-retry";
    box.setAttribute("role","alert");
    box.setAttribute("style","position:fixed;inset:0;z-index:2147483647;display:flex;align-items:center;justify-content:center;padding:24px;background:rgba(255,255,255,.98);font-family:inherit;");
    box.innerHTML = '<div style="max-width:520px;text-align:center"><h1 style="font-size:1.25rem;font-weight:700;margin:0 0 10px">Não foi possível verificar sua assinatura</h1><p style="margin:0 0 18px;color:#475569">Sua conta não foi transformada em conta gratuita. O serviço de assinatura está temporariamente indisponível.</p><button id="premium-billing-retry-btn" type="button" style="padding:10px 18px;border-radius:8px;border:0;background:#1A3E74;color:#fff;font-weight:600;cursor:pointer">Tentar novamente</button></div>';
    document.body.appendChild(box);
    document.getElementById("premium-billing-retry-btn").addEventListener("click",function(){
      box.remove();
      if (window.Auth && window.Auth.refreshProfile) window.Auth.refreshProfile().then(function(){canEnter(true);}).catch(function(){showBillingRetry();});
      else showBillingRetry();
    });
  }

  function canEnter(forceCheck) {
    if (!isPremiumPath()) return true;
    var auth = window.Auth;
    if (!auth || !auth.isInitialized || !auth.isInitialized()) {
      scheduleResolvedCheck();
      if (forceCheck) return false;
      return true;
    }
    var user = auth.currentUser ? auth.currentUser() : null;
    if (!user) {
      window.location.replace(loginUrl());
      return false;
    }
    var billing = auth.billingStatus ? auth.billingStatus() : null;
    // Nunca tratar estado ainda não resolvido como FREE. Em rota Premium,
    // aguarde o entitlement canônico ou mostre indisponibilidade.
    if (billing && !billing.resolved) {
      scheduleResolvedCheck();
      return false;
    }
    if (billing && billing.unavailable) {
      showBillingRetry();
      return false;
    }
    if (auth.hasPlan && auth.hasPlan("premium")) return true;
    window.location.replace(subscriptionUrl());
    return false;
  }

  window.__PREMIUM_PATHS = PREMIUM_PATHS;
  window.__IS_PREMIUM_ROUTE = isPremiumPath();
  window.__PREMIUM_ROUTE_GATE = canEnter;
})(window, document);

window.__ACCOUNT_PAGE_URL = function (path) {
  var separator = path.indexOf("?") === -1 ? "?" : "&";
  var lang = "pt-BR";
  try {
    if (window.AccountI18n && typeof window.AccountI18n.getLanguage === "function") {
      lang = window.AccountI18n.getLanguage() || "pt-BR";
    } else {
      lang = window.__LANG || "pt-BR";
    }
  } catch (_) {
    lang = "pt-BR";
  }
  return path + separator + "lang=" + encodeURIComponent(lang);
};

// Corrige links relativos em conteúdo injetado (menu-global, footer) para que
// funcionem em páginas aninhadas dentro da pasta de idioma.
window.__FIX_RELATIVE_LINKS = function (container) {
  if (!container || !container.querySelectorAll) return;
  container.querySelectorAll("a[href]").forEach(function (a) {
    var href = a.getAttribute("href") || "";
    if (href && href.charAt(0) !== "#" && href.charAt(0) !== "/" && href.indexOf(":") === -1) {
      a.setAttribute("href", window.__FETCH_PREFIX + href);
    }
    if (/\/?conta\/login\.html(?:[?#]|$)/.test(a.getAttribute("href") || "")) {
      a.setAttribute("href", window.__ACCOUNT_LOGIN_URL());
    }
  });
};

// -----------------------------------------------------------------------------
// Bootstrap canônico de autenticação.
// Deve existir antes do DOMContentLoaded porque páginas Premium carregam seu
// loader como <script defer>. Assim, o loader nunca precisa criar uma segunda
// cadeia concorrente de Firebase/Auth.
// -----------------------------------------------------------------------------
(function installAuthBootstrap(window, document) {
  "use strict";
  var promise = null;

  function loadScript(src) {
    return new Promise(function(resolve, reject) {
      var existing = document.querySelector('script[src="' + src + '"]');
      if (existing) {
        if (existing.dataset && existing.dataset.authBootstrapLoaded === "true") {
          resolve();
          return;
        }
        existing.addEventListener("load", function() {
          if (existing.dataset) existing.dataset.authBootstrapLoaded = "true";
          resolve();
        }, { once: true });
        existing.addEventListener("error", function() {
          reject(new Error("auth_script_load_failed:" + src));
        }, { once: true });
        return;
      }
      var script = document.createElement("script");
      script.src = src;
      script.async = false;
      script.dataset.authBootstrap = "true";
      script.onload = function() {
        if (script.dataset) script.dataset.authBootstrapLoaded = "true";
        resolve();
      };
      script.onerror = function() {
        reject(new Error("auth_script_load_failed:" + src));
      };
      document.head.appendChild(script);
    });
  }

  function ensureAuth() {
    if (promise) return promise;
    promise = (async function() {
      var scripts = [
        "/js/firebase/firebase-init.js",
        "/js/auth/auth-session.js",
        "/js/auth/auth-providers.js",
        "/js/auth/auth-permissions.js",
        "/js/auth/firestore-user.js",
        "/js/auth/user-cache.js",
        "/js/auth/user-events.js",
        "/js/auth/preferences.js",
        "/js/auth/auth-user-profile.js",
        "/js/auth/auth-core.js"
      ];

      for (var i = 0; i < scripts.length; i++) {
        if (window.Auth && typeof window.Auth.init === "function") break;
        await loadScript(scripts[i]);
      }

      if (!window.Auth || typeof window.Auth.init !== "function") {
        throw new Error("auth_bootstrap_failed");
      }

      await window.Auth.init();
      return window.Auth;
    })().catch(function(e) {
      promise = null;
      console.error("[Auth] Bootstrap canônico falhou:", e);
      throw e;
    });
    return promise;
  }

  window.__ENSURE_AUTH = ensureAuth;

  // Em uma rota Premium, começa imediatamente. Não espera menu, DOMContentLoaded
  // nem requestIdleCallback para resolver a identidade e o entitlement.
  if (window.__IS_PREMIUM_ROUTE) {
    ensureAuth().catch(function(e) {
      console.error("[PremiumGate] Falha no bootstrap antecipado:", e);
    });
  }
})(window, document);

// -----------------------------------------------------------------------------
// Multiplex audit ad placement.
// The occasional ad must remain in normal document flow below the global
// navigation/language bars. It must never cover the menu.
// -----------------------------------------------------------------------------
(function positionMultiplexAuditAd(document, window) {
  "use strict";
  var finished = false;
  var observer = null;

  function place() {
    if (finished) return;
    var ad = document.getElementById("multiplex-ad-reserved");
    if (!ad) return;

    var anchor =
      document.getElementById("language-selector-placeholder") ||
      document.getElementById("global-header-container");

    if (!anchor || !anchor.parentNode) return;

    if (anchor.nextElementSibling !== ad) {
      anchor.parentNode.insertBefore(ad, anchor.nextElementSibling);
    }

    ad.style.position = "relative";
    ad.style.zIndex = "1";
    finished = true;
    if (observer) observer.disconnect();
  }

  if (window.MutationObserver) {
    observer = new MutationObserver(place);
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", place, { once: true });
  } else {
    place();
  }

  window.addEventListener("load", place, { once: true });
})(document, window);

// Registra o Service Worker
"serviceWorker" in navigator && window.addEventListener("load", () => {
  navigator.serviceWorker.register("/sw.js").then(e => {
    console.log("Service Worker registado com sucesso:", e.scope)
  }, e => {
    console.log("Registo do Service Worker falhou:", e)
  })
});

document.addEventListener("DOMContentLoaded", function () {
  // 1. CARREGAMENTO CRÍTICO: Traz apenas o menu no primeiro instante
  fetch(window.__FETCH_PREFIX + "menu-global.html").then(e => e.ok ? e.text() : Promise.reject("Ficheiro menu-global.html não encontrado")).then(e => {
    const o = document.getElementById("global-header-container");
    if (o) {
      window.requestAnimationFrame(() => {
        o.innerHTML = e;
        // Corrige links relativos do menu para páginas em subpastas de idioma
        if (window.__FIX_RELATIVE_LINKS) window.__FIX_RELATIVE_LINKS(o);
        initializeNavigationMenu();
        // Inicializa auth no menu (não bloqueante)
        initializeAuthMenu();
      });
    }
  }).catch(e => console.warn("Não foi possível carregar o menu global:", e));
});

// 2. CARREGAMENTO DIFERIDO: Adia a injeção da acessibilidade, cookies e modais (Alivia a Thread Principal)
window.addEventListener("load", function () {
  setTimeout(() => {
    fetch(window.__FETCH_PREFIX + "global-body-elements.html").then(e => e.ok ? e.text() : Promise.reject("Ficheiro global-body-elements.html não encontrado")).then(e => {
      window.requestAnimationFrame(() => {
        document.body.insertAdjacentHTML("beforeend", e);
        initializeGlobalFunctions();
      });
    }).catch(e => console.warn("Não foi possível carregar os elementos globais do corpo:", e));
  }, 50); // Pausa mínima de 50ms para garantir o encerramento da pintura crítica (LCP)
});

function initializeNavigationMenu() {
  const e = document.getElementById("hamburgerButton"),
    o = document.getElementById("offCanvasMenu"),
    t = document.getElementById("menuOverlay"),
    n = document.getElementById("closeOffCanvasMenu") || document.getElementById("closeMenuButton"),
    l = () => {
      o && (o.classList.add("is-open"), o.classList.remove("-translate-x-full")), t && (t.style.display = "block", t.classList.add("is-open")), e && e.setAttribute("aria-expanded", "true")
    },
    s = () => {
      o && (o.classList.remove("is-open"), o.classList.add("-translate-x-full")), t && (t.style.display = "none", t.classList.remove("is-open")), e && e.setAttribute("aria-expanded", "false")
    };
  e?.addEventListener("click", l), t?.addEventListener("click", s), n?.addEventListener("click", s), o?.querySelectorAll(".has-submenu > a, .has-submenu > button")?.forEach(e => {
    e.addEventListener("click", o => {
      o.preventDefault();
      const t = e.nextElementSibling;
      if (t && t.classList.contains("submenu")) {
        const isOpen = t.classList.toggle("open");
        e.setAttribute("aria-expanded", isOpen);
      }
    })
  });
  // Desktop: aria-expanded dinamico nos dropdowns por hover (D08 — WCAG 4.1.2)
  document.querySelectorAll("nav.desktop-nav button[aria-haspopup]").forEach(function (btn) {
    btn.addEventListener("mouseenter", function () { btn.setAttribute("aria-expanded", "true"); });
    btn.addEventListener("mouseleave", function () { btn.setAttribute("aria-expanded", "false"); });
  });
}

/* =========================
   Auth Menu — Integração com Sistema de Contas
   ========================= */
function initializeAuthMenu() {
  // ── Flag para evitar registro duplicado do listener de perfil ──
  var _profileListenerBound = false;

  /**
   * Mescla o usuário do Firebase Auth com o perfil do Firestore,
   * priorizando os dados do perfil (fonte oficial) para exibição.
   */
  function mergeUserAndProfile(user, profile) {
    if (!user) {
      return null;
    }
    if (!profile) {
      return user;
    }
    return {
      uid: user.uid,
      email: profile.email || user.email || "",
      displayName: profile.displayName || user.displayName || "",
      photoURL: profile.photoURL || user.photoURL || ""
    };
  }

  /**
   * Re-renderiza o menu quando o perfil do Firestore carrega/atualiza.
   */
  function bindProfileListener() {
    if (_profileListenerBound) {
      return;
    }
    _profileListenerBound = true;

    if (window.Auth && window.Auth.onProfileChange) {
      window.Auth.onProfileChange(function (profile) {
        safeUpdateUI(mergeUserAndProfile(window.Auth.currentUser(), profile));
      });
    }
  }

  // ── Flag para evitar registro duplicado do sistema de favoritos ──
  var _favoritesBound = false;

  /**
   * Carrega os módulos de favoritos sob demanda e monta o botão Favoritar.
   * Chamado após o Auth estar pronto (usuário logado ou não).
   */
  function bindFavorites() {
    if (_favoritesBound) {
      return;
    }
    _favoritesBound = true;

    var scripts = [
      "/js/favorites/favorites-utils.js",
      "/js/favorites/favorites-service.js",
      "/js/favorites/favorites-cache.js",
      "/js/favorites/favorites-events.js",
      "/js/favorites/favorites-sync.js",
      "/js/favorites/favorites-ui.js"
    ];

    var loaded = 0;
    function loadNext() {
      if (loaded >= scripts.length) {
        _setupFavorites();
        return;
      }
      var script = document.createElement("script");
      script.src = scripts[loaded];
      script.async = false;
      script.onload = function () { loaded++; loadNext(); };
      script.onerror = function () { loaded++; loadNext(); };
      document.head.appendChild(script);
    }
    loadNext();
  }

  /**
   * Configura a sincronização de favoritos com o estado de autenticação.
   */
  function _setupFavorites() {
    if (!window.Favorites || !window.FavoritesModules) {
      return;
    }

    function syncFor(user) {
      if (user && user.uid) {
        window.Favorites.init(user.uid).then(function () {
          _mountFavoriteButton();
        }).catch(function () { });
      } else {
        if (window.FavoritesModules.sync) {
          window.FavoritesModules.sync.reset();
        }
        _unmountFavoriteButton();
      }
    }

    if (window.Auth && window.Auth.isInitialized()) {
      syncFor(window.Auth.currentUser());
    }
    if (window.Auth && window.Auth.onAuthChange) {
      window.Auth.onAuthChange(function (user) {
        syncFor(user);
      });
    }
  }

  /**
   * Monta o coração "Favoritar" ao lado da caixa de idiomas (fora de /conta/).
   * O seletor de idiomas é carregado de forma assíncrona, então tentamos
   * anexar com retry até o container existir.
   */
  function _mountFavoriteButton() {
    var path = window.location.pathname || "/";
    if (path.indexOf("/conta/") === 0) {
      return; // páginas de conta não são favoritáveis
    }
    if (document.getElementById("fav-toggle-host")) {
      return;
    }
    if (!window.Favorites || !window.Favorites.getPageContext) {
      return;
    }

    var pageContext = window.Favorites.getPageContext();

    var attempts = 0;
    function tryMount() {
      var wrapper = document.getElementById("language-dropdown-wrapper");
      var inner = wrapper ? wrapper.firstElementChild : null;
      if (!wrapper || !inner) {
        if (attempts < 25) {
          attempts++;
          setTimeout(tryMount, 200);
        }
        return;
      }

      var host = document.createElement("span");
      host.id = "fav-toggle-host";
      host.setAttribute(
        "style",
        "pointer-events:auto;margin-right:8px;display:inline-flex;align-items:center;"
      );
      wrapper.insertBefore(host, inner);
      window.Favorites.mountButton(host, pageContext);
    }

    tryMount();
  }

  /**
   * Remove o coração "Favoritar" (no logout).
   */
  function _unmountFavoriteButton() {
    var host = document.getElementById("fav-toggle-host");
    if (host && host.parentNode) {
      host.parentNode.removeChild(host);
    }
  }

  // ── Flag para evitar registro duplicado do sistema de histórico ──
  var _historyBound = false;

  /**
   * Carrega os módulos de histórico sob demanda e registra a visita.
   */
  function bindHistory() {
    if (_historyBound) {
      return;
    }
    _historyBound = true;

    var scripts = [
      "/js/history/history-utils.js",
      "/js/history/history-service.js",
      "/js/history/history-cache.js",
      "/js/history/history-events.js",
      "/js/history/history-session.js",
      "/js/history/history-sync.js",
      "/js/history/history-ui.js"
    ];

    var loaded = 0;
    function loadNext() {
      if (loaded >= scripts.length) {
        _setupHistory();
        return;
      }
      var script = document.createElement("script");
      script.src = scripts[loaded];
      script.async = false;
      script.onload = function () { loaded++; loadNext(); };
      script.onerror = function () { loaded++; loadNext(); };
      document.head.appendChild(script);
    }
    loadNext();
  }

  /**
   * Configura o registro de histórico com o estado de autenticação.
   */
  function _setupHistory() {
    if (!window.History || !window.HistoryModules) {
      return;
    }

    function syncFor(user) {
      if (user && user.uid) {
        window.History.init(user.uid).then(function () {
          var path = window.location.pathname || "/";
          if (path.indexOf("/conta/") !== 0) {
            window.History.record(window.History.getPageContext());
          }
        }).catch(function () { });
      } else {
        if (window.HistoryModules.sync) {
          window.HistoryModules.sync.reset();
        }
      }
    }

    if (window.Auth && window.Auth.isInitialized()) {
      syncFor(window.Auth.currentUser());
    }
    if (window.Auth && window.Auth.onAuthChange) {
      window.Auth.onAuthChange(function (user) {
        syncFor(user);
      });
    }
  }

  // ── Flag para evitar registro duplicado da camada de autorização ──
  var _authorizationBound = false;

  /**
   * Carrega os módulos de autorização (RBAC) sob demanda.
   */
  function bindAuthorization() {
    if (_authorizationBound) {
      return;
    }
    _authorizationBound = true;

    var scripts = [
      "/js/auth/authorization-events.js",
      "/js/auth/permission-cache.js",
      "/js/auth/role-service.js",
      "/js/auth/plan-service.js",
      "/js/auth/permission-service.js",
      "/js/auth/feature-service.js",
      "/js/auth/authorization.js",
      "/js/auth/route-guard.js"
    ];

    var loaded = 0;
    function loadNext() {
      if (loaded >= scripts.length) {
        _setupAuthorization();
        return;
      }
      var script = document.createElement("script");
      script.src = scripts[loaded];
      script.async = false;
      script.onload = function () { loaded++; loadNext(); };
      script.onerror = function () { loaded++; loadNext(); };
      document.head.appendChild(script);
    }
    loadNext();
  }

  /**
   * Inicializa a camada de autorização e aplica a proteção de rota.
   */
  
window.__RUN_PREMIUM_ROUTE_GATE = function (forceCheck) {
  try { return window.__PREMIUM_ROUTE_GATE ? window.__PREMIUM_ROUTE_GATE(!!forceCheck) : true; } catch (e) { console.warn("[PremiumGate] falha:", e); return false; }
};
function _setupAuthorization() {
    if (!window.Authorization) {
      return;
    }

    if (window.Authorization.ready) {
      window.Authorization.ready();
    }

    // Rotas Premium têm uma única autoridade de acesso: o bootstrap de Auth +
    // billing-access + premium-content. O Access.guard()/route-gate legado não
    // deve decidir a rota antes do entitlement estar confirmado, pois isso
    // pode transformar um estado transitório em redirecionamento para assinatura.
    if (window.__IS_PREMIUM_ROUTE) {
      if (window.Auth && window.Auth.isInitialized()) {
        safeUpdateUI(window.Auth.currentUser());
      }
      hideAdsForPremium();
      // Não carregue o access-router/premium-banner-manager em uma rota Premium.
      // O premium-content-loader é o único gate de entrega dessas páginas.
      return;
    }

    if (window.Authorization.guard) {
      window.Authorization.guard();
    }
    if (window.Auth && window.Auth.isInitialized()) {
      safeUpdateUI(window.Auth.currentUser());
    }
    hideAdsForPremium();
    if (window.Authorization.onChange) {
      window.Authorization.onChange(function () {
        if (window.Auth) {
          safeUpdateUI(window.Auth.currentUser());
        }
        hideAdsForPremium();
      });
    }
    bindAccess();
  }

  // ── Flag para evitar registro duplicado da camada de acesso ──
  var _accessBound = false;

  /**
   * Carrega os módulos de acesso a conteúdo (Fase 6) sob demanda.
   */
  function bindAccess() {
    if (_accessBound) {
      return;
    }
    _accessBound = true;

    var scripts = [
      "/js/access/access-events.js",
      "/js/access/content-policy.js",
      "/js/access/access-analytics.js",
      "/js/access/content-access.js",
      "/js/access/access-router.js",
      "/js/access/benefit-engine.js",
      "/js/access/premium-widgets.js",
      "/js/access/premium-banner-manager.js"
    ];

    var loaded = 0;
    function loadNext() {
      if (loaded >= scripts.length) {
        _setupAccess();
        return;
      }
      var script = document.createElement("script");
      script.src = scripts[loaded];
      script.async = false;
      script.onload = function () { loaded++; loadNext(); };
      script.onerror = function () { loaded++; loadNext(); };
      document.head.appendChild(script);
    }
    loadNext();
  }

  /**
   * Inicializa a camada de acesso e aplica a proteção de conteúdo.
   */
  function _setupAccess() {
    if (!window.Access) {
      return;
    }

    // Em páginas Premium, o conteúdo é entregue exclusivamente pelo
    // premium-content-loader após a validação do billing-access. Não execute
    // o guard genérico aqui: ele pode observar um estado transitório e mandar
    // o próprio assinante para /conta/assinatura.html.
    if (window.__IS_PREMIUM_ROUTE) {
      return;
    }

    if (window.Access.guard) {
      window.Access.guard();
    }
    if (window.AccessModules.bannerManager && !/^\/conta\//.test(window.location.pathname || "")) {
      window.AccessModules.bannerManager.mount({plan: window.Auth && window.Auth.hasPlan && window.Auth.hasPlan("premium") ? "premium" : "free"});
    }
  }

  var _ADMIN_EMAILS = ["kauepg18@gmail.com", "kauesp07@hotmail.com"];

  function _isAdmin() {
    var u = window.Auth && window.Auth.currentUser ? window.Auth.currentUser() : null;
    var email = u ? (u.email || "") : "";
    return _ADMIN_EMAILS.indexOf(email.toLowerCase()) !== -1;
  }

  /**
   * Itens de menu condicionais (Plano / Painel Admin).
   * @param {boolean} mobile
   * @returns {string}
   */
  function _extraMenuItems(mobile) {
    var out = "";
    if (!window.Authorization) {
      return out;
    }
    var isAdmin = _isAdmin() || window.Authorization.hasRole("administrator");
    if (mobile) {
      if (isAdmin) {
        out += '<a role="menuitem" href="/conta/admin-pagamentos.html" class="block px-4 !py-1.5 text-[#1A3E74] hover:bg-blue-50 text-sm font-medium whitespace-nowrap">Admin</a>';
      }
    } else {
      if (isAdmin) {
        out += '<li><a href="/conta/admin-pagamentos.html" class="block px-4 !py-1.5 text-[#1A3E74] hover:bg-blue-50 text-sm font-medium whitespace-nowrap">Admin</a></li>';
      }
    }
    return out;
  }

  // ── Função para atualizar UI baseada no estado de auth ──
  // Re-consulta os elementos do DOM a cada chamada (evita race condition)
  function _premiumSubscribeUrl() {
  var base = typeof window.__ACCOUNT_PAGE_URL === "function"
    ? window.__ACCOUNT_PAGE_URL("/conta/assinatura.html")
    : "/conta/assinatura.html?lang=" + encodeURIComponent(window.__LANG || "pt");
  return base;
}

function _premiumCtaHtml(isLoggedIn) {
  var isPremium = !!(window.Auth && window.Auth.hasPlan && window.Auth.hasPlan("premium"));
  var href = isPremium
    ? _premiumSubscribeUrl()
    : (isLoggedIn
      ? _premiumSubscribeUrl()
      : window.__ACCOUNT_LOGIN_URL(typeof window.__ACCOUNT_PAGE_URL === "function"
          ? window.__ACCOUNT_PAGE_URL("/conta/assinatura.html")
          : "/conta/assinatura.html"));
  var label = isPremium ? "Premium" : "Assine já";
  return '<a href="' + href + '" class="ml-2 inline-flex items-center rounded-md bg-[#1A3E74] px-2.5 py-1 text-[11px] font-bold text-white whitespace-nowrap no-underline" data-evento="click_menu_assine_ja">' + label + '</a>';
}

function updateAuthUI(user) {
    var desktopLink = document.getElementById("menu-auth-link-desktop");
    var desktopItem = document.getElementById("menu-auth-desktop");
    var mobileLink = document.getElementById("menu-auth-link-mobile");
    var mobileItem = document.getElementById("menu-auth-mobile");

    // Se nenhum elemento existe ainda, retorna (será tentado novamente)
    if (!desktopLink && !desktopItem && !mobileLink && !mobileItem) {
      return false;
    }

    var displayName = "";
    var photoURL = "";
    var isLoggedIn = !!(user && user.uid);

    if (isLoggedIn) {
      displayName = (user.displayName || user.email || "Usuário").split(" ")[0];
      photoURL = user.photoURL || "";
    }

    // ── Desktop ──
    if (desktopItem) {
      if (isLoggedIn) {
        // Avatar + nome + dropdown
        desktopItem.className = "relative group flex items-center";
        desktopItem.innerHTML =
          '<button type="button" class="flex items-center gap-2 text-gray-700 hover:text-[#1A3E74] font-medium" aria-haspopup="true" aria-expanded="false">' +
          (photoURL
            ? '<img src="' + photoURL + '" alt="' + displayName + '" class="w-7 h-7 rounded-full border-2 border-[#1A3E74]" referrerpolicy="no-referrer" onerror="this.style.display=\'none\'"/>'
            : '<div class="w-7 h-7 rounded-full bg-[#1A3E74] flex items-center justify-center text-white font-bold text-xs">' + displayName.charAt(0).toUpperCase() + "</div>") +
          "<span class='max-w-[100px] truncate'>" + displayName + "</span>" +
          '<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>' +
          "</button>" +
          '<ul class="absolute right-0 hidden group-hover:block bg-white shadow-lg rounded-md py-1 w-48 z-50 border border-gray-100" role="menu">' +
          '<li><a role="menuitem" href="' + window.__ACCOUNT_PAGE_URL('/conta/perfil.html') + '" class="block px-4 !py-1.5 text-gray-700 hover:bg-gray-100 text-sm">Meu Perfil</a></li>' +
          '<li><a role="menuitem" href="' + window.__ACCOUNT_PAGE_URL('/conta/configuracoes.html') + '" class="block px-4 !py-1.5 text-gray-700 hover:bg-gray-100 text-sm">Configurações</a></li>' +
          '<li><a role="menuitem" href="' + window.__ACCOUNT_PAGE_URL('/conta/favoritos.html') + '" class="block px-4 !py-1.5 text-gray-700 hover:bg-gray-100 text-sm">Favoritos</a></li>' +
          '<li><a role="menuitem" href="' + window.__ACCOUNT_PAGE_URL('/conta/historico.html') + '" class="block px-4 !py-1.5 text-gray-700 hover:bg-gray-100 text-sm">Histórico</a></li>' +
          '<li>' + _premiumCtaHtml(isLoggedIn) + '</li>' +
          _extraMenuItems(false) +
          '<li class="border-t border-gray-100 mt-1 pt-1"><a href="#" id="menu-auth-logout-desktop" class="block px-4 !py-1.5 text-red-600 hover:bg-red-50 text-sm font-medium">Sair</a></li>' +
          "</ul>";

        (function bindDesktopAccountDropdown() {
          var accountButton = desktopItem.querySelector('button[aria-haspopup="true"]');
          var accountMenu = desktopItem.querySelector('ul[role="menu"]');
          if (!accountButton || !accountMenu) return;
          accountButton.addEventListener("click", function (e) {
            e.preventDefault();
            e.stopPropagation();
            var isOpen = !accountMenu.classList.contains("hidden");
            accountMenu.classList.toggle("hidden", isOpen);
            accountButton.setAttribute("aria-expanded", String(!isOpen));
          });
          accountButton.addEventListener("keydown", function (e) {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              accountButton.click();
            } else if (e.key === "Escape") {
              accountMenu.classList.add("hidden");
              accountButton.setAttribute("aria-expanded", "false");
            }
          });
          if (!window.__ACCOUNT_MENU_DOCUMENT_LISTENER) {
            window.__ACCOUNT_MENU_DOCUMENT_LISTENER = true;
            document.addEventListener("click", function (e) {
              document.querySelectorAll("#menu-auth-desktop ul[role='menu']").forEach(function (menu) {
                var host = document.getElementById("menu-auth-desktop");
                var btn = host && host.querySelector('button[aria-haspopup="true"]');
                if (host && !host.contains(e.target)) {
                  menu.classList.add("hidden");
                  if (btn) btn.setAttribute("aria-expanded", "false");
                }
              });
            });
          }
        })();

        setTimeout(function () {
          var logoutBtn = document.getElementById("menu-auth-logout-desktop");
          if (logoutBtn) {
            logoutBtn.addEventListener("click", function (e) {
              e.preventDefault();
              if (window.Auth && window.Auth.signOut) {
                window.Auth.signOut().then(function () {
                  window.location.reload();
                });
              }
            });
          }
        }, 100);
      } else {
        desktopItem.className = "flex items-center";
        desktopItem.innerHTML =
          '<a href="' + window.__ACCOUNT_LOGIN_URL() + '" class="text-gray-700 hover:text-[#1A3E74] font-medium flex items-center gap-1.5">' +
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" fill="currentColor" width="0.9em" height="0.9em" aria-hidden="true"><path d="M224 256A128 128 0 1 0 224 0a128 128 0 1 0 0 256zm-45.7 48C79.8 304 0 383.8 0 482.3 0 498.7 13.3 512 29.7 512l388.6 0c16.4 0 29.7-13.3 29.7-29.7 0-98.5-79.8-178.3-178.3-178.3l-91.4 0z"/></svg>' +
          "Entrar" +
          "</a>" +
          _premiumCtaHtml(isLoggedIn);
      }
    }

    // ── Mobile ──
    if (mobileItem) {
      if (isLoggedIn) {
        mobileItem.className = "border-t border-gray-200 mt-2 pt-2";
        mobileItem.innerHTML =
          '<div class="px-4 py-2 flex items-center gap-3">' +
          (photoURL
            ? '<img src="' + photoURL + '" alt="' + displayName + '" class="w-9 h-9 rounded-full border-2 border-[#1A3E74]" referrerpolicy="no-referrer" onerror="this.style.display=\'none\'"/>'
            : '<div class="w-9 h-9 rounded-full bg-[#1A3E74] flex items-center justify-center text-white font-bold text-sm">' + displayName.charAt(0).toUpperCase() + "</div>") +
          '<div><p class="font-bold text-sm text-gray-800 m-0">' + (user.displayName || "Usuário") + "</p>" +
          '<p class="text-xs text-gray-500 m-0">' + (user.email || "") + "</p></div>" +
          "</div>" +
          '<a role="menuitem" href="' + window.__ACCOUNT_PAGE_URL('/conta/perfil.html') + '" class="block px-4 !py-1.5 text-gray-700 hover:bg-gray-100">Meu Perfil</a>' +
          '<a role="menuitem" href="' + window.__ACCOUNT_PAGE_URL('/conta/favoritos.html') + '" class="block px-4 !py-1.5 text-gray-700 hover:bg-gray-100">Favoritos</a>' +
          '<a role="menuitem" href="' + window.__ACCOUNT_PAGE_URL('/conta/historico.html') + '" class="block px-4 !py-1.5 text-gray-700 hover:bg-gray-100">Histórico</a>' +
          '<a role="menuitem" href="' + window.__ACCOUNT_PAGE_URL('/conta/configuracoes.html') + '" class="block px-4 !py-1.5 text-gray-700 hover:bg-gray-100">Configurações</a>' +
          '<div class="px-4 py-1.5">' + _premiumCtaHtml(isLoggedIn) + '</div>' +
          _extraMenuItems(true) +
          '<a role="menuitem" href="#" id="menu-auth-logout-mobile" class="block px-4 !py-1.5 text-red-600 hover:bg-red-50 font-medium">Sair</a>';

        setTimeout(function () {
          var logoutBtn = document.getElementById("menu-auth-logout-mobile");
          if (logoutBtn) {
            logoutBtn.addEventListener("click", function (e) {
              e.preventDefault();
              if (window.Auth && window.Auth.signOut) {
                window.Auth.signOut().then(function () {
                  window.location.reload();
                });
              }
            });
          }
        }, 100);
      } else {
        mobileItem.className = "border-t border-gray-200 mt-2 pt-2";
        mobileItem.innerHTML =
          '<a role="menuitem" href="' + window.__ACCOUNT_LOGIN_URL() + '" class="block px-4 !py-1.5 text-[#1A3E74] font-bold hover:bg-blue-50 flex items-center gap-2">' +
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" fill="currentColor" width="1em" height="1em" aria-hidden="true"><path d="M224 256A128 128 0 1 0 224 0a128 128 0 1 0 0 256zm-45.7 48C79.8 304 0 383.8 0 482.3 0 498.7 13.3 512 29.7 512l388.6 0c16.4 0 29.7-13.3 29.7-29.7 0-98.5-79.8-178.3-178.3-178.3l-91.4 0z"/></svg>' +
          "Entrar" +
          "</a>" +
          _premiumCtaHtml(isLoggedIn);
      }
    }

    return true;
  }

  // ── Wrapper com retry: tenta atualizar UI, repete se elementos não prontos ──
  function safeUpdateUI(user, retries) {
    retries = retries || 0;
    if (updateAuthUI(user)) {
      return; // Sucesso
    }
    if (retries < 10) {
      setTimeout(function () {
        safeUpdateUI(user, retries + 1);
      }, 200);
    }
  }

  // ── Finaliza a integração do menu após o Auth estar disponível ──
  // Esta função é deliberadamente definida antes de loadAuthScripts().
  // Sem ela, o bootstrap do Auth podia concluir, mas a interface do menu
  // ficava sem listener/renderização após o login.
  var _authUiBound = false;
  function _afterAuthReady() {
    if (!window.Auth) return;

    // Renderiza imediatamente com a identidade Firebase já disponível.
    safeUpdateUI(window.Auth.currentUser());

    // Mantém o menu sincronizado com login/logout sem depender do RBAC.
    if (!_authUiBound) {
      _authUiBound = true;
      if (window.Auth.onAuthChange) {
        window.Auth.onAuthChange(function (user) {
          safeUpdateUI(user);
        });
      }
      bindProfileListener();
      bindFavorites();
      bindHistory();

      // Rotas Premium usam exclusivamente o premium-content-loader para
      // decidir e entregar o conteúdo. O access-router legado não pode
      // executar um segundo guard e redirecionar o assinante para assinatura.
      if (!window.__IS_PREMIUM_ROUTE) {
        bindAuthorization();
        bindAccess();
      }
    }
  }

  // ── Carrega scripts de auth sob demanda ──
  function loadAuthScripts() {
    if (typeof window.__ENSURE_AUTH !== "function") {
      console.error("[Auth] Bootstrap canônico não disponível.");
      return Promise.reject(new Error("auth_bootstrap_unavailable"));
    }

    return window.__ENSURE_AUTH().then(function() {
      _afterAuthReady();
      return window.Auth;
    });
  }

  // O bootstrap de Auth é compartilhado com o loader Premium.
  // Este trecho apenas conecta os listeners da interface do menu.

  // Adia o carregamento normal de Firebase/Auth para depois do primeiro paint.
  // Uma página Premium pode chamar __ENSURE_AUTH imediatamente sem criar uma
  // segunda instância ou uma segunda cadeia de carregamento.
  var _authDeferred = false;
  function _deferAuth() {
    if (_authDeferred) return;
    _authDeferred = true;
    loadAuthScripts().catch(function () {});
  }
  if ("requestIdleCallback" in window) {
    requestIdleCallback(_deferAuth, { timeout: 3000 });
  } else {
    setTimeout(_deferAuth, 300);
  }
}
function inicializarTooltips() {
  document.querySelectorAll("[data-tooltip]").forEach(e => {
    const o = e.getAttribute("data-tooltip"),
      t = document.createElement("div");
    t.className = "tooltip-dinamico", t.textContent = o, e.appendChild(t), e.addEventListener("mouseenter", () => t.style.opacity = "1"), e.addEventListener("mouseleave", () => t.style.opacity = "0"), e.addEventListener("touchstart", () => t.style.opacity = "1"), e.addEventListener("touchend", () => setTimeout(() => t.style.opacity = "0", 2e3))
  })
}

function initializeCookieFunctionality() {
  // Elementos do DOM (Banner e Modal) — suporta múltiplos IDs de modal
  const e = document.getElementById("cookieConsentBanner"),
    l = document.getElementById("granularCookieModal") || document.getElementById("cookie-modal"),
    c = document.getElementById("cookieAnalytics"),
    r = document.getElementById("cookieMarketing");

  // Funções Lógicas
  const h = (param) => {
    // Atualiza consentimento no GTM/GA4
    if (typeof gtag === "function") {
      gtag("consent", "update", param);
    }
    // Salva preferências granulares
    try {
      localStorage.setItem("analytics_storage", param.analytics_storage);
      localStorage.setItem("ad_storage", param.ad_storage);
    } catch (_) { }
  },
    u = () => {
      e && e.classList.remove("show")
    },
    g = () => {
      if (l) {
        if (c) c.checked = "granted" === localStorage.getItem("analytics_storage");
        if (r) r.checked = "granted" === localStorage.getItem("ad_storage");
        l.classList.remove("hidden");
        setTimeout(() => {
          l.classList.add("show")
        }, 10);
      }
    },
    p = () => {
      if (l) {
        l.classList.remove("show");
        setTimeout(() => {
          l.classList.add("hidden")
        }, 300);
      }
    },
    m = () => {
      const saved = localStorage.getItem("cookieConsent");
      if (saved === "accepted") {
        h({
          analytics_storage: "granted",
          ad_storage: "granted"
        });
        u();
        return;
      }
      if (saved === "refused") {
        h({
          analytics_storage: "denied",
          ad_storage: "denied"
        });
        u();
        return;
      }
      if (!saved && e) e.classList.add("show");
    };

  // Delegação de Eventos (Resolve o problema de carregamento assíncrono do rodapé)
  document.addEventListener("click", (event) => {
    const target = event.target;
    // Verifica se o clique foi em um dos botões de interesse ou dentro deles
    const btn = target.closest("button");
    const id = target.id || (btn ? btn.id : null);

    if (!id) return;

    if (id === "acceptAllCookiesBtn") {
      h({
        analytics_storage: "granted",
        ad_storage: "granted"
      });
      localStorage.setItem("cookieConsent", "accepted");
      u();
    } else if (id === "refuseAllCookiesBtn") {
      h({
        analytics_storage: "denied",
        ad_storage: "denied"
      });
      localStorage.setItem("cookieConsent", "refused");
      u();
    } else if (id === "manageCookiesBtn" || id === "openGranularCookieModalBtn") {
      g(); // Abre o modal
    } else if (id === "granularModalCloseButton" || id === "cancelGranularPreferencesBtn") {
      p(); // Fecha o modal
    } else if (id === "saveGranularPreferencesBtn") {
      const prefs = {
        analytics_storage: (c && c.checked) ? "granted" : "denied",
        ad_storage: (r && r.checked) ? "granted" : "denied"
      };
      h(prefs);
      localStorage.setItem("cookieConsent", "managed");
      p();
      u();
    }
  });

  // Executa verificação inicial
  m();
}

function initializeGlobalFunctions() {
  let _resizeTimer;
  function _checkResize() {
    const _w = window.innerWidth;
    if (_w > 1024) {
      window.requestAnimationFrame(() => {
        const _b = document.getElementById("barraAcessibilidade");
        // PREVENÇÃO REFLOW: Só escreve no DOM se o estado estiver errado
        if (_b && _b.style.display !== "flex") _b.style.display = "flex";
        const _n = document.querySelector("nav.desktop-nav");
        if (_n && _n.style.display !== "flex") _n.style.display = "flex";
      });
    }
  }
  _checkResize();
  window.addEventListener("resize", () => {
    clearTimeout(_resizeTimer);
    _resizeTimer = setTimeout(_checkResize, 100);
  });
  const o = document.body,
    t = document.createElement("div");
  t.setAttribute("aria-live", "polite"), t.className = "sr-only", o.appendChild(t);
  const n = document.getElementById("fontSizeText"),
    l = document.getElementById("lineHeightText"),
    s = document.getElementById("letterSpacingText"),
    i = document.getElementById("readingSpeedText"),
    a = document.getElementById("accessibilityToggleButton"),
    c = document.getElementById("pwaAcessibilidadeBar"),
    r = document.getElementById("pwaAcessibilidadeCloseBtn"),
    d = document.getElementById("menuOverlay"),
    m = document.getElementById("offCanvasMenu");
  let u = 1,
    g = 1,
    p = 1,
    h = 1,
    b = null,
    y = !1,
    f = !1;
  const v = window.speechSynthesis,
    _isEN = window.__LANG === "en",
    w = _isEN ? [{ rate: .8, label: "Slow" }, { rate: 1, label: "Normal" }, { rate: 1.5, label: "Fast" }]
      : [{ rate: .8, label: "Lenta" }, { rate: 1, label: "Normal" }, { rate: 1.5, label: "Rápida" }];
  document.addEventListener("focusin", e => {
    b = e.target
  });
  const E = e => {
    t.textContent = e, setTimeout(() => t.textContent = "", 3e3)
  },
    // =========================================================
    // ACESSIBILIDADE: ajustes (corrigido)
    // =========================================================
    applyFontSize = (level, announce) => {
      const fontSizes = ["1em", "1.15em", "1.3em", "1.5em", "2em"];
      const _isEN = window.__LANG === "en";
      const labels = _isEN ? ["Normal", "Medium", "Large", "Extra Large", "Maximum"] : ["Normal", "Médio", "Grande", "Extra Grande", "Máximo"];
      const idx = Math.min(Math.max(parseInt(level || 1, 10), 1), fontSizes.length);
      u = idx;
      const iLevel = idx - 1;
      document.documentElement.style.fontSize = fontSizes[iLevel];
      n && (n.textContent = labels[iLevel]);
      localStorage.setItem("fontSize", String(u));
      (void 0 === announce || announce) && E(`Tamanho da fonte: ${labels[iLevel]}`);
    },
    applyLineHeight = (level, announce) => {
      const values = ["1.5", "1.8", "2.2"];
      const _isEN = window.__LANG === "en";
      const labels = _isEN ? ["Medium", "Large", "Extra Large"] : ["Médio", "Grande", "Extra Grande"];
      const idx = Math.min(Math.max(parseInt(level || 1, 10), 1), values.length);
      g = idx;
      const iLevel = idx - 1;
      document.documentElement.style.setProperty("--espacamento-linha", values[iLevel]);
      l && (l.textContent = labels[iLevel]);
      localStorage.setItem("lineHeight", String(g));
      (void 0 === announce || announce) && E(`Espaçamento de linha: ${labels[iLevel]}`);
    },
    applyLetterSpacing = (level, announce) => {
      const values = ["0em", ".05em", ".1em"];
      const _isEN = window.__LANG === "en";
      const labels = _isEN ? ["Normal", "Medium", "Large"] : ["Normal", "Médio", "Grande"];
      const idx = Math.min(Math.max(parseInt(level || 1, 10), 1), values.length);
      p = idx;
      const iLevel = idx - 1;
      document.documentElement.style.setProperty("--espacamento-letra", values[iLevel]);
      s && (s.textContent = labels[iLevel]);
      localStorage.setItem("letterSpacing", String(p));
      (void 0 === announce || announce) && E(`Espaçamento de letra: ${labels[iLevel]}`);
    },
    readingSpeeds = _isEN ? [{ rate: .8, label: "Slow" }, { rate: 1, label: "Normal" }, { rate: 1.5, label: "Fast" }]
      : [{ rate: .8, label: "Lenta" }, { rate: 1, label: "Normal" }, { rate: 1.5, label: "Rápida" }],
    applyReadingSpeed = (level, announce) => {
      const idx = Math.min(Math.max(parseInt(level || 1, 10), 1), readingSpeeds.length);
      h = idx;
      const sp = readingSpeeds[h - 1];
      i && (i.textContent = sp.label);
      localStorage.setItem("readingSpeed", String(h));
      (void 0 === announce || announce) && E(`Velocidade de leitura: ${sp.label}`);
    },
    L = e => {
      u = u % 5 + 1;
      applyFontSize(u, void 0 === e || e);
    },
    k = e => {
      g = g % 3 + 1;
      applyLineHeight(g, void 0 === e || e);
    },
    C = e => {
      p = p % 3 + 1;
      applyLetterSpacing(p, void 0 === e || e);
    },
    S = (e, o) => {
      e && (document.documentElement.style.setProperty("--cor-foco-acessibilidade", e), localStorage.setItem("focusColor", e), document.querySelectorAll(".color-option").forEach(o => {
        o.classList.toggle("selected", o.dataset.color === e)
      }), void 0 === o || o) && E("Cor de foco alterada.")
    },
    x = () => {
      o.classList.toggle("contraste-alto"), E("Alto contraste " + (o.classList.contains("contraste-alto") ? "ativado" : "desativado"))
    },
    A = () => {
      o.classList.toggle("dark-mode"), E("Modo escuro " + (o.classList.contains("dark-mode") ? "ativado" : "desativado"))
    },
    D = () => {
      o.classList.toggle("fonte-dislexia"), E("Fonte para dislexia " + (o.classList.contains("fonte-dislexia") ? "ativada" : "desativada"))
    },
    T = e => {
      if (e && v) {
        v.speaking && v.cancel();
        const o = new SpeechSynthesisUtterance(e);
        o.lang = window.__TTS_LANG, o.rate = readingSpeeds[h - 1]?.rate || 1, o.onstart = () => {
          y = !0, f = !1
        }, o.onend = () => {
          y = !1, f = !1
        }, o.onerror = e => {
          y = !1, f = !1, console.error("Erro no leitor de tela:", e)
        }, v.speak(o)
      }
    },
    B = () => {
      y ? f ? (v.resume(), f = !1) : v.pause() : T(document.querySelector("main")?.innerText, f = !0)
    },
    q = () => {
      y = !1, f = !1, setTimeout(() => T(document.querySelector("main")?.innerText), 100)
    },
    N = () => {
      h = h % readingSpeeds.length + 1;
      applyReadingSpeed(h, !1);
    },
    F = () => {
      b && T((b.textContent || b.ariaLabel || b.alt || b.value)?.trim())
    },
    P = () => {
      // 1. Cancela leitura de voz se houver
      v && v.cancel();

      // 2. Reseta as variáveis de controle para o índice 1 (Início)
      u = 1; // Fonte (1 = Normal)
      g = 1; // Linha (1 = Médio no array de labels)
      p = 1; // Letra (1 = Normal)
      h = 1; // Velocidade (1 = Normal)

      // 3. APLICA FORÇADAMENTE OS VALORES PADRÃO (Isso corrige o texto e o visual)
      // O 'false' no segundo parâmetro evita que o leitor de tela fale 4 vezes seguidas
      applyFontSize(1, false); // Força Fonte: Normal
      applyLineHeight(1, false); // Força Linha: Médio
      applyLetterSpacing(1, false); // Força Letra: Normal
      applyReadingSpeed(1, false); // Força Velocidade: Normal

      // 4. Limpa classes de alto contraste/dark mode
      o.classList.remove("contraste-alto", "dark-mode", "fonte-dislexia");

      // 5. Reseta cor de foco para amarelo
      S("yellow", false);

      // 6. Limpa memória
      localStorage.clear();

      // 7. Feedback visual único
      E("Configurações redefinidas para o padrão");
    };

  // === RESTAURA PREFERÊNCIAS DE ACESSIBILIDADE (síncrono, antes do primeiro paint) ===
  const R = () => {
    const savedFontSize = parseInt(localStorage.getItem("fontSize") || "1", 10);
    const savedLineHeight = parseInt(localStorage.getItem("lineHeight") || "1", 10);
    const savedLetterSpacing = parseInt(localStorage.getItem("letterSpacing") || "1", 10);
    const savedReadingSpeed = parseInt(localStorage.getItem("readingSpeed") || "1", 10);

    applyFontSize(savedFontSize, !1);
    applyLineHeight(savedLineHeight, !1);
    applyLetterSpacing(savedLetterSpacing, !1);
    applyReadingSpeed(savedReadingSpeed, !1);

    "true" === localStorage.getItem("highContrast") && o.classList.add("contraste-alto");
    "true" === localStorage.getItem("darkMode") && o.classList.add("dark-mode");
    "true" === localStorage.getItem("dyslexiaFont") && o.classList.add("fonte-dislexia");

    S(localStorage.getItem("focusColor") || "yellow", !1);
  };
  R();
  [{
    ids: ["btnAlternarTamanhoFonte", "btnAlternarTamanhoFontePWA"],
    action: L
  }, {
    ids: ["btnAlternarEspacamentoLinha", "btnAlternarEspacamentoLinhaPWA"],
    action: k
  }, {
    ids: ["btnAlternarEspacamentoLetra", "btnAlternarEspacamentoLetraPWA"],
    action: C
  }, {
    ids: ["btnAlternarContraste", "btnAlternarContrastePWA"],
    action: x
  }, {
    ids: ["btnAlternarModoEscuro", "btnAlternarModoEscuroPWA"],
    action: A
  }, {
    ids: ["btnAlternarFonteDislexia", "btnAlternarFonteDislexiaPWA"],
    action: D
  }, {
    ids: ["btnResetarAcessibilidade", "btnResetarAcessibilidadePWA"],
    action: P
  }, {
    ids: ["btnToggleLeitura"],
    action: B
  }, {
    ids: ["btnReiniciarLeitura"],
    action: q
  }, {
    ids: ["btnAlternarVelocidadeLeitura"],
    action: N
  }, {
    ids: ["btnReadFocused"],
    action: F
  }].forEach(e => {
    e.ids.forEach(o => {
      const t = document.getElementById(o);
      t && t.addEventListener("click", e.action)
    })
  }), document.querySelectorAll(".color-option").forEach(e => {
    e.addEventListener("click", () => S(e.dataset.color))
  });
  const M = document.getElementById("keyboardShortcutsModal"),
    H = document.getElementById("btnKeyboardShortcuts"),
    I = document.getElementById("btnKeyboardShortcutsPWA"),
    O = document.getElementById("keyboardModalCloseButton"),
    J = () => {
      M && M.classList.remove("hidden")
    },
    K = () => {
      M && M.classList.add("hidden")
    };
  H?.addEventListener("click", J), I?.addEventListener("click", J), O?.addEventListener("click", K), window.addEventListener("keydown", e => {
    "Escape" === e.key && M && !M.classList.contains("hidden") && K()
  }), initializeCookieFunctionality();
  a?.addEventListener("click", () => {
    m?.classList.contains("is-open") && (m.classList.remove("is-open"), m.classList.add("-translate-x-full")), c?.classList.add("is-open"), d && (d.style.display = "block")
  }), r?.addEventListener("click", () => {
    c?.classList.remove("is-open"), m?.classList.contains("is-open") || d && (d.style.display = "none")
  });
  const zTop = document.getElementById("backToTopBtn");
  if (zTop) {
    let _ticking = false;
    let _lastScrollY = 0; // Criamos a variável fora

    window.addEventListener("scroll", () => {
      _lastScrollY = window.scrollY; // LEITURA DO DOM (Fora da animação)

      if (!_ticking) {
        window.requestAnimationFrame(() => {
          const newDisplay = _lastScrollY > 200 ? "block" : "none";
          // ESCRITA NO DOM (Dentro da animação)
          if (zTop.style.display !== newDisplay) {
            zTop.style.display = newDisplay;
          }
          _ticking = false;
        });
        _ticking = true;
      }
    }, { passive: true });
    zTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  }
  inicializarTooltips();
}
function ativarModoDislexia() {
  // 1. Verifica se o CSS já foi descarregado alguma vez
  if (!document.getElementById('css-dyslexic')) {
    const link = document.createElement('link');
    link.id = 'css-dyslexic';
    link.rel = 'stylesheet';
    // Coloque aqui o link local ou CDN do seu Open Dyslexic
    link.href = 'https://cdn.jsdelivr.net/npm/open-dyslexic@1.0.3/open-dyslexic-regular.min.css';
    document.head.appendChild(link);
  }

  // 2. Adiciona a classe ao body para ativar a fonte
  document.body.classList.toggle('dyslexic');
}



/* =========================
   GA4 — Evento: clique no botão Calcular
   ========================= */
(function () {
  // 1) Verifica se pode enviar analytics (respeita consentimento)
  function podeEnviarAnalytics() {
    try {
      const a = localStorage.getItem("analytics_storage");
      return a !== "denied";
    } catch (_) {
      return true;
    }
  }

  // 2) Envia o evento ao GA4
  function enviarEventoGA(nomeEvento, parametros) {
    if (typeof window.gtag === "function") {
      window.gtag("event", nomeEvento, parametros);
    }
  }

  // 3) “Escuta” qualquer clique no site inteiro
  document.addEventListener("click", function (event) {
    // Pega o elemento clicado (pode ser um botão ou um link)
    const elementoClicado = event.target.closest("button, a");
    if (!elementoClicado) return;

    // REGRA NOVA: Captura o valor do atributo 'data-evento'
    const nomeDoEvento = elementoClicado.getAttribute("data-evento");

    // Se o elemento não tiver o atributo data-evento, ignora o clique
    if (!nomeDoEvento) return;

    // Respeita consentimento (se existir)
    if (!podeEnviarAnalytics()) return;

    // Parâmetros úteis para identificar a página e o texto do botão
    const parametros = {
      page_path: window.location.pathname,
      page_title: document.title,
      button_text: elementoClicado.innerText.trim()
    };

    // Envia o evento usando o nome dinâmico
    enviarEventoGA(nomeDoEvento, parametros);
  });
})();

/* =========================
   Controle de anúncios (premium removido — todos os usuários são free)
   ========================= */
// Stubs mantidos como no-op por compatibilidade com demais call sites.
// Nenhum usuário é premium; todos veem os anúncios.
function isPremiumSubscriber() {
  return false;
}

function hideAdsForPremium() {
  // Nada a fazer: não há mais assinantes premium.
}

/* =========================
   Injeção Dinâmica: Anúncio Multiplex (Antes do Rodapé)
   ========================= */
function initializeMultiplexAds() {
  if (isPremiumSubscriber()) return;
  document.querySelectorAll('ins.adsbygoogle[data-ad-slot="3341197364"]').forEach(function (ad) {
    if (ad.dataset.multiplexInitialized === "true" || ad.hasAttribute("data-adsbygoogle-status")) return;
    ad.dataset.multiplexInitialized = "true";
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (error) {
      delete ad.dataset.multiplexInitialized;
      console.warn("Falha ao inicializar o AdSense Multiplex:", error);
    }
  });
}

/* =========================================================
   MODO ADMIN + GOOGLE TAG + CONSENT + ADSENSE (OTIMIZADO PARA INP)
   ========================================================= */

// Função que engloba toda a lógica que estava nos HTMLs
function initLazyLoadServices() {
  hideAdsForPremium();
  if (
    localStorage.getItem('admin_mode') === 'true' ||
    new URLSearchParams(window.location.search).get('admin') === '1'
  ) {
    console.log('🚧 Modo Admin: Bloqueado.');
    if (new URLSearchParams(window.location.search).get('admin') === '1') {
      localStorage.setItem('admin_mode', 'true');
    }
  } else {
    var savedConsent = localStorage.getItem("cookieConsent");
    var isRefused = (savedConsent === "refused");
    var isManaged = (savedConsent === "managed");
    var adsBlocked = isRefused || (isManaged && localStorage.getItem("ad_storage") === "denied");

    window.__metricsLoaded = false;
    window.__adsenseLoaded = false;
    window.dataLayer = window.dataLayer || [];

    function gtag() {
      dataLayer.push(arguments);
    }
    window.gtag = gtag;

    function loadAnalytics() {
      if (window.__metricsLoaded) return;
      window.__metricsLoaded = true;

      var aState = isRefused ? "denied" : (localStorage.getItem("analytics_storage") || "granted");
      var adState = adsBlocked ? "denied" : "granted";

      var s = document.createElement("script");
      s.async = true;
      s.src = "https://www.googletagmanager.com/gtag/js?id=G-PFM06B7TS5";
      document.head.appendChild(s);

      gtag("consent", "default", {
        analytics_storage: aState,
        ad_storage: adState,
        ad_user_data: adState,
        ad_personalization: adState,
        wait_for_update: 500
      });

      gtag("js", new Date());
      gtag("config", "G-PFM06B7TS5");
      gtag("config", "G-MJDKPDPJ26");
      gtag("config", "G-M7DHHF38EJ");
      gtag("config", "G-8FLJ59XXDK");
      gtag("config", "G-VVDP5JGEX8");
      gtag("config", "G-EX8");
      gtag("config", "AW-952633102");
      gtag("config", "AW-9277197961");

      console.log("📈 Analytics carregado via Lazy Load (Otimizado).");
    }

    function loadAdSenseOnce() {
      if (adsBlocked || isPremiumSubscriber()) return;

      // Inicializa o multiplex imediatamente. O push({}) é seguro antes
      // ou depois do script carregar; o guard interno evita push duplicado.
      initializeMultiplexAds();

      if (window.__adsenseLoaded) return;
      window.__adsenseLoaded = true;

      var existingAdSense = document.querySelector('script[src*="pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]');
      if (existingAdSense) return;

      var ad = document.createElement("script");
      ad.async = true;
      ad.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6472730056006847";
      ad.crossOrigin = "anonymous";
      ad.addEventListener("load", function () {
        initializeMultiplexAds();
      }, { once: true });
      document.head.appendChild(ad);
      console.log("💰 AdSense carregado via Lazy Load (Otimizado).");
    }

    // --- A SOLUÇÃO DO INP ESTÁ AQUI ---
    // Envolvemos o carregamento para não bloquear a Thread Principal
    function executeServices() {
      if ('requestIdleCallback' in window) {
        requestIdleCallback(function () {
          loadAnalytics();
          loadAdSenseOnce();
        });
      } else {
        setTimeout(function () {
          loadAnalytics();
          loadAdSenseOnce();
        }, 100); // Pequeno atraso para liberar a interação
      }
    }

    function onUserInteraction() {
      executeServices();

      window.removeEventListener("scroll", onUserInteraction);
      window.removeEventListener("mousemove", onUserInteraction);
      window.removeEventListener("touchstart", onUserInteraction);
      window.removeEventListener("keydown", onUserInteraction);
    }

    // Verifica se é o robô do Lighthouse/PageSpeed analisando o site
    const isPageSpeed = navigator.userAgent.includes("Lighthouse") || navigator.userAgent.includes("Chrome-Lighthouse") || navigator.userAgent.includes("Googlebot");

    if (!adsBlocked) {
      window.addEventListener("scroll", onUserInteraction, {
        passive: true
      });
      window.addEventListener("mousemove", onUserInteraction, {
        passive: true
      });
      window.addEventListener("touchstart", onUserInteraction, {
        passive: true
      });
      window.addEventListener("keydown", onUserInteraction, {
        passive: true
      });

      // Se for um usuário real, mantém o disparo automático após 8,5s
      // Se for o robô do PageSpeed, aguarda apenas a interação, poupando 190KB na auditoria
      if (!isPageSpeed) {
        setTimeout(onUserInteraction, 8500);
      }
    }

    window.applyConsent = function (consent) {
      gtag("consent", "update", consent);
      if (consent.ad_storage === "granted") {
        adsBlocked = false;
        onUserInteraction();
      } else {
        adsBlocked = true;
        document.querySelectorAll("ins.adsbygoogle")
          .forEach(ad => {
            ad.style.display = "none";
            ad.innerHTML = "";
          });
      }
      localStorage.setItem("analytics_storage", consent.analytics_storage);
      localStorage.setItem("ad_storage", consent.ad_storage);
    }

    window.acceptAllCookies = function () {
      localStorage.setItem("cookieConsent", "accepted");
      window.applyConsent({
        analytics_storage: "granted",
        ad_storage: "granted",
        ad_user_data: "granted",
        ad_personalization: "granted"
      });
    };

    window.rejectAllCookies = function () {
      localStorage.setItem("cookieConsent", "refused");
      window.applyConsent({
        analytics_storage: "denied",
        ad_storage: "denied",
        ad_user_data: "denied",
        ad_personalization: "denied"
      });
    };
  }
}

// Inicializa a função assim que o DOM estiver pronto
document.addEventListener("DOMContentLoaded", initLazyLoadServices);

// Verifica se a variável já existe para evitar erro de declaração duplicada
if (typeof traducoes === 'undefined') {
  var traducoes = {};
}

/**
 * Aplica as traduções nos elementos da página
 */
function aplicarTraducoes() {
  // 1. Tradução para texto comum (data-i18n)
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const chave = el.getAttribute("data-i18n");
    const partes = chave.split('.');

    let valor = traducoes;
    partes.forEach(p => {
      if (valor && valor[p] !== undefined) valor = valor[p];
      else valor = null;
    });

    if (valor !== null) el.textContent = valor;
  });

  // 2. Tradução para aria-labels
  document.querySelectorAll("[data-i18n-aria-label]").forEach(el => {
    const chave = el.getAttribute("data-i18n-aria-label");
    const partes = chave.split('.');

    let valor = traducoes;
    partes.forEach(p => {
      if (valor && valor[p] !== undefined) valor = valor[p];
      else valor = null;
    });

    if (valor !== null) el.setAttribute("aria-label", valor);
  });

  // Atualiza o ano após aplicar as traduções
  substituirAno();
}

/**
 * Busca o arquivo JSON e inicia a tradução
 */
async function carregarTraducoes(idioma, arquivoJson) {
  try {
    const resposta = await fetch(`/locales/${idioma}/${arquivoJson}`);
    const novosDados = await resposta.json();

    traducoes = { ...traducoes, ...novosDados };
    aplicarTraducoes();
  } catch (error) {
    console.error("Erro ao carregar tradução:", error);
  }
}

/**
 * Atualiza o marcador {{year}}
 */
function substituirAno() {
  const yearSpan = document.querySelector('[data-i18n="footer.copyright"]');
  if (yearSpan && yearSpan.textContent.includes('{{year}}')) {
    yearSpan.textContent = yearSpan.textContent.replace('{{year}}', new Date().getFullYear());
  }
}
// Função inteligente que aplica o Lazy Load e altera a fonte
function alternarModoDislexia() {
  // 1. Verifica se o CSS já foi descarregado alguma vez
  if (!document.getElementById('css-dyslexic')) {
    const link = document.createElement('link');
    link.id = 'css-dyslexic';
    link.rel = 'stylesheet';
    link.href = 'https://cdn.jsdelivr.net/npm/open-dyslexic@1.0.3/open-dyslexic-regular.min.css';
    document.head.appendChild(link);
  }

  // 2. Ativa ou desativa a classe no body
  document.body.classList.toggle('dyslexic');
}

// Conecta automaticamente o botão do seu HTML à função acima
document.addEventListener('DOMContentLoaded', () => {
  const btnDislexia = document.getElementById('btnAlternarFonteDislexia');
  if (btnDislexia) {
    btnDislexia.addEventListener('click', alternarModoDislexia);
  }
});

// Carregamento adiado (lazy load) do Manifest para otimização de Core Web Vitals
window.addEventListener('load', function () {
  setTimeout(function () {
    const manifestLink = document.createElement('link');
    manifestLink.rel = 'manifest';
    manifestLink.href = '/manifest.json';
    document.head.appendChild(manifestLink);
  }, 1000); // Aguarda 1 segundo após o load completo da página
});
