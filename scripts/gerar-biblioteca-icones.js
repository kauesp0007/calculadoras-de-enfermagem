/* eslint-env node */
/**
 * Gerador da biblioteca local de ícones SVG (substituta do Font Awesome via CDN).
 * Lê os SVGs oficiais do pacote @fortawesome/fontawesome-free e gera
 * scripts/icones-fa.json apenas com os ícones realmente usados no repositório.
 */
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const SVG_DIR = path.join(ROOT, 'node_modules', '@fortawesome', 'fontawesome-free', 'svgs');
const OUT = path.join(ROOT, 'scripts', 'icones-fa.json');
const REPORT = path.join(ROOT, 'scripts', 'relatorio-icones-fa.json');

const EXCLUDE = /backups-temporarios|automacoes|node_modules|\\\.git\\|\.git\\/i;

/** Alias FA5 -> nome canônico FA6 (glyph idêntico). */
const ALIAS = {
    'shield-alt': 'shield-halved',
    'trash-alt': 'trash-can',
    'external-link-alt': 'up-right-from-square',
    'cloud-upload-alt': 'cloud-arrow-up',
    'history': 'clock-rotate-left',
    'undo': 'rotate-left',
    'redo': 'rotate-right',
    // renomeações FA5 -> FA6 (glyph idêntico)
    'home': 'house',
    'contrast': 'circle-half-stroke',
    'clinic-medical': 'house-chimney-medical',
    'drafting-compass': 'compass-drafting',
    'hard-hat': 'helmet-safety',
    'save': 'floppy-disk',
    'search': 'magnifying-glass',
    'th': 'table-cells',
    // nomes usados no repositório que não existem no conjunto gratuito:
    'comments-medical': 'comment-medical',   // oficial gratuito mais próximo
    'head-side-medical': 'head-side-mask'    // oficial gratuito mais próximo
};

/** Ícones usados apenas em JS dinâmico (não capturados pelo scanner de class="). */
const DINAMICOS = [
    // diagnosticosnanda (getDomainIcon)
    'heart-pulse', 'apple-whole', 'toilet', 'person-running', 'brain', 'user-check', 'people-arrows',
    'venus-mars', 'shield-heart', 'scale-balanced', 'shield-halved', 'bed', 'seedling', 'layer-group',
    // downloads.template.html (badges)
    'file', 'file-pdf', 'file-word', 'file-excel', 'video', 'image',
    // mapa-do-site (langMap)
    'earth-africa', 'earth-europe', 'earth-americas', 'earth-asia', 'folder',
    // glossary-search
    'magnifying-glass'
];

function walkHtml(dir, out) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (entry.name.startsWith('.git')) continue;
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) { walkHtml(full, out); } else if (entry.name.endsWith('.html')) { out.push(full); }
    }
}

function extrairNomes(conteudo, acc) {
    // class="..." ou class='...' contendo tokens fa
    const re = /class=(["'])([^"']*fa[^"']*)\1/gi;
    let m;
    while ((m = re.exec(conteudo)) !== null) {
        const tokens = m[2].trim().split(/\s+/);
        let style = null;
        const nomes = [];
        for (const t of tokens) {
            if (t === 'fas' || t === 'fa-solid') style = 'solid';
            else if (t === 'far' || t === 'fa-regular') style = 'regular';
            else if (t === 'fab' || t === 'fa-brands') style = 'brands';
            else if (/^fa-[a-z0-9-]+$/i.test(t)) nomes.push(t.slice(3));
        }
        if (!nomes.length) continue;
        const st = style || 'solid'; // FA4 ("fa fa-x") e fa-x sem estilo = solid
        for (const nome of nomes) {
            if (nome === 'solid' || nome === 'regular' || nome === 'brands') continue;
            if (/^(2x|3x|4x|5x|fw|spin|pulse|flip|lg|sm|xs|stack|ul|li|border|pull|rotate|flip-|inverse|sharp|duotone|thin)$/.test(nome)) continue;
            const key = st + ':' + nome;
            acc[key] = (acc[key] || 0) + 1;
        }
    }
}

function lerSvg(style, nome) {
    const f = path.join(SVG_DIR, style, nome + '.svg');
    if (!fs.existsSync(f)) return null;
    const raw = fs.readFileSync(f, 'utf8');
    const vbMatch = raw.match(/viewBox="([^"]+)"/);
    if (!vbMatch) return null;
    let inner = raw.replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
    inner = inner.replace(/<!--![\s\S]*?-->/g, '').trim(); // remove comentário de licença
    return { vb: vbMatch[1], inner };
}

function main() {
    const arquivos = [];
    const alvos = ['biblioteca', 'blog', 'downloads'];
    for (const d of alvos) { if (fs.existsSync(path.join(ROOT, d))) walkHtml(path.join(ROOT, d), arquivos); }
    // HTMLs da raiz e das 18 pastas de idioma
    for (const entry of fs.readdirSync(ROOT, { withFileTypes: true })) {
        if (!entry.isDirectory()) continue;
        if (/^(\.git|node_modules|automacoes|backups-temporarios)$/.test(entry.name)) continue;
        walkHtml(path.join(ROOT, entry.name), arquivos);
    }
    for (const entry of fs.readdirSync(ROOT, { withFileTypes: true })) {
        if (entry.isFile() && entry.name.endsWith('.html')) arquivos.push(path.join(ROOT, entry.name));
    }
    // JS geradores que injetam classes fa-
    const jsExtra = ['build-biblioteca.js', 'build-downloads.js', 'build.js', 'glossary-search.js', 'downloads.template.html', 'item.template.html'];
    for (const f of jsExtra) { const p = path.join(ROOT, f); if (fs.existsSync(p)) arquivos.push(p); }

    const acc = {};
    for (const f of arquivos) {
        try { extrairNomes(fs.readFileSync(f, 'utf8'), acc); } catch (e) { console.error('ERRO', f, e.message); }
    }

    const lib = {};
    const faltando = [];
    const usadosNoAlias = {};
    for (const key of Object.keys(acc).sort()) {
        const [style, nome] = key.split(':');
        let alvo = nome;
        let viaAlias = false;
        if (!fs.existsSync(path.join(SVG_DIR, style, alvo + '.svg'))) {
            if (ALIAS[nome]) { alvo = ALIAS[nome]; viaAlias = true; }
        }
        const svg = lerSvg(style, alvo);
        if (svg) {
            lib[key] = { a: viaAlias ? alvo : undefined, vb: svg.vb, d: svg.inner };
            if (viaAlias) usadosNoAlias[nome] = alvo;
        } else {
            faltando.push(key);
        }
    }

    // Garante os ícones usados apenas em JS dinâmico (não capturados pelo scanner)
    for (const n of DINAMICOS) {
        const key = 'solid:' + n;
        if (lib[key]) continue;
        const svg = lerSvg('solid', n);
        if (svg) lib[key] = { vb: svg.vb, d: svg.inner };
    }

    fs.writeFileSync(OUT, JSON.stringify(lib, null, 2), 'utf8');
    fs.writeFileSync(REPORT, JSON.stringify({
        geradoEm: new Date().toISOString(),
        totalIcones: Object.keys(lib).length,
        totalArquivosAnalisados: arquivos.length,
        faltando,
        aliasAplicados: usadosNoAlias,
        contagem: acc
    }, null, 2), 'utf8');

    // ── Asset de navegador: ícones gerados dinamicamente por JS ─────────
    const faSvg = nome => {
        const i = lib['solid:' + nome];
        if (!i) return '';
        return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="' + i.vb + '" width="1em" height="1em" fill="currentColor" aria-hidden="true" focusable="false" style="vertical-align:-0.125em">' + i.d + '</svg>';
    };
    const escJs = s => String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    const mapaBrowser = DINAMICOS.map(n => '  "fa-' + n + '":"' + escJs(faSvg(n)) + '"').filter(s => !s.endsWith('""')).join(',\n');
    const browserAsset = '/* Ícones locais (SVGs oficiais substitutos do Font Awesome). Gerado por scripts/gerar-biblioteca-icones.js */\n(function(){\n"use strict";\nvar FA_SVG={\n' + mapaBrowser + '\n};\nwindow.svgFa=function(nome,cls,estilo){var d=FA_SVG[nome];if(!d){return "";}if(cls){d=d.replace(/^<svg/,"<svg class=\\""+cls+"\\"");}if(estilo){d=d.replace(/style="[^"]*"/,"style=\\""+estilo+"\\"");}return d;};\n})();\n';
    fs.writeFileSync(path.join(ROOT, 'icones-locais.js'), browserAsset, 'utf8');

    console.log('Ícones na biblioteca: ' + Object.keys(lib).length);
    console.log('Arquivos analisados: ' + arquivos.length);
    console.log('Faltando (sem SVG): ' + JSON.stringify(faltando));
    console.log('Alias aplicados: ' + JSON.stringify(usadosNoAlias));
    console.log('Gravado: ' + OUT);
    console.log('Gravado: icones-locais.js (' + DINAMICOS.length + ' ícones dinâmicos)');
}

main();
