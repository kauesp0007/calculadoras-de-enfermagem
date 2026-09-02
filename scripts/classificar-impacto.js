// classificar-impacto.js — CLASSIFICADOR DETERMINÍSTICO de impacto de alteração.
// Identifica o TIPO e o ALCANCE de uma alteração e seleciona os subagentes mínimos,
// scripts e validações necessários. NÃO executa os agentes — apenas os seleciona.
// Uso: node scripts/classificar-impacto.js --files a.html b.css | --all | stdin JSON {files:[...]}
'use strict';

const fs = require('fs');
const path = require('path');

// Agentes existentes (fonte: .github/agents/) — usados como subagentes especializados.
const AGENTS = [
    'Auditor de Governança Regulatória',
    'Auditor SEO',
    'Build do Site',
    'Descoberta de Conhecimento',
    'Gerador de Imagens',
    'Nova Calculadora',
    'Testador no Navegador',
    'Tradutor de Página',
    'Auditor de Performance (Core Web Vitals)',
    'Revisor de Integridade',
    'Verificador de Hreflang/Canonical',
    'Revisor Final (QA Gate)',
    'Auditor do Ecossistema',
    'Auditor de Conformidade Técnica',
    'Agente Alfandegário'
];

const LANG_FOLDERS = ['en', 'es', 'de', 'it', 'fr', 'hi', 'zh', 'ar', 'ja', 'ru', 'ko', 'tr', 'nl', 'pl', 'sv', 'id', 'vi', 'uk'];
const GLOBAL_FILES = ['footer.html', 'menu-global.html', 'global-body-elements.html', '_language_selector.html', 'downloads.html'];

// MATRIZ DE SELEÇÃO — tipo de alteração → categoria, subagentes, scripts, validações.
// (fonte única; documentada em AI_ORCHESTRATION/MATRIZ_SELECAO_DE_SUBAGENTES.md)
const MATRIX = {
    html: {
        categoria: 'C',
        subagentes: ['Auditor de Performance (Core Web Vitals)', 'Auditor SEO', 'Auditor de Conformidade Técnica', 'Testador no Navegador', 'Build do Site', 'Revisor Final (QA Gate)'],
        scripts: ['scripts/cwv-gate.js'],
        validacoes: ['check-layout', 'check-head', 'check-a11y', 'content-governance'],
        contraProva: true
    },
    global: {
        categoria: 'D',
        subagentes: ['Auditor do Ecossistema', 'Revisor de Integridade', 'Auditor de Conformidade Técnica', 'Testador no Navegador', 'Revisor Final (QA Gate)'],
        scripts: ['scripts/fix-broken-links.js'],
        validacoes: ['check-layout', 'check-head', 'check-a11y'],
        contraProva: true
    },
    css: {
        categoria: 'B',
        subagentes: ['Auditor de Performance (Core Web Vitals)', 'Auditor de Conformidade Técnica', 'Testador no Navegador', 'Build do Site', 'Revisor Final (QA Gate)'],
        scripts: ['scripts/cwv-gate.js'],
        validacoes: ['check-layout', 'check-a11y'],
        contraProva: true
    },
    js: {
        categoria: 'B',
        subagentes: ['Auditor de Performance (Core Web Vitals)', 'Testador no Navegador', 'Revisor de Integridade', 'Build do Site', 'Revisor Final (QA Gate)'],
        scripts: ['scripts/cwv-gate.js'],
        validacoes: [],
        contraProva: true
    },
    script: {
        categoria: 'A',
        subagentes: ['Auditor do Ecossistema'],
        scripts: ['scripts/auditar-ecossistema.js'],
        validacoes: [],
        contraProva: false
    },
    imagem: {
        categoria: 'B',
        subagentes: ['Auditor de Performance (Core Web Vitals)', 'Revisor de Integridade'],
        scripts: ['scripts/cwv-gate.js'],
        validacoes: [],
        contraProva: false
    },
    fonte: {
        categoria: 'A',
        subagentes: ['Auditor de Performance (Core Web Vitals)', 'Revisor de Integridade'],
        scripts: ['scripts/cwv-gate.js'],
        validacoes: [],
        contraProva: false
    },
    clinico: {
        categoria: 'D',
        subagentes: ['Descoberta de Conhecimento', 'Auditor de Governança Regulatória', 'Auditor de Conformidade Técnica', 'Testador no Navegador', 'Revisor Final (QA Gate)'],
        scripts: [],
        validacoes: ['content-governance'],
        contraProva: true
    },
    formula: {
        categoria: 'C',
        subagentes: ['Testador no Navegador', 'Revisor Final (QA Gate)'],
        scripts: [],
        validacoes: [],
        contraProva: true
    },
    traducao: {
        categoria: 'C',
        subagentes: ['Tradutor de Página', 'Verificador de Hreflang/Canonical', 'Revisor de Integridade', 'Revisor Final (QA Gate)'],
        scripts: [],
        validacoes: ['check-head'],
        contraProva: true
    },
    config: {
        categoria: 'A',
        subagentes: ['Auditor do Ecossistema', 'Auditor de Conformidade Técnica'],
        scripts: ['scripts/auditar-ecossistema.js'],
        validacoes: ['check-json'],
        contraProva: false
    },
    conhecimento: {
        categoria: 'A',
        subagentes: ['Descoberta de Conhecimento'],
        scripts: ['scripts/build-knowledge-index.js'],
        validacoes: [],
        contraProva: false
    },
    governanca: {
        categoria: 'D',
        subagentes: ['Auditor de Governança Regulatória'],
        scripts: ['scripts/validate-content-governance.js'],
        validacoes: ['content-governance'],
        contraProva: true
    },
    seguranca: {
        categoria: 'A',
        subagentes: ['Auditor do Ecossistema'],
        scripts: [],
        validacoes: ['security-git', 'block-protected-files'],
        contraProva: false
    },
    build: {
        categoria: 'A',
        subagentes: ['Build do Site', 'Auditor do Ecossistema'],
        scripts: ['gerar-sw.js'],
        validacoes: [],
        contraProva: false
    },
    documentacao: {
        categoria: 'A',
        subagentes: ['Auditor do Ecossistema'],
        scripts: ['scripts/auditar-ecossistema.js'],
        validacoes: [],
        contraProva: false
    }
};

function isLangFolder(p) {
    const s = p.replace(/\\/g, '/');
    return LANG_FOLDERS.some((l) => s.includes('/' + l + '/') || s.startsWith(l + '/'));
}

// Detecta o tipo de alteração (determinístico: extensão + caminho + sinais de conteúdo).
function detectTipo(filePath, content) {
    const p = filePath.replace(/\\/g, '/');
    const base = path.basename(p);
    const ext = path.extname(p).toLowerCase();

    if (ext === '.html' || ext === '.htm') {
        if (GLOBAL_FILES.includes(base)) return 'global';
        if (isLangFolder(p)) return 'traducao';
        if (content) {
            if (/data-professional-review|data-governance-disclosure|data-references-section/.test(content)) return 'clinico';
            if (/<form\b|btnCalcular|id="calcular"|calcular\s*\(/.test(content)) return 'formula';
        }
        return 'html';
    }
    if (ext === '.css') return 'css';
    if (ext === '.js') {
        if (/^scripts\//.test(p)) return 'script';
        return 'js';
    }
    if (['.png', '.jpg', '.jpeg', '.webp', '.svg', '.gif', '.avif'].includes(ext)) return 'imagem';
    if (['.woff', '.woff2', '.ttf', '.otf', '.eot'].includes(ext)) return 'fonte';
    if (ext === '.json') {
        if (/\/knowledge\//.test(p) || /knowledge/.test(p)) return 'conhecimento';
        if (/governance/.test(p)) return 'governanca';
        return 'config';
    }
    if (ext === '.yml' || ext === '.yaml') return 'build';
    if (ext === '.md') return 'documentacao';
    if (['.env', '.pem', '.key', '.p12', '.crt'].includes(ext) || /\.env\./.test(base) || /secret|credential|\.key\b/.test(base)) return 'seguranca';
    return 'outro';
}

function classifyFile(filePath) {
    const p = filePath.replace(/\\/g, '/');
    let content = null;
    try { content = fs.readFileSync(filePath, 'utf8'); } catch (_) { /* arquivo pode não existir ainda */ }

    const tipo = detectTipo(p, content);
    const m = MATRIX[tipo] || MATRIX.html;
    const subagentes = m.subagentes;
    const naoNecessarios = AGENTS.filter((a) => !subagentes.includes(a));

    return {
        arquivo: p,
        tipo,
        categoria: m.categoria,
        subagentesNecessarios: subagentes,
        subagentesNaoNecessarios: naoNecessarios,
        scripts: m.scripts,
        validacoes: m.validacoes,
        contraProva: m.contraProva
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

function main() {
    let files = readStdin();
    if (!files) files = parseFilesArg();
    if (!files || files.length === 0) {
        console.log('[classificar-impacto] Nenhum arquivo. Uso: --files <arquivos> | stdin JSON.');
        process.exit(0);
    }

    const resultado = files.map(classifyFile);
    const resumo = {};
    resultado.forEach((r) => {
        const key = `${r.tipo} (${r.categoria})`;
        resumo[key] = (resumo[key] || 0) + 1;
    });

    const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const evidence = { timestamp: ts, files: files.length, classificacao: resultado, resumo };
    const outDir = path.join('relatorios', 'impacto');
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, ts + '.json'), JSON.stringify(evidence, null, 2), 'utf8');

    console.log('=== CLASSIFICADOR DE IMPACTO (determinístico) ===');
    resultado.forEach((r) => {
        console.log(`  [${r.categoria}] ${r.tipo.padEnd(14)} ${r.arquivo}`);
        console.log(`      agentes: ${r.subagentesNecessarios.join(', ') || '(nenhum)'}`);
    });
    console.log('Resumo: ' + JSON.stringify(resumo));
    console.log('Evidência: relatorios/impacto/' + ts + '.json');
}

module.exports = { classifyFile, detectTipo, MATRIX, AGENTS };

if (require.main === module) main();
