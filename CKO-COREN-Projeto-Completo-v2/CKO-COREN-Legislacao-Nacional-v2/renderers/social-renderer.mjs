/**
 * social-renderer — N-024
 * OG / X / LinkedIn / Square / Story / Carousel a partir do DTO validado.
 * Produz (a) HTML de composicao e (b) a media-spec consumida pelo media engine.
 */
import { esc, documentShell, renderBlocked } from './page-renderer.mjs';
export const VERSION = '1.0.0';

export const FORMATS = {
  'social/og-default':     { w: 1200, h: 630,  klass: 'og' },
  'social/x-summary-card': { w: 1200, h: 628,  klass: 'og' },
  'social/linkedin-card':  { w: 1200, h: 627,  klass: 'og' },
  'social/square-post':    { w: 1080, h: 1080, klass: 'square' },
  'social/story':          { w: 1080, h: 1920, klass: 'story' },
  'social/carousel-cover': { w: 1080, h: 1080, klass: 'square' },
  'social/carousel-slide': { w: 1080, h: 1080, klass: 'square' },
};

export function renderSocial(dto, depth = 1) {
  const fmt = FORMATS[dto.projection_id];
  if (!dto.eligibility.eligible) {
    return documentShell({
      headSeo: `<title>Social bloqueado</title><meta name="robots" content="noindex">`,
      depth, bodyAttrs: `data-surface="social" data-blocked="true"`,
      main: renderBlocked(dto), dto,
    });
  }
  const p = dto.payload;
  const body = `<section class="social-frame ${fmt.klass}" role="img" aria-label="${esc(p.identifier)} — ${esc(p.title)}">
<p class="social-kicker">${esc(p.issuer.short_name)} · ${esc(p.act_type)}</p>
<h1>${esc(p.identifier)}</h1>
<p>${esc(p.title)}</p>
${dto.content_requirement === 'SUMMARY' ? `<p class="social-sum">${esc(p.summary)}</p>` : ''}
<div class="social-foot"><span>${esc(p.jurisdiction.state)}</span><span>${esc(p.legal_status_display.text)}</span></div>
</section>`;
  return documentShell({
    headSeo: `<title>${esc(p.identifier)} · ${esc(dto.projection_id)}</title><meta name="robots" content="noindex">`,
    depth, bodyAttrs: `data-surface="social" data-projection="${esc(dto.projection_id)}"`,
    main: body, dto,
  });
}

/** media-spec deterministica consumida pelo media-projection-engine. */
export function mediaSpec(dto) {
  const fmt = FORMATS[dto.projection_id];
  const p = dto.payload;
  return {
    projection_id: dto.projection_id,
    canonical_id: dto.canonical_id,
    width: fmt.w, height: fmt.h,
    fields: {
      kicker: `${p.issuer.short_name} · ${p.act_type}`,
      title: p.identifier,
      subtitle: p.title,
      footer_left: p.jurisdiction.state,
      footer_right: p.legal_status_display.text,
      summary: dto.content_requirement === 'SUMMARY' ? p.summary : '',
    },
    palette: { bg_from: '#163269', bg_to: '#234F88', fg: '#FFFFFF', muted: '#DBEAFE' },
    output: `generated/social/${dto.canonical_id.toLowerCase()}-${dto.projection_id.split('/')[1]}.png`,
  };
}
