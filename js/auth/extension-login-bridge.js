(function(window){
"use strict";
var AUTH_URL="https://asjkftjfbkuuhilnqonx.supabase.co/functions/v1/extension-auth";

function validRedirect(value){
  try{
    var url=new URL(value);
    return url.protocol==="https:" &&
      /^[a-p]{32}\.chromiumapp\.org$/.test(url.hostname) &&
      url.pathname==="/gasometria-auth" &&
      !url.search && !url.hash;
  }catch(_){return false;}
}
function showError(message){
  var status=document.getElementById("bridge-status");
  var error=document.getElementById("bridge-error");
  if(status)status.textContent="Não foi possível conectar a extensão.";
  if(error){error.textContent=message;error.hidden=false;}
}
async function init(){
  var params=new URLSearchParams(window.location.search);
  var redirectUri=params.get("redirect_uri")||"";
  var codeChallenge=params.get("code_challenge")||"";
  var codeChallengeMethod=params.get("code_challenge_method")||"";
  if(!validRedirect(redirectUri)){showError("Destino da extensão inválido.");return;}
  if(!/^[A-Za-z0-9_-]{43}$/.test(codeChallenge)||codeChallengeMethod!=="S256"){
    showError("Verificação segura da extensão inválida.");return;
  }
  try{
    await window.Auth.init();
    if(!window.Auth.isLoggedIn()){
      var returnUrl=window.location.pathname+window.location.search;
      window.location.replace("/conta/login.html?returnUrl="+encodeURIComponent(returnUrl));
      return;
    }
    var user=window.Auth.currentUser();
    if(!user||typeof user.getIdToken!=="function")throw new Error("Sessão de login indisponível.");
    var token=await user.getIdToken(false);
    var response=await fetch(AUTH_URL,{
      method:"POST",
      headers:{"Authorization":"Bearer "+token,"Content-Type":"application/json","Accept":"application/json"},
      cache:"no-store",
      body:JSON.stringify({redirect_uri:redirectUri,code_challenge:codeChallenge,code_challenge_method:"S256"})
    });
    var data=await response.json().catch(function(){return{};});
    if(!response.ok||!data.code)throw new Error("Não foi possível autorizar a extensão.");
    document.getElementById("bridge-status").textContent="Conta verificada. Retornando à extensão…";
    window.location.replace(redirectUri+"#code="+encodeURIComponent(String(data.code)));
  }catch(e){
    showError(String(e&&e.message||"Falha ao verificar a conta."));
  }
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);
else init();
})(window);
