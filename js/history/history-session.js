/**
 * js/history/history-session.js
 *
 * RESPONSABILIDADE: Gerenciamento da sessão de navegação do histórico.
 *
 * Mantém um sessionId (por aba/sessão de navegação, via sessionStorage),
 * o contador de visitas (visitNumber) e o registro ativo da página atual
 * (para calcular exitAt/duration ao trocar de página).
 */

(function (window) {
    "use strict";

    // ─── Garante que o namespace existe ───────────────────────────
    window.HistoryModules = window.HistoryModules || {};

    var KEY = "auth_history_session"; // sessionStorage (limpo ao fechar a aba)

    var _sessionId = null;
    var _visitNumber = 0;
    var _activeVisit = null; // { historyId, pageId, visitedAt }

    function _init() {
        if (_sessionId) {
            return;
        }
        try {
            var raw = sessionStorage.getItem(KEY);
            if (raw) {
                var parsed = JSON.parse(raw);
                _sessionId = parsed.sessionId || null;
                _visitNumber = parsed.visitNumber || 0;
            }
        } catch (e) {
            /* ignora */
        }
        if (!_sessionId) {
            _sessionId = window.HistoryModules.utils
                ? window.HistoryModules.utils.newId()
                : String(Date.now());
            _visitNumber = 0;
        }
    }

    function _persist() {
        try {
            sessionStorage.setItem(
                KEY,
                JSON.stringify({ sessionId: _sessionId, visitNumber: _visitNumber })
            );
        } catch (e) {
            /* ignora */
        }
    }

    /**
     * Retorna o sessionId da sessão de navegação atual.
     * @returns {string}
     */
    function getSessionId() {
        _init();
        return _sessionId;
    }

    /**
     * Incrementa e retorna o número da próxima visita.
     * @returns {number}
     */
    function nextVisitNumber() {
        _init();
        _visitNumber++;
        _persist();
        return _visitNumber;
    }

    /**
     * Retorna o número da visita atual (sem incrementar).
     * @returns {number}
     */
    function getVisitNumber() {
        _init();
        return _visitNumber;
    }

    /**
     * Retorna o registro ativo (página atual).
     * @returns {object|null}
     */
    function getActiveVisit() {
        return _activeVisit;
    }

    /**
     * Define o registro ativo.
     * @param {object|null} visit
     */
    function setActiveVisit(visit) {
        _activeVisit = visit;
    }

    /**
     * Limpa o registro ativo.
     */
    function clearActiveVisit() {
        _activeVisit = null;
    }

    /**
     * Reseta toda a sessão (no logout).
     */
    function reset() {
        _sessionId = null;
        _visitNumber = 0;
        _activeVisit = null;
        try {
            sessionStorage.removeItem(KEY);
        } catch (e) {
            /* ignora */
        }
    }

    // ─── Exportação ─────────────────────────────────────────────────
    window.HistoryModules.session = {
        getSessionId: getSessionId,
        nextVisitNumber: nextVisitNumber,
        getVisitNumber: getVisitNumber,
        getActiveVisit: getActiveVisit,
        setActiveVisit: setActiveVisit,
        clearActiveVisit: clearActiveVisit,
        reset: reset
    };

    console.log("[History] Módulo history-session.js carregado.");

})(window);
