/*
 * Card de divulgação do plano Premium em páginas portuguesas da raiz.
 *
 * O controle canônico de AdSense é feito por global-scripts.js.
 */
(function (window, document) {
    "use strict";

    window.AccessModules = window.AccessModules || {};

    var _mounted = false;
    var _root = null;
    var _promoRoot = null;
    var _promoTimers = [];
    var ADS_CLIENT = "ca-pub-6472730056006847";
    var _adsenseLoading = false;

    function isAccountPage() {
        return (window.location.pathname || "").indexOf("/conta/") === 0;
    }

    function isPortugueseRootPage() {
        var pathname = (window.location.pathname || "/").toLowerCase();
        return pathname === "/" || /^\/[^/]+\.html$/.test(pathname);
    }

    function isPromoEligible() {
        var auth = window.Auth;
        if (!auth || !auth.isInitialized || !auth.isInitialized()) return false;
        if (!auth.currentUser || !auth.currentUser()) return true;

        // Um usuário logado só é Free depois que o billing confirma esse plano.
        var billing = auth.billingStatus && auth.billingStatus();
        return !!(billing && billing.resolved && !billing.unavailable &&
            billing.plan === "free" && auth.hasPlan && !auth.hasPlan("premium"));
    }

    function syncPromoEligibility() {
        if (isPromoEligible()) {
            mountSubscriptionPromo();
        } else if (window.__premiumPromoController) {
            window.__premiumPromoController.dispose();
        }
    }

    function isPremiumProfile(profile) {
        // Premium mantém anúncios ativos; este módulo não remove anúncios.
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

        return true;
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
        return; // DESATIVADO: global-scripts.js é o único carregador de AdSense.
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
                syncPromoEligibility();
            });
        }

        if (auth.onProfileChange) {
            auth.onProfileChange(function () {
                syncAds();
                syncPromoEligibility();
            });
        }

        if (auth.isInitialized && auth.isInitialized()) {
            syncAds();
        }
    }

    function mountSubscriptionPromo() {
        if (!isPortugueseRootPage()) return;

        if (!isPromoEligible()) return;

        // Uma única instância por página e intervalo de três minutos entre exibições, inclusive sem navegação.
        if (window.__premiumPromoController) return;

        var STORAGE_KEY = "premiumPromoLastShownAt";
        var DISPLAY_MS = 10000;
        var INTERVAL_MS = 3 * 60 * 1000;
        var INITIAL_DELAY_MS = 1500;
        var lastShownInMemory = 0;

        function readLastShown() {
            try {
                var value = parseInt(localStorage.getItem(STORAGE_KEY) || "0", 10);
                return Number.isFinite(value) ? Math.max(value, lastShownInMemory) : lastShownInMemory;
            } catch (_) {
                return lastShownInMemory;
            }
        }

        function writeLastShown() {
            lastShownInMemory = Date.now();
            try { localStorage.setItem(STORAGE_KEY, String(lastShownInMemory)); } catch (_) { }
        }

        var root = document.createElement("div");
        root.id = "premium-promo-banner";
        root.setAttribute("role", "complementary");
        root.setAttribute("aria-label", "Assinatura Premium");
        root.style.cssText = "position:fixed;top:140px;right:12px;width:min(390px,calc(100vw - 24px));max-height:calc(100vh - 20px);overflow:auto;z-index:2147483000;display:none;opacity:0;transition:opacity .18s ease;";

        function positionPromo() {
            var bottoms = [0];
            [
                document.getElementById("barraAcessibilidade"),
                document.getElementById("global-header-container"),
                document.getElementById("language-selector-placeholder")
            ].forEach(function (el) {
                if (!el) return;
                var rect = el.getBoundingClientRect();
                if (rect && rect.bottom > 0) bottoms.push(rect.bottom);
            });
            var top = Math.max.apply(null, bottoms) + 12;
            var maxTop = Math.max(8, window.innerHeight - (root.getBoundingClientRect().height || 310) - 12);
            top = Math.min(top, maxTop);
            root.style.top = Math.round(top) + "px";
        }

        var checkIcon = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false" style="flex:none;color:#15803d;margin-top:2px"><path d="m4 12 5 5L20 6" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
        root.innerHTML =
            '<section style="display:flex;flex-direction:column;gap:12px;padding:16px;border-radius:16px;box-sizing:border-box;background:#fff;border:1px solid rgba(26,62,116,.16);box-shadow:0 18px 45px rgba(0,0,0,.19);font-family:Inter,Arial,sans-serif;text-align:left;color:#1f2937;">' +
            '<div style="display:grid;grid-template-columns:minmax(0,1fr) 86px;align-items:center;gap:10px;">' +
            '<div><p style="margin:0 0 5px;font-size:10px;line-height:1.25;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:#2563eb;">Faça parte da Equipe PREMIUM</p>' +
            '<h2 style="margin:0;font-size:19px;line-height:1.2;font-weight:900;color:#1A3E74;">Faça parte do Plano PREMIUM</h2></div>' +
            '<img src="/img/ilustracao_enfermeira.webp" alt="Ilustração de uma profissional de enfermagem" width="86" height="100" decoding="async" style="display:block;width:86px;height:100px;object-fit:contain;">' +
            '</div><ul style="display:grid;gap:9px;margin:0;padding:0;list-style:none;font-size:13px;line-height:1.35;font-weight:650;">' +
            '<li style="display:flex;align-items:flex-start;gap:8px;">' + checkIcon + '<span>Elimine todos os anúncios do site</span></li>' +
            '<li style="display:flex;align-items:flex-start;gap:8px;">' + checkIcon + '<span>Tenha acesso a todas as calculadoras, escalas, formulários e simulados do site</span></li>' +
            '</ul><div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;">' +
            '<div style="min-width:0;"><a href="/conta/assinatura.html" data-premium-promo-subscribe style="display:inline-flex;align-items:center;justify-content:center;min-height:40px;padding:8px 13px;border-radius:10px;background:#facc15;color:#163269;text-decoration:none;font-size:13px;font-weight:900;box-shadow:0 5px 12px rgba(15,23,42,.12);">Clique para assinar</a>' +
            '<p style="margin:5px 0 0;font-size:10px;line-height:1.35;color:#475569;">Por apenas R$ 5,00 mensais. Aceitamos Pix e cartões.</p></div>' +
            '<button type="button" aria-label="Fechar" data-premium-promo-close style="border:1px solid #cbd5e1;border-radius:8px;background:#f8fafc;color:#334155;font-size:12px;font-weight:700;cursor:pointer;padding:9px 10px;">Fechar</button>' +
            '</div></section>';

        var insertionAnchor =
            document.getElementById("language-selector-placeholder") ||
            document.getElementById("global-header-container");

        if (insertionAnchor && insertionAnchor.parentNode) {
            insertionAnchor.parentNode.insertBefore(root, insertionAnchor.nextElementSibling);
        } else {
            document.body.appendChild(root);
        }

        _promoRoot = root;
        var controller = { root: root, timerShow: null, timerHide: null, timerFade: null, dispose: disposePromo };
        window.__premiumPromoController = controller;

        function isCurrent() {
            return window.__premiumPromoController === controller && !!root.parentNode;
        }

        function disposePromo() {
            clearTimeout(controller.timerShow);
            clearTimeout(controller.timerHide);
            clearTimeout(controller.timerFade);
            window.removeEventListener("resize", positionPromo);
            if (root.parentNode) root.parentNode.removeChild(root);
            if (window.__premiumPromoController === controller) window.__premiumPromoController = null;
            if (_promoRoot === root) _promoRoot = null;
        }

        function scheduleNext() {
            if (!isCurrent()) return;
            var remaining = INTERVAL_MS - (Date.now() - readLastShown());
            controller.timerShow = setTimeout(showPromo, Math.max(INITIAL_DELAY_MS, remaining));
        }

        function hidePromo() {
            if (!isCurrent()) return;
            clearTimeout(controller.timerHide);
            root.style.opacity = "0";
            root.style.pointerEvents = "none";
            controller.timerFade = setTimeout(function () {
                if (!isCurrent()) return;
                root.style.display = "none";
                scheduleNext();
            }, 180);
        }

        function showPromo() {
            if (!isCurrent()) return;
            if (!isPromoEligible()) {
                disposePromo();
                return;
            }
            writeLastShown();
            root.style.display = "block";
            root.style.pointerEvents = "auto";
            positionPromo();
            requestAnimationFrame(function () {
                if (isCurrent()) root.style.opacity = "1";
            });
            controller.timerHide = setTimeout(hidePromo, DISPLAY_MS);
        }

        window.addEventListener("resize", positionPromo);
        scheduleNext();

        root.querySelector("[data-premium-promo-close]").addEventListener("click", function () {
            hidePromo();
        });
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
        // O manager exibe exclusivamente o banner promocional flutuante.
        // O antigo premiumCard/benefit-card não deve mais ser injetado abaixo do menu global.
        mountSubscriptionPromo();
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
