const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');

// =========================================================
// 1. CONFIGURAÇÕES: PASTAS ALVO (IDIOMAS + RAIZ)
// =========================================================

const rootDir = __dirname;

// Lista explícita de pastas para processar (Garante que nenhuma seja esquecida)
const targetFolders = [
    '.', // Raiz (pt)
    'en', 'es', 'de', 'it', 'fr', 'hi', 'zh', 'ar', 'ja',
    'ru', 'ko', 'tr', 'nl', 'pl', 'sv', 'id', 'vi', 'uk'
];

// =========================================================
// 2. CONFIGURAÇÕES: EXCLUSÕES (SEGURANÇA)
// =========================================================

// Pastas de sistema que NUNCA devem ser tocadas
const systemIgnoredFolders = [
    'node_modules',
    '.git',
    '.vscode',
    'biblioteca',
    'downloads',
    'assets',
    'public',
    'images',
    'css',
    'js',
    'admin'
];

// Arquivos HTML específicos que NUNCA devem ser tocados
const ignoredFiles = [
    '_language_selector.html',
    'footer.html',
    'menu-global.html',
    'global-body-elements.html',
    'downloads.html'
];

// =========================================================
// 3. REGRAS DE OTIMIZAÇÃO
// =========================================================

const rules = [
    {
        id: 'FIX_CLS_MENU',
        description: 'Corrigir CLS do Menu de Idiomas (Relative -> Absolute)',
        find: /<div id="language-dropdown-wrapper" class="flex justify-end w-full" style="position: relative; z-index: 100; padding-right: 2rem">/g,
        replace: `<div id="language-dropdown-wrapper" class="flex justify-end w-full" style="position: absolute; top: 1.5rem; right: 0; z-index: 1000; padding-right: 2rem; pointer-events: none;">`
    },
    {
        id: 'FIX_POINTER_EVENTS',
        description: 'Habilitar clique no botão de idioma após fix do CLS',
        find: /<div class="relative inline-block text-left z-50">/g,
        replace: `<div class="relative inline-block text-left z-50" style="pointer-events: auto;">`
    },
    {
        id: 'FIX_LCP_FLAG',
        description: 'Remover Lazy Load da bandeira (LCP)',
        find: /<img id="langFlag"([^>]*)loading="lazy">/g,
        replace: `<img id="langFlag"$1fetchpriority="high">`
    },
    {
        id: 'FIX_FONTAWESOME',
        description: 'Otimizar carregamento do FontAwesome',
        find: /<script async="" src="https:\/\/kit\.fontawesome\.com\/083bed182a\.js" crossorigin="anonymous"><\/script>/g,
        replace: `<link rel="preload" href="https://kit.fontawesome.com/083bed182a.js" as="script" crossorigin="anonymous">\n    <script async src="https://kit.fontawesome.com/083bed182a.js" crossorigin="anonymous"></script>`
    }
];

const dnsPrefetchTag = `<link rel="dns-prefetch" href="//googleads.g.doubleclick.net"><link rel="dns-prefetch" href="//pagead2.googlesyndication.com">`;

// =========================================================
// 4. FUNÇÕES DE PROCESSAMENTO
// =========================================================

function runCommand(command) {
    return new Promise((resolve, reject) => {
        console.log(`\n⏳ Executando: ${command}`);
        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`❌ Erro: ${error.message}`);
                reject(error);
                return;
            }
            if (stdout) console.log(stdout.trim());
            resolve();
        });
    });
}

// Verifica se um diretório existe antes de tentar ler
async function directoryExists(path) {
    try {
        await fs.access(path);
        return true;
    } catch {
        return false;
    }
}

async function processFolderRecursive(directory, isRoot = false) {
    try {
        const entries = await fs.readdir(directory, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(directory, entry.name);

            // A) SE FOR DIRETÓRIO
            if (entry.isDirectory()) {
                // 1. Ignora pastas de sistema (biblioteca, node_modules, etc)
                if (systemIgnoredFolders.includes(entry.name)) continue;

                // 2. Se estivermos processando a RAIZ, NÃO entra nas pastas de idioma agora
                // (Elas serão processadas explicitamente no loop principal para garantir ordem)
                if (isRoot && targetFolders.includes(entry.name)) continue;

                // 3. Entra em subpastas normais (ex: en/artigos/)
                await processFolderRecursive(fullPath, false);
            }

            // B) SE FOR ARQUIVO HTML
            else if (entry.isFile() && entry.name.endsWith('.html')) {
                // Verifica lista negra de arquivos
                if (ignoredFiles.includes(entry.name)) {
                    // console.log(`🛡️  Protegido: ${entry.name}`);
                    continue;
                }

                // OTIMIZA O ARQUIVO
                await optimizeFile(fullPath);
            }
        }
    } catch (err) {
        console.error(`Erro ao ler diretório ${directory}:`, err);
    }
}

async function optimizeFile(filePath) {
    try {
        const originalContent = await fs.readFile(filePath, 'utf8');
        let content = originalContent;
        let modified = false;

        // Aplica Regras (Regex)
        for (const rule of rules) {
            if (rule.find.test(content)) {
                content = content.replace(rule.find, rule.replace);
                modified = true;
            }
        }

        // Aplica DNS Prefetch (Segurança para não duplicar)
        if (!content.includes('//googleads.g.doubleclick.net') && content.includes('<head>')) {
            content = content.replace('<head>', `<head>${dnsPrefetchTag}`);
            modified = true;
        }

        if (modified) {
            await fs.writeFile(filePath, content, 'utf8');
            console.log(`✅ Otimizado: ${filePath.replace(rootDir, '')}`);
        }

    } catch (err) {
        console.error(`❌ Erro no arquivo ${filePath}:`, err);
    }
}

// =========================================================
// 5. EXECUÇÃO PRINCIPAL
// =========================================================

(async () => {
    console.log("🚀 INICIANDO OTIMIZADOR DE SITE COMPLETO");
    console.log("==========================================================");

    // PASSO 1: OTIMIZAÇÃO DE HTML (Loop Explícito pelos Idiomas)
    console.log("\n[PASSO 1/4] Otimizando HTMLs (Idiomas + Raiz)...");

    for (const folder of targetFolders) {
        const currentPath = path.join(rootDir, folder);
        const isRoot = (folder === '.');

        if (await directoryExists(currentPath)) {
            console.log(`📂 Verificando pasta: ${isRoot ? 'RAIZ (pt)' : folder.toUpperCase()}`);
            await processFolderRecursive(currentPath, isRoot);
        } else {
            console.warn(`⚠️ Pasta não encontrada (pulada): ${folder}`);
        }
    }
    console.log("✔️ Otimização de HTML concluída.");

    // PASSO 2: AUTOMAÇÃO DA BIBLIOTECA
    console.log("\n[PASSO 2/4] Executando Automação da Biblioteca...");
    try {
        await runCommand('node biblioteca-automation.js');
    } catch (e) {
        console.error("⚠️ Erro na biblioteca (continuando mesmo assim).");
    }

    // PASSO 3: TAILWIND CSS
    console.log("\n[PASSO 3/4] Compilando Tailwind CSS (Minify)...");
    try {
        await runCommand('.\\node_modules\\.bin\\tailwindcss -i ./src/input.css -o ./public/output.css --minify');
    } catch (e) {
        console.error("⚠️ Erro no Tailwind. Verifique a instalação.");
    }

    // PASSO 4: SERVICE WORKER
    console.log("\n[PASSO 4/4] Gerando Service Worker...");
    try {
        await runCommand('node gerar-sw.js');
    } catch (e) {
        console.error("⚠️ Erro no Service Worker.");
    }

    console.log("\n==========================================================");
    console.log("🏁 PROCESSO FINALIZADO!");
})();