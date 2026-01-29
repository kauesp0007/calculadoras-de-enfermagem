const fs = require('fs');
const path = require('path');

// =========================================================
// CONFIGURAÇÕES E REGRAS DE EXCLUSÃO (Baseadas no seu Padrão)
// =========================================================

// Pastas de idiomas permitidas para scan
const targetFolders = [
    '.', // Raiz
    'en', 'es', 'de', 'it', 'fr', 'hi', 'zh', 'ar', 'ja',
    'ru', 'ko', 'tr', 'nl', 'pl', 'sv', 'id', 'vi', 'uk'
];

// Pastas a serem ignoradas completamente
const excludedFolders = ['downloads', 'biblioteca', 'node_modules', '.git', '.vscode'];

// Arquivos específicos a serem ignorados (Templates e Globais)
const excludedFiles = [
    'footer.html',
    'menu-global.html',
    'global-body-elements.html',
    'downloads.html',
    'menu-lateral.html',
    '_language_selector.html',
    'googlefc0a17cdd552164b.html'
];

// Extensões permitidas
const allowedExtension = '.html';

// =========================================================
// CONTEÚDO NOVO (G-MJDKPDPJ26 + ADS + ADSENSE)
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
  }`;

// REGEX PARA IDENTIFICAR O BLOCO ANTIGO
// Procura desde o comentário inicial até a tag </script>, garantindo que contém o ID antigo.
// [\s\S]*? pega qualquer caractere (incluindo quebra de linha) de forma não-gulosa.
const oldBlockRegex = /\/\*\s*={30,}[\s\S]*?MODO ADMIN[\s\S]*?G-8FLJ59XXDK[\s\S]*?<\/script>/g;

// =========================================================
// LÓGICA DE EXECUÇÃO
// =========================================================

let stats = {
    processed: 0,
    modified: 0,
    skipped: 0,
    errors: 0
};

function processDirectory(dir) {
    // Verificar se o diretório existe
    if (!fs.existsSync(dir)) return;

    const files = fs.readdirSync(dir);

    files.forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        // Se for diretório, não entra recursivamente se não estiver na lista permitida,
        // mas a lógica aqui é iterar sobre a lista 'targetFolders' no loop principal.
        // Portanto, aqui dentro só processamos arquivos.

        if (stat.isFile()) {
            // Verifica extensão HTML
            if (path.extname(file) !== allowedExtension) return;

            // Verifica exclusão de arquivos específicos
            if (excludedFiles.includes(file)) return;

            stats.processed++;
            updateFile(fullPath);
        }
    });
}

function updateFile(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');

        // Verifica se o arquivo tem o bloco antigo
        if (oldBlockRegex.test(content)) {
            // Substitui o bloco antigo pelo novo
            const newContent = content.replace(oldBlockRegex, newBlockContent);

            // Grava apenas se houve alteração real
            if (content !== newContent) {
                fs.writeFileSync(filePath, newContent, 'utf8');
                console.log(`✅ [ALTERADO]: ${filePath}`);
                stats.modified++;
            } else {
                // Caso o regex dê match mas o replace não mude nada (raro)
                stats.skipped++;
            }
        } else {
            // console.log(`⏩ [IGNORADO - SEM TAG ANTIGA]: ${filePath}`);
            stats.skipped++;
        }
    } catch (err) {
        console.error(`❌ [ERRO] ao processar ${filePath}:`, err);
        stats.errors++;
    }
}

// =========================================================
// INÍCIO DO SCRIPT
// =========================================================

console.log('🚀 Iniciando atualização das Google Tags...');
console.log(`🎯 ID Novo: G-MJDKPDPJ26 | ID Antigo Buscado: G-8FLJ59XXDK`);

// Itera sobre as pastas permitidas
targetFolders.forEach(folder => {
    // Pula pastas excluídas se por acaso estiverem na lista target (segurança dupla)
    if (excludedFolders.includes(folder)) return;

    // Resolve o caminho completo
    const fullDirPath = path.resolve(__dirname, folder);

    // Verifica se é uma pasta válida antes de processar
    if (fs.existsSync(fullDirPath) && fs.statSync(fullDirPath).isDirectory()) {
        processDirectory(fullDirPath);
    }
});

console.log('\n=============================================');
console.log('🏁 CONCLUÍDO!');
console.log(`📂 Arquivos analisados: ${stats.processed}`);
console.log(`✅ Arquivos alterados: ${stats.modified}`);
console.log(`⏩ Arquivos sem tag antiga: ${stats.skipped}`);
console.log(`❌ Erros: ${stats.errors}`);
console.log('=============================================');