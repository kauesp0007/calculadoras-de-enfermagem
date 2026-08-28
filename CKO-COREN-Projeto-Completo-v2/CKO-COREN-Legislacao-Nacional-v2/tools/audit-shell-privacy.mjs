#!/usr/bin/env node
/**
 * tools/audit-shell-privacy.mjs — instrumento para a pendência R-003.
 *
 * O shell global de produção (/global-scripts.js, /header.html, /footer.html…)
 * está fora deste pacote, então NÃO posso auditá-lo aqui. O que dá para entregar
 * é o instrumento: um auditor que roda contra os arquivos reais e produz um
 * laudo no mesmo formato dos demais gates.
 *
 * Uso:
 *   node tools/audit-shell-privacy.mjs --dir=/caminho/do/site
 *   node tools/audit-shell-privacy.mjs --files=/caminho/global-scripts.js,/caminho/header.html
 *
 * Este script NÃO fecha R-003 sozinho: ele produz o laudo que, junto com a
 * revisão do responsável pelo tratamento, fecha.
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const NOW = new Date().toISOString();

const TARGETS = ['global-scripts.js', 'lang-selector.js', 'header.html', 'footer.html',
                 'accessibility.html', 'language-selector.html'];

/** Cada regra devolve achados. Severidade P0 = tratamento de dado pessoal sem base declarada. */
const RULES = [
  { id: 'SHELL-001', severity: 'P0', label: 'Cookie gravado pelo shell',
    re: /document\.cookie\s*=/g,
    note: 'Cookie exige finalidade, base legal e, se não for estritamente necessário, consentimento.' },
  { id: 'SHELL-002', severity: 'P0', label: 'Rastreador de terceiro',
    re: /googletagmanager|google-analytics|gtag\(|facebook\.net|fbq\(|hotjar|clarity\.ms|mixpanel|segment\.com/gi,
    note: 'Rastreamento de terceiro exige base legal, aviso e, em regra, consentimento prévio.' },
  { id: 'SHELL-003', severity: 'P0', label: 'Envio de dados para origem externa',
    re: /(?:fetch|XMLHttpRequest|navigator\.sendBeacon)\s*\(\s*['"`]https?:\/\/(?!www\.calculadorasdeenfermagem\.com\.br)/g,
    note: 'Transmissão para fora do domínio precisa de finalidade declarada e mapeamento de operador.' },
  { id: 'SHELL-004', severity: 'P1', label: 'Fingerprinting potencial',
    re: /canvas\.toDataURL|navigator\.hardwareConcurrency|navigator\.plugins|AudioContext\(\)/g,
    note: 'Sinais usados para identificação de dispositivo caracterizam dado pessoal.' },
  { id: 'SHELL-005', severity: 'P1', label: 'Armazenamento local sem prefixo governado',
    re: /(?:localStorage|sessionStorage)\.setItem\(\s*['"`](?!cko:)/g,
    note: 'Chave fora do prefixo cko: fica sem finalidade, retenção nem expurgo declarados.' },
  { id: 'SHELL-006', severity: 'P1', label: 'Coleta de identificador direto',
    re: /\b(cpf|coren|email|e_mail|telefone|whatsapp)\b\s*[:=]/gi,
    note: 'Identificador direto no shell global exige mapeamento no registro de operações.' },
];

const args = process.argv.slice(2);
const dirArg = args.find(a => a.startsWith('--dir='))?.slice(6);
const filesArg = args.find(a => a.startsWith('--files='))?.slice(8);

let files = [];
if (filesArg) files = filesArg.split(',').map(f => f.trim()).filter(Boolean);
else if (dirArg) files = TARGETS.map(t => path.join(dirArg, t)).filter(existsSync);

const findings = [];
const inspected = [];

for (const f of files) {
  const src = await readFile(f, 'utf8');
  inspected.push({ file: f, bytes: Buffer.byteLength(src) });
  for (const rule of RULES) {
    const hits = [...src.matchAll(rule.re)];
    for (const h of hits.slice(0, 10)) {
      const line = src.slice(0, h.index).split('\n').length;
      findings.push({ code: rule.id, severity: rule.severity, subject: `${path.basename(f)}:${line}`,
                      message: `${rule.label}. ${rule.note}`, excerpt: h[0].slice(0, 80) });
    }
  }
}

const report = {
  report_id: 'CKO-COREN-SHELL-PRIVACY-v1',
  generated_at: NOW,
  scope: 'Shell global de produção — fora do pacote CKO-COREN.',
  rules: RULES.map(r => ({ id: r.id, severity: r.severity, label: r.label, note: r.note })),
  inspected,
  result: files.length === 0 ? 'NOT_EXECUTED'
    : (findings.some(f => f.severity === 'P0') ? 'FAIL' : (findings.length ? 'PASS_WITH_FINDINGS' : 'PASS')),
  basis: files.length === 0
    ? 'Nenhum arquivo informado. Rode com --dir=/caminho/do/site apontando para o shell publicado.'
    : `Varredura estática de ${files.length} arquivo(s) do shell global.`,
  limitations: [
    'Varredura estática: não observa o comportamento em runtime nem chamadas montadas dinamicamente.',
    'Não substitui a revisão do responsável pelo tratamento sobre finalidade e base legal.',
    'Um resultado PASS significa "nenhum padrão conhecido encontrado", não "conforme à LGPD".',
  ],
  findings,
};

await mkdir(path.join(ROOT, 'generated'), { recursive: true });
await writeFile(path.join(ROOT, 'generated/shell-privacy-report.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ files: files.length, result: report.result,
                             findings: findings.length }, null, 2));
