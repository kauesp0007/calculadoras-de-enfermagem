# Correções aplicadas na v2

## Achados P0 da auditoria 360 v1

| # | Achado v1 | Correção v2 | Verificação |
|---|---|---|---|
| F-001 | Páginas de ato com caminho relativo um nível acima | Route/Asset Resolver determinístico no build | CAAT-LINK-001: 1.709 referências, 0 quebradas |
| F-002 | 26 templates com caminho errado e token de URL canônica | Templates gerados do catálogo de projeções, sem token, com profundidade real | CAAT-LINK-001 + inspeção do diretório `templates/` |
| F-003 | Sem Projection Engine para as superfícies | `engines/projection-engine.mjs` + `ValidatedProjectionDTO` para 34 superfícies por ato | `registry/projections.registry.json` |
| F-004 | Regulatory Engine inexistente como módulo | `engines/regulatory-engine.mjs` orquestrando temporal, relação e gates | `generated/projections/*.dtos.json` |
| F-005 | Sem validators, assurance e release gate | 9 validators + assurance-engine + release-gate fail-closed | `assurance/assurance-object.json`, `assurance/release-decision.json` |
| F-006 | `overall: PASS` enganoso | Campo abolido; relatório segmentado por gate | `validation-report.json` |

## Correções técnicas adicionais

- **SEO**: 0/300 → 274/274 páginas com title, description, canonical, robots, OG, Twitter e JSON-LD.
- **Schema.org**: `Article` e `LearningResource` removidos do grafo. O pacote não possui conteúdo
  editorial autoral nem recursos de aprendizagem liberados por evidência; declará-los seria afirmar
  o que o gate bloqueia. Também não emitimos tipos descontinuados para rich results.
- **PDF**: de `Tagged=no` / `untitled` / `anonymous` para PDF/UA-1 com StructTreeRoot, `/Lang`,
  XMP completo e bookmarks derivados dos títulos.
- **Renderização**: conteúdo pré-renderizado no HTML; o JS do navegador virou hidratação
  (busca, favoritos, leitura em voz), sem buscar canônico em runtime.
- **Acessibilidade**: `:focus-visible` padronizado, alvo mínimo 24px (WCAG 2.2 AA 2.5.8),
  `forced-colors`, `prefers-reduced-motion`, rótulo programático na busca, região live no contador,
  breadcrumb como lista rotulada, `h1` único por página.
- **Privacidade**: contrato de estado local com finalidade, retenção de 180 dias, expurgo automático,
  botão de limpeza e ausência de cookies/rastreadores — verificado por CAAT.
- **Shell loader**: timeout, health check, fallback acessível e evento `cko:shell-health`.
- **Estado jurídico**: novo modo de exibição. Um estado declarado pela fonte mas sem fragmento de
  evidência aparece como *"declarado pela fonte, não verificado"* — não é apagado (o usuário
  continua vendo que o Parecer 28/2024 consta como revogado) nem afirmado como verificado.
