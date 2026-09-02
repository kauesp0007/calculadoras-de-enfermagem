/**
 * js/subscriptions/subscription-utils.js
 *
 * RESPONSABILIDADE: Funções auxiliares do Sistema de Assinaturas (Fase 7).
 *
 * Centraliza geração de IDs, normalização de datas/status e rótulos
 * amigáveis dos estados de assinatura.
 */

(function (window) {
    "use strict";

    window.SubscriptionModules = window.SubscriptionModules || {};

    /**
     * Gera um ID único para uma assinatura.
     * @returns {string}
     */
    function newId() {
        var ts = Date.now().toString(36);
        var rand = Math.random().toString(36).slice(2, 10);
        return "sub_" + ts + "_" + rand;
    }

    /**
     * Retorna o timestamp atual em ISO.
     * @returns {string}
     */
    function nowIso() {
        return new Date().toISOString();
    }

    /**
     * Converte um valor (Timestamp do Firestore ou Date) em Date.
     * @param {*} value
     * @returns {Date|null}
     */
    function toDate(value) {
        if (!value) {
            return null;
        }
        if (value instanceof Date) {
            return value;
        }
        if (typeof value.toDate === "function") {
            return value.toDate();
        }
        var d = new Date(value);
        return isNaN(d.getTime()) ? null : d;
    }

    /**
     * Rótulos amigáveis (pt-BR) dos estados de assinatura.
     */
    var STATUS_LABELS = {
        pending: "Pendente",
        trial: "Período de teste",
        active: "Ativa",
        gracePeriod: "Período de carência",
        paused: "Pausada",
        cancelRequested: "Cancelamento solicitado",
        cancelled: "Cancelada",
        expired: "Expirada",
        blocked: "Bloqueada",
        failed: "Falha"
    };

    /**
     * Retorna o rótulo amigável de um estado.
     * @param {string} status
     * @returns {string}
     */
    function statusLabel(status) {
        return STATUS_LABELS[status] || status || "—";
    }

    window.SubscriptionModules.utils = {
        newId: newId,
        nowIso: nowIso,
        toDate: toDate,
        STATUS_LABELS: STATUS_LABELS,
        statusLabel: statusLabel
    };

    console.log("[Subscription] Módulo subscription-utils.js carregado.");

})(window);
