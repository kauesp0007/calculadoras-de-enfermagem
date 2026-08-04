/**
 * js/auth/auth-providers.js
 * 
 * RESPONSABILIDADE: Fábrica e registro de provedores de autenticação.
 * 
 * Este módulo implementa o padrão FACTORY para provedores de login.
 * Cada provedor (Google, Microsoft, Apple, Email) registra-se aqui
 * e expõe uma interface comum.
 * 
 * Para adicionar um NOVO provedor:
 *   1. Crie o arquivo js/auth/auth-novoproveedor.js
 *   2. Implemente a interface: { signIn(options) }
 *   3. Registre: AuthModules.providers.register("nome", modulo);
 * 
 * INTERFACE DE PROVEDOR:
 *   {
 *     signIn: async function(options) => UserCredential,
 *     isAvailable: function() => boolean
 *   }
 */

(function (window) {
  "use strict";

  // ─── Garante que o namespace existe ───────────────────────────
  window.AuthModules = window.AuthModules || {};

  // ─── Registro de provedores ────────────────────────────────────
  /** @type {Object<string, {signIn: Function, isAvailable: Function}>} */
  var _providers = {};

  /**
   * Registra um provedor de autenticação.
   * 
   * @param {string} name - Nome único do provedor ("google", "microsoft", etc.).
   * @param {object} providerModule - Módulo do provedor.
   * @param {Function} providerModule.signIn - Função de login.
   * @param {Function} [providerModule.isAvailable] - Verifica disponibilidade.
   */
  function register(name, providerModule) {
    if (!name || typeof name !== "string") {
      throw new Error("[Providers] Nome do provedor inválido.");
    }

    if (!providerModule || typeof providerModule.signIn !== "function") {
      throw new Error(
        "[Providers] Provedor '" + name + "' deve implementar signIn()."
      );
    }

    _providers[name] = providerModule;
    console.log("[Providers] Provedor registrado:", name);
  }

  /**
   * Obtém um provedor pelo nome.
   * 
   * @param {string} name - Nome do provedor.
   * @returns {object|null} Módulo do provedor ou null.
   */
  function getProvider(name) {
    var provider = _providers[name];

    if (!provider) {
      console.warn("[Providers] Provedor não encontrado:", name);
      return null;
    }

    // Verifica disponibilidade (ex: Apple Sign-In não funciona no Android)
    if (provider.isAvailable && !provider.isAvailable()) {
      console.warn("[Providers] Provedor não disponível neste dispositivo:", name);
      return null;
    }

    return provider;
  }

  /**
   * Lista todos os provedores registrados.
   * @returns {string[]}
   */
  function listProviders() {
    return Object.keys(_providers);
  }

  /**
   * Verifica se um provedor está registrado.
   * @param {string} name
   * @returns {boolean}
   */
  function hasProvider(name) {
    return _providers.hasOwnProperty(name);
  }

  // ─── Exportação ─────────────────────────────────────────────────
  /** @namespace AuthModules.providers */
  window.AuthModules.providers = {
    register: register,
    getProvider: getProvider,
    listProviders: listProviders,
    hasProvider: hasProvider
  };

  console.log("[Auth] Módulo auth-providers.js carregado.");

})(window);
