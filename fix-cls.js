const fs = require('fs');
const path = require('path');
const probe = require('probe-image-size');

// ==========================================
// CONFIGURAÇÃO DE SEGURANÇA
// ==========================================
const ROOT_DIR = __dirname;

// ARQUIVOS PROIBIDOS (Não serão alterados)
const IGNORED_FILES = [
    'footer.html', 'menu-global.html', 'global-body-elements.html', 
    'downloads.html'
];

// PASTAS PROIBIDAS (O script ignora completamente)
const IGNORED_FOLDERS = ['node_modules', '.git', 'downloads', 'biblioteca', 'dist', 'build', 'assets'];

// EXTENSÕES ACEITAS
const IMG_EXTENSIONS = ['.webp', '.png', '.jpg', '.jpeg', '.gif', '.svg'];

// ==========================================
// 1. INDEXADOR GLOBAL (Mapa de Imagens)
// ==========================================
const imageMap = new Map();

function indexAllImages(directory) {
    try {
        const files = fs.readdirSync(directory);
        files.forEach(file => {
            const fullPath = path.join(directory, file);
            const stat = fs.statSync(fullPath);

            if (stat.isDirectory()) {
                if (!IGNORED_FOLDERS.includes(file)) {
                    indexAllImages(fullPath);
                }
            } else {
                const ext = path.extname(file).toLowerCase();
                if (IMG_EXTENSIONS.includes(ext)) {
                    imageMap.set(file.toLowerCase(), fullPath);
                }
            }
        });
    } catch (e) { /* Ignora erros de permissão */ }
}

// ==========================================
// 2. CORRETOR DE HTML (Regras do PageSpeed)
// ==========================================
function processFile(filePath) {
    const fileName = path.basename(filePath);
    
    // Filtros de Segurança
    if (IGNORED_FILES.includes(fileName)) return;
    if (fileName.includes('.template.')) return;

    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Regex para encontrar tags <img>
    const imgRegex = /<img([^>]+)>/gi;

    const newContent = content.replace(imgRegex, (match, attributes) => {
        // Verifica se já tem width e height
        const hasWidth = attributes.match(/\bwidth\s*=\s*['"]?[0-9]+/);
        const hasHeight = attributes.match(/\bheight\s*=\s*['"]?[0-9]+/);
        const hasLazy = attributes.match(/\bloading\s*=/i);

        // Se já tem tudo, pula
        if (hasWidth && hasHeight && hasLazy) {
            return match; 
        }

        // Pega o SRC
        const srcMatch = attributes.match(/src\s*=\s*["']([^"']+)["']/i);
        if (!srcMatch) return match;

        let src = srcMatch[1];
        
        // Ignora imagens externas/dinâmicas
        if (src.startsWith('data:') || src.startsWith('http') || src.includes('{{')) return match;

        // Limpa nome para busca
        let cleanName = path.basename(src.split('?')[0].split('#')[0]);
        cleanName = decodeURIComponent(cleanName).toLowerCase();

        // Busca imagem no mapa
        const realPath = imageMap.get(cleanName);
        let newAttributes = attributes;

        // 1. Aplica Dimensões (Se encontrar a imagem)
        if (realPath && (!hasWidth || !hasHeight)) {
            try {
                const imgBuffer = fs.readFileSync(realPath);
                const dimensions = probe.sync(imgBuffer);

                if (dimensions) {
                    if (!hasWidth) newAttributes = ` width="${dimensions.width}"` + newAttributes;
                    if (!hasHeight) newAttributes = ` height="${dimensions.height}"` + newAttributes;
                    modified = true;
                }
            } catch (err) {
                console.log(`⚠️  [${fileName}] Erro ao ler imagem: ${cleanName}`);
            }
        }

        // 2. Aplica Lazy Loading (Regra do Google para performance)
        // Adiciona em todas as imagens (seguro e recomendado para sites grandes)
        if (!hasLazy) {
            newAttributes = ` loading="lazy"` + newAttributes;
            modified = true;
        }

        if (modified) {
            return `<img${newAttributes}>`;
        }
        
        return match;
    });

    if (modified) {
        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log(`✅ OTIMIZADO: ${fileName}`);
    }
}

// ==========================================
// 3. EXECUÇÃO
// ==========================================
console.log("🕵️  Mapeando imagens...");
indexAllImages(ROOT_DIR);
console.log(`🗺️  ${imageMap.size} imagens indexadas.`);

console.log("🚀 Otimizando HTMLs (CLS + Bfcache Friendly)...");

// Pastas permitidas para alteração
const SCAN_DIRS = [
    '.', 
    'en', 'es', 'de', 'it', 'fr', 'hi', 'zh', 'ar', 'ja', 
    'ru', 'ko', 'tr', 'nl', 'pl', 'sv', 'id', 'vi', 'uk', 'pt'
];

SCAN_DIRS.forEach(dirName => {
    const dirPath = path.join(ROOT_DIR, dirName);
    if (fs.existsSync(dirPath)) {
        const files = fs.readdirSync(dirPath);
        files.forEach(file => {
            const fullPath = path.join(dirPath, file);
            if (fs.statSync(fullPath).isFile() && file.endsWith('.html')) {
                processFile(fullPath);
            }
        });
    }
});

console.log("🏁 Processo finalizado.");