const fs = require('fs');
const path = require('path');

// Regra: Pastas de idiomas autorizadas
const languageFolders = [
    'en', 'es', 'de', 'it', 'fr', 'hi', 'zh', 'ar', 'ja', 
    'ru', 'ko', 'tr', 'nl', 'pl', 'sv', 'id', 'vi', 'uk'
];

const ignoredFolders = ['downloads', 'automacoes', 'blog-templates', 'biblioteca', 'blog', 'node_modules', '.git'];

const ignoredFiles = [
    'footer.html', 'menu-global.html', 'global-body-elements.html', 
    'downloads.html', 'menu-lateral.html', '_language_selector.html', 
    'googlefc0a17cdd552164b.html'
];

// Dicionário de CSS Crítico mapeado por idioma (cirúrgico)
const fontDefinitions = {
    'default': `@font-face { font-family: 'Inter'; src: url('/fonts/inter/inter-regular.woff2') format('woff2'); font-weight: 400; font-display: optional; }
    @font-face { font-family: 'Inter'; src: url('/fonts/inter/inter-600.woff2') format('woff2'); font-weight: 600; font-display: optional; }
    @font-face { font-family: 'Inter'; src: url('/fonts/inter/inter-700.woff2') format('woff2'); font-weight: 700; font-display: optional; }
    @font-face { font-family: 'Nunito Sans'; src: url('/fonts/nunito/nunito-regular.woff2') format('woff2'); font-weight: 400; font-display: optional; }
    @font-face { font-family: 'Nunito Sans'; src: url('/fonts/nunito/nunito-700.woff2') format('woff2'); font-weight: 700; font-display: optional; }
    @font-face { font-family: 'Nunito Sans'; src: url('/fonts/nunito/nunito-900.woff2') format('woff2'); font-weight: 900; font-display: optional; }`,
    
    'ar': `@font-face { font-family: 'Arabic'; src: url('/fonts/arabic/arabic-regular.woff2') format('woff2'); font-weight: 400; font-display: optional; }
    @font-face { font-family: 'Arabic'; src: url('/fonts/arabic/arabic-700.woff2') format('woff2'); font-weight: 700; font-display: optional; }`,
    
    'hi': `@font-face { font-family: 'Devanagari'; src: url('/fonts/devanagari/devanagari-regular.woff2') format('woff2'); font-weight: 400; font-display: optional; }
    @font-face { font-family: 'Devanagari'; src: url('/fonts/devanagari/devanagari-700.woff2') format('woff2'); font-weight: 700; font-display: optional; }`,
    
    'zh': `@font-face { font-family: 'Chinese'; src: url('/fonts/chinese/chinese-regular.woff2') format('woff2'); font-weight: 400; font-display: optional; }`,
    
    'ja': `@font-face { font-family: 'Japanese'; src: url('/fonts/japanese/japanese-regular.woff2') format('woff2'); font-weight: 400; font-display: optional; }
    @font-face { font-family: 'Japanese'; src: url('/fonts/japanese/japanese-700.woff2') format('woff2'); font-weight: 700; font-display: optional; }`,
    
    'ko': `@font-face { font-family: 'Korean'; src: url('/fonts/korean/korean-regular.woff2') format('woff2'); font-weight: 400; font-display: optional; }
    @font-face { font-family: 'Korean'; src: url('/fonts/korean/korean-700.woff2') format('woff2'); font-weight: 700; font-display: optional; }`
};

let filesModified = 0;
let filesUnchanged = 0;
let logMessages = [];

function processFile(filePath, currentLang) {
    try {
        let originalContent = fs.readFileSync(filePath, 'utf8');
        let newContent = originalContent;
        let appliedFixes = [];
        
        // Evita duplicar as fontes se o script rodar duas vezes
        if (newContent.includes('id="critical-fonts"')) {
            filesUnchanged++;
            return;
        }

        // Puxa as fontes corretas baseadas no idioma atual da varredura
        const fontRules = fontDefinitions[currentLang] || fontDefinitions['default'];
        const criticalFontsCSS = `<style id="critical-fonts">\n    ${fontRules}\n  </style>\n  `;

        // Regras dinâmicas para reverter o CSS pesado para Assíncrono e injetar as fontes críticas selecionadas
        const rules = [
            {
                name: `Devolver Async ao output.css + Injetar Fontes Críticas (${currentLang})`,
                regex: /<link\s+rel="stylesheet"\s+href="(\/public\/output\.css)"\s*\/?>/g,
                replacement: `${criticalFontsCSS}<link rel="preload" href="$1" as="style" onload="this.onload=null;this.rel='stylesheet'">\n  <noscript><link rel="stylesheet" href="$1"></noscript>`
            },
            {
                name: "Devolver Async ao global-styles.css",
                regex: /<link\s+rel="stylesheet"\s+href="(\/global-styles\.css)"\s*\/?>/g,
                replacement: `<link rel="preload" href="$1" as="style" onload="this.onload=null;this.rel='stylesheet'">\n  <noscript><link rel="stylesheet" href="$1"></noscript>`
            }
        ];

        rules.forEach(rule => {
            if (rule.regex.test(newContent)) {
                newContent = newContent.replace(rule.regex, rule.replacement);
                appliedFixes.push(rule.name);
            }
        });
        
        if (newContent !== originalContent) {
            fs.writeFileSync(filePath, newContent, 'utf8');
            filesModified++;
            const msg = `[OTIMIZADO MOBILE - ${currentLang.toUpperCase()}] Fonte injetada e Renderização desbloqueada em: ${filePath}`;
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

// currentLang armazena o idioma que está a ser processado atualmente
function scanDirectory(dirPath, isRoot = false, currentLang = 'default') {
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
                    // Identifica se a pasta de idioma necessita de uma fonte especial
                    let folderLang = ['ar', 'hi', 'zh', 'ja', 'ko'].includes(item) ? item : 'default';
                    // Entra na pasta enviando o código do idioma mapeado
                    scanDirectory(fullPath, false, folderLang);
                }
            }
        } else if (stat.isFile() && item.endsWith('.html')) {
             if (!ignoredFiles.includes(item)) {
                 processFile(fullPath, currentLang);
             }
        }
    }
}

console.log("Iniciando Otimizador Mobile Dinâmico (Desbloqueio de Renderização + Critical CSS por Idioma)...\n");

// Inicia na raiz com 'default'
scanDirectory(__dirname, true, 'default');

const relatorioTxt = `
================ RELATÓRIO FINAL: OTIMIZAÇÃO MOBILE (DINÂMICO) ================
Data da execução: ${new Date().toLocaleString('pt-PT')}

RESUMO:
- Arquivos .html OTIMIZADOS: ${filesModified}
- Arquivos .html IGNORADOS (Já atualizados): ${filesUnchanged}

MUDANÇA APLICADA:
1. Fontes específicas do idioma foram injetadas DIRETAMENTE no HTML (<style id="critical-fonts">). 
   Diferente do método anterior, agora a injeção respeita o tipo de fonte de cada pasta
   (ex: Árabe nas pastas /ar/, Japonês nas pastas /ja/ e Inter/Nunito no resto).
2. O 'output.css' e 'global-styles.css' voltaram a carregar de forma assíncrona.

LOG DE ARQUIVOS ALTERADOS:
${logMessages.join('\n')}
=================================================================================
`;

const logPath = path.join(__dirname, 'relatorio_mobile_render_dinamico.txt');
fs.writeFileSync(logPath, relatorioTxt, 'utf8');

console.log("\n================ RELATÓRIO FINAL ================");
console.log(`Arquivos HTML CORRIGIDOS: ${filesModified}`);
console.log(`Arquivos sem necessidade de alteração: ${filesUnchanged}`);
console.log(`\nUm log completo foi guardado em: relatorio_mobile_render_dinamico.txt`);
console.log("=================================================");