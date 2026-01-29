const fs = require('fs');
const path = require('path');

// =========================================================
// CONFIGURAÇÕES
// =========================================================

const targetFolders = [
    '.', // Raiz
    'en', 'es', 'de', 'it', 'fr', 'hi', 'zh', 'ar', 'ja',
    'ru', 'ko', 'tr', 'nl', 'pl', 'sv', 'id', 'vi', 'uk'
];

const excludedFolders = ['downloads', 'biblioteca', 'node_modules', '.git', '.vscode'];

const excludedFiles = [
    'footer.html',
    'menu-global.html',
    'global-body-elements.html',
    'downloads.html',
    'menu-lateral.html',
    '_language_selector.html',
    'googlefc0a17cdd552164b.html'
];

const allowedExtension = '.html';

// =========================================================
// CONTEÚDO NOVO (Agora com o fechamento </script> CORRETO)
// =========================================================
const newBlockContent = `/* =========================================================
     MODO ADMIN + GOOGLE TAG + CONSENT + ADSENSE (LAZY LOAD)
     (VERSÃO ATUALIZADA: G-MJDKPDPJ26 + ADS + ADSENSE)
     ========================================================= */

  if (
    localStorage.getItem('admin_mode') === 'true' ||
    new URLSearchParams(window.location.search).get('admin') === '1'
  ) {
    console.log('🚧 Modo Admin: Bloqueado.');
    if (new URLSearchParams(window.location.search).get('admin') === '1') {
      localStorage.setItem('admin_mode','true');
    }
  } else {
    var savedConsent = localStorage.getItem("cookieConsent");
    var isRefused = (savedConsent === "refused");
    var isManaged = (savedConsent === "managed");
    var adsBlocked = isRefused || (isManaged && localStorage.getItem("ad_storage") === "denied");

    window.__metricsLoaded = false;
    window.__adsenseLoaded = false;
    window.dataLayer = window.dataLayer || [];
    function gtag(){ dataLayer.push(arguments); }
    window.gtag = gtag;

    function loadAnalytics() {
      if (window.__metricsLoaded) return;
      window.__metricsLoaded = true;

      var aState = isRefused ? "denied" : (localStorage.getItem("analytics_storage") || "granted");
      var adState = adsBlocked ? "denied" : "granted";

      gtag("consent","default",{
        analytics_storage: aState,
        ad_storage: adState,
        ad_user_data: adState,
        ad_personalization: adState,
        wait_for_update: 500
      });

      var s = document.createElement("script");
      s.async = true;
      s.src = "https://www.googletagmanager.com/gtag/js?id=G-MJDKPDPJ26";
      document.head.appendChild(s);

      gtag("js", new Date());

      gtag("config","G-MJDKPDPJ26");
      gtag("config","AW-9277197961");
    }

    function loadAdSenseOnce() {
      if (window.__adsenseLoaded || adsBlocked) return;
      window.__adsenseLoaded = true;
      var ad = document.createElement("script");
      ad.async = true;
      ad.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6472730056006847";
      ad.crossOrigin = "anonymous";
      document.head.appendChild(ad);
    }

    loadAnalytics();

    function onUserInteraction(){
      loadAdSenseOnce();
      window.removeEventListener("scroll", onUserInteraction);
      window.removeEventListener("mousemove", onUserInteraction);
      window.removeEventListener("touchstart", onUserInteraction);
    }

    if (!adsBlocked){
      window.addEventListener("scroll", onUserInteraction, {passive:true});
      window.addEventListener("mousemove", onUserInteraction, {passive:true});
      window.addEventListener("touchstart", onUserInteraction, {passive:true});
      setTimeout(loadAdSenseOnce, 3500);
    }

    function applyConsent(consent){
      gtag("consent","update", consent);
      if (consent.ad_storage === "granted"){
        adsBlocked = false;
        loadAdSenseOnce();
      } else {
        adsBlocked = true;
        document.querySelectorAll("ins.adsbygoogle, .google-auto-placed")
          .forEach(ad => { ad.style.display="none"; ad.innerHTML=""; });
      }
      localStorage.setItem("analytics_storage", consent.analytics_storage);
      localStorage.setItem("ad_storage", consent.ad_storage);
    }

    window.acceptAllCookies = function(){
      localStorage.setItem("cookieConsent","accepted");
      applyConsent({
        analytics_storage:"granted",
        ad_storage:"granted",
        ad_user_data:"granted",
        ad_personalization:"granted"
      });
    };

    window.rejectAllCookies = function(){
      localStorage.setItem("cookieConsent","refused");
      applyConsent({
        analytics_storage:"denied",
        ad_storage:"denied",
        ad_user_data:"denied",
        ad_personalization:"denied"
      });
    };
  }
</script>`;
// ^^^ AQUI ESTAVA O ERRO: Adicionada a tag de fechamento

// REGEX AJUSTADA
const oldBlockRegex = /\/\*\s*={30,}[\s\S]*?MODO ADMIN[\s\S]*?G-8FLJ59XXDK[\s\S]*?<\/script>/g;

// =========================================================
// EXECUÇÃO
// =========================================================
let stats = { processed: 0, modified: 0, skipped: 0, errors: 0 };

function processDirectory(dir) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isFile()) {
            if (path.extname(file) !== allowedExtension) return;
            if (excludedFiles.includes(file)) return;
            stats.processed++;
            updateFile(fullPath);
        }
    });
}

function updateFile(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        if (oldBlockRegex.test(content)) {
            const newContent = content.replace(oldBlockRegex, newBlockContent);
            if (content !== newContent) {
                fs.writeFileSync(filePath, newContent, 'utf8');
                console.log(`✅ [ALTERADO]: ${filePath}`);
                stats.modified++;
            } else { stats.skipped++; }
        } else { stats.skipped++; }
    } catch (err) {
        console.error(`❌ [ERRO] ${filePath}:`, err);
        stats.errors++;
    }
}

console.log('🚀 Iniciando atualização CORRIGIDA...');
targetFolders.forEach(folder => {
    if (excludedFolders.includes(folder)) return;
    const fullDirPath = path.resolve(__dirname, folder);
    if (fs.existsSync(fullDirPath) && fs.statSync(fullDirPath).isDirectory()) {
        processDirectory(fullDirPath);
    }
});

console.log('🏁 CONCLUÍDO!');
console.log(`✅ Arquivos alterados: ${stats.modified}`);