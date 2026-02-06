const fs = require('fs');
const path = require('path');

// --- CONFIGURAÇÃO ---

// Pastas que JAMAIS serão tocadas (Lista Negra)
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

// Arquivos que JAMAIS serão tocados (Lista Negra)
// Nota: footer.html não está aqui pois pode precisar de ajuste na tag <ul>
const ignoredFiles = [
    'menu-global.html',
    'global-body-elements.html',
    'downloads.html',
    'menu-lateral.html',
    '_language_selector.html',
    'googlefc0a17cdd552164b.html'
];

let modifiedCount = 0;

function processFile(filePath, fileName) {
    // 1. Filtro Básico: Apenas .html
    if (path.extname(fileName) !== '.html') return;

    // 2. Filtro de Arquivos Proibidos
    if (ignoredFiles.includes(fileName)) return;

    try {
        let content = fs.readFileSync(filePath, 'utf8');
        let originalContent = content;

        // --- INÍCIO DAS CORREÇÕES ---

        // A. REMOÇÃO DE ROLE="LIST" EM <ul>
        // Motivo: O PageSpeed alerta que <ul> já é uma lista, role="list" é redundante e causa erro se filhos não tiverem role.

        // Regex 1: <ul algo role="list" algo> -> <ul algo algo>
        content = content.replace(/(<ul\b[^>]*?)\s*\brole=["']list["']\s*([^>]*>)/gi, "$1 $2");
        // Regex 2: Limpeza caso tenha sobrado <ul > ou <ul  >
        content = content.replace(/<ul\s+role=["']list["']\s*>/gi, "<ul>");


        // B. CORREÇÃO DO MENU DE IDIOMAS (#langMenu)
        // Motivo: Erro "Required ARIA parents role not present".
        // Solução: Remover role="menu" para que seja tratado como div padrão (semântica simples é melhor que ARIA quebrado).
        if (content.includes('id="langMenu"')) {
             content = content.replace(/(id="langMenu"[^>]*?)\s*\brole=["']menu["']\s*/gi, "$1 ");
        }


        // C. REMOÇÃO GLOBAL DE ROLE="MENUITEM" e "MENUBAR"
        // Motivo: Itens com role="menuitem" sem um pai role="menu" geram erro crítico.
        // Solução: Remover o atributo role, transformando em links/divs comuns.
        content = content.replace(/\s*\brole=["']menuitem["']\s*/gi, " ");
        content = content.replace(/\s*\brole=["']menubar["']\s*/gi, " ");

        // --- FIM DAS CORREÇÕES ---

        // Se houve alteração, salva o arquivo preservando tudo o mais
        if (content !== originalContent) {
            fs.writeFileSync(filePath, content, 'utf8');
            modifiedCount++;
            console.log(`[ARIA FIXED] Ajustado: ${filePath}`);
        }

    } catch (err) {
        console.error(`Erro ao processar ${filePath}: ${err.message}`);
    }
}

// Função de Varredura Universal (Sem limite de idioma)
function scanDirectory(directory) {
    let files;
    try {
        files = fs.readdirSync(directory);
    } catch (e) {
        console.error(`Não foi possível ler o diretório: ${directory}`);
        return;
    }

    files.forEach(file => {
        const fullPath = path.join(directory, file);
        let stat;

        try {
            stat = fs.statSync(fullPath);
        } catch (e) {
            return; // Ignora se não conseguir ler stats
        }

        if (stat.isDirectory()) {
            // Se for diretório:
            // 1. Verifica se NÃO está na lista de ignorados
            if (!ignoredFolders.includes(file)) {
                // 2. Entra recursivamente (varre tudo o que tiver dentro)
                scanDirectory(fullPath);
            }
        } else {
            // Se for arquivo: processa
            processFile(fullPath, file);
        }
    });
}

// --- EXECUÇÃO ---

console.log('--- CORREÇÃO DE ARIA (VARREDURA TOTAL) ---');
console.log('Regra: Ler TUDO, exceto pastas/arquivos proibidos.');
console.log('Iniciando na raiz: ' + __dirname);

// Inicia a recursão a partir da raiz
scanDirectory(__dirname);

console.log(`\nProcesso concluído.`);
console.log(`Total de arquivos corrigidos: ${modifiedCount}`);