# Instruções do Copilot — Calculadoras de Enfermagem

Regras essenciais para qualquer tarefa neste repositório. As regras completas e
prioritárias estão em `AI_RULES.md` (prioridade máxima), `HTML_RULES.md`,
`HTML_PAGE_TEMPLATE_RULES.md` e `PROMPT_MASTER.md`. Nenhuma instrução abaixo
sobrescreve esses arquivos.

## Antes de alterar qualquer arquivo

1. Leia `AI_RULES.md` e os arquivos de regras relacionados à tarefa.
2. Crie um backup temporário antes de editar:
   `backups-temporarios/<arquivo>.<YYYYMMDD-HHMMSS>.bak`

## Regras rígidas

- Nunca executar `git commit` ou `git push` — commit/push são responsabilidade do usuário.
- Não remover funcionalidades existentes sem autorização explícita.
- Preservar SEO, acessibilidade, responsividade, modularização e desempenho.
- Reutilizar código existente; evitar duplicação; manter o padrão do projeto.

## Build obrigatório (ao alterar HTML/CSS/JS do site)

Ao final de cada alteração que afeta o site, rodar:

```
.\node_modules\.bin\tailwindcss -i ./src/input.css -o ./public/output.css --minify
node gerar-sw.js
```

O `gerar-sw.js` gera um novo `CACHE_NAME` (com timestamp) a cada execução, e o
`sw.js` serve o HTML atualizado (network-first).

## Idioma

Responder em pt-BR.
