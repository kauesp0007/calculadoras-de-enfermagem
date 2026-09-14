/**
 * js/auth/firestore-user.js
 *
 * RESPONSABILIDADE: Camada exclusiva de comunicação com o Firestore.
 *
 * Nenhuma outra parte do sistema deve acessar o Firestore diretamente.
 * Toda leitura/escrita do perfil do usuário passa por este serviço.
 *
 * COLEÇÃO: users/{uid}
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
        var snapshot = await _docRef(db, uid).get();
        return _normalizeDoc(snapshot);
    }

    // Criação defensiva: não substitui um documento existente.
    // Isso evita que dois ciclos de login concorrentes apaguem dados de assinatura,
    // preferências ou histórico gravados entre os dois ciclos.
    async function createUserDoc(uid, data) {
        if (!uid) throw new Error("[FirestoreUser] UID é obrigatório.");
        var db = await _getDb();
        var ref = _docRef(db, uid);
        var snapshot = await ref.get();
        if (snapshot.exists) return _normalizeDoc(snapshot);
        await ref.create(data);
        return data;
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

    async function deleteUserDoc(uid) {
        if (!uid) return;
        var db = await _getDb();
        await _docRef(db, uid).delete();
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
        deleteUserDoc: deleteUserDoc,
        serverTimestamp: serverTimestamp
    };

    console.log("[Auth] Módulo firestore-user.js carregado.");
})(window);
