/**
 * js/auth/route-guard.js
 *
 * RESPONSABILIDADE: Proteção automática de rotas por prefixo.
 * Os destinos da área de conta preservam o idioma atual.
 */

(function (window) {
    "use strict";

    window.Authorization = window.Authorization || {};

    // Sistema premium removido: restam apenas proteções por papel/feature (admin/forum).
    var POLICIES = [
        { pattern: /^\/forum\//, req: { requiredFeature: "forum" } },
        { pattern: /^\/admin\//, req: { requiredRole: "administrator" } }
    ];

    function _localizedAccountPage(path, returnUrl) {
        if (typeof window.__ACCOUNT_PAGE_URL === "function") {
            var target = window.__ACCOUNT_PAGE_URL(path);
            if (returnUrl) target += (target.indexOf("?") === -1 ? "?" : "&") + "returnUrl=" + returnUrl;
            return target;
        }
        return path + "?returnUrl=" + returnUrl;
    }

    function _localizedLogin(returnUrl) {
        if (typeof window.__ACCOUNT_LOGIN_URL === "function") {
            return window.__ACCOUNT_LOGIN_URL(returnUrl);
        }
        return "/conta/login.html?returnUrl=" + returnUrl;
    }

    function _redirect(req) {
        var returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
        if (req.requiredRole && !window.Authorization.hasRole(req.requiredRole)) {
            window.location.href = _localizedLogin(returnUrl);
            return;
        }
        if (req.requiredPlan && !window.Authorization.hasPlan(req.requiredPlan)) {
            window.location.href = _localizedAccountPage("/conta/assinatura.html", returnUrl);
            return;
        }
        window.location.href = "/";
    }

    function guard() {
        // Rotas Premium são protegidas exclusivamente pelo premium-content-loader.
        // Este guard genérico nunca pode redirecionar um assinante para assinatura.
        if (window.__IS_PREMIUM_ROUTE === true) return true;

        var path = window.location.pathname || "/";
        for (var i = 0; i < POLICIES.length; i++) {
            if (POLICIES[i].pattern.test(path)) {
                if (!window.Authorization.canAccess(POLICIES[i].req)) {
                    _redirect(POLICIES[i].req);
                    return false;
                }
                return true;
            }
        }
        return true;
    }

    window.Authorization.guard = guard;
    window.Authorization.guardRoutes = guard;
    window.Authorization.POLICIES = POLICIES;

    console.log("[Auth] Módulo route-guard.js carregado.");
})(window);
