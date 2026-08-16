---
name: publicar-calculadora
description: 'Criar e publicar uma nova calculadora/escala de enfermagem seguindo o padrão do projeto (fugulin.html + HTML_PAGE_TEMPLATE_RULES). Use para criar novas ferramentas. Palavras-chave: nova calculadora, publicar, criar página, escala, ferramenta, checklist, padrão fugulin.'
argument-hint: 'Nome e descrição da nova calculadora/escala'
---

# Publicar Calculadora

## Quando usar
- Criar uma nova calculadora ou escala de enfermagem.

## Procedimento
1. Leia `AI_RULES.md`, `HTML_RULES.md`, `HTML_PAGE_TEMPLATE_RULES.md`.
2. Leia `.github/instructions/html.instructions.md` e o [checklist](./references/checklist.md).
3. Use `fugulin.html` como referência arquitetural e `meem.html`/`perroca.html` como modelos.
4. Crie o arquivo HTML completo seguindo o checklist.
5. Verifique largura da página e hero card (viewport total, hero 100%, Eyebrow → H1 → H2).
6. Confirme que impressão/PDF segue o modelo `meem.html` (`btnGerarPDF` jsPDF + `btnImprimir`).
7. O build (service worker) é executado automaticamente por hook; se não ocorrer, rode:
   `.\node_modules\.bin\tailwindcss -i ./src/input.css -o ./public/output.css --minify ; node gerar-sw.js`
8. Valide no navegador (agente "Testador no Navegador") e audite acessibilidade
   (skill "auditar-acessibilidade").
