# Manual Canônico: Transformação de Páginas HTML de Escalas em Formulários Hospitalares em PDF (A4 - 1 Página)

> **Calculadoras de Enfermagem** — *Memória Técnica e Manual de Engenharia para IAs e Desenvolvedores*  
> **Status:** Canônico e Obrigatório  
> **Data de Atualização:** 2026

---

## 1. Introdução e Objetivo

Este manual define o processo técnico padronizado para transformar qualquer escala clínica ou calculadora assistencial em formato HTML do portal **Calculadoras de Enfermagem** em um **formulário hospitalar em branco (Ficha de Beira-Leito) em formato PDF nativo de alta definição**, pronto para impressão e arquivamento em prontuário físico.

O objetivo é permitir que qualquer Inteligência Artificial (Cline, Claude, ChatGPT, Codex, DeepSeek) ou engenheiro de software reproduza, expanda ou modernize formulários mantendo **100% de paridade visual, rigor técnico e obediência à regra de 1 página A4**.

---

## 2. Decisões Arquiteturais: Por que Chromium Headless?

Ao gerar formulários clínicos impressos a partir da web, três abordagens são frequentemente tentadas, mas duas possuem falhas graves no ecossistema Windows/Web:

| Método | Vantagens | Desvantagens Críticas | Veredito |
|---|---|---|---|
| **jsPDF puro no cliente** | Roda direto no navegador | Não renderiza tabelas complexas com facilidade; quebra fontes personalizadas; distorce elementos vetoriais; difícil de calibrar milimetricamente. | ❌ Descartado para geração em lote de formulários |
| **WeasyPrint (Python)** | Suporte avançado a `@page` e CSS paged media | Exige bibliotecas externas em C/GTK (Pango, Cairo, GLib) frequentemente ausentes ou quebradas em servidores e ambientes Windows. | ❌ Descartado por incompatibilidade de ambiente |
| **Chromium / Edge Headless nativo** | Renderização vetorial nativa a 300 DPI, zero dependências externas em C, compatibilidade CSS moderna (Grid, Flexbox, SVG), textos 100% selecionáveis. | Exige um motor em script que monte o HTML e invoque o binário do navegador. | ✅ **PADRÃO CANÔNICO DO PROJETO** |

### O Pipeline de Geração Canônico:
```
HTML da Calculadora ➔ Extração Clínica ➔ FormPDFEngine (Python) ➔ CSS Canônico A4 ➔ msedge.exe --headless --print-to-pdf ➔ PDF Vetorial ➔ Auditoria PyMuPDF (fitz)
```

---

## 3. A Identidade Visual Canônica dos Formulários

Todo formulário hospitalar do site deve ser imediatamente reconhecível pela sua paleta institucional navy, clareza tipográfica e estrutura documental de alta rastreabilidade:

### 3.1. Paleta de Cores Institucional
* **Azul Marinho Primário (`#1A3E74`):** Usado no bloco do cabeçalho superior, bordas mestras, cabeçalhos de tabela e títulos de seção.
* **Azul Institucional Secundário (`#1E4D8C` e `#163269`):** Gradientes e contrastes.
* **Azul Suave (`#93C5FD` e `#BFDBFE`):** Rótulos secundários, marca d'água/subtítulo e fundos de destaque.
* **Fundo de Destaque do Escore (`#EFF6FF`):** Painel do escore total somado.
* **Cinza de Estrutura (`#E2E8F0` e `#CBD5E1`):** Linhas de tabela, divisórias e molduras de dados do paciente.
* **Cores de Risco Assistencial:**
  - **Verde (`#16A34A` / Fundo `#F0FDF4`):** Baixo risco / Cuidados Mínimos / Independente.
  - **Amarelo (`#EAB308` / Fundo `#FEFCE8`):** Risco Leve / Cuidados Intermediários.
  - **Laranja (`#F97316` / Fundo `#FFF7ED`):** Risco Moderado / Semi-intensivo.
  - **Vermelho (`#DC2626` / Fundo `#FEF2F2`):** Alto Risco / Cuidados Intensivos / Alerta Crítico.

### 3.2. Estrutura Vertical Obrigatória (Ordem de Leitura)
1. **Cabeçalho Navy Institucional:**
   - Marca: `CALCULADORAS DE ENFERMAGEM` (`#93C5FD`, uppercase, tracking largo).
   - Título Canônico: Nome oficial da escala em branco (`#FFFFFF`), bold, 12pt a 14pt.
   - Subtítulo Clínico: Finalidade assistencial em azul claro (`#BFDBFE`), 8pt.
2. **Box de Rastreabilidade e Identificação Hospitalar:**
   - Paciente, Idade/Data de Nascimento, Prontuário/ID, Leito, Setor/Unidade, Data/Hora da Avaliação e Nome do Avaliador.
3. **Matriz de Avaliação Clínica (Tabela ou Grid):**
   - Itens e perguntas descritivas alinhados à esquerda.
   - Opções com pontuações em negrito e caixas de marcação manual `[ ]` (`.sq`) alinhadas à direita.
4. **Painel de Escore Total em Destaque:**
   - Box em `#EFF6FF` com borda navy indicando `ESCORE TOTAL: [      ] pontos (Máximo: XX)`.
5. **Estratificação de Risco e Condutas Assistenciais de Enfermagem:**
   - Cartões coloridos com as notas de corte e orientações imediatas para o enfermeiro de plantão.
6. **Respaldo Ético-Legal e Assinatura:**
   - Linhas tracejadas para `Carimbo e Assinatura do Profissional Responsável (COREN)` e `Visto da Supervisão / Auditoria Hospitalar`.
7. **Rodapé Oficial:**
   - Citação bibliográfica formal da escala (Vancouver/ABNT) e a chancela:  
     `"Disponibilizado por Calculadoras de Enfermagem — www.calculadorasdeenfermagem.com.br"`.


---

## 4. A Regra de 1 Página A4 e Preenchimento Total da Folha (75% a 90%)

Para uso clínico em prancheta de posto de enfermagem e arquivamento em prontuário físico, **o formulário DEVE caber obrigatoriamente em 1 única folha A4**, preenchendo a folha na sua **totalidade**, com acabamento profissional.

### 4.1. Proibições Críticas de Diagramação (Regras de Bloqueio)
* ❌ **É TERMINANTEMENTE PROIBIDO espremer o formulário em 1/4 da página e deixar os outros 3/4 em branco**, com grandes vazios no meio ou rodapés empurrados artificialmente.
* ❌ **É PROIBIDO quebrar palavras ou frases indiscriminadamente**, empilhando opções com `|` em larguras estreitas que forcem quebras de linha feias ou ilegíveis.
* ❌ **É PROIBIDO gerar uma segunda página em branco ou órfã.**

### 4.2. Estratégias de Preenchimento Conforme o Volume da Escala
* **Escalas Curtas a Médias (3 a 10 critérios, ex: Aldrete, Ramsay, Apgar, Braden, Downton, CRIES):**
  - **Layout Canônico em 3 Colunas:**
    - Coluna 1 (~28%): Nome do Parâmetro (em negrito) + descrição clínica logo abaixo (em itálico/cinza suave).
    - Coluna 2 (~58%): Opções de resposta **empilhadas verticalmente (uma por linha)** com caixas de marcação `[ ]` (`.sq`) e pontuação explícita `(pts)`. Cada opção respira na sua própria linha, eliminando qualquer quebra desordenada de palavras!
    - Coluna 3 (~14%, centralizada): Caixa de anotação do escore parcial obtido `[      ]`.
  - Células com padding generoso (`6px a 8px`).
  - Identificação do paciente com linhas espaçadas e campo de cirurgia/diagnóstico.
  - Cartões de estratificação de risco bem desenvolvidos, com condutas clínicas claras e fontes confortáveis (7.8pt a 8.5pt).
  - Ocupação resultante: **80% a 88% da folha A4** (página cheia, limpa e harmoniosa).
* **Escalas Densas / Longas (11 a 24 critérios, ex: APACHE II, Berg, Barthel, SAPS 3, SOFA, NIHSS, Tinetti):**
  - **Layout Canônico em Duas Colunas Paralelas (`.cols-2`):**
    - Grid de 2 colunas: `grid-template-columns: 1fr 1fr; gap: 3.5mm;`.
    - Fonte calibrada em `7.2pt` a `7.5pt` e padding de `2.5px` a `3.5px`.
    - Ocupação resultante: **85% a 92% da folha A4** sem transbordar.

---

## 5. Regra de Alinhamento Bidirecional e Acabamento Tipográfico Estrito

Organização, simetria e alinhamento geométrico são pilares inegociáveis da política do portal:

1. **Alinhamento Horizontal (Laterais):**
   - Todos os títulos de seções, caixas e tabelas compartilham a mesma largura exata da mancha gráfica (`100% / max-width: 190mm`).
   - Rótulos e critérios alinhados estritamente à esquerda.
   - Checkboxes `[ ]`, pontuações e caixas de anotação alinhadas milimetricamente à direita ou ao centro da sua coluna.
2. **Alinhamento Vertical (Acima e Abaixo):**
   - Elementos em blocos paralelos ou sequenciais mantêm espaçamentos padronizados (`margin` e `padding` fixos), criando linhas verticais limpas ao percorrer a folha.
3. **Zelo Tipográfico e Fluidez de Leitura:**
   - Textos clínicos completos, sem truncamento de palavras.
   - Nomes de drogas, termos fisiológicos e escores claros e legíveis mesmo quando fotocopiados.

---

## 6. Escalas com Estímulos Gráficos e Visuais (SVG Vetorial Puro)

Para escalas que exigem tarefas gráficas pelo paciente ou pelo examinador (ex: Teste MoCA, Escala Visual Analógica de Dor - EVA):
* **É ESTRITAMENTE PROIBIDO utilizar imagens rasterizadas (.png ou .jpg compactados)**, pois perdem nitidez ao imprimir em alta resolução.
* **DEVE-SE utilizar SVGs vetoriais puros embutidos diretamente no código:**
  - **Teste de Trilha (Trail Making):** Círculos `<circle>` com números e letras intercalados e linhas de ligação tracejadas `<line stroke-dasharray="3,3">`.
  - **Cópia do Cubo:** Wireframe isométrico 3D construído com `<polygon>` e `<line>`.
  - **Desenho do Relógio:** Círculo `<circle>` com mostrador de 1 a 12 e ponteiros indicando o horário padrão do teste (11h10min).
  - **Nomeação de Animais:** Silhuetas vetoriais `<path>` de contorno nítido com boxes de resposta `[ ]` centralizados abaixo de cada figura.
  - **Escala de Dor:** Réguas milimétricas com traços verticais uniformes de 0 a 10 e marcadores descritivos de intensidade.


---

## 7. Passo a Passo Universal para Transformar Novas Escalas (Receita para IAs)

Quando o desenvolvedor solicitar a criação de um formulário PDF para qualquer calculadora do portal:

### Passo 1: Inspeção do Arquivo HTML Original
1. Abrir a página HTML da calculadora (ex: `calculadoras-de-enfermagem/aldrete.html` ou na raiz).
2. Extrair os critérios clínicos:
   - Título formal da escala e sua indicação clínica.
   - Domínios ou categorias de avaliação.
   - Opções de resposta e as pontuações associadas a cada uma.
   - Fórmula ou amplitude de pontos (Escore Mínimo e Máximo).
   - Tabela de estratificação de risco (faixas numéricas e condutas).
   - Referência bibliográfica formal da escala (autor, ano, periódico).

### Passo 2: Escolha do Modo de Layout
* Se a escala tem até 11 itens ➔ Usar `self.layout_mode = "single"` (Coluna única).
* Se a escala tem 12 ou mais itens ➔ Usar `self.layout_mode = "double_col"` (Duas colunas).
* Se a escala possui tarefas gráficas ➔ Modelar os SVGs com `<svg>` inline e injetar via `add_raw_html_section()`.

### Passo 3: Criação do Script de Geração
Criar um script em Python que instancia `FormPDFEngine`, popula os dados e chama `.render(caminho_pdf)`.

Exemplo:
```python
from MOTOR_DE_RENDERIZACAO_CANONICO import FormPDFEngine

engine = FormPDFEngine(
    title="ESCALA DE RAMSAY",
    subtitle="Avaliação do Nível de Sedação em Pacientes Críticos",
    max_score="6 pontos",
    reference="Ramsay MA, et al. Controlled sedation with alphaxalone-alphadolone. BMJ, 1974."
)

engine.add_table_section("NÍVEIS DE SEDAÇÃO", [
    ("Ramsay 1", [("Ansioso, agitado ou inquieto", 1)]),
    ("Ramsay 2", [("Cooperativo, orientado e tranquilo", 2)]),
    ("Ramsay 3", [("Sedado, responde apenas a comandos verbais", 3)]),
    ("Ramsay 4", [("Dormindo, resposta rápida ao estímulo tátil leve ou sonoro", 4)]),
    ("Ramsay 5", [("Dormindo, resposta lenta a estímulo doloroso/sonoro vigoroso", 5)]),
    ("Ramsay 6", [("Sedação profunda, nenhuma resposta aos estímulos", 6)])
])

engine.set_risk_stratification([
    ("Subsedação", "Nível 1", "Risco de extubação acidental e agitação psicomotora.", "yellow"),
    ("Sedação Adequada", "Níveis 2 a 3", "Alvo recomendado para a maioria dos pacientes em UTI.", "green"),
    ("Sedação Moderada", "Nível 4", "Adequado para ventilação mecânica agressiva sincronizada.", "green"),
    ("Sedação Profunda", "Níveis 5 a 6", "Monitorar hipotensão, íleo e tempo de desmame ventilatório.", "red")
])

engine.render("c:/calculadoras-de-enfermagem/FORMULARIOS_DE_ESCALAS/formulario_escala_de_ramsay.pdf")
```

### Passo 4: Execução do Headless Browser
O script compila o HTML temporário e invoca o Edge/Chrome com:
```bash
msedge.exe --headless --disable-gpu --no-pdf-header-footer --print-to-pdf="saida.pdf" "temp.html"
```

### Passo 5: Auditoria Geométrica Obrigatória (Contra-Prova)
Rodar o script auditor:
```bash
python CATALOGO_INTRUCOES_CRIACAO_DE_FORMULARIOS/AUDITOR_GEOMETRIA_FORMULARIOS_PDF.py
```
* **Critério de Aprovação:**
  - `Páginas == 1`
  - `Ocupação entre 65.0% e 95.0%`
  - Zero erros críticos.

---

## 8. Checklist de Qualidade Obrigatório

Antes de considerar qualquer novo formulário finalizado, responda SIM para todos os itens:

- [ ] O arquivo PDF gerado possui exatamente **1 página** (sem página secundária em branco)?
- [ ] A mancha gráfica ocupa entre **70% e 85%** da folha A4 (sem sobrar vazios gigantes nem transbordar)?
- [ ] O cabeçalho possui o fundo azul navy institucional (`#1A3E74`) com a marca `CALCULADORAS DE ENFERMAGEM`?
- [ ] Há a tabela completa de identificação do paciente (Nome, Idade/DN, Prontuário, Leito, Setor, Data, Hora, Avaliador)?
- [ ] Todas as caixas `[ ]` e pontuações estão rigorosamente alinhadas à direita em grade uniforme?
- [ ] O painel de escore total exibe o campo aberto para soma e a pontuação máxima possível?
- [ ] Há cartões de estratificação de risco coloridos com condutas de enfermagem objetivas?
- [ ] Há linhas demarcadas para carimbo e assinatura do enfermeiro (COREN) e visto da supervisão?
- [ ] A citação bibliográfica formal e o link do portal estão presentes no rodapé?
- [ ] Caso haja testes gráficos, eles foram desenhados em SVG vetorial nítido (não bitmap)?
- [ ] O script de auditoria geométrica foi executado e emitiu `[APROVADO]`?

