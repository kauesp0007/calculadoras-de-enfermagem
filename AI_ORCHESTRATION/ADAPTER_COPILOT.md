# ADAPTER — GitHub Copilot

> Adaptador de **carregamento e aplicação** do `PROMPT_CORE.md` no ambiente GitHub Copilot.
> Este arquivo **não** duplica as regras do Core.

## Onde o Core vive
`AI_ORCHESTRATION/PROMPT_CORE.md` (fonte única das regras universais).

## Pontos de integração do Copilot
Os mecanismos existentes em `.github/`:
- `.github/prompts/orquestrar.prompt.md` — comando de barra `/orquestrar` (wrapper fino);
- `.github/copilot-instructions.md` — regras gerais do projeto;
- `.github/instructions/*.instructions.md` — regras por extensão.

## Como o Copilot aplica o Core
1. O usuário invoca `/orquestrar` (`.github/prompts/orquestrar.prompt.md`).
2. O prompt é um **wrapper fino** que aponta para `AI_ORCHESTRATION/PROMPT_CORE.md`.
3. O Copilot lê o Core e aplica as regras universais.
4. Para a execução: `scripts/orquestrador.js` gera o plano (MODEL_DRIVEN); o Copilot
   invoca os subagentes selecionados via `runSubagent`, consolida os resultados e envia
   ao `Revisor Final`.
5. Os subagentes (`Auditor SEO`, `Nova Calculadora`, etc.) e hooks (`scripts/hooks/*.ps1`)
   continuam sendo os executores; o Core só orienta a orquestração.

## Nota de ambiente
O `orquestrar.prompt.md` **referencia** o Core (não contém cópia integral). Qualquer
alteração nas regras de orquestração deve ser feita **somente** no `PROMPT_CORE.md`.

## Regras de integridade
- NÃO copiar as 16 seções do Core para o prompt ou para `copilot-instructions.md`.
- NÃO criar hooks/agentes novos para o Copilot — reutilizar os existentes.
