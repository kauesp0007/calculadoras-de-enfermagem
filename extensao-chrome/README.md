# calculadora de gasometria arterial

Extensão independente do Chrome, criada dentro de `extensao-chrome/`. Usa a primeira coluna de `gasometria.html` como modelo visual: uma coluna com pH, PaCO₂, HCO₃⁻, PaO₂, excesso de base (BE) e SatO₂, nessa ordem. O site existente não precisa ser alterado.

## 1. Trazer a pasta para o seu computador

No terminal do VS Code, dentro do repositório:

```powershell
cd C:\calculadoras-de-enfermagem
git fetch origin codex/extensao-gasometria-arterial
git restore --source=FETCH_HEAD -- extensao-chrome
```

Esses comandos copiam os arquivos desta branch para a pasta local. Use-os sobre a pasta vazia que você criou; se houver trabalho local na pasta, faça uma cópia dele antes de restaurar.

## 2. Instalar para testar no Chrome

1. Abra `chrome://extensions`.
2. Ative **Modo do desenvolvedor**.
3. Clique em **Carregar sem compactação**.
4. Selecione `C:\calculadoras-de-enfermagem\extensao-chrome`, a pasta que contém o `manifest.json`.
5. No menu de extensões do Chrome, fixe **calculadora de gasometria arterial**.

Não há instalação de dependências nem compilação para carregar a extensão. A versão mínima declarada é Chrome 102.

## 3. Usar a calculadora

Abra uma página HTTP/HTTPS comum e clique no ícone da extensão. O card fica fixo à direita, logo abaixo da última barra superior reconhecida do site. Rolar a página não reposiciona o card. Outro clique no ícone, o botão **X** ou **Esc** fecha o card.

- Cabeçalho hero com o nome da calculadora.
- Uma coluna com os seis campos e suas referências.
- **Calcular** e **Limpar** abaixo do formulário.
- Resultado em hero abaixo dos botões.
- Rodapé com **Visite nosso site** e link para https://www.calculadorasdeenfermagem.com.br/.
- pH, PaCO₂ e HCO₃⁻ são obrigatórios. PaO₂, BE e SatO₂ são opcionais.
- Aceita ponto ou vírgula decimal. Campos vazios não são tratados como zero.
- Alterar um campo oculta o resultado anterior. Limpar remove campos e resultado.
- O botão **Meia altura** compacta o card com rolagem interna; **Altura completa** restaura a altura, mantendo os valores e o resultado.

Experimente pH `7,40`, PaCO₂ `40` e HCO₃⁻ `24`: o resultado deve indicar parâmetros ácido-base na faixa de referência.

O card tem **390 px de largura**, redução de **40% sobre os 650 px anteriores**, e se adapta a telas mais estreitas. Abre em **altura completa**, ocupando o espaço disponível entre as barras superiores e a margem inferior de 12 px. As dimensões independem do anúncio Premium.

No modo **Meia altura**, usa metade desse espaço, com mínimo de 240 px para manter os controles acessíveis. Quando a altura completa é menor que 480 px, o botão se chama **Compactar**, pois esse mínimo impede uma redução exata à metade. O corpo tem **rolagem interna** sempre que o conteúdo excede a altura; título, controle de altura e rodapé permanecem visíveis.

O posicionador reconhece `barraAcessibilidade`, `global-header-container` e `language-selector-placeholder`. Observa a inclusão e a mudança de tamanho dessas barras, sem acompanhar a rolagem da página. Em outros sites, começa no topo da área da página, com margem de 12 px; as barras nativas do Chrome já ficam fora dessa área.

Em páginas restritas, como `chrome://extensions`, se o card não conseguir carregar ou houver menos de 240 px abaixo das barras, abre uma janela separada de 414 × 800 px, incluindo as bordas. O controle de altura também funciona nessa janela. A área útil e os limites dependem do Chrome e do sistema operacional. Se um redimensionamento retirar o espaço necessário de um card já aberto, a janela alternativa começa com um formulário novo.

Os resultados mantêm o hero navy do site e recebem acentos e etiquetas com texto:

| Cor | Uso |
| --- | --- |
| Verde | Parâmetro na referência ou conclusão ácido-base na referência. |
| Vermelho | Acidose na conclusão; direção ácida de pH, PaCO₂, HCO₃⁻ ou BE. |
| Violeta | Alcalose na conclusão; direção alcalina desses parâmetros. |
| Âmbar | Oxigenação fora da referência, padrão misto, valores a conferir ou avaliação conjunta. |
| Cinza | Parâmetro opcional não informado. |

Cada parâmetro traz seu valor e uma etiqueta específica. A **Legenda das cores** explica os acentos; cor não representa gravidade nem substitui a interpretação em conjunto. As regras clínicas de `gasometria-core.js` foram preservadas neste ajuste visual.

## 4. Arquivos

| Arquivo | Função |
| --- | --- |
| `manifest.json` | Nome, versão, permissões e configuração Manifest V3. |
| `service-worker.js` | Clique no ícone, abertura alternativa e mensagens de prontidão, fechamento e altura. |
| `content-script.js` | Ancora o card abaixo das barras, alterna altura e remove o card na aba. |
| `calculator.html` | Uma coluna de formulário, botões, resultado e rodapé. |
| `calculator.css` | Gradiente navy, tipografia local, cores, bordas e sombras. |
| `calculator.js` | Validação da interface, resultado, limpeza e fechamento. |
| `gasometria-core.js` | Lógica de cálculo isolada da interface. |
| `icons/` | Ícones PNG de 16, 32, 48 e 128 px. |
| `fonts/` | Fontes Inter/Nunito Sans e respectivas licenças SIL OFL. |
| `tests/` | Testes de cálculo, ciclo de vida, interface simulada, contraste e estrutura. |
| `PRIVACIDADE.md` | Descrição de tratamento de dados para revisão da publicação. |
| `VALIDACAO.md` | Evidências, escopo e verificações ainda pendentes. |
| `empacotar.ps1` | Gera o ZIP com os arquivos necessários à extensão. |

O formulário roda em um iframe da própria extensão. As mensagens entre componentes contêm somente o tipo da ação, um identificador efêmero do card e, ao alterar a altura, o modo `full` ou `compact`. Valores clínicos não são enviados nessas mensagens.

## 5. Conferir alterações

Após editar um arquivo, clique no botão de recarregar da extensão em `chrome://extensions`, recarregue a página de teste e abra novamente a calculadora.

Os testes podem ser executados com Node.js, sem baixar dependências:

```powershell
cd C:\calculadoras-de-enfermagem\extensao-chrome
node tests/run.cjs
```

Ou use `npm test` nessa mesma pasta. Não execute esse comando na raiz do site esperando testar a extensão.

## 6. Gerar o ZIP para a Chrome Web Store

No terminal PowerShell, dentro da pasta da extensão:

```powershell
powershell -NoProfile -File .\empacotar.ps1
```

O script executa os testes e cria `calculadora-gasometria-arterial-0.1.0.zip`. O manifest fica na raiz do ZIP. Documentação e testes não são enviados no pacote. Carregar localmente não depende da aprovação da conta da loja.

Antes do envio, confira a extensão em Chrome real e revise a política de privacidade, a descrição e as capturas da loja. Esta versão não inclui cobrança, assinatura ou conta de usuário.

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

Copie apenas `extensao-chrome/` para uma nova pasta/repositório. Todos os caminhos de execução são relativos à própria extensão; ela não depende dos scripts globais, Firebase, anúncios ou build do site. Preserve as licenças das fontes ao distribuir.
