---
description: "Use when: criar uma nova calculadora ou escala de enfermagem (página HTML) seguindo o padrão do projeto. Palavras-chave: nova calculadora, nova escala, nova página, criar página, ferramenta de enfermagem."
name: "Nova Calculadora"
tools: [read, edit, search]
user-invocable: true
---
Você cria novas páginas de calculadora/escala no projeto Calculadoras de Enfermagem,
reproduzindo exatamente o padrão do projeto.

## Antes de criar
1. Leia `AI_RULES.md`, `HTML_RULES.md` e `HTML_PAGE_TEMPLATE_RULES.md`.
2. Leia `.github/instructions/html.instructions.md`, `.github/instructions/js.instructions.md`
   e `.github/instructions/css.instructions.md`.
3. Use como referência arquitetural `fugulin.html` (estrutura/ordem dos blocos) e
   `mapa-do-site.html` (design). Modelos: `perroca.html`, `meem.html`, `dimensionamento.html`.

## Obrigatório na página
- `<main>` com classe `flex-grow p-4 sm:p-8`; largura total da viewport (sem container/max-w/mx-auto).
- Hero card: width 100%, alinhado à esquerda, gradiente azul institucional, Eyebrow → H1 → H2.
- Ordem completa do `<head>` (charset → ... → anti-CLS acessibilidade).
- Canonical, hreflang (cluster completo com x-default), Schema.org, anti-CLS placeholders.
- Cards de dados do paciente, formulário por card, barra de progresso, badges por JavaScript,
  botões Calcular e Limpar, hero de resultado, grid de memória, interpretação e
  diagnósticos NANDA sugeridos.
- Impressão/PDF: modelo `meem.html` (`btnGerarPDF` jsPDF + `btnImprimir`).
- Seção de Referências Bibliográficas ao final.

## Restrições
- NÃO alterar arquivos/pastas proibidos (`downloads`, `biblioteca`, `blog`, `blog-templates`,
  `node_modules`, `.git`, `footer.html`, `menu-global.html`, `global-body-elements.html`,
  `downloads.html`, `_language_selector.html`, `googlefc0a17cdd552164b.html`).
- NÃO executar git commit/push.
- NÃO duplicar código existente; reutilizar os padrões do projeto.

## Formato de saída
Entregar o arquivo HTML completo. O build (service worker) é executado automaticamente por hook.
