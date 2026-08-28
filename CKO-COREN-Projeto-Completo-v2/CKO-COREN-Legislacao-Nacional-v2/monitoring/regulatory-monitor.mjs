#!/usr/bin/env node
/**
 * regulatory-monitor — N-029
 * Fecha o ciclo circular: monitor -> changeset -> invalidate -> revalidate ->
 * rerender -> output hash -> monitor.
 *
 * Modos:
 *   --dry-run   (padrao) reporta o que seria feito, sem tocar na rede
 *   --acquire   adquire o snapshot oficial, hasha e grava evidence-source
 *
 * O modo --acquire e o unico caminho autorizado para um snapshot entrar no
 * pacote. Nenhum hash pode ser escrito a mao: se a rede nao alcancar o host
 * oficial, o registro permanece PENDING_ACQUISITION e o release gate segue fechado.
 */
import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const VERSION = '1.0.0';
export const STAGES = ['DISCOVER', 'ACQUIRE', 'HASH', 'PARSE', 'CLASSIFY', 'QUALIFY_STATUS',
  'LINK_RELATIONS', 'VALIDATE', 'PUBLISH_PROJECTIONS'];

export const sha256 = buf => createHash('sha256').update(buf).digest('hex');

export function makeChangeset(before, after, kind = 'SOURCE_CHANGED') {
  return {
    changeset_id: `CS-${Date.now().toString(36).toUpperCase()}-${(after || 'none').slice(0, 8)}`,
    detected_at: new Date().toISOString(),
    kind,
    source_hash_before: before || null,
    source_hash_after: after || null,
    notes: 'Gerado pelo regulatory-monitor a partir de comparacao de hash de snapshot.',
  };
}

/** Invalida artefatos derivados do canonico afetado. */
export function invalidationPlan(canonicalId, lineage) {
  const affected = lineage.filter(l => l.canonical_id === canonicalId);
  return {
    canonical_id: canonicalId,
    invalidate: affected.map(l => l.output.path),
    revalidate: ['SCHEMA', 'EVIDENCE', 'TEMPORAL', 'RELATIONS', 'IPE', 'ALCOA', 'PROJECTION'],
    rerender: [...new Set(affected.map(l => l.projection_id))],
    reason: 'Hash da fonte oficial divergiu do ultimo snapshot conhecido.',
  };
}

async function acquire(entry, outDir) {
  const res = await fetch(entry.url, { redirect: 'follow' });
  const buf = Buffer.from(await res.arrayBuffer());
  const hash = sha256(buf);
  const file = path.join(outDir, `${entry.evidence_source_id}.bin`);
  await mkdir(outDir, { recursive: true });
  await writeFile(file, buf);
  return {
    ...entry,
    acquisition_status: res.ok ? 'ACQUIRED' : 'ACQUISITION_FAILED',
    acquired_at: new Date().toISOString(),
    http_status: res.status,
    mime_type: res.headers.get('content-type'),
    byte_length: buf.length,
    sha256: res.ok ? hash : null,
    storage_ref: res.ok ? path.relative(process.cwd(), file) : null,
    retrieval_agent: `regulatory-monitor@${VERSION}`,
  };
}

export async function run({ root, mode = 'dry-run' }) {
  const regPath = path.join(root, 'evidence/sources/evidence-sources.json');
  const reg = JSON.parse(await readFile(regPath, 'utf8'));
  const report = { mode, checked: 0, acquired: 0, failed: 0, changesets: [], pending: [] };

  for (const entry of reg.sources) {
    report.checked++;
    if (mode !== 'acquire') { report.pending.push(entry.evidence_source_id); continue; }
    try {
      const before = entry.sha256;
      const updated = await acquire(entry, path.join(root, 'evidence/snapshots'));
      Object.assign(entry, updated);
      if (updated.sha256 && before && updated.sha256 !== before) {
        report.changesets.push(makeChangeset(before, updated.sha256));
      }
      updated.acquisition_status === 'ACQUIRED' ? report.acquired++ : report.failed++;
    } catch (err) {
      entry.acquisition_status = 'ACQUISITION_FAILED';
      entry.notes = `Falha de aquisicao: ${err.message}. Nenhum hash foi gravado.`;
      report.failed++;
    }
  }
  if (mode === 'acquire') await writeFile(regPath, JSON.stringify(reg, null, 2) + '\n');
  return report;
}

const invokedAsCli = process.argv[1]
  && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (invokedAsCli) {
  const mode = process.argv.includes('--acquire') ? 'acquire' : 'dry-run';
  const root = process.argv.find(a => a.startsWith('--root='))?.slice('--root='.length)
    || path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
  run({ root, mode })
    .then(r => console.log(JSON.stringify(r, null, 2)))
    .catch(err => {
      console.error(`regulatory-monitor falhou: ${err.message}`);
      process.exitCode = 1;
    });
}
