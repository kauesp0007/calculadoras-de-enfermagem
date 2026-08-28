#!/usr/bin/env node
/**
 * tools/validate-artifacts.mjs
 *
 * Os schemas de evidência, IPE, CAAT, ALCOA++ e lineage existiam sem que nada
 * validasse as INSTÂNCIAS contra eles. Um schema que ninguém executa é
 * documentação, não controle. Este validador fecha essa lacuna.
 *
 * Saída: generated/artifact-validation.json, consumido por tools/build.mjs
 * como execução CAAT.
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateAgainstSchema } from '../validators/schema-validator.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const NOW = process.env.CKO_BUILD_NOW || new Date().toISOString();
const readJson = async p => JSON.parse(await readFile(path.join(ROOT, p), 'utf8'));

const SETS = [
  {
    name: 'evidence-source', schema: 'evidence/schemas/evidence-source.schema.json',
    file: 'evidence/sources/evidence-sources.json', key: 'sources', id: 'evidence_source_id'
  },
  {
    name: 'evidence-fragment', schema: 'evidence/schemas/evidence-fragment.schema.json',
    file: 'evidence/sources/evidence-fragments.json', key: 'fragments', id: 'fragment_id'
  },
  {
    name: 'ipe', schema: 'evidence/schemas/ipe.schema.json',
    file: 'evidence/sources/ipe.json', key: 'ipe', id: 'ipe_id'
  },
  {
    name: 'alcoa-assessment', schema: 'evidence/schemas/alcoa-assessment.schema.json',
    file: 'evidence/sources/alcoa.json', key: 'assessments', id: 'assessment_id'
  },
  {
    name: 'caat-execution', schema: 'evidence/schemas/caat-execution.schema.json',
    file: 'evidence/sources/caat-executions.json', key: 'executions', id: 'caat_id'
  },
  {
    name: 'projection-lineage', schema: 'contracts/projection-lineage.schema.json',
    file: 'generated/lineage.json', key: 'artifacts', id: 'lineage_id'
  },
  {
    name: 'projection-lineage', schema: 'contracts/projection-lineage.schema.json',
    file: 'generated/pdf-lineage.json', key: 'artifacts', id: 'lineage_id'
  },
  {
    name: 'projection-lineage', schema: 'contracts/projection-lineage.schema.json',
    file: 'generated/social-lineage.json', key: 'artifacts', id: 'lineage_id'
  },
];

const findings = [];
const summary = [];
let total = 0;

for (const set of SETS) {
  if (!existsSync(path.join(ROOT, set.file))) {
    summary.push({ set: set.name, file: set.file, instances: 0, errors: 0, note: 'arquivo ausente nesta passada' });
    continue;
  }
  const schema = await readJson(set.schema);
  const doc = await readJson(set.file);
  const items = doc[set.key] || [];
  let errs = 0;
  for (const item of items) {
    total++;
    const label = item[set.id] || '(sem id)';
    for (const e of validateAgainstSchema(item, schema, label)) {
      errs++;
      findings.push({
        code: 'ARTV-001', severity: 'P0', subject: `${set.file}:${label}`,
        message: `${e.path}: ${e.message}`
      });
    }
  }
  summary.push({ set: set.name, file: set.file, schema: set.schema, instances: items.length, errors: errs });
}

// Consistência cruzada: toda referência de evidência citada por um canônico existe.
const acts = [];
const { readdir } = await import('node:fs/promises');
for (const f of (await readdir(path.join(ROOT, 'canonical/acts'))).filter(f => f.endsWith('.json'))) {
  acts.push(await readJson(`canonical/acts/${f}`));
}
const srcIds = new Set((await readJson('evidence/sources/evidence-sources.json')).sources.map(s => s.evidence_source_id));
const ipeIds = new Set((await readJson('evidence/sources/ipe.json')).ipe.map(i => i.ipe_id));
const alcoaIds = new Set((await readJson('evidence/sources/alcoa.json')).assessments.map(a => a.assessment_id));

for (const a of acts) {
  total++;
  for (const r of a.evidence?.source_refs || []) {
    if (!srcIds.has(r)) findings.push({
      code: 'ARTV-002', severity: 'P0', subject: a.canonical_id,
      message: `evidence source "${r}" referenciada e inexistente.`
    });
  }
  if (a.evidence?.ipe_ref && !ipeIds.has(a.evidence.ipe_ref)) {
    findings.push({
      code: 'ARTV-003', severity: 'P0', subject: a.canonical_id,
      message: `ipe_ref "${a.evidence.ipe_ref}" inexistente.`
    });
  }
  if (a.evidence?.alcoa_ref && !alcoaIds.has(a.evidence.alcoa_ref)) {
    findings.push({
      code: 'ARTV-004', severity: 'P0', subject: a.canonical_id,
      message: `alcoa_ref "${a.evidence.alcoa_ref}" inexistente.`
    });
  }
}

// Órfãos: objeto de evidência sem canônico correspondente.
const actIds = new Set(acts.map(a => a.canonical_id));
for (const s of (await readJson('evidence/sources/evidence-sources.json')).sources) {
  if (!actIds.has(s.canonical_id)) {
    const isExternalFederalEvidence = s.authority_class === 'OFFICIAL_PLANALTO_PORTAL';
    findings.push({
      code: isExternalFederalEvidence ? 'ARTV-006' : 'ARTV-005', severity: isExternalFederalEvidence ? 'P2' : 'P1', subject: s.evidence_source_id,
      message: isExternalFederalEvidence
        ? `Fonte federal externa vinculada ao catálogo raiz: canônico "${s.canonical_id}" não pertence ao corpus regional CKO.`
        : `evidence source órfã: canônico "${s.canonical_id}" não existe no corpus.`
    });
  }
}

const report = {
  report_id: 'CKO-COREN-ARTIFACT-VALIDATION-v1',
  generated_at: NOW,
  procedure: 'Validar cada instância de evidência, IPE, ALCOA++, CAAT e lineage contra o schema '
    + 'declarado, mais consistência cruzada de referências e detecção de objetos órfãos.',
  population: total,
  tested: total,
  result: findings.some(f => f.severity === 'P0') ? 'FAIL' : (findings.length ? 'PASS_WITH_FINDINGS' : 'PASS'),
  sets: summary,
  findings,
};

await mkdir(path.join(ROOT, 'generated'), { recursive: true });
await writeFile(path.join(ROOT, 'generated/artifact-validation.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({
  instances: total, result: report.result, findings: findings.length,
  detail: findings.slice(0, 10)
}, null, 2));
