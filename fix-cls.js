const fs = require('fs');
const path = require('path');
const probe = require('probe-image-size'); // NOVA BIBLIOTECA

// ==========================================
// CONFIGURAÇÃO GERAL
// ==========================================
const ROOT_DIR = __dirname;

const IGNORED_FILES = [
    'footer.html', 'menu-global.html', 'global-body-elements.html', 
    'downloads.html', 'menu-lateral.html'
];

const IGNORED_FOLDERS_INDEXER = ['node_modules', '.git', 'downloads', 'biblioteca', 'dist', 'build'];

const IMG_EXTENSIONS = ['.webp', '.png', '.jpg', '.jpeg', '.gif', '.svg'];

// ==========================================
// 1. O INDEXADOR (MAPA DO TESOURO)
// ==========================================
const imageMap = new Map();

function indexAllImages(directory) {
    try {
        const files = fs.readdirSync(directory);

        files.forEach(file => {
            const fullPath = path.join(directory, file);
            const stat = fs.statSync(fullPath);

            if (stat.isDirectory()) {
                if (!IGNORED_FOLDERS_INDEXER.includes(file)) {
                    indexAllImages(fullPath);
                }
            } else {
                const ext = path.extname(file).toLowerCase();
                if (IMG_EXTENSIONS.includes(ext)) {
                    imageMap.set(file.toLowerCase(), fullPath);
                }
            }
        });
    } catch (e) {
        // Ignora erros de permissão
    }
}

// ==========================================
// 2. PROCESSAMENTO DO HTML
// ==========================================
function processFile(filePath) {
    const fileName = path.basename(filePath);
    
    if (IGNORED_FILES.includes(fileName)) return;
    if (fileName.includes('.template.')) return;

    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Regex para encontrar tags IMG
    const imgRegex = /<img([^>]+)>/gi;

    const newContent = content.replace(imgRegex, (match, attributes) => {
        
        // Pula se já tem width E height
        if (attributes.match(/\bwidth\s*=\s*['"]?[0-9]+/) && attributes.match(/\bheight\s*=\s*['"]?[0-9]+/)) {
            return match; 
        }

        const srcMatch = attributes.match(/src\s*=\s*["']([^"']+)["']/i);
        if (!srcMatch) return match;

        let src = srcMatch[1];
        
        if (src.startsWith('data:') || src.startsWith('http') || src.includes('{{')) return match;

        let cleanName = path.basename(src.split('?')[0].split('#')[0]);
        cleanName = decodeURIComponent(cleanName).toLowerCase();

        const realPath = imageMap.get(cleanName);

        if (realPath) {
            try {
                // MUDANÇA AQUI: Lendo o arquivo como Buffer para o probe-image-size analisar
                const imgBuffer = fs.readFileSync(realPath);
                const dimensions = probe.sync(imgBuffer);

                if (dimensions && dimensions.width && dimensions.height) {
                    let newAttributes = attributes;
                    
                    if (!newAttributes.match(/\bwidth\s*=/i)) {
                        newAttributes = ` width="${dimensions.width}"` + newAttributes;
                    }
                    if (!newAttributes.match(/\bheight\s*=/i)) {
                        newAttributes = ` height="${dimensions.height}"` + newAttributes;
                    }

                    modified = true;
                    // console.log(`✅ [${fileName}] Corrigido: ${cleanName}`);
                    return `<img${newAttributes}>`;
                }
            } catch (err) {
                console.log(`⚠️  [${fileName}] Arquivo WebP muito complexo ou corrompido: ${cleanName}`);
            }
        } else {
            // A imagem com "X" realmente não existe com esse nome exato no projeto
            console.log(`❌ [${fileName}] Imagem não encontrada: ${cleanName}`);
        }

        return match;
    });

    if (modified) {
        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log(`💾 SALVO: ${fileName}`);
    }
}

// ==========================================
// 3. EXECUÇÃO
// ==========================================
console.log("🕵️  Mapeando imagens...");
indexAllImages(ROOT_DIR);
console.log(`🗺️  ${imageMap.size} imagens encontradas.`);

console.log("🚀 Iniciando correção de CLS...");

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