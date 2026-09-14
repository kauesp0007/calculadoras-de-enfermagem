/**
 * js/auth/firestore-user.js
 *
 * RESPONSABILIDADE: Camada exclusiva de comunicação com o Firestore.
 *
 * COLEÇÃO: users/{uid}
 *
 * Perfis de usuário não são apagados pelo cliente. Exclusão de conta/retensão
 * deve ser tratada por um fluxo administrativo/servidor separado, preservando
 * histórico financeiro e registros necessários.
 */
(function (window) {
    "use strict";

    window.AuthModules = window.AuthModules || {};
    var COLLECTION = "users";

    async function _getDb() {
        return window.FirebaseInit.getFirestore();
    }

    function _docRef(db, uid) {
        return db.collection(COLLECTION).doc(uid);
    }

    function _fromFirestore(data) {
        if (!data) return null;
        var out = Object.assign({}, data);
        ["createdAt", "lastLoginAt", "updatedAt", "planUpdatedAt", "planExpiresAt", "lastAsaasActivationAt"].forEach(function (field) {
            if (out[field] && typeof out[field].toDate === "function") out[field] = out[field].toDate();
        });
        return out;
    }

    function _normalizeDoc(snapshot) {
        if (!snapshot || !snapshot.exists) return null;
        return _fromFirestore(snapshot.data());
    }

    async function getUserDoc(uid) {
        if (!uid) return null;
        var db = await _getDb();
        return _normalizeDoc(await _docRef(db, uid).get());
    }

    // Criação defensiva: não substitui um documento existente.
    // Se dois ciclos de login concorrerem, uma criação pode vencer primeiro;
    // o segundo ciclo apenas relê o documento vencedor.
    async function createUserDoc(uid, data) {
        if (!uid) throw new Error("[FirestoreUser] UID é obrigatório.");
        var db = await _getDb();
        var ref = _docRef(db, uid);
        var snapshot = await ref.get();
        if (snapshot.exists) return _normalizeDoc(snapshot);
        try {
            await ref.create(data);
            return data;
        } catch (error) {
            var code = error && (error.code !== undefined ? error.code : error.status);
            if (code === 6 || String(code).toUpperCase() === "ALREADY_EXISTS") {
                var existing = await ref.get();
                if (existing.exists) return _normalizeDoc(existing);
            }
            throw error;
        }
    }

    async function updateUserDoc(uid, data) {
        if (!uid || !data) return;
        var db = await _getDb();
        await _docRef(db, uid).update(data);
    }

    async function mergeUserDoc(uid, data) {
        if (!uid || !data) return;
        var db = await _getDb();
        await _docRef(db, uid).set(data, { merge: true });
    }

    function serverTimestamp() {
        if (window.firebase && window.firebase.firestore && window.firebase.firestore.FieldValue) {
            return window.firebase.firestore.FieldValue.serverTimestamp();
        }
        return null;
    }

    window.AuthModules.firestoreUser = {
        collection: COLLECTION,
        getUserDoc: getUserDoc,
        createUserDoc: createUserDoc,
        updateUserDoc: updateUserDoc,
        mergeUserDoc: mergeUserDoc,
        serverTimestamp: serverTimestamp
    };

    console.log("[Auth] Módulo firestore-user.js carregado.");
})(window);