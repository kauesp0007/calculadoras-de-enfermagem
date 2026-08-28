/**
 * js/history/history-ui.js
 *
 * RESPONSABILIDADE: Interface e FACADE do Sistema de Histórico.
 *
 * Expõe "window.History" (API pública) e a renderização de lista usada
 * por historico.html. As páginas não acessam o Firestore diretamente.
 */

(function (window) {
    "use strict";

    // ─── Garante que o namespace existe ───────────────────────────
    window.History = window.History || {};

    // ─── API pública (delega para os módulos) ──────────────────────

    function init(uid) { return window.HistoryModules.sync.load(uid); }
    function record(pageContext) { return window.HistoryModules.sync.record(pageContext); }
    function getAll() { return window.HistoryModules.sync.getAll(); }
    function count() { return window.HistoryModules.sync.count(); }
    function remove(id) { return window.HistoryModules.sync.remove(id); }
    function clearAll() { return window.HistoryModules.sync.clearAll(); }
    function on(event, cb) { return window.HistoryModules.events.on(event, cb); }
    function off(event, cb) { return window.HistoryModules.events.off(event, cb); }
    function getPageContext() { return window.HistoryModules.utils.getPageContext(); }
    function formatDuration(ms) { return window.HistoryModules.utils.formatDuration(ms); }

    function _escape(str) {
        return String(str == null ? "" : str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    function _formatDate(value) {
        if (!value) {
            return "—";
        }
        var d = value instanceof Date ? value : new Date(value);
        if (isNaN(d.getTime())) {
            return "—";
        }
        return (
            d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }) +
            " " +
            d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
        );
    }

    /**
     * Renderiza uma lista de visitas em um container.
     * @param {HTMLElement} container
     * @param {object[]} items
     * @param {Function} [onRemove] - callback após remover (para re-renderizar).
     */
    function renderList(container, items, onRemove) {
        if (!container) {
            return;
        }

        if (!items || !items.length) {
            container.innerHTML =
                '<div class="text-center text-slate-500 py-10">' +
                '<p class="text-4xl mb-3" aria-hidden="true">🕘</p>' +
                "<p class=\"font-semibold\">Nenhuma visita registrada ainda.</p>" +
                '<p class="text-sm">Navegue pelo site para que suas páginas apareçam aqui.</p>' +
                "</div>";
            return;
        }

        var html = items
            .map(function (h) {
                var meta = [h.category, (h.language || "").toUpperCase(), h.pageType, h.device]
                    .filter(function (v) { return v; })
                    .join(" · ");

                return (
                    '<div class="flex items-center gap-3 p-4 border-b border-gray-100">' +
                    '<div class="w-12 h-12 rounded-lg bg-[#1A3E74] flex items-center justify-center text-white font-black flex-shrink-0" aria-hidden="true">' + _escape((h.title || "?").charAt(0).toUpperCase()) + "</div>" +
                    '<a href="' + _escape(h.url) + '" class="flex-1 min-w-0 no-underline">' +
                    '<p class="font-bold text-[#1A3E74] truncate m-0">' + _escape(h.title) + "</p>" +
                    '<p class="text-xs text-slate-500 m-0 truncate">' + _escape(meta) + "</p>" +
                    '<p class="text-xs text-slate-400 m-0">' + _formatDate(h.visitedAt) + " · " + _escape(formatDuration(h.duration)) + "</p>" +
                    "</a>" +
                    '<button type="button" class="px-3 py-2 rounded-lg bg-red-50 text-red-600 font-bold text-xs border border-red-200 hover:bg-red-100 whitespace-nowrap" data-history-id="' + _escape(h.id) + '" aria-label="Excluir ' + _escape(h.title) + ' do histórico">Excluir</button>' +
                    "</div>"
                );
            })
            .join("");

        container.innerHTML = html;

        container.querySelectorAll("button[data-history-id]").forEach(function (btn) {
            btn.addEventListener("click", function () {
                var historyId = btn.getAttribute("data-history-id");
                btn.disabled = true;
                window.HistoryModules.sync
                    .remove(historyId)
                    .then(function () {
                        if (typeof onRemove === "function") {
                            onRemove();
                        } else {
                            renderList(container, window.HistoryModules.sync.getAll());
                        }
                    })
                    .catch(function () {
                        btn.disabled = false;
                    });
            });
        });
    }

    // ─── Exportação (FACADE) ────────────────────────────────────────
    window.History = {
        init: init,
        record: record,
        getAll: getAll,
        count: count,
        remove: remove,
        clearAll: clearAll,
        on: on,
        off: off,
        getPageContext: getPageContext,
        formatDuration: formatDuration,
        renderList: renderList
    };

    // ─── Fechamento best-effort ao sair da página ──────────────────
    // O fechamento confiável ocorre na transição entre páginas; este é extra.
    window.addEventListener("pagehide", function () {
        if (window.HistoryModules && window.HistoryModules.sync) {
            window.HistoryModules.sync.closeActiveVisit();
        }
    });

    console.log("[History] Módulo history-ui.js carregado.");

})(window);
