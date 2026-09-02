# ADAPTER — OpenAI / Codex

> Adaptador de **carregamento e aplicação** do `PROMPT_CORE.md` no ambiente OpenAI/Codex.
> Este arquivo **não** duplica as regras do Core — apenas define onde o Core vive e como
> o Codex deve consumi-lo.

## Onde o Core vive
`AI_ORCHESTRATION/PROMPT_CORE.md` (fonte única das regras universais).

## Ponto de integração do Codex
O Codex lê `AGENTS.md` (raiz do repositório) como arquivo de instruções. A integração
consiste em referenciar o Core a partir de `AGENTS.md`, sem copiar o conteúdo.

## Como o Codex aplica o Core
1. Ao iniciar, o Codex já carrega `AGENTS.md`.
2. `AGENTS.md` contém (ou deve conter) uma linha apontando para
   `AI_ORCHESTRATION/PROMPT_CORE.md` como o prompt de orquestração.
3. Para tarefas de orquestração, o Codex lê o Core e aplica as regras universais.
4. Subagentes do Codex (`.codex/agents/*.toml`) permanecem os executores especializados;
   o Core apenas orienta a seleção, o paralelismo e o contexto mínimo.

## Nota de ambiente
Este repositório hoje **não materializa** a pasta `.codex/`; o único ponto de entrada do
Codex é `AGENTS.md`. Portanto, a integração se limita à referência no `AGENTS.md` — não
criar `.codex/` salvo necessidade comprovada.

## Regras de integridade
- NÃO copiar as 16 seções do Core para `AGENTS.md` (referenciar, não duplicar).
- NÃO criar agentes `.codex/*.toml` se os agentes existentes já cobrirem a função.
- Preservar a paridade Copilot × Codex já documentada em `AGENTS.md`.
