(function(global){
  "use strict";
  function t(key,fallback){try{return global.AccountI18n&&typeof global.AccountI18n.t==="function"?global.AccountI18n.t(key):fallback;}catch(_){return fallback;}}
  function setAttr(id,attrs){var el=document.getElementById(id);if(!el)return;Object.keys(attrs).forEach(function(k){el.setAttribute(k,attrs[k]);});}
  function style(){
    if(document.getElementById("account-a11y-style"))return;
    var s=document.createElement("style");s.id="account-a11y-style";
    s.textContent='html[dir="rtl"] .text-left{text-align:right!important}html[dir="rtl"] .text-right{text-align:left!important}.account-save-state-spacer{margin-inline-end:auto!important}.account-a11y-message[role="alert"]{outline:none}@media (prefers-reduced-motion:reduce){html,html * ,html *::before,html *::after{scroll-behavior:auto!important;animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important}}:where(a,button,input,select,textarea,[tabindex]):focus-visible{outline:3px solid currentColor;outline-offset:3px}`';
    document.head.appendChild(s);
  }
  function setup(){
    style();
    var path=(global.location&&global.location.pathname||"");
    var cfg={login:{},perfil:{},configuracoes:{},favoritos:{},historico:{},assinatura:{}};
    var key=Object.keys(cfg).find(function(k){return path.indexOf("/conta/"+k+".html")!==-1;});
    if(!key)return;

    setAttr("account-language-select",{"aria-label":t("siteLanguage","Idioma do site")});
    setAttr("professional-avatar",{"aria-label":t("selectPhoto","Selecionar foto")});
    setAttr("cal-prev",{"aria-label":t("previous","Anterior"),"title":t("previous","Anterior")});
    setAttr("cal-next",{"aria-label":t("next","Próxima"),"title":t("next","Próxima")});
    setAttr("history-prev",{"aria-label":t("previous","Anterior"),"title":t("previous","Anterior")});
    setAttr("history-next",{"aria-label":t("next","Próxima"),"title":t("next","Próxima")});
    setAttr("btn-clear-history",{"aria-label":t("deleteHistory","Excluir histórico")});
    setAttr("fav-search",{"aria-label":t("searchFavorites","Pesquisar favoritos")});
    setAttr("history-search",{"aria-label":t("searchHistory","Pesquisar histórico")});
    setAttr("btn-sair",{"aria-label":t("signOut","Sair da conta")});
    setAttr("btn-save-name",{"aria-label":t("saveName","Salvar nome")});
    setAttr("btn-save-settings",{"aria-label":t("savePreferences","Salvar preferências")});
    setAttr("btn-save-all",{"aria-label":t("savePreferences","Salvar todas as alterações")});
    setAttr("focus-status",{"role":"status","aria-live":"polite"});
    ["profile-message","settings-message","fav-message","history-message"].forEach(function(id){setAttr(id,{"role":"status","aria-live":"polite"});});
    ["profile-loading","settings-loading","fav-loading","history-loading"].forEach(function(id){setAttr(id,{"role":"status","aria-live":"polite"});});
    setAttr("settings-save-state",{"role":"status","aria-live":"polite"});
    setAttr("premium-status-chip",{"role":"status"});
    setAttr("dashboard-date-status",{"role":"status","aria-live":"polite"});
    if(key==="assinatura"){
      function labelBillingButtons(){Array.prototype.forEach.call(document.querySelectorAll("[data-kind]"),function(el){var kind=el.getAttribute("data-kind"),fallback=kind==="pix"?t("payment","Pagamento"):t("subscribeAction","Assinar");el.setAttribute("aria-label",fallback);});}
      labelBillingButtons();
      if(!global.__accountBillingA11yObserver){global.__accountBillingA11yObserver=new MutationObserver(labelBillingButtons);global.__accountBillingA11yObserver.observe(document.body,{subtree:true,childList:true});}
    }
    if(key==="login"){
      setAttr("auth-error",{"role":"alert","aria-live":"assertive"});
      setAttr("btn-google-login",{"aria-label":t("google","Continuar com Google")});
      setAttr("btn-microsoft-login",{"aria-label":t("microsoft","Continuar com Microsoft")});
      setAttr("btn-apple-login",{"aria-label":t("apple","Continuar com Apple")});
      setAttr("btn-email-submit",{"aria-label":t("signIn","Entrar")});
    }
    if(key==="configuracoes"){
      var saveState=document.getElementById("settings-save-state");if(saveState)saveState.classList.add("account-save-state-spacer");
      var avatarLabel=document.querySelector('label[for="professional-avatar"]');if(avatarLabel)avatarLabel.setAttribute("aria-label",t("selectPhoto","Selecionar foto"));
    }
    var langSelect=document.getElementById("setting-language");if(langSelect)langSelect.setAttribute("aria-label",t("siteLanguage","Idioma do site"));
    var fontSelect=document.getElementById("setting-fontsize");if(fontSelect)fontSelect.setAttribute("aria-label",t("fontSize","Tamanho da fonte"));
    var themeRadios=document.querySelectorAll('input[name="setting-theme"]');Array.prototype.forEach.call(themeRadios,function(el){el.setAttribute("aria-label",el.value==="dark"?t("dark","Escuro"):t("light","Claro"));});
    var newsletter=document.getElementById("setting-newsletter");if(newsletter)newsletter.setAttribute("aria-label",t("newsletter","Receber novidades"));
    var avatarFile=document.getElementById("professional-avatar");if(avatarFile)avatarFile.setAttribute("tabindex","0");
  }
  function refreshDynamicLabels(){
    setAttr("account-language-select",{"aria-label":t("siteLanguage","Idioma do site")});
    setAttr("cal-prev",{"aria-label":t("previous","Anterior"),"title":t("previous","Anterior")});
    setAttr("cal-next",{"aria-label":t("next","Próxima"),"title":t("next","Próxima")});
    setAttr("history-prev",{"aria-label":t("previous","Anterior"),"title":t("previous","Anterior")});
    setAttr("history-next",{"aria-label":t("next","Próxima"),"title":t("next","Próxima")});
    setAttr("btn-clear-history",{"aria-label":t("deleteHistory","Excluir histórico")});
    setAttr("fav-search",{"aria-label":t("searchFavorites","Pesquisar favoritos")});
    setAttr("history-search",{"aria-label":t("searchHistory","Pesquisar histórico")});
    Array.prototype.forEach.call(document.querySelectorAll(".favorite-actions a.action-btn"),function(el){el.setAttribute("title",t("openItem","Abrir item"));el.setAttribute("aria-label",t("openItem","Abrir item"));});
    Array.prototype.forEach.call(document.querySelectorAll(".favorite-actions button[data-remove]"),function(el){el.setAttribute("title",t("removeItem","Remover item"));el.setAttribute("aria-label",t("removeItem","Remover item"));});
    Array.prototype.forEach.call(document.querySelectorAll(".history-actions a.action-btn"),function(el){el.setAttribute("title",t("openItem","Abrir item"));el.setAttribute("aria-label",t("openItem","Abrir item"));});
    Array.prototype.forEach.call(document.querySelectorAll(".history-actions button[data-delete]"),function(el){el.setAttribute("title",t("removeItem","Remover item"));el.setAttribute("aria-label",t("removeItem","Remover item"));});
  }
  if(document.readyState==="loading"){document.addEventListener("DOMContentLoaded",setup,{once:true});document.addEventListener("conta:languagechange",refreshDynamicLabels);}else{setup();document.addEventListener("conta:languagechange",refreshDynamicLabels);}
})(window);