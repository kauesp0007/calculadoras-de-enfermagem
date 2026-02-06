const fs = require('fs');
const path = require('path');

// --- CONFIGURAÇÃO ---

// String exata a ser buscada (não aceita variações para segurança estrita)
const targetString = '<div id="global-header-container" style="min-height: 70px;"></div>';

// String exata para substituição
const replaceString = '<div id="global-header-container"></div>';

// Pastas de idiomas permitidas para varredura
const languageFolders = [
    'en', 'es', 'fr', 'it', 'de', 'hi', 'zh', 'ja', 'ru',
    'ko', 'tr', 'nl', 'pl', 'sv', 'id', 'vi', 'uk', 'ar'
];

// Pastas explicitamente ignoradas
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

// Arquivos explicitamente ignorados (conforme suas regras de memória)
const ignoredFiles = [
    'footer.html',
    'menu-global.html',
    'global-body-elements.html',
    'downloads.html',
    'menu-lateral.html',
    '_language_selector.html',
    'googlefc0a17cdd552164b.html'
];

// Contadores e Logs
let modifiedCount = 0;
let unmodifiedCount = 0;
const unmodifiedLog = [];

// --- FUNÇÕES ---

function shouldProcessFolder(folderName) {
    // Processar raiz (chamada inicial passará folderName vazio ou '.')
    if (folderName === '.' || folderName === '') return true;

    // Ignorar pastas proibidas
    if (ignoredFolders.includes(folderName)) return false;

    // Processar apenas pastas de idioma ou raiz
    return languageFolders.includes(folderName);
}

function processFile(filePath, fileName) {
    // Ignorar se não for .html
    if (path.extname(fileName) !== '.html') {
        return;
    }

    // Ignorar arquivos da lista negra
    if (ignoredFiles.includes(fileName)) {
        unmodifiedCount++;
        unmodifiedLog.push(`${filePath} -> Ignorado (Lista de exclusão)`);
        return;
    }

    try {
        const content = fs.readFileSync(filePath, 'utf8');

        // Verifica se possui a string exata
        if (content.includes(targetString)) {
            // Realiza a substituição exata apenas daquela linha
            const newContent = content.replace(targetString, replaceString);

            fs.writeFileSync(filePath, newContent, 'utf8');
            modifiedCount++;
            console.log(`[MODIFICADO]: ${filePath}`);
        } else {
            unmodifiedCount++;
            // Verifica se já estava corrigido ou se não usa esse header
            if (content.includes(replaceString)) {
                unmodifiedLog.push(`${filePath} -> Não modificado (Já está corrigido)`);
            } else {
                unmodifiedLog.push(`${filePath} -> Não modificado (String alvo não encontrada)`);
            }
        }
    } catch (err) {
        console.error(`Erro ao ler arquivo ${filePath}: ${err.message}`);
    }
}

function scanDirectory(directory) {
    const files = fs.readdirSync(directory);

    files.forEach(file => {
        const fullPath = path.join(directory, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            // Lógica de recursividade controlada
            // Se estamos na raiz, só entra nas pastas de idiomas permitidas
            // Se já estamos dentro de uma pasta de idioma, não aprofunda mais (estrutura flat dos idiomas)
            // ou segue lógica padrão se houver subpastas permitidas (mas seu site parece flat por idioma)

            const relativePath = path.relative(__dirname, fullPath);

            // Verifica se é uma das pastas permitidas na raiz
            if (languageFolders.includes(file)) {
                scanDirectory(fullPath);
            }
        } else {
            // É arquivo
            processFile(fullPath, file);
        }
    });
}

// --- EXECUÇÃO ---

console.log('--- INICIANDO CORREÇÃO DE CLS (HEADER) ---');
console.log(`Alvo: ${targetString}`);
console.log(`Substituto: ${replaceString}`);
console.log('------------------------------------------');

// Varre a raiz
const rootFiles = fs.readdirSync(__dirname);
rootFiles.forEach(file => {
    const fullPath = path.join(__dirname, file);
    const stat = fs.statSync(fullPath);

    if (stat.isFile()) {
        processFile(fullPath, file);
    } else if (stat.isDirectory()) {
        if (shouldProcessFolder(file)) {
            scanDirectory(fullPath);
        }
    }
});

// --- RELATÓRIO FINAL ---

console.log('\n--- RELATÓRIO FINAL ---');
console.log(`Arquivos Modificados: ${modifiedCount}`);
console.log(`Arquivos Não Modificados (HTML): ${unmodifiedCount}`);
console.log('\n--- DETALHES DOS NÃO MODIFICADOS (Amostra ou Motivo) ---');

// Exibe apenas os primeiros 20 logs de não modificados para não poluir demais o terminal se forem muitos
// Se quiser ver todos, remova o .slice(0, 20)
unmodifiedLog.forEach(log => console.log(log));

console.log('\nProcesso concluído.');