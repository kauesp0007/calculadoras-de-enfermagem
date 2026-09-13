---
description: "Use when: criar ou editar CSS do site — Tailwind, estilos globais, tokens do design system e estilos por página. Cobre cores, largura, hero e responsividade."
applyTo: "**/*.css"
---
# Padrão de CSS — Calculadoras de Enfermagem

## Fonte canônica visual

Para qualquer nova página ou modernização visual, DEVE ser consultado:
`CATALOGO_DE_IDENTIDADE_VISUAL/PADRAO_CANONICO_PAGINAS_HTML.md`.

Ele é a referência canônica para dimensões, tipografia, espaçamento, compactação,
hero, gradiente, cores, bordas, sombras, acabamento visual, responsividade e
estabilidade visual. Esta instrução não deve criar uma segunda escala visual concorrente.

## Tokens do design system
- Navy: `#1A3E74` (principal), `#1E4D8C`, `#163269`; azul: `#2563EB`/`#4A90E2`.
- Fontes: `Inter` (corpo) e `Nunito Sans` (títulos).

## Largura (regra 60)
- Página: ocupar toda a LARGURA ÚTIL da viewport (apenas paddings laterais). NUNCA
  `container`, `max-w-5xl/6xl/7xl` nem `mx-auto` como estrutura dominante.
- EVITAR grandes margens laterais (ex.: `mx-16+`, `px-16+`).
- Seguir os agentes/hooks do projeto (o hook `check-layout` valida automaticamente).
- Hero card: `width:100%`, alinhado à esquerda, gradiente azul institucional e altura compacta.
  NUNCA `max-w-*`/`mx-auto` no hero.

## Espaçamento e densidade (regra 61)
- REDUZIR `margin`, `padding` e `gap`. Criar uma interface de ALTA DENSIDADE.
- A sensação deve ser de "comunidade viva", e NÃO de "página com grandes áreas vazias".
- Evitar espaçamento grande: `p-16+`, `m-16+`, `gap-16+` (>= 4rem).
- Preferir escala compacta: `p-4`/`p-6`/`p-8`, `gap-4`/`gap-6`.

## Hero, tipografia, superfícies e acabamento
- Hero: referência `linear-gradient(135deg,#1A3E74 0%,#1E4D8C 60%,#163269 100%)`.
- Hero: radius aproximadamente 18–20px e sombra institucional discreta.
- Corpo: aproximadamente 16px; H1 de hero aproximadamente 24–34px responsivo; H2 de hero 13–15px.
- Seções/cards: radius aproximadamente 14–16px, borda 1px e sombra suave.
- Não usar sombras pesadas, bordas dominantes ou espaços verticais desnecessários.
- Cores temáticas devem ser acentos secundários e não substituir a identidade institucional.

## Tailwind
- Fonte canônica: `src/input.css` → `public/output.css` (rodar build Tailwind após alterações).
- Não editar `public/output.css` diretamente.

## Responsividade e acessibilidade
- Mobile-first; preservar `dark-mode` e variáveis de acessibilidade (`--cor-foco-acessibilidade`).
- Manter `:focus-visible` e `prefers-reduced-motion`.

## Modernização de páginas existentes
- NUNCA apagar o arquivo HTML para recriá-lo do zero: editar no lugar, substituindo/excluindo
  apenas as partes que mudam, sem duplicar estilos.
- Preservar o conteúdo da página do início do `<head>` até antes do primeiro `<style>`.
- Edições de CSS (blocos `<style>` e classes) são permitidas a partir do primeiro `<style>` em diante.
