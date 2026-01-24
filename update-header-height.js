const fs = require('fs');
const path = require('path');

// =============================================================================
// CONFIGURAÇÃO DO AUTOMATIZADOR
// =============================================================================

// 1. Escopo de Varredura (Idiomas + Raiz)
const targetFolders = [
    '.', // Raiz (Português)
    'en', 'es', 'de', 'it', 'fr', 'hi', 'zh', 'ar',
    'ja', 'ru', 'ko', 'tr', 'nl', 'pl', 'sv', 'id', 'vi', 'uk'
];

// 2. Definição da Alteração
// String exata a ser procurada
const searchString = '<div id="global-header-container" style="min-height: 70px;"></div>';
// String exata para substituição
const replaceString = '<div id="global-header-container" style="min-height: 96px;"></div>';

// 3. Contadores para o Relatório Final
let filesChanged = 0;
let filesUnchanged = 0;

// =============================================================================
// FUNÇÕES DO AUTOMATIZADOR
// =============================================================================

function processFile(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');

        // Verifica se o arquivo contém a linha exata (70px)
        if (content.includes(searchString)) {

            // Realiza a substituição
            const newContent = content.replace(searchString, replaceString);

            fs.writeFileSync(filePath, newContent, 'utf8');
            console.log(`[ALTERADO] Altura ajustada em: ${filePath}`);
            filesChanged++;

        } else {
            // Se já estiver com 96px ou não tiver a linha, não faz nada
            // console.log(`[OK] Sem alteração necessária em: ${filePath}`);
            filesUnchanged++;
        }

    } catch (err) {
        console.error(`[ERRO] Falha ao processar ${filePath}: ${err.message}`);
    }
}

function scanDirectory(directory) {
    // Verifica se a pasta existe antes de tentar ler
    if (!fs.existsSync(directory)) return;

    // Foca estritamente no arquivo index.html dentro do diretório alvo
    const targetFile = 'index.html';
    const filePath = path.join(directory, targetFile);

    // Se o arquivo index.html existir, processa-o
    if (fs.existsSync(filePath)) {
        processFile(filePath);
    }
}

// =============================================================================
// EXECUÇÃO
// =============================================================================

console.log('--- Iniciando Atualização de Altura do Header (70px -> 96px) ---');

// Itera sobre as pastas alvo
targetFolders.forEach(folder => {
    // Pastas ignoradas por padrão no sistema (segurança adicional)
    if (folder === 'downloads' || folder === 'biblioteca') return;

    scanDirectory(folder);
});

// Relatório Final
console.log('\n==================================================');
console.log('RELATÓRIO FINAL');
console.log('==================================================');
console.log(`Arquivos Alterados: ${filesChanged}`);
console.log(`Arquivos Não Alterados: ${filesUnchanged}`);
console.log('==================================================');