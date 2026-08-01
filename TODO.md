# TODO OFICIAL DO PROJETO

Versão: 1.0

Este documento controla o andamento do projeto.

Sempre atualizar este arquivo após concluir uma etapa.

Nunca iniciar uma tarefa nova antes de concluir a atual.

---

# STATUS GERAL

Projeto:

Extrator Inteligente de Infográficos

Status:

CONCLUÍDO

Versão atual:

1.0

---

# ETAPA 01

Nome:

Abrir imagem

Status:

✅ CONCLUÍDA

Objetivos:

✔ localizar arquivo

✔ validar existência

✔ abrir imagem

✔ validar integridade

✔ retornar imagem para pipeline

---

# ETAPA 02

Nome:

Detectar objetos

Status:

✅ CONCLUÍDA

Objetivos:

✔ detectar componentes

✔ localizar bounding boxes

✔ retornar lista de objetos

---

# ETAPA 03

Nome:

Exportar objetos

Status:

✅ CONCLUÍDA

Objetivos:

✔ recortar PNG

✔ salvar em temp

✔ manter coordenadas

---

# ETAPA 04

Nome:

Classificar objetos

Status:

✅ CONCLUÍDA

Objetivos:

✔ integrar OpenAI

✔ enviar imagens

✔ receber classificação

✔ validar resposta JSON

✔ melhorar prompt

✔ reduzir custo de tokens

✔ adicionar cache

✔ tratar erros da API

---

# ETAPA 05

Nome:

Filtrar objetos

Status:

✅ CONCLUÍDA

Objetivos:

✔ ler classificação

✔ manter apenas:

ícones

fotografias

imagens

logotipos

✔ ignorar:

texto

linhas

células

bordas

---

# ETAPA 06

Nome:

Converter WEBP

Status:

✅ CONCLUÍDA

Objetivos:

✔ converter PNG

✔ qualidade 90

✔ otimizar tamanho

✔ manter transparência

---

# ETAPA 07

Nome:

Manifest

Status:

✅ CONCLUÍDA

Objetivos:

Gerar:

manifest.json

Cada componente deverá possuir:

nome

tipo

categoria

arquivo

largura

altura

descrição

tags

---

# ETAPA 08

Nome:

Gerar HTML

Status:

✅ CONCLUÍDA

Objetivos:

Gerar HTML automaticamente.

Utilizar apenas componentes aprovados.

Gerar estrutura limpa.

---

# MELHORIAS FUTURAS

☐ processamento em lote

☐ barra de progresso

☐ cache inteligente

☐ OCR

☐ SVG

☐ interface gráfica

☐ drag and drop

☐ banco de componentes

☐ pesquisa

☐ exportação Markdown

☐ exportação JSON avançada

☐ logs detalhados

☐ configuração por arquivo

☐ múltiplos modelos OpenAI

☐ suporte a múltiplos idiomas

---

# BUGS CONHECIDOS

OpenCV ainda detecta células inteiras da tabela.

A classificação da OpenAI pode interpretar um recorte de forma incorreta quando o componente não está isolado.

Necessário melhorar o filtro antes da exportação final.

---

# PRÓXIMA TAREFA

Pipeline da versão 1.0 concluído.

Não iniciar a versão 2.0 sem autorização do usuário.

---

# REGRA

Sempre atualizar este arquivo ao concluir qualquer etapa.

Nunca deixar tarefas concluídas marcadas como pendentes.

Sempre manter este documento sincronizado com o estado real do projeto.
