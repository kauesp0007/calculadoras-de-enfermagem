// Correção CWV em massa — raiz + 18 pastas de idioma
// Uso: node scripts/corrigir-cwv.js [--dry-run]
// Sem --dry-run: aplica com backup em automacoes/backups_cwv/<timestamp>/
const fs = require('fs');
const path = require('path');

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

function heroBounds(content) {
  const h1 = content.indexOf('<h1');
  if (h1 === -1) return null;
  const start = Math.max(0, content.lastIndexOf('<main', h1));
  const endSec = content.indexOf('</section>', h1);
  const end = endSec !== -1 ? endSec + 10 : Math.min(content.length, h1 + 1500);
  return { start, end };
}

function limparClasses(html) {
  return html.replace(/class="([^"]+)"/g, (m, c) => 'class="' + c.replace(/\s+/g, ' ').trim() + '"');
}

function aplicarFontSansEmTag(tag) {
  // remove fontes de família específicas e garante font-sans
  let t = tag.replace(/\bfont-(inter|nunito)\b/g, '');
  t = limparClasses(t);
  if (/class="/.test(t)) {
    t = t.replace(/class="([^"]*)"/, (m, c) => {
      const classes = c.split(/\s+/).filter(Boolean);
      if (!classes.includes('font-sans')) classes.push('font-sans');
      return 'class="' + classes.join(' ') + '"';
    });
  } else {
    t = t.slice(0, -1) + ' class="font-sans">';
  }
  return t;
}

function corrigirArquivo(content) {
  let novo = content;

  // 1. font-inter (classe inexistente) -> font-sans (global)
  novo = novo.replace(/\bfont-inter\b/g, 'font-sans');

  // 2. Correções no hero
  const bounds = heroBounds(novo);
  if (bounds) {
    let hero = novo.slice(bounds.start, bounds.end);
    hero = hero.replace(/backdrop-blur-?[\w-]*/g, '');
    hero = hero.replace(/blur-(2xl|3xl)/g, 'blur-xl');
    hero = hero.replace(/drop-shadow(-\w+)?/g, '');
    hero = hero.replace(/shadow-(2xl|3xl)/g, 'shadow-lg');

    // H1 -> font-sans
    const h1Idx = hero.indexOf('<h1');
    if (h1Idx !== -1) {
      const h1End = hero.indexOf('>', h1Idx) + 1;
      hero = hero.slice(0, h1Idx) + aplicarFontSansEmTag(hero.slice(h1Idx, h1End)) + hero.slice(h1End);
    }
    // Subtítulo do hero (primeiro <p> ou <h2> após o H1) -> font-sans
    const h1Pos = hero.indexOf('<h1');
    if (h1Pos !== -1) {
      const busca = hero.slice(hero.indexOf('>', h1Pos) + 1, hero.indexOf('>', h1Pos) + 1 + 900);
      const pMatch = busca.match(/<(p|h2)\b[^>]*>/);
      if (pMatch) {
        const pAbs = hero.indexOf('>', h1Pos) + 1 + pMatch.index;
        const pEnd = pAbs + pMatch[0].length;
        hero = hero.slice(0, pAbs) + aplicarFontSansEmTag(hero.slice(pAbs, pEnd)) + hero.slice(pEnd);
      }
    }
    novo = novo.slice(0, bounds.start) + hero + novo.slice(bounds.end);
  }

  // 3. Preloads de Nunito ociosos (família não usada fora de @font-face/preload)
  const linhas = novo.split('\n');
  let nunitoUso = 0;
  linhas.forEach(l => { if (l.includes('Nunito') && !l.includes('@font-face') && !l.includes('preload')) nunitoUso++; });
  if (nunitoUso === 0) {
    const filtradas = linhas.filter(l => !(l.includes('preload') && l.includes('/nunito/')));
    if (filtradas.length !== linhas.length) novo = filtradas.join('\n');
  }

  // 4. Imagens: decoding + lazy (exceto 1ª img e lightbox)
  let firstImg = true;
  novo = novo.replace(/<img\b[^>]*>/g, tag => {
    if (/id="lightboxImg"/.test(tag) || /src=""/.test(tag)) return tag;
    let t = tag;
    if (!/decoding=/.test(t)) t = t.slice(0, -1) + ' decoding="async">';
    if (!/loading=/.test(t) && !firstImg) t = t.slice(0, -1) + ' loading="lazy">';
    firstImg = false;
    return t;
  });

  // 5. Limpeza de espaços duplos em classes
  novo = limparClasses(novo);

  return novo;
}

walk(ROOT_DIR, false);
LANGUAGES.forEach(l => { const p = path.join(ROOT_DIR, l); if (fs.existsSync(p)) walk(p, true); });

console.log((DRY_RUN ? '[MODO SECO] ' : '[APLICANDO] ') + 'Correção CWV em massa — ' + files.length + ' htmls encontrados');
if (!DRY_RUN && !fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });

files.forEach(filePath => {
  const original = fs.readFileSync(filePath, 'utf8');
  const novo = corrigirArquivo(original);
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
