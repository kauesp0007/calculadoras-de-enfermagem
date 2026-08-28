/**
 * projection-catalog — contrato das superficies de projecao.
 *
 * Cada superficie declara:
 *  - content_requirement: nivel minimo de conteudo sustentado por fonte
 *  - allowed_fields: campos do canonico que a superficie pode projetar (whitelist)
 *  - asserts_normative_content: se a saida afirma conteudo normativo do ato
 *  - template: arquivo de template associado
 *
 * A whitelist e a razao de o motor nao poder "vazar" texto normativo para uma
 * superficie que nao tem evidencia para sustenta-lo.
 */
export const VERSION = '1.0.0';

export const CONTENT_LEVELS = ['METADATA', 'SUMMARY', 'FULL_TEXT_DEVICES'];

export function levelRank(level) {
  const i = CONTENT_LEVELS.indexOf(level);
  return i < 0 ? -1 : i;
}

const META = ['canonical_id', 'identifier', 'title', 'act_type', 'date', 'issuer', 'jurisdiction',
              'source', 'legal_status_display', 'route', 'canonical_url'];
const SUM = [...META, 'summary'];
const FULL = [...SUM, 'devices'];

const P = (id, surface, template, content_requirement, allowed_fields, asserts, note) =>
  ({ projection_id: id, surface, template, content_requirement, allowed_fields,
     asserts_normative_content: asserts, note });

export const PROJECTIONS = [
  // ---- legislation (paginas do runtime de legislacao)
  P('legislation/regional-hub', 'legislation', 'gerado/hub-regional', 'METADATA', META, false,
    'Hub regional lista atos ja canonizados do regional.'),
  P('legislation/type-index', 'legislation', 'gerado/indice-tipo', 'METADATA', META, false,
    'Indice por tipo juridico dentro de um regional.'),
  P('legislation/act-reader', 'legislation', 'gerado/leitor-ato', 'METADATA', META, false,
    'Leitor do ato: metadados, estado qualificado, relacoes e link para fonte oficial.'),

  // ---- pages (blocos internos do leitor)
  P('pages/rich-reference', 'pages', 'gerado/bloco-referencia', 'METADATA', META, false, ''),
  P('pages/timeline', 'pages', 'gerado/bloco-timeline', 'METADATA', META, false, ''),
  P('pages/relations', 'pages', 'gerado/bloco-relacoes', 'METADATA', META, false, ''),
  P('pages/evidence', 'pages', 'gerado/bloco-evidencia', 'METADATA', META, false,
    'Bloco de evidencia: mostra o que existe e o que falta na cadeia probatoria.'),
  P('pages/article', 'pages', 'gerado/artigo-editorial', 'FULL_TEXT_DEVICES', FULL, true,
    'Artigo editorial sobre o ato exige texto integral com evidencia.'),

  // ---- resources (14)
  P('resources/resumo', 'resources', 'templates/resources/resumo.html', 'SUMMARY', SUM, false, ''),
  P('resources/guia-bolso', 'resources', 'templates/resources/guia-bolso.html', 'SUMMARY', SUM, false, ''),
  P('resources/slides', 'resources', 'templates/resources/slides.html', 'SUMMARY', SUM, false, ''),
  P('resources/infografico', 'resources', 'templates/resources/infografico.html', 'SUMMARY', SUM, false, ''),
  P('resources/checklist', 'resources', 'templates/resources/checklist.html', 'FULL_TEXT_DEVICES', FULL, true,
    'Checklist operacional derivaria obrigacoes do texto: exige dispositivos com evidencia.'),
  P('resources/flashcards', 'resources', 'templates/resources/flashcards.html', 'FULL_TEXT_DEVICES', FULL, true, ''),
  P('resources/glossario', 'resources', 'templates/resources/glossario.html', 'FULL_TEXT_DEVICES', FULL, true, ''),
  P('resources/quiz', 'resources', 'templates/resources/quiz.html', 'FULL_TEXT_DEVICES', FULL, true, ''),
  P('resources/simulado', 'resources', 'templates/resources/simulado.html', 'FULL_TEXT_DEVICES', FULL, true, ''),
  P('resources/questoes-comentadas', 'resources', 'templates/resources/questoes-comentadas.html',
    'FULL_TEXT_DEVICES', FULL, true, ''),
  P('resources/mapa-mental', 'resources', 'templates/resources/mapa-mental.html', 'FULL_TEXT_DEVICES', FULL, true, ''),
  P('resources/caso-aplicado', 'resources', 'templates/resources/caso-aplicado.html', 'FULL_TEXT_DEVICES', FULL, true, ''),
  P('resources/podcast', 'resources', 'templates/resources/podcast.html', 'FULL_TEXT_DEVICES', FULL, true, ''),
  P('resources/video', 'resources', 'templates/resources/video.html', 'FULL_TEXT_DEVICES', FULL, true, ''),

  // ---- social (7)
  P('social/og-default', 'social', 'templates/social/og-default.html', 'METADATA', META, false, '1200x630'),
  P('social/x-summary-card', 'social', 'templates/social/x-summary-card.html', 'METADATA', META, false, '1200x628'),
  P('social/linkedin-card', 'social', 'templates/social/linkedin-card.html', 'METADATA', META, false, '1200x627'),
  P('social/square-post', 'social', 'templates/social/square-post.html', 'METADATA', META, false, '1080x1080'),
  P('social/story', 'social', 'templates/social/story.html', 'METADATA', META, false, '1080x1920'),
  P('social/carousel-cover', 'social', 'templates/social/carousel-cover.html', 'METADATA', META, false, '1080x1080'),
  P('social/carousel-slide', 'social', 'templates/social/carousel-slide.html', 'SUMMARY', SUM, false, '1080x1080'),

  // ---- pdf (5)
  P('pdf/summary', 'pdf', 'templates/pdf/summary.html', 'SUMMARY', SUM, false, ''),
  P('pdf/pocket-guide', 'pdf', 'templates/pdf/pocket-guide.html', 'SUMMARY', SUM, false, ''),
  P('pdf/longform', 'pdf', 'templates/pdf/longform.html', 'FULL_TEXT_DEVICES', FULL, true, ''),
  P('pdf/flashcards', 'pdf', 'templates/pdf/flashcards.html', 'FULL_TEXT_DEVICES', FULL, true, ''),
  P('pdf/simulation', 'pdf', 'templates/pdf/simulation.html', 'FULL_TEXT_DEVICES', FULL, true, ''),
];

/**
 * Tipos Schema.org permitidos.
 * Article e LearningResource foram REMOVIDOS do catalogo v1:
 *  - Article afirmaria conteudo editorial autoral que o pacote nao possui;
 *  - LearningResource so poderia descrever recursos que estao bloqueados por evidencia.
 * Correcao registrada no relatorio de auditoria v2.
 */
export const SCHEMA_TYPES = {
  national: ['CollectionPage', 'ItemList', 'BreadcrumbList'],
  regional: ['CollectionPage', 'ItemList', 'BreadcrumbList'],
  type: ['CollectionPage', 'ItemList', 'BreadcrumbList'],
  act: ['WebPage', 'Legislation', 'BreadcrumbList'],
};

export const BY_ID = new Map(PROJECTIONS.map(p => [p.projection_id, p]));
export const BY_SURFACE = PROJECTIONS.reduce((acc, p) => {
  (acc[p.surface] ||= []).push(p);
  return acc;
}, {});
