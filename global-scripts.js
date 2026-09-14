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
  } else window.__FETCH_PREFIX = "/";
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

"serviceWorker" in navigator && window.addEventListener("load", function () {
  navigator.serviceWorker.register("/sw.js").catch(function () {});
});

document.addEventListener("DOMContentLoaded", function () {
  fetch(window.__FETCH_PREFIX + "menu-global.html").then(function (r) { return r.ok ? r.text() : Promise.reject(); }).then(function (html) {
    var host = document.getElementById("global-header-container");
    if (!host) return;
    window.requestAnimationFrame(function () {
      host.innerHTML = html;
      if (window.__FIX_RELATIVE_LINKS) window.__FIX_RELATIVE_LINKS(host);
      initializeNavigationMenu();
      initializeAuthMenu();
    });
  }).catch(function () {});
});
window.addEventListener("load", function () {
  setTimeout(function () {
    fetch(window.__FETCH_PREFIX + "global-body-elements.html").then(function (r) { return r.ok ? r.text() : Promise.reject(); }).then(function (html) {
      window.requestAnimationFrame(function () { document.body.insertAdjacentHTML("beforeend", html); initializeGlobalFunctions(); });
    }).catch(function () {});
  }, 50);
});

function initializeNavigationMenu() {
  var e = document.getElementById("hamburgerButton"), o = document.getElementById("offCanvasMenu"), t = document.getElementById("menuOverlay"), n = document.getElementById("closeOffCanvasMenu") || document.getElementById("closeMenuButton");
  var open = function () { if (o) { o.classList.add("is-open"); o.classList.remove("-translate-x-full"); } if (t) { t.style.display = "block"; t.classList.add("is-open"); } if (e) e.setAttribute("aria-expanded", "true"); };
  var close = function () { if (o) { o.classList.remove("is-open"); o.classList.add("-translate-x-full"); } if (t) { t.style.display = "none"; t.classList.remove("is-open"); } if (e) e.setAttribute("aria-expanded", "false"); };
  if (e) e.addEventListener("click", open); if (t) t.addEventListener("click", close); if (n) n.addEventListener("click", close);
  if (o) o.querySelectorAll(".has-submenu > a, .has-submenu > button").forEach(function (item) { item.addEventListener("click", function (ev) { ev.preventDefault(); var sub = item.nextElementSibling; if (sub && sub.classList.contains("submenu")) { var isOpen = sub.classList.toggle("open"); item.setAttribute("aria-expanded", String(isOpen)); } }); });
}

function initializeAuthMenu() {
  var _profileListenerBound = false, _favoritesBound = false, _historyBound = false, _authorizationBound = false, _accessBound = false;
  function mergeUserAndProfile(user, profile) { if (!user) return null; if (!profile) return user; return { uid: user.uid, email: profile.email || user.email || "", displayName: profile.displayName || user.displayName || "", photoURL: profile.photoURL || user.photoURL || "" }; }
  function bindProfileListener() { if (_profileListenerBound) return; _profileListenerBound = true; if (window.Auth && window.Auth.onProfileChange) window.Auth.onProfileChange(function (p) { safeUpdateUI(mergeUserAndProfile(window.Auth.currentUser(), p)); }); }
  function bindFavorites() { if (_favoritesBound) return; _favoritesBound = true; var scripts = ["/js/favorites/favorites-utils.js","/js/favorites/favorites-service.js","/js/favorites/favorites-cache.js","/js/favorites/favorites-events.js","/js/favorites/favorites-sync.js","/js/favorites/favorites-ui.js"]; var loaded = 0; function next() { if (loaded >= scripts.length) return _setupFavorites(); var s = document.createElement("script"); s.src = scripts[loaded]; s.async = false; s.onload = function () { loaded++; next(); }; s.onerror = function () { loaded++; next(); }; document.head.appendChild(s); } next(); }
  function _setupFavorites() { if (!window.Favorites || !window.FavoritesModules) return; function syncFor(user) { if (user && user.uid) window.Favorites.init(user.uid).then(_mountFavoriteButton).catch(function () {}); else { if (window.FavoritesModules.sync) window.FavoritesModules.sync.reset(); _unmountFavoriteButton(); } } if (window.Auth && window.Auth.isInitialized()) syncFor(window.Auth.currentUser()); if (window.Auth && window.Auth.onAuthChange) window.Auth.onAuthChange(syncFor); }
  function _mountFavoriteButton() { var path = window.location.pathname || "/"; if (path.indexOf("/conta/") === 0 || document.getElementById("fav-toggle-host") || !window.Favorites || !window.Favorites.getPageContext) return; var pageContext = window.Favorites.getPageContext(), attempts = 0; function tryMount() { var wrapper = document.getElementById("language-dropdown-wrapper"), inner = wrapper ? wrapper.firstElementChild : null; if (!wrapper || !inner) { if (attempts < 25) { attempts++; setTimeout(tryMount, 200); } return; } var host = document.createElement("span"); host.id = "fav-toggle-host"; host.setAttribute("style", "pointer-events:auto;margin-right:8px;display:inline-flex;align-items:center;"); wrapper.insertBefore(host, inner); window.Favorites.mountButton(host, pageContext); } tryMount(); }
  function _unmountFavoriteButton() { var host = document.getElementById("fav-toggle-host"); if (host && host.parentNode) host.parentNode.removeChild(host); }
  function bindHistory() { if (_historyBound) return; _historyBound = true; var scripts = ["/js/history/history-utils.js","/js/history/history-service.js","/js/history/history-cache.js","/js/history/history-events.js","/js/history/history-session.js","/js/history/history-sync.js","/js/history/history-ui.js"]; var loaded = 0; function next() { if (loaded >= scripts.length) return _setupHistory(); var s=document.createElement("script"); s.src=scripts[loaded]; s.async=false; s.onload=function(){loaded++;next();}; s.onerror=function(){loaded++;next();}; document.head.appendChild(s); } next(); }
  function _setupHistory() { if (!window.History || !window.HistoryModules) return; function syncFor(user) { if (user && user.uid) window.History.init(user.uid).then(function(){ var p=window.location.pathname||"/"; if (p.indexOf("/conta/")!==0) window.History.record(window.History.getPageContext()); }).catch(function(){}); else if(window.HistoryModules.sync) window.HistoryModules.sync.reset(); } if(window.Auth&&window.Auth.isInitialized())syncFor(window.Auth.currentUser()); if(window.Auth&&window.Auth.onAuthChange)window.Auth.onAuthChange(syncFor); }
  function bindAuthorization() { if (_authorizationBound || !window.Authorization) return; _authorizationBound = true; if (window.Authorization.ready) window.Authorization.ready(); if (window.Authorization.guard) window.Authorization.guard(); if (window.Auth && window.Auth.isInitialized()) safeUpdateUI(window.Auth.currentUser()); hideAdsForPremium(); if (window.Authorization.onChange) window.Authorization.onChange(function(){if(window.Auth)safeUpdateUI(window.Auth.currentUser());hideAdsForPremium();}); bindAccess(); }
  function bindAccess() { if (_accessBound) return; _accessBound = true; var scripts=["/js/access/access-events.js","/js/access/content-policy.js","/js/access/benefit-engine.js","/js/access/license-engine.js","/js/access/access-analytics.js","/js/access/premium-widgets.js","/js/access/premium-banner-manager.js","/js/access/content-access.js","/js/access/access-router.js"]; var loaded=0; function next(){if(loaded>=scripts.length)return _setupAccess();var s=document.createElement("script");s.src=scripts[loaded];s.async=false;s.onload=function(){loaded++;next();};s.onerror=function(){loaded++;next();};document.head.appendChild(s);} next(); }
  function _setupAccess(){if(window.Access&&window.Access.guard)window.Access.guard();}
  var _ADMIN_EMAILS=["kauepg18@gmail.com","kauesp07@hotmail.com"];
  function _isAdmin(){var u=window.Auth&&window.Auth.currentUser?window.Auth.currentUser():null;return _ADMIN_EMAILS.indexOf((u?(u.email||""):"").toLowerCase())!==-1;}
  function _extraMenuItems(mobile){var out="";if(!window.Authorization)return out;var admin=_isAdmin()||window.Authorization.hasRole("administrator");if(mobile){if(!window.Authorization.hasPlan("premium"))out+='<a role="menuitem" href="'+window.__ACCOUNT_PAGE_URL('/conta/assinatura.html')+'" class="block px-4 !py-1.5 text-[#1A3E74] hover:bg-blue-50 text-sm font-medium whitespace-nowrap">Plano</a>';if(admin)out+='<a role="menuitem" href="/conta/admin-pagamentos.html" class="block px-4 !py-1.5 text-[#1A3E74] hover:bg-blue-50 text-sm font-medium whitespace-nowrap">Admin</a>';}else{if(!window.Authorization.hasPlan("premium"))out+='<li><a href="'+window.__ACCOUNT_PAGE_URL('/conta/assinatura.html')+'" class="block px-4 !py-1.5 text-[#1A3E74] hover:bg-blue-50 text-sm font-medium whitespace-nowrap">Plano</a></li>';if(admin)out+='<li><a href="/conta/admin-pagamentos.html" class="block px-4 !py-1.5 text-[#1A3E74] hover:bg-blue-50 text-sm font-medium whitespace-nowrap">Admin</a></li>';}return out;}
  function updateAuthUI(user){var di=document.getElementById("menu-auth-desktop"),mi=document.getElementById("menu-auth-mobile");if(!di&&!mi)return false;var logged=!!(user&&user.uid),name=logged?(user.displayName||user.email||"Usuário").split(" ")[0]:"",photo=logged?(user.photoURL||""):"";if(di){if(logged){di.className="relative group flex items-center";di.innerHTML='<button type="button" class="flex items-center gap-2 text-gray-700 hover:text-[#1A3E74] font-medium" aria-haspopup="true" aria-expanded="false">'+(photo?'<img src="'+photo+'" alt="'+name+'" class="w-7 h-7 rounded-full border-2 border-[#1A3E74]" referrerpolicy="no-referrer"/>':'<div class="w-7 h-7 rounded-full bg-[#1A3E74] flex items-center justify-center text-white font-bold text-xs">'+name.charAt(0).toUpperCase()+"</div>")+"<span class='max-w-[100px] truncate'>"+name+"</span><svg class='w-3 h-3' fill='none' stroke='currentColor' viewBox='0 0 24 24' aria-hidden='true'><path stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/></svg></button>"+'<ul class="absolute right-0 hidden group-hover:block bg-white shadow-lg rounded-md py-1 w-48 z-50 border border-gray-100"><li><a href="'+window.__ACCOUNT_PAGE_URL('/conta/perfil.html')+'" class="block px-4 !py-1.5 text-gray-700 hover:bg-gray-100 text-sm">Meu Perfil</a></li><li><a href="'+window.__ACCOUNT_PAGE_URL('/conta/favoritos.html')+'" class="block px-4 !py-1.5 text-gray-700 hover:bg-gray-100 text-sm">Favoritos</a></li><li><a href="'+window.__ACCOUNT_PAGE_URL('/conta/historico.html')+'" class="block px-4 !py-1.5 text-gray-700 hover:bg-gray-100 text-sm">Histórico</a></li>'+_extraMenuItems(false)+'<li class="border-t border-gray-100 mt-1 pt-1"><a href="#" id="menu-auth-logout-desktop" class="block px-4 !py-1.5 text-red-600 hover:bg-red-50 text-sm font-medium">Sair</a></li></ul>';var lb=document.getElementById("menu-auth-logout-desktop");if(lb)lb.onclick=function(ev){ev.preventDefault();if(window.Auth&&window.Auth.signOut)window.Auth.signOut().then(function(){window.location.reload();});};}else{di.className="flex items-center";di.innerHTML='<a href="'+window.__ACCOUNT_LOGIN_URL()+'" class="text-gray-700 hover:text-[#1A3E74] font-medium flex items-center gap-1.5">Entrar</a>';}}if(mi){if(logged){mi.className="border-t border-gray-200 mt-2 pt-2";mi.innerHTML='<div class="px-4 py-2 flex items-center gap-3">'+(photo?'<img src="'+photo+'" alt="'+name+'" class="w-9 h-9 rounded-full border-2 border-[#1A3E74]" referrerpolicy="no-referrer"/>':'<div class="w-9 h-9 rounded-full bg-[#1A3E74] flex items-center justify-center text-white font-bold text-sm">'+name.charAt(0).toUpperCase()+"</div>")+'<div><p class="font-bold text-sm text-gray-800 m-0">'+(user.displayName||"Usuário")+'</p><p class="text-xs text-gray-500 m-0">'+(user.email||"")+'</p></div></div><a role="menuitem" href="'+window.__ACCOUNT_PAGE_URL('/conta/perfil.html')+'" class="block px-4 !py-1.5 text-gray-700 hover:bg-gray-100">Meu Perfil</a><a role="menuitem" href="'+window.__ACCOUNT_PAGE_URL('/conta/favoritos.html')+'" class="block px-4 !py-1.5 text-gray-700 hover:bg-gray-100">Favoritos</a><a role="menuitem" href="'+window.__ACCOUNT_PAGE_URL('/conta/historico.html')+'" class="block px-4 !py-1.5 text-gray-700 hover:bg-gray-100">Histórico</a><a role="menuitem" href="'+window.__ACCOUNT_PAGE_URL('/conta/configuracoes.html')+'" class="block px-4 !py-1.5 text-gray-700 hover:bg-gray-100">Configurações</a>'+_extraMenuItems(true)+'<a role="menuitem" href="#" id="menu-auth-logout-mobile" class="block px-4 !py-1.5 text-red-600 hover:bg-red-50 font-medium">Sair</a>';var lm=document.getElementById("menu-auth-logout-mobile");if(lm)lm.onclick=function(ev){ev.preventDefault();if(window.Auth&&window.Auth.signOut)window.Auth.signOut().then(function(){window.location.reload();});};}else{mi.className="border-t border-gray-200 mt-2 pt-2";mi.innerHTML='<a role="menuitem" href="'+window.__ACCOUNT_LOGIN_URL()+'" class="block px-4 !py-1.5 text-[#1A3E74] font-bold hover:bg-blue-50">Entrar</a>';}}return true;}
  function safeUpdateUI(user,retries){retries=retries||0;if(updateAuthUI(user))return;if(retries<10)setTimeout(function(){safeUpdateUI(user,retries+1);},200);}
  function loadAuthScripts(){if(window.Auth)return _useExistingAuth();var scripts=["/js/firebase/firebase-init.js","/js/auth/auth-session.js","/js/auth/auth-providers.js","/js/auth/auth-permissions.js","/js/auth/firestore-user.js","/js/auth/user-cache.js","/js/auth/user-events.js","/js/auth/preferences.js","/js/auth/auth-user-profile.js","/js/auth/auth-core.js"],loaded=0;function next(){if(loaded>=scripts.length){if(window.Auth&&window.Auth.init)window.Auth.init().then(function(){bindProfileListener();bindFavorites();bindHistory();bindAuthorization();safeUpdateUI(window.Auth.currentUser());window.Auth.onAuthChange(function(user){safeUpdateUI(user);});}).catch(function(){});return;}var s=document.createElement("script");s.src=scripts[loaded];s.async=false;s.onload=function(){loaded++;next();};s.onerror=function(){loaded++;next();};document.head.appendChild(s);}next();}
  function _useExistingAuth(){function wait(){if(window.Auth.isInitialized()){bindProfileListener();bindFavorites();bindHistory();bindAuthorization();safeUpdateUI(window.Auth.currentUser());window.Auth.onAuthChange(function(user){safeUpdateUI(user);});}else window.Auth.init().then(function(){bindProfileListener();bindFavorites();bindHistory();bindAuthorization();safeUpdateUI(window.Auth.currentUser());window.Auth.onAuthChange(function(user){safeUpdateUI(user);});}).catch(function(){});}wait();}
  loadAuthScripts();
}

function initializeCookieFunctionality() {
  var banner = document.getElementById("cookieConsentBanner"), modal = document.getElementById("granularCookieModal") || document.getElementById("cookie-modal"), analytics = document.getElementById("cookieAnalytics"), marketing = document.getElementById("cookieMarketing");
  function updateConsent(param){if(typeof gtag==="function")gtag("consent","update",param);try{localStorage.setItem("analytics_storage",param.analytics_storage);localStorage.setItem("ad_storage",param.ad_storage);}catch(_){} }
  function hideBanner(){if(banner)banner.classList.remove("show");}
  function openModal(){if(!modal)return;if(analytics)analytics.checked=localStorage.getItem("analytics_storage")==="granted";if(marketing)marketing.checked=localStorage.getItem("ad_storage")==="granted";modal.classList.remove("hidden");setTimeout(function(){modal.classList.add("show");},10);}
  function closeModal(){if(!modal)return;modal.classList.remove("show");setTimeout(function(){modal.classList.add("hidden");},300);}
  document.addEventListener("click",function(event){var target=event.target,btn=target.closest("button"),id=target.id||(btn?btn.id:null);if(!id)return;if(id==="acceptAllCookiesBtn"){updateConsent({analytics_storage:"granted",ad_storage:"granted"});localStorage.setItem("cookieConsent","accepted");hideBanner();}else if(id==="refuseAllCookiesBtn"){updateConsent({analytics_storage:"denied",ad_storage:"denied"});localStorage.setItem("cookieConsent","refused");hideBanner();}else if(id==="manageCookiesBtn"||id==="openGranularCookieModalBtn")openModal();else if(id==="granularModalCloseButton"||id==="cancelGranularPreferencesBtn")closeModal();else if(id==="saveGranularPreferencesBtn"){updateConsent({analytics_storage:analytics&&analytics.checked?"granted":"denied",ad_storage:marketing&&marketing.checked?"granted":"denied"});localStorage.setItem("cookieConsent","managed");closeModal();hideBanner();}});
  var saved=localStorage.getItem("cookieConsent");
  if(saved==="accepted")updateConsent({analytics_storage:"granted",ad_storage:"granted"}); else if(saved==="refused")updateConsent({analytics_storage:"denied",ad_storage:"denied"}); else if(!saved&&banner)banner.classList.add("show");
}
function initializeGlobalFunctions(){initializeCookieFunctionality();}
(function(){function canAnalytics(){try{return localStorage.getItem("analytics_storage")!=="denied";}catch(_){return true;}}document.addEventListener("click",function(event){var e=event.target.closest("button,a");if(!e)return;var name=e.getAttribute("data-evento");if(!name||!canAnalytics()||typeof window.gtag!=="function")return;window.gtag("event",name,{page_path:location.pathname,page_title:document.title,button_text:(e.innerText||"").trim()});});})();

/* =========================
   Controle de anúncios para assinantes premium
   ========================= */
var PREMIUM_AD_FREE_PLANS = ["junior"];
(function(){var style=document.createElement("style");style.id="premium-no-ads-css";style.textContent="html.premium-no-ads ins.adsbygoogle,html.premium-no-ads .google-auto-placed,html.premium-no-ads .ads-multiplex-container,html.premium-no-ads #multiplex-ad-reserved,html.premium-no-ads .multiplex-ad-reserved{display:none !important;height:0 !important;min-height:0 !important;margin:0 !important;padding:0 !important;overflow:hidden !important;}html:not(.premium-no-ads) [data-premium-only]{display:none !important;}";(document.head||document.documentElement).appendChild(style);})();
function isPremiumSubscriber(){if(window.Authorization&&window.Authorization.hasPlan)return window.Authorization.hasPlan("premium");return false;}
var _noAdsObserverInstalled=false;
function hideAdNodes(){var sel="ins.adsbygoogle,.google-auto-placed,.ads-multiplex-container,#multiplex-ad-reserved,.multiplex-ad-reserved";document.querySelectorAll(sel).forEach(function(ad){ad.style.display="none";ad.innerHTML="";});}
function hideAdsForPremium(){var premium=isPremiumSubscriber();if(premium)document.documentElement.classList.add("premium-no-ads");else document.documentElement.classList.remove("premium-no-ads");if(!premium)return;hideAdNodes();if(!_noAdsObserverInstalled&&typeof MutationObserver!=="undefined"&&document.body){_noAdsObserverInstalled=true;new MutationObserver(function(){if(isPremiumSubscriber())hideAdNodes();}).observe(document.body,{childList:true,subtree:true});}}
hideAdsForPremium();
function initializeMultiplexAds(){if(isPremiumSubscriber())return;document.querySelectorAll('ins.adsbygoogle[data-ad-slot="3341197364"]').forEach(function(ad){if(ad.dataset.multiplexInitialized==="true"||ad.hasAttribute("data-adsbygoogle-status"))return;ad.dataset.multiplexInitialized="true";try{(window.adsbygoogle=window.adsbygoogle||[]).push({});}catch(error){delete ad.dataset.multiplexInitialized;}});}
function initLazyLoadServices(){hideAdsForPremium();var isAdminMode=localStorage.getItem("admin_mode")==="true"||new URLSearchParams(location.search).get("admin")==="1";if(isAdminMode)return;var savedConsent=localStorage.getItem("cookieConsent"),isRefused=savedConsent==="refused",isManaged=savedConsent==="managed",adsBlocked=isRefused||(isManaged&&localStorage.getItem("ad_storage")==="denied");window.__metricsLoaded=false;window.__adsenseLoaded=false;window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;function loadAnalytics(){if(window.__metricsLoaded)return;window.__metricsLoaded=true;var aState=isRefused?"denied":(localStorage.getItem("analytics_storage")||"granted");var adState=adsBlocked?"denied":"granted";var s=document.createElement("script");s.async=true;s.src="https://www.googletagmanager.com/gtag/js?id=G-PFM06B7TS5";document.head.appendChild(s);gtag("consent","default",{analytics_storage:aState,ad_storage:adState,ad_user_data:adState,ad_personalization:adState,wait_for_update:500});gtag("js",new Date());gtag("config","G-PFM06B7TS5");gtag("config","G-MJDKPDPJ26");gtag("config","G-M7DHHF38EJ");gtag("config","G-8FLJ59XXDK");gtag("config","G-VVDP5JGEX8");gtag("config","G-EX8");gtag("config","AW-952633102");gtag("config","AW-9277197961");}function loadAdSenseOnce(){if(document.documentElement.classList.contains("auth-ad-pending")||window.__adsenseLoaded||adsBlocked||isPremiumSubscriber())return;window.__adsenseLoaded=true;var existing=document.querySelector('script[src*="pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]');if(existing){existing.addEventListener("load",initializeMultiplexAds,{once:true});if(existing.dataset.loaded==="true")initializeMultiplexAds();return;}var ad=document.createElement("script");ad.async=true;ad.src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6472730056006847";ad.crossOrigin="anonymous";ad.addEventListener("load",function(){ad.dataset.loaded="true";initializeMultiplexAds();},{once:true});document.head.appendChild(ad);}function executeServices(){if(document.documentElement.classList.contains("auth-ad-pending")||document.documentElement.classList.contains("auth-premium-no-ads")){loadAnalytics();return;}if("requestIdleCallback"in window)requestIdleCallback(function(){loadAnalytics();loadAdSenseOnce();});else setTimeout(function(){loadAnalytics();loadAdSenseOnce();},100);}function onUserInteraction(){executeServices();["scroll","mousemove","touchstart","keydown"].forEach(function(evt){window.removeEventListener(evt,onUserInteraction);});}if(!adsBlocked){["scroll","mousemove","touchstart","keydown"].forEach(function(evt){window.addEventListener(evt,onUserInteraction,{passive:true});});if(!/(Lighthouse|Chrome-Lighthouse|Googlebot)/.test(navigator.userAgent))setTimeout(onUserInteraction,8500);}window.applyConsent=function(consent){if(window.gtag)gtag("consent","update",consent);if(consent.ad_storage==="granted"){adsBlocked=false;if(!document.documentElement.classList.contains("auth-ad-pending")&&!document.documentElement.classList.contains("auth-premium-no-ads"))onUserInteraction();}else{adsBlocked=true;hideAdNodes();}localStorage.setItem("analytics_storage",consent.analytics_storage);localStorage.setItem("ad_storage",consent.ad_storage);};window.acceptAllCookies=function(){localStorage.setItem("cookieConsent","accepted");window.applyConsent({analytics_storage:"granted",ad_storage:"granted",ad_user_data:"granted",ad_personalization:"granted"});};window.rejectAllCookies=function(){localStorage.setItem("cookieConsent","refused");window.applyConsent({analytics_storage:"denied",ad_storage:"denied",ad_user_data:"denied",ad_personalization:"denied"});};}
document.addEventListener("DOMContentLoaded",initLazyLoadServices);
if(typeof traducoes==='undefined'){var traducoes={};}
function aplicarTraducoes(){document.querySelectorAll("[data-i18n]").forEach(function(el){var chave=el.getAttribute("data-i18n"),partes=chave.split('.'),valor=traducoes;partes.forEach(function(p){if(valor&&valor[p]!==undefined)valor=valor[p];else valor=null;});if(valor!==null)el.textContent=valor;});document.querySelectorAll("[data-i18n-aria-label]").forEach(function(el){var chave=el.getAttribute("data-i18n-aria-label"),partes=chave.split('.'),valor=traducoes;partes.forEach(function(p){if(valor&&valor[p]!==undefined)valor=valor[p];else valor=null;});if(valor!==null)el.setAttribute("aria-label",valor);});substituirAno();}
async function carregarTraducoes(idioma,arquivoJson){try{var resposta=await fetch("/locales/"+idioma+"/"+arquivoJson);var novosDados=await resposta.json();traducoes=Object.assign({},traducoes,novosDados);aplicarTraducoes();}catch(error){}}
function substituirAno(){var yearSpan=document.querySelector('[data-i18n="footer.copyright"]');if(yearSpan&&yearSpan.textContent.indexOf("{{year}}")!==-1)yearSpan.textContent=yearSpan.textContent.replace("{{year}}",new Date().getFullYear());}
function alternarModoDislexia(){if(!document.getElementById("css-dyslexic")){var link=document.createElement("link");link.id="css-dyslexic";link.rel="stylesheet";link.href="https://cdn.jsdelivr.net/npm/open-dyslexic@1.0.3/open-dyslexic-regular.min.css";document.head.appendChild(link);}document.body.classList.toggle("dyslexic");}
document.addEventListener("DOMContentLoaded",function(){var btn=document.getElementById("btnAlternarFonteDislexia");if(btn)btn.addEventListener("click",alternarModoDislexia);});
window.addEventListener("load",function(){setTimeout(function(){var m=document.createElement("link");m.rel="manifest";m.href="/manifest.json";document.head.appendChild(m);},1000);});
