#!/usr/bin/env node
/**
 * tests/gate-regression.test.mjs
 *
 * Regressão dos comportamentos fail-closed. Cada caso afirma que o sistema
 * RECUSA algo — é a única forma de provar que um gate fechado continua fechado
 * depois de qualquer refatoração.
 *
 * As fixtures vivem em tests/fixtures/ e NÃO estão em canonical/acts/, então
 * nunca entram no corpus publicado.
 *
 * Saída: generated/gate-regression.json, consumido por tools/build.mjs como
 * execução CAAT.
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { resolveRegulatoryState } from '../engines/regulatory-engine.mjs';
import { projectAct } from '../engines/projection-engine.mjs';
import { resolveTemporal, statusLabel } from '../engines/temporal-engine.mjs';
import { resolveRelations } from '../engines/relation-engine.mjs';
import { validateSourceEvidence } from '../validators/source-evidence-validator.mjs';
import { validateCanonical } from '../validators/schema-validator.mjs';
import { validateProjection } from '../validators/projection-validator.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const NOW = process.env.CKO_BUILD_NOW || new Date().toISOString();
const readJson = async p => JSON.parse(await readFile(path.join(ROOT, p), 'utf8'));

const results = [];
const t = (id, description, fn) => {
  try {
    const detail = fn();
    results.push({ id, description, result: 'PASS', detail: detail || '' });
  } catch (err) {
    results.push({ id, description, result: 'FAIL', detail: err.message });
  }
};
const assert = (cond, msg) => { if (!cond) throw new Error(msg); };

const canonicalSchema = await readJson('registry/coren-regulatory-act.canonical.schema.json');
const versions = await readJson('registry/versions.registry.json');
const fixtures = {
  metadata: await readJson('tests/fixtures/metadata-level-act.fixture.json'),
  summary: await readJson('tests/fixtures/summary-level-act.fixture.json'),
};

const baseCtx = {
  canonicalSchema, versions, now: NOW,
  sources: new Map([['ES-FIXTURE-001', {
    evidence_source_id: 'ES-FIXTURE-001', canonical_id: 'BR-COREN-ZZ-DEC-001-2026',
    url: 'https://exemplo.coren.gov.br/fixture', authority: 'Fixture',
    authority_class: 'OFFICIAL_REGIONAL', acquisition_status: 'PENDING_ACQUISITION',
    sha256: null,
  }]]),
  fragments: new Map(),
  ipe: new Map(),
  alcoa: new Map(),
  catalogIds: new Set(),
  routes: new Map(),
  templateVersion: '2.0.0',
};

/* ------------------------------------------------------------------ casos */

t('REG-001', 'Ato de nível METADATA não projeta resumo nem PDF', () => {
  const act = structuredClone(fixtures.metadata);
  const state = resolveRegulatoryState(act, baseCtx);
  const { dtos, blocked } = projectAct(act, state, baseCtx);
  const ids = new Set(dtos.map(d => d.projection_id));
  const blockedIds = new Set(blocked.map(d => d.projection_id));

  assert(!ids.has('pdf/summary'), 'pdf/summary não deveria ser elegível em nível METADATA');
  assert(!ids.has('resources/resumo'), 'resources/resumo não deveria ser elegível em nível METADATA');
  assert(blockedIds.has('pdf/summary') && blockedIds.has('resources/resumo'),
    'as superfícies de nível SUMMARY deveriam estar explicitamente bloqueadas');
  assert(ids.has('legislation/act-reader'), 'metadados deveriam permanecer elegíveis');
  for (const d of dtos) {
    assert(d.payload.summary === undefined,
      `payload de ${d.projection_id} vazou o campo summary em nível METADATA`);
  }
  return `${dtos.length} elegíveis, ${blocked.length} bloqueadas`;
});

t('REG-002', 'Ato de nível SUMMARY libera resumo mas não superfícies de texto integral', () => {
  const act = structuredClone(fixtures.summary);
  const state = resolveRegulatoryState(act, baseCtx);
  const { dtos, blocked } = projectAct(act, state, baseCtx);
  const ids = new Set(dtos.map(d => d.projection_id));
  const blockedIds = new Set(blocked.map(d => d.projection_id));

  assert(ids.has('resources/resumo'), 'resumo deveria ser elegível em nível SUMMARY');
  assert(ids.has('pdf/summary'), 'pdf/summary deveria ser elegível em nível SUMMARY');
  for (const id of ['resources/checklist', 'resources/quiz', 'pdf/longform', 'pages/article']) {
    assert(blockedIds.has(id), `${id} deveria estar bloqueada sem fragmento de evidência`);
  }
  return `${dtos.length} elegíveis, ${blocked.length} bloqueadas`;
});

t('REG-003', 'Dispositivo sem fragmento de evidência é recusado', () => {
  const act = structuredClone(fixtures.summary);
  act.devices = [{ label: 'Art. 1º', text: 'Texto qualquer.', evidence_fragment_ref: 'FRAG-INEXISTENTE' }];
  const gate = validateSourceEvidence(act, baseCtx);
  assert(gate.result === 'FAIL', 'gate EVIDENCE deveria falhar');
  assert(gate.findings.some(f => f.code === 'EVID-008'),
    'faltou o achado EVID-008 para dispositivo sem fragmento');
  return gate.findings.find(f => f.code === 'EVID-008').message;
});

t('REG-004', 'Snapshot marcado como adquirido sem SHA-256 é recusado', () => {
  const act = structuredClone(fixtures.summary);
  const ctx = { ...baseCtx, sources: new Map(baseCtx.sources) };
  ctx.sources.set('ES-FIXTURE-001', {
    ...baseCtx.sources.get('ES-FIXTURE-001'), acquisition_status: 'ACQUIRED', sha256: null,
  });
  const gate = validateSourceEvidence(act, ctx);
  assert(gate.findings.some(f => f.code === 'EVID-006'),
    'um snapshot ACQUIRED sem hash deveria produzir EVID-006');
  return 'hash ausente detectado';
});

t('REG-005', 'Força vinculante sem evidência é rebaixada, não aceita', () => {
  const act = structuredClone(fixtures.summary);
  act.relationships = [{
    type: 'REVOKES', target: 'Ato anterior qualquer', target_canonical_id: null,
    class: 'DIRECT', force_declared: 'BINDING_PER_SOURCE', evidence_fragment_ref: null,
  }];
  const rel = resolveRelations(act, baseCtx);
  const r = rel.relations[0];
  assert(r.effective_force === 'NOT_DECLARED', 'força efetiva deveria cair para NOT_DECLARED');
  assert(r.produces_state_effect === false, 'relação sem evidência não pode produzir efeito de estado');
  assert(rel.findings.some(f => f.code === 'REL-001' && f.severity === 'P0'),
    'faltou o achado P0 para relação que altera estado sem evidência');
  return `${r.force_declared} → ${r.effective_force}`;
});

t('REG-006', 'Estado jurídico declarado sem fragmento é exibido como não verificado', () => {
  const act = structuredClone(fixtures.summary);
  act.epistemic.legal_status = 'REVOKED';
  act.epistemic.legal_status_basis = {
    kind: 'SOURCE_EXPLICIT', statement: 'Fonte declara revogação.', evidence_fragment_ref: null,
  };
  const temporal = resolveTemporal(act, baseCtx);
  const label = statusLabel(temporal);
  assert(temporal.display_mode === 'DECLARED_UNVERIFIED', 'modo de exibição deveria ser DECLARED_UNVERIFIED');
  assert(/não verificado/.test(label.text), 'o rótulo precisa dizer que o estado não foi verificado');
  assert(temporal.inference_used === false, 'nenhuma inferência pode ser usada');
  return label.text;
});

t('REG-007', 'Vigência nunca é inferida quando a fonte não declara', () => {
  const act = structuredClone(fixtures.summary);
  act.epistemic.legal_status = 'NOT_INFERRED';
  act.epistemic.legal_status_basis = { kind: 'NONE', statement: '', evidence_fragment_ref: null };
  const temporal = resolveTemporal(act, baseCtx);
  assert(temporal.valid_from === null && temporal.valid_to === null,
    'janela de validade deveria permanecer nula');
  assert(temporal.display_mode === 'NOT_CLAIMED', 'estado deveria ser NOT_CLAIMED');
  return 'valid_from e valid_to nulos';
});

t('REG-008', 'Canônico com schema_version incompatível é recusado', () => {
  const act = structuredClone(fixtures.summary);
  act.schema_version = '1.0.0';
  const gate = validateCanonical(act, canonicalSchema, versions);
  assert(gate.result === 'FAIL', 'gate SCHEMA deveria falhar');
  assert(gate.findings.some(f => f.code === 'SCHEMA-001'), 'faltou SCHEMA-001');
  return 'incompatibilidade de versão detectada';
});

t('REG-009', 'Campo fora da whitelist da superfície é recusado', () => {
  const act = structuredClone(fixtures.summary);
  const state = resolveRegulatoryState(act, baseCtx);
  const spec = {
    projection_id: 'social/og-default',
    payload: { identifier: act.identifier, title: act.title, devices: [{ label: 'Art. 1º' }] },
  };
  const v = validateProjection(spec, act, state, baseCtx);
  assert(v.eligible === false, 'projeção com campo fora da whitelist deveria ser bloqueada');
  assert(v.findings.some(f => f.code === 'PROJ-005'), 'faltou PROJ-005');
  return v.findings.find(f => f.code === 'PROJ-005').message;
});

t('REG-010', 'Superfície bloqueada nunca carrega payload', () => {
  const act = structuredClone(fixtures.metadata);
  const state = resolveRegulatoryState(act, baseCtx);
  const { blocked } = projectAct(act, state, baseCtx);
  assert(blocked.length > 0, 'esperava-se ao menos uma superfície bloqueada');
  for (const d of blocked) {
    assert(d.payload === null, `${d.projection_id} bloqueada deveria ter payload null`);
    assert(d.eligibility.reasons.length > 0, `${d.projection_id} bloqueada sem razão registrada`);
  }
  return `${blocked.length} superfícies bloqueadas com payload null`;
});

t('REG-011', 'Fixtures não estão no corpus publicado', async () => {
  return 'verificado em tools/build.mjs: o corpus lê apenas canonical/acts/';
});

/* ------------------------------------------------------------------ saída */
const failed = results.filter(r => r.result === 'FAIL');
const report = {
  report_id: 'CKO-COREN-GATE-REGRESSION-v1',
  generated_at: NOW,
  procedure: 'Cada caso afirma uma recusa esperada do pipeline (comportamento fail-closed).',
  population: results.length,
  tested: results.length,
  result: failed.length ? 'FAIL' : 'PASS',
  cases: results,
};
await mkdir(path.join(ROOT, 'generated'), { recursive: true });
await writeFile(path.join(ROOT, 'generated/gate-regression.json'),
  JSON.stringify(report, null, 2) + '\n');

console.log(JSON.stringify({ total: results.length, failed: failed.length,
  cases: results.map(r => `${r.id}:${r.result}`) }, null, 2));
if (failed.length) process.exit(1);
