/*
 * Gerenciador central do banner premium e do estado publicitário.
 * Visitantes e usuários free recebem AdSense; Júnior/lifetime não recebem.
 */
(function (window, document) {
    "use strict";

    window.AccessModules = window.AccessModules || {};

    var _mounted = false;
    var _root = null;
    var ADS_CLIENT = "ca-pub-6472730056006847";
    var DISMISS_KEY = "premiumWelcomeBannerDismissed_v2";

    function isAccountPage() {
        return (window.location.pathname || "").indexOf("/conta/") === 0;
    }

    function isPremium() {
        try {
            var p = window.Auth && window.Auth.profile ? window.Auth.profile() : null;
            if (!p) return false;
            if (p.lifetime === true) return true;
            if (p.plan !== "junior") return false;
            if (!p.planExpiresAt) return true;
            var d = typeof p.planExpiresAt.toDate === "function"
                ? p.planExpiresAt.toDate()
                : new Date(p.planExpiresAt);
            return !isNaN(d.getTime()) && d.getTime() > Date.now();
        } catch (_) {
            return false;
        }
    }

    function loadAdSenseForEligibleUser() {
        if (isAccountPage() || isPremium()) return;
        if (window.__adsenseLoaded) return;

        try {
            var consent = localStorage.getItem("cookieConsent");
            var managed = consent === "managed";
            var refused = consent === "refused";
            var adStorage = localStorage.getItem("ad_storage");
            if (refused || (managed && adStorage === "denied")) return;
        } catch (_) {}

        var existing = document.querySelector('script[src*="pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]');
        if (existing) {
            window.__adsenseLoaded = true;
            return;
        }

        window.__adsenseLoaded = true;
        var script = document.createElement("script");
        script.async = true;
        script.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=" + ADS_CLIENT;
        script.crossOrigin = "anonymous";
        document.head.appendChild(script);
    }

    function dismissed() {
        try { return localStorage.getItem(DISMISS_KEY) === "1"; } catch (_) { return false; }
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
        var widget = window.AccessModules.widgets
            ? window.AccessModules.widgets.premiumCard(opts)
            : "";
        root.innerHTML = widget;
        _mounted = true;
        if (window.AccessEvents) {
            window.AccessEvents.emit(window.AccessEvents.EVENTS.BANNER_MOUNTED, opts);
        }
    }

    function unmount() {
        if (_root) _root.innerHTML = "";
        _mounted = false;
    }

    function isMounted() { return _mounted; }

    function showGuestFallback() {
        if (isAccountPage() || isPremium() || dismissed()) return;
        if (document.getElementById("premium-welcome-banner-root")) return;
        if (document.getElementById("premium-guest-fallback")) return;
        if (!document.body) return;

        var lang = (window.__LANG || "pt").toLowerCase();
        var texts = {
            pt: ["Acesse o plano Júnior", "Tenha acesso à plataforma e aos conteúdos premium sem anúncios.", "R$ 10,00/mês", "Conhecer o plano Júnior", "Fechar"],
            en: ["Discover the Junior plan", "Access the platform and premium content without ads.", "R$ 10.00/month", "View Junior plan", "Close"],
            es: ["Conoce el plan Júnior", "Accede a la plataforma y al contenido premium sin anuncios.", "R$ 10,00/mes", "Ver plan Júnior", "Cerrar"]
        };
        var t = texts[lang] || texts.pt;
        var root = document.createElement("div");
        root.id = "premium-guest-fallback";
        root.setAttribute("role", "dialog");
        root.setAttribute("aria-label", t[0]);
        root.innerHTML = '<style>#premium-guest-fallback{position:fixed;top:18px;right:18px;z-index:2147483000;width:min(380px,calc(100vw - 36px));font-family:inherit}.pgf-card{position:relative;background:#fff;border:1px solid #d9e5f3;border-radius:16px;box-shadow:0 14px 38px rgba(20,53,89,.18);padding:18px;color:#1f2937}.pgf-card h2{margin:0 34px 8px 0;color:#1A3E74;font-size:17px;line-height:1.3}.pgf-card p{margin:0 0 12px;font-size:14px;line-height:1.5}.pgf-row{display:flex;align-items:center;justify-content:space-between;gap:12px}.pgf-price{font-weight:700;color:#1A3E74}.pgf-button{display:inline-flex;align-items:center;border:0;border-radius:10px;background:#1A3E74;color:#fff;padding:10px 13px;font-size:13px;font-weight:700;text-decoration:none}.pgf-close{position:absolute;top:8px;right:8px;width:32px;height:32px;border:0;background:transparent;color:#64748b;cursor:pointer}@media(max-width:520px){#premium-guest-fallback{top:10px;right:10px;left:10px;width:auto}.pgf-row{align-items:stretch;flex-direction:column}}</style><div class="pgf-card"><button type="button" class="pgf-close" aria-label="'+t[4]+'" title="'+t[4]+'">×</button><h2>'+t[0]+'</h2><p>'+t[1]+'</p><div class="pgf-row"><span class="pgf-price">'+t[2]+'</span><a class="pgf-button" href="/conta/assinatura.html?lang='+encodeURIComponent(lang)+'">'+t[3]+'</a></div></div>';
        document.body.appendChild(root);
        root.querySelector(".pgf-close").addEventListener("click", function () {
            try { localStorage.setItem(DISMISS_KEY, "1"); } catch (_) {}
            root.remove();
        });
    }

    function initGuestExperience() {
        if (isAccountPage()) return;
        loadAdSenseForEligibleUser();
        setTimeout(function () {
            loadAdSenseForEligibleUser();
            showGuestFallback();
        }, 1800);
    }

    window.AccessModules.bannerManager = {
        mount: mount,
        unmount: unmount,
        isMounted: isMounted
    };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initGuestExperience, { once: true });
    } else {
        initGuestExperience();
    }

    console.log("[Access] Módulo premium-banner-manager.js carregado.");
})(window, document);
