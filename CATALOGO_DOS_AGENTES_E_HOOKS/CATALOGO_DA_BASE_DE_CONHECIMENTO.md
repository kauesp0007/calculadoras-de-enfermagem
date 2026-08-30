# 🧠 Catálogo da Base de Conhecimento

**Local:** `/knowledge/*.json` (auto-gerada por `scripts/build-knowledge-index.js`; índice + relacionamento, NÃO fonte primária).

| Arquivo | Conteúdo |
|---|---|
| `pages.json` | Metadados por página (file, title, h1, h2, meta, keywords, tipo, links, images, references, legislation, didactic_components) |
| `relationships.json` | `relations`, `backlinks`, `orphans`, `in_count` |
| `images.json` | Inventário de imagens (file, alt, category, pages, duplicated) |
| `references.json` | Referências catalogadas |
| `legislation.json` | Legislações e páginas que as usam |
| `scales.json` / `calculators.json` | Escalas / calculadoras catalogadas |
| `taxonomy.json` / `aliases.json` | Taxonomia derivada + siglas/sinônimos |
| `didactic-assets.json` | Componentes didáticos (quiz, tabela, fluxograma, timeline, cards, accordion, lightbox) |
| `.hashes.json` | Cache SHA-1 (indexação incremental) |
| `reports/index-report.json` | Cobertura, órfãs, links quebrados, duplicações |

## Grafo de conhecimento (FASE 33) — tipos formais de relação
`related_to` · `synonym_of` · `part_of` · `depends_on` · `references` · `uses` · `illustrated_by` · `translated_to` · `derived_from` · `supersedes` · `superseded_by`.
> O `relationships.json` atual usa `cross_reference`, `related_topic`, `legislation_relation`. A evolução prevista é alinhar/estender com os tipos formais acima, mantendo o campo `confidence` (high/medium/low).

## Versionamento do conhecimento (FASE 34)
Toda informação crítica deve ter: data de criação, data de atualização, origem, fonte, status, versão.
Status normativos: `VIGENTE` · `REVOGADA` · `ALTERADA` · `SUBSTITUÍDA` · `EM REVISÃO` · `NÃO CONFIRMADA`.

## Multilinguismo (FASE 31)
A base é construída a partir dos HTMLs da **raiz**; traduções são representações do mesmo conteúdo (não conceitos novos). Não criar 18 cópias de conhecimento.
