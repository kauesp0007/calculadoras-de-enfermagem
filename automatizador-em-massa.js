const fs = require('fs');
const path = require('path');

// =============================================================================
// CONFIGURAÇÕES DO REPOSITÓRIO E IDIOMAS
// =============================================================================
const ROOT_DIR = '.';
const LANGUAGES = ['en', 'es', 'de', 'it', 'fr', 'hi', 'zh', 'ar', 'ja', 'ru', 'ko', 'tr', 'nl', 'pl', 'sv', 'id', 'vi', 'uk'];
const TARGET_FILE = 'global-body-elements.html';

let filesChangedCount = 0;
let filesSkippedCount = 0;

/**
 * Inicia o processo de limpeza
 */
function start() {
    console.log('--- Iniciando Correção do Menu Duplicado ---');
    console.log('--- 🚧 AVISO: Ficheiro da raiz (PT) está protegido e será ignorado ---');

    // 1. Processar APENAS os ficheiros dentro das pastas de idioma
    LANGUAGES.forEach(lang => {
        const langPath = path.join(ROOT_DIR, lang);
        if (fs.existsSync(langPath)) {
            processarArquivo(langPath);
        }
    });

    console.log('\n==================================================');
    console.log('               RELATÓRIO DE EXECUÇÃO');
    console.log('==================================================');
    console.log(`Ficheiros HTML corrigidos (duplicidade removida): ${filesChangedCount}`);
    console.log(`Ficheiros HTML ignorados (já corretos): ${filesSkippedCount}`);
    console.log('==================================================');
}

/**
 * Verifica o ficheiro na pasta e limpa os blocos duplicados
 */
function processarArquivo(pasta) {
    const filePath = path.join(pasta, TARGET_FILE);

    if (fs.existsSync(filePath)) {
        try {
            let content = fs.readFileSync(filePath, 'utf8');
            let fileModified = false;

            // Expressão Regular A: Remove o <nav id="offCanvasMenu"> inteiro
            // O [\s\S]*? garante que apaga todas as linhas até encontrar o </nav> de fecho.
            // O (?:\s*)? remove também o comentário HTML opcional imediatamente acima.
            const navRegex = /(?:\s*)?<nav\s+id="offCanvasMenu"[\s\S]*?<\/nav>\s*/gi;
            if (navRegex.test(content)) {
                content = content.replace(navRegex, '');
                fileModified = true;
            }

            // Expressão Regular B: Remove o <div id="menuOverlay"> e seu comentário
            const overlayRegex = /(?:\s*)?<div\s+id="menuOverlay"[^>]*><\/div>\s*/gi;
            if (overlayRegex.test(content)) {
                content = content.replace(overlayRegex, '');
                fileModified = true;
            }

            if (fileModified) {
                fs.writeFileSync(filePath, content, 'utf8');
                filesChangedCount++;
                console.log(`[CORRIGIDO] ${filePath}`);
            } else {
                filesSkippedCount++;
            }
        } catch (err) {
            console.error(`Erro ao processar ${filePath}: ${err.message}`);
        }
    }
}

start();