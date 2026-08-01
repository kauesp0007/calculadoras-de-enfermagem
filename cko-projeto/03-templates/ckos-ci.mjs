#!/usr/bin/env node
/**
 * ckos-ci.mjs — Gate de conformidade CKOS v12 para o pipeline de build (SSG).
 *
 * Faz duas verificações e sai com código != 0 se qualquer uma falhar, para
 * poder ser usado como etapa de CI (ex.: antes de publicar uma página).
 *
 *   1) Estrutural: campos obrigatórios de topo presentes (leitura leve do schema;
 *      não substitui um validador JSON Schema completo — use ckos_runtime.py --schema
 *      para validação total com jsonschema).
 *   2) Runtime: executa o pipeline sobre um contexto-sonda e recusa publicar se o
 *      resultado for `error`, ou se for `blocked`/`pending_human_validation` sem que
 *      o objeto declare human-in-the-loop (segurança não pode passar silenciosa).
 *
 * Uso:
 *   node ckos-ci.mjs --schema seringa-cko-v11.schema.json --cko arquivo.cko.json \
 *                    --probe '{"medication":"insulin","volumeMl":0.3}'
 */
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const CKOS = require('./ckos-runtime.js');

function arg(name, def = null) {
  const i = process.argv.indexOf('--' + name);
  return i > -1 ? process.argv[i + 1] : def;
}

const schemaPath = arg('schema');
const ckoPath = arg('cko');
const probe = JSON.parse(arg('probe', '{}'));
if (!ckoPath) { console.error('Uso: node ckos-ci.mjs --cko <arquivo> [--schema <schema>] [--probe <json>]'); process.exit(2); }

const cko = JSON.parse(readFileSync(ckoPath, 'utf8'));
let failures = [];

// 1) Estrutural
if (schemaPath) {
  const schema = JSON.parse(readFileSync(schemaPath, 'utf8'));
  const missing = (schema.required || []).filter(k => !(k in cko));
  if (missing.length) failures.push('campos obrigatórios ausentes: ' + missing.join(', '));
}

// 2) Runtime
const trace = CKOS.run(cko, probe);
const hitl = cko.ckosRuntimeLayer && cko.ckosRuntimeLayer.humanInTheLoop && cko.ckosRuntimeLayer.humanInTheLoop.enabled;

if (trace.status === 'error') failures.push('runtime error: ' + trace.warnings.join('; '));
if ((trace.status === 'blocked' || trace.status === 'pending_human_validation') && !hitl) {
  failures.push('resultado exige revisão humana (' + trace.status + ') mas o objeto não declara humanInTheLoop.enabled');
}

// Relatório
console.log('== CKOS CI Gate ==');
console.log('CKO:', ckoPath);
console.log('runtime status:', trace.status, '| confiança:', trace.confidence);
if (trace.finalRecommendation) console.log('recomendação:', trace.finalRecommendation.recommendedDevice);
if (failures.length) {
  console.log('\nFALHOU:');
  failures.forEach(f => console.log('  ✕ ' + f));
  process.exit(1);
}
console.log('\n✓ APROVADO — conforme e seguro para prosseguir no build.');
process.exit(0);
