/*
 * Gerenciador central do estado publicitário.
 *
 * Regra de segurança:
 * - visitante não autenticado: AdSense permitido;
 * - usuário free autenticado: AdSense permitido;
 * - Júnior/lifetime: AdSense nunca é carregado;
 * - usuário autenticado sem perfil resolvido: AdSense permanece bloqueado;
 * - falha na leitura do perfil: AdSense permanece bloqueado.
 *
 * O banner de divulgação da assinatura pertence exclusivamente a
 * premium-welcome-banner.js e não é criado neste módulo.
 */
(function (window, document) {
    "use strict";

    window.AccessModules = window.AccessModules || {};

    var _mounted = false;
    var _root = null;
    var ADS_CLIENT = "ca-pub-6472730056006847";
    var _adsenseLoading = false;

    function isAccountPage() {
        return (window.location.pathname || "").indexOf("/conta/") === 0;
    }

    function isPremiumProfile(profile) {
        // Premium temporariamente desativado: todos tratados como free.
        return false;
    }

    function authStateResolvedForAds() {
        var auth = window.Auth;
        if (!auth || !auth.isInitialized || !auth.isInitialized()) return false;

        var user = auth.currentUser ? auth.currentUser() : null;
        if (!user) return true;

        var profile = auth.profile ? auth.profile() : null;
        return !!profile;
    }

    function adsAllowed() {
        var auth = window.Auth;
        if (!auth || !auth.isInitialized || !auth.isInitialized()) return false;

        var user = auth.currentUser ? auth.currentUser() : null;
        if (!user) return true;

        var profile = auth.profile ? auth.profile() : null;
        if (!profile) return false;

        return !isPremiumProfile(profile);
    }

    function consentAllowsAds() {
        try {
            var consent = localStorage.getItem("cookieConsent");
            if (consent === "refused") return false;
            if (consent === "managed" && localStorage.getItem("ad_storage") === "denied") return false;
        } catch (_) { }
        return true;
    }

    function loadAdSenseForEligibleUser() {
        if (isAccountPage() || !authStateResolvedForAds() || !adsAllowed() || !consentAllowsAds()) return;
        if (window.__adsenseLoaded || _adsenseLoading) return;

        var existing = document.querySelector('script[src*="pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]');
        if (existing) {
            window.__adsenseLoaded = true;
            return;
        }

        _adsenseLoading = true;
        var script = document.createElement("script");
        script.async = true;
        script.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=" + ADS_CLIENT;
        script.crossOrigin = "anonymous";
        script.onload = function () {
            _adsenseLoading = false;
            window.__adsenseLoaded = true;
        };
        script.onerror = function () {
            _adsenseLoading = false;
            window.__adsenseLoaded = false;
            setTimeout(loadAdSenseForEligibleUser, 3000);
        };
        document.head.appendChild(script);
    }

    function syncAds() {
        if (isAccountPage()) return;
        loadAdSenseForEligibleUser();
    }

    function bindAuthGuards() {
        var auth = window.Auth;
        if (!auth) return;

        if (auth.onAuthChange) {
            auth.onAuthChange(function () {
                syncAds();
            });
        }

        if (auth.onProfileChange) {
            auth.onProfileChange(function () {
                syncAds();
            });
        }

        if (auth.isInitialized && auth.isInitialized()) {
            syncAds();
        }
    }

    function _getRoot() {
        if (_root) return _root;
        _root = document.getElementById("premium-banner-root");
        if (!_root) {
            _root = document.createElement("div");
            _root.id = "premium-banner-root";
            document.body.insertBefore(_root, document.body.firstChild);
        }
        return _root;
    }

    function mount(opts) {
        opts = opts || {};
        var root = _getRoot();
        var widget = window.AccessModules.widgets ? window.AccessModules.widgets.premiumCard(opts) : "";
        root.innerHTML = widget;
        _mounted = true;
        if (window.AccessEvents) window.AccessEvents.emit(window.AccessEvents.EVENTS.BANNER_MOUNTED, opts);
    }

    function unmount() {
        if (_root) _root.innerHTML = "";
        _mounted = false;
    }

    function isMounted() {
        return _mounted;
    }

    window.AccessModules.bannerManager = {
        mount: mount,
        unmount: unmount,
        isMounted: isMounted,
        syncAds: syncAds
    };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", bindAuthGuards, { once: true });
    } else {
        bindAuthGuards();
    }

    console.log("[Access] Módulo premium-banner-manager.js carregado.");
})(window, document);
