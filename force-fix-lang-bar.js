const fs = require('fs');
const path = require('path');

// =============================================================================
// CONFIGURAÇÃO
// =============================================================================

// Escopo: Apenas as pastas de idiomas (onde o problema ocorre)
const targetFolders = [
    'en', 'es', 'de', 'it', 'fr', 'hi', 'zh', 'ar',
    'ja', 'ru', 'ko', 'tr', 'nl', 'pl', 'sv', 'id', 'vi', 'uk'
];

// O Regex "Mágico":
// 1. Procura <div id="top-controls-wrapper"
// 2. Aceita qualquer classe ou atributo no meio ([^>]*)
// 3. Procura o atributo style="..." que contenha 'position:relative' (ignorando espaços e quebras de linha)
const searchRegex = /(<div\s+id="top-controls-wrapper"[^>]*?)\s*style="[^"]*?position:\s*relative[^"]*?"/gis;

// O Novo Estilo (Correto e Absoluto)
// Mantém a parte inicial da tag (<div id... class...) e substitui só o style
const newStyle = ' style="position: absolute; top: 1.5rem; right: 0; z-index: 1000; padding-right: 2rem; pointer-events: none;"';

let filesChanged = 0;
let filesScanned = 0;

// =============================================================================
// LÓGICA
// =============================================================================

function processFile(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        filesScanned++;

        // Verifica se o arquivo tem o código problemático
        if (searchRegex.test(content)) {

            // Faz a substituição.
            // $1 recupera a primeira parte da tag (id, class, etc) preservando-a.
            const newContent = content.replace(searchRegex, `$1${newStyle}`);

            fs.writeFileSync(filePath, newContent, 'utf8');
            console.log(`[CORRIGIDO] ${filePath}`);
            filesChanged++;
        } else {
            // console.log(`[OK] ${filePath} - Já estava correto ou padrão diferente.`);
        }

    } catch (err) {
        console.error(`Erro ao processar ${filePath}: ${err.message}`);
    }
}

function scanDirectory(directory) {
    if (!fs.existsSync(directory)) {
        console.log(`[AVISO] Pasta não encontrada: ${directory}`);
        return;
    }

    const targetFile = 'index.html';
    const fullPath = path.join(directory, targetFile);

    if (fs.existsSync(fullPath)) {
        processFile(fullPath);
    }
}

// =============================================================================
// EXECUÇÃO
// =============================================================================

console.log('--- Iniciando Correção Forçada da Barra de Idiomas ---');
console.log('Alvo: index.html nas pastas de tradução');
console.log('Ação: Substituir style="position:relative..." por "position:absolute..."');

targetFolders.forEach(folder => {
    scanDirectory(folder);
});

console.log('\n--- Relatório Final ---');
console.log(`Arquivos Verificados: ${filesScanned}`);
console.log(`Arquivos Corrigidos: ${filesChanged}`);