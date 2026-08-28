/**
 * js/history/history-sync.js
 *
 * RESPONSABILIDADE: Orquestração e sincronização do histórico.
 *
 * - Carrega o histórico 1x por sessão (cache -> Firestore).
 * - Registra cada visita (fechando a visita anterior para calcular duração).
 * - Exclui registros e limpa o histórico completo.
 * - Mantém estado em memória + cache local + eventos.
 */

(function (window) {
    "use strict";

    // ─── Garante que o namespace existe ───────────────────────────
    window.HistoryModules = window.HistoryModules || {};

    var _uid = null;
    var _items = [];
    var _loaded = false;
    var _loading = null;

    function _emit(event, payload) {
        if (window.HistoryModules.events) {
            window.HistoryModules.events.emit(event, payload);
        }
    }

    function _updateCache() {
        if (window.HistoryModules.cache) {
            window.HistoryModules.cache.set(_uid, _items);
        }
    }

    // ─── API Pública ────────────────────────────────────────────────

    function getAll() {
        return _items.slice();
    }

    function count() {
        return _items.length;
    }

    /**
     * Carrega o histórico do usuário (cache primeiro, Firestore em seguida).
     * @param {string} uid
     * @returns {Promise<object[]>}
     */
    async function load(uid) {
        if (!uid) {
            reset();
            return [];
        }
        if (_loaded && _uid === uid) {
            return _items.slice();
        }
        if (_loading) {
            return _loading;
        }

        _uid = uid;

        var cached = window.HistoryModules.cache
            ? window.HistoryModules.cache.get(uid)
            : null;

        if (cached !== null) {
            _items = cached;
            _loaded = true;
            _emit(window.HistoryModules.events.EVENTS.LOADED, _items.slice());
            _loading = refresh(uid);
            return _loading;
        }

        _loading = refresh(uid);
        return _loading;
    }

    /**
     * Busca o histórico no Firestore e atualiza estado/cache/eventos.
     * @param {string} [uid]
     * @returns {Promise<object[]>}
     */
    async function refresh(uid) {
        uid = uid || _uid;
        if (!uid) {
            return [];
        }

        try {
            var list = await window.HistoryModules.service.listHistory(uid, 1000);
            _items = list;
            _loaded = true;
            _updateCache();
            _emit(window.HistoryModules.events.EVENTS.LOADED, list.slice());
            _emit(window.HistoryModules.events.EVENTS.CHANGED, list.slice());
            return list.slice();
        } catch (e) {
            console.error("[History] Erro ao carregar histórico:", e);
            _emit(window.HistoryModules.events.EVENTS.ERROR, e);
            return _items.slice();
        } finally {
            _loading = null;
        }
    }

    /**
     * Fecha a visita ativa (registra exitAt/duration no Firestore).
     * Chamado ao trocar de página ou ao sair.
     * @returns {Promise<void>}
     */
    async function closeActiveVisit() {
        var active = window.HistoryModules.session.getActiveVisit();
        if (!active || !active.historyId || !_uid) {
            window.HistoryModules.session.clearActiveVisit();
            return;
        }

        var exitAt = new Date();
        var duration = active.visitedAt
            ? Math.max(0, exitAt.getTime() - active.visitedAt.getTime())
            : 0;

        try {
            await window.HistoryModules.service.updateVisit(_uid, active.historyId, {
                exitAt: exitAt,
                duration: duration
            });

            // Atualiza o registro no cache em memória
            for (var i = 0; i < _items.length; i++) {
                if (_items[i].id === active.historyId) {
                    _items[i].exitAt = exitAt;
                    _items[i].duration = duration;
                    break;
                }
            }
            _updateCache();
        } catch (e) {
            console.error("[History] Erro ao fechar visita:", e);
        }

        window.HistoryModules.session.clearActiveVisit();
    }

    /**
     * Registra a visita da página atual (fecha a visita anterior primeiro).
     * @param {object} pageContext
     * @returns {Promise<object|null>}
     */
    async function record(pageContext) {
        if (!_uid || !pageContext || !pageContext.pageId) {
            return null;
        }

        // 1. Fecha a visita anterior (outra página) na mesma sessão
        await closeActiveVisit();

        var visitedAt = new Date();
        var visit = Object.assign({}, pageContext, {
            historyId: "",
            visitedAt: visitedAt,
            exitAt: null,
            duration: 0,
            device: window.HistoryModules.utils.detectDevice(),
            browser: window.HistoryModules.utils.detectBrowser(),
            operatingSystem: window.HistoryModules.utils.detectOS(),
            country: window.HistoryModules.utils.detectCountry(),
            referrer: window.HistoryModules.utils.getReferrer(),
            visitNumber: window.HistoryModules.session.nextVisitNumber(),
            sessionId: window.HistoryModules.session.getSessionId(),
            tags: pageContext.tags || [],
            metadata: {}
        });

        try {
            var id = await window.HistoryModules.service.addVisit(_uid, visit);
            visit.historyId = id;
            visit.id = id;

            _items.unshift(visit);
            if (_items.length > 1000) {
                _items = _items.slice(0, 1000);
            }
            _updateCache();

            window.HistoryModules.session.setActiveVisit({
                historyId: id,
                pageId: pageContext.pageId,
                visitedAt: visitedAt
            });

            console.log("[History] Visita registrada:", pageContext.pageId);

            _emit(window.HistoryModules.events.EVENTS.RECORDED, visit);
            _emit(window.HistoryModules.events.EVENTS.CHANGED, _items.slice());
            return visit;
        } catch (e) {
            console.error("[History] Erro ao registrar visita:", e && e.code ? e.code : e);
            _emit(window.HistoryModules.events.EVENTS.ERROR, e);
            return null;
        }
    }

    /**
     * Exclui um registro do histórico.
     * @param {string} historyId
     * @returns {Promise<void>}
     */
    async function remove(historyId) {
        if (!_uid || !historyId) {
            return;
        }

        try {
            await window.HistoryModules.service.deleteVisit(_uid, historyId);
        } catch (e) {
            console.warn("[History] Erro ao excluir registro:", e);
            _emit(window.HistoryModules.events.EVENTS.ERROR, e);
            throw e;
        }

        _items = _items.filter(function (h) {
            return h.id !== historyId;
        });
        _updateCache();
        _emit(window.HistoryModules.events.EVENTS.CHANGED, _items.slice());
    }

    /**
     * Exclui todo o histórico do usuário.
     * @returns {Promise<void>}
     */
    async function clearAll() {
        if (!_uid) {
            return;
        }

        try {
            await window.HistoryModules.service.clearHistory(_uid);
        } catch (e) {
            console.warn("[History] Erro ao excluir histórico:", e);
            _emit(window.HistoryModules.events.EVENTS.ERROR, e);
            throw e;
        }

        _items = [];
        _updateCache();
        window.HistoryModules.session.clearActiveVisit();
        _emit(window.HistoryModules.events.EVENTS.CLEARED);
        _emit(window.HistoryModules.events.EVENTS.CHANGED, []);
    }

    /**
     * Reseta o estado em memória (no logout).
     */
    function reset() {
        _uid = null;
        _items = [];
        _loaded = false;
        _loading = null;
        window.HistoryModules.session.reset();
    }

    // ─── Exportação ─────────────────────────────────────────────────
    window.HistoryModules.sync = {
        load: load,
        refresh: refresh,
        record: record,
        closeActiveVisit: closeActiveVisit,
        remove: remove,
        clearAll: clearAll,
        getAll: getAll,
        count: count,
        reset: reset
    };

    console.log("[History] Módulo history-sync.js carregado.");

})(window);
