---
description: "Use when: criar, editar ou revisar páginas HTML do site — calculadoras, escalas, guias, simulados e páginas de conteúdo. Cobre largura de página, hero card, ordem do head, SEO/hreflang, CLS e footer modular (raiz vs idiomas)."
applyTo: "**/*.html"
---
# Padrão de HTML — Calculadoras de Enfermagem

Regras completas: `AI_RULES.md` (prioridade máxima), `HTML_RULES.md`, `HTML_PAGE_TEMPLATE_RULES.md`.
Catálogos: `CATALOGO_DA_ARQUITETURA_ESTRUTURAL/`, `CATALOGO_DE_ESTRUTURA_FISICA/`,
`CATALOGO_DE_IDENTIDADE_VISUAL/`, `CATALOGO_SEO_METAS_HEAD/`.

## Largura da página (obrigatório)
- Ocupar toda a viewport, mantendo apenas os paddings laterais (`p-4 sm:p-8` no `<main>`).
- NUNCA usar `container`, `max-w-5xl/6xl/7xl` nem `mx-auto` no container principal.

## Hero card (obrigatório)
- `width:100%`; altura compacta; alinhado à esquerda.
- Gradiente azul institucional (`#1A3E74 → #1E4D8C → #163269`), glassmorphism discreto.
- Hierarquia: Eyebrow → H1 → H2 (nunca inverter).
- NUNCA aplicar `max-w-*`/`mx-auto` no hero.

### Barra de ações compactas (obrigatório ao criar páginas novas)
- Imediatamente após o hero card H1 deve existir uma barra de ações compactas (layout idêntico ao de `integracoes_escala_de_fugulin.html`) com os botões: "Favoritar", "Compartilhar", "Imprimir", "Reportar correção", "Ver resultado", "Ir para a calculadora", "Diagnósticos NANDA", "Recursos sobre a escala/calculadora", "Evidências".
- Requisitos da barra: responsiva, acessível (atributos ARIA, labels, titles, foco visível), ícones claros, e reutilizar componentes/modulares existentes quando possível.
- Implementação: o agente (ou desenvolvedor) deve inserir o markup padrão ao criar páginas novas; IDs e classes devem seguir o padrão do projeto para que scripts (favoritos, compartilhar, imprimir, PDF, relatórios) funcionem sem alterações manuais.
- No mobile a barra pode colapsar em um menu dropdown ou carrossel horizontal, mantendo todas as ações acessíveis.

### Referências bibliográficas (formato e estilo)
- A seção de referências bibliográficas deve aparecer ao final do conteúdo e seguir o padrão de `integracoes_escala_de_fugulin.html`:
  - Formatação: normas ABNT (autor — título — fonte), alinhadas à esquerda, fonte pequena (`text-sm`), espaçamento compacto.
  - Cada item deve incluir link ao final quando disponível (abreviação "Disponível em: <url>").
  - Utilizar o mesmo markup e classes do modelo para garantir consistência visual e compatibilidade com impressão/PDF.
- O agente deve montar a lista de referências a partir das fontes usadas (PDFs anexos, artigos citados, URLs) e inserir a seção já formatada ao gerar a página.

## Ordem do `<head>` (verificar SEMPRE ao atualizar/criar)
Seguir a sequência hierárquica de `fugulin.html` / `HTML_PAGE_TEMPLATE_RULES.md`, sem pular:
charset/viewport → DNS/preconnect → title/metas → critical fonts (MINIFICADA, antes do CSS) →
CSS → preload das fontes locais → canonical/hreflang → favicon → Schema.org (URLs apontando
para a própria página) → styles → preload IconTopBar → anti-CLS placeholders → scripts
(`global-scripts.js`, `lang-selector.js`) com `defer` antes do `</head>` → anti-CLS acessibilidade.
- Conferir se não falta nenhum elemento; se faltar, adicionar no local correto.
- SEO/metadados dentro do limite de caracteres (title ≈ 60, description ≈ 155-160).
- Garantir Open Graph (og:title/description/url/image/site_name), Twitter Card, favicon, theme-color.
- Caminhos absolutos (`/...`) para todos os modulares e assets, EXCETO o footer dos 18 idiomas
  (`fetch("footer.html")` relativo, com bloco de footer próprio da pasta).

## Footer (diferenciado por contexto)
- Páginas da raiz (pt-BR): `fetch("/footer.html")` + `carregarTraducoes("pt", "footer.json")` e `cookies.json`.
- Páginas das pastas de idioma (`en/`, `es/`, ... 18 idiomas): `fetch("footer.html")` (relativo → footer
  localizado da própria pasta). NUNCA usar `fetch("/footer.html")` nelas.
- Assets nas pastas de idioma: usar caminhos absolutos (`/fonts/...`, `/public/output.css`, etc.).

## Proibido alterar (sem autorização)
- Pastas: `downloads`, `biblioteca`, `blog`, `blog-templates`, `node_modules`, `.git`.
- Arquivos: `footer.html`, `menu-global.html`, `global-body-elements.html`, `downloads.html`,
  `_language_selector.html`, `googlefc0a17cdd552164b.html`.

## Impressão e PDF — REGRA ABSOLUTA (seguir sempre, sem precisar de aviso)
- Escalas e calculadoras: modelo de `fugulin.html` — botão `btnGerarPDF` (jsPDF via
  `jspdf.umd.min.js` + `jspdf-autotable`, usando `window.jspdf.jsPDF`) e botão `btnImprimir`
  (`imprimirLaudo()` com HTML standalone em nova janela + `window.print()`).
- Páginas educativas de textos e artigos: modelo de `integracoes_classificacao_wifi.html` —
  somente `btnImprimir` com `imprimirLaudo()` que captura `.article-content` (ou o container
  de conteúdo equivalente, ex.: `.guide`) e gera HTML standalone + `window.print()`.
  NÃO usar jsPDF/`btnGerarPDF` nesse tipo de página.
- Ao modernizar uma página (trocar de versão): SEMPRE apagar as configurações antigas de
  impressão/PDF (funções, botões e styles) e reescrever do zero seguindo o modelo correto
  (`fugulin.html` para escalas/calculadoras; `integracoes_classificacao_wifi.html` para
  textos/artigos).
- Ao criar página nova: escrever o código de impressão/PDF já seguindo o modelo referenciado.

## Sidebar à direita
Ao atualizar uma página (versão nova) que tenha sidebar à direita, EXCLUIR a sidebar e
transferir as Referências Bibliográficas dela para o final da página.

## Minificação
Autorizado minificar o HTML quando possível, evitando arquivos com centenas/milhares de linhas.

## Verificação final (sempre após atualizar/criar)
Conferir se o conteúdo está correto e segue Core Web Vitals (CLS, LCP), responsividade mobile
máxima e acessibilidade (skip-link, alt, aria, focus-visible, contraste).

## Página nova (mapa do site e menu)
Ao criar página nova, seguir o procedimento obrigatório abaixo (regra do projeto):

- Sempre inserir uma entrada em `relatorio_paginas.txt` seguindo o padrão existente (arquivo = título = url). Este arquivo é a fonte canônica usada para gerar dinamicamente `mapa-do-site.html`.
- É terminantemente proibido adicionar links manualmente em `mapa-do-site.html`. Se for encontrada uma inclusão manual, o agente/operador deve removê-la e garantir que a entrada exista em `relatorio_paginas.txt`.
- Após atualizar `relatorio_paginas.txt`, executar o build necessário (ex.: Tailwind rebuild e `node gerar-sw.js`) para que o site sirva a versão atualizada.
- Perguntar ao desenvolvedor em qual caminho do `menu-global.html` a página deve entrar; depois incluir no menu global (desktop) e no menu off-canvas (mobile) conforme orientação.

Observação: sempre criar backup em `backups-temporarios/` antes de editar `relatorio_paginas.txt` ou templates do mapa; não executar `git commit`/`git push` automaticamente — preparar alterações e avisar o responsável para commit/push.

## Sempre preservar
- SEO, acessibilidade (skip-link, aria, focus-visible), responsividade, modularização, desempenho (CLS/CWV).
- Seção de Referências Bibliográficas ao final (padrão `HTML_PAGE_TEMPLATE_RULES.md`).
- Modelos de referência: `fugulin.html`, `mapa-do-site.html`, `perroca.html`, `dimensionamento.html`,
  `centro-cirurgico.html`, `guia_rapido_dispositivos.html`, `meem.html`, `integracoes_classificacao_wifi.html`.
