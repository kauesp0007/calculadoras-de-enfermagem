# Microtask 03 — Europe PMC OA validation

Status: **PASS**

## Scope
- Europe PMC REST search only.
- Open Access subset required.
- Commercial/generative default profile limited to CC BY and CC0.
- Unique article identity by PMCID.
- Topic/article links stored separately.
- Cross-source PMCID deduplication against PMC retrieval.
- Item-level license verification from the Europe PMC full-text XML license element.
- Full text is persisted only after CC BY/CC0 verification.
- Non-matching, absent, custom or ambiguous licenses remain fail-closed.
- Accepted XML remains under `PENDING_RETRACTION_AND_EVIDENCE_REVIEW` before evidence promotion.

## Tests
- Search guard adds `OPEN_ACCESS:y`.
- Search guard enforces CC BY/CC0 when missing.
- CC BY recognition: PASS.
- CC0 recognition: PASS.
- CC BY-NC blocking: PASS.
- Unknown/custom-rights blocking: PASS.
- XML `<license>` parsing: PASS.
- Foundation referential-integrity validator: PASS.

## Execution
```bat
run-europepmc-safe.cmd
```

This microtask does not enable SciELO or BVS/LILACS.
