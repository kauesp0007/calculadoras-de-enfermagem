/**
 * js/favorites/favorites-sync.js
 *
 * RESPONSABILIDADE: Orquestração e sincronização dos favoritos.
 *
 * Mantém o estado em memória (uma vez por sessão), sincroniza com o Firestore
 * (fonte oficial) e atualiza o cache local + eventos automaticamente.
 *
 * USO:
 *   await FavoritesModules.sync.load(uid);
 *   await FavoritesModules.sync.toggle(pageContext);
 *   var n = FavoritesModules.sync.count();
 */

(function (window) {
    "use strict";

    // ─── Garante que o namespace existe ───────────────────────────
    window.FavoritesModules = window.FavoritesModules || {};

    // ─── Estado interno ────────────────────────────────────────────
    var _uid = null;
    var _items = [];
    var _loaded = false;
    var _loading = null;

    function _emit(event, payload) {
        if (window.FavoritesModules.events) {
            window.FavoritesModules.events.emit(event, payload);
        }
    }

    function _updateCache() {
        if (window.FavoritesModules.cache) {
            window.FavoritesModules.cache.set(_uid, _items);
        }
    }

    function _indexOf(pageId) {
        for (var i = 0; i < _items.length; i++) {
            if (_items[i].pageId === pageId) {
                return i;
            }
        }
        return -1;
    }

    // ─── API Pública ────────────────────────────────────────────────

    /**
     * Retorna a lista atual de favoritos (cópia).
     * @returns {object[]}
     */
    function getAll() {
        return _items.slice();
    }

    /**
     * Retorna a quantidade de favoritos.
     * @returns {number}
     */
    function count() {
        return _items.length;
    }

    /**
     * Verifica se uma página está favoritada.
     * @param {string} pageId
     * @returns {boolean}
     */
    function isFavorite(pageId) {
        return _indexOf(pageId) !== -1;
    }

    /**
     * Carrega os favoritos do usuário (cache primeiro, Firestore em seguida).
     * Sempre retorna uma Promise.
     * @param {string} uid
     * @returns {Promise<object[]>}
     */
    async function load(uid) {
        if (!uid) {
            reset();
            return [];
        }

        // Já carregado para este usuário nesta sessão
        if (_loaded && _uid === uid) {
            return _items.slice();
        }

        // Evita carregamentos concorrentes
        if (_loading) {
            return _loading;
        }

        _uid = uid;

        // 1. Cache local (resposta instantânea)
        var cached = window.FavoritesModules.cache
            ? window.FavoritesModules.cache.get(uid)
            : null;

        if (cached !== null) {
            _items = cached;
            _loaded = true;
            _emit(window.FavoritesModules.events.EVENTS.LOADED, _items.slice());
            // Revalida em segundo plano (não bloqueia a UI)
            _loading = refresh(uid);
            return _loading;
        }

        // 2. Firestore (fonte oficial)
        _loading = refresh(uid);
        return _loading;
    }

    /**
     * Busca os favoritos no Firestore e atualiza estado/cache/eventos.
     * @param {string} [uid]
     * @returns {Promise<object[]>}
     */
    async function refresh(uid) {
        uid = uid || _uid;
        if (!uid) {
            return [];
        }

        try {
            var list = await window.FavoritesModules.service.listFavorites(uid);
            _items = list;
            _loaded = true;
            _updateCache();
            _emit(window.FavoritesModules.events.EVENTS.LOADED, list.slice());
            _emit(window.FavoritesModules.events.EVENTS.CHANGED, list.slice());
            return list.slice();
        } catch (e) {
            console.warn("[Favorites] Erro ao carregar favoritos:", e);
            _emit(window.FavoritesModules.events.EVENTS.ERROR, e);
            return _items.slice();
        } finally {
            _loading = null;
        }
    }

    /**
     * Adiciona um favorito (grava Firestore + cache + eventos).
     * @param {object} pageContext
     * @returns {Promise<object|null>}
     */
    async function add(pageContext) {
        if (!_uid || !pageContext || !pageContext.pageId) {
            return null;
        }
        if (isFavorite(pageContext.pageId)) {
            return null; // já favoritado
        }

        try {
            await window.FavoritesModules.service.addFavorite(_uid, pageContext);

            var item = Object.assign({}, pageContext, {
                createdAt: new Date(),
                updatedAt: new Date()
            });
            _items.push(item);
            _updateCache();

            _emit(window.FavoritesModules.events.EVENTS.ADDED, item);
            _emit(window.FavoritesModules.events.EVENTS.CHANGED, _items.slice());
            return item;
        } catch (e) {
            console.warn("[Favorites] Erro ao adicionar favorito:", e);
            _emit(window.FavoritesModules.events.EVENTS.ERROR, e);
            throw e;
        }
    }

    /**
     * Remove um favorito (grava Firestore + cache + eventos).
     * @param {string} pageId
     * @returns {Promise<void>}
     */
    async function remove(pageId) {
        if (!_uid || !pageId) {
            return;
        }

        var idx = _indexOf(pageId);

        try {
            await window.FavoritesModules.service.removeFavorite(_uid, pageId);
        } catch (e) {
            console.warn("[Favorites] Erro ao remover favorito:", e);
            _emit(window.FavoritesModules.events.EVENTS.ERROR, e);
            throw e;
        }

        if (idx !== -1) {
            var removed = _items.splice(idx, 1)[0];
            _updateCache();
            _emit(window.FavoritesModules.events.EVENTS.REMOVED, removed);
            _emit(window.FavoritesModules.events.EVENTS.CHANGED, _items.slice());
        }
    }

    /**
     * Alterna favorito (adiciona se não existe, remove se existe).
     * @param {object} pageContext
     * @returns {Promise<boolean>} true se ficou favoritado.
     */
    async function toggle(pageContext) {
        if (!pageContext || !pageContext.pageId) {
            return false;
        }
        if (isFavorite(pageContext.pageId)) {
            await remove(pageContext.pageId);
            return false;
        }
        await add(pageContext);
        return true;
    }

    /**
     * Limpa o estado em memória (não limpa o cache — isso é feito no logout).
     */
    function reset() {
        _uid = null;
        _items = [];
        _loaded = false;
        _loading = null;
    }

    // ─── Exportação ─────────────────────────────────────────────────
    window.FavoritesModules.sync = {
        load: load,
        refresh: refresh,
        add: add,
        remove: remove,
        toggle: toggle,
        isFavorite: isFavorite,
        count: count,
        getAll: getAll,
        reset: reset
    };

    console.log("[Favorites] Módulo favorites-sync.js carregado.");

})(window);
