/**
 * js/favorites/favorites-cache.js
 *
 * RESPONSABILIDADE: Cache local temporário dos favoritos (espelho do Firestore).
 *
 * O Firestore é SEMPRE a fonte oficial. O cache serve apenas para abrir rápido
 * e reduzir leituras. Usa o prefixo "auth_" para que o logout (clearCache do
 * auth-session.js) limpe tudo junto.
 */

(function (window) {
    "use strict";

    // ─── Garante que o namespace existe ───────────────────────────
    window.FavoritesModules = window.FavoritesModules || {};

    var CACHE_KEY = "auth_favorites_cache";
    var TTL_MS = 5 * 60 * 1000; // 5 minutos de validade

    /**
     * Grava a lista de favoritos no cache.
     * @param {string} uid
     * @param {object[]} items
     */
    function set(uid, items) {
        if (!uid) {
            return;
        }
        try {
            localStorage.setItem(
                CACHE_KEY,
                JSON.stringify({ uid: uid, items: items || [], cachedAt: Date.now() })
            );
        } catch (e) {
            console.warn("[FavoritesCache] Não foi possível gravar o cache:", e);
        }
    }

    /**
     * Recupera a lista de favoritos do cache (se for do usuário e estiver válida).
     * @param {string} uid
     * @returns {object[]|null} null se não houver cache válido.
     */
    function get(uid) {
        if (!uid) {
            return null;
        }
        try {
            var raw = localStorage.getItem(CACHE_KEY);
            if (!raw) {
                return null;
            }
            var parsed = JSON.parse(raw);
            if (!parsed || parsed.uid !== uid) {
                return null;
            }
            if (Date.now() - (parsed.cachedAt || 0) > TTL_MS) {
                clear();
                return null;
            }
            return parsed.items || [];
        } catch (e) {
            return null;
        }
    }

    /**
     * Remove o cache de favoritos.
     */
    function clear() {
        try {
            localStorage.removeItem(CACHE_KEY);
        } catch (e) {
            /* ignora */
        }
    }

    /**
     * Verifica se há cache válido para o usuário.
     * @param {string} uid
     * @returns {boolean}
     */
    function has(uid) {
        return get(uid) !== null;
    }

    // ─── Exportação ─────────────────────────────────────────────────
    window.FavoritesModules.cache = {
        set: set,
        get: get,
        clear: clear,
        has: has
    };

    console.log("[Favorites] Módulo favorites-cache.js carregado.");

})(window);
