const fs = require('fs');
const path = require('path');

// ==============================================================================
// CONFIGURAÇÕES E DADOS
// ==============================================================================

// Diretórios de idiomas a serem verificados (além da raiz)
const targetFolders = [
    'en', 'es', 'de', 'it', 'fr', 'hi', 'zh', 'ar', 'ja',
    'ru', 'ko', 'tr', 'nl', 'pl', 'sv', 'id', 'vi', 'uk'
];

// Pastas a serem ignoradas completamente
const excludedFolders = ['downloads', 'biblioteca', 'node_modules', '.git', 'img', 'docs', 'videos', 'css', 'js'];

// Arquivos específicos a serem ignorados (conforme suas regras de memória)
const excludedFiles = [
    'footer.html',
    'menu-global.html',
    'global-body-elements.html',
    'downloads.html',
    'menu-lateral.html',
    '_language_selector.html',
    'googlefc0a17cdd552164b.html'
];

// ==============================================================================
// LÓGICA DE REMOÇÃO
// ==============================================================================

// REGEX PARA IDENTIFICAR O BANNER ESPECÍFICO
// Procura por <div id="hilltop-ref-banner"></div>
// A regex permite flexibilidade leve para espaços em branco dentro da tag,
// para garantir que pegue mesmo se houver um espaço extra acidental (ex: <div id="..."> </div>)
// A flag 'g' garante que remova todas as ocorrências se houver mais de uma (embora deva ser único).
const targetRegex = /<div\s+id=["']hilltop-ref-banner["']>\s*<\/div>/gi;

// ==============================================================================
// CONTADORES E LOGS
// ==============================================================================

let stats = {
    processed: 0,
    updated: 0,
    unchanged: 0,
    errors: 0,
    notModifiedList: [] // Lista de arquivos que não precisaram de alteração
};

// ==============================================================================
// FUNÇÕES DO SISTEMA
// ==============================================================================

function processFile(filePath) {
    const fileName = path.basename(filePath);

    // 1. Verificações de segurança (Extensão e Exclusões)
    if (!fileName.endsWith('.html')) return;
    if (excludedFiles.includes(fileName)) return;

    stats.processed++;

    try {
        let content = fs.readFileSync(filePath, 'utf8');

        // 2. Verifica se o arquivo contém o alvo
        if (targetRegex.test(content)) {
            // 3. Remove o código substituindo por string vazia
            const newContent = content.replace(targetRegex, '');

            fs.writeFileSync(filePath, newContent, 'utf8');
            stats.updated++;
        } else {
            // Se não encontrou o banner
            stats.notModifiedList.push(`${filePath} (Código alvo não encontrado)`);
            stats.unchanged++;
        }
    } catch (err) {
        console.error(`❌ Erro ao processar ${filePath}: ${err.message}`);
        stats.errors++;
    }
}

function traverseDirectory(dir) {
    if (!fs.existsSync(dir)) return;

    const items = fs.readdirSync(dir);

    items.forEach(item => {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            // Lógica de pastas: Verifica idiomas e ignora pastas de sistema/assets
            if (targetFolders.includes(item) && !excludedFolders.includes(item)) {
                traverseLanguageFolder(fullPath);
            }
        } else {
            // Lógica de arquivos na raiz
            if (dir === '.' || dir === './') {
                processFile(fullPath);
            }
        }
    });
}

function traverseLanguageFolder(dir) {
    const items = fs.readdirSync(dir);
    items.forEach(item => {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        // Não entra em subpastas dentro dos idiomas (apenas raiz do idioma)
        if (!stat.isDirectory()) {
            processFile(fullPath);
        }
    });
}

// ==============================================================================
// EXECUÇÃO PRINCIPAL
// ==============================================================================

console.log('🚀 Iniciando remoção do banner "hilltop-ref-banner"...');
console.log('-------------------------------------------------------------');

// 1. Processa a raiz
const rootItems = fs.readdirSync('.');
rootItems.forEach(item => {
    const fullPath = path.join('.', item);
    const stat = fs.statSync(fullPath);

    if (stat.isFile()) {
        processFile(fullPath);
    } else if (stat.isDirectory() && targetFolders.includes(item)) {
        // 2. Processa as pastas de idioma
        traverseLanguageFolder(fullPath);
    }
});

// ==============================================================================
// RELATÓRIO FINAL
// ==============================================================================

console.log('\n================ RESUMO DA OPERAÇÃO ================');
console.log(`📂 Arquivos analisados: ${stats.processed}`);
console.log(`✂️  Arquivos limpos (Banner removido): ${stats.updated}`);
console.log(`zzz Arquivos intocados: ${stats.unchanged}`);
console.log(`❌ Erros: ${stats.errors}`);

if (stats.notModifiedList.length > 0) {
    console.log('\n📄 Amostra de arquivos NÃO modificados (pois não tinham o banner):');
    stats.notModifiedList.slice(0, 10).forEach(f => console.log(` - ${f}`));
    if (stats.notModifiedList.length > 10) {
        console.log(`   ... e mais ${stats.notModifiedList.length - 10} arquivos.`);
    }
}

console.log('====================================================');