# calculadora de gasometria arterial

Versão **0.3.2**. Extensão Manifest V3 Premium, dentro de `extensao-chrome/`, com painel lateral nativo do Chrome. Mantém os seis campos da primeira coluna de `gasometria.html`, o hero navy, as fontes locais, as cores dos resultados e a divulgação do site.

O visual segue o modelo do Gemini indicado pelo usuário: card de até 390 px, cantos de 16 px, sombra externa, título de 25 px e formulário branco com os mesmos espaçamentos e botões. A posição é a do painel nativo; o card não fica centralizado em uma página de demonstração.

## Instalar ou atualizar no Windows

1. Feche a janela separada da versão antiga pelo X do Windows.
2. Guarde uma cópia da sua pasta atual. Extraia o pacote completo para `C:\calculadoras-de-enfermagem\extensao-chrome`, substituindo os arquivos dessa extensão. O `manifest.json` deve ficar diretamente nessa pasta.
3. Apague o antigo `extensao-chrome/content-script.js`, caso ainda exista após a substituição. Ele foi retirado da versão 0.2.0.
4. Abra `chrome://extensions`. Se a extensão já está carregada dessa pasta, clique em **Recarregar**. Para uma instalação nova, ative **Modo do desenvolvedor**, escolha **Carregar sem compactação** e selecione a pasta que contém o manifest.
5. Fixe o ícone no menu de extensões do Chrome e clique nele.

Requer **Chrome 142 ou posterior**. Não exige Node.js, instalação de dependências, compilação, deploy do site ou aprovação da conta da Chrome Web Store para o teste local. O ZIP deve ser extraído; não é um instalador que se abre com duplo clique.

Para trazer os mesmos arquivos do GitHub ao repositório local, depois de guardar alterações próprias:

```powershell
cd C:\calculadoras-de-enfermagem
git fetch origin codex/extensao-gasometria-arterial
git restore --source=FETCH_HEAD -- extensao-chrome
```

A restauração da pasta traz também a remoção do content-script antigo. Ela substitui os arquivos locais da extensão pela versão da branch.

## Posição e altura

O clique no ícone abre ou fecha o **painel lateral do próprio navegador**. A calculadora fica no topo desse painel, alinhada à direita. Não acompanha a rolagem da página e não cria uma janela independente.

O conteúdo da calculadora tem **largura máxima de 390 px**, redução de 40% sobre os 650 px iniciais. Em espaços menores, usa a largura disponível. **A largura externa e o lado do painel são controlados pelo Chrome**, não pela extensão. Para o painel à direita, escolha essa posição nas configurações de **Aparência / Painel lateral** do Chrome. A borda do painel permite ajustar sua largura. Se o navegador informar que o painel está à esquerda, a calculadora mostra uma orientação curta.

A altura inicial acompanha o conteúdo: título, formulário, **Calcular/Limpar** e rodapé. Ao calcular, a caixa cresce **para baixo**, mantendo o topo na mesma posição, até o limite de altura do painel. Quando formulário e resultado ultrapassam esse limite, somente o corpo da calculadora rola; cabeçalho e rodapé permanecem visíveis. A página visitada não é deslocada pelo código de rolagem da calculadora.

**Meia altura** reduz a altura da caixa com rolagem interna. **Altura completa** restaura a altura necessária ao conteúdo, limitada ao espaço disponível. Campos e resultado são preservados na troca. Há mínimo de 240 px quando existe esse espaço; com menos de 480 px totais, o controle se chama **Compactar**, porque o mínimo pode impedir uma metade exata. Em um painel menor que 240 px, prevalece o espaço disponível.

As referências ficam disponíveis no botão **Referências** do rodapé, para que a abertura inicial termine logo após os botões e a divulgação do site.

## Calcular

- Uma coluna, nesta ordem: pH, PaCO₂, HCO₃⁻, PaO₂, excesso de base (BE) e SatO₂.
- pH, PaCO₂ e HCO₃⁻ são obrigatórios; os demais são opcionais.
- Aceita ponto ou vírgula decimal. Campo vazio não vira zero.
- O resultado aparece em hero abaixo de **Calcular/Limpar**.
- Alterar um campo oculta o resultado anterior. **Limpar** remove campos e resultado.
- **X**, **Esc**, o fechamento nativo e o fechamento pelo ícone limpam o formulário; não há histórico persistente.
- Rodapé: **Visite nosso site**, com link para https://www.calculadorasdeenfermagem.com.br/.

Experimente pH `7,40`, PaCO₂ `40` e HCO₃⁻ `24`: parâmetros ácido-base na faixa de referência.

| Cor | Uso |
| --- | --- |
| Verde | Parâmetro ou conclusão na referência. |
| Vermelho | Acidose na conclusão; direção ácida dos parâmetros ácido-base. |
| Violeta | Alcalose na conclusão; direção alcalina dos parâmetros ácido-base. |
| Âmbar | Oxigenação fora da referência, padrão misto, conferência ou avaliação conjunta. |
| Cinza | Opcional não informado. |

As etiquetas também apresentam texto. Cor não indica gravidade nem substitui a interpretação em conjunto. O título **Alcalose (alcalemia)** foi mantido para o achado de pH nos casos previamente ajustados, com o aviso de conferência quando necessário. A migração para painel nativo não altera o núcleo clínico.

## Arquivos

| Arquivo | Função |
| --- | --- |
| `manifest.json` | Manifest V3, versão, painel nativo e permissão sidePanel. |
| `service-worker.js` | Configura o clique no ícone e informa o fechamento do painel. |
| `calculator.html` | Formulário, botões, resultado, referências e rodapé. |
| `calculator.css` | Navy, fontes locais, cores, bordas, sombras e rolagem interna. |
| `calculator.js` | Interface, cálculo da altura, limpeza e fechamento nativo. |
| `gasometria-core.js` | Núcleo de cálculo separado da interface. |
| `icons/` | PNGs de 16, 32, 48 e 128 px. |
| `fonts/` | Inter/Nunito Sans e suas licenças SIL OFL. |
| `tests/` | Cálculo, API/DOM simulados, estrutura, recursos e contraste. |
| `INSTALAR.txt` | Instruções curtas para instalação local. |
| `PRIVACIDADE.md` | Tratamento dos dados. |
| `VALIDACAO.md` | Evidências e limites da verificação. |
| `empacotar.ps1` | Valida e gera o ZIP de execução para distribuição. |

A interface roda na página da própria extensão, dentro do painel nativo. As permissões são `sidePanel` e `identity`; a única host permission é o projeto Supabase usado para trocar um código descartável pelo estado Free/Premium. Não há `activeTab`, `scripting` nem content-script, e a extensão não lê páginas visitadas. A mensagem interna de fechamento contém apenas tipo e identificador da janela do navegador, nunca os valores clínicos.\n\n## Acesso Premium\n\nA calculadora inteira permanece visível para todos os usuários. Enquanto o Premium não estiver confirmado, os seis campos, **Calcular** e **Limpar** ficam desabilitados. O card de acesso permite entrar/verificar a assinatura ou abrir a página de assinatura existente.\n\nO login acontece no domínio oficial do site. O token Firebase fica somente na página do site e é trocado no servidor por um código aleatório de uso único, válido por aproximadamente dois minutos e vinculado ao ID da extensão. A extensão recebe apenas esse código e o consome uma vez com um verificador criptográfico PKCE (S256) para consultar o mesmo `user_entitlements` usado pelo site. O backend não depende do cabeçalho `Origin` do service worker do Chrome. Falha de rede ou de validação nunca libera a calculadora. Ao fechar o painel, perder a visibilidade ou retornar ao painel, o acesso é invalidado/revalidado para impedir que uma liberação Premium antiga permaneça ativa após logout.

## Verificar e empacotar

Após editar, recarregue a extensão em `chrome://extensions` e abra o painel novamente. Para executar os testes, se tiver Node.js:

```powershell
cd C:\calculadoras-de-enfermagem\extensao-chrome
node tests/run.cjs
```

Também funciona `npm test` nessa pasta. Não há dependências a baixar.

Para gerar o pacote de execução com manifest na raiz:

```powershell
powershell -NoProfile -File .\empacotar.ps1
```

O script executa os testes e cria `calculadora-gasometria-arterial-0.3.2.zip`, incluindo scripts, HTML/CSS, ícones, fontes e licenças. Documentação, testes, backups e arquivos antigos ficam fora desse pacote. O ZIP completo entregue para desenvolvimento também contém documentação e testes.

Confira a integração e o visual no Chrome antes de enviar à loja. A extensão reutiliza a conta e a assinatura Premium já existentes no site. Ela não cria cobrança própria: **Assinar Premium** abre a página de assinatura vigente, que mantém o fluxo nacional no Asaas e o internacional no Stripe. Este código ainda não foi publicado na Chrome Web Store.

## Critérios de cálculo

Referências exibidas: pH 7,35–7,45; PaCO₂ 35–45 mmHg; HCO₃⁻ 22–26 mEq/L; PaO₂ 80–100 mmHg; BE −2 a +2 mEq/L; SatO₂ >95%.

- Identifica padrões de acidose/alcalose metabólica, respiratória ou mista pelos três parâmetros obrigatórios.
- pH normal com PaCO₂/HCO₃⁻ alterados solicita avaliação de compensação e distúrbios combinados; não classifica automaticamente como “totalmente compensado”.
- Acidose metabólica: PaCO₂ esperada = 1,5 × HCO₃⁻ + 8 ±2, fórmula de Winter.
- Alcalose metabólica: PaCO₂ esperada = 40 + 0,7 × (HCO₃⁻ −24) ±2.
- Acidose respiratória: HCO₃⁻ estimado agudo = 24 + 0,10 × (PaCO₂ −40); crônico = 24 + 0,35 × (PaCO₂ −40).
- Alcalose respiratória: HCO₃⁻ estimado agudo = 24 −0,22 × (40 −PaCO₂); crônico = 24 −0,40 × (40 −PaCO₂).
- As estimativas respiratórias são apresentadas para comparação; a extensão não infere duração aguda/crônica só desses campos.
- Usa os termos acidose/alcalose no título, com acidemia/alcalemia entre parênteses quando o pH estiver reduzido/elevado. Acidemia e alcalemia descrevem o pH observado; acidose e alcalose descrevem os processos que precisam ser avaliados pelos demais parâmetros.
- Confere coerência aproximada por pH = 6,1 + log10[HCO₃⁻/(0,03 × PaCO₂)]. Diferença >0,08 mantém a classificação do pH visível e pede conferência do laudo antes de definir o tipo de distúrbio e a compensação. Exibe também o pH calculado e o digitado. **0,08 é um corte de triagem adotado nesta interface, não um limite clínico universal.**
- Em resultados inconsistentes ou sem padrão simples, o título usa **Alcalose (alcalemia)** ou **Acidose (acidemia)**, como solicitado. O resumo esclarece que o achado descreve o pH informado e não define sozinho o tipo de distúrbio; o aviso de conferência e a indefinição da compensação permanecem.
- Exemplo: 7,49 / 48 / 22 mostra **Alcalose (alcalemia)** com aviso de discrepância e pH calculado aproximado de 7,28; 7,47 / 32 / 22 mostra **Alcalose respiratória (alcalemia)** com estimativas de compensação.
- **Alcalose/acidose mista** significa componentes metabólico e respiratório no mesmo sentido nesta calculadora. O nome do padrão não gera automaticamente um rótulo de gravidade.
- PaO₂, BE e SatO₂ recebem comparação com a referência; não alteram sozinhos a classificação ácido-base.
- Não calcula ânion gap, delta gap, FiO₂, lactato nem conduta terapêutica, pois esses dados não estão na primeira coluna.

A interpretação é apoio educacional e precisa do contexto clínico e do protocolo institucional. As faixas de oxigenação não substituem avaliação de FiO₂, altitude, idade ou condições do paciente.

Fontes: [ATS — Interpretation of Arterial Blood Gases](https://member.thoracic.org/professionals/clinical-resources/critical-care/clinical-education/abgs.php) e [UCSF Hospital Handbook — Algorithm for Acid-Base Disorders](https://hospitalhandbook.ucsf.edu/01-algorithm-acid-base-disorders/01-algorithm-acid-base-disorders).

## Separar do repositório futuramente

Copie apenas `extensao-chrome/` para uma nova pasta/repositório. Os caminhos de execução são relativos à extensão. Preserve as licenças das fontes. Ela depende da ponte de autenticação publicada no site e das Edge Functions `extension-auth` e `extension-access`; não depende de anúncios nem do conteúdo das páginas visitadas.
