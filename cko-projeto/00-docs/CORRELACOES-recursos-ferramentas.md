# Correlações Recursos × Ferramentas (grafo)

Camada de ligação entre **recursos** (13 tipos: calculadora, artigo, quiz, guia de bolso, flashcards, checklist, caso clínico, slides, infográfico, mapa mental, simulado, vídeo, biblioteca) e **ferramentas** (as 77 da matriz), unificada com o grafo Ferramenta × Biblioteca.

Arquivos em `04-matrizes/`:
- `correlacao-recursos-ferramentas.xlsx` — abas: `Recursos_x_Ferramentas` (pivô), `Arestas_Rec_Ferr`, `Grafo_Unificado`, `Resumo`.
- `arestas-recurso-ferramenta.csv` · `grafo-unificado.csv` — edge-lists.

## Como as correlações são geradas

1. Cada ferramenta é classificada em um **tipo de template** pelo nome: escala (52), simulado (9), calculadora (8), ferramenta (6), educacional (2).
2. Cada tipo mapeia para um conjunto de **recursos** que ele renderiza (ex.: calculadora → calculadora+quiz+flashcards+caso+slides+…; escala → idem sem mapa mental; simulado → simulado+quiz+caso).
3. Gera-se a aresta `recurso --renderiza--> ferramenta` (peso 3=núcleo, 2=apoio, 1=futuro).

## Grafo unificado (3 camadas)

```
recurso --renderiza--> ferramenta --(direto|complementar|ia)--> biblioteca
```

- Arestas recurso→ferramenta: **684**
- Arestas ferramenta→biblioteca: **811**
- Total no grafo unificado: **1.495** arestas

Isso responde ao próximo salto que o próprio arquivo de exemplos apontava (objetos de ligação): a plataforma deixa de ser um catálogo e passa a um grafo navegável ferramenta↔recurso↔biblioteca.
