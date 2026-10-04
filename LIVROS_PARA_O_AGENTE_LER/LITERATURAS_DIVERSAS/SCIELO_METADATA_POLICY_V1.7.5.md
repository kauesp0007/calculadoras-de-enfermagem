# SciELO metadata policy v1.7.5

1. SciELO ArticleMeta is the canonical discovery source for this adapter.
2. Initial scale acquisition uses the official monthly ArticleMeta batch dump.
3. Metadata is stored under the SciELO CC0 metadata policy.
4. Abstract text and article full text are not persisted in this phase.
5. CC BY has been SciELO's standard OA article license since 2015, but older articles may retain prior licenses; therefore article-content rights are resolved item by item.
6. Explicit CC BY/CC0 metadata creates only a *candidate* content-rights state. Full-text ingestion still requires XML-level verification in its own gate.
7. CC BY-NC, CC BY-ND, CC BY-SA and ambiguous/missing declarations do not enter the default commercial/generative full-text corpus.
8. DOI/PMID/PMCID deduplication is mandatory against PMC, Europe PMC and PubMed.
