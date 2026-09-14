/* =========================
   Camada 4 — Anti-bot leve
   ========================= */
(function () {
  try {
    const ua = navigator.userAgent || "";
    const isTrustedGoogleTool = /(?:Chrome-)?Lighthouse|Googlebot/i.test(ua);
    const isBotLike = !isTrustedGoogleTool && (navigator.webdriver === true || ua.length < 10 || !navigator.language || (screen && (screen.width === 0 || screen.height === 0)));
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
  } else window.__FETCH_PREFIX = "/";
})();

window.__ACCOUNT_LOGIN_URL = function (returnUrl) {
  var lang = window.__LANG || "pt", fallback = lang === "pt" ? "/" : "/" + lang + "/";
  var target = returnUrl || (window.location.pathname + window.location.search + window.location.hash);
  if (!target || target.charAt(0) !== "/" || target.indexOf("//") === 0 || target.indexOf("\\") !== -1 || target.indexOf("/conta/login.html") === 0) target = fallback;
  return "/conta/login.html?lang=" + encodeURIComponent(lang) + "&returnUrl=" + encodeURIComponent(target);
};
window.__ACCOUNT_PAGE_URL = function (path) { return path + (path.indexOf("?") === -1 ? "?" : "&") + "lang=" + encodeURIComponent(window.__LANG || "pt"); };
window.__FIX_RELATIVE_LINKS = function (container) {
  if (!container || !container.querySelectorAll) return;
  container.querySelectorAll("a[href]").forEach(function (a) {
    var href = a.getAttribute("href") || "";
    if (href && href.charAt(0) !== "#" && href.charAt(0) !== "/" && href.indexOf(":") === -1) a.setAttribute("href", window.__FETCH_PREFIX + href);
    if (/\/?conta\/login\.html(?:[?#]|$)/.test(a.getAttribute("href") || "")) a.setAttribute("href", window.__ACCOUNT_LOGIN_URL());
  });
};

"serviceWorker" in navigator && window.addEventListener("load", function () { navigator.serviceWorker.register("/sw.js").then(function (r) { console.log("Service Worker registado com sucesso:", r.scope); }, function (e) { console.log("Registo do Service Worker falhou:", e); }); });

document.addEventListener("DOMContentLoaded", function () {
  fetch(window.__FETCH_PREFIX + "menu-global.html").then(function (e) { return e.ok ? e.text() : Promise.reject("Ficheiro menu-global.html não encontrado"); }).then(function (html) {
    var o = document.getElementById("global-header-container");
    if (o) window.requestAnimationFrame(function () { o.innerHTML = html; if (window.__FIX_RELATIVE_LINKS) window.__FIX_RELATIVE_LINKS(o); initializeNavigationMenu(); initializeAuthMenu(); });
  }).catch(function (e) { console.warn("Não foi possível carregar o menu global:", e); });
});
window.addEventListener("load", function () {
  setTimeout(function () {
    fetch(window.__FETCH_PREFIX + "global-body-elements.html").then(function (e) { return e.ok ? e.text() : Promise.reject("Ficheiro global-body-elements.html não encontrado"); }).then(function (html) {
      window.requestAnimationFrame(function () { document.body.insertAdjacentHTML("beforeend", html); initializeGlobalFunctions(); });
    }).catch(function (e) { console.warn("Não foi possível carregar os elementos globais do corpo:", e); });
  }, 50);
});

function initializeNavigationMenu() {
  var e = document.getElementById("hamburgerButton"), o = document.getElementById("offCanvasMenu"), t = document.getElementById("menuOverlay"), n = document.getElementById("closeOffCanvasMenu") || document.getElementById("closeMenuButton");
  var open = function () { if (o) { o.classList.add("is-open"); o.classList.remove("-translate-x-full"); } if (t) { t.style.display = "block"; t.classList.add("is-open"); } if (e) e.setAttribute("aria-expanded", "true"); };
  var close = function () { if (o) { o.classList.remove("is-open"); o.classList.add("-translate-x-full"); } if (t) { t.style.display = "none"; t.classList.remove("is-open"); } if (e) e.setAttribute("aria-expanded", "false"); };
  e && e.addEventListener("click", open); t && t.addEventListener("click", close); n && n.addEventListener("click", close);
  o && o.querySelectorAll(".has-submenu > a, .has-submenu > button").forEach(function (item) { item.addEventListener("click", function (ev) { ev.preventDefault(); var sub = item.nextElementSibling; if (sub && sub.classList.contains("submenu")) { var isOpen = sub.classList.toggle("open"); item.setAttribute("aria-expanded", isOpen); } }); });
  document.querySelectorAll("nav.desktop-nav button[aria-haspopup]").forEach(function (btn) { btn.addEventListener("mouseenter", function () { btn.setAttribute("aria-expanded", "true"); }); btn.addEventListener("mouseleave", function () { btn.setAttribute("aria-expanded", "false"); }); });
}

function initializeAuthMenu() {
  var profileBound = false, favoritesBound = false, historyBound = false, authorizationBound = false, accessBound = false;
  function merge(user, profile) { if (!user) return null; if (!profile) return user; return { uid: user.uid, email: profile.email || user.email || "", displayName: profile.displayName || user.displayName || "", photoURL: profile.photoURL || user.photoURL || "" }; }
  function bindProfileListener() { if (profileBound) return; profileBound = true; if (window.Auth && window.Auth.onProfileChange) window.Auth.onProfileChange(function (profile) { safeUpdateUI(merge(window.Auth.currentUser(), profile)); }); }
  function bindFavorites() {
    if (favoritesBound) return; favoritesBound = true;
    var scripts = ["/js/favorites/favorites-utils.js","/js/favorites/favorites-service.js","/js/favorites/favorites-cache.js","/js/favorites/favorites-events.js","/js/favorites/favorites-sync.js","/js/favorites/favorites-ui.js"], i = 0;
    function next() { if (i >= scripts.length) return setupFavorites(); var s = document.createElement("script"); s.src = scripts[i++]; s.async = false; s.onload = next; s.onerror = next; document.head.appendChild(s); }
    function setupFavorites() {
      if (!window.Favorites || !window.FavoritesModules) return;
      function sync(user) { if (user && user.uid) window.Favorites.init(user.uid).then(mountFavorite).catch(function () {}); else { if (window.FavoritesModules.sync) window.FavoritesModules.sync.reset(); unmountFavorite(); } }
      if (window.Auth && window.Auth.isInitialized()) sync(window.Auth.currentUser());
      if (window.Auth && window.Auth.onAuthChange) window.Auth.onAuthChange(sync);
    }
    function mountFavorite() {
      var path = window.location.pathname || "/"; if (path.indexOf("/conta/") === 0 || document.getElementById("fav-toggle-host")) return; if (!window.Favorites || !window.Favorites.getPageContext) return;
      var context = window.Favorites.getPageContext(), attempts = 0;
      function tryMount() { var wrapper = document.getElementById("language-dropdown-wrapper"), inner = wrapper ? wrapper.firstElementChild : null; if (!wrapper || !inner) { if (attempts++ < 25) setTimeout(tryMount, 200); return; } var host = document.createElement("span"); host.id = "fav-toggle-host"; host.setAttribute("style", "pointer-events:auto;margin-right:8px;display:inline-flex;align-items:center;"); wrapper.insertBefore(host, inner); window.Favorites.mountButton(host, context); }
      tryMount();
    }
    function unmountFavorite() { var host = document.getElementById("fav-toggle-host"); if (host && host.parentNode) host.parentNode.removeChild(host); }
    next();
  }
  function bindHistory() {
    if (historyBound) return; historyBound = true;
    var scripts = ["/js/history/history-utils.js","/js/history/history-service.js","/js/history/history-cache.js","/js/history/history-events.js","/js/history/history-session.js","/js/history/history-sync.js","/js/history/history-ui.js"], i = 0;
    function next() { if (i >= scripts.length) return setup(); var s = document.createElement("script"); s.src = scripts[i++]; s.async = false; s.onload = next; s.onerror = next; document.head.appendChild(s); }
    function setup() { if (!window.History || !window.HistoryModules) return; function sync(user) { if (user && user.uid) window.History.init(user.uid).then(function () { if ((window.location.pathname || "/").indexOf("/conta/") !== 0) window.History.record(window.History.getPageContext()); }).catch(function () {}); else if (window.HistoryModules.sync) window.HistoryModules.sync.reset(); } if (window.Auth && window.Auth.isInitialized()) sync(window.Auth.currentUser()); if (window.Auth && window.Auth.onAuthChange) window.Auth.onAuthChange(sync); }
    next();
  }
  function bindAuthorization() {
    if (authorizationBound) return; authorizationBound = true;
    var scripts = ["/js/auth/authorization-events.js","/js/auth/permission-cache.js","/js/auth/role-service.js","/js/auth/plan-service.js","/js/auth/permission-service.js","/js/auth/feature-service.js","/js/auth/authorization.js","/js/auth/route-guard.js"], i = 0;
    function next() { if (i >= scripts.length) return setup(); var s = document.createElement("script"); s.src = scripts[i++]; s.async = false; s.onload = next; s.onerror = next; document.head.appendChild(s); }
    function setup() { if (!window.Authorization) return; if (window.Authorization.ready) window.Authorization.ready(); if (window.Authorization.guard) window.Authorization.guard(); if (window.Auth && window.Auth.isInitialized()) safeUpdateUI(window.Auth.currentUser()); hideAdsForPremium(); if (window.Authorization.onChange) window.Authorization.onChange(function () { if (window.Auth) safeUpdateUI(window.Auth.currentUser()); hideAdsForPremium(); }); bindAccess(); }
    next();
  }
  function bindAccess() {
    if (accessBound) return; accessBound = true;
    var scripts = ["/js/access/access-events.js","/js/access/content-policy.js","/js/access/benefit-engine.js","/js/access/license-engine.js","/js/access/access-analytics.js","/js/access/premium-widgets.js","/js/access/premium-banner-manager.js","/js/access/content-access.js","/js/access/access-router.js","/js/access/premium-welcome-banner.js"], i = 0;
    function next() { if (i >= scripts.length) return setup(); var s = document.createElement("script"); s.src = scripts[i++]; s.async = false; s.onload = next; s.onerror = next; document.head.appendChild(s); }
    function setup() { if (!window.Access) return; if (window.Access.guard) window.Access.guard(); if (window.AccessModules && window.AccessModules.premiumWelcomeBanner && window.AccessModules.premiumWelcomeBanner.init) window.AccessModules.premiumWelcomeBanner.init(); }
    next();
  }
  var ADMIN_EMAILS = ["kauepg18@gmail.com", "kauesp07@hotmail.com"];
  function isAdmin() { var u = window.Auth && window.Auth.currentUser ? window.Auth.currentUser() : null, email = u ? (u.email || "") : ""; return ADMIN_EMAILS.indexOf(email.toLowerCase()) !== -1; }
  function extraMenuItems(mobile) { var out = ""; if (!window.Authorization) return out; var admin = isAdmin() || window.Authorization.hasRole("administrator"); if (mobile) { if (!window.Authorization.hasPlan("premium")) out += '<a role="menuitem" href="' + window.__ACCOUNT_PAGE_URL('/conta/assinatura.html') + '" class="block px-4 !py-1.5 text-[#1A3E74] hover:bg-blue-50 text-sm font-medium whitespace-nowrap">Plano</a>'; if (admin) out += '<a role="menuitem" href="/conta/admin-pagamentos.html" class="block px-4 !py-1.5 text-[#1A3E74] hover:bg-blue-50 text-sm font-medium whitespace-nowrap">Admin</a>'; } else { if (!window.Authorization.hasPlan("premium")) out += '<li><a href="' + window.__ACCOUNT_PAGE_URL('/conta/assinatura.html') + '" class="block px-4 !py-1.5 text-[#1A3E74] hover:bg-blue-50 text-sm font-medium whitespace-nowrap">Plano</a></li>'; if (admin) out += '<li><a href="/conta/admin-pagamentos.html" class="block px-4 !py-1.5 text-[#1A3E74] hover:bg-blue-50 text-sm font-medium whitespace-nowrap">Admin</a></li>'; } return out; }
  function updateAuthUI(user) { var desktopLink = document.getElementById("menu-auth-link-desktop"), desktopItem = document.getElementById("menu-auth-desktop"), mobileLink = document.getElementById("menu-auth-link-mobile"), mobileItem = document.getElementById("menu-auth-mobile"); if (!desktopLink && !desktopItem && !mobileLink && !mobileItem) return false; var logged = !!(user && user.uid), href = logged ? "/conta/perfil.html?lang=" + encodeURIComponent(window.__LANG || "pt") : window.__ACCOUNT_LOGIN_URL(), text = logged ? (user.displayName || user.email || "Conta") : "Entrar"; [desktopLink,mobileLink].forEach(function (link) { if (link) { link.href = href; link.textContent = text; } }); if (desktopItem) desktopItem.classList.remove("hidden"); if (mobileItem) mobileItem.classList.remove("hidden"); return true; }
  function safeUpdateUI(user) { try { updateAuthUI(user); } catch (e) {} }
  function hideAdsForPremium() { try { if (window.Auth && window.Auth.profile) { var p = window.Auth.profile(); if (p && (p.lifetime === true || p.plan === "junior")) { document.documentElement.classList.add("auth-premium-no-ads"); document.documentElement.classList.remove("auth-ad-pending"); document.querySelectorAll("ins.adsbygoogle,.google-auto-placed,.ads-multiplex-container,#multiplex-ad-reserved,.multiplex-ad-reserved").forEach(function (el) { el.style.setProperty("display","none","important"); el.style.setProperty("visibility","hidden","important"); }); } } } catch (e) {} }
  function initializeGlobalFunctions() { if (window.Auth && window.Auth.init) window.Auth.init().then(function () { bindProfileListener(); bindFavorites(); bindHistory(); bindAuthorization(); }).catch(function () { bindProfileListener(); bindFavorites(); bindHistory(); bindAuthorization(); }); }
}
