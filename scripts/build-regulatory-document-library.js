"use strict";

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const config = JSON.parse(fs.readFileSync(path.join(ROOT, "governance", "content-governance.config.json"), "utf8"));
const libraryPath = path.join(ROOT, config.document_library.catalog_path);
const docsPath = path.join(ROOT, config.document_library.source_directory);
const runtimeEvidencePath = path.join(ROOT, config.canonical_runtime.root, config.canonical_runtime.evidence_sources);

function sha256(filePath) {
    return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

function documentId(sourcePath, digest) {
    return `DOC-${crypto.createHash("sha256").update(`${sourcePath}:${digest}`).digest("hex").slice(0, 12).toUpperCase()}`;
}

function classify(fileName) {
    const normalized = fileName.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ");
    if (normalized.includes("parecer")) return "OPINION";
    if (normalized.includes("lei")) return "LEGISLATION";
    if (normalized.includes("resolucao") || normalized.includes("portaria") || normalized.includes("decreto")) return "REGULATION";
    if (normalized.includes("manual") || normalized.includes("diretriz") || normalized.includes("cartilha")
        || normalized.includes("calendario nacional") || normalized.includes("american heart association")) return "GUIDELINE";
    if (normalized.includes("universidade") || normalized.includes("et al") || normalized.includes("artigo")
        || normalized.includes("calculo da idade gestacional") || normalized.includes("teorias de enfermagem")) return "SCIENTIFIC_ARTICLE";
    return "OTHER";
}

function authority(fileName) {
    const normalized = fileName.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    if (/(presidencia|ministerio|conselho federal|cofen|anvisa|camara dos deputados)/.test(normalized)) return "OFFICIAL";
    if (/(universidade|faculdade)/.test(normalized)) return "ACADEMIC";
    if (/(american heart association|et al)/.test(normalized)) return "SCIENTIFIC";
    return "UNKNOWN";
}

function listPdfFiles(directory, files = []) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        const fullPath = path.join(directory, entry.name);
        if (entry.isDirectory()) listPdfFiles(fullPath, files);
        else if (entry.isFile() && entry.name.toLowerCase().endsWith(".pdf")) files.push(fullPath);
    }
    return files;
}

const library = JSON.parse(fs.readFileSync(libraryPath, "utf8"));
const existingByPath = new Map((library.documents || []).map(document => [document.source_path, document]));
const runtimeEvidenceByStoragePath = fs.existsSync(runtimeEvidencePath)
    ? new Map((JSON.parse(fs.readFileSync(runtimeEvidencePath, "utf8")).sources || [])
        .filter(source => source.storage_ref)
        .map(source => [source.storage_ref.replace(/\\/g, "/"), source]))
    : new Map();
const documents = listPdfFiles(docsPath).map(filePath => {
    const sourcePath = path.relative(ROOT, filePath).split(path.sep).join("/");
    const existing = existingByPath.get(sourcePath) || {};
    const runtimeEvidence = runtimeEvidenceByStoragePath.get(sourcePath);
    const digest = sha256(filePath);
    return {
        document_id: documentId(sourcePath, digest),
        source_path: sourcePath,
        file_name: path.basename(filePath),
        sha256: digest,
        document_type: !existing.document_type || existing.document_type === "OTHER"
            ? classify(path.basename(filePath))
            : existing.document_type,
        source_authority: existing.source_authority || (runtimeEvidence ? "OFFICIAL" : authority(path.basename(filePath))),
        official_source_url: existing.official_source_url || runtimeEvidence?.url || null,
        canonical_id: existing.canonical_id || runtimeEvidence?.canonical_id || null,
        review_status: existing.review_status || "PENDING_EDITORIAL_REVIEW",
        reviewed_at: existing.reviewed_at || null,
        professional_review_ref: existing.professional_review_ref || null,
        notes: existing.notes || "Inventariado automaticamente; requer classificação e revisão editorial antes de uso como evidência."
    };
}).sort((left, right) => left.source_path.localeCompare(right.source_path));

fs.writeFileSync(libraryPath, JSON.stringify({
    ...library,
    generated_at: new Date().toISOString(),
    documents
}, null, 2) + "\n");

console.log(JSON.stringify({ library: config.document_library.catalog_path, documents: documents.length, pending: documents.filter(document => document.review_status !== "APPROVED").length }, null, 2));