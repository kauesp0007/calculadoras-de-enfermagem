/**
 * js/subscriptions/subscription-service.js
 *
 * RESPONSABILIDADE: Camada exclusiva de comunicação com o Firestore para
 * assinaturas (Fase 7).
 *
 * Nenhuma outra parte do sistema acessa a coleção de assinaturas diretamente.
 *
 * COLEÇÃO: users/{uid}/subscriptions/{subscriptionId}
 */

(function (window) {
    "use strict";

    window.SubscriptionModules = window.SubscriptionModules || {};

    async function _getDb() {
        return window.FirebaseInit.getFirestore();
    }

    function _col(db, uid) {
        return db.collection("users").doc(uid).collection("subscriptions");
    }

    function _normalize(snapshot) {
        if (!snapshot || !snapshot.exists) {
            return null;
        }
        var data = snapshot.data();
        return Object.assign({}, data, { subscriptionId: snapshot.id });
    }

    /**
     * Busca a assinatura ativa (ou a mais recente) do usuário.
     * @param {string} uid
     * @returns {Promise<object|null>}
     */
    async function getSubscription(uid) {
        if (!uid) {
            return null;
        }
        var db = await _getDb();
        var snapshot = await _col(db, uid)
            .orderBy("createdAt", "desc")
            .limit(1)
            .get();
        if (snapshot.empty) {
            return null;
        }
        return _normalize(snapshot.docs[0]);
    }

    /**
     * Cria um novo documento de assinatura.
     * @param {string} uid
     * @param {object} data - campos da assinatura (sem subscriptionId).
     * @returns {Promise<object>}
     */
    async function createSubscription(uid, data) {
        if (!uid) {
            throw new Error("[SubscriptionService] UID é obrigatório.");
        }
        var db = await _getDb();
        var docRef = await _col(db, uid).add(Object.assign({}, data, {
            userId: uid
        }));
        return Object.assign({}, data, { userId: uid, subscriptionId: docRef.id });
    }

    /**
     * Atualiza campos de uma assinatura (preserva os demais).
     * @param {string} uid
     * @param {string} subscriptionId
     * @param {object} data
     * @returns {Promise<void>}
     */
    async function updateSubscription(uid, subscriptionId, data) {
        if (!uid || !subscriptionId || !data) {
            return;
        }
        var db = await _getDb();
        await _col(db, uid).doc(subscriptionId).update(data);
    }

    /**
     * Exclui uma assinatura.
     * @param {string} uid
     * @param {string} subscriptionId
     * @returns {Promise<void>}
     */
    async function deleteSubscription(uid, subscriptionId) {
        if (!uid || !subscriptionId) {
            return;
        }
        var db = await _getDb();
        await _col(db, uid).doc(subscriptionId).delete();
    }

    /**
     * Retorna o FieldValue.serverTimestamp() do Firestore.
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

    window.SubscriptionModules.service = {
        getSubscription: getSubscription,
        createSubscription: createSubscription,
        updateSubscription: updateSubscription,
        deleteSubscription: deleteSubscription,
        serverTimestamp: serverTimestamp
    };

    console.log("[Subscription] Módulo subscription-service.js carregado.");

})(window);
