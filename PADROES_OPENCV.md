# PADRÃO OFICIAL DE UTILIZAÇÃO DO OPENCV

Versão: 1.0

Este documento define como o OpenCV deverá ser utilizado neste projeto.

Todas as implementações futuras deverão seguir estas regras.

---

# OBJETIVO

Utilizar o OpenCV exclusivamente para processamento de imagens.

O OpenCV NÃO deverá tomar decisões inteligentes.

Sua responsabilidade é apenas executar operações visuais.

---

# RESPONSABILIDADES DO OPENCV

O OpenCV poderá apenas:

• abrir imagens

• detectar contornos

• localizar componentes

• gerar bounding boxes

• recortar imagens

• converter imagens

• redimensionar imagens

• remover ruídos

• aplicar filtros

• detectar linhas

• detectar formas

• salvar imagens

Nada além disso.

---

# RESPONSABILIDADES DA OPENAI

A OpenAI será responsável por:

• identificar componentes

• classificar objetos

• gerar categorias

• gerar descrições

• decidir:

extrair=true

ou

extrair=false

Nunca utilizar OpenCV para essas tarefas.

---

# ABERTURA DE IMAGENS

Sempre utilizar:

cv2.imread()

Validar retorno.

Nunca assumir que a imagem foi carregada corretamente.

---

# CORES

Utilizar:

BGR

quando trabalhar internamente.

Converter para RGB apenas quando necessário.

---

# ESCALA DE CINZA

Sempre utilizar:

cv2.cvtColor()

Nunca converter manualmente.

---

# BINARIZAÇÃO

Priorizar:

Threshold

Adaptive Threshold

Otsu

Escolher o método mais adequado para cada situação.

---

# CONTORNOS

Utilizar:

cv2.findContours()

Retornar sempre:

bounding boxes

Nunca retornar apenas contornos.

---

# OBJETOS

Todo objeto detectado deverá possuir:

id

x

y

w

h

area

arquivo

Nunca retornar apenas coordenadas.

---

# FILTROS

Priorizar:

Gaussian Blur

Median Blur

Morphology

Apenas quando necessário.

Evitar processamento excessivo.

---

# MORFOLOGIA

Operações permitidas:

Open

Close

Dilate

Erode

Utilizar kernels pequenos.

Nunca utilizar valores arbitrários sem justificativa.

---

# DETECÇÃO

Sempre utilizar critérios mínimos:

área mínima

largura mínima

altura mínima

Ignorar ruídos.

---

# RECORTES

Todo recorte deverá ser salvo inicialmente em PNG.

Nunca salvar diretamente em WEBP.

A conversão será responsabilidade da ETAPA 06.

---

# EXPORTAÇÃO

Salvar sempre utilizando:

cv2.imwrite()

Validar sucesso da operação.

---

# WEBP

O OpenCV poderá converter imagens.

Mas a organização da biblioteca será responsabilidade do Python.

---

# CAMINHOS

Sempre utilizar pathlib.

Nunca utilizar caminhos absolutos.

Nunca concatenar caminhos manualmente.

---

# PERFORMANCE

Evitar abrir a mesma imagem várias vezes.

Sempre reutilizar imagens carregadas.

Evitar processamento duplicado.

---

# MEMÓRIA

Liberar objetos grandes quando não forem mais necessários.

Evitar manter imagens duplicadas em memória.

---

# DEBUG

Durante o desenvolvimento:

Salvar imagens intermediárias na pasta:

temp/

Exemplos:

threshold.png

contornos.png

objetos.png

debug.png

Esses arquivos poderão ser removidos posteriormente.

---

# LOGS

Registrar:

imagem aberta

objetos encontrados

tempo de processamento

imagem exportada

erros

---

# EXCEÇÕES

Nunca ignorar erros.

Sempre informar:

arquivo

função

causa

---

# QUALIDADE

Nunca reduzir qualidade durante os recortes.

Os PNGs temporários devem manter a qualidade original.

---

# RESPONSABILIDADE

OpenCV executa.

Python coordena.

OpenAI decide.

Nunca inverter essas responsabilidades.

---

# BOAS PRÁTICAS

Preferir funções pequenas.

Evitar duplicação.

Evitar números mágicos.

Criar constantes em config.py.

---

# REGRA FINAL

Antes de escrever qualquer código OpenCV:

1. Ler PROMPT_MASTER.md

2. Ler ARQUITETURA.md

3. Ler RULES.md

4. Ler PADROES_OPENCV.md

Depois implementar.