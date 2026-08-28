/**
 * js/auth/authorization-events.js
 *
 * RESPONSABILIDADE: Sistema de eventos (event bus) da camada de autorização.
 *
 * Permite que a interface reaja a mudanças de permissões/plano/papel sem
 * acoplamento direto com a camada Authorization.
 */

(function (window) {
    "use strict";

    window.AuthorizationEvents = window.AuthorizationEvents || {};

    /** @type {Object<string, Function[]>} */
    var _listeners = {};

    var EVENTS = {
        READY: "authorization-ready",
        PERMISSIONS_CHANGED: "permissions-changed"
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
                console.error("[AuthorizationEvents] Erro em listener do evento '" + event + "':", e);
            }
        });
    }

    window.AuthorizationEvents = {
        EVENTS: EVENTS,
        on: on,
        off: off,
        emit: emit
    };

    console.log("[Auth] Módulo authorization-events.js carregado.");

})(window);
