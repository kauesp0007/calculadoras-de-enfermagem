/**
 * js/auth/user-cache.js
 *
 * RESPONSABILIDADE: Cache temporário do perfil do usuário (espelho do Firestore).
 *
 * O Firestore é SEMPRE a fonte oficial dos dados.
 * Este cache serve apenas para resposta instantânea na UI enquanto o
 * Firestore responde (evita "flash" de dados vazios).
 *
 * ATENÇÃO: armazena apenas dados NÃO SENSÍVEIS (nunca tokens, senhas, pagamentos).
 * As chaves usam o prefixo "auth_" para que auth-session.js (clearCache)
 * limpe tudo junto no logout.
 */

(function (window) {
    "use strict";

    // ─── Garante que o namespace existe ───────────────────────────
    window.AuthModules = window.AuthModules || {};

    // ─── Constantes ────────────────────────────────────────────────
    var CACHE_KEY = "auth_user_profile_cache";
    var TTL_MS = 5 * 60 * 1000; // 5 minutos de validade

    // ─── API Pública ────────────────────────────────────────────────

    /**
     * Grava o perfil no cache temporário.
     * @param {object} profile
     */
    function set(profile) {
        if (!profile) {
            return;
        }

        try {
            var payload = {
                data: profile,
                cachedAt: Date.now()
            };
            localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
        } catch (e) {
            console.warn("[UserCache] Não foi possível gravar o cache:", e);
        }
    }

    /**
     * Recupera o perfil do cache, se ainda estiver válido.
     * @returns {object|null}
     */
    function get() {
        try {
            var raw = localStorage.getItem(CACHE_KEY);
            if (!raw) {
                return null;
            }

            var parsed = JSON.parse(raw);
            if (!parsed || !parsed.data) {
                return null;
            }

            if (Date.now() - (parsed.cachedAt || 0) > TTL_MS) {
                clear();
                return null;
            }

            return parsed.data;
        } catch (e) {
            return null;
        }
    }

    /**
     * Remove o cache temporário.
     */
    function clear() {
        try {
            localStorage.removeItem(CACHE_KEY);
        } catch (e) {
            /* ignora */
        }
    }

    /**
     * Verifica se existe cache válido.
     * @returns {boolean}
     */
    function isFresh() {
        return get() !== null;
    }

    // ─── Exportação ─────────────────────────────────────────────────
    window.AuthModules.userCache = {
        set: set,
        get: get,
        clear: clear,
        isFresh: isFresh
    };

    console.log("[Auth] Módulo user-cache.js carregado.");

})(window);
