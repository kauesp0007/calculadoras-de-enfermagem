const fs = require('fs');
const path = require('path');

// 1. Configurações e Regras de Segurança
const targetLanguages = ['en', 'es', 'de', 'it', 'fr', 'hi', 'zh', 'ar', 'ja', 'ru', 'ko', 'tr', 'nl', 'pl', 'sv', 'id', 'vi', 'uk'];
const ignoredDirs = ['downloads', 'biblioteca', 'blog', 'node_modules', '.git'];
const ignoredFiles = [
    'footer.html',
    'menu-global.html',
    'global-body-elements.html',
    'downloads.html',
    'menu-lateral.html',
    '_language_selector.html',
    'googlefc0a17cdd552164b.html'
];

// Contadores para o Relatório Final
let filesModified = 0;
let filesSkipped = 0; // Ficheiros HTML válidos que já estavam atualizados ou sem body tag
let filesIgnored = 0; // Ficheiros rejeitados pelas regras (nome proibido, não é HTML)

// 2. Expressão Regular Robusta para encontrar o bloco antigo
// Vai procurar desde a div do placeholder até ao fecho do script que contém o fetch do footer.
const regexOldFooterBlock = /<div\s+id="footer-placeholder"><\/div>\s*<script>[^]*?fetch\(["']\/?footer\.html["'][^]*?<\/script>/i;

/**
 * Função para gerar o novo bloco de HTML com base no idioma
 * Inclui correção de rotas para manter a navegação no idioma correto
 */
function generateNewFooterBlock(lang) {
    return `<div id="footer-placeholder"></div>
<script>
  fetch("/footer.html")
    .then(response => response.text())
    .then((data) => {
      document.getElementById("footer-placeholder").innerHTML = data;

      // Corrige os links do footer para manter o usuário no idioma atual
      const footerLinks = document.getElementById("footer-placeholder").querySelectorAll('a[href^="/"]');
      footerLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href === '/') {
            link.setAttribute('href', '/${lang}/'); // Redireciona para a home do idioma
        } else if (!href.startsWith('/img/')) {
            link.setAttribute('href', '/${lang}' + href); // Redireciona para as páginas do idioma
        }
      });

      carregarTraducoes('${lang}', 'footer.json');
      carregarTraducoes('${lang}', 'cookies.json');
    });
</script>`;
}

/**
 * Função recursiva para processar as pastas
 */
function processDirectory(currentPath, lang) {
    if (!fs.existsSync(currentPath)) return;

    const items = fs.readdirSync(currentPath, { withFileTypes: true });

    for (const item of items) {
        const fullPath = path.join(currentPath, item.name);

        if (item.isDirectory()) {
            // Ignora pastas proibidas se elas existirem dentro dos idiomas
            if (!ignoredDirs.includes(item.name)) {
                processDirectory(fullPath, lang);
            }
        } else if (item.isFile()) {
            // Verifica as regras de ficheiro
            if (!item.name.endsWith('.html') || ignoredFiles.includes(item.name)) {
                filesIgnored++;
                continue;
            }

            processFile(fullPath, lang);
        }
    }
}

/**
 * Função para ler, avaliar e modificar o ficheiro
 */
function processFile(filePath, lang) {
    let content = fs.readFileSync(filePath, 'utf8');

    // Se o ficheiro já possui o método de tradução do footer, assumimos que está atualizado
    if (content.includes("carregarTraducoes") && content.includes("'footer.json'")) {
        filesSkipped++;
        return;
    }

    const newBlock = generateNewFooterBlock(lang);
    let modified = false;

    // Tenta encontrar e substituir o bloco antigo
    if (regexOldFooterBlock.test(content)) {
        content = content.replace(regexOldFooterBlock, newBlock);
        modified = true;
    }
    // NOVO: Se não encontrou o bloco antigo, tenta injetar antes do </body>
    else if (content.includes('</body>')) {
        // Verifica se já existe um <div id="footer-placeholder"></div> perdido
        // Se existir, apenas injeta o script. Se não, injeta tudo.
        const stringToInject = content.includes('id="footer-placeholder"')
                                ? newBlock.replace('<div id="footer-placeholder"></div>\n', '')
                                : newBlock;

        content = content.replace('</body>', `${stringToInject}\n</body>`);
        modified = true;
    }

    if (modified) {
        fs.writeFileSync(filePath, content, 'utf8');
        filesModified++;
        console.log(`[ATUALIZADO] ${filePath} -> Idioma: ${lang}`);
    } else {
        // Falha caso não tenha </body> (HTML malformado) e nem o footer antigo
        filesSkipped++;
    }
}

// 3. Inicialização do Script
console.log("🚀 A iniciar a substituição e injeção em massa do Footer Modular...");

// Iterar apenas sobre as pastas de idioma na raiz
for (const lang of targetLanguages) {
    const langDirPath = path.join(__dirname, lang);
    if (fs.existsSync(langDirPath)) {
        console.log(`\nA verificar pasta do idioma: /${lang}/`);
        processDirectory(langDirPath, lang);
    } else {
        console.warn(`[AVISO] Pasta não encontrada na raiz: /${lang}/`);
    }
}

// 4. Relatório Final (Log exigido nas regras)
console.log("\n=================================================");
console.log("🏁 RESUMO DA OPERAÇÃO DE ATUALIZAÇÃO");
console.log("=================================================");
console.log(`📄 Ficheiros atualizados ou injetados com sucesso: ${filesModified}`);
console.log(`⏭️ Ficheiros ignorados por já estarem atualizados ou sem tag </body>: ${filesSkipped}`);
console.log(`🛑 Ficheiros bloqueados pelas regras (nome, tipo, etc): ${filesIgnored}`);
console.log("=================================================\n");