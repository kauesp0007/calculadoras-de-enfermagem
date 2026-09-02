/**
 * js/access/content-policy.js
 *
 * RESPONSABILIDADE: Políticas de acesso a conteúdo (Fase 6).
 *
 * Cada conteúdo (página, download, curso, etc.) possui uma política de
 * acesso. Nenhuma página implementa regras próprias: ela apenas declara
 * a política (via meta tags ou por padrão "public") e o Content Access
 * Engine decide o resto.
 *
 * DECLARAÇÃO (meta tags, opcionais):
 *   <meta name="content-access" content="premium">          <- política nomeada
 *   <meta name="content-id" content="curso-ecg">
 *   <meta name="content-type" content="course">
 *   <meta name="required-role" content="administrator">
 *   <meta name="required-plan" content="premium">
 *   <meta name="required-permission" content="downloadPremium">
 *   <meta name="required-feature" content="courses">
 *   <meta name="required-license" content="curso-ecg">
 *
 * Políticas nomeadas: public, authenticated, premium, institution, admin,
 * moderator, editor. Sem declaração, o padrão é "public".
 */

(function (window) {
    "use strict";

    window.AccessModules = window.AccessModules || {};

    // Políticas nomeadas → requisitos equivalentes.
    var NAMED_POLICIES = {
        public: { visibility: "public" },
        authenticated: { visibility: "authenticated", requiredRole: "user" },
        premium: { visibility: "premium", requiredPlan: "premium" },
        institution: { visibility: "institution", requiredPlan: "institution" },
        moderator: { visibility: "moderator", requiredRole: "moderator" },
        editor: { visibility: "editor", requiredRole: "editor" },
        admin: { visibility: "admin", requiredRole: "administrator" }
    };

    /**
     * Lê o conteúdo de uma meta tag pelo atributo name.
     * @param {string} name
     * @returns {string}
     */
    function _meta(name) {
        var el = document.querySelector('meta[name="' + name + '"]');
        return el ? (el.getAttribute("content") || "") : "";
    }

    /**
     * Converte uma string separada por vírgulas em lista limpa.
     * @param {string} str
     * @returns {string[]}
     */
    function _parseList(str) {
        if (!str) {
            return [];
        }
        return String(str)
            .split(",")
            .map(function (s) { return s.trim(); })
            .filter(function (s) { return s; });
    }

    /**
     * Deriva o contentId a partir do último segmento do pathname.
     * @returns {string}
     */
    function _contentIdFromPath() {
        var path = window.location.pathname || "/";
        var segments = path.split("/").filter(function (s) { return s; });
        if (!segments.length) {
            return "home";
        }
        var last = segments[segments.length - 1];
        if (last.indexOf(".") !== -1) {
            last = last.split(".")[0];
        }
        return last || "home";
    }

    /**
     * Resolve a política de acesso de um conteúdo.
     * Se "context" for fornecido, usa seus campos; caso contrário,
     * lê as meta tags da página atual (com fallback "public").
     *
     * @param {object} [context] - { contentId, contentType, visibility, ... }
     * @returns {object} Política resolvida.
     */
    function resolve(context) {
        context = context || {};

        var named = context.visibility || _meta("content-access");
        var base = NAMED_POLICIES[named] || {};

        return {
            contentId: context.contentId || _meta("content-id") || _contentIdFromPath(),
            contentType: context.contentType || _meta("content-type") || "page",
            visibility: context.visibility || base.visibility || _meta("visibility") || "public",
            requiredRole: context.requiredRole || _meta("required-role") || base.requiredRole || null,
            requiredPlan: context.requiredPlan || _meta("required-plan") || base.requiredPlan || null,
            requiredPermissions: _parseList(context.requiredPermissions || _meta("required-permission")),
            requiredFeatures: _parseList(context.requiredFeatures || _meta("required-feature")),
            requiredLicense: context.requiredLicense || _meta("required-license") || null,
            status: context.status || _meta("content-status") || "active"
        };
    }

    window.AccessModules.policy = {
        NAMED_POLICIES: NAMED_POLICIES,
        resolve: resolve
    };

    console.log("[Access] Módulo content-policy.js carregado.");

})(window);
