# CKO COREN — Arquivos para Melhoria — Consolidado v2

**Release atual:** `RELEASE_PARTIAL_METADATA_ONLY` · asseguração `LIMITED`

Situação de cada item do backlog v1, mais as pendências que permanecem abertas.

## Resumo

- **PENDENTE:** 2 item(ns)
- **PENDENTE_INSTRUMENTADO:** 1 item(ns)
- **PENDENTE_REDUZIDO:** 1 item(ns)
- **RESOLVIDO:** 55 item(ns)
- **RESOLVIDO_COM_RESSALVA:** 4 item(ns)
- **RESOLVIDO_PARCIAL:** 2 item(ns)

## Itens

- **E-001 · P0 · `assets/js/coren-regulatory-renderer.js` — RESOLVIDO**
  Reduzido a hidratação (v2.0.0): lê o DTO embutido e liga interações. Estado temporal, relações, aplicabilidade e elegibilidade migraram para engines/validators.
- **E-002 · P0 · `assets/js/cko-production-shell-loader.js` — RESOLVIDO_COM_RESSALVA**
  Loader v2 com timeout, health check, fallback acessível e evento cko:shell-health. Teste contra os módulos reais de produção continua fora deste pacote.
- **E-003 · P0 · `legislacao/coren/*/*/<ato>.html` — RESOLVIDO**
  Paths por Route/Asset Resolver; SEO e conteúdo essencial pré-renderizados. CAAT-LINK-001 sem exceções.
- **E-004 · P0 · `templates/resources/*.html (14)` — RESOLVIDO**
  Templates gerados do catálogo, sem token de URL, com renderer declarado. 4 famílias elegíveis materializadas; 10 bloqueadas por evidência, com razão registrada.
- **E-005 · P0 · `templates/social/*.html (7)` — RESOLVIDO**
  Media engine determinístico com input_hash, output_hash e versões; 20 peças geradas.
- **E-006 · P0 · `templates/pdf/*.html (5)` — RESOLVIDO_PARCIAL**
  PDF Projection DTO → renderer → PDF/UA-1 → validator, com todos os PDFs elegíveis aprovados. longform, flashcards e simulation seguem bloqueados por dependerem de texto integral.
- **E-007 · P0 · `validation-report.json` — RESOLVIDO**
  overall abolido; gates STRUCTURAL/CONTENT/EVIDENCE/IPE/CAAT/ALCOA/A11Y/PRIVACY/SEO/PDF/ASSURANCE/RELEASE reportados em separado.
- **E-008 · P1 · `registry/coren-regulatory-act.canonical.schema.json` — RESOLVIDO**
  Schema 2.0.0 com enums, nested schemas, additionalProperties=false, version_envelope, legal_status_basis, force_declared e evidence_fragment_ref obrigatório em dispositivo.
- **E-009 · P1 · `data/acts.catalog.json` — RESOLVIDO**
  Catálogo v2 com route, canonical_url, projection_ids, content_level e status. Cards apontam para rotas determinísticas; nenhum href=# remanescente.
- **E-010 · P1 · `data/acquisition-queue.json` — RESOLVIDO**
  Ciclo circular declarado com idempotência por (source_id, sha256), retry/backoff e cadência; executor é monitoring/regulatory-monitor.mjs.
- **E-011 · P1 · `contracts/system-contract.json` — RESOLVIDO**
  14 camadas com IDs, versões, contratos de entrada/saída, dependências e gate associado.
- **E-012 · P1 · `contracts/schema-jsonld.template.json` — RESOLVIDO**
  JSON-LD gerado em build-time por rota e validado por CAAT-SEO-001 em 274/274 páginas. Article e LearningResource removidos por afirmarem conteúdo que o gate bloqueia.
- **E-013 · P1 · `assets/css/coren-regulatory-production.css` — RESOLVIDO_COM_RESSALVA**
  CSS 2.0.0 com :focus-visible, alvo mínimo 24px, forced-colors e reduced-motion. Validação WCAG em navegador real permanece pendente.
- **E-014 · P1 · `legislacao/coren/index.html` — RESOLVIDO**
  SEO completo e conteúdo pré-renderizado; JS só para filtros e enriquecimento.
- **E-015 · P1 · `legislacao/coren/<uf>/index.html (27)` — RESOLVIDO**
  27 hubs pré-renderizados com SEO, JSON-LD, rótulos de acessibilidade e link de privacidade.
- **E-016 · P1 · `legislacao/coren/<uf>/<tipo>/index.html (243)` — RESOLVIDO**
  243 índices pré-renderizados; busca com label programático e contador em região live.
- **E-017 · P1 · `canonical/acts/*.json` — RESOLVIDO_PARCIAL**
  Envelope de versão, refs de evidência, IPE e ALCOA++ adicionados. Snapshot, fragmentos e CAAT de fonte seguem ausentes — por decisão, não por esquecimento: nenhum hash foi fabricado.
- **E-018 · P1 · `generated/pdfs/*.pdf` — RESOLVIDO**
  PDF/UA-1 com StructTreeRoot, /Lang, XMP e bookmarks; hash de saída no lineage.
- **E-019 · P1 · `generated/social/*.png` — RESOLVIDO**
  42 peças regeneradas com engine/model/template versions, input_hash e output_hash.
- **E-020 · P1 · `manifest.sha256.json` — RESOLVIDO**
  Manifesto de 458 arquivos mais índice de lineage de 44 artefatos, com 0 artefatos descobertos.
- **E-021 · P2 · `README.md` — RESOLVIDO**
  README v2 declara release parcial, gates, comando de aquisição e ordem de fechamento.
- **N-001 · P0 · `regulatory-engine` — RESOLVIDO**
  engines/regulatory-engine.mjs presente e executável
- **N-002 · P0 · `temporal-engine` — RESOLVIDO**
  engines/temporal-engine.mjs presente e executável
- **N-003 · P0 · `relation-engine` — RESOLVIDO**
  engines/relation-engine.mjs presente e executável
- **N-004 · P0 · `projection-engine` — RESOLVIDO**
  engines/projection-engine.mjs presente e executável
- **N-005 · P0 · `schema-validator` — RESOLVIDO**
  validators/schema-validator.mjs presente e executável
- **N-006 · P0 · `source-evidence-validator` — RESOLVIDO**
  validators/source-evidence-validator.mjs presente e executável
- **N-007 · P0 · `ipe-validator` — RESOLVIDO**
  validators/ipe-validator.mjs presente e executável
- **N-008 · P0 · `caat-validator` — RESOLVIDO**
  validators/caat-validator.mjs presente e executável
- **N-009 · P0 · `temporal-status-validator` — RESOLVIDO**
  validators/temporal-status-validator.mjs presente e executável
- **N-010 · P0 · `relation-validator` — RESOLVIDO**
  validators/relation-validator.mjs presente e executável
- **N-011 · P0 · `alcoa-validator` — RESOLVIDO**
  validators/alcoa-validator.mjs presente e executável
- **N-012 · P0 · `projection-validator` — RESOLVIDO**
  validators/projection-validator.mjs presente e executável
- **N-013 · P0 · `assurance-engine` — RESOLVIDO**
  assurance/assurance-engine.mjs presente e executável
- **N-014 · P0 · `release-gate` — RESOLVIDO**
  assurance/release-gate.mjs presente e executável
- **N-015 · P0 · `routes.registry` — RESOLVIDO**
  registry/routes.registry.json presente e executável
- **N-016 · P0 · `projections.registry` — RESOLVIDO**
  registry/projections.registry.json presente e executável
- **N-017 · P0 · `versions.registry` — RESOLVIDO**
  registry/versions.registry.json presente e executável
- **N-018 · P1 · `evidence-source.schema` — RESOLVIDO**
  evidence/schemas/evidence-source.schema.json presente e executável
- **N-019 · P1 · `evidence-fragment.schema` — RESOLVIDO**
  evidence/schemas/evidence-fragment.schema.json presente e executável
- **N-020 · P1 · `ipe.schema` — RESOLVIDO**
  evidence/schemas/ipe.schema.json presente e executável
- **N-021 · P1 · `caat-execution.schema` — RESOLVIDO**
  evidence/schemas/caat-execution.schema.json presente e executável
- **N-022 · P1 · `alcoa-assessment.schema` — RESOLVIDO**
  evidence/schemas/alcoa-assessment.schema.json presente e executável
- **N-023 · P1 · `resource-renderer` — RESOLVIDO**
  renderers/resource-renderer.mjs presente e executável
- **N-024 · P1 · `social-renderer` — RESOLVIDO**
  renderers/social-renderer.mjs presente e executável
- **N-025 · P1 · `media-projection-engine` — RESOLVIDO**
  engines/media-projection-engine.mjs presente e executável
- **N-026 · P1 · `pdf-renderer` — RESOLVIDO**
  renderers/pdf-renderer.mjs presente e executável
- **N-027 · P1 · `pdf-validator` — RESOLVIDO**
  tools/build-pdf.py presente e executável
- **N-028 · P1 · `seo-schema-engine` — RESOLVIDO**
  engines/seo-schema-engine.mjs presente e executável
- **N-029 · P1 · `regulatory-monitor` — RESOLVIDO**
  monitoring/regulatory-monitor.mjs presente e executável
- **N-030 · P1 · `user-state-privacy.contract` — RESOLVIDO**
  contracts/user-state-privacy.contract.json presente e executável
- **N-031 · P1 · `projection-lineage.schema` — RESOLVIDO**
  contracts/projection-lineage.schema.json presente e executável
- **T-001 · P1 · `tests/gate-regression.test.mjs + tests/fixtures/` — RESOLVIDO**
  11 casos de regressão fail-closed sobre fixtures sintéticas (Coren-ZZ), fora do corpus publicado. Sensibilidade verificada por controle negativo: sabotar a whitelist do projection-validator faz REG-009 falhar. Executado como CAAT-REG-001.
- **T-002 · P1 · `tools/audit-a11y.mjs` — RESOLVIDO_COM_RESSALVA**
  Auditoria axe-core 4.13 sobre o DOM entregue, WCAG 2.0/2.1/2.2 A e AA. Regras de layout desabilitadas explicitamente e listadas em rules_not_evaluated — o relatório não alega cobertura que não tem.
- **T-003 · P2 · `package.json` — RESOLVIDO**
  Dependências de auditoria declaradas e scripts npm (build, test, audit:a11y, acquire).
- **T-004 · P2 · `data/retired-acts.json` — RESOLVIDO**
  Registro de retirada do Parecer 28/2024/Coren-DF, com motivo, efeito e condição de readmissão.
- **T-005 · P0 · `tools/validate-artifacts.mjs` — RESOLVIDO**
  Os schemas de evidência, IPE, ALCOA++, CAAT e lineage existiam sem nada validar as instâncias. O validador expôs 68 violações reais nos lineages emitidos pelos executores Python (canonical_sha256 ausente, campos fora do contrato); corrigidas. Hoje 62/62 instâncias conformam. Executado como CAAT-ARTV-001.
- **T-006 · P0 · `CAAT-LINK-002 (absolute-reference-integrity)` — RESOLVIDO**
  O CAAT de links ignorava referências iniciadas por '/', e por isso um og:image apontando para /og/legislacao-coren.png — arquivo inexistente — passou em 271 páginas. Novo CAAT cobre og:image, canonical e twitter:image contra uma allowlist explícita do shell externo. Sensibilidade verificada por controle negativo.
- **T-007 · P1 · `generated/social/index-*-og.png` — RESOLVIDO**
  28 cartões OG de índice (nacional + 27 regionais) gerados pelo mesmo engine determinístico, com input_hash e output_hash, substituindo a referência quebrada.
- **T-008 · P1 · `generated/sitemap-legislacao-coren.xml` — RESOLVIDO**
  Sitemap das rotas do escopo liberado, derivado de routes.registry.json. Artefatos noindex ficam fora por contrato.
- **T-009 · P1 · `tools/audit-shell-privacy.mjs` — RESOLVIDO_COM_RESSALVA**
  Instrumento de auditoria LGPD do shell global entregue e verificado contra um shell sintético (detecta cookie, envio externo e storage fora do prefixo). Não fecha R-003: os arquivos reais estão fora do pacote.
- **R-001 · P0 · `Aquisição dos snapshots oficiais` — PENDENTE**
  3 evidence sources em PENDING_ACQUISITION. Sem rede até os hosts oficiais neste ambiente. Destrava EVIDENCE, IPE, ALCOA++, CAAT de fonte e RELEASE_FULL.
- **R-002 · P1 · `Auditoria WCAG 2.2 AA em navegador real` — PENDENTE_REDUZIDO**
  Escopo reduzido: CAAT-A11Y-001 (estático, 273/273) e CAAT-A11Y-002 (axe-core sobre jsdom, 16 páginas amostradas, 0 violações). Continuam fora do alcance automatizado as regras que exigem layout — contraste, tamanho de alvo, reflow — além de leitor de tela, teclado e zoom 400%.
- **R-003 · P1 · `Auditoria LGPD do shell global de produção` — PENDENTE_INSTRUMENTADO**
  Contrato de estado local aplicado e verificado no módulo. O instrumento de varredura existe (tools/audit-shell-privacy.mjs, 6 regras, laudo em formato de gate); falta rodá-lo contra os arquivos reais e submeter o laudo ao responsável pelo tratamento.
- **R-004 · P1 · `Descoberta exaustiva dos 27 CORENs` — PENDENTE**
  2 ato(s) canonizado(s) em 27 jurisdições. Fila v2 pronta para execução.

## Ordem de fechamento restante

1. Adquirir e hashar os snapshots oficiais (`--acquire`) — destrava 4 gates e 49 superfícies.
2. Auditoria WCAG 2.2 AA em navegador real com tecnologia assistiva.
3. Auditoria LGPD do shell global de produção.
4. Descoberta e aquisição exaustiva dos atos dos 27 CORENs.
5. Reexecutar `tools/build-all.sh` e reavaliar o release gate.
