/**
 * seo-schema-engine — N-028
 * Materializa title/description/canonical/robots/OG/Twitter/JSON-LD em BUILD TIME.
 * Nada de SEO depende de JavaScript no cliente.
 *
 * Politica de tipos Schema.org (corrigida em v2):
 *  - Paginas de ato: WebPage + Legislation + BreadcrumbList.
 *  - Indices: CollectionPage + ItemList + BreadcrumbList.
 *  - Article e LearningResource nao sao emitidos: o pacote nao possui conteudo
 *    editorial autoral nem recursos de aprendizagem liberados por evidencia.
 *  - Nao emitimos tipos descontinuados para rich results (HowTo, FAQPage, Quiz).
 */
import { SCHEMA_TYPES } from './projection-catalog.mjs';
export const VERSION = '1.0.0';

const SITE = 'https://www.calculadorasdeenfermagem.com.br';
const SITE_NAME = 'Calculadoras de Enfermagem';

export function truncate(s, n) {
  const t = String(s || '').replace(/\s+/g, ' ').trim();
  if (t.length <= n) return t;
  return t.slice(0, n - 1).replace(/[\s,;:.-]+\S*$/, '') + '…';
}

export function siteUrl(route) {
  return `${SITE}${route.startsWith('/') ? '' : '/'}${route}`;
}

/**
 * @param {object} page {kind, route, title, description, breadcrumbs, items, act, statusText, ogImage}
 */
export function buildSeo(page) {
  const canonical = siteUrl(page.route);
  const description = truncate(page.description, 158);
  const title = truncate(page.title, 62);
  const ogImage = page.ogImage ? siteUrl(page.ogImage) : `${SITE}/og/legislacao-coren.png`;

  const meta = {
    title,
    description,
    canonical,
    robots: page.noindex ? 'noindex,follow' : 'index,follow,max-image-preview:large',
    og: {
      'og:type': page.kind === 'act' ? 'article' : 'website',
      'og:site_name': SITE_NAME,
      'og:locale': 'pt_BR',
      'og:title': title,
      'og:description': description,
      'og:url': canonical,
      'og:image': ogImage,
      'og:image:width': '1200',
      'og:image:height': '630',
      'og:image:alt': `Cartao de legislacao: ${truncate(page.title, 90)}`,
    },
    twitter: {
      'twitter:card': 'summary_large_image',
      'twitter:title': title,
      'twitter:description': description,
      'twitter:image': ogImage,
      'twitter:image:alt': `Cartao de legislacao: ${truncate(page.title, 90)}`,
    },
  };

  return { meta, jsonld: buildJsonLd(page, canonical, description) };
}

function breadcrumbList(breadcrumbs) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((b, i) => ({
      '@type': 'ListItem', position: i + 1, name: b.name, item: siteUrl(b.route),
    })),
  };
}

function buildJsonLd(page, canonical, description) {
  const graph = [];
  const types = SCHEMA_TYPES[page.kind] || SCHEMA_TYPES.act;

  if (types.includes('WebPage')) {
    graph.push({
      '@type': 'WebPage', '@id': `${canonical}#webpage`, url: canonical,
      name: page.title, description, inLanguage: 'pt-BR',
      isPartOf: { '@type': 'WebSite', name: SITE_NAME, url: SITE },
    });
  }
  if (types.includes('CollectionPage')) {
    graph.push({
      '@type': 'CollectionPage', '@id': `${canonical}#collection`, url: canonical,
      name: page.title, description, inLanguage: 'pt-BR',
      isPartOf: { '@type': 'WebSite', name: SITE_NAME, url: SITE },
    });
  }
  if (types.includes('ItemList')) {
    graph.push({
      '@type': 'ItemList', '@id': `${canonical}#itemlist`,
      numberOfItems: (page.items || []).length,
      itemListElement: (page.items || []).map((it, i) => ({
        '@type': 'ListItem', position: i + 1, name: it.name, url: siteUrl(it.route),
      })),
    });
  }
  if (types.includes('Legislation') && page.act) {
    const a = page.act;
    const leg = {
      '@type': 'Legislation', '@id': `${canonical}#legislation`,
      name: a.identifier,
      legislationIdentifier: a.canonical_id,
      legislationType: a.act_type,
      legislationJurisdiction: `${a.jurisdiction.state}, ${a.jurisdiction.country}`,
      legislationPassedBy: { '@type': 'GovernmentOrganization', name: a.issuer.name },
      inLanguage: 'pt-BR',
      url: canonical,
      sameAs: a.source.url,
    };
    if (a.date) leg.legislationDate = a.date;
    // legislationLegalForce so e emitido quando o estado esta VERIFICADO por evidencia.
    if (page.legalForce) leg.legislationLegalForce = page.legalForce;
    graph.push(leg);
  }
  if (types.includes('BreadcrumbList') && page.breadcrumbs?.length) {
    graph.push(breadcrumbList(page.breadcrumbs));
  }

  return { '@context': 'https://schema.org', '@graph': graph };
}

export function renderHead(seo) {
  const esc = s => String(s).replace(/[&<>"]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));
  const lines = [
    `<title>${esc(seo.meta.title)}</title>`,
    `<meta name="description" content="${esc(seo.meta.description)}">`,
    `<meta name="robots" content="${esc(seo.meta.robots)}">`,
    `<link rel="canonical" href="${esc(seo.meta.canonical)}">`,
  ];
  for (const [k, v] of Object.entries(seo.meta.og)) lines.push(`<meta property="${k}" content="${esc(v)}">`);
  for (const [k, v] of Object.entries(seo.meta.twitter)) lines.push(`<meta name="${k}" content="${esc(v)}">`);
  lines.push(`<script type="application/ld+json">${JSON.stringify(seo.jsonld)}</script>`);
  return lines.join('\n');
}

export { SITE, SITE_NAME };
