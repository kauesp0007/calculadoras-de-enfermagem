# Alinhamento do menu global — 26/10/2026

Pedido do desenvolvedor: ícone na esquerda; links agrupados à esquerda com distância do ícone; conta na direita; padronizar raiz e 18 idiomas.

## Alteração

- 19 fragmentos menu-global.html: mesmas classes estruturais, sem largura máxima centralizada nem margem negativa no logo.
- global-styles.css: espaçamento compartilhado; rótulos alinhados ao início; conta com margem automática na direita; avatar preservado em 40×40 e logo em 48×32.
- Direção física da barra preservada em árabe, mantendo leitura RTL dos textos.
- Drawer completo disponível até 1279px; na faixa 769–1279 inicia abaixo da barra de acessibilidade de 36px. Mobile reserva 60px, igual à barra.
- Biblioteca desktop turca acrescentada com tradução e destinos já existentes no menu mobile.

## Evidências

- Descoberta de Conhecimento: executada, knowledge-discover e catálogos de erros/soluções consultados. Nenhuma regra de conteúdo clínico afetada.
- Auditor do Ecossistema: CONSISTENTE.
- Integridade independente: 19/19 preservam todos os href/src/id/data-evento/data-submenu-toggle anteriores. Únicas adições de destinos: Biblioteca desktop TR.
- Conformidade técnica: diff limpo com `git -c core.whitespace=cr-at-eol diff --check`; CRLF original preservado em PT/EN/ES. Estrutura CSS balanceada, 385 blocos.
- Acessibilidade: alt existentes preservados; foco de teclado abre submenus de navegação; conta mantém seu controle de abertura existente. Nenhum JS de autenticação modificado.
- Performance: comparação cwv-core HEAD vs patch em PT/EN/TR sem novos avisos. Aviso body-font-sans idêntico é inaplicável a fragmentos sem body. Sem novas fontes, scripts ou requisições.
- CWV gate em dry-run: 50 páginas avaliadas, 48 WARNING/2 PASS; inclui documentos preexistentes fora do escopo e verificação de documento completo sobre fragmentos. Não representa medição runtime nem ausência de problemas do site.
- Build Tailwind: NÃO EXECUTADO COM SUCESSO — dependência ausente; nenhuma dependência instalada sem autorização.
- SW: geração local e sintaxe válidas, arquivo ignorado não incluído nesta alteração; deve ser gerado em checkout limpo pelo CI para excluir temporários locais.
- Navegador/overflow/CLS/interações reais: NOT_MEASURED. Chromium local indisponível; navegador remoto sem acesso ao servidor local. Não se declara validação visual concluída.

## Limitações preexistentes

IDs submenu-materiais-didaticos-sub duplicados em HI/ZH/JA/UK/AR, inalterados. Sem alteração em políticas Free/Premium, conteúdo clínico, rotas ou autenticação.

## Revisão

Auditoria independente: PUBLICAR_COM_RESSALVAS, com validação visual/build pendentes. Entrega em PR para revisão, sem publicar em produção.


## Ajuste solicitado em seguida — espaço de 4 cm e ícone maior

- Os 19 ícones passam a declarar width=70 / height=70 e classe global-menu-icon, sem os limites antigos de 48×32.
- Barra preservada em 60px. CSS contém a imagem em 70px de largura e até 56px de altura, com object-fit:contain: tamanho nominal 70×70, não tamanho visual quadrado de 70px. Mantém proporção e 2px livres acima/abaixo.
- Espaço desktop: gap:4cm entre a caixa do logo e a navegação (aproximadamente 151,18 CSSpx; medida física depende da tela/zoom).
- Bordas: padding horizontal de 12px; conta com margin-left:auto e avatar de 40px preservados.
- Até 1279px, links continuam no drawer e o gap reduz para 16px, sem impor espaçador de 4cm no celular.
- Conferência estática em memória dos 19 fragmentos: href/src/alt/id/eventos/toggles idênticos; só dimensões e classe do logo modificadas. Delimitadores do CSS balanceados.
- Contra-prova independente: PUBLICAR_COM_RESSALVAS para PR; nenhum bloqueador estático identificado. Overflow com traduções longas em 1280px, medição visual e interações seguem NOT_MEASURED.
- Nesta continuação, o executor local ficou indisponível. Build e scripts locais não foram reexecutados; nenhuma declaração de aprovação visual. Alteração feita atomicamente pela API do GitHub.
- Revisão anterior íntegra e recuperável pelo commit pai c74b1e1f0b88600a741695025f1ac2cb15a094f1. Os backups locais da execução anterior não foram incluídos na publicação.


## Correção final — ícone quadrado na altura máxima da barra

Substitui as dimensões intermediárias de 70×70 limitado a 56px: o estado final usa 60×60px no HTML e no CSS, tanto na caixa do logo quanto na imagem. A barra continua com 60px. object-fit:contain e object-position:center mantêm a imagem inteira, proporcional, sem recorte e sem esticar o arquivo original. Caso o arquivo original não seja quadrado, a imagem completa fica contida na caixa quadrada; não é usado cover nem preenchimento por distorção.

Os 19 menus usam a mesma regra. Preservados o espaço desktop de 4cm, conta à direita e todas as URLs, classes, IDs, alt e eventos. Conferência estática aprovada; validação visual e build continuam NOT_MEASURED pelas limitações já documentadas. Revisão anterior recuperável no commit pai ac6bc7d9a2c20bcd9947b5a6fd02018a664bf654.
