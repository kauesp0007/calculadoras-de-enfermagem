/**
 * js/favorites/favorites-service.js
 *
 * RESPONSABILIDADE: Camada exclusiva de comunicação com o Firestore
 * para a subcoleção de favoritos: users/{uid}/favorites/{pageId}.
 *
 * Nenhuma outra parte do sistema deve acessar o Firestore diretamente.
 *
 * O ID de cada documento de favorito é o próprio pageId (único por página),
 * o que garante que uma página não seja favoritada duas vezes.
 */

(function (window) {
    "use strict";

    // ─── Garante que o namespace existe ───────────────────────────
    window.FavoritesModules = window.FavoritesModules || {};

    /**
     * Obtém a instância do Firestore.
     * @returns {Promise<object>}
     */
    async function _getDb() {
        return window.FirebaseInit.getFirestore();
    }

    /**
     * Referência da subcoleção de favoritos de um usuário.
     * @param {object} db
     * @param {string} uid
     */
    function _colRef(db, uid) {
        return db.collection("users").doc(uid).collection("favorites");
    }

    /**
     * Converte Timestamps em Date.
     * @param {object|null} data
     * @returns {object|null}
     */
    function _fromFirestore(data) {
        if (!data) {
            return null;
        }
        var out = Object.assign({}, data);
        ["createdAt", "updatedAt"].forEach(function (field) {
            if (out[field] && typeof out[field].toDate === "function") {
                out[field] = out[field].toDate();
            }
        });
        return out;
    }

    /**
     * Retorna o FieldValue.serverTimestamp().
     * @returns {object|null}
     */
    function serverTimestamp() {
        if (
            window.firebase &&
            window.firebase.firestore &&
            window.firebase.firestore.FieldValue
        ) {
            return window.firebase.firestore.FieldValue.serverTimestamp();
        }
        return null;
    }

    // ─── API Pública ────────────────────────────────────────────────

    /**
     * Lista todos os favoritos do usuário.
     * @param {string} uid
     * @returns {Promise<object[]>}
     */
    async function listFavorites(uid) {
        if (!uid) {
            return [];
        }

        var db = await _getDb();
        var snapshot = await _colRef(db, uid).get();

        var items = [];
        snapshot.forEach(function (doc) {
            var data = _fromFirestore(doc.data());
            if (data) {
                data.id = doc.id;
                items.push(data);
            }
        });

        // Ordena no cliente (evita necessidade de índice composto)
        items.sort(function (a, b) {
            var ta = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
            var tb = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
            return tb - ta; // mais recentes primeiro
        });

        return items;
    }

    /**
     * Busca um favorito específico pelo pageId.
     * @param {string} uid
     * @param {string} pageId
     * @returns {Promise<object|null>}
     */
    async function getFavorite(uid, pageId) {
        if (!uid || !pageId) {
            return null;
        }

        var db = await _getDb();
        var doc = await _colRef(db, uid).doc(pageId).get();
        if (!doc.exists) {
            return null;
        }
        var data = _fromFirestore(doc.data());
        if (data) {
            data.id = doc.id;
        }
        return data;
    }

    /**
     * Adiciona ou atualiza um favorito.
     * Na criação, define createdAt/updatedAt; na atualização, preserva createdAt.
     * @param {string} uid
     * @param {object} favorite - Deve conter pageId.
     * @returns {Promise<object>}
     */
    async function addFavorite(uid, favorite) {
        if (!uid || !favorite || !favorite.pageId) {
            throw new Error("[FavoritesService] pageId é obrigatório.");
        }

        var db = await _getDb();
        var docRef = _colRef(db, uid).doc(favorite.pageId);
        var existing = await docRef.get();
        var now = new Date();
        var ts = serverTimestamp();

        if (existing.exists) {
            // Atualiza sem sobrescrever createdAt
            var update = Object.assign({}, favorite, { updatedAt: ts || now });
            await docRef.set(update, { merge: true });
        } else {
            // Cria com createdAt e updatedAt
            var create = Object.assign({}, favorite, {
                createdAt: ts || now,
                updatedAt: ts || now
            });
            await docRef.set(create);
        }

        return favorite;
    }

    /**
     * Remove um favorito pelo pageId.
     * @param {string} uid
     * @param {string} pageId
     * @returns {Promise<void>}
     */
    async function removeFavorite(uid, pageId) {
        if (!uid || !pageId) {
            return;
        }

        var db = await _getDb();
        await _colRef(db, uid).doc(pageId).delete();
    }

    // ─── Exportação ─────────────────────────────────────────────────
    window.FavoritesModules.service = {
        listFavorites: listFavorites,
        getFavorite: getFavorite,
        addFavorite: addFavorite,
        removeFavorite: removeFavorite,
        serverTimestamp: serverTimestamp
    };

    console.log("[Favorites] Módulo favorites-service.js carregado.");

})(window);
