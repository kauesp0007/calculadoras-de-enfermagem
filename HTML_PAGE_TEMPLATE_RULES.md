# Regra Obrigatória para Criação de Novas Páginas HTML

## Obrigatório

Antes de iniciar a criação de qualquer nova página HTML, leia integralmente o arquivo **`HTML_RULES.md`** e siga todas as regras nele definidas, sem exceções.

A nova página deverá utilizar como referência arquitetural **`fugulin.html`**, reproduzindo exatamente a mesma sequência lógica, hierarquia estrutural, organização do código e padrão arquitetônico.

A estrutura da página deve ser construída de forma **hierárquica, sequencial e organizada**, preservando a ordem dos blocos existente na página de referência.

Nenhum bloco estrutural poderá ser omitido, reposicionado ou substituído por outra implementação sem justificativa técnica.

---

# Ordem obrigatória da estrutura

A página deverá conter, obrigatoriamente, na seguinte ordem:

1. Estrutura inicial do documento HTML.
2. Configuração de SEO.
3. Meta Tags.
4. Prefetch.
5. DNS Prefetch.
6. Preconnect.
7. Title.
8. Meta Description.
9. Meta Robots.
10. Critical Fonts (minificado).
11. CSS.
12. Preload das fontes locais.
13. Canonical.
14. Hreflang.
15. Favicon.
16. Schema.org.
17. Styles.
18. Bloco IconTopBar Preload.
19. Anti CLS Placeholders.
20. Script JS Global.
21. Language Selector.
22. Anti CLS Acessibilidade.

Antes do fechamento da tag `<head>` deverão existir exatamente os mesmos blocos utilizados em **`fugulin.html`**, respeitando a mesma sequência.

---

# Estrutura da Body

Após a abertura da `<body>`, a página deverá conter, obrigatoriamente:

- Global Header Container.
- Placeholder do Language Selector.
- Estrutura arquitetural definida em `HTML_RULES.md`.
- Breadcrumb.
- Hero Card.
- Barra de ações compacta.
- Todos os componentes presentes na página de referência.

---

# Estrutura principal da calculadora

A calculadora deverá conter obrigatoriamente:

- Card dos dados do paciente.
- Formulários divididos em cards individuais.
- Barra de progresso em cada card.
- Cores progressivas do verde ao vermelho conforme o escore selecionado.
- Badges dos cards geradas por JavaScript.
- Botões **Calcular** e **Limpar**.

---

# Resultado

O resultado deverá possuir o mesmo padrão visual utilizado em **`fugulin.html`**, incluindo:

- Hero Card de Resultado.
- Grid de memória.
- Avaliação clínica.
- Diagnósticos NANDA sugeridos.
- Sugestões baseadas nas áreas de maior pontuação do paciente.
- Interpretação clínica utilizando cores conforme o nível de gravidade.

---

# Botões adicionais

Após o resultado deverão existir:

- Botão de gerar Laudo.
- Botão PDF.
- Botão Print.

Todos deverão utilizar exatamente a mesma implementação existente em **`fugulin.html`**.

---

# Sidebar

A Sidebar deverá conter:

- Veja Também.
- Escalas Relacionadas.

---

# Referências Bibliográficas
# REGRA ABSOLUTA — PADRÃO OFICIAL DA SEÇÃO DE REFERÊNCIAS BIBLIOGRÁFICAS

## Objetivo

Toda página de conteúdo, artigo, calculadora, escala, protocolo ou material científico deve obrigatoriamente possuir uma seção de **Referências Bibliográficas**, seguindo rigorosamente o mesmo padrão visual e estrutural em todo o projeto.

Esta seção tem como finalidade aumentar a credibilidade científica, facilitar a conferência das fontes pelo usuário, fortalecer os critérios de EEAT (Experience, Expertise, Authoritativeness e Trustworthiness) e atender às boas práticas de SEO para conteúdos da área da saúde (YMYL).

---

# Localização obrigatória

A seção de Referências Bibliográficas deve ser posicionada sempre ao final do conteúdo principal.

A ordem obrigatória da página deve ser:

1. Conteúdo principal
2. Conclusão (quando existir)
3. Perguntas Frequentes (FAQ), quando existir
4. Referências Bibliográficas
5. Informações do autor ou responsável técnico (quando existir)
6. Data da última atualização (quando existir)
7. Rodapé (Footer)

Nunca posicionar referências bibliográficas na barra lateral, no cabeçalho ou no rodapé global do site.

---

# Título da seção

Utilizar obrigatoriamente:

```
Referências Bibliográficas
```

O título deve utilizar a mesma hierarquia visual dos demais títulos principais da página (H2).

---

# Estrutura das referências

As referências devem ser apresentadas em uma lista numerada.

Exemplo:

1.
2.
3.
4.

Nunca utilizar listas com marcadores (•).

---

# Tipografia

A seção deve manter excelente legibilidade em desktop e dispositivos móveis.

Padrão recomendado:

- Fonte: mesma utilizada no restante do site
- Tamanho: 16px
- Peso: normal (400)
- Alinhamento: esquerda
- Altura de linha: confortável para leitura

Nunca utilizar fontes pequenas (12px ou 13px).

---

# Cor do texto

Utilizar uma cor de leitura confortável.

Padrão recomendado:

Texto:

```
text-gray-700
```

ou equivalente:

```
#374151
```

Nunca utilizar preto absoluto (#000000).

---

# Links das referências

Quando existir DOI, URL oficial ou documento eletrônico, o título ou nome da publicação deve possuir link para a fonte oficial.

Cor recomendada:

```
text-blue-600
```

Os links devem possuir efeito visual de foco e hover.

Nunca utilizar links quebrados ou fontes não confiáveis.

---

# Espaçamento

Manter espaçamento consistente entre cada referência.

Recomendação:

- margem inferior entre referências: 12–16px
- espaçamento superior da seção: aproximadamente 48px

---

# Separação visual

A seção deve ser separada do restante do conteúdo através de uma linha horizontal discreta.

Exemplo:

- borda superior cinza clara
- padding superior confortável
- margem superior ampla

O objetivo é indicar visualmente que o conteúdo principal foi encerrado e que a partir daquele ponto começam as fontes consultadas.

---

# Fontes permitidas

Dar preferência para documentos provenientes de instituições reconhecidas.

Exemplos:

- Ministério da Saúde
- Organização Mundial da Saúde (OMS)
- COFEN
- ANVISA
- American Heart Association (AHA)
- European Resuscitation Council (ERC)
- CDC
- NIH
- PubMed
- SciELO
- Diretrizes oficiais
- Artigos científicos revisados por pares

Evitar utilizar como referência:

- blogs
- sites sem autoria
- fóruns
- páginas pessoais
- conteúdos sem embasamento científico

---

# Padronização

Todas as páginas do projeto devem seguir exatamente o mesmo padrão visual para a seção de Referências Bibliográficas.

Não criar estilos diferentes entre páginas.

A padronização é obrigatória.

---

# Objetivos

A seção de Referências Bibliográficas deve transmitir:

- credibilidade científica;
- organização;
- facilidade de leitura;
- consistência visual;
- profissionalismo;
- conformidade com boas práticas de SEO e EEAT.

Qualquer alteração neste padrão somente poderá ser realizada caso exista uma nova definição oficial para todo o projeto.

# JavaScript

O JavaScript inline deverá iniciar contendo toda a estrutura necessária para:

- Configuração matemática do cálculo.
- Variáveis.
- Constantes.
- Fórmulas.
- Validação.
- Atualização dinâmica da interface.
- Cálculo do resultado.

A implementação da função de impressão deverá ser exatamente igual à existente em **`fugulin.html`**.

---

# Finalização

Após o término do JavaScript inline deverão ser inseridos, obrigatoriamente, nesta ordem:

1. Bloco Multiplex.
2. Footer.
3. Fechamento da tag `<body>`.
4. Fechamento da tag `<html>`.

---

# Regras Gerais

- Nunca alterar a arquitetura definida em `HTML_RULES.md`.
- Nunca alterar a ordem dos blocos estruturais.
- Nunca remover blocos obrigatórios.
- Nunca utilizar outra página como referência arquitetural principal além de `fugulin.html`, salvo orientação explícita.
- Priorizar consistência estrutural, reutilização de componentes e padronização absoluta entre todas as páginas do projeto.