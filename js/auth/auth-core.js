/** Canonical account facade.
 * Authentication remains Firebase during the controlled migration.
 * Billing/access authority is Supabase via billing-access.
 */
(function(window){
 "use strict";
 window.AuthModules=window.AuthModules||{};
 var _initialized=false,_initPromise=null,_currentUser=null,_userProfile=null,_listeners=[],_profileListeners=[];
 var _hydrationGeneration=0,_hydrationPromise=Promise.resolve();
 var _billing={plan:"free",premium_expires_at:null,provider:null,provider_customer_id:null,provider_subscription_id:null,billingUnavailable:false,resolved:false};
 var BILLING_ACCESS_URL="https://asjkftjfbkuuhilnqonx.supabase.co/functions/v1/billing-access";

 async function loadBilling(user){
   if(!user||typeof user.getIdToken!=="function") return {plan:"free"};
   var token=await user.getIdToken(false);
   var controller=new AbortController();
   var timeout=setTimeout(function(){controller.abort();},8000);
   var res;
   try{
     res=await fetch(BILLING_ACCESS_URL,{headers:{Authorization:"Bearer "+token,Accept:"application/json"},cache:"no-store",signal:controller.signal});
   }catch(e){
     if(e&&e.name==="AbortError") throw new Error("billing_access_timeout");
     throw e;
   }finally{clearTimeout(timeout);}
   if(!res.ok) throw new Error("billing_access_"+res.status);
   var data=await res.json();
   if(!data || (data.plan!=="premium" && data.plan!=="free")) throw new Error("billing_access_invalid_response");
   if(data.plan==="premium") return data;
   return {plan:"free",premium_expires_at:data.premium_expires_at||null,provider:data.provider||null,provider_customer_id:data.provider_customer_id||null,provider_subscription_id:data.provider_subscription_id||null};
 }
 function applyBilling(profile,billing){
   var p=Object.assign({},profile||{});
   p.plan=billing&&billing.plan==="premium"?"premium":(billing&&billing.plan==="verifying"?"verifying":"free");
   p.premiumExpiresAt=billing&&billing.premium_expires_at||null;
   p.billingProvider=billing&&billing.provider||null;
   p.billingCustomerId=billing&&billing.provider_customer_id||null;
   p.billingSubscriptionId=billing&&billing.provider_subscription_id||null;
   p.billingUnavailable=!!(billing&&billing.billingUnavailable);
   return p;
 }
 function billingStatus(){return {resolved:!!_billing.resolved,unavailable:!!_billing.billingUnavailable,plan:_billing.plan||"free",premium_expires_at:_billing.premium_expires_at||null};}
 function init(){
   if(_initialized) return Promise.resolve();
   if(_initPromise) return _initPromise;
   _initPromise=(async function(){
     var fb=await window.FirebaseInit.init(),auth=fb.auth;
     await new Promise(function(resolve){
       var done=false;
       function finish(){if(!done){done=true;resolve();}}
       function handle(user){
         var generation=++_hydrationGeneration;
         _currentUser=user||null;
         if(!user){
           _userProfile=null;
           _billing={plan:"free",premium_expires_at:null,provider:null,provider_customer_id:null,provider_subscription_id:null,billingUnavailable:false,resolved:true};
           _clearLocalCache();
           _notifyListeners(null);
           finish();
           return;
         }
         _billing={plan:"verifying",premium_expires_at:null,provider:null,provider_customer_id:null,provider_subscription_id:null,billingUnavailable:false,resolved:false};
         _userProfile=applyBilling({uid:user.uid,email:user.email||"",role:"user",displayName:user.displayName||"",photoURL:user.photoURL||""},_billing);
         _notifyProfileListeners(_userProfile);
         _notifyListeners(user);
         finish();
         _hydrationPromise=_hydrateUser(user,generation);
       }
       auth.onAuthStateChanged(handle);
       // onAuthStateChanged já entrega o estado atual ao registrar o listener.
       // Invocar handle(auth.currentUser) em paralelo criava duas hidratações
       // concorrentes de billing, permitindo que uma falha tardia substituísse
       // um estado Premium válido por "billingUnavailable".
       setTimeout(function(){
         if(!done){
           var fallback=auth.currentUser||null;
           if(fallback) handle(fallback);
           else {
             console.error("[Auth] Timeout ao aguardar o estado de autenticação.");
             _billing=Object.assign({},_billing,{billingUnavailable:true,resolved:true});
             finish();
           }
         }
       },5000);
     });
     try{await auth.getRedirectResult();}catch(e){if(e&&e.code!=="auth/no-redirect-result")console.warn("[Auth] redirect:",e);}
     _initialized=true;
   })().catch(function(e){_initPromise=null;throw e;});
   return _initPromise;
 }
 async function _hydrateUser(user,generation){
   if(!user)return;
   try{
     var billing=await loadBilling(user);
     if(generation!==_hydrationGeneration||!_currentUser||_currentUser.uid!==user.uid)return;
     _billing=Object.assign({},billing,{resolved:true,billingUnavailable:false});
   }catch(e){
     if(generation!==_hydrationGeneration||!_currentUser||_currentUser.uid!==user.uid)return;
     console.error("[Auth] Billing state unavailable; access resolution is pending.",e);
     _billing={plan:"verifying",premium_expires_at:null,provider:null,provider_customer_id:null,provider_subscription_id:null,billingUnavailable:true,resolved:true};
   }
   if(generation!==_hydrationGeneration||!_currentUser||_currentUser.uid!==user.uid)return;
   var base={uid:user.uid,email:user.email||"",role:"user",displayName:user.displayName||"",photoURL:user.photoURL||""};
   if(window.AuthModules.userProfile&&window.AuthModules.userProfile.loadProfile){
     try{
       var profile=await window.AuthModules.userProfile.loadProfile(user.uid);
       if(generation!==_hydrationGeneration||!_currentUser||_currentUser.uid!==user.uid)return;
       _userProfile=applyBilling(profile||base,_billing);
     }catch(e){
       if(generation!==_hydrationGeneration||!_currentUser||_currentUser.uid!==user.uid)return;
       _userProfile=applyBilling(_userProfile||base,_billing);
       console.warn("[Auth] Profile unavailable; retaining current account identity.",e);
     }
   }else{
     if(generation!==_hydrationGeneration||!_currentUser||_currentUser.uid!==user.uid)return;
     _userProfile=applyBilling(_userProfile||base,_billing);
   }
   if(generation===_hydrationGeneration&&_currentUser&&_currentUser.uid===user.uid){
     _notifyProfileListeners(_userProfile);
   }
 }
 function whenReady(){
   return init().then(function(){return _hydrationPromise||Promise.resolve();}).then(function(){return window.Auth;});
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
   var result=await p.signIn(options);
   var signedUser=result&&result.user?result.user:_currentUser;
   if(signedUser&&(!_currentUser||_currentUser.uid!==signedUser.uid)){
     _currentUser=signedUser;
     _billing={plan:"verifying",premium_expires_at:null,provider:null,provider_customer_id:null,provider_subscription_id:null,billingUnavailable:false,resolved:false};
     _userProfile=applyBilling({uid:signedUser.uid,email:signedUser.email||"",role:"user",displayName:signedUser.displayName||"",photoURL:signedUser.photoURL||""},_billing);
     _notifyProfileListeners(_userProfile);
     _notifyListeners(signedUser);
     // A mudança de autenticação será processada pelo onAuthStateChanged.
   }
   return result;
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
   var user=_currentUser;
   var generation=++_hydrationGeneration;
   var billing=await loadBilling(user);
   if(generation!==_hydrationGeneration||!_currentUser||_currentUser.uid!==user.uid)return _userProfile;
   _billing=Object.assign({},billing,{resolved:true,billingUnavailable:false});
   var p=window.AuthModules.userProfile&&window.AuthModules.userProfile.loadProfile?await window.AuthModules.userProfile.loadProfile(user.uid):_userProfile;
   if(generation!==_hydrationGeneration||!_currentUser||_currentUser.uid!==user.uid)return _userProfile;
   _userProfile=applyBilling(p||_userProfile||{},_billing);_notifyProfileListeners(_userProfile);return _userProfile;
 }
 window.Auth={init,whenReady,isLoggedIn,currentUser,profile,hasPlan,hasPermission,signIn,signOut,onAuthChange,onProfileChange,isInitialized:function(){return _initialized;},billingStatus:billingStatus,refreshProfile};
 window.AuthModules.core=window.Auth;
})(window);
