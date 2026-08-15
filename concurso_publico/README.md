# Concurso Santos 2026 — Enfermeiro

Hub de estudos para o **Concurso Público 74/2026 – SEPLA-RH**, cargo **1008 — Enfermeiro**, estruturado a partir do padrão do Centro de Performance/Exame de Suficiência e visualmente derivado do **Hub Editorial Unificado** do Calculadoras de Enfermagem.

## Auditoria de origem

Os links inicialmente recebidos apontavam para o **Concurso 73/2026**, que não contém o cargo de Enfermeiro. A fonte canônica desta entrega foi corrigida para:

- Concurso 74/2026 — página IBAM: `https://www.ibamsp-concursos.org.br/informacoes/179/`
- Edital 74/2026 – SEPLA-RH: `sources/edital-74-2026-sepla-rh.pdf`
- Rerratificação 82/2026 – SEPLA-RH: `sources/rerratificacao-82-2026-sepla-rh.pdf`

O Edital 73/2026 não alimenta conteúdo, pesos, datas ou mapa de tópicos do cargo de Enfermeiro.

## Design System

A página preserva os tokens e estruturas do Hub Editorial Unificado:

- `--navy: #1A3E74`
- `--navy-light: #1E4D8C`
- `--navy-dark: #163269`
- `--hero-accent: #4A90E2`
- `--blue: #2EA7FF`
- app header sticky
- hero navy em gradiente
- KPIs
- Discovery Band
- sidebar esquerda no desktop / drawer no mobile
- cards compactos
- grid fluido
- raio, linhas e sombras da mesma família

Em produção, `index.html` também carrega `/public/output.css` como camada canônica do site; `css/concurso-santos.css` funciona como extensão/fallback para a prévia local.

O logotipo foi recuperado do próprio Hub Editorial Unificado. Não foi usado brasão/identidade visual da Prefeitura no shell, para não sugerir que o guia seja uma página oficial do Município.

## Ícones

Todos os ícones são **SVG inline** por sprite local. Não há dependência de Font Awesome, CDN ou biblioteca de ícones.

## Funcionalidades

- countdown até 18/10/2026;
- 40 questões e pesos oficiais;
- mapa pesquisável do conteúdo programático;
- filtros por área, prioridade e status;
- progresso persistente em `localStorage`;
- favoritos;
- estados: Não iniciado → Em estudo → Revisado → Dominado;
- foco rápido em SUS + Específicos (84/100 pontos);
- plano de 9 semanas;
- Pomodoro 25 minutos;
- painel de revisão por área;
- caderno de erros local;
- simulador de pontuação ponderada 0–100;
- critério mínimo de 50% + aviso de margem de habilitação;
- módulo de Prova de Títulos;
- cronograma essencial;
- fontes oficiais/primárias;
- exportação do progresso em JSON;
- impressão;
- modal de tópico com subitens e contrato editorial de **10 capítulos**.

## Arquivos

```text
index.html
assets/
  logo-calculadoras.png
css/
  concurso-santos.css
js/
  data.js
  concurso-santos.js
data/
  concurso-santos-enfermeiro-74-2026.json
sources/
  edital-74-2026-sepla-rh.pdf
  rerratificacao-82-2026-sepla-rh.pdf
README.md
```

## Rota sugerida

```text
/concursos/santos/2026/enfermeiro/index.html
```

A rota é sugestão de organização. Se já existir contrato canônico de rotas para concursos no projeto, prevalece o contrato existente.

## Contrato editorial preparado

Cada tópico possui um roteiro reutilizável de 10 capítulos:

1. Escopo do tópico no edital
2. Fundamentos e conceitos-base
3. Estrutura conceitual
4. Norma, diretriz ou evidência primária
5. Aplicação prática
6. Pontos críticos e diferenciações
7. Erros comuns e pegadinhas conceituais
8. Questões guiadas e recuperação ativa
9. Revisão de alto rendimento
10. Referências e atualização

Para leis municipais, o conteúdo integral deve vir do texto consolidado/vigente e do módulo regulatório; não deve ser reconstruído de memória.
