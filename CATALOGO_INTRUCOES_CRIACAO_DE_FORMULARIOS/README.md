# Catálogo de Instruções — Criação e Padronização de Formulários em Branco (PDF e HTML)

Este catálogo documenta de forma canônica, exaustiva e reprodutível o método completo em duas etapas para:
1. **Etapa 1:** Transformação de calculadoras em **Formulários Hospitalares em Branco em PDF nativo de alta definição**, estritamente formatados para **uma única página A4**, sem quebras e com a identidade visual do portal **Calculadoras de Enfermagem**.
2. **Etapa 2:** Criação das **Páginas HTML hospedeiras na raiz do portal**, exibindo o PDF aberto a 100% de largura útil com moldura proporcional A4, botão de download em vidro azul, SEO completo e conformidade Core Web Vitals.

---

## 🎯 Objetivo Deste Catálogo

Servir como memória operacional permanente para o desenvolvedor e como **especificação técnica mandatória para qualquer Inteligência Artificial (Cline, Claude, ChatGPT, Codex, DeepSeek, etc.)** encarregada de:
1. Criar um novo formulário em PDF a partir de uma escala existente em HTML;
2. Modernizar ou recalibrar formulários antigos para caber perfeitamente em 1 página A4;
3. Incorporar testes neuropsicológicos ou avaliações clínicas com estímulos visuais (SVGs vetoriais);
4. Criar a página HTML correspondente com visualizador embutido aberto em 100% (`ETAPA_2_CONSTRUINDO_PDF_PARA_PAGINA_HTML`);
5. Executar a auditoria e contra-prova geométrica automatizada antes da aprovação final.

---

## 📂 Estrutura Modular Deste Catálogo

### 📘 Módulo 1: Geração de Formulários PDF (Etapa 1)
| Arquivo | Descrição |
|---|---|
| [`MANUAL_CANONICO_CRIACAO_DE_FORMULARIOS_PDF.md`](./MANUAL_CANONICO_CRIACAO_DE_FORMULARIOS_PDF.md) | Manual passo a passo completo, detalhando cada etapa, decisões arquiteturais, regras de alinhamento e calibração de página. |
| [`MOTOR_DE_RENDERIZACAO_CANONICO.py`](./MOTOR_DE_RENDERIZACAO_CANONICO.py) | Script motor reutilizável em Python (`FormPDFEngine`) que monta o HTML paramétrico e invoca o renderizador Chromium/Edge. |
| [`ESTILO_BASE_IMPRESSAO_A4.css`](./ESTILO_BASE_IMPRESSAO_A4.css) | Folha de estilos CSS canônica calibrada para impressão A4 (`@page`, `.sheet`, tipografia de 7pt a 13pt). |
| [`AUDITOR_GEOMETRIA_FORMULARIOS_PDF.py`](./AUDITOR_GEOMETRIA_FORMULARIOS_PDF.py) | Script de contra-prova técnica via PyMuPDF (`fitz`) para auditar contagem de páginas (rigorosamente 1) e ocupação vertical (70%–85%). |
| [`TEMPLATES_EXEMPLOS_PRATICOS.md`](./TEMPLATES_EXEMPLOS_PRATICOS.md) | Exemplos de código prontos para 3 tipos de escalas: Escala Padrão, Escala Densa (2 colunas) e Escala Visual com SVG. |

### 🌐 Módulo 2: Geração das Páginas HTML de Visualização (Etapa 2)
📁 **Subpasta:** [`ETAPA_2_CONSTRUINDO_PDF_PARA_PAGINA_HTML/`](./ETAPA_2_CONSTRUINDO_PDF_PARA_PAGINA_HTML/)
| Arquivo | Descrição |
|---|---|
| [`ETAPA_2_CONSTRUINDO_PDF_PARA_PAGINA_HTML/README.md`](./ETAPA_2_CONSTRUINDO_PDF_PARA_PAGINA_HTML/README.md) | Visão geral da Etapa 2 (Hospedagem, SEO, Visualizador 100% e Download). |
| [`ETAPA_2_CONSTRUINDO_PDF_PARA_PAGINA_HTML/MANUAL_PAGINA_HTML_VISUALIZADOR_PDF_100.md`](./ETAPA_2_CONSTRUINDO_PDF_PARA_PAGINA_HTML/MANUAL_PAGINA_HTML_VISUALIZADOR_PDF_100.md) | Manual técnico detalhado da página HTML (Head canônico em 12 blocos, Iframe A4, Botão Vidro Azul, Menus e Build). |
| [`ETAPA_2_CONSTRUINDO_PDF_PARA_PAGINA_HTML/TEMPLATE_PAGINA_FORMULARIO_CANONICA.html`](./ETAPA_2_CONSTRUINDO_PDF_PARA_PAGINA_HTML/TEMPLATE_PAGINA_FORMULARIO_CANONICA.html) | Arquivo modelo HTML completo e validado, pronto para parametrização. |
| [`ETAPA_2_CONSTRUINDO_PDF_PARA_PAGINA_HTML/GERADOR_PAGINAS_HTML_FORMULARIOS.py`](./ETAPA_2_CONSTRUINDO_PDF_PARA_PAGINA_HTML/GERADOR_PAGINAS_HTML_FORMULARIOS.py) | Script gerador autônomo em lote ou individual de páginas HTML. |
| [`ETAPA_2_CONSTRUINDO_PDF_PARA_PAGINA_HTML/VALIDADOR_PAGINAS_HTML_FORMULARIOS.py`](./ETAPA_2_CONSTRUINDO_PDF_PARA_PAGINA_HTML/VALIDADOR_PAGINAS_HTML_FORMULARIOS.py) | Script auditor determinístico de integridade de páginas HTML de formulários. |

---

## 🏛️ Diretrizes Fundamentais (Regras Impositivas)

1. **Rigor de Página Única e Preenchimento Total da Folha (70% a 92%):**
   - O formulário DEVE caber inteiramente em **1 única folha A4** (210mm x 297mm).
   - ❌ **É TERMINANTEMENTE PROIBIDO espremer o formulário em apenas 1/4 da página e deixar os outros 3/4 em branco!**
   - A folha deve ser preenchida de forma harmônica, equilibrada e profissional em sua totalidade, com ocupação vertical ideal entre **70% e 92%**.
2. **Distribuição das Opções e Zelo Tipográfico:**
   - As opções de resposta de cada critério DEVEM ser **empilhadas verticalmente (uma por linha)**, com caixa de seleção `[ ]` (`.sq`) e pontuação explícita `(pts)`.
   - ❌ **É PROIBIDO quebrar palavras ou frases de texto pulando linha indiscriminadamente**, empilhando opções com `|` em larguras estreitas.
   - Textos alinhados à esquerda, caixas de pontuação alinhadas à direita ou ao centro da coluna.
3. **Identidade Visual Navy do Portal:**
   - Cabeçalho institucional azul `#1A3E74` com a marca `CALCULADORAS DE ENFERMAGEM` em azul claro `#93C5FD`.
   - Box de identificação hospitalar completo do paciente com campos generosos de preenchimento.
   - Painel destacado de Escore Total em `#EFF6FF` com borda navy.
   - Condutas clínicas em cartões coloridos (Verde `#16A34A`, Amarelo `#EAB308`, Laranja `#F97316`, Vermelho `#DC2626`).
   - Assinatura, carimbo do enfermeiro (COREN) e chancela oficial no rodapé.
4. **Alinhamento Bidirecional Estrito:**
   - Critérios e perguntas alinhados à esquerda; pontuações e caixas `[ ]` rigorosamente alinhadas à direita em grade fixa.
   - Alinhamento vertical e horizontal rigoroso dos títulos e caixas.
5. **Vetorização Pura (SVGs):** Desenhos, gráficos e diagramas clínicos DEVEM ser embutidos em SVG vetorial nativo (nunca PNGs ou JPEGs borrados).
6. **Auditoria Obrigatória:** Nenhuma tarefa de geração de PDF ou página HTML é considerada concluída sem passar pelos scripts auditores automatizados com 100% de aprovação.

