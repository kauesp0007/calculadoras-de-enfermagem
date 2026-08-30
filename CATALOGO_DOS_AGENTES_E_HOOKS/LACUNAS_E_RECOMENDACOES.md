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

### 🔴 2. Revisor de Links Quebrados / Integridade (agente) ✅ CRIADO (30/08/2026)
- **Status:** `revisor-integridade.agent.md` (tools: read, edit, search, execute).
- **Por quê:** o `MAPA_DE_DEPENDENCIAS.md` aponta **357 referências quebradas** no projeto
  e não há agente para corrigi-las.
- **Sugestão:** `revisor-integridade.agent.md` com `tools: [read, edit, search]`.
- **Competência:** localizar e corrigir referências quebradas (imagens, links internos).

### 🟠 3. Auditor de Core Web Vitals / Performance (agente) ✅ CRIADO (30/08/2026)
- **Status:** `auditor-performance.agent.md` (tools: read, search, execute).
- **Por quê:** existem os scripts `auditar-cwv.js` e `corrigir-cwv.js`, mas a análise de
  CWV/CLS fica diluída no `Auditor SEO`.
- **Sugestão:** `auditor-performance.agent.md` focado em CLS, LCP, INP, imagens e fontes.

### 🟠 4. Gerador de Sitemap / Mapas (agente)
- **Por quê:** existe o prompt `/gerar-sitemap` e o script `generate-sitemap.js`, mas
  nenhum agente. A regra de `relatorio_paginas.txt` → `mapa-do-site.html` é crítica.
- **Sugestão:** `gerador-sitemap.agent.md` que valida `relatorio_paginas.txt` e gera o mapa.

### 🟠 5. Verificador de Hreflang/Canonical (agente) ✅ CRIADO (30/08/2026)
- **Status:** `verificador-hreflang.agent.md` (tools: read, search).
- **Por quê:** existem logs (`log_hreflang.txt`, `relatorio_hreflang.json`), mas a
  conferência de clusters hreflang + x-default é manual.
- **Sugestão:** `verificador-hreflang.agent.md` para auditar clusters multilingues.

### 🟢 6. Curador da Base de Conhecimento (agente)
- **Por quê:** a base `/knowledge/` é gerada por hook, mas a curadoria de aliases,
  taxonomia e relações semânticas é manual.
- **Sugestão:** `curador-conhecimento.agent.md` para revisar `aliases.json`, `taxonomy.json`.

### 🟢 7. Revisor Final (QA Gate) (agente) ✅ CRIADO (30/08/2026)
- **Status:** `revisor-final.agent.md` (tools: read, search; contra-prova).
- **Por quê:** não há um "gate" consolidado antes de publicar.
- **Sugestão:** `revisor-final.agent.md` que agrega os relatórios de SEO, Governança,
  Acessibilidade e Testador e dá um veredito de publicar/não publicar.

---

## 🪝 Hooks que ainda não existem (carências)

### 🔴 1. Bloqueio de edição em arquivos/pastas proibidos (PreToolUse) ✅ CRIADO (30/08/2026)
- **Status:** `block-protected-files.json` + `scripts/hooks/block-protected-files.ps1`.
- **Por quê:** hoje o `security-git` só bloqueia `git commit/push`. As proibições de
  `footer.html`, `menu-global.html`, `global-body-elements.html`, `downloads.html`,
  `_language_selector.html`, `googlefc0a17cdd552164b.html` e das pastas `downloads`,
  `biblioteca`, `blog`, `blog-templates`, `node_modules`, `.git` dependem da memória do agente.
- **Sugestão:** `block-protected-files.json` → `scripts/hooks/block-protected-files.ps1`
  com `permissionDecision: deny` (ou `ask`).

### 🔴 2. Validação de largura e hero card (PostToolUse) ✅ CRIADO (30/08/2026)
- **Status:** `check-layout.json` + `scripts/hooks/check-layout.ps1`.
- **Por quê:** a regra "sem `container`/`max-w-*`/`mx-auto`" e "hero width 100%" é
  central e ainda não tem garantia automática.
- **Sugestão:** `check-layout.json` → script que varre o HTML editado e detecta
  `container`, `max-w-*`, `mx-auto` no `<main>` e hero fora do padrão.

### 🟠 3. Validação da ordem do `<head>` (PostToolUse) ✅ CRIADO (30/08/2026)
- **Status:** `check-head.json` + `scripts/hooks/check-head.ps1` (checa presença dos elementos essenciais).
- **Por quê:** a ordem do head (charset → … → anti-CLS) é regra explícita, mas conferida manualmente.
- **Sugestão:** `check-head.json` que verifica presença/ordem de charset, canonical,
  hreflang, Schema.org, anti-CLS e scripts com `defer`.

### 🟠 4. Verificação de links quebrados após edição (PostToolUse)
- **Por quê:** o mapa de dependências mostra 357 links quebrados; não há verificação incremental.
- **Sugestão:** `check-links.json` que valida links internos do arquivo recém-editado.

### 🟠 5. Registro automático em `relatorio_paginas.txt` (PostToolUse) ✅ CRIADO (30/08/2026)
- **Status:** `register-page.json` + `scripts/hooks/register-page.ps1` (reporta; registro segue manual).
- **Por quê:** ao criar página nova, a inclusão no `relatorio_paginas.txt` é manual e
  crítica para gerar o `mapa-do-site.html`.
- **Sugestão:** `register-page.json` que detecta HTML novo na raiz e sugere/registra a entrada.

### 🟠 6. Regeneração automática do sitemap (PostToolUse)
- **Por quê:** existe `generate-sitemap.js`, mas o sitemap não é regenerado automaticamente.
- **Sugestão:** `generate-sitemap.json` que roda após criar página nova.

### 🟢 7. Lint de acessibilidade básica (PostToolUse) ✅ CRIADO (30/08/2026)
- **Status:** `check-a11y.json` + `scripts/hooks/check-a11y.ps1` (lang, skip-link, h1, alt).
- **Por quê:** alt vazio, ausência de lang, headings pulados poderiam ser detectados deterministicamente.
- **Sugestão:** `check-a11y.json` com checagens básicas (alt, lang, skip-link, h1 único).

### 🟢 8. Validação de JSON (PreToolUse/PostToolUse) ✅ CRIADO (30/08/2026)
- **Status:** `check-json.json` + `scripts/hooks/check-json.ps1` (PostToolUse).
- **Por quê:** existem regras para preservar schema de JSON (NANDA/NIC etc.), mas sem hook.
- **Sugestão:** `check-json.json` que valida sintaxe JSON antes/depois de editar `.json`.

---

## 📋 Matriz de prioridade consolidada

| Camada | Item | Prioridade | Base existente |
|---|---|---|---|
| Hook | Bloqueio de arquivos/pastas proibidos | ✅ criado | `block-protected-files.ps1` |
| Hook | Validação de largura/hero | ✅ criado | `check-layout.ps1` |
| Agente | Auditor de Acessibilidade | 🔴 | Skill `auditar-acessibilidade` |
| Agente | Revisor de Links Quebrados | ✅ criado | `revisor-integridade.agent.md` |
| Hook | Validação da ordem do `<head>` | ✅ criado | `check-head.ps1` |
| Hook | Verificação de links quebrados | 🟠 | Scripts de análise |
| Hook | Registro em `relatorio_paginas.txt` | ✅ criado | `register-page.ps1` |
| Hook | Regeneração de sitemap | 🟠 | `generate-sitemap.js` |
| Agente | Auditor de CWV/Performance | ✅ criado | `auditor-performance.agent.md` |
| Agente | Gerador de Sitemap | 🟠 | Prompt `/gerar-sitemap` |
| Agente | Verificador de Hreflang | ✅ criado | `verificador-hreflang.agent.md` |
| Agente | Curador da Base de Conhecimento | 🟢 | `build-knowledge-index.js` |
| Agente | Revisor Final (QA Gate) | ✅ criado | `revisor-final.agent.md` |
| Hook | Lint de acessibilidade básica | ✅ criado | `check-a11y.ps1` |
| Hook | Validação de JSON | ✅ criado | `check-json.ps1` |

## 🏁 Conclusão

As maiores carências estão em **transformar regras rígidas em garantias automáticas**
(bloqueio de arquivos proibidos e validação de layout) e em **criar agentes para
problemas já diagnosticados** (links quebrados e acessibilidade). Recomenda-se começar
pelos itens 🔴.
