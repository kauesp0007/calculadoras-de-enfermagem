/**
 * relation-validator — N-010
 * Valida tipagem de relacoes e a forca normativa declarada.
 */
export const VERSION = '1.0.0';

const TYPES = new Set(['CITES', 'REVOKES', 'REVOKED_BY', 'AMENDS', 'AMENDED_BY',
                       'GOVERNS_INTERNAL_PROCESS', 'STATUS_EVENT', 'RELATES_TO']);
const FORCES = new Set(['NOT_DECLARED', 'BINDING_PER_SOURCE', 'REFERENCE_ONLY']);

export function validateRelations(act, relationState) {
  const findings = [];

  for (const [i, r] of (act.relationships || []).entries()) {
    const at = `${act.canonical_id}#rel-${i}`;
    if (!TYPES.has(r.type)) {
      findings.push({ code: 'RELV-001', severity: 'P0', subject: at, message: `Tipo de relação inválido: ${r.type}` });
    }
    if (!FORCES.has(r.force_declared)) {
      findings.push({ code: 'RELV-002', severity: 'P0', subject: at, message: 'force_declared inválido ou ausente.' });
    }
    if (!r.target || String(r.target).trim().length < 3) {
      findings.push({ code: 'RELV-003', severity: 'P0', subject: at, message: 'Alvo da relação vazio.' });
    }
  }

  for (const r of relationState?.relations || []) {
    if (r.force_declared !== r.effective_force) {
      findings.push({ code: 'RELV-004', severity: 'P1', subject: `${act.canonical_id}#rel-${r.index}`,
        message: `Força declarada "${r.force_declared}" rebaixada para "${r.effective_force}" por falta de evidência.` });
    }
  }

  return {
    gate: 'RELATIONS', validator: 'relation-validator', version: VERSION,
    result: findings.some(f => f.severity === 'P0') ? 'FAIL'
          : (findings.length ? 'PASS_WITH_FINDINGS' : 'PASS'),
    findings,
  };
}
