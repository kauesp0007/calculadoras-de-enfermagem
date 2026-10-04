# Microtask 02 — PMC Open Access / BioC hardening

Status: PASS
Date: 2026-10-03
Version: 1.7.2

## Scope

This microtask only hardened the PMC Open Access acquisition path. Europe PMC and other source families were not advanced.

## Changes

1. NCBI E-Utilities live calls now require a locally configured `NCBI_EMAIL`; `tool` is always sent and `NCBI_API_KEY` is optional.
2. PMC discovery remains restricted to `CC BY` or `CC0` and now explicitly excludes PMC embargoed records.
3. ESearch UIDs are resolved through ESummary into a unique article registry with PMCID/PMID/DOI metadata.
4. Topic-to-article links are stored separately, preventing duplicate full-text downloads when one article serves multiple topics.
5. Rights are verified item-by-item through PMC OAI-PMH `oai_dc` metadata before any BioC full-text retrieval.
6. The default active profile accepts only explicit CC BY or CC0. Other CC licenses, custom rights, missing rights, or ambiguous metadata fail closed.
7. BioC retrieval reads only the rights-approved registry. No direct discovery-to-download path remains.
8. Downloaded articles enter `PENDING_RETRACTION_AND_EVIDENCE_REVIEW`; rights approval does not imply evidence approval.
9. A local validator tests the rights classifier and OAI-PMH parser without network access.

## Official-service alignment

- PMC permits automated retrieval through its official services, including E-Utilities, OAI-PMH and BioC.
- PMC licenses vary article by article; the item license remains authoritative.
- OAI-PMH `oai_dc` provides machine-readable rights metadata.
- BioC exposes the PMC Open Access subset in machine-readable form.

## Local validation

- `python scripts/validate_pmc_adapter.py` → PASS
- `python scripts/discover_pmc.py --dry-run --limit-topics 3 --max-per-topic 5` → PASS
- No live download was performed during packaging.

## Required local configuration for live E-Utilities

Windows CMD:

```bat
set NCBI_EMAIL=your-real-email@example.com
```

Optional API key:

```bat
set NCBI_API_KEY=your_ncbi_api_key
```

## Remaining PMC-specific work

- Run a bounded live discovery/rights/fetch smoke test locally.
- Add downstream retraction/expression-of-concern verification before promotion to evidence-active status.
- Add article-level methodological evidence grading after atomization.
