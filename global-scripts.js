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
    if (isBotLike && location.pathname !== "/") location.replace("/");
  } catch (e) {}
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
    if (!/^(pt|en|es|de|it|fr|hi|zh|ar|ja|ru|ko|tr|nl|pl|sv|id|vi|uk)$/.test(_queryLang || "")) _queryLang = null;
  }
  window.__LANG = _queryLang || (_match ? _match[1] : "pt");
  window.__IS_LANG_FOLDER = !!_match;
  var _ttsMap = { en: "en-US", es: "es-ES", de: "de-DE", it: "it-IT", fr: "fr-FR", hi: "hi-IN", zh: "zh-CN", ar: "ar-SA", ja: "ja-JP", ru: "ru-RU", ko: "ko-KR", tr: "tr-TR", nl: "nl-NL", pl: "pl-PL", sv: "sv-SE", id: "id-ID", vi: "vi-VN", uk: "uk-UA", pt: "pt-BR" };
  window.__TTS_LANG = _ttsMap[window.__LANG] || "pt-BR";
  if (window.__IS_LANG_FOLDER) {
    var _parts = _path.slice(_match[0].length).split("/").filter(function (s) { return s; });
    var _depth = _parts.length;
    if (_depth > 0 && _parts[_parts.length - 1].indexOf(".") !== -1) _depth -= 1;
    window.__FETCH_PREFIX = _depth > 0 ? new Array(_depth + 1).join("../") : "";
  } else {
    window.__FETCH_PREFIX = "/";
  }
})();

window.__ACCOUNT_LOGIN_URL = function (returnUrl) {
  var lang = window.__LANG || "pt";
  var fallback = lang === "pt" ? "/" : "/" + lang + "/";
  var target = returnUrl || (window.location.pathname + window.location.search + window.location.hash);
  if (!target || target.charAt(0) !== "/" || target.indexOf("//") === 0 || target.indexOf("\\") !== -1 || target.indexOf("/conta/login.html") === 0) target = fallback;
  return "/conta/login.html?lang=" + encodeURIComponent(lang) + "&returnUrl=" + encodeURIComponent(target);
};

window.__ACCOUNT_PAGE_URL = function (path) {
  var separator = path.indexOf("?") === -1 ? "?" : "&";
  return path + separator + "lang=" + encodeURIComponent(window.__LANG || "pt");
};

window.__FIX_RELATIVE_LINKS = function (container) {
  if (!container || !container.querySelectorAll) return;
  container.querySelectorAll("a[href]").forEach(function (a) {
    var href = a.getAttribute("href") || "";
    if (href && href.charAt(0) !== "#" && href.charAt(0) !== "/" && href.indexOf(":") === -1) a.setAttribute("href", window.__FETCH_PREFIX + href);
    if (/\/?conta\/login\.html(?:[?#]|$)/.test(a.getAttribute("href") || "")) a.setAttribute("href", window.__ACCOUNT_LOGIN_URL());
  });
};

"serviceWorker" in navigator && window.addEventListener("load", () => {
  navigator.serviceWorker.register("/sw.js").then(e => console.log("Service Worker registado com sucesso:", e.scope), e => console.log("Registo do Service Worker falhou:", e));
});

document.addEventListener("DOMContentLoaded", function () {
  fetch(window.__FETCH_PREFIX + "menu-global.html").then(e => e.ok ? e.text() : Promise.reject("Ficheiro menu-global.html não encontrado")).then(e => {
    const o = document.getElementById("global-header-container");
    if (o) {
      window.requestAnimationFrame(() => {
        o.innerHTML = e;
        if (window.__FIX_RELATIVE_LINKS) window.__FIX_RELATIVE_LINKS(o);
        initializeNavigationMenu();
        initializeAuthMenu();
      });
    }
  }).catch(e => console.warn("Não foi possível carregar o menu global:", e));
});

window.addEventListener("load", function () {
  setTimeout(() => {
    fetch(window.__FETCH_PREFIX + "global-body-elements.html").then(e => e.ok ? e.text() : Promise.reject("Ficheiro global-body-elements.html não encontrado")).then(e => {
      window.requestAnimationFrame(() => {
        document.body.insertAdjacentHTML("beforeend", e);
        initializeGlobalFunctions();
      });
    }).catch(e => console.warn("Não foi possível carregar os elementos globais do corpo:", e));
  }, 50);
});

function initializeNavigationMenu() {
  const e = document.getElementById("hamburgerButton"), o = document.getElementById("offCanvasMenu"), t = document.getElementById("menuOverlay"), n = document.getElementById("closeOffCanvasMenu") || document.getElementById("closeMenuButton"), l = () => { o && (o.classList.add("is-open"), o.classList.remove("-translate-x-full")), t && (t.style.display = "block", t.classList.add("is-open")), e && e.setAttribute("aria-expanded", "true") }, s = () => { o && (o.classList.remove("is-open"), o.classList.add("-translate-x-full")), t && (t.style.display = "none", t.classList.remove("is-open")), e && e.setAttribute("aria-expanded", "false") };
  e?.addEventListener("click", l), t?.addEventListener("click", s), n?.addEventListener("click", s), o?.querySelectorAll(".has-submenu > a, .has-submenu > button")?.forEach(e => {
    e.addEventListener("click", o => { o.preventDefault(); const t = e.nextElementSibling; if (t && t.classList.contains("submenu")) { const isOpen = t.classList.toggle("open"); e.setAttribute("aria-expanded", isOpen); } });
  });
  document.querySelectorAll("nav.desktop-nav button[aria-haspopup]").forEach(function (btn) { btn.addEventListener("mouseenter", function () { btn.setAttribute("aria-expanded", "true"); }); btn.addEventListener("mouseleave", function () { btn.setAttribute("aria-expanded", "false"); }); });
}

function initializeAuthMenu() {
  var _profileListenerBound = false;
  function mergeUserAndProfile(user, profile) {
    if (!user) return null;
    if (!profile) return user;
    return { uid: user.uid, email: profile.email || user.email || "", displayName: profile.displayName || user.displayName || "", photoURL: profile.photoURL || user.photoURL || "" };
  }
  function bindProfileListener() {
    if (_profileListenerBound) return;
    _profileListenerBound = true;
    if (window.Auth && window.Auth.onProfileChange) window.Auth.onProfileChange(function (profile) { safeUpdateUI(mergeUserAndProfile(window.Auth.currentUser(), profile)); });
  }
  var _favoritesBound = false;
  function bindFavorites() {
    if (_favoritesBound) return;
    _favoritesBound = true;
    var scripts = ["/js/favorites/favorites-utils.js","/js/favorites/favorites-service.js","/js/favorites/favorites-cache.js","/js/favorites/favorites-events.js","/js/favorites/favorites-sync.js","/js/favorites/favorites-ui.js"];
    var loaded = 0;
    function loadNext() {
      if (loaded >= scripts.length) { _setupFavorites(); return; }
      var script = document.createElement("script"); script.src = scripts[loaded]; script.async = false; script.onload = function () { loaded++; loadNext(); }; script.onerror = function () { loaded++; loadNext(); }; document.head.appendChild(script);
    }
    loadNext();
  }
  function _setupFavorites() {
    if (!window.Favorites || !window.FavoritesModules) return;
    function syncFor(user) {
      if (user && user.uid) window.Favorites.init(user.uid).then(function () { _mountFavoriteButton(); }).catch(function () {});
      else { if (window.FavoritesModules.sync) window.FavoritesModules.sync.reset(); _unmountFavoriteButton(); }
    }
    if (window.Auth && window.Auth.isInitialized()) syncFor(window.Auth.currentUser());
    if (window.Auth && window.Auth.onAuthChange) window.Auth.onAuthChange(function (user) { syncFor(user); });
  }
  function _mountFavoriteButton() {
    var path = window.location.pathname || "/";
    if (path.indexOf("/conta/") === 0 || document.getElementById("fav-toggle-host")) return;
    if (!window.Favorites || !window.Favorites.getPageContext) return;
    var pageContext = window.Favorites.getPageContext();
    var attempts = 0;
    function tryMount() {
      var wrapper = document.getElementById("language-dropdown-wrapper"), inner = wrapper ? wrapper.firstElementChild : null;
      if (!wrapper || !inner) { if (attempts < 25) { attempts++; setTimeout(tryMount, 200); } return; }
      var host = document.createElement("span"); host.id = "fav-toggle-host"; host.setAttribute("style", "pointer-events:auto;margin-right:8px;display:inline-flex;align-items:center;"); wrapper.insertBefore(host, inner); window.Favorites.mountButton(host, pageContext);
    }
    tryMount();
  }
  function _unmountFavoriteButton() { var host = document.getElementById("fav-toggle-host"); if (host && host.parentNode) host.parentNode.removeChild(host); }
  var _historyBound = false;
  function bindHistory() {
    if (_historyBound) return;
    _historyBound = true;
    var scripts = ["/js/history/history-utils.js","/js/history/history-service.js","/js/history/history-cache.js","/js/history/history-events.js","/js/history/history-session.js","/js/history/history-sync.js","/js/history/history-ui.js"];
    var loaded = 0;
    function loadNext() {
      if (loaded >= scripts.length) { _setupHistory(); return; }
      var script = document.createElement("script"); script.src = scripts[loaded]; script.async = false; script.onload = function () { loaded++; loadNext(); }; script.onerror = function () { loaded++; loadNext(); }; document.head.appendChild(script);
    }
    loadNext();
  }
  function _setupHistory() {
    if (!window.History || !window.HistoryModules) return;
    function syncFor(user) {
      if (user && user.uid) window.History.init(user.uid).then(function () { var path = window.location.pathname || "/"; if (path.indexOf("/conta/") !== 0) window.History.record(window.History.getPageContext()); }).catch(function () {});
      else if (window.HistoryModules.sync) window.HistoryModules.sync.reset();
    }
    if (window.Auth && window.Auth.isInitialized()) syncFor(window.Auth.currentUser());
    if (window.Auth && window.Auth.onAuthChange) window.Auth.onAuthChange(function (user) { syncFor(user); });
  }
  var _authorizationBound = false;
  function bindAuthorization() {
    if (_authorizationBound) return;
    _authorizationBound = true;
    var scripts = ["/js/auth/authorization-events.js","/js/auth/permission-cache.js","/js/auth/role-service.js","/js/auth/plan-service.js","/js/auth/permission-service.js","/js/auth/feature-service.js","/js/auth/authorization.js","/js/auth/route-guard.js"];
    var loaded = 0;
    function loadNext() {
      if (loaded >= scripts.length) { _setupAuthorization(); return; }
      var script = document.createElement("script"); script.src = scripts[loaded]; script.async = false; script.onload = function () { loaded++; loadNext(); }; script.onerror = function () { loaded++; loadNext(); }; document.head.appendChild(script);
    }
    loadNext();
  }
  function _setupAuthorization() {
    if (!window.Authorization) return;
    if (window.Authorization.ready) window.Authorization.ready();
    if (window.Authorization.guard) window.Authorization.guard();
    if (window.Auth && window.Auth.isInitialized()) safeUpdateUI(window.Auth.currentUser());
    hideAdsForPremium();
    if (window.Authorization.onChange) window.Authorization.onChange(function () { if (window.Auth) safeUpdateUI(window.Auth.currentUser()); hideAdsForPremium(); });
    bindAccess();
  }
  var _accessBound = false;
  function bindAccess() {
    if (_accessBound) return;
    _accessBound = true;
    var scripts = ["/js/access/access-events.js","/js/access/content-policy.js","/js/access/benefit-engine.js","/js/access/license-engine.js","/js/access/access-analytics.js","/js/access/premium-widgets.js","/js/access/premium-banner-manager.js","/js/access/content-access.js","/js/access/access-router.js","/js/access/premium-welcome-banner.js"];
    var loaded = 0;
    function loadNext() {
      if (loaded >= scripts.length) { _setupAccess(); return; }
      var script = document.createElement("script"); script.src = scripts[loaded]; script.async = false; script.onload = function () { loaded++; loadNext(); }; script.onerror = function () { loaded++; loadNext(); }; document.head.appendChild(script);
    }
    loadNext();
  }
  function _setupAccess() {
    if (!window.Access) return;
    if (window.Access.guard) window.Access.guard();
    if (window.AccessModules && window.AccessModules.premiumWelcomeBanner && window.AccessModules.premiumWelcomeBanner.init) window.AccessModules.premiumWelcomeBanner.init();
  }
  var _ADMIN_EMAILS = ["kauepg18@gmail.com", "kauesp07@hotmail.com"];
  function _isAdmin() { var u = window.Auth && window.Auth.currentUser ? window.Auth.currentUser() : null; var email = u ? (u.email || "") : ""; return _ADMIN_EMAILS.indexOf(email.toLowerCase()) !== -1; }
  function _extraMenuItems(mobile) {
    var out = ""; if (!window.Authorization) return out;
    var isAdmin = _isAdmin() || window.Authorization.hasRole("administrator");
    if (mobile) {
      if (!window.Authorization.hasPlan("premium")) out += '<a role="menuitem" href="' + window.__ACCOUNT_PAGE_URL('/conta/assinatura.html') + '" class="block px-4 !py-1.5 text-[#1A3E74] hover:bg-blue-50 text-sm font-medium whitespace-nowrap">Plano</a>';
      if (isAdmin) out += '<a role="menuitem" href="/conta/admin-pagamentos.html" class="block px-4 !py-1.5 text-[#1A3E74] hover:bg-blue-50 text-sm font-medium whitespace-nowrap">Admin</a>';
    } else {
      if (!window.Authorization.hasPlan("premium")) out += '<li><a href="' + window.__ACCOUNT_PAGE_URL('/conta/assinatura.html') + '" class="block px-4 !py-1.5 text-[#1A3E74] hover:bg-blue-50 text-sm font-medium whitespace-nowrap">Plano</a></li>';
      if (isAdmin) out += '<li><a href="/conta/admin-pagamentos.html" class="block px-4 !py-1.5 text-[#1A3E74] hover:bg-blue-50 text-sm font-medium whitespace-nowrap">Admin</a></li>';
    }
    return out;
  }
  function updateAuthUI(user) {
    var desktopLink = document.getElementById("menu-auth-link-desktop"), desktopItem = document.getElementById("menu-auth-desktop"), mobileLink = document.getElementById("menu-auth-link-mobile"), mobileItem = document.getElementById("menu-auth-mobile");
    if (!desktopLink && !desktopItem && !mobileLink && !mobileItem) return false;
    var loggedIn = !!(user && user.uid);
    var href = loggedIn ? "/conta/perfil.html?lang=" + encodeURIComponent(window.__LANG || "pt") : window.__ACCOUNT_LOGIN_URL();
    var text = loggedIn ? (user.displayName || user.email || "Conta") : "Entrar";
    [desktopLink, mobileLink].forEach(function (link) { if (!link) return; link.href = href; link.textContent = text; });
    if (desktopItem) desktopItem.classList.remove("hidden");
    if (mobileItem) mobileItem.classList.remove("hidden");
    return true;
  }
  function safeUpdateUI(user) { try { updateAuthUI(user); } catch (e) {} }
  function hideAdsForPremium() {
    try {
      if (window.Auth && window.Auth.profile) {
        var p = window.Auth.profile();
        if (p && (p.lifetime === true || p.plan === "junior")) {
          document.documentElement.classList.add("auth-premium-no-ads");
          document.documentElement.classList.remove("auth-ad-pending");
          document.querySelectorAll("ins.adsbygoogle,.google-auto-placed,.ads-multiplex-container,#multiplex-ad-reserved,.multiplex-ad-reserved").forEach(function (el) { el.style.setProperty("display","none","important"); el.style.setProperty("visibility","hidden","important"); });
        }
      }
    } catch (e) {}
  }
  function initializeGlobalFunctions() {
    if (window.Auth && window.Auth.init) window.Auth.init().then(function () { bindProfileListener(); bindFavorites(); bindHistory(); bindAuthorization(); }).catch(function () { bindProfileListener(); bindFavorites(); bindHistory(); bindAuthorization(); });
  }
}
