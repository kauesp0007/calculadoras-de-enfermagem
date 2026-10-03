# Catálogo de Blocos e Páginas — AdSense

**Corte do scan:** 03/10/2026 · **Fonte:** `_scan_result.json` (gerado por `_scan_ads.js`)

## Resumo do scan

| Métrica | Valor |
|---|---|
| Arquivos HTML de páginas reais escaneados | 2.621 |
| Páginas **com** blocos de anúncio | 1.902 |
| Total de blocos `<ins class="adsbygoogle">` | 2.988 |
| Publisher (`data-ad-client`) | `ca-pub-6472730056006847` (100% corretos) |

> O scan cobre **apenas páginas reais** do site (raiz pt-BR, 18 idiomas, `escalas-de-enfermagem/`,
> `conta/`, `concurso_publico/`). Pastas de backup/build (`automacoes/`, `backups_seo/`,
> `backups-temporarios/`), catálogos e configuração foram excluídas.

---

## 1. Unidades de anúncio (slots)

### 1.1 Unidades oficiais (controladas por `global-scripts.js`)

| Slot | Nome | Formato | Blocos | Páginas | Status |
|---|---|---|---|---|---|
| `3341197364` | Multiplex (fim da página) | `autorelaxed` | 1.924 | 1.902 | ✅ Ativa — presente em praticamente toda página elegível |
| `5690484911` | Display Pré-Resultado ("Botão Calcular") | `horizontal` | 1.042 | 1.042 | ✅ Ativa — páginas com calculadora/resultado |
| `2979726942` | Display Pós-Hero | `horizontal`/`auto` | 22 | 22 | ✅ Ativa — injetada por JS em toda página; hardcoded em `aldrete.html`, `centro-cirurgico.min.html` + 20 páginas normalizadas |
| `1045005779` | Vertical Lateral (formulários) | `auto` (160x600) | 420 | 210 | ✅ Ativa — injetada por JS nos formulários PDF (2 por página) |

> **Nota (unidade dinâmica):** os anúncios verticais laterais (`1045005779`) são **injetados
> dinamicamente** por `global-scripts.js` (`placeFormPdfSideAds`) e **não aparecem** no
> `_scan_result.json` (que só varre `<ins>` hardcoded). São 2 por página (esquerda + direita),
> 160x600, visíveis apenas em ≥1200px, nas 210 páginas `formulario_*.html` (62 pt-BR, 74 en, 74 es).

### 1.2 Unidades legadas — ✅ CORRIGIDAS em 03/10/2026

As unidades legadas/inválidas abaixo foram **normalizadas** e não existem mais no site:

| Slot antigo | Ocorrências | Correção aplicada |
|---|---|---|
| `5401011816` (multiplex COPSOQ) | 22 páginas | → `3341197364` (multiplex controlado) |
| `data-ad-slot="auto"` (inválido) | 20 páginas | → `2979726942` (Display Pós-Hero) |

---

## 2. Histórico de correções (aplicadas em 03/10/2026)

Três inconsistências foram encontradas e **corrigidas** (backup em `backups-temporarios/anuncios-fix-2026-10-03/`):

1. **Slot legado `5401011816`** — família COPSOQ (22 páginas: `copsoq.html`, `copsoq-curta.html`,
   `entenda_copsoq.html` + 18 idiomas) → normalizado para `3341197364` (multiplex controlado).
2. **Slot inválido `data-ad-slot="auto"`** — `normas-regulamentadoras.html` e
   `suporte-avancado-de-vida.html` (+ idiomas, 20 páginas) → normalizado para `2979726942`
   (Display Pós-Hero).
3. **Bloco morto em `conta/assinatura.html`** — página excluída por `isAdsExcludedPage()`;
   bloco multiplex removido.

---

## 3. Distribuição por idioma (páginas com anúncio)

| Idioma | Páginas | Idioma | Páginas |
|---|---|---|---|
| pt-BR (raiz) | 163 | ja | 96 |
| en | 100 | ru | 95 |
| nl | 100 | ko | 95 |
| pl | 100 | tr | 95 |
| sv | 100 | hi | 95 |
| vi | 100 | zh | 95 |
| uk | 100 | ar | 95 |
| de | 96 | id | 95 |
| es | 94 | it | 94 |

> A raiz (pt-BR) tem mais páginas (163) porque inclui páginas exclusivas sem versão traduzida.

---

## 4. Status de funcionamento (interpretação)

- **"Funcionando"** = bloco com `data-ad-client` correto + `data-ad-slot` numérico válido +
  `data-ad-format` presente + página **não excluída** + consentimento permitido + usuário não-Premium.
- **Todos** os 2.988 blocos têm `data-ad-client` correto (`ca-pub-6472730056006847`) e `data-ad-format` presente.
- Nenhuma falha estrutural restante (slots legados e `data-ad-slot="auto"` foram normalizados em 03/10/2026).
- Anúncios em páginas excluídas **não renderizam** mesmo estando no HTML (nenhuma página elegível mantém bloco morto).

### Lista completa por página

O inventário página-a-página (idioma, arquivo, slots, formatos, status) está em
`_scan_result.json` (campo `perFile`), gerado pelo `_scan_ads.js`. Para consultar:

```powershell
$r = Get-Content 'MANUAL_DE_ANUNCIOS_DO_AD_SENSE\_scan_result.json' -Raw | ConvertFrom-Json
$r.perFile | Where-Object { $_.status -ne 'ok' }   # páginas com algo fora do padrão
$r.perFile | Where-Object { $_.slots -contains '3341197364' } | Measure-Object   # quantas têm multiplex
```
