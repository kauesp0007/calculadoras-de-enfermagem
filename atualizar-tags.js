const fs = require('fs');
const path = require('path');

// =============================================================================
// ⚙️ CONFIGURAÇÕES
// =============================================================================

// 1. Pastas permitidas para atualização
const targetDirs = [
    '.', // Raiz
    'en', 'es', 'de', 'it', 'fr', 'hi', 'zh', 'ar', 'ja',
    'ru', 'ko', 'tr', 'nl', 'pl', 'sv', 'id', 'vi', 'uk'
];

// 2. Arquivos e pastas a IGNORAR completamente
const excludedFiles = [
    'downloads.html',
    'footer.html',
    'menu-global.html',
    'global-body-elements.html',
    '_language_selector.html',
    'sw.js',
    'package.json',
    'package-lock.json',
    'googlefc0a17cdd552164b.html'
];

const excludedFolders = [
    'biblioteca',
    'downloads',
    'node_modules',
    '.git',
    '.vscode'
];

// =============================================================================
// 📝 BLOCOS DE CÓDIGO
// =============================================================================

// O bloco ANTIGO (exatamente como você enviou).
// O script vai transformar isso em uma Regex flexível para lidar com espaços/quebras de linha.
const oldCodeBlock = `/* -----------------------------------------------------
          1) GOOGLE TAG (gtag.js)
          ----------------------------------------------------- */
      if (!window.__metricsLoaded) {
        window.__metricsLoaded = true;

        var scriptGA = document.createElement('script');
        scriptGA.async = true;
        scriptGA.src = "https://www.googletagmanager.com/gtag/js?id=AW-952633102";
        document.head.appendChild(scriptGA);

        window.dataLayer = window.dataLayer || [];
        function gtag() { dataLayer.push(arguments); }
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
      }`;

// O bloco NOVO (com ID corrigido e Consent Mode V2)
const newCodeBlock = `/* -----------------------------------------------------
          1) GOOGLE TAG (gtag.js)
          ----------------------------------------------------- */
      if (!window.__metricsLoaded) {
        window.__metricsLoaded = true;

        var scriptGA = document.createElement('script');
        scriptGA.async = true;
        // 💡 MELHORIA: Carregar direto da origem do Analytics (G-...) em vez do Ads (AW-...)
        // Usei o ID G-VVDP5JGEX8 que está no seu print como "Site Principal".
        // Se você tiver certeza que quer usar o antigo (G-8FLJ...), mantenha o antigo, mas recomendo o do print.
        scriptGA.src = "https://www.googletagmanager.com/gtag/js?id=G-VVDP5JGEX8";
        document.head.appendChild(scriptGA);

        window.dataLayer = window.dataLayer || [];
        function gtag() { dataLayer.push(arguments); }
        window.gtag = window.gtag || gtag;

        // Definir consentimento ANTES de iniciar a config
        if (isRefused) {
          gtag("consent", "default", {
            analytics_storage: "denied",
            ad_storage: "denied",
            ad_user_data: "denied",        // Novo parâmetro v2
            ad_personalization: "denied",  // Novo parâmetro v2
            wait_for_update: 500
          });
        } else {
          gtag("consent", "default", {
            analytics_storage: "granted",
            ad_storage: "granted",
            ad_user_data: "granted",
            ad_personalization: "granted",
            wait_for_update: 500
          });
        }

        gtag("js", new Date());

        // Configuração dos IDs
        gtag("config", "G-VVDP5JGEX8"); // ⚡ Atualizado para o ID do "Site Principal"
        gtag("config", "AW-952633102"); // Google Ads (Mantido)
      }`;

// =============================================================================
// 🚀 LÓGICA DO SCRIPT
// =============================================================================

// Função auxiliar para escapar caracteres especiais de Regex
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Cria uma Regex flexível a partir do bloco de código antigo
// Transforma qualquer sequência de espaços/quebras de linha em \s+
const normalizedOldCodePattern = oldCodeBlock
    .split(/\r?\n/) // Divide por linhas
    .map(line => line.trim()) // Remove espaços nas pontas de cada linha
    .filter(line => line.length > 0) // Remove linhas vazias
    .map(escapeRegExp) // Escapa caracteres regex
    .join('\\s+'); // Junta tudo permitindo qualquer espaço em branco entre as linhas

const regexFinder = new RegExp(normalizedOldCodePattern, 'g');

let totalFilesProcessed = 0;
let totalFilesUpdated = 0;
let totalErrors = 0;

function processDirectory(dir) {
    // Verificar se a pasta existe
    if (!fs.existsSync(dir)) {
        console.log(`⚠️  Pasta não encontrada (pulando): ${dir}`);
        return;
    }

    const items = fs.readdirSync(dir);

    items.forEach(item => {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        // Se for diretório, não entramos recursivamente a menos que esteja na lista targetDirs
        // Mas como targetDirs já lista as pastas explicitamente, nós só processamos arquivos na raiz do dir atual.

        if (stat.isFile()) {
            // Verifica extensão .html
            if (!item.endsWith('.html')) return;

            // Verifica exclusões
            if (excludedFiles.includes(item)) return;

            processFile(fullPath);
        }
    });
}

function processFile(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');

        // Verifica se o arquivo tem o código antigo
        // O match é feito usando a regex flexível
        if (regexFinder.test(content)) {
            // Realiza a substituição
            // Nota: Como a regex consome espaços variados, a substituição direta é segura
            const newContent = content.replace(regexFinder, newCodeBlock);

            if (newContent !== content) {
                fs.writeFileSync(filePath, newContent, 'utf8');
                console.log(`✅ Atualizado: ${filePath}`);
                totalFilesUpdated++;
            } else {
                console.log(`ℹ️  Nada mudou (match falhou na substituição): ${filePath}`);
            }
        } else {
            // Opcional: Descomente para ver arquivos que não tinham o código antigo
            // console.log(`⚪ Ignorado (código antigo não encontrado): ${filePath}`);
        }

        totalFilesProcessed++;
    } catch (err) {
        console.error(`❌ Erro ao processar ${filePath}:`, err.message);
        totalErrors++;
    }
}

// =============================================================================
// ▶️ EXECUÇÃO
// =============================================================================

console.log("🚀 Iniciando atualização de Tags do Google Analytics/Ads...");
console.log("---------------------------------------------------------");

targetDirs.forEach(dir => {
    // Proteção extra: não processar pastas excluídas se elas estiverem em targetDirs por engano
    if (excludedFolders.includes(dir)) return;

    processDirectory(dir);
});

console.log("---------------------------------------------------------");
console.log("🏁 Concluído!");
console.log(`📂 Arquivos analisados: ${totalFilesProcessed}`);
console.log(`✅ Arquivos atualizados: ${totalFilesUpdated}`);
console.log(`❌ Erros: ${totalErrors}`);

if (totalFilesUpdated === 0) {
    console.log("\n⚠️  AVISO: Nenhum arquivo foi atualizado. Possíveis motivos:");
    console.log("1. O código antigo já foi removido.");
    console.log("2. A indentação do código nos arquivos é muito diferente da string de busca.");
    console.log("3. Você já rodou este script antes.");
}