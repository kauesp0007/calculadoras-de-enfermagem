// cwv-gate.js — GATE AUTOMÁTICO E DETERMINÍSTICO de Core Web Vitals / performance.
// Fluxo: detectar → auditar → classificar → corrigir (seguro) → re-auditar → evidência.
// NÃO depende de IA. Produz resultado reproduzível e idempotente.
//
// Entrada (uma das duas):
//   1) stdin JSON: { "files": ["caminho1", "caminho2", ...] }  (usado pelo hook build-after-edit)
//   2) CLI: node scripts/cwv-gate.js --files caminho1.html caminho2.js
//           node scripts/cwv-gate.js --all   (varre o acervo inteiro)
//           node scripts/cwv-gate.js --dry-run --files ...
//
// Saída: evidência em relatorios/cwv-gate/<timestamp>.json + resumo no console.
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { analyze, correct, problems } = require('./lib/cwv-core');

const MAX_CORRECTION_CYCLES = 3;
const MAX_PAGES = 50;
const LANGUAGES = ['en', 'es', 'de', 'it', 'fr', 'hi', 'zh', 'ar', 'ja', 'ru', 'ko', 'tr', 'nl', 'pl', 'sv', 'id', 'vi', 'uk'];
const IGNORE_FOLDERS = ['downloads', 'biblioteca', 'blog', 'blog-templates', 'node_modules', '.git', 'backups-temporarios', 'automacoes', 'relatorios'];
const IGNORE_FILES = ['footer.html', 'menu-global.html', 'global-body-elements.html', 'downloads.html', '_language_selector.html', 'googlefc0a17cdd552164b.html'];

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const ALL = args.includes('--all');

function readStdin() {
    // Não lê stdin quando é um terminal interativo (evita bloquear esperando EOF).
    if (process.stdin.isTTY) return null;
    try {
        const raw = fs.readFileSync(0, 'utf8');
        if (raw && raw.trim()) {
            const j = JSON.parse(raw);
            if (j && Array.isArray(j.files)) return j.files;
        }
    } catch (_) { /* sem stdin válido */ }
    return null;
}

function parseFilesArg() {
    const idx = args.indexOf('--files');
    if (idx === -1 || idx + 1 >= args.length) return [];
    return args.slice(idx + 1).filter((a) => !a.startsWith('--'));
}

// Coleta todos os HTML (raiz + idiomas), ignorando .min.html e proibidos.
function collectHtmlFiles(dir = '.') {
    const out = [];
    function walk(d, isLang) {
        let items;
        try { items = fs.readdirSync(d); } catch (_) { return; }
        items.forEach((item) => {
            const full = path.join(d, item);
            let stat;
            try { stat = fs.statSync(full); } catch (_) { return; }
            if (stat.isDirectory()) {
                if (IGNORE_FOLDERS.includes(item)) return;
                walk(full, isLang);
            } else if (item.endsWith('.html') && !item.endsWith('.min.html') && !IGNORE_FILES.includes(item)) {
                out.push(full);
            }
        });
    }
    walk(dir, false);
    LANGUAGES.forEach((l) => walk(path.join(dir, l), true));
    return out;
}

function normalize(p) {
    let s = String(p);
    if (s.startsWith('file://')) {
        try { s = require('url').fileURLToPath(s); } catch (_) { s = s.replace(/^file:\/\/\//, ''); }
    }
    return s.replace(/\\/g, '/');
}

// Resolve as páginas HTML afetadas (diretas + dependentes de CSS/JS/imagem compartilhada).
function resolveAffectedPages(fileList, rootDir = '.') {
    const directHtml = [];
    const sharedAssets = [];
    fileList.forEach((p) => {
        const n = normalize(p);
        const ext = path.extname(n).toLowerCase();
        if (ext === '.html') directHtml.push(n);
        else if (ext === '.css' || ext === '.js' || ext === '.png' || ext === '.jpg' || ext === '.jpeg' || ext === '.webp' || ext === '.svg' || ext === '.woff' || ext === '.woff2') {
            sharedAssets.push(path.basename(n));
        }
    });

    const affected = new Set(directHtml.map((h) => path.resolve(rootDir, h)));

    if (sharedAssets.length > 0) {
        const all = collectHtmlFiles(rootDir);
        for (const html of all) {
            if (affected.size >= MAX_PAGES) break;
            let content;
            try { content = fs.readFileSync(html, 'utf8'); } catch (_) { continue; }
            for (const asset of sharedAssets) {
                if (content.includes(asset)) {
                    affected.add(path.resolve(html));
                    break;
                }
            }
        }
    }

    return [...affected].slice(0, MAX_PAGES);
}

function hashOf(s) {
    return crypto.createHash('sha1').update(s).digest('hex').slice(0, 12);
}

function classify(probList) {
    if (probList.length === 0) return 'PASS';
    // Se há algum problema auto-corrigível, corrige primeiro (CORRECTABLE),
    // independentemente de haver problemas não-corrigíveis junto.
    if (probList.some((p) => p.autoFixable)) return 'CORRECTABLE';
    const high = probList.some((p) => p.severity === 'high');
    return high ? 'FAIL' : 'WARNING';
}

function runPage(filePath) {
    const result = {
        page: filePath.replace(/\\/g, '/'),
        hashBefore: null,
        hashAfter: null,
        status: 'ERROR',
        cycles: 0,
        problemsInitial: [],
        problemsFinal: [],
        corrections: [],
        runtime: { lcp: 'NOT_MEASURED', cls: 'NOT_MEASURED', inp: 'NOT_MEASURED' },
        limitation: 'Métricas runtime (LCP/CLS/INP) não medidas — sem navegador real nesta execução.'
    };

    let content;
    try {
        content = fs.readFileSync(filePath, 'utf8');
    } catch (e) {
        result.status = 'ERROR';
        result.detail = 'Falha ao ler arquivo: ' + e.message;
        return result;
    }

    result.hashBefore = hashOf(content);

    let current = content;
    for (let cycle = 1; cycle <= MAX_CORRECTION_CYCLES; cycle++) {
        result.cycles = cycle;
        const an = analyze(current);
        const pl = problems(an);
        if (cycle === 1) result.problemsInitial = pl.map((p) => p.id);
        if (pl.length === 0) {
            result.status = cycle === 1 ? 'PASS' : 'PASS_STABLE';
            result.problemsFinal = [];
            break;
        }
        const cls = classify(pl);
        if (cls === 'PASS') {
            result.status = 'PASS';
            result.problemsFinal = [];
            break;
        }
        if (cls === 'FAIL' || cls === 'WARNING') {
            result.status = cls;
            result.problemsFinal = pl.map((p) => p.id);
            result.detail = 'Problemas não auto-corrigíveis restantes.';
            break;
        }
        // CORRECTABLE: aplica correções seguras
        const { content: novo, changed } = correct(current);
        if (!changed) {
            // Nada a corrigir embora classificado como CORRECTABLE — safety net.
            result.status = 'FAIL_AFTER_AUTOCORRECTION';
            result.problemsFinal = pl.map((p) => p.id);
            result.detail = 'Correção segura não produziu mudança.';
            break;
        }
        const autoIds = pl.filter((p) => p.autoFixable).map((p) => p.id);
        result.corrections.push({ cycle, applied: autoIds });
        current = novo;
        // continua para a próxima auditoria (re-auditoria)
    }

    // Se o loop terminou sem status definido (atingiu MAX_CYCLES ainda com problema)
    if (!result.status) {
        const pl = problems(analyze(current));
        result.status = pl.length === 0 ? 'PASS_STABLE' : 'FAIL_AFTER_AUTOCORRECTION';
        result.problemsFinal = pl.map((p) => p.id);
        if (result.status === 'FAIL_AFTER_AUTOCORRECTION') {
            result.detail = `Limite de ${MAX_CORRECTION_CYCLES} ciclos atingido sem estabilizar.`;
        }
    }

    // Persiste a correção (com backup) e calcula hash final
    if (current !== content && !DRY_RUN) {
        const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const backupDir = path.join('backups-temporarios', 'cwv-gate', ts);
        fs.mkdirSync(backupDir, { recursive: true });
        fs.copyFileSync(filePath, path.join(backupDir, path.basename(filePath)));
        fs.writeFileSync(filePath, current, 'utf8');
        result.corrected = true;
    } else if (current !== content && DRY_RUN) {
        result.corrected = 'dry-run';
    } else {
        result.corrected = false;
    }

    result.hashAfter = hashOf(current);
    result.idempotent = (result.status === 'PASS' || result.status === 'PASS_STABLE');
    return result;
}

function main() {
    let fileList = readStdin();
    if (!fileList) fileList = parseFilesArg();
    if (ALL) fileList = collectHtmlFiles();
    if (!fileList || fileList.length === 0) {
        console.log('[cwv-gate] Nenhum arquivo alvo. Uso: --files <arquivos> | --all | stdin JSON.');
        process.exit(0);
    }

    const pages = resolveAffectedPages(fileList);
    const results = pages.map((p) => runPage(p));

    const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const evidence = {
        timestamp: ts,
        mechanism: 'cwv-gate.js',
        maxCorrectionCycles: MAX_CORRECTION_CYCLES,
        dryRun: DRY_RUN,
        affectedFiles: fileList.map(normalize),
        auditedPages: results.length,
        pages: results
    };

    if (!DRY_RUN) {
        const outDir = path.join('relatorios', 'cwv-gate');
        fs.mkdirSync(outDir, { recursive: true });
        fs.writeFileSync(path.join(outDir, ts + '.json'), JSON.stringify(evidence, null, 2), 'utf8');
    }

    // Resumo no console
    console.log('=== CWV GATE (determinístico) ===');
    console.log('Arquivos alvo: ' + fileList.length + ' | Páginas auditadas: ' + pages.length + (DRY_RUN ? ' [DRY-RUN]' : ''));
    results.forEach((r) => {
        console.log(`  ${r.status.padEnd(24)} ${r.page}  (ciclos=${r.cycles}, corrigido=${r.corrected})`);
    });
    const counts = {};
    results.forEach((r) => { counts[r.status] = (counts[r.status] || 0) + 1; });
    console.log('Resumo: ' + JSON.stringify(counts));
    if (!DRY_RUN) console.log('Evidência: relatorios/cwv-gate/' + ts + '.json');

    const hasBlocking = results.some((r) => r.status === 'FAIL' || r.status === 'FAIL_AFTER_AUTOCORRECTION' || r.status === 'ERROR');
    process.exitCode = hasBlocking ? 1 : 0;
}

module.exports = { resolveAffectedPages, runPage, classify, MAX_CORRECTION_CYCLES, collectHtmlFiles };

if (require.main === module) main();
