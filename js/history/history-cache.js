/**
 * js/history/history-cache.js
 *
 * RESPONSABILIDADE: Cache local temporário do histórico (espelho do Firestore).
 *
 * O Firestore é SEMPRE a fonte oficial. O cache serve para abrir rápido e
 * reduzir leituras. Usa o prefixo "auth_" para que o logout (clearCache do
 * auth-session.js) limpe tudo junto.
 */

(function (window) {
    "use strict";

    // ─── Garante que o namespace existe ───────────────────────────
    window.HistoryModules = window.HistoryModules || {};

    var CACHE_KEY = "auth_history_cache";
    var TTL_MS = 5 * 60 * 1000; // 5 minutos de validade

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
            console.warn("[HistoryCache] Não foi possível gravar o cache:", e);
        }
    }

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

    function clear() {
        try {
            localStorage.removeItem(CACHE_KEY);
        } catch (e) {
            /* ignora */
        }
    }

    function has(uid) {
        return get(uid) !== null;
    }

    // ─── Exportação ─────────────────────────────────────────────────
    window.HistoryModules.cache = {
        set: set,
        get: get,
        clear: clear,
        has: has
    };

    console.log("[History] Módulo history-cache.js carregado.");

})(window);
