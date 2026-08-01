# PADRÃO OFICIAL DE LOGS

Versão: 1.0

Este documento define o padrão oficial de logs do projeto.

Todos os módulos deverão seguir exatamente este padrão.

Nunca utilizar prints aleatórios.

Toda saída deverá possuir um padrão único.

---

# OBJETIVO

Facilitar:

• depuração

• manutenção

• auditoria

• suporte

• identificação de erros

---

# LOCAL DOS LOGS

Todos os arquivos de log deverão ser armazenados em:

logs/

Nunca salvar logs em outras pastas.

---

# NOMES DOS ARQUIVOS

Formato:

AAAA-MM-DD.log

Exemplo

2026-08-01.log

---

# FORMATO DOS LOGS

Cada linha deverá possuir:

DATA

HORA

NÍVEL

MÓDULO

MENSAGEM

Exemplo

2026-08-01 09:10:22

INFO

ETAPA_02

Imagem carregada.

---

# NÍVEIS

DEBUG

Informações detalhadas.

Utilizado apenas durante desenvolvimento.

---

INFO

Informações normais.

Início

Fim

Quantidade

Tempo

---

WARNING

Problemas não críticos.

Exemplo

Imagem muito pequena.

Objeto ignorado.

Cache inexistente.

---

ERROR

Erro recuperável.

Pipeline continua.

---

CRITICAL

Erro crítico.

Pipeline interrompido.

---

# ETAPAS

Cada etapa deverá registrar:

Início

Fim

Tempo

Resultado

---

Exemplo

INFO

ETAPA_01

Iniciando abertura da imagem.

↓

INFO

ETAPA_01

Imagem aberta com sucesso.

↓

INFO

ETAPA_01

Tempo:

0.12 segundos.

---

# DETECÇÃO

Registrar

Quantidade de objetos.

Área média.

Área máxima.

Área mínima.

Tempo.

---

Exemplo

Objetos encontrados:

61

---

# EXPORTAÇÃO

Registrar

Arquivo

Destino

Largura

Altura

Formato

---

# OPENAI

Registrar

Modelo utilizado.

Quantidade de objetos.

Tempo.

Resposta válida.

Falhas.

Nunca registrar:

API Keys

Tokens privados

Credenciais

---

# WEBP

Registrar

PNG original

WEBP criado

Qualidade

Tamanho final

Compressão

---

# MANIFEST

Registrar

Quantidade de componentes.

Tempo de geração.

Arquivo criado.

---

# HTML

Registrar

Página criada.

Quantidade de componentes.

Tempo.

---

# CACHE

Registrar

Cache encontrado.

Cache criado.

Cache reutilizado.

---

# ERROS

Sempre registrar

arquivo

função

linha

mensagem

tipo da exceção

Nunca registrar apenas

"Ocorreu um erro."

---

# EXEMPLO

ERROR

etapa_04_analisar_openai.py

função

analisar_objeto()

Linha

84

Mensagem

JSON inválido retornado pela OpenAI.

---

# TEMPO

Toda etapa deverá registrar

tempo inicial

tempo final

tempo total

---

# RESUMO FINAL

Ao terminar o pipeline

Registrar

Imagem

Objetos detectados

Objetos classificados

Objetos aprovados

WEBP gerados

Tempo total

---

Exemplo

========================================

PIPELINE FINALIZADO

========================================

Imagem:

teste.png

Objetos:

61

Aprovados:

17

WEBP:

17

Tempo:

4.82 s

---

# CONSOLE

As mensagens do console deverão seguir exatamente este padrão.

========================================

ETAPA 01

ABRIR IMAGEM

========================================

Mensagem...

---

# LOGS COLORIDOS

Quando possível

INFO

verde

WARNING

amarelo

ERROR

vermelho

CRITICAL

fundo vermelho

Caso não seja possível

utilizar apenas texto.

---

# SILÊNCIO

Nunca imprimir informações desnecessárias.

O console deverá mostrar apenas informações úteis.

---

# REGRA FINAL

Todo módulo novo deverá produzir logs padronizados.

Nunca criar um padrão diferente.

Todo log deverá seguir este documento.