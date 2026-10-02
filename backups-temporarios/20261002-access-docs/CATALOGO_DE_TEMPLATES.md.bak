# 🧩 Catálogo de Templates e Padrões (FASE 7–8)

**Regra:** não criar novo template se já existir padrão equivalente. Fontes canônicas: `HTML_PAGE_TEMPLATE_RULES.md` + modelos de referência.

| Tipo de página | Modelo de referência |
|---|---|
| Calculadora / Escala (com cálculo + impressão/PDF) | `fugulin.html` (jsPDF + imprimir) |
| Página de texto / artigo / guia | `integracoes_classificacao_wifi.html` (só `btnImprimir`) |
| Escala (referência) | `perroca.html`, `meem.html`, `downes.html` |
| Calculadora (referência) | `dimensionamento.html` |
| Simulador interativo | `centro-cirurgico.html` |
| Guia rápido de dispositivos | `guia_rapido_dispositivos.html` |
| Mapa do site (gerado) | `mapa-do-site.html` (gerado de `relatorio_paginas.txt`; NUNCA editar manualmente) |

## Padrões canônicos obrigatórios (todas as páginas)
- **Largura:** viewport total, só paddings laterais (`p-4 sm:p-8`); NUNCA `container`/`max-w-*`/`mx-auto`.
- **Espaçamento/densidade (regra 61):** reduzir `margin`/`padding`/`gap`; alta densidade (evitar `p-16+`, `m-16+`, `gap-16+`).
- **Hero:** 100% largura, altura compacta, alinhado à esquerda, gradiente `#1A3E74 → #1E4D8C → #163269`, Eyebrow → H1 → H2.
- **Barra de ações** compacta após o H1 (Favoritar, Compartilhar, Imprimir, Reportar correção, etc.).
- **Referências** ao final (ABNT, `data-references-section="v1"`) + nota de governança (`data-governance-disclosure="v1"`, `data-professional-review="required"`).
- **Head** na ordem: charset/viewport → DNS/preconnect → title/metas → critical fonts → CSS → preload fontes → canonical/hreflang → favicon → Schema.org → styles → preload IconTopBar → anti-CLS → scripts `defer`.
- **Impressão/PDF:** calculadora/escala → jsPDF; texto/artigo → só `btnImprimir`.
- **Identificação do tipo** antes de escolher o template (calculadora, escala, formulário, texto, simulado, guia, blog, biblioteca, fórum, premium, pública, login/conta).
