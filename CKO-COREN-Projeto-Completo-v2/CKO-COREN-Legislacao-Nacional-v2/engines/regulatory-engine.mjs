/**
 * regulatory-engine — N-001
 * Orquestra estado temporal, relacoes, aplicabilidade, lineage e elegibilidade de
 * projecao. NAO gera HTML, NAO conhece template, NAO toca no DOM.
 */
import { resolveTemporal, statusLabel } from './temporal-engine.mjs';
import { resolveRelations } from './relation-engine.mjs';
import { validateCanonical } from '../validators/schema-validator.mjs';
import { validateSourceEvidence } from '../validators/source-evidence-validator.mjs';
import { validateTemporalStatus } from '../validators/temporal-status-validator.mjs';
import { validateRelations } from '../validators/relation-validator.mjs';
import { validateIPE } from '../validators/ipe-validator.mjs';
import { validateALCOA } from '../validators/alcoa-validator.mjs';

export const VERSION = '1.0.0';

/**
 * @returns {object} RegulatoryStateObject (RSO)
 */
export function resolveRegulatoryState(act, ctx = {}) {
  const gates = {};
  const findings = [];

  gates.SCHEMA = validateCanonical(act, ctx.canonicalSchema, ctx.versions);
  const temporal = resolveTemporal(act, ctx);
  const relations = resolveRelations(act, ctx);

  gates.EVIDENCE = validateSourceEvidence(act, ctx);
  gates.TEMPORAL = validateTemporalStatus(act, temporal, ctx);
  gates.RELATIONS = validateRelations(act, relations);
  gates.IPE = validateIPE(act, ctx);
  gates.ALCOA = validateALCOA(act, ctx);

  for (const g of Object.values(gates)) findings.push(...(g.findings || []));
  findings.push(...temporal.findings, ...relations.findings);

  return {
    engine: 'regulatory-engine', version: VERSION,
    canonical_id: act.canonical_id,
    schema_version: act.schema_version,
    content_level: act.epistemic?.content_level,
    temporal,
    status_display: statusLabel(temporal),
    relations: relations.relations,
    applicability: relations.applicability,
    gates,
    findings,
    p0_count: findings.filter(f => f.severity === 'P0').length,
    p1_count: findings.filter(f => f.severity === 'P1').length,
  };
}
