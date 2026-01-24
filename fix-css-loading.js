const fs = require('fs');
const path = require('path');

// =============================================================================
// CONFIGURAÇÃO DO AUTOMATIZADOR (REGRAS ESTRITAS)
// =============================================================================

// 1. Escopo de Varredura (Raiz + Idiomas)
const targetFolders = [
    '.', // Raiz (Português)
    'en', 'es', 'de', 'it', 'fr', 'hi', 'zh', 'ar',
    'ja', 'ru', 'ko', 'tr', 'nl', 'pl', 'sv', 'id', 'vi', 'uk'
];

// 2. Exclusões (Pastas e Arquivos Protegidos)
const ignoredFolders = ['downloads', 'biblioteca', 'node_modules', '.git', '.vscode'];

const protectedFiles = [
    'footer.html',
    'menu-global.html',
    'global-body-elements.html',
    'downloads.html',
    'menu-lateral.html',
    '_language_selector.html',
    'googlefc0a17cdd552164b.html'
];

// 3. Strings de Substituição
// String exata que causa o carregamento tardio (Race Condition)
const searchString = '<link rel="stylesheet" href="global-styles.css" media="print" onload="this.media=\'all\'">';
// String nova para carregamento imediato (Bloqueante de renderização)
const replaceString = '<link rel="stylesheet" href="global-styles.css">';

// 4. Contadores para o Relatório Final
let filesChanged = 0;
let filesUnchanged = 0;
let filesScanned = 0;

// =============================================================================
// LÓGICA DO SCRIPT
// =============================================================================

/**
 * Processa um arquivo individualmente
 */
function processFile(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        filesScanned++;

        // Verifica se o arquivo contém a linha problemática
        if (content.includes(searchString)) {

            // Realiza a substituição global (caso haja mais de uma ocorrência, embora improvável no head)
            const newContent = content.replaceAll(searchString, replaceString);

            fs.writeFileSync(filePath, newContent, 'utf8');
            console.log(`[CORRIGIDO] ${filePath}`);
            filesChanged++;

        } else {
            // Se já estiver corrigido ou não tiver a linha
            filesUnchanged++;
        }

    } catch (err) {
        console.error(`[ERRO] Falha ao ler/escrever ${filePath}: ${err.message}`);
    }
}

/**
 * Varre um diretório específico buscando arquivos HTML válidos
 */
function scanDirectory(directory) {
    // Verifica se a pasta existe
    if (!fs.existsSync(directory)) return;

    try {
        // Lê todos os itens dentro da pasta
        const items = fs.readdirSync(directory);

        items.forEach(item => {
            const fullPath = path.join(directory, item);
            const stat = fs.statSync(fullPath);

            // Se for um diretório e estiver na lista de ignorados, pula
            if (stat.isDirectory()) {
                if (ignoredFolders.includes(item)) {
                    return;
                }
                // Nota: Este script itera sobre a lista 'targetFolders',
                // então não fazemos recursão profunda automática aqui para evitar
                // entrar em pastas não listadas nas regras, a menos que seja subpasta de um idioma.
                // Mas conforme a regra, focamos nos arquivos dentro das pastas listadas.
                return;
            }

            // Se for arquivo
            if (stat.isFile()) {
                // Filtra apenas extensão .html
                if (!item.toLowerCase().endsWith('.html')) return;

                // Filtra arquivos protegidos
                if (protectedFiles.includes(item)) return;

                // Processa o arquivo
                processFile(fullPath);
            }
        });

    } catch (err) {
        console.error(`[ERRO] Falha ao escanear diretório ${directory}: ${err.message}`);
    }
}

// =============================================================================
// EXECUÇÃO
// =============================================================================

console.log('--- INICIANDO CORREÇÃO DE CARREGAMENTO CSS (FOUC FIX) ---');
console.log(`Alvo: Substituir carregamento diferido por carregamento direto.`);
console.log(`Procurando: ${searchString}`);
console.log(`Substituindo por: ${replaceString}`);
console.log('---------------------------------------------------------');

// Itera sobre as pastas definidas nas regras
targetFolders.forEach(folder => {
    // Segurança extra: nunca processar pastas ignoradas mesmo se estiverem no target (não deveria acontecer)
    if (ignoredFolders.includes(folder)) return;

    console.log(`Verificando pasta: ${folder === '.' ? 'Raiz' : folder}...`);
    scanDirectory(folder);
});

// Relatório Final
console.log('\n==================================================');
console.log('RELATÓRIO FINAL');
console.log('==================================================');
console.log(`Total de Arquivos Escaneados: ${filesScanned}`);
console.log(`Arquivos Alterados (Corrigidos): ${filesChanged}`);
console.log(`Arquivos Intactos (Já estavam ok): ${filesUnchanged}`);
console.log('==================================================');