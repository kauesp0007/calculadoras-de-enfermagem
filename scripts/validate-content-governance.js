"use strict";

const fs = require("fs");
const path = require("path");
const { isProtected } = require("../automation-guard.js");

const ROOT = path.resolve(__dirname, "..");
const configPath = path.join(ROOT, "governance", "content-governance.config.json");
const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
const ignoredDirectories = new Set([
    ".git",
    ".github",
    ".chrome-perfil-pci",
    "backups-temporarios",
    "automacoes",
    "blog",
    "blog-templates",
    "biblioteca",
    "CKO-COREN-Projeto-Completo-v2",
    "downloads",
    "node_modules",
    "public"
]);

function listHtmlFiles(directory, files = []) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        if (entry.isDirectory()) {
            if (!ignoredDirectories.has(entry.name)) listHtmlFiles(path.join(directory, entry.name), files);
            continue;
        }
        if (entry.isFile() && entry.name.endsWith(".html") && !isProtected(relative(path.join(directory, entry.name)))) {
            files.push(path.join(directory, entry.name));
        }
    }
    return files;
}

function relative(filePath) {
    return path.relative(ROOT, filePath).split(path.sep).join("/");
}

function loadRuntimeStatus() {
    const runtimeRoot = path.join(ROOT, config.canonical_runtime.root);
    const actsPath = path.join(runtimeRoot, config.canonical_runtime.canonical_acts);
    const evidencePath = path.join(runtimeRoot, config.canonical_runtime.evidence_sources);
    const releasePath = path.join(runtimeRoot, config.canonical_runtime.release_decision);
    const status = { available: fs.existsSync(runtimeRoot), canonicalActs: 0, acquiredSnapshots: 0, release: null };

    if (!status.available) return status;
    if (fs.existsSync(actsPath)) {
        status.canonicalActs = fs.readdirSync(actsPath).filter(file => file.endsWith(".json")).length;
    }
    if (fs.existsSync(evidencePath)) {
        const sources = JSON.parse(fs.readFileSync(evidencePath, "utf8")).sources || [];
        status.acquiredSnapshots = sources.filter(source => source.acquisition_status === "ACQUIRED").length;
    }
    if (fs.existsSync(releasePath)) {
        status.release = JSON.parse(fs.readFileSync(releasePath, "utf8")).release || null;
    }
    return status;
}

function loadEvidenceCatalog() {
    const evidencePath = path.join(ROOT, config.canonical_runtime.root, config.canonical_runtime.evidence_sources);
    const libraryPath = path.join(ROOT, config.document_library.catalog_path);
    const reviewersPath = path.join(ROOT, config.document_library.reviewer_registry_path);
    const runtimeSources = fs.existsSync(evidencePath)
        ? JSON.parse(fs.readFileSync(evidencePath, "utf8")).sources || []
        : [];
    const localDocuments = fs.existsSync(libraryPath)
        ? JSON.parse(fs.readFileSync(libraryPath, "utf8")).documents || []
        : [];
    const reviewers = fs.existsSync(reviewersPath)
        ? JSON.parse(fs.readFileSync(reviewersPath, "utf8")).reviewers || []
        : [];
    const activeReviewerRefs = new Set(reviewers
        .filter(reviewer => reviewer.status === "ACTIVE" && reviewer.professional_verification === "VERIFIED")
        .map(reviewer => reviewer.reviewer_ref));
    const approvedLocalIds = new Set(localDocuments
        .filter(document => document.review_status === "APPROVED" && document.source_authority === "OFFICIAL" && document.sha256 && activeReviewerRefs.has(document.professional_review_ref))
        .map(document => document.document_id));
    return {
        runtimeIds: new Set(runtimeSources.map(source => source.evidence_source_id)),
        approvedLocalIds,
        activeReviewers: activeReviewerRefs.size,
        pendingLocalDocuments: localDocuments.filter(document => document.review_status !== "APPROVED").length
    };
}

function isHighRiskCandidate(filePath, body, pattern) {
    const name = path.basename(filePath, ".html").toLocaleLowerCase("pt-BR");
    const filenameMatch = config.high_risk_detection.filename_terms.some(term => name.includes(term));
    return filenameMatch || pattern.test(body);
}

function loadBaseline() {
    const baselinePath = path.join(ROOT, config.baseline_path || "governance/public-html-baseline.json");
    if (!fs.existsSync(baselinePath)) return new Set();
    const baseline = JSON.parse(fs.readFileSync(baselinePath, "utf8"));
    return new Set(baseline.paths || []);
}

function isNewPublicHtml(file, baseline) {
    return config.mode === "ENFORCE_NEW" && !baseline.has(file);
}

function validateNewHtml(file, body, findings) {
    if (!/^<!doctype html>/i.test(body.trimStart())) {
        findings.push({ code: "GOV-005", severity: "ERROR", file, message: "HTML público novo sem <!doctype html>." });
    }
    if (!/<html\b[^>]*\blang=["'][^"']+["']/i.test(body)) {
        findings.push({ code: "GOV-006", severity: "ERROR", file, message: "HTML público novo sem atributo lang no elemento html." });
    }
    if (!/<title>[^<]+<\/title>/i.test(body)) {
        findings.push({ code: "GOV-007", severity: "ERROR", file, message: "HTML público novo sem título SEO." });
    }
    if (!/<meta\b[^>]*\bname=["']description["'][^>]*\bcontent=["'][^"']+/i.test(body)) {
        findings.push({ code: "GOV-008", severity: "ERROR", file, message: "HTML público novo sem meta description." });
    }
    const referencesMarker = /data-references-section\s*=\s*["']v1["']/i.exec(body);
    const disclosureMarker = /data-governance-disclosure\s*=\s*["']v1["']/i.exec(body);
    const professionalReviewMarker = /data-professional-review\s*=\s*["']required["']/i.exec(body);
    if (!referencesMarker) {
        findings.push({ code: "GOV-009", severity: "ERROR", file, message: "HTML público novo sem marcador canônico na seção de Referências Bibliográficas." });
    }
    if (!disclosureMarker) {
        findings.push({ code: "GOV-010", severity: "ERROR", file, message: "HTML público novo sem nota de transparência de governança regulatória." });
    }
    if (referencesMarker && disclosureMarker && disclosureMarker.index < referencesMarker.index) {
        findings.push({ code: "GOV-011", severity: "ERROR", file, message: "A nota de transparência deve estar posicionada após as Referências Bibliográficas." });
    }
    if (!professionalReviewMarker) {
        findings.push({ code: "GOV-012", severity: "ERROR", file, message: "HTML público novo sem declaração de revisão obrigatória por profissional de enfermagem habilitado e em atividade." });
    }
}

function writeBaseline() {
    const files = listHtmlFiles(ROOT).map(relative).sort();
    const baselinePath = path.join(ROOT, config.baseline_path || "governance/public-html-baseline.json");
    fs.writeFileSync(baselinePath, JSON.stringify({
        contract_id: config.contract_id,
        created_at: new Date().toISOString(),
        purpose: "Linha de base dos HTMLs públicos existentes antes do enforcement para novas páginas.",
        paths: files
    }, null, 2) + "\n");
    console.log(JSON.stringify({ baseline: relative(baselinePath), public_html: files.length }, null, 2));
}

function main() {
    if (process.argv.includes("--write-baseline")) return writeBaseline();
    const runtime = loadRuntimeStatus();
    const evidenceCatalog = loadEvidenceCatalog();
    const baseline = loadBaseline();
    const registered = new Map((config.registered_content || []).map(item => [item.path, item]));
    const pattern = new RegExp(config.high_risk_detection.content_pattern, "i");
    const findings = [];
    const candidates = [];

    for (const filePath of listHtmlFiles(ROOT)) {
        const file = relative(filePath);
        const body = fs.readFileSync(filePath, "utf8");
        const isNew = isNewPublicHtml(file, baseline);
        if (isNew) validateNewHtml(file, body, findings);
        if (!isHighRiskCandidate(filePath, body, pattern)) continue;

        candidates.push(file);
        const record = registered.get(file);
        if (!record) {
            findings.push({
                code: "GOV-001", severity: isNew ? "ERROR" : "WARNING",
                file,
                message: "Página com possível conteúdo de alto risco sem registro no catálogo de governança."
            });
            continue;
        }
        if (record.risk_level !== "HIGH") {
            findings.push({
                code: "GOV-002",
                severity: "ERROR",
                file,
                message: "Página detectada como alto risco, mas registrada com classificação incompatível."
            });
        }
        if (!record.official_source_url) {
            findings.push({
                code: "GOV-003", severity: isNew ? "ERROR" : "WARNING",
                file,
                message: "Conteúdo de alto risco sem URL de fonte oficial registrada."
            });
        }
        if (!record.evidence_id || (!evidenceCatalog.runtimeIds.has(record.evidence_id) && !evidenceCatalog.approvedLocalIds.has(record.evidence_id))) {
            findings.push({
                code: "GOV-013", severity: isNew ? "ERROR" : "WARNING",
                file,
                message: "Conteúdo de alto risco sem evidence_id resolvível em fonte do CKO ou documento local aprovado."
            });
        }
    }

    for (const record of registered.values()) {
        if (!fs.existsSync(path.join(ROOT, record.path))) {
            findings.push({ code: "GOV-004", severity: "ERROR", file: record.path, message: "Registro aponta para uma página inexistente." });
        }
    }

    const report = {
        contract_id: config.contract_id,
        mode: config.mode,
        checked_at: new Date().toISOString(),
        runtime,
        document_library: {
            configured: Boolean(config.document_library),
            approved_local_documents: evidenceCatalog.approvedLocalIds.size,
            active_professional_reviewers: evidenceCatalog.activeReviewers,
            pending_local_documents: evidenceCatalog.pendingLocalDocuments
        },
        summary: {
            html_checked: listHtmlFiles(ROOT).length,
            new_public_html: listHtmlFiles(ROOT).map(relative).filter(file => isNewPublicHtml(file, baseline)).length,
            high_risk_candidates: candidates.length,
            registered_content: registered.size,
            errors: findings.filter(item => item.severity === "ERROR").length,
            warnings: findings.filter(item => item.severity === "WARNING").length
        },
        candidates,
        findings
    };

    console.log(JSON.stringify(report, null, 2));
    process.exitCode = report.summary.errors > 0 ? 1 : 0;
}

main();
