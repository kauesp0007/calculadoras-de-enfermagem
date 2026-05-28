const fs = require('fs');
const path = require('path');

const ROOT_DIR = '.';
const LANGUAGES = ['en', 'es', 'de', 'it', 'fr', 'hi', 'zh', 'ar', 'ja', 'ru', 'ko', 'tr', 'nl', 'pl', 'sv', 'id', 'vi', 'uk'];
const IGNORE_FOLDERS = ['downloads', 'biblioteca', 'blog', 'node_modules', '.git'];
const IGNORE_FILES = [
    'footer.html', 'menu-global.html', 'global-body-elements.html',
    'downloads.html', 'menu-lateral.html', '_language_selector.html',
    'googlefc0a17cdd552164b.html'
];

let filesChangedCount = 0;
let filesSkippedCount = 0;

function start() {
    console.log('--- Iniciando Correção de Breadcrumbs (JSON-LD) ---');

    // Processa a raiz (Português)
    processDirectory(ROOT_DIR, 'pt-br');

    // Processa os 18 idiomas
    LANGUAGES.forEach(lang => {
        const langPath = path.join(ROOT_DIR, lang);
        if (fs.existsSync(langPath)) {
            processDirectory(langPath, lang);
        }
    });

    console.log('\n==================================================');
    console.log('               RELATÓRIO DE EXECUÇÃO');
    console.log('==================================================');
    console.log(`Arquivos corrigidos: ${filesChangedCount}`);
    console.log(`Arquivos sem problemas: ${filesSkippedCount}`);
    console.log('==================================================');
}

function processDirectory(currentPath, langContext) {
    let items = fs.readdirSync(currentPath);
    items.forEach(item => {
        const fullPath = path.join(currentPath, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            if (IGNORE_FOLDERS.includes(item)) return;
            // Só entra em subpastas se não for raiz de outro idioma para não misturar
            if (currentPath !== ROOT_DIR || LANGUAGES.includes(item)) {
                 // Apenas continua a leitura
            }
        } else if (path.extname(item) === '.html' && !IGNORE_FILES.includes(item)) {
            processFile(fullPath, langContext);
        }
    });
}

function processFile(filePath, lang) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');

        // Expressão Regular para achar a Posição 2 que termina no "name" sem ter o "item"
        // Ela procura: "position": 2, "name": "QualquerCoisa" }
        const regex = /"position":\s*2,\s*"name":\s*"([^"]+)"\s*\}/g;

        if (regex.test(content)) {
            // Define a URL base dependendo do idioma
            const baseUrl = lang === 'pt-br'
                ? 'https://www.calculadorasdeenfermagem.com.br/'
                : `https://www.calculadorasdeenfermagem.com.br/${lang}/`;

            // Faz a substituição adicionando a vírgula e a tag "item"
            const newContent = content.replace(regex, `"position": 2,\n              "name": "$1",\n              "item": "${baseUrl}"\n            }`);

            fs.writeFileSync(filePath, newContent, 'utf8');
            filesChangedCount++;
            console.log(`[CORRIGIDO] ${filePath} -> Inserido item: ${baseUrl}`);
        } else {
            filesSkippedCount++;
        }
    } catch (err) {
        console.error(`Erro ao processar ${filePath}: ${err.message}`);
    }
}

start();