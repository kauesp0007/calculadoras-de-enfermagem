/**
 * js/access/route-localizer.js
 * Centraliza URLs da área de conta preservando o idioma atual.
 * Também aplica correções defensivas de layout nas páginas de conta.
 */
(function (window) {
  "use strict";
  var LANGS = ["en","es","fr","de","it","hi","zh","ja","ru","ko","tr","nl","pl","sv","id","vi","uk","ar"];

  function normalizeLanguage(value) {
    var raw = String(value || "pt").trim().toLowerCase();
    return raw === "pt-br" || raw === "pt_br" ? "pt" : raw;
  }

  function currentLanguage() {
    try {
      if (window.AccountI18n && window.AccountI18n.getLanguage) return normalizeLanguage(window.AccountI18n.getLanguage());
    } catch (_) {}
    var params = new URLSearchParams(window.location.search || "");
    var fromQuery = params.get("lang");
    if (fromQuery) return normalizeLanguage(fromQuery);
    var match = (window.location.pathname || "").match(/^\/(en|es|fr|de|it|hi|zh|ja|ru|ko|tr|nl|pl|sv|id|vi|uk|ar)\//i);
    if (match) return normalizeLanguage(match[1]);
    return normalizeLanguage(window.__LANG || document.documentElement.lang || "pt");
  }

  function isInternational(language) { return LANGS.indexOf(normalizeLanguage(language)) !== -1; }

  function accountBase(language) {
    var lang = normalizeLanguage(language || currentLanguage());
    return isInternational(lang) ? "/" + lang + "/conta/" : "/conta/";
  }

  function accountUrl(page, language, query) {
    var file = page || "login.html";
    var lang = normalizeLanguage(language || currentLanguage());
    var params = new URLSearchParams(query || "");
    params.set("lang", lang === "pt" ? "pt-BR" : lang);
    var suffix = params.toString();
    return accountBase(lang) + file + (suffix ? "?" + suffix : "");
  }

  function injectAccountHotfixStyles() {
    var path = window.location.pathname || "";
    if (!/\/(?:[a-z]{2}\/)?conta\//i.test(path)) return;
    if (document.getElementById("account-route-layout-hotfix")) return;
    var style = document.createElement("style");
    style.id = "account-route-layout-hotfix";
    style.textContent = [
      "body{overflow-x:hidden}",
      "#global-header-container{min-height:100px!important;background:#fff!important;position:relative;z-index:50}",
      "#language-selector-placeholder{min-height:44px!important;position:relative;z-index:40}",
      "@media(max-width:1100px){header .desktop-nav>ul{gap:.35rem!important}header .desktop-nav>ul>li>a,header .desktop-nav>ul>li>button{font-size:10px!important;line-height:1.05!important;padding:.1rem 0!important;white-space:normal!important;max-width:86px!important;text-align:center!important;justify-content:center!important}}",
      ".dashboard-main{max-width:1600px!important;margin-left:auto!important;margin-right:auto!important;padding-top:.65rem!important}",
      ".dashboard-main .grid{gap:.7rem!important}",
      ".dashboard-main .space-y-4>:not([hidden])~:not([hidden]),.dashboard-main .space-y-5>:not([hidden])~:not([hidden]){margin-top:.7rem!important}",
      ".dashboard-main .dash-card,.dashboard-main .account-card,.dashboard-main .settings-card,.dashboard-main .history-card,.dashboard-main .dash-list-item,.dashboard-main .stat-card,.dashboard-main .secondary-dash{background:#fff!important;border:1.5px solid #879bb2!important;border-radius:16px!important;box-shadow:0 12px 30px rgba(15,23,42,.28),0 3px 8px rgba(15,23,42,.16)!important;opacity:1!important}",
      ".dashboard-main .dash-card:hover,.dashboard-main .account-card:hover,.dashboard-main .dash-list-item:hover{box-shadow:0 16px 38px rgba(15,23,42,.34),0 5px 12px rgba(15,23,42,.20)!important}",
      ".dashboard-main .dash-card p,.dashboard-main .dash-list-item p,.dashboard-main .account-card p{font-weight:700!important;line-height:1.25!important}",
      ".dashboard-main h2,.dashboard-main h3,.dashboard-main .career-value{font-weight:900!important;color:#173b71!important}",
      "#profile-hero{min-height:174px!important;border:1px solid rgba(255,255,255,.24)!important;box-shadow:0 18px 38px rgba(15,23,42,.30)!important}",
      "#profile-avatar{width:96px!important;height:96px!important;min-width:96px!important;min-height:96px!important;border-radius:20px!important;border:2px solid rgba(255,255,255,.48)!important;background:rgba(255,255,255,.13)!important;box-shadow:0 12px 24px rgba(0,0,0,.28)!important;overflow:hidden!important}",
      "#profile-avatar img{width:100%!important;height:100%!important;object-fit:cover!important;display:block!important}",
      "#premium-status-chip.is-premium-active,.premium-active-glow{color:#4b3100!important;background:linear-gradient(120deg,#9f6b00,#ffe27a,#fff6b8,#c58a00)!important;background-size:220% 100%!important;border:1px solid rgba(255,232,132,.95)!important;text-shadow:0 0 8px rgba(255,244,176,.7)!important;box-shadow:0 0 0 1px rgba(255,237,153,.35),0 0 16px rgba(255,206,64,.55),inset 0 1px 0 rgba(255,255,255,.55)!important}",
      ".filter-control,.field-input,input:not([type=checkbox]):not([type=radio]):not([type=file]):not([type=submit]):not([type=button]),select,textarea{border:2px solid #879bb2!important;border-radius:11px!important;box-shadow:0 4px 14px rgba(15,23,42,.18),inset 0 0 0 1px #fff!important}",
      "@media(max-width:760px){#profile-avatar{width:78px!important;height:78px!important;min-width:78px!important;min-height:78px!important}.dashboard-main{padding-left:1rem!important;padding-right:1rem!important}}"
    ].join("\n");
    document.head.appendChild(style);
  }

  function localizeAccountLinks() {
    var path = window.location.pathname || "";
    if (!/\/(?:[a-z]{2}\/)?conta\//i.test(path)) return;
    var lang = currentLanguage();
    var pages = ["login.html", "perfil.html", "configuracoes.html", "favoritos.html", "historico.html", "assinatura.html", "boas_vindas_assinante.html"];
    document.querySelectorAll("a[href]").forEach(function (a) {
      var href = a.getAttribute("href") || "";
      var clean = href.split("?")[0];
      var page = pages.filter(function (p) { return clean === "/conta/" + p || clean === p || clean.slice(-("/conta/" + p).length) === "/conta/" + p; })[0];
      if (!page) return;
      a.setAttribute("href", accountUrl(page, lang, href.indexOf("?") >= 0 ? href.split("?")[1] : ""));
    });
  }

  function syncPremiumChip() {
    var chip = document.getElementById("premium-status-chip");
    if (!chip) return;
    var text = (chip.textContent || "").toLowerCase();
    var active = /(premium|ativo|active|actif|activo|activa|attivo|aktiv|actief|aktyw|有效|有効|활성|aktif)/i.test(text) && !/(free|gratuito|inativo|inactive|expired|expirado|vencido)/i.test(text);
    chip.classList.toggle("is-premium-active", active);
  }

  function initAccountHotfixes() {
    injectAccountHotfixStyles();
    localizeAccountLinks();
    syncPremiumChip();
    if (window.MutationObserver) {
      var mo = new MutationObserver(function () { syncPremiumChip(); });
      var chip = document.getElementById("premium-status-chip");
      if (chip) mo.observe(chip, { childList: true, subtree: true, characterData: true, attributes: true });
    }
  }

  window.AccountRoutes = {
    currentLanguage: currentLanguage,
    normalizeLanguage: normalizeLanguage,
    isInternational: isInternational,
    accountUrl: accountUrl,
    accountBase: accountBase,
    applyAccountHotfixes: initAccountHotfixes
  };

  injectAccountHotfixStyles();
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initAccountHotfixes);
  else initAccountHotfixes();
})(window);
