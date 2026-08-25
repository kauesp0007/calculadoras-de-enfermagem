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

## Impressão e PDF (regra absoluta — seguir sempre, sem precisar de aviso)

- **Escalas e calculadoras**: usar o modelo de `fugulin.html` — botão `btnGerarPDF`
  (jsPDF via `jspdf.umd.min.js` + `jspdf-autotable`, usando `window.jspdf.jsPDF`) e
  botão `btnImprimir` (`imprimirLaudo()` com HTML standalone em nova janela + `window.print()`).
- **Páginas educativas de textos e artigos**: usar o modelo de
  `integracoes_classificacao_wifi.html` — somente `btnImprimir` com `imprimirLaudo()`
  que captura `.article-content` (ou container equivalente, ex.: `.guide`) e gera HTML
  standalone + `window.print()`. NÃO usar jsPDF/`btnGerarPDF` nesse tipo de página.
- **Ao modernizar uma página**: apagar as configurações antigas de impressão/PDF
  (funções, botões e styles) e reescrever do zero seguindo o modelo correto.
- **Ao criar página nova**: escrever o código de impressão/PDF já seguindo o modelo referenciado.

## Atualização e criação de páginas HTML (seguir sempre)

- **Sidebar à direita**: ao atualizar uma página (versão nova) que tenha sidebar, EXCLUIR a
  sidebar e transferir as Referências Bibliográficas dela para o final da página.
- **Head (ordem padrão)**: verificar a sequência hierárquica — charset/viewport → DNS/preconnect →
  title/metas → critical fonts (minificada, antes do CSS) → CSS → preload das fontes locais →
  canonical/hreflang → favicon → Schema.org (URLs referenciando a própria página) → styles →
  preload IconTopBar → anti-CLS placeholders → scripts (global-scripts.js, lang-selector.js) com
  `defer` antes do fechamento do `</head>`. Faltou algum? Adicionar no local correto.
- **SEO/metadados**: respeitar limites de caracteres (title ~60, description ~155-160); garantir
  Open Graph (og:title/description/url/image/site_name), Twitter Card, favicon, theme-color.
- **Caminhos**: todos os modulares e assets em caminho absoluto (`/...`), EXCETO o footer das
  páginas dos 18 idiomas, que usam `fetch("footer.html")` relativo (bloco de footer próprio da pasta).
- **Minificação**: autorizado minificar o HTML quando possível, para não gerar arquivos com
  centenas/milhares de linhas.
- **Verificação final**: após atualizar/criar, conferir se o conteúdo está correto e seguindo
  Core Web Vitals, responsividade mobile máxima e acessibilidade (skip-link, alt, aria, focus).
- **Página nova**: incluí-la em `relatorio_paginas.txt` (fonte canônica — o `mapa-do-site.html`
  é gerado dinamicamente a partir dele; NUNCA editar o mapa manualmente) e PERGUNTAR ao
  desenvolvedor em qual caminho do `menu-global.html` incluir a nova página; depois incluir
  no menu global (desktop) e no menu off-canvas (mobile).
- **Menu por idioma**: cada pasta de idioma (`en/`, `es/`, ...) tem o seu próprio
  `menu-global.html`. Ao criar/registrar página nova, o submenu deve ser adicionado ao
  `menu-global.html` da raiz (pt-BR, caminhos absolutos `/...`) E ao `menu-global.html` de
  cada um dos 18 idiomas (rótulos traduzidos, caminhos RELATIVOS, ex.: `pagina.html` sem `/`).

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
