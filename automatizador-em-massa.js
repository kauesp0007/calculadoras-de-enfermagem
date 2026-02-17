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
    { target: '' },
];

// 3. UNIFICAÇÃO / LIMPEZA DE DUPLICADOS (UNIFY)
// Mantém apenas a primeira ocorrência (transformada na newTag) e apaga as duplicatas.
const REGRA_UNIFY = [
    { target1: '<link href="https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@700;900&amp;family=Inter:wght@400;600;700&amp;display=optional&amp;display=optional" rel="stylesheet">', target2: '<link href="https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@400;700&amp;family=Inter:wght@400;700&amp;display=optional" rel="stylesheet">', newTag: '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Nunito+Sans:wght@400;700;900&display=swap" rel="stylesheet">' }
];

// 4. MOVIMENTAÇÃO OU CRIAÇÃO ABAIXO DA ÂNCORA (MOVE / CREATE)
// - Se 'moveTarget' tiver valor: Move a linha existente para baixo da âncora.
// - Se 'moveTarget' estiver vazio e 'newTag' tiver valor: Cria uma linha nova abaixo da âncora.
const REGRA_MOVE = [
    { moveTarget: '', newTag: '', anchorTarget: '' }
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
    console.log('--- Iniciando Processamento Inteligente (Move & Create) ---');

    processDirectory(ROOT_DIR, false);

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
            if (IGNORE_FOLDERS.includes(item)) return;
            if (isLangFolder) processDirectory(fullPath, true);
        } else if (path.extname(item) === '.html' && !IGNORE_FILES.includes(item)) {
            processFile(fullPath);
        }
    });
}

/**
 * Aplica as lógicas de edição ao conteúdo do arquivo
 */
function processFile(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        let lines = content.split('\n');
        let fileModified = false;
        let unificacoesExecutadas = new Set();

        // PASSO 1: UNIFICAR, DELETAR E SUBSTITUIR
        lines = lines.map((line) => {
            for (let i = 0; i < REGRA_UNIFY.length; i++) {
                const r = REGRA_UNIFY[i];
                if (!r.target1 || !r.target2) continue;
                if (line.includes(r.target1) || line.includes(r.target2)) {
                    if (!unificacoesExecutadas.has(i)) {
                        unificacoesExecutadas.add(i);
                        fileModified = true;
                        const indent = line.match(/^(\s*)/)[0];
                        return `${indent}${r.newTag}`;
                    } else {
                        fileModified = true;
                        return null;
                    }
                }
            }

            for (const r of REGRA_DELETE) {
                if (r.target && line.includes(r.target)) {
                    fileModified = true;
                    return null;
                }
            }

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
        }).filter(line => line !== null);

        // PASSO 2: LÓGICA DE MOVER OU CRIAR (Ação Solicitada)
        for (const r of REGRA_MOVE) {
            if (r.anchorTarget) {
                let anchorIdx = lines.findIndex(l => l.includes(r.anchorTarget));

                if (anchorIdx !== -1) {
                    // AÇÃO A: Mover linha existente
                    if (r.moveTarget) {
                        let moveIdx = lines.findIndex(l => l.includes(r.moveTarget));
                        if (moveIdx !== -1 && moveIdx !== anchorIdx + 1) {
                            const lineToMove = lines.splice(moveIdx, 1)[0];
                            anchorIdx = lines.findIndex(l => l.includes(r.anchorTarget));
                            lines.splice(anchorIdx + 1, 0, lineToMove);
                            fileModified = true;
                        }
                    }
                    // AÇÃO B: Criar linha nova (apenas se moveTarget estiver vazio e newTag preenchido)
                    else if (r.newTag) {
                        // Verifica se a linha já existe para não criar duplicatas infinitas
                        const jaExiste = lines.some(l => l.includes(r.newTag.trim()));
                        if (!jaExiste) {
                            const indent = lines[anchorIdx].match(/^(\s*)/)[0];
                            lines.splice(anchorIdx + 1, 0, `${indent}${r.newTag}`);
                            fileModified = true;
                        }
                    }
                }
            }
        }

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

start();