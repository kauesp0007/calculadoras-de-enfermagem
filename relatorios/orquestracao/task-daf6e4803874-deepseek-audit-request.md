# Solicitação de auditoria externa — DeepSeek

Status do conector nesta sessão do Codex: `UNAVAILABLE_AT_RUNTIME`.

## Objetivo

Auditar a ampliação em alemão da página sobre o ICN-Ethikkodex, verificando fidelidade ao PDF oficial, governança clínica, estrutura HTML, acessibilidade, navegação e registro no ecossistema.

## Fontes e arquivos

- `AI_ORCHESTRATION/PROMPT_CORE.md`
- `AI_ORCHESTRATION/ADAPTER_DEEPSEEK.md`
- `docs/ICN_Code-of-Ethics_DE_WEB.pdf`
- `de/der_icn-ethikkodex_fur_pflegefachpersonen.html`
- `de/menu-global.html`
- `relatorio_paginas.txt`
- `relatorios/orquestracao/task-daf6e4803874.json`

## Verificações obrigatórias

1. Confirmar que os 38 leitsätze, de 1.1 a 4.8, aparecem uma vez e estão fielmente parafraseados.
2. Confirmar que o documento é apresentado como código internacional do ICN em edição alemã, não como lei exclusiva da Alemanha.
3. Conferir as quatro responsabilidades fundamentais, os três grupos das tabelas de aplicação, os valores profissionais e o glossário.
4. Verificar ausência de orientação clínica ou jurídica inventada.
5. Validar alemão, UTF-8, semântica, teclado, impressão, busca, responsividade e ausência de overflow.
6. Confirmar canonical, Open Graph e Schema.org com URL `/de/` e `fetch("footer.html")` relativo.
7. Confirmar exatamente duas entradas no `de/menu-global.html` — desktop e móvel — e nenhuma entrada em menus de outros idiomas.
8. Confirmar uma única entrada `de/der_icn-ethikkodex_fur_pflegefachpersonen.html` em `relatorio_paginas.txt`.
9. Manter a publicação bloqueada sem revisão documentada por profissional de enfermagem habilitado.

## Formato de resposta

Retornar: `status`, `findings`, `correctionsRequired`, `evidence` e decisão final `PUBLICAR`, `PUBLICAR_COM_RESSALVAS` ou `NAO_PUBLICAR`.

