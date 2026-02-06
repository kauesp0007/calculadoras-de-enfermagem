const fs = require('fs');
const path = require('path');

// --- CONFIGURAÇÃO ---

// Pastas de idiomas permitidas (onde vamos procurar os footers traduzidos)
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

// Contadores
let modifiedCount = 0;
let unmodifiedCount = 0;

// --- FUNÇÕES ---

function shouldProcessFolder(folderName) {
    if (folderName === '.' || folderName === '') return true;
    if (ignoredFolders.includes(folderName)) return false;
    return languageFolders.includes(folderName);
}

function processFile(filePath, fileName) {
    // --- REGRA DE SEGURANÇA MÁXIMA ---
    // Apenas processa se o arquivo for EXATAMENTE "footer.html"
    if (fileName !== 'footer.html') {
        return;
    }

    try {
        let content = fs.readFileSync(filePath, 'utf8');
        let originalContent = content;

        // REGEX INTELIGENTE (Lógica inalterada):
        // Procura todas as tags <a> que tenham target="_blank"
        content = content.replace(/<a\s+([^>]+)>/gi, (fullTag, attributes) => {

            // 1. Verifica se tem target="_blank"
            if (!/target=["']_blank["']/i.test(attributes)) {
                return fullTag; // Se não tem blank, não mexe
            }

            // 2. Verifica se já tem "noopener"
            if (/noopener/i.test(attributes)) {
                return fullTag; // Se já tem noopener, não mexe
            }

            // 3. Caso tenha target="_blank" mas NÃO tenha noopener:

            // Cenário A: Já existe um atributo rel="..." (ex: rel="nofollow")
            if (/rel=["']([^"']*)["']/i.test(attributes)) {
                // Adiciona noopener noreferrer ao rel existente
                return fullTag.replace(/rel=["']([^"']*)["']/i, 'rel="$1 noopener noreferrer"');
            }

            // Cenário B: Não existe atributo rel
            else {
                // Adiciona rel="noopener noreferrer" logo após o target="_blank"
                return fullTag.replace(/target=["']_blank["']/i, 'target="_blank" rel="noopener noreferrer"');
            }
        });

        if (content !== originalContent) {
            fs.writeFileSync(filePath, content, 'utf8');
            modifiedCount++;
            console.log(`[CORRIGIDO]: ${filePath}`);
        } else {
            unmodifiedCount++;
            // console.log(`[OK - SEM ALTERAÇÃO]: ${filePath}`);
        }

    } catch (err) {
        console.error(`Erro ao processar ${filePath}: ${err.message}`);
    }
}

function scanDirectory(directory) {
    const files = fs.readdirSync(directory);

    files.forEach(file => {
        const fullPath = path.join(directory, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            if (shouldProcessFolder(file)) {
                scanDirectory(fullPath);
            }
        } else {
            processFile(fullPath, file);
        }
    });
}

// --- EXECUÇÃO ---

console.log('--- CORREÇÃO ESPECÍFICA: FOOTER.HTML ---');
console.log('Alvo: Apenas arquivos "footer.html" (Raiz + Idiomas)');
console.log('Ação: Adicionar rel="noopener noreferrer" em links target="_blank"');
console.log('---------------------------------------------------------');

// Inicia varredura na raiz
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
console.log(`Arquivos footer.html Corrigidos: ${modifiedCount}`);
console.log(`Arquivos footer.html Verificados (já estavam ok): ${unmodifiedCount}`);
console.log('\nProcesso concluído.');