# Microtask 04 — PubMed/MEDLINE metadata validation

Version: 1.7.4  
Date: 2026-10-03

## Scope
Harden PubMed as a bibliographic metadata/discovery adapter only.

## Implemented
- ESearch by canonical topic.
- Global PMID consolidation before metadata retrieval.
- Batched EFetch XML retrieval.
- PMID, PMCID, DOI and PII extraction.
- Journal, publication date, languages and author metadata.
- MeSH descriptors and major-topic markers.
- Publication Types and deterministic study-design classification.
- Retraction/expression-of-concern/erratum/republication integrity flags.
- Cross-source deduplication against PMC and Europe PMC registries.
- Canonical key precedence: PMCID > DOI > PMID.
- PMCID handoff to the PMC/Europe PMC rights-governed pipelines.

## Rights boundary
PubMed is `METADATA_ONLY`.
- Abstract body is never stored (`has_abstract` Boolean only).
- Full text is never fetched from PubMed.
- PubMed metadata never establishes reuse rights.
- A PMCID only authorizes a handoff to a separate rights-verification pipeline.

## Tests
- parser fixture: PASS
- PMID/PMCID/DOI extraction: PASS
- Publication Type classification: PASS
- MeSH/major MeSH extraction: PASS
- abstract non-ingestion: PASS
- retraction blocking: PASS
- PubMed dry-run: PASS
- foundation validator: PASS (0 errors / 0 warnings)

## Isolated Windows execution
```bat
set NCBI_EMAIL=you@example.com
run-pubmed-safe.cmd
```

Optional NCBI API key:
```bat
set NCBI_API_KEY=<key>
```
