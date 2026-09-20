/**
 * js/access/access-router.js
 * Roteador central de acesso (Fase 6).
 * Destinos da área de conta preservam o idioma atual.
 */
(function (window) {
    "use strict";
    window.Access = window.Access || {};
    function _isLoggedIn() {
        return !!(window.Auth && window.Auth.isLoggedIn && window.Auth.isLoggedIn());
    }
    function _accountPage(path) {
        if (typeof window.__ACCOUNT_PAGE_URL === "function") return window.__ACCOUNT_PAGE_URL(path);
        return path;
    }
    function _loginUrl(returnUrl) {
        if (typeof window.__ACCOUNT_LOGIN_URL === "function") return window.__ACCOUNT_LOGIN_URL(returnUrl);
        return "/conta/login.html?returnUrl=" + returnUrl;
    }
    function _redirectTo(path) {
        var returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
        var target = path === "/conta/login.html" ? _loginUrl(window.location.pathname + window.location.search) : path === "/conta/assinatura.html" ? _accountPage(path) + "&returnUrl=" + returnUrl : path + "?returnUrl=" + returnUrl;
        window.location.href = target;
    }
    var _premiumDecisionListenersBound = false;

    function _deferPremiumDecision() {
        var auth = window.Auth;
        if (!auth || _premiumDecisionListenersBound) return;
        _premiumDecisionListenersBound = true;

        function retry() {
            try {
                var billing = auth.billingStatus ? auth.billingStatus() : null;
                if (!billing || billing.resolved) guard();
            } catch (e) {
                console.warn("[Access] Reavaliação Premium falhou:", e);
            }
        }

        if (auth.onProfileChange) auth.onProfileChange(retry);
        if (auth.onAuthChange) auth.onAuthChange(retry);
    }

    function guard() {
        if (!window.Access.evaluate) return true;

        // O estado comercial pode ficar temporariamente "verifying" depois que
        // o Firebase identifica o usuário. Nesse intervalo, NUNCA transformar
        // o estado provisório em FREE nem redirecionar Premium para assinatura.
        if (_isLoggedIn() && window.Auth && window.Auth.billingStatus) {
            var billing = window.Auth.billingStatus();
            if (billing && !billing.resolved) {
                _deferPremiumDecision();
                return true;
            }
            if (billing && billing.unavailable) {
                if (window.__RUN_PREMIUM_ROUTE_GATE) {
                    window.__RUN_PREMIUM_ROUTE_GATE(true);
                }
                return false;
            }
        }

        var result = window.Access.evaluate();
        if (result.allowed) return true;

        if (result.reason === "required-plan" && window.__RUN_PREMIUM_ROUTE_GATE) {
            // Usa a mesma autoridade comercial do gate central.
            if (!window.__RUN_PREMIUM_ROUTE_GATE(true)) return false;
            return true;
        }

        if (result.reason === "required-role") {
            if (!_isLoggedIn()) _redirectTo("/conta/login.html");
            else _redirectTo("/conta/assinatura.html");
            return false;
        }

        switch (result.reason) {
            case "required-permission":
            case "required-license":
            case "required-feature":
            default:
                if (!_isLoggedIn()) _redirectTo("/conta/login.html");
                else _redirectTo("/conta/assinatura.html");
                break;
        }
        return false;
    }
    window.Access.guard = guard;
    window.Access.guardRoutes = guard;
    console.log("[Access] Módulo access-router.js carregado.");
})(window);
