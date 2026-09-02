// orquestrador.js — ORQUESTRADOR (MODEL_DRIVEN) — camada de decisão/coordenação.
// Consome o classificador, monta o PLANO DE EXECUÇÃO (paralelismo + sequência + dependências),
// distingue o que é EXECUTADO determinísticamente (scripts) do que é SELECIONADO (subagentes IA).
// A invocação REAL dos subagentes é MODEL_DRIVEN: o modelo principal lê o plano e chama
// a capacidade de subagentes do ambiente (runSubagent no Copilot; subagentes no Codex; etc.).
// Uso: node scripts/orquestrador.js --files a.html b.css | stdin JSON {files:[...]}
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { classifyFile, AGENTS } = require('./classificar-impacto');
const { resolveAffectedPages } = require('./cwv-gate');

const ORCHESTRATION_MODE = 'MODEL_DRIVEN';
const PARALLELISM_MODE = 'SEQUENTIAL_RUNTIME_LIMITATION';
const MAX_CORRECTION_CYCLES = 3;

// Ciclo de vida do fluxo de orquestração (estados ordenados).
const LIFECYCLE = ['CLASSIFIED', 'PLANNED', 'SELECTED', 'EXECUTED', 'RESULTS_COLLECTED', 'VALIDATED', 'COUNTER_PROVED', 'FINAL_REVIEWED', 'COMPLETED'];
// Status normalizados de resultado de subagente.
const RESULT_STATUS = ['PASS', 'WARNING', 'FAIL', 'ERROR', 'NOT_MEASURED', 'UNAVAILABLE_AT_RUNTIME'];

// Papel de cada agente no pipeline (para montar paralelismo e sequência).
// phase: 0=determinístico/criação · 1=auditoria(paralela) · 2=correção · 3=teste · 4=gate final.
const AGENT_PHASE = {
    'Descoberta de Conhecimento': 0,
    'Gerador de Imagens': 0,
    'Nova Calculadora': 0,
    'Tradutor de Página': 0,
    'Build do Site': 0,
    'Auditor de Governança Regulatória': 1,
    'Auditor SEO': 1,
    'Auditor de Performance (Core Web Vitals)': 1,
    'Auditor de Conformidade Técnica': 1,
    'Verificador de Hreflang/Canonical': 1,
    'Auditor do Ecossistema': 1,
    'Revisor de Integridade': 2,
    'Testador no Navegador': 3,
    'Revisor Final (QA Gate)': 4,
    'Agente Alfandegário': 4
};

// Contexto mínimo por agente (o que o modelo principal deve fornecer ao invocá-lo).
const AGENT_CONTEXT = {
    'Auditor de Performance (Core Web Vitals)': ['arquivos afetados', 'resultado CWV (relatorios/cwv-gate)', 'recursos relevantes'],
    'Auditor SEO': ['head (title/metas)', 'canonical/hreflang', 'página afetada'],
    'Auditor de Conformidade Técnica': ['HTML/CSS relevantes', 'resultado check-a11y', 'resultado cwv-gate'],
    'Testador no Navegador': ['URL/página', 'alterações funcionais', 'critérios de teste'],
    'Build do Site': ['comando de build', 'arquivos alterados'],
    'Auditor de Governança Regulatória': ['conteúdo clínico/regulatório', 'fontes', 'marcadores de governança'],
    'Revisor de Integridade': ['links/imagens afetados', 'mapa de dependências'],
    'Verificador de Hreflang/Canonical': ['cluster multilingue', 'páginas do idioma'],
    'Tradutor de Página': ['página original', 'idiomas de destino'],
    'Descoberta de Conhecimento': ['tema', 'base /knowledge/'],
    'Gerador de Imagens': ['conteúdo da página', 'plano visual'],
    'Nova Calculadora': ['dossiê de descoberta', 'padrão de página'],
    'Revisor Final (QA Gate)': ['resultados consolidados', 'auditorias', 'correções'],
    'Auditor do Ecossistema': ['catálogos', 'agentes/hooks/scripts'],
    'Agente Alfandegário': ['pré-condições', 'evidências da etapa']
};

// Normaliza o retorno de um subagente para a estrutura padrão.
function normalizeResult(agent, status, findings, correctionsRequired, evidence) {
    return {
        agent,
        status: RESULT_STATUS.includes(status) ? status : 'ERROR',
        findings: findings || [],
        correctionsRequired: correctionsRequired || [],
        evidence: evidence || []
    };
}

function readStdin() {
    if (process.stdin.isTTY) return null;
    try {
        const raw = fs.readFileSync(0, 'utf8');
        if (raw && raw.trim()) {
            const j = JSON.parse(raw);
            if (j && Array.isArray(j.files)) return j.files;
        }
    } catch (_) { }
    return null;
}

function parseFilesArg() {
    const args = process.argv.slice(2);
    const idx = args.indexOf('--files');
    if (idx === -1) return [];
    return args.slice(idx + 1).filter((a) => !a.startsWith('--'));
}

function taskId(files) {
    const h = crypto.createHash('sha1').update(files.join('|') + '|' + Date.now()).digest('hex').slice(0, 12);
    return 'task-' + h;
}

function riskOf(categorias) {
    if (categorias.includes('D')) return 'ALTA';
    if (categorias.includes('C')) return 'MEDIA';
    return 'BAIXA';
}

// Valida a integridade estrutural do plano (campos obrigatórios + consistência SELECTED/EXECUTED).
function validatePlan(plan) {
    const problems = [];
    if (!plan.taskId) problems.push('taskId ausente');
    if (!Array.isArray(plan.plan.agentsSelected)) problems.push('agentsSelected inválido');
    if (!Array.isArray(plan.plan.scripts)) problems.push('scripts inválido');
    if (!plan.evidence) problems.push('evidence ausente');
    else if (plan.evidence.classified !== true) problems.push('classified != true');
    // Distinção obrigatória: subagentes não podem estar em executedAgents sem terem sido executados
    const sel = new Set(plan.plan.agentsSelected);
    (plan.evidence.executedAgents || []).forEach((a) => { if (!sel.has(a)) problems.push('agente executado não selecionado: ' + a); });
    return { valid: problems.length === 0, problems };
}

// Monta o plano de execução a partir da classificação.
function buildPlan(files) {
    const classificacao = files.map(classifyFile);
    const tipos = [...new Set(classificacao.map((c) => c.tipo))];
    const categorias = [...new Set(classificacao.map((c) => c.categoria))];

    const agentsSelected = [...new Set(classificacao.flatMap((c) => c.subagentesNecessarios))];
    const agentsExcluded = AGENTS.filter((a) => !agentsSelected.includes(a));
    const scripts = [...new Set(classificacao.flatMap((c) => c.scripts))];
    const validations = [...new Set(classificacao.flatMap((c) => c.validacoes))];
    const counterProof = agentsSelected.filter((a) => AGENT_PHASE[a] === 4 && a === 'Revisor Final (QA Gate)');

    // Dependências: páginas afetadas (além dos arquivos diretos) para recursos compartilhados.
    const dependencies = resolveAffectedPages(files);

    // Agrupa por fase para paralelismo/sequência.
    const byPhase = {};
    agentsSelected.forEach((a) => {
        const p = AGENT_PHASE[a] !== undefined ? AGENT_PHASE[a] : 1;
        (byPhase[p] = byPhase[p] || []).push(a);
    });
    const parallelGroups = Object.keys(byPhase).sort().map((p) => byPhase[p]);
    const sequentialSteps = [
        { step: 'deterministic', items: scripts },
        ...parallelGroups.map((group) => ({ step: 'phase', agents: group }))
    ];

    const evidence = {
        classified: true,
        state: 'PLANNED',
        lifecycle: LIFECYCLE,
        selectedAgents: agentsSelected,
        executedAgents: [],
        executedScripts: scripts,
        results: [],
        resultsCollected: false,
        validations,
        counterProof,
        counterProved: false,
        finalReviewer: counterProof.length > 0 ? 'Revisor Final (QA Gate)' : null,
        finalReviewed: false,
        decision: null,
        cycles: 0
    };

    const contextoMinimo = Object.fromEntries(agentsSelected.map((a) => [a, AGENT_CONTEXT[a] || ['objetivo', 'arquivos relevantes']]));

    return {
        taskId: taskId(files),
        orchestrationMode: ORCHESTRATION_MODE,
        parallelismMode: PARALLELISM_MODE,
        timestamp: new Date().toISOString(),
        files,
        impactTypes: tipos,
        classification: classificacao,
        plan: {
            scripts,
            validations,
            agentsSelected,
            agentsExcluded,
            contextoMinimo,
            parallelGroups,
            sequentialSteps,
            counterProof,
            dependencies,
            risk: riskOf(categorias),
            maxCycles: MAX_CORRECTION_CYCLES
        },
        evidence
    };
}

function main() {
    let files = readStdin();
    if (!files) files = parseFilesArg();
    if (!files || files.length === 0) {
        console.log('[orquestrador] Nenhum arquivo. Uso: --files <arquivos> | stdin JSON.');
        process.exit(0);
    }

    const plan = buildPlan(files);

    const outDir = path.join('relatorios', 'orquestracao');
    fs.mkdirSync(outDir, { recursive: true });
    const outFile = path.join(outDir, plan.taskId + '.json');
    fs.writeFileSync(outFile, JSON.stringify(plan, null, 2), 'utf8');

    console.log('=== PLANO DE EXECUÇÃO (orquestrador, ' + ORCHESTRATION_MODE + ') ===');
    console.log('taskId: ' + plan.taskId);
    console.log('impacto: ' + plan.impactTypes.join(', ') + ' | risco: ' + plan.plan.risk);
    console.log('scripts (EXECUTED): ' + (plan.plan.scripts.join(', ') || '(nenhum)'));
    console.log('agentes (SELECTED, MODEL_DRIVEN): ' + (plan.plan.agentsSelected.join(', ') || '(nenhum)'));
    console.log('paralelo/sequência:');
    plan.plan.sequentialSteps.forEach((s) => {
        if (s.step === 'deterministic') console.log('  1. determinístico: ' + s.items.join(', '));
        else console.log('  ' + s.step + ': ' + s.agents.join(' | '));
    });
    console.log('contra-prova: ' + (plan.plan.counterProof.join(', ') || '(não aplicável)'));
    console.log('dependências (páginas afetadas): ' + plan.plan.dependencies.length);
    console.log('Evidência: ' + outFile);
}

module.exports = { buildPlan, validatePlan, normalizeResult, ORCHESTRATION_MODE, PARALLELISM_MODE, MAX_CORRECTION_CYCLES, AGENT_PHASE, AGENT_CONTEXT, LIFECYCLE, RESULT_STATUS };

if (require.main === module) main();
