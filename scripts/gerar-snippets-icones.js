/* eslint-env node */
// Gera snippets JS (mapas de ícones) para embutir nos geradores dinâmicos
// dos HTMLs que criam <i class="fa-..."> em tempo de execução.
const fs = require('fs');
const path = require('path');
const LIB = JSON.parse(fs.readFileSync(path.join(__dirname, 'icones-fa.json'), 'utf8'));

function svg(nome, style) {
    const key = (style || 'solid') + ':' + nome;
    const i = LIB[key] || LIB['solid:' + nome] || LIB['regular:' + nome] || LIB['brands:' + nome];
    if (!i) { console.error('FALTA', key); return ''; }
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="' + i.vb + '" width="1em" height="1em" fill="currentColor" aria-hidden="true" focusable="false" style="vertical-align:-0.125em">' + i.d + '</svg>';
}

function mapaJS(nomes, ident) {
    return nomes.map(n => ident + '"fa-' + n + '":"' + svg(n) + '"').join(',\n');
}

const nanda = ['heart-pulse', 'apple-whole', 'toilet', 'person-running', 'brain', 'user-check', 'people-arrows', 'venus-mars', 'shield-heart', 'scale-balanced', 'shield-halved', 'bed', 'seedling', 'layer-group'];
const badges = ['file', 'file-pdf', 'file-word', 'file-excel', 'video', 'image'];
const mapa = ['scale-balanced', 'earth-africa', 'earth-europe', 'earth-americas', 'earth-asia', 'folder'];

const out = [];
out.push('===== NANDA (14) =====');
out.push(mapaJS(nanda, '  '));
out.push('===== BADGES (6) =====');
out.push(mapaJS(badges, '  '));
out.push('===== MAPA (6) =====');
out.push(mapaJS(mapa, '  '));
out.push('===== GLOSSARY (1) =====');
out.push('"fa-magnifying-glass":"' + svg('magnifying-glass') + '"');
out.push('');
fs.writeFileSync(path.join(__dirname, '..', 'backups-temporarios', 'fa-migracao-snippets.txt'), out.join('\n'), 'utf8');
console.log('Gerado: backups-temporarios/fa-migracao-snippets.txt (' + out.length + ' linhas)');
