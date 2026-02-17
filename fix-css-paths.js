const fs = require('fs');
const path = require('path');

// Configurações e Constantes
const ROOT_DIR = '.';
const TARGET_CSS_STRING = 'global-styles.css';
const NEW_LINK_TAG = '<link rel="stylesheet" href="/global-styles.css">';

// Lista de idiomas para verificar
const LANGUAGES = [
    'en', 'es', 'de', 'it', 'fr', 'hi', 'zh', 'ar',
    'ja', 'ru', 'ko', 'tr', 'nl', 'pl', 'sv', 'id', 'vi', 'uk'
];

// Pastas a serem ignoradas (tanto na raiz quanto dentro dos idiomas)
const IGNORE_FOLDERS = ['downloads', 'biblioteca', 'blog', 'node_modules', '.git'];

// Arquivos específicos a serem ignorados
const IGNORE_FILES = [
    'footer.html',
    'menu-global.html',
    'global-body-elements.html',
    'downloads.html',
    'menu-lateral.html',
    '_language_selector.html',
    'googlefc0a17cdd552164b.html'
];

// Contadores para o Log
let filesChangedCount = 0;
let filesSkippedCount = 0; // Arquivos válidos mas que já estavam corretos
let filesIgnoredList = []; // Arquivos que não foram tocados por estarem nas regras de exclusão

/**
 * Função principal que inicia o processo
 */
function start() {
    console.log('--- Iniciando padronização do global-styles.css ---');

    // 1. Processar a Raiz
    processDirectory(ROOT_DIR, false);

    // 2. Processar pastas de idiomas
    LANGUAGES.forEach(lang => {
        const langPath = path.join(ROOT_DIR, lang);
        if (fs.existsSync(langPath)) {
            processDirectory(langPath, true);
        }
    });

    // 3. Gerar Log Final
    console.log('\n==================================================');
    console.log('              RELATÓRIO FINAL');
    console.log('==================================================');
    console.log(`Arquivos alterados com sucesso: ${filesChangedCount}`);
    console.log(`Arquivos verificados (sem alterações necessárias): ${filesSkippedCount}`);
    console.log('--------------------------------------------------');
    console.log(`Arquivos/Caminhos ignorados pelas regras (${filesIgnoredList.length}):`);
    if (filesIgnoredList.length > 0) {
        // Mostra apenas os primeiros 20 para não poluir demais, ou todos se preferir
        filesIgnoredList.forEach(f => console.log(` - [IGNORADO] ${f}`));
    }
    console.log('==================================================');
}

/**
 * Processa um diretório recursivamente ou plano, dependendo da lógica
 * @param {string} currentPath - Caminho atual
 * @param {boolean} isLangFolder - Se estamos dentro de uma pasta de idioma
 */
function processDirectory(currentPath, isLangFolder) {
    let items;
    try {
        items = fs.readdirSync(currentPath);
    } catch (e) {
        console.error(`Erro ao ler diretório: ${currentPath}`);
        return;
    }

    items.forEach(item => {
        const fullPath = path.join(currentPath, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            // Verifica se a pasta está na lista de bloqueios
            if (IGNORE_FOLDERS.includes(item)) {
                filesIgnoredList.push(`${fullPath} (Pasta Bloqueada)`);
                return; // Pula esta pasta
            }

            // Se estamos na raiz, só queremos entrar nas pastas de idiomas (já tratadas no loop principal)
            // Mas se estamos DENTRO de um idioma, podemos ter subpastas (exceto blog que já foi barrada acima)
            if (isLangFolder) {
                processDirectory(fullPath, true);
            }
        } else {
            // É um arquivo
            if (path.extname(item) === '.html') {
                if (IGNORE_FILES.includes(item)) {
                    filesIgnoredList.push(fullPath);
                } else {
                    fixHtmlFile(fullPath);
                }
            }
        }
    });
}

/**
 * Lê, corrige e salva o arquivo HTML
 * @param {string} filePath
 */
function fixHtmlFile(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n');
        let fileModified = false;

        const newLines = lines.map(line => {
            // Verifica se a linha contem "global-styles.css"
            if (line.includes(TARGET_CSS_STRING)) {

                // Verifica a indentação original para manter o código bonito
                const matchIndent = line.match(/^(\s*)/);
                const indent = matchIndent ? matchIndent[1] : '';

                const newLineContent = `${indent}${NEW_LINK_TAG}`;

                // Verifica se a linha JÁ É estritamente igual ao que queremos (ignorando espaços trimados para comparação de conteúdo, mas respeitando indentação na escrita)
                if (line.trim() === NEW_LINK_TAG) {
                    return line; // Já está correto, não mexe
                }

                // Se chegou aqui, tem "global-styles.css" mas está diferente do padrão
                fileModified = true;
                return newLineContent; // Substitui a linha toda
            }
            return line; // Retorna a linha original se não tiver o CSS alvo
        });

        if (fileModified) {
            // Salva apenas se houve mudança
            // Usa '\n' para garantir consistência de quebra de linha
            fs.writeFileSync(filePath, newLines.join('\n'), 'utf8');
            filesChangedCount++;
            console.log(`[ALTERADO] ${filePath}`);
        } else {
            filesSkippedCount++;
        }

    } catch (err) {
        console.error(`Erro ao processar arquivo ${filePath}: ${err.message}`);
        filesIgnoredList.push(`${filePath} (Erro de Leitura/Escrita)`);
    }
}

// Executar
start();