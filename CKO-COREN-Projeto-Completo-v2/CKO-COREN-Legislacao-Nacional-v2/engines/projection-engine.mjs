/**
 * projection-engine — N-004
 * Produz um ValidatedProjectionDTO por superficie. O renderer so pode consumir
 * este DTO; nenhum renderer le o canonico diretamente.
 */
import { PROJECTIONS, BY_ID } from './projection-catalog.mjs';
import { validateProjection } from '../validators/projection-validator.mjs';
import { statusLabel } from './temporal-engine.mjs';

export const VERSION = '1.0.0';

/** Monta o payload permitido pela whitelist da superficie. */
function buildPayload(def, act, state, route) {
  const src = {
    canonical_id: act.canonical_id,
    identifier: act.identifier,
    title: act.title,
    act_type: act.act_type,
    date: act.date || null,
    issuer: { code: act.issuer.code, name: act.issuer.name, short_name: act.issuer.short_name },
    jurisdiction: { state: act.jurisdiction.state, country: act.jurisdiction.country },
    source: { url: act.source.url, host: act.source.host, authority_class: act.source.authority_class },
    legal_status_display: statusLabel(state.temporal),
    route: route?.route || null,
    canonical_url: route?.canonical_url || null,
    summary: act.summary || '',
    devices: (act.devices || []).map(d => ({ label: d.label, text: d.text, locator: d.locator || null })),
  };
  const out = {};
  for (const f of def.allowed_fields) if (src[f] !== undefined) out[f] = src[f];
  return out;
}

/**
 * @returns {{dtos: object[], blocked: object[]}}
 */
export function projectAct(act, state, ctx = {}) {
  const route = ctx.routes?.get(act.canonical_id) || null;
  const now = ctx.now || new Date().toISOString();
  const dtos = [];
  const blocked = [];

  for (const def of PROJECTIONS) {
    const payload = buildPayload(def, act, state, route);
    const spec = { projection_id: def.projection_id, payload };
    const validation = validateProjection(spec, act, state, ctx);

    const dto = {
      dto_type: 'ValidatedProjectionDTO',
      dto_version: '1.0.0',
      projection_id: def.projection_id,
      surface: def.surface,
      template: def.template,
      canonical_id: act.canonical_id,
      content_requirement: def.content_requirement,
      act_content_level: act.epistemic?.content_level,
      eligibility: {
        eligible: validation.eligible,
        reasons: validation.findings.map(f => `${f.code}: ${f.message}`),
      },
      epistemic_notice: def.asserts_normative_content
        ? 'Superfície normativa: só pode ser publicada com fragmentos de evidência resolvidos.'
        : 'Superfície de metadados/resumo: publica apenas o que o canônico sustenta, sempre com link para a fonte oficial.',
      payload: validation.eligible ? payload : null,
      validation: {
        gates: {
          SCHEMA: state.gates.SCHEMA.result,
          EVIDENCE: state.gates.EVIDENCE.result,
          TEMPORAL: state.gates.TEMPORAL.result,
          RELATIONS: state.gates.RELATIONS.result,
          IPE: state.gates.IPE.result,
          ALCOA: state.gates.ALCOA.result,
          PROJECTION: validation.result,
        },
        findings: validation.findings,
      },
      versions: {
        schema: act.schema_version,
        content: act.version_envelope?.content_version,
        source: act.version_envelope?.source_version,
        engine: `projection-engine@${VERSION}`,
        validator: `projection-validator@1.0.0`,
        renderer: null,
        template: ctx.templateVersion || '2.0.0',
      },
      generated_at: now,
    };

    (validation.eligible ? dtos : blocked).push(dto);
  }

  return { dtos, blocked };
}

/** DTO das paginas de listagem (hub nacional, hub regional, indice por tipo). */
export function projectIndex(kind, data, ctx = {}) {
  return {
    dto_type: 'ValidatedProjectionDTO',
    dto_version: '1.0.0',
    projection_id: kind === 'national' ? 'legislation/national-hub'
                 : kind === 'regional' ? 'legislation/regional-hub'
                 : 'legislation/type-index',
    surface: 'legislation',
    template: 'gerado/indice',
    canonical_id: null,
    content_requirement: 'METADATA',
    act_content_level: 'METADATA',
    eligibility: { eligible: true, reasons: [] },
    epistemic_notice: 'Índice de metadados. A ausência de atos é declarada explicitamente, nunca preenchida por inferência.',
    payload: data,
    validation: { gates: { SCHEMA: 'PASS', PROJECTION: 'PASS' }, findings: [] },
    versions: { engine: `projection-engine@${VERSION}`, template: ctx.templateVersion || '2.0.0' },
    generated_at: ctx.now || new Date().toISOString(),
  };
}

export { BY_ID };
