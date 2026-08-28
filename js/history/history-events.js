/**
 * js/history/history-events.js
 *
 * RESPONSABILIDADE: Sistema de eventos (event bus) do Sistema de Histórico.
 */

(function (window) {
    "use strict";

    // ─── Garante que o namespace existe ───────────────────────────
    window.HistoryModules = window.HistoryModules || {};

    /** @type {Object<string, Function[]>} */
    var _listeners = {};

    var EVENTS = {
        RECORDED: "history-recorded",
        LOADED: "history-loaded",
        CLEARED: "history-cleared",
        CHANGED: "history-changed",
        ERROR: "history-error"
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
                console.error("[HistoryEvents] Erro em listener do evento '" + event + "':", e);
            }
        });
    }

    // ─── Exportação ─────────────────────────────────────────────────
    window.HistoryModules.events = {
        EVENTS: EVENTS,
        on: on,
        off: off,
        emit: emit
    };

    console.log("[History] Módulo history-events.js carregado.");

})(window);
