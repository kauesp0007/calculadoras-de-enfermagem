/**
 * js/auth/auth-core.js
 * 
 * RESPONSABILIDADE: API pública centralizada de autenticação.
 * 
 * Este é o ÚNICO módulo que as páginas HTML devem importar para
 * qualquer funcionalidade relacionada a autenticação.
 * 
 * Ele atua como FACADE, delegando para os módulos especializados:
 *   - auth-session.js   → persistência e restauração de sessão
 *   - auth-permissions.js → verificação de permissões e planos
 *   - auth-providers.js  → fábrica de provedores de login
 * 
 * USO EM QUALQUER PÁGINA:
 *   <script src="/js/firebase/firebase-init.js"></script>
 *   <script src="/js/auth/auth-core.js"></script>
 *   <script>
 *     Auth.init().then(function() {
 *       if (Auth.isLoggedIn()) {
 *         var user = Auth.currentUser();
 *         console.log("Logado como:", user.displayName);
 *       }
 *       if (Auth.hasPlan("premium")) {
 *         // Mostra conteúdo premium
 *       }
 *     });
 *   </script>
 */

(function (window) {
  "use strict";

  // ─── Dependências ──────────────────────────────────────────────
  // Os módulos são carregados sequencialmente e registrados no window.AuthModules.
  // auth-core.js é o primeiro a ser carregado e cria o namespace.

  if (!window.AuthModules) {
    window.AuthModules = {};
  }

  // ─── Estado interno ────────────────────────────────────────────
  /** @type {boolean} */
  var _initialized = false;

  /** @type {object|null} */
  var _currentUser = null;

  /** @type {object|null} */
  var _userProfile = null;

  /** @type {string|null} */
  var _currentPlan = null;

  // ─── Inicialização ─────────────────────────────────────────────

  /**
   * Inicializa o sistema de autenticação.
   * 
   * Deve ser chamado UMA vez no carregamento da página.
   * Carrega o Firebase SDK e restaura a sessão anterior.
   * 
   * @returns {Promise<void>}
   */
  async function init() {
    if (_initialized) {
      return;
    }

    try {
      // 1. Inicializa o Firebase
      var fb = await window.FirebaseInit.init();
      var auth = fb.auth;

      // 2. Registra o listener permanente de estado da sessão e aguarda
      //    a restauração da sessão persistida (primeiro disparo do listener).
      //    Sem essa espera, isLoggedIn() retornaria false imediatamente após
      //    init(), causando redirect indevido para o login em páginas protegidas.
      await new Promise(function (resolve) {
        var resolved = false;
        function finish() {
          if (!resolved) {
            resolved = true;
            resolve();
          }
        }

        auth.onAuthStateChanged(function (user) {
          _handleAuthState(user);
          finish();
        });

        // Segurança: se o listener não disparar (ex.: problema de rede),
        // resolve após um timeout curto para não travar a página.
        setTimeout(finish, 5000);
      });

      // 3. Captura resultado de redirect (ex: popup bloqueado -> signInWithRedirect)
      auth.getRedirectResult().then(function (result) {
        if (result && result.user) {
          console.log("[Auth] Login via redirect bem-sucedido:", result.user.email || result.user.uid);
        }
      }).catch(function (error) {
        // Ignora erros esperados (ex: auth/no-redirect-result)
        if (error.code !== "auth/no-redirect-result") {
          console.error("[Auth] Erro no redirect:", error.code, error.message);
        }
      });

      _initialized = true;
    } catch (error) {
      console.error("[Auth] Falha na inicialização:", error);
      throw error;
    }
  }

  /**
   * Trata mudanças no estado de autenticação (login/logout).
   * Chamado pelo listener permanente, inclusive na restauração inicial.
   * @param {object|null} user
   */
  function _handleAuthState(user) {
    _currentUser = user;

    if (user) {
      console.log("[Auth] Usuário autenticado:", user.email || user.uid);
      // Carrega o perfil do Firestore (se disponível)
      if (window.AuthModules.userProfile && window.AuthModules.userProfile.loadProfile) {
        window.AuthModules.userProfile.loadProfile(user.uid).then(function (profile) {
          _userProfile = profile;
          _currentPlan = profile ? profile.plan : "free";
          _notifyProfileListeners(profile);
          _enforcePaidGate();
        }).catch(function () {
          // Perfil ainda não existe (usuário novo)
          _currentPlan = "free";
          _enforcePaidGate();
        });
      }
    } else {
      console.log("[Auth] Nenhum usuário autenticado.");
      _userProfile = null;
      _currentPlan = null;
      _clearLocalCache();
    }

    // Notifica listeners externos
    _notifyListeners(user);
  }

  // ─── Listeners de estado ────────────────────────────────────────
  /** @type {Array<function(object|null):void>} */
  var _listeners = [];

  /** @type {Array<function(object|null):void>} */
  var _profileListeners = [];

  /**
   * Registra um callback para mudanças no estado de autenticação.
   * @param {function(object|null):void} callback
   */
  function onAuthChange(callback) {
    if (typeof callback === "function") {
      _listeners.push(callback);
    }
  }

  /**
   * Notifica todos os listeners registrados.
   * @param {object|null} user
   */
  function _notifyListeners(user) {
    _listeners.forEach(function (cb) {
      try {
        cb(user);
      } catch (e) {
        console.error("[Auth] Erro em listener:", e);
      }
    });
  }

  /**
   * Registra um callback para mudanças no PERFIL do usuário (dados do Firestore).
   * Diferente de onAuthChange (estado de login), este dispara quando o perfil
   * carrega/atualiza (nome, foto, plano, preferências).
   * @param {function(object|null):void} callback
   */
  function onProfileChange(callback) {
    if (typeof callback === "function") {
      _profileListeners.push(callback);
    }
  }

  /**
   * Notifica todos os listeners de perfil.
   * @param {object|null} profile
   */
  function _notifyProfileListeners(profile) {
    _profileListeners.forEach(function (cb) {
      try {
        cb(profile);
      } catch (e) {
        console.error("[Auth] Erro em listener de perfil:", e);
      }
    });
  }

  // ─── API Pública ────────────────────────────────────────────────

  /**
   * Verifica se o usuário está autenticado.
   * @returns {boolean}
   */
  function isLoggedIn() {
    return _currentUser !== null && _currentUser !== undefined;
  }

  /**
   * Retorna o objeto do usuário atual.
   * @returns {object|null} Objeto Firebase User ou null.
   */
  function currentUser() {
    return _currentUser;
  }

  /**
   * Retorna o perfil completo do usuário (dados do Firestore).
   * @returns {object|null}
   */
  function profile() {
    return _userProfile;
  }

  /**
   * Verifica se o usuário possui um plano específico.
   * 
   * @param {string} planName - Nome do plano ("free", "junior") ou o alias "premium".
   * @returns {boolean}
   * 
   * USO:
   *   if (Auth.hasPlan("junior")) {
   *     // Mostra conteúdo premium
   *   }
   */
  function hasPlan(planName) {
    if (!_currentPlan) {
      return false;
    }
    // "premium" é um alias para o único plano pago (junior).
    if (planName === "premium") {
      return _currentPlan === "junior";
    }
    return _currentPlan === planName;
  }

  /**
   * Verifica se o usuário possui uma permissão específica.
   * 
   * @param {string} permission - Nome da permissão.
   * @returns {boolean}
   * 
   * USO FUTURO:
   *   if (Auth.hasPermission("canAccessPremium")) { ... }
   *   if (Auth.hasPermission("canDownload")) { ... }
   */
  function hasPermission(permission) {
    if (!_userProfile || !_userProfile.permissions) {
      return false;
    }
    return _userProfile.permissions[permission] === true;
  }

  /**
   * Inicia o fluxo de login com um provedor específico.
   * 
   * @param {string} providerName - "google" | "microsoft" | "apple" | "email"
   * @param {object} [options] - Opções específicas do provedor.
   * @returns {Promise<object>} Credencial do usuário.
   * 
   * USO:
   *   Auth.signIn("google");
   *   Auth.signIn("email", { email: "...", password: "...", mode: "login"|"register"|"reset" });
   */
  async function signIn(providerName, options) {
    if (!_initialized) {
      await init();
    }

    var providerModule = window.AuthModules && window.AuthModules.providers
      ? window.AuthModules.providers.getProvider(providerName)
      : null;

    if (!providerModule) {
      throw new Error("Provedor não disponível: " + providerName);
    }

    try {
      var result = await providerModule.signIn(options);
      console.log("[Auth] Login realizado com sucesso via:", providerName);
      return result;
    } catch (error) {
      console.error("[Auth] Erro no login via", providerName + ":", error);
      throw error;
    }
  }

  /**
   * Encerra a sessão atual.
   * @returns {Promise<void>}
   */
  async function signOut() {
    if (!_initialized) {
      return;
    }

    try {
      var auth = window.FirebaseInit.getAuthSync();
      if (auth) {
        await auth.signOut();
        _currentUser = null;
        _userProfile = null;
        _currentPlan = null;
        _clearLocalCache();
        console.log("[Auth] Sessão encerrada.");
      }
    } catch (error) {
      console.error("[Auth] Erro ao encerrar sessão:", error);
      throw error;
    }
  }

  /**
   * Limpa caches locais de autenticação/perfil no logout.
   */
  function _clearLocalCache() {
    if (window.AuthModules.session && window.AuthModules.session.clearCache) {
      window.AuthModules.session.clearCache();
    }
    if (window.AuthModules.userCache && window.AuthModules.userCache.clear) {
      window.AuthModules.userCache.clear();
    }
  }

  /**
   * Verifica se o sistema está inicializado.
   * @returns {boolean}
   */
  function isInitialized() {
    return _initialized;
  }

  /**
   * Força o recarregamento do perfil a partir do Firestore (ignora o cache),
   * usado após pagamento para refletir o novo plano imediatamente.
   * @returns {Promise<object|null>}
   */
  function refreshProfile() {
    var user = _currentUser;
    if (!user || !user.uid) {
      return Promise.resolve(null);
    }
    if (window.AuthModules.userCache && window.AuthModules.userCache.clear) {
      window.AuthModules.userCache.clear();
    }
    if (window.AuthorizationModules && window.AuthorizationModules.permissionCache && window.AuthorizationModules.permissionCache.invalidate) {
      window.AuthorizationModules.permissionCache.invalidate();
    }
    if (window.AuthModules.userProfile && window.AuthModules.userProfile.loadProfile) {
      return window.AuthModules.userProfile.loadProfile(user.uid).then(function (profile) {
        _userProfile = profile;
        _currentPlan = profile ? profile.plan : "free";
        _notifyProfileListeners(profile);
        return profile;
      }).catch(function () {
        return null;
      });
    }
    return Promise.resolve(null);
  }

  /**
   * Gate de assinatura: usuário free logado só pode ficar na página de
   * assinatura (e páginas de login/legais). Em qualquer outra página,
   * é redirecionado para assinar — sem assinar, não acessa o site.
   */
  function _enforcePaidGate() {
    if (!_currentUser) return;
    var plan = _currentPlan;
    if (plan && plan !== "free") return; // premium: acesso total
    var path = window.location.pathname || "/";
    var allowed = /^\/(conta\/(assinatura|login)|reembolso|termos|politica|fale|politicadeacessibilidade)(\.html)?$/i.test(path);
    if (!allowed) {
      window.location.href = "/conta/assinatura.html?gate=1";
    }
  }

  // ─── Exportação ─────────────────────────────────────────────────
  /** @namespace Auth */
  window.Auth = {
    init: init,
    isLoggedIn: isLoggedIn,
    currentUser: currentUser,
    profile: profile,
    hasPlan: hasPlan,
    hasPermission: hasPermission,
    signIn: signIn,
    signOut: signOut,
    onAuthChange: onAuthChange,
    onProfileChange: onProfileChange,
    isInitialized: isInitialized,
    refreshProfile: refreshProfile
  };

  // Registra este módulo no namespace
  window.AuthModules.core = window.Auth;

  console.log("[Auth] Módulo auth-core.js carregado.");

})(window);
