---
description: "Use when: criar ou editar CSS do site — Tailwind, estilos globais, tokens do design system e estilos por página. Cobre cores, largura, hero e responsividade."
applyTo: "**/*.css"
---
# Padrão de CSS — Calculadoras de Enfermagem

## Tokens do design system
- Navy: `#1A3E74` (principal), `#1E4D8C`, `#163269`; azul: `#2563EB`/`#4A90E2`.
- Fontes: `Inter` (corpo) e `Nunito Sans` (títulos). Ver `CATALOGO_DE_IDENTIDADE_VISUAL/`.

## Largura e hero
- Página: ocupar toda a viewport (apenas paddings laterais). NUNCA `container`, `max-w-5xl/6xl/7xl`, `mx-auto`.
- Hero card: `width:100%`, alinhado à esquerda, gradiente azul institucional. NUNCA `max-w-*`/`mx-auto` no hero.

## Tailwind
- Fonte canônica: `src/input.css` → `public/output.css` (rodar build Tailwind após alterações).
- Não editar `public/output.css` diretamente.

## Responsividade e acessibilidade
- Mobile-first; preservar `dark-mode` e variáveis de acessibilidade (`--cor-foco-acessibilidade`).
- Manter `:focus-visible` e `prefers-reduced-motion`.
