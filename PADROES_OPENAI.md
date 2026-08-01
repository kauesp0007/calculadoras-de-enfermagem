# PADRÃO OFICIAL DE UTILIZAÇÃO DA OPENAI

Versão: 1.0

Este documento define como a OpenAI deverá ser utilizada em todo o projeto.

Todas as implementações futuras deverão seguir este padrão.

---

# OBJETIVO

Utilizar a OpenAI apenas para tarefas cognitivas.

Nunca utilizar OpenAI para tarefas que possam ser resolvidas localmente.

---

# RESPONSABILIDADES DA OPENAI

A OpenAI poderá apenas:

• classificar componentes

• identificar objetos

• gerar categorias

• gerar descrições

• gerar nomes

• responder JSON

• analisar imagens

Nunca utilizar OpenAI para:

• abrir imagens

• detectar contornos

• recortar imagens

• converter WEBP

• processamento gráfico

• OCR simples

Essas tarefas pertencem ao OpenCV ou ao Python.

---

# MODELOS

Sempre utilizar o modelo definido em config.py.

Nunca escrever o nome do modelo diretamente no código.

Exemplo

MODEL_OPENAI

Nunca:

"gpt-4.1"

hardcoded em vários arquivos.

---

# API

Toda comunicação deverá passar exclusivamente por:

openai_client.py

Nunca criar clientes OpenAI em outros módulos.

Nunca repetir código de autenticação.

---

# PROMPTS

Nunca escrever prompts diretamente dentro do código quando forem grandes.

Prompts longos deverão ficar em arquivos separados.

Exemplo

prompts/

classificar_objeto.md

descrever_imagem.md

categorizar.md

layout.md

---

# FORMATO DAS RESPOSTAS

Sempre solicitar:

JSON

Nunca solicitar texto livre quando o resultado será utilizado pelo sistema.

---

# JSON

Toda resposta deverá possuir estrutura fixa.

Exemplo

{

    "tipo":"",

    "categoria":"",

    "nome":"",

    "descricao":"",

    "extrair":true

}

Nunca permitir respostas sem estrutura.

---

# TEMPERATURA

Utilizar baixa aleatoriedade.

Objetivo

Resultados consistentes.

Evitar respostas diferentes para a mesma imagem.

---

# TOKENS

Nunca solicitar respostas maiores que o necessário.

Sempre limitar a saída.

Evitar desperdício de tokens.

---

# PROCESSAMENTO

Sempre que possível:

Processar em lote.

Reduzir quantidade de chamadas.

Nunca enviar a mesma imagem duas vezes.

---

# CACHE

Sempre verificar se o componente já foi analisado.

Se existir cache válido:

utilizar cache.

Evitar nova chamada.

---

# TRATAMENTO DE ERROS

Sempre validar:

JSON

campos obrigatórios

estrutura

tipos

Nunca assumir que a IA respondeu corretamente.

---

# RETENTATIVAS

Quando ocorrer erro:

Tentar novamente.

Número máximo:

3 tentativas.

Após isso:

registrar erro.

Continuar pipeline.

---

# LOGS

Registrar:

arquivo

tempo

modelo

tokens

status

erro quando existir

---

# CUSTO

Minimizar chamadas.

Priorizar processamento local.

Utilizar IA apenas quando necessário.

---

# PROMPTS

Todo prompt deve ser:

objetivo

determinístico

curto

específico

---

# SEGURANÇA

Nunca gravar API Key.

Sempre utilizar:

.env

Nunca expor credenciais em:

logs

prints

json

html

github

---

# SAÍDA

Toda resposta utilizada pelo sistema deverá ser convertida para objetos Python.

Nunca manipular texto bruto.

---

# VALIDAÇÃO

Antes de utilizar qualquer resposta da IA:

Validar JSON.

Validar campos.

Validar tipos.

Validar valores.

---

# RESPONSABILIDADE

OpenAI apenas decide.

Python executa.

OpenCV processa imagens.

Nunca inverter essas responsabilidades.

---

# EVOLUÇÃO

Caso novos modelos OpenAI sejam adicionados:

A arquitetura não deverá ser alterada.

Apenas config.py deverá ser atualizado.

---

# REGRA FINAL

Antes de criar qualquer integração com OpenAI:

1. Ler PROMPT_MASTER.md

2. Ler ARQUITETURA.md

3. Ler RULES.md

4. Ler PADROES_OPENAI.md

Depois implementar.