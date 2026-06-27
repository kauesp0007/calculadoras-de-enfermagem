const fs = require('fs');
const path = require('path');

// Regra: Pastas de idiomas autorizadas
const languageFolders = [
    'en', 'es', 'de', 'it', 'fr', 'hi', 'zh', 'ar', 'ja', 
    'ru', 'ko', 'tr', 'nl', 'pl', 'sv', 'id', 'vi', 'uk'
];

// Regra: Pastas que NÃO DEVEM ser avaliadas
const ignoredFolders = ['downloads', 'biblioteca', 'blog', 'node_modules', '.git'];

// Regra: Arquivos que NÃO DEVEM ser alterados em hipótese alguma
const ignoredFiles = [
    'footer.html', 'menu-global.html', 'global-body-elements.html', 
    'downloads.html', 'menu-lateral.html', '_language_selector.html', 
    'googlefc0a17cdd552164b.html'
];

// Expressões regulares para encontrar o carregamento assíncrono (hack do onload)
const rules = [
    {
        name: "CSS Tailwind (output.css)",
        regex: /<link\s+rel="preload"\s+href="([^"]+output\.css)"\s+as="style"\s+onload="[^"]+"\s*\/?>\s*<noscript>\s*<link\s+rel="stylesheet"\s+href="[^"]+"\s*\/?>\s*<\/noscript>/g,
        replacement: '<link rel="stylesheet" href="$1" />'
    },
    {
        name: "CSS Global (global-styles.css)",
        regex: /<link\s+rel="preload"\s+href="([^"]+global-styles\.css)"\s+as="style"\s+onload="[^"]+"\s*\/?>\s*<noscript>\s*<link\s+rel="stylesheet"\s+href="[^"]+"\s*\/?>\s*<\/noscript>/g,
        replacement: '<link rel="stylesheet" href="$1" />'
    }
];

let filesModified = 0;
let filesUnchanged = 0;
let logMessages = [];

function processFile(filePath) {
    try {
        let originalContent = fs.readFileSync(filePath, 'utf8');
        let newContent = originalContent;
        let appliedFixes = [];
        
        rules.forEach(rule => {
            if (rule.regex.test(newContent)) {
                newContent = newContent.replace(rule.regex, rule.replacement);
                appliedFixes.push(rule.name);
            }
        });
        
        if (newContent !== originalContent) {
            fs.writeFileSync(filePath, newContent, 'utf8');
            filesModified++;
            const msg = `[CORRIGIDO] FOUC/FOUT resolvido em: ${filePath} (${appliedFixes.join(', ')})`;
            console.log(msg);
            logMessages.push(msg);
        } else {
            filesUnchanged++;
        }
    } catch (err) {
        const errMsg = `[ERRO] Falha ao processar arquivo ${filePath}: ${err.message}`;
        console.error(errMsg);
        logMessages.push(errMsg);
    }
}

function scanDirectory(dirPath, isRoot = false) {
    const items = fs.readdirSync(dirPath);

    for (const item of items) {
        const fullPath = path.join(dirPath, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            if (ignoredFolders.includes(item) || item.startsWith('.')) {
                continue;
            }
            if (isRoot) {
                if (languageFolders.includes(item)) {
                    scanDirectory(fullPath, false);
                }
            }
        } else if (stat.isFile() && item.endsWith('.html')) {
             if (!ignoredFiles.includes(item)) {
                 processFile(fullPath);
             }
        }
    }
}

console.log("Iniciando Otimizador de CSS (Remoção do Carregamento Assíncrono)...\n");

scanDirectory(__dirname, true);

const relatorioTxt = `
================ RELATÓRIO FINAL: CORREÇÃO DE FOUC/FOUT ================
Data da execução: ${new Date().toLocaleString('pt-PT')}

RESUMO:
- Arquivos .html OTIMIZADOS: ${filesModified}
- Arquivos .html IGNORADOS: ${filesUnchanged}

MUDANÇA APLICADA:
O método de carregamento do 'output.css' e 'global-styles.css' foi alterado de 
assíncrono (<link rel="preload" onload="...">) para síncrono (<link rel="stylesheet">).
Isto impede que o navegador desenhe a página desconfigurada antes de ter os estilos, 
resolvendo o "piscar" e a troca abrupta de fontes durante o carregamento inicial.

LOG DE ARQUIVOS ALTERADOS:
${logMessages.join('\n')}
========================================================================
`;

const logPath = path.join(__dirname, 'relatorio_css_sincrono.txt');
fs.writeFileSync(logPath, relatorioTxt, 'utf8');

console.log("\n================ RELATÓRIO FINAL ================");
console.log(`Arquivos HTML CORRIGIDOS: ${filesModified}`);
console.log(`Arquivos sem necessidade de alteração: ${filesUnchanged}`);
console.log(`\nUm log completo foi guardado em: relatorio_css_sincrono.txt`);
console.log("=================================================");