# 🗂️ Catálogo dos Agentes e Hooks

**Projeto:** Calculadoras de Enfermagem  
**Gerado em:** 30/08/2026  
**Escopo:** `.github/agents/`, `.github/hooks/`, `.github/skills/`, `.github/prompts/`, `.github/instructions/` e `scripts/hooks/`

## 📊 Resumo Geral

| Camada | Local | Quantidade | Natureza |
|---|---|---|---|
| **Agentes** | `.github/agents/*.agent.md` | **15** | Subagentes especializados (IA) |
| **Hooks** | `.github/hooks/*.json` + `scripts/hooks/*.ps1` | **12** | Automações determinísticas (sem IA) |
| Skills | `.github/skills/<nome>/SKILL.md` | 3 | Conhecimento de domínio sob demanda |
| Prompts | `.github/prompts/*.prompt.md` | 5 | Comandos de barra reutilizáveis |
| Instruções por arquivo | `.github/instructions/*.instructions.md` | 4 | Regras por extensão (`applyTo`) |

> Este catálogo foca em **Agentes** e **Hooks**, conforme solicitado. As demais
> camadas aparecem apenas como contexto de complementaridade.

## 📑 Índice deste catálogo

| Arquivo | Conteúdo |
|---|---|
| `README.md` | Visão geral e índice (este arquivo) |
| `CATALOGO_DOS_AGENTES.md` | Ficha detalhada dos 13 agentes: competência, ferramentas, gatilho, limitações e diferenciação |
| `CATALOGO_DOS_HOOKS.md` | Ficha detalhada dos 11 hooks: evento, gatilho, script, decisão e quando iniciam |
| `CATALOGO_CENTRAL_DA_ARQUITETURA.md` | Visão consolidada: criticidade, orquestração, prova/contra-prova, versionamento e decisões |
| `MAPA_DE_RESPONSABILIDADES.md` | Matriz tarefa → mecanismo → custo → gatilho |
| `CATALOGO_DAS_SKILLS.md` · `CATALOGO_DOS_PROMPTS.md` · `CATALOGO_DAS_INSTRUCTIONS.md` · `CATALOGO_DOS_MCP.md` | Catálogos de skills, prompts, instructions e MCP |
| `CATALOGO_DA_BASE_DE_CONHECIMENTO.md` · `CATALOGO_DE_TEMPLATES.md` · `CATALOGO_DE_IMAGENS.md` | Catálogos de conhecimento, templates e imagens |
| `CATALOGO_DE_ERROS.md` · `CATALOGO_DE_SOLUCOES.md` · `CATALOGO_DE_AUDITORIAS.md` | Catálogos de erros, soluções e auditorias |
| `FLUXO_DE_COMPLEMENTARIDADE.md` | Como agentes e hooks se complementam, pipeline de criação e ciclo de vida |
| `ECONOMIA_DE_CREDITOS_E_IMPACTO.md` | Economia de créditos de IA e impacto econômico (estimativas qualitativas) |
| `LACUNAS_E_RECOMENDACOES.md` | Agentes e hooks ainda não criados (carências) e prioridades sugeridas |

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
