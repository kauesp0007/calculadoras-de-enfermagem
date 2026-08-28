/**
 * js/auth/feature-service.js
 *
 * RESPONSABILIDADE: Feature flags (ativação/desativação de funcionalidades).
 *
 * Permite ligar/desligar recursos do site (Fórum, Cursos, Biblioteca, IA…)
 * sem alterar o código de cada página. Nesta fase as flags ficam no código,
 * prontas para migrar para o Firestore futuramente.
 */

(function (window) {
    "use strict";

    window.AuthorizationModules = window.AuthorizationModules || {};

    var FEATURES = {
        forum: true,
        courses: false,
        library: true,
        downloads: true,
        premium: true,
        community: false,
        chat: false,
        ai: false
    };

    /**
     * Verifica se uma funcionalidade está ativa.
     * @param {string} name
     * @returns {boolean}
     */
    function isEnabled(name) {
        return FEATURES[name] === true;
    }

    /**
     * Lista todas as funcionalidades.
     * @returns {string[]}
     */
    function list() {
        return Object.keys(FEATURES);
    }

    /**
     * Retorna uma cópia do mapa de funcionalidades.
     * @returns {object}
     */
    function all() {
        return Object.assign({}, FEATURES);
    }

    window.AuthorizationModules.featureService = {
        FEATURES: FEATURES,
        isEnabled: isEnabled,
        list: list,
        all: all
    };

    console.log("[Auth] Módulo feature-service.js carregado.");

})(window);
