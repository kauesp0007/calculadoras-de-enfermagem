/**
 * js/auth/firestore-user.js
 *
 * RESPONSABILIDADE: Camada exclusiva de comunicação com o Firestore.
 *
 * Nenhuma outra parte do sistema deve acessar o Firestore diretamente.
 * Toda leitura/escrita do perfil do usuário passa por este serviço.
 *
 * COLEÇÃO: users/{uid}  (documento identificado pelo UID do Firebase Auth)
 *
 * USO (interno — chamado por auth-user-profile.js):
 *   var data = await AuthModules.firestoreUser.getUserDoc(uid);
 *   await AuthModules.firestoreUser.createUserDoc(uid, dados);
 */

(function (window) {
    "use strict";

    // ─── Garante que o namespace existe ───────────────────────────
    window.AuthModules = window.AuthModules || {};

    // ─── Constantes ────────────────────────────────────────────────
    var COLLECTION = "users";

    // ─── Helpers internos ──────────────────────────────────────────

    /**
     * Obtém a instância do Firestore (inicializa o Firebase se necessário).
     * @returns {Promise<object>}
     */
    async function _getDb() {
        return window.FirebaseInit.getFirestore();
    }

    /**
     * Referência do documento do usuário.
     * @param {object} db - Instância do Firestore.
     * @param {string} uid - UID do usuário.
     */
    function _docRef(db, uid) {
        return db.collection(COLLECTION).doc(uid);
    }

    /**
     * Converte Timestamps do Firestore em Date (não-serializáveis no JSON).
     * @param {object|null} data
     * @returns {object|null}
     */
    function _fromFirestore(data) {
        if (!data) {
            return null;
        }

        var out = Object.assign({}, data);
        var timestampFields = ["createdAt", "lastLoginAt", "updatedAt", "planExpiresAt"];

        timestampFields.forEach(function (field) {
            if (out[field] && typeof out[field].toDate === "function") {
                out[field] = out[field].toDate();
            }
        });

        return out;
    }

    /**
     * Normaliza o snapshot do Firestore.
     * @param {object} snapshot
     * @returns {object|null}
     */
    function _normalizeDoc(snapshot) {
        if (!snapshot || !snapshot.exists) {
            return null;
        }
        return _fromFirestore(snapshot.data());
    }

    // ─── API Pública ────────────────────────────────────────────────

    /**
     * Busca o documento do usuário no Firestore.
     * @param {string} uid
     * @returns {Promise<object|null>} Dados do documento ou null.
     */
    async function getUserDoc(uid) {
        if (!uid) {
            return null;
        }

        var db = await _getDb();
        var snapshot = await _docRef(db, uid).get();
        return _normalizeDoc(snapshot);
    }

    /**
     * Cria o documento do usuário (falha se já existir).
     * @param {string} uid
     * @param {object} data
     * @returns {Promise<object>}
     */
    async function createUserDoc(uid, data) {
        if (!uid) {
            throw new Error("[FirestoreUser] UID é obrigatório.");
        }

        var db = await _getDb();
        await _docRef(db, uid).set(data);
        return data;
    }

    /**
     * Atualiza campos específicos do documento (preserva os demais).
     * Suporta caminhos com ponto, ex.: { "preferences.theme": "dark" }.
     * @param {string} uid
     * @param {object} data
     * @returns {Promise<void>}
     */
    async function updateUserDoc(uid, data) {
        if (!uid || !data) {
            return;
        }

        var db = await _getDb();
        await _docRef(db, uid).update(data);
    }

    /**
     * Mescla dados no documento (cria se não existir, com merge).
     * @param {string} uid
     * @param {object} data
     * @returns {Promise<void>}
     */
    async function mergeUserDoc(uid, data) {
        if (!uid || !data) {
            return;
        }

        var db = await _getDb();
        await _docRef(db, uid).set(data, { merge: true });
    }

    /**
     * Exclui o documento do usuário (uso futuro — exclusão de conta).
     * @param {string} uid
     * @returns {Promise<void>}
     */
    async function deleteUserDoc(uid) {
        if (!uid) {
            return;
        }

        var db = await _getDb();
        await _docRef(db, uid).delete();
    }

    /**
     * Retorna o FieldValue.serverTimestamp() do Firestore.
     * Usado para createdAt / lastLoginAt.
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

    // ─── Exportação ─────────────────────────────────────────────────
    window.AuthModules.firestoreUser = {
        collection: COLLECTION,
        getUserDoc: getUserDoc,
        createUserDoc: createUserDoc,
        updateUserDoc: updateUserDoc,
        mergeUserDoc: mergeUserDoc,
        deleteUserDoc: deleteUserDoc,
        serverTimestamp: serverTimestamp
    };

    console.log("[Auth] Módulo firestore-user.js carregado.");

})(window);
