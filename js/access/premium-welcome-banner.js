/**
 * js/access/premium-welcome-banner.js
 *
 * Banner discreto de boas-vindas/upgrade para visitantes e usuários free.
 * Não aparece em páginas de conta, nem para assinantes Júnior/lifetime.
 * Usa somente Font Awesome SVG inline e preserva o idioma atual.
 */
(function (window, document) {
  "use strict";

  var STORAGE_KEY = "premiumWelcomeBannerDismissed";
  var ROOT_ID = "premium-welcome-banner-root";

  var I18N = {
    pt: {
      title: "Seja bem-vindo ao Calculadoras de Enfermagem",
      message: "Conheça o plano Júnior e tenha acesso à plataforma e aos conteúdos premium sem anúncios.",
      price: "R$ 10,00/mês",
      action: "Conhecer o plano Júnior",
      close: "Fechar",
      note: "Como funciona: crie sua conta, entre na área de assinatura e escolha a forma de pagamento."
    },
    en: { title: "Welcome to Nursing Calculators", message: "Discover the Junior plan for access to the platform and premium content without ads.", price: "R$ 10.00/month", action: "View Junior plan", close: "Close", note: "How it works: create your account, open subscriptions, and choose your payment method." },
    es: { title: "Bienvenido a Calculadoras de Enfermería", message: "Conoce el plan Júnior para acceder a la plataforma y al contenido premium sin anuncios.", price: "R$ 10,00/mes", action: "Ver plan Júnior", close: "Cerrar", note: "Cómo funciona: crea tu cuenta, entra en suscripciones y elige el método de pago." },
    fr: { title: "Bienvenue sur Calculadoras de Enfermagem", message: "Découvrez le forfait Júnior pour accéder à la plateforme et au contenu premium sans publicités.", price: "R$ 10,00/mois", action: "Voir le forfait Júnior", close: "Fermer", note: "Comment ça marche : créez votre compte, ouvrez les abonnements et choisissez le mode de paiement." },
    de: { title: "Willkommen bei Calculadoras de Enfermagem", message: "Entdecken Sie den Júnior-Tarif für Zugriff auf die Plattform und Premium-Inhalte ohne Werbung.", price: "R$ 10,00/Monat", action: "Júnior-Tarif ansehen", close: "Schließen", note: "So funktioniert es: Konto erstellen, Abonnement öffnen und Zahlungsart auswählen." },
    it: { title: "Benvenuto su Calculadoras de Enfermagem", message: "Scopri il piano Júnior per accedere alla piattaforma e ai contenuti premium senza pubblicità.", price: "R$ 10,00/mese", action: "Scopri il piano Júnior", close: "Chiudi", note: "Come funziona: crea il tuo account, apri l'area abbonamenti e scegli il metodo di pagamento." },
    hi: { title: "Nursing Calculators में आपका स्वागत है", message: "बिना विज्ञापनों के प्लेटफ़ॉर्म और प्रीमियम सामग्री तक पहुँच के लिए Júnior योजना देखें।", price: "R$ 10,00/माह", action: "Júnior योजना देखें", close: "बंद करें", note: "कैसे काम करता है: खाता बनाएं, सदस्यता क्षेत्र खोलें और भुगतान विधि चुनें।" },
    zh: { title: "欢迎使用护理计算器", message: "了解 Júnior 方案，无广告访问平台和高级内容。", price: "R$ 10,00/月", action: "查看 Júnior 方案", close: "关闭", note: "使用方式：创建账户，进入订阅区域并选择付款方式。" },
    ja: { title: "看護計算機へようこそ", message: "Júniorプランで、広告なしでプラットフォームとプレミアムコンテンツをご利用いただけます。", price: "R$ 10,00/月", action: "Júniorプランを見る", close: "閉じる", note: "利用方法：アカウントを作成し、購読画面で支払い方法を選択してください。" },
    ru: { title: "Добро пожаловать в Calculadoras de Enfermagem", message: "Ознакомьтесь с планом Júnior для доступа к платформе и премиум-контенту без рекламы.", price: "R$ 10,00/мес.", action: "Посмотреть план Júnior", close: "Закрыть", note: "Как это работает: создайте аккаунт, откройте подписку и выберите способ оплаты." },
    ko: { title: "간호 계산기에 오신 것을 환영합니다", message: "광고 없이 플랫폼과 프리미엄 콘텐츠를 이용하려면 Júnior 요금제를 확인하세요.", price: "R$ 10,00/월", action: "Júnior 요금제 보기", close: "닫기", note: "이용 방법: 계정을 만들고 구독 영역에서 결제 방법을 선택하세요." },
    tr: { title: "Calculadoras de Enfermagem'e hoş geldiniz", message: "Platforma ve premium içeriklere reklamsız erişim için Júnior planını keşfedin.", price: "R$ 10,00/ay", action: "Júnior planını görüntüle", close: "Kapat", note: "Nasıl çalışır: hesabınızı oluşturun, abonelik alanını açın ve ödeme yöntemini seçin." },
    nl: { title: "Welkom bij Calculadoras de Enfermagem", message: "Ontdek het Júnior-abonnement voor toegang tot het platform en premiuminhoud zonder advertenties.", price: "R$ 10,00/maand", action: "Júnior-abonnement bekijken", close: "Sluiten", note: "Zo werkt het: maak een account, open abonnementen en kies een betaalmethode." },
    pl: { title: "Witamy w Calculadoras de Enfermagem", message: "Poznaj plan Júnior i korzystaj z platformy oraz treści premium bez reklam.", price: "R$ 10,00/mies.", action: "Zobacz plan Júnior", close: "Zamknij", note: "Jak to działa: utwórz konto, przejdź do subskrypcji i wybierz metodę płatności." },
    sv: { title: "Välkommen till Calculadoras de Enfermagem", message: "Upptäck Júnior-planen för åtkomst till plattformen och premiuminnehåll utan annonser.", price: "R$ 10,00/mån", action: "Visa Júnior-planen", close: "Stäng", note: "Så fungerar det: skapa ett konto, öppna prenumerationer och välj betalningsmetod." },
    id: { title: "Selamat datang di Calculadoras de Enfermagem", message: "Kenali paket Júnior untuk mengakses platform dan konten premium tanpa iklan.", price: "R$ 10,00/bulan", action: "Lihat paket Júnior", close: "Tutup", note: "Cara kerja: buat akun, buka langganan, lalu pilih metode pembayaran." },
    vi: { title: "Chào mừng đến với Calculadoras de Enfermagem", message: "Khám phá gói Júnior để truy cập nền tảng và nội dung cao cấp không có quảng cáo.", price: "R$ 10,00/tháng", action: "Xem gói Júnior", close: "Đóng", note: "Cách hoạt động: tạo tài khoản, mở khu vực đăng ký và chọn phương thức thanh toán." },
    uk: { title: "Вітаємо в Calculadoras de Enfermagem", message: "Ознайомтеся з планом Júnior для доступу до платформи та преміум-контенту без реклами.", price: "R$ 10,00/міс.", action: "Переглянути план Júnior", close: "Закрити", note: "Як це працює: створіть обліковий запис, відкрийте підписку та оберіть спосіб оплати." },
    ar: { title: "مرحبًا بكم في حاسبات التمريض", message: "تعرّف على خطة Júnior للوصول إلى المنصة والمحتوى المميز دون إعلانات.", price: "R$ 10,00/شهريًا", action: "عرض خطة Júnior", close: "إغلاق", note: "طريقة الاستخدام: أنشئ حسابًا، افتح الاشتراك واختر طريقة الدفع." }
  };

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function isAccountPage() {
    return (window.location.pathname || "").indexOf("/conta/") === 0;
  }

  function hasValidPremium() {
    try {
      if (window.Auth && window.Auth.profile) {
        var profile = window.Auth.profile();
        if (profile) {
          if (profile.lifetime === true) return true;
          if (profile.plan === "junior") {
            if (!profile.planExpiresAt) return true;
            var expires = typeof profile.planExpiresAt.toDate === "function"
              ? profile.planExpiresAt.toDate()
              : new Date(profile.planExpiresAt);
            return !Number.isNaN(expires.getTime()) && expires.getTime() > Date.now();
          }
        }
      }
      if (window.Authorization && window.Authorization.hasPlan && window.Authorization.hasPlan("premium")) return true;
    } catch (_) {}
    return false;
  }

  function accountUrl() {
    var lang = window.__LANG || "pt";
    var target = "/conta/assinatura.html?lang=" + encodeURIComponent(lang) + "&returnUrl=" + encodeURIComponent(window.location.pathname + window.location.search + window.location.hash);
    return target;
  }

  function isDismissed() {
    try { return localStorage.getItem(STORAGE_KEY) === "1"; } catch (_) { return false; }
  }

  function dismiss() {
    try { localStorage.setItem(STORAGE_KEY, "1"); } catch (_) {}
    var root = document.getElementById(ROOT_ID);
    if (root && root.parentNode) root.parentNode.removeChild(root);
  }

  function mount() {
    if (isAccountPage() || hasValidPremium() || isDismissed()) return;
    if (!document.body || document.getElementById(ROOT_ID)) return;

    var lang = (window.__LANG || "pt").toLowerCase();
    var t = I18N[lang] || I18N.pt;
    var isRtl = lang === "ar";
    var root = document.createElement("div");
    root.id = ROOT_ID;
    root.setAttribute("dir", isRtl ? "rtl" : "ltr");
    root.setAttribute("role", "dialog");
    root.setAttribute("aria-label", t.title);
    root.innerHTML = '<style>' +
      '#' + ROOT_ID + '{position:fixed;top:18px;right:18px;z-index:2147483000;width:min(390px,calc(100vw - 36px));box-sizing:border-box;font-family:inherit}' +
      '#' + ROOT_ID + ' .pwb-card{position:relative;border:1px solid #d9e5f3;border-radius:16px;background:#fff;box-shadow:0 14px 38px rgba(20,53,89,.18);padding:18px 18px 16px;color:#1f2937}' +
      '#' + ROOT_ID + ' .pwb-head{display:flex;align-items:flex-start;gap:12px;padding-right:34px}' +
      '#' + ROOT_ID + ' .pwb-icon{width:38px;height:38px;display:grid;place-items:center;flex:0 0 38px;border-radius:10px;background:#eef5ff;color:#1A3E74}' +
      '#' + ROOT_ID + ' .pwb-title{margin:0;color:#1A3E74;font-size:17px;line-height:1.28;font-weight:700}' +
      '#' + ROOT_ID + ' .pwb-message{margin:10px 0 8px;font-size:14px;line-height:1.5}' +
      '#' + ROOT_ID + ' .pwb-note{margin:0 0 14px;font-size:12px;line-height:1.45;color:#64748b}' +
      '#' + ROOT_ID + ' .pwb-row{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:12px}' +
      '#' + ROOT_ID + ' .pwb-price{font-weight:700;color:#1A3E74;white-space:nowrap}' +
      '#' + ROOT_ID + ' .pwb-button{display:inline-flex;align-items:center;justify-content:center;gap:8px;border:0;border-radius:10px;background:#1A3E74;color:#fff;padding:10px 13px;font-size:13px;font-weight:700;text-decoration:none;cursor:pointer;min-height:40px}' +
      '#' + ROOT_ID + ' .pwb-button:hover{filter:brightness(.95)}' +
      '#' + ROOT_ID + ' .pwb-close{position:absolute;top:10px;right:10px;width:32px;height:32px;border:0;border-radius:8px;background:transparent;color:#64748b;display:grid;place-items:center;cursor:pointer}' +
      '#' + ROOT_ID + ' .pwb-close:hover{background:#f1f5f9;color:#1f2937}' +
      '@media(max-width:520px){#' + ROOT_ID + '{top:10px;right:10px;left:10px;width:auto}#' + ROOT_ID + ' .pwb-row{align-items:stretch;flex-direction:column}.pwb-price{white-space:normal}}' +
      '</style>' +
      '<div class="pwb-card">' +
      '<button type="button" class="pwb-close" aria-label="' + escapeHtml(t.close) + '" title="' + escapeHtml(t.close) + '">' +
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" width="15" height="20" aria-hidden="true" fill="currentColor"><path d="M342.6 182.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 242.7 86.6 137.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 288 41.4 393.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 333.3l105.4 105.4c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 288z"/></svg>' +
      '</button>' +
      '<div class="pwb-head">' +
      '<div class="pwb-icon" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" width="20" height="20" fill="currentColor"><path d="M224 256A128 128 0 1 0 224 0a128 128 0 1 0 0 256zm89.6 32h-11.8c-22.2 10.2-49.5 16-77.8 16s-55.6-5.8-77.8-16h-11.8C60.1 288 0 348.1 0 422.4V464c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48v-41.6C448 348.1 387.9 288 313.6 288z"/></svg></div>' +
      '<h2 class="pwb-title">' + escapeHtml(t.title) + '</h2>' +
      '</div>' +
      '<p class="pwb-message">' + escapeHtml(t.message) + '</p>' +
      '<div class="pwb-row"><span class="pwb-price">' + escapeHtml(t.price) + '</span><a class="pwb-button" href="' + escapeHtml(accountUrl()) + '">' +
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" width="14" height="16" fill="currentColor" aria-hidden="true"><path d="M320 128a128 128 0 1 0-256 0v48H48c-26.5 0-48 21.5-48 48v240c0 26.5 21.5 48 48 48h320c26.5 0 48-21.5 48-48V224c0-26.5-21.5-48-48-48h-16v-48zm-64 0v48H128v-48a64 64 0 1 1 128 0z"/></svg>' +
      escapeHtml(t.action) + '</a></div>' +
      '<p class="pwb-note">' + escapeHtml(t.note) + '</p>' +
      '</div>';

    document.body.appendChild(root);
    root.querySelector(".pwb-close").addEventListener("click", dismiss);
  }

  function init() {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount, { once: true });
    else mount();
  }

  window.AccessModules = window.AccessModules || {};
  window.AccessModules.premiumWelcomeBanner = { init: init, mount: mount, dismiss: dismiss };
})(window, document);
