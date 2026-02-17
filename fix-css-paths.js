const fs = require('fs');
const path = require('path');

// =============================================================================
// PAINEL DE CONTROLE - REGRAS DE AUTOMAÇÃO
// =============================================================================

// 1. SUBSTITUIÇÃO SIMPLES (REPLACE)
// Se achar o 'target', substitui a linha toda pela 'newTag', mantendo o recuo.
const REGRA_REPLACE = [
    { target: '', newTag: '' },
];

// 2. EXCLUSÃO DE LINHAS (DELETE)
// Se achar a palavra no 'target', a linha inteira é removida do arquivo.
const REGRA_DELETE = [
    { target: 'https://fonts.googleapis.com?display=optional' },
];

// 3. UNIFICAÇÃO / LIMPEZA DE DUPLICADOS (UNIFY)
// Se você colocar o mesmo termo em target1 e target2, o script manterá apenas
// a primeira ocorrência (transformada na newTag) e apagará todas as outras duplicatas.
const REGRA_UNIFY = [
    { target1: 'https://fonts.gstatic.com', target2: 'https://fonts.gstatic.com', newTag: '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="">' }
];

// 4. MOVIMENTAÇÃO DE LUGAR (MOVE)
// Recorta o 'moveTarget' de onde ele estiver e cola logo abaixo do 'anchorTarget'.
const REGRA_MOVE = [
    { moveTarget: '', anchorTarget: '' }
];

// =============================================================================
// CONFIGURAÇÕES DO REPOSITÓRIO (CALCULADORAS DE ENFERMAGEM)
// =============================================================================
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

/**
 * Inicia a varredura na raiz e nas pastas de idiomas
 */
function start() {
    console.log('--- Iniciando Processamento com Inteligência de Unificação ---');

    // Processa arquivos na raiz
    processDirectory(ROOT_DIR, false);

    // Processa pastas de idiomas
    LANGUAGES.forEach(lang => {
        const langPath = path.join(ROOT_DIR, lang);
        if (fs.existsSync(langPath)) processDirectory(langPath, true);
    });

    console.log('\n==================================================');
    console.log('               RELATÓRIO DE EXECUÇÃO');
    console.log('==================================================');
    console.log(`Arquivos alterados: ${filesChangedCount}`);
    console.log(`Arquivos verificados/sem mudança: ${filesSkippedCount}`);
    console.log('==================================================');
}

/**
 * Varre os diretórios buscando apenas arquivos .html
 */
function processDirectory(currentPath, isLangFolder) {
    let items = fs.readdirSync(currentPath);
    items.forEach(item => {
        const fullPath = path.join(currentPath, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            if (IGNORE_FOLDERS.includes(item)) return; // Ignora pastas bloqueadas
            if (isLangFolder) processDirectory(fullPath, true);
        } else if (path.extname(item) === '.html' && !IGNORE_FILES.includes(item)) {
            processFile(fullPath);
        }
    });
}

/**
 * Aplica as 4 lógicas de edição ao conteúdo do arquivo
 */
function processFile(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        let lines = content.split('\n');
        let fileModified = false;

        // "Set" para garantir que a unificação só ocorra uma vez por regra por arquivo
        let unificacoesExecutadas = new Set();

        // PASSO 1: UNIFICAR, DELETAR E SUBSTITUIR (Linha por Linha)
        lines = lines.map((line) => {

            // Lógica de Unificação (Trata duplicados idênticos ou diferentes)
            for (let i = 0; i < REGRA_UNIFY.length; i++) {
                const r = REGRA_UNIFY[i];
                if (!r.target1 || !r.target2) continue;

                if (line.includes(r.target1) || line.includes(r.target2)) {
                    // Se é a PRIMEIRA vez que achamos um alvo desta regra no arquivo
                    if (!unificacoesExecutadas.has(i)) {
                        unificacoesExecutadas.add(i);
                        fileModified = true;
                        const indent = line.match(/^(\s*)/)[0];
                        return `${indent}${r.newTag}`;
                    } else {
                        // Se já achamos antes, esta linha é a duplicata: apaga.
                        fileModified = true;
                        return null;
                    }
                }
            }

            // Lógica de Exclusão Simples
            for (const r of REGRA_DELETE) {
                if (r.target && line.includes(r.target)) {
                    fileModified = true;
                    return null;
                }
            }

            // Lógica de Substituição Simples
            for (const r of REGRA_REPLACE) {
                if (r.target && line.includes(r.target)) {
                    if (line.trim() !== r.newTag.trim()) {
                        fileModified = true;
                        const indent = line.match(/^(\s*)/)[0];
                        return `${indent}${r.newTag}`;
                    }
                }
            }
            return line;
        }).filter(line => line !== null); // Remove fisicamente as linhas marcadas como null

        // PASSO 2: LÓGICA DE MOVER (Reorganização de Ordem)
        for (const r of REGRA_MOVE) {
            if (r.moveTarget && r.anchorTarget) {
                let moveIdx = lines.findIndex(l => l.includes(r.moveTarget));
                let anchorIdx = lines.findIndex(l => l.includes(r.anchorTarget));

                // Se achou ambos e eles NÃO estão na ordem certa (o alvo deve estar anchorIdx + 1)
                if (moveIdx !== -1 && anchorIdx !== -1 && moveIdx !== anchorIdx + 1) {
                    const lineToMove = lines.splice(moveIdx, 1)[0];
                    // Recalcula o índice da âncora após a remoção da linha
                    anchorIdx = lines.findIndex(l => l.includes(r.anchorTarget));
                    lines.splice(anchorIdx + 1, 0, lineToMove);
                    fileModified = true;
                }
            }
        }

        // SALVAMENTO FINAL
        if (fileModified) {
            fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
            filesChangedCount++;
            console.log(`[ALTERADO] ${filePath}`);
        } else {
            filesSkippedCount++;
        }
    } catch (err) {
        console.error(`Erro ao processar ${filePath}: ${err.message}`);
    }
}

// Execução do script
start();