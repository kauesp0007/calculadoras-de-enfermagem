/**
 * ipe-validator — N-007
 * Valida completude, exatidao, periodo e finalidade do IPE.
 */
export const VERSION = '1.0.0';

export function validateIPE(act, ctx = {}) {
  const findings = [];
  const ipes = ctx.ipe instanceof Map ? ctx.ipe : new Map();
  const ref = act.evidence?.ipe_ref;
  const ipe = ref ? ipes.get(ref) : null;

  if (!ipe) {
    findings.push({ code: 'IPE-001', severity: 'P0', subject: act.canonical_id,
      message: 'Nenhum objeto IPE associado ao canônico.' });
    return { gate: 'IPE', validator: 'ipe-validator', version: VERSION, result: 'FAIL', findings };
  }
  if (!ipe.purpose || ipe.purpose.length < 20) {
    findings.push({ code: 'IPE-002', severity: 'P1', subject: ref, message: 'Finalidade do IPE não declarada de forma útil.' });
  }
  if (!ipe.period?.from || !ipe.period?.to) {
    findings.push({ code: 'IPE-003', severity: 'P1', subject: ref, message: 'Período do IPE incompleto.' });
  } else if (ipe.period.to < ipe.period.from) {
    findings.push({ code: 'IPE-004', severity: 'P0', subject: ref, message: 'Período do IPE invertido.' });
  }
  if (ipe.completeness?.result !== 'PASS') {
    findings.push({ code: 'IPE-005', severity: 'P0', subject: ref,
      message: `Completude do IPE = ${ipe.completeness?.result}. ${ipe.completeness?.basis || ''}` });
  }
  if (ipe.accuracy?.result !== 'PASS') {
    findings.push({ code: 'IPE-006', severity: 'P0', subject: ref,
      message: `Exatidão do IPE = ${ipe.accuracy?.result}. ${ipe.accuracy?.basis || ''}` });
  }

  return {
    gate: 'IPE', validator: 'ipe-validator', version: VERSION,
    result: ipe.conclusion === 'SUFFICIENT' && !findings.some(f => f.severity === 'P0') ? 'PASS' : 'FAIL',
    conclusion: ipe.conclusion,
    findings,
  };
}
