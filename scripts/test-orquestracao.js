// test-orquestracao.js — Testes do classificador de impacto + seleção de subagentes (casos A–R).
// Uso: node scripts/test-orquestracao.js
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { detectTipo, classifyFile, MATRIX, AGENTS } = require('./classificar-impacto');
const gate = require('./cwv-gate');

let pass = 0;
let fail = 0;
function assert(name, cond, extra) {
    if (cond) { pass++; console.log('  PASS  ' + name); }
    else { fail++; console.log('  FAIL  ' + name + (extra ? '  -> ' + extra : '')); }
}

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'orc-teste-'));
function write(rel, content) {
    const p = path.join(TMP, rel);
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, content || '', 'utf8');
    return p;
}

console.log('=== TESTES DE ORQUESTRAÇÃO (classificador + seleção) ===');

// A/B — página nova / HTML existente → html (C), com Performance + Revisor Final
{
    const f = write('nova.html', '<html><body><main><h1>T</h1></main></body></html>');
    const r = classifyFile(f);
    assert('A/B: HTML → tipo html (C)', r.tipo === 'html' && r.categoria === 'C', r.tipo + '/' + r.categoria);
    assert('A/B: inclui Performance', r.subagentesNecessarios.includes('Auditor de Performance (Core Web Vitals)'));
    assert('A/B: inclui Revisor Final (contra-prova)', r.subagentesNecessarios.includes('Revisor Final (QA Gate)') && r.contraProva === true);
}

// C — CSS
{
    const r = classifyFile(write('style.css', 'body{}'));
    assert('C: CSS → tipo css (B) com Build + Performance', r.tipo === 'css' && r.subagentesNecessarios.includes('Build do Site') && r.subagentesNecessarios.includes('Auditor de Performance (Core Web Vitals)'));
}

// D — JavaScript
{
    const r = classifyFile(write('app.js', 'console.log(1)'));
    assert('D: JS → tipo js (B) com Integridade + Testador', r.tipo === 'js' && r.subagentesNecessarios.includes('Revisor de Integridade') && r.subagentesNecessarios.includes('Testador no Navegador'));
}

// E — imagem
{
    const r = classifyFile(write('foto.png', ''));
    assert('E: imagem → tipo imagem (B), contra-prova false', r.tipo === 'imagem' && r.contraProva === false);
}

// F — fonte
{
    const r = classifyFile(write('fonte.woff2', ''));
    assert('F: fonte → tipo fonte (A)', r.tipo === 'fonte' && r.categoria === 'A');
}

// G — modernizar página (hero) → html
{
    const f = write('moderna.html', '<html><body><main><section class="blur-3xl"><h1>T</h1></section></main></body></html>');
    const r = classifyFile(f);
    assert('G: modernização → html, sem "formula"', r.tipo === 'html', r.tipo);
}

// H — conteúdo clínico (marcador de governança) → clinico (D)
{
    const f = write('clinica.html', '<html><body data-professional-review="required" data-governance-disclosure="v1"><main><h1>T</h1></main></body></html>');
    const r = classifyFile(f);
    assert('H: conteúdo clínico → clinico (D) com Governança', r.tipo === 'clinico' && r.subagentesNecessarios.includes('Auditor de Governança Regulatória'), r.tipo);
}

// M — dependência compartilhada (CSS) identifica páginas afetadas
{
    write('pag.html', '<html><head><link href="output.css"></head><body>ok</body></html>');
    const affected = gate.resolveAffectedPages(['public/output.css'], TMP);
    assert('M: dependência compartilhada identifica páginas', affected.some((a) => a.replace(/\\/g, '/').endsWith('pag.html')));
}

// N — paralelismo: SEO/Performance/Acessibilidade são independentes (sem dependência causal)
{
    // A seleção para html inclui SEO + Performance + Conformidade (a11y) — que podem rodar em paralelo.
    const r = classifyFile(write('p.html', '<html><body><main><h1>T</h1></main></body></html>'));
    const independentes = ['Auditor SEO', 'Auditor de Performance (Core Web Vitals)', 'Auditor de Conformidade Técnica'];
    assert('N: SEO/Performance/A11y selecionados em conjunto (paralelizáveis)', independentes.every((a) => r.subagentesNecessarios.includes(a)));
}

// Q — contra-prova e R — Revisor Final como gate
{
    const clin = classifyFile(write('c.html', '<html><body data-professional-review="required"><main><h1>T</h1></main></body></html>'));
    assert('Q/R: clínico exige contra-prova com Revisor Final', clin.contraProva === true && clin.subagentesNecessarios.includes('Revisor Final (QA Gate)'));
    const img = classifyFile(write('i.png', ''));
    assert('Q: imagem não exige contra-prova', img.contraProva === false);
}

// Seleção mínima: nunca chamar todos os agentes
{
    const r = classifyFile(write('x.html', '<html><body><main><h1>T</h1></main></body></html>'));
    assert('Seleção mínima: não aciona todos os 15 agentes', r.subagentesNecessarios.length < AGENTS.length && r.subagentesNaoNecessarios.length > 0);
    assert('Complemento correto: necessários + não-necessários = 15', r.subagentesNecessarios.length + r.subagentesNaoNecessarios.length === AGENTS.length);
}

try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (_) { }

console.log('=== RESULTADO ===');
console.log('PASS: ' + pass + ' | FAIL: ' + fail);
process.exitCode = fail > 0 ? 1 : 0;
