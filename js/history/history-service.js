/**
 * js/history/history-service.js
 *
 * RESPONSABILIDADE: Camada exclusiva de comunicação com o Firestore
 * para a subcoleção de histórico: users/{uid}/history/{historyId}.
 *
 * Nenhuma outra parte do sistema deve acessar o Firestore diretamente.
 * Cada visita gera um documento com ID automático (permite múltiplas
 * visitas à mesma página, diferente de favoritos).
 */

(function (window) {
    "use strict";

    // ─── Garante que o namespace existe ───────────────────────────
    window.HistoryModules = window.HistoryModules || {};

    async function _getDb() {
        return window.FirebaseInit.getFirestore();
    }

    function _colRef(db, uid) {
        return db.collection("users").doc(uid).collection("history");
    }

    function _fromFirestore(data) {
        if (!data) {
            return null;
        }
        var out = Object.assign({}, data);
        ["visitedAt", "exitAt", "createdAt"].forEach(function (field) {
            if (out[field] && typeof out[field].toDate === "function") {
                out[field] = out[field].toDate();
            }
        });
        return out;
    }

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
     * Registra uma nova visita (ID automático).
     * @param {string} uid
     * @param {object} data
     * @returns {Promise<string>} ID do documento criado.
     */
    async function addVisit(uid, data) {
        if (!uid || !data) {
            throw new Error("[HistoryService] uid e dados são obrigatórios.");
        }

        var db = await _getDb();
        var ref = await _colRef(db, uid).add(data);
        return ref.id;
    }

    /**
     * Atualiza uma visita (ex.: fechar com exitAt/duration).
     * @param {string} uid
     * @param {string} historyId
     * @param {object} data
     * @returns {Promise<void>}
     */
    async function updateVisit(uid, historyId, data) {
        if (!uid || !historyId || !data) {
            return;
        }

        var db = await _getDb();
        await _colRef(db, uid).doc(historyId).update(data);
    }

    /**
     * Lista o histórico do usuário (mais recentes primeiro).
     * @param {string} uid
     * @param {number} [limit]
     * @returns {Promise<object[]>}
     */
    async function listHistory(uid, limit) {
        if (!uid) {
            return [];
        }

        var db = await _getDb();
        var query = _colRef(db, uid)
            .orderBy("visitedAt", "desc")
            .limit(limit || 1000);

        var snapshot = await query.get();

        var items = [];
        snapshot.forEach(function (doc) {
            var data = _fromFirestore(doc.data());
            if (data) {
                data.id = doc.id;
                items.push(data);
            }
        });

        return items;
    }

    /**
     * Exclui uma visita específica.
     * @param {string} uid
     * @param {string} historyId
     * @returns {Promise<void>}
     */
    async function deleteVisit(uid, historyId) {
        if (!uid || !historyId) {
            return;
        }

        var db = await _getDb();
        await _colRef(db, uid).doc(historyId).delete();
    }

    /**
     * Exclui todo o histórico do usuário.
     * @param {string} uid
     * @returns {Promise<void>}
     */
    async function clearHistory(uid) {
        if (!uid) {
            return;
        }

        var db = await _getDb();
        var snapshot = await _colRef(db, uid).get();

        var batch = db.batch();
        var count = 0;
        var hasOps = false;

        snapshot.forEach(function (doc) {
            batch.delete(doc.ref);
            count++;
            hasOps = true;
            // Firestore limita batch a 500 operações
            if (count >= 500) {
                batch.commit();
                batch = db.batch();
                count = 0;
            }
        });

        if (count > 0) {
            await batch.commit();
        }
        if (!hasOps) {
            return;
        }
    }

    // ─── Exportação ─────────────────────────────────────────────────
    window.HistoryModules.service = {
        addVisit: addVisit,
        updateVisit: updateVisit,
        listHistory: listHistory,
        deleteVisit: deleteVisit,
        clearHistory: clearHistory,
        serverTimestamp: serverTimestamp
    };

    console.log("[History] Módulo history-service.js carregado.");

})(window);
