const fs = require('fs');
const path = require('path');

// =============================================================================
// 1. CONFIGURAÇÃO (Regras de Diretório)
// =============================================================================

// Escopo: Apenas pastas de idiomas.
// A raiz (Português) é excluída propositalmente conforme solicitado.
const targetFolders = [
    'en', 'es', 'de', 'it', 'fr', 'hi', 'zh', 'ar',
    'ja', 'ru', 'ko', 'tr', 'nl', 'pl', 'sv', 'id', 'vi', 'uk'
];

// O Novo Wrapper (Abertura da Tag)
// Aplica position:relative e margin-top: 8px conforme solicitado no Bloco B.
// Padroniza o ID para 'top-controls-wrapper' e as classes de layout.
const newOpeningTag = '<div id="top-controls-wrapper" class="flex justify-between items-center w-full gap-4" style="position:relative; padding:0 2rem; margin-top: 8px;">';

let filesChanged = 0;
let filesScanned = 0;
let filesIgnored = 0;

// =============================================================================
// 2. LÓGICA DO SCRIPT
// =============================================================================

function processFile(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        filesScanned++;

        // Verificação de Segurança: Se já tiver o estilo exato, pula.
        if (content.includes('margin-top: 8px') && content.includes('position:relative') && content.includes('id="top-controls-wrapper"')) {
            // console.log(`[IGNORADO] ${filePath} - Já está atualizado.`);
            filesIgnored++;
            return;
        }

        // REGEX ROBUSTO (Multilinha e Flexível):
        // 1. <div : Início da tag
        // 2. [^>]* : Qualquer caractere (incluindo quebra de linha) que não seja fechar tag
        // 3. id=["']...["'] : Procura ID 'top-controls-wrapper' OU 'language-dropdown-wrapper' (para pegar versões antigas)
        // 4. [^>]*> : Resto dos atributos até fechar a tag.
        const regexTarget = /<div\s+[^>]*\bid=["'](?:top-controls-wrapper|language-dropdown-wrapper)["'][^>]*>/i;

        if (regexTarget.test(content)) {
            // Substitui APENAS a tag de abertura.
            // O conteúdo interno (inputs traduzidos, bandeiras) permanece intacto.
            const newContent = content.replace(regexTarget, newOpeningTag);

            fs.writeFileSync(filePath, newContent, 'utf8');
            console.log(`[CORRIGIDO] ${filePath}`);
            filesChanged++;
        } else {
            console.log(`[AVISO] Wrapper não encontrado em: ${filePath}`);
        }

    } catch (err) {
        console.error(`Erro ao processar ${filePath}: ${err.message}`);
    }
}

function scanDirectory(directory) {
    // Verifica existência da pasta
    if (!fs.existsSync(directory)) return;

    // Foca estritamente no index.html
    const targetFile = 'index.html';
    const fullPath = path.join(directory, targetFile);

    if (fs.existsSync(fullPath)) {
        processFile(fullPath);
    }
}

// =============================================================================
// 3. EXECUÇÃO
// =============================================================================

console.log('--- Iniciando Ajuste de Posição (arrumando-posicao.js) ---');
console.log('Alvo: index.html nas pastas de tradução');
console.log('Ação: Padronizar wrapper para position:relative e margin-top:8px');

targetFolders.forEach(folder => {
    scanDirectory(folder);
});

console.log('\n--- Relatório Final ---');
console.log(`Arquivos Verificados: ${filesScanned}`);
console.log(`Arquivos Alterados: ${filesChanged}`);
console.log(`Arquivos Já Corretos (Ignorados): ${filesIgnored}`);