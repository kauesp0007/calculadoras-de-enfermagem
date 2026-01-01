const fs = require('fs');
const path = require('path');

/* ========================================================================
   CONFIGURAÇÕES
   ======================================================================== */

// 1. Pastas onde o script vai procurar arquivos .html
// O ponto '.' representa a raiz (onde estão os arquivos PT)
const targetDirs = [
    '.',
    'en', 'es', 'de', 'it', 'fr', 'hi', 'zh', 'ar', 'ja',
    'ru', 'ko', 'tr', 'nl', 'pl', 'sv', 'id', 'vi', 'uk'
];

// 2. Arquivos HTML específicos que JAMAIS devem ser tocados
const ignoredFiles = [
    '_language_selector.html',
    'footer.html',
    'menu-global.html',
    'global-body-elements.html',
    'downloads.html'
];

// 3. Pastas que devem ser ignoradas (segurança adicional)
const ignoredDirs = ['downloads', 'biblioteca', 'node_modules', '.git'];

/* ========================================================================
   O NOVO SCRIPT (VERSÃO OPT-OUT)
   ======================================================================== */
const newScriptContent = `
<script>
/* =========================================================
   MODO ADMIN + GOOGLE TAG + CONSENT + ADSENSE
   (VERSÃO OPT-OUT: Carrega anúncios por padrão)
   ========================================================= */

// 🛡️ MODO ADMIN — bloqueia tudo
if (localStorage.getItem('admin_mode') === 'true') {
  console.log('🚧 Modo Admin: Analytics e AdSense NÃO foram carregados.');
} else {

  // 0) VERIFICAÇÃO INICIAL (Novo)
  var savedConsent = localStorage.getItem("cookieConsent");
  var isRefused = (savedConsent === "refused");

  // Proteções globais
  window.__metricsLoaded = window.__metricsLoaded || false;
  window.__adsenseLoaded = window.__adsenseLoaded || false;

  /* -----------------------------------------------------
     1) GOOGLE TAG (gtag.js)
     ----------------------------------------------------- */
  if (!window.__metricsLoaded) {
    window.__metricsLoaded = true;

    var scriptGA = document.createElement('script');
    scriptGA.async = true;
    scriptGA.src = "https://www.googletagmanager.com/gtag/js?id=AW-952633102";
    document.head.appendChild(scriptGA);

    window.dataLayer = window.dataLayer || [];
    function gtag(){ dataLayer.push(arguments); }
    window.gtag = window.gtag || gtag;

    gtag("js", new Date());

    // ⚡ MUDANÇA: Lógica de Consentimento Padrão (Opt-out)
    if (isRefused) {
      gtag("consent", "default", {
        analytics_storage: "denied",
        ad_storage: "denied",
        wait_for_update: 500
      });
    } else {
      gtag("consent", "default", {
        analytics_storage: "granted",
        ad_storage: "granted",
        wait_for_update: 500
      });
    }

    gtag("config", "AW-952633102"); // Google Ads
    gtag("config", "G-8FLJ59XXDK"); // GA4
  }

  /* -----------------------------------------------------
     2) FUNÇÃO INTERNA: carrega AdSense uma única vez
     ----------------------------------------------------- */
  function loadAdSenseOnce() {
    if (window.__adsenseLoaded) return;
    window.__adsenseLoaded = true;

    var scriptAd = document.createElement('script');
    scriptAd.async = true;
    scriptAd.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6472730056006847";
    scriptAd.crossOrigin = "anonymous";
    document.head.appendChild(scriptAd);

    console.log("🟢 AdSense carregado (Modo Opt-out).");
  }

  // ⚡ MUDANÇA: Se não estiver recusado, carrega ANÚNCIOS IMEDIATAMENTE
  if (!isRefused) {
      loadAdSenseOnce();
  }

  /* -----------------------------------------------------
     3) FUNÇÃO CENTRAL DE CONSENTIMENTO
     ----------------------------------------------------- */
  function applyConsent(consent) {
    if (typeof window.gtag === "function") {
      gtag("consent", "update", consent);
    }
    if (consent && consent.ad_storage === "granted") {
      loadAdSenseOnce();
    }
    try {
      localStorage.setItem("analytics_storage", consent.analytics_storage);
      localStorage.setItem("ad_storage", consent.ad_storage);
    } catch (e) {}
  }

  /* -----------------------------------------------------
     4) REAPLICA CONSENTIMENTO AO ENTRAR NA PÁGINA
     ----------------------------------------------------- */
  (function restoreConsent() {
    try {
      const saved = localStorage.getItem("cookieConsent");
      if (saved === "accepted") {
        applyConsent({ analytics_storage: "granted", ad_storage: "granted" });
      }
      if (saved === "refused") {
        applyConsent({ analytics_storage: "denied", ad_storage: "denied" });
      }
      if (saved === "managed") {
        applyConsent({
          analytics_storage: localStorage.getItem("analytics_storage") || "denied",
          ad_storage: localStorage.getItem("ad_storage") || "denied"
        });
      }
    } catch (e) {}
  })();

  /* -----------------------------------------------------
     5) API GLOBAL PARA O BANNER DE COOKIES
     ----------------------------------------------------- */
  window.acceptAllCookies = function () {
    localStorage.setItem("cookieConsent", "accepted");
    applyConsent({ analytics_storage: "granted", ad_storage: "granted" });
  };

  window.rejectAllCookies = function () {
    localStorage.setItem("cookieConsent", "refused");
    applyConsent({ analytics_storage: "denied", ad_storage: "denied" });
    // Remove visualmente
    var ads = document.querySelectorAll('ins.adsbygoogle, .google-auto-placed');
    ads.forEach(function(ad) { ad.style.display = 'none'; ad.innerHTML = ''; });
    console.log("🔴 Consentimento revogado e anúncios ocultados.");
  };

  window.applyGranularCookies = function (analyticsGranted, adsGranted) {
    localStorage.setItem("cookieConsent", "managed");
    applyConsent({
      analytics_storage: analyticsGranted ? "granted" : "denied",
      ad_storage: adsGranted ? "granted" : "denied"
    });
    if (!adsGranted) {
        var ads = document.querySelectorAll('ins.adsbygoogle, .google-auto-placed');
        ads.forEach(function(ad) { ad.style.display = 'none'; ad.innerHTML = ''; });
    }
  };
}
</script>
`;

/* ========================================================================
   LÓGICA DE SUBSTITUIÇÃO
   ======================================================================== */

// Essa REGEX procura:
// 1. Opcionalmente: (e espaços)
// 2. <script> ... qualquer coisa ... MODO ADMIN ... qualquer coisa ... </script>
const regexOldScript = /(?:\s*)?<script>[\s\S]*?MODO ADMIN[\s\S]*?<\/script>/gi;

function processDirectory(dirPath) {
    if (!fs.existsSync(dirPath)) return;

    const items = fs.readdirSync(dirPath);

    items.forEach(item => {
        const fullPath = path.join(dirPath, item);
        const stat = fs.statSync(fullPath);

        // Se for pasta, sai (o script principal já itera pelas pastas targetDirs)
        if (stat.isDirectory()) return;

        if (stat.isFile()) {
            if (path.extname(item) !== '.html') return;

            if (ignoredFiles.includes(item)) {
                console.log(`🚫 Ignorado (Proibido): ${fullPath}`);
                return;
            }

            replaceInFile(fullPath);
        }
    });
}

function replaceInFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');

    if (regexOldScript.test(content)) {
        const newContent = content.replace(regexOldScript, newScriptContent.trim());
        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log(`✅ Atualizado: ${filePath}`);
    } else {
        // Se não achou, pode ser que o arquivo já tenha sido atualizado ou não tenha o script antigo
        // console.log(`ℹ️ Nada a atualizar em: ${filePath}`);
    }
}

/* ========================================================================
   EXECUÇÃO
   ======================================================================== */
console.log('🚀 Iniciando atualização dos scripts...');

targetDirs.forEach(dir => {
    // Se dir for '.', usa o rootDir
    const fullDirPath = dir === '.' ? __dirname : path.join(__dirname, dir);

    if (ignoredDirs.includes(dir)) {
        console.log(`🛑 Pulando pasta proibida: ${dir}`);
        return;
    }

    processDirectory(fullDirPath);
});

console.log('🏁 Processo finalizado!');