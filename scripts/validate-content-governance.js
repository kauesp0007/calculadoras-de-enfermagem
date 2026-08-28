"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const configPath = path.join(ROOT, "governance", "content-governance.config.json");
const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
const ignoredDirectories = new Set([
    ".git",
    ".github",
    "backups-temporarios",
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
        if (entry.isFile() && entry.name.endsWith(".html")) files.push(path.join(directory, entry.name));
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

function isHighRiskCandidate(filePath, body, pattern) {
    const name = path.basename(filePath, ".html").toLocaleLowerCase("pt-BR");
    const filenameMatch = config.high_risk_detection.filename_terms.some(term => name.includes(term));
    return filenameMatch || pattern.test(body);
}

function main() {
    const runtime = loadRuntimeStatus();
    const registered = new Map((config.registered_content || []).map(item => [item.path, item]));
    const pattern = new RegExp(config.high_risk_detection.content_pattern, "i");
    const findings = [];
    const candidates = [];

    for (const filePath of listHtmlFiles(ROOT)) {
        const file = relative(filePath);
        const body = fs.readFileSync(filePath, "utf8");
        if (!isHighRiskCandidate(filePath, body, pattern)) continue;

        candidates.push(file);
        const record = registered.get(file);
        if (!record) {
            findings.push({
                code: "GOV-001",
                severity: config.mode === "ENFORCE" ? "ERROR" : "WARNING",
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
                code: "GOV-003",
                severity: config.mode === "ENFORCE" ? "ERROR" : "WARNING",
                file,
                message: "Conteúdo de alto risco sem URL de fonte oficial registrada."
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
        summary: {
            html_checked: listHtmlFiles(ROOT).length,
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
