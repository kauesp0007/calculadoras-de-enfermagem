# ARQUITETURA OFICIAL DO PROJETO

Versão: 1.0

Este documento define a arquitetura oficial do projeto.

Todas as implementações futuras devem seguir rigorosamente esta arquitetura.

Nenhuma alteração estrutural deve ser feita sem autorização do usuário.

---

# OBJETIVO

Construir uma ferramenta profissional capaz de extrair componentes gráficos de infográficos e convertê-los em recursos reutilizáveis para páginas HTML.

A ferramenta deverá identificar automaticamente elementos gráficos, classificá-los utilizando IA e gerar uma biblioteca organizada de componentes.

---

# TECNOLOGIAS

Python 3.x

OpenCV

OpenAI Vision

Pillow

WEBP

HTML5

CSS3

JSON

---

# FLUXO OFICIAL

Imagem

↓

ETAPA 01

Abrir imagem

↓

ETAPA 02

Detectar objetos

↓

ETAPA 03

Exportar objetos

↓

ETAPA 04

Classificar objetos com OpenAI

↓

ETAPA 05

Filtrar objetos úteis

↓

ETAPA 06

Converter WEBP

↓

ETAPA 07

Gerar manifest.json

↓

ETAPA 08

Gerar HTML

---

# ESTRUTURA DO PROJETO

extrator_infograficos/

config.py

extrair.py

openai_client.py

requirements.txt

pipeline/

etapa_01_abrir_imagem.py

etapa_02_detectar_regioes.py

etapa_03_exportar_objetos.py

etapa_04_analisar_openai.py

etapa_05_filtrar_objetos.py

etapa_06_exportar_webp.py

etapa_07_manifest.py

etapa_08_html.py

entrada/

temp/

saida/

biblioteca/

logs/

cache/

---

# RESPONSABILIDADE DAS ETAPAS

ETAPA 01

Abrir a imagem.

Verificar existência.

Validar integridade.

Carregar na memória.

---

ETAPA 02

Detectar componentes gráficos utilizando OpenCV.

Retornar lista de objetos encontrados.

---

ETAPA 03

Exportar cada objeto detectado para PNG temporário.

---

ETAPA 04

Utilizar OpenAI Vision para classificar cada objeto.

Gerar:

tipo

categoria

nome

descrição

extrair=true ou false

---

ETAPA 05

Ler o resultado da IA.

Copiar apenas objetos marcados como:

extrair=true

---

ETAPA 06

Converter PNG para WEBP.

Organizar biblioteca.

---

ETAPA 07

Gerar manifest.json contendo todos os componentes aprovados.

---

ETAPA 08

Gerar HTML automaticamente utilizando os componentes gerados.

---

# RESPONSABILIDADE DO OPENCV

Abrir imagens.

Detectar objetos.

Recortar imagens.

Converter imagens.

Salvar imagens.

Nunca utilizar OpenCV para classificar objetos.

---

# RESPONSABILIDADE DA OPENAI

Classificar objetos.

Nomear objetos.

Categorizar objetos.

Gerar descrições.

Decidir:

extrair=true

ou

extrair=false

Nunca utilizar OpenAI para realizar processamento gráfico.

---

# RESPONSABILIDADE DO PYTHON

Controlar o pipeline.

Organizar arquivos.

Controlar fluxo.

Gerar JSON.

Gerar HTML.

Gerar logs.

---

# REGRAS DE ARQUITETURA

Nunca pular etapas.

Nunca inverter etapas.

Nunca misturar responsabilidades.

Nunca duplicar funcionalidades.

Cada etapa deve possuir apenas uma responsabilidade.

Cada arquivo deve possuir apenas um objetivo.

---

# SAÍDAS ESPERADAS

Biblioteca WEBP

Manifest JSON

HTML

Logs

Componentes reutilizáveis

---

# OBJETIVO FINAL

Transformar qualquer infográfico em componentes reutilizáveis para páginas HTML mantendo qualidade, organização, modularidade e possibilidade de reutilização em outros projetos.