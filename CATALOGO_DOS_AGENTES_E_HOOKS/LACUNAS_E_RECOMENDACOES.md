# 🕳️ Lacunas e Recomendações — Agentes e Hooks Faltantes

**Projeto:** Calculadoras de Enfermagem  
**Objetivo:** identificar carências na camada de agentes e hooks, com prioridade sugerida.

## 🧭 Critérios de prioridade

- **🔴 Alta** — regra rígida do projeto ainda sem garantia automática (depende da memória do agente).
- **🟠 Média** — automação valiosa, com scripts base já existentes.
- **🟢 Baixa** — melhoria de qualidade de vida.

---

## 🤖 Agentes que ainda não existem (carências)

### 🔴 1. Auditor de Acessibilidade (agente)
- **Por quê:** existe a skill `auditar-acessibilidade`, mas não um agente dedicado.
  Acessibilidade é regra rígida do projeto (skip-link, alt, aria, focus-visible).
- **Sugestão:** `auditor-acessibilidade.agent.md` com `tools: [read, search]`, somente leitura.
- **Competência:** auditar lang, skip-link, alt, headings, labels, aria e contraste.

### 🔴 2. Revisor de Links Quebrados / Integridade (agente)
- **Por quê:** o `MAPA_DE_DEPENDENCIAS.md` aponta **357 referências quebradas** no projeto
  e não há agente para corrigi-las.
- **Sugestão:** `revisor-integridade.agent.md` com `tools: [read, edit, search]`.
- **Competência:** localizar e corrigir referências quebradas (imagens, links internos).

### 🟠 3. Auditor de Core Web Vitals / Performance (agente)
- **Por quê:** existem os scripts `auditar-cwv.js` e `corrigir-cwv.js`, mas a análise de
  CWV/CLS fica diluída no `Auditor SEO`.
- **Sugestão:** `auditor-performance.agent.md` focado em CLS, LCP, INP, imagens e fontes.

### 🟠 4. Gerador de Sitemap / Mapas (agente)
- **Por quê:** existe o prompt `/gerar-sitemap` e o script `generate-sitemap.js`, mas
  nenhum agente. A regra de `relatorio_paginas.txt` → `mapa-do-site.html` é crítica.
- **Sugestão:** `gerador-sitemap.agent.md` que valida `relatorio_paginas.txt` e gera o mapa.

### 🟠 5. Verificador de Hreflang/Canonical (agente)
- **Por quê:** existem logs (`log_hreflang.txt`, `relatorio_hreflang.json`), mas a
  conferência de clusters hreflang + x-default é manual.
- **Sugestão:** `verificador-hreflang.agent.md` para auditar clusters multilingues.

### 🟢 6. Curador da Base de Conhecimento (agente)
- **Por quê:** a base `/knowledge/` é gerada por hook, mas a curadoria de aliases,
  taxonomia e relações semânticas é manual.
- **Sugestão:** `curador-conhecimento.agent.md` para revisar `aliases.json`, `taxonomy.json`.

### 🟢 7. Revisor Final (QA Gate) (agente)
- **Por quê:** não há um "gate" consolidado antes de publicar.
- **Sugestão:** `revisor-final.agent.md` que agrega os relatórios de SEO, Governança,
  Acessibilidade e Testador e dá um veredito de publicar/não publicar.

---

## 🪝 Hooks que ainda não existem (carências)

### 🔴 1. Bloqueio de edição em arquivos/pastas proibidos (PreToolUse)
- **Por quê:** hoje o `security-git` só bloqueia `git commit/push`. As proibições de
  `footer.html`, `menu-global.html`, `global-body-elements.html`, `downloads.html`,
  `_language_selector.html`, `googlefc0a17cdd552164b.html` e das pastas `downloads`,
  `biblioteca`, `blog`, `blog-templates`, `node_modules`, `.git` dependem da memória do agente.
- **Sugestão:** `block-protected-files.json` → `scripts/hooks/block-protected-files.ps1`
  com `permissionDecision: deny` (ou `ask`).

### 🔴 2. Validação de largura e hero card (PostToolUse)
- **Por quê:** a regra "sem `container`/`max-w-*`/`mx-auto`" e "hero width 100%" é
  central e ainda não tem garantia automática.
- **Sugestão:** `check-layout.json` → script que varre o HTML editado e detecta
  `container`, `max-w-*`, `mx-auto` no `<main>` e hero fora do padrão.

### 🟠 3. Validação da ordem do `<head>` (PostToolUse)
- **Por quê:** a ordem do head (charset → … → anti-CLS) é regra explícita, mas conferida manualmente.
- **Sugestão:** `check-head.json` que verifica presença/ordem de charset, canonical,
  hreflang, Schema.org, anti-CLS e scripts com `defer`.

### 🟠 4. Verificação de links quebrados após edição (PostToolUse)
- **Por quê:** o mapa de dependências mostra 357 links quebrados; não há verificação incremental.
- **Sugestão:** `check-links.json` que valida links internos do arquivo recém-editado.

### 🟠 5. Registro automático em `relatorio_paginas.txt` (PostToolUse)
- **Por quê:** ao criar página nova, a inclusão no `relatorio_paginas.txt` é manual e
  crítica para gerar o `mapa-do-site.html`.
- **Sugestão:** `register-page.json` que detecta HTML novo na raiz e sugere/registra a entrada.

### 🟠 6. Regeneração automática do sitemap (PostToolUse)
- **Por quê:** existe `generate-sitemap.js`, mas o sitemap não é regenerado automaticamente.
- **Sugestão:** `generate-sitemap.json` que roda após criar página nova.

### 🟢 7. Lint de acessibilidade básica (PostToolUse)
- **Por quê:** alt vazio, ausência de lang, headings pulados poderiam ser detectados deterministicamente.
- **Sugestão:** `check-a11y.json` com checagens básicas (alt, lang, skip-link, h1 único).

### 🟢 8. Validação de JSON (PreToolUse/PostToolUse)
- **Por quê:** existem regras para preservar schema de JSON (NANDA/NIC etc.), mas sem hook.
- **Sugestão:** `check-json.json` que valida sintaxe JSON antes/depois de editar `.json`.

---

## 📋 Matriz de prioridade consolidada

| Camada | Item | Prioridade | Base existente |
|---|---|---|---|
| Hook | Bloqueio de arquivos/pastas proibidos | 🔴 | Regra em `AI_RULES.md` |
| Hook | Validação de largura/hero | 🔴 | Regra em instruções |
| Agente | Auditor de Acessibilidade | 🔴 | Skill `auditar-acessibilidade` |
| Agente | Revisor de Links Quebrados | 🔴 | `MAPA_DE_DEPENDENCIAS.md` (357 quebras) |
| Hook | Validação da ordem do `<head>` | 🟠 | Instruções de head |
| Hook | Verificação de links quebrados | 🟠 | Scripts de análise |
| Hook | Registro em `relatorio_paginas.txt` | 🟠 | Regra de página nova |
| Hook | Regeneração de sitemap | 🟠 | `generate-sitemap.js` |
| Agente | Auditor de CWV/Performance | 🟠 | `auditar-cwv.js` |
| Agente | Gerador de Sitemap | 🟠 | Prompt `/gerar-sitemap` |
| Agente | Verificador de Hreflang | 🟠 | `relatorio_hreflang.json` |
| Agente | Curador da Base de Conhecimento | 🟢 | `build-knowledge-index.js` |
| Agente | Revisor Final (QA Gate) | 🟢 | Relatórios dos demais |
| Hook | Lint de acessibilidade básica | 🟢 | Skill de acessibilidade |
| Hook | Validação de JSON | 🟢 | Regras de JSON |

## 🏁 Conclusão

As maiores carências estão em **transformar regras rígidas em garantias automáticas**
(bloqueio de arquivos proibidos e validação de layout) e em **criar agentes para
problemas já diagnosticados** (links quebrados e acessibilidade). Recomenda-se começar
pelos itens 🔴.
