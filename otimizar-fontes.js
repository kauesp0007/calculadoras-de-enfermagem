const fs = require('fs');
const path = require('path');

// Regra: Raiz (pt) e os 18 idiomas
const langs = ['./', 'en', 'es', 'de', 'it', 'fr', 'hi', 'zh', 'ar', 'ja', 'ru', 'ko', 'tr', 'nl', 'pl', 'sv', 'id', 'vi', 'uk'];

// Regra: Não avaliar ficheiros destas pastas
const excludeDirs = ['downloads', 'biblioteca', 'blog', 'node_modules', '.git'];

// Regra: Não alterar ficheiros vitais
const excludeFiles = [
    'footer.html', 'menu-global.html', 'global-body-elements.html',
    'downloads.html', 'menu-lateral.html', '_language_selector.html',
    'googlefc0a17cdd552164b.html'
];

let modifiedCount = 0;
let untouchedCount = 0;

// As strings exatas de busca e substituição
const fontAntiga = '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Nunito+Sans:wght@400;700;900&display=swap" rel="stylesheet">';

const fontNova = `<link rel="preload" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Nunito+Sans:wght@400;700;900&display=swap" as="style" onload="this.onload=null;this.rel='stylesheet'">
  <noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Nunito+Sans:wght@400;700;900&display=swap"></noscript>`;

function processFile(filePath) {
    const fileName = path.basename(filePath);

    // Pula arquivos que não são HTML ou estão na lista de exclusão
    if (!fileName.endsWith('.html') || excludeFiles.includes(fileName)) return;

    const content = fs.readFileSync(filePath, 'utf8');

    // Verifica se a tag antiga existe no arquivo
    if (content.includes(fontAntiga)) {
        // Substitui a tag antiga pela nova estrutura otimizada
        const newContent = content.split(fontAntiga).join(fontNova);

        fs.writeFileSync(filePath, newContent, 'utf8');
        modifiedCount++;
        console.log(`[Otimizado] ${filePath}`);
    } else {
        untouchedCount++;
    }
}

function scanDirectory(dirPath) {
    if (!fs.existsSync(dirPath)) return;

    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    for (let entry of entries) {
        const fullPath = path.join(dirPath, entry.name);

        if (entry.isDirectory()) {
            if (!excludeDirs.includes(entry.name)) {
                scanDirectory(fullPath);
            }
        } else if (entry.isFile()) {
            processFile(fullPath);
        }
    }
}

console.log('Iniciando varredura para otimização de Fontes (Eliminar bloqueio de renderização)...\n');

langs.forEach(langPath => {
    // Para a raiz ('./'), o caminho é o próprio diretório inicial
    const fullDirPath = path.join(__dirname, langPath);
    scanDirectory(fullDirPath);
});

// Regra: Log final detalhado
console.log('\n=========================================');
console.log('       RESUMO DA OTIMIZAÇÃO DE FONTES    ');
console.log('=========================================');
console.log(`Arquivos alterados: ${modifiedCount}`);
console.log(`Arquivos que não precisaram de alteração: ${untouchedCount}`);
console.log('=========================================\n');