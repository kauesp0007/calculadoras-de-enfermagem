/**
 * alcoa-validator — N-011
 * ALCOA++ por evidencia/claim.
 */
export const VERSION = '1.0.0';
export const ATTRS = ['attributable', 'legible', 'contemporaneous', 'original', 'accurate',
                      'complete', 'consistent', 'enduring', 'available', 'traceable'];

export function validateALCOA(act, ctx = {}) {
  const findings = [];
  const all = ctx.alcoa instanceof Map ? ctx.alcoa : new Map();
  const ref = act.evidence?.alcoa_ref;
  const a = ref ? all.get(ref) : null;

  if (!a) {
    findings.push({ code: 'ALCOA-001', severity: 'P0', subject: act.canonical_id,
      message: 'Nenhum assessment ALCOA++ associado ao canônico.' });
    return { gate: 'ALCOA', validator: 'alcoa-validator', version: VERSION, result: 'FAIL', findings, failed: ATTRS };
  }

  const failed = [];
  for (const k of ATTRS) {
    const r = a.attributes?.[k]?.result;
    if (r !== 'PASS') {
      failed.push(k);
      findings.push({ code: 'ALCOA-002', severity: r === 'FAIL' ? 'P0' : 'P1', subject: `${ref}.${k}`,
        message: `${k} = ${r || 'AUSENTE'}. ${a.attributes?.[k]?.basis || ''}` });
    }
  }

  return {
    gate: 'ALCOA', validator: 'alcoa-validator', version: VERSION,
    result: failed.length ? 'FAIL' : 'PASS',
    passed: ATTRS.filter(k => !failed.includes(k)), failed, findings,
  };
}
