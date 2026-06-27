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

// Lista de regras de otimização cirúrgica no HTML
const optimizationRules = [
    {
        name: "1. Limpeza de Tags Fantasmas (Erro de Árvore DOM)",
        // Procura os dois </div> sobrando entre o language-placeholder e o <main>
        regex: /(<div id="language-selector-placeholder"[^>]*>[\s\S]*?<\/div>)\s*<\/div>\s*<\/div>\s*(<main)/g,
        replacement: `$1\n  $2`
    },
    {
        name: "2. Anti-CLS do #conteudo (Reserva de Espaço Dinâmica)",
        // Procura a div de conteúdo vazia e injeta o min-height para reservar espaço na tela
        regex: /<div id="conteudo">/g,
        replacement: `<div id="conteudo" style="min-height: 60vh; width: 100%;">`
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
        
        // Passa por todas as regras de otimização e aplica se necessário
        optimizationRules.forEach(rule => {
            if (rule.regex.test(newContent)) {
                newContent = newContent.replace(rule.regex, rule.replacement);
                appliedFixes.push(rule.name);
            }
        });
        
        // Se houve alguma alteração real, salva o arquivo
        if (newContent !== originalContent) {
            fs.writeFileSync(filePath, newContent, 'utf8');
            filesModified++;
            const msg = `[OTIMIZADO] Correções HTML (${appliedFixes.join(' | ')}) aplicadas em: ${filePath}`;
            console.log(msg);
            logMessages.push(msg);
        } else {
            filesUnchanged++;
            // Silencia os ignorados no terminal para não poluir, mas conta nos números
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

console.log("Iniciando Otimizador Estrutural nos arquivos HTML...\n");

// 1. Inicia o Scanner na Raiz
scanDirectory(__dirname, true);

// 2. Monta o log detalhado
const relatorioTxt = `
================ RELATÓRIO FINAL: OTIMIZADOR ESTRUTURAL HTML ================
Data da execução: ${new Date().toLocaleString('pt-BR')}

RESUMO:
- Arquivos .html OTIMIZADOS: ${filesModified}
- Arquivos .html IGNORADOS (Já estavam limpos): ${filesUnchanged}

CORREÇÕES APLICADAS NO PACOTE:
1. Limpeza de Tags Fantasmas: Remoção de </div> perdidos que quebravam o DOM.
2. Anti-CLS do #conteudo: Adição de style="min-height: 60vh;" para evitar pulos no carregamento do JavaScript.

LOG DE ARQUIVOS ALTERADOS:
${logMessages.join('\n')}
=============================================================================
`;

// 3. Salva o arquivo de texto
const logPath = path.join(__dirname, 'relatorio_html_estrutural.txt');
fs.writeFileSync(logPath, relatorioTxt, 'utf8');

// 4. Imprime no terminal
console.log("\n================ RELATÓRIO FINAL ================");
console.log(`Arquivos HTML OTIMIZADOS: ${filesModified}`);
console.log(`Arquivos que não precisaram de alterações: ${filesUnchanged}`);
console.log(`\nUm log completo foi salvo em: relatorio_html_estrutural.txt`);
console.log("=================================================");
