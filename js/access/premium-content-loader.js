(function(){
  "use strict";
  var ENDPOINT="https://asjkftjfbkuuhilnqonx.supabase.co/functions/v1/premium-content";
  var MAX_ATTEMPTS=3;
  function pathKey(){return window.location.pathname.replace(/^\/+/, "");}
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
  function showError(){
    document.body.innerHTML='<main style="min-height:70vh;display:flex;align-items:center;justify-content:center;padding:24px;font-family:Arial,sans-serif"><section style="max-width:620px;text-align:center"><h1>Conteúdo temporariamente indisponível</h1><p>Não foi possível validar sua assinatura neste momento. Sua assinatura não foi cancelada.</p><button id="premium-retry" type="button">Tentar novamente</button></section></main>';
    var b=document.getElementById("premium-retry");if(b)b.addEventListener("click",load,{once:true});
  }
  function waitAuth(){
    if(window.Auth&&window.Auth.isInitialized&&window.Auth.isInitialized()) return Promise.resolve();
    return new Promise(function(resolve){
      var done=false,finish=function(){if(!done){done=true;resolve();}};
      if(window.Auth&&window.Auth.onAuthChange) window.Auth.onAuthChange(finish);
      if(window.Auth&&window.Auth.onProfileChange) window.Auth.onProfileChange(finish);
      var timer=setInterval(function(){if(window.Auth&&window.Auth.isInitialized&&window.Auth.isInitialized()){clearInterval(timer);finish();}},50);
      setTimeout(function(){clearInterval(timer);finish();},10000);
    });
  }
  async function request(token){
    return fetch(ENDPOINT+"?path="+encodeURIComponent(pathKey()),{headers:{Authorization:"Bearer "+token,Accept:"text/html"},cache:"no-store"});
  }
  async function load(){
    try{
      await waitAuth();
      var auth=window.Auth,user=auth&&auth.currentUser?auth.currentUser():null;
      if(!user){login();return;}
      if(auth.refreshProfile) { try { await auth.refreshProfile(); } catch(e) { console.warn("[PremiumContent] billing refresh failed",e); } }
      if(!auth.hasPlan||!auth.hasPlan("premium")){subscription();return;}
      var token=await user.getIdToken(false);
      var res=await request(token);
      if(res.status===401){
        token=await user.getIdToken(true);
        res=await request(token);
      }
      if(res.status===403){subscription();return;}
      if(res.status>=500){
        for(var attempt=2;attempt<=MAX_ATTEMPTS && res.status>=500;attempt++){
          await new Promise(function(resolve){setTimeout(resolve,500*attempt);});
          res=await request(await user.getIdToken(false));
        }
      }
      if(res.status===401){login();return;}
      if(res.status===403){subscription();return;}
      if(!res.ok) throw new Error("premium_content_"+res.status);
      var html=await res.text();
      if(!/^\s*<!doctype html/i.test(html)&&!/^\s*<html[\s>]/i.test(html)) throw new Error("invalid_premium_document");
      document.open();document.write(html);document.close();
    }catch(e){
      console.error("[PremiumContent] protected content unavailable",e);
      showError();
    }
  }
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",load,{once:true}); else load();
})();