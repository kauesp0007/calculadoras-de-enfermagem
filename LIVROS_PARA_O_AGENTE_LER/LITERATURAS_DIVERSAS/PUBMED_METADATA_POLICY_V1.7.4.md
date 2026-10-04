# PubMed/MEDLINE metadata policy — v1.7.4

## Role
PubMed/MEDLINE is a **discovery and bibliographic metadata layer**, not a full-text corpus and not a license oracle.

## Stored
- PMID, PMCID (when present), DOI, PII
- article title and journal metadata
- publication date
- publication types
- MeSH descriptors and major-topic markers
- language and author metadata
- MEDLINE indexing status
- integrity/correction/retraction signals
- topic-to-PMID relationships

## Explicitly not stored from PubMed
- abstract text
- full-text article body
- tables, figures or supplementary files
- inferred license or reuse permission

`has_abstract` may be stored only as a Boolean discovery signal.

## Full-text handoff
If a PubMed record has a PMCID, it may be handed to the PMC or Europe PMC pipelines. Their item-level rights gates remain mandatory. A PMCID discovered in PubMed does not itself authorize reuse.

## Integrity
Records marked as retracted, retraction notices, or linked to retraction/expression-of-concern metadata are flagged before evidence review. Metadata discovery does not equal clinical evidence approval.

## API behavior
Use NCBI E-Utilities with `tool` and `email` and respect request-rate guidance. ESearch is used for topic discovery; unique PMIDs are consolidated and retrieved through batched EFetch XML.
