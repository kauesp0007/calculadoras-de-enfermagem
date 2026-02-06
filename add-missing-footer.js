const fs = require('fs');
const path = require('path');

// --- CONFIGURAÇÃO ---

// O bloco EXATO que você pediu para inserir
const footerBlockToInject = `
<div id="footer-placeholder"></div>
<script>
    fetch("footer.html") // 1. Busca o arquivo
      .then((response) => response.text()) // 2. Converte a resposta para texto (HTML)
      .then((data) => {
        // 3. Insere o HTML dentro do seu placeholder
        document.getElementById("footer-placeholder").innerHTML = data;
      });
</script>`;

// Pastas de idiomas permitidas para varredura
const languageFolders = [
    'en', 'es', 'fr', 'it', 'de', 'hi', 'zh', 'ja', 'ru',
    'ko', 'tr', 'nl', 'pl', 'sv', 'id', 'vi', 'uk', 'ar'
];

// Pastas explicitamente ignoradas
const ignoredFolders = [
    'downloads',
    'biblioteca',
    'node_modules',
    '.git',
    '.github',
    'img',
    'docs',
    'videos',
    'public',
    'assets'
];

// Arquivos explicitamente ignorados
const ignoredFiles = [
    'footer.html',
    'menu-global.html',
    'global-body-elements.html',
    'downloads.html',
    'menu-lateral.html',
    '_language_selector.html',
    'googlefc0a17cdd552164b.html'
];

// Contadores e Logs
let addedCount = 0;
let skippedCount = 0;
const skippedLog = [];

// --- FUNÇÕES ---

function shouldProcessFolder(folderName) {
    if (folderName === '.' || folderName === '') return true;
    if (ignoredFolders.includes(folderName)) return false;
    return languageFolders.includes(folderName);
}

function processFile(filePath, fileName) {
    // Ignorar se não for .html
    if (path.extname(fileName) !== '.html') {
        return;
    }

    // Ignorar arquivos da lista negra
    if (ignoredFiles.includes(fileName)) {
        skippedCount++;
        skippedLog.push(`${filePath} -> Ignorado (Lista de exclusão)`);
        return;
    }

    try {
        const content = fs.readFileSync(filePath, 'utf8');

        // VERIFICAÇÃO CRÍTICA:
        // Se o arquivo JÁ TEM o placeholder, não faz nada (evita duplicação)
        if (content.includes('id="footer-placeholder"')) {
            skippedCount++;
            // skippedLog.push(`${filePath} -> Já possui footer`); // Descomente se quiser logar os que já tem
            return;
        }

        // Se não tem footer, procura o fechamento do body
        if (content.includes('</body>')) {
            // Injeta o bloco ANTES do </body>
            const newContent = content.replace('</body>', `${footerBlockToInject}\n</body>`);

            fs.writeFileSync(filePath, newContent, 'utf8');
            addedCount++;
            console.log(`[ADICIONADO]: ${filePath}`);
        } else {
            skippedCount++;
            skippedLog.push(`${filePath} -> Erro: Tag </body> não encontrada para injeção.`);
        }

    } catch (err) {
        console.error(`Erro ao processar arquivo ${filePath}: ${err.message}`);
    }
}

function scanDirectory(directory) {
    const files = fs.readdirSync(directory);

    files.forEach(file => {
        const fullPath = path.join(directory, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            if (languageFolders.includes(file)) {
                scanDirectory(fullPath);
            }
        } else {
            processFile(fullPath, file);
        }
    });
}

// --- EXECUÇÃO ---

console.log('--- INICIANDO INJEÇÃO DE FOOTER FALTANTE ---');
console.log('Critério: Arquivos HTML sem id="footer-placeholder"');
console.log('Ação: Inserir bloco de script antes de </body>');
console.log('------------------------------------------');

const rootFiles = fs.readdirSync(__dirname);
rootFiles.forEach(file => {
    const fullPath = path.join(__dirname, file);
    const stat = fs.statSync(fullPath);

    if (stat.isFile()) {
        processFile(fullPath, file);
    } else if (stat.isDirectory()) {
        if (shouldProcessFolder(file)) {
            scanDirectory(fullPath);
        }
    }
});

// --- RELATÓRIO FINAL ---

console.log('\n--- RELATÓRIO FINAL ---');
console.log(`Arquivos com Footer Adicionado: ${addedCount}`);
console.log(`Arquivos Ignorados (Já tinham footer ou exclusão): ${skippedCount}`);

if (addedCount === 0) {
    console.log('\nNenhum arquivo precisou de alteração. Todos parecem ter o footer.');
} else {
    console.log('\nVerifique alguns arquivos modificados para garantir a posição correta.');
}

// Exibe erros de body não encontrado, se houver
const errors = skippedLog.filter(l => l.includes('Erro'));
if (errors.length > 0) {
    console.log('\n--- ATENÇÃO: ARQUIVOS COM ERRO (SEM BODY) ---');
    errors.forEach(log => console.log(log));
}

console.log('\nProcesso concluído.');