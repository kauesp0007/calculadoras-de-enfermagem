const fs = require('fs');
const path = require('path');

// Regra: Pastas de idiomas autorizadas
const languageFolders = [
    'en', 'es', 'de', 'it', 'fr', 'hi', 'zh', 'ar', 'ja', 
    'ru', 'ko', 'tr', 'nl', 'pl', 'sv', 'id', 'vi', 'uk'
];

// Regra: Pastas que NÃO DEVEM ser avaliadas
const ignoredFolders = ['downloads', 'blog-templates', 'automacoes', 'biblioteca', 'blog', 'node_modules', '.git'];

// Regra: Arquivos que NÃO DEVEM ser alterados em hipótese alguma
const ignoredFiles = [
    'footer.html', 'menu-global.html', 'global-body-elements.html', 
    'downloads.html', 'menu-lateral.html', '_language_selector.html', 
    'googlefc0a17cdd552164b.html'
];

let filesModified = 0;
let filesUnchanged = 0;
let logMessages = [];

// Expressão regular cirúrgica para encontrar as divs de header e idioma juntas.
// O check previne duplicar o bloco <style> caso já exista.
const targetDivsRegex = /(?:<style id="anti-cls-placeholders">[\s\S]*?<\/style>\s*)?<div id="global-header-container"[^>]*>[\s\S]*?<\/div>\s*<div id="language-selector-placeholder"[^>]*>[\s\S]*?<\/div>/g;

// O bloco de correção que será injetado: Bloqueio síncrono com as exatas medidas do seu global-styles.css
const replacementHTML = `<style id="anti-cls-placeholders">
      #global-header-container { display: block; width: 100%; min-height: 96px; background-color: #fff; }
      @media (max-width: 768px) { #global-header-container { min-height: 60px; } }
      #language-selector-placeholder { display: block; width: 100%; min-height: 48px; background-color: #f9fafb; }
    </style>
    <div id="global-header-container"></div>
    <div id="language-selector-placeholder"></div>`;

function processFile(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        
        if (targetDivsRegex.test(content)) {
            const newContent = content.replace(targetDivsRegex, replacementHTML);
            
            // Só sobrescreve se houve uma mudança real (evita tocar no arquivo se ele já estiver perfeitamente atualizado)
            if (newContent !== content) {
                fs.writeFileSync(filePath, newContent, 'utf8');
                filesModified++;
                const msg = `[CORRIGIDO] CLS prevenido em: ${filePath}`;
                console.log(msg);
                logMessages.push(msg);
            } else {
                filesUnchanged++;
                logMessages.push(`[IGNORADO - JÁ ATUALIZADO] ${filePath}`);
            }
        } else {
            filesUnchanged++;
            logMessages.push(`[IGNORADO - ALVO NÃO ENCONTRADO] ${filePath}`);
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
            // Ignora pastas na lista negra ou ocultas (ex: .git)
            if (ignoredFolders.includes(item) || item.startsWith('.')) {
                continue;
            }
            
            // Se estiver na raiz, só escaneia para dentro se for uma pasta de idioma autorizada
            if (isRoot) {
                if (languageFolders.includes(item)) {
                    scanDirectory(fullPath, false);
                }
            }
        } else if (stat.isFile() && item.endsWith('.html')) { // <-- MUDANÇA AQUI: Avalia qualquer arquivo .html
             // Verifica rigorosamente se o arquivo HTML não está na lista negra
             if (!ignoredFiles.includes(item)) {
                 processFile(fullPath);
             }
        }
    }
}

console.log("Iniciando varredura para injeção da proteção Anti-CLS em TODOS os arquivos .html permitidos...\n");

// 1. Inicia o Scanner na raiz do projeto
scanDirectory(__dirname, true);

// 2. Monta o Log de Relatório
const relatorioTxt = `
================ RELATÓRIO FINAL: CORREÇÃO DE CLS ================
Data da execução: ${new Date().toLocaleString('pt-BR')}

RESUMO:
- Arquivos .html ALTERADOS (Proteção Anti-CLS adicionada): ${filesModified}
- Arquivos .html IGNORADOS (Já atualizados, na lista negra ou alvo não encontrado): ${filesUnchanged}

DETALHES DA CORREÇÃO:
- Altura Desktop Reservada (Header): 96px
- Altura Mobile Reservada (Header): 60px
- Altura Reservada (Idioma): 48px
- Método: Injeção de bloco <style id="anti-cls-placeholders"> síncrono antes das divs alvos.

LOG DE ARQUIVOS AVALIADOS:
${logMessages.join('\n')}
==================================================================
`;

// 3. Salva o arquivo de log (.txt) na raiz do repositório
const logPath = path.join(__dirname, 'relatorio_cls_fix.txt');
fs.writeFileSync(logPath, relatorioTxt, 'utf8');

// 4. Imprime as saídas finais no terminal conforme as regras
console.log("\n================ RELATÓRIO FINAL ================");
console.log(`Arquivos .html CORRIGIDOS (Anti-CLS): ${filesModified}`);
console.log(`Arquivos .html que não precisaram de correção: ${filesUnchanged}`);
console.log(`\nO log completo foi salvo no arquivo: relatorio_cls_fix.txt na raiz do projeto.`);
console.log("=================================================");