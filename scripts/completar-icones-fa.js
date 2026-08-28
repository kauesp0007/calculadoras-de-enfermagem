/* eslint-env node */
// Completa scripts/icones-fa.json com ícones usados apenas em JS dinâmico.
const fs = require('fs');
const path = require('path');

const LIB_PATH = path.join(__dirname, 'icones-fa.json');
const DIR = path.join(__dirname, '..', 'node_modules', '@fortawesome', 'fontawesome-free', 'svgs', 'solid');
const FALTANDO = ['apple-whole', 'toilet', 'person-running', 'venus-mars', 'seedling', 'file-word', 'file-excel', 'earth-africa', 'earth-europe', 'earth-americas', 'earth-asia', 'folder'];

const LIB = JSON.parse(fs.readFileSync(LIB_PATH, 'utf8'));
let adicionados = 0;
for (const n of FALTANDO) {
    const key = 'solid:' + n;
    if (LIB[key]) continue;
    const f = path.join(DIR, n + '.svg');
    if (!fs.existsSync(f)) { console.log('NAO EXISTE:', n); continue; }
    const raw = fs.readFileSync(f, 'utf8');
    const vbMatch = raw.match(/viewBox="([^"]+)"/);
    if (!vbMatch) { console.log('SEM VIEWBOX:', n); continue; }
    let inner = raw.replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '').replace(/<!--![\s\S]*?-->/g, '').trim();
    LIB[key] = { vb: vbMatch[1], d: inner };
    adicionados++;
}
fs.writeFileSync(LIB_PATH, JSON.stringify(LIB, null, 2), 'utf8');
console.log('Adicionados:', adicionados, '| Total na biblioteca:', Object.keys(LIB).length);
