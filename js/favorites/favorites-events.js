/**
 * js/favorites/favorites-events.js
 *
 * RESPONSABILIDADE: Sistema de eventos (event bus) do Sistema de Favoritos.
 *
 * Permite que qualquer módulo ou página reaja a mudanças nos favoritos
 * sem acoplamento direto.
 */

(function (window) {
    "use strict";

    // ─── Garante que o namespace existe ───────────────────────────
    window.FavoritesModules = window.FavoritesModules || {};

    /** @type {Object<string, Function[]>} */
    var _listeners = {};

    var EVENTS = {
        LOADED: "favorites-loaded",
        ADDED: "favorite-added",
        REMOVED: "favorite-removed",
        CHANGED: "favorites-changed",
        ERROR: "favorites-error"
    };

    /**
     * Registra um callback para um evento.
     * @param {string} event
     * @param {Function} callback
     */
    function on(event, callback) {
        if (!event || typeof callback !== "function") {
            return;
        }
        if (!_listeners[event]) {
            _listeners[event] = [];
        }
        _listeners[event].push(callback);
    }

    /**
     * Remove um callback de um evento.
     * @param {string} event
     * @param {Function} callback
     */
    function off(event, callback) {
        var list = _listeners[event];
        if (!list) {
            return;
        }
        _listeners[event] = list.filter(function (cb) {
            return cb !== callback;
        });
    }

    /**
     * Emite um evento para todos os listeners.
     * @param {string} event
     * @param {*} [payload]
     */
    function emit(event, payload) {
        var list = _listeners[event];
        if (!list) {
            return;
        }
        list.slice().forEach(function (cb) {
            try {
                cb(payload);
            } catch (e) {
                console.error("[FavoritesEvents] Erro em listener do evento '" + event + "':", e);
            }
        });
    }

    // ─── Exportação ─────────────────────────────────────────────────
    window.FavoritesModules.events = {
        EVENTS: EVENTS,
        on: on,
        off: off,
        emit: emit
    };

    console.log("[Favorites] Módulo favorites-events.js carregado.");

})(window);
