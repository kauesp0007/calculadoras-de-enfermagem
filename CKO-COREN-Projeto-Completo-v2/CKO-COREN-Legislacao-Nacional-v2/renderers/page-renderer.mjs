/**
 * page-renderer — renderer PURO das paginas de legislacao.
 *
 * Contrato: recebe ValidatedProjectionDTO + head SEO ja materializado e devolve
 * HTML. Nao resolve estado, nao decide elegibilidade, nao le canonico, nao infere
 * nada. Se o DTO nao for elegivel, o renderer emite o bloco de bloqueio governado.
 */
export const VERSION = '1.0.0';

export const esc = v => String(v ?? '').replace(/[&<>"']/g, m =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));

const up = n => n <= 0 ? './' : '../'.repeat(n);

/** Cabecalho comum + shell modular. Depth = niveis abaixo da raiz do pacote. */
export function documentShell({ headSeo, depth, bodyAttrs = '', main, dto, extraHead = '' }) {
  const rel = up(depth);
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="theme-color" content="#1A3E74">
${headSeo}
<link href="/public/output.css" rel="stylesheet">
<link href="/global-styles.css" rel="stylesheet">
<link href="${rel}assets/css/coren-regulatory-production.css" rel="stylesheet">
${extraHead}
<script src="${rel}assets/js/cko-production-shell-loader.js" defer></script>
<script type="module" src="${rel}assets/js/coren-regulatory-renderer.js"></script>
</head>
<body ${bodyAttrs}>
<a href="#mount" class="skip-link">Pular para o conteúdo principal</a>
<div id="accessibility-placeholder" data-module="accessibility"></div>
<div id="global-header-container" data-module="header"></div>
<div id="language-selector-placeholder" data-module="language"></div>
<main id="mount" class="main-content">
${main}
</main>
<div id="footer-placeholder" data-module="footer"></div>
<script type="application/json" id="projection-dto">${JSON.stringify(dto).replace(/</g, '\\u003c')}</script>
</body>
</html>
`;
}

export function crumbs(items) {
  const last = items[items.length - 1];
  const links = items.slice(0, -1)
    .map(b => `<a href="${esc(b.route)}">${esc(b.name)}</a>`).join('<span aria-hidden="true"> › </span>');
  return `<nav class="crumbs" aria-label="Trilha de navegação"><ol class="crumbs-list">${
    items.slice(0, -1).map(b => `<li><a href="${esc(b.route)}">${esc(b.name)}</a></li>`).join('')
  }<li><span aria-current="page">${esc(last.name)}</span></li></ol></nav>`;
}

export function hero({ kicker, title, sub, chips = [] }) {
  return `<section class="hero">
<p class="eyebrow">${esc(kicker)}</p>
<h1>${esc(title)}</h1>
<p>${esc(sub)}</p>
<ul class="chips">${chips.map(c => `<li class="chip">${esc(c)}</li>`).join('')}</ul>
</section>`;
}

export function epistemicBanner(dto) {
  return `<aside class="status-note" role="note">
<strong>Qualificação epistêmica:</strong> ${esc(dto.epistemic_notice)}
Nível de conteúdo sustentado pela fonte: <code>${esc(dto.act_content_level || 'METADATA')}</code>.
O sistema não infere vigência, revogação, dispositivos nem força normativa.
</aside>`;
}

export function statusBadge(st) {
  return `<p class="badge ${esc(st.tone)}" title="${esc(st.note)}">${esc(st.text)}</p>
<p class="badge-note">${esc(st.note)}</p>`;
}

export function actionBar({ sourceUrl, pdfHref }) {
  return `<div class="actionbar" role="group" aria-label="Ações do documento">
<button type="button" class="act" data-action="fav" aria-pressed="false">Favoritar</button>
<button type="button" class="act" data-action="review" aria-pressed="false">Marcar para revisão</button>
<button type="button" class="act" data-action="listen">Ouvir</button>
<button type="button" class="act" data-action="share">Copiar link</button>
<button type="button" class="act" data-action="print">Imprimir</button>
${pdfHref ? `<a class="act" href="${esc(pdfHref)}">Baixar PDF</a>` : ''}
${sourceUrl ? `<a class="act primary" href="${esc(sourceUrl)}" rel="noopener noreferrer" target="_blank">Fonte oficial (abre em nova aba)</a>` : ''}
<button type="button" class="act" data-action="clear-local">Limpar dados locais</button>
</div>`;
}

export function cardAct(a) {
  return `<li><a class="card" href="${esc(a.route)}">
<span class="kicker">${esc(a.issuer)} · ${esc(a.act_type_label)}</span>
<span class="card-title">${esc(a.identifier)}</span>
<span class="card-desc">${esc(a.title)}</span>
<span class="badge ${esc(a.status.tone)}">${esc(a.status.text)}</span>
</a></li>`;
}

export function emptyState(text) {
  return `<p class="status-note" role="status">${esc(text)}</p>`;
}

/** ---------------- hub nacional ---------------- */
export function renderNationalHub(dto) {
  const d = dto.payload;
  const councils = d.councils.map(c => `<li><a class="card" href="${esc(c.route)}">
<span class="kicker">${esc(c.short_name)}</span>
<span class="card-title">${esc(c.jurisdiction)}</span>
<span class="card-desc">${esc(c.acts_count)} ato(s) canonizado(s) neste pacote</span>
<span class="badge warn">descoberta exaustiva pendente</span>
</a></li>`).join('');

  return crumbs(d.breadcrumbs) + hero({
    kicker: 'COREN · 27 jurisdições',
    title: 'Legislação dos Conselhos Regionais de Enfermagem',
    sub: 'Hub nacional dos atos regionais com fonte oficial, jurisdição, tipo, estado qualificado e projeções governadas.',
    chips: [`${d.councils.length} CORENs`, `${d.acts.length} atos canonizados`, 'Sem inferência jurídica',
            'Conteúdo pré-renderizado'],
  }) + epistemicBanner(dto) + `
<section class="panel" aria-labelledby="h-councils">
<h2 id="h-councils">Conselhos Regionais</h2>
<ul class="grid grid-4 plain">${councils}</ul>
</section>
<section class="panel" aria-labelledby="h-acts">
<h2 id="h-acts">Atos canonizados no pacote</h2>
${d.acts.length ? `<ul class="grid grid-3 plain">${d.acts.map(cardAct).join('')}</ul>`
  : emptyState('Nenhum ato canonizado.')}
</section>`;
}

/** ---------------- hub regional ---------------- */
export function renderRegionalHub(dto) {
  const d = dto.payload;
  const types = d.types.map(t => `<li><a class="card" href="${esc(t.route)}">
<span class="kicker">${esc(t.id)}</span>
<span class="card-title">${esc(t.label)}</span>
<span class="card-desc">${esc(t.qualification_rule)}</span>
<span class="badge">${esc(t.count)} ato(s)</span>
</a></li>`).join('');

  return crumbs(d.breadcrumbs) + hero({
    kicker: `${d.council.short_name} · ${d.council.jurisdiction}`,
    title: `Legislação ${d.council.short_name}`,
    sub: `Atos públicos do ${d.council.name}, organizados por tipo jurídico e qualificação de fonte.`,
    chips: [d.council.jurisdiction, `${d.acts.length} ato(s) canonizado(s)`, 'aquisição exaustiva pendente'],
  }) + epistemicBanner(dto) + actionBar({ sourceUrl: d.council.official_site }) + `
<div class="layout">
<div>
<section class="panel" aria-labelledby="h-types">
<h2 id="h-types">Explorar por tipo de ato</h2>
<ul class="grid grid-3 plain">${types}</ul>
</section>
<section class="panel" aria-labelledby="h-regacts">
<h2 id="h-regacts">Atos canonizados deste regional</h2>
${d.acts.length ? `<ul class="grid grid-2 plain">${d.acts.map(cardAct).join('')}</ul>`
  : emptyState('Nenhum ato deste regional foi canonizado neste pacote porque a descoberta/aquisição oficial ainda está pendente. A ausência é declarada; nada é preenchido por inferência.')}
</section>
</div>
${sidebar(d.sidebar)}
</div>`;
}

/** ---------------- índice por tipo ---------------- */
export function renderTypeIndex(dto) {
  const d = dto.payload;
  return crumbs(d.breadcrumbs) + hero({
    kicker: `${d.council.short_name} · ${d.type.id}`,
    title: `${d.type.label} · ${d.council.short_name}`,
    sub: `Índice regional de ${d.type.label.toLowerCase()} com fonte, estado e qualificação explícitos.`,
    chips: [d.council.jurisdiction, d.type.label, 'sem inferência de força normativa'],
  }) + epistemicBanner(dto) + `
<section class="panel" aria-labelledby="h-filter">
<h2 id="h-filter" class="visually-hidden">Filtrar atos</h2>
<div class="search">
<label class="visually-hidden" for="actSearch">Buscar por número, assunto ou ano</label>
<input id="actSearch" type="search" placeholder="Buscar por número, assunto ou ano..." autocomplete="off">
<p class="badge" id="actCount" role="status" aria-live="polite">${d.acts.length} ato(s)</p>
</div>
</section>
<section class="panel" aria-labelledby="h-list">
<h2 id="h-list">${esc(d.type.label)}</h2>
<p class="rule-note"><strong>Regra de qualificação:</strong> ${esc(d.type.qualification_rule)}</p>
${d.acts.length ? `<ul class="grid grid-2 plain" id="actGrid">${d.acts.map(cardAct).join('')}</ul>`
  : emptyState('Nenhum ato desta categoria foi materializado no pacote. A página está pronta para consumir os canônicos após aquisição oficial — nenhum item é criado por inferência.')}
</section>`;
}

/** ---------------- leitor do ato ---------------- */
export function renderActReader(dto, extra) {
  if (!dto.eligibility.eligible) return renderBlocked(dto);
  const d = dto.payload;
  const rel = extra.relations.map(r => `<li class="card">
<span class="kicker">${esc(r.class)} · ${esc(r.effective_force)}</span>
<span class="card-title">${esc(r.label)}</span>
<span class="card-desc">${esc(r.target)}</span>
<span class="card-note">${esc(r.display_note)}</span>
</li>`).join('');

  const events = extra.temporal.events.map(e => `<li class="event${e.kind === 'STATUS_EVENT' ? ' revoked' : ''}">
<span class="kicker">${esc(e.date)}</span>
<span class="card-title">${esc(e.label)}</span>
<span class="card-note">origem: ${esc(e.source)}</span>
</li>`).join('');

  const ev = extra.evidence;
  const evRows = [
    ['Snapshot oficial', ev.snapshot, 'Cópia oficial do documento preservada com MIME, bytes e SHA-256 registrados.'],
    ['Fragmentos localizados', ev.fragments, 'Artigo/parágrafo localizado dentro do snapshot.'],
    ['IPE', ev.ipe, 'Completude e exatidão da informação produzida pela entidade.'],
    ['ALCOA++', ev.alcoa, 'Atributos de integridade da evidência.'],
    ['CAAT de reperformance', ev.caat, 'Reexecução determinística da leitura contra a fonte oficial.'],
  ].map(([k, v, note]) => `<tr><th scope="row">${esc(k)}</th><td><span class="badge ${v.ok ? 'green' : 'warn'}">${esc(v.label)}</span></td><td>${esc(note)}</td></tr>`).join('');

  const projections = extra.projections;

  return crumbs(d.breadcrumbs || extra.breadcrumbs) + hero({
    kicker: `${d.issuer.short_name} · ${extra.typeLabel}`,
    title: d.identifier,
    sub: d.title,
    chips: [d.jurisdiction.state, d.date || 'sem data registrada', `nível de conteúdo: ${dto.act_content_level}`],
  }) + epistemicBanner(dto) + actionBar({ sourceUrl: d.source.url, pdfHref: extra.pdfHref }) + `
<div class="layout">
<div>
<section class="panel" aria-labelledby="h-sum">
<h2 id="h-sum">Resumo canônico</h2>
<p>${d.summary
  ? esc(d.summary)
  : `Resumo não projetado nesta superfície: o nível de conteúdo sustentado pela fonte para este ato é ${esc(dto.act_content_level)}. O que a fonte declara sobre o estado do ato aparece no bloco de estado jurídico e nas relações.`}</p>
${statusBadge(d.legal_status_display)}
</section>
<section class="panel" aria-labelledby="h-text">
<h2 id="h-text">Texto e dispositivos</h2>
${extra.devicesBlocked
  ? emptyState('O texto integral e os dispositivos não foram materializados neste pacote. O leitor não fabrica conteúdo ausente: consulte a fonte oficial pelo botão acima. As superfícies que dependeriam desse texto estão bloqueadas pelo release gate.')
  : `<ol class="devices">${(d.devices || []).map(x => `<li><h3>${esc(x.label)}</h3><p>${esc(x.text)}</p></li>`).join('')}</ol>`}
</section>
<section class="panel" aria-labelledby="h-rel">
<h2 id="h-rel">Relações declaradas</h2>
${rel ? `<ul class="grid grid-2 plain">${rel}</ul>` : emptyState('Sem relações qualificadas materializadas.')}
</section>
<section class="panel" aria-labelledby="h-tl">
<h2 id="h-tl">Linha do tempo</h2>
<ul class="timeline plain">${events}</ul>
</section>
<section class="panel" aria-labelledby="h-ev">
<h2 id="h-ev">Cadeia de evidência</h2>
<table class="evtable">
<caption class="visually-hidden">Situação de cada elo da cadeia probatória deste ato</caption>
<thead><tr><th scope="col">Elo</th><th scope="col">Situação</th><th scope="col">O que significa</th></tr></thead>
<tbody>${evRows}</tbody>
</table>
</section>
<section class="panel" aria-labelledby="h-proj">
<h2 id="h-proj">Projeções governadas</h2>
<p class="rule-note">${esc(projections.eligible.length)} superfície(s) liberada(s) · ${esc(projections.blocked.length)} bloqueada(s) por falta de evidência.</p>
<div class="grid grid-2">
<div class="card"><span class="kicker">liberadas</span><ul class="tight">${projections.eligible.map(p => `<li>${esc(p)}</li>`).join('')}</ul></div>
<div class="card"><span class="kicker">bloqueadas</span><ul class="tight">${projections.blocked.map(p => `<li>${esc(p)}</li>`).join('')}</ul></div>
</div>
</section>
</div>
${sidebar(extra.sidebar)}
</div>`;
}

export function renderBlocked(dto) {
  return `<section class="panel"><h1>Projeção bloqueada pelo release gate</h1>
${emptyState('Esta superfície exige conteúdo normativo sustentado por evidência adquirida. O gate está fechado (fail-closed) e nenhum conteúdo é gerado por inferência.')}
<ul class="tight">${dto.eligibility.reasons.map(r => `<li>${esc(r)}</li>`).join('')}</ul>
</section>`;
}

export function sidebar(items = []) {
  return `<aside class="sidebar" aria-label="Informações complementares">${items.map(s => `<section class="side">
<h2>${esc(s.title)}</h2>
${s.html || `<p>${esc(s.text)}</p>`}
</section>`).join('')}</aside>`;
}
