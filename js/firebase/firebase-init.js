/**
 * js/firebase/firebase-init.js
 * 
 * RESPONSABILIDADE: Inicialização lazy do Firebase SDK.
 * 
 * Este arquivo é o ÚNICO ponto de configuração do Firebase no projeto.
 * Todas as chaves e configurações estão centralizadas aqui.
 * 
 * O SDK é carregado sob demanda (lazy loading) para não impactar
 * o desempenho das páginas que não utilizam autenticação.
 * 
 * ARQUITETURA:
 *   - Firebase App: inicializado uma única vez (singleton)
 *   - Firebase Auth: disponível via getAuth()
 *   - Firestore: disponível via getFirestore() (futuro)
 * 
 * USO:
 *   const { auth, db } = await initFirebase();
 */

(function (window) {
  "use strict";

  /**
   * Configuração do Firebase.
   * 
   * ⚠️  SEGURANÇA: Estas chaves são públicas por natureza (Firebase Web SDK).
   *     A segurança real está nas regras do Firestore e na configuração
   *     de domínios autorizados no console do Firebase.
   * 
   * 🔧  Para alterar o projeto: substitua este objeto inteiro.
   */
  const firebaseConfig = {
    apiKey: "AIzaSyAbWwuA8pq6bTI9T8ht5f-X65yMbw6iQ_I",
    authDomain: "calculadoras-enfermagem.firebaseapp.com",
    projectId: "calculadoras-enfermagem",
    storageBucket: "calculadoras-enfermagem.firebasestorage.app",
    messagingSenderId: "347635150774",
    appId: "1:347635150774:web:0f551e74c172b7187fdb17",
    measurementId: "G-HPQZ0RWCNH"
  };

  // ─── Estado interno ────────────────────────────────────────────
  /** @type {import("firebase/app").FirebaseApp|null} */
  let _app = null;

  /** @type {import("firebase/auth").Auth|null} */
  let _auth = null;

  /** @type {import("firebase/firestore").Firestore|null} */
  let _db = null;

  /** @type {boolean} */
  let _loading = false;

  /** @type {Promise<{app: object, auth: object}>|null} */
  let _loadPromise = null;

  // ─── Carregamento dinâmico dos scripts Firebase ─────────────────
  const FIREBASE_APP_URL =
    "https://www.gstatic.com/firebasejs/10.14.0/firebase-app-compat.js";
  const FIREBASE_AUTH_URL =
    "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth-compat.js";
  const FIREBASE_FIRESTORE_URL =
    "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore-compat.js";

  /**
   * Carrega um script externo sob demanda.
   * @param {string} url - URL do script.
   * @returns {Promise<void>}
   */
  function loadScript(url) {
    return new Promise(function (resolve, reject) {
      // Evita carregar o mesmo script duas vezes
      var existing = document.querySelector('script[src="' + url + '"]');
      if (existing) {
        resolve();
        return;
      }

      var script = document.createElement("script");
      script.src = url;
      script.async = true;
      script.onload = function () {
        resolve();
      };
      script.onerror = function () {
        reject(new Error("Falha ao carregar script Firebase: " + url));
      };
      document.head.appendChild(script);
    });
  }

  /**
   * Inicializa o Firebase SDK sob demanda (lazy loading).
   * 
   * Na primeira chamada, carrega os scripts e inicializa o app.
   * Chamadas subsequentes retornam a instância em cache imediatamente.
   * 
   * @returns {Promise<{app: object, auth: object}>}
   */
  async function initFirebase() {
    // Se já está inicializado, retorna imediatamente
    if (_app && _auth) {
      return { app: _app, auth: _auth };
    }

    // Se já está carregando, aguarda a promise existente
    if (_loading && _loadPromise) {
      return _loadPromise;
    }

    _loading = true;
    _loadPromise = (async function () {
      try {
        // 1. Carrega os scripts do Firebase
        await loadScript(FIREBASE_APP_URL);
        await loadScript(FIREBASE_AUTH_URL);
        await loadScript(FIREBASE_FIRESTORE_URL);

        // 2. Inicializa o Firebase App
        if (!window.firebase || !window.firebase.initializeApp) {
          throw new Error(
            "Firebase SDK não foi carregado corretamente. Verifique a conexão com a internet."
          );
        }

        _app = window.firebase.initializeApp(firebaseConfig);
        _auth = window.firebase.auth();

        // 3. Inicializa o Firestore (única fonte de dados do usuário)
        if (window.firebase.firestore) {
          _db = window.firebase.firestore();
          console.log("[Firebase] Firestore inicializado.");
        }

        // 4. Configura idioma da interface Firebase (emails, etc.)
        if (_auth && _auth.useDeviceLanguage) {
          _auth.useDeviceLanguage();
        }

        console.log("[Firebase] Inicializado com sucesso no projeto:", firebaseConfig.projectId);
        return { app: _app, auth: _auth };
      } catch (error) {
        _loading = false;
        _loadPromise = null;
        console.error("[Firebase] Erro na inicialização:", error);
        throw error;
      } finally {
        _loading = false;
      }
    })();

    return _loadPromise;
  }

  /**
   * Retorna a instância do Auth sem inicializar.
   * Útil para verificações síncronas (retorna null se não inicializado).
   * @returns {object|null}
   */
  function getAuthSync() {
    return _auth;
  }

  /**
   * Retorna a instância do Firestore, inicializando o Firebase se necessário.
   * Este é o único ponto de acesso ao Firestore no projeto.
   * @returns {Promise<object>} Instância do Firestore.
   */
  async function getFirestore() {
    if (_db) {
      return _db;
    }
    await initFirebase();
    if (!_db) {
      throw new Error(
        "Firestore não disponível. Verifique se o SDK Firestore foi carregado."
      );
    }
    return _db;
  }

  /**
   * Retorna a instância do Firestore sem inicializar.
   * @returns {object|null}
   */
  function getDbSync() {
    return _db;
  }

  // ─── Exportação para o escopo global ───────────────────────────
  window.FirebaseInit = {
    init: initFirebase,
    getAuthSync: getAuthSync,
    getFirestore: getFirestore,
    getDbSync: getDbSync,
    config: firebaseConfig
  };

})(window);
