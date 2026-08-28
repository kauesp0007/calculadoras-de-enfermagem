/**
 * js/auth/user-events.js
 *
 * RESPONSABILIDADE: Sistema de eventos (event bus) do perfil do usuário.
 *
 * Permite que qualquer módulo ou página reaja a mudanças no perfil
 * sem acoplamento direto entre eles.
 *
 * USO:
 *   AuthModules.userEvents.on("profile-loaded", function (profile) { ... });
 *   AuthModules.userEvents.emit("profile-loaded", profile);
 */

(function (window) {
    "use strict";

    // ─── Garante que o namespace existe ───────────────────────────
    window.AuthModules = window.AuthModules || {};

    // ─── Registro de listeners ─────────────────────────────────────
    /** @type {Object<string, Function[]>} */
    var _listeners = {};

    // ─── Eventos conhecidos ────────────────────────────────────────
    var EVENTS = {
        PROFILE_LOADED: "profile-loaded",
        PROFILE_UPDATED: "profile-updated",
        PREFERENCES_CHANGED: "preferences-changed"
    };

    /**
     * Registra um callback para um evento.
     * @param {string} event - Nome do evento.
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
     * Emite um evento, chamando todos os listeners registrados.
     * @param {string} event
     * @param {*} [payload]
     */
    function emit(event, payload) {
        var list = _listeners[event];
        if (!list) {
            return;
        }

        // Copia para evitar problemas se um listener remover outro durante a iteração
        list.slice().forEach(function (cb) {
            try {
                cb(payload);
            } catch (e) {
                console.error("[UserEvents] Erro em listener do evento '" + event + "':", e);
            }
        });
    }

    // ─── Exportação ─────────────────────────────────────────────────
    window.AuthModules.userEvents = {
        EVENTS: EVENTS,
        on: on,
        off: off,
        emit: emit
    };

    console.log("[Auth] Módulo user-events.js carregado.");

})(window);
