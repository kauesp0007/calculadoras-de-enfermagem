const fs = require('fs');
const path = require('path');

// --- CONFIGURAÇÃO ---

// Pastas que NÃO devem ser varridas (conforme suas regras e diretrizes do diretório)
const EXCLUDED_DIRS = [
    '.git',
    'node_modules',
    'blog',
    'scripts',
    'posts-markdown',
    'downloads',
    'biblioteca',
    'img',
    'css',
    'docs',
    'videos',
    'json', // Geralmente não tem html, mas por segurança
    'dist'
];

// Arquivos HTML específicos que NÃO devem ser alterados (Modularização/Templates)
const EXCLUDED_FILES = [
    'footer.html',
    'menu-global.html',
    'global-body-elements.html',
    'downloads.html',
    'menu-lateral.html',
    '_language_selector.html',
    'googlefc0a17cdd552164b.html',
    'downloads.template.html', // Templates costumam ter estruturas diferentes
    'item.template.html'
];

// O Bloco exato a ser inserido (respeitando a indentação e ordem pedida)
const CORRECT_BLOCK = `
  <link rel="dns-prefetch" href="//googleads.g.doubleclick.net">
  <link rel="dns-prefetch" href="//pagead2.googlesyndication.com">
  <link rel="preconnect" href="https://www.googletagmanager.com">
  <link rel="preconnect" href="https://cdnjs.cloudflare.com" crossorigin="">
  <link rel="preload" href="menu-global.html" as="fetch" crossorigin="">
  <link rel="preload" href="global-body-elements.html" as="fetch" crossorigin="">
`;

// Contadores para o Log
let filesModified = 0;
let filesSkipped = 0; // Arquivos válidos mas que não puderam ser alterados (erro de padrão)
let filesTotal = 0;
const errorLog = []; // Lista de arquivos que falharam na regex

// --- FUNÇÕES ---

/**
 * Função recursiva para percorrer diretórios
 */
function walkDir(dir) {
    const list = fs.readdirSync(dir);

    list.forEach(item => {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            // Verifica se a pasta está na lista de exclusão
            if (!EXCLUDED_DIRS.includes(item)) {
                walkDir(fullPath);
            }
        } else {
            // Verifica se é HTML e se não está na lista de exclusão de arquivos
            if (item.endsWith('.html') && !EXCLUDED_FILES.includes(item)) {
                processFile(fullPath);
            }
        }
    });
}

/**
 * Função que processa um único arquivo HTML
 */
function processFile(filePath) {
    filesTotal++;
    let content = fs.readFileSync(filePath, 'utf8');

    // Regex para encontrar <head> (case insensitive)
    // Encontra a tag exata <head>
    const headRegex = /<head>/i;

    // Regex para encontrar <meta charset="UTF-8">
    // Lida com espaços extras e aspas simples ou duplas, case insensitive
    const charsetRegex = /<meta\s+charset=["']?UTF-8["']?>/i;

    const headMatch = content.match(headRegex);
    const charsetMatch = content.match(charsetRegex);

    // Validação: Se não achar <head> ou <meta charset>, não mexe
    if (!headMatch || !charsetMatch) {
        filesSkipped++;
        errorLog.push(`${filePath} (Tag <head> ou <meta charset> não encontrada)`);
        return;
    }

    // Posição onde acaba <head> (ex: <html><head>... o index aponta pro < de head, somamos o length para pegar apos o >)
    const startInsertIndex = headMatch.index + headMatch[0].length;

    // Posição onde começa <meta charset...>
    const endInsertIndex = charsetMatch.index;

    // Segurança: Se o <meta> vier antes do <head> por algum motivo bizarro, ignora
    if (startInsertIndex >= endInsertIndex) {
        filesSkipped++;
        errorLog.push(`${filePath} (Estrutura inválida: meta charset aparece antes ou dentro do head tag de forma irregular)`);
        return;
    }

    // --- A CIRURGIA ---
    // 1. Pega tudo do começo do arquivo até o fim da tag <head>
    const partBefore = content.substring(0, startInsertIndex);

    // 2. Pega tudo do começo da tag <meta charset> até o fim do arquivo
    const partAfter = content.substring(endInsertIndex);

    // 3. Monta o novo conteúdo
    // Adicionamos uma quebra de linha extra antes do meta para garantir separação visual
    const newContent = partBefore + CORRECT_BLOCK + '\n  ' + partAfter;

    // Escreve no arquivo apenas se houve mudança (para evitar touches desnecessários, embora aqui sempre reescrevemos o bloco)
    // Mas como estamos substituindo um bloco desconhecido pelo conhecido, sempre salvamos.
    fs.writeFileSync(filePath, newContent, 'utf8');
    filesModified++;
}

// --- EXECUÇÃO ---

console.log('Iniciando varredura e correção das tags <head>...');
console.log('------------------------------------------------');

try {
    // Começa da raiz atual
    walkDir('./');

    console.log('\n--- RELATÓRIO FINAL ---');
    console.log(`Arquivos analisados (elegíveis): ${filesTotal}`);
    console.log(`Arquivos modificados com sucesso: ${filesModified}`);

    if (errorLog.length > 0) {
        console.log(`\nArquivos NÃO modificados (Padrão HTML não encontrado): ${filesSkipped}`);
        console.log('Lista de arquivos ignorados por erro de estrutura:');
        errorLog.forEach(f => console.log(` - ${f}`));
    } else {
        console.log(`Arquivos com erro de estrutura: 0`);
    }

    console.log('\nConcluído.');

} catch (error) {
    console.error('Erro fatal durante a execução:', error);
}