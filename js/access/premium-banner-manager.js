/*
 * Gerenciador central do estado publicitário.
 *
 * Regra de segurança:
 * - visitante não autenticado: AdSense permitido;
 * - usuário free autenticado: AdSense permitido;
 * - Premium: AdSense permanece ativo;
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
    var _promoRoot = null;
    var _promoTimers = [];
    var ADS_CLIENT = "ca-pub-6472730056006847";
    var _adsenseLoading = false;

    function isAccountPage() {
        return (window.location.pathname || "").indexOf("/conta/") === 0;
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
                if (auth.hasPlan && auth.hasPlan("premium") && _promoRoot) {
                    if (_promoRoot.parentNode) _promoRoot.parentNode.removeChild(_promoRoot);
                    _promoRoot = null;
                }
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

    function mountSubscriptionPromo() {
        if ((window.location.pathname || "").indexOf("/conta/") === 0) return;

        var auth = window.Auth;
        if (auth && auth.isInitialized && auth.isInitialized() && auth.hasPlan && auth.hasPlan("premium")) return;

        // Uma única instância por página + intervalo global de 20 minutos entre exibições.
        if (window.__premiumPromoController) return;

        var STORAGE_KEY = "premiumPromoLastShownAt";
        var DISPLAY_MS = 8500;
        var INTERVAL_MS = 30 * 60 * 1000;
        var INITIAL_DELAY_MS = 1500;

        function readLastShown() {
            try {
                var value = parseInt(localStorage.getItem(STORAGE_KEY) || "0", 10);
                return Number.isFinite(value) ? value : 0;
            } catch (_) {
                return 0;
            }
        }

        function writeLastShown() {
            try { localStorage.setItem(STORAGE_KEY, String(Date.now())); } catch (_) { }
        }

        function removePromo(root) {
            if (!root) return;
            root.style.opacity = "0";
            root.style.pointerEvents = "none";
            setTimeout(function () {
                if (root && root.parentNode) root.parentNode.removeChild(root);
                if (window.__premiumPromoController && window.__premiumPromoController.root === root) {
                    window.__premiumPromoController = null;
                }
            }, 180);
        }

        var elapsed = Date.now() - readLastShown();
        var waitMs = elapsed >= INTERVAL_MS ? INITIAL_DELAY_MS : (INTERVAL_MS - elapsed + INITIAL_DELAY_MS);

        var root = document.createElement("div");
        root.id = "premium-promo-banner";
        root.setAttribute("role", "complementary");
        root.setAttribute("aria-label", "Assinatura Premium");
        root.style.cssText = "position:fixed;top:calc(var(--global-ad-top, 140px));right:16px;width:min(300px,calc(100vw - 32px));aspect-ratio:1/1;z-index:100010;display:none;opacity:0;transition:opacity .18s ease;";

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
            var maxTop = Math.max(12, window.innerHeight - 16 - Math.min(300, window.innerWidth - 32));
            top = Math.min(top, maxTop);
            document.documentElement.style.setProperty("--global-ad-top", Math.round(top) + "px");
        }

        root.innerHTML =
            '<div style="height:100%;display:flex;flex-direction:column;justify-content:space-between;padding:20px;border-radius:18px;box-sizing:border-box;background:#ffffff;border:1px solid rgba(26,62,116,.16);box-shadow:0 18px 45px rgba(0,0,0,.16);text-align:left;">' +
            '<div><p style="margin:0 0 8px;font-size:12px;line-height:1.2;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#1A3E74;">Acesso Premium</p>' +
            '<p style="margin:0;font-size:20px;line-height:1.2;font-weight:900;color:#1A3E74;">Torne-se assinante Premium</p>' +
            '<p style="margin:12px 0 0;font-size:14px;line-height:1.45;color:#475569;">Amplie seu acesso a conteúdos, escalas, formulários, simulados e outros recursos exclusivos para profissionais de enfermagem.</p></div>' +
            '<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;"><a href="/conta/assinatura.html" data-premium-promo-subscribe style="display:inline-flex;align-items:center;justify-content:center;min-height:38px;padding:9px 14px;border-radius:10px;background:linear-gradient(135deg,#1A3E74,#1E4D8C);color:#fff;text-decoration:none;font-size:12px;font-weight:800;box-shadow:0 8px 18px rgba(15,23,42,.18);">Assinar agora</a>' +
            '<button type="button" aria-label="Fechar" data-premium-promo-close style="border:0;background:transparent;color:#64748b;font-size:12px;font-weight:700;cursor:pointer;">Fechar</button>' +
            '</div></div>';

        var insertionAnchor =
            document.getElementById("language-selector-placeholder") ||
            document.getElementById("global-header-container");

        if (insertionAnchor && insertionAnchor.parentNode) {
            insertionAnchor.parentNode.insertBefore(root, insertionAnchor.nextElementSibling);
        } else {
            document.body.appendChild(root);
        }

        _promoRoot = root;
        window.__premiumPromoController = { root: root, timerShow: null, timerHide: null };

        positionPromo();
        window.addEventListener("resize", positionPromo);

        window.__premiumPromoController.timerShow = setTimeout(function () {
            if (!root || !root.parentNode) return;
            writeLastShown();
            root.style.display = "block";
            requestAnimationFrame(function () {
                if (root && root.parentNode) root.style.opacity = "1";
            });

            window.__premiumPromoController.timerHide = setTimeout(function () {
                removePromo(root);
            }, DISPLAY_MS);
        }, waitMs);

        root.querySelector("[data-premium-promo-close]").addEventListener("click", function () {
            if (window.__premiumPromoController) {
                clearTimeout(window.__premiumPromoController.timerShow);
                clearTimeout(window.__premiumPromoController.timerHide);
            }
            removePromo(root);
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
        mountSubscriptionPromo();

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
