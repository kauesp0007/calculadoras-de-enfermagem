import crypto from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateAgainstSchema } from '../CKO-COREN-Projeto-Completo-v2/CKO-COREN-Legislacao-Nacional-v2/validators/schema-validator.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readJson = async relativePath => JSON.parse(await readFile(path.join(ROOT, relativePath), 'utf8'));
const config = await readJson('governance/content-governance.config.json');
const library = await readJson(config.document_library.catalog_path);
const schema = await readJson(config.document_library.schema_path);
const reviewers = await readJson(config.document_library.reviewer_registry_path);
const activeReviewers = new Set((reviewers.reviewers || [])
    .filter(reviewer => reviewer.status === 'ACTIVE' && reviewer.professional_verification === 'VERIFIED')
    .map(reviewer => reviewer.reviewer_ref));
const findings = [];
const documentIds = new Set();

for (const document of library.documents || []) {
    if (documentIds.has(document.document_id)) {
        findings.push({ code: 'DOC-006', severity: 'P0', subject: document.document_id, message: 'document_id duplicado no catálogo.' });
    }
    documentIds.add(document.document_id);
    for (const error of validateAgainstSchema(document, schema, document.document_id)) {
        findings.push({ code: 'DOC-001', severity: 'P0', subject: document.document_id, message: `${error.path}: ${error.message}` });
    }
    const filePath = path.join(ROOT, document.source_path);
    if (!existsSync(filePath)) {
        findings.push({ code: 'DOC-002', severity: 'P0', subject: document.document_id, message: 'Documento inventariado não existe em docs/.' });
        continue;
    }
    const digest = crypto.createHash('sha256').update(await readFile(filePath)).digest('hex');
    if (digest !== document.sha256) {
        findings.push({ code: 'DOC-003', severity: 'P0', subject: document.document_id, message: 'Hash divergente: reinventariar e repetir a revisão editorial.' });
    }
    if (document.review_status === 'APPROVED') {
        if (document.source_authority !== 'OFFICIAL' || !document.official_source_url) {
            findings.push({ code: 'DOC-004', severity: 'P0', subject: document.document_id, message: 'Documento aprovado sem fonte oficial registrada.' });
        }
        if (!document.professional_review_ref || !activeReviewers.has(document.professional_review_ref)) {
            findings.push({ code: 'DOC-005', severity: 'P0', subject: document.document_id, message: 'Documento aprovado sem revisor profissional ativo e verificado.' });
        }
    }
}

const report = {
    report_id: 'CKO-SITE-REGULATORY-DOCUMENT-AUDIT-v1',
    generated_at: new Date().toISOString(),
    documents: (library.documents || []).length,
    active_reviewers: activeReviewers.size,
    result: findings.some(finding => finding.severity === 'P0') ? 'FAIL' : 'PASS',
    findings
};
await writeFile(path.join(ROOT, 'governance/regulatory-document-audit.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ documents: report.documents, active_reviewers: report.active_reviewers, result: report.result, findings: report.findings.length }, null, 2));
process.exitCode = report.result === 'PASS' ? 0 : 1;