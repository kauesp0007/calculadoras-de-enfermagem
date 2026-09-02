/**
 * js/subscriptions/benefits-manager.js
 *
 * RESPONSABILIDADE: Gerenciamento de benefícios no contexto de assinaturas
 * (Fase 7).
 *
 * Integra com o motor de benefícios (benefit-engine.js, Fase 6), expondo os
 * benefícios de cada plano para exibição na página de assinatura.
 */

(function (window) {
    "use strict";

    window.SubscriptionModules = window.SubscriptionModules || {};

    /**
     * Retorna os benefícios de um plano.
     * @param {string} planId
     * @returns {Array<{id,icon,label}>}
     */
    function forPlan(planId) {
        if (window.AccessModules.benefits) {
            return window.AccessModules.benefits.forPlan(planId);
        }
        return [];
    }

    /**
     * Lista os planos que possuem benefícios cadastrados.
     * @returns {string[]}
     */
    function list() {
        if (window.AccessModules.benefits) {
            return window.AccessModules.benefits.list();
        }
        return [];
    }

    window.SubscriptionModules.benefitsManager = {
        forPlan: forPlan,
        list: list
    };

    console.log("[Subscription] Módulo benefits-manager.js carregado.");

})(window);
