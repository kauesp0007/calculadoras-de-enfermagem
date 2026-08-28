/**
 * source-evidence-validator — N-006
 * Valida autoridade da fonte, snapshot e fragmentos. Fail-closed.
 */
export const VERSION = '1.0.0';

const ACCEPTABLE_AUTHORITY = new Set([
  'OFFICIAL_REGIONAL', 'OFFICIAL_FEDERAL_SYSTEM_COPY', 'OFFICIAL_TRANSPARENCY_PORTAL', 'OFFICIAL_PLANALTO_PORTAL',
]);
const SHA256 = /^[a-f0-9]{64}$/;

export function validateSourceEvidence(act, ctx = {}) {
  const findings = [];
  const sources = ctx.sources instanceof Map ? ctx.sources : new Map();
  const fragments = ctx.fragments instanceof Map ? ctx.fragments : new Map();
  const src = act.source || {};

  if (!ACCEPTABLE_AUTHORITY.has(src.authority_class)) {
    findings.push({
      code: 'EVID-001', severity: 'P0', subject: act.canonical_id,
      message: `authority_class "${src.authority_class}" não é fonte oficial aceitável.`
    });
  }
  if (!/^https:\/\//.test(src.url || '')) {
    findings.push({
      code: 'EVID-002', severity: 'P1', subject: act.canonical_id,
      message: 'URL da fonte não usa https.'
    });
  }

  const refs = act.evidence?.source_refs || [];
  if (!refs.length) {
    findings.push({
      code: 'EVID-003', severity: 'P0', subject: act.canonical_id,
      message: 'Canônico sem evidence source declarada.'
    });
  }

  let acquired = 0;
  for (const ref of refs) {
    const es = sources.get(ref);
    if (!es) {
      findings.push({
        code: 'EVID-004', severity: 'P0', subject: act.canonical_id,
        message: `evidence source "${ref}" não existe no registro.`
      });
      continue;
    }
    if (es.acquisition_status !== 'ACQUIRED') {
      findings.push({
        code: 'EVID-005', severity: 'P0', subject: ref,
        message: `Snapshot oficial não adquirido (status=${es.acquisition_status}). Reperformance impossível.`
      });
      continue;
    }
    if (!SHA256.test(es.sha256 || '')) {
      findings.push({
        code: 'EVID-006', severity: 'P0', subject: ref,
        message: 'Snapshot marcado como adquirido sem SHA-256 válido.'
      });
      continue;
    }
    if (es.url !== src.url) {
      findings.push({
        code: 'EVID-007', severity: 'P1', subject: ref,
        message: 'URL do snapshot diverge da URL declarada no canonico.'
      });
    }
    acquired++;
  }

  // Dispositivos so podem existir com fragmento resolvido.
  for (const [i, d] of (act.devices || []).entries()) {
    const f = fragments.get(d.evidence_fragment_ref);
    if (!f) {
      findings.push({
        code: 'EVID-008', severity: 'P0', subject: `${act.canonical_id}#device-${i}`,
        message: 'Dispositivo materializado sem fragmento de evidência resolvido. Texto normativo bloqueado.'
      });
    } else if (f.extracted_text !== d.text) {
      findings.push({
        code: 'EVID-009', severity: 'P0', subject: `${act.canonical_id}#device-${i}`,
        message: 'Texto do dispositivo diverge do fragmento de evidência.'
      });
    }
  }

  const fragCount = (act.evidence?.fragment_refs || []).filter(r => fragments.has(r)).length;

  return {
    gate: 'EVIDENCE', validator: 'source-evidence-validator', version: VERSION,
    result: findings.some(f => f.severity === 'P0') ? 'FAIL' : (findings.length ? 'PASS_WITH_FINDINGS' : 'PASS'),
    metrics: { declared_sources: refs.length, acquired_snapshots: acquired, resolved_fragments: fragCount },
    findings,
  };
}
