/**
 * js/subscriptions/subscription-validator.js
 *
 * RESPONSABILIDADE: Máquina de estados das assinaturas (Fase 7).
 *
 * Define as transições válidas entre os estados de uma assinatura e valida
 * cada mudança antes de aplicá-la, impedindo transições inválidas
 * (ex.: "cancelled" -> "active" sem reativação explícita).
 */

(function (window) {
    "use strict";

    window.SubscriptionModules = window.SubscriptionModules || {};

    var STATUSES = [
        "pending", "trial", "active", "gracePeriod", "paused",
        "cancelRequested", "cancelled", "expired", "blocked", "failed"
    ];

    // Transições permitidas (estado atual -> estados destino).
    var TRANSITIONS = {
        pending: ["active", "cancelled", "failed"],
        trial: ["active", "cancelled", "expired"],
        active: ["gracePeriod", "paused", "cancelRequested", "cancelled", "expired", "blocked"],
        gracePeriod: ["active", "cancelled", "expired"],
        paused: ["active", "cancelled"],
        cancelRequested: ["cancelled", "active"],
        cancelled: [],           // terminal (re-ativação vira nova assinatura)
        expired: ["active", "cancelled"],
        blocked: ["active", "cancelled"],
        failed: ["pending", "cancelled"]
    };

    /**
     * Verifica se um status é conhecido.
     * @param {string} status
     * @returns {boolean}
     */
    function isValidStatus(status) {
        return STATUSES.indexOf(status) !== -1;
    }

    /**
     * Verifica se a transição de um estado para outro é permitida.
     * @param {string} from
     * @param {string} to
     * @returns {boolean}
     */
    function canTransition(from, to) {
        if (!from) {
            // Sem assinatura ainda: permite criar (pending) ou iniciar trial.
            return to === "pending" || to === "trial";
        }
        var allowed = TRANSITIONS[from];
        return allowed ? allowed.indexOf(to) !== -1 : false;
    }

    /**
     * Lista todos os estados possíveis.
     * @returns {string[]}
     */
    function list() {
        return STATUSES.slice();
    }

    window.SubscriptionModules.validator = {
        STATUSES: STATUSES,
        TRANSITIONS: TRANSITIONS,
        isValidStatus: isValidStatus,
        canTransition: canTransition,
        list: list
    };

    console.log("[Subscription] Módulo subscription-validator.js carregado.");

})(window);
