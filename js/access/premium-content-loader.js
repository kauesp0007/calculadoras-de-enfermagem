(function(){
  "use strict";
  var ENDPOINT="https://asjkftjfbkuuhilnqonx.supabase.co/functions/v1/premium-content";
  var MAX_ATTEMPTS=3;
  var AUTH_SCRIPTS=[
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
  function pathKey(){
    var parts=window.location.pathname.replace(/^\/+/, "").split("/").filter(Boolean);
    var langs={en:1,es:1,fr:1,it:1,de:1,hi:1,zh:1,ja:1,ru:1,ko:1,tr:1,nl:1,pl:1,sv:1,id:1,vi:1,uk:1,ar:1};
    if(parts.length>1&&langs[parts[0]]) parts.shift();
    return parts.join("/");
  }
  function returnUrl(){return window.location.pathname+window.location.search+window.location.hash;}
  function login(){
    var u=returnUrl();
    if(typeof window.__ACCOUNT_LOGIN_URL==="function") window.location.replace(window.__ACCOUNT_LOGIN_URL(u));
    else window.location.replace("/conta/login.html?returnUrl="+encodeURIComponent(u));
  }
  function subscription(){
    var u=encodeURIComponent(returnUrl());
    if(typeof window.__ACCOUNT_PAGE_URL==="function") window.location.replace(window.__ACCOUNT_PAGE_URL("/conta/assinatura.html")+"&returnUrl="+u);
    else window.location.replace("/conta/assinatura.html?returnUrl="+u);
  }
  function showError(message){
    document.body.innerHTML='<main style="min-height:70vh;display:flex;align-items:center;justify-content:center;padding:24px;font-family:Arial,sans-serif"><section style="max-width:620px;text-align:center"><h1>Conteúdo temporariamente indisponível</h1><p>'+message+'</p><button id="premium-retry" type="button">Tentar novamente</button></section></main>';
    var b=document.getElementById("premium-retry");if(b)b.addEventListener("click",load,{once:true});
  }
  function loadScript(src){
    return new Promise(function(resolve,reject){
      var existing=document.querySelector('script[src="'+src+'"]');
      if(existing){
        if(existing.dataset&&existing.dataset.premiumAuthLoaded==="true"){resolve();return;}
        existing.addEventListener("load",function(){resolve();},{once:true});
        existing.addEventListener("error",function(){reject(new Error("auth_script_load_failed:"+src));},{once:true});
        return;
      }
      var script=document.createElement("script");
      script.src=src;
      script.async=false;
      script.dataset.premiumAuthLoader="true";
      script.addEventListener("load",function(){
        if(script.dataset)script.dataset.premiumAuthLoaded="true";
        resolve();
      },{once:true});
      script.addEventListener("error",function(){reject(new Error("auth_script_load_failed:"+src));},{once:true});
      document.head.appendChild(script);
    });
  }
  async function ensureAuth(){
    // O global-scripts.js expõe um bootstrap único para toda a aplicação.
    // Premium deve reutilizar essa promessa em vez de iniciar uma segunda cadeia
    // concorrente de Firebase/Auth.
    if(typeof window.__ENSURE_AUTH==="function"){
      await window.__ENSURE_AUTH();
      return;
    }
    if(window.Auth&&typeof window.Auth.init==="function"){
      await window.Auth.init();
      return;
    }
    for(var i=0;i<AUTH_SCRIPTS.length;i++){
      if(window.Auth&&typeof window.Auth.init==="function")break;
      await loadScript(AUTH_SCRIPTS[i]);
    }
    if(!window.Auth||typeof window.Auth.init!=="function") throw new Error("auth_bootstrap_failed");
    await window.Auth.init();
  }
  async function request(token){
    return fetch(ENDPOINT+"?path="+encodeURIComponent(pathKey()),{
      headers:{Authorization:"Bearer "+token,Accept:"text/html"},
      cache:"no-store"
    });
  }
  async function waitForBillingResolution(auth){
    if(!auth||typeof auth.billingStatus!=="function") return null;
    for(var i=0;i<100;i++){
      var status=auth.billingStatus();
      if(status&&status.resolved) return status;
      await new Promise(function(resolve){setTimeout(resolve,100);});
    }
    return auth.billingStatus();
  }
  async function load(){
    try{
      await ensureAuth();
      var auth=window.Auth,user=auth&&auth.currentUser?auth.currentUser():null;
      if(!user){login();return;}

      // Auth.init() conclui a identidade Firebase antes de terminar a hidratação
      // comercial. Aguarde o billing-access resolver o plano para que um usuário
      // Premium jamais seja tratado provisoriamente como Free.
      var billing=await waitForBillingResolution(auth);
      if(!billing||!billing.resolved){
        showError("Não foi possível concluir a verificação do plano. Sua assinatura não foi alterada.");
        return;
      }
      if(billing.unavailable){
        showError("O serviço de assinatura está temporariamente indisponível. Sua assinatura não foi alterada.");
        return;
      }

      var token=await user.getIdToken(false);
      var res=await request(token);
      if(res.status===401){
        token=await user.getIdToken(true);
        res=await request(token);
      }
      if(res.status===403){
        // 403 só deve virar redirecionamento quando o estado comercial
        // resolvido disser explicitamente que a conta é Free.
        billing=auth.billingStatus();
        if(billing&&billing.resolved&&billing.plan==="premium"){
          if(typeof auth.refreshProfile==="function"){
            try{
              await auth.refreshProfile();
              token=await user.getIdToken(true);
              res=await request(token);
            }catch(_){}
          }
          if(res.status===403){
            showError("Seu acesso Premium foi reconhecido, mas o conteúdo protegido não foi entregue pelo serviço. Tente novamente.");
            return;
          }
        }else{
          subscription();
          return;
        }
      }
      if(res.status>=500){
        for(var attempt=2;attempt<=MAX_ATTEMPTS&&res.status>=500;attempt++){
          await new Promise(function(resolve){setTimeout(resolve,500*attempt);});
          res=await request(await user.getIdToken(false));
        }
      }
      if(res.status===401){login();return;}
      if(res.status===403){
        var finalBilling=auth.billingStatus?auth.billingStatus():null;
        if(finalBilling&&finalBilling.resolved&&finalBilling.plan==="premium"){
          showError("Seu acesso Premium foi reconhecido, mas o conteúdo protegido não foi entregue pelo serviço. Tente novamente.");
        }else{
          subscription();
        }
        return;
      }
      if(res.status===404) throw new Error("premium_content_404");
      if(!res.ok) throw new Error("premium_content_"+res.status);
      var html=await res.text();
      if(!/^\s*<!doctype html/i.test(html)&&!/^\s*<html[\s>]/i.test(html)) throw new Error("invalid_premium_document");
      // O catálogo protegido pode conter resíduos do shell público de versões
      // anteriores. Removê-los aqui evita recursão do próprio loader após o
      // document.write e garante que o documento final seja o conteúdo real.
      html=html
        .replace(/<script[^>]+src=["'][^"']*premium-content-loader\.js(?:\?[^"']*)?["'][^>]*><\/script>/gi,"")
        .replace(/<div[^>]+id=["']premium-content-placeholder["'][^>]*>[\s\S]*?<\/div>/gi,"");
      document.open();document.write(html);document.close();
    }catch(e){
      console.error("[PremiumContent] protected content unavailable",e);
      var msg=e&&e.message==="premium_content_404"
        ?"A página Premium não foi encontrada no catálogo protegido. Nenhuma cobrança foi afetada."
        :"Não foi possível validar sua assinatura neste momento. Sua assinatura não foi cancelada.";
      showError(msg);
    }
  }
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",load,{once:true}); else load();
})();