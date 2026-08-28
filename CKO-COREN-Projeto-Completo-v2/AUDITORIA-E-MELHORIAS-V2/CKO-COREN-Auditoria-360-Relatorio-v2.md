# Auditoria 360 v2 — CKO COREN Legislação Nacional

**Pacote auditado:** `CKO-COREN-Legislacao-Nacional-v2`
**Substitui:** auditoria 360 v1 (veredito `RELEASE_HOLD`)
**Data:** 26/08/2026

## Veredito

**RELEASE_PARTIAL_METADATA_ONLY** · asseguração **LIMITED**

O pacote deixou de ser um shell estrutural e passou a ser um runtime regulatório governado:
pipeline em camadas separadas, gates fail-closed e lineage por artefato. O release completo
continua bloqueado, mas agora por um motivo único, nomeado e endereçável — a cadeia probatória
não foi adquirida — e não mais por ausência de arquitetura.

### Status por núcleo

| Núcleo | v1 | v2 |
|---|---|---|
| Structural shell | PASS | PASS |
| Design System | PASS/PARTIAL | PASS (WCAG 2.2 estático) |
| Regulatory Engine | FAIL — não separado | PASS — 6 engines |
| Validators | FAIL — não materializados | PASS — 9 validators |
| Evidence/IPE/CAAT/ALCOA++ | FAIL | PARCIAL — objetos e schemas existem; snapshot não adquirido |
| Assurance/Release Gate | FAIL | PASS — decide escopo publicável e bloqueado |
| Renderer regulatório | PARTIAL | PASS — renderers puros por DTO |
| Resource/Social/PDF Renderers | FAIL/scaffold | PASS com escopo gated |
| Accessibility | PARTIAL/HOLD | PASS estático · navegador real pendente |
| LGPD | PARTIAL/HOLD | PASS no módulo · shell global pendente |
| SEO | FAIL | PASS — 274/274 |
| Versionamento/Changeset | FAIL/PARTIAL | PASS |
| PDF accessibility | FAIL | PASS — PDF/UA-1 |
| Circular monitoring | FAIL | PARCIAL — ciclo executável, volta depende da fonte |

## Achados P0 da v1 — situação

1. **Paths dos atos seed.** Corrigido por Route/Asset Resolver. `0` referências locais quebradas (v1: 61).
2. **Templates com token de URL canônica.** `0` ocorrências restantes (v1: 26/26). `26/26` templates declaram renderer e contrato de DTO.
3. **Projection Engine ausente.** Materializado: 68 instâncias de projeção, 40 elegíveis e 28 bloqueadas com razão registrada.
4. **Regulatory Engine ausente.** Materializado com temporal, relação, aplicabilidade e lineage.
5. **Validators/Assurance/Release Gate ausentes.** 9 validators, Assurance Object e release gate fail-closed operantes.
6. **`overall: PASS` enganoso.** Campo abolido por contrato.

## Métricas estáticas (remedidas do disco)

- 273 páginas publicadas auditadas (v1: 300 contando templates).
- lang=pt-BR: 273/273
- viewport: 273/273
- skip-link: 273/273
- landmark <main>: 273/273
- <title>: 273/273 (v1: 274/300)
- meta description: 273/273 (v1: 0/300)
- canonical: 273/273 (v1: 0/300)
- Open Graph: 273/273 (v1: 0/300)
- Twitter card: 273/273 (v1: 0/300)
- JSON-LD inline válido: 273/273 (v1: 0/300)
- robots meta: 273/273 (v1: 0/300)
- conteúdo essencial pré-renderizado: 273/273 (v1: 0/300)
- DTO de projeção embutido: 273/273
- breadcrumb com rótulo acessível: 273/273
- exatamente um h1: 273/273
- campo de busca com label programático: 243/243
- contador em região live: 243/243
- referências locais quebradas: **0** (v1: 61)
- PDFs marcados (tagged) com título e autor: 4/4 (v1: 0/3)
- rotas determinísticas: 273 · artefatos com lineage: 44 · descobertos: 0
- CAATs executados: 11/12
- snapshots oficiais adquiridos: 0/2

## Matriz de geometrias

### Direcional
Source → Canonical → Engine → Validator → Projection → Renderer → Output
**PASS:** As 7 etapas existem como módulos separados; nenhum renderer lê canônico direto (CAAT-DTO-001).

### Complementar
Ato ↔ normas relacionadas ↔ recursos ↔ DesignOS
**PARCIAL:** Relações tipadas com força efetiva calculada e recursos como runtime; relações a atos internos ainda inexistentes porque só há 3 canônicos.

### Inversa
Output → Projection → Claim → Evidence → Source
**PARCIAL:** Lineage cobre output→projection→canonical (56 artefatos, 0 descobertos); o elo claim→evidence→source depende do snapshot não adquirido.

### Diagonal
SEO/PDF/Social ↔ Canonical/Evidence
**PASS:** As três superfícies não adjacentes compartilham o mesmo DTO, versões e envelope de lineage, agora validado instância a instância contra o schema (CAAT-ARTV-001).

### Transversal
A11y/LGPD/SEO/Segurança em todas as superfícies
**PARCIAL:** SEO, referências absolutas e privacidade fechados por CAAT em 100% das páginas; A11y coberta por verificação estática (273/273) mais axe-core sobre o DOM entregue (0 violações); regras dependentes de layout e auditoria em navegador real seguem pendentes.

### Circular
Monitor → Changeset → Revalidate → Rerender → Output hash → Monitor
**PARCIAL:** Ciclo implementado e executável (dry-run verificado); a volta completa exige rede até a fonte oficial.

### Vertical
Um ato da fonte até todas as projeções
**PASS:** Ato SP percorre 34 superfícies: as liberadas foram materializadas e as bloqueadas têm razão registrada.

### Horizontal
27 CORENs / todos os templates na mesma camada
**PARCIAL:** 274 páginas e 26 templates na mesma camada de contrato; corpus real de atos segue em aquisição.

### Triângulo
Engine ↔ Validator ↔ Renderer
**PASS:** 6 engines, 9 validators e 4 renderers materializados e acoplados só por DTO.

### Quadrado
Source ↔ Canonical ↔ Projection ↔ Output + diagonais
**PARCIAL:** Canonical↔Projection↔Output com hash em todos os vértices; o vértice Source segue sem hash.

### Losango
Evidence ↔ Claim ↔ Assurance ↔ Publication
**PARCIAL:** Assurance Object e release gate operantes e decidindo publicação por escopo; Evidence Fragment ausente mantém a asseguração em LIMITED.

## Backlog v1 — encerramento

| Situação | Itens |
|---|---|
| PENDENTE | 2 |
| PENDENTE_INSTRUMENTADO | 1 |
| PENDENTE_REDUZIDO | 1 |
| RESOLVIDO | 55 |
| RESOLVIDO_COM_RESSALVA | 4 |
| RESOLVIDO_PARCIAL | 2 |

Todos os 21 itens `E-*` e os 31 itens `N-*` da v1 foram endereçados. Os que aparecem como
`RESOLVIDO_PARCIAL` ou `RESOLVIDO_COM_RESSALVA` têm a ressalva nomeada na aba `02_Backlog` do XLSX.

## O que ainda bloqueia o release completo

1. **Aquisição dos snapshots oficiais** (P0). `node monitoring/regulatory-monitor.mjs --acquire --root=.`
   com rede liberada para os hosts oficiais. Destrava EVIDENCE, IPE, ALCOA++, CAAT de reperformance
   e, por consequência, as 49 superfícies bloqueadas.
2. **WCAG 2.2 AA em navegador real** (P1): leitor de tela, navegação por teclado, zoom 400%.
3. **Auditoria LGPD do shell global** (P1): `/global-scripts.js` está fora deste pacote.
4. **Descoberta exaustiva dos 27 CORENs** (P1): 3 atos canonizados até aqui.

## Observação de método

O auditor remediu o pacote a partir dos arquivos em disco antes de comparar com o que o build
declarou. Nenhuma métrica deste relatório foi copiada do `validation-report.json`.

A decisão de manter EVIDENCE em FAIL é deliberada. Seria trivial escrever um hash e declarar
`REASONABLE` — e seria exatamente a falha que a regra antimemória existe para impedir. Um gate que
fecha quando deveria fechar é o único sinal de que ele funciona.
