/** Canonical account facade.
 * Authentication remains Firebase during the controlled migration.
 * Billing/access authority is Supabase via billing-access.
 */
(function(window){
 "use strict";
 window.AuthModules=window.AuthModules||{};
 var _initialized=false,_currentUser=null,_userProfile=null,_listeners=[],_profileListeners=[];
 var _billing={plan:"free",premium_expires_at:null,provider:null,provider_customer_id:null,provider_subscription_id:null,billingUnavailable:false};
 var BILLING_ACCESS_URL="https://asjkftjfbkuuhilnqonx.supabase.co/functions/v1/billing-access";

 async function loadBilling(user){
   if(!user||typeof user.getIdToken!=="function") return {plan:"free"};
   var token=await user.getIdToken(false);
   var res=await fetch(BILLING_ACCESS_URL,{headers:{Authorization:"Bearer "+token,Accept:"application/json"},cache:"no-store"});
   if(!res.ok) throw new Error("billing_access_"+res.status);
   var data=await res.json();
   if(data&&data.plan==="premium") return data;
   return {plan:"free",premium_expires_at:data&&data.premium_expires_at||null,provider:null,provider_customer_id:null,provider_subscription_id:null};
 }
 function applyBilling(profile,billing){
   var p=Object.assign({},profile||{});
   p.plan=billing&&billing.plan==="premium"?"premium":"free";
   p.premiumExpiresAt=billing&&billing.premium_expires_at||null;
   p.billingProvider=billing&&billing.provider||null;
   p.billingCustomerId=billing&&billing.provider_customer_id||null;
   p.billingSubscriptionId=billing&&billing.provider_subscription_id||null;
   p.billingUnavailable=!!(billing&&billing.billingUnavailable);
   return p;
 }
 function billingStatus(){return {resolved:!!_billing.resolved,unavailable:!!_billing.billingUnavailable,plan:_billing.plan||"free",premium_expires_at:_billing.premium_expires_at||null};}
 async function init(){
   if(_initialized) return;
   var fb=await window.FirebaseInit.init(),auth=fb.auth;
   await new Promise(function(resolve){
     var done=false; function finish(){if(!done){done=true;resolve();}}
     auth.onAuthStateChanged(function(user){_handleAuthState(user);finish();});
     setTimeout(finish,5000);
   });
   auth.getRedirectResult().catch(function(e){if(e&&e.code!=="auth/no-redirect-result")console.warn("[Auth] redirect:",e);});
   _initialized=true;
 }
 async function _handleAuthState(user){
   _currentUser=user||null;
   if(!user){_userProfile=null;_billing={plan:"free",billingUnavailable:false,resolved:true};_clearLocalCache();_notifyListeners(null);return;}
   try{
     _billing=Object.assign({},await loadBilling(user),{resolved:true,billingUnavailable:false});
   }catch(e){
     console.error("[Auth] Billing state unavailable; access resolution is pending.",e);
     _billing={plan:"free",billingUnavailable:true,resolved:true};
   }
   var base={uid:user.uid,email:user.email||"",role:"user"};
   if(window.AuthModules.userProfile&&window.AuthModules.userProfile.loadProfile){
     try{
       var profile=await window.AuthModules.userProfile.loadProfile(user.uid);
       _userProfile=applyBilling(profile||base,_billing);
       _notifyProfileListeners(_userProfile);
     }catch(e){
       _userProfile=applyBilling(base,_billing);
       console.warn("[Auth] Profile unavailable; using minimal profile.",e);
       _notifyProfileListeners(_userProfile);
     }
   }else{
     _userProfile=applyBilling(base,_billing);
     _notifyProfileListeners(_userProfile);
   }
   _notifyListeners(user);
 }
 function onAuthChange(cb){if(typeof cb==="function")_listeners.push(cb);}
 function onProfileChange(cb){if(typeof cb==="function")_profileListeners.push(cb);}
 function _notifyListeners(user){_listeners.slice().forEach(function(cb){try{cb(user);}catch(e){console.error("[Auth] listener:",e);}});}
 function _notifyProfileListeners(p){_profileListeners.slice().forEach(function(cb){try{cb(p);}catch(e){console.error("[Auth] profile listener:",e);}});}
 function isLoggedIn(){return !!_currentUser;}
 function currentUser(){return _currentUser;}
 function profile(){return _userProfile;}
 function hasPlan(plan){if(plan!=="premium")return true;return !!(_billing.plan==="premium"&&(!_billing.premium_expires_at||new Date(_billing.premium_expires_at)>new Date()));}
 function hasPermission(permission){return !!(window.AuthorizationModules.permissionService&&window.AuthorizationModules.permissionService.has(_userProfile,permission));}
 async function signIn(providerName,options){
   if(!_initialized)await init();
   var p=window.AuthModules.providers&&window.AuthModules.providers.getProvider?window.AuthModules.providers.getProvider(providerName):null;
   if(!p)throw new Error("Provedor não disponível: "+providerName);
   return p.signIn(options);
 }
 async function signOut(){
   if(!_initialized)return;
   var auth=window.FirebaseInit.getAuthSync();if(auth)await auth.signOut();
   _currentUser=null;_userProfile=null;_billing={plan:"free",billingUnavailable:false};_clearLocalCache();
 }
 function _clearLocalCache(){
   if(window.AuthModules.session&&window.AuthModules.session.clearCache)window.AuthModules.session.clearCache();
   if(window.AuthModules.userCache&&window.AuthModules.userCache.clear)window.AuthModules.userCache.clear();
 }
 async function refreshProfile(){
   if(!_currentUser)return null;
   _billing=await loadBilling(_currentUser);
   var p=window.AuthModules.userProfile&&window.AuthModules.userProfile.loadProfile?await window.AuthModules.userProfile.loadProfile(_currentUser.uid):_userProfile;
   _userProfile=applyBilling(p||_userProfile||{},_billing);_notifyProfileListeners(_userProfile);return _userProfile;
 }
 window.Auth={init,isLoggedIn,currentUser,profile,hasPlan,hasPermission,signIn,signOut,onAuthChange,onProfileChange,isInitialized:function(){return _initialized;},billingStatus:billingStatus,refreshProfile};
 window.AuthModules.core=window.Auth;
})(window);
