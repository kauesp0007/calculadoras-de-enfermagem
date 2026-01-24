const fs = require('fs');
const path = require('path');

// --- CONFIGURAÇÕES DE DIRETÓRIOS E EXCLUSÕES (REGRAS DE MEMÓRIA) ---

const targetDirectories = [
    '.', // Raiz
    'en', 'es', 'de', 'it', 'fr', 'hi', 'zh', 'ar', 'ja',
    'ru', 'ko', 'tr', 'nl', 'pl', 'sv', 'id', 'vi', 'uk'
];

const excludedFolders = ['downloads', 'biblioteca', 'node_modules', '.git', '.vscode', 'img', 'css', 'js', 'docs', 'videos'];

const excludedFiles = [
    'footer.html',
    'menu-global.html',
    'global-body-elements.html',
    'downloads.html',
    'menu-lateral.html',
    '_language_selector.html',
    'googlefc0a17cdd552164b.html'
];

// Estatísticas
let stats = {
    processed: 0,
    modified: 0,
    skipped: 0,
    fixes: {
        fonts: 0,
        langSelector: 0,
        footer: 0,
        comments: 0,
        content: 0
    }
};

// --- FUNÇÃO PRINCIPAL ---

function startCLSOptimization() {
    console.log("Iniciando varredura de Otimização CLS (Web Vitals)...\n");

    targetDirectories.forEach(dir => {
        const fullPath = path.join(__dirname, dir);

        if (fs.existsSync(fullPath)) {
            try {
                const items = fs.readdirSync(fullPath);

                items.forEach(item => {
                    const itemPath = path.join(fullPath, item);
                    const fileStats = fs.statSync(itemPath);

                    if (fileStats.isDirectory()) {
                        if (excludedFolders.includes(item)) return;
                    } else if (fileStats.isFile()) {
                        processFile(itemPath, item);
                    }
                });
            } catch (err) {
                console.error(`Erro ao ler diretório ${dir}:`, err.message);
            }
        }
    });

    printReport();
}

// --- LÓGICA DE PROCESSAMENTO SINGULAR ---

function processFile(filePath, fileName) {
    // 1. Validar extensão .html
    if (path.extname(fileName) !== '.html') return;

    // 2. Validar lista de exclusão
    if (excludedFiles.includes(fileName)) {
        stats.skipped++;
        return;
    }

    try {
        let content = fs.readFileSync(filePath, 'utf8');
        let originalContent = content;
        let fileModified = false;

        // --- APLICAÇÃO DAS REGRAS CLS ---

        // REGRA 1: Fontes (display=swap -> display=optional)
        // Evita FOUT (Flash of Unstyled Text) e realinhamento
        if (content.includes('display=swap')) {
            // Usa Regex global para garantir que pegue todas as ocorrências
            const fontRegex = /(&|&amp;|\?)display=swap/g;
            if (fontRegex.test(content)) {
                content = content.replace(fontRegex, '$1display=optional');
                stats.fixes.fonts++;
                fileModified = true;
            }
        }

        // REGRA 2: Seletor de Idiomas (Reserve Space / Position Absolute)
        // Detecta APENAS containers vazios sem estilo (causa do erro no genograma)
        const badLangSelector = '<div id="language-dropdown-wrapper"></div>';
        const fixedLangSelector = '<div id="language-dropdown-wrapper" style="position: absolute; top: 1.5rem; right: 0; z-index: 1000;"></div>';

        if (content.includes(badLangSelector)) {
            // split/join é mais seguro que replace para strings HTML exatas
            content = content.split(badLangSelector).join(fixedLangSelector);
            stats.fixes.langSelector++;
            fileModified = true;
        }

        // REGRA 3: Rodapé (Fetch Placeholder)
        // Adiciona altura mínima para evitar que a página "brote" no final
        const badFooter = '<div id="footer-placeholder"></div>';
        const fixedFooter = '<div id="footer-placeholder" style="min-height: 500px;"></div>'; // Altura média segura

        if (content.includes(badFooter)) {
            content = content.split(badFooter).join(fixedFooter);
            stats.fixes.footer++;
            fileModified = true;
        }

        // REGRA 4: Seção de Comentários
        // Evita que a lista de comentários empurre o rodapé ao carregar
        // Procura a tag de abertura exata sem style
        const badCommentsHeader = '<section id="page-comments" class="w-full mx-auto mt-8 mb-4 max-w-4xl" data-version="compact-v1">';
        const fixedCommentsHeader = '<section id="page-comments" class="w-full mx-auto mt-8 mb-4 max-w-4xl" data-version="compact-v1" style="min-height: 400px;">';

        if (content.includes(badCommentsHeader)) {
            content = content.split(badCommentsHeader).join(fixedCommentsHeader);
            stats.fixes.comments++;
            fileModified = true;
        }

        // REGRA 5: Conteúdo Dinâmico (#conteudo das calculadoras)
        // Evita que o formulário apareça do nada empurrando elementos
        const badContent = '<div id="conteudo"></div>';
        const fixedContent = '<div id="conteudo" style="min-height: 300px;"></div>';

        if (content.includes(badContent)) {
            content = content.split(badContent).join(fixedContent);
            stats.fixes.content++;
            fileModified = true;
        }

        // --- FINALIZAÇÃO ---

        if (fileModified) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`[CLS FIX] Aplicado em: ${fileName}`);
            stats.modified++;
        } else {
            stats.processed++; // Contado como processado, mas sem necessidade de troca
        }

    } catch (err) {
        console.error(`Erro crítico em ${fileName}:`, err.message);
    }
}

function printReport() {
    console.log("\n===================================================");
    console.log(" RELATÓRIO DE OTIMIZAÇÃO CLS (LAYOUT SHIFT)");
    console.log("===================================================");
    console.log(`Arquivos analisados (sem alteração necessária): ${stats.processed}`);
    console.log(`Arquivos modificados e salvos: ${stats.modified}`);
    console.log(`Arquivos ignorados (exclusão): ${stats.skipped}`);
    console.log("\nDETALHES DAS CORREÇÕES APLICADAS:");
    console.log(`- Fontes (display=optional): ............ ${stats.fixes.fonts}`);
    console.log(`- Seletor de Idioma (Position Fixed): ... ${stats.fixes.langSelector}`);
    console.log(`- Placeholder Rodapé (Min-Height): ...... ${stats.fixes.footer}`);
    console.log(`- Placeholder Comentários (Min-Height): . ${stats.fixes.comments}`);
    console.log(`- Placeholder Conteúdo (Min-Height): .... ${stats.fixes.content}`);
    console.log("===================================================\n");
}

// Executar
startCLSOptimization();