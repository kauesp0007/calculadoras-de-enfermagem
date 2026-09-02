/**
 * js/subscriptions/subscription-history.js
 *
 * RESPONSABILIDADE: Histórico de eventos da assinatura (Fase 7).
 *
 * Registra toda mudança de estado (criação, ativação, cancelamento, renovação,
 * troca de plano, expiração...) para auditoria e exibição na página
 * de assinatura. Nesta fase o registro é local (buffer em memória), preparado
 * para sincronizar com a subcoleção users/{uid}/subscriptions/{id}/history.
 */

(function (window) {
    "use strict";

    window.SubscriptionModules = window.SubscriptionModules || {};

    /** @type {Object[]} */
    var _buffer = [];

    /**
     * Registra um evento no histórico.
     * @param {string} subscriptionId
     * @param {string} event - ex.: "created", "activated", "cancelled".
     * @param {object} [meta]
     * @returns {object}
     */
    function record(subscriptionId, event, meta) {
        var entry = {
            subscriptionId: subscriptionId,
            event: event,
            timestamp: new Date().toISOString(),
            meta: meta || {}
        };
        _buffer.push(entry);
        return entry;
    }

    /**
     * Retorna uma cópia do histórico.
     * @returns {Object[]}
     */
    function list() {
        return _buffer.slice();
    }

    /**
     * Limpa o buffer local.
     */
    function clear() {
        _buffer = [];
    }

    window.SubscriptionModules.history = {
        record: record,
        list: list,
        clear: clear
    };

    console.log("[Subscription] Módulo subscription-history.js carregado.");

})(window);
