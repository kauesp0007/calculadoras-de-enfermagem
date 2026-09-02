---
description: "Use when: criar ou revisar uma pagina HTML cujo conteudo principal e um formulario PDF original incorporado para visualizacao e download."
applyTo: "**/*.html"
---
# Padrao Declarativo PDF_FORM_PAGE

Esta instruction se aplica somente a paginas que declaram:

```html
<meta name="page-type" content="PDF_FORM_PAGE">
```

## Contrato de parametros

A pagina deve declarar os parametros no proprio documento, sem codificar valores de uma execucao nesta regra:

```html
<meta name="pdf-form-source" content="/<CAMINHO_DO_PDF>">
<meta name="pdf-form-download" content="/<CAMINHO_DO_PDF>">
<meta name="pdf-form-scale-name" content="<NOME_DA_ESCALA>">
```

`pdf-form-source` e `pdf-form-download` devem ter o mesmo caminho absoluto. O documento de origem deve existir, ser preservado sem alteracoes e ser exibido diretamente; nunca converta, reconstrua ou substitua o PDF por um formulario HTML.

## Estrutura obrigatoria

- Siga `AI_RULES.md`, `HTML_RULES.md`, `HTML_PAGE_TEMPLATE_RULES.md` e `html.instructions.md`.
- Use a estrutura global, breadcrumb, hero compacto, barra de acoes, publicidade e footer do projeto.
- O hero deve conter eyebrow, H1 e H2 nessa ordem; o H1 identifica o formulario da escala indicada em `pdf-form-scale-name`.
- Inclua um card explicativo curto, um card do formulario, uma secao de referencias e a nota de transparencia editorial obrigatoria.
- A barra de acoes deve expor Favoritar, Compartilhar, Imprimir, Reportar correcao, Ver resultado, Ir para a calculadora, Diagnosticos NANDA, Recursos sobre a escala/calculadora e Evidencias. Links sem destino confirmado devem apontar para uma ancora local relevante, nao para uma URL inventada.

## Visualizacao e download

- Apresente o PDF em `iframe` com `title` acessivel, `loading="lazy"`, `width:100%`, `border:0` e area com `aspect-ratio:210/297` quando o documento for A4 vertical.
- Preserve proporcao, previna overflow horizontal e reserve a area antes do carregamento para evitar CLS.
- Disponibilize download com atributo `download`, nome acessivel e o mesmo URL do iframe.
- A acao Imprimir deve abrir o PDF original em uma nova janela; nao gere um PDF novo.

## SEO e validacao

- Canonical, Open Graph, Twitter e Schema.org devem apontar para a propria pagina; hreflang so deve declarar variantes existentes.
- Use JSON-LD valido e coerente com uma pagina de documento/formulario; nao reutilize metadados de outra escala.
- Antes de concluir, valide o caminho do PDF, links, head, acessibilidade, layout, governanca, registro em `relatorio_paginas.txt`, responsividade e carregamento no navegador.
- Nao altere o PDF, `menu-global.html` ou arquivos protegidos sem autorizacao explicita.
