# Projeto CKO — Consolidação

Consolidação organizada das bibliotecas de materiais/dispositivos, dos templates de página, do runtime CKOS e das matrizes de correlação da plataforma **calculadorasdeenfermagem.com.br**.

Estado: bibliotecas normalizadas e validadas · 11 páginas geradas no shell de produção · matriz de correlação limpa (77×22 = 811 arestas de grafo) · runtime v12 e schema v11 incluídos.

## Estrutura

```
cko-projeto/
├── README.md                     ← este índice
├── 00-docs/
│   ├── AUDITORIA-bibliotecas.md  ← problemas encontrados + correções (22 no total)
│   ├── ESTRUTURA-biblioteca.md   ← envelope comum × campos específicos (a "hipótese" confirmada)
│   ├── INVENTARIO-website.md      ← recuperação do inventário do site (30 tipos × 40 recursos)
│   └── CKOS-v11-DOCUMENTACAO.md   ← doc do schema/runtime (turno anterior)
├── 01-schema/
│   ├── biblioteca-cko-v1.schema.json   ← NOVO — schema formal das 11 bibliotecas
│   └── seringa-cko-v11.schema.json     ← schema CKO runtime (dispositivo individual)
├── 02-bibliotecas/               ← 11 objetos NORMALIZADOS (nomes limpos, sem timestamp)
│   ├── agulhas.json ... sondas.json
├── 03-templates/
│   ├── biblioteca-seringa.html · seringa-10ml.html   ← páginas de referência (shell real)
│   ├── gerar-biblioteca.py       ← gerador: objeto JSON → página no shell
│   ├── paginas/                  ← 11 páginas geradas (agulhas.html … sondas.html)
│   ├── ckos-runtime.js · ckos_runtime.py · ckos-ci.mjs   ← runtime v12 + gate CI
│   └── seringa-insulina-030.cko.json
└── 04-matrizes/
    ├── matriz-ferramentas-bibliotecas.xlsx  ← matriz limpa (Matriz · Arestas_Grafo · Resumo)
    └── grafo-arestas.csv                    ← edge-list do grafo (from → to, relação, peso)
```

## O que cada camada é

- **02-bibliotecas** — a fonte de dados canônica (language-neutral). Cada objeto segue `01-schema/biblioteca-cko-v1.schema.json`.
- **03-templates/gerar-biblioteca.py** — transforma qualquer objeto em página HTML no shell de produção (Inter/Nunito, `global-scripts.js` injeta header/barra/footer, `@graph`, rascunho). É o que faz "todas as bibliotecas seguirem a estrutura das páginas que criamos".
- **04-matrizes** — a matriz Ferramentas × Bibliotecas, agora também como **grafo** (edge-list `from --relação--> to`, peso DIRETO=3 / COMPLEMENTAR=2 / IA=1).

## Como regenerar as páginas

```bash
cd 03-templates
python3 gerar-biblioteca.py --all ../02-bibliotecas ./paginas/
```

## Pendências conhecidas (rastreadas, não bloqueiam)

- Todas as páginas nascem em **rascunho** (`data-draft` → noindex + faixa); publicar com `?publish=1` após nomear revisor clínico.
- `feridas` (Avaliação Clínica) e `antissepticos` (Produtos para Saúde) têm catálogo/estrutura próprios — o schema já os aceita.
- O grafo-correlação que você mencionou ter enviado antes: não localizei upload distinto da matriz atual no histórico e não consigo recuperar bytes de conversas passadas — a matriz enviada agora foi consolidada como edge-list. Se houver outro arquivo, reenvie que eu incorporo.

## Atualização — documentação de produção (este turno)

- `00-docs/ESTRUTURA-SITE-modulares.md` — contrato real da casca modular (mount points, layout fixo, paleta, 4 camadas de CSS).
- `00-docs/TEMPLATES-documentacao.md` — templates Calculadora/Escala e Biblioteca: anatomia, componentes, barra de ação, toaster, favoritos, acessibilidade, botões.
- `00-docs/RECURSOS-por-template.md` — recursos que cada template contém + matriz de features + perfis de impressão.
- `03-templates/css/pages/biblioteca.css` — 4ª camada de CSS (paleta de produção); as 11 páginas agora referenciam-na (zero CSS inline, zero cor fora da paleta) e trazem barra de ação (favoritar/compartilhar/imprimir/PDF/reportar) com toaster e Web Share.

## Atualização — templates enriquecidos + correlações (este turno)

- Renderer enriquecido: agora exibe **Ficha técnica** (`catalog.specifications`+`extensions`), **classes de risco** (ANVISA/FDA/EU) e cabeçalho de **segurança** (Alto risco / Dupla checagem) quando presentes.
- **6 objetos de seringa** ricos extraídos do arquivo de exemplos (insulina 1 mL, 3/5/10/20 mL Luer Lock, 60 mL irrigação) — completados ao envelope, validados (17/17) e renderizados. Total: **17 páginas** em `03-templates/paginas/`.
- **Correlações recursos × ferramentas**: `04-matrizes/correlacao-recursos-ferramentas.xlsx` + grafo unificado (1.495 arestas). Ver `00-docs/CORRELACOES-recursos-ferramentas.md`.

## Atualização — roadmap + objetos de ligação (este turno)

- `00-docs/ANALISE-e-ROADMAP.md` — consolidação fiel da análise do arquivo de exemplos (backlog de 10+ adições, 8 motores, 8 objetos de ligação).
- `01-schema/linking-objects/` — os **8 objetos de ligação** como schemas válidos (ClinicalRule, EvidenceReference, DecisionTree, ClinicalPathway, DrugDeviceMatrix, ProcedureProtocol, AuditIndicatorRule, FHIRMapping).
- `02-bibliotecas/_drug-device-matrix.json` — instância (insulina) da matriz medicamento↔dispositivo; arestas somadas ao grafo unificado (1.499).

## Atualização — 24 objetos clínicos + grafo (este turno)

- `05-objetos-clinicos/` — 24 objetos CKO (envelope core+domainPayload) extraídos do gerador limpo, 1 por biblioteca (medicamentos, doenças, escalas, NANDA/NIC/NOC, vacinas, microorganismos, anatomia, fisiologia, patologia, protocolos, procedimentos, exames, sinais vitais, indicadores, legislação, segurança, conceitos, terminologias, eventos adversos, calculadoras, educação, materiais) + `_index.json`.
- `01-schema/cko-objeto-v1.schema.json` — schema do envelope (24/24 válidos).
- `04-matrizes/grafo-objetos-clinicos.csv` — 155 arestas de conhecimento; grafo unificado agora com 1.654 arestas.
- `00-docs/OBJETOS-CLINICOS.md` — catálogo e explicação.
