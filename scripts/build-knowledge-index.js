/* eslint-env node */
/**
 * build-knowledge-index.js — ÍNDICE DE CONHECIMENTO DO SITE (Rede de Conhecimento)
 *
 * Gera a base de conhecimento estruturada em /knowledge/ a partir dos HTMLs da raiz.
 * A base é um ÍNDICE + RELACIONAMENTO — NÃO é fonte primária da verdade.
 *
 * Uso:
 *   node scripts/build-knowledge-index.js            -> incremental (só arquivos alterados)
 *   node scripts/build-knowledge-index.js --full     -> reindexação completa (com backup dos JSONs)
 *   node scripts/build-knowledge-index.js --file X   -> reindexa apenas um arquivo (usado pelo hook)
 *
 * Exclusões respeitadas: pastas downloads, biblioteca, blog, blog-templates, node_modules,
 * .git, automacoes, backups*, idiomas (en..uk) e arquivos proibidos.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, 'knowledge');
const REPORT_DIR = path.join(OUT_DIR, 'reports');
const HASH_FILE = path.join(OUT_DIR, '.hashes.json');
const BACKUP_DIR = path.join(ROOT, 'backups-temporarios', 'knowledge');

const ARGS = process.argv.slice(2);
const FULL = ARGS.includes('--full');
const ONLY_FILE = (() => { const i = ARGS.indexOf('--file'); return i !== -1 ? ARGS[i + 1] : null; })();

const IDIOMAS = new Set(['en', 'es', 'de', 'it', 'fr', 'hi', 'zh', 'ar', 'ja', 'ru', 'ko', 'tr', 'nl', 'pl', 'sv', 'id', 'vi', 'uk']);
const DIRS_PROIBIDAS = /^(\.git|node_modules|automacoes|backups|downloads|biblioteca|blog|blog-templates|public|src|dist|locales|fonts|js|css|font|assets|admin|institucionais|\.vscode|img|governance|scripts|knowledge)$/i;
const FILES_PROIBIDOS = new Set([
    'footer.html', 'menu-global.html', 'global-body-elements.html', 'downloads.html',
    'menu-lateral.html', '_language_selector.html', 'googlefc0a17cdd552164b.html'
]);

const slug = s => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const tokens = s => (slug(s).match(/[a-z0-9]+/g) || []);
const stopwords = new Set(['de', 'da', 'do', 'das', 'dos', 'e', 'a', 'o', 'as', 'os', 'em', 'no', 'na', 'para', 'com', 'por', 'que', 'ou', 'um', 'uma', 'sobre', 'como', 'entre', 'ao', 'aos']);

// ── Aliases / siglas (curado + detectado) ──────────────────────────────
const ALIASES_CURADOS = {
    'pcr': ['parada cardiorrespiratoria', 'reanimacao cardiopulmonar', 'rcp'],
    'rcp': ['reanimacao cardiopulmonar', 'pcr', 'parada cardiorrespiratoria'],
    'sbv': ['suporte basico de vida'],
    'sav': ['suporte avancado de vida'],
    'sae': ['sistematizacao da assistencia de enfermagem'],
    'pe': ['processo de enfermagem'],
    'nanda': ['nanda-i', 'nanda internacional'],
    'sus': ['sistema unico de saude'],
    'cofen': ['conselho federal de enfermagem'],
    'coren': ['conselho regional de enfermagem', 'corens'],
    'cepe': ['codigo de etica dos profissionais de enfermagem'],
    'utia': ['unidade de terapia intensiva', 'uti'],
    'cti': ['centro de terapia intensiva', 'uti']
};

// ── Leitura do registro canônico de páginas ─────────────────────────────
function lerRegistroPaginas() {
    const reg = path.join(ROOT, 'relatorio_paginas.txt');
    const map = {};
    if (!fs.existsSync(reg)) return map;
    const txt = fs.readFileSync(reg, 'utf8');
    for (const linha of txt.split('\n')) {
        const m = linha.match(/^\s*(.+?\.html)\s*=\s*(.+?)\s*=\s*(https?:\/\/\S+)\s*$/);
        if (m) map[m[1].trim()] = { titulo: m[2].trim(), url: m[3].trim() };
    }
    return map;
}

function coletarHtmlsRaiz() {
    const out = [];
    for (const nome of fs.readdirSync(ROOT)) {
        const full = path.join(ROOT, nome);
        const st = fs.statSync(full);
        if (st.isDirectory()) continue; // só arquivos da raiz
        if (!nome.endsWith('.html')) continue;
        if (FILES_PROIBIDOS.has(nome)) continue;
        out.push(nome);
    }
    return out.sort();
}

function hash(texto) { return crypto.createHash('sha1').update(texto, 'utf8').digest('hex'); }

function carregarHashes() {
    try { return JSON.parse(fs.readFileSync(HASH_FILE, 'utf8')); } catch { return {}; }
}
function salvarHashes(h) { fs.writeFileSync(HASH_FILE, JSON.stringify(h, null, 2), 'utf8'); }

// ── Extrações por página ────────────────────────────────────────────────
function extrairPagina(nomeArquivo, conteudo, registro) {
    const t = registro[nomeArquivo] || {};
    const h1 = (conteudo.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || [])[1] || '';
    const h2s = [...conteudo.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/gi)].map(m => limpar(m[1])).filter(Boolean);
    const h3s = [...conteudo.matchAll(/<h3[^>]*>([\s\S]*?)<\/h3>/gi)].map(m => limpar(m[1])).filter(Boolean);
    const metaDesc = (conteudo.match(/<meta[^>]+name="description"[^>]+content="([^"]*)"/i) || [])[1] || '';
    const metaKeys = (conteudo.match(/<meta[^>]+name="keywords"[^>]+content="([^"]*)"/i) || [])[1] || '';
    const titleTag = (conteudo.match(/<title>([\s\S]*?)<\/title>/i) || [])[1] || '';

    // links internos (href para .html do próprio site)
    const links = [];
    for (const m of conteudo.matchAll(/<a\b[^>]*href="([^"]+\.html)[^"]*"/gi)) {
        let href = m[1];
        if (href.startsWith('http')) { const u = new URL(href); href = u.pathname; }
        let alvo = href.replace(/^\/+/, '').split('#')[0].split('?')[0];
        if (!alvo || !alvo.endsWith('.html')) continue;
        if (alvo === nomeArquivo) continue;
        if (!links.includes(alvo)) links.push(alvo);
    }

    // imagens
    const imagens = [];
    for (const m of conteudo.matchAll(/<img\b([^>]*)>/gi)) {
        const attrs = m[1];
        const src = (attrs.match(/src="([^"]+)"/i) || [])[1] || '';
        const alt = (attrs.match(/alt="([^"]*)"/i) || [])[1] || '';
        if (!src) continue;
        imagens.push({ src, alt });
    }

    // referências (seção data-references-section ou .refs ou #referencias)
    const referencias = [];
    const refBloco = (conteudo.match(/data-references-section="v1"[\s\S]*?(?=<\/section>|<section)/i) || [])[0]
        || (conteudo.match(/<section[^>]*id="referencias"[\s\S]*?(?=<\/section>)/i) || [])[0]
        || '';
    if (refBloco) {
        for (const m of refBloco.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)) {
            const txt = limpar(m[1]);
            if (!txt || txt.length < 12) continue;
            const url = (txt.match(/https?:\/\/\S+/i) || [])[0] || '';
            const semUrl = txt.replace(/https?:\/\/\S+/gi, '').replace(/Disponível em:?/gi, '').trim();
            referencias.push({ texto: txt, url, autor: extrairAutor(semUrl), verification_required: !url });
        }
    }

    // legislação mencionada
    const legis = [];
    const reLeg = /(Lei (?:Complementar )?n?[ºo]?\s*\d+(?:[./-]\d+)*\/\d{4})|(Decreto n?[ºo]?\s*\d+(?:[./-]\d+)*\/\d{4})|(Resolu[cç][ãa]o Cofen n?[ºo]?\s*\d+\/\d{4})|(Portaria [A-Za-z]+\/MS n?[ºo]?\s*\d+\/\d{4})|(NR-\d+)/gi;
    for (const m of conteudo.matchAll(reLeg)) { const v = (m[1] || m[2] || m[3] || m[4] || m[5]).trim(); if (v && !legis.includes(v)) legis.push(v); }

    // componentes didáticos
    const did = {
        quiz: (conteudo.match(/class="[^"]*quiz|data-quiz|QUIZ\s*=/gi) || []).length > 0,
        tabela: /<table\b/i.test(conteudo),
        fluxograma: /class="[^"]*flow|flow-node/i.test(conteudo),
        timeline: /class="[^"]*timeline|tl-row|tl-step/i.test(conteudo),
        cards: /class="[^"]*card/i.test(conteudo),
        accordion: /<details\b/i.test(conteudo),
        lightbox: /class="[^"]*lightbox/i.test(conteudo)
    };
    const componentes = Object.keys(did).filter(k => did[k]);

    // classificação por título/keywords
    const rotulo = (t.titulo || titleTag || '').toLowerCase() + ' ' + metaKeys.toLowerCase();
    let tipo = 'conteudo';
    if (/escala/.test(rotulo)) tipo = 'escala';
    else if (/calculadora|calculo|formula|c[aá]lculo/.test(rotulo)) tipo = 'calculadora';
    else if (/indice|score|classifica[cç][aã]o|avalia[cç][aã]o/.test(rotulo)) tipo = 'escala';
    else if (/simulado/.test(rotulo)) tipo = 'simulado';
    else if (/guia|fundamental|r[aá]pido/.test(rotulo)) tipo = 'guia';
    else if (/lei |decreto |resolu[cç][aã]o |portaria |legisla/.test(rotulo)) tipo = 'legislacao';
    else if (/etica|c[aá]digo/.test(rotulo)) tipo = 'etica';

    const titulo = t.titulo || titleTag || nomeArquivo;
    return {
        file: nomeArquivo,
        title: titulo,
        title_tag: titleTag,
        url: t.url || ('https://www.calculadorasdeenfermagem.com.br/' + nomeArquivo),
        h1: limpar(h1) || titulo,
        h2: h2s.slice(0, 20),
        h3_count: h3s.length,
        meta_description: metaDesc,
        keywords: metaKeys.split(',').map(k => k.trim()).filter(Boolean),
        tipo,
        links_out: links,
        images: imagens,
        references: referencias,
        legislation: legis,
        didactic_components: componentes
    };
}

function limpar(txt) {
    return String(txt || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}
function extrairAutor(txt) {
    const m = txt.match(/^([A-ZÀ-Ú][^,.;]{2,80})[.,;]/);
    return m ? m[1].trim() : '';
}

// ── Construção das relações e índices agregados ─────────────────────────
function construirRelacoes(pages) {
    const byFile = Object.fromEntries(pages.map(p => [p.file, p]));
    const rels = [];
    const backlinks = {}; // alvo -> [origem]
    pages.forEach(p => { p.links_out.forEach(alvo => { (backlinks[alvo] = backlinks[alvo] || []).push(p.file); }); });

    // 1. relações por link explícito (confiança alta)
    pages.forEach(p => {
        p.links_out.forEach(alvo => {
            if (!byFile[alvo]) return;
            rels.push({ a: p.file, b: alvo, type: 'cross_reference', confidence: 'high', evidence: 'internal_link' });
        });
    });

    // 2. afinidade por sobreposição de keywords + título (confiança média/baixa)
    const chaves = pages.map(p => {
        const kws = new Set(tokens((p.keywords || []).join(' ') + ' ' + p.title));
        stopwords.forEach(s => kws.delete(s));
        return { file: p.file, set: kws, n: kws.size };
    });
    for (let i = 0; i < chaves.length; i++) {
        for (let j = i + 1; j < chaves.length; j++) {
            const a = chaves[i], b = chaves[j];
            if (!a.n || !b.n) continue;
            let inter = 0; a.set.forEach(w => { if (b.set.has(w)) inter++; });
            const score = inter / Math.sqrt(a.n * b.n);
            if (score >= 0.28) {
                rels.push({ a: a.file, b: b.file, type: 'related_topic', confidence: score >= 0.5 ? 'medium' : 'low', evidence: 'keyword_overlap', score: +score.toFixed(2) });
            }
        }
    }

    // 3. afinidade por legislação compartilhada
    const porLeg = {};
    pages.forEach(p => { p.legislation.forEach(l => { (porLeg[l] = porLeg[l] || []).push(p.file); }); });
    Object.entries(porLeg).forEach(([l, arr]) => {
        for (let i = 0; i < arr.length; i++) for (let j = i + 1; j < arr.length; j++) {
            rels.push({ a: arr[i], b: arr[j], type: 'legislation_relation', confidence: 'high', evidence: l });
        }
    });

    // órfãs: apenas páginas públicas da raiz sem links_in (templates/utilitários/duplicados excluídos).
    // Links vindos do menu/footer (fragmentos globais, somente leitura) também contam como in-link.
    const FRAGMENTOS = new Set(['header.html', 'item.template.html', 'downloads.template.html', 'offline.html', 'ativar-admin.html', 'politicaapp.html']);
    const fontesExtras = {};
    for (const frag of ['menu-global.html', 'footer.html']) {
        const fp = path.join(ROOT, frag);
        if (!fs.existsSync(fp)) continue;
        const c = fs.readFileSync(fp, 'utf8');
        for (const m of c.matchAll(/href="([^"]+\.html)"/gi)) {
            const alvo = m[1].replace(/^\/+/, '').split('#')[0].split('?')[0];
            if (!alvo || alvo.includes('/') || FILES_PROIBIDOS.has(alvo) || FRAGMENTOS.has(alvo)) continue;
            (fontesExtras[alvo] = fontesExtras[alvo] || []).push(frag);
        }
    }
    const inCount = {};
    pages.forEach(p => p.links_out.forEach(alvo => { inCount[alvo] = (inCount[alvo] || 0) + 1; }));
    Object.keys(fontesExtras).forEach(alvo => { inCount[alvo] = (inCount[alvo] || 0) + 1; });
    const ehPublica = p => !FRAGMENTOS.has(p.file) && !/\.min\.html$/.test(p.file) && !/(^[a-z]{2}_|_en\.html$)/.test(p.file) && !/^(index|mapa-do-site|conteudos-do-site|downloads)/.test(p.file);
    const orfas = pages.filter(p => ehPublica(p) && !inCount[p.file]).map(p => p.file);

    return { rels, backlinks, orfas, inCount };
}

function construirImagens(pages) {
    const map = {};
    pages.forEach(p => {
        p.images.forEach(im => {
            const src = im.src.replace(/^\/+/, '');
            if (!map[src]) map[src] = { file: src, alt: im.alt, pages: [], contexts: [] };
            map[src].pages.push(p.file);
            if (im.alt) map[src].contexts.push(im.alt.slice(0, 120));
        });
    });
    const list = Object.values(map).map(im => {
        const n = im.file.toLowerCase();
        let categoria = 'ilustracao';
        if (/logo/.test(n)) categoria = 'logo';
        else if (/icon|icone/.test(n)) categoria = 'icone';
        else if (/histor|decada|foto|album|registro/.test(n)) categoria = 'foto';
        else if (/banner|infogra|grafico|fluxo|esquema/.test(n)) categoria = 'infografico';
        else if (/institu/.test(n)) categoria = 'institucional';
        im.category = categoria;
        im.pages_count = im.pages.length;
        im.shared = ['logo', 'icone', 'institucional'].includes(categoria);
        im.duplicated = im.pages.length > 1;
        delete im.contexts;
        return im;
    });
    return list;
}

function construirTaxonomia(pages) {
    const grupos = { 'Emergência': [], 'Enfermagem': [], 'Legislação': [], 'Escalas': [], 'Calculadoras': [], 'Saúde Pública': [], 'Gestão': [], 'Outros': [] };
    pages.forEach(p => {
        const r = slug(p.title + ' ' + p.keywords.join(' '));
        if (/emerg|pcr|rcp|sbv|sav|choque|trauma|urgen|parada|ressuscit|atendimento inicial|sinais vitais/.test(r)) grupos['Emergência'].push(p.file);
        if (/enfermagem|sae|processo de enfermagem|nanda|nic|noc|teoria|semiologia|anamnese|exame fisico/.test(r)) grupos['Enfermagem'].push(p.file);
        if (/lei |decreto |resolu|c[aá]digo de |etica|cofen|coren|portaria|legisla|nr-/.test(r)) grupos['Legislação'].push(p.file);
        if (p.tipo === 'escala') grupos['Escalas'].push(p.file);
        if (p.tipo === 'calculadora') grupos['Calculadoras'].push(p.file);
        if (/sus|vacina|imuniza|notifica|vigilancia|saude publica|epidemio|humaniza|pn/.test(r)) grupos['Saúde Pública'].push(p.file);
        if (/gestao|dimensionamento|lideranca|administra|recursos|rescisao|ferias|hora extra|adicional|clt/.test(r)) grupos['Gestão'].push(p.file);
    });
    const com = [];
    Object.entries(grupos).forEach(([nome, arr]) => { if (arr.length) com.push({ topico: nome, pages: [...new Set(arr)] }); });
    return com;
}

// ── MAIN ────────────────────────────────────────────────────────────────
function main() {
    fs.mkdirSync(OUT_DIR, { recursive: true });
    fs.mkdirSync(REPORT_DIR, { recursive: true });

    const registro = lerRegistroPaginas();
    const arquivos = coletarHtmlsRaiz();
    const hashes = carregarHashes();

    const alvo = ONLY_FILE ? [path.basename(ONLY_FILE)] : arquivos;
    const processar = alvo.filter(f => fs.existsSync(path.join(ROOT, f)));

    if (FULL) {
        // backup dos JSONs atuais antes de reindexação completa
        fs.mkdirSync(BACKUP_DIR, { recursive: true });
        const ts = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 15);
        for (const f of fs.readdirSync(OUT_DIR)) {
            if (f.endsWith('.json') && !f.startsWith('.')) {
                fs.copyFileSync(path.join(OUT_DIR, f), path.join(BACKUP_DIR, f + '.' + ts + '.bak'));
            }
        }
    }

    let pages = [];
    const pagesFile = path.join(OUT_DIR, 'pages.json');
    if (fs.existsSync(pagesFile)) { try { pages = JSON.parse(fs.readFileSync(pagesFile, 'utf8')); } catch { pages = []; } }
    const pageMap = Object.fromEntries(pages.map(p => [p.file, p]));

    let alterados = 0, ignorados = 0;
    for (const nome of processar) {
        const conteudo = fs.readFileSync(path.join(ROOT, nome), 'utf8');
        const h = hash(conteudo);
        if (!FULL && hashes[nome] === h && pageMap[nome]) { ignorados++; continue; }
        const novo = extrairPagina(nome, conteudo, registro);
        pageMap[nome] = novo;
        hashes[nome] = h;
        alterados++;
    }

    pages = Object.values(pageMap);
    // remove páginas que deixaram de existir no disco
    pages = pages.filter(p => fs.existsSync(path.join(ROOT, p.file)));

    const { rels, backlinks, orfas, inCount } = construirRelacoes(pages);
    const imagens = construirImagens(pages);
    const taxonomia = construirTaxonomia(pages);

    // scales / calculators / legislation / references agregados
    const scales = pages.filter(p => p.tipo === 'escala').map(p => ({ file: p.file, title: p.title, keywords: p.keywords }));
    const calculators = pages.filter(p => p.tipo === 'calculadora').map(p => ({ file: p.file, title: p.title, keywords: p.keywords }));
    const legislation = [];
    const legMap = {};
    pages.forEach(p => p.legislation.forEach(l => { (legMap[l] = legMap[l] || []).push(p.file); }));
    Object.entries(legMap).forEach(([l, arr]) => legislation.push({ name: l, pages: arr }));
    const references = [];
    pages.forEach(p => p.references.forEach(r => { references.push({ ...r, page: p.file }); }));

    // aliases: curados + siglas detectadas entre parênteses no título
    const aliases = { ...ALIASES_CURADOS };
    pages.forEach(p => {
        const m = p.title.match(/\(([^)]{1,12})\)/);
        if (m) { const sigla = slug(m[1]); if (sigla.length >= 2 && sigla.length <= 8 && !aliases[sigla]) aliases[sigla] = [slug(p.title.replace(/\([^)]*\)/g, '').trim())]; }
    });

    // links quebrados REAIS: apenas .html simples da raiz, não proibido, não template e inexistente no disco.
    // Subpastas (biblioteca/, downloads/, blog/, bvs/, idiomas...) são FORA DO ESCOPO, não quebrados.
    const FRAGMENTOS = new Set(['header.html', 'item.template.html', 'downloads.template.html']);
    const ehAlvoQuebrado = alvo => {
        if (!alvo || alvo.includes('/')) return false;
        if (FILES_PROIBIDOS.has(alvo) || FRAGMENTOS.has(alvo)) return false;
        return !pageMap[alvo] && !fs.existsSync(path.join(ROOT, alvo));
    };
    const quebrados = {};
    pages.forEach(p => p.links_out.forEach(alvo => { if (ehAlvoQuebrado(alvo)) (quebrados[p.file] = quebrados[p.file] || []).push(alvo); }));

    fs.writeFileSync(pagesFile, JSON.stringify(pages, null, 2), 'utf8');
    fs.writeFileSync(path.join(OUT_DIR, 'relationships.json'), JSON.stringify({ relations: rels, backlinks, orphans: orfas, in_count: inCount }, null, 2), 'utf8');
    fs.writeFileSync(path.join(OUT_DIR, 'images.json'), JSON.stringify(imagens, null, 2), 'utf8');
    fs.writeFileSync(path.join(OUT_DIR, 'references.json'), JSON.stringify(references, null, 2), 'utf8');
    fs.writeFileSync(path.join(OUT_DIR, 'legislation.json'), JSON.stringify(legislation, null, 2), 'utf8');
    fs.writeFileSync(path.join(OUT_DIR, 'scales.json'), JSON.stringify(scales, null, 2), 'utf8');
    fs.writeFileSync(path.join(OUT_DIR, 'calculators.json'), JSON.stringify(calculators, null, 2), 'utf8');
    fs.writeFileSync(path.join(OUT_DIR, 'taxonomy.json'), JSON.stringify(taxonomia, null, 2), 'utf8');
    fs.writeFileSync(path.join(OUT_DIR, 'aliases.json'), JSON.stringify(aliases, null, 2), 'utf8');
    fs.writeFileSync(path.join(OUT_DIR, 'didactic-assets.json'), JSON.stringify(pages.map(p => ({ file: p.file, components: p.didactic_components })).filter(p => p.components.length), null, 2), 'utf8');

    salvarHashes(hashes);

    // relatório de cobertura
    const report = {
        generated_at: new Date().toISOString(),
        mode: FULL ? 'full' : (ONLY_FILE ? 'single' : 'incremental'),
        htmls_analisados: alterados,
        htmls_ignorados: ignorados,
        htmls_total: pages.length,
        imagens_catalogadas: imagens.length,
        imagens_reutilizadas: imagens.filter(i => i.duplicated).length,
        imagens_reutilizacao_conteudo: imagens.filter(i => i.duplicated && !i.shared).length,
        referencias_catalogadas: references.length,
        referencias_incompletas: references.filter(r => r.verification_required).length,
        legislacoes_encontradas: legislation.length,
        escalas: scales.length,
        calculadoras: calculators.length,
        relacoes: rels.length,
        paginas_orfas: orfas.length,
        links_quebrados: Object.keys(quebrados).length,
        alerts: {
            orphans: orfas,
            broken_links: quebrados,
            duplicate_content_images: imagens.filter(i => i.duplicated && !i.shared).map(i => i.file),
            shared_images: imagens.filter(i => i.duplicated && i.shared).map(i => i.file),
            references_incomplete: references.filter(r => r.verification_required).map(r => ({ page: r.page, texto: r.texto.slice(0, 100) }))
        }
    };
    fs.writeFileSync(path.join(REPORT_DIR, 'index-report.json'), JSON.stringify(report, null, 2), 'utf8');

    console.log('[KNOWLEDGE] Indexação concluída.');
    console.log('[KNOWLEDGE] HTMLs analisados: ' + alterados + ' | ignorados (inalterados): ' + ignorados);
    console.log('[KNOWLEDGE] Total indexado: ' + pages.length + ' páginas');
    console.log('[KNOWLEDGE] Relações: ' + rels.length + ' | imagens: ' + imagens.length + ' | referências: ' + references.length);
    console.log('[KNOWLEDGE] Escalas: ' + scales.length + ' | calculadoras: ' + calculators.length + ' | legislações: ' + legislation.length);
    console.log('[KNOWLEDGE] Órfãs: ' + orfas.length + ' | links quebrados: ' + Object.keys(quebrados).length);
}

main();
