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

    // Planos considerados "premium"
    var PREMIUM_PLANS = ["premium_monthly", "premium_yearly", "lifetime", "institution"];

    var PLANS = {
        free: { label: "Gratuito", permissions: [] },
        premium_monthly: {
            label: "Premium Mensal",
            permissions: ["viewPremium", "downloadPremium", "accessCourses", "accessCertificates", "downloadProtocols"]
        },
        premium_yearly: {
            label: "Premium Anual",
            permissions: ["viewPremium", "downloadPremium", "accessCourses", "accessCertificates", "downloadProtocols"]
        },
        lifetime: {
            label: "Vitalício",
            permissions: ["viewPremium", "downloadPremium", "accessCourses", "accessCertificates", "downloadProtocols"]
        },
        student: {
            label: "Estudante",
            permissions: ["viewPremium", "accessCourses"]
        },
        professional: {
            label: "Profissional",
            permissions: ["viewPremium", "downloadPremium", "accessCourses", "accessCertificates"]
        },
        institution: {
            label: "Institucional",
            permissions: ["viewPremium", "downloadPremium", "accessCourses", "accessCertificates", "downloadProtocols"]
        }
    };

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
     * Verifica se um plano é considerado premium.
     * @param {string} plan
     * @returns {boolean}
     */
    function isPremium(plan) {
        return PREMIUM_PLANS.indexOf(plan) !== -1;
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
        PLANS: PLANS,
        PREMIUM_PLANS: PREMIUM_PLANS,
        permissionsFor: permissionsFor,
        isPremium: isPremium,
        list: list,
        label: label
    };

    console.log("[Auth] Módulo plan-service.js carregado.");

})(window);
