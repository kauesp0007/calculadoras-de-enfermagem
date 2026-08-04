/**
 * js/auth/auth-google.js
 * 
 * RESPONSABILIDADE: Login com Google via Firebase Authentication.
 * 
 * Implementa a interface de provedor definida em auth-providers.js.
 * 
 * FLUXO:
 *   1. Usuário clica em "Continuar com Google"
 *   2. Firebase abre popup do Google
 *   3. Usuário seleciona/confirma a conta Google
 *   4. Firebase retorna UserCredential com token JWT
 *   5. Sessão é persistida automaticamente pelo Firebase Auth
 * 
 * REQUISITOS:
 *   - Provedor "Google" habilitado no console Firebase
 *   - Domínio autorizado no OAuth consent screen do Google Cloud
 * 
 * CONFIGURAÇÃO NO FIREBASE CONSOLE:
 *   Authentication → Sign-in method → Google → Habilitar
 *   Selecionar o e-mail de suporte do projeto
 */

(function (window) {
  "use strict";

  /**
   * Executa o login com Google usando popup.
   * 
   * @param {object} [options] - Opções (não utilizado para Google).
   * @returns {Promise<object>} UserCredential do Firebase.
   */
  async function signIn(options) {
    // Obtém a instância do Auth
    var auth = window.FirebaseInit.getAuthSync();
    if (!auth) {
      throw new Error(
        "Firebase Auth não está inicializado. Execute Auth.init() primeiro."
      );
    }

    // Verifica se firebase.auth.GoogleAuthProvider está disponível
    if (!window.firebase || !window.firebase.auth || !window.firebase.auth.GoogleAuthProvider) {
      throw new Error(
        "GoogleAuthProvider não disponível. O SDK Firebase Auth foi carregado?"
      );
    }

    // Cria o provedor Google
    var provider = new window.firebase.auth.GoogleAuthProvider();

    // Configuração do popup
    provider.setCustomParameters({
      prompt: "select_account" // Sempre mostra o seletor de conta
    });

    // Escopos adicionais (opcional)
    provider.addScope("profile");
    provider.addScope("email");

    try {
      // Tenta login com popup primeiro (melhor UX)
      var result = await auth.signInWithPopup(provider);
      console.log("[Google] Login realizado:", result.user.email);
      return result;
    } catch (popupError) {
      // Se o popup foi bloqueado, tenta redirect
      if (
        popupError.code === "auth/popup-blocked" ||
        popupError.code === "auth/popup-closed-by-user"
      ) {
        console.warn("[Google] Popup bloqueado, tentando redirect...");
        await auth.signInWithRedirect(provider);
        // O resultado será capturado por getRedirectResult() na inicialização
        return null;
      }

      // Se já existe uma sessão Google em outro contexto
      if (popupError.code === "auth/account-exists-with-different-credential") {
        throw new Error(
          "Já existe uma conta com este e-mail usando outro método de login. " +
          "Por favor, entre com o método original."
        );
      }

      throw popupError;
    }
  }

  /**
   * Verifica se o Google Sign-In está disponível neste ambiente.
   * Sempre disponível em navegadores modernos.
   * 
   * @returns {boolean}
   */
  function isAvailable() {
    // Google Sign-In funciona em qualquer navegador moderno
    return true;
  }

  // ─── Registro automático ────────────────────────────────────────
  // Registra este provedor na fábrica assim que o módulo carrega
  if (window.AuthModules && window.AuthModules.providers) {
    window.AuthModules.providers.register("google", {
      signIn: signIn,
      isAvailable: isAvailable
    });
  }

  // ─── Exportação ─────────────────────────────────────────────────
  window.AuthModules.google = {
    signIn: signIn,
    isAvailable: isAvailable
  };

  console.log("[Auth] Módulo auth-google.js carregado.");

})(window);
