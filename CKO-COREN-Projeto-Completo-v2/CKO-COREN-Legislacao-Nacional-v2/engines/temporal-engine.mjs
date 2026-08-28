/**
 * temporal-engine — N-002
 * Resolve eventos temporais, changesets e janela de validade SEM inferencia silenciosa.
 *
 * Regra dura: o engine nunca deduz vigencia, revogacao ou supersessao a partir de
 * data, titulo, tipo de ato ou ordem de publicacao. Só materializa o que o canônico
 * declara explicitamente, sempre carregando a origem da declaracao.
 */
export const VERSION = '1.0.0';

/** Ordem de confiabilidade do estado juridico exibivel. */
export const STATUS_DISPLAY_MODE = {
  NOT_CLAIMED: 'NOT_CLAIMED',                 // canonico nao declara estado
  DECLARED_UNVERIFIED: 'DECLARED_UNVERIFIED', // fonte declara, sem fragmento de evidencia
  VERIFIED: 'VERIFIED',                       // fragmento de evidencia resolvido
};

const TERMINAL = new Set(['REVOKED', 'SUPERSEDED']);

/**
 * @param {object} act canonico 2.0.0
 * @param {{fragments?: Map<string,object>, now?: string}} ctx
 */
export function resolveTemporal(act, ctx = {}) {
  const findings = [];
  const ep = act.epistemic || {};
  const status = ep.legal_status || 'NOT_INFERRED';
  const basis = ep.legal_status_basis || { kind: 'NONE', statement: '' };
  const fragments = ctx.fragments instanceof Map ? ctx.fragments : new Map();

  let displayMode;
  if (status === 'NOT_INFERRED') {
    displayMode = STATUS_DISPLAY_MODE.NOT_CLAIMED;
  } else if (basis.kind === 'SOURCE_EXPLICIT' && basis.evidence_fragment_ref
             && fragments.has(basis.evidence_fragment_ref)) {
    displayMode = STATUS_DISPLAY_MODE.VERIFIED;
  } else {
    displayMode = STATUS_DISPLAY_MODE.DECLARED_UNVERIFIED;
    findings.push({
      code: 'TEMPORAL-001',
      severity: TERMINAL.has(status) ? 'P0' : 'P1',
      message: `Estado jurídico "${status}" declarado sem fragmento de evidência resolvido.`,
      subject: act.canonical_id,
    });
  }

  // Eventos: apenas os explicitamente registrados.
  const events = [];
  if (act.date) {
    events.push({ date: act.date, kind: 'ACT_DATE', label: 'Data do ato registrada no canônico',
                  source: 'canonical.date' });
  }
  if (ep.status_event_date) {
    events.push({ date: ep.status_event_date, kind: 'STATUS_EVENT',
                  label: `Evento de status declarado pela fonte: ${status}`,
                  source: 'canonical.epistemic.status_event_date',
                  verified: displayMode === STATUS_DISPLAY_MODE.VERIFIED });
  }
  for (const cs of act.version_envelope?.changesets || []) {
    events.push({ date: cs.detected_at, kind: 'CHANGESET', label: cs.kind,
                  source: `changeset:${cs.changeset_id}` });
  }
  events.sort((a, b) => String(a.date).localeCompare(String(b.date)));

  // valid_from / valid_to: NUNCA inferidos.
  const validFrom = (status === 'EFFECTIVE_ON_SIGNATURE_PER_SOURCE' && act.date) ? act.date : null;
  const validTo = TERMINAL.has(status) ? (ep.status_event_date || null) : null;
  if (TERMINAL.has(status) && !ep.status_event_date) {
    findings.push({
      code: 'TEMPORAL-002', severity: 'P1',
      message: 'Estado terminal declarado sem data do evento; a janela de validade fica aberta.',
      subject: act.canonical_id,
    });
  }

  return {
    engine: 'temporal-engine', version: VERSION,
    canonical_id: act.canonical_id,
    legal_status: status,
    status_basis_kind: basis.kind,
    status_basis_statement: basis.statement || '',
    display_mode: displayMode,
    is_terminal: TERMINAL.has(status),
    valid_from: validFrom,
    valid_to: validTo,
    inference_used: false,
    events,
    findings,
  };
}

/** Rotulo publico do estado, ja com a qualificacao epistemica embutida. */
export function statusLabel(temporal) {
  switch (temporal.display_mode) {
    case STATUS_DISPLAY_MODE.NOT_CLAIMED:
      return { text: 'Estado jurídico não qualificado', tone: 'warn',
               note: 'O sistema não infere vigência. Consulte a fonte oficial.' };
    case STATUS_DISPLAY_MODE.VERIFIED:
      return { text: temporal.legal_status, tone: temporal.is_terminal ? 'red' : 'green',
               note: 'Estado verificado contra fragmento de evidência da fonte oficial.' };
    default:
      return {
        text: `${temporal.legal_status} · declarado pela fonte, não verificado`,
        tone: temporal.is_terminal ? 'red' : 'warn',
        note: 'Estado lido da fonte oficial no ciclo de curadoria, ainda sem fragmento de evidência adquirido e com hash registrado.',
      };
  }
}
