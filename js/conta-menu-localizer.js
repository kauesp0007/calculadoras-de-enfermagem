(function (window) {
  "use strict";
  var MENU = {
    "pt-BR": { profile: "Meu Perfil", favorites: "Favoritos", history: "Histórico", settings: "Configurações", signOut: "Sair", signIn: "Entrar", plan: "Plano", admin: "Admin", user: "Usuário" },
    en: { profile: "My Profile", favorites: "Favorites", history: "History", settings: "Settings", signOut: "Sign out", signIn: "Sign in", plan: "Plan", admin: "Admin", user: "User" },
    es: { profile: "Mi perfil", favorites: "Favoritos", history: "Historial", settings: "Configuración", signOut: "Cerrar sesión", signIn: "Entrar", plan: "Plan", admin: "Admin", user: "Usuario" },
    fr: { profile: "Mon profil", favorites: "Favoris", history: "Historique", settings: "Paramètres", signOut: "Se déconnecter", signIn: "Se connecter", plan: "Formule", admin: "Admin", user: "Utilisateur" },
    de: { profile: "Mein Profil", favorites: "Favoriten", history: "Verlauf", settings: "Einstellungen", signOut: "Abmelden", signIn: "Einloggen", plan: "Tarif", admin: "Admin", user: "Benutzer" },
    it: { profile: "Il mio profilo", favorites: "Preferiti", history: "Cronologia", settings: "Impostazioni", signOut: "Esci", signIn: "Accedi", plan: "Piano", admin: "Admin", user: "Utente" },
    ja: { profile: "マイプロフィール", favorites: "お気に入り", history: "履歴", settings: "設定", signOut: "ログアウト", signIn: "ログイン", plan: "プラン", admin: "管理", user: "ユーザー" },
    zh: { profile: "我的个人资料", favorites: "收藏夹", history: "历史记录", settings: "设置", signOut: "退出登录", signIn: "登录", plan: "套餐", admin: "管理", user: "用户" },
    hi: { profile: "मेरी प्रोफ़ाइल", favorites: "पसंदीदा", history: "इतिहास", settings: "सेटिंग्स", signOut: "साइन आउट", signIn: "साइन इन", plan: "प्लान", admin: "व्यवस्थापक", user: "उपयोगकर्ता" },
    ar: { profile: "ملفي الشخصي", favorites: "المفضلة", history: "السجل", settings: "الإعدادات", signOut: "تسجيل الخروج", signIn: "تسجيل الدخول", plan: "الخطة", admin: "الإدارة", user: "مستخدم" },
    ru: { profile: "Мой профиль", favorites: "Избранное", history: "История", settings: "Настройки", signOut: "Выйти", signIn: "Войти", plan: "План", admin: "Админ", user: "Пользователь" },
    tr: { profile: "Profilim", favorites: "Favoriler", history: "Geçmiş", settings: "Ayarlar", signOut: "Çıkış yap", signIn: "Giriş yap", plan: "Plan", admin: "Yönetim", user: "Kullanıcı" },
    ko: { profile: "내 프로필", favorites: "즐겨찾기", history: "기록", settings: "설정", signOut: "로그아웃", signIn: "로그인", plan: "플랜", admin: "관리자", user: "사용자" },
    nl: { profile: "Mijn profiel", favorites: "Favorieten", history: "Geschiedenis", settings: "Instellingen", signOut: "Uitloggen", signIn: "Inloggen", plan: "Abonnement", admin: "Beheer", user: "Gebruiker" },
    pl: { profile: "Mój profil", favorites: "Ulubione", history: "Historia", settings: "Ustawienia", signOut: "Wyloguj", signIn: "Zaloguj się", plan: "Plan", admin: "Administracja", user: "Użytkownik" },
    sv: { profile: "Min profil", favorites: "Favoriter", history: "Historik", settings: "Inställningar", signOut: "Logga ut", signIn: "Logga in", plan: "Plan", admin: "Admin", user: "Användare" },
    id: { profile: "Profil Saya", favorites: "Favorit", history: "Riwayat", settings: "Pengaturan", signOut: "Keluar", signIn: "Masuk", plan: "Paket", admin: "Admin", user: "Pengguna" },
    vi: { profile: "Hồ sơ của tôi", favorites: "Yêu thích", history: "Lịch sử", settings: "Cài đặt", signOut: "Đăng xuất", signIn: "Đăng nhập", plan: "Gói", admin: "Quản trị", user: "Người dùng" },
    uk: { profile: "Мій профіль", favorites: "Обране", history: "Історія", settings: "Налаштування", signOut: "Вийти", signIn: "Увійти", plan: "План", admin: "Адмін", user: "Користувач" }
  };
  function lang() {
    try { var v = window.AccountI18n && window.AccountI18n.getLanguage ? window.AccountI18n.getLanguage() : (window.__LANG || "pt"); return v === "pt-BR" ? "pt-BR" : v; } catch (_) { return "pt-BR"; }
  }
  function localize() {
    if (!window.document) return;
    var map = MENU[lang()] || MENU["pt-BR"];
    var replacements = { "Meu Perfil": map.profile, "Favoritos": map.favorites, "Histórico": map.history, "Configurações": map.settings, "Sair": map.signOut, "Sair da conta": map.signOut, "Entrar": map.signIn, "Plano": map.plan, "Admin": map.admin, "Usuário": map.user };
    window.document.querySelectorAll("a,button,p,span,div").forEach(function (el) {
      if (el.children.length) return;
      var text = (el.textContent || "").trim();
      if (replacements[text]) el.textContent = replacements[text];
    });
    window.document.documentElement.setAttribute("dir", lang() === "ar" ? "rtl" : "ltr");
  }
  var scheduled = false;
  function schedule() { if (scheduled) return; scheduled = true; window.setTimeout(function () { scheduled = false; localize(); }, 0); }
  function init() {
    schedule();
    if (window.document && window.MutationObserver && window.document.body) new MutationObserver(schedule).observe(window.document.body, { childList: true, subtree: true });
    if (window.document) window.document.addEventListener("conta:languagechange", schedule);
  }
  window.AccountMenuI18n = { init: init, localize: localize };
  if (window.document && window.document.readyState === "loading") window.document.addEventListener("DOMContentLoaded", init); else init();
})(window);
