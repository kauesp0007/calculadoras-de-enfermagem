# Registro de validação — extensão 0.3.1

Data: 30/09/2026.

## Resultado e escopo

A versão 0.3.1 mantém a abertura no **painel lateral nativo do Chrome** e adiciona controle de acesso Premium reutilizando a autenticação e o entitlement do site. Remove a janela popup independente, a injeção na página e o content-script. A calculadora fica no topo do painel e cresce para baixo quando o resultado aparece, com rolagem apenas no corpo quando falta espaço.

As alterações se limitam a `extensao-chrome/`. Foram consultados AGENTS.md, AI_RULES.md, HTML_RULES.md, HTML_PAGE_TEMPLATE_RULES.md e o padrão visual canônico. Foram mantidos o navy, a tipografia local, os seis campos da primeira coluna e o hero de resultado. Os arquivos do site, catálogo, menus, regras, package.json da raiz, autenticação e deploy não foram alterados. Builds de Tailwind e do SW do site não se aplicam à extensão sem build.

A referência visual adicional https://share.gemini.google/6DGZBYePd83n foi inspecionada no navegador: card de 390 px, raio de 16 px, sombra 0 18px 45px rgba(0,0,0,.19), título 25 px, cabeçalho com padding 14px 16px, corpo 12px 16px 16px, formulário branco com padding 16px e campos de 36 px. Esses atributos foram aplicados à calculadora no painel nativo. O ajuste para largura muito estreita fica reservado a 340 px ou menos, preservando a referência em 390 px.

Foi feito backup de 14 arquivos considerados nesta revisão em `backups-temporarios/20260930-painel-nativo/`, na cópia de trabalho. Esses backups não fazem parte dos ZIPs de distribuição. A branch de revisão é atualizada pelo conector GitHub; nenhum comando git commit/push foi executado no computador do usuário.

## Integração e geometria

- Manifest V3, versão 0.3.1, Chrome mínimo 142, permissões `sidePanel` e `identity`, com host permission restrita ao projeto Supabase da aplicação.
- Usuário Free visualiza a calculadora inteira, mas campos, Calcular e Limpar permanecem bloqueados.
- Usuário Premium é liberado somente após troca de código descartável + verificador PKCE por entitlement válido; falhas de rede permanecem bloqueadas.
- O Firebase ID token não é entregue nem persistido na extensão; a ponte web emite código de uso único com validade curta.
- O checkout não foi duplicado: o CTA abre a página de assinatura já existente.
- `side_panel.default_path` aponta para calculator.html local.
- O clique no ícone usa `setPanelBehavior({openPanelOnActionClick:true})`.
- X/Esc usam `sidePanel.close({windowId})`. O fechamento nativo informa apenas o windowId, para limpar o contexto correspondente. Remetentes e identificadores inválidos são ignorados.
- Não há janela separada, janela redimensionada, script de conteúdo, host permissions ou leitura das páginas visitadas.
- A caixa usa top:0/right:0 dentro do painel, largura máxima de 390 px e altura natural de cabeçalho + corpo + rodapé, limitada à viewport.
- Calcular mantém o topo e aumenta a altura para baixo. O resultado recebe foco sem deslocar a página; a rolagem programática atua somente no main interno se o resultado não couber.
- Cabeçalho/rodapé não encolhem; main tem min-height:0 e overflow:auto.
- Alternar altura preserva valores/resultados; resize recalcula a altura; ResizeObserver mede corpo/cabeçalho/rodapé e é desligado ao sair.
- Referências começam ocultas, sincronizam aria-expanded e devolvem o foco ao botão ao ocultar o summary.
- A largura externa e o lado do painel pertencem ao Chrome. A extensão consulta getLayout e oferece orientação quando o lado escolhido é esquerdo; não tenta impor largura nem lado à interface nativa.

Fonte primária da integração: [Chrome — API sidePanel](https://developer.chrome.com/docs/extensions/reference/api/sidePanel). close está disponível desde Chrome 141; onClosed desde 142. A versão mínima 142 cobre as APIs usadas.

## Núcleo e terminologia

`gasometria-core.js` foi preservado byte a byte nesta migração:

SHA-256: `6f5c21832b2573cd6922c80b5fca42a4a63cbb590a9fee95a1d823364a36d32b`.

As equações, faixas, corte de conferência e cores de apresentação não foram modificados. Os títulos solicitados **Alcalose (alcalemia)** e **Acidose (acidemia)** permanecem nos achados de pH inconclusivos, com aviso e resumo que não definem tipo/compensação apenas por esse achado.

O caso 7,49 / 48 / 22 permanece `inconsistent`, título Alcalose (alcalemia), pH calculado aproximado 7,28406, etiqueta Conferir valores e compensação indefinida. A revisão clínica independente da alteração anterior aprovou os 64 testes clínicos; esses mesmos 64 passam na versão atual.

Fontes clínicas já consultadas: ATS e UCSF Hospital Handbook, disponíveis na interface e no README. O corte de diferença de pH 0,08 é uma decisão de triagem desta interface, não um limite clínico universal atribuído às fontes.

## Testes executados em Node.js

| Grupo | Verificações aprovadas |
| --- | ---: |
| Cálculo e validação de entrada | 64 |
| Worker/API simulados | 5 |
| Interface/DOM simulados, geometria e contraste | 58 |
| Estrutura, sintaxe, recursos locais e licenças | 36 |
| **Total** | **163** |

Comando: `node tests/run.cjs`. Nenhuma dependência foi instalada.

Cobertura específica: abertura por comportamento nativo, evento de fechamento e ausência de dados clínicos nas mensagens; falha de configuração; limpeza restrita à janela correta; X/Esc; falha de fechamento com orientação nativa; altura inicial até formulário/botões/rodapé, expansão sem mudar o topo, compactação, resize, altura mínima, rolagem interna apenas quando necessária, preservação de dados e limpeza; referências e foco; limites dos seis parâmetros, rótulos, cores e contraste; ausência do content-script e das permissões antigas; closure dos recursos declarados no manifest/HTML/CSS; dimensão PNG, assinatura WOFF2 e licenças.

Os 163 casos atuais substituem os testes de injeção/popup das versões anteriores, por isso o total não é comparável diretamente aos 201 casos anteriores.

Contra-prova independente: o revisor leu a implementação, executou os 163 casos e um harness separado de geometria. Confirmou altura natural, crescimento limitado à viewport, compactação, limpeza por windowId, referências/foco, recursos/licenças e identidade do núcleo. Após a nova referência do Gemini, conferiu os estilos finais e executou novamente os 163 casos. Parecer técnico: aprovado, sem bloqueios, com a integração visual no Chrome ainda pendente.

## Limites da verificação

Os testes de DOM e APIs usam simulações, não Chrome. Playwright está disponível, mas o executável Chromium não está instalado neste ambiente. O script PowerShell foi revisado, sem execução em Windows. A inspeção real de manifest/CSP, renderização, teclado, fechamento pelo Chrome, modo anônimo e recarga da extensão ainda deve ser feita no Chrome do usuário.

A referência do Gemini foi observada em um navegador remoto e seus estilos foram medidos a partir do DOM. Isso verifica o modelo solicitado, mas não é teste da extensão instalada nesse navegador.

A imagem desta solicitação foi aberta e confirmou que o problema era uma janela separada do Windows. A arquitetura foi alterada para eliminar esse caminho. Isso não equivale a uma captura da versão 0.2.0 rodando neste ambiente.

A largura de 390 px refere-se ao conteúdo da calculadora, não a uma largura externa que a API possa forçar. O painel nativo possui moldura e controles próprios do Chrome.

## Histórico resumido

- 0.1.0 inicial: extensão independente, 113 casos.
- Revisão clínica e textos de pH: 128 casos; ajustes isolados da página pública.
- Largura 40%, altura e cores com card injetado/popup: 200 casos.
- Terminologia Alcalose (alcalemia)/Acidose (acidemia): 201 casos, 64 clínicos.
- 0.2.0 atual: painel nativo, 163 casos. As instruções antigas de card injetado, medição de barras de sites e fallback popup foram substituídas.

A preparação da extensão não representa deploy do site, merge do PR, instalação no computador do usuário ou publicação/aprovação na Chrome Web Store.
