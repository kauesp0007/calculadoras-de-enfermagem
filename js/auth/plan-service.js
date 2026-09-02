/**
 * js/auth/plan-service.js
 *
 * RESPONSABILIDADE: Definição dos planos e seus benefícios (permissões).
 *
 * O plano NÃO substitui o papel: ambos coexistem e suas permissões são
 * somadas na camada de autorização.
 */

(function (window) {
    "use strict";

    window.AuthorizationModules = window.AuthorizationModules || {};

    // Níveis dos planos (maior = mais benefícios). Usado na hierarquia.
    var LEVELS = {
        free: 0,
        junior: 10,
        pleno: 20,
        senior: 30
    };

    // Planos considerados "sem anúncios" (qualquer plano pago).
    var PREMIUM_PLANS = ["junior", "pleno", "senior"];

    var PLANS = {
        free: { label: "Gratuito", level: 0, available: true, price: 0, priceLabel: "Grátis", permissions: [] },
        junior: { label: "Júnior", level: 10, available: true, price: 5.00, priceLabel: "R$ 5,00", permissions: ["viewPremium"] },
        pleno: { label: "Pleno", level: 20, available: true, price: 7.00, priceLabel: "R$ 7,00", permissions: ["viewPremium", "downloadPremium"] },
        senior: { label: "Sênior", level: 30, available: true, price: 10.00, priceLabel: "R$ 10,00", permissions: ["viewPremium", "downloadPremium"] }
    };

    /**
     * Retorna o nível de um plano.
     * @param {string} plan
     * @returns {number}
     */
    function levelOf(plan) {
        return LEVELS[plan] !== undefined ? LEVELS[plan] : -1;
    }

    /**
     * Verifica se o plano do usuário atende a um plano requerido (hierárquico).
     * Ex.: hasPlan("pleno", "junior") === true (pleno >= junior).
     * @param {string} userPlan
     * @param {string} required
     * @returns {boolean}
     */
    function hasPlan(userPlan, required) {
        if (!required || required === "free") {
            return true;
        }
        if (userPlan === "senior") {
            return true;
        }
        return levelOf(userPlan) >= levelOf(required);
    }

    /**
     * Retorna as permissões implícitas de um plano.
     * @param {string} plan
     * @returns {string[]}
     */
    function permissionsFor(plan) {
        var p = PLANS[plan] || PLANS.free;
        return (p.permissions || []).slice();
    }

    /**
     * Verifica se um plano é pago (sem anúncios).
     * @param {string} plan
     * @returns {boolean}
     */
    function isPremium(plan) {
        return PREMIUM_PLANS.indexOf(plan) !== -1;
    }

    /**
     * Verifica se um plano está disponível para contratação.
     * @param {string} plan
     * @returns {boolean}
     */
    function isAvailable(plan) {
        return (PLANS[plan] || {}).available === true;
    }

    /**
     * Lista todos os planos cadastrados.
     * @returns {string[]}
     */
    function list() {
        return Object.keys(PLANS);
    }

    /**
     * Retorna o rótulo amigável de um plano.
     * @param {string} plan
     * @returns {string}
     */
    function label(plan) {
        return (PLANS[plan] || {}).label || plan;
    }

    window.AuthorizationModules.planService = {
        LEVELS: LEVELS,
        PLANS: PLANS,
        PREMIUM_PLANS: PREMIUM_PLANS,
        levelOf: levelOf,
        hasPlan: hasPlan,
        permissionsFor: permissionsFor,
        isPremium: isPremium,
        isAvailable: isAvailable,
        list: list,
        label: label
    };

    console.log("[Auth] Módulo plan-service.js carregado.");

})(window);
