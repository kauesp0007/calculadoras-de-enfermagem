/**
 * projection-validator — N-012
 * Bloqueia projecao sem conteudo, evidencia ou assurance requeridos.
 * Fail-closed: na duvida, bloqueia.
 */
import { BY_ID, levelRank } from '../engines/projection-catalog.mjs';
export const VERSION = '1.0.0';

export function validateProjection(spec, act, state, ctx = {}) {
  const findings = [];
  const def = BY_ID.get(spec.projection_id);
  if (!def) {
    return { gate: 'PROJECTION', validator: 'projection-validator', version: VERSION,
             result: 'FAIL', eligible: false,
             findings: [{ code: 'PROJ-000', severity: 'P0', subject: spec.projection_id,
                          message: 'Projeção não declarada no catálogo.' }] };
  }

  const actLevel = act.epistemic?.content_level;
  const need = def.content_requirement;
  let eligible = true;

  if (levelRank(actLevel) < levelRank(need)) {
    eligible = false;
    findings.push({ code: 'PROJ-001', severity: 'P0', subject: `${act.canonical_id}:${def.projection_id}`,
      message: `Nível de conteúdo do ato (${actLevel}) é inferior ao exigido pela superfície (${need}).` });
  }

  if (def.asserts_normative_content) {
    const frags = (act.evidence?.fragment_refs || []).filter(r => (ctx.fragments || new Map()).has(r));
    if (!frags.length) {
      eligible = false;
      findings.push({ code: 'PROJ-002', severity: 'P0', subject: `${act.canonical_id}:${def.projection_id}`,
        message: 'Superfície afirma conteúdo normativo e não há fragmento de evidência resolvido.' });
    }
    if (state?.gates?.EVIDENCE?.result === 'FAIL') {
      eligible = false;
      findings.push({ code: 'PROJ-003', severity: 'P0', subject: `${act.canonical_id}:${def.projection_id}`,
        message: 'Gate EVIDENCE em FAIL bloqueia projeção com conteúdo normativo.' });
    }
  }

  if (state?.gates?.SCHEMA?.result === 'FAIL') {
    eligible = false;
    findings.push({ code: 'PROJ-004', severity: 'P0', subject: act.canonical_id,
      message: 'Gate SCHEMA em FAIL bloqueia qualquer projeção.' });
  }

  // Whitelist de campos: nada fora do contrato pode entrar no payload.
  const leaked = Object.keys(spec.payload || {}).filter(k => !def.allowed_fields.includes(k));
  if (leaked.length) {
    eligible = false;
    findings.push({ code: 'PROJ-005', severity: 'P0', subject: def.projection_id,
      message: `Campos fora da whitelist no payload: ${leaked.join(', ')}` });
  }

  // Conteudo vazio nao pode ser publicado como se fosse conteudo.
  if (eligible && need !== 'METADATA' && !String(spec.payload?.summary || '').trim()
      && !(spec.payload?.devices || []).length) {
    eligible = false;
    findings.push({ code: 'PROJ-006', severity: 'P0', subject: def.projection_id,
      message: 'Superfície exige conteúdo e o payload está vazio.' });
  }

  return {
    gate: 'PROJECTION', validator: 'projection-validator', version: VERSION,
    result: eligible ? (findings.length ? 'PASS_WITH_FINDINGS' : 'PASS') : 'FAIL',
    eligible, required_level: need, act_level: actLevel,
    asserts_normative_content: def.asserts_normative_content, findings,
  };
}
