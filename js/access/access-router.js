/**
 * js/access/access-router.js
 *
 * RESPONSABILIDADE: Roteador central de acesso (Fase 6).
 *
 * Nenhuma página realiza redirecionamentos. O roteador avalia a política do
 * conteúdo atual e, se bloqueado, decide para onde enviar o usuário:
 *   - não autenticado        -> /conta/login.html
 *   - plano insuficiente     -> /conta/assinatura.html (banner premium)
 *   - sem permissão/papel    -> /
 *
 * Complementa (com granularidade por conteúdo) o route-guard.js da Fase 5,
 * que protege apenas por prefixo de rota.
 */

(function (window) {
    "use strict";

    window.Access = window.Access || {};

    function _isLoggedIn() {
        return !!(window.Auth && window.Auth.isLoggedIn && window.Auth.isLoggedIn());
    }

    function _redirectTo(path) {
        var returnUrl = encodeURIComponent(window.location.pathname);
        window.location.href = path + "?returnUrl=" + returnUrl;
    }

    /**
     * Avalia o conteúdo atual e, se bloqueado, aplica a ação cabível.
     * @returns {boolean} true se liberado (ou se não há política restritiva).
     */
    function guard() {
        if (!window.Access.evaluate) {
            return true;
        }

        var result = window.Access.evaluate();
        if (result.allowed) {
            return true;
        }

        // Conteúdo bloqueado: decide o destino conforme o motivo.
        switch (result.reason) {
            case "required-role":
                // Sem o papel necessário: exige login (ou volta à home).
                if (!_isLoggedIn()) {
                    _redirectTo("/conta/login.html");
                } else {
                    window.location.href = "/";
                }
                break;

            case "required-plan":
                // Plano insuficiente: monta banner premium e aponta para assinatura.
                if (window.AccessModules.bannerManager) {
                    window.AccessModules.bannerManager.mount({
                        plan: result.requiredPlan || "premium_monthly",
                        title: "Conteúdo Premium",
                        message: "Assine para acessar este conteúdo."
                    });
                }
                if (!_isLoggedIn()) {
                    _redirectTo("/conta/login.html");
                } else {
                    window.location.href = "/conta/assinatura.html";
                }
                break;

            case "required-permission":
            case "required-license":
            case "required-feature":
            default:
                // Permissão/licença/feature ausentes ou motivo desconhecido:
                // se não autenticado, login; senão, home.
                if (!_isLoggedIn()) {
                    _redirectTo("/conta/login.html");
                } else {
                    window.location.href = "/";
                }
                break;
        }

        return false;
    }

    window.Access.guard = guard;
    window.Access.guardRoutes = guard;

    console.log("[Access] Módulo access-router.js carregado.");

})(window);
