# Calculadoras de Enfermagem — Unified Corpus Foundation v1.7.5

This release moves the project from curriculum closure into executable rights-governed corpus acquisition.

## Canonical inventory
- Institutions: 15
- Investigated postgraduate/residency programs: 114
- Canonical curriculum sources: 97
- Curriculum items: 985
- Normalized/candidate curriculum topics: 182
- **Granular microtopics preserved from prior domain projects: 1055 (885 Worker Health + 170 Urgency/Emergency)**
- Existing U/E evidence atom index bundled as provenance input: 80,261
- Existing U/E active full-text atoms: 28,001
- Tools: 44
- Libraries: 33

## New in v1.7
- Bundled immutable legacy input packages with SHA-256 provenance.
- `knowledge/microtopic_registry.*` and `microtopic_parent_links.*`.
- `acquisition/topic_acquisition_profiles.*` to avoid blind scientific-search expansion.
- Official acquisition endpoint registry.
- Executable adapters for Open RN/NLM LitArch, PMC, Europe PMC and PubMed metadata.
- Fail-closed HOLD for SciELO and BVS/LILACS until supported official endpoints are configured.
- Windows `init-once.cmd`, `run-p0-safe.cmd`, and `run-p0-all-discovery.cmd`.

## Windows
```bat
cd <this-package>
init-once.cmd
run-p0-safe.cmd
```

See `docs/ACQUISITION_ENGINE_V1.7.md` and `acquisition/P0_EXECUTION_PLAN.csv`.


## Microtasks

### v1.7.1 — Microtask 01: Open RN P0
Open RN P0 validated: priority isolation, safe TAR extraction, post-download CC BY 4.0 fail-closed verification.

### v1.7.2 — Microtask 02: PMC OA / BioC
PMC acquisition hardened with E-Utilities contact configuration, unique article registry, topic↔PMCID deduplication, item-level OAI-PMH rights verification before BioC retrieval, explicit CC BY/CC0 active profile, and a separate integrity/evidence review gate.

For isolated PMC execution on Windows:
```bat
set NCBI_EMAIL=you@example.com
run-pmc-safe.cmd
```

### v1.7.3 — Microtask 03: Europe PMC OA
Europe PMC hardened to open-access CC BY/CC0 discovery, PMCID deduplication against PMC, item-level XML license verification, rights-verified staging, and fail-closed promotion to raw full text.

Isolated Windows execution:
```bat
run-europepmc-safe.cmd
```

### v1.7.5 — Microtask 04: PubMed/MEDLINE metadata
PubMed is a bibliographic discovery layer only. ESearch is followed by batched EFetch XML to capture identifiers, MeSH, publication types, dates, languages and integrity signals. Abstract text and full text are never ingested from PubMed. PMCID records are handed off to the PMC/Europe PMC rights pipeline.

Isolated Windows execution:
```bat
set NCBI_EMAIL=you@example.com
run-pubmed-safe.cmd
```


## Microtask 05 — SciELO
SciELO metadata discovery now uses the official ArticleMeta monthly dump, metadata-only persistence, item-level license preflight, and DOI/PMID/PMCID deduplication. Full-text XML ingestion remains deferred.
