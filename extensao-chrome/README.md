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

Abra uma página HTTP/HTTPS comum e clique no ícone da extensão. O card aparece à direita. Outro clique no ícone, o botão **X** ou **Esc** fecha o card.

- Cabeçalho hero com o nome da calculadora.
- Uma coluna com os seis campos e suas referências.
- **Calcular** e **Limpar** abaixo do formulário.
- Resultado em hero abaixo dos botões.
- Rodapé com **Visite nosso site** e link para https://www.calculadorasdeenfermagem.com.br/.
- pH, PaCO₂ e HCO₃⁻ são obrigatórios. PaO₂, BE e SatO₂ são opcionais.
- Aceita ponto ou vírgula decimal. Campos vazios não são tratados como zero.
- Alterar um campo oculta o resultado anterior. Limpar remove campos e resultado.

Experimente pH `7,40`, PaCO₂ `40` e HCO₃⁻ `24`: o resultado deve indicar parâmetros ácido-base na faixa de referência.

O card tem largura de 5/3 da largura do anúncio Premium: **650 px quando a referência é 390 px**. Se o anúncio `premium-promo-banner` estiver visível, sua altura é medida e usada como referência. Sem anúncio disponível, a altura inicial é **310 px**, o fallback do posicionador do site, e não uma medida comprovada do anúncio. As dimensões são limitadas pela viewport.

Como os seis campos e o resultado excedem essa altura, o corpo tem **rolagem interna**; título e rodapé permanecem visíveis. Em páginas restritas, como `chrome://extensions`, ou se o card não conseguir carregar, abre uma janela separada. A área útil dessa janela depende das bordas do Chrome e do sistema operacional.

## 4. Arquivos

| Arquivo | Função |
| --- | --- |
| `manifest.json` | Nome, versão, permissões e configuração Manifest V3. |
| `service-worker.js` | Clique no ícone, abertura alternativa e mensagens de prontidão/fechamento. |
| `content-script.js` | Posiciona e remove o card na aba. |
| `calculator.html` | Uma coluna de formulário, botões, resultado e rodapé. |
| `calculator.css` | Gradiente navy, tipografia local, cores, bordas e sombras. |
| `calculator.js` | Validação da interface, resultado, limpeza e fechamento. |
| `gasometria-core.js` | Lógica de cálculo isolada da interface. |
| `icons/` | Ícones PNG de 16, 32, 48 e 128 px. |
| `fonts/` | Fontes Inter/Nunito Sans e respectivas licenças SIL OFL. |
| `tests/` | Testes de cálculo, ciclo de vida e estrutura. |
| `PRIVACIDADE.md` | Descrição de tratamento de dados para revisão da publicação. |
| `VALIDACAO.md` | Evidências, escopo e verificações ainda pendentes. |
| `empacotar.ps1` | Gera o ZIP com os arquivos necessários à extensão. |

O formulário roda em um iframe da própria extensão. As mensagens entre componentes contêm somente o tipo da ação e um identificador efêmero do card. Valores clínicos não são enviados nessas mensagens.

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
- Confere coerência aproximada por pH = 6,1 + log10[HCO₃⁻/(0,03 × PaCO₂)]. Diferença >0,08 suspende a interpretação e pede conferência do laudo. **0,08 é um corte de triagem adotado nesta interface, não um limite clínico universal.**
- PaO₂, BE e SatO₂ recebem comparação com a referência; não alteram sozinhos a classificação ácido-base.
- Não calcula ânion gap, delta gap, FiO₂, lactato nem conduta terapêutica, pois esses dados não estão na primeira coluna.

A interpretação é apoio educacional e precisa do contexto clínico e do protocolo institucional. As faixas de oxigenação não substituem avaliação de FiO₂, altitude, idade ou condições do paciente.

Fontes: [ATS — Interpretation of Arterial Blood Gases](https://member.thoracic.org/professionals/clinical-resources/critical-care/clinical-education/abgs.php) e [UCSF Hospital Handbook — Algorithm for Acid-Base Disorders](https://hospitalhandbook.ucsf.edu/01-algorithm-acid-base-disorders/01-algorithm-acid-base-disorders).

## Separar do repositório futuramente

Copie apenas `extensao-chrome/` para uma nova pasta/repositório. Todos os caminhos de execução são relativos à própria extensão; ela não depende dos scripts globais, Firebase, anúncios ou build do site. Preserve as licenças das fontes ao distribuir.
