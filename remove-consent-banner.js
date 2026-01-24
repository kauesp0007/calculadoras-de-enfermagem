const fs = require('fs');
const path = require('path');

// =============================================================================
// CONFIGURAÇÃO DO AUTOMATIZADOR
// =============================================================================

// 1. Escopo de Varredura (Idiomas + Raiz)
const targetFolders = [
    '.', // Raiz (Português)
    'en', 'es', 'de', 'it', 'fr', 'hi', 'zh', 'ar',
    'ja', 'ru', 'ko', 'tr', 'nl', 'pl', 'sv', 'id', 'vi', 'uk'
];

// 2. Exclusões (Pastas e Arquivos Protegidos)
// Nota: Como o script busca especificamente por 'index.html' dentro das pastas alvo,
// as exclusões de arquivos específicos (footer.html, etc.) já são naturalmente respeitadas,
// mas mantemos a lista para referência e integridade lógica caso o escopo mude.
const ignoredFolders = ['downloads', 'biblioteca', 'node_modules', '.git'];
const protectedFiles = [
    'footer.html',
    'menu-global.html',
    'global-body-elements.html',
    'downloads.html',
    'menu-lateral.html',
    '_language_selector.html',
    'googlefc0a17cdd552164b.html'
];

// 3. Bloco de Código a Remover (String Exata)
// Usamos uma expressão regular flexível para lidar com possíveis variações de espaçamento/quebra de linha,
// mas focada na estrutura específica fornecida.
const bannerRegex = /<style>\s*#consent-banner\s*\{[\s\S]*?\}[\s\S]*?<\/style>\s*<div id="consent-banner"[\s\S]*?<\/div>\s*<script>\s*\(function\s*\(\)\s*\{[\s\S]*?var\s*banner\s*=\s*document\.getElementById\('consent-banner'\);[\s\S]*?\}\)\(\);\s*<\/script>/mi;

// Contadores para o Relatório Final
let filesChanged = 0;
let filesUnchanged = 0;

// =============================================================================
// FUNÇÕES DO AUTOMATIZADOR
// =============================================================================

function processFile(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');

        // Verifica se o arquivo contém o bloco duplicado
        if (bannerRegex.test(content)) {
            // Remove o bloco substituindo por uma string vazia
            const newContent = content.replace(bannerRegex, '');

            // Remove linhas em branco extras que podem ter sobrado (opcional, mas estético)
            // const cleanContent = newContent.replace(/^\s*[\r\n]/gm, '');

            fs.writeFileSync(filePath, newContent, 'utf8');
            console.log(`[ALTERADO] Bloco removido em: ${filePath}`);
            filesChanged++;
        } else {
            // console.log(`[OK] Nada a alterar em: ${filePath}`); // Comentado para reduzir ruído
            filesUnchanged++;
        }
    } catch (err) {
        console.error(`[ERRO] Falha ao processar ${filePath}: ${err.message}`);
    }
}

function scanDirectory(directory) {
    // Verifica se a pasta existe antes de tentar ler
    if (!fs.existsSync(directory)) return;

    // Foca apenas no arquivo index.html dentro do diretório alvo
    const targetFile = 'index.html';
    const filePath = path.join(directory, targetFile);

    // Verifica exclusões de segurança (caso index.html estivesse na lista de protegidos, o que não é o padrão, mas por segurança)
    if (protectedFiles.includes(targetFile)) return;

    if (fs.existsSync(filePath)) {
        processFile(filePath);
    }
}

// =============================================================================
// EXECUÇÃO
// =============================================================================

console.log('--- Iniciando Remoção de Banner de Consentimento Duplicado ---');

// Itera sobre as pastas alvo
targetFolders.forEach(folder => {
    // Evita processar pastas ignoradas se elas estiverem na lista de targets (segurança)
    if (ignoredFolders.includes(folder)) return;

    scanDirectory(folder);
});

// Relatório Final
console.log('\n==================================================');
console.log('RELATÓRIO FINAL');
console.log('==================================================');
console.log(`Arquivos Alterados (Banner Removido): ${filesChanged}`);
console.log(`Arquivos Não Alterados (Banner não encontrado): ${filesUnchanged}`);
console.log('==================================================');