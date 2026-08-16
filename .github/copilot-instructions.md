# Instruções do Copilot — Calculadoras de Enfermagem

Regras essenciais para qualquer tarefa neste repositório. As regras completas e
prioritárias estão em `AI_RULES.md` (prioridade máxima), `HTML_RULES.md` e
`HTML_PAGE_TEMPLATE_RULES.md`. Nenhuma instrução abaixo sobrescreve esses arquivos.

## Fontes de verdade (padrões do projeto)

- Regras: `AI_RULES.md`, `HTML_RULES.md`, `HTML_PAGE_TEMPLATE_RULES.md`.
- Arquitetura: `CATALOGO_DA_ARQUITETURA_ESTRUTURAL/`.
- Estrutura física e dependências: `CATALOGO_DE_ESTRUTURA_FISICA/`.
- Identidade visual / Design System: `CATALOGO_DE_IDENTIDADE_VISUAL/`.
- SEO e metas do head: `CATALOGO_SEO_METAS_HEAD/`.
- Modelos HTML de referência: `fugulin.html`, `mapa-do-site.html`, `perroca.html`,
  `dimensionamento.html`, `centro-cirurgico.html`, `guia_rapido_dispositivos.html`,
  `meem.html`, `integracoes_classificacao_wifi.html`.
- Largura das páginas: ocupar toda a viewport mantendo apenas os paddings laterais;
  NUNCA usar `container`, `max-w-5xl/6xl/7xl` nem `mx-auto` no container principal.
- Hero card: largura 100%, altura compacta, alinhado à esquerda, gradiente azul
  institucional, glassmorphism discreto, hierarquia Eyebrow → H1 → H2 (nunca
  inverter). NUNCA aplicar `max-w-*`/`mx-auto` no hero.

## Proibido alterar (sem autorização explícita)

- Pastas: `downloads`, `biblioteca`, `blog`, `blog-templates`, `node_modules`, `.git`.
- Arquivos: `footer.html`, `menu-global.html`, `global-body-elements.html`,
  `downloads.html`, `_language_selector.html`, `googlefc0a17cdd552164b.html`.

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
