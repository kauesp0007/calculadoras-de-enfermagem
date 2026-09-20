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

  function loadScript(url){
    return new Promise(function(resolve,reject){
      var existing=document.querySelector('script[src="'+url+'"]');
      if(existing){resolve();return;}
      var script=document.createElement("script");
      script.src=url;script.async=true;
      script.onload=resolve;
      script.onerror=function(){reject(new Error("Falha ao carregar script Firebase: "+url));};
      document.head.appendChild(script);
    });
  }

  async function initFirebase(){
    if(_app&&_auth)return{app:_app,auth:_auth};
    if(_loading&&_loadPromise)return _loadPromise;
    _loading=true;
    _loadPromise=(async function(){
      try{
        await loadScript(FIREBASE_APP_URL);
        await loadScript(FIREBASE_AUTH_URL);
        if(!window.firebase||!window.firebase.initializeApp)throw new Error("Firebase SDK não foi carregado corretamente.");
        _app=window.firebase.apps&&window.firebase.apps.length?window.firebase.app():window.firebase.initializeApp(firebaseConfig);
        _auth=window.firebase.auth();
        try{
          if(_auth&&_auth.setPersistence&&window.firebase.auth.Auth.Persistence.LOCAL){
            await _auth.setPersistence(window.firebase.auth.Auth.Persistence.LOCAL);
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