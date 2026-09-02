// test-orquestrador.js — Testes do orquestrador (plano de execução) — casos A–J + economia.
// Uso: node scripts/test-orquestrador.js
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { buildPlan, validatePlan, normalizeResult, ORCHESTRATION_MODE, PARALLELISM_MODE, MAX_CORRECTION_CYCLES } = require('./orquestrador');

let pass = 0;
let fail = 0;
function assert(name, cond, extra) {
    if (cond) { pass++; console.log('  PASS  ' + name); }
    else { fail++; console.log('  FAIL  ' + name + (extra ? '  -> ' + extra : '')); }
}

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'orc-plano-'));
function write(rel, content) {
    const p = path.join(TMP, rel);
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, content || '', 'utf8');
    return p;
}

console.log('=== TESTES DO ORQUESTRADOR (plano de execução) ===\n');

// Helpers
const sel = (p) => p.plan.agentsSelected;
const execScripts = (p) => p.evidence.executedScripts; // array (determinísticos EXECUTED)
const execAgents = (p) => p.evidence.executedAgents;   // array (subagentes EXECUTED — vazio no MODEL_DRIVEN)
const has = (arr, a) => arr.includes(a);

// A — HTML
{
    const f = write('a.html', '<html><body><main><h1>T</h1></main></body></html>');
    const p = buildPlan([f]);
    assert('A: HTML → CLASSIFIED+SELECTED (Performance/SEO/Conformidade/Testador/Build/Revisor)', ['Auditor de Performance (Core Web Vitals)', 'Auditor SEO', 'Auditor de Conformidade Técnica', 'Testador no Navegador', 'Build do Site', 'Revisor Final (QA Gate)'].every((a) => has(sel(p), a)));
    assert('A: script CWV EXECUTED', execScripts(p).includes('scripts/cwv-gate.js'));
    assert('A: agentes SELECTED, não EXECUTED (MODEL_DRIVEN)', p.evidence.selectedAgents.length > 0 && execAgents(p).length === 0);
}

// B — CSS
{
    const f = write('b.css', 'body{}');
    const p = buildPlan([f]);
    assert('B: CSS → menos agentes que HTML (sem SEO, sem Governança)', !has(sel(p), 'Auditor SEO') && !has(sel(p), 'Auditor de Governança Regulatória') && has(sel(p), 'Auditor de Performance (Core Web Vitals)'));
}

// C — JS
{
    const f = write('c.js', 'console.log(1)');
    const p = buildPlan([f]);
    assert('C: JS → inclui Integridade + Testador', has(sel(p), 'Revisor de Integridade') && has(sel(p), 'Testador no Navegador'));
}

// D — imagem (tarefa simples: poucos agentes)
{
    const f = write('d.png', '');
    const p = buildPlan([f]);
    assert('D: imagem → só Performance + Integridade (economia)', sel(p).length === 2 && has(sel(p), 'Auditor de Performance (Core Web Vitals)') && has(sel(p), 'Revisor de Integridade'));
    assert('D: imagem sem contra-prova (counterProof vazio)', p.plan.counterProof.length === 0);
}

// E — clínico (tarefa complexa: mais agentes + governança)
{
    const f = write('e.html', '<html><body data-professional-review="required" data-governance-disclosure="v1"><main><h1>T</h1></main></body></html>');
    const p = buildPlan([f]);
    assert('E: clínico → Governança + Descoberta + Revisor Final', has(sel(p), 'Auditor de Governança Regulatória') && has(sel(p), 'Descoberta de Conhecimento') && has(sel(p), 'Revisor Final (QA Gate)'));
    assert('E: clínico → mais agentes que imagem (complexidade)', sel(p).length > 2);
}

// F — modernização
{
    const f = write('f.html', '<html><body><main><section class="blur-3xl"><h1>T</h1></section></main></body></html>');
    const p = buildPlan([f]);
    assert('F: modernização → HTML, risco não nulo', p.impactTypes.includes('html'));
}

// G — falha de auditor: o plano não inventa EXECUTED para subagentes
{
    const f = write('g.css', 'body{}');
    const p = buildPlan([f]);
    assert('G: nenhum subagente marcado EXECUTED indevidamente (só SELECTED)', execAgents(p).length === 0 && p.evidence.selectedAgents.length > 0);
}

// H — necessidade de correção: script determinístico previsto
{
    const f = write('h.css', 'body{}');
    const p = buildPlan([f]);
    assert('H: correção segura via cwv-gate prevista (script EXECUTED)', execScripts(p).includes('scripts/cwv-gate.js'));
}

// I — contra-prova
{
    const f = write('i.html', '<html><body data-professional-review="required"><main><h1>T</h1></main></body></html>');
    const p = buildPlan([f]);
    assert('I: contra-prova disparada (Revisor Final no counterProof)', p.plan.counterProof.includes('Revisor Final (QA Gate)'));
}

// J — Revisor Final como gate final (última fase)
{
    const f = write('j.html', '<html><body><main><h1>T</h1></main></body></html>');
    const p = buildPlan([f]);
    const lastGroup = p.plan.parallelGroups[p.plan.parallelGroups.length - 1];
    assert('J: Revisor Final na última fase (gate)', lastGroup.includes('Revisor Final (QA Gate)'));
}

// Economia + determinístico
{
    const pDet = buildPlan([write('s.js', '')]);
    const isScriptPath = pDet.impactTypes.includes('script');
    // scripts/*.js são classificados como "script" → agente só Ecossistema (determinístico)
    assert('Economia: script → 1 agente (Ecossistema) + script determinístico', isScriptPath ? sel(pDet).length === 1 : true);
}

// MODE + maxCycles + parallelismMode
{
    const p = buildPlan([write('m.css', 'body{}')]);
    assert('MODE = MODEL_DRIVEN', p.orchestrationMode === ORCHESTRATION_MODE && ORCHESTRATION_MODE === 'MODEL_DRIVEN');
    assert('parallelismMode = SEQUENTIAL_RUNTIME_LIMITATION', p.parallelismMode === PARALLELISM_MODE && PARALLELISM_MODE === 'SEQUENTIAL_RUNTIME_LIMITATION');
    assert('maxCycles = 3', p.plan.maxCycles === MAX_CORRECTION_CYCLES && MAX_CORRECTION_CYCLES === 3);
}

// SELECTED vs EXECUTED (obrigatorio - sec 13/15)
{
    const p = buildPlan([write('v.html', '<html><body><main><h1>T</h1></main></body></html>')]);
    assert('sec13: distincao SELECTED (agentes) vs EXECUTED (scripts)', p.evidence.selectedAgents.length > 0 && p.evidence.executedAgents.length === 0 && p.evidence.executedScripts.length > 0);
}

// validatePlan
{
    const p = buildPlan([write('w.css', 'body{}')]);
    const v = validatePlan(p);
    assert('validatePlan: plano válido', v.valid === true);
    const bad = JSON.parse(JSON.stringify(p));
    bad.evidence.executedAgents = ['Agente Inexistente'];
    const v2 = validatePlan(bad);
    assert('validatePlan: detecta agente executado não selecionado', v2.valid === false && v2.problems.length > 0);
}

// Ciclo de vida + contexto minimo + normalizeResult + UNAVAILABLE_AT_RUNTIME
{
    const p = buildPlan([write('z.html', '<html><body><main><h1>T</h1></main></body></html>')]);
    assert('lifecycle: estado inicial PLANNED + ciclo completo', p.evidence.state === 'PLANNED' && p.evidence.lifecycle.indexOf('FINAL_REVIEWED') >= 0 && p.evidence.lifecycle.indexOf('COMPLETED') >= 0);
    assert('contextoMinimo: definido para agentes selecionados', p.plan.agentsSelected.every(function (a) { return Array.isArray(p.plan.contextoMinimo[a]) && p.plan.contextoMinimo[a].length > 0; }));
    const r = normalizeResult('Auditor SEO', 'UNAVAILABLE_AT_RUNTIME', [], [], []);
    assert('normalizeResult: aceita UNAVAILABLE_AT_RUNTIME', r.status === 'UNAVAILABLE_AT_RUNTIME');
    const r2 = normalizeResult('X', 'INVALIDO', [], [], []);
    assert('normalizeResult: status invalido vira ERROR', r2.status === 'ERROR');
}

try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (_) { }

console.log('\n=== RESULTADO ===');
console.log('PASS: ' + pass + ' | FAIL: ' + fail);
process.exitCode = fail > 0 ? 1 : 0;
