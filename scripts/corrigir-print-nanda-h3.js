// Correção complementar: o script principal renomeou o card visível (h4) e o
// template de impressão no padrão "sec-titulo", mas não cobriu o padrão de
// template de impressão usado por barthel/cam:
//   <h3 style="color:#1a3e74;">Diagnósticos NANDA</h3>
//   <ul>${nanda}</ul>
//
// Este script reescreve esse h3 com o título já traduzido (extraído do h4
// visível do próprio arquivo) e insere o disclaimer pequeno (extraído do
// p.nanda-disclaimer-screen do próprio arquivo) após a lista.
//
// Uso:
//   node scripts/corrigir-print-nanda-h3.js --dry
//   node scripts/corrigir-print-nanda-h3.js --apply

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DRY = process.argv.includes('--dry');
const APPLY = process.argv.includes('--apply');

if (!DRY && !APPLY) {
    console.log('Informe --dry ou --apply');
    process.exit(0);
}

// Arquivos reais (não backup) com o h3 de impressão não renomeado.
const TARGETS = [
    'barthel.html', 'cam.html',
    'ar/cam.html', 'de/cam.html', 'en/cam.html', 'es/barthel.html', 'es/cam.html',
    'fr/cam.html', 'hi/cam.html', 'id/cam.html', 'it/cam.html', 'ja/cam.html',
    'ko/cam.html', 'nl/cam.html', 'pl/cam.html', 'ru/cam.html', 'sv/cam.html',
    'tr/cam.html', 'uk/cam.html', 'vi/cam.html', 'zh/cam.html'
];

const H3_RE = /<h3 style="color:#1a3e74;">Diagnósticos NANDA<\/h3>/;
const H4_RE = /<h4 class="text-sm md:text-base font-bold text-navy m-0 uppercase tracking-wide">([^<]+)<\/h4>/;
const DISC_RE = /<p class="nanda-disclaimer-screen"[^>]*>([\s\S]*?)<\/p>/;

let changed = 0;
const ts = Date.now();
const backupDir = path.join(ROOT, 'backups-temporarios', `nanda-print-h3-${ts}`);

for (const rel of TARGETS) {
    const file = path.join(ROOT, rel);
    if (!fs.existsSync(file)) {
        console.log(`[ignorado] ${rel} (não existe)`);
        continue;
    }
    const content = fs.readFileSync(file, 'utf8');

    if (!H3_RE.test(content)) {
        console.log(`[ignorado] ${rel} (h3 não encontrado)`);
        continue;
    }

    const mH4 = content.match(H4_RE);
    const mD = content.match(DISC_RE);
    if (!mH4 || !mD) {
        console.log(`[ERRO] ${rel} (h4 ou disclaimer visível não encontrado)`);
        continue;
    }
    const titulo = mH4[1].trim();
    const disclaimer = mD[1].trim();

    const newH3 = `<h3 style="color:#1a3e74;">${titulo}</h3>`;
    const newDisc = `<p style="font-size:7pt;line-height:1.3;color:#94a3b8;font-style:italic;margin:8px 0 0">${disclaimer}</p>`;

    let out = content.replace(H3_RE, newH3);
    // Insere o disclaimer logo após a lista nanda do template de impressão.
    if (out.includes('<ul>${nanda}</ul>')) {
        out = out.replace('<ul>${nanda}</ul>', `<ul>\${nanda}</ul>\n${newDisc}`);
    }

    if (out === content) {
        console.log(`[sem mudança] ${rel}`);
        continue;
    }

    if (APPLY) {
        if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
        fs.writeFileSync(path.join(backupDir, rel.replace(/\//g, '_')), content, 'utf8');
        fs.writeFileSync(file, out, 'utf8');
    }
    console.log(`[ok] ${rel} -> título e disclaimer de impressão`);
    changed++;
}

console.log(`\nArquivos processados: ${changed}`);
if (APPLY) console.log(`Backup em: backups-temporarios/nanda-print-h3-${ts}`);
