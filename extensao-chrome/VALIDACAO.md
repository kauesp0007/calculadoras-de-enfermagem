# Registro de validação — extensão 0.1.0

Data: 30/09/2026.

## Escopo da implementação inicial

Somente arquivos novos em `extensao-chrome/`. A implementação é uma extensão Manifest V3 independente; não é uma nova página pública do site.

Consultados: `AGENTS.md`, `AI_RULES.md`, `HTML_RULES.md`, `HTML_PAGE_TEMPLATE_RULES.md`, `CATALOGO_DE_IDENTIDADE_VISUAL/PADRAO_CANONICO_PAGINAS_HTML.md`, `gasometria.html` e `js/access/premium-banner-manager.js`.

As cores navy, Inter, Nunito Sans, hierarquia Eyebrow/H1/H2, referências no formulário e hero de resultado seguem o modelo do site. A interface compacta usa caminhos relativos e CSS próprio para poder ser separada do repositório. Não carrega navegação global, SEO de página pública, publicidade, exportação PDF ou impressão, pois o pedido limita a extensão à primeira coluna, resultado e divulgação do site.

Não foram alterados arquivos existentes, catálogos, menus, regras, package.json da raiz, autenticação, deploy ou service worker do site. Backup de arquivo existente não se aplica a esta pasta nova. Os builds de Tailwind e do SW do site não foram executados: a extensão não os utiliza, e o ambiente disponível não possui execução de shell/Node. Comandos de git commit/push não foram executados no computador do usuário; os arquivos são entregues em branch de revisão pelo conector GitHub.

## Testes automáticos da implementação inicial

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
- Confirmar largura de 390 px, alinhamento abaixo das barras superiores e modo de altura completa/meia altura. O ajuste mais recente removeu a dependência das dimensões do anúncio.
- Verificar teclado, foco, Esc, rolagem interna e viewport estreita.
- Confirmar que páginas restritas abrem a janela separada e que o segundo clique fecha o card.
- Calcular, editar valores, limpar e conferir ausência de resultado antigo.
- Conferir modo anônimo, reabertura após suspensão do service worker e atualização da extensão.
- Revisão profissional da interpretação antes de uso assistencial/publicação.

A preparação do código não representa aprovação pela Chrome Web Store, publicação ou instalação no computador do usuário.

## Revisão após os testes do usuário — 30/09/2026

O ambiente passou a permitir Node.js. Antes da alteração, os 113 testes existentes também passaram em Node. Foi feito backup dos quatro arquivos editados em `backups-temporarios/20260930-gasometria/`, na cópia de trabalho usada nesta revisão.

A classificação do pH permanece no título em resultados inconsistentes: "pH informado sugere alcalose (alcalemia)" ou "pH informado sugere acidose (acidemia)". O aviso mostra o pH calculado pela relação PaCO₂/HCO₃⁻ e limita a indefinição ao tipo de distúrbio e à compensação. Resultados válidos também apresentam acidemia/alcalemia entre parênteses. O padrão com componentes metabólico e respiratório no mesmo sentido passa a usar o nome "mista". Equações, faixas e corte de coerência não foram modificados.

Foram revisadas as fontes institucionais ATS (coerência e padrões) e UCSF Hospital Handbook (compensação). A página pública atualmente usa direção das alterações para classificar compensação; não aplica Winter nem a conferência de Henderson–Hasselbalch. A diferença de algoritmo foi registrada, sem alteração da página pública nesta revisão da extensão.

| Caso informado: pH / PaCO₂ / HCO₃⁻ | pH calculado aproximado | Resultado da extensão revisada |
| --- | ---: | --- |
| 7,47 / 40 / 22 | 7,36 | pH sugere alcalose (alcalemia); conferir valores |
| 7,47 / 32 / 22 | 7,46 | Alcalose respiratória (alcalemia) |
| 7,47 / 32 / 27 | 7,55 | Alcalose mista (alcalemia), pelo corte atual de 0,08 |
| 7,29 / 32 / 21 | 7,44 | pH sugere acidose (acidemia); conferir valores |

O caso misto está perto do corte de discrepância (diferença 0,0791); as equações são aproximações e o resultado continua sendo apoio, não confirmação de validade do laudo. O corte 0,08 é uma decisão da interface, não uma recomendação universal atribuída às fontes.

Teste completo após o ajuste: **128 verificações aprovadas em Node.js** — 63 clínicas, 38 de runtime simulado e 27 estruturais. As novas regressões incluem os quatro conjuntos de valores das fotos, títulos comuns/técnicos, acidemia e pH na referência com discrepância e padrões limítrofes inconclusivos. O revisor clínico independente leu a implementação final, executou os 63 testes clínicos no Node e aprovou o ajuste sem bloqueios; registro também no PR.

As imagens enviadas pelo usuário confirmam a abertura no Chrome, a janela alternativa em página restrita, o card no site, o cálculo e a apresentação de resultados da versão anterior. A comparação visual com a imagem original foi possível posteriormente. Isso complementa, mas não substitui, testes completos em Chrome da implementação atualizada, incluindo teclado/CSP, anúncio Premium, modo anônimo e empacotamento PowerShell.

## Ajuste de largura, altura e cores — 30/09/2026

Pedido final do usuário: reduzir 40% a largura, manter o card fixo abaixo das barras superiores à direita, abrir em altura completa e permitir meia altura com rolagem, usando cores nas conclusões e nos parâmetros. A referência anterior de 650 px passa a 390 px. A altura de 310 px e a medição do anúncio não fazem mais parte do posicionador.

Foi criado backup dos onze arquivos existentes considerados para esta revisão em `backups-temporarios/20260930-layout-40pc/`, na cópia de trabalho. Os arquivos do site, suas regras, catálogo, package.json da raiz e builds não foram modificados. Tailwind/SW do site não se aplicam à extensão, que usa CSS e scripts próprios sem build nem novas dependências.

O card usa a altura disponível abaixo de `barraAcessibilidade`, `global-header-container` e `language-selector-placeholder`, descontando margens de 12 px. Não há listener de rolagem da página. ResizeObserver acompanha o tamanho das barras e MutationObserver detecta sua inclusão/substituição; ambos são desligados ao fechar. O modo compacto usa metade da altura disponível, com mínimo de 240 px; em telas em que o mínimo impede metade exata, o botão se chama Compactar. Espaço total inferior a 240 px causa abertura alternativa, sem sobrepor as barras nem exibir um card cortado. Quando isso ocorre após redimensionar, a janela alternativa começa com formulário vazio.

O novo protocolo de modo de altura aceita apenas `full` e `compact`, valida origem/frame/session e não encaminha valores clínicos. O fallback após redimensionamento aceita apenas mensagem interna do content-script no frame principal HTTP/HTTPS. Trocar a altura pelo botão mantém campos, resultado e a mesma sessão. A janela alternativa abre em 414 × 800 px externos e alterna altura somente quando a página da extensão está em uma janela popup; uma janela comum não é redimensionada.

O hero permanece navy. Etiquetas e bordas usam verde para referência, vermelho para direção ácida, violeta para alcalina, âmbar para alterações/conferência e cinza para opcionais ausentes. Os estados também são escritos em texto. A legenda esclarece que as cores não indicam gravidade nem definem diagnóstico isoladamente. Contraste das cinco etiquetas é superior a 6:1. Resultado inconsistente permanece âmbar, enquanto o pH mantém a etiqueta Acidemia/Alcalemia correspondente.

`gasometria-core.js` não foi alterado: SHA-256 `180a590cdee6753d8769a4c26328defeb2e2c9dc51bc52a6055eeb945cc735dc`, idêntico ao núcleo da revisão anterior. Os 63 testes clínicos continuam aprovados.

| Grupo atual, executado em Node.js | Verificações aprovadas |
| --- | ---: |
| Cálculo e validação de entrada | 63 |
| Runtime simulado, posicionamento, mensagens e ciclo de vida | 62 |
| Interface simulada, cores, limites, limpeza, altura e contraste | 48 |
| Estrutura, manifest, sintaxe, PNGs e fontes | 27 |
| **Total atual** | **200** |

As regressões verificam 390 px, adaptação à largura estreita, margem após a última barra, meia altura, altura mínima, barras carregadas posteriormente, fallback sem hosts/listeners/observers remanescentes, vinte ciclos de abertura/fechamento, remetentes inválidos, ausência de valores clínicos nas mensagens, parâmetros nos limites, cores com rótulos, cálculo inconsistente, ocultação de resultados antigos e preservação de dados ao alternar altura.

Os testes de interface e runtime usam mocks de DOM/APIs, não um navegador. Playwright está disponível, mas o executável Chromium não está instalado; nenhuma instalação de dependência foi realizada. A renderização, a interação real com as barras, o comportamento do popup e o carregamento CSP/Manifest continuam a exigir conferência no Chrome do usuário.

Contra-prova independente: o revisor de layout consultou o padrão canônico e AGENTS.md, executou os 200 testes em Node e um harness separado de geometria. Confirmou largura de 390 px, margem após barras, alturas completa/compacta, mudança após resize, fallback único e limpeza dos recursos. Calculou contraste superior a 6:1 nas cinco etiquetas e verificou identidade byte a byte do núcleo clínico com a branch anterior. Parecer final: aprovado tecnicamente sem bloqueios, mantendo pendente a validação visual e de integração no Chrome.
