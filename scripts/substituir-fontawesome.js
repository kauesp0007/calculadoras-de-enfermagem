/* eslint-env node */
/**
 * Substituição cirúrgica do Font Awesome externo por SVGs locais oficiais.
 *
 * 1. Remove linhas que carregam o kit externo (kit.fontawesome.com: dns-prefetch, script, preconnect...).
 * 2. Remove linhas de comentário que mencionam FontAwesome.
 * 3. Substitui <i class="...fa-X..."></i> por <svg> inline usando scripts/icones-fa.json
 *    (SVGs oficiais do pacote @fortawesome/fontawesome-free — mesmos glyphs, mesma geometria).
 * 4. Ajusta regras CSS simples cujo seletor termina em " i" para valerem também para " svg"
 *    (mantém tamanhos/cores idênticos, ex.: .sec-head .ic i{font-size:17px}).
 *
 * Uso:
 *   node scripts/substituir-fontawesome.js            -> simulação (relatório)
 *   node scripts/substituir-fontawesome.js --apply    -> aplica com backup em backups-temporarios/fa-migracao/
 */
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const LIB = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts', 'icones-fa.json'), 'utf8'));
const REPORT_PATH = path.join(ROOT, 'scripts', 'relatorio-substituicao-fa.json');
const BACKUP_DIR = path.join(ROOT, 'backups-temporarios', 'fa-migracao');

const APPLY = process.argv.includes('--apply');
const EXCLUDE_DIR = /^(|\.git|node_modules|automacoes|backups-temporarios|downloads|biblioteca|blog|blog-templates)$/;
// Arquivos proibidos de alterar (injetados globalmente / gerados) — nunca processar
const FILES_PROIBIDOS = new Set([
    'footer.html', 'menu-global.html', 'global-body-elements.html',
    'downloads.html', '_language_selector.html',
    'googlefc0a17cdd552164b.html'
]);

function coletarHtmls(dir, out) {
    let entries;
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch (e) { return; }
    for (const entry of entries) {
        if (entry.name.startsWith('.')) continue;
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            if (!EXCLUDE_DIR.test(entry.name)) coletarHtmls(full, out);
        } else if (entry.name.endsWith('.html')) {
            // arquivos proibidos (footer, menu-global, global-body-elements, downloads.html, _language_selector, googlefc...) — nunca processar
            if (FILES_PROIBIDOS.has(entry.name)) continue;
            out.push(full);
        }
    }
}

function extrairAtributos(attrs) {
    const out = { classe: '', outros: [] };
    const re = /([a-zA-Z-]+|data-[a-zA-Z-]+)(?:\s*=\s*("([^"]*)"|'([^']*)'))?/g;
    let m;
    while ((m = re.exec(attrs)) !== null) {
        const nome = m[1];
        const valor = m[3] !== undefined ? m[3] : (m[4] !== undefined ? m[4] : '');
        if (nome === 'class') { out.classe = valor; continue; }
        out.outros.push({ nome, valor });
    }
    return out;
}

function resolverIcone(tokens) {
    let style = null;
    const nomes = [];
    for (const t of tokens) {
        if (t === 'fas' || t === 'fa-solid') style = 'solid';
        else if (t === 'far' || t === 'fa-regular') style = 'regular';
        else if (t === 'fab' || t === 'fa-brands') style = 'brands';
        else if (/^fa-[a-z0-9-]+$/i.test(t)) nomes.push(t.slice(3));
    }
    if (!nomes.length) return null;
    const st = style || 'solid';
    const nome = nomes[nomes.length - 1];
    const key = st + ':' + nome;
    const icon = LIB[key];
    if (!icon) return null;
    return { key, vb: icon.vb, inner: icon.d };
}

function construirSvg(info, classeOriginal, outros) {
    const classes = ['icn'].concat(classeOriginal.split(/\s+/).filter(c => c && !c.startsWith('fa') && !/^(fas|far|fab|fa)$/.test(c)));
    let ariaHidden = 'true';
    const extras = [];
    let style = '';
    for (const o of outros) {
        if (o.nome === 'aria-hidden') { ariaHidden = o.valor || 'true'; continue; }
        if (o.nome === 'style') { style = o.valor; continue; }
        if (o.nome === 'title' || o.nome === 'aria-label' || o.nome === 'id' || o.nome.startsWith('data-')) {
            extras.push(`${o.nome}="${o.valor.replace(/"/g, '&quot;')}"`);
        }
    }
    const estilo = (style ? style + ';' : '') + 'vertical-align:-0.125em';
    const attrs = [
        `class="${classes.join(' ')}"`,
        'xmlns="http://www.w3.org/2000/svg"',
        `viewBox="${info.vb}"`,
        'width="1em"', 'height="1em"',
        'fill="currentColor"',
        `aria-hidden="${ariaHidden}"`,
        'focusable="false"',
        `style="${estilo}"`
    ].concat(extras);
    return `<svg ${attrs.join(' ')}>${info.inner}</svg>`;
}

function ajustarCss(conteudo, log) {
    let trocas = 0;
    const re = /(<style\b[^>]*>)([\s\S]*?)(<\/style>)/gi;
    const novo = conteudo.replace(re, (tudo, aberto, css, fecho) => {
        let cssNovo = css.replace(/([^{}]+)\{/g, (selCompleto, seletor) => {
            const partes = seletor.split(',');
            let mudou = false;
            const novas = partes.map(p => {
                const sel = p.trim();
                if (!sel) return p;
                if (/ i$/.test(sel) && !/[>+~:\[\]]/.test(sel) && sel !== 'i') {
                    mudou = true;
                    trocas++;
                    return `${p},${p.replace(/\s+i$/, ' svg')}`;
                }
                return p;
            });
            return (mudou ? novas.join(',') : seletor) + '{';
        });
        return aberto + cssNovo + fecho;
    });
    if (trocas) log.selectoresCssAjustados = trocas;
    return novo;
}

function processarArquivo(file) {
    const original = fs.readFileSync(file, 'utf8');
    const log = { arquivo: file.replace(ROOT + path.sep, ''), linhasRemovidas: 0, iconesSubstituidos: 0, naoSubstituidos: [] };

    let linhas = original.split('\n');
    const mantidas = [];
    for (const linha of linhas) {
        if (/kit\.fontawesome\.com|use\.fontawesome\.com|pro\.fontawesome\.com|fontawesome\.com\//i.test(linha)) { log.linhasRemovidas++; continue; }
        if (/cdnjs\.cloudflare\.com\/[^"']*font-awesome|maxcdn\.bootstrapcdn\.com\/[^"']*font-awesome/i.test(linha)) { log.linhasRemovidas++; continue; }
        const t = linha.trim();
        if (t.startsWith('<!--') && /fontawesome/i.test(t)) { log.linhasRemovidas++; continue; }
        mantidas.push(linha);
    }
    let conteudo = mantidas.join('\n');
    if (linhas.length !== mantidas.length) conteudo = conteudo;

    // Substituição dos <i>
    conteudo = conteudo.replace(/<i\b([^>]*)>\s*<\/i>/gi, (tudo, attrs) => {
        const parsed = extrairAtributos(attrs);
        if (!parsed.classe || !/fa/.test(parsed.classe)) return tudo;
        const info = resolverIcone(parsed.classe.split(/\s+/));
        if (!info) { log.naoSubstituidos.push(parsed.classe); return tudo; }
        log.iconesSubstituidos++;
        return construirSvg(info, parsed.classe, parsed.outros);
    });
    // <i ... /> autocontido
    conteudo = conteudo.replace(/<i\b([^>]*)\/>/gi, (tudo, attrs) => {
        const parsed = extrairAtributos(attrs);
        if (!parsed.classe || !/fa/.test(parsed.classe)) return tudo;
        const info = resolverIcone(parsed.classe.split(/\s+/));
        if (!info) { log.naoSubstituidos.push(parsed.classe); return tudo; }
        log.iconesSubstituidos++;
        return construirSvg(info, parsed.classe, parsed.outros);
    });

    // Ajuste de seletores CSS "X i" -> "X i, X svg"
    conteudo = ajustarCss(conteudo, log);

    return { original, conteudo, log };
}

function main() {
    const arquivos = [];
    coletarHtmls(ROOT, arquivos);

    const relatorio = { aplicado: APPLY, geradoEm: new Date().toISOString(), total: 0, alterados: 0, icones: 0, linhas: 0, arquivos: [] };

    for (const file of arquivos) {
        relatorio.total++;
        const { original, conteudo, log } = processarArquivo(file);
        if (conteudo === original) { if (log.naoSubstituidos.length) relatorio.arquivos.push(log); continue; }
        log.alterado = true;
        relatorio.arquivos.push(log);
        relatorio.alterados++;
        relatorio.icones += log.iconesSubstituidos;
        relatorio.linhas += log.linhasRemovidas;
        if (APPLY) {
            const rel = path.relative(ROOT, file);
            const bak = path.join(BACKUP_DIR, rel);
            fs.mkdirSync(path.dirname(bak), { recursive: true });
            fs.writeFileSync(bak, original, 'utf8');
            fs.writeFileSync(file, conteudo, 'utf8');
        }
    }

    fs.writeFileSync(REPORT_PATH, JSON.stringify(relatorio, null, 2), 'utf8');
    console.log('MODO: ' + (APPLY ? 'APLICADO' : 'SIMULAÇÃO'));
    console.log('Arquivos analisados: ' + relatorio.total);
    console.log('Arquivos alterados: ' + relatorio.alterados);
    console.log('Ícones substituídos: ' + relatorio.icones);
    console.log('Linhas de CDN removidas: ' + relatorio.linhas);
    const nao = [];
    for (const a of relatorio.arquivos) for (const n of (a.naoSubstituidos || [])) nao.push(a.arquivo + ' :: ' + n);
    console.log('Não substituídos: ' + (nao.length ? '\n  ' + nao.join('\n  ') : '0'));
    console.log('Relatório: ' + REPORT_PATH);
}

main();
