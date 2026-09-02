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

    // ─── Registro central de conteúdo restrito por plano ─────────
    // Chave = contentId (derivado do nome do arquivo, sem extensão);
    // valor = plano mínimo para acesso (hierarquia: junior < pleno < senior).
    // Este é o mapa canônico "o que é pago" — atualize AQUI ao criar novas
    // páginas restritas (ver .github/instructions/planos-de-acesso.instructions.md).
    var RESTRICTED_CONTENT = {
        // Escalas premium (bloqueadas no plano Gratuito)
        "fugulin": "junior",
        "braden": "junior",
        "morse": "junior",
        "dimensionamento": "junior",
        "perroca": "junior",
        "gasometria": "junior",

        // Simulados (1º ao 5º: Júnior; 6º em diante: Pleno)
        "simulado-de-enfermagem": "junior",
        "simulado-de-enfermagem4": "junior",
        "simulado-de-enfermagem2": "junior",
        "simulado-de-enfermagem3": "junior",
        "simulado-de-enfermagem-nucleo-de-seguranca-do-paciente": "junior",
        "simulado-de-enfermagem-doencas-de-notificacao-compulsoria": "pleno",
        "simulado_vacinacao": "pleno",
        "simulado_pcr": "pleno",
        "simulado_bloco-operatorio": "pleno",
        "flashcards_quiz": "pleno",
        "simulado_ibam_bebedouro_enfermeiro_2024": "pleno",
        "simulado_ibam_guarulhos_enfermeiro_2024": "pleno",
        "simulado_ibam_guarulhos_enfermeiro_esf_2024": "pleno",
        "simulado_ibam_japaratuba_sergipe_enfermeiro_2014": "pleno",
        "simulado_lei_organica_do_sus_8080-90": "pleno",
        "simulado_codigo_de_etica_enfermagem": "pleno"
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

        var contentId = context.contentId || _meta("content-id") || _contentIdFromPath();

        var named = context.visibility || _meta("content-access");
        var base = NAMED_POLICIES[named] || {};

        // Plano mínimo exigido por este conteúdo (registro central),
        // a menos que a página declare explicitamente uma política.
        var restrictedPlan = RESTRICTED_CONTENT[contentId] || null;
        var explicitPlan = context.requiredPlan || _meta("required-plan") || base.requiredPlan || null;
        var requiredPlan = explicitPlan || restrictedPlan || null;

        var visibility = context.visibility || base.visibility || _meta("visibility")
            || (requiredPlan ? "restricted" : "public");

        return {
            contentId: contentId,
            contentType: context.contentType || _meta("content-type") || "page",
            visibility: visibility,
            requiredRole: context.requiredRole || _meta("required-role") || base.requiredRole || null,
            requiredPlan: requiredPlan,
            requiredPermissions: _parseList(context.requiredPermissions || _meta("required-permission")),
            requiredFeatures: _parseList(context.requiredFeatures || _meta("required-feature")),
            requiredLicense: context.requiredLicense || _meta("required-license") || null,
            status: context.status || _meta("content-status") || "active"
        };
    }

    window.AccessModules.policy = {
        NAMED_POLICIES: NAMED_POLICIES,
        RESTRICTED_CONTENT: RESTRICTED_CONTENT,
        resolve: resolve
    };

    console.log("[Access] Módulo content-policy.js carregado.");

})(window);
