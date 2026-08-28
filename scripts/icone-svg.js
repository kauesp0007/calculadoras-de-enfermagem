/* eslint-env node */
/**
 * Helper de ícones locais (substituto do Font Awesome via CDN).
 * Retorna o SVG INLINE oficial (mesmo glyph do Font Awesome) para uso em
 * geradores Node (build-biblioteca.js, build-downloads.js, build.js...).
 *
 * Uso:
 *   const { iconeSvg } = require('./scripts/icone-svg');
 *   iconeSvg('fa-solid fa-file-pdf')                 -> <svg ...>path...</svg>
 *   iconeSvg('fa-file-pdf')                          -> idem (padrão solid)
 *   iconeSvg('fa-solid fa-chevron-left', 'mr-1')     -> atributo extra (class)
 */
const fs = require('fs');
const path = require('path');

const LIB = JSON.parse(fs.readFileSync(path.join(__dirname, 'icones-fa.json'), 'utf8'));

function iconeSvg(faClasse, classeExtra, extraAttr) {
    if (!faClasse) return '';
    const tokens = String(faClasse).trim().split(/\s+/);
    let style = null;
    let nome = null;
    for (const t of tokens) {
        if (t === 'fas' || t === 'fa-solid') style = 'solid';
        else if (t === 'far' || t === 'fa-regular') style = 'regular';
        else if (t === 'fab' || t === 'fa-brands') style = 'brands';
        else if (/^fa-[a-z0-9-]+$/i.test(t)) nome = t.slice(3);
    }
    if (!nome) return '';
    const chave = (style || 'solid') + ':' + nome;
    const icon = LIB[chave] || LIB['solid:' + nome] || LIB['regular:' + nome] || LIB['brands:' + nome];
    if (!icon) return '';
    const cls = classeExtra ? ` class="${classeExtra}"` : '';
    const extra = extraAttr ? ` ${extraAttr}` : '';
    return `<svg${cls} xmlns="http://www.w3.org/2000/svg" viewBox="${icon.vb}" width="1em" height="1em" fill="currentColor" aria-hidden="true" focusable="false" style="vertical-align:-0.125em"${extra}>${icon.d}</svg>`;
}

module.exports = { iconeSvg, LIB };
