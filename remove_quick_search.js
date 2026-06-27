const fs = require('fs');
const path = require('path');

// Pastas de idiomas baseadas nas regras do usuário
const languageFolders = [
    'en', 'es', 'de', 'it', 'fr', 'hi', 'zh', 'ar', 'ja', 
    'ru', 'ko', 'tr', 'nl', 'pl', 'sv', 'id', 'vi', 'uk'
];

// O bloco de CSS EXATO que precisa ser removido
const cssToRemoveRegex = /#quick-search-wrapper\s*{\s*position:\s*absolute;\s*left:\s*1\.5rem;\s*z-index:\s*95;\s*width:\s*260px;\s*max-width:\s*calc\(100%\s*-\s*3rem\);\s*display:\s*none;\s*}\s*#quick-search-input\s*{\s*width:\s*100%;\s*padding:\s*0\.5rem\s*0\.75rem;\s*border-radius:\s*10px;\s*border:\s*1px\s*solid\s*#e5e7eb;\s*box-shadow:\s*0\s*6px\s*18px\s*rgba\(10,\s*35,\s*77,\s*0\.06\);\s*background:\s*white;\s*outline:\s*none;\s*font-size:\s*0\.95rem;\s*}\s*#quick-search-suggestions\s*{\s*margin-top:\s*6px;\s*list-style:\s*none;\s*padding:\s*0\.25rem;\s*background:\s*white;\s*border-radius:\s*8px;\s*box-shadow:\s*0\s*12px\s*30px\s*rgba\(10,\s*35,\s*77,\s*0\.08\);\s*max-height:\s*240px;\s*overflow-y:\s*auto;\s*border:\s*1px\s*solid\s*#e6edf3;\s*}\s*#quick-search-suggestions\s*li\s*{\s*padding:\s*0\.45rem\s*0\.6rem;\s*cursor:\s*pointer;\s*border-radius:\s*6px;\s*font-size:\s*0\.9rem;\s*color:\s*#0f172a;\s*}\s*#quick-search-suggestions\s*li:hover,\s*#quick-search-suggestions\s*li\[aria-selected="true"\]\s*{\s*background:\s*#f1f5f9;\s*}\s*@media\s*\(max-width:\s*640px\)\s*{\s*#quick-search-wrapper\s*{\s*left:\s*1rem;\s*right:\s*1rem;\s*width:\s*auto;\s*}\s*#top-controls-wrapper\s*{\s*flex-direction:\s*column;\s*align-items:\s*flex-start;\s*padding:\s*0\s*1rem\s*!important;\s*}\s*#search-wrapper\s*{\s*max-width:\s*100%;\s*width:\s*100%;\s*margin-bottom:\s*0\.5rem;\s*}\s*}/g;

// O bloco de JS EXATO (initQuickSearch) que causa o Reflow Forçado e precisa ser removido
const jsToRemoveRegex = /<script>\s*\(\s*function\s*initQuickSearch\(\)\s*{[\s\S]*?<\/script>/g;

// Pastas que NÃO DEVEM ser avaliadas
const ignoredFolders = ['downloads', 'biblioteca', 'blog', 'node_modules', '.git'];

// Arquivos que NÃO DEVEM ser alterados em hipótese alguma
const ignoredFiles = [
    'footer.html', 'menu-global.html', 'global-body-elements.html', 
    'downloads.html', 'menu-lateral.html', '_language_selector.html', 
    'googlefc0a17cdd552164b.html'
];

let filesModified = 0;
let filesUnchanged = 0;

function processFile(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;
        
        // 1. Remove o bloco CSS (se existir)
        if (cssToRemoveRegex.test(content)) {
            content = content.replace(cssToRemoveRegex, '');
            modified = true;
        }

        // 2. Remove o bloco JS do initQuickSearch (se existir)
        if (jsToRemoveRegex.test(content)) {
            content = content.replace(jsToRemoveRegex, '');
            modified = true;
        }
        
        // Se alguma modificação foi feita, salva o arquivo
        if (modified) {
            fs.writeFileSync(filePath, content, 'utf8');
            filesModified++;
            console.log(`[LIMPO] CSS e/ou JS do Quick Search removido de: ${filePath}`);
        } else {
            filesUnchanged++;
        }
    } catch (err) {
        console.error(`Erro ao processar arquivo ${filePath}:`, err);
    }
}

function scanDirectory(dirPath, isRoot = false) {
    const items = fs.readdirSync(dirPath);

    for (const item of items) {
        const fullPath = path.join(dirPath, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            // Ignora pastas proibidas ou pastas do sistema que comecem com . (ex: .github)
            if (ignoredFolders.includes(item) || item.startsWith('.')) {
                continue;
            }
            
            // Se estamos na raiz, só entramos nas pastas de idioma autorizadas
            if (isRoot) {
                if (languageFolders.includes(item)) {
                    scanDirectory(fullPath, false);
                }
            }
        } else if (stat.isFile() && item === 'index.html') {
             // Só processa arquivos index.html e verifica se não está na lista negra
             if (!ignoredFiles.includes(item)) {
                 processFile(fullPath);
             }
        }
    }
}

console.log("Iniciando varredura cirúrgica nos arquivos index.html para remover o CSS e JS do Quick Search...\n");

// Inicia a varredura a partir do diretório atual (raiz do repositório)
scanDirectory(__dirname, true);

// Exibe o log final conforme a regra solicitada
console.log("\n================ RELATÓRIO FINAL ================");
console.log(`Arquivos index.html LIMPOS com sucesso: ${filesModified}`);
console.log(`Arquivos index.html que JÁ ESTAVAM LIMPOS: ${filesUnchanged}`);
console.log("=================================================");