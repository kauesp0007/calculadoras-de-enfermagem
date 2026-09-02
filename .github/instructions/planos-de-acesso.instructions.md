---
description: "Use when: criar ou editar páginas HTML — REGRA OBRIGATÓRIA de plano de acesso. Ao final de cada página nova, PERGUNTAR qual o plano da página (gratuito/júnior/pleno/sênior) e suas limitações/opções, e registrar no mapa de conteúdo restrito quando for paga."
applyTo: "**/*.html"
---
# Planos de Acesso — Regra Obrigatória para Páginas

## REGRA ABSOLUTA (nunca esquecer)

Ao criar ou finalizar uma página HTML nova, é OBRIGATÓRIO, antes de dar a
tarefa como concluída:

> **PERGUNTAR ao usuário: qual o plano de acesso desta página e quais as
> limitações/opções de cada plano?**

A resposta DEVE ser registrada:

- Se a página for **gratuita**: nenhuma ação extra (padrão `public`).
- Se a página for **paga/restrita**: adicionar a chave no objeto
  `RESTRICTED_CONTENT` de `js/access/content-policy.js`.

**Sem essa pergunta + registro, a página NÃO PODE ser classificada como concluída.**

## Planos do site

| ID | Nome | Anúncios | Acesso |
|---|---|---|---|
| `free` | Gratuito | Sim | Tudo, exceto escalas premium e simulados; **não imprime/PDF** de escalas/calculadoras |
| `junior` | Júnior | Não | Tudo + os 5 primeiros simulados |
| `pleno` | Pleno | Não | Tudo + todos os simulados + formulários de escalas em branco |
| `senior` | Sênior | Não | Tudo + Excel/apostilas/mapa cirúrgico/APK (indisponível por enquanto) |

Hierarquia: `free < junior < pleno < senior` (plano maior libera o menor).

## Conteúdo restrito atual (canônico — em `js/access/content-policy.js`)

- **Escalas premium (exigem `junior`):** `fugulin`, `braden`, `morse`,
  `dimensionamento`, `perroca`, `gasometria`.
- **Simulados 1º–5º (exigem `junior`):** `simulado-de-enfermagem`,
  `simulado-de-enfermagem4`, `simulado-de-enfermagem2`, `simulado-de-enfermagem3`,
  `simulado-de-enfermagem-nucleo-de-seguranca-do-paciente`.
- **Simulados 6º em diante (exigem `pleno`):** demais `simulado_*` e `flashcards_quiz`.

## Como registrar uma página restrita

Adicionar a chave no objeto `RESTRICTED_CONTENT` de `js/access/content-policy.js`:

```js
"nome-do-arquivo": "junior"   // ou "pleno" / "senior"
```

A chave é o nome do arquivo **sem extensão** (ex.: `braden.html` → `"braden"`),
funcionando automaticamente em todos os idiomas.

## Impressão e PDF

O plano `free` **não imprime nem gera PDF** de escalas/calculadoras. Os botões
`btnImprimir` e `btnGerarPDF` são ocultados automaticamente via
`global-scripts.js` → `applyPlanRestrictions()`.

## Mapa de referência

Documentação completa: `SISTEMA_DE_LOGIN_DO_SITE/mapa_planos_conteudo.md`.
