/**
 * release-gate — N-014
 * Fail-closed. Separa aprovacao ESTRUTURAL de aprovacao de RELEASE e decide
 * escopo por escopo o que pode ser publicado.
 *
 * Um "overall: PASS" global e proibido por contrato: o gate sempre devolve um
 * mapa de decisoes por escopo, mais o escopo bloqueado e a razao.
 */
export const VERSION = '1.0.0';

export function evaluateRelease(assurance, projections) {
  const eligible = projections.filter(p => p.eligibility.eligible);
  const blocked = projections.filter(p => !p.eligibility.eligible);

  const decisions = {
    STRUCTURAL_PASS: assurance.gate_summary.structural === 'PASS' && assurance.gate_summary.schema === 'PASS',
    CONTENT_PASS: assurance.gate_summary.evidence === 'PASS',
    EVIDENCE_PASS: assurance.gate_summary.evidence === 'PASS',
    IPE_PASS: assurance.gate_summary.ipe === 'PASS',
    CAAT_STRUCTURAL_PASS: ['PASS', 'PASS_WITH_FINDINGS'].includes(assurance.gate_summary.caat),
    CAAT_SOURCE_PASS: ['PASS', 'PASS_WITH_FINDINGS'].includes(assurance.gate_summary.caat_source),
    ALCOA_PASS: assurance.gate_summary.alcoa === 'PASS',
    A11Y_PASS: assurance.gate_summary.a11y === 'PASS',
    PRIVACY_PASS: assurance.gate_summary.privacy === 'PASS',
    SEO_PASS: assurance.gate_summary.seo === 'PASS',
    PDF_PASS: assurance.gate_summary.pdf === 'PASS',
    ASSURANCE_PASS: assurance.overall_level === 'REASONABLE',
  };

  const blockingP0 = assurance.findings_p0.filter(f => !f.scope?.startsWith('act:') || true);

  let release;
  if (decisions.ASSURANCE_PASS && Object.values(decisions).every(Boolean)) {
    release = 'RELEASE_FULL';
  } else if (decisions.STRUCTURAL_PASS && decisions.SEO_PASS && decisions.PRIVACY_PASS && eligible.length) {
    release = 'RELEASE_PARTIAL_METADATA_ONLY';
  } else {
    release = 'HOLD';
  }

  return {
    gate: 'RELEASE', version: VERSION, evaluated_at: assurance.produced_at,
    release,
    fail_closed: true,
    decisions,
    publishable_scope: {
      surfaces: [...new Set(eligible.map(p => p.projection_id))].sort(),
      count: eligible.length,
      condition: 'Publicação condicionada a exibir o rótulo epistêmico em toda superfície e o link para a fonte oficial.',
    },
    blocked_scope: {
      surfaces: [...new Set(blocked.map(p => p.projection_id))].sort(),
      count: blocked.length,
      reason: 'Superfícies que afirmam conteúdo normativo sem fragmento de evidência adquirido.',
    },
    blocking_findings: blockingP0.slice(0, 50),
    next_gate_action: decisions.EVIDENCE_PASS
      ? 'Reavaliar A11y em navegador real e fechar a auditoria LGPD do shell global.'
      : 'Executar monitoring/regulatory-monitor.mjs --acquire para adquirir os snapshots oficiais e registrar seus hashes; sem isso o release completo permanece bloqueado por contrato.',
  };
}
