# Microtarefa 05 — SciELO metadata discovery — v1.7.5

## Scope
Discovery and rights-preflight only. No article abstract or full text is persisted by this adapter.

## Official acquisition strategy
- Initial metadata acquisition: official SciELO ArticleMeta monthly batch dump (`articles.json.zip`).
- Large-scale initial harvest uses the batch dump instead of scraping the public search UI.
- Metadata is treated as CC0 according to current SciELO open-science policy.
- Article reuse rights remain item-level: explicit CC BY/CC0 can be marked as a candidate for later full-text ingestion; missing/restrictive/ambiguous licenses remain fail-closed.
- Full-text XML retrieval is deliberately deferred to a later microtask.

## Outputs when run locally
- `workspace/metadata/scielo_article_registry.{json,csv}`
- `workspace/metadata/scielo_topic_article_links.{json,csv}`
- `workspace/metadata/scielo_discovery_run.json`

## Deduplication
DOI, PMID and PMCID are compared with PubMed, PMC and Europe PMC registries. SciELO metadata does not create duplicate full-text copies.

## Guardrails
- no abstract persistence;
- no full-text persistence;
- no blanket inference that all historical SciELO articles are CC BY;
- explicit item license or later XML license verification is required for article-content ingestion.
