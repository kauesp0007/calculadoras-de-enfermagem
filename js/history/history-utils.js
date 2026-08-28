/**
 * js/history/history-utils.js
 *
 * RESPONSABILIDADE: Funções auxiliares do Sistema de Histórico Inteligente.
 *
 * Reutiliza a identificação de página já centralizada em favorites-utils.js
 * (pageId, title, url, language, category) e acrescenta as informações
 * específicas de uma visita: dispositivo, navegador, sistema operacional,
 * país, referrer, IDs únicos e formatação de duração.
 */

(function (window) {
    "use strict";

    // ─── Garante que o namespace existe ───────────────────────────
    window.HistoryModules = window.HistoryModules || {};

    /**
     * Obtém o contexto da página atual (reutiliza favorites-utils quando disponível).
     * @returns {object}
     */
    function getPageContext() {
        if (
            window.FavoritesModules &&
            window.FavoritesModules.utils &&
            typeof window.FavoritesModules.utils.getPageContext === "function"
        ) {
            var ctx = window.FavoritesModules.utils.getPageContext();
            return {
                pageId: ctx.pageId,
                title: ctx.title,
                url: ctx.url,
                language: ctx.language,
                category: ctx.category,
                subcategory: ctx.subcategory,
                pageType: ctx.favoriteType || "page",
                tags: ctx.tags || []
            };
        }

        // Fallback seguro
        return {
            pageId: "page",
            title: document.title || "",
            url: window.location.pathname || "/",
            language: "pt",
            category: "geral",
            subcategory: "",
            pageType: "page",
            tags: []
        };
    }

    /**
     * Detecta o navegador do usuário.
     * @returns {string}
     */
    function detectBrowser() {
        try {
            var ua = navigator.userAgent || "";
            if (ua.indexOf("Edg") !== -1) return "Edge";
            if (ua.indexOf("Chrome") !== -1) return "Chrome";
            if (ua.indexOf("Firefox") !== -1) return "Firefox";
            if (ua.indexOf("Safari") !== -1) return "Safari";
            if (ua.indexOf("Opera") !== -1 || ua.indexOf("OPR") !== -1) return "Opera";
            return "unknown";
        } catch (e) {
            return "unknown";
        }
    }

    /**
     * Detecta o tipo de dispositivo.
     * @returns {string}
     */
    function detectDevice() {
        try {
            return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent || "")
                ? "mobile"
                : "desktop";
        } catch (e) {
            return "unknown";
        }
    }

    /**
     * Detecta o sistema operacional.
     * @returns {string}
     */
    function detectOS() {
        try {
            var ua = navigator.userAgent || "";
            if (ua.indexOf("Windows") !== -1) return "Windows";
            if (ua.indexOf("Mac") !== -1) return "macOS";
            if (ua.indexOf("Linux") !== -1) return "Linux";
            if (ua.indexOf("Android") !== -1) return "Android";
            if (/iPhone|iPad|iPod/.test(ua)) return "iOS";
            return "unknown";
        } catch (e) {
            return "unknown";
        }
    }

    /**
     * Detecta o país a partir do locale do navegador.
     * @returns {string}
     */
    function detectCountry() {
        try {
            var locale = navigator.language || "pt-BR";
            var parts = locale.split("-");
            return parts.length > 1 ? parts[1].toUpperCase() : "BR";
        } catch (e) {
            return "BR";
        }
    }

    /**
     * Retorna o referrer (origem da navegação).
     * @returns {string}
     */
    function getReferrer() {
        try {
            return document.referrer || "";
        } catch (e) {
            return "";
        }
    }

    /**
     * Gera um ID único (para historyId/sessionId).
     * @returns {string}
     */
    function newId() {
        return (
            Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10)
        );
    }

    /**
     * Formata uma duração em milissegundos para leitura humana.
     * @param {number} ms
     * @returns {string}
     */
    function formatDuration(ms) {
        if (!ms || isNaN(ms) || ms <= 0) {
            return "—";
        }
        var totalSec = Math.round(ms / 1000);
        var h = Math.floor(totalSec / 3600);
        var m = Math.floor((totalSec % 3600) / 60);
        var s = totalSec % 60;
        if (h > 0) return h + "h " + m + "min";
        if (m > 0) return m + "min " + s + "s";
        return s + "s";
    }

    // ─── Exportação ─────────────────────────────────────────────────
    window.HistoryModules.utils = {
        getPageContext: getPageContext,
        detectBrowser: detectBrowser,
        detectDevice: detectDevice,
        detectOS: detectOS,
        detectCountry: detectCountry,
        getReferrer: getReferrer,
        newId: newId,
        formatDuration: formatDuration
    };

    console.log("[History] Módulo history-utils.js carregado.");

})(window);
