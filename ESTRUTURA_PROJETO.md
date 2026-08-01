# ESTRUTURA OFICIAL DO PROJETO

Versão: 1.0

Este documento define a estrutura oficial do repositório.

Nenhum arquivo deve ser criado em local diferente sem autorização do usuário.

Antes de criar qualquer arquivo novo, verificar este documento.

---

# OBJETIVO

Manter o projeto organizado.

Garantir que todos os módulos possuam apenas uma responsabilidade.

Evitar arquivos duplicados.

Evitar estruturas paralelas.

---

# RAIZ DO PROJETO

calculadoras-de-enfermagem/

A raiz contém apenas arquivos de configuração, documentação e pastas principais.

Exemplo:

calculadoras-de-enfermagem/

.ai/

automacoes/

biblioteca/

blog/

css/

downloads/

docs/

font/

img/

js/

public/

src/

.vscode/

.env

.gitignore

README.md

---

# AUTOMAÇÕES

Toda automação Python deverá ficar em:

automacoes/

Cada automação deverá possuir sua própria pasta.

Exemplo

automacoes/

seo/

traducao/

extrator_infograficos/

backup/

---

# EXTRATOR DE INFOGRÁFICOS

Toda implementação deste projeto deverá permanecer em:

automacoes/extrator_infograficos/

---

Estrutura oficial

extrator_infograficos/

config.py

extrair.py

openai_client.py

requirements.txt

pipeline/

entrada/

temp/

saida/

biblioteca/

logs/

cache/

---

# PIPELINE

A pasta pipeline contém apenas as etapas do processo.

pipeline/

etapa_01_abrir_imagem.py

etapa_02_detectar_regioes.py

etapa_03_exportar_objetos.py

etapa_04_analisar_openai.py

etapa_05_filtrar_objetos.py

etapa_06_exportar_webp.py

etapa_07_manifest.py

etapa_08_html.py

Nunca colocar outros arquivos aqui.

---

# ENTRADA

entrada/

Contém apenas arquivos enviados pelo usuário.

Nunca modificar o arquivo original.

---

# TEMP

temp/

Contém arquivos temporários.

Pode conter:

PNG

debug

threshold

objetos

contornos

Arquivos desta pasta podem ser recriados.

Nunca depender deles permanentemente.

---

# SAÍDA

saida/

Contém apenas arquivos finais gerados pelo pipeline.

Exemplos

manifest.json

layout.json

html

relatórios

---

# BIBLIOTECA

biblioteca/

Contém apenas componentes aprovados.

Nunca armazenar arquivos temporários aqui.

Exemplo

biblioteca/

seringas/

icones/

logos/

fotografias/

---

# LOGS

logs/

Armazenar apenas:

logs

erros

estatísticas

Nunca armazenar imagens.

---

# CACHE

cache/

Guardar:

respostas OpenAI

hashes

resultados temporários

Objetivo:

evitar chamadas repetidas.

---

# CONFIG.PY

Toda configuração do projeto deverá ficar aqui.

Exemplo

pastas

constantes

qualidade WEBP

modelo OpenAI

limites

Nunca repetir constantes em outros arquivos.

---

# OPENAI_CLIENT.PY

Único local permitido para:

cliente OpenAI

autenticação

configuração da API

Nunca criar outro cliente.

---

# EXTRAIR.PY

Responsável apenas por:

executar o pipeline

coordenar etapas

Nunca colocar regras de negócio aqui.

---

# RESPONSABILIDADE DAS ETAPAS

Cada etapa deverá possuir apenas uma responsabilidade.

Nunca misturar etapas.

---

# NOVOS ARQUIVOS

Antes de criar qualquer arquivo:

Pesquisar no projeto.

Se existir arquivo semelhante:

reutilizar.

---

# NOVAS PASTAS

Nunca criar novas pastas sem necessidade.

Sempre reutilizar estrutura existente.

---

# PADRÃO DE NOMES

Arquivos:

snake_case

Pastas:

snake_case

Nunca utilizar:

CamelCase

Espaços

Caracteres especiais

---

# IMPORTS

Sempre utilizar imports relativos ao projeto.

Nunca utilizar caminhos absolutos.

---

# DOCUMENTAÇÃO

Todo novo módulo importante deverá possuir documentação.

---

# TESTES

Sempre testar antes de concluir qualquer etapa.

---

# REGRA FINAL

Antes de criar qualquer arquivo:

1. Ler PROMPT_MASTER.md

2. Ler ARQUITETURA.md

3. Ler RULES.md

4. Ler ESTRUTURA_PROJETO.md

Depois implementar.

Caso exista dúvida sobre onde criar um arquivo:

perguntar ao usuário antes de criar.