/**
 * js/access/access-router.js
 *
 * RESPONSABILIDADE: Roteador central de acesso (Fase 6).
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
        var target = path === "/conta/login.html"
            ? _loginUrl(returnUrl)
            : path === "/conta/assinatura.html"
                ? _accountPage(path) + "&returnUrl=" + returnUrl
                : path + "?returnUrl=" + returnUrl;
        window.location.href = target;
    }

    function guard() {
        if (!window.Access.evaluate) return true;
        var result = window.Access.evaluate();
        if (result.allowed) return true;

        switch (result.reason) {
            case "required-role":
                if (!_isLoggedIn()) _redirectTo("/conta/login.html");
                else window.location.href = "/";
                break;
            case "required-plan":
                if (window.AccessModules.bannerManager) {
                    window.AccessModules.bannerManager.mount({
                        plan: result.requiredPlan || "junior",
                        title: "Conteúdo Premium",
                        message: "Assine para acessar este conteúdo."
                    });
                }
                if (!_isLoggedIn()) _redirectTo("/conta/login.html");
                else _redirectTo("/conta/assinatura.html");
                break;
            case "required-permission":
            case "required-license":
            case "required-feature":
            default:
                if (!_isLoggedIn()) _redirectTo("/conta/login.html");
                else window.location.href = "/";
                break;
        }
        return false;
    }

    window.Access.guard = guard;
    window.Access.guardRoutes = guard;
    console.log("[Access] Módulo access-router.js carregado.");
})(window);
