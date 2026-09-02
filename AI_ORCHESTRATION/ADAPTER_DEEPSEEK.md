# ADAPTER — DeepSeek (no VS Code)

> Adaptador de **carregamento e aplicação** do `PROMPT_CORE.md` no ambiente DeepSeek
> executado dentro do VS Code. Este arquivo **não** duplica as regras do Core.

## Onde o Core vive
`AI_ORCHESTRATION/PROMPT_CORE.md` (fonte única das regras universais).

## Ponto de integração do DeepSeek
O DeepSeek roda no mesmo ambiente de editor do VS Code (este repositório). Ele consome os
**mesmos mecanismos de instrução** já existentes — sem presumir uma API ou formato
inexistente:
- `.github/copilot-instructions.md` (regras gerais do projeto);
- `.github/instructions/*.instructions.md` (regras por extensão via `applyTo`);
- `.github/prompts/*.prompt.md` (comandos de barra).

## Como o DeepSeek aplica o Core
1. O Core é um documento Markdown em `AI_ORCHESTRATION/PROMPT_CORE.md`.
2. Ao orquestrar uma tarefa, o DeepSeek lê o Core (sob demanda) e aplica as regras
   universais de seleção de especialistas, paralelismo, contexto mínimo e scripts-primeiro.
3. Os subagentes/scripts do projeto (`scripts/`, `scripts/hooks/`) permanecem os executores;
   o Core só orienta a orquestração.

## Nota de ambiente
Não há "API do DeepSeek" própria no repositório. A integração é **por arquivo**: o Core é
carregado como instrução/prompt quando a orquestração é solicitada. Não criar formato
específico de prompt de DeepSeek sem necessidade.

## Regras de integridade
- NÃO copiar as 16 seções do Core para outros arquivos.
- NÃO criar hooks/agentes novos só para o DeepSeek — reutilizar os existentes.
