# Urgência e Emergência — Atomized Corpus v1.2.0 Rights-Governed

This package applies the v1.0.0 rights audit as an enforceable fail-closed retrieval layer over corpus v1.1.2.

## Default retrieval contract

- `GREEN` → `DEFAULT_ACTIVE`: full atom text may be retrieved by the default SQLite/FTS path.
- `GREEN_CONDITIONAL` and `YELLOW` → `CONDITIONAL_EXPLICIT_ENABLE`: no full text is included in the default corpus. Metadata references only.
- `ORANGE` → `HUMAN_REFERENCE_ONLY`: no protected atom text in this governed package.
- `RED` → `LICENSE_QUARANTINED`: no protected atom text in this governed package.

The original v1.1.2 local archive remains the evidence snapshot for lawful human review; it must not be used as the default generative/RAG index.

## Counts

- Sources: **84**
- Topics: **170**
- Original atom index: **80,261**
- Default-active sources: **21**
- Conditional sources: **22**
- Human/quarantined sources: **41**
- Full-text active atoms in governed package: **28,001**
- Default FTS unique usable atoms: **25,394**

### Topic rights pre-gate

- `RIGHTS_READY_ALL_REQUIRED_ACTIVE`: **0**
- `RIGHTS_READY_P0_WITH_SUPPORTING_GAPS`: **26**
- `NEEDS_OPEN_SUBSTITUTE_OR_RIGHTS_CLEARANCE`: **144**
- `P0_RIGHTS_CLEAR_BUT_NO_ACTIVE_CANDIDATES`: **0**

This is a rights/licensing compliance control, not a legal opinion. Clinical claim validation remains a separate downstream gate.
