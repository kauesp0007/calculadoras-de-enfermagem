# 🗂️ Catálogo dos Agentes e Hooks — Índice

> ⚠️ **Este arquivo é apenas um ÍNDICE de navegação.**
> A fonte canônica única é **`CATALOGO_CENTRAL_DA_ARQUITETURA.md`**.
> Este README não repete listas completas nem contagens independentes — qualquer
> número aqui deve ser conferido contra a fonte canônica e os arquivos reais.

**Projeto:** Calculadoras de Enfermagem  
**Escopo:** `.github/agents/`, `.github/hooks/`, `.github/skills/`, `.github/prompts/`, `.github/instructions/` e `scripts/hooks/`

**Regra de leitura:**

- **README = índice**
- **`CATALOGO_CENTRAL_DA_ARQUITETURA.md` = verdade**
- **catálogos temáticos = detalhamento derivado**
- **arquivos reais = implementação**

## 📊 Resumo Geral

| Camada | Local | Quantidade | Natureza |
|---|---|---|---|
| **Agentes** | `.github/agents/*.agent.md` | **15** | Subagentes especializados (IA) |
| **Hooks** | `.github/hooks/*.json` + `scripts/hooks/*.ps1` | **12** | Automações determinísticas (sem IA) |
| Skills | `.github/skills/<nome>/SKILL.md` | 3 | Conhecimento de domínio sob demanda |
| Prompts | `.github/prompts/*.prompt.md` | 5 | Comandos de barra reutilizáveis |
| Instruções por arquivo | `.github/instructions/*.instructions.md` | 5 | Regras por extensão (`applyTo`) |

> **Agentes reais:** `.github/agents/*.agent.md` · **Hooks reais:** `.github/hooks/*.json`
> + `scripts/hooks/*.ps1`. Contagens no `CATALOGO_CENTRAL_DA_ARQUITETURA.md`.

## 📑 Índice deste catálogo

| Arquivo | Conteúdo |
|---|---|
| `README.md` | Visão geral e índice (este arquivo) |
| `CATALOGO_DOS_AGENTES.md` | Ficha detalhada dos agentes: competência, ferramentas, gatilho, limitações e diferenciação |
| `CATALOGO_DOS_HOOKS.md` | Ficha detalhada dos hooks: evento, gatilho, script, decisão e quando iniciam |
| `CATALOGO_CENTRAL_DA_ARQUITETURA.md` | **FONTE CANÔNICA ÚNICA** — inventário, criticidade, orquestração, versionamento e governança documental |
| `MAPA_DE_RESPONSABILIDADES.md` | Matriz tarefa → mecanismo → custo → gatilho |
| `CATALOGO_DAS_SKILLS.md` · `CATALOGO_DOS_PROMPTS.md` · `CATALOGO_DAS_INSTRUCTIONS.md` · `CATALOGO_DOS_MCP.md` | Catálogos de skills, prompts, instructions e MCP |
| `CATALOGO_DA_BASE_DE_CONHECIMENTO.md` · `CATALOGO_DE_TEMPLATES.md` · `CATALOGO_DE_IMAGENS.md` | Catálogos de conhecimento, templates e imagens |
| `CATALOGO_DE_ERROS.md` · `CATALOGO_DE_SOLUCOES.md` · `CATALOGO_DE_AUDITORIAS.md` | Catálogos de erros, soluções e auditorias |
| `FLUXO_DE_COMPLEMENTARIDADE.md` | Como agentes e hooks se complementam, pipeline de criação e ciclo de vida |
| `ECONOMIA_DE_CREDITOS_E_IMPACTO.md` | Economia de créditos de IA e impacto econômico (estimativas qualitativas) |
| `LACUNAS_E_RECOMENDACOES.md` | Estado real de lacunas e decisões de não-criação (pós-saneamento) |
| `historico/` | Documentos históricos/legados — **não são fonte canônica** |
| `registro-conformidade.json` | Evidência de conformidade dos componentes (novos e pré-existentes) |
| `RELATORIO_DE_SANEAMENTO_DA_ARQUITETURA.md` | Relatório do saneamento (V4 → V5) |
| `INVENTARIO_CANONICO_DA_ARQUITETURA.json` | Inventário objetivo e auditável da arquitetura |

## 🧭 Como ler este catálogo

- **Agentes** são chamados **sob demanda** (pelo usuário ou pelo agente principal) e
  possuem um prompt de sistema pequeno e especializado. Cada um tem um conjunto mínimo
  de ferramentas (`tools`) que limita o que ele pode fazer.
- **Hooks** são **automáticos** e **determinísticos**: disparam em eventos
  `PreToolUse` (antes de uma ferramenta) ou `PostToolUse` (depois) e executam
  scripts PowerShell locais. **Não consomem créditos de IA.**

## ⚖️ Agentes × Hooks (resumo de diferenciação)

| Critério | Agente | Hook |
|---|---|---|
| O que é | Prompt de sistema + modelo de IA | Script PowerShell (`.ps1`) disparado por evento |
| Quando inicia | Chamada explícita (usuário/agente) | Automaticamente antes/depois de uma ferramenta |
| Consome créditos de IA | Sim (por chamada) | Não (execução local) |
| Pode editar arquivo | Alguns sim (`edit`) | Sim (ex.: backup, build) |
| Pode bloquear ação | Não (só orienta) | Sim (`permissionDecision: deny`) |
| Papel | Julgamento, análise, criação | Garantia, automação, fiscalização |
