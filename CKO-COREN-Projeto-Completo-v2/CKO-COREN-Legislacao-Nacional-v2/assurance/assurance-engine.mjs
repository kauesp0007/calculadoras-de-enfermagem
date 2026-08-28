/**
 * assurance-engine — N-013
 * Produz o Assurance Object: base, achados e NIVEL de asseguracao por escopo.
 *
 * Niveis:
 *  NONE       — nao ha base para asseverar nada alem da existencia do artefato.
 *  LIMITED    — asseguracao limitada: metadados e cadeia interna verificados por
 *               CAAT deterministico; conteudo normativo NAO verificado na fonte.
 *  REASONABLE — asseguracao razoavel: exige evidence adquirida+hashada, IPE
 *               suficiente, ALCOA++ integral e CAAT de reperformance na fonte.
 */
export const VERSION = '1.0.0';

const P0 = f => f.severity === 'P0';

export function buildAssurance({ actStates, caat, caatSource, structural, seo, a11y, privacy, pdf, now }) {
  const findings = [];
  const push = (scope, list) => { for (const f of list || []) findings.push({ scope, ...f }); };

  for (const s of actStates) push(`act:${s.canonical_id}`, s.findings);
  push('caat-structural', caat.findings);
  push('caat-source', caatSource?.findings || []);
  push('structural', structural.findings);
  push('seo', seo.findings);
  push('a11y', a11y.findings);
  push('privacy', privacy.findings);
  push('pdf', pdf.findings);

  const evidenceOk = actStates.every(s => s.gates.EVIDENCE.result !== 'FAIL');
  const ipeOk = actStates.every(s => s.gates.IPE.result === 'PASS');
  const alcoaOk = actStates.every(s => s.gates.ALCOA.result === 'PASS');
  const schemaOk = actStates.every(s => s.gates.SCHEMA.result === 'PASS');
  const caatOk = caat.result === 'PASS' || caat.result === 'PASS_WITH_FINDINGS';
  const caatSourceOk = caatSource?.result === 'PASS' || caatSource?.result === 'PASS_WITH_FINDINGS';

  const scopes = {
    STRUCTURAL: level(structural.result === 'PASS' && schemaOk && caatOk,
      'Cadeia interna (rotas, referências, DTOs, hashes de saída) verificada por CAAT determinístico.'),
    METADATA_PROJECTION: level(schemaOk && caatOk && structural.result === 'PASS',
      'Metadados projetados são idênticos ao canônico e rastreáveis por lineage.'),
    SEO_SCHEMA: level(seo.result === 'PASS',
      'SEO e JSON-LD materializados em build-time e validados contra as rotas canônicas.'),
    ACCESSIBILITY: level(a11y.result === 'PASS', a11y.basis),
    PRIVACY_LGPD: level(privacy.result === 'PASS', privacy.basis),
    PDF_ARTIFACTS: level(pdf.result === 'PASS', pdf.basis),
    REGULATORY_CONTENT: {
      level: evidenceOk && ipeOk && alcoaOk && caatSourceOk ? 'REASONABLE' : 'NONE',
      basis: evidenceOk
        ? 'Cadeia probatória completa.'
        : 'Snapshot oficial não adquirido nem hashado: nenhuma afirmação sobre texto, vigência ou revogação pode ser assegurada.',
    },
  };

  const overall = scopes.REGULATORY_CONTENT.level === 'REASONABLE' ? 'REASONABLE'
    : (scopes.STRUCTURAL.level === 'LIMITED' ? 'LIMITED' : 'NONE');

  return {
    assurance_id: 'CKO-COREN-ASSURANCE-v2',
    engine: 'assurance-engine', version: VERSION,
    produced_at: now,
    overall_level: overall,
    scopes,
    criteria: {
      LIMITED: ['SCHEMA=PASS', 'CAAT estrutural executado e determinístico', 'lineage completo por artefato'],
      REASONABLE: ['EVIDENCE=PASS (snapshot adquirido + SHA-256)', 'IPE=PASS', 'ALCOA++ integral',
                   'CAAT de reperformance contra a fonte oficial'],
    },
    gate_summary: {
      schema: schemaOk ? 'PASS' : 'FAIL',
      evidence: evidenceOk ? 'PASS' : 'FAIL',
      ipe: ipeOk ? 'PASS' : 'FAIL',
      alcoa: alcoaOk ? 'PASS' : 'FAIL',
      caat: caat.result,
      caat_source: caatSource?.result || 'NOT_EXECUTED',
      structural: structural.result,
      seo: seo.result,
      a11y: a11y.result,
      privacy: privacy.result,
      pdf: pdf.result,
    },
    findings_p0: findings.filter(P0),
    findings_p1: findings.filter(f => f.severity === 'P1'),
    findings_total: findings.length,
  };
}

function level(ok, basis) {
  return { level: ok ? 'LIMITED' : 'NONE', basis };
}
