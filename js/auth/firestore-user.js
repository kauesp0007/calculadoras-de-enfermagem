/**
 * Compatibility facade kept at the historical path.
 * Canonical account data is now Supabase PostgreSQL through account-data.
 */
(function(window){
  "use strict";
  window.AuthModules=window.AuthModules||{};
  var URL="https://asjkftjfbkuuhilnqonx.supabase.co/functions/v1/account-data";
  async function request(method,resource,body,query){
    var user=window.Auth&&window.Auth.currentUser?window.Auth.currentUser():null;
    if(!user) throw new Error("not_authenticated");
    var token=await user.getIdToken(false);
    var qs=new URLSearchParams(Object.assign({resource:resource},query||{})).toString();
    var res=await fetch(URL+"?"+qs,{method:method,headers:{Authorization:"Bearer "+token,Accept:"application/json","Content-Type":"application/json"},body:body===undefined?undefined:JSON.stringify(body),cache:"no-store"});
    var data=await res.json().catch(function(){return{};});
    if(!res.ok) throw new Error(data.error||("account_data_"+res.status));
    return data;
  }
  async function getUserDoc(uid){if(!uid)return null;var d=await request("GET","profile");return d.profile||null;}
  async function createUserDoc(uid,data){if(!uid)throw new Error("uid_required");var d=await request("POST","profile",data);return d.profile||null;}
  async function updateUserDoc(uid,data){
    if(!uid||!data)return;
    var patch={};
    Object.keys(data).forEach(function(k){
      if(k.indexOf("preferences.")===0){patch.preferences=patch.preferences||{};patch.preferences[k.slice(13)]=data[k];}
      else patch[k]=data[k];
    });
    var d=await request("PATCH","profile",patch);return d.profile||null;
  }
  async function mergeUserDoc(uid,data){return updateUserDoc(uid,data);}
  window.AuthModules.accountData={request:request,getProfile:getUserDoc,updateProfile:updateUserDoc};
  window.AuthModules.firestoreUser={collection:"account_profiles",getUserDoc:getUserDoc,createUserDoc:createUserDoc,updateUserDoc:updateUserDoc,mergeUserDoc:mergeUserDoc,serverTimestamp:function(){return new Date();}};
  console.log("[Auth] Conta centralizada no Supabase.");
})(window);