// ==================== BUILD DE PROTEÇÃO (anti-cópia) ====================
// Gera:
//   1. centro-cirurgico-script.min.js  — JS ofuscado (com trava de domínio)
//   2. centro-cirurgico.min.html       — HTML de produção apontando para o .min.js
// O código-fonte legível (centro-cirurgico-script.js / centro-cirurgico.html)
// permanece intacto para manutenção.
// Uso: node scripts/build-obfuscate.js   (ou: npm run build:protecao)
const fs = require('fs');
const path = require('path');
const JavaScriptObfuscator = require('javascript-obfuscator');

const root = path.resolve(__dirname, '..');
const srcJs = path.join(root, 'centro-cirurgico-script.js');
const outJs = path.join(root, 'centro-cirurgico-script.min.js');
const srcHtml = path.join(root, 'centro-cirurgico.html');
const outHtml = path.join(root, 'centro-cirurgico.min.html');

const code = fs.readFileSync(srcJs, 'utf8');

const banner = '/*! centro-cirurgico-script.min.js — Calculadoras de Enfermagem (c) 2026.\n * Uso autorizado somente em calculadorasdeenfermagem.com.br e previews autorizados.\n * Este arquivo é gerado por scripts/build-obfuscate.js — não edite manualmente.\n */\n';

console.log('🔒 Ofuscando', path.basename(srcJs), '...');
const result = JavaScriptObfuscator.obfuscate(code, {
  compact: true,
  controlFlowFlattening: true,
  controlFlowFlatteningThreshold: 0.5,
  deadCodeInjection: false,
  numbersToExpressions: true,
  simplify: true,
  stringArray: true,
  stringArrayEncoding: ['base64'],
  stringArrayThreshold: 0.6,
  stringArrayWrappersCount: 2,
  stringArrayWrappersChainedCalls: true,
  // IMPORTANTE: não renomear globais — o HTML chama funções via onclick (goStep, salvarAviso...)
  renameGlobals: false,
  selfDefending: false,
  debugProtection: false,
  disableConsoleOutput: false,
  target: 'browser',
  seed: 20260814
});
const out = banner + result.getObfuscatedCode();
fs.writeFileSync(outJs, out, 'utf8');
console.log('✔ JS ofuscado gerado:', path.basename(outJs), '(' + Math.round(out.length / 1024) + ' KB)');

let html = fs.readFileSync(srcHtml, 'utf8');
const ref = /<script src="centro-cirurgico-script\.js" defer><\/script>/g;
if (!ref.test(html)) {
  console.error('✖ Referência <script src="centro-cirurgico-script.js" defer> não encontrada no HTML.');
  process.exit(1);
}
html = html.replace(ref, '<script src="centro-cirurgico-script.min.js" defer></script>');
fs.writeFileSync(outHtml, html, 'utf8');
console.log('✔ HTML de produção gerado:', path.basename(outHtml));

console.log('\n✅ Deploy: envie centro-cirurgico.min.html + centro-cirurgico-script.min.js (ou renomeie para os nomes originais no servidor).');
