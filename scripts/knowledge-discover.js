/* eslint-env node */
/**
 * knowledge-discover.js — DESCOBERTA DE CONHECIMENTO (Discovery)
 *
 * Consulta a base /knowledge/ e produz um DOSSIÊ para o agente de criação.
 * NÃO escreve HTML. Saída: JSON no stdout (ou --pretty para leitura humana).
 *
 * Uso:
 *   node scripts/knowledge-discover.js "Processo de Enfermagem"
 *   node scripts/knowledge-discover.js "parada cardiorrespiratória" --pretty
 */

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const K = p => path.join(ROOT, 'knowledge', p);
const PRETTY = process.argv.includes('--pretty');

const termoRaw = process.argv.slice(2).find(a => !a.startsWith('--')) || '';
if (!termoRaw) { console.error('Uso: node scripts/knowledge-discover.js "<tema>"'); process.exit(1); }

const slug = s => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const tokens = s => (slug(s).match(/[a-z0-9]+/g) || []);

function ler(nome) { try { return JSON.parse(fs.readFileSync(K(nome), 'utf8')); } catch { return null; } }

const pages = ler('pages.json') || [];
const rels = (ler('relationships.json') || {}).relations || [];
const backlinks = (ler('relationships.json') || {}).backlinks || {};
const images = ler('images.json') || [];
const references = ler('references.json') || [];
const legislation = ler('legislation.json') || [];
const scales = ler('scales.json') || [];
const calculators = ler('calculators.json') || [];
const aliases = ler('aliases.json') || {};
const taxonomy = ler('taxonomy.json') || [];

const byFile = Object.fromEntries(pages.map(p => [p.file, p]));
const q = slug(termoRaw);
const qtokens = tokens(termoRaw).filter(w => w.length > 2);
const aliasSet = new Set(qtokens);
const expand = [];
if (aliases[q]) aliases[q].forEach(a => expand.push(a));
Object.entries(aliases).forEach(([k, vals]) => {
    if (qtokens.includes(k) || vals.some(v => q.includes(v))) { expand.push(k, ...vals); }
});

function scorePagina(p) {
    const alvo = slug((p.title || '') + ' ' + (p.h1 || '') + ' ' + (p.keywords || []).join(' ') + ' ' + (p.h2 || []).join(' '));
    let s = 0;
    if (slug(p.title).includes(q)) s += 6;
    if (slug(p.h1 || '').includes(q)) s += 4;
    qtokens.forEach(t => { if (alvo.includes(t)) s += 2; });
    expand.forEach(t => { if (alvo.includes(t)) s += 1.5; });
    return s;
}

const pontuadas = pages.map(p => ({ file: p.file, title: p.title, tipo: p.tipo, score: scorePagina(p) }))
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score);

const relatedPages = pontuadas.slice(0, 15).map(x => ({ ...x, why: x.score >= 6 ? 'título/H1 idêntico ao tema' : x.score >= 3 ? 'palavras-chave/headings sobrepostos' : 'menção parcial' }));

// legislação / escalas / calculadoras / referências / imagens relacionadas
const legRel = legislation.filter(l => qtokens.some(t => slug(l.name).includes(t)) || expand.some(t => slug(l.name).includes(t)));
const escRel = scales.filter(s => qtokens.some(t => slug(s.title).includes(t)));
const calcRel = calculators.filter(c => qtokens.some(t => slug(c.title).includes(t)));
const refRel = references.filter(r => qtokens.some(t => slug(r.texto || '').includes(t)) || expand.some(t => slug(r.texto || '').includes(t)));
const imgRel = images.filter(i => qtokens.some(t => slug(i.file + ' ' + (i.alt || '')).includes(t)) || expand.some(t => slug(i.file).includes(t)));

// candidatos a backlink: páginas que NÃO citam a página-mãe mas têm afinidade
const alvoFiles = new Set(pontuadas.slice(0, 3).map(x => x.file));
const backlinkCandidates = [];
for (const p of pages) {
    if (alvoFiles.has(p.file)) continue;
    const links = p.links_out || [];
    const missing = [...alvoFiles].filter(f => !links.includes(f));
    if (missing.length && scorePagina(p) > 4) {
        backlinkCandidates.push({ file: p.file, title: p.title, missing_links: missing, why: 'forte afinidade e não referencia a(s) página(s) principal(is)' });
    }
}

const dossier = {
    requested_topic: termoRaw,
    primary_topic: (pontuadas[0] || {}).title || null,
    related_topics: relatedPages.slice(0, 5).map(p => p.title),
    synonyms: expand,
    pages_related: relatedPages,
    scales_related: escRel,
    calculators_related: calcRel,
    legislation_related: legRel,
    references_related: refRel,
    images_related: imgRel.slice(0, 10).map(i => ({ file: i.file, alt: i.alt, category: i.category, pages_count: i.pages_count })),
    didactic_assets: pontuadas.slice(0, 6).map(x => ({ file: x.file, components: (byFile[x.file] || {}).didactic_components || [] })),
    internal_links_recommended: relatedPages.slice(0, 10).map(x => x.file),
    backlink_candidates: backlinkCandidates.slice(0, 10),
    historical_connections: [],
    verification_flags: [],
    confidence: { source: 'knowledge-index', note: 'Índice semântico — NÃO é fonte primária. Validar legislação/referências nas fontes oficiais.' }
};

if (PRETTY) {
    console.log('TEMA SOLICITADO: ' + dossier.requested_topic);
    console.log('PÁGINAS RELACIONADAS:');
    dossier.pages_related.forEach(p => console.log('  - ' + p.file + ' (' + p.tipo + ') :: ' + p.why));
    console.log('ESCALAS: ' + (escRel.map(s => s.file).join(', ') || '—'));
    console.log('CALCULADORAS: ' + (calcRel.map(c => c.file).join(', ') || '—'));
    console.log('LEGISLAÇÃO: ' + (legRel.map(l => l.name).join(' | ') || '—'));
    console.log('REFERÊNCIAS: ' + refRel.length);
    console.log('IMAGENS: ' + dossier.images_related.map(i => i.file).join(', ') || '—');
    console.log('LINKS RECOMENDADOS: ' + dossier.internal_links_recommended.join(', ') || '—');
    console.log('BACKLINKS POTENCIAIS:');
    dossier.backlink_candidates.forEach(b => console.log('  - ' + b.file + ' (faltam: ' + b.missing_links.join(', ') + ')'));
} else {
    console.log(JSON.stringify(dossier, null, 2));
}
