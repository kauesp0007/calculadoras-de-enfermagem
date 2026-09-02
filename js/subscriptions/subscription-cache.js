/**
 * js/subscriptions/subscription-cache.js
 *
 * RESPONSABILIDADE: Cache local da assinatura (Fase 7).
 *
 * O Firestore é SEMPRE a fonte oficial. Este cache serve apenas para resposta
 * instantânea na UI enquanto o Firestore responde. Armazena somente dados
 * NÃO sensíveis (nunca tokens, senhas ou dados de pagamento).
 *
 * Chaves usam o prefixo "sub_" para limpeza independente no logout.
 */

(function (window) {
    "use strict";

    window.SubscriptionModules = window.SubscriptionModules || {};

    var KEY_PREFIX = "sub_";
    var TTL_MS = 5 * 60 * 1000; // 5 minutos

    function _key(uid) {
        return KEY_PREFIX + "subscription_" + uid;
    }

    /**
     * Grava a assinatura no cache.
     * @param {string} uid
     * @param {object} subscription
     */
    function set(uid, subscription) {
        if (!uid || !subscription) {
            return;
        }
        try {
            localStorage.setItem(_key(uid), JSON.stringify({
                data: subscription,
                cachedAt: Date.now()
            }));
        } catch (e) {
            console.warn("[SubscriptionCache] Não foi possível gravar o cache:", e);
        }
    }

    /**
     * Recupera a assinatura do cache, se ainda válida.
     * @param {string} uid
     * @returns {object|null}
     */
    function get(uid) {
        try {
            var raw = localStorage.getItem(_key(uid));
            if (!raw) {
                return null;
            }
            var parsed = JSON.parse(raw);
            if (!parsed || !parsed.data) {
                return null;
            }
            if (Date.now() - (parsed.cachedAt || 0) > TTL_MS) {
                clear(uid);
                return null;
            }
            return parsed.data;
        } catch (e) {
            return null;
        }
    }

    /**
     * Remove o cache da assinatura.
     * @param {string} uid
     */
    function clear(uid) {
        try {
            localStorage.removeItem(_key(uid));
        } catch (e) {
            /* ignora */
        }
    }

    window.SubscriptionModules.cache = {
        set: set,
        get: get,
        clear: clear
    };

    console.log("[Subscription] Módulo subscription-cache.js carregado.");

})(window);
