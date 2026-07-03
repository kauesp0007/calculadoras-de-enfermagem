/* ======================================================================
   lang-selector.js — Seletor de idiomas com bandeiras (30 idiomas)
   Calculadoras de Enfermagem — Global Platform
   Popula os dropdowns do cabeçalho (#rd-lang-*) e do rodapé (#rd-lang-*-2),
   aplica traduções aos elementos [data-i18n] / [data-i18n-placeholder] e
   persiste a escolha do usuário em localStorage.
   ====================================================================== */

(function () {
  var FLAG_DIR = "images/flags/";

  var LANGUAGES = [
    { code: "pt-BR", native: "Português (Brasil)", short: "PT", flag: "br.webp" },
    { code: "en",    native: "English",             short: "EN", flag: "us.webp" },
    { code: "es",    native: "Español",             short: "ES", flag: "es.webp" },
    { code: "fr",    native: "Français",            short: "FR", flag: "fr.webp" },
    { code: "de",    native: "Deutsch",              short: "DE", flag: "de.webp" },
    { code: "it",    native: "Italiano",             short: "IT", flag: "it.webp" },
    { code: "nl",    native: "Nederlands",           short: "NL", flag: "nl.webp" },
    { code: "pl",    native: "Polski",               short: "PL", flag: "pl.webp" },
    { code: "ru",    native: "Русский",              short: "RU", flag: "ru.webp" },
    { code: "tr",    native: "Türkçe",               short: "TR", flag: "tr.webp" },
    { code: "ar",    native: "العربية",              short: "AR", flag: "sa.webp" },
    { code: "he",    native: "עברית",                short: "HE", flag: "il.webp" },
    { code: "hi",    native: "हिन्दी",                short: "HI", flag: "in.webp" },
    { code: "bn",    native: "বাংলা",                 short: "BN", flag: "bd.webp" },
    { code: "zh-CN", native: "中文（简体）",           short: "ZH", flag: "cn.webp" },
    { code: "zh-TW", native: "中文（繁體）",           short: "ZH", flag: "tw.webp" },
    { code: "ja",    native: "日本語",                short: "JA", flag: "jp.webp" },
    { code: "ko",    native: "한국어",                short: "KO", flag: "kr.webp" },
    { code: "vi",    native: "Tiếng Việt",           short: "VI", flag: "vn.webp" },
    { code: "th",    native: "ไทย",                  short: "TH", flag: "th.webp" },
    { code: "id",    native: "Bahasa Indonesia",     short: "ID", flag: "id.webp" },
    { code: "ms",    native: "Bahasa Melayu",        short: "MS", flag: "my.webp" },
    { code: "tl",    native: "Filipino",             short: "TL", flag: "ph.webp" },
    { code: "sw",    native: "Kiswahili",            short: "SW", flag: "ke.webp" },
    { code: "am",    native: "አማርኛ",                 short: "AM", flag: "et.webp" },
    { code: "el",    native: "Ελληνικά",             short: "EL", flag: "gr.webp" },
    { code: "ro",    native: "Română",               short: "RO", flag: "ro.webp" },
    { code: "hu",    native: "Magyar",               short: "HU", flag: "hu.webp" },
    { code: "cs",    native: "Čeština",              short: "CS", flag: "cz.webp" },
    { code: "sv",    native: "Svenska",              short: "SV", flag: "se.webp" }
  ];

  var TRANSLATIONS = {
    en: {
      "nav.inicio": "Home", "nav.assistencia": "Care", "nav.educacao": "Education",
      "nav.faleconosco": "Contact", "nav.pesquisa": "Search", "nav.idiomas": "Languages", "nav.ferramentas": "Tools",
      "nav.gestao": "Management", "nav.recursos": "Resources", "nav.institucional": "Institutional",
      "nav.entrar": "Log in", "nav.criar": "Create account",
      "aria.busca": "Open search", "aria.idiomas": "Select language", "aria.idiomasDropdown": "Language selector",
      "aria.menu": "Open menu", "aria.navPrincipal": "Main navigation", "aria.buscarInput": "Search the site",
      "aria.mobileMenu": "Mobile menu",
      "busca.titulo": "Search the site", "busca.placeholder": "Type what you're looking for...",
      "busca.btn": "Search", "busca.populares": "Popular searches",
      "idiomas.regiao": "Region", "idiomas.paises": "Countries in this region",
      "mega.subPrincipais": "Main sub-menus", "mega.demaisNav": "More navigation",
      "contact.sobre": "About the platform", "contact.ajuda": "Help Center",
      "mobile.buscarPh": "Search...",
      "content.avaliar": "Rate this content", "content.leitura": "Listen", "content.compartilhar": "Share",
      "content.salvar": "Save", "content.imprimir": "Print",
      "aria.fechar": "Close", "aria.fonteDec": "Decrease font size", "aria.fonteInc": "Increase font size",
      "aria.star5": "5 stars", "aria.star4": "4 stars", "aria.star3": "3 stars", "aria.star2": "2 stars", "aria.star1": "1 star",
      "a11y.tituloModal": "Accessibility preferences",
      "a11y.introModal": "Adjust the site display to your preference. Your choices are saved in this browser.",
      "a11y.fonteTitulo": "Font size", "a11y.fonteDesc": "Increase or decrease the text size across the site.",
      "a11y.contrasteTitulo": "High contrast", "a11y.contrasteDesc": "Increases color contrast for better readability.",
      "a11y.temaTitulo": "Dark mode", "a11y.temaDesc": "Switches the display to a dark background theme.",
      "a11y.dislexiaTitulo": "Dyslexia-friendly font", "a11y.dislexiaDesc": "Replaces the typography with an easier-to-read font.",
      "a11y.redefinir": "Reset all", "a11y.atalhos": "Keyboard shortcuts",
      "a11y.atalhosTitulo": "Keyboard shortcuts",
      "a11y.atalho1": "Navigate between elements", "a11y.atalho2": "Close menus, modals and the mobile menu",
      "a11y.atalho3": "Activate buttons and links", "a11y.atalho4": "Move between menu items",
      "cookie.aviso": "Cookie notice",
      "cookie.bannerText": '<strong>We use cookies.</strong> We use essential cookies and, with your consent, performance and personalization cookies to improve your experience. Learn more in our <a href="#">Privacy Policy</a>.',
      "cookie.personalizar": "Customize", "cookie.rejeitar": "Reject non-essential", "cookie.aceitar": "Accept all",
      "cookie.modalTitulo": "Cookie preferences",
      "cookie.modalIntro": "Choose which categories of cookies you allow. Essential cookies cannot be disabled as they are required for the platform to function.",
      "cookie.essenciaisTitulo": "Essential", "cookie.essenciaisDesc": "Required for login, security and basic platform functionality.",
      "cookie.desempenhoTitulo": "Performance", "cookie.desempenhoDesc": "Help us understand how visitors use the platform so we can continuously improve it.",
      "cookie.funcionalidadeTitulo": "Functionality", "cookie.funcionalidadeDesc": "Remember preferences such as language, region and font size.",
      "cookie.analiseTitulo": "Analytics & Advertising", "cookie.analiseDesc": "Used in aggregate to understand platform usage trends.",
      "cookie.salvar": "Save preferences",
      "herosearch.titulo": "What do you need today?",
      "herosearch.placeholder": "E.g.: Drip rate, Braden Scale, Insulin, NCP...",
      "hero.eyebrow": "Nursing Global Platform",
      "hero.title": 'Technology and knowledge for <span class="accent">more efficient, sustainable nursing.</span>',
      "hero.lead": "The Nursing Calculators Global Platform offers tools, content and digital solutions to transform professional practice and generate a positive impact on health.",
      "hero.btn1": "Explore tools", "hero.btn2": "About the platform",
      "hero.stat1": "Countries connected", "hero.stat2strong": "Millions", "hero.stat2": "Professionals impacted",
      "hero.stat3": "Digital tools", "hero.stat4strong": "Updated", "hero.stat4": "Evidence-based",
      "footer.institucional": "Institutional", "footer.recursos": "Resources", "footer.suporte": "Support", "footer.newsletter": "Newsletter",
      "footer.newsletter-desc": "Get exclusive content on nursing, management and health.",
      "footer.email-ph": "Your email", "footer.inscrever": "Subscribe",
      "footer.brand-desc": "Technology and knowledge for more efficient, sustainable nursing.",
      "footer.rights": "All rights reserved."
    },
    es: {
      "nav.inicio": "Inicio", "nav.assistencia": "Asistencia", "nav.educacao": "Educación",
      "nav.faleconosco": "Contacto", "nav.pesquisa": "Buscar", "nav.idiomas": "Idiomas", "nav.ferramentas": "Herramientas",
      "nav.gestao": "Gestión", "nav.recursos": "Recursos", "nav.institucional": "Institucional",
      "nav.entrar": "Iniciar sesión", "nav.criar": "Crear cuenta",
      "aria.busca": "Abrir búsqueda", "aria.idiomas": "Seleccionar idioma", "aria.idiomasDropdown": "Selector de idiomas",
      "aria.menu": "Abrir menú", "aria.navPrincipal": "Navegación principal", "aria.buscarInput": "Buscar en el sitio",
      "aria.mobileMenu": "Menú móvil",
      "busca.titulo": "Buscar en el sitio", "busca.placeholder": "Escribe lo que buscas...",
      "busca.btn": "Buscar", "busca.populares": "Búsquedas populares",
      "idiomas.regiao": "Región", "idiomas.paises": "Países de la región",
      "mega.subPrincipais": "Submenús principales", "mega.demaisNav": "Más navegación",
      "contact.sobre": "Sobre la plataforma", "contact.ajuda": "Centro de ayuda",
      "mobile.buscarPh": "Buscar...",
      "content.avaliar": "Evalúa este contenido", "content.leitura": "Leer", "content.compartilhar": "Compartir",
      "content.salvar": "Guardar", "content.imprimir": "Imprimir",
      "aria.fechar": "Cerrar", "aria.fonteDec": "Disminuir tamaño de fuente", "aria.fonteInc": "Aumentar tamaño de fuente",
      "aria.star5": "5 estrellas", "aria.star4": "4 estrellas", "aria.star3": "3 estrellas", "aria.star2": "2 estrellas", "aria.star1": "1 estrella",
      "a11y.tituloModal": "Preferencias de accesibilidad",
      "a11y.introModal": "Ajusta la visualización del sitio según tu preferencia. Tus elecciones se guardan en este navegador.",
      "a11y.fonteTitulo": "Tamaño de fuente", "a11y.fonteDesc": "Aumenta o disminuye el tamaño del texto en todo el sitio.",
      "a11y.contrasteTitulo": "Alto contraste", "a11y.contrasteDesc": "Aumenta el contraste de colores para mejorar la legibilidad.",
      "a11y.temaTitulo": "Modo oscuro", "a11y.temaDesc": "Cambia la visualización a un tema con fondo oscuro.",
      "a11y.dislexiaTitulo": "Fuente para dislexia", "a11y.dislexiaDesc": "Reemplaza la tipografía por una fuente de lectura facilitada.",
      "a11y.redefinir": "Restablecer todo", "a11y.atalhos": "Atajos de teclado",
      "a11y.atalhosTitulo": "Atajos de teclado",
      "a11y.atalho1": "Navegar entre elementos", "a11y.atalho2": "Cerrar menús, modales y el menú móvil",
      "a11y.atalho3": "Activar botones y enlaces", "a11y.atalho4": "Moverse entre los elementos del menú",
      "cookie.aviso": "Aviso de cookies",
      "cookie.bannerText": '<strong>Utilizamos cookies.</strong> Utilizamos cookies esenciales y, con tu consentimiento, cookies de rendimiento y personalización para mejorar tu experiencia. Más información en nuestra <a href="#">Política de Privacidad</a>.',
      "cookie.personalizar": "Personalizar", "cookie.rejeitar": "Rechazar no esenciales", "cookie.aceitar": "Aceptar todo",
      "cookie.modalTitulo": "Preferencias de cookies",
      "cookie.modalIntro": "Elige qué categorías de cookies permites. Las cookies esenciales no se pueden desactivar porque son necesarias para el funcionamiento de la plataforma.",
      "cookie.essenciaisTitulo": "Esenciales", "cookie.essenciaisDesc": "Necesarias para el inicio de sesión, la seguridad y el funcionamiento básico de la plataforma.",
      "cookie.desempenhoTitulo": "Rendimiento", "cookie.desempenhoDesc": "Ayudan a entender cómo los visitantes usan la plataforma para mejorarla continuamente.",
      "cookie.funcionalidadeTitulo": "Funcionalidad", "cookie.funcionalidadeDesc": "Recuerdan preferencias como idioma, región y tamaño de fuente.",
      "cookie.analiseTitulo": "Análisis y Publicidad", "cookie.analiseDesc": "Utilizados de forma agregada para entender las tendencias de uso de la plataforma.",
      "cookie.salvar": "Guardar preferencias",
      "herosearch.titulo": "¿Qué necesitas hoy?",
      "herosearch.placeholder": "Ej.: Goteo, Escala de Braden, Insulina, PAE...",
      "hero.eyebrow": "Nursing Global Platform",
      "hero.title": 'Tecnología y conocimiento para una enfermería <span class="accent">más eficiente y sostenible.</span>',
      "hero.lead": "La Plataforma Global de Calculadoras de Enfermería ofrece herramientas, contenidos y soluciones digitales para transformar la práctica profesional y generar un impacto positivo en la salud.",
      "hero.btn1": "Explorar herramientas", "hero.btn2": "Conocer la plataforma",
      "hero.stat1": "Países conectados", "hero.stat2strong": "Millones", "hero.stat2": "Profesionales impactados",
      "hero.stat3": "Herramientas digitales", "hero.stat4strong": "Actualizado", "hero.stat4": "Basado en evidencia",
      "footer.institucional": "Institucional", "footer.recursos": "Recursos", "footer.suporte": "Soporte", "footer.newsletter": "Boletín",
      "footer.newsletter-desc": "Recibe contenido exclusivo sobre enfermería, gestión y salud.",
      "footer.email-ph": "Tu correo", "footer.inscrever": "Suscribirse",
      "footer.brand-desc": "Tecnología y conocimiento para una enfermería más eficiente y sostenible.",
      "footer.rights": "Todos los derechos reservados."
    }
  };

  var SUPPORTED = Object.keys(TRANSLATIONS).concat(["pt-BR"]);

  // Regiões para o mega-menu de Idiomas (coluna 1 = região, coluna 2 = países da região)
  var REGIONS = [
    { id: "americas", name: "Américas", codes: ["pt-BR", "en", "es"] },
    { id: "europa", name: "Europa", codes: ["fr", "de", "it", "nl", "pl", "ru", "el", "ro", "hu", "cs", "sv"] },
    { id: "asia", name: "Ásia-Pacífico", codes: ["hi", "bn", "zh-CN", "zh-TW", "ja", "ko", "vi", "th", "id", "ms", "tl"] },
    { id: "mea", name: "Oriente Médio & África", codes: ["tr", "ar", "he", "sw", "am"] }
  ];

  // Países por região (coluna 2 do mega-menu Idiomas) — bandeira e nome do país
  // específicos, mesmo quando reaproveitam o idioma/dicionário de outro código.
  // Estrutura pronta para expansão gradual rumo aos 195 países (fase de i18n).
  var COUNTRIES = {
    americas: [
      { country: "Brasil", code: "pt-BR", flag: "br.webp" },
      { country: "Estados Unidos", code: "en", flag: "us.webp" },
      { country: "Canadá", code: "en", flag: "ca.webp" },
      { country: "México", code: "es", flag: "mx.webp" },
      { country: "Argentina", code: "es", flag: "ar.webp" },
      { country: "Colômbia", code: "es", flag: "co.webp" },
      { country: "Chile", code: "es", flag: "cl.webp" },
      { country: "Peru", code: "es", flag: "pe.webp" },
      { country: "Equador", code: "es", flag: "ec.webp" },
      { country: "Venezuela", code: "es", flag: "ve.webp" },
      { country: "Uruguai", code: "es", flag: "uy.webp" },
      { country: "Paraguai", code: "es", flag: "py.webp" },
      { country: "Bolívia", code: "es", flag: "bo.webp" },
      { country: "Costa Rica", code: "es", flag: "cr.webp" },
      { country: "Panamá", code: "es", flag: "pa.webp" },
      { country: "Guatemala", code: "es", flag: "gt.webp" },
      { country: "Cuba", code: "es", flag: "cu.webp" },
      { country: "Rep. Dominicana", code: "es", flag: "do.webp" }
    ],
    europa: [
      { country: "Portugal", code: "pt", flag: "pt.webp" },
      { country: "Espanha", code: "es", flag: "es.webp" },
      { country: "França", code: "fr", flag: "fr.webp" },
      { country: "Bélgica", code: "fr", flag: "be.webp" },
      { country: "Alemanha", code: "de", flag: "de.webp" },
      { country: "Áustria", code: "de", flag: "at.webp" },
      { country: "Suíça", code: "de", flag: "ch.webp" },
      { country: "Itália", code: "it", flag: "it.webp" },
      { country: "Países Baixos", code: "nl", flag: "nl.webp" },
      { country: "Polônia", code: "pl", flag: "pl.webp" },
      { country: "Rússia", code: "ru", flag: "ru.webp" },
      { country: "Grécia", code: "el", flag: "gr.webp" },
      { country: "Romênia", code: "ro", flag: "ro.webp" },
      { country: "Hungria", code: "hu", flag: "hu.webp" },
      { country: "Rep. Tcheca", code: "cs", flag: "cz.webp" },
      { country: "Suécia", code: "sv", flag: "se.webp" },
      { country: "Noruega", code: "no", flag: "no.webp" },
      { country: "Dinamarca", code: "da", flag: "dk.webp" },
      { country: "Finlândia", code: "fi", flag: "fi.webp" },
      { country: "Irlanda", code: "en", flag: "ie.webp" },
      { country: "Reino Unido", code: "en", flag: "uk.webp" },
      { country: "Ucrânia", code: "uk-UA", flag: "ua.webp" },
      { country: "Bulgária", code: "bg", flag: "bg.webp" },
      { country: "Croácia", code: "hr", flag: "hr.webp" }
    ],
    asia: [
      { country: "Índia", code: "hi", flag: "in.webp" },
      { country: "Bangladesh", code: "bn", flag: "bd.webp" },
      { country: "China", code: "zh-CN", flag: "cn.webp" },
      { country: "Taiwan", code: "zh-TW", flag: "tw.webp" },
      { country: "Japão", code: "ja", flag: "jp.webp" },
      { country: "Coreia do Sul", code: "ko", flag: "kr.webp" },
      { country: "Vietnã", code: "vi", flag: "vn.webp" },
      { country: "Tailândia", code: "th", flag: "th.webp" },
      { country: "Indonésia", code: "id", flag: "id.webp" },
      { country: "Malásia", code: "ms", flag: "my.webp" },
      { country: "Filipinas", code: "tl", flag: "ph.webp" },
      { country: "Cingapura", code: "en", flag: "sg.webp" },
      { country: "Austrália", code: "en", flag: "au.webp" },
      { country: "Nova Zelândia", code: "en", flag: "nz.webp" },
      { country: "Paquistão", code: "ur", flag: "pk.webp" },
      { country: "Sri Lanka", code: "si", flag: "lk.webp" },
      { country: "Camboja", code: "km", flag: "kh.webp" },
      { country: "Mianmar", code: "my-MM", flag: "mm.webp" }
    ],
    mea: [
      { country: "Turquia", code: "tr", flag: "tr.webp" },
      { country: "Arábia Saudita", code: "ar", flag: "sa.webp" },
      { country: "Emirados Árabes", code: "ar", flag: "ae.webp" },
      { country: "Egito", code: "ar", flag: "eg.webp" },
      { country: "Israel", code: "he", flag: "il.webp" },
      { country: "Irã", code: "fa", flag: "ir.webp" },
      { country: "Quênia", code: "sw", flag: "ke.webp" },
      { country: "Nigéria", code: "en", flag: "ng.webp" },
      { country: "África do Sul", code: "en", flag: "za.webp" },
      { country: "Etiópia", code: "am", flag: "et.webp" },
      { country: "Marrocos", code: "ar", flag: "ma.webp" },
      { country: "Gana", code: "en", flag: "gh.webp" }
    ]
  };

  // Nomes de regiões e países traduzidos (o widget é gerado via JS, então os
  // nomes não passam pelo mecanismo padrão de [data-i18n] — precisam deste
  // dicionário próprio, aplicado em refreshLangPanelLabels()).
  var REGION_NAMES = {
    en: { americas: "Americas", europa: "Europe", asia: "Asia-Pacific", mea: "Middle East & Africa" },
    es: { americas: "Américas", europa: "Europa", asia: "Asia-Pacífico", mea: "Oriente Medio y África" }
  };

  var COUNTRY_NAMES = {
    en: {
      br: "Brazil", us: "United States", ca: "Canada", mx: "Mexico", ar: "Argentina", co: "Colombia",
      cl: "Chile", pe: "Peru", ec: "Ecuador", ve: "Venezuela", uy: "Uruguay", py: "Paraguay",
      bo: "Bolivia", cr: "Costa Rica", pa: "Panama", gt: "Guatemala", cu: "Cuba", do: "Dominican Republic",
      pt: "Portugal", es: "Spain", fr: "France", be: "Belgium", de: "Germany", at: "Austria",
      ch: "Switzerland", it: "Italy", nl: "Netherlands", pl: "Poland", ru: "Russia", gr: "Greece",
      ro: "Romania", hu: "Hungary", cz: "Czech Republic", se: "Sweden", no: "Norway", dk: "Denmark",
      fi: "Finland", ie: "Ireland", uk: "United Kingdom", ua: "Ukraine", bg: "Bulgaria", hr: "Croatia",
      in: "India", bd: "Bangladesh", cn: "China", tw: "Taiwan", jp: "Japan", kr: "South Korea",
      vn: "Vietnam", th: "Thailand", id: "Indonesia", my: "Malaysia", ph: "Philippines", sg: "Singapore",
      au: "Australia", nz: "New Zealand", pk: "Pakistan", lk: "Sri Lanka", kh: "Cambodia", mm: "Myanmar",
      tr: "Turkey", sa: "Saudi Arabia", ae: "United Arab Emirates", eg: "Egypt", il: "Israel", ir: "Iran",
      ke: "Kenya", ng: "Nigeria", za: "South Africa", et: "Ethiopia", ma: "Morocco", gh: "Ghana"
    },
    es: {
      br: "Brasil", us: "Estados Unidos", ca: "Canadá", mx: "México", ar: "Argentina", co: "Colombia",
      cl: "Chile", pe: "Perú", ec: "Ecuador", ve: "Venezuela", uy: "Uruguay", py: "Paraguay",
      bo: "Bolivia", cr: "Costa Rica", pa: "Panamá", gt: "Guatemala", cu: "Cuba", do: "República Dominicana",
      pt: "Portugal", es: "España", fr: "Francia", be: "Bélgica", de: "Alemania", at: "Austria",
      ch: "Suiza", it: "Italia", nl: "Países Bajos", pl: "Polonia", ru: "Rusia", gr: "Grecia",
      ro: "Rumanía", hu: "Hungría", cz: "República Checa", se: "Suecia", no: "Noruega", dk: "Dinamarca",
      fi: "Finlandia", ie: "Irlanda", uk: "Reino Unido", ua: "Ucrania", bg: "Bulgaria", hr: "Croacia",
      in: "India", bd: "Bangladés", cn: "China", tw: "Taiwán", jp: "Japón", kr: "Corea del Sur",
      vn: "Vietnam", th: "Tailandia", id: "Indonesia", my: "Malasia", ph: "Filipinas", sg: "Singapur",
      au: "Australia", nz: "Nueva Zelanda", pk: "Pakistán", lk: "Sri Lanka", kh: "Camboya", mm: "Myanmar",
      tr: "Turquía", sa: "Arabia Saudita", ae: "Emiratos Árabes Unidos", eg: "Egipto", il: "Israel", ir: "Irán",
      ke: "Kenia", ng: "Nigeria", za: "Sudáfrica", et: "Etiopía", ma: "Marruecos", gh: "Ghana"
    }
  };

  var LANG_NOTE = {
    "pt-BR": "Tradução ativa para pt-BR, en e es. Estrutura pronta para dezenas de países — novos idiomas e páginas locais são adicionados progressivamente.",
    en: "Active translation for pt-BR, en and es. Structure ready for dozens of countries — new languages and local pages are added progressively.",
    es: "Traducción activa para pt-BR, en y es. Estructura lista para decenas de países — nuevos idiomas y páginas locales se agregan progresivamente."
  };

  // Reaplica os nomes de região/país e a nota do painel de Idiomas no idioma
  // atual (o conteúdo é gerado via JS, fora do mecanismo padrão [data-i18n]).
  function refreshLangPanelLabels() {
    var lang = currentLang();
    var regionListEl = document.getElementById("gh-region-list");
    var gridEl = document.getElementById("gh-lang-grid");

    if (regionListEl) {
      regionListEl.querySelectorAll("button[data-region]").forEach(function (btn) {
        var rid = btn.getAttribute("data-region");
        var region = REGIONS.filter(function (r) { return r.id === rid; })[0];
        var fallback = region ? region.name : btn.textContent;
        btn.textContent = (REGION_NAMES[lang] && REGION_NAMES[lang][rid]) || fallback;
      });
    }
    if (gridEl) {
      gridEl.querySelectorAll("button[data-flag]").forEach(function (btn) {
        var id = (btn.getAttribute("data-flag") || "").replace(".webp", "");
        var span = btn.querySelector("span");
        if (!span) return;
        var fallback = btn.getAttribute("data-country") || span.textContent;
        span.textContent = (COUNTRY_NAMES[lang] && COUNTRY_NAMES[lang][id]) || fallback;
      });
    }
    var note = document.getElementById("gh-lang-note");
    if (note) note.textContent = LANG_NOTE[lang] || LANG_NOTE["pt-BR"];
  }

  function currentLang() {
    return localStorage.getItem("site-lang") || "pt-BR";
  }

  function applyLanguage(code, displayName, flagFile) {
    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      if (!el.dataset.i18nOriginal) el.dataset.i18nOriginal = el.innerHTML;
      var key = el.getAttribute("data-i18n");
      var dict = TRANSLATIONS[code];
      el.innerHTML = (code === "pt-BR" || !dict || !dict[key]) ? el.dataset.i18nOriginal : dict[key];
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach(function (el) {
      if (!el.dataset.i18nPhOriginal) el.dataset.i18nPhOriginal = el.getAttribute("placeholder") || "";
      var key = el.getAttribute("data-i18n-placeholder");
      var dict = TRANSLATIONS[code];
      el.setAttribute("placeholder", (code === "pt-BR" || !dict || !dict[key]) ? el.dataset.i18nPhOriginal : dict[key]);
    });
    document.querySelectorAll("[data-i18n-aria]").forEach(function (el) {
      if (!el.dataset.i18nAriaOriginal) el.dataset.i18nAriaOriginal = el.getAttribute("aria-label") || "";
      var key = el.getAttribute("data-i18n-aria");
      var dict = TRANSLATIONS[code];
      el.setAttribute("aria-label", (code === "pt-BR" || !dict || !dict[key]) ? el.dataset.i18nAriaOriginal : dict[key]);
    });
    localStorage.setItem("site-lang", code);
    document.documentElement.lang = code;
    refreshLangPanelLabels();

    var lang = LANGUAGES.find(function (l) { return l.code === code; }) || LANGUAGES[0];
    var name = displayName || lang.native;
    var flagSrc = FLAG_DIR + (flagFile || lang.flag);

    if (displayName || flagFile) {
      localStorage.setItem("site-lang-display", JSON.stringify({ name: name, flag: flagFile || lang.flag }));
    } else {
      localStorage.removeItem("site-lang-display");
    }

    var flag2 = document.getElementById("rd-lang-flag-2");
    var name2 = document.getElementById("rd-lang-name-2");
    if (flag2) flag2.src = flagSrc;
    if (name2) name2.textContent = name;

    document.querySelectorAll(".rd-lang-menu button").forEach(function (btn) {
      btn.classList.toggle("active", btn.getAttribute("data-code") === code);
    });
    document.querySelectorAll(".gh-lang-grid button, .gh-mobile-sub button").forEach(function (btn) {
      btn.classList.toggle("active-lang", btn.getAttribute("data-code") === code);
    });
  }

  function buildMenu(menuEl) {
    if (!menuEl) return;
    menuEl.innerHTML = LANGUAGES.map(function (l) {
      var soon = SUPPORTED.indexOf(l.code) === -1 ? '<span class="rd-lang-soon">em breve</span>' : "";
      return (
        '<button type="button" data-code="' + l.code + '" class="' + (currentLang() === l.code ? "active" : "") + '">' +
        '<img class="rd-lang-flag" src="' + FLAG_DIR + l.flag + '" alt="" />' +
        "<span>" + l.native + "</span>" + soon +
        "</button>"
      );
    }).join("") +
      '<div class="rd-lang-note">Tradução ativa para pt-BR, en e es. Estrutura pronta para os 30 idiomas — novos dicionários podem ser adicionados a qualquer momento.</div>';

    menuEl.querySelectorAll("button").forEach(function (btn) {
      btn.addEventListener("click", function () {
        applyLanguage(btn.getAttribute("data-code"));
        menuEl.classList.remove("open");
      });
    });
  }

  // Grid compacto (3 colunas) usado dentro dos mega-menus — mesmo padrão
  // visual dos demais mega-menus do cabeçalho.
  function buildGridMenu(gridEl, closeOnPick) {
    if (!gridEl) return;
    gridEl.innerHTML = LANGUAGES.map(function (l) {
      return (
        '<button type="button" data-code="' + l.code + '" class="' + (currentLang() === l.code ? "active-lang" : "") + '">' +
        '<img class="rd-lang-flag" src="' + FLAG_DIR + l.flag + '" alt="" />' +
        "<span>" + l.native + "</span>" +
        "</button>"
      );
    }).join("");
    gridEl.querySelectorAll("button").forEach(function (btn) {
      btn.addEventListener("click", function () {
        applyLanguage(btn.getAttribute("data-code"));
        if (closeOnPick) {
          var mobileMenu = document.getElementById("gh-mobile-menu");
          var hamburger = document.getElementById("gh-hamburger-btn");
          if (mobileMenu) mobileMenu.classList.remove("open");
          if (hamburger) {
            hamburger.setAttribute("aria-expanded", "false");
            hamburger.innerHTML = '<i class="fa-solid fa-bars" aria-hidden="true"></i>';
          }
        }
      });
    });
  }

  // Mega-menu Idiomas: coluna 1 = regiões, coluna 2 = países da região ativa
  // (cada país tem bandeira e nome próprios, mesmo reaproveitando o dicionário
  // de outro idioma quando a tradução dedicada ainda não existe).
  function buildRegionMenu(regionListEl, gridEl) {
    if (!regionListEl || !gridEl) return;

    function findRegionOf(code) {
      for (var i = 0; i < REGIONS.length; i++) {
        if (REGIONS[i].codes.indexOf(code) !== -1) return REGIONS[i].id;
      }
      return REGIONS[0].id;
    }

    function renderCountries(regionId) {
      var list = COUNTRIES[regionId] || [];
      var saved = null;
      try { saved = JSON.parse(localStorage.getItem("site-lang-display") || "null"); } catch (e) {}

      gridEl.innerHTML = list.map(function (c) {
        var isActive = currentLang() === c.code && saved && saved.name === c.country;
        return (
          '<button type="button" data-code="' + c.code + '" data-country="' + c.country + '" data-flag="' + c.flag + '" class="' + (isActive ? "active-lang" : "") + '">' +
          '<img class="rd-lang-flag" src="' + FLAG_DIR + c.flag + '" alt="" />' +
          "<span>" + c.country + "</span>" +
          "</button>"
        );
      }).join("");
      gridEl.querySelectorAll("button").forEach(function (btn) {
        btn.addEventListener("click", function () {
          applyLanguage(btn.getAttribute("data-code"), btn.getAttribute("data-country"), btn.getAttribute("data-flag"));
          renderCountries(regionId);
        });
      });
    }

    regionListEl.innerHTML = REGIONS.map(function (r) {
      return '<button type="button" data-region="' + r.id + '">' + r.name + "</button>";
    }).join("");

    var activeRegion = findRegionOf(currentLang());
    regionListEl.querySelectorAll("button").forEach(function (btn) {
      btn.classList.toggle("active", btn.getAttribute("data-region") === activeRegion);
      btn.addEventListener("click", function () {
        regionListEl.querySelectorAll("button").forEach(function (b) { b.classList.remove("active"); });
        btn.classList.add("active");
        renderCountries(btn.getAttribute("data-region"));
      });
    });

    renderCountries(activeRegion);
  }

  function wireToggle(toggleId, menuId, otherMenuId) {
    var toggle = document.getElementById(toggleId);
    var menu = document.getElementById(menuId);
    var other = document.getElementById(otherMenuId);
    if (!toggle || !menu) return;
    toggle.addEventListener("click", function (e) {
      e.stopPropagation();
      menu.classList.toggle("open");
      toggle.setAttribute("aria-expanded", menu.classList.contains("open"));
      if (other) other.classList.remove("open");
    });
  }

  function init() {
    // Seletor de idiomas centralizado no cabeçalho (mega-menu Idiomas) — o
    // rodapé não possui mais seletor próprio.

    // Cabeçalho: mega-menu "Idiomas" — coluna 1 região, coluna 2 países da região (abre no hover via CSS)
    buildRegionMenu(document.getElementById("gh-region-list"), document.getElementById("gh-lang-grid"));
    buildGridMenu(document.getElementById("gh-lang-grid-mobile"), true);
    var note = document.getElementById("gh-lang-note");
    if (note) note.textContent = "Tradução ativa para pt-BR, en e es. Estrutura pronta para dezenas de países — novos idiomas e páginas locais são adicionados progressivamente.";

    var savedDisplay = null;
    try { savedDisplay = JSON.parse(localStorage.getItem("site-lang-display") || "null"); } catch (e) {}
    if (savedDisplay) {
      applyLanguage(currentLang(), savedDisplay.name, savedDisplay.flag);
    } else {
      applyLanguage(currentLang());
    }

    var yearEl = document.getElementById("rd-footer-year");
    if (yearEl) yearEl.textContent = new Date().getFullYear();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
