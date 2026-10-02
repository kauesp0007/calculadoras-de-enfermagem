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

## Sistema de contas/Premium — contexto persistente do projeto

Para tarefas de login, assinatura, pagamentos, conteúdo Premium, botões protegidos, download, impressão/Salvar como PDF, anúncios por plano ou páginas novas, o DeepSeek DEVE carregar:

- `SISTEMA_DE_LOGIN_DO_SITE/CATALOGO_CANONICO_SISTEMA_DE_CONTAS.md` — única fonte documental do método;
- `SISTEMA_DE_LOGIN_DO_SITE/INVENTARIO_ROTAS_VIGENTES.md` — snapshot dinâmico;
- `SISTEMA_DE_LOGIN_DO_SITE/PROTOCOLO_DECISOES_DO_DESENVOLVEDOR.md` — precedência das decisões administrativas.

Não memorizar uma lista estática de páginas Free/Premium, não copiar o método para este adapter e não criar gate/Auth paralelo. A “memória” persistente disponível ao DeepSeek neste projeto é o próprio conjunto de arquivos versionados; em cada sessão relevante, ele deve reler essas fontes.

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
