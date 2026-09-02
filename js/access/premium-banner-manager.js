/**
 * js/access/premium-banner-manager.js
 *
 * RESPONSABILIDADE: Gerenciador do banner premium (Fase 6).
 *
 * Injeta automaticamente o banner de upgrade (cadeado + benefícios + botão)
 * quando um conteúdo é bloqueado. Nunca escreve HTML repetido nas páginas.
 *
 * A montagem é feita em um container (#premium-banner-root) ou, na ausência
 * dele, no topo do <body>.
 */

(function (window) {
    "use strict";

    window.AccessModules = window.AccessModules || {};

    var _mounted = false;
    var _root = null;

    /**
     * Obtém (ou cria) o container do banner.
     * @returns {HTMLElement}
     */
    function _getRoot() {
        if (_root) {
            return _root;
        }
        _root = document.getElementById("premium-banner-root");
        if (!_root) {
            _root = document.createElement("div");
            _root.id = "premium-banner-root";
            document.body.insertBefore(_root, document.body.firstChild);
        }
        return _root;
    }

    /**
     * Monta o banner premium.
     * @param {object} [opts] - { plan, title, message, href, replace }
     */
    function mount(opts) {
        opts = opts || {};
        var root = _getRoot();
        var widget = window.AccessModules.widgets
            ? window.AccessModules.widgets.premiumCard(opts)
            : "";

        root.innerHTML = widget;
        _mounted = true;

        if (window.AccessEvents) {
            window.AccessEvents.emit(window.AccessEvents.EVENTS.BANNER_MOUNTED, opts);
        }
    }

    /**
     * Remove o banner premium.
     */
    function unmount() {
        if (_root) {
            _root.innerHTML = "";
        }
        _mounted = false;
    }

    /**
     * Indica se o banner está montado.
     * @returns {boolean}
     */
    function isMounted() {
        return _mounted;
    }

    window.AccessModules.bannerManager = {
        mount: mount,
        unmount: unmount,
        isMounted: isMounted
    };

    console.log("[Access] Módulo premium-banner-manager.js carregado.");

})(window);
