/**
 * js/subscriptions/subscription-events.js
 *
 * RESPONSABILIDADE: Sistema de eventos (event bus) do Sistema de Assinaturas
 * (Fase 7).
 *
 * Permite que a interface reaja a mudanças de assinatura (criada, ativada,
 * cancelada, expirada...) sem acoplamento direto com a camada Subscription.
 */

(function (window) {
    "use strict";

    window.SubscriptionEvents = window.SubscriptionEvents || {};

    /** @type {Object<string, Function[]>} */
    var _listeners = {};

    var EVENTS = {
        LOADED: "subscription-loaded",
        CREATED: "subscription-created",
        ACTIVATED: "subscription-activated",
        CANCELLED: "subscription-cancelled",
        EXPIRED: "subscription-expired",
        CHANGED: "subscription-changed",
        ERROR: "subscription-error"
    };

    function on(event, callback) {
        if (!event || typeof callback !== "function") {
            return;
        }
        if (!_listeners[event]) {
            _listeners[event] = [];
        }
        _listeners[event].push(callback);
    }

    function off(event, callback) {
        var list = _listeners[event];
        if (!list) {
            return;
        }
        _listeners[event] = list.filter(function (cb) {
            return cb !== callback;
        });
    }

    function emit(event, payload) {
        var list = _listeners[event];
        if (!list) {
            return;
        }
        list.slice().forEach(function (cb) {
            try {
                cb(payload);
            } catch (e) {
                console.error("[SubscriptionEvents] Erro em listener do evento '" + event + "':", e);
            }
        });
    }

    window.SubscriptionEvents = {
        EVENTS: EVENTS,
        on: on,
        off: off,
        emit: emit
    };

    console.log("[Subscription] Módulo subscription-events.js carregado.");

})(window);
