# PADRÃO OFICIAL DE TESTES

Versão: 1.0

Este documento define como todas as funcionalidades do projeto deverão ser testadas.

Nenhuma implementação poderá ser considerada concluída sem passar por estes testes.

---

# OBJETIVO

Garantir que:

• novas funcionalidades não quebrem o pipeline

• todas as etapas funcionem corretamente

• o projeto permaneça estável

---

# REGRA PRINCIPAL

Toda alteração deverá ser testada antes de ser considerada concluída.

Nunca assumir que o código funciona.

Sempre executar testes.

---

# TIPOS DE TESTE

O projeto deverá possuir os seguintes testes:

✔ teste funcional

✔ teste de integração

✔ teste de performance

✔ teste de estabilidade

✔ teste de tratamento de erros

✔ teste visual

---

# ETAPA 01

Abrir imagem

Verificar

☐ imagem existe

☐ imagem abre corretamente

☐ largura correta

☐ altura correta

☐ canais corretos

☐ erro tratado quando arquivo não existe

---

# ETAPA 02

Detectar objetos

Verificar

☐ quantidade de objetos

☐ bounding boxes

☐ objetos dentro da imagem

☐ sem objetos negativos

☐ sem áreas inválidas

☐ tempo de processamento

---

# ETAPA 03

Exportar objetos

Verificar

☐ PNG criado

☐ largura correta

☐ altura correta

☐ arquivo válido

☐ pasta criada automaticamente

☐ quantidade exportada igual à detectada

---

# ETAPA 04

OpenAI

Verificar

☐ comunicação funcionando

☐ resposta recebida

☐ JSON válido

☐ campos obrigatórios

☐ tratamento de erros

☐ limite de tentativas

☐ cache funcionando

---

# ETAPA 05

Filtrar objetos

Verificar

☐ apenas extrair=true

☐ nenhum texto exportado

☐ nenhum objeto inválido

☐ quantidade correta

---

# ETAPA 06

WEBP

Verificar

☐ WEBP criado

☐ qualidade correta

☐ tamanho reduzido

☐ transparência preservada

☐ imagem abre normalmente

---

# ETAPA 07

Manifest

Verificar

☐ JSON válido

☐ UTF-8

☐ todos os componentes

☐ nomes corretos

☐ caminhos válidos

☐ categorias corretas

---

# ETAPA 08

HTML

Verificar

☐ HTML válido

☐ abre no navegador

☐ imagens carregam

☐ componentes corretos

☐ sem erros JavaScript

☐ sem erros CSS

☐ layout responsivo

---

# TESTES DE PERFORMANCE

Registrar

tempo total

tempo por etapa

uso de memória

quantidade de objetos

quantidade de chamadas OpenAI

---

# TESTES DE ESTABILIDADE

Executar o pipeline:

☐ 10 vezes

☐ 50 vezes

☐ 100 vezes

Resultado esperado:

Mesmo comportamento.

Sem vazamento de memória.

Sem falhas.

---

# TESTES DE ERROS

Verificar

☐ imagem inexistente

☐ imagem corrompida

☐ pasta inexistente

☐ JSON inválido

☐ erro OpenAI

☐ sem internet

☐ API indisponível

☐ resposta vazia

☐ resposta incompleta

---

# TESTES VISUAIS

Verificar

☐ recortes corretos

☐ WEBP correto

☐ HTML igual ao esperado

☐ componentes alinhados

☐ sem perda de qualidade

---

# TESTES DE REGRESSÃO

Sempre que uma etapa for alterada:

Executar novamente:

ETAPA 01

↓

ETAPA 02

↓

ETAPA 03

↓

ETAPA 04

↓

ETAPA 05

↓

ETAPA 06

↓

ETAPA 07

↓

ETAPA 08

Nenhuma etapa poderá ser quebrada.

---

# APROVAÇÃO

Uma funcionalidade somente poderá ser considerada concluída quando:

☑ todos os testes forem executados

☑ nenhum erro ocorrer

☑ todos os arquivos forem gerados

☑ logs estiverem corretos

☑ pipeline completo funcionar

---

# REGRA FINAL

Nunca considerar uma implementação concluída sem executar os testes definidos neste documento.

Caso qualquer teste falhe:

A implementação deverá permanecer com status:

EM DESENVOLVIMENTO.