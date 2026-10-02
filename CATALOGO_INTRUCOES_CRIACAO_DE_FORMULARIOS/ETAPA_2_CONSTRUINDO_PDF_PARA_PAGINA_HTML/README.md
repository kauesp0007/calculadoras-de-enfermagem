# Etapa 2 — Construção das Páginas HTML de Visualização de PDF (100%)

Esta pasta contém o manual técnico, especificações canônicas, templates e scripts automatizados para a **Etapa 2**: a conversão/hospedagem de formulários hospitalares em PDF em **páginas HTML completas, responsivas e visualmente padronizadas**, exibindo o documento PDF original aberto em tamanho 100% com moldura A4 e botão de download em vidro azul.

---

## 🎯 Objetivo Desta Etapa

Após gerar os formulários em formato PDF nativo de 1 página (Etapa 1), o ecossistema do portal **Calculadoras de Enfermagem** exige que cada formulário possua sua própria **página web canônica indexável** (ex: `formulario_escala_de_aldrete.html`).

Essa página cumpre 4 funções vitais:
1. **SEO e Descoberta Orgânica:** Ranqueia no Google para termos como *"Formulário da Escala [Nome] para imprimir"*, *"Ficha de [Nome] em PDF"*, *"Avaliação de [Nome] folha A4"*.
2. **Visualizador Aberto 100% Responsivo:** O usuário visualiza o PDF instantaneamente dentro da página sem precisar baixar ou abrir aplicativo externo, graças a um container `aspect-ratio: 210/297`.
3. **Download Direto com Botão em Vidro Azul (`.btn-download-glass`):** Permite baixar o arquivo original com um clique para impressão ou preenchimento digital.
4. **Respaldo Editorial, Governança e Rentabilização:** Apresenta notas de transparência, referências bibliográficas ABNT/Vancouver e blocos de anúncios multiplex otimizados para não afetar Core Web Vitals.

---

## 📂 Arquivos Deste Módulo

| Arquivo | Descrição |
|---|---|
| [`MANUAL_PAGINA_HTML_VISUALIZADOR_PDF_100.md`](./MANUAL_PAGINA_HTML_VISUALIZADOR_PDF_100.md) | Manual mestre com anatomia completa do Head canônico (23 itens em ordem estrita), CSS institucional, layout do Body, integração de menus e build. |
| [`TEMPLATE_PAGINA_FORMULARIO_CANONICA.html`](./TEMPLATE_PAGINA_FORMULARIO_CANONICA.html) | Arquivo modelo HTML completo e validado, pronto para ser copiado ou parametrizado para qualquer nova escala. |
| [`GERADOR_PAGINAS_HTML_FORMULARIOS.py`](./GERADOR_PAGINAS_HTML_FORMULARIOS.py) | Script em Python para geração autônoma em lote ou individual de páginas HTML a partir dos metadados e arquivos PDF. |
| [`VALIDADOR_PAGINAS_HTML_FORMULARIOS.py`](./VALIDADOR_PAGINAS_HTML_FORMULARIOS.py) | Script de auditoria determinística que checa Head, Canonical, Hreflang, Schema.org, iFrame do PDF, Botão Download e conformidade visual. |

---

## 🏛️ Regras Canônicas Impositivas da Etapa 2

1. **Modelo Visual Mandatório:** A página DEVE replicar o padrão de `formulario_de_fugulin.html` e `formulario_escala_de_downton.html`.
2. **Ordem Rígida do Head:** Charset ➔ Viewport ➔ DNS preconnects ➔ Title & Metas SEO ➔ Critical Fonts Inline ➔ CSS ➔ Preload de Fontes ➔ Canonical & Hreflang ➔ Favicon ➔ Schema.org JSON-LD ➔ Styles da Página ➔ Anti-CLS Placeholders ➔ Scripts defer.
3. **Container do PDF 100%:** A visualização do PDF DEVE usar `.pdf-frame-wrap` com proporção exata A4 (`aspect-ratio: 210/297`), borda de 1px `#CBD5E1`, cantos arredondados de 14px e sombra suave.
4. **Botão de Download em Vidro:** Estilizado com gradiente azul translúcido, reflexo superior e efeito glassmorphic (`backdrop-filter: blur(8px)`).
5. **Zero Deslocamento de Layout (CLS = 0):** Placeholders estáticos com alturas mínimas reservadas para o header (`96px`), language-selector (`46px`), anúncios (`min-height: 220px`) e footer (`520px`/`277px`).
6. **Registro Obrigatório:** Toda página criada DEVE ser registrada em `relatorio_paginas.txt` e incluída no submenu de `menu-global.html`.
