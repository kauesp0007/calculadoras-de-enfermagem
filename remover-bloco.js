const fs = require('fs');
const path = require('path');

// Diretórios permitidos: raiz ('.') e pastas de idiomas
const allowedDirs = [
  '.', 'pt', 'en', 'es', 'de', 'it', 'fr', 'hi', 'zh', 'ar',
  'ja', 'ru', 'ko', 'tr', 'nl', 'pl', 'sv', 'id', 'vi', 'uk'
];

// Pastas estritamente proibidas
const ignoredDirs = [
  'downloads',
  'biblioteca',
  'blog',
  'node_modules',
  '.git'
];

// Arquivos HTML estritamente proibidos em qualquer diretório
const ignoredFiles = [
  'footer.html',
  'menu-global.html',
  'global-body-elements.html',
  'downloads.html',
  'menu-lateral.html',
  '_language_selector.html',
  'googlefc0a17cdd552164b.html'
];

// Usamos Regex para ignorar espaços em branco extras, quebras de linha e tabs.
// Esta regex procura pelo início do footer específico e vai até à tag de fecho </footer>.
// O [\\s\\S]*? captura tudo no meio (incluindo quebras de linha) de forma preguiçosa.
const targetBlockRegex = /<footer\s+class="bg-\[#1A3E74\]\s+text-white\s+py-8">[\s\S]*?<\/footer>/i;

// Contadores para o log final
let filesModifiedCount = 0;
let filesUnchangedCount = 0;

/**
 * Função para processar um ficheiro individual.
 * Lê o ficheiro, procura pelo bloco alvo usando Regex e, se encontrar, remove-o.
 * @param {string} filePath - O caminho completo do ficheiro a ser processado.
 */
function processFile(filePath) {
    try {
        const fileContent = fs.readFileSync(filePath, 'utf8');

        // Verifica se a regex encontra o bloco no ficheiro
        if (targetBlockRegex.test(fileContent)) {
            // Remove o bloco substituindo-o por uma string vazia
            const updatedContent = fileContent.replace(targetBlockRegex, '');
            fs.writeFileSync(filePath, updatedContent, 'utf8');
            filesModifiedCount++;
            console.log(`[ALTERADO] Bloco removido de: ${filePath}`);
        } else {
            filesUnchangedCount++;
            // Pode remover o comentário da linha abaixo para ver TODOS os ficheiros não alterados
            // console.log(`[IGNORADO] Bloco não encontrado em: ${filePath}`);
        }
    } catch (error) {
        console.error(`Erro ao processar o ficheiro ${filePath}:`, error.message);
    }
}

/**
 * Função recursiva para ler directórios e encontrar os ficheiros HTML.
 * @param {string} currentDirPath - O directório actual a ser lido.
 * @param {boolean} isRoot - Indica se estamos no directório raiz.
 */
function scanDirectory(currentDirPath, isRoot = false) {
    try {
        const items = fs.readdirSync(currentDirPath);

        items.forEach(item => {
            const itemPath = path.join(currentDirPath, item);
            const stats = fs.statSync(itemPath);

            if (stats.isDirectory()) {
                // Pula os directórios estritamente proibidos
                if (ignoredDirs.includes(item)) {
                     return;
                }

                if (isRoot) {
                    // Se estamos na raiz, apenas entramos nos directórios permitidos (idiomas)
                    if (allowedDirs.includes(item) && item !== '.') {
                         scanDirectory(itemPath, false);
                    }
                } else {
                     // Já estamos dentro de um directório permitido, continua a varrer
                     scanDirectory(itemPath, false);
                }

            } else if (stats.isFile() && path.extname(item) === '.html') {
                 // É um ficheiro HTML. Verificamos se não é um ficheiro proibido.
                 if (!ignoredFiles.includes(item)) {
                     processFile(itemPath);
                 }
            }
        });
    } catch (error) {
         console.error(`Erro ao ler o directório ${currentDirPath}:`, error.message);
    }
}

// === EXECUÇÃO DO SCRIPT ===

console.log('A iniciar o automatizador de remoção do bloco com Regex...');
console.log('A varrer o directório raiz e as pastas de idiomas permitidas...');

// Inicia a varredura a partir do directório actual (raiz)
scanDirectory('.', true);

// Imprime o relatório final conforme solicitado
console.log('\n=============================================');
console.log('RESUMO DA OPERAÇÃO');
console.log('=============================================');
console.log(`Ficheiros alterados (bloco removido): ${filesModifiedCount}`);
console.log(`Ficheiros que não precisaram de ser alterados: ${filesUnchangedCount}`);
console.log('=============================================');
console.log('Processo concluído com sucesso.');