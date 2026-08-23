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

4.a Regra obrigatória (padrão do agente): ao publicar/registrar uma nova página, NUNCA adicionar o link diretamente em `mapa-do-site.html`. Sempre inserir uma linha no arquivo `relatorio_paginas.txt` seguindo o padrão existente (arquivo = título = url). O agente/rotina deve verificar e, se encontrar inserção manual em `mapa-do-site.html`, removê-la ou alertar para remoção antes de publicar. Também criar entradas correspondentes para outras línguas quando aplicável.

5. Verifique largura da página e hero card (viewport total, hero 100%, Eyebrow → H1 → H2).
6. Confirme que impressão/PDF segue o modelo `meem.html` (`btnGerarPDF` jsPDF + `btnImprimir`).
7. O build (service worker) é executado automaticamente por hook; se não ocorrer, rode:
   `.\node_modules\.bin\tailwindcss -i ./src/input.css -o ./public/output.css --minify ; node gerar-sw.js`
8. Valide no navegador (agente "Testador no Navegador") e audite acessibilidade
   (skill "auditar-acessibilidade").

Observações de processo:
- Sempre criar backup (`backups-temporarios/`) antes de editar `relatorio_paginas.txt` ou qualquer template do mapa.
- Não executar `git commit` ou `git push` — preparar as alterações localmente e avisar o responsável para commit/push.
- Ao finalizar, garantir que `relatorio_paginas.txt` contenha a nova entrada e que `mapa-do-site.html` seja gerado dinamicamente a partir deste arquivo (não conterá inclusões manuais redundantes).
