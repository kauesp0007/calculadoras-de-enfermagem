/**
 * js/auth/auth-microsoft.js
 * 
 * RESPONSABILIDADE: Login com Microsoft via Firebase Authentication.
 * 
 * STATUS: ESTRUTURA PREPARADA — Implementação futura.
 * 
 * Este módulo segue a interface de provedor definida em auth-providers.js.
 * Quando for implementado, basta substituir as funções abaixo.
 * 
 * CONFIGURAÇÃO NO FIREBASE CONSOLE (futuro):
 *   Authentication → Sign-in method → Microsoft → Habilitar
 *   Preencher:
 *     - Client ID (do Azure AD)
 *     - Client Secret (do Azure AD)
 * 
 * CONFIGURAÇÃO NO AZURE (futuro):
 *   1. Acessar portal.azure.com → Azure Active Directory
 *   2. App registrations → New registration
 *   3. Configurar Redirect URI: https://calculadoras-enfermagem.firebaseapp.com/__/auth/handler
 *   4. Copiar Application (client) ID para o Firebase Console
 */

(function (window) {
  "use strict";

  // ─── Garante que o namespace existe ───────────────────────────
  window.AuthModules = window.AuthModules || {};

  /**
   * Login com Microsoft.
   * 
   * @param {object} [options] - Opções adicionais.
   * @returns {Promise<object>} UserCredential.
   */
  async function signIn(options) {
    throw new Error(
      "O login com Microsoft estar\u00e1 dispon\u00edvel em breve. " +
      "Por favor, utilize Google ou E-mail para entrar."
    );
  }

  /**
   * Verifica disponibilidade do provedor.
   * @returns {boolean}
   */
  function isAvailable() {
    // Placeholder: retorna true para mostrar mensagem "em breve"
    return true;
  }

  // ─── Registro ────────────────────────────────────────────────────
  if (window.AuthModules && window.AuthModules.providers) {
    window.AuthModules.providers.register("microsoft", {
      signIn: signIn,
      isAvailable: isAvailable
    });
  }

  window.AuthModules.microsoft = {
    signIn: signIn,
    isAvailable: isAvailable
  };

  console.log("[Auth] Módulo auth-microsoft.js carregado (placeholder).");

})(window);
