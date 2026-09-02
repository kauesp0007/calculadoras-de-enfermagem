/**
 * js/subscriptions/plan-manager.js
 *
 * RESPONSABILIDADE: Gerenciamento de planos no contexto de assinaturas
 * (Fase 7).
 *
 * Integra com a definição canônica de planos (plan-service.js, Fase 5),
 * expondo os planos disponíveis para contratação e seus metadados.
 */

(function (window) {
    "use strict";

    window.SubscriptionModules = window.SubscriptionModules || {};

    function _service() {
        return window.AuthorizationModules.planService;
    }

    /**
     * Retorna os dados de um plano.
     * @param {string} planId
     * @returns {object|null}
     */
    function getPlan(planId) {
        var svc = _service();
        if (!svc) {
            return null;
        }
        var p = svc.PLANS[planId];
        return p ? Object.assign({ id: planId }, p) : null;
    }

    /**
     * Lista todos os planos.
     * @returns {Array<{id,label,level,available}>}
     */
    function list() {
        var svc = _service();
        if (!svc) {
            return [];
        }
        return Object.keys(svc.PLANS).map(function (id) {
            return Object.assign({ id: id }, svc.PLANS[id]);
        });
    }

    /**
     * Lista apenas os planos disponíveis para contratação.
     * @returns {Array<{id,label,level,available}>}
     */
    function listAvailable() {
        return list().filter(function (p) {
            return p.available === true && p.id !== "free";
        });
    }

    /**
     * Verifica se um plano está disponível para contratação.
     * @param {string} planId
     * @returns {boolean}
     */
    function isAvailable(planId) {
        var p = getPlan(planId);
        return !!(p && p.available === true);
    }

    window.SubscriptionModules.planManager = {
        getPlan: getPlan,
        list: list,
        listAvailable: listAvailable,
        isAvailable: isAvailable
    };

    console.log("[Subscription] Módulo plan-manager.js carregado.");

})(window);
