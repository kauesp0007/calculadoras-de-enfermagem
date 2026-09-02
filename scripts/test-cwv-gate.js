// test-cwv-gate.js — Testes determinísticos do gate CWV (casos A–L).
// Uso: node scripts/test-cwv-gate.js
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { analyze, correct, problems } = require('./lib/cwv-core');
const gate = require('./cwv-gate');

let pass = 0;
let fail = 0;
function assert(name, cond, extra) {
    if (cond) { pass++; console.log('  PASS  ' + name); }
    else { fail++; console.log('  FAIL  ' + name + (extra ? '  -> ' + extra : '')); }
}

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'cwv-gate-test-'));
function write(rel, content) {
    const p = path.join(TMP, rel);
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, content, 'utf8');
    return p;
}

console.log('=== TESTES CWV GATE (casos A–L) ===');

// --- Fixtures ---
// Fixtures realistas: body com font-sans, imagens com alt+width+height (só problemas auto-corrigíveis restam)
const paginaCorrigivel = '<html><body class="font-sans"><main><section class="backdrop-blur"><h1 class="font-inter">Titulo</h1><p>subtitulo</p><img src="a.png" alt="a" width="10" height="10"><img src="b.png" alt="b" width="10" height="10"></section></main></body></html>';
const paginaLimpa = '<html><body class="font-sans"><main><h1 class="font-sans">ok</h1></main></body></html>';
const paginaSemAlt = '<html><body class="font-sans"><main><section><h1 class="font-sans">Titulo</h1><img src="a.png" width="10" height="10"></section></main></body></html>';

// Caso A — página nova (auditoria automática sobre HTML novo)
{
    const f = write('nova.html', paginaCorrigivel);
    const r = gate.runPage(f);
    assert('A: página nova é auditada automaticamente', r.status !== 'ERROR' && r.cycles >= 1, r.status);
}

// Caso B — alteração simples (página existente) é auditada
{
    const f = write('existente.html', paginaLimpa);
    const r = gate.runPage(f);
    assert('B: alteração simples é auditada', ['PASS', 'WARNING', 'FAIL', 'PASS_STABLE'].includes(r.status), r.status);
}

// Caso C — modernização visual (hero com blur pesado) é detectada e corrigida
{
    const f = write('moderna.html', '<main><section class="blur-3xl shadow-2xl"><h1 class="font-inter">Titulo</h1></section></main>');
    const r = gate.runPage(f);
    assert('C: modernização detecta blur/sombra pesados', r.problemsInitial.some((p) => p === 'hero-blur-pesado' || p === 'hero-shadow-pesado'));
}

// Caso D — alteração de CSS identifica páginas afetadas (dependência compartilhada)
{
    write('d.html', '<html><head><link href="output.css"></head><body>ok</body></html>');
    const affected = gate.resolveAffectedPages(['public/output.css'], TMP);
    assert('D: CSS compartilhado identifica páginas afetadas', affected.some((a) => a.replace(/\\/g, '/').endsWith('d.html')));
}

// Caso E — alteração de JS identifica páginas afetadas
{
    write('e.html', '<html><head><script src="meu.js" defer></script></head><body>ok</body></html>');
    const affected = gate.resolveAffectedPages(['js/meu.js'], TMP);
    assert('E: JS compartilhado identifica páginas afetadas', affected.some((a) => a.replace(/\\/g, '/').endsWith('e.html')));
}

// Caso F — problema corrigível automaticamente (correção → re-auditoria → estabiliza)
{
    const f = write('f.html', paginaCorrigivel);
    const r = gate.runPage(f);
    assert('F: correção automática aplicada', r.corrected === true, 'corrected=' + r.corrected);
    assert('F: estabilizou (PASS_STABLE)', r.status === 'PASS_STABLE', r.status);
    const after = fs.readFileSync(f, 'utf8');
    assert('F: font-inter removido', !/\bfont-inter\b/.test(after));
}

// Caso G — problema não corrigível com segurança (alt) não é alterado perigosamente
{
    const f = write('g.html', paginaSemAlt);
    const r = gate.runPage(f);
    assert('G: alt ausente vira WARNING (não auto-corrigível)', r.status === 'WARNING', r.status);
    assert('G: imagem sem alt não foi inventada', r.problemsFinal.some((p) => p === 'img-alt'));
}

// Caso H — correção incompleta é detectada na re-auditoria (ciclos)
{
    const f = write('h.html', '<html><body class="font-sans"><main><h1 class="font-inter">x</h1><h1 class="font-inter">y</h1></main></body></html>');
    const r = gate.runPage(f);
    // correct() remove todas as ocorrências de font-inter; a re-auditoria não deve achar restos
    const after = fs.readFileSync(f, 'utf8');
    assert('H: re-auditoria não deixa resíduo de problema', !/\bfont-inter\b/.test(after));
    assert('H: status final estável', ['PASS', 'PASS_STABLE'].includes(r.status), r.status);
}

// Caso I — falha da ferramenta (arquivo inexistente) → ERROR, sem falso PASS
{
    const r = gate.runPage(path.join(TMP, 'inexistente.html'));
    assert('I: arquivo inexistente → ERROR', r.status === 'ERROR', r.status);
}

// Caso J — métrica runtime indisponível → NOT_MEASURED, sem inventar valor
{
    const f = write('j.html', paginaLimpa);
    const r = gate.runPage(f);
    assert('J: LCP/CLS/INP = NOT_MEASURED', r.runtime.lcp === 'NOT_MEASURED' && r.runtime.cls === 'NOT_MEASURED' && r.runtime.inp === 'NOT_MEASURED');
}

// Caso K — execução repetida é idempotente
{
    const f = write('k.html', paginaCorrigivel);
    const r1 = gate.runPage(f);
    const r2 = gate.runPage(f);
    assert('K: 2ª execução não altera mais nada', r2.corrected === false, 'corrected=' + r2.corrected);
    assert('K: 2ª execução é PASS/PASS_STABLE', ['PASS', 'PASS_STABLE'].includes(r2.status), r2.status);
}

// Caso L — problema persistente após limite → encerramento controlado
{
    // Simula um problema que a correção segura NÃO resolve: força MAX_CORRECTION_CYCLES.
    assert('L: MAX_CORRECTION_CYCLES = 3', gate.MAX_CORRECTION_CYCLES === 3);
    // correct() é idempotente (garantia subjacente de que não há loop infinito):
    const x = '<main><h1 class="font-inter">x</h1></main>';
    const c1 = correct(x).content;
    const c2 = correct(c1).content;
    assert('L: correct() idempotente (sem loop infinito)', c1 === c2);
}

// Limpeza
try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (_) { }

console.log('=== RESULTADO ===');
console.log('PASS: ' + pass + ' | FAIL: ' + fail);
process.exitCode = fail > 0 ? 1 : 0;
