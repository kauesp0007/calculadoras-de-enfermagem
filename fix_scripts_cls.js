const fs = require('fs');
const path = require('path');

// Regra: Pastas de idiomas autorizadas
const languageFolders = [
    'en', 'es', 'de', 'it', 'fr', 'hi', 'zh', 'ar', 'ja', 
    'ru', 'ko', 'tr', 'nl', 'pl', 'sv', 'id', 'vi', 'uk'
];

// Regra: Pastas que NÃO DEVEM ser avaliadas
const ignoredFolders = ['downloads', 'biblioteca', 'blog', 'node_modules', '.git'];

// Lista de regras de otimização cirúrgica
const optimizationRules = [
    {
        name: "1. Anti-CLS da Fonte",
        // Procura o bloco que altera a fonte sem a condicional if
        regex: /\/\/\s*Executar IMEDIATAMENTE para evitar flash de tamanho de fonte[\s\S]*?document\.documentElement\.style\.fontSize\s*=\s*fontSizes\[idx\s*-\s*1\];\s*\}\)\(\);/g,
        replacement: `// Executar IMEDIATAMENTE para evitar flash de tamanho de fonte
(function () {
  const savedFontSize = parseInt(localStorage.getItem("fontSize") || "1", 10);
  // PREVENÇÃO DE CLS: Só reescreve o tamanho da fonte se o usuário realmente tiver alterado o padrão
  if (savedFontSize !== 1) {
    const fontSizes = ["1em", "1.15em", "1.3em", "1.5em", "2em"];
    const idx = Math.min(Math.max(savedFontSize, 1), fontSizes.length);
    document.documentElement.style.fontSize = fontSizes[idx - 1];
  }
})();`
    },
    {
        name: "2. Anti-Reflow do Resize",
        // Procura a injeção forçada do flexbox na barra de acessibilidade e menu
        regex: /const _b\s*=\s*document\.getElementById\("barraAcessibilidade"\);\s*_b\s*&&\s*\(_b\.style\.display\s*=\s*"flex"\);\s*const _n\s*=\s*document\.querySelector\("nav\.desktop-nav"\);\s*_n\s*&&\s*\(_n\.style\.display\s*=\s*"flex"\);/g,
        replacement: `const _b = document.getElementById("barraAcessibilidade");
        // PREVENÇÃO REFLOW: Só escreve no DOM se o estado estiver errado
        if (_b && _b.style.display !== "flex") _b.style.display = "flex";
        const _n = document.querySelector("nav.desktop-nav");
        if (_n && _n.style.display !== "flex") _n.style.display = "flex";`
    },
    {
        name: "3. Anti-Reflow do Scroll (Back to Top)",
        // Procura a leitura e escrita simultânea do evento scroll
        regex: /const _lastScrollY\s*=\s*window\.scrollY;\s*\/\/\s*LEITURA ISOLADA\s*if\s*\(!_ticking\)\s*\{\s*window\.requestAnimationFrame\(\(\)\s*=>\s*\{\s*zTop\.style\.display\s*=\s*_lastScrollY\s*>\s*200\s*\?\s*"block"\s*:\s*"none";\s*\/\/\s*ESCRITA NO QUADRO/g,
        replacement: `if (!_ticking) {
        window.requestAnimationFrame(() => {
          const _lastScrollY = window.scrollY; 
          const newDisplay = _lastScrollY > 200 ? "block" : "none";
          // PREVENÇÃO REFLOW: Só escreve se o estilo realmente for mudar
          if (zTop.style.display !== newDisplay) {
            zTop.style.display = newDisplay; 
          }`
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
        
        // Se houve alguma alteração, salva o arquivo
        if (newContent !== originalContent) {
            fs.writeFileSync(filePath, newContent, 'utf8');
            filesModified++;
            const msg = `[OTIMIZADO] Correções (${appliedFixes.join(', ')}) aplicadas em: ${filePath}`;
            console.log(msg);
            logMessages.push(msg);
        } else {
            filesUnchanged++;
            logMessages.push(`[IGNORADO] Já otimizado: ${filePath}`);
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
            if (isRoot && languageFolders.includes(item)) {
                scanDirectory(fullPath, false);
            }
        } else if (stat.isFile() && item === 'global-scripts.js') {
             processFile(fullPath);
        }
    }
}

console.log("Iniciando Otimizador Mestre nos arquivos global-scripts.js...\n");

// 1. Inicia o Scanner na Raiz
scanDirectory(__dirname, true);

// 2. Monta o log detalhado
const relatorioTxt = `
================ RELATÓRIO FINAL: OTIMIZADOR DE SCRIPTS ================
Data da execução: ${new Date().toLocaleString('pt-BR')}

RESUMO:
- Arquivos global-scripts.js OTIMIZADOS: ${filesModified}
- Arquivos global-scripts.js IGNORADOS (Já estavam limpos): ${filesUnchanged}

CORREÇÕES APLICADAS NO PACOTE:
1. Anti-CLS: Adição de condicional de proteção na Fonte.
2. Anti-Reflow: Proteção de DOM writing no Resize da barra de acessibilidade.
3. Anti-Reflow: Isolamento de leitura e escrita no Scroll do botão Topo.

LOG DE ARQUIVOS:
${logMessages.join('\n')}
========================================================================
`;

// 3. Salva o arquivo de texto
const logPath = path.join(__dirname, 'relatorio_scripts_otimizados.txt');
fs.writeFileSync(logPath, relatorioTxt, 'utf8');

// 4. Imprime no terminal
console.log("\n================ RELATÓRIO FINAL ================");
console.log(`Arquivos global-scripts.js OTIMIZADOS: ${filesModified}`);
console.log(`Arquivos que não precisaram de alterações: ${filesUnchanged}`);
console.log(`\nUm log completo foi salvo em: relatorio_scripts_otimizados.txt`);
console.log("=================================================");