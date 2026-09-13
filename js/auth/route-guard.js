/**
 * js/auth/route-guard.js
 *
 * RESPONSABILIDADE: Proteção automática de rotas por prefixo.
 *
 * Nenhuma página implementa regras próprias de acesso: o guard decide,
 * com base no pathname, se o usuário pode abrir a rota. Redireciona para
 * login/assinatura conforme o requisito não atendido.
 *
 * As rotas protegidas ainda NÃO possuem conteúdo — esta é apenas a
 * infraestrutura preparada para as próximas fases.
 */

(function (window) {
    "use strict";

    window.Authorization = window.Authorization || {};

    var POLICIES = [
        { pattern: /^\/premium\//, req: { requiredPlan: "premium" } },
        { pattern: /^\/cursos\//, req: { requiredPlan: "premium" } },
        { pattern: /^\/certificados\//, req: { requiredPlan: "premium" } },
        { pattern: /^\/biblioteca-premium\//, req: { requiredPlan: "premium" } },
        { pattern: /^\/downloads\//, req: { requiredPlan: "premium" } },
        { pattern: /^\/forum\//, req: { requiredFeature: "forum" } },
        { pattern: /^\/admin\//, req: { requiredRole: "administrator" } }
    ];

    function _redirect(req) {
        var returnUrl = encodeURIComponent(window.location.pathname);

        if (req.requiredRole && !window.Authorization.hasRole(req.requiredRole)) {
            window.location.href = "/conta/login.html?returnUrl=" + returnUrl;
            return;
        }
        if (req.requiredPlan && !window.Authorization.hasPlan(req.requiredPlan)) {
            window.location.href = "/conta/assinatura.html?returnUrl=" + returnUrl;
            return;
        }
        window.location.href = "/";
    }

    /**
     * Executa a verificação de acesso da rota atual.
     * @returns {boolean} true se liberado.
     */
    function guard() {
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
