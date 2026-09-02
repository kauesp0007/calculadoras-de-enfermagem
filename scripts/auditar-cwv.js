// Auditoria CWV em massa — raiz + 18 pastas de idioma
// Somente leitura. Gera relatorios/auditoria-cwv.csv
const fs = require('fs');
const path = require('path');
const { analyze } = require('./lib/cwv-core');

const ROOT_DIR = '.';
const LANGUAGES = ['en', 'es', 'de', 'it', 'fr', 'hi', 'zh', 'ar', 'ja', 'ru', 'ko', 'tr', 'nl', 'pl', 'sv', 'id', 'vi', 'uk'];
const IGNORE_FOLDERS = ['downloads', 'biblioteca', 'blog', 'blog-templates', 'node_modules', '.git'];
const IGNORE_FILES = ['footer.html', 'menu-global.html', 'global-body-elements.html', 'downloads.html', '_language_selector.html', 'googlefc0a17cdd552164b.html'];

let files = [];

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

// Análise delegada à fonte única (lib/cwv-core.js)

walk(ROOT_DIR, false);
LANGUAGES.forEach(l => { const p = path.join(ROOT_DIR, l); if (fs.existsSync(p)) walk(p, true); });

const rows = [];
files.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  const fl = analyze(content).flags;
  const r = {
    backdrop_blur: fl.hero_backdrop_blur,
    drop_shadow: fl.hero_drop_shadow,
    blur_pesado: fl.hero_blur_pesado,
    shadow_pesado: fl.hero_shadow_pesado,
    font_inter: fl.font_inter,
    h1_font_sans: fl.h1_font_sans,
    body_font_sans: fl.body_font_sans,
    nunito_preloads_ociosos: fl.nunito_preloads_ociosos,
    imgs_total: fl.imgs_total,
    imgs_sem_lazy: fl.imgs_sem_lazy,
    imgs_sem_alt: fl.imgs_sem_alt,
    imgs_sem_decoding: fl.imgs_sem_decoding
  };
  rows.push({ arquivo: f, ...r });
});

const csv = ['arquivo;backdrop_blur;drop_shadow;blur_pesado;shadow_pesado;font_inter;h1_font_sans;body_font_sans;nunito_preloads_ociosos;imgs_total;imgs_sem_lazy;imgs_sem_alt;imgs_sem_decoding'];
rows.forEach(r => {
  csv.push([r.arquivo, r.backdrop_blur ? 1 : 0, r.drop_shadow ? 1 : 0, r.blur_pesado ? 1 : 0, r.shadow_pesado ? 1 : 0, r.font_inter ? 1 : 0, r.h1_font_sans ? 1 : 0, r.body_font_sans ? 1 : 0, r.nunito_preloads_ociosos ? 1 : 0, r.imgs_total, r.imgs_sem_lazy, r.imgs_sem_alt, r.imgs_sem_decoding].join(';'));
});
if (!fs.existsSync('relatorios')) fs.mkdirSync('relatorios');
fs.writeFileSync('relatorios/auditoria-cwv.csv', csv.join('\n'), 'utf8');

// Resumo
const soma = k => rows.filter(r => r[k]).length;
const totalImgs = rows.reduce((a, r) => a + r.imgs_total, 0);
const sumLazy = rows.reduce((a, r) => a + r.imgs_sem_lazy, 0);
const sumAlt = rows.reduce((a, r) => a + r.imgs_sem_alt, 0);
const sumDec = rows.reduce((a, r) => a + r.imgs_sem_decoding, 0);

console.log('=== AUDITORIA CWV (somente leitura) ===');
console.log('HTMLs analisados: ' + rows.length);
console.log('backdrop_blur no hero: ' + soma('backdrop_blur'));
console.log('drop_shadow no hero: ' + soma('drop_shadow'));
console.log('blur pesado (2xl/3xl) no hero: ' + soma('blur_pesado'));
console.log('shadow pesado (2xl/3xl) no hero: ' + soma('shadow_pesado'));
console.log('classe font-inter (inexistente): ' + soma('font_inter'));
console.log('H1 sem font-sans: ' + rows.filter(r => !r.h1_font_sans).length);
console.log('body sem font-sans: ' + rows.filter(r => !r.body_font_sans).length);
console.log('Nunito preloads ociosos: ' + soma('nunito_preloads_ociosos'));
console.log('imagens: total ' + totalImgs + ' | sem lazy ' + sumLazy + ' | sem alt ' + sumAlt + ' | sem decoding ' + sumDec);
console.log('CSV gerado: relatorios/auditoria-cwv.csv');
