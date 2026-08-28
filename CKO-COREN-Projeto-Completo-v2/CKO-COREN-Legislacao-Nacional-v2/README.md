# CKO — Legislação dos CORENs — Nacional v2

Runtime regulatório governado para os 27 Conselhos Regionais de Enfermagem.

## Status desta versão

| Dimensão | Resultado |
|---|---|
| Estrutural (rotas, links, DTO, gate) | PASS |
| SEO / Schema.org | PASS |
| Acessibilidade (estática + axe-core) | PASS · navegador real PENDENTE |
| Privacidade (contrato de estado local) | PASS · LGPD do shell global PENDENTE |
| PDF (PDF/UA-1) | PASS |
| Evidência / IPE / ALCOA++ / CAAT de fonte | FAIL — snapshot oficial não adquirido |
| Asseguração | **LIMITED** |
| **Release** | **RELEASE_PARTIAL_METADATA_ONLY** |

Publicável hoje: superfícies de metadados e resumo, sempre com rótulo epistêmico e link para a
fonte oficial. Bloqueadas: todas as superfícies que afirmariam conteúdo normativo (checklist,
quiz, simulado, flashcards, glossário, mapa mental, caso aplicado, questões comentadas, podcast,
vídeo, artigo editorial, PDF longform e PDF de simulação).

O release completo depende de um único passo, e ele é deliberadamente manual:

```bash
node monitoring/regulatory-monitor.mjs --acquire --root=.
```

Sem snapshot oficial adquirido e com hash registrado, o gate permanece fechado por contrato.

## Arquitetura

```
Source → Canonical → Engine → Validator → Projection → Renderer → Output → Monitor
```

- `canonical/acts/` — um objeto `COREN_REGULATORY_ACT@2.0.0` por ato
- `engines/` — temporal, relation, regulatory, projection, seo-schema, media-projection
- `validators/` — schema, source-evidence, ipe, caat, temporal-status, relation, alcoa, projection, pdf
- `assurance/` — assurance-engine e release-gate (fail-closed)
- `renderers/` — page, resource, social, pdf (puros: só consomem `ValidatedProjectionDTO`)
- `monitoring/` — ciclo circular monitor → changeset → invalidate → revalidate → rerender
- `registry/` — conselhos, tipos de ato, rotas, projeções, versões, schema canônico
- `evidence/` — schemas de evidence source/fragment, IPE, CAAT, ALCOA++ e os registros atuais

## Build

```bash
node tools/build-templates.mjs   # 26 templates a partir do catálogo de projeções
node tools/build.mjs             # rotas, DTOs, páginas, artefatos, CAATs, assurance, release
python3 tools/build-pdf.py       # PDF/UA-1 + pdf-validator
python3 tools/build-social.py    # media engine determinístico + lineage
node tools/build.mjs             # 2ª passada: incorpora os gates de PDF e mídia
```

Ou `bash tools/build-all.sh`, que também executa a regressão de gates e a auditoria de
acessibilidade.

## Testes e auditoria

```bash
npm install          # axe-core e jsdom (apenas para auditoria)
npm test             # 11 casos de regressão fail-closed
npm run audit:a11y   # axe-core sobre o DOM entregue
node tools/validate-artifacts.mjs                 # instâncias vs. schemas
node tools/audit-shell-privacy.mjs --dir=/site    # LGPD do shell global (R-003)
```

A regressão usa fixtures sintéticas em `tests/fixtures/` (emissor fictício `Coren-ZZ`), que
vivem fora de `canonical/acts/` e por isso nunca entram no corpus publicado. Cada caso afirma
uma **recusa** esperada: nível de conteúdo insuficiente, dispositivo sem fragmento, hash ausente,
força vinculante sem evidência, vazamento de campo fora da whitelist.

## Regras duras

1. Nenhum número, ano ou estado de norma entra em produção a partir de memória.
2. Nenhuma vigência, revogação, força normativa ou dispositivo é inferido.
3. Nenhum hash de fonte é escrito sem aquisição real.
4. Nenhum gate compensa outro; não existe `overall: PASS`.
5. Superfície sem evidência é bloqueada, nunca preenchida.

## Cobertura

27 hubs regionais · 243 índices por tipo · 2 atos canonizados · 1 ato retirado do corpus
(`data/retired-acts.json`) · 34 superfícies de projeção por ato · 273 páginas publicadas ·
aquisição exaustiva dos atos regionais: PENDENTE.
