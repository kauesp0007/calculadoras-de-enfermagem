(function (window) {
  "use strict";

  var HOME = { pt: "Início", en: "Home", es: "Inicio", fr: "Accueil", de: "Startseite", it: "Home", hi: "होम", zh: "首页", ar: "الرئيسية", ja: "ホーム", ru: "Главная", ko: "홈", tr: "Ana sayfa", nl: "Home", pl: "Strona główna", sv: "Start", id: "Beranda", vi: "Trang chủ", uk: "Головна" };
  var ACCOUNT = { pt: "Minha Conta", en: "My Account", es: "Mi cuenta", fr: "Mon compte", de: "Mein Konto", it: "Il mio account", hi: "मेरा खाता", zh: "我的账户", ar: "حسابي", ja: "マイアカウント", ru: "Мой аккаунт", ko: "내 계정", tr: "Hesabım", nl: "Mijn account", pl: "Moje konto", sv: "Mitt konto", id: "Akun Saya", vi: "Tài khoản của tôi", uk: "Мій обліковий запис" };
  var COUNTRY = { pt: "País", en: "Country", es: "País", fr: "Pays", de: "Land", it: "Paese", hi: "देश", zh: "国家/地区", ar: "البلد", ja: "国", ru: "Страна", ko: "국가", tr: "Ülke", nl: "Land", pl: "Kraj", sv: "Land", id: "Negara", vi: "Quốc gia", uk: "Країна" };
  var LOGIN = { pt: "Método de login", en: "Sign-in method", es: "Método de inicio de sesión", fr: "Méthode de connexion", de: "Anmeldemethode", it: "Metodo di accesso", hi: "लॉगिन विधि", zh: "登录方式", ar: "طريقة تسجيل الدخول", ja: "ログイン方法", ru: "Способ входа", ko: "로그인 방식", tr: "Giriş yöntemi", nl: "Aanmeldmethode", pl: "Metoda logowania", sv: "Inloggningsmetod", id: "Metode masuk", vi: "Phương thức đăng nhập", uk: "Спосіб входу" };
  var CREATED = { pt: "Data de cadastro", en: "Registration date", es: "Fecha de registro", fr: "Date d’inscription", de: "Registrierungsdatum", it: "Data di registrazione", hi: "पंजीकरण तिथि", zh: "注册日期", ar: "تاريخ التسجيل", ja: "登録日", ru: "Дата регистрации", ko: "가입일", tr: "Kayıt tarihi", nl: "Registratiedatum", pl: "Data rejestracji", sv: "Registreringsdatum", id: "Tanggal pendaftaran", vi: "Ngày đăng ký", uk: "Дата реєстрації" };
  var LAST = { pt: "Último acesso", en: "Last access", es: "Último acceso", fr: "Dernier accès", de: "Letzter Zugriff", it: "Ultimo accesso", hi: "अंतिम पहुंच", zh: "上次访问", ar: "آخر وصول", ja: "最終アクセス", ru: "Последний вход", ko: "마지막 접속", tr: "Son erişim", nl: "Laatste toegang", pl: "Ostatni dostęp", sv: "Senaste åtkomst", id: "Akses terakhir", vi: "Lần truy cập cuối", uk: "Останній доступ" };
  var EDIT = { pt: "Editar nome", en: "Edit name", es: "Editar nombre", fr: "Modifier le nom", de: "Namen bearbeiten", it: "Modifica nome", hi: "नाम संपादित करें", zh: "编辑姓名", ar: "تعديل الاسم", ja: "名前を編集", ru: "Изменить имя", ko: "이름 수정", tr: "Adı düzenle", nl: "Naam bewerken", pl: "Edytuj nazwę", sv: "Redigera namn", id: "Edit nama", vi: "Chỉnh sửa tên", uk: "Змінити ім'я" };
  var TYPES = {
    calculator: { pt: "Calculadora", en: "Calculator", es: "Calculadora", fr: "Calculateur", de: "Rechner", it: "Calcolatore", hi: "कैलकुलेटर", zh: "计算器", ar: "آلة حاسبة", ja: "計算機", ru: "Калькулятор", ko: "계산기", tr: "Hesaplayıcı", nl: "Rekenmachine", pl: "Kalkulator", sv: "Kalkylator", id: "Kalkulator", vi: "Máy tính", uk: "Калькулятор" },
    scale: { pt: "Escala", en: "Scale", es: "Escala", fr: "Échelle", de: "Skala", it: "Scala", hi: "स्केल", zh: "量表", ar: "مقياس", ja: "スケール", ru: "Шкала", ko: "척도", tr: "Ölçek", nl: "Schaal", pl: "Skala", sv: "Skala", id: "Skala", vi: "Thang đo", uk: "Шкала" },
    article: { pt: "Artigo", en: "Article", es: "Artículo", fr: "Article", de: "Artikel", it: "Articolo", hi: "लेख", zh: "文章", ar: "مقالة", ja: "記事", ru: "Статья", ko: "문서", tr: "Makale", nl: "Artikel", pl: "Artykuł", sv: "Artikel", id: "Artikel", vi: "Bài viết", uk: "Стаття" },
    protocol: { pt: "Protocolo", en: "Protocol", es: "Protocolo", fr: "Protocole", de: "Protokoll", it: "Protocollo", hi: "प्रोटोकॉल", zh: "方案", ar: "بروتوكول", ja: "プロトコル", ru: "Протокол", ko: "프로토콜", tr: "Protokol", nl: "Protocol", pl: "Protokół", sv: "Protokoll", id: "Protokol", vi: "Quy trình", uk: "Протокол" },
    download: { pt: "Download", en: "Download", es: "Descarga", fr: "Téléchargement", de: "Download", it: "Download", hi: "डाउनलोड", zh: "下载", ar: "تنزيل", ja: "ダウンロード", ru: "Загрузка", ko: "다운로드", tr: "İndirme", nl: "Download", pl: "Pobieranie", sv: "Nedladdning", id: "Unduhan", vi: "Tải xuống", uk: "Завантаження" },
    course: { pt: "Curso", en: "Course", es: "Curso", fr: "Cours", de: "Kurs", it: "Corso", hi: "पाठ्यक्रम", zh: "课程", ar: "دورة", ja: "コース", ru: "Курс", ko: "과정", tr: "Kurs", nl: "Cursus", pl: "Kurs", sv: "Kurs", id: "Kursus", vi: "Khóa học", uk: "Курс" },
    premium: { pt: "Premium", en: "Premium", es: "Premium", fr: "Premium", de: "Premium", it: "Premium", hi: "प्रीमियम", zh: "高级", ar: "مميز", ja: "プレミアム", ru: "Премиум", ko: "프리미엄", tr: "Premium", nl: "Premium", pl: "Premium", sv: "Premium", id: "Premium", vi: "Premium", uk: "Преміум" },
    library: { pt: "Biblioteca", en: "Library", es: "Biblioteca", fr: "Bibliothèque", de: "Bibliothek", it: "Biblioteca", hi: "लाइब्रेरी", zh: "资料库", ar: "المكتبة", ja: "ライブラリ", ru: "Библиотека", ko: "라이브러리", tr: "Kütüphane", nl: "Bibliotheek", pl: "Biblioteka", sv: "Bibliotek", id: "Perpustakaan", vi: "Thư viện", uk: "Бібліотека" },
    simulation: { pt: "Simulado", en: "Simulation", es: "Simulación", fr: "Simulation", de: "Simulation", it: "Simulazione", hi: "सिमुलेशन", zh: "模拟", ar: "محاكاة", ja: "シミュレーション", ru: "Симуляция", ko: "시뮬레이션", tr: "Simülasyon", nl: "Simulatie", pl: "Symulacja", sv: "Simulering", id: "Simulasi", vi: "Mô phỏng", uk: "Симуляція" },
    page: { pt: "Página", en: "Page", es: "Página", fr: "Page", de: "Seite", it: "Pagina", hi: "पृष्ठ", zh: "页面", ar: "صفحة", ja: "ページ", ru: "Страница", ko: "페이지", tr: "Sayfa", nl: "Pagina", pl: "Strona", sv: "Sida", id: "Halaman", vi: "Trang", uk: "Сторінка" }
  };

  function currentLang() {
    try { var v = window.AccountI18n && window.AccountI18n.getLanguage ? window.AccountI18n.getLanguage() : (window.__LANG || "pt"); v = String(v).toLowerCase(); return v === "pt-br" ? "pt" : v; } catch (_) { return "pt"; }
  }
  function dictText(map) { var l = currentLang(); return map[l] || map.en || map.pt; }
  function languageName(code) {
    var l = currentLang();
    try { if (window.Intl && Intl.DisplayNames) { var name = new Intl.DisplayNames([l], { type: "language" }).of(code); if (name) return name; } } catch (_) { }
    try { var list = window.AccountI18n && window.AccountI18n.languages; if (list) { var item = list.find(function (x) { return x.code === code; }); if (item && item.label) return item.label; } } catch (_) { }
    return String(code || "").toUpperCase();
  }
  function typeName(code) { return TYPES[code] ? dictText(TYPES[code]) : String(code || ""); }

  function localize() {
    var l = currentLang();
    document.documentElement.lang = l === "pt" ? "pt-BR" : l;
    document.documentElement.dir = l === "ar" ? "rtl" : "ltr";

    document.querySelectorAll("a,button,label,p,h3,h4,dt,span,option").forEach(function (el) {
      if (el.hasAttribute("data-localizer-ignore")) return;
      var v = (el.textContent || "").trim();
      if (v === "MINHA CONTA") el.textContent = dictText(ACCOUNT);
      else if (v === "Início") el.textContent = dictText(HOME);
      else if (v === "Minha Conta") el.textContent = dictText(ACCOUNT);
      else if (v === "País") el.textContent = dictText(COUNTRY);
      else if (v === "Método de login") el.textContent = dictText(LOGIN);
      else if (v === "Data de cadastro") el.textContent = dictText(CREATED);
      else if (v === "Último acesso") el.textContent = dictText(LAST);
      else if (v === "Editar nome") el.textContent = dictText(EDIT);
    });

    document.querySelectorAll("select[id*='filter-type'] option").forEach(function (o) {
      if (o.value) o.textContent = typeName(o.value);
    });
    document.querySelectorAll("select[id*='filter-language'] option").forEach(function (o) {
      if (o.value) o.textContent = languageName(o.value);
      else if (!o.textContent.trim() || /Todos os idiomas/i.test(o.textContent)) o.textContent = (window.AccountI18n && window.AccountI18n.t ? window.AccountI18n.t("allLanguages") : "All languages");
    });
    document.querySelectorAll("a[href^='/conta/']").forEach(function (a) {
      var href = a.getAttribute("href") || "";
      var m = href.match(/^\/conta\/(perfil|configuracoes|favoritos|historico|assinatura|login)\.html/);
      if (m && window.AccountRoutes && window.AccountRoutes.accountUrl) a.setAttribute("href", window.AccountRoutes.accountUrl(m[1] + ".html"));
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", localize); else localize();

  // Observa o DOM SOMENTE em páginas de conta e com debounce (250ms).
  // Em calculadoras/escalas o observer disparava em cada anúncio injetado,
  // causando reflow forçado e milissegundos de execução desperdiçada.
  var _localizeTimer = null;
  function scheduleLocalize() {
    if (_localizeTimer) return;
    _localizeTimer = setTimeout(function () { _localizeTimer = null; localize(); }, 250);
  }
  var _isAccountPage = (window.location.pathname || "").indexOf("/conta/") === 0;
  if (window.MutationObserver && document.body && _isAccountPage) {
    new MutationObserver(scheduleLocalize).observe(document.body, { childList: true, subtree: true });
  }

  document.addEventListener("conta:languagechange", scheduleLocalize);
  window.AccountExtraLocalizer = { localize: localize, typeName: typeName, languageName: languageName };
})(window);
