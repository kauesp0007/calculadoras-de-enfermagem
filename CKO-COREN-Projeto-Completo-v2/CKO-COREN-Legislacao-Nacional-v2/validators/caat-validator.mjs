/**
 * caat-validator — N-008
 * Valida execucoes CAAT: populacao, reperformance determinística e excecoes.
 */
export const VERSION = '1.0.0';

export function validateCAAT(executions = [], opts = {}) {
  const findings = [];
  const required = new Set(opts.requiredScopes || []);
  const seen = new Set();

  for (const c of executions) {
    seen.add(c.scope);
    if (!c.caat_id || !c.procedure) {
      findings.push({ code: 'CAAT-001', severity: 'P0', subject: c.caat_id || '(sem id)',
        message: 'Execução CAAT sem identificação ou procedimento declarado.' });
    }
    if (c.result === 'NOT_EXECUTED') {
      findings.push({ code: 'CAAT-002', severity: 'P0', subject: c.caat_id,
        message: `CAAT "${c.scope}" não executado.` });
    }
    if (typeof c.population === 'number' && typeof c.tested === 'number' && c.tested < c.population) {
      findings.push({ code: 'CAAT-003', severity: 'P1', subject: c.caat_id,
        message: `Cobertura parcial: ${c.tested}/${c.population}.` });
    }
    if (c.reperformance && c.reperformance.deterministic === false) {
      findings.push({ code: 'CAAT-004', severity: 'P0', subject: c.caat_id,
        message: 'Procedimento não determinístico: reperformance não garantida.' });
    }
    for (const e of c.exceptions || []) {
      findings.push({ code: 'CAAT-005', severity: e.severity || 'P1', subject: `${c.caat_id}:${e.ref}`,
        message: e.finding });
    }
  }

  for (const scope of required) {
    if (!seen.has(scope)) {
      findings.push({ code: 'CAAT-006', severity: 'P0', subject: scope,
        message: `Escopo CAAT obrigatório ausente: ${scope}` });
    }
  }

  return {
    gate: 'CAAT', validator: 'caat-validator', version: VERSION,
    result: findings.some(f => f.severity === 'P0') ? 'FAIL'
          : (findings.length ? 'PASS_WITH_FINDINGS' : 'PASS'),
    executed: executions.length, findings,
  };
}
