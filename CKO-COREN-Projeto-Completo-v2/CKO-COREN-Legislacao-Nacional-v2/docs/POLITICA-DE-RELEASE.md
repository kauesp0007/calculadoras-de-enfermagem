# Política de release — CKO COREN v2

## Por que não existe `overall: PASS`

Na v1 o pacote reportava `overall: PASS`. Aquilo era validação **estrutural** — contagem de
arquivos e sintaxe — mas podia ser lido como asseguração regulatória. A v2 proíbe esse campo:
o `validation-report.json` reporta cada dimensão separadamente e a decisão fica com o
`release-gate`.

## Níveis de asseguração

| Nível | Significado | Critérios |
|---|---|---|
| `NONE` | Nada além da existência do artefato pode ser afirmado | — |
| `LIMITED` | Cadeia interna verificada por CAAT determinístico | SCHEMA=PASS, CAATs estruturais executados, lineage completo por artefato |
| `REASONABLE` | Conteúdo regulatório verificável na fonte | EVIDENCE=PASS (snapshot adquirido + SHA-256), IPE=PASS, ALCOA++ integral, CAAT de reperformance contra a fonte |

## Decisões de release

- `RELEASE_FULL` — todos os gates aprovados e asseguração razoável.
- `RELEASE_PARTIAL_METADATA_ONLY` — estrutura, SEO e privacidade aprovados; publica apenas
  superfícies de metadados/resumo, com rótulo epistêmico obrigatório e link para a fonte.
- `HOLD` — qualquer falha estrutural, de SEO ou de privacidade.

## Elegibilidade por nível de conteúdo

Cada ato declara `epistemic.content_level`: `METADATA`, `SUMMARY` ou `FULL_TEXT_DEVICES`.
Cada superfície declara o nível mínimo que exige. A projeção só é gerada quando o nível do ato
alcança o da superfície **e** as superfícies que afirmam conteúdo normativo têm fragmento de
evidência resolvido.

Consequência prática nesta versão: os dois atos canonizados têm nível `SUMMARY` e liberam
metadados, resumo, guia de bolso, slides, infográfico, social e dois PDFs cada. Um ato de nível
`METADATA` liberaria apenas superfícies de metadados — e por isso não geraria PDF; isso seria o
gate funcionando, não uma lacuna.

Atos retirados do corpus ficam registrados em `data/retired-acts.json`, com motivo e condição de
readmissão. O pacote não apaga em silêncio algo que já esteve no catálogo.

## O que ainda bloqueia o release completo

1. Aquisição e hash dos snapshots oficiais (`--acquire`), que destrava EVIDENCE, IPE, ALCOA++ e
   o CAAT de reperformance.
2. Auditoria WCAG 2.2 AA em navegador real com tecnologia assistiva.
3. Auditoria LGPD do shell global de produção (`/global-scripts.js`), fora do escopo deste pacote.
4. Descoberta e aquisição exaustiva dos atos dos 27 CORENs.
