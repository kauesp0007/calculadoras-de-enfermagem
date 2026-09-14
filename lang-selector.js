/**
 * lang-selector.js
 * Responsável por injetar e gerir o seletor de idiomas dinâmico.
 * Também mantém a área de conta traduzida após componentes dinâmicos.
 */

document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("language-selector-placeholder");
  if (!container) return;

  fetch("/_language_selector.html")
    .then(response => {
      if (!response.ok) throw new Error("Ficheiro _language_selector.html não encontrado");
      return response.text();
    })
    .then(data => {
      container.innerHTML = data;
      langSelectorInit();
      accountLanguageSync();
    })
    .catch(err => console.error("Erro ao carregar seletor de idiomas:", err));
});

function langSelectorInit() {
  const button = document.getElementById("langButton");
  const menu = document.getElementById("langMenu");
  const langFlag = document.getElementById("langFlag");
  const langText = document.getElementById("langText");
  if (!button || !menu) return;

  const pathName = window.location.pathname;
  const fileNameMatch = pathName.match(/[^/]*.html$/i);
  const currentFileName = fileNameMatch ? fileNameMatch[0] : "";
  const isAccountPage = pathName.indexOf("/conta/") === 0;

  button.addEventListener("click", () => {
    menu.classList.toggle("hidden");
    button.setAttribute("aria-expanded", !menu.classList.contains("hidden"));
  });

  document.addEventListener("click", (e) => {
    if (!button.contains(e.target) && !menu.contains(e.target)) {
      menu.classList.add("hidden");
      button.setAttribute("aria-expanded", "false");
    }
  });

  document.querySelectorAll("#langMenu div").forEach((item) => {
    item.addEventListener("click", () => {
      const value = item.dataset.value;
      const flag = item.dataset.flag;
      const text = item.textContent.trim();
      langFlag.src = flag;
      langText.textContent = text;
      menu.classList.add("hidden");
      button.setAttribute("aria-expanded", "false");

      if (isAccountPage) {
        const url = new URL(window.location.href);
        url.searchParams.set("lang", value || "pt");
        url.searchParams.delete("stripe");
        url.searchParams.delete("asaas");
        try { localStorage.setItem("conta.language", value === "pt" ? "pt-BR" : value); } catch (e) {}
        window.location.href = url.pathname + "?" + url.searchParams.toString() + url.hash;
        return;
      }

      let newPath = "";
      switch (value) {
        case "en": newPath = "/en/"; break;
        case "es": newPath = "/es/"; break;
        case "de": newPath = "/de/"; break;
        case "it": newPath = "/it/"; break;
        case "fr": newPath = "/fr/"; break;
        case "hi": newPath = "/hi/"; break;
        case "zh": newPath = "/zh/"; break;
        case "ar": newPath = "/ar/"; break;
        case "ja": newPath = "/ja/"; break;
        case "ru": newPath = "/ru/"; break;
        case "ko": newPath = "/ko/"; break;
        case "tr": newPath = "/tr/"; break;
        case "nl": newPath = "/nl/"; break;
        case "pl": newPath = "/pl/"; break;
        case "sv": newPath = "/sv/"; break;
        case "id": newPath = "/id/"; break;
        case "vi": newPath = "/vi/"; break;
        case "uk": newPath = "/uk/"; break;
        default: newPath = "/";
      }
      if (currentFileName && currentFileName !== "index.html") newPath += currentFileName;
      window.location.href = newPath;
    });
  });

  const path = window.location.pathname;
  let current = document.querySelector('[data-value="pt"]');
  const langs = ["en", "es", "de", "it", "fr", "hi", "zh", "ar", "ja", "ru", "ko", "tr", "nl", "pl", "sv", "id", "vi", "uk"];
  const queryLang = isAccountPage ? new URLSearchParams(window.location.search).get("lang") : null;
  if (queryLang === "pt" || langs.indexOf(queryLang) !== -1) current = document.querySelector(`[data-value="${queryLang}"]`);
  for (const lang of langs) {
    if (!queryLang && path.startsWith(`/${lang}/`)) {
      current = document.querySelector(`[data-value="${lang}"]`);
      break;
    }
  }
  if (current) {
    langFlag.src = current.dataset.flag;
    langText.textContent = current.textContent.trim();
  }
}

const ACCOUNT_EXTRA_I18N = {
  en: {
    "MINHA CONTA":"MY ACCOUNT", "Início":"Home", "Idioma":"Language", "País":"Country", "Método de login":"Login method", "Data de cadastro":"Registration date", "Último acesso":"Last access", "Editar nome":"Edit name", "Conta":"Account", "Premium (Júnior)":"Premium (Junior)", "Digite um nome válido (mínimo 2 caracteres).":"Enter a valid name (at least 2 characters).", "Nome atualizado com sucesso!":"Name updated successfully!", "Tema":"Theme", "Receber novidades":"Receive updates", "Enviaremos atualizações e novos recursos por e-mail (opcional).":"We will send updates and new features by email (optional).", "Padrão":"Default", "Grande":"Large", "Muito grande":"Very large", "Extra grande":"Extra large", "Máximo":"Maximum", "Mais recentes":"Newest", "Mais antigos":"Oldest", "Ordem alfabética":"Alphabetical order", "Visitas":"Visits", "Páginas únicas":"Unique pages", "Tempo total":"Total time", "Registro automático das páginas que você visita.":"Automatic record of pages you visit.", "Admin":"Admin", "Usuário":"User", "Calculadora":"Calculator", "Escala":"Scale", "Artigo":"Article", "Protocolo":"Protocol", "Download":"Download", "Curso":"Course", "Simulado":"Simulation", "Biblioteca":"Library", "Página":"Page", "Inglês":"English", "Espanhol":"Spanish", "Alemão":"German", "Italiano":"Italian", "Francês":"French", "Hindi":"Hindi", "Chinês":"Chinese", "Árabe":"Arabic", "Japonês":"Japanese", "Russo":"Russian", "Coreano":"Korean", "Turco":"Turkish", "Holandês":"Dutch", "Polonês":"Polish", "Sueco":"Swedish", "Indonésio":"Indonesian", "Vietnamita":"Vietnamese", "Ucraniano":"Ukrainian"
  },
  es: {
    "MINHA CONTA":"MI CUENTA", "Início":"Inicio", "Idioma":"Idioma", "País":"País", "Método de login":"Método de acceso", "Data de cadastro":"Fecha de registro", "Último acesso":"Último acceso", "Editar nome":"Editar nombre", "Conta":"Cuenta", "Premium (Júnior)":"Premium (Júnior)", "Digite um nome válido (mínimo 2 caracteres).":"Introduce un nombre válido (mínimo 2 caracteres).", "Nome atualizado com sucesso!":"¡Nombre actualizado correctamente!", "Tema":"Tema", "Receber novidades":"Recibir novedades", "Enviaremos atualizações e novos recursos por e-mail (opcional).":"Enviaremos actualizaciones y nuevas funciones por correo electrónico (opcional).", "Padrão":"Predeterminado", "Grande":"Grande", "Muito grande":"Muy grande", "Extra grande":"Extra grande", "Máximo":"Máximo", "Mais recentes":"Más recientes", "Mais antigos":"Más antiguos", "Ordem alfabética":"Orden alfabético", "Visitas":"Visitas", "Páginas únicas":"Páginas únicas", "Tempo total":"Tiempo total", "Registro automático das páginas que você visita.":"Registro automático de las páginas que visitas.", "Admin":"Admin", "Usuário":"Usuario", "Calculadora":"Calculadora", "Escala":"Escala", "Artigo":"Artículo", "Protocolo":"Protocolo", "Download":"Descarga", "Curso":"Curso", "Simulado":"Simulación", "Biblioteca":"Biblioteca", "Página":"Página", "Inglês":"Inglés", "Espanhol":"Español", "Alemão":"Alemán", "Italiano":"Italiano", "Francês":"Francés", "Hindi":"Hindi", "Chinês":"Chino", "Árabe":"Árabe", "Japonês":"Japonés", "Russo":"Ruso", "Coreano":"Coreano", "Turco":"Turco", "Holandês":"Neerlandés", "Polonês":"Polaco", "Sueco":"Sueco", "Indonésio":"Indonesio", "Vietnamita":"Vietnamita", "Ucraniano":"Ucraniano"
  },
  fr: {
    "MINHA CONTA":"MON COMPTE", "Início":"Accueil", "Idioma":"Langue", "País":"Pays", "Método de login":"Méthode de connexion", "Data de cadastro":"Date d’inscription", "Último acesso":"Dernier accès", "Editar nome":"Modifier le nom", "Conta":"Compte", "Premium (Júnior)":"Premium (Junior)", "Digite um nome válido (mínimo 2 caracteres).":"Saisissez un nom valide (au moins 2 caractères).", "Nome atualizado com sucesso!":"Nom mis à jour avec succès !", "Tema":"Thème", "Receber novidades":"Recevoir les nouveautés", "Enviaremos atualizações e novos recursos por e-mail (opcional).":"Nous enverrons les mises à jour et nouvelles fonctionnalités par e-mail (facultatif).", "Padrão":"Par défaut", "Grande":"Grande", "Muito grande":"Très grande", "Extra grande":"Extra grande", "Máximo":"Maximum", "Mais recentes":"Plus récents", "Mais antigos":"Plus anciens", "Ordem alfabética":"Ordre alphabétique", "Visitas":"Visites", "Páginas únicas":"Pages uniques", "Tempo total":"Temps total", "Registro automático das páginas que você visita.":"Enregistrement automatique des pages que vous consultez.", "Admin":"Admin", "Usuário":"Utilisateur", "Calculadora":"Calculateur", "Escala":"Échelle", "Artigo":"Article", "Protocolo":"Protocole", "Download":"Téléchargement", "Curso":"Cours", "Simulado":"Simulation", "Biblioteca":"Bibliothèque", "Página":"Page", "Inglês":"Anglais", "Espanhol":"Espagnol", "Alemão":"Allemand", "Italiano":"Italien", "Francês":"Français", "Hindi":"Hindi", "Chinês":"Chinois", "Árabe":"Arabe", "Japonês":"Japonais", "Russo":"Russe", "Coreano":"Coréen", "Turco":"Turc", "Holandês":"Néerlandais", "Polonês":"Polonais", "Sueco":"Suédois", "Indonésio":"Indonésien", "Vietnamita":"Vietnamien", "Ucraniano":"Ukrainien"
  },
  de: {
    "MINHA CONTA":"MEIN KONTO", "Início":"Startseite", "Idioma":"Sprache", "País":"Land", "Método de login":"Anmeldemethode", "Data de cadastro":"Registrierungsdatum", "Último acesso":"Letzter Zugriff", "Editar nome":"Namen bearbeiten", "Conta":"Konto", "Premium (Júnior)":"Premium (Junior)", "Digite um nome válido (mínimo 2 caracteres).":"Geben Sie einen gültigen Namen ein (mindestens 2 Zeichen).", "Nome atualizado com sucesso!":"Name erfolgreich aktualisiert!", "Tema":"Design", "Receber novidades":"Neuigkeiten erhalten", "Enviaremos atualizações e novos recursos por e-mail (opcional).":"Wir senden Updates und neue Funktionen per E-Mail (optional).", "Padrão":"Standard", "Grande":"Groß", "Muito grande":"Sehr groß", "Extra grande":"Extra groß", "Máximo":"Maximum", "Mais recentes":"Neueste", "Mais antigos":"Älteste", "Ordem alfabética":"Alphabetische Reihenfolge", "Visitas":"Besuche", "Páginas únicas":"Eindeutige Seiten", "Tempo total":"Gesamtzeit", "Registro automático das páginas que você visita.":"Automatische Erfassung der von Ihnen besuchten Seiten.", "Admin":"Admin", "Usuário":"Benutzer", "Calculadora":"Rechner", "Escala":"Skala", "Artigo":"Artikel", "Protocolo":"Protokoll", "Download":"Download", "Curso":"Kurs", "Simulado":"Simulation", "Biblioteca":"Bibliothek", "Página":"Seite", "Inglês":"Englisch", "Espanhol":"Spanisch", "Alemão":"Deutsch", "Italiano":"Italienisch", "Francês":"Französisch", "Hindi":"Hindi", "Chinês":"Chinesisch", "Árabe":"Arabisch", "Japonês":"Japanisch", "Russo":"Russisch", "Coreano":"Koreanisch", "Turco":"Türkisch", "Holandês":"Niederländisch", "Polonês":"Polnisch", "Sueco":"Schwedisch", "Indonésio":"Indonesisch", "Vietnamita":"Vietnamesisch", "Ucraniano":"Ukrainisch"
  },
  it: {
    "MINHA CONTA":"IL MIO ACCOUNT", "Início":"Home", "Idioma":"Lingua", "País":"Paese", "Método de login":"Metodo di accesso", "Data de cadastro":"Data di registrazione", "Último acesso":"Ultimo accesso", "Editar nome":"Modifica nome", "Conta":"Account", "Premium (Júnior)":"Premium (Junior)", "Digite um nome válido (mínimo 2 caracteres).":"Inserisci un nome valido (almeno 2 caratteri).", "Nome atualizado com sucesso!":"Nome aggiornato con successo!", "Tema":"Tema", "Receber novidades":"Ricevi aggiornamenti", "Enviaremos atualizações e novos recursos por e-mail (opcional).":"Invieremo aggiornamenti e nuove funzionalità via e-mail (facoltativo).", "Padrão":"Predefinito", "Grande":"Grande", "Muito grande":"Molto grande", "Extra grande":"Molto grande", "Máximo":"Massimo", "Mais recentes":"Più recenti", "Mais antigos":"Più vecchi", "Ordem alfabética":"Ordine alfabetico", "Visitas":"Visite", "Páginas únicas":"Pagine uniche", "Tempo total":"Tempo totale", "Registro automático das páginas que você visita.":"Registrazione automatica delle pagine visitate.", "Admin":"Admin", "Usuário":"Utente", "Calculadora":"Calcolatore", "Escala":"Scala", "Artigo":"Articolo", "Protocolo":"Protocollo", "Download":"Download", "Curso":"Corso", "Simulado":"Simulazione", "Biblioteca":"Biblioteca", "Página":"Pagina", "Inglês":"Inglese", "Espanhol":"Spagnolo", "Alemão":"Tedesco", "Italiano":"Italiano", "Francês":"Francese", "Hindi":"Hindi", "Chinês":"Cinese", "Árabe":"Arabo", "Japonês":"Giapponese", "Russo":"Russo", "Coreano":"Coreano", "Turco":"Turco", "Holandês":"Olandese", "Polonês":"Polacco", "Sueco":"Svedese", "Indonésio":"Indonesiano", "Vietnamita":"Vietnamita", "Ucraniano":"Ucraino"
  },
  hi: {"MINHA CONTA":"मेरा खाता","Início":"होम","Idioma":"भाषा","País":"देश","Método de login":"लॉगिन विधि","Data de cadastro":"पंजीकरण तिथि","Último acesso":"अंतिम पहुंच","Editar nome":"नाम संपादित करें","Conta":"खाता","Premium (Júnior)":"प्रीमियम (जूनियर)","Digite um nome válido (mínimo 2 caracteres).":"मान्य नाम दर्ज करें (कम से कम 2 अक्षर)।","Nome atualizado com sucesso!":"नाम सफलतापूर्वक अपडेट हुआ!","Tema":"थीम","Receber novidades":"अपडेट प्राप्त करें","Padrão":"डिफ़ॉल्ट","Grande":"बड़ा","Muito grande":"बहुत बड़ा","Extra grande":"अतिरिक्त बड़ा","Máximo":"अधिकतम","Mais recentes":"नवीनतम","Mais antigos":"पुराने","Ordem alfabética":"वर्णानुक्रम","Visitas":"विज़िट","Páginas únicas":"अद्वितीय पृष्ठ","Tempo total":"कुल समय","Admin":"एडमिन","Usuário":"उपयोगकर्ता"},
  zh: {"MINHA CONTA":"我的账户","Início":"首页","Idioma":"语言","País":"国家/地区","Método de login":"登录方式","Data de cadastro":"注册日期","Último acesso":"上次访问","Editar nome":"编辑姓名","Conta":"账户","Premium (Júnior)":"Premium（Junior）","Digite um nome válido (mínimo 2 caracteres).":"请输入有效姓名（至少2个字符）。","Nome atualizado com sucesso!":"姓名更新成功！","Tema":"主题","Receber novidades":"接收更新","Padrão":"默认","Grande":"大","Muito grande":"特大","Extra grande":"超大","Máximo":"最大","Mais recentes":"最新","Mais antigos":"最早","Ordem alfabética":"字母顺序","Visitas":"访问次数","Páginas únicas":"唯一页面","Tempo total":"总时间","Admin":"管理员","Usuário":"用户"},
  ja: {"MINHA CONTA":"マイアカウント","Início":"ホーム","Idioma":"言語","País":"国","Método de login":"ログイン方法","Data de cadastro":"登録日","Último acesso":"最終アクセス","Editar nome":"名前を編集","Conta":"アカウント","Premium (Júnior)":"Premium（Junior）","Digite um nome válido (mínimo 2 caracteres).":"有効な名前を入力してください（2文字以上）。","Nome atualizado com sucesso!":"名前を更新しました。","Tema":"テーマ","Receber novidades":"更新を受け取る","Padrão":"標準","Grande":"大","Muito grande":"特大","Extra grande":"超特大","Máximo":"最大","Mais recentes":"新しい順","Mais antigos":"古い順","Ordem alfabética":"アルファベット順","Visitas":"訪問","Páginas únicas":"ユニークページ","Tempo total":"合計時間","Admin":"管理者","Usuário":"ユーザー"},
  ru: {"MINHA CONTA":"МОЙ АККАУНТ","Início":"Главная","Idioma":"Язык","País":"Страна","Método de login":"Способ входа","Data de cadastro":"Дата регистрации","Último acesso":"Последний доступ","Editar nome":"Изменить имя","Conta":"Аккаунт","Premium (Júnior)":"Premium (Junior)","Digite um nome válido (mínimo 2 caracteres).":"Введите допустимое имя (не менее 2 символов).","Nome atualizado com sucesso!":"Имя успешно обновлено!","Tema":"Тема","Receber novidades":"Получать обновления","Padrão":"По умолчанию","Grande":"Большой","Muito grande":"Очень большой","Extra grande":"Экстра большой","Máximo":"Максимальный","Mais recentes":"Сначала новые","Mais antigos":"Сначала старые","Ordem alfabética":"В алфавитном порядке","Visitas":"Посещения","Páginas únicas":"Уникальные страницы","Tempo total":"Общее время","Admin":"Администратор","Usuário":"Пользователь"},
  ko: {"MINHA CONTA":"내 계정","Início":"홈","Idioma":"언어","País":"국가","Método de login":"로그인 방법","Data de cadastro":"가입일","Último acesso":"마지막 접속","Editar nome":"이름 수정","Conta":"계정","Premium (Júnior)":"Premium (Junior)","Digite um nome válido (mínimo 2 caracteres).":"유효한 이름을 입력하세요(2자 이상).","Nome atualizado com sucesso!":"이름이 성공적으로 업데이트되었습니다!","Tema":"테마","Receber novidades":"업데이트 받기","Padrão":"기본","Grande":"크게","Muito grande":"매우 크게","Extra grande":"아주 크게","Máximo":"최대","Mais recentes":"최신순","Mais antigos":"오래된 순","Ordem alfabética":"알파벳순","Visitas":"방문","Páginas únicas":"고유 페이지","Tempo total":"총 시간","Admin":"관리자","Usuário":"사용자"},
  tr: {"MINHA CONTA":"HESABIM","Início":"Ana sayfa","Idioma":"Dil","País":"Ülke","Método de login":"Giriş yöntemi","Data de cadastro":"Kayıt tarihi","Último acesso":"Son erişim","Editar nome":"Adı düzenle","Conta":"Hesap","Premium (Júnior)":"Premium (Junior)","Digite um nome válido (mínimo 2 caracteres).":"Geçerli bir ad girin (en az 2 karakter).","Nome atualizado com sucesso!":"Ad başarıyla güncellendi!","Tema":"Tema","Receber novidades":"Güncellemeleri al","Padrão":"Varsayılan","Grande":"Büyük","Muito grande":"Çok büyük","Extra grande":"Ekstra büyük","Máximo":"Maksimum","Mais recentes":"En yeniler","Mais antigos":"En eskiler","Ordem alfabética":"Alfabetik sıra","Visitas":"Ziyaretler","Páginas únicas":"Benzersiz sayfalar","Tempo total":"Toplam süre","Admin":"Yönetici","Usuário":"Kullanıcı"},
  nl: {"MINHA CONTA":"MIJN ACCOUNT","Início":"Home","Idioma":"Taal","País":"Land","Método de login":"Aanmeldmethode","Data de cadastro":"Registratiedatum","Último acesso":"Laatste toegang","Editar nome":"Naam bewerken","Conta":"Account","Premium (Júnior)":"Premium (Junior)","Digite um nome válido (mínimo 2 caracteres).":"Voer een geldige naam in (minimaal 2 tekens).","Nome atualizado com sucesso!":"Naam succesvol bijgewerkt!","Tema":"Thema","Receber novidades":"Updates ontvangen","Padrão":"Standaard","Grande":"Groot","Muito grande":"Zeer groot","Extra grande":"Extra groot","Máximo":"Maximum","Mais recentes":"Nieuwste","Mais antigos":"Oudste","Ordem alfabética":"Alfabetische volgorde","Visitas":"Bezoeken","Páginas únicas":"Unieke pagina's","Tempo total":"Totale tijd","Admin":"Admin","Usuário":"Gebruiker"},
  pl: {"MINHA CONTA":"MOJE KONTO","Início":"Strona główna","Idioma":"Język","País":"Kraj","Método de login":"Metoda logowania","Data de cadastro":"Data rejestracji","Último acesso":"Ostatni dostęp","Editar nome":"Edytuj nazwę","Conta":"Konto","Premium (Júnior)":"Premium (Junior)","Digite um nome válido (mínimo 2 caracteres).":"Wprowadź prawidłową nazwę (co najmniej 2 znaki).","Nome atualizado com sucesso!":"Nazwa została zaktualizowana!","Tema":"Motyw","Receber novidades":"Otrzymuj aktualizacje","Padrão":"Domyślny","Grande":"Duży","Muito grande":"Bardzo duży","Extra grande":"Bardzo duży","Máximo":"Maksymalny","Mais recentes":"Najnowsze","Mais antigos":"Najstarsze","Ordem alfabética":"Alfabetycznie","Visitas":"Wizyty","Páginas únicas":"Unikalne strony","Tempo total":"Łączny czas","Admin":"Administrator","Usuário":"Użytkownik"},
  sv: {"MINHA CONTA":"MITT KONTO","Início":"Start","Idioma":"Språk","País":"Land","Método de login":"Inloggningsmetod","Data de cadastro":"Registreringsdatum","Último acesso":"Senaste åtkomst","Editar nome":"Redigera namn","Conta":"Konto","Premium (Júnior)":"Premium (Junior)","Digite um nome válido (mínimo 2 caracteres).":"Ange ett giltigt namn (minst 2 tecken).","Nome atualizado com sucesso!":"Namnet uppdaterades!","Tema":"Tema","Receber novidades":"Få uppdateringar","Padrão":"Standard","Grande":"Stor","Muito grande":"Mycket stor","Extra grande":"Extra stor","Máximo":"Maximal","Mais recentes":"Senaste","Mais antigos":"Äldsta","Ordem alfabética":"Alfabetisk ordning","Visitas":"Besök","Páginas únicas":"Unika sidor","Tempo total":"Total tid","Admin":"Admin","Usuário":"Användare"},
  id: {"MINHA CONTA":"AKUN SAYA","Início":"Beranda","Idioma":"Bahasa","País":"Negara","Método de login":"Metode masuk","Data de cadastro":"Tanggal pendaftaran","Último acesso":"Akses terakhir","Editar nome":"Edit nama","Conta":"Akun","Premium (Júnior)":"Premium (Junior)","Digite um nome válido (mínimo 2 caracteres).":"Masukkan nama yang valid (minimal 2 karakter).","Nome atualizado com sucesso!":"Nama berhasil diperbarui!","Tema":"Tema","Receber novidades":"Terima pembaruan","Padrão":"Bawaan","Grande":"Besar","Muito grande":"Sangat besar","Extra grande":"Ekstra besar","Máximo":"Maksimal","Mais recentes":"Terbaru","Mais antigos":"Terlama","Ordem alfabética":"Urutan alfabetis","Visitas":"Kunjungan","Páginas únicas":"Halaman unik","Tempo total":"Total waktu","Admin":"Admin","Usuário":"Pengguna"},
  vi: {"MINHA CONTA":"TÀI KHOẢN CỦA TÔI","Início":"Trang chủ","Idioma":"Ngôn ngữ","País":"Quốc gia","Método de login":"Phương thức đăng nhập","Data de cadastro":"Ngày đăng ký","Último acesso":"Truy cập gần nhất","Editar nome":"Chỉnh sửa tên","Conta":"Tài khoản","Premium (Júnior)":"Premium (Junior)","Digite um nome válido (mínimo 2 caracteres).":"Nhập tên hợp lệ (ít nhất 2 ký tự).","Nome atualizado com sucesso!":"Đã cập nhật tên thành công!","Tema":"Giao diện","Receber novidades":"Nhận cập nhật","Padrão":"Mặc định","Grande":"Lớn","Muito grande":"Rất lớn","Extra grande":"Cực lớn","Máximo":"Tối đa","Mais recentes":"Mới nhất","Mais antigos":"Cũ nhất","Ordem alfabética":"Theo thứ tự chữ cái","Visitas":"Lượt truy cập","Páginas únicas":"Trang duy nhất","Tempo total":"Tổng thời gian","Admin":"Quản trị viên","Usuário":"Người dùng"},
  uk: {"MINHA CONTA":"МІЙ ОБЛІКОВИЙ ЗАПИС","Início":"Головна","Idioma":"Мова","País":"Країна","Método de login":"Спосіб входу","Data de cadastro":"Дата реєстрації","Último acesso":"Останній доступ","Editar nome":"Змінити ім'я","Conta":"Обліковий запис","Premium (Júnior)":"Premium (Junior)","Digite um nome válido (mínimo 2 caracteres).":"Введіть дійсне ім’я (не менше 2 символів).","Nome atualizado com sucesso!":"Ім’я успішно оновлено!","Tema":"Тема","Receber novidades":"Отримувати оновлення","Padrão":"За замовчуванням","Grande":"Великий","Muito grande":"Дуже великий","Extra grande":"Дуже великий","Máximo":"Максимальний","Mais recentes":"Найновіші","Mais antigos":"Найстаріші","Ordem alfabética":"За алфавітом","Visitas":"Відвідування","Páginas únicas":"Унікальні сторінки","Tempo total":"Загальний час","Admin":"Адміністратор","Usuário":"Користувач"},
  ar: {"MINHA CONTA":"حسابي","Início":"الرئيسية","Idioma":"اللغة","País":"البلد","Método de login":"طريقة تسجيل الدخول","Data de cadastro":"تاريخ التسجيل","Último acesso":"آخر دخول","Editar nome":"تعديل الاسم","Conta":"الحساب","Premium (Júnior)":"Premium (Junior)","Digite um nome válido (mínimo 2 caracteres).":"أدخل اسمًا صالحًا (حرفان على الأقل).","Nome atualizado com sucesso!":"تم تحديث الاسم بنجاح!","Tema":"السمة","Receber novidades":"تلقي التحديثات","Padrão":"افتراضي","Grande":"كبير","Muito grande":"كبير جدًا","Extra grande":"كبير للغاية","Máximo":"الحد الأقصى","Mais recentes":"الأحدث","Mais antigos":"الأقدم","Ordem alfabética":"ترتيب أبجدي","Visitas":"الزيارات","Páginas únicas":"الصفحات الفريدة","Tempo total":"الوقت الإجمالي","Admin":"المشرف","Usuário":"المستخدم"}
};

function currentAccountLanguage() {
  try {
    if (window.AccountI18n && window.AccountI18n.getLanguage) {
      var lang = String(window.AccountI18n.getLanguage()).toLowerCase();
      return lang === "pt-br" ? "pt" : lang;
    }
  } catch (e) {}
  var langParam = new URLSearchParams(window.location.search).get("lang");
  return langParam === "pt-br" ? "pt" : (langParam || "pt").toLowerCase();
}

function translateNodeText(node, dictionary) {
  if (!node || !dictionary) return;
  var walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
  var texts = [];
  while (walker.nextNode()) texts.push(walker.currentNode);
  texts.forEach(function (textNode) {
    var source = textNode.nodeValue;
    var trimmed = source.trim();
    if (!trimmed || !dictionary[trimmed]) return;
    textNode.nodeValue = source.replace(trimmed, dictionary[trimmed]);
  });
}

function accountLanguageSync() {
  var isAccountPage = (window.location.pathname || "").indexOf("/conta/") === 0;
  if (!isAccountPage) return;
  var lang = currentAccountLanguage();
  try { if (window.AccountI18n && window.AccountI18n.setLanguage) window.AccountI18n.setLanguage(lang, { preserveUrl:false }); } catch (e) {}
  try { if (window.AccountI18n && window.AccountI18n.translateDom) window.AccountI18n.translateDom(); } catch (e) {}

  var dictionary = ACCOUNT_EXTRA_I18N[lang];
  if (dictionary) translateNodeText(document.body, dictionary);

  if (window.MutationObserver && document.body) {
    if (window.__accountLanguageObserver) window.__accountLanguageObserver.disconnect();
    window.__accountLanguageObserver = new MutationObserver(function (mutations) {
      var dict = ACCOUNT_EXTRA_I18N[currentAccountLanguage()];
      if (!dict) return;
      mutations.forEach(function (mutation) {
        Array.prototype.forEach.call(mutation.addedNodes || [], function (node) {
          if (node.nodeType === 1 || node.nodeType === 3) translateNodeText(node.nodeType === 3 ? node.parentNode : node, dict);
        });
      });
    });
    window.__accountLanguageObserver.observe(document.body, { childList:true, subtree:true });
  }
}

if (window.addEventListener) window.addEventListener("conta:languagechange", accountLanguageSync);
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", accountLanguageSync); else accountLanguageSync();
