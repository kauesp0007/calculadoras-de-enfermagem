/**
 * js/access/content-access.js
 *
 * RESPONSABILIDADE: Content Access Engine (FACADE — Fase 6).
 *
 * Camada central que decide se um conteúdo pode ser aberto. Nenhuma página
 * implementa regras próprias: toda decisão passa por window.Access.
 *
 * A decisão combina a política do conteúdo (content-policy) com o perfil
 * do usuário (via window.Authorization, Fase 5) e licenças independentes
 * de plano (license-engine). O resultado é registrado (analytics) e
 * notificado via eventos (AccessEvents).
 *
 * USO:
 *   var r = window.Access.evaluate();      // política da página atual
 *   if (window.Access.canOpen()) { ... }   // abre o conteúdo
 *   window.Access.getReason();             // motivo do bloqueio (se houver)
 */

(function (window) {
    "use strict";

    window.Access = window.Access || {};

    /** @type {object|null} Último resultado de evaluate(). */
    var _lastResult = null;

    function _profile() {
        return window.Auth && window.Auth.profile ? window.Auth.profile() : null;
    }

    /**
     * Resolve a política de acesso de um conteúdo.
     * @param {object} [context]
     * @returns {object}
     */
    function getPolicy(context) {
        return window.AccessModules.policy.resolve(context);
    }

    /**
     * Avalia se o usuário atual pode acessar um conteúdo.
     * @param {object} [context] - Política/requisitos (opcional; senão, página atual).
     * @returns {object} { allowed, reason, missingPermission, requiredPlan,
     *                     requiredRole, policy }
     */
    function evaluate(context) {
        var policy = getPolicy(context);
        var profile = _profile();

        var result = {
            allowed: true,
            reason: null,
            missingPermission: null,
            requiredPlan: null,
            requiredRole: null,
            policy: policy
        };

        // 1. Papel exigido
        if (policy.requiredRole) {
            result.requiredRole = policy.requiredRole;
            if (!window.Authorization.hasRole(policy.requiredRole)) {
                result.allowed = false;
                result.reason = "required-role";
            }
        }

        // 2. Plano exigido
        if (result.allowed && policy.requiredPlan) {
            result.requiredPlan = policy.requiredPlan;
            if (!window.Authorization.hasPlan(policy.requiredPlan)) {
                result.allowed = false;
                result.reason = "required-plan";
            }
        }

        // 3. Permissões exigidas
        if (result.allowed && policy.requiredPermissions && policy.requiredPermissions.length) {
            for (var i = 0; i < policy.requiredPermissions.length; i++) {
                var perm = policy.requiredPermissions[i];
                if (!window.Authorization.hasPermission(perm)) {
                    result.allowed = false;
                    result.reason = "required-permission";
                    result.missingPermission = perm;
                    break;
                }
            }
        }

        // 4. Feature flags exigidas
        if (result.allowed && policy.requiredFeatures && policy.requiredFeatures.length) {
            var featureService = window.AuthorizationModules.featureService;
            for (var j = 0; j < policy.requiredFeatures.length; j++) {
                var feat = policy.requiredFeatures[j];
                if (featureService && !featureService.isEnabled(feat)) {
                    result.allowed = false;
                    result.reason = "required-feature";
                    break;
                }
            }
        }

        // 5. Licença exigida (independente de plano)
        if (result.allowed && policy.requiredLicense) {
            if (!window.AccessModules.licenses.hasLicense(profile, policy.requiredLicense)) {
                result.allowed = false;
                result.reason = "required-license";
            }
        }

        // Registra e notifica
        _lastResult = result;

        if (window.AccessModules.analytics) {
            window.AccessModules.analytics.recordAccess({
                contentId: policy.contentId,
                contentType: policy.contentType,
                allowed: result.allowed,
                reason: result.reason,
                requiredPlan: result.requiredPlan,
                requiredRole: result.requiredRole,
                missingPermission: result.missingPermission,
                role: window.Authorization.getRole(),
                plan: window.Authorization.getPlan()
            });
        }

        if (window.AccessEvents) {
            window.AccessEvents.emit(
                result.allowed
                    ? window.AccessEvents.EVENTS.ACCESS_GRANTED
                    : window.AccessEvents.EVENTS.ACCESS_DENIED,
                result
            );
        }

        return result;
    }

    /**
     * O conteúdo atual pode ser aberto?
     * @param {object} [context]
     * @returns {boolean}
     */
    function canOpen(context) {
        return evaluate(context).allowed;
    }

    /**
     * Alias de canOpen.
     * @param {object} [context]
     * @returns {boolean}
     */
    function canView(context) {
        return canOpen(context);
    }

    /**
     * O usuário pode fazer download premium?
     * @returns {boolean}
     */
    function canDownload() {
        return window.Authorization.canDownload();
    }

    /**
     * Motivo do último bloqueio (ou null se liberado).
     * @returns {string|null}
     */
    function getReason() {
        return _lastResult ? _lastResult.reason : null;
    }

    /**
     * Permissão ausente no último bloqueio (ou null).
     * @returns {string|null}
     */
    function getMissingPermission() {
        return _lastResult ? _lastResult.missingPermission : null;
    }

    /**
     * Plano exigido no último bloqueio (ou null).
     * @returns {string|null}
     */
    function getRequiredPlan() {
        return _lastResult ? _lastResult.requiredPlan : null;
    }

    /**
     * Registra um callback para decisões de acesso negadas.
     * @param {Function} cb
     */
    function onDenied(cb) {
        if (window.AccessEvents && typeof cb === "function") {
            window.AccessEvents.on(window.AccessEvents.EVENTS.ACCESS_DENIED, cb);
        }
    }

    /**
     * Registra um callback para decisões de acesso liberadas.
     * @param {Function} cb
     */
    function onGranted(cb) {
        if (window.AccessEvents && typeof cb === "function") {
            window.AccessEvents.on(window.AccessEvents.EVENTS.ACCESS_GRANTED, cb);
        }
    }

    window.Access = {
        getPolicy: getPolicy,
        evaluate: evaluate,
        canOpen: canOpen,
        canView: canView,
        canDownload: canDownload,
        getReason: getReason,
        getMissingPermission: getMissingPermission,
        getRequiredPlan: getRequiredPlan,
        onDenied: onDenied,
        onGranted: onGranted
    };

    console.log("[Access] Módulo content-access.js carregado.");

})(window);
