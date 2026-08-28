/**
 * schema-validator — N-005
 * Validacao de schema + compatibilidade de versao, fail-closed.
 *
 * Implementa o subconjunto de JSON Schema 2020-12 efetivamente usado pelos
 * contratos deste pacote: type, const, enum, pattern, format(date/date-time/uri),
 * required, properties, additionalProperties, items, minLength, minimum,
 * allOf, if/then, $ref para #/$defs.
 * Sem dependencias externas: o validador precisa rodar identico no build (Node)
 * e no navegador (hidratacao), senao a reperformance quebra.
 */
export const VERSION = '1.0.0';

const RE_DATE = /^\d{4}-\d{2}-\d{2}$/;
const RE_DATETIME = /^\d{4}-\d{2}-\d{2}T[\d:.]+Z?([+-]\d{2}:\d{2})?$/;

function typeOf(v) {
  if (v === null) return 'null';
  if (Array.isArray(v)) return 'array';
  return typeof v === 'object' ? 'object' : typeof v;
}

function deref(schema, root) {
  if (schema && schema.$ref) {
    const path = schema.$ref.replace(/^#\//, '').split('/');
    let node = root;
    for (const p of path) node = node?.[p];
    return node || {};
  }
  return schema;
}

function walk(value, schema, root, path, errors) {
  schema = deref(schema, root);
  if (!schema || typeof schema !== 'object') return;

  if (schema.const !== undefined && value !== schema.const) {
    errors.push({ path, message: `esperado const ${JSON.stringify(schema.const)}` });
  }
  if (schema.enum && !schema.enum.includes(value)) {
    errors.push({ path, message: `valor "${value}" fora do enum permitido` });
  }
  if (schema.type) {
    const allowed = Array.isArray(schema.type) ? schema.type : [schema.type];
    const t = typeOf(value);
    const ok = allowed.includes(t) || (t === 'number' && allowed.includes('integer') && Number.isInteger(value));
    if (!ok) errors.push({ path, message: `tipo "${t}" não permitido (esperado ${allowed.join('|')})` });
  }
  if (typeof value === 'string') {
    if (schema.pattern && !new RegExp(schema.pattern).test(value)) {
      errors.push({ path, message: `não casa com o pattern ${schema.pattern}` });
    }
    if (schema.minLength !== undefined && value.length < schema.minLength) {
      errors.push({ path, message: `minLength ${schema.minLength}` });
    }
    if (schema.format === 'date' && !RE_DATE.test(value)) {
      errors.push({ path, message: 'formato de data inválido (YYYY-MM-DD)' });
    }
    if (schema.format === 'date-time' && !RE_DATETIME.test(value)) {
      errors.push({ path, message: 'formato date-time inválido' });
    }
    if (schema.format === 'uri' && !/^https?:\/\/\S+$/.test(value)) {
      errors.push({ path, message: 'URI inválida' });
    }
  }
  if (typeof value === 'number' && schema.minimum !== undefined && value < schema.minimum) {
    errors.push({ path, message: `mínimo ${schema.minimum}` });
  }
  if (typeOf(value) === 'object') {
    for (const req of schema.required || []) {
      if (!(req in value)) errors.push({ path: `${path}.${req}`, message: 'campo obrigatório ausente' });
    }
    const props = schema.properties || {};
    for (const [k, v] of Object.entries(value)) {
      if (props[k]) walk(v, props[k], root, `${path}.${k}`, errors);
      else if (schema.additionalProperties === false) {
        errors.push({ path: `${path}.${k}`, message: 'propriedade não permitida (additionalProperties=false)' });
      }
    }
  }
  if (typeOf(value) === 'array' && schema.items) {
    value.forEach((v, i) => walk(v, schema.items, root, `${path}[${i}]`, errors));
  }
  for (const sub of schema.allOf || []) {
    const s = deref(sub, root);
    if (s.if) {
      const condErrors = [];
      walk(value, s.if, root, path, condErrors);
      if (condErrors.length === 0 && s.then) walk(value, s.then, root, path, errors);
    } else {
      walk(value, s, root, path, errors);
    }
  }
  if (schema.if) {
    const condErrors = [];
    walk(value, schema.if, root, path, condErrors);
    if (condErrors.length === 0 && schema.then) walk(value, schema.then, root, path, errors);
  }
}

export function validateAgainstSchema(value, schema, label = '$') {
  const errors = [];
  walk(value, schema, schema, label, errors);
  return errors;
}

/**
 * Valida um canonico contra o schema e contra a versao exigida pelas engines.
 * @returns {{gate:string, result:'PASS'|'FAIL', findings:Array}}
 */
export function validateCanonical(act, schema, versions) {
  const findings = [];
  const required = versions?.compatibility?.canonical_schema_required_by_engines;
  const declared = schema?.version;

  if (required && declared && required !== declared) {
    findings.push({
      code: 'SCHEMA-000', severity: 'P0',
      message: `Schema do pacote (${declared}) difere da versão exigida pelas engines (${required}).`,
      subject: 'registry/coren-regulatory-act.canonical.schema.json',
    });
  }
  if (required && act.schema_version !== required) {
    findings.push({
      code: 'SCHEMA-001', severity: 'P0',
      message: `Canônico declara schema_version "${act.schema_version}", incompatível com "${required}".`,
      subject: act.canonical_id,
    });
  }
  for (const e of validateAgainstSchema(act, schema, act.canonical_id)) {
    findings.push({ code: 'SCHEMA-002', severity: 'P0', message: `${e.path}: ${e.message}`, subject: act.canonical_id });
  }

  return {
    gate: 'SCHEMA', validator: 'schema-validator', version: VERSION,
    result: findings.length ? 'FAIL' : 'PASS', findings,
  };
}
