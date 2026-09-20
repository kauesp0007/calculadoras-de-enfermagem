/**
 * Canonical user profile service.
 * Firebase provides identity; Supabase PostgreSQL stores application data.
 */
(function(window){
  "use strict";
  window.AuthModules=window.AuthModules||{};

  function emit(event,payload){if(window.AuthModules.userEvents)window.AuthModules.userEvents.emit(event,payload);}
  function cache(profile){if(window.AuthModules.userCache)window.AuthModules.userCache.set(profile);if(window.AuthModules.session)window.AuthModules.session.persistProfile(profile);}
  function ensureShape(profile,uid){
    var out=Object.assign({},profile||{});
    out.uid=out.uid||uid;
    out.permissions=out.permissions||{canAccessPremium:false,canDownload:false,canViewCertificates:false,canSaveFavorites:true,canViewHistory:true,role:"user"};
    out.preferences=window.AuthModules.preferences?window.AuthModules.preferences.normalize(out.preferences):{};
    return out;
  }

  async function loadProfile(uid){
    if(!uid)return null;
    var service=window.AuthModules.accountData||window.AuthModules.firestoreUser;
    if(!service||!service.getProfile&&!service.getUserDoc)throw new Error("account_data_module_unavailable");
    var profile=service.getProfile?await service.getProfile(uid):await service.getUserDoc(uid);
    profile=ensureShape(profile,uid);
    cache(profile);
    emit(window.AuthModules.userEvents.EVENTS.PROFILE_LOADED,profile);
    return profile;
  }

  async function updateProfile(uid,updates){
    if(!uid||!updates)return null;
    var service=window.AuthModules.accountData||window.AuthModules.firestoreUser;
    var updated=service&&service.updateProfile?await service.updateProfile(uid,updates):await service.updateUserDoc(uid,updates);
    var profile=ensureShape(updated||Object.assign({},window.AuthModules.userCache&&window.AuthModules.userCache.get()||{},updates),uid);
    cache(profile);
    emit(window.AuthModules.userEvents.EVENTS.PROFILE_UPDATED,profile);
    return profile;
  }

  async function createProfile(user){
    if(!user)return null;
    var service=window.AuthModules.accountData||window.AuthModules.firestoreUser;
    var data={
      uid:user.uid,email:user.email||"",displayName:user.displayName||"",photoURL:user.photoURL||"",
      provider:user.providerData&&user.providerData[0]?user.providerData[0].providerId:"email",
      language:(window.AccountI18n&&window.AccountI18n.getLanguage?window.AccountI18n.getLanguage():"pt-BR").replace("-BR",""),
      country:"BR",
      preferences:window.AuthModules.preferences?window.AuthModules.preferences.getDefaults():{}
    };
    var profile=service&&service.createUserDoc?await service.createUserDoc(user.uid,data):data;
    profile=ensureShape(profile,user.uid);cache(profile);emit(window.AuthModules.userEvents.EVENTS.PROFILE_UPDATED,profile);return profile;
  }

  window.AuthModules.userProfile={loadProfile:loadProfile,updateProfile:updateProfile,createProfile:createProfile};
  console.log("[Auth] Perfil centralizado no Supabase.");
})(window);