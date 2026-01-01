const fs = require('fs');
const path = require('path');

/* ========================================================================
   CONFIGURAÇÕES - LISTA NEGRA GLOBAL
   ======================================================================== */

// 1. Arquivos que NUNCA devem ser otimizados (em NENHUMA pasta)
const filesToIgnore = [
    'downloads.html',
    'footer.html',
    'menu-global.html',
    'global-body-elements.html',
    '_language_selector.html',
    'analise-gasometria.html',
    'sw.js' // Service workers não devem ser tocados
];

// 2. Pastas que NUNCA devem ser acessadas
const dirsToIgnore = [
    'downloads',
    'biblioteca',
    'node_modules',
    '.git',
    'assets',
    'img',
    'public',
    'css',
    'js'
];

// 3. Pastas de idiomas para varrer
const languageFolders = [
    'en', 'es', 'de', 'it', 'fr', 'hi', 'zh', 'ar', 'ja',
    'ru', 'ko', 'tr', 'nl', 'pl', 'sv', 'id', 'vi', 'uk'
];

/* ========================================================================
   LÓGICA DE OTIMIZAÇÃO (PAGE SPEED)
   ======================================================================== */

function optimizeImages(html) {
    return html.replace(/<img\s+([^>]+)>/gi, (match, attributes) => {
        // Se já tem loading, não mexe
        if (attributes.match(/loading=["'](lazy|eager)["']/i)) return match;

        // Se é Logo/Header (LCP), usa prioridade alta
        if (attributes.match(/class=["'].*?(logo|header|brand).*?["']/i) ||
            attributes.match(/alt=["'].*?(logo|brand).*?["']/i) ||
            attributes.match(/id=["'].*?(logo).*?["']/i)) {
             if (!attributes.includes('fetchpriority')) {
                 return `<img ${attributes} fetchpriority="high">`;
             }
             return match;
        }

        // Demais imagens: Lazy Load + Async
        let newAttrs = attributes;
        if (!newAttrs.includes('decoding=')) newAttrs += ' decoding="async"';
        return `<img ${newAttrs} loading="lazy">`;
    });
}

function addResourceHints(html) {
    if (!html.includes('<head>')) return html;
    // Evita duplicar se já tiver
    if (html.includes('dns-prefetch') && html.includes('googletagmanager')) return html;

    const hints = `
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="dns-prefetch" href="//googleads.g.doubleclick.net">
    <link rel="dns-prefetch" href="//pagead2.googlesyndication.com">
    <link rel="preconnect" href="https://www.googletagmanager.com">
    `;
    return html.replace('<head>', `<head>${hints}`);
}

/* ========================================================================
   MOTOR DE PROCESSAMENTO
   ======================================================================== */

let filesModified = 0;
let filesProcessed = 0;
let filesIgnored = 0;

function processFile(filePath) {
    filesProcessed++;
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;

    content = addResourceHints(content);
    content = optimizeImages(content);

    if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf8');
        filesModified++;
        console.log(`⚡ Otimizado: ${filePath}`);
    }
}

function scanFolderFlat(folderPath) {
    if (!fs.existsSync(folderPath)) {
        console.log(`⚠️ Pasta não encontrada: ${folderPath}`);
        return;
    }

    // Verifica se a própria pasta está na lista negra (ex: downloads na raiz)
    const folderName = path.basename(folderPath);
    if (dirsToIgnore.includes(folderName)) {
        console.log(`🛑 Pulando pasta proibida: ${folderName}`);
        return;
    }

    const items = fs.readdirSync(folderPath);

    items.forEach(item => {
        const fullPath = path.join(folderPath, item);
        const stat = fs.statSync(fullPath);

        // 1. Se for arquivo HTML
        if (stat.isFile() && path.extname(item).toLowerCase() === '.html') {

            // 🛑 CHECK DE SEGURANÇA GLOBAL
            // Se o arquivo estiver na lista negra, ignora (não importa a pasta)
            if (filesToIgnore.includes(item)) {
                filesIgnored++;
                // console.log(`🛡️ Ignorado (Proibido): ${item}`);
                return;
            }

            processFile(fullPath);
        }
    });
}

/* ========================================================================
   EXECUÇÃO
   ======================================================================== */
console.log('🚀 Iniciando Otimização Global (Com Exclusões Seguras)...');
console.log('-------------------------------------------------------');

// 1. Processa a Raiz (.)
console.log('📂 Verificando Raiz (PT)...');
scanFolderFlat('.');

// 2. Processa as pastas de idiomas
languageFolders.forEach(lang => {
    console.log(`📂 Verificando pasta: ${lang}/`);
    scanFolderFlat(lang);
});

console.log('-------------------------------------------------------');
console.log('🏁 Finalizado!');
console.log(`📊 Arquivos analisados: ${filesProcessed}`);
console.log(`🛡️ Arquivos ignorados (proibidos): ${filesIgnored}`);
console.log(`💾 Arquivos modificados: ${filesModified}`);