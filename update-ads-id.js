const fs = require('fs');
const path = require('path');

// --- CONFIGURAÇÕES BASEADAS NAS REGRAS DO USUÁRIO ---

// 1. Definição das pastas que devem ser varridas (Raiz + Idiomas)
const targetDirectories = [
    '.', // Raiz
    'en', 'es', 'de', 'it', 'fr', 'hi', 'zh', 'ar', 'ja',
    'ru', 'ko', 'tr', 'nl', 'pl', 'sv', 'id', 'vi', 'uk'
];

// 2. Pastas explicitamente excluídas
const excludedFolders = ['downloads', 'biblioteca', 'node_modules', '.git', '.vscode'];

// 3. Arquivos explicitamente excluídos (não serão tocados)
const excludedFiles = [
    'footer.html',
    'menu-global.html',
    'global-body-elements.html',
    'downloads.html',
    'menu-lateral.html',
    '_language_selector.html',
    'googlefc0a17cdd552164b.html'
];

// 4. As Strings exatas para troca (Search & Replace)
const oldString = 'gtag("config","AW-952633102");';
const newString = 'gtag("config","AW-9277197961");';

// Contadores para o Log final
let filesAltered = 0;
let filesSkipped = 0; // Arquivos que não precisaram de alteração ou foram ignorados

// --- FUNÇÃO PRINCIPAL ---

function updateAdsID() {
    console.log("Iniciando varredura e atualização de IDs do Google Ads...\n");

    targetDirectories.forEach(dir => {
        const fullPath = path.join(__dirname, dir);

        // Verifica se o diretório existe antes de tentar ler
        if (fs.existsSync(fullPath)) {
            try {
                const items = fs.readdirSync(fullPath);

                items.forEach(item => {
                    const itemPath = path.join(fullPath, item);
                    const stats = fs.statSync(itemPath);

                    // Verifica se é uma pasta que deve ser ignorada (segurança extra)
                    if (stats.isDirectory()) {
                        if (excludedFolders.includes(item)) {
                            return; // Pula pastas proibidas
                        }
                        // Nota: O script foca nos diretórios listados em 'targetDirectories'.
                        // Não faz recursão profunda para evitar tocar em 'img/', 'css/', etc.
                    }

                    // Processa apenas arquivos
                    else if (stats.isFile()) {
                        processFile(itemPath, item);
                    }
                });

            } catch (err) {
                console.error(`Erro ao ler diretório ${dir}:`, err.message);
            }
        } else {
            console.warn(`Aviso: Diretório não encontrado: ${dir}`);
        }
    });

    // Log final exigido pela regra
    console.log("\n---------------------------------------------------");
    console.log("RESUMO DA OPERAÇÃO:");
    console.log(`Total de arquivos alterados: ${filesAltered}`);
    console.log(`Total de arquivos não alterados (sem a tag ou excluídos): ${filesSkipped}`);
    console.log("---------------------------------------------------");
}

// --- FUNÇÃO DE PROCESSAMENTO DE ARQUIVO INDIVIDUAL ---

function processFile(filePath, fileName) {
    // 1. Filtra apenas arquivos .html
    if (path.extname(fileName) !== '.html') {
        return; // Ignora css, js, json, imagens, etc.
    }

    // 2. Verifica se o arquivo está na lista de exclusão
    if (excludedFiles.includes(fileName)) {
        filesSkipped++;
        return;
    }

    try {
        // Lê o conteúdo original preservando codificação UTF-8
        let content = fs.readFileSync(filePath, 'utf8');

        // 3. Verifica se o arquivo contém a tag antiga
        if (content.includes(oldString)) {
            // Realiza a substituição exata
            // O replace normal troca apenas a primeira ocorrência.
            // Como geralmente há apenas uma tag de config por arquivo, é seguro e evita loops infinitos.
            // Se houver risco de duplicidade, usamos replaceAll (Node 15+) ou regex global.
            // Aqui usaremos split/join para compatibilidade total e segurança.

            const newContent = content.split(oldString).join(newString);

            // Grava o arquivo apenas se houve mudança real
            if (content !== newContent) {
                fs.writeFileSync(filePath, newContent, 'utf8');
                console.log(`[ALTERADO] ${filePath}`);
                filesAltered++;
            } else {
                filesSkipped++;
            }
        } else {
            // O arquivo não tem a tag antiga (já foi atualizado ou não usa Ads)
            filesSkipped++;
        }

    } catch (err) {
        console.error(`Erro ao processar arquivo ${filePath}:`, err.message);
    }
}

// Executa o script
updateAdsID();