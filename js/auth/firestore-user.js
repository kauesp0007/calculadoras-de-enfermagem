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
  function mapProfile(p){
    if(!p)return null;
    var out=Object.assign({},p);
    out.displayName=out.display_name!==undefined?out.display_name:out.displayName;
    out.photoURL=out.photo_url!==undefined?out.photo_url:out.photoURL;
    out.createdAt=out.created_at!==undefined?out.created_at:out.createdAt;
    out.lastLoginAt=out.last_login_at!==undefined?out.last_login_at:out.lastLoginAt;
    delete out.display_name;delete out.photo_url;delete out.created_at;delete out.last_login_at;delete out.updated_at;
    return out;
  }
  async function getUserDoc(uid){if(!uid)return null;var d=await request("GET","profile");return mapProfile(d.profile||null);}
  async function createUserDoc(uid,data){if(!uid)throw new Error("uid_required");var d=await request("POST","profile",data);return mapProfile(d.profile||null);}
  async function updateUserDoc(uid,data){
    if(!uid||!data)return;
    var patch={};
    Object.keys(data).forEach(function(k){
      if(k.indexOf("preferences.")===0){patch.preferences=patch.preferences||{};patch.preferences[k.slice(13)]=data[k];}
      else patch[k]=data[k];
    });
    var d=await request("PATCH","profile",patch);return mapProfile(d.profile||null);
  }
  async function mergeUserDoc(uid,data){return updateUserDoc(uid,data);}
  window.AuthModules.accountData={request:request,getProfile:getUserDoc,updateProfile:updateUserDoc};
  window.AuthModules.firestoreUser={collection:"account_profiles",getUserDoc:getUserDoc,createUserDoc:createUserDoc,updateUserDoc:updateUserDoc,mergeUserDoc:mergeUserDoc,serverTimestamp:function(){return new Date();}};
  console.log("[Auth] Conta centralizada no Supabase.");
})(window);