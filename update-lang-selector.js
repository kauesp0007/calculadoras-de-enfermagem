const fs = require('fs');
const path = require('path');

// CONFIGURAÇÕES
const EXCLUDED_DIRS = ['downloads', 'biblioteca', 'blog', 'node_modules', '.git'];
const EXCLUDED_FILES = [
    "footer.html", "menu-global.html", "global-body-elements.html",
    "downloads.html", "menu-lateral.html", "_language_selector.html",
    "googlefc0a17cdd552164b.html"
];

const TARGET_REPLACEMENT = '<div id="language-selector-placeholder"></div>';

// O bloco HTML que o script deve procurar (limpo para regex)
// Utilizamos uma expressão que captura o wrapper e fecha no fechamento do div principal
const TARGET_REGEX = /<div id="language-dropdown-wrapper"[\s\S]*?<\/div>\s*<\/div>/g;

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();

        if (isDirectory) {
            if (!EXCLUDED_DIRS.includes(f)) {
                walkDir(dirPath, callback);
            }
        } else {
            if (f.endsWith('.html') && !EXCLUDED_FILES.includes(f)) {
                callback(dirPath);
            }
        }
    });
}

console.log("--- Iniciando substituição do Seletor de Idiomas ---");
let count = 0;

walkDir('./', (filePath) => {
    let content = fs.readFileSync(filePath, 'utf8');

    if (TARGET_REGEX.test(content)) {
        console.log(`Substituindo em: ${filePath}`);
        let newContent = content.replace(TARGET_REGEX, TARGET_REPLACEMENT);
        fs.writeFileSync(filePath, newContent, 'utf8');
        count++;
    }
});

console.log(`--- Finalizado! ${count} arquivos foram atualizados. ---`);