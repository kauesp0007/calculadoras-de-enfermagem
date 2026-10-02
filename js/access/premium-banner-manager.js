/*
 * Card de divulgação do plano Premium nas páginas principais de cada idioma.
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

    // Preços e moedas seguem o checkout internacional de /conta/assinatura.html.
    // A cobrança efetiva continua sendo definida pelo Price do Stripe no backend.
    var EUR_LANGS = ["tr", "nl", "pl", "ru", "fr", "es", "de", "it", "uk", "sv"];
    var PROMO_COPY = {
        pt: { title: "Faça parte da equipe do Plano PREMIUM", benefits: ["Elimine 100% dos anúncios indesejados", "Tenha acesso a mais de 30 calculadoras para a enfermagem", "Acesse mais de 30 escalas assistenciais interativas", "Salve ou imprima os formulários em branco das escalas assistenciais para usar no plantão", "São mais de 25 simulados por categorias e provas de bancas para você treinar", "Você terá acesso a extensões gratuitas do Chrome de Gasometria Arterial e Escala de Braden, e em breve serão lançadas novas extensões para o navegador", "Em breve será lançado um programa de computador e um app para auxiliar você durante o plantão", "Ajude este projeto a unificar em um único site tudo o que a enfermagem precisa", "Nossos conteúdos educativos contam com um sistema de auditoria e governança de fontes, com o princípio de garantir, checar, revisar e auditar a literatura apresentada, com referências científicas seguras"], subscribe: "Assine o Plano PREMIUM e faça parte da equipe!", price: "Por apenas R$ 5,00 mensais. Aceitamos Pix e cartões.", close: "Fechar", alt: "Ilustração de uma profissional de enfermagem", aria: "Assinatura Premium" },
        en: { team: "Join the PREMIUM Team", title: "Join the PREMIUM Plan", ads: "Remove all ads from the site", access: "Access all calculators, scales, forms and practice exams on the site", subscribe: "Click to subscribe", price: "Only {price} per month. Credit cards accepted.", close: "Close", alt: "Illustration of a nurse", aria: "Premium subscription" },
        es: { team: "Únete al equipo PREMIUM", title: "Forma parte del Plan PREMIUM", ads: "Elimina todos los anuncios del sitio", access: "Accede a todas las calculadoras, escalas, formularios y simulacros del sitio", subscribe: "Haz clic para suscribirte", price: "Por solo {price} al mes. Aceptamos tarjetas de crédito.", close: "Cerrar", alt: "Ilustración de una profesional de enfermería", aria: "Suscripción Premium" },
        de: { team: "Werde Teil des PREMIUM-Teams", title: "Entscheide dich für den PREMIUM-Tarif", ads: "Entferne alle Anzeigen von der Website", access: "Erhalte Zugang zu allen Rechnern, Skalen, Formularen und Übungstests der Website", subscribe: "Jetzt abonnieren", price: "Nur {price} pro Monat. Zahlung per Kreditkarte.", close: "Schließen", alt: "Illustration einer Pflegefachperson", aria: "Premium-Abonnement" },
        it: { team: "Entra nel team PREMIUM", title: "Scegli il piano PREMIUM", ads: "Elimina tutti gli annunci dal sito", access: "Accedi a tutti i calcolatori, le scale, i moduli e le simulazioni d'esame del sito", subscribe: "Clicca per abbonarti", price: "Solo {price} al mese. Accettiamo carte di credito.", close: "Chiudi", alt: "Illustrazione di un'infermiera", aria: "Abbonamento Premium" },
        fr: { team: "Rejoignez l'équipe PREMIUM", title: "Adoptez l'offre PREMIUM", ads: "Supprimez toutes les publicités du site", access: "Accédez à tous les calculateurs, échelles, formulaires et examens blancs du site", subscribe: "Cliquez pour vous abonner", price: "Seulement {price} par mois. Cartes bancaires acceptées.", close: "Fermer", alt: "Illustration d'une infirmière", aria: "Abonnement Premium" },
        hi: { team: "प्रीमियम टीम का हिस्सा बनें", title: "प्रीमियम प्लान से जुड़ें", ads: "साइट से सभी विज्ञापन हटाएँ", access: "साइट के सभी कैलकुलेटर, स्केल, फ़ॉर्म और अभ्यास परीक्षाएँ इस्तेमाल करें", subscribe: "सदस्यता लेने के लिए क्लिक करें", price: "सिर्फ़ {price} प्रति माह। क्रेडिट कार्ड स्वीकार किए जाते हैं।", close: "बंद करें", alt: "नर्स का चित्र", aria: "प्रीमियम सदस्यता" },
        zh: { team: "加入高级会员团队", title: "加入高级会员计划", ads: "移除网站上的所有广告", access: "使用网站上的所有计算器、量表、表格和模拟考试", subscribe: "点击订阅", price: "每月仅需 {price}。接受信用卡付款。", close: "关闭", alt: "护士插画", aria: "高级会员订阅" },
        ar: { team: "انضم إلى فريق بريميوم", title: "انضم إلى خطة بريميوم", ads: "تخلّص من جميع إعلانات الموقع", access: "احصل على جميع الحاسبات والمقاييس والنماذج والاختبارات التجريبية في الموقع", subscribe: "اضغط للاشتراك", price: "مقابل {price} شهريًا فقط. نقبل بطاقات الائتمان.", close: "إغلاق", alt: "رسم توضيحي لممرضة", aria: "اشتراك بريميوم" },
        ja: { team: "プレミアムチームに参加", title: "プレミアムプランに加入", ads: "サイト上のすべての広告を非表示に", access: "サイトのすべての計算ツール、評価尺度、フォーム、模擬試験を利用", subscribe: "クリックして登録", price: "月額わずか{price}。クレジットカードをご利用いただけます。", close: "閉じる", alt: "看護師のイラスト", aria: "プレミアム会員" },
        ru: { team: "Присоединяйтесь к команде ПРЕМИУМ", title: "Выберите тариф ПРЕМИУМ", ads: "Уберите всю рекламу с сайта", access: "Получите доступ ко всем калькуляторам, шкалам, формам и пробным тестам сайта", subscribe: "Нажмите, чтобы подписаться", price: "Всего {price} в месяц. Принимаем кредитные карты.", close: "Закрыть", alt: "Иллюстрация медсестры", aria: "Подписка Премиум" },
        ko: { team: "프리미엄 팀에 참여하세요", title: "프리미엄 플랜에 가입하세요", ads: "사이트의 모든 광고 제거", access: "사이트의 모든 계산기, 평가 척도, 양식 및 모의시험 이용", subscribe: "클릭하여 구독", price: "월 {price}에 이용하세요. 신용카드 결제가 가능합니다.", close: "닫기", alt: "간호사 일러스트", aria: "프리미엄 구독" },
        tr: { team: "PREMIUM ekibine katılın", title: "PREMIUM plana katılın", ads: "Sitedeki tüm reklamları kaldırın", access: "Sitedeki tüm hesaplayıcılara, ölçeklere, formlara ve deneme sınavlarına erişin", subscribe: "Abone olmak için tıklayın", price: "Ayda yalnızca {price}. Kredi kartı kabul edilir.", close: "Kapat", alt: "Hemşire çizimi", aria: "Premium abonelik" },
        nl: { team: "Word lid van het PREMIUM-team", title: "Kies het PREMIUM-abonnement", ads: "Verwijder alle advertenties van de site", access: "Krijg toegang tot alle calculators, schalen, formulieren en oefentoetsen op de site", subscribe: "Klik om te abonneren", price: "Slechts {price} per maand. Creditcards worden geaccepteerd.", close: "Sluiten", alt: "Illustratie van een verpleegkundige", aria: "Premium-abonnement" },
        pl: { team: "Dołącz do zespołu PREMIUM", title: "Wybierz plan PREMIUM", ads: "Usuń wszystkie reklamy ze strony", access: "Uzyskaj dostęp do wszystkich kalkulatorów, skal, formularzy i testów próbnych na stronie", subscribe: "Kliknij, aby subskrybować", price: "Tylko {price} miesięcznie. Akceptujemy karty kredytowe.", close: "Zamknij", alt: "Ilustracja pielęgniarki", aria: "Subskrypcja Premium" },
        sv: { team: "Bli en del av PREMIUM-teamet", title: "Välj PREMIUM-abonnemanget", ads: "Ta bort alla annonser från webbplatsen", access: "Få tillgång till alla kalkylatorer, skalor, formulär och övningsprov på webbplatsen", subscribe: "Klicka för att prenumerera", price: "Endast {price} per månad. Kreditkort accepteras.", close: "Stäng", alt: "Illustration av en sjuksköterska", aria: "Premium-abonnemang" },
        id: { team: "Bergabunglah dengan Tim PREMIUM", title: "Bergabunglah dengan Paket PREMIUM", ads: "Hilangkan semua iklan dari situs", access: "Akses semua kalkulator, skala, formulir, dan ujian latihan di situs", subscribe: "Klik untuk berlangganan", price: "Hanya {price} per bulan. Kartu kredit diterima.", close: "Tutup", alt: "Ilustrasi perawat", aria: "Langganan Premium" },
        vi: { team: "Tham gia đội ngũ PREMIUM", title: "Tham gia gói PREMIUM", ads: "Loại bỏ mọi quảng cáo trên trang web", access: "Truy cập tất cả công cụ tính toán, thang đo, biểu mẫu và bài thi thử trên trang web", subscribe: "Nhấp để đăng ký", price: "Chỉ {price} mỗi tháng. Chấp nhận thẻ tín dụng.", close: "Đóng", alt: "Minh họa y tá", aria: "Gói đăng ký Premium" },
        uk: { team: "Приєднуйтеся до команди ПРЕМІУМ", title: "Оберіть план ПРЕМІУМ", ads: "Приберіть усю рекламу із сайту", access: "Отримайте доступ до всіх калькуляторів, шкал, форм і пробних тестів на сайті", subscribe: "Натисніть, щоб підписатися", price: "Лише {price} на місяць. Приймаємо кредитні картки.", close: "Закрити", alt: "Ілюстрація медсестри", aria: "Преміум-підписка" }
    };

    function isAccountPage() {
        return (window.location.pathname || "").indexOf("/conta/") === 0;
    }

    function isPremiumRoute() {
        return window.__IS_PREMIUM_ROUTE === true;
    }

    function promoLanguage() {
        var pathname = (window.location.pathname || "/").toLowerCase();
        if (pathname === "/" || /^\/[^/]+\.html$/.test(pathname)) return "pt";
        var match = /^\/([a-z]{2})\/[^/]+\.html$/.exec(pathname);
        return match && Object.prototype.hasOwnProperty.call(PROMO_COPY, match[1]) ? match[1] : null;
    }

    function escapeHtml(value) {
        return String(value).replace(/[&<>"']/g, function (char) {
            return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char];
        });
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
        var lang = promoLanguage();
        if (!lang) return;

        if (!isPromoEligible()) return;

        // Uma única instância por página e intervalo de dois minutos entre exibições, inclusive sem navegação.
        if (window.__premiumPromoController) return;

        var STORAGE_KEY = lang === "pt" ? "premiumPromoLastShownAt" : "premiumPromoLastShownAt:" + lang;
        var DISPLAY_MS = 20000;
        var INTERVAL_MS = 2 * 60 * 1000;
        var INITIAL_DELAY_MS = 1500;
        var lastShownInMemory = 0;
        var copy = PROMO_COPY[lang];
        var price = lang === "pt" ? "" : (EUR_LANGS.indexOf(lang) !== -1 ? "€ 5,00" : "US$ 5,00");
        var priceLine = copy.price.replace("{price}", price);
        var subscribeUrl = lang === "pt" ? "/conta/assinatura.html" : "/conta/assinatura.html?lang=" + lang;

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
        root.setAttribute("aria-label", copy.aria);
        root.setAttribute("lang", lang === "pt" ? "pt-BR" : lang);
        if (lang === "ar") root.setAttribute("dir", "rtl");
        root.style.cssText = "position:fixed;top:140px;right:12px;width:min(500px,calc(100vw - 24px));max-height:calc(100vh - 20px);overflow:auto;z-index:2147483000;display:none;opacity:0;transition:opacity .18s ease;";

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
            '<div style="display:grid;grid-template-columns:minmax(0,1fr) 96px;align-items:center;gap:12px;direction:ltr;">' +
            '<div' + (lang === "ar" ? ' dir="rtl"' : '') + '><h2 style="margin:0;font-size:19px;line-height:1.2;font-weight:900;color:#1A3E74;">' + escapeHtml(copy.title) + '</h2></div>' +
            '<img src="/img/ilustracao_enfermeira.webp" alt="' + escapeHtml(copy.alt) + '" width="96" height="112" decoding="async" style="display:block;width:96px;height:112px;object-fit:contain;">' +
            '</div><ul style="display:grid;gap:8px;margin:0;padding:0;list-style:none;font-size:13px;line-height:1.4;font-weight:650;">' +
            (copy.benefits || [copy.ads, copy.access]).map(function (benefit) {
                return '<li style="display:flex;align-items:flex-start;gap:8px;">' + checkIcon + '<span>' + escapeHtml(benefit) + '</span></li>';
            }).join("") +
            '</ul><div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px;">' +
            '<div style="min-width:0;"><a href="' + subscribeUrl + '" data-premium-promo-subscribe style="display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:9px 15px;border-radius:10px;background:#facc15;color:#163269;text-decoration:none;font-size:13px;line-height:1.25;font-weight:900;box-shadow:0 5px 12px rgba(15,23,42,.12);text-align:center;">' + escapeHtml(copy.subscribe) + '</a>' +
            '<p style="margin:5px 0 0;font-size:10px;line-height:1.35;color:#475569;">' + escapeHtml(priceLine) + '</p></div>' +
            '<button type="button" aria-label="' + escapeHtml(copy.close) + '" data-premium-promo-close style="border:1px solid #cbd5e1;border-radius:8px;background:#f8fafc;color:#334155;font-size:12px;font-weight:700;cursor:pointer;padding:9px 10px;">' + escapeHtml(copy.close) + '</button>' +
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

        function scheduleNext(forceImmediate) {
            if (!isCurrent()) return;
            var remaining = forceImmediate
                ? INITIAL_DELAY_MS
                : INTERVAL_MS - (Date.now() - readLastShown());
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
                scheduleNext(false);
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
        // Cada nova navegação para uma rota Premium exibe novamente o card,
        // mesmo que o usuário tenha acabado de vê-lo em outra página Premium.
        scheduleNext(isPremiumRoute());

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
