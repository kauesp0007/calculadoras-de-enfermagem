/**
 * js/access/premium-widgets.js
 *
 * RESPONSABILIDADE: Componentes reutilizáveis de conteúdo premium (Fase 6).
 *
 * Conjunto de widgets que renderizam HTML de bloqueio/upgrade sem repetir
 * markup nas páginas. Seguem o design system do site (navy #1A3E74,
 * âmbar para Premium, Tailwind).
 *
 * Todos os widgets são funções puras que retornam string HTML. A montagem
 * no DOM fica por conta do premium-banner-manager.js.
 */

(function (window) {
    "use strict";

    window.AccessModules = window.AccessModules || {};

    function _escape(str) {
        return String(str == null ? "" : str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    /**
     * Cadeado premium (bloqueio simples).
     * @param {object} [opts] - { title, message }
     * @returns {string}
     */
    function premiumLock(opts) {
        opts = opts || {};
        var title = _escape(opts.title || "Conteúdo Premium");
        var message = _escape(opts.message || "Este conteúdo está disponível apenas para assinantes.");
        return (
            '<div class="premium-lock flex flex-col items-center text-center gap-3 py-10 px-6" role="status">' +
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" fill="currentColor" width="2.5em" height="2.5em" class="text-amber-500" aria-hidden="true">' +
            '<path d="M144 144l0 48 160 0 0-48c0-44.2-35.8-80-80-80s-80 35.8-80 80zM80 192l0-48C80 64.5 144.5 0 224 0s144 64.5 144 144l0 48 16 0c35.3 0 64 28.7 64 64l0 192c0 35.3-28.7 64-64 64L64 512c-35.3 0-64-28.7-64-64L0 256c0-35.3 28.7-64 64-64l16 0z"/>' +
            '</svg>' +
            '<p class="text-lg font-bold text-[#1A3E74]">' + title + '</p>' +
            '<p class="text-sm text-gray-600 max-w-sm">' + message + '</p>' +
            '</div>'
        );
    }

    /**
     * Botão "Assinar" (upgrade).
     * @param {object} [opts] - { href, label }
     * @returns {string}
     */
    function premiumUpgrade(opts) {
        opts = opts || {};
        var href = opts.href || "/conta/assinatura.html";
        var label = _escape(opts.label || "⭐ Assinar Premium");
        return (
            '<a href="' + href + '" class="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm transition-colors">' +
            label +
            '</a>'
        );
    }

    /**
     * Lista de benefícios de um plano.
     * @param {string} plan
     * @returns {string}
     */
    function premiumBenefits(plan) {
        var items = window.AccessModules.benefits
            ? window.AccessModules.benefits.forPlan(plan)
            : [];
        if (!items.length) {
            return "";
        }
        var html = '<ul class="flex flex-col gap-2 text-sm text-gray-700">';
        items.forEach(function (b) {
            html += (
                '<li class="flex items-center gap-2">' +
                '<span aria-hidden="true">' + _escape(b.icon || "•") + '</span>' +
                '<span>' + _escape(b.label) + '</span>' +
                '</li>'
            );
        });
        html += '</ul>';
        return html;
    }

    /**
     * Card premium completo (cadeado + benefícios + botão).
     * @param {object} [opts] - { plan, title, message, href }
     * @returns {string}
     */
    function premiumCard(opts) {
        opts = opts || {};
        var plan = opts.plan || "premium_monthly";
        var title = _escape(opts.title || "Desbloqueie este conteúdo");
        var message = _escape(opts.message || "Assine para acessar este e todos os conteúdos premium.");
        return (
            '<div class="premium-card rounded-2xl border border-amber-200 bg-white shadow-sm p-6 max-w-md" role="region" aria-label="Conteúdo premium">' +
            premiumLock({ title: title, message: message }) +
            premiumBenefits(plan) +
            '<div class="mt-5 flex justify-center">' +
            premiumUpgrade({ href: opts.href }) +
            '</div>' +
            '</div>'
        );
    }

    window.AccessModules.widgets = {
        premiumLock: premiumLock,
        premiumUpgrade: premiumUpgrade,
        premiumBenefits: premiumBenefits,
        premiumCard: premiumCard
    };

    console.log("[Access] Módulo premium-widgets.js carregado.");

})(window);
