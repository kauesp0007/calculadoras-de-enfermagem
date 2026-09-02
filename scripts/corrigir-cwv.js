// Correção CWV em massa — raiz + 18 pastas de idioma
// Uso: node scripts/corrigir-cwv.js [--dry-run]
// Sem --dry-run: aplica com backup em automacoes/backups_cwv/<timestamp>/
const fs = require('fs');
const path = require('path');
const { correct } = require('./lib/cwv-core');

const DRY_RUN = process.argv.includes('--dry-run');

const ROOT_DIR = '.';
const LANGUAGES = ['en', 'es', 'de', 'it', 'fr', 'hi', 'zh', 'ar', 'ja', 'ru', 'ko', 'tr', 'nl', 'pl', 'sv', 'id', 'vi', 'uk'];
const IGNORE_FOLDERS = ['downloads', 'biblioteca', 'blog', 'blog-templates', 'node_modules', '.git'];
const IGNORE_FILES = ['footer.html', 'menu-global.html', 'global-body-elements.html', 'downloads.html', '_language_selector.html', 'googlefc0a17cdd552164b.html'];

let files = [];
let changedCount = 0, skippedCount = 0, backupCount = 0;
const TS = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const BACKUP_DIR = path.join('automacoes', 'backups_cwv', TS);

function walk(currentPath, isLangFolder) {
  let items = fs.readdirSync(currentPath);
  items.forEach(item => {
    const fullPath = path.join(currentPath, item);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (IGNORE_FOLDERS.includes(item)) return;
      if (isLangFolder) walk(fullPath, true);
    } else if (item.endsWith('.html') && !item.endsWith('.min.html') && !IGNORE_FILES.includes(item)) {
      files.push(fullPath);
    }
  });
}

// Regras de correção delegadas à fonte única (lib/cwv-core.js)

walk(ROOT_DIR, false);
LANGUAGES.forEach(l => { const p = path.join(ROOT_DIR, l); if (fs.existsSync(p)) walk(p, true); });

console.log((DRY_RUN ? '[MODO SECO] ' : '[APLICANDO] ') + 'Correção CWV em massa — ' + files.length + ' htmls encontrados');
if (!DRY_RUN && !fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });

files.forEach(filePath => {
  const original = fs.readFileSync(filePath, 'utf8');
  const novo = correct(original).content;
  if (novo !== original) {
    changedCount++;
    if (DRY_RUN) {
      console.log('[SECO] ' + filePath + ' (' + (novo.length - original.length) + ' chars)');
    } else {
      const rel = path.relative('.', filePath);
      const dest = path.join(BACKUP_DIR, rel);
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.copyFileSync(filePath, dest);
      fs.writeFileSync(filePath, novo, 'utf8');
      backupCount++;
      console.log('[ALTERADO] ' + filePath);
    }
  } else {
    skippedCount++;
  }
});

console.log('=== RELATÓRIO ===');
console.log('Arquivos que mudariam/mudaram: ' + changedCount);
console.log('Sem mudança: ' + skippedCount);
if (!DRY_RUN) {
  console.log('Backups em: ' + BACKUP_DIR + ' (' + backupCount + ' arquivos)');
  const log = 'Timestamp: ' + TS + '\nAlterados: ' + changedCount + '\nBackups: ' + BACKUP_DIR + '\n';
  if (!fs.existsSync('relatorios')) fs.mkdirSync('relatorios');
  fs.writeFileSync(path.join('relatorios', 'correcao-cwv-' + TS + '.log'), log, 'utf8');
}
