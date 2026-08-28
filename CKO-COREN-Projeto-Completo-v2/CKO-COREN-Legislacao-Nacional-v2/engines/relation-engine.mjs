/**
 * relation-engine — N-003
 * Resolve relacoes tipadas e aplicabilidade. Nunca infere forca normativa.
 */
export const VERSION = '1.0.0';

/** Relacoes que alteram o estado de OUTRO ato. Exigem evidencia para produzir efeito. */
const STATE_CHANGING = new Set(['REVOKES', 'REVOKED_BY', 'AMENDS', 'AMENDED_BY']);

const LABEL = {
  CITES: 'Cita',
  REVOKES: 'Revoga',
  REVOKED_BY: 'Revogado por',
  AMENDS: 'Altera',
  AMENDED_BY: 'Alterado por',
  GOVERNS_INTERNAL_PROCESS: 'Rege processo interno',
  STATUS_EVENT: 'Evento de status',
  RELATES_TO: 'Relaciona-se com',
};

export function resolveRelations(act, ctx = {}) {
  const findings = [];
  const fragments = ctx.fragments instanceof Map ? ctx.fragments : new Map();
  const catalogIds = ctx.catalogIds instanceof Set ? ctx.catalogIds : new Set();

  const resolved = (act.relationships || []).map((r, i) => {
    const hasFragment = !!(r.evidence_fragment_ref && fragments.has(r.evidence_fragment_ref));
    const internal = !!(r.target_canonical_id && catalogIds.has(r.target_canonical_id));

    if (STATE_CHANGING.has(r.type) && !hasFragment) {
      findings.push({
        code: 'REL-001', severity: 'P0',
        message: `Relação "${r.type}" altera o estado de um ato sem fragmento de evidência; efeito suprimido.`,
        subject: `${act.canonical_id}#rel-${i}`,
      });
    }
    if (r.force_declared === 'BINDING_PER_SOURCE' && !hasFragment) {
      findings.push({
        code: 'REL-002', severity: 'P0',
        message: 'Força vinculante declarada sem evidência; rebaixada para NOT_DECLARED na projeção.',
        subject: `${act.canonical_id}#rel-${i}`,
      });
    }
    if (r.target_canonical_id && !internal) {
      findings.push({
        code: 'REL-003', severity: 'P1',
        message: `target_canonical_id "${r.target_canonical_id}" não existe no catálogo.`,
        subject: `${act.canonical_id}#rel-${i}`,
      });
    }

    const effectiveForce = hasFragment ? r.force_declared : 'NOT_DECLARED';
    return {
      index: i,
      type: r.type,
      label: LABEL[r.type] || r.type,
      target: r.target,
      target_canonical_id: internal ? r.target_canonical_id : null,
      class: r.class,
      force_declared: r.force_declared,
      effective_force: effectiveForce,
      evidence_backed: hasFragment,
      produces_state_effect: STATE_CHANGING.has(r.type) && hasFragment,
      display_note: hasFragment
        ? 'Relação sustentada por fragmento de evidência.'
        : 'Relação registrada como referência declarada; sem evidência localizada, não produz efeito de estado.',
    };
  });

  // Aplicabilidade: derivada apenas da jurisdicao declarada.
  const applicability = {
    scope: 'REGIONAL',
    jurisdiction: act.jurisdiction?.state || null,
    issuer: act.issuer?.code || null,
    audience_note: 'Ato de conselho regional. Não se aplica automaticamente a outras jurisdições.',
    federal_instruments_cited: resolved
      .filter(r => r.type === 'CITES')
      .map(r => r.target),
    inference_used: false,
  };

  return {
    engine: 'relation-engine', version: VERSION,
    canonical_id: act.canonical_id,
    relations: resolved,
    applicability,
    findings,
  };
}
