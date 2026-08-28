#!/usr/bin/env node
/**
 * tools/audit-a11y.mjs — R-002 (parcial)
 *
 * Roda o axe-core sobre o DOM das páginas construídas, via jsdom.
 *
 * Escopo honesto: jsdom não faz layout. Regras que dependem de renderização —
 * contraste de cor, tamanho de alvo, ordem visual, reflow — NÃO são avaliadas
 * aqui e aparecem em `rules_not_evaluated`. Elas continuam dependendo de
 * auditoria em navegador real com tecnologia assistiva.
 *
 * Este relatório NÃO fecha a pendência R-002; ele reduz a superfície dela.
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const NOW = process.env.CKO_BUILD_NOW || new Date().toISOString();
const require = createRequire(import.meta.url);

let JSDOM, axe;
try {
  ({ JSDOM } = require('jsdom'));
  axe = require('axe-core');
} catch {
  const skip = {
    report_id: 'CKO-COREN-A11Y-AXE-v1', generated_at: NOW, result: 'NOT_EXECUTED',
    basis: 'axe-core/jsdom não instalados. Rode `npm install` na raiz do pacote.',
    violations: [], pages_tested: 0,
  };
  await mkdir(path.join(ROOT, 'generated'), { recursive: true });
  await writeFile(path.join(ROOT, 'generated/a11y-axe-report.json'), JSON.stringify(skip, null, 2) + '\n');
  console.log(JSON.stringify({ result: 'NOT_EXECUTED' }));
  process.exit(0);
}

// Amostra: uma página de cada tipo por conselho não escala em jsdom, então
// testamos todos os tipos de página e uma travessia por conselho.
const routes = JSON.parse(await readFile(path.join(ROOT, 'registry/routes.registry.json'), 'utf8'));
const byKind = k => routes.entries.filter(e => e.kind === k);
const sample = [
  ...byKind('national'),
  ...byKind('act'),
  ...byKind('regional').slice(0, 6),
  ...byKind('type').filter((_, i) => i % 40 === 0),
];

// Regras que exigem layout real: jsdom não pode avaliá-las com honestidade.
const LAYOUT_RULES = ['color-contrast', 'color-contrast-enhanced', 'target-size',
                      'scrollable-region-focusable', 'meta-viewport-large'];

const results = [];
const violations = [];
const incomplete = new Set();

for (const entry of sample) {
  const html = await readFile(path.join(ROOT, entry.file), 'utf8');
  // runScripts 'outside-only': habilita window.eval para injetar o axe sem executar
  // nenhum script da própria página — o auditor avalia o HTML entregue, não o hidratado.
  const dom = new JSDOM(html, { url: entry.canonical_url, pretendToBeVisual: true,
                                runScripts: 'outside-only' });
  const { window } = dom;
  window.eval(axe.source);
  const res = await window.axe.run(window.document, {
    resultTypes: ['violations', 'incomplete'],
    rules: Object.fromEntries(LAYOUT_RULES.map(r => [r, { enabled: false }])),
    runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] },
  });
  for (const v of res.violations) {
    violations.push({
      page: entry.file, id: v.id, impact: v.impact, help: v.help,
      wcag: (v.tags || []).filter(t => t.startsWith('wcag')),
      nodes: v.nodes.slice(0, 3).map(n => n.html.slice(0, 160)),
    });
  }
  for (const i of res.incomplete) incomplete.add(i.id);
  results.push({ page: entry.file, kind: entry.kind,
                 violations: res.violations.length, incomplete: res.incomplete.length });
  window.close();
}

const serious = violations.filter(v => ['critical', 'serious'].includes(v.impact));
const report = {
  report_id: 'CKO-COREN-A11Y-AXE-v1',
  generated_at: NOW,
  engine: `axe-core@${axe.version} sobre jsdom`,
  standard: 'WCAG 2.0/2.1/2.2 A e AA + best-practice',
  pages_tested: results.length,
  pages_total: routes.entries.length,
  sampling: 'todas as páginas de ato e o hub nacional, mais 6 hubs regionais e uma amostra sistemática de índices por tipo',
  result: serious.length ? 'FAIL' : (violations.length ? 'PASS_WITH_FINDINGS' : 'PASS'),
  basis: 'Auditoria automatizada em DOM sem layout. Não substitui navegador real com tecnologia assistiva.',
  rules_not_evaluated: {
    rules: LAYOUT_RULES,
    reason: 'Dependem de renderização e layout, que o jsdom não executa.',
    still_open: 'R-002 — auditoria WCAG 2.2 AA em navegador real permanece PENDENTE.',
  },
  rules_incomplete: [...incomplete].sort(),
  violations,
  pages: results,
};

await mkdir(path.join(ROOT, 'generated'), { recursive: true });
await writeFile(path.join(ROOT, 'generated/a11y-axe-report.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ pages: results.length, violations: violations.length,
  serious: serious.length, result: report.result, incomplete: [...incomplete] }, null, 2));
