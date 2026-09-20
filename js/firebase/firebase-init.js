/**
 * js/firebase/firebase-init.js
 *
 * Firebase is used only for Authentication.
 * Application data is stored centrally in Supabase PostgreSQL.
 */
(function(window){
  "use strict";
  const firebaseConfig={
    apiKey:"AIzaSyAbWwuA8pq6bTI9T8ht5f-X65yMbw6iQ_I",
    authDomain:"calculadoras-enfermagem.firebaseapp.com",
    projectId:"calculadoras-enfermagem",
    storageBucket:"calculadoras-enfermagem.firebasestorage.app",
    messagingSenderId:"347635150774",
    appId:"1:347635150774:web:0f551e74c172b7187fdb17",
    measurementId:"G-HPQZ0RWCNH"
  };
  let _app=null,_auth=null,_loading=false,_loadPromise=null;
  const FIREBASE_APP_URL="https://www.gstatic.com/firebasejs/10.14.0/firebase-app-compat.js";
  const FIREBASE_AUTH_URL="https://www.gstatic.com/firebasejs/10.14.0/firebase-auth-compat.js";

  function loadScript(url,timeoutMs){
    return new Promise(function(resolve,reject){
      var existing=document.querySelector('script[src="'+url+'"]');
      if(existing){
        if(existing.dataset.firebaseLoaded==="1"){resolve();return;}
        var existingTimer=setTimeout(function(){reject(new Error("firebase_script_timeout"));},timeoutMs||10000);
        existing.addEventListener("load",function(){clearTimeout(existingTimer);existing.dataset.firebaseLoaded="1";resolve();},{once:true});
        existing.addEventListener("error",function(){clearTimeout(existingTimer);reject(new Error("firebase_script_load_failed"));},{once:true});
        return;
      }
      var script=document.createElement("script");
      script.src=url;script.async=true;
      var timer=setTimeout(function(){reject(new Error("firebase_script_timeout"));},timeoutMs||10000);
      script.onload=function(){clearTimeout(timer);script.dataset.firebaseLoaded="1";resolve();};
      script.onerror=function(){clearTimeout(timer);reject(new Error("firebase_script_load_failed"));};
      document.head.appendChild(script);
    });
  }

  async function initFirebase(){
    if(_app&&_auth)return{app:_app,auth:_auth};
    if(_loading&&_loadPromise)return _loadPromise;
    _loading=true;
    _loadPromise=(async function(){
      try{
        await loadScript(FIREBASE_APP_URL,10000);
        await loadScript(FIREBASE_AUTH_URL,10000);
        if(!window.firebase||!window.firebase.initializeApp)throw new Error("firebase_sdk_unavailable");
        _app=window.firebase.apps&&window.firebase.apps.length?window.firebase.app():window.firebase.initializeApp(firebaseConfig);
        _auth=window.firebase.auth();
        try{
          if(_auth&&_auth.setPersistence&&window.firebase.auth.Auth.Persistence.LOCAL){
            await Promise.race([
              _auth.setPersistence(window.firebase.auth.Auth.Persistence.LOCAL),
              new Promise(function(_,reject){setTimeout(function(){reject(new Error("firebase_persistence_timeout"));},5000);})
            ]);
            console.log("[Firebase] Persistência LOCAL do Auth configurada.");
          }
        }catch(e){console.warn("[Firebase] Persistência LOCAL indisponível:",e);}
        if(_auth&&_auth.useDeviceLanguage)_auth.useDeviceLanguage();
        console.log("[Firebase] Auth inicializado; banco de dados da aplicação: Supabase.");
        return{app:_app,auth:_auth};
      }catch(error){
        _loading=false;_loadPromise=null;console.error("[Firebase] Erro na inicialização:",error);throw error;
      }finally{_loading=false;}
    })();
    return _loadPromise;
  }

  function getAuthSync(){return _auth;}
  async function getFirestore(){throw new Error("Firestore removido do caminho de dados. Use Supabase account-data.");}
  function getDbSync(){return null;}

  window.FirebaseInit={init:initFirebase,getAuthSync:getAuthSync,getFirestore:getFirestore,getDbSync:getDbSync,config:firebaseConfig};
})(window);