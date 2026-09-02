/**
 * js/access/access-events.js
 *
 * RESPONSABILIDADE: Sistema de eventos (event bus) da camada de acesso
 * a conteúdo (Fase 6 — Content Access Engine).
 *
 * Permite que a interface reaja a decisões de acesso (liberado/bloqueado)
 * sem acoplamento direto com a camada Access.
 */

(function (window) {
    "use strict";

    window.AccessEvents = window.AccessEvents || {};

    /** @type {Object<string, Function[]>} */
    var _listeners = {};

    var EVENTS = {
        POLICY_LOADED: "policy-loaded",
        ACCESS_GRANTED: "access-granted",
        ACCESS_DENIED: "access-denied",
        BANNER_MOUNTED: "banner-mounted"
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
                console.error("[AccessEvents] Erro em listener do evento '" + event + "':", e);
            }
        });
    }

    window.AccessEvents = {
        EVENTS: EVENTS,
        on: on,
        off: off,
        emit: emit
    };

    console.log("[Access] Módulo access-events.js carregado.");

})(window);
