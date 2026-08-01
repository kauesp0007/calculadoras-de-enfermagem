# ROADMAP OFICIAL DO PROJETO

Versão: 1.0

Este documento define todas as etapas de desenvolvimento da ferramenta.

Nenhuma etapa deve ser pulada.

Sempre concluir uma etapa antes de iniciar a próxima.

---

# OBJETIVO FINAL

Construir uma ferramenta profissional capaz de transformar infográficos em componentes reutilizáveis para HTML.

---

# VERSÃO 1.0

## Pipeline básico

Status:

CONCLUÍDA

Objetivos:

✔ Abrir imagem

✔ Detectar objetos

✔ Exportar objetos

✔ Integrar OpenAI

✔ Classificar objetos

✔ Filtrar componentes

✔ Exportar WEBP

✔ Gerar manifest.json

✔ Gerar HTML

---

# ETAPA 01

Abrir imagem

Status:

Concluída

Responsabilidades:

• localizar imagem

• validar existência

• carregar imagem

• validar integridade

---

# ETAPA 02

Detectar objetos

Status:

Concluída

Responsabilidades:

• OpenCV

• localizar componentes

• retornar coordenadas

---

# ETAPA 03

Exportar objetos

Status:

Concluída

Responsabilidades:

• recortar PNG

• salvar em temp

---

# ETAPA 04

Classificar objetos

Status:

Concluída

Responsabilidades:

• OpenAI Vision

• tipo

• categoria

• descrição

• nome

• extrair=true

---

# ETAPA 05

Filtrar objetos

Status:

Concluída

Responsabilidades:

• copiar apenas objetos úteis

• ignorar textos

• ignorar linhas

• ignorar células

---

# ETAPA 06

Converter WEBP

Status:

Concluída

Responsabilidades:

• converter PNG

• organizar biblioteca

• manter qualidade

---

# ETAPA 07

Manifest

Status:

Concluída

Responsabilidades:

Gerar:

manifest.json

contendo:

nome

categoria

tipo

arquivo

descrição

largura

altura

---

# ETAPA 08

HTML

Status:

Concluída

Responsabilidades:

Gerar HTML utilizando os componentes extraídos.

---

# VERSÃO 2.0

Objetivos

Processamento em lote

Selecionar pasta

Barra de progresso

Relatório

---

# VERSÃO 3.0

OCR

Reconhecimento de texto

Exportação Markdown

Exportação JSON

---

# VERSÃO 4.0

SVG

Vetorização

Ícones

Logotipos

---

# VERSÃO 5.0

Interface gráfica

Drag and Drop

Fila de processamento

---

# VERSÃO 6.0

Biblioteca inteligente

Pesquisa

Categorias

Tags

Busca

---

# VERSÃO 7.0

Reconstrução automática de páginas HTML completas.

---

# CRITÉRIOS PARA CONCLUSÃO

O projeto será considerado concluído quando for capaz de:

• abrir qualquer infográfico

• detectar objetos

• classificá-los

• filtrar componentes úteis

• gerar WEBP

• gerar manifest.json

• gerar HTML reutilizável

de forma automática.

---

# POLÍTICA DE DESENVOLVIMENTO

Nunca iniciar uma nova versão antes de concluir a versão atual.

Sempre priorizar estabilidade.

Sempre manter compatibilidade com versões anteriores.

Sempre evitar regressões.
