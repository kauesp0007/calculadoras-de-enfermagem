---
description: "Use when: criar, editar ou revisar páginas HTML do site — calculadoras, escalas, guias, simulados e páginas de conteúdo. Cobre largura de página, hero card, ordem do head, SEO/hreflang, CLS e footer modular (raiz vs idiomas)."
applyTo: "**/*.html"
---
# Padrão de HTML — Calculadoras de Enfermagem

Regras completas: `AI_RULES.md` (prioridade máxima), `HTML_RULES.md`, `HTML_PAGE_TEMPLATE_RULES.md`.
Catálogos: `CATALOGO_DA_ARQUITETURA_ESTRUTURAL/`, `CATALOGO_DE_ESTRUTURA_FISICA/`,
`CATALOGO_DE_IDENTIDADE_VISUAL/`, `CATALOGO_SEO_METAS_HEAD/`.

## Largura da página (obrigatório)
- Ocupar toda a viewport, mantendo apenas os paddings laterais (`p-4 sm:p-8` no `<main>`).
- NUNCA usar `container`, `max-w-5xl/6xl/7xl` nem `mx-auto` no container principal.

## Hero card (obrigatório)
- `width:100%`; altura compacta; alinhado à esquerda.
- Gradiente azul institucional (`#1A3E74 → #1E4D8C → #163269`), glassmorphism discreto.
- Hierarquia: Eyebrow → H1 → H2 (nunca inverter).
- NUNCA aplicar `max-w-*`/`mx-auto` no hero.

## Ordem do `<head>`
Seguir a sequência de `fugulin.html` / `HTML_PAGE_TEMPLATE_RULES.md`:
charset/viewport → DNS/preconnect → title/metas → critical fonts → CSS → preload de fontes →
canonical/hreflang → favicon → Schema.org → styles → IconTopBar preload → anti-CLS placeholders →
scripts globais → anti-CLS acessibilidade.

## Footer (diferenciado por contexto)
- Páginas da raiz (pt-BR): `fetch("/footer.html")` + `carregarTraducoes("pt", "footer.json")` e `cookies.json`.
- Páginas das pastas de idioma (`en/`, `es/`, ... 18 idiomas): `fetch("footer.html")` (relativo → footer
  localizado da própria pasta). NUNCA usar `fetch("/footer.html")` nelas.
- Assets nas pastas de idioma: usar caminhos absolutos (`/fonts/...`, `/public/output.css`, etc.).

## Proibido alterar (sem autorização)
- Pastas: `downloads`, `biblioteca`, `blog`, `blog-templates`, `node_modules`, `.git`.
- Arquivos: `footer.html`, `menu-global.html`, `global-body-elements.html`, `downloads.html`,
  `_language_selector.html`, `googlefc0a17cdd552164b.html`.

## Sempre preservar
- SEO, acessibilidade (skip-link, aria, focus-visible), responsividade, modularização, desempenho (CLS/CWV).
- Seção de Referências Bibliográficas ao final (padrão `HTML_PAGE_TEMPLATE_RULES.md`).
- Botões Gerar PDF / Imprimir conforme `fugulin.html`.
- Modelos de referência: `fugulin.html`, `mapa-do-site.html`, `perroca.html`, `dimensionamento.html`,
  `centro-cirurgico.html`, `guia_rapido_dispositivos.html`, `meem.html`, `integracoes_classificacao_wifi.html`.
