/**
 * temporal-status-validator — N-009
 * Impede que um estado juridico seja publicado como verificado sem basis + evidencia.
 */
export const VERSION = '1.0.0';

const CLAIMED = new Set(['EFFECTIVE_ON_SIGNATURE_PER_SOURCE', 'EFFECTIVE_PER_SOURCE',
                         'REVOKED', 'SUSPENDED', 'SUPERSEDED']);

export function validateTemporalStatus(act, temporal, ctx = {}) {
  const findings = [];
  const fragments = ctx.fragments instanceof Map ? ctx.fragments : new Map();
  const ep = act.epistemic || {};
  const status = ep.legal_status;
  const basis = ep.legal_status_basis || {};

  if (CLAIMED.has(status)) {
    if (basis.kind !== 'SOURCE_EXPLICIT') {
      findings.push({ code: 'TSTAT-001', severity: 'P0', subject: act.canonical_id,
        message: `Estado "${status}" declarado sem basis SOURCE_EXPLICIT.` });
    }
    if (!basis.evidence_fragment_ref || !fragments.has(basis.evidence_fragment_ref)) {
      findings.push({ code: 'TSTAT-002', severity: 'P1', subject: act.canonical_id,
        message: `Estado "${status}" sem fragmento de evidência; exibição rebaixada para "declarado, não verificado".` });
    }
  }
  if (status === 'NOT_INFERRED' && ep.status_event_date) {
    findings.push({ code: 'TSTAT-003', severity: 'P1', subject: act.canonical_id,
      message: 'Evento de status registrado sem estado jurídico declarado.' });
  }
  if (temporal?.inference_used) {
    findings.push({ code: 'TSTAT-004', severity: 'P0', subject: act.canonical_id,
      message: 'Engine temporal reportou uso de inferência. Proibido por contrato.' });
  }
  if (temporal?.valid_to && temporal?.valid_from && temporal.valid_to < temporal.valid_from) {
    findings.push({ code: 'TSTAT-005', severity: 'P0', subject: act.canonical_id,
      message: 'valid_to anterior a valid_from.' });
  }

  return {
    gate: 'TEMPORAL', validator: 'temporal-status-validator', version: VERSION,
    result: findings.some(f => f.severity === 'P0') ? 'FAIL'
          : (findings.length ? 'PASS_WITH_FINDINGS' : 'PASS'),
    findings,
  };
}
