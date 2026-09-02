/**
 * js/subscriptions/subscription-manager.js
 *
 * RESPONSABILIDADE: FACADE do Sistema de Assinaturas (Fase 7).
 *
 * API única (window.Subscription) para gerenciar o ciclo de vida da assinatura:
 * criar, ativar, cancelar, pausar, retomar e trocar plano — SEM gateway de
 * pagamento (isso é a Fase 8). Toda transição passa pela máquina de estados
 * (subscription-validator.js) e é registrada no histórico.
 *
 * IMPORTANTE: nesta fase a ativação é "simulada" (status pending -> active),
 * porque a ativação real, pós-pagamento, virá de Cloud Functions na Fase 8.
 */

(function (window) {
    "use strict";

    window.Subscription = window.Subscription || {};

    /** @type {object|null} Assinatura atual. */
    var _current = null;

    function _uid() {
        var u = window.Auth && window.Auth.currentUser ? window.Auth.currentUser() : null;
        return u ? u.uid : null;
    }

    function _emit(event, payload) {
        if (window.SubscriptionEvents) {
            window.SubscriptionEvents.emit(event, payload);
            window.SubscriptionEvents.emit(window.SubscriptionEvents.EVENTS.CHANGED, payload);
        }
    }

    function _record(event, meta) {
        if (window.SubscriptionModules.history && _current) {
            window.SubscriptionModules.history.record(_current.subscriptionId, event, meta);
        }
    }

    /**
     * Aplica uma transição de estado validada.
     * @param {string} to
     * @param {object} [extra] - campos adicionais a gravar.
     * @returns {Promise<object>}
     */
    async function _transition(to, extra) {
        var uid = _uid();
        if (!uid || !_current) {
            throw new Error("Nenhuma assinatura carregada.");
        }
        var from = _current.status;
        if (!window.SubscriptionModules.validator.canTransition(from, to)) {
            throw new Error("Transição inválida: '" + from + "' -> '" + to + "'.");
        }

        var patch = Object.assign({ status: to }, extra || {});
        await window.SubscriptionModules.service.updateSubscription(uid, _current.subscriptionId, patch);

        _current = Object.assign({}, _current, patch);
        window.SubscriptionModules.cache.set(uid, _current);
        _record(_eventForStatus(to), { from: from, to: to });
        _emit(_eventForStatus(to), _current);

        return _current;
    }

    function _eventForStatus(status) {
        var EV = window.SubscriptionEvents.EVENTS;
        switch (status) {
            case "active": return EV.ACTIVATED;
            case "cancelled": return EV.CANCELLED;
            case "expired": return EV.EXPIRED;
            default: return EV.CHANGED;
        }
    }

    /**
     * Carrega a assinatura atual do usuário (cache -> Firestore).
     * @returns {Promise<object|null>}
     */
    async function load() {
        var uid = _uid();
        if (!uid) {
            _current = null;
            return null;
        }

        var cached = window.SubscriptionModules.cache.get(uid);
        if (cached) {
            _current = cached;
            _emit(window.SubscriptionEvents.EVENTS.LOADED, cached);
        }

        var doc = await window.SubscriptionModules.service.getSubscription(uid);
        _current = doc || null;
        if (doc) {
            window.SubscriptionModules.cache.set(uid, doc);
        }
        _emit(window.SubscriptionEvents.EVENTS.LOADED, _current);
        return _current;
    }

    /**
     * Cria uma assinatura (status inicial: pending).
     * @param {string} planId
     * @param {object} [opts]
     * @returns {Promise<object>}
     */
    async function create(planId, opts) {
        opts = opts || {};
        var uid = _uid();
        if (!uid) {
            throw new Error("Usuário não autenticado.");
        }
        if (!window.SubscriptionModules.planManager.isAvailable(planId)) {
            throw new Error("Plano indisponível: '" + planId + "'.");
        }
        if (_current && (_current.status === "active" || _current.status === "pending" || _current.status === "trial")) {
            throw new Error("Já existe uma assinatura em andamento.");
        }

        var data = {
            planId: planId,
            status: opts.status || "pending",
            createdAt: window.SubscriptionModules.service.serverTimestamp() || new Date().toISOString(),
            activatedAt: null,
            trialEndsAt: opts.trialEndsAt || null,
            graceEndsAt: null,
            expiresAt: opts.expiresAt || null,
            renewAt: null,
            cancelAt: null,
            provider: opts.provider || null,
            providerSubscriptionId: null,
            metadata: opts.metadata || {}
        };

        _current = await window.SubscriptionModules.service.createSubscription(uid, data);
        window.SubscriptionModules.cache.set(uid, _current);
        _record("created", { planId: planId });
        _emit(window.SubscriptionEvents.EVENTS.CREATED, _current);

        return _current;
    }

    /**
     * Ativa a assinatura (pending/trial -> active).
     * @returns {Promise<object>}
     */
    async function activate() {
        var now = new Date().toISOString();
        return _transition("active", { activatedAt: now, status: "active" });
    }

    /**
     * Cancela a assinatura.
     * @returns {Promise<object>}
     */
    async function cancel() {
        return _transition("cancelled", { cancelAt: new Date().toISOString(), status: "cancelled" });
    }

    /**
     * Pausa a assinatura.
     * @returns {Promise<object>}
     */
    async function pause() {
        return _transition("paused");
    }

    /**
     * Retoma a assinatura pausada.
     * @returns {Promise<object>}
     */
    async function resume() {
        return _transition("active", { activatedAt: new Date().toISOString(), status: "active" });
    }

    /**
     * Troca o plano da assinatura ativa.
     * @param {string} planId
     * @returns {Promise<object>}
     */
    async function changePlan(planId) {
        if (!window.SubscriptionModules.planManager.isAvailable(planId)) {
            throw new Error("Plano indisponível: '" + planId + "'.");
        }
        if (!_current) {
            throw new Error("Nenhuma assinatura carregada.");
        }
        var uid = _uid();
        await window.SubscriptionModules.service.updateSubscription(uid, _current.subscriptionId, {
            planId: planId
        });
        _current = Object.assign({}, _current, { planId: planId });
        window.SubscriptionModules.cache.set(uid, _current);
        _record("plan_changed", { planId: planId });
        _emit(window.SubscriptionEvents.EVENTS.CHANGED, _current);
        return _current;
    }

    /**
     * Plano atual da assinatura (ou "free" se nenhuma).
     * @returns {string}
     */
    function getPlan() {
        return _current ? _current.planId : "free";
    }

    /**
     * Status atual da assinatura (ou "none" se nenhuma).
     * @returns {string}
     */
    function getStatus() {
        return _current ? _current.status : "none";
    }

    /**
     * Benefícios do plano atual.
     * @returns {Array<{id,icon,label}>}
     */
    function getBenefits() {
        return window.SubscriptionModules.benefitsManager.forPlan(getPlan());
    }

    /**
     * A assinatura está ativa?
     * @returns {boolean}
     */
    function isActive() {
        return !!(_current && _current.status === "active");
    }

    /**
     * A assinatura está em período de teste?
     * @returns {boolean}
     */
    function isTrial() {
        return !!(_current && _current.status === "trial");
    }

    /**
     * A assinatura está expirada?
     * @returns {boolean}
     */
    function isExpired() {
        return !!(_current && _current.status === "expired");
    }

    /**
     * Registra um callback para mudanças de assinatura.
     * @param {Function} cb
     */
    function onChange(cb) {
        if (window.SubscriptionEvents && typeof cb === "function") {
            window.SubscriptionEvents.on(window.SubscriptionEvents.EVENTS.CHANGED, cb);
        }
    }

    window.Subscription = {
        load: load,
        create: create,
        activate: activate,
        cancel: cancel,
        pause: pause,
        resume: resume,
        changePlan: changePlan,
        getPlan: getPlan,
        getStatus: getStatus,
        getBenefits: getBenefits,
        isActive: isActive,
        isTrial: isTrial,
        isExpired: isExpired,
        onChange: onChange,
        current: function () { return _current; }
    };

    console.log("[Subscription] Módulo subscription-manager.js carregado.");

})(window);
