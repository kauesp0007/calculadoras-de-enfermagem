# PADRÃO OFICIAL DE DESENVOLVIMENTO PYTHON

Versão: 1.0

Este documento define como TODO código Python deste projeto deve ser escrito.

Estas regras são obrigatórias.

Nunca gerar código que viole este documento.

---

# OBJETIVO

Manter todo o projeto consistente.

Todo arquivo Python deve parecer ter sido escrito pelo mesmo desenvolvedor.

---

# VERSÃO

Python 3.12+

---

# ORGANIZAÇÃO

Sempre utilizar:

imports

↓

constantes

↓

classes

↓

funções

↓

main()

---

Exemplo

import ...

CONSTANTE = ...

class ...

def ...

def main():

if __name__ == "__main__":
    main()

---

# IMPORTS

Sempre organizar nesta ordem.

Bibliotecas padrão

Bibliotecas externas

Bibliotecas do projeto

Exemplo

from pathlib import Path

import json

import cv2

from config import TEMP

---

Nunca importar dentro de funções.

Exceto quando realmente necessário.

---

# PATHS

Nunca utilizar:

"C:\\"

"/home/"

"./"

"../"

Sempre utilizar:

pathlib.Path

Exemplo

TEMP / "arquivo.png"

Nunca concatenar caminhos utilizando strings.

---

# NOMES DE ARQUIVOS

Sempre utilizar letras minúsculas.

Separação por underscore.

Correto

exportar_objetos.py

Errado

ExportarObjetos.py

Exportar-Objetos.py

---

# NOMES DE FUNÇÕES

Sempre:

snake_case

Correto

abrir_imagem()

exportar_objetos()

Errado

AbrirImagem()

ExportarObjetos()

---

# NOMES DE VARIÁVEIS

Sempre utilizar nomes claros.

Correto

imagem

objeto

arquivo

manifest

categoria

tipo

Errado

a

b

tmp

abc

---

# TIPAGEM

Sempre utilizar type hints quando possível.

Exemplo

def abrir_imagem(
    caminho: Path
):

def exportar_objetos(
    imagem,
    objetos: list
):

---

# DOCSTRINGS

Toda função pública deve possuir docstring.

Exemplo

def abrir_imagem(caminho: Path):

    """
    Abre uma imagem utilizando OpenCV.

    Retorna a imagem carregada.
    """

---

# TAMANHO DAS FUNÇÕES

Ideal

20 a 50 linhas

Máximo recomendado

100 linhas

Se ultrapassar

Dividir em funções menores.

---

# TAMANHO DOS ARQUIVOS

Ideal

Até 300 linhas

Máximo

500 linhas

Se ultrapassar

Criar novo módulo.

---

# RESPONSABILIDADE

Uma função

↓

Uma responsabilidade

Nunca criar funções que façam várias coisas.

---

# EXCEÇÕES

Nunca utilizar:

except:

Sempre utilizar

except Exception as erro:

Mostrar erro.

Registrar log.

---

# LOGS

Toda etapa deve possuir logs.

Exemplo

print("Abrindo imagem...")

print("Objetos encontrados:")

print("Exportando WEBP...")

---

# JSON

Sempre utilizar

indent=4

ensure_ascii=False

encoding="utf-8"

---

# OPENCV

Nunca misturar lógica OpenAI.

OpenCV apenas:

abrir

recortar

converter

salvar

---

# OPENAI

Nunca realizar processamento gráfico.

OpenAI apenas:

classificar

categorizar

nomear

descrever

---

# PRINTS

Mensagens sempre padronizadas.

Exemplo

========================================

ETAPA 04

CLASSIFICANDO OBJETOS

========================================

---

# MAIN

Todo programa executável deve possuir

def main():

if __name__ == "__main__":
    main()

---

# CÓDIGO DUPLICADO

Nunca duplicar funções.

Antes de escrever código

Pesquisar no projeto.

---

# PERFORMANCE

Evitar processamento duplicado.

Evitar chamadas repetidas.

Utilizar cache quando possível.

---

# SEGURANÇA

Nunca gravar API Keys.

Sempre utilizar .env

Nunca alterar .gitignore

---

# COMENTÁRIOS

Escrever apenas comentários úteis.

Evitar comentar código óbvio.

Priorizar nomes de funções claros.

---

# MODULARIZAÇÃO

Cada módulo deve possuir apenas um objetivo.

Nunca misturar responsabilidades.

---

# TESTES

Sempre validar:

Entradas

Saídas

Arquivos

JSON

Resposta OpenAI

---

# REGRA FINAL

Antes de escrever qualquer código Python:

1. Ler PROMPT_MASTER.md

2. Ler ARQUITETURA.md

3. Ler RULES.md

4. Ler este documento.

Depois implementar.