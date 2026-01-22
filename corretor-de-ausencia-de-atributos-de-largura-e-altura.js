const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

// ==========================================
// CORREÇÃO DE IMPORTAÇÃO (IMAGE-SIZE)
// ==========================================
let sizeOf;
try {
    const pkg = require('image-size');
    if (typeof pkg === 'function') {
        sizeOf = pkg;
    } else if (pkg.default && typeof pkg.default === 'function') {
        sizeOf = pkg.default;
    } else if (pkg.imageSize && typeof pkg.imageSize === 'function') {
        sizeOf = pkg.imageSize;
    } else {
        throw new Error('Não foi possível encontrar a função principal do image-size');
    }
} catch (e) {
    console.error("ERRO CRÍTICO NA BIBLIOTECA IMAGE-SIZE:", e.message);
    process.exit(1);
}

// ==========================================
// CONFIGURAÇÕES
// ==========================================

const rootDir = __dirname;

const targetLangs = [
    'en', 'es', 'de', 'it', 'fr', 'hi', 'zh', 'ar',
    'ja', 'ru', 'ko', 'tr', 'nl', 'pl', 'sv', 'id', 'vi', 'uk'
];

const ignoredFolders = ['downloads', 'biblioteca', 'node_modules', '.git', '.vscode'];

const ignoredFiles = [
    'footer.html',
    'menu-global.html',
    'global-body-elements.html',
    'downloads.html',
    'menu-lateral.html',
    '_language_selector.html',
    'googlefc0a17cdd552164b.html'
];

let stats = {
    processed: 0,
    altered: 0,
    skipped: 0,
    errors: 0,
    imagesFixed: 0,
    candidatesNotFound: 0 // Contador para imagens que precisavam de fix mas arquivo não foi achado
};

// Contador para limitar logs de debug no terminal
let debugLogCount = 0;
const MAX_DEBUG_LOGS = 10;

// ==========================================
// LÓGICA PRINCIPAL
// ==========================================

function walkDir(currentPath) {
    const files = fs.readdirSync(currentPath);

    for (const file of files) {
        const fullPath = path.join(currentPath, file);
        let stat;
        try {
            stat = fs.statSync(fullPath);
        } catch (e) { continue; }

        if (stat.isDirectory()) {
            if (ignoredFolders.includes(file)) continue;
            walkDir(fullPath);
        } else {
            if (path.extname(file) === '.html') {
                if (shouldProcessFile(fullPath, file)) {
                    processHtmlFile(fullPath);
                }
            }
        }
    }
}

function shouldProcessFile(fullPath, fileName) {
    if (ignoredFiles.includes(fileName)) return false;
    const relativePath = path.relative(rootDir, fullPath);
    const firstFolder = relativePath.split(path.sep)[0];
    if (relativePath === fileName) return true;
    if (targetLangs.includes(firstFolder)) return true;
    return false;
}

function processHtmlFile(filePath) {
    stats.processed++;
    let content = fs.readFileSync(filePath, 'utf8');
    const $ = cheerio.load(content, { decodeEntities: false, xmlMode: false });
    let fileChanged = false;

    $('img').each((i, elem) => {
        const img = $(elem);
        let src = img.attr('src');
        const hasWidth = img.attr('width');
        const hasHeight = img.attr('height');

        // Se já tem largura E altura, ignora
        if (hasWidth && hasHeight) return;

        // Ignora imagens sem src, externas ou base64
        if (!src || src.startsWith('http') || src.startsWith('//') || src.startsWith('data:')) return;

        try {
            let cleanSrc = src.split('?')[0].split('#')[0];
            cleanSrc = decodeURIComponent(cleanSrc);

            let imagePath;
            if (path.isAbsolute(cleanSrc) || cleanSrc.startsWith('/')) {
                // Remove a barra inicial se existir para juntar com rootDir corretamente
                const relativeSrc = cleanSrc.startsWith('/') ? cleanSrc.slice(1) : cleanSrc;
                imagePath = path.join(rootDir, relativeSrc);
            } else {
                // Caminho relativo ao arquivo HTML
                imagePath = path.join(path.dirname(filePath), cleanSrc);
            }

            // Resolve caminhos com ".." para normalizar (remove inconsistencias)
            imagePath = path.resolve(imagePath);

            if (fs.existsSync(imagePath)) {
                const dimensions = sizeOf(imagePath);

                if (dimensions && dimensions.width && dimensions.height) {
                    if (!hasWidth) img.attr('width', dimensions.width);
                    if (!hasHeight) img.attr('height', dimensions.height);
                    fileChanged = true;
                    stats.imagesFixed++;
                }
            } else {
                // MODO DIAGNÓSTICO: Logar por que não achou a imagem
                stats.candidatesNotFound++;
                if (debugLogCount < MAX_DEBUG_LOGS) {
                    debugLogCount++;
                    console.log(`⚠️  [MISS] Imagem não encontrada no disco:`);
                    console.log(`   HTML: ${path.relative(rootDir, filePath)}`);
                    console.log(`   SRC:  ${src}`);
                    console.log(`   Tentou abrir: ${imagePath}`);
                    console.log(`   -----------------------------`);
                }
            }
        } catch (err) {
            if (err.code !== 'ENOENT') {
               stats.errors++;
            }
        }
    });

    if (fileChanged) {
        fs.writeFileSync(filePath, $.html(), 'utf8');
        stats.altered++;
        console.log(`✅ Ajustado: ${path.relative(rootDir, filePath)}`);
    } else {
        stats.skipped++;
    }
}

// ==========================================
// EXECUÇÃO
// ==========================================

console.log("---------------------------------------------------------");
console.log("INICIANDO CORREÇÃO (MODO DIAGNÓSTICO ATIVO)...");
console.log("---------------------------------------------------------");

try {
    walkDir(rootDir);
} catch (error) {
    console.error("Erro fatal na execução:", error);
}

console.log("\n---------------------------------------------------------");
console.log("RELATÓRIO FINAL");
console.log("---------------------------------------------------------");
console.log(`📂 HTMLs analisados:       ${stats.processed}`);
console.log(`📝 Arquivos alterados:     ${stats.altered}`);
console.log(`🖼️  Tags <img> ajustadas:   ${stats.imagesFixed}`);
console.log(`❌ Imagens não achadas:    ${stats.candidatesNotFound} (Verifique os caminhos acima!)`);
console.log(`⚠️  Erros de leitura:       ${stats.errors}`);
console.log("---------------------------------------------------------");