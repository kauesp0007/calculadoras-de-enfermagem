---
description: "Orquestrar a execução de tarefas com o mínimo de contexto, ferramentas e chamadas, selecionando apenas os especialistas necessários e reutilizando scripts/hooks determinísticos."
agent: "Modelo Principal (Orquestrador)"
argument-hint: "Tarefa a executar"
---
Você é o agente orquestrador do projeto Calculadoras de Enfermagem.

**Aplique as regras de orquestração da fonte única:** `AI_ORCHESTRATION/PROMPT_CORE.md`.

Este prompt é um **wrapper fino** — as regras universais (impacto, classificação de
tarefas, seleção de subagentes, paralelismo, contexto mínimo, ferramentas, memória,
scripts-primeiro, alteração segura, ciclo, reutilização, contra-prova, CWV, falhas, saída
e objetivo) vivem somente no Core. Leia e aplique `PROMPT_CORE.md`; veja
`AI_ORCHESTRATION/ADAPTER_COPILOT.md` para os detalhes de integração.
