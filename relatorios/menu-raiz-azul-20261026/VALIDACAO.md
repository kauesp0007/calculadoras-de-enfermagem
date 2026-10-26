# Menu da raiz — tema azul e barra de 75 px

## Escopo e preservação

Somente o fragmento `menu-global.html` da raiz recebe tema exclusivo via classe `global-menu-root` e estilo incorporado. CSS/JS compartilhados e os 18 menus de idiomas não foram editados. Foram preservados disposição, logo quadrado de 60 px, espaçamento de 4 cm no desktop, conta e seus controles de autenticação.

Backup criado antes da edição: `backups-temporarios/menu-raiz-azul-20261026/menu-global.html`. SHA-256: `5f43d211257aaac1d1f55ac7f3d3b5779ec9ed21305a3180bfcde84e81d429ee`. Cópia remota independente: branch `backup/menu-raiz-antes-azul-20261026`, commit `d012fe64f9f1a2889ad1d6251214573b8a82cfe8`.

Para reverter, restaurar somente esse fragmento a partir do backup e passar pelo fluxo normal de publicação; não reverter a branch inteira, para preservar alterações posteriores de outras páginas.

## Comportamento

- Barra de 75 px em gradiente institucional #1E4D8C/#1A3E74, branco nos links horizontais, 14–16 px (antes 12 px).
- Painéis brancos, texto azul de 14 px, foco visível e transições discretas de 280 ms, atraso de abertura de 120 ms e tolerância no fechamento.
- Reserva de altura limitada ao fragmento raiz: 111 px desktop (acessibilidade + menu), 75 px mobile.
- Telas altas: flyouts no topo do painel pai; folhas extensas têm rolagem.
- Janelas até 850 px de altura: níveis internos expandem dentro do painel rolável para evitar cortes laterais/inferiores. Nesse modo a mudança do fluxo interno usa display, sem fade de fechamento.
- Movimento reduzido respeitado. Comportamento de conta existente preservado.

## Evidências e limitações

- PASS: revisão independente de integridade. Removendo somente o estilo novo e a classe, todo o markup é byte-idêntico ao backup. 491 hrefs, 31 SVGs, imagem, textos e 33 IDs originais preservados.
- PASS_STATIC: auditoria de ecossistema e conformidade técnica. Conflito de especificidade de :not(#id) detectado e corrigido com :not(:where(#id)); fallback revalidado.
- PASS: diff sem problemas de whitespace com configuração CRLF correta.
- PASS parcial: primeiro estágio de scripts/test-account-pages.js; suite completa interrompida por jsdom ausente no ambiente local.
- ERROR local: Tailwind indisponível (node_modules/tailwindcss/lib/cli.js ausente). Nenhuma dependência instalada. Tema usa CSS literal, sem depender de novas utilities.
- PASS: geração local de SW e verificação de sintaxe; o arquivo gerado localmente não faz parte desta alteração.
- CWV dry-run: mesmo aviso baixo de body.font-sans no fragmento e no backup; nenhuma regressão apontada. Métricas CWV reais NOT_MEASURED.
- Browser local NOT_MEASURED: Playwright disponível, executável do navegador ausente. Matriz estática revisada: larguras 375/1280/1366/1920 e alturas 600/768/1080. Isso não substitui renderização real.

## Orquestração

Plano MODEL_DRIVEN `task-02e3066a3c0a`: Auditor do Ecossistema, Auditor de Conformidade Técnica, Revisor de Integridade, Testador no Navegador e Revisor Final selecionados e executados; Build executado adicionalmente por exigência explícita de AGENTS.md. Contra-prova independente executada. Nenhuma métrica ou teste visual foi inventado.
