const fs = require('fs');
const path = require('path');

// Regra: Somente pastas de idiomas, excluindo o PT raiz
const langs = ['en', 'es', 'de', 'it', 'fr', 'hi', 'zh', 'ar', 'ja', 'ru', 'ko', 'tr', 'nl', 'pl', 'sv', 'id', 'vi', 'uk'];

// Regra: Não avaliar ficheiros destas pastas
const excludeDirs = ['downloads', 'biblioteca', 'blog'];

// Regra: Não alterar ficheiros vitais
const excludeFiles = [
    'footer.html', 'menu-global.html', 'global-body-elements.html',
    'downloads.html', 'menu-lateral.html', '_language_selector.html',
    'googlefc0a17cdd552164b.html'
];

let modifiedCount = 0;
let untouchedCount = 0;

// O bloco EXATO que deve ser inserido (respeitando a sua indentação)
const blockToInsert = `<div id="footer-placeholder"></div>
  <script>
    fetch("footer.html")
      .then((response) => response.text())
      .then((data) => {
        document.getElementById("footer-placeholder").innerHTML = data;
      });
  </script>
`;

function cleanAndInsertFooter(content) {
    // 1. Remove qualquer variação existente da div placeholder do footer
    const divRegex = /<div\s+id=["']footer-placeholder["'][^>]*>[\s\S]*?<\/div>/gi;
    let cleanContent = content.replace(divRegex, '');

    // 2. Remove estritamente o bloco fetch do footer (mesmo se estiver junto a outros fetches num mesmo script)
    const fetchRegex = /fetch\(['"]footer\.html['"]\)[\s\S]*?document\.getElementById\(['"]footer-placeholder['"]\)\.innerHTML\s*=\s*[^;]+;\s*\}\);?/gi;
    cleanContent = cleanContent.replace(fetchRegex, '');

    // 3. Remove tags <script> que tenham ficado completamente vazias após a remoção do fetch
    cleanContent = cleanContent.replace(/<script>\s*<\/script>/gi, '');

    // 4. Injeta o bloco formatado exatamente antes da tag de fechamento do body
    if (cleanContent.match(/<\/body>/i)) {
        cleanContent = cleanContent.replace(/<\/body>/i, `${blockToInsert}</body>`);
    } else {
        // Caso excepcional em que a página não possui </body>
        cleanContent += `\n${blockToInsert}`;
    }

    return cleanContent;
}

function processFile(filePath) {
    const fileName = path.basename(filePath);

    // Pula arquivos que não são HTML ou estão na lista de exclusão
    if (!fileName.endsWith('.html') || excludeFiles.includes(fileName)) return;

    const content = fs.readFileSync(filePath, 'utf8');
    const newContent = cleanAndInsertFooter(content);

    // Compara. Se o arquivo já estava idêntico (incluindo padronização de espaços), não altera.
    if (content === newContent) {
        untouchedCount++;
    } else {
        fs.writeFileSync(filePath, newContent, 'utf8');
        modifiedCount++;
        // Log para você acompanhar em tempo real qual arquivo foi padronizado
        console.log(`[Corrigido] ${filePath}`);
    }
}

function scanDirectory(dirPath) {
    if (!fs.existsSync(dirPath)) return;

    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    for (let entry of entries) {
        const fullPath = path.join(dirPath, entry.name);

        if (entry.isDirectory()) {
            if (!excludeDirs.includes(entry.name)) {
                scanDirectory(fullPath);
            }
        } else if (entry.isFile()) {
            processFile(fullPath);
        }
    }
}

console.log('Iniciando varredura e padronização do Footer nos 18 idiomas...\n');

langs.forEach(lang => {
    const langPath = path.join(__dirname, lang);
    scanDirectory(langPath);
});

// Regra: Log final detalhado
console.log('\n=========================================');
console.log('       RESUMO DA AUTOMAÇÃO DO FOOTER       ');
console.log('=========================================');
console.log(`Arquivos alterados (padronizados): ${modifiedCount}`);
console.log(`Arquivos que não precisaram ser alterados: ${untouchedCount}`);
console.log('=========================================\n');