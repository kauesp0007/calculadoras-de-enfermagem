# 🕳️ Lacunas e Recomendações — Estado Real (pós-saneamento)

**Projeto:** Calculadoras de Enfermagem
**Data:** 02/09/2026
**Objetivo:** registrar o estado REAL das lacunas e as decisões de não-criação.
**Fonte canônica:** `CATALOGO_CENTRAL_DA_ARQUITETURA.md`.

> Este documento **não** lista "carências históricas" como pendências atuais. Itens já
> criados não aparecem como "faltantes".

---

## 📋 Estado atual das lacunas

| Item | Status | Prioridade | Decisão | Componente existente |
|---|---|---|---|---|
| Auditor de Acessibilidade (agente) | **COBERTO** | — | **Não criar** | skill `auditar-acessibilidade` + hook `check-a11y` + `Auditor de Conformidade Técnica` |
| Revisor de Links Quebrados | **CRIADO** | — | Concluído | `revisor-integridade.agent.md` + `fix-broken-links.js` |
| Auditor de CWV/Performance | **CRIADO** | — | Concluído | `auditor-performance.agent.md` + `auditar-cwv.js` |
| Verificador de Hreflang/Canonical | **CRIADO** | — | Concluído | `verificador-hreflang.agent.md` |
| Revisor Final (QA Gate) | **CRIADO** | — | Concluído | `revisor-final.agent.md` |
| Auditor de Conformidade Técnica | **CRIADO** | — | Concluído | `auditor-conformidade-tecnica.agent.md` |
| Agente Alfandegário (gate) | **CRIADO** | — | Concluído | `agente-alfandegario.agent.md` |
| Auditor do Ecossistema | **CRIADO** | — | Concluído | `auditor-ecossistema.agent.md` + `auditar-ecossistema.js` |
| Bloqueio de arquivos proibidos | **CRIADO** | — | Concluído | hook `block-protected-files` |
| Validação de largura/hero | **CRIADO** | — | Concluído | hook `check-layout` |
| Validação do `<head>` | **CRIADO** | — | Concluído | hook `check-head` |
| Validação de JSON | **CRIADO** | — | Concluído | hook `check-json` |
| Registro em `relatorio_paginas.txt` | **CRIADO** | — | Concluído | hook `register-page` |
| Lint de acessibilidade básica | **CRIADO** | — | Concluído | hook `check-a11y` |
| Conformidade de componentes novos | **CRIADO** | — | Concluído | hook `check-conformidade` |

---

## 🕳️ Lacunas remanescentes (decisões de não-criação — não são pendências ativas)

| Item | Decisão | Justificativa | Condição para futura criação |
|---|---|---|---|
| Agente Auditor de Acessibilidade | **Não criar** | A skill `auditar-acessibilidade` cobre a auditoria qualitativa; o hook `check-a11y` cobre o básico determinístico; o `Auditor de Conformidade Técnica` consolida acessibilidade no gate. Criar um agente duplicaria responsabilidade. | Somente se surgir demanda de auditoria de acessibilidade que exceda a skill + hook + conformidade técnica. |
| Hook `check-links` (verificação incremental de links) | **Não criar** | `Revisor de Integridade` + `fix-broken-links.js` + `MAPA_DE_DEPENDENCIAS.md` já cobrem. Varredura por edição seria cara e redundante. | Somente se a varredura incremental ficar barata e o fluxo manual se mostrar insuficiente. |
| Hook `generate-sitemap` automático | **Não criar** | `deploy.yml` gera o sitemap a cada deploy; regenerar a cada edição é redundante. | Somente se o deploy deixar de gerar o sitemap. |
| Agente Gerador de Sitemap | **Não criar** | Prompt `/gerar-sitemap` + `generate-sitemap.js` cobrem; agente seria wrapper fino de script (viola o princípio do menor mecanismo). | Somente se o prompt + script se mostrarem insuficientes para validação semântica do mapa. |
| Agente Curador da Base de Conhecimento | **Futuro opcional** | A base `/knowledge/` é auto-gerada por hook; curadoria manual só com demanda real. | Somente se houver demanda comprovada de curadoria de aliases/taxonomia. |
| MCP próprio | **Não criar** | Decisão deliberada — ver `CATALOGO_DOS_MCP.md`. | Somente com necessidade comprovada + autorização explícita. |

---

## 🏁 Conclusão

A camada de IA está **completa e coerente** (15 agentes, 12 hooks, 3 skills, 5 prompts,
5 instructions, 0 MCP). Não há "carência" ativa: os itens antes marcados como 🔴/🟠/🟢
foram ou **criados** ou **deliberadamente não criados** (com justificativa registrada).

