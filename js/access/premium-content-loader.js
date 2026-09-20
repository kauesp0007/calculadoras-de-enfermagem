(function(){
  "use strict";
  var ENDPOINT="https://asjkftjfbkuuhilnqonx.supabase.co/functions/v1/premium-content";
  function pathKey(){return window.location.pathname.replace(/^\/+/, "");}
  function login(){
    if(typeof window.__ACCOUNT_LOGIN_URL==="function") window.location.replace(window.__ACCOUNT_LOGIN_URL(window.location.pathname+window.location.search+window.location.hash));
    else window.location.replace("/conta/login.html?returnUrl="+encodeURIComponent(window.location.pathname+window.location.search+window.location.hash));
  }
  function subscription(){
    if(typeof window.__ACCOUNT_PAGE_URL==="function") window.location.replace(window.__ACCOUNT_PAGE_URL("/conta/assinatura.html")+"&returnUrl="+encodeURIComponent(window.location.pathname+window.location.search+window.location.hash));
    else window.location.replace("/conta/assinatura.html?returnUrl="+encodeURIComponent(window.location.pathname+window.location.search+window.location.hash));
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
  async function load(){
    try{
      await waitAuth();
      var auth=window.Auth,user=auth&&auth.currentUser?auth.currentUser():null;
      if(!user){login();return;}
      if(!auth.hasPlan||!auth.hasPlan("premium")){subscription();return;}
      var token=await user.getIdToken(false);
      var res=await fetch(ENDPOINT+"?path="+encodeURIComponent(pathKey()),{headers:{Authorization:"Bearer "+token,Accept:"text/html"}});
      if(res.status===401){login();return;}
      if(res.status===403){subscription();return;}
      if(!res.ok) throw new Error("premium_content_"+res.status);
      var html=await res.text();
      if(!/^\s*<!doctype html/i.test(html)&&!/^\s*<html[\s>]/i.test(html)) throw new Error("invalid_premium_document");
      document.open();document.write(html);document.close();
    }catch(e){
      console.error("[PremiumContent] protected content unavailable",e);
      subscription();
    }
  }
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",load,{once:true}); else load();
})();