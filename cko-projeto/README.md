# Projeto CKO — Consolidação

Consolidação organizada das bibliotecas de materiais/dispositivos, dos templates de página, do runtime CKOS e das matrizes de correlação da plataforma **calculadorasdeenfermagem.com.br**.

Estado: bibliotecas normalizadas · **17 páginas de biblioteca + 1 índice autônomo** · validação local sem dependências · teste funcional em navegador · matriz de correlação (77×22 = 811 arestas de grafo) · runtime CKOS e schema v11 incluídos.

## Execução autônoma dos HTMLs

Os HTMLs de `03-templates/paginas/` funcionam apenas com recursos da própria pasta `cko-projeto`. Eles **não modificam nem dependem** dos HTMLs da raiz, das pastas de idioma, de `global-styles.css`, `global-scripts.js` ou `lang-selector.js`.

Fluxo atual:

```text
02-bibliotecas/*.json
        ↓ gerar-biblioteca.py (ignora _*.json)
03-templates/paginas/*.html
        ↓
03-templates/css/pages/biblioteca.css + 03-templates/cko-page.js
```

Para regenerar, validar e visualizar no Windows:

```powershell
cd cko-projeto
python -X utf8 .\03-templates\gerar-biblioteca.py --all .\02-bibliotecas .\03-templates\paginas
python -X utf8 .\validar-projeto.py
python -X utf8 .\executar-local.py
```

Depois, abra:

```text
http://localhost:8000/03-templates/paginas/index.html
```

As páginas também podem ser abertas diretamente pelo arquivo `03-templates/paginas/index.html`, mas o servidor local é recomendado para reproduzir o comportamento de um site.

Teste funcional opcional, executado a partir da raiz do repositório (utiliza o Puppeteer já instalado no projeto principal):

```powershell
node .\cko-projeto\teste-funcional.cjs
```

O validador local verifica os 55 JSONs, os campos mínimos das 17 bibliotecas, as 18 páginas geradas, os dois aliases antigos, IDs duplicados, links locais, dependências externas, estilos inline e manipuladores JavaScript inline. Ele não substitui revisão clínica nem validação completa por JSON Schema.

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
│   ├── biblioteca-cko-v1.schema.json   ← schema formal das 17 bibliotecas
│   └── seringa-cko-v11.schema.json     ← schema CKO runtime (dispositivo individual)
├── 02-bibliotecas/               ← 17 bibliotecas renderizáveis + objetos auxiliares `_*.json`
│   ├── agulhas.json ... sondas.json
├── 03-templates/
│   ├── biblioteca-seringa.html · seringa-10ml.html   ← aliases locais de compatibilidade
│   ├── gerar-biblioteca.py       ← gerador: objeto JSON → página autônoma
│   ├── cko-page.js               ← abas, favoritos, compartilhamento e impressão
│   ├── paginas/                  ← índice + 17 páginas geradas
│   ├── ckos-runtime.js · ckos_runtime.py · ckos-ci.mjs   ← runtime v12 + gate CI
│   └── seringa-insulina-030.cko.json
├── executar-local.py             ← servidor restrito a esta pasta
├── validar-projeto.py            ← validação local sem dependências
├── teste-funcional.cjs           ← teste em Chromium/Puppeteer
└── 04-matrizes/
    ├── matriz-ferramentas-bibliotecas.xlsx  ← matriz limpa (Matriz · Arestas_Grafo · Resumo)
    └── grafo-arestas.csv                    ← edge-list do grafo (from → to, relação, peso)
```

## O que cada camada é

- **02-bibliotecas** — a fonte de dados canônica (language-neutral). Cada objeto segue `01-schema/biblioteca-cko-v1.schema.json`.
- **03-templates/gerar-biblioteca.py** — transforma os 17 objetos de biblioteca em páginas autônomas, escapa o conteúdo, ignora JSONs auxiliares iniciados por `_` e cria um índice navegável.
- **03-templates/cko-page.js** — comportamento compartilhado das páginas, sem JavaScript inline e sem dependência dos módulos globais do site.
- **validar-projeto.py** — auditoria local dos JSONs, HTMLs e referências.
- **executar-local.py** — servidor HTTP limitado à pasta `cko-projeto`.
- **04-matrizes** — a matriz Ferramentas × Bibliotecas, agora também como **grafo** (edge-list `from --relação--> to`, peso DIRETO=3 / COMPLEMENTAR=2 / IA=1).

## Como regenerar as páginas

```powershell
cd cko-projeto
python -X utf8 .\03-templates\gerar-biblioteca.py --all .\02-bibliotecas .\03-templates\paginas
```

## Pendências conhecidas (rastreadas, não bloqueiam)

- Todas as páginas permanecem em **rascunho** com `noindex,nofollow` estático. Este modo é uma prévia local e não possui mecanismo de publicação.
- Documentos técnicos declarados nos JSONs, mas ausentes da pasta, são exibidos como "arquivo ainda não incluído" em vez de gerar links quebrados.
- `05-objetos-clinicos/`, matrizes e grafos continuam como dados estruturados; ainda não possuem renderer HTML neste modo.
- `feridas` (Avaliação Clínica) e `antissepticos` (Produtos para Saúde) têm catálogo/estrutura próprios — o schema já os aceita.
- O grafo-correlação que você mencionou ter enviado antes: não localizei upload distinto da matriz atual no histórico e não consigo recuperar bytes de conversas passadas — a matriz enviada agora foi consolidada como edge-list. Se houver outro arquivo, reenvie que eu incorporo.

## Atualização — documentação de produção (este turno)

- `00-docs/ESTRUTURA-SITE-modulares.md` — contrato real da casca modular (mount points, layout fixo, paleta, 4 camadas de CSS).
- `00-docs/TEMPLATES-documentacao.md` — templates Calculadora/Escala e Biblioteca: anatomia, componentes, barra de ação, toaster, favoritos, acessibilidade, botões.
- `00-docs/RECURSOS-por-template.md` — recursos que cada template contém + matriz de features + perfis de impressão.
- `03-templates/css/pages/biblioteca.css` — folha autônoma das páginas CKO; as 17 bibliotecas e o índice usam o mesmo layout responsivo, impressão e componentes locais.

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
