const fs = require('fs');
const path = require('path');

// --- CONFIGURAÇÃO ---

// Pastas PROIBIDAS (Não entra aqui)
const ignoredFolders = [
    'downloads',
    'biblioteca',
    'node_modules',
    '.git',
    '.github',
    'img',
    'docs',
    'videos',
    'public',
    'assets'
];

// Arquivos PROIBIDOS (Não toca nestes)
const ignoredFiles = [
    'menu-global.html',
    'global-body-elements.html',
    'downloads.html',
    'menu-lateral.html',
    '_language_selector.html',
    'googlefc0a17cdd552164b.html'
];

let modifiedCount = 0;

function processFile(filePath, fileName) {
    // 1. Apenas arquivos .html
    if (path.extname(fileName) !== '.html') return;

    // 2. Respeita a lista negra de arquivos
    if (ignoredFiles.includes(fileName)) return;

    try {
        let content = fs.readFileSync(filePath, 'utf8');
        let originalContent = content;

        // --- AÇÃO 1: OTIMIZAR GLOBAL-STYLES.CSS ---
        // Transforma o link bloqueante em assíncrono (media="print" onload="this.media='all'")
        // Adiciona tag <noscript> para fallback
        const globalCssRegex = /<link rel="stylesheet" href="([^"]*\/)?global-styles\.css">/g;

        content = content.replace(globalCssRegex, (match, pathPrefix) => {
            const prefix = pathPrefix || '';
            // Nota: Adicionamos \n (quebra de linha) para manter o código legível, NÃO minificado.
            return `<link rel="stylesheet" href="${prefix}global-styles.css" media="print" onload="this.media='all'">\n  <noscript><link rel="stylesheet" href="${prefix}global-styles.css"></noscript>`;
        });

        // --- AÇÃO 2: OTIMIZAR OUTPUT.CSS (TAILWIND) ---
        // Mesma lógica para o CSS do Tailwind
        const outputCssRegex = /<link href="([^"]*\/)?output\.css" rel="stylesheet">/g;

        content = content.replace(outputCssRegex, (match, pathPrefix) => {
             // Tenta capturar o caminho exato que estava no href original
             const matchResult = match.match(/href="([^"]+)"/);
             const finalPath = matchResult ? matchResult[1] : '/public/output.css';

             return `<link href="${finalPath}" rel="stylesheet" media="print" onload="this.media='all'">\n  <noscript><link rel="stylesheet" href="${finalPath}"></noscript>`;
        });

        // Se houve alteração, salva
        if (content !== originalContent) {
            fs.writeFileSync(filePath, content, 'utf8');
            modifiedCount++;
            console.log(`[CSS OTIMIZADO]: ${filePath}`);
        }

    } catch (err) {
        console.error(`Erro ao processar ${filePath}: ${err.message}`);
    }
}

// Função de Varredura Universal (Recursiva)
function scanDirectory(directory) {
    let files;
    try {
        files = fs.readdirSync(directory);
    } catch (e) {
        console.error(`Erro ao ler diretório: ${directory}`);
        return;
    }

    files.forEach(file => {
        const fullPath = path.join(directory, file);
        let stat;
        try { stat = fs.statSync(fullPath); } catch (e) { return; }

        if (stat.isDirectory()) {
            // Se NÃO estiver na lista de pastas ignoradas, entra nela
            if (!ignoredFolders.includes(file)) {
                scanDirectory(fullPath);
            }
        } else {
            // Se for arquivo, processa
            processFile(fullPath, file);
        }
    });
}

// --- EXECUÇÃO ---

console.log('--- INICIANDO OTIMIZAÇÃO DE CSS (SEM MINIFICAÇÃO) ---');
console.log('Alvo: global-styles.css e output.css');
console.log('Ação: Adicionar carregamento assíncrono (media="print" onload="all")');

scanDirectory(__dirname);

console.log(`\nProcesso concluído.`);
console.log(`Total de arquivos otimizados: ${modifiedCount}`);