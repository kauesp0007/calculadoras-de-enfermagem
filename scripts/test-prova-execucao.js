// test-prova-execucao.js — PROVA DE EXECUÇÃO DINÂMICA (auditoria de implementação).
// Determina se o sistema SELECIONA e EXECUTA subagentes, ou apenas seleciona.
// Uso: node scripts/test-prova-execucao.js
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const results = [];
function check(label, cond, detail) {
    results.push({ label, ok: !!cond, detail: detail || '' });
    console.log((cond ? '  SIM   ' : '  NAO   ') + label + (detail ? '  -> ' + detail : ''));
}

console.log('=== PROVA DE EXECUÇÃO DINÂMICA DE SUBAGENTES ===\n');

// 1. O classificador produz seleção?
const classifier = require('./classificar-impacto');
const sel = classifier.classifyFile('teste.css');
check('1. Classificador produz seleção de subagentes', Array.isArray(sel.subagentesNecessarios) && sel.subagentesNecessarios.length > 0,
    sel.subagentesNecessarios.join(', '));

// 2. O classificador executa os agentes? (a API exportada deve ser somente dados/funções puras)
const exported = Object.keys(classifier);
const hasExecutor = exported.some((k) => /execut|invok|run|dispatch|deleg/i.test(k));
check('2. Classificador EXPORTA executor de subagentes', hasExecutor, 'exports = ' + exported.join(', '));

// 3. Há código de PRODUÇÃO que invoca subagentes programaticamente?
// (exclui arquivos de teste, que citam esses termos em asserções)
let invocationFound = [];
function scan(dir) {
    let items;
    try { items = fs.readdirSync(dir); } catch (_) { return; }
    items.forEach((it) => {
        const full = path.join(dir, it);
        let st; try { st = fs.statSync(full); } catch (_) { return; }
        if (st.isDirectory()) {
            if (['node_modules', '.git'].includes(it)) return;
            scan(full);
        } else if (/\.(js|ps1)$/.test(it) && !/^test-/.test(it)) {
            const c = fs.readFileSync(full, 'utf8');
            // Invocação REAL de subagente = chamada ao tool `runSubagent` (API do Copilot), que
            // não existe em scripts Node. Referências a ".agent.md"/".toml" são apenas listagem/catálogo.
            if (/runSubagent\s*\(|invokeSubagent\s*\(/.test(c)) {
                invocationFound.push(full.replace(ROOT + path.sep, ''));
            }
        }
    });
}
scan(path.join(ROOT, 'scripts'));
const invoca = invocationFound.length > 0;
check('3. Código de produção INVOCA subagentes programaticamente', invoca, invocationFound.join(', ') || 'nenhum');

// 4. O hook build-after-edit invoca subagentes ou apenas scripts determinísticos?
const hook = fs.readFileSync(path.join(ROOT, 'scripts', 'hooks', 'build-after-edit.ps1'), 'utf8');
const hookNodeScripts = [...hook.matchAll(/node\s+\$(\w+)/g)].map((m) => m[1]);
const hookInvokesAgents = /runSubagent|\.agent\.|\.toml/i.test(hook.replace(/#.*/g, ''));
check('4. Hook roda SOMENTE scripts node (determinísticos), sem subagente', hookNodeScripts.length > 0 && !hookInvokesAgents,
    'node scripts: ' + hookNodeScripts.join(', '));

// 5. Subagentes são arquivos de DEFINIÇÃO (.agent.md) ou executáveis?
const agentsDir = path.join(ROOT, '.github', 'agents');
const agentFiles = fs.existsSync(agentsDir) ? fs.readdirSync(agentsDir).filter((f) => f.endsWith('.agent.md')) : [];
const firstAgent = agentFiles[0] ? fs.readFileSync(path.join(agentsDir, agentFiles[0]), 'utf8').slice(0, 400) : '';
const saoDefinicoes = agentFiles.length > 0 && /^---/.test(firstAgent) && /name:/.test(firstAgent);
check('5. Subagentes são DEFINITIONS (.agent.md), não scripts executáveis', saoDefinicoes,
    agentFiles.length + ' definições; frontmatter=' + /^---/.test(firstAgent));

// 6. Pasta .codex/agents (subagentes do Codex) existe?
check('6. Subagentes do Codex (.codex/agents/) materializados', fs.existsSync(path.join(ROOT, '.codex', 'agents')));

// 7. Há consumidor que lê relatorios/impacto E invoca subagentes?
let consumer = false;
const scriptsDir = path.join(ROOT, 'scripts');
if (fs.existsSync(scriptsDir)) {
    fs.readdirSync(scriptsDir).forEach((f) => {
        if (!/\.(js|ps1)$/.test(f) || /^test-/.test(f)) return;
        const c = fs.readFileSync(path.join(scriptsDir, f), 'utf8');
        if (/relatorios[\\/]impacto/.test(c) && /runSubagent\s*\(|invokeSubagent\s*\(/.test(c)) consumer = true;
    });
}
check('7. Consumidor que lê relatorios/impacto E invoca subagentes', consumer);

// Veredito
const seleciona = sel.subagentesNecessarios.length > 0;
const executa = hasExecutor || invoca || consumer;
console.log('\n=== VEREDITO ===');
if (seleciona && executa) {
    console.log('A/B — EXECUÇÃO DINÂMICA COMPROVADA (seleção + invocação real)');
} else if (seleciona) {
    console.log('C — SOMENTE SELEÇÃO (classificador seleciona; NÃO há invocação programática de subagentes)');
} else {
    console.log('D/E — SEM IMPLEMENTAÇÃO / ERRO');
}
process.exitCode = 0;
