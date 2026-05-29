const fs = require('fs');
const path = require('path');

// =============================================================================
// PAINEL DE CONTROLE - REGRAS DE AUTOMAÇÃO
// =============================================================================

const REGRA_REPLACE = [
    {
        target: '',
        newTag: `</section>\n`
    },
];

const REGRA_DELETE = [];
const REGRA_UNIFY = [];
const REGRA_MOVE = [];

// =============================================================================
// CONFIGURAÇÕES DO REPOSITÓRIO (CALCULADORAS DE ENFERMAGEM)
// =============================================================================
const ROOT_DIR = '.';
const LANGUAGES = ['en', 'es', 'de', 'it', 'fr', 'hi', 'zh', 'ar', 'ja', 'ru', 'ko', 'tr', 'nl', 'pl', 'sv', 'id', 'vi', 'uk'];
const IGNORE_FOLDERS = ['downloads', 'biblioteca', 'blog', 'node_modules', '.git'];
const IGNORE_FILES = [
    'footer.html', 'menu-global.html', 'global-body-elements.html',
    'downloads.html', 'menu-lateral.html', '_language_selector.html',
    'googlefc0a17cdd552164b.html'
];

let filesChangedCount = 0;
let filesSkippedCount = 0;

function start() {
    console.log('--- Iniciando Correção de Layout (Reinserção da tag </section>) ---');

    processDirectory(ROOT_DIR, false);

    LANGUAGES.forEach(lang => {
        const langPath = path.join(ROOT_DIR, lang);
        if (fs.existsSync(langPath)) processDirectory(langPath, true);
    });

    console.log('\n==================================================');
    console.log('               RELATÓRIO DE EXECUÇÃO');
    console.log('==================================================');
    console.log(`Arquivos corrigidos: ${filesChangedCount}`);
    console.log(`Arquivos pulados (já corrigidos ou sem anúncio): ${filesSkippedCount}`);
    console.log('==================================================');
}

function processDirectory(currentPath, isLangFolder) {
    if (!fs.existsSync(currentPath)) return;

    let items = fs.readdirSync(currentPath);
    items.forEach(item => {
        const fullPath = path.join(currentPath, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            if (IGNORE_FOLDERS.includes(item)) return;
            if (isLangFolder) processDirectory(fullPath, true);
        } else if (path.extname(item) === '.html' && !IGNORE_FILES.includes(item)) {
            processFile(fullPath);
        }
    });
}

function processFile(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');

        // TRAVA DE SEGURANÇA: Se já tem o </section> antes do anúncio, pula.
        // Também pula se não encontrar o anúncio no arquivo.
        if (content.includes('</section>\n')) {
            filesSkippedCount++;
            return;
        }

        let lines = content.split('\n');
        let fileModified = false;

        lines = lines.map((line) => {
            for (const r of REGRA_REPLACE) {
                if (r.target && line.includes(r.target)) {
                    if (line.trim() !== r.newTag.trim()) {
                        fileModified = true;
                        const indent = line.match(/^(\s*)/)[0] || '';
                        return `${indent}${r.newTag}`;
                    }
                }
            }
            return line;
        });

        if (fileModified) {
            fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
            filesChangedCount++;
            console.log(`[CORRIGIDO] ${filePath}`);
        } else {
            filesSkippedCount++;
        }
    } catch (err) {
        console.error(`Erro ao processar ${filePath}: ${err.message}`);
    }
}

start();