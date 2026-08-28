/**
 * resource-renderer — N-023
 * 14 recursos reutilizaveis a partir do ValidatedProjectionDTO.
 *
 * Cada familia tem um renderer proprio. Se o DTO nao for elegivel, o renderer
 * NAO improvisa: emite o artefato de bloqueio governado, com a razao tecnica.
 */
import { esc, documentShell, emptyState, epistemicBanner, renderBlocked } from './page-renderer.mjs';
export const VERSION = '1.0.0';

const HEAD = (title, desc) =>
  `<title>${esc(title)}</title>\n<meta name="description" content="${esc(desc)}">\n<meta name="robots" content="noindex,follow">`;

const wrap = (dto, depth, title, inner) => documentShell({
  headSeo: HEAD(title, `Recurso derivado do ato ${dto.canonical_id}.`),
  depth,
  bodyAttrs: `data-surface="resources" data-projection="${esc(dto.projection_id)}" data-canonical="${esc(dto.canonical_id)}"`,
  main: `<section class="panel"><h1>${esc(title)}</h1>${epistemicBanner(dto)}${inner}</section>`,
  dto,
});

/** Blocos permitidos por nivel — nenhum deles inventa conteudo. */
const metaTable = p => `<table class="evtable"><caption class="visually-hidden">Metadados canônicos do ato</caption>
<tbody>
<tr><th scope="row">Identificação</th><td>${esc(p.identifier)}</td></tr>
<tr><th scope="row">Título</th><td>${esc(p.title)}</td></tr>
<tr><th scope="row">Tipo</th><td>${esc(p.act_type)}</td></tr>
<tr><th scope="row">Data</th><td>${esc(p.date || 'não registrada')}</td></tr>
<tr><th scope="row">Emissor</th><td>${esc(p.issuer.name)}</td></tr>
<tr><th scope="row">Jurisdição</th><td>${esc(p.jurisdiction.state)}</td></tr>
<tr><th scope="row">Estado</th><td>${esc(p.legal_status_display.text)}</td></tr>
<tr><th scope="row">Fonte oficial</th><td><a href="${esc(p.source.url)}" rel="noopener noreferrer" target="_blank">${esc(p.source.host)}</a></td></tr>
</tbody></table>`;

const summaryBlock = p => `<h2>Resumo canônico</h2><p>${esc(p.summary)}</p>`;

const RENDERERS = {
  'resources/resumo': (p, dto) => `${summaryBlock(p)}${metaTable(p)}
<p class="rule-note">Resumo projetado do campo <code>summary</code> do canônico. Nenhuma síntese nova é gerada a partir de texto não adquirido.</p>`,

  'resources/guia-bolso': (p) => `<h2>Guia de bolso</h2>
<dl class="pocket">
<dt>Ato</dt><dd>${esc(p.identifier)}</dd>
<dt>Assunto</dt><dd>${esc(p.title)}</dd>
<dt>Alcance</dt><dd>${esc(p.jurisdiction.state)} — ato de conselho regional; não se aplica automaticamente a outras jurisdições.</dd>
<dt>Estado</dt><dd>${esc(p.legal_status_display.text)}</dd>
<dt>Onde conferir</dt><dd><a href="${esc(p.source.url)}" rel="noopener noreferrer" target="_blank">${esc(p.source.host)}</a></dd>
</dl>${summaryBlock(p)}`,

  'resources/slides': (p) => `<h2>Slides</h2>
<ol class="slides">
<li class="slide"><h3>${esc(p.identifier)}</h3><p>${esc(p.title)}</p></li>
<li class="slide"><h3>Contexto</h3><p>${esc(p.issuer.name)} — ${esc(p.jurisdiction.state)}</p></li>
<li class="slide"><h3>Resumo</h3><p>${esc(p.summary)}</p></li>
<li class="slide"><h3>Estado jurídico</h3><p>${esc(p.legal_status_display.text)}</p><p>${esc(p.legal_status_display.note)}</p></li>
<li class="slide"><h3>Fonte</h3><p>${esc(p.source.url)}</p></li>
</ol>`,

  'resources/infografico': (p) => `<h2>Infográfico (dados)</h2>
<p class="rule-note">Camada de dados do infográfico. A arte é gerada pelo media-projection-engine a partir destes mesmos campos.</p>
${metaTable(p)}`,
};

export function renderResource(dto, depth = 1) {
  const title = dto.projection_id.split('/')[1];
  if (!dto.eligibility.eligible) {
    return documentShell({
      headSeo: HEAD(`Recurso bloqueado · ${title}`, 'Superfície bloqueada pelo release gate.'),
      depth,
      bodyAttrs: `data-surface="resources" data-projection="${esc(dto.projection_id)}" data-blocked="true"`,
      main: renderBlocked(dto),
      dto,
    });
  }
  const fn = RENDERERS[dto.projection_id];
  const inner = fn ? fn(dto.payload, dto)
    : emptyState('Renderer específico não implementado para esta família elegível.');
  return wrap(dto, depth, title, inner);
}

export const IMPLEMENTED = Object.keys(RENDERERS);
