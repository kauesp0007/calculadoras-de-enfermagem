# Hero de Faixa (Full-Bleed Header Band)

> Catálogo de estilos futuros — padrão alternativo de hero.
> Referência: `rastreabilidade-cme.html`.

---

## Nome

**Hero de Faixa (Full-Bleed Header Band)** — também chamado de **`page-header` band**.

Diferente do **Hero Card** tradicional (card `rounded-2xl` + borda + sombra +
glassmorphism, usando `mini-hero-navy`), este é um **banner de faixa sangrada**
(full-bleed), sem card wrapper, com breadcrumb, eyebrow, chips e botões.

---

## Estrutura (HTML)

```
.page-header                          ← faixa 100% da viewport (full-bleed)
  .wrap                               ← container max-width:1200px; margin:0 auto; padding:0 20px
    nav.crumbs                        ← breadcrumb (Início › … › página atual)
      a (ícone home + "Início")
      span.sep "›"
      a / span (página atual)
    span.eyebrow                      ← pill: ícone + rótulo
    h1.font-sans                      ← título principal
    p.font-sans                       ← descrição (max-width:700px)
    .header-chips                     ← linha de chips
      span.header-chip
    div (botões)                      ← .btn .btn-primary
```

---

## Gradiente (fundo do `.page-header`)

```css
background: linear-gradient(135deg, var(--navy-deep) 0%, var(--blue) 60%, #1D6FA4 100%);
```

Valores efetivos:

| Posição | Valor |
|---|---|
| 0% | `var(--navy-deep)` = **`#0F2447`** |
| 60% | `var(--blue)` = **`#1E5A91`** |
| 100% | **`#1D6FA4`** |

- Ângulo: **135deg** (diagonal esquerda-superior → direita-inferior).

---

## Cores (variáveis `:root` deste estilo)

⚠️ Aqui o `--navy` é **`#1E407C`** (diferente do `#1A3E74` do padrão canônico).

| Variável | Valor |
|---|---|
| `--navy` | `#1E407C` |
| `--navy-deep` | `#0F2447` |
| `--blue` | `#1E5A91` |
| `--teal` | `#0D9488` |
| `--green` | `#16A34A` |
| `--ink` | `#1E293B` |

Textos sobre o hero:

| Elemento | Cor |
|---|---|
| Base | `#fff` |
| Breadcrumb | `rgba(255,255,255,.6)` (links `.75`, hover `#fff`) |
| Eyebrow | `#93C5FD` |
| Descrição | `rgba(255,255,255,.75)` |
| Chips | `#BAE6FD` |

---

## Sombreamento

- **`.page-header`**: **sem sombra, sem borda, sem raio** (faixa sangrada).
- **`.btn-primary`**: `box-shadow: 0 4px 14px -4px rgba(30,64,124,.35)`; hover `0 6px 18px -4px rgba(30,64,124,.45)`.
- **`.card`** (conteúdo): `box-shadow: 0 2px 8px rgba(0,0,0,.04)`.

---

## Tipografia e espaçamento

- **`.page-header`**: `padding: 40px 0 36px`.
- **H1**: `font-size:28px` (mobile `21px`), `font-weight:900`, `letter-spacing:-.02em`, `line-height:1.15`, `margin-bottom:10px`.
- **Eyebrow (pill)**: `background:rgba(255,255,255,.1)`, `border:1px solid rgba(255,255,255,.15)`, `border-radius:999px`, `padding:5px 14px`, `font-size:11px`, `font-weight:700`, `letter-spacing:.06em`, uppercase.
- **Chips**: `background:rgba(255,255,255,.1)`, `border:1px solid rgba(255,255,255,.15)`, `border-radius:999px`, `padding:5px 14px`, `font-size:11px`, `font-weight:600`.
- **P**: `font-size:14px`, `max-width:700px`.

---

## CSS completo do hero

```css
.page-header{background:linear-gradient(135deg,var(--navy-deep) 0%,var(--blue) 60%,#1D6FA4 100%);color:#fff;padding:40px 0 36px}
.page-header .wrap{max-width:1200px;margin:0 auto;padding:0 20px}
.crumbs{display:flex;align-items:center;gap:6px;font-size:12px;color:rgba(255,255,255,.6);margin-bottom:14px;flex-wrap:wrap}
.crumbs a{color:rgba(255,255,255,.75);text-decoration:none;transition:color .15s}
.crumbs a:hover{color:#fff}
.crumbs .sep{color:rgba(255,255,255,.35)}
.eyebrow{display:inline-flex;align-items:center;gap:6px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.15);border-radius:999px;padding:5px 14px;font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#93C5FD;margin-bottom:14px}
.page-header h1{font-size:28px;font-weight:900;letter-spacing:-.02em;line-height:1.15;margin-bottom:10px;color:#fff}
@media(max-width:600px){.page-header h1{font-size:21px}}
.page-header p{font-size:14px;color:rgba(255,255,255,.75);max-width:700px;line-height:1.6;margin-bottom:18px}
.header-chips{display:flex;flex-wrap:wrap;gap:8px}
.header-chip{background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.15);border-radius:999px;padding:5px 14px;font-size:11px;font-weight:600;color:#BAE6FD}
```

---

## Diferença vs. Hero Card tradicional

| | Hero Card tradicional | Hero de Faixa (este) |
|---|---|---|
| Wrapper | card `rounded-2xl` + borda + sombra | faixa full-bleed (sem raio/borda/sombra) |
| Largura | 100% útil da viewport | `max-width:1200px` centralizado |
| Elementos | Eyebrow → H1 → H2 | breadcrumb + eyebrow → H1 → p → chips → botões |
| Altura | compacta | mais alta (padding 40/36px) |
