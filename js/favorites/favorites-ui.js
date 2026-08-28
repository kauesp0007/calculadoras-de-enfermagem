/**
 * js/favorites/favorites-ui.js
 *
 * RESPONSABILIDADE: Interface reutilizável do Sistema de Favoritos.
 *
 * Expõe a FACADE "window.Favorites" (API pública) e componentes de UI:
 *   - botão Favoritar (estados: vazio, favoritado, carregando, erro)
 *   - badge/contador
 *   - renderização de lista (usada por favoritos.html)
 *
 * As páginas não acessam o Firestore diretamente: usam apenas window.Favorites.
 */

(function (window) {
    "use strict";

    // ─── Garante que o namespace existe ───────────────────────────
    window.Favorites = window.Favorites || {};

    var _buttonInstances = [];
    var _badgeEls = [];

    var ICON_EMPTY =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor" aria-hidden="true"><path d="M225.8 468.2l-2.5-2.3L48.1 303.2C17.4 274.7 0 234.7 0 192.8l0-3.3C0 84.8 56.2 28 128 28c35.3 0 68.1 14.6 92.8 40.4L256 104l35.2-35.6C315.9 42.6 348.7 28 384 28c71.8 0 128 56.8 128 128l0 3.3c0 41.9-17.4 81.9-48.1 110.4L288.7 465.9l-2.5 2.3c-8.2 7.6-19 11.9-30.2 11.9s-22-4.2-30.2-11.9zM239.1 145c-.4-.3-.7-.7-1-1.1l-17.8-20-.1-.1c-10.4-12.7-28.1-20.4-45.6-20.4-35.3 0-64 28.7-64 64l0 3.3c0 25.5 10.6 49.6 29.2 66.6L256 358.7l116.2-121.3c18.6-17 29.2-41.1 29.2-66.6l0-3.3c0-35.3-28.7-64-64-64-17.5 0-35.2 7.7-45.6 20.4l-.1.1-17.8 20c-.3.4-.6.8-1 1.1c-4.2 3.7-10.5 3.7-14.7 0z"/></svg>';

    var ICON_FILLED =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor" aria-hidden="true"><path d="M47.6 300.4L228.3 469.1c7.5 7 17.4 10.9 27.7 10.9s20.2-3.9 27.7-10.9L464.4 300.4c30.4-28.3 47.6-68 47.6-109.5v-5.8c0-69.9-50.5-129.5-119.4-141C347 36.5 300.6 51.4 268 84L256 96 244 84c-32.6-32.6-79-47.5-124.6-39.9C50.5 55.6 0 115.2 0 185.1v5.8c0 41.5 17.2 81.2 47.6 109.5z"/></svg>';

    // ─── Injeção de CSS (uma única vez) ────────────────────────────
    (function _injectStyles() {
        if (document.getElementById("favorites-ui-styles")) {
            return;
        }
        var css = [
            ".fav-toggle-btn{display:inline-flex;align-items:center;gap:8px;padding:12px 18px;border-radius:9999px;border:none;background:#1A3E74;color:#fff;font-weight:700;font-size:14px;cursor:pointer;box-shadow:0 8px 24px rgba(26,62,116,.35);transition:transform .15s,background .15s;}",
            ".fav-toggle-btn:hover{background:#1E4D8C;transform:translateY(-2px);}",
            ".fav-toggle-btn:focus-visible{outline:3px solid #93c5fd;outline-offset:2px;}",
            ".fav-toggle-btn.is-favorite{background:#e11d48;}",
            ".fav-toggle-btn:disabled{opacity:.6;cursor:wait;}",
            ".fav-toggle-btn svg{width:18px;height:18px;flex-shrink:0;}",
            ".fav-badge{display:inline-flex;align-items:center;justify-content:center;min-width:18px;height:18px;padding:0 5px;border-radius:9999px;background:#e11d48;color:#fff;font-size:11px;font-weight:700;}",
            ".fav-item-remove{color:#e11d48;font-weight:700;font-size:13px;background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:8px 14px;cursor:pointer;white-space:nowrap;}",
            ".fav-item-remove:hover{background:#fee2e2;}",
            "@media (max-width:768px){.fav-toggle-btn .fav-label{display:none;}.fav-toggle-btn{padding:14px;}}"
        ].join("");

        var style = document.createElement("style");
        style.id = "favorites-ui-styles";
        style.textContent = css;
        document.head.appendChild(style);
    })();

    // ─── API pública de dados (delega para os módulos) ─────────────

    function init(uid) { return window.FavoritesModules.sync.load(uid); }
    function refresh(uid) { return window.FavoritesModules.sync.refresh(uid); }
    function add(pageContext) { return window.FavoritesModules.sync.add(pageContext); }
    function remove(pageId) { return window.FavoritesModules.sync.remove(pageId); }
    function toggle(pageContext) { return window.FavoritesModules.sync.toggle(pageContext); }
    function isFavorite(pageId) { return window.FavoritesModules.sync.isFavorite(pageId); }
    function count() { return window.FavoritesModules.sync.count(); }
    function getAll() { return window.FavoritesModules.sync.getAll(); }
    function getPageContext() { return window.FavoritesModules.utils.getPageContext(); }
    function on(event, cb) { return window.FavoritesModules.events.on(event, cb); }
    function off(event, cb) { return window.FavoritesModules.events.off(event, cb); }

    // ─── Componente: botão Favoritar ────────────────────────────────

    function _renderButton(btn, isFav) {
        btn.setAttribute("aria-pressed", String(isFav));
        btn.classList.toggle("is-favorite", !!isFav);
        btn.innerHTML =
            (isFav ? ICON_FILLED : ICON_EMPTY) +
            '<span class="fav-label">' + (isFav ? "Favoritado" : "Favoritar") + "</span>";
    }

    function _handleClick(btn, pageContext) {
        var user = window.Auth && window.Auth.currentUser ? window.Auth.currentUser() : null;
        if (!user || !user.uid) {
            window.location.href =
                "/conta/login.html?returnUrl=" + encodeURIComponent(window.location.pathname);
            return;
        }

        btn.disabled = true;
        btn.setAttribute("aria-busy", "true");

        window.FavoritesModules.sync
            .toggle(pageContext)
            .then(function (nowFavorite) {
                _renderButton(btn, nowFavorite);
            })
            .catch(function (e) {
                console.warn("[FavoritesUI] Erro ao alternar favorito:", e);
            })
            .finally(function () {
                btn.disabled = false;
                btn.setAttribute("aria-busy", "false");
            });
    }

    /**
     * Cria um botão Favoritar (sem anexá-lo ao DOM).
     * @param {object} pageContext
     * @returns {HTMLElement}
     */
    function createButton(pageContext) {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "fav-toggle-btn";
        btn.setAttribute("aria-pressed", "false");
        btn.setAttribute("aria-label", "Favoritar esta página");
        btn.setAttribute("title", "Favoritar");
        btn.addEventListener("click", function () {
            _handleClick(btn, pageContext);
        });
        _renderButton(btn, isFavorite(pageContext.pageId));
        _buttonInstances.push(btn);
        return btn;
    }

    /**
     * Anexa o botão Favoritar a um container.
     * @param {HTMLElement} container
     * @param {object} pageContext
     * @returns {HTMLElement|null}
     */
    function mountButton(container, pageContext) {
        if (!container || !pageContext) {
            return null;
        }
        var btn = createButton(pageContext);
        container.appendChild(btn);
        return btn;
    }

    // ─── Componente: badge/contador ─────────────────────────────────

    function updateBadge(el, n) {
        if (!el) {
            return;
        }
        var total = n === undefined ? count() : n;
        el.textContent = total > 0 ? String(total) : "";
        el.style.display = total > 0 ? "inline-flex" : "none";
    }

    function mountBadge(container) {
        if (!container) {
            return null;
        }
        var el = document.createElement("span");
        el.className = "fav-badge";
        el.style.display = "none";
        container.appendChild(el);
        _badgeEls.push(el);
        updateBadge(el);
        return el;
    }

    // ─── Renderização de lista (favoritos.html) ─────────────────────

    function _escape(str) {
        return window.FavoritesModules.utils.escapeHtml(str);
    }

    /**
     * Renderiza a lista de favoritos em um container.
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
                '<p class="text-4xl mb-3" aria-hidden="true">♥</p>' +
                "<p class=\"font-semibold\">Nenhum favorito salvo ainda.</p>" +
                '<p class="text-sm">Use o botão "Favoritar" em qualquer página para salvá-la aqui.</p>' +
                "</div>";
            return;
        }

        var html = items
            .map(function (f) {
                var meta = [f.category, (f.language || "").toUpperCase(), f.favoriteType]
                    .filter(function (v) { return v; })
                    .join(" · ");

                return (
                    '<div class="flex items-center gap-3 p-4 border-b border-gray-100">' +
                    (f.image
                        ? '<img src="' + _escape(f.image) + '" alt="" class="w-12 h-12 rounded-lg object-cover bg-gray-100 flex-shrink-0" loading="lazy" onerror="this.style.display=\'none\'"/>'
                        : '<div class="w-12 h-12 rounded-lg bg-[#1A3E74] flex items-center justify-center text-white font-black flex-shrink-0" aria-hidden="true">' + _escape((f.title || "?").charAt(0).toUpperCase()) + "</div>") +
                    '<a href="' + _escape(f.url) + '" class="flex-1 min-w-0 no-underline">' +
                    '<p class="font-bold text-[#1A3E74] truncate m-0">' + _escape(f.title) + "</p>" +
                    '<p class="text-xs text-slate-500 m-0 truncate">' + _escape(meta) + "</p>" +
                    "</a>" +
                    '<button type="button" class="fav-item-remove" data-page-id="' + _escape(f.pageId) + '" aria-label="Remover ' + _escape(f.title) + ' dos favoritos">Remover</button>' +
                    "</div>"
                );
            })
            .join("");

        container.innerHTML = html;

        container.querySelectorAll(".fav-item-remove").forEach(function (btn) {
            btn.addEventListener("click", function () {
                var pageId = btn.getAttribute("data-page-id");
                btn.disabled = true;
                window.FavoritesModules.sync
                    .remove(pageId)
                    .then(function () {
                        if (typeof onRemove === "function") {
                            onRemove();
                        } else {
                            renderList(container, window.FavoritesModules.sync.getAll());
                        }
                    })
                    .catch(function () {
                        btn.disabled = false;
                    });
            });
        });
    }

    // ─── Listener global (atualiza badges) ──────────────────────────
    if (window.FavoritesModules && window.FavoritesModules.events) {
        window.FavoritesModules.events.on(window.FavoritesModules.events.EVENTS.CHANGED, function () {
            _badgeEls.forEach(function (el) {
                updateBadge(el);
            });
        });
    }

    // ─── Exportação (FACADE) ────────────────────────────────────────
    window.Favorites = {
        init: init,
        refresh: refresh,
        add: add,
        remove: remove,
        toggle: toggle,
        isFavorite: isFavorite,
        count: count,
        getAll: getAll,
        getPageContext: getPageContext,
        on: on,
        off: off,
        createButton: createButton,
        mountButton: mountButton,
        mountBadge: mountBadge,
        updateBadge: updateBadge,
        renderList: renderList
    };

    console.log("[Favorites] Módulo favorites-ui.js carregado.");

})(window);
