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
      if (location.pathname !== "/") {
        location.replace("/");
      }
    }
  } catch (e) {
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
  navigator.serviceWorker.register("/sw.js").then(e => {
    console.log("Service Worker registado com sucesso:", e.scope)
  }, e => {
    console.log("Registo do Service Worker falhou:", e)
  })
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
  const e = document.getElementById("hamburgerButton"),
    o = document.getElementById("offCanvasMenu"),
    t = document.getElementById("menuOverlay"),
    n = document.getElementById("closeOffCanvasMenu") || document.getElementById("closeMenuButton"),
    l = () => { o && (o.classList.add("is-open"), o.classList.remove("-translate-x-full")), t && (t.style.display = "block", t.classList.add("is-open")), e && e.setAttribute("aria-expanded", "true") },
    s = () => { o && (o.classList.remove("is-open"), o.classList.add("-translate-x-full")), t && (t.style.display = "none", t.classList.remove("is-open")), e && e.setAttribute("aria-expanded", "false") };
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
  document.querySelectorAll("nav.desktop-nav button[aria-haspopup]").forEach(function (btn) {
    btn.addEventListener("mouseenter", function () { btn.setAttribute("aria-expanded", "true"); });
    btn.addEventListener("mouseleave", function () { btn.setAttribute("aria-expanded", "false"); });
  });
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
    if (window.Auth && window.Auth.onProfileChange) {
      window.Auth.onProfileChange(function (profile) { safeUpdateUI(mergeUserAndProfile(window.Auth.currentUser(), profile)); });
    }
  }

  var _favoritesBound = false;
  function bindFavorites() {
    if (_favoritesBound) return;
    _favoritesBound = true;
    var scripts = ["/js/favorites/favorites-utils.js", "/js/favorites/favorites-service.js", "/js/favorites/favorites-cache.js", "/js/favorites/favorites-events.js", "/js/favorites/favorites-sync.js", "/js/favorites/favorites-ui.js"];
    var loaded = 0;
    function loadNext() {
      if (loaded >= scripts.length) { _setupFavorites(); return; }
      var script = document.createElement("script"); script.src = scripts[loaded]; script.async = false;
      script.onload = function () { loaded++; loadNext(); }; script.onerror = function () { loaded++; loadNext(); };
      document.head.appendChild(script);
    }
    loadNext();
  }
  function _setupFavorites() {
    if (!window.Favorites || !window.FavoritesModules) return;
    function syncFor(user) {
      if (user && user.uid) {
        window.Favorites.init(user.uid).then(function () { _mountFavoriteButton(); }).catch(function () {});
      } else {
        if (window.FavoritesModules.sync) window.FavoritesModules.sync.reset();
        _unmountFavoriteButton();
      }
    }
    if (window.Auth && window.Auth.isInitialized()) syncFor(window.Auth.currentUser());
    if (window.Auth && window.Auth.onAuthChange) window.Auth.onAuthChange(function (user) { syncFor(user); });
  }
  function _mountFavoriteButton() {
    var path = window.location.pathname || "/";
    if (path.indexOf("/conta/") === 0) return;
    if (document.getElementById("fav-toggle-host")) return;
    if (!window.Favorites || !window.Favorites.getPageContext) return;
    var pageContext = window.Favorites.getPageContext(), attempts = 0;
    function tryMount() {
      var wrapper = document.getElementById("language-dropdown-wrapper"), inner = wrapper ? wrapper.firstElementChild : null;
      if (!wrapper || !inner) { if (attempts < 25) { attempts++; setTimeout(tryMount, 200); } return; }
      var host = document.createElement("span"); host.id = "fav-toggle-host"; host.setAttribute("style", "pointer-events:auto;margin-right:8px;display:inline-flex;align-items:center;");
      wrapper.insertBefore(host, inner); window.Favorites.mountButton(host, pageContext);
    }
    tryMount();
  }
  function _unmountFavoriteButton() { var host = document.getElementById("fav-toggle-host"); if (host && host.parentNode) host.parentNode.removeChild(host); }

  var _historyBound = false;
  function bindHistory() {
    if (_historyBound) return; _historyBound = true;
    var scripts = ["/js/history/history-utils.js", "/js/history/history-service.js", "/js/history/history-cache.js", "/js/history/history-events.js", "/js/history/history-session.js", "/js/history/history-sync.js", "/js/history/history-ui.js"];
    var loaded = 0;
    function loadNext() {
      if (loaded >= scripts.length) { _setupHistory(); return; }
      var script = document.createElement("script"); script.src = scripts[loaded]; script.async = false;
      script.onload = function () { loaded++; loadNext(); }; script.onerror = function () { loaded++; loadNext(); };
      document.head.appendChild(script);
    }
    loadNext();
  }
  function _setupHistory() {
    if (!window.History || !window.HistoryModules) return;
    function syncFor(user) {
      if (user && user.uid) {
        window.History.init(user.uid).then(function () { var path = window.location.pathname || "/"; if (path.indexOf("/conta/") !== 0) window.History.record(window.History.getPageContext()); }).catch(function () {});
      } else if (window.HistoryModules.sync) window.HistoryModules.sync.reset();
    }
    if (window.Auth && window.Auth.isInitialized()) syncFor(window.Auth.currentUser());
    if (window.Auth && window.Auth.onAuthChange) window.Auth.onAuthChange(function (user) { syncFor(user); });
  }

  function bindAuthorization() {
    if (!window.Authorization) return;
    if (window.Authorization.ready) window.Authorization.ready();
    if (window.Authorization.guard) window.Authorization.guard();
    if (window.Auth && window.Auth.isInitialized()) safeUpdateUI(window.Auth.currentUser());
    hideAdsForPremium();
    if (window.Authorization.onChange) {
      window.Authorization.onChange(function () {
        if (window.Auth) safeUpdateUI(window.Auth.currentUser());
        hideAdsForPremium();
      });
    }
    bindAccess();
  }

  var _accessBound = false;
  function bindAccess() {
    if (_accessBound) return;
    _accessBound = true;
    var scripts = ["/js/access/access-events.js", "/js/access/content-policy.js", "/js/access/benefit-engine.js", "/js/access/license-engine.js", "/js/access/access-analytics.js", "/js/access/premium-widgets.js", "/js/access/premium-banner-manager.js", "/js/access/content-access.js", "/js/access/access-router.js"];
    var loaded = 0;
    function loadNext() {
      if (loaded >= scripts.length) { _setupAccess(); return; }
      var script = document.createElement("script"); script.src = scripts[loaded]; script.async = false;
      script.onload = function () { loaded++; loadNext(); }; script.onerror = function () { loaded++; loadNext(); };
      document.head.appendChild(script);
    }
    loadNext();
  }
  function _setupAccess() { if (window.Access && window.Access.guard) window.Access.guard(); }

  var _ADMIN_EMAILS = ["kauepg18@gmail.com", "kauesp07@hotmail.com"];
  function _isAdmin() { var u = window.Auth && window.Auth.currentUser ? window.Auth.currentUser() : null; var email = u ? (u.email || "") : ""; return _ADMIN_EMAILS.indexOf(email.toLowerCase()) !== -1; }
  function _extraMenuItems(mobile) {
    var out = "";
    if (!window.Authorization) return out;
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
    var displayName = "", photoURL = "", isLoggedIn = !!(user && user.uid);
    if (isLoggedIn) { displayName = (user.displayName || user.email || "Usuário").split(" ")[0]; photoURL = user.photoURL || ""; }
    if (desktopItem) {
      if (isLoggedIn) {
        desktopItem.className = "relative group flex items-center";
        desktopItem.innerHTML = '<button type="button" class="flex items-center gap-2 text-gray-700 hover:text-[#1A3E74] font-medium" aria-haspopup="true" aria-expanded="false">' + (photoURL ? '<img src="' + photoURL + '" alt="' + displayName + '" class="w-7 h-7 rounded-full border-2 border-[#1A3E74]" referrerpolicy="no-referrer" onerror="this.style.display=\'none\'"/>' : '<div class="w-7 h-7 rounded-full bg-[#1A3E74] flex items-center justify-center text-white font-bold text-xs">' + displayName.charAt(0).toUpperCase() + "</div>") + "<span class='max-w-[100px] truncate'>" + displayName + "</span>" + '<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>' + "</button>" + '<ul class="absolute right-0 hidden group-hover:block bg-white shadow-lg rounded-md py-1 w-48 z-50 border border-gray-100">' + '<li><a href="' + window.__ACCOUNT_PAGE_URL('/conta/perfil.html') + '" class="block px-4 !py-1.5 text-gray-700 hover:bg-gray-100 text-sm">Meu Perfil</a></li>' + '<li><a href="' + window.__ACCOUNT_PAGE_URL('/conta/favoritos.html') + '" class="block px-4 !py-1.5 text-gray-700 hover:bg-gray-100 text-sm">Favoritos</a></li>' + '<li><a href="' + window.__ACCOUNT_PAGE_URL('/conta/historico.html') + '" class="block px-4 !py-1.5 text-gray-700 hover:bg-gray-100 text-sm">Histórico</a></li>' + _extraMenuItems(false) + '<li class="border-t border-gray-100 mt-1 pt-1"><a href="#" id="menu-auth-logout-desktop" class="block px-4 !py-1.5 text-red-600 hover:bg-red-50 text-sm font-medium">Sair</a></li>' + "</ul>";
        setTimeout(function () { var logoutBtn = document.getElementById("menu-auth-logout-desktop"); if (logoutBtn) logoutBtn.addEventListener("click", function (e) { e.preventDefault(); if (window.Auth && window.Auth.signOut) window.Auth.signOut().then(function () { window.location.reload(); }); }); }, 100);
      } else {
        desktopItem.className = "flex items-center";
        desktopItem.innerHTML = '<a href="' + window.__ACCOUNT_LOGIN_URL() + '" class="text-gray-700 hover:text-[#1A3E74] font-medium flex items-center gap-1.5"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" fill="currentColor" width="0.9em" height="0.9em" aria-hidden="true"><path d="M224 256A128 128 0 1 0 224 0a128 128 0 1 0 0 256zm-45.7 48C79.8 304 0 383.8 0 482.3 0 498.7 13.3 512 29.7 512l388.6 0c16.4 0 29.7-13.3 29.7-29.7 0-98.5-79.8-178.3-178.3-178.3l-91.4 0z"/></svg>Entrar</a>';
      }
    }
    if (mobileItem) {
      if (isLoggedIn) {
        mobileItem.className = "border-t border-gray-200 mt-2 pt-2";
        mobileItem.innerHTML = '<div class="px-4 py-2 flex items-center gap-3">' + (photoURL ? '<img src="' + photoURL + '" alt="' + displayName + '" class="w-9 h-9 rounded-full border-2 border-[#1A3E74]" referrerpolicy="no-referrer" onerror="this.style.display=\'none\'"/>' : '<div class="w-9 h-9 rounded-full bg-[#1A3E74] flex items-center justify-center text-white font-bold text-sm">' + displayName.charAt(0).toUpperCase() + "</div>") + '<div><p class="font-bold text-sm text-gray-800 m-0">' + (user.displayName || "Usuário") + "</p><p class="text-xs text-gray-500 m-0">" + (user.email || "") + "</p></div></div>" + '<a role="menuitem" href="' + window.__ACCOUNT_PAGE_URL('/conta/perfil.html') + '" class="block px-4 !py-1.5 text-gray-700 hover:bg-gray-100">Meu Perfil</a>' + '<a role="menuitem" href="' + window.__ACCOUNT_PAGE_URL('/conta/favoritos.html') + '" class="block px-4 !py-1.5 text-gray-700 hover:bg-gray-100">Favoritos</a>' + '<a role="menuitem" href="' + window.__ACCOUNT_PAGE_URL('/conta/historico.html') + '" class="block px-4 !py-1.5 text-gray-700 hover:bg-gray-100">Histórico</a>' + '<a role="menuitem" href="' + window.__ACCOUNT_PAGE_URL('/conta/configuracoes.html') + '" class="block px-4 !py-1.5 text-gray-700 hover:bg-gray-100">Configurações</a>' + _extraMenuItems(true) + '<a role="menuitem" href="#" id="menu-auth-logout-mobile" class="block px-4 !py-1.5 text-red-600 hover:bg-red-50 font-medium">Sair</a>';
        setTimeout(function () { var logoutBtn = document.getElementById("menu-auth-logout-mobile"); if (logoutBtn) logoutBtn.addEventListener("click", function (e) { e.preventDefault(); if (window.Auth && window.Auth.signOut) window.Auth.signOut().then(function () { window.location.reload(); }); }); }, 100);
      } else {
        mobileItem.className = "border-t border-gray-200 mt-2 pt-2";
        mobileItem.innerHTML = '<a role="menuitem" href="' + window.__ACCOUNT_LOGIN_URL() + '" class="block px-4 !py-1.5 text-[#1A3E74] font-bold hover:bg-blue-50 flex items-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" fill="currentColor" width="1em" height="1em" aria-hidden="true"><path d="M224 256A128 128 0 1 0 224 0a128 128 0 1 0 0 256zm-45.7 48C79.8 304 0 383.8 0 482.3 0 498.7 13.3 512 29.7 512l388.6 0c16.4 0 29.7-13.3 29.7-29.7 0-98.5-79.8-178.3-178.3-178.3l-91.4 0z"/></svg>Entrar</a>';
      }
    }
    return true;
  }

  function safeUpdateUI(user, retries) {
    retries = retries || 0;
    if (updateAuthUI(user)) return;
    if (retries < 10) setTimeout(function () { safeUpdateUI(user, retries + 1); }, 200);
  }

  function loadAuthScripts() {
    if (window.Auth) { _useExistingAuth(); return; }
    var scripts = ["/js/firebase/firebase-init.js", "/js/auth/auth-session.js", "/js/auth/auth-providers.js", "/js/auth/auth-permissions.js", "/js/auth/firestore-user.js", "/js/auth/user-cache.js", "/js/auth/user-events.js", "/js/auth/preferences.js", "/js/auth/auth-user-profile.js", "/js/auth/auth-core.js"], loaded = 0;
    function loadNext() {
      if (loaded >= scripts.length) {
        if (window.Auth && window.Auth.init) window.Auth.init().then(function () { bindProfileListener(); bindFavorites(); bindHistory(); bindAuthorization(); safeUpdateUI(window.Auth.currentUser()); window.Auth.onAuthChange(function (user) { safeUpdateUI(user); }); }).catch(function () {});
        return;
      }
      var script = document.createElement("script"); script.src = scripts[loaded]; script.async = false; script.onload = function () { loaded++; loadNext(); }; script.onerror = function () { loaded++; loadNext(); }; document.head.appendChild(script);
    }
    loadNext();
  }
  function _useExistingAuth() {
    function waitAndUpdate() {
      if (window.Auth.isInitialized()) {
        bindProfileListener(); bindFavorites(); bindHistory(); bindAuthorization(); safeUpdateUI(window.Auth.currentUser()); window.Auth.onAuthChange(function (user) { safeUpdateUI(user); });
      } else window.Auth.init().then(function () { bindProfileListener(); bindFavorites(); bindHistory(); bindAuthorization(); safeUpdateUI(window.Auth.currentUser()); window.Auth.onAuthChange(function (user) { safeUpdateUI(user); }); }).catch(function () {});
    }
    waitAndUpdate();
  }

  loadAuthScripts();
}

/* =========================
   Traduções e recursos globais
   ========================= */
if (typeof traducoes === 'undefined') { var traducoes = {}; }
function aplicarTraducoes() {
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const chave = el.getAttribute("data-i18n"), partes = chave.split('.');
    let valor = traducoes; partes.forEach(p => { if (valor && valor[p] !== undefined) valor = valor[p]; else valor = null; });
    if (valor !== null) el.textContent = valor;
  });
  document.querySelectorAll("[data-i18n-aria-label]").forEach(el => {
    const chave = el.getAttribute("data-i18n-aria-label"), partes = chave.split('.');
    let valor = traducoes; partes.forEach(p => { if (valor && valor[p] !== undefined) valor = valor[p]; else valor = null; });
    if (valor !== null) el.setAttribute("aria-label", valor);
  });
  substituirAno();
}
async function carregarTraducoes(idioma, arquivoJson) {
  try { const resposta = await fetch(`/locales/${idioma}/${arquivoJson}`); const novosDados = await resposta.json(); traducoes = { ...traducoes, ...novosDados }; aplicarTraducoes(); }
  catch (error) { console.error("Erro ao carregar tradução:", error); }
}
function substituirAno() { const yearSpan = document.querySelector('[data-i18n="footer.copyright"]'); if (yearSpan && yearSpan.textContent.includes('{{year}}')) yearSpan.textContent = yearSpan.textContent.replace('{{year}}', new Date().getFullYear()); }
function alternarModoDislexia() {
  if (!document.getElementById('css-dyslexic')) { const link = document.createElement('link'); link.id = 'css-dyslexic'; link.rel = 'stylesheet'; link.href = 'https://cdn.jsdelivr.net/npm/open-dyslexic@1.0.3/open-dyslexic-regular.min.css'; document.head.appendChild(link); }
  document.body.classList.toggle('dyslexic');
}
document.addEventListener('DOMContentLoaded', () => { const btnDislexia = document.getElementById('btnAlternarFonteDislexia'); if (btnDislexia) btnDislexia.addEventListener('click', alternarModoDislexia); });
window.addEventListener('load', function () { setTimeout(function () { const manifestLink = document.createElement('link'); manifestLink.rel = 'manifest'; manifestLink.href = '/manifest.json'; document.head.appendChild(manifestLink); }, 1000); });

/* =========================================================
   Controle de anúncios — estado compartilhado e fail-closed
   ========================================================= */
(function installPremiumAdGate() {
  if (document.getElementById("premium-ad-gate-css")) return;
  var style = document.createElement("style");
  style.id = "premium-ad-gate-css";
  style.textContent = [
    "html.auth-ad-pending ins.adsbygoogle",
    "html.auth-ad-pending .google-auto-placed",
    "html.auth-ad-pending .ads-multiplex-container",
    "html.auth-ad-pending #multiplex-ad-reserved",
    "html.auth-ad-pending .multiplex-ad-reserved",
    "html.auth-premium-no-ads ins.adsbygoogle",
    "html.auth-premium-no-ads .google-auto-placed",
    "html.auth-premium-no-ads .ads-multiplex-container",
    "html.auth-premium-no-ads #multiplex-ad-reserved",
    "html.auth-premium-no-ads .multiplex-ad-reserved"
  ].join(",") + "{display:none!important;height:0!important;min-height:0!important;margin:0!important;padding:0!important;overflow:hidden!important;}";
  (document.head || document.documentElement).appendChild(style);
})();

function isPremiumSubscriber() {
  if (window.Authorization && window.Authorization.hasPlan) return window.Authorization.hasPlan("premium");
  return false;
}

function loadAdSenseOnce() {
  if (document.documentElement.classList.contains("auth-ad-pending") || isPremiumSubscriber()) return;
  if (window.__adsenseLoaded) return;
  window.__adsenseLoaded = true;
  var existingAdSense = document.querySelector('script[src*="pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]');
  if (existingAdSense) {
    existingAdSense.addEventListener("load", initializeMultiplexAds, { once: true });
    if (existingAdSense.dataset.loaded === "true") initializeMultiplexAds();
    return;
  }
  var ad = document.createElement("script");
  ad.async = true;
  ad.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6472730056006847";
  ad.crossOrigin = "anonymous";
  ad.addEventListener("load", function () { ad.dataset.loaded = "true"; initializeMultiplexAds(); }, { once: true });
  document.head.appendChild(ad);
}

var _premiumAdObserver = null;
function initializeMultiplexAds() {
  if (document.documentElement.classList.contains("auth-ad-pending") || isPremiumSubscriber()) return;
  document.querySelectorAll('ins.adsbygoogle[data-ad-slot="3341197364"]').forEach(function (ad) {
    if (ad.dataset.multiplexInitialized === "true" || ad.hasAttribute("data-adsbygoogle-status")) return;
    ad.dataset.multiplexInitialized = "true";
    try { (window.adsbygoogle = window.adsbygoogle || []).push({}); }
    catch (error) { delete ad.dataset.multiplexInitialized; console.warn("Falha ao inicializar o AdSense Multiplex:", error); }
  });
}

function _clearAdNodes() {
  var sel = "ins.adsbygoogle, .google-auto-placed, .ads-multiplex-container, #multiplex-ad-reserved, .multiplex-ad-reserved";
  document.querySelectorAll(sel).forEach(function (ad) {
    ad.style.display = "none"; ad.style.visibility = "hidden"; ad.setAttribute("data-auth-ad-hidden", "true");
    if (ad.innerHTML) ad.innerHTML = "";
  });
}
function _setAdGateState(state) {
  var root = document.documentElement;
  root.classList.remove("auth-ad-pending", "auth-premium-no-ads");
  if (state === "pending") root.classList.add("auth-ad-pending");
  if (state === "premium") { root.classList.add("auth-premium-no-ads"); _clearAdNodes(); }
  if (state === "free") {
    document.querySelectorAll('[data-auth-ad-hidden="true"]').forEach(function (ad) { ad.style.display = ""; ad.style.visibility = ""; ad.removeAttribute("data-auth-ad-hidden"); });
  }
}

/* A classe pending é aplicada imediatamente no momento da execução do script.
   Ela fica ativa até Auth resolver o perfil. */
_setAdGateState("pending");

function initLazyLoadServices() {
  if (window.Authorization && window.Authorization.hasPlan && window.Authorization.hasPlan("premium")) return;
  var savedConsent = localStorage.getItem("cookieConsent");
  var isRefused = savedConsent === "refused";
  var isManaged = savedConsent === "managed";
  var adsBlocked = isRefused || (isManaged && localStorage.getItem("ad_storage") === "denied");

  window.__metricsLoaded = false;
  window.__adsenseLoaded = false;
  window.dataLayer = window.dataLayer || [];
  function gtag() { dataLayer.push(arguments); }
  window.gtag = gtag;

  function loadAnalytics() {
    if (window.__metricsLoaded) return;
    window.__metricsLoaded = true;
    var aState = isRefused ? "denied" : (localStorage.getItem("analytics_storage") || "granted");
    var adState = adsBlocked || document.documentElement.classList.contains("auth-premium-no-ads") ? "denied" : "granted";
    var s = document.createElement("script"); s.async = true; s.src = "https://www.googletagmanager.com/gtag/js?id=G-PFM06B7TS5"; document.head.appendChild(s);
    gtag("consent", "default", { analytics_storage: aState, ad_storage: adState, ad_user_data: adState, ad_personalization: adState, wait_for_update: 500 });
    gtag("js", new Date());
    gtag("config", "G-PFM06B7TS5"); gtag("config", "G-MJDKPDPJ26"); gtag("config", "G-M7DHHF38EJ"); gtag("config", "G-8FLJ59XXDK"); gtag("config", "G-VVDP5JGEX8"); gtag("config", "G-EX8"); gtag("config", "AW-952633102"); gtag("config", "AW-9277197961");
  }

  function executeServices() {
    if (document.documentElement.classList.contains("auth-ad-pending") || document.documentElement.classList.contains("auth-premium-no-ads")) {
      loadAnalytics();
      return;
    }
    if ("requestIdleCallback" in window) requestIdleCallback(function () { loadAnalytics(); loadAdSenseOnce(); });
    else setTimeout(function () { loadAnalytics(); loadAdSenseOnce(); }, 100);
  }
  function onUserInteraction() {
    executeServices();
    window.removeEventListener("scroll", onUserInteraction); window.removeEventListener("mousemove", onUserInteraction); window.removeEventListener("touchstart", onUserInteraction); window.removeEventListener("keydown", onUserInteraction);
  }
  var isPageSpeed = /Lighthouse|Chrome-Lighthouse|Googlebot/i.test(navigator.userAgent || "");
  if (!adsBlocked) {
    window.addEventListener("scroll", onUserInteraction, { passive: true }); window.addEventListener("mousemove", onUserInteraction, { passive: true }); window.addEventListener("touchstart", onUserInteraction, { passive: true }); window.addEventListener("keydown", onUserInteraction, { passive: true });
    if (!isPageSpeed) setTimeout(onUserInteraction, 8500);
  }
  window.applyConsent = function (consent) {
    if (window.gtag) window.gtag("consent", "update", consent);
    if (consent.ad_storage === "granted") { adsBlocked = false; onUserInteraction(); }
    else { adsBlocked = true; _clearAdNodes(); }
    localStorage.setItem("analytics_storage", consent.analytics_storage); localStorage.setItem("ad_storage", consent.ad_storage);
  };
  window.acceptAllCookies = function () { localStorage.setItem("cookieConsent", "accepted"); window.applyConsent({ analytics_storage: "granted", ad_storage: "granted", ad_user_data: "granted", ad_personalization: "granted" }); };
  window.rejectAllCookies = function () { localStorage.setItem("cookieConsent", "refused"); window.applyConsent({ analytics_storage: "denied", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" }); };
}

document.addEventListener("DOMContentLoaded", initLazyLoadServices);
