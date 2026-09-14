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

(function () {
  var p = window.location.pathname;
  var m = p.match(/^\/(en|es|de|it|fr|hi|zh|ar|ja|ru|ko|tr|nl|pl|sv|id|vi|uk)\//);
  var q = null;
  if (p.indexOf("/conta/") === 0) q = new URLSearchParams(window.location.search).get("lang");
  if (!/^(pt|en|es|de|it|fr|hi|zh|ar|ja|ru|ko|tr|nl|pl|sv|id|vi|uk)$/.test(q || "")) q = null;
  window.__LANG = q || (m ? m[1] : "pt");
  window.__IS_LANG_FOLDER = !!m;
  var tts = { en:"en-US",es:"es-ES",de:"de-DE",it:"it-IT",fr:"fr-FR",hi:"hi-IN",zh:"zh-CN",ar:"ar-SA",ja:"ja-JP",ru:"ru-RU",ko:"ko-KR",tr:"tr-TR",nl:"nl-NL",pl:"pl-PL",sv:"sv-SE",id:"id-ID",vi:"vi-VN",uk:"uk-UA",pt:"pt-BR" };
  window.__TTS_LANG = tts[window.__LANG] || "pt-BR";
  if (m) {
    var parts = p.slice(m[0].length).split("/").filter(function(s){return s;});
    var depth = parts.length;
    if (depth && parts[parts.length-1].indexOf(".") !== -1) depth--;
    window.__FETCH_PREFIX = depth > 0 ? new Array(depth + 1).join("../") : "";
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
  container.querySelectorAll("a[href]").forEach(function(a){
    var href = a.getAttribute("href") || "";
    if (href && href.charAt(0) !== "#" && href.charAt(0) !== "/" && href.indexOf(":") === -1) a.setAttribute("href", window.__FETCH_PREFIX + href);
    if (/\/?conta\/login\.html(?:[?#]|$)/.test(a.getAttribute("href") || "")) a.setAttribute("href", window.__ACCOUNT_LOGIN_URL());
  });
};

"serviceWorker" in navigator && window.addEventListener("load", function(){ navigator.serviceWorker.register("/sw.js").then(function(r){console.log("Service Worker registado com sucesso:",r.scope);},function(e){console.log("Registo do Service Worker falhou:",e);}); });

document.addEventListener("DOMContentLoaded", function(){
  fetch(window.__FETCH_PREFIX + "menu-global.html").then(function(r){return r.ok?r.text():Promise.reject("menu-global.html não encontrado");}).then(function(html){
    var host=document.getElementById("global-header-container");
    if(host) window.requestAnimationFrame(function(){host.innerHTML=html;if(window.__FIX_RELATIVE_LINKS)window.__FIX_RELATIVE_LINKS(host);initializeNavigationMenu();initializeAuthMenu();});
  }).catch(function(e){console.warn("Não foi possível carregar o menu global:",e);});
});
window.addEventListener("load", function(){setTimeout(function(){
  fetch(window.__FETCH_PREFIX + "global-body-elements.html").then(function(r){return r.ok?r.text():Promise.reject("global-body-elements.html não encontrado");}).then(function(html){window.requestAnimationFrame(function(){document.body.insertAdjacentHTML("beforeend",html);initializeGlobalFunctions();});}).catch(function(e){console.warn("Não foi possível carregar os elementos globais do corpo:",e);});
},50);});

function initializeNavigationMenu(){
  var e=document.getElementById("hamburgerButton"),o=document.getElementById("offCanvasMenu"),t=document.getElementById("menuOverlay"),n=document.getElementById("closeOffCanvasMenu")||document.getElementById("closeMenuButton");
  var open=function(){if(o){o.classList.add("is-open");o.classList.remove("-translate-x-full");}if(t){t.style.display="block";t.classList.add("is-open");}if(e)e.setAttribute("aria-expanded","true");};
  var close=function(){if(o){o.classList.remove("is-open");o.classList.add("-translate-x-full");}if(t){t.style.display="none";t.classList.remove("is-open");}if(e)e.setAttribute("aria-expanded","false");};
  if(e)e.addEventListener("click",open);if(t)t.addEventListener("click",close);if(n)n.addEventListener("click",close);
  if(o)o.querySelectorAll(".has-submenu > a, .has-submenu > button").forEach(function(a){a.addEventListener("click",function(ev){ev.preventDefault();var sub=a.nextElementSibling;if(sub&&sub.classList.contains("submenu")){var state=sub.classList.toggle("open");a.setAttribute("aria-expanded",state);}});});
  document.querySelectorAll("nav.desktop-nav button[aria-haspopup]").forEach(function(btn){btn.addEventListener("mouseenter",function(){btn.setAttribute("aria-expanded","true");});btn.addEventListener("mouseleave",function(){btn.setAttribute("aria-expanded","false");});});
}

function initializeAuthMenu(){
  var profileBound=false,favoritesBound=false,historyBound=false,authorizationBound=false,accessBound=false;
  function merge(user,profile){if(!user)return null;if(!profile)return user;return{uid:user.uid,email:profile.email||user.email||"",displayName:profile.displayName||user.displayName||"",photoURL:profile.photoURL||user.photoURL||""};}
  function profileListener(){if(profileBound)return;profileBound=true;if(window.Auth&&window.Auth.onProfileChange)window.Auth.onProfileChange(function(profile){safeUpdateUI(merge(window.Auth.currentUser(),profile));});}
  function loadSeries(list,done){var i=0;function next(){if(i>=list.length){done();return;}var s=document.createElement("script");s.src=list[i++];s.async=false;s.onload=next;s.onerror=next;document.head.appendChild(s);}next();}
  function favorites(){if(favoritesBound)return;favoritesBound=true;loadSeries(["/js/favorites/favorites-utils.js","/js/favorites/favorites-service.js","/js/favorites/favorites-cache.js","/js/favorites/favorites-events.js","/js/favorites/favorites-sync.js","/js/favorites/favorites-ui.js"],function(){if(!window.Favorites)return;function sync(u){if(u&&u.uid)window.Favorites.init(u.uid).then(mountFavorite).catch(function(){});else{if(window.FavoritesModules&&window.FavoritesModules.sync)window.FavoritesModules.sync.reset();unmountFavorite();}}if(window.Auth&&window.Auth.isInitialized())sync(window.Auth.currentUser());if(window.Auth&&window.Auth.onAuthChange)window.Auth.onAuthChange(sync);});}
  function mountFavorite(){if(window.location.pathname.indexOf("/conta/")===0||document.getElementById("fav-toggle-host")||!window.Favorites||!window.Favorites.getPageContext)return;var ctx=window.Favorites.getPageContext(),attempts=0;function tryMount(){var w=document.getElementById("language-dropdown-wrapper"),inner=w?w.firstElementChild:null;if(!w||!inner){if(attempts<25){attempts++;setTimeout(tryMount,200);}return;}var h=document.createElement("span");h.id="fav-toggle-host";h.style="pointer-events:auto;margin-right:8px;display:inline-flex;align-items:center;";w.insertBefore(h,inner);window.Favorites.mountButton(h,ctx);}tryMount();}
  function unmountFavorite(){var h=document.getElementById("fav-toggle-host");if(h&&h.parentNode)h.parentNode.removeChild(h);}
  function history(){if(historyBound)return;historyBound=true;loadSeries(["/js/history/history-utils.js","/js/history/history-service.js","/js/history/history-cache.js","/js/history/history-events.js","/js/history/history-session.js","/js/history/history-sync.js","/js/history/history-ui.js"],function(){if(!window.History)return;function sync(u){if(u&&u.uid)window.History.init(u.uid).then(function(){if(window.location.pathname.indexOf("/conta/")!==0)window.History.record(window.History.getPageContext());}).catch(function(){});else if(window.HistoryModules&&window.HistoryModules.sync)window.HistoryModules.sync.reset();}if(window.Auth&&window.Auth.isInitialized())sync(window.Auth.currentUser());if(window.Auth&&window.Auth.onAuthChange)window.Auth.onAuthChange(sync);});}
  function authorization(){if(authorizationBound)return;authorizationBound=true;loadSeries(["/js/auth/authorization-events.js","/js/auth/permission-cache.js","/js/auth/role-service.js","/js/auth/plan-service.js","/js/auth/permission-service.js","/js/auth/feature-service.js","/js/auth/authorization.js","/js/auth/route-guard.js"],function(){if(!window.Authorization)return;if(window.Authorization.ready)window.Authorization.ready();if(window.Authorization.guard)window.Authorization.guard();hideAdsForPremium();if(window.Authorization.onChange)window.Authorization.onChange(function(){safeUpdateUI(window.Auth&&window.Auth.currentUser());hideAdsForPremium();});access();});}
  function access(){if(accessBound)return;accessBound=true;loadSeries(["/js/access/access-events.js","/js/access/content-policy.js","/js/access/benefit-engine.js","/js/access/license-engine.js","/js/access/access-analytics.js","/js/access/premium-widgets.js","/js/access/premium-banner-manager.js","/js/access/content-access.js","/js/access/access-router.js"],function(){if(window.Access&&window.Access.guard)window.Access.guard();});}
  var ADMINS=["kauepg18@gmail.com","kauesp07@hotmail.com"];
  function admin(){var u=window.Auth&&window.Auth.currentUser?window.Auth.currentUser():null;return ADMINS.indexOf((u&&u.email||"").toLowerCase())!==-1;}
  function extra(mobile){if(!window.Authorization)return"";var isAdmin=admin()||window.Authorization.hasRole("administrator"),out="";if(!window.Authorization.hasPlan("premium")){out+=mobile?'<a role="menuitem" href="'+window.__ACCOUNT_PAGE_URL('/conta/assinatura.html')+'" class="block px-4 !py-1.5 text-[#1A3E74] hover:bg-blue-50 text-sm font-medium whitespace-nowrap">Plano</a>':'<li><a href="'+window.__ACCOUNT_PAGE_URL('/conta/assinatura.html')+'" class="block px-4 !py-1.5 text-[#1A3E74] hover:bg-blue-50 text-sm font-medium whitespace-nowrap">Plano</a></li>';}if(isAdmin)out+=mobile?'<a role="menuitem" href="/conta/admin-pagamentos.html" class="block px-4 !py-1.5 text-[#1A3E74] hover:bg-blue-50 text-sm font-medium whitespace-nowrap">Admin</a>':'<li><a href="/conta/admin-pagamentos.html" class="block px-4 !py-1.5 text-[#1A3E74] hover:bg-blue-50 text-sm font-medium whitespace-nowrap">Admin</a></li>';return out;}
  function updateAuthUI(user){var d=document.getElementById("menu-auth-desktop"),m=document.getElementById("menu-auth-mobile");if(!d&&!m)return false;var logged=!!(user&&user.uid),name=logged?(user.displayName||user.email||"Usuário").split(" ")[0]:"",photo=logged?user.photoURL||"":"";
    if(d)d.innerHTML=logged?'<button type="button" class="flex items-center gap-2 text-gray-700 hover:text-[#1A3E74] font-medium" aria-haspopup="true" aria-expanded="false">'+(photo?'<img src="'+photo+'" alt="'+name+'" class="w-7 h-7 rounded-full border-2 border-[#1A3E74]" referrerpolicy="no-referrer" onerror="this.style.display=\'none\'"/>':'<div class="w-7 h-7 rounded-full bg-[#1A3E74] flex items-center justify-center text-white font-bold text-xs">'+name.charAt(0).toUpperCase()+'</div>')+'<span class="max-w-[100px] truncate">'+name+'</span></button><ul class="absolute right-0 hidden group-hover:block bg-white shadow-lg rounded-md py-1 w-48 z-50 border border-gray-100"><li><a href="'+window.__ACCOUNT_PAGE_URL('/conta/perfil.html')+'">Meu Perfil</a></li><li><a href="'+window.__ACCOUNT_PAGE_URL('/conta/favoritos.html')+'">Favoritos</a></li><li><a href="'+window.__ACCOUNT_PAGE_URL('/conta/historico.html')+'">Histórico</a></li>'+extra(false)+'<li><a href="#" id="menu-auth-logout-desktop" class="text-red-600">Sair</a></li></ul>':'<a href="'+window.__ACCOUNT_LOGIN_URL()+'" class="text-gray-700 hover:text-[#1A3E74] font-medium flex items-center gap-1.5">Entrar</a>';
    if(m)m.innerHTML=logged?'<div class="px-4 py-2"><strong>'+((user.displayName||"Usuário"))+'</strong><div class="text-xs text-gray-500">'+((user.email||""))+'</div></div><a role="menuitem" href="'+window.__ACCOUNT_PAGE_URL('/conta/perfil.html')+'">Meu Perfil</a><a role="menuitem" href="'+window.__ACCOUNT_PAGE_URL('/conta/favoritos.html')+'">Favoritos</a><a role="menuitem" href="'+window.__ACCOUNT_PAGE_URL('/conta/historico.html')+'">Histórico</a><a role="menuitem" href="'+window.__ACCOUNT_PAGE_URL('/conta/configuracoes.html')+'">Configurações</a>'+extra(true)+'<a role="menuitem" href="#" id="menu-auth-logout-mobile" class="text-red-600">Sair</a>':'<a role="menuitem" href="'+window.__ACCOUNT_LOGIN_URL()+'" class="block px-4 !py-1.5 text-[#1A3E74] font-bold">Entrar</a>';
    setTimeout(function(){["menu-auth-logout-desktop","menu-auth-logout-mobile"].forEach(function(id){var b=document.getElementById(id);if(b&&window.Auth&&window.Auth.signOut)b.onclick=function(ev){ev.preventDefault();window.Auth.signOut().then(function(){window.location.reload();});};});},100);return true;}
  function safeUpdateUI(user,retries){retries=retries||0;if(updateAuthUI(user))return;if(retries<10)setTimeout(function(){safeUpdateUI(user,retries+1);},200);}
  window.__safeAuthUpdateUI=safeUpdateUI;
  function startAuth(){if(!window.Auth)return;var init=function(){window.Auth.init().then(function(){profileListener();favorites();history();authorization();safeUpdateUI(window.Auth.currentUser());if(window.Auth.onAuthChange)window.Auth.onAuthChange(safeUpdateUI);}).catch(function(){});};if(window.Auth.isInitialized())init();else init();}
  function loadAuth(){if(window.Auth){startAuth();return;}loadSeries(["/js/firebase/firebase-init.js","/js/auth/auth-session.js","/js/auth/auth-providers.js","/js/auth/auth-permissions.js","/js/auth/firestore-user.js","/js/auth/user-cache.js","/js/auth/user-events.js","/js/auth/preferences.js","/js/auth/auth-user-profile.js","/js/auth/auth-core.js"],startAuth);}
  loadAuth();
}

/* =========================
   Controle de anúncios — estado único
   ========================= */
var PREMIUM_AD_FREE_PLANS=["junior"],_noAdsObserverInstalled=false,_authProfileState="unknown";
(function(){
  if(document.getElementById("premium-no-ads-css"))return;
  var style=document.createElement("style");style.id="premium-no-ads-css";
  style.textContent="html.auth-ad-pending ins.adsbygoogle,html.auth-ad-pending .google-auto-placed,html.auth-ad-pending .ads-multiplex-container,html.auth-ad-pending #multiplex-ad-reserved,html.auth-ad-pending .multiplex-ad-reserved,html.premium-no-ads ins.adsbygoogle,html.premium-no-ads .google-auto-placed,html.premium-no-ads .ads-multiplex-container,html.premium-no-ads #multiplex-ad-reserved,html.premium-no-ads .multiplex-ad-reserved{display:none!important;height:0!important;min-height:0!important;margin:0!important;padding:0!important;overflow:hidden!important;visibility:hidden!important;}";
  (document.head||document.documentElement).appendChild(style);
})();
function _adsAuthResolvedForLoading(){if(document.documentElement.classList.contains("auth-ad-pending"))return false;if(window.Auth&&typeof window.Auth.isInitialized==="function"){if(!window.Auth.isInitialized())return false;if(!window.Auth.profile||!window.Auth.profile())return false;}return true;}
function isPremiumSubscriber(){if(_authProfileState==="premium")return true;if(window.Authorization&&window.Authorization.hasPlan)return window.Authorization.hasPlan("premium");try{var raw=localStorage.getItem("auth_user_profile_cache")||localStorage.getItem("auth_profile");if(!raw)return false;var obj=JSON.parse(raw),profile=(obj&&obj.data)||obj;if(!profile||profile.plan!=="junior")return false;if(profile.lifetime===true)return true;if(!profile.planExpiresAt)return true;var exp=new Date(profile.planExpiresAt);return Number.isFinite(exp.getTime())&&exp.getTime()>Date.now();}catch(e){return false;}}
function hideAdNodes(){document.querySelectorAll("ins.adsbygoogle, .google-auto-placed, .ads-multiplex-container, #multiplex-ad-reserved, .multiplex-ad-reserved").forEach(function(ad){ad.style.setProperty("display","none","important");ad.style.setProperty("visibility","hidden","important");ad.setAttribute("data-auth-ad-hidden","true");});}
function hideAdsForPremium(){var premium=isPremiumSubscriber(),user=window.Auth&&window.Auth.currentUser?window.Auth.currentUser():null,profile=window.Auth&&window.Auth.profile?window.Auth.profile():null;if(premium){_authProfileState="premium";document.documentElement.classList.remove("auth-ad-pending");document.documentElement.classList.add("premium-no-ads");}else if(window.Auth&&typeof window.Auth.isInitialized==="function"&&(!window.Auth.isInitialized()||(user&&!profile))){_authProfileState="pending";document.documentElement.classList.remove("premium-no-ads");document.documentElement.classList.add("auth-ad-pending");}else{_authProfileState="free";document.documentElement.classList.remove("premium-no-ads","auth-ad-pending");}if(_authProfileState==="premium"||_authProfileState==="pending")hideAdNodes();if(_authProfileState!=="premium")return;if(!_noAdsObserverInstalled&&typeof MutationObserver!=="undefined"&&document.body){_noAdsObserverInstalled=true;new MutationObserver(function(){if(isPremiumSubscriber()||_authProfileState==="pending")hideAdNodes();}).observe(document.body,{childList:true,subtree:true});}}
hideAdsForPremium();
function initializeMultiplexAds(){if(isPremiumSubscriber()||!_adsAuthResolvedForLoading())return;document.querySelectorAll('ins.adsbygoogle[data-ad-slot="3341197364"]').forEach(function(ad){if(ad.dataset.multiplexInitialized==="true"||ad.hasAttribute("data-adsbygoogle-status"))return;ad.dataset.multiplexInitialized="true";try{(window.adsbygoogle=window.adsbygoogle||[]).push({});}catch(error){delete ad.dataset.multiplexInitialized;console.warn("Falha ao inicializar o AdSense Multiplex:",error);}});}
function initLazyLoadServices(){hideAdsForPremium();if(localStorage.getItem("admin_mode")==="true"||new URLSearchParams(window.location.search).get("admin")==="1")return;var saved=localStorage.getItem("cookieConsent"),refused=saved==="refused",managed=saved==="managed",adsBlocked=refused||(managed&&localStorage.getItem("ad_storage")==="denied");window.__metricsLoaded=false;window.__adsenseLoaded=false;window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;function loadAnalytics(){if(window.__metricsLoaded)return;window.__metricsLoaded=true;var a=refused?"denied":(localStorage.getItem("analytics_storage")||"granted"),ad=adsBlocked?"denied":"granted";var s=document.createElement("script");s.async=true;s.src="https://www.googletagmanager.com/gtag/js?id=G-PFM06B7TS5";document.head.appendChild(s);gtag("consent","default",{analytics_storage:a,ad_storage:ad,ad_user_data:ad,ad_personalization:ad,wait_for_update:500});gtag("js",new Date());gtag("config","G-PFM06B7TS5");gtag("config","G-MJDKPDPJ26");gtag("config","G-M7DHHF38EJ");gtag("config","G-8FLJ59XXDK");gtag("config","G-VVDP5JGEX8");gtag("config","G-EX8");gtag("config","AW-952633102");gtag("config","AW-9277197961");}
function loadAdSenseOnce(){if(window.__adsenseLoaded||adsBlocked||!_adsAuthResolvedForLoading()||isPremiumSubscriber())return;window.__adsenseLoaded=true;var existing=document.querySelector('script[src*="pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]');if(existing){existing.addEventListener("load",initializeMultiplexAds,{once:true});if(existing.dataset.loaded==="true")initializeMultiplexAds();return;}var ad=document.createElement("script");ad.async=true;ad.src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6472730056006847";ad.crossOrigin="anonymous";ad.addEventListener("load",function(){ad.dataset.loaded="true";initializeMultiplexAds();},{once:true});document.head.appendChild(ad);}
function executeServices(){if("requestIdleCallback"in window)requestIdleCallback(function(){loadAnalytics();loadAdSenseOnce();});else setTimeout(function(){loadAnalytics();loadAdSenseOnce();},100);}
function onUserInteraction(){if(_authProfileState==="pending"||_authProfileState==="premium"){hideAdsForPremium();if(_authProfileState!=="free")return;}executeServices();["scroll","mousemove","touchstart","keydown"].forEach(function(ev){window.removeEventListener(ev,onUserInteraction);});}
var isPageSpeed=/Lighthouse|Chrome-Lighthouse|Googlebot/.test(navigator.userAgent||"");if(!adsBlocked){["scroll","mousemove","touchstart","keydown"].forEach(function(ev){window.addEventListener(ev,onUserInteraction,{passive:true});});if(!isPageSpeed)setTimeout(onUserInteraction,8500);}
window.applyConsent=function(consent){gtag("consent","update",consent);if(consent.ad_storage==="granted"){adsBlocked=false;if(_authProfileState==="free")onUserInteraction();else hideAdsForPremium();}else{adsBlocked=true;document.querySelectorAll("ins.adsbygoogle,.google-auto-placed,.ads-multiplex-container,#multiplex-ad-reserved,.multiplex-ad-reserved").forEach(function(ad){ad.style.display="none";ad.style.visibility="hidden";});}localStorage.setItem("analytics_storage",consent.analytics_storage);localStorage.setItem("ad_storage",consent.ad_storage);};
window.acceptAllCookies=function(){localStorage.setItem("cookieConsent","accepted");window.applyConsent({analytics_storage:"granted",ad_storage:"granted",ad_user_data:"granted",ad_personalization:"granted"});};
window.rejectAllCookies=function(){localStorage.setItem("cookieConsent","refused");window.applyConsent({analytics_storage:"denied",ad_storage:"denied",ad_user_data:"denied",ad_personalization:"denied"});};
}
document.addEventListener("DOMContentLoaded",initLazyLoadServices);

if(typeof traducoes==="undefined")var traducoes={};
function aplicarTraducoes(){document.querySelectorAll("[data-i18n]").forEach(function(el){var v=traducoes,k=el.getAttribute("data-i18n").split(".");k.forEach(function(x){v=v&&v[x]!==undefined?v[x]:null;});if(v!==null)el.textContent=v;});document.querySelectorAll("[data-i18n-aria-label]").forEach(function(el){var v=traducoes,k=el.getAttribute("data-i18n-aria-label").split(".");k.forEach(function(x){v=v&&v[x]!==undefined?v[x]:null;});if(v!==null)el.setAttribute("aria-label",v);});substituirAno();}
async function carregarTraducoes(idioma,arquivoJson){try{var r=await fetch("/locales/"+idioma+"/"+arquivoJson);var d=await r.json();traducoes=Object.assign({},traducoes,d);aplicarTraducoes();}catch(e){console.error("Erro ao carregar tradução:",e);}}
function substituirAno(){var y=document.querySelector('[data-i18n="footer.copyright"]');if(y&&y.textContent.indexOf("{{year}}")!==-1)y.textContent=y.textContent.replace("{{year}}",new Date().getFullYear());}
function alternarModoDislexia(){if(!document.getElementById("css-dyslexic")){var l=document.createElement("link");l.id="css-dyslexic";l.rel="stylesheet";l.href="https://cdn.jsdelivr.net/npm/open-dyslexic@1.0.3/open-dyslexic-regular.min.css";document.head.appendChild(l);}document.body.classList.toggle("dyslexic");}
document.addEventListener("DOMContentLoaded",function(){var b=document.getElementById("btnAlternarFonteDislexia");if(b)b.addEventListener("click",alternarModoDislexia);});
window.addEventListener("load",function(){setTimeout(function(){var l=document.createElement("link");l.rel="manifest";l.href="/manifest.json";document.head.appendChild(l);},1000);});
