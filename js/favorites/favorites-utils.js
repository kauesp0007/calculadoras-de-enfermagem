/**
 * js/favorites/favorites-utils.js
 *
 * RESPONSABILIDADE: Funções auxiliares do Sistema de Favoritos.
 *
 * Centraliza a identificação de página (pageId), título, idioma, categoria,
 * tipo, imagem e descrição — usados para criar um favorito consistente em
 * qualquer página do projeto.
 *
 * REGRA: nunca usar apenas a URL como identificador. O pageId é derivado do
 * nome do arquivo (único no projeto) e pode ser sobrescrito por meta tags:
 *   <meta name="page-id" content="braden">
 *   <meta name="page-type" content="scale">
 *   <meta name="page-category" content="escalas">
 *   <meta name="page-subcategory" content="pele">
 */

(function (window) {
    "use strict";

    // ─── Garante que o namespace existe ───────────────────────────
    window.FavoritesModules = window.FavoritesModules || {};

    // Idiomas suportados (para detectar pasta de idioma na URL)
    var LANG_FOLDERS = [
        "en", "es", "de", "it", "fr", "hi", "zh", "ar", "ja",
        "ru", "ko", "tr", "nl", "pl", "sv", "id", "vi", "uk"
    ];

    /**
     * Lê o conteúdo de uma meta tag pelo atributo name.
     * @param {string} name
     * @returns {string}
     */
    function _meta(name) {
        var el = document.querySelector('meta[name="' + name + '"]');
        return el ? el.getAttribute("content") || "" : "";
    }

    /**
     * Sanitiza um pageId para uso como ID de documento do Firestore.
     * @param {string} id
     * @returns {string}
     */
    function sanitizeId(id) {
        if (!id) {
            return "page";
        }
        var cleaned = String(id)
            .toLowerCase()
            .replace(/[^a-z0-9-_]/g, "-")
            .replace(/-+/g, "-")
            .replace(/^-+|-+$/g, "");
        return cleaned || "page";
    }

    /**
     * Deriva o pageId a partir do último segmento do pathname.
     * Ex.: "/braden.html" -> "braden" | "/en/escalas/glasgow.html" -> "glasgow".
     * @returns {string}
     */
    function pageIdFromPath() {
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
     * Normaliza o idioma para código de 2 letras.
     * @param {string} lang
     * @returns {string}
     */
    function normalizeLanguage(lang) {
        var raw = (lang || "").toLowerCase();
        var match = raw.match(/^([a-z]{2})/);
        return match ? match[1] : "pt";
    }

    /**
     * Infere o tipo de favorito a partir do caminho.
     * @param {string} pageId
     * @param {string} path
     * @returns {string}
     */
    function typeFromPath(pageId, path) {
        if (path.indexOf("/biblioteca") === 0 || path.indexOf("/downloads") === 0) return "library";
        if (path.indexOf("/blog") === 0) return "article";
        if (path.indexOf("/conta") === 0) return "page";
        if (path.indexOf("/simulad") === 0) return "simulation";
        return "calculator"; // default do site (calculadoras/escalas)
    }

    /**
     * Infere a categoria a partir do primeiro segmento relevante do caminho.
     * @param {string} path
     * @returns {string}
     */
    function categoryFromPath(path) {
        var segments = path.split("/").filter(function (s) { return s; });
        if (!segments.length) {
            return "geral";
        }
        if (LANG_FOLDERS.indexOf(segments[0]) !== -1) {
            return segments.length > 1 ? segments[1] : "geral";
        }
        if (segments[0] === "conta") {
            return "conta";
        }
        return segments.length > 1 ? segments[0] : "geral";
    }

    /**
     * Monta o contexto completo da página atual para criar um favorito.
     * @returns {object}
     */
    function getPageContext() {
        var path = window.location.pathname || "/";

        var pageId = _meta("page-id") || pageIdFromPath();
        pageId = sanitizeId(pageId);

        var title = _meta("og:title") || document.title || pageId;
        var description = _meta("description") || _meta("og:description") || "";
        var image = _meta("og:image") || "";
        var language = normalizeLanguage(document.documentElement.lang);
        var favoriteType = _meta("page-type") || typeFromPath(pageId, path);
        var category = _meta("page-category") || categoryFromPath(path);
        var subcategory = _meta("page-subcategory") || "";

        return {
            pageId: pageId,
            title: title,
            url: path,
            language: language,
            category: category,
            subcategory: subcategory,
            image: image,
            description: description,
            favoriteType: favoriteType,
            tags: []
        };
    }

    /**
     * Escapa HTML para evitar injeção ao renderizar títulos.
     * @param {string} str
     * @returns {string}
     */
    function escapeHtml(str) {
        return String(str == null ? "" : str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    // ─── Exportação ─────────────────────────────────────────────────
    window.FavoritesModules.utils = {
        getPageContext: getPageContext,
        sanitizeId: sanitizeId,
        pageIdFromPath: pageIdFromPath,
        normalizeLanguage: normalizeLanguage,
        escapeHtml: escapeHtml
    };

    console.log("[Favorites] Módulo favorites-utils.js carregado.");

})(window);
