# Registro de validação — extensão 0.1.0

Data: 30/09/2026.

## Escopo

Somente arquivos novos em `extensao-chrome/`. A implementação é uma extensão Manifest V3 independente; não é uma nova página pública do site.

Consultados: `AGENTS.md`, `AI_RULES.md`, `HTML_RULES.md`, `HTML_PAGE_TEMPLATE_RULES.md`, `CATALOGO_DE_IDENTIDADE_VISUAL/PADRAO_CANONICO_PAGINAS_HTML.md`, `gasometria.html` e `js/access/premium-banner-manager.js`.

As cores navy, Inter, Nunito Sans, hierarquia Eyebrow/H1/H2, referências no formulário e hero de resultado seguem o modelo do site. A interface compacta usa caminhos relativos e CSS próprio para poder ser separada do repositório. Não carrega navegação global, SEO de página pública, publicidade, exportação PDF ou impressão, pois o pedido limita a extensão à primeira coluna, resultado e divulgação do site.

Não foram alterados arquivos existentes, catálogos, menus, regras, package.json da raiz, autenticação, deploy ou service worker do site. Backup de arquivo existente não se aplica a esta pasta nova. Os builds de Tailwind e do SW do site não foram executados: a extensão não os utiliza, e o ambiente disponível não possui execução de shell/Node. Comandos de git commit/push não foram executados no computador do usuário; os arquivos são entregues em branch de revisão pelo conector GitHub.

## Testes automáticos executados

| Grupo | Verificações aprovadas |
| --- | ---: |
| Cálculo e validação de entrada | 48 |
| Runtime simulado, mensagens e ciclo do card | 38 |
| Estrutura, manifest, sintaxe, PNGs e fontes | 27 |
| Total | 113 |

Os próprios testes de `tests/*.test.cjs` foram executados em um ambiente JavaScript V8, com adaptadores para assert, leitura em memória, caminhos e URL. Isso valida a lógica em JavaScript e o comportamento com mocks. **Não equivale a executar Node.js no computador do usuário nem a carregar a extensão em Chrome real.** O comando local de confirmação é `node tests/run.cjs`.

Casos cobertos: referências e seus limites; pH normal com parâmetros alterados; padrões metabólicos, respiratórios e mistos; compensação de Winter; estimativas respiratórias; números com vírgula; BE negativo/zero; campos opcionais ausentes; rejeição de texto parcial, infinito e entradas fora do domínio; remetentes de mensagens inválidos; alternativa em páginas restritas; prontidão; timeout; vinte ciclos de abertura/fechamento sem listeners, temporizadores ou hosts remanescentes; dimensões PNG e assinatura WOFF2.

A lógica original tinha classificações incorretas para valores normais próximos de 40/24. Essa regra foi corrigida somente na extensão. A calculadora pública `gasometria.html` permanece sem alterações.

## Revisão independente

A revisão clínica consultou ATS/UCSF e confirmou os seis campos e os problemas da classificação anterior. A revisão de arquitetura orientou iframe de origem da extensão, permissões após clique, mensagens sem valores clínicos, identificação do remetente, prontidão e fallback. A revisão final da branch deve constar no PR.

## Conferências ainda pendentes em Chrome real

- Carregar sem compactação e confirmar ausência de erros de manifest/CSP.
- Conferir visualmente título, seis campos, botões, resultado e rodapé.
- Comparar a aparência com a imagem de referência. O anexo não pôde ser aberto neste ambiente; foi usado o HTML do GitHub.
- Testar com o anúncio Premium visível e confirmar a altura medida. 310 px é somente fallback.
- Verificar teclado, foco, Esc, rolagem interna e viewport estreita.
- Confirmar que páginas restritas abrem a janela separada e que o segundo clique fecha o card.
- Calcular, editar valores, limpar e conferir ausência de resultado antigo.
- Conferir modo anônimo, reabertura após suspensão do service worker e atualização da extensão.
- Revisão profissional da interpretação antes de uso assistencial/publicação.

A preparação do código não representa aprovação pela Chrome Web Store, publicação ou instalação no computador do usuário.
