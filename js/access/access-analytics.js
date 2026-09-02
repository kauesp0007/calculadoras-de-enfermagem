/**
 * js/access/access-analytics.js
 *
 * RESPONSABILIDADE: Registro de tentativas de acesso a conteúdo (Fase 6).
 *
 * Registra toda decisão de acesso (liberado ou bloqueado) para futura
 * inteligência de negócio: conteúdos premium mais desejados, downloads
 * bloqueados, ferramentas mais procuradas, etc.
 *
 * Nesta fase o registro é LOCAL (buffer em memória + console), preparado
 * para sincronizar com a subcoleção users/{uid}/accessLogs futuramente.
 */

(function (window) {
    "use strict";

    window.AccessModules = window.AccessModules || {};

    /** @type {Object[]} */
    var _buffer = [];

    /**
     * Registra uma tentativa de acesso.
     * @param {object} entry - { contentId, contentType, allowed, reason,
     *                           requiredPlan, requiredRole, role, plan }
     * @returns {object} Entrada registrada (com timestamp).
     */
    function recordAccess(entry) {
        entry = entry || {};
        entry.timestamp = entry.timestamp || new Date().toISOString();

        _buffer.push(entry);

        // Preparado para sincronizar com o Firestore (users/{uid}/accessLogs).
        // eslint-disable-next-line no-console
        console.info("[Access] Tentativa de acesso registrada:", entry);

        return entry;
    }

    /**
     * Retorna uma cópia do buffer de registros.
     * @returns {Object[]}
     */
    function buffer() {
        return _buffer.slice();
    }

    /**
     * Limpa o buffer local.
     */
    function clear() {
        _buffer = [];
    }

    window.AccessModules.analytics = {
        recordAccess: recordAccess,
        buffer: buffer,
        clear: clear
    };

    console.log("[Access] Módulo access-analytics.js carregado.");

})(window);
