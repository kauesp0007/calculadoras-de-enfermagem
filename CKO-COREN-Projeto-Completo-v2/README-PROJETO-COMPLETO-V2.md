# CKO COREN — Projeto Completo v2

Conclusão do módulo nacional de legislação dos CORENs e reauditoria 360 sobre o resultado.

## Estrutura

- `CKO-COREN-Legislacao-Nacional-v2/` — runtime regulatório completo
- `AUDITORIA-E-MELHORIAS-V2/` — auditoria 360 v2 + backlog consolidado v2
- `MANIFEST-SHA256.json` — hash de todos os arquivos desta entrega

## Veredito

**RELEASE_PARTIAL_METADATA_ONLY** · asseguração **LIMITED**

A v1 estava em `RELEASE_HOLD` por ausência de arquitetura: não havia engine separada,
validators, evidência, assurance nem release gate, e o SEO não existia. Isso foi construído.
O que continua bloqueando o release completo é uma coisa só, nomeada e endereçável: os
snapshots oficiais não foram adquiridos, então a cadeia probatória não fecha.

| Gate | Resultado |
|---|---|
| STRUCTURAL · SEO · A11Y · PRIVACY · PDF · CAAT estrutural | PASS |
| EVIDENCE · IPE · ALCOA++ · CAAT de fonte · ASSURANCE | FAIL |

Das 68 projeções, 40 estão liberadas (metadados e resumo, sempre com rótulo epistêmico e link
para a fonte) e 28 bloqueadas — todas as que afirmariam conteúdo normativo.

O corpus canônico tem 2 atos. O Parecer nº 28/2024/Coren-DF/Plen/CTAS foi retirado por decisão
editorial e a retirada está registrada em `data/retired-acts.json`, com motivo e condição de
readmissão — o pacote não apaga em silêncio algo que já esteve no catálogo.

## O que mudou

| Métrica | v1 | v2 |
|---|---|---|
| Referências locais quebradas | 61 | 0 |
| Token de URL canônica em template | 26/26 | 0/26 |
| meta description · canonical · OG · Twitter · JSON-LD · robots | 0/300 | 273/273 |
| Conteúdo pré-renderizado | 0/300 | 273/273 |
| PDFs tagged com título e autor | 0/3 | 4/4 (PDF/UA-1) |
| Engines / validators / renderers | 0 / 0 / 1 parcial | 6 / 9 / 4 |
| Rotas determinísticas | não existia | 273 |
| Artefatos com lineage | não existia | 44 (0 descobertos) |
| CAATs executados | 0 | 11 de 12 |
| Casos de regressão fail-closed | 0 | 11 (sensibilidade verificada) |

Backlog: 55 RESOLVIDO, 4 RESOLVIDO_COM_RESSALVA, 2 RESOLVIDO_PARCIAL, 1 PENDENTE_REDUZIDO,
1 PENDENTE_INSTRUMENTADO, 2 PENDENTE.

Dois defeitos reais foram encontrados e corrigidos nesta rodada: 68 violações de schema nos
lineages emitidos pelos executores Python, e um `og:image` apontando para arquivo inexistente em
271 páginas — que passava porque o CAAT de links ignorava referências iniciadas por `/`.

## Próximo passo

```bash
cd CKO-COREN-Legislacao-Nacional-v2
node monitoring/regulatory-monitor.mjs --acquire --root=.
bash tools/build-all.sh
```

Com os snapshots adquiridos e hashados, EVIDENCE, IPE, ALCOA++ e o CAAT de reperformance
destravam, e o release gate reavalia as 28 superfícies bloqueadas.

Também pendentes: WCAG 2.2 AA em navegador real (escopo já reduzido por axe-core), auditoria LGPD
do shell global de produção e descoberta exaustiva dos atos dos 27 CORENs.
