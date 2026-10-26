# Correção dos submenus laterais de Conteúdos — 26/10/2026

Base: `6e6bfff7cf48727b43f365d7122da45d1f6c418d` (PR #162).

## Causa comprovada

O posicionamento por viewport acrescentado no PR #162 marcava os painéis laterais com `.menu-flyout-viewport`. Duas regras antigas para `nth-child(n+4)` e `nth-child(n+5)`, de maior especificidade, ainda impunham `left:auto!important;right:100%!important`. Com position fixed, o submenu saía completamente da tela. No site público, o primeiro submenu de Conteúdos foi medido em x=-320px, largura320px, right1363px, viewport1363px. O painel primário e seus itens continuam no documento; o defeito confirmado é o posicionamento dos painéis laterais. O modal externo de apoio/monetização que interrompeu a interação é separado e não foi alterado.

## Mudança

Excluídos `.menu-flyout-viewport` das duas regras antigas nos19 menu-global.html (raiz+18 idiomas). Preservado o fallback de alinhamento para os painéis ainda não inicializados. A regra de posicionamento calculada pelo JS passa a governar left/right. Nenhum link, texto, tradução, handler, política de conta, rolagem ou estrutura mobile foi alterado.

## Validação

- Backup antes da edição em backups-temporarios/20261026-menu-conteudos (não publicado).
- Teste dos19 arquivos confirmou somente38 substituições de seletor; demais bytes idênticos aos backups, incluindo finais de linha.
- Revisão independente confirmou causa, especificidade e preservação dos arquivos.
- node --check global-scripts.js aprovado; código JavaScript permanece inalterado.
- git diff --check aprovado com cr-at-eol, respeitando CRLF existente.
- Teste de conta local teve estrutura aprovada, mas teste dependente de jsdom não pôde rodar por falta de dependências locais; build e verificações integradas são acompanhados no CI/deploy do PR associado.
- Verificação de geometria do CSS publicado após o deploy registrada no PR associado.
