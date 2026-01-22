const fs = require('fs');
const path = require('path');

// Configurações
const rootDir = '.'; // Raiz do projeto
const targetExtensions = ['.html'];
const languages = ['en', 'es', 'de', 'it', 'fr', 'hi', 'zh', 'ar', 'ja', 'ru', 'ko', 'tr', 'nl', 'pl', 'sv', 'id', 'vi', 'uk'];
const ignoredDirs = ['downloads', 'biblioteca', 'node_modules', '.git', '.vscode'];
const ignoredFiles = [
    'footer.html',
    'menu-global.html',
    'global-body-elements.html',
    'downloads.html',
    'menu-lateral.html',
    '_language_selector.html',
    'googlefc0a17cdd552164b.html'
];

// Contadores para o log final
let filesProcessed = 0;
let filesAltered = 0;
let filesSkipped = 0;

// Função para verificar se o diretório é válido (Raiz ou Idiomas)
function isValidDirectory(dirName, relativePath) {
    if (ignoredDirs.includes(dirName)) return false;

    // Se for a raiz (./) é válido
    if (relativePath === '') return true;

    // Se estiver na lista de idiomas, é válido
    const firstLevelDir = relativePath.split(path.sep)[0];
    if (languages.includes(firstLevelDir)) return true;

    return false;
}

// Função recursiva para percorrer diretórios
function walkDir(currentPath) {
    const entries = fs.readdirSync(currentPath, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(currentPath, entry.name);
        const relativePath = path.relative(rootDir, fullPath);

        if (entry.isDirectory()) {
            if (isValidDirectory(entry.name, path.relative(rootDir, currentPath))) {
                walkDir(fullPath);
            }
        } else if (entry.isFile()) {
            if (targetExtensions.includes(path.extname(entry.name)) && !ignoredFiles.includes(entry.name)) {
                processFile(fullPath);
            }
        }
    }
}

// Função para processar e limpar o HTML
function processFile(filePath) {
    filesProcessed++;
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;

    // 1. Regex para encontrar blocos <script> que contenham lógica de PDF local
    // Procura scripts que tenham 'btnGerarPDF', 'html2pdf', 'jspdf' ou 'html2canvas'
    // A regex tenta pegar o bloco <script> inteiro.
    const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;

    content = content.replace(scriptRegex, (match, scriptContent) => {
        // Verifica palavras-chave dentro do script
        if (
            (scriptContent.includes('btnGerarPDF') && scriptContent.includes('addEventListener')) ||
            scriptContent.includes('html2pdf') ||
            scriptContent.includes('jspdf') ||
            (scriptContent.includes('html2canvas') && !scriptContent.includes('global-scripts.js'))
        ) {
            console.log(`🗑️  Removendo script de PDF em: ${path.basename(filePath)}`);
            return ''; // Remove o bloco de script inteiro
        }
        return match; // Mantém o script se não for de PDF
    });

    // 2. Remove links duplicados de bibliotecas se existirem localmente (pois estarão no global)
    const libRegex = /<script\s+src=["']https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/html2pdf.*?<\/script>/gi;
    content = content.replace(libRegex, '');

    if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf8');
        filesAltered++;
    } else {
        filesSkipped++;
    }
}

// Início da execução
console.log('🚀 Iniciando varredura e limpeza de scripts de PDF...');
walkDir(rootDir);

// Log Final
console.log('\n=============================================');
console.log('✅ CONCLUÍDO');
console.log('=============================================');
console.log(`📂 Total de arquivos avaliados: ${filesProcessed}`);
console.log(`✏️  Arquivos alterados: ${filesAltered}`);
console.log(`zzz Arquivos sem alterações necessárias: ${filesSkipped}`);
console.log('=============================================');