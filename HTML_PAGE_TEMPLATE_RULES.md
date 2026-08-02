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

As referências deverão seguir obrigatoriamente:

- Formatação ABNT.
- Link direcionando para um artigo científico real relacionado à escala.

Não utilizar referências fictícias.

---

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