/* eslint-env node */
/**
 * test-knowledge-index.js — testes de integridade da base de conhecimento.
 * 1. Valida que todos os JSONs são válidos.
 * 2. Não-regressão: garante que nenhum arquivo proibido/pasta proibida aparece no índice.
 * 3. Verifica coerência básica (links quebrados apontados, imagens com páginas).
 */
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const K = path.join(ROOT, 'knowledge');

const DIRS_PROIBIDAS = ['downloads', 'biblioteca', 'blog', 'blog-templates', 'node_modules', '.git', 'automacoes'];
const FILES_PROIBIDOS = ['footer.html', 'menu-global.html', 'global-body-elements.html', 'downloads.html', 'menu-lateral.html', '_language_selector.html', 'googlefc0a17cdd552164b.html'];

let falhas = 0;
function check(cond, msg) { if (!cond) { console.error('✘ ' + msg); falhas++; } else { console.log('✔ ' + msg); } }

// 1. JSONs válidos
const jsons = ['pages.json', 'relationships.json', 'images.json', 'references.json', 'legislation.json', 'scales.json', 'calculators.json', 'taxonomy.json', 'aliases.json', 'didactic-assets.json', 'reports/index-report.json'];
for (const j of jsons) {
    try { JSON.parse(fs.readFileSync(path.join(K, j), 'utf8')); check(true, 'JSON válido: ' + j); }
    catch (e) { check(false, 'JSON INVÁLIDO: ' + j + ' — ' + e.message); }
}

// 2. Não-regressão: nenhum arquivo proibido no índice
const pages = JSON.parse(fs.readFileSync(path.join(K, 'pages.json'), 'utf8'));
let proibidos = 0;
for (const p of pages) {
    const rel = p.file.replace(/\\/g, '/');
    if (DIRS_PROIBIDAS.some(d => rel === d || rel.startsWith(d + '/'))) { proibidos++; console.error('  proibido: ' + rel); }
    if (FILES_PROIBIDOS.includes(rel)) { proibidos++; console.error('  proibido: ' + rel); }
}
check(proibidos === 0, 'Nenhum arquivo/pasta proibido(a) no índice (' + pages.length + ' páginas)');

// 3. Coerência: todo link quebrado do relatório deve ser .html da raiz inexistente no disco
const rels = JSON.parse(fs.readFileSync(path.join(K, 'relationships.json'), 'utf8'));
const report = JSON.parse(fs.readFileSync(path.join(K, 'reports/index-report.json'), 'utf8'));
const byFile = new Set(pages.map(p => p.file));
let coerentes = true;
for (const [pagina, alvos] of Object.entries(report.alerts.broken_links || {})) {
    for (const a of alvos) {
        if (a.includes('/') || byFile.has(a) || fs.existsSync(path.join(ROOT, a))) { coerentes = false; console.error('  incoerente: ' + pagina + ' -> ' + a); }
    }
}
check(coerentes, 'Links quebrados do relatório são reais (' + Object.keys(report.alerts.broken_links || {}).length + ' páginas)');

// 4. Imagens catalogadas referenciam páginas
const imgs = JSON.parse(fs.readFileSync(path.join(K, 'images.json'), 'utf8'));
const semPagina = imgs.filter(i => !i.pages || i.pages.length === 0).length;
check(semPagina === 0, 'Todas as imagens possuem ao menos uma página (' + imgs.length + ' imagens)');

console.log(falhas === 0 ? '\nTESTES: APROVADOS' : '\nTESTES: ' + falhas + ' FALHA(S)');
process.exit(falhas === 0 ? 0 : 1);
