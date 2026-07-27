# Estrutura do Site — Módulos de Produção

Contrato real da casca compartilhada de `calculadorasdeenfermagem.com.br`, extraído de `global-styles.css` e do histórico do projeto. **Toda página nova consome este shell; não recria header/barra/footer.**

## Ativos modulares (via `<link>`/`<script>`)

| Ativo | Papel |
|---|---|
| `global-styles.css` | Tokens, `@font-face` locais (Inter + Nunito Sans com `size-adjust`, anti-CLS), layout fixo do shell e classes semânticas. |
| `public/output.css` | Utilitários (build Tailwind compilado do site). |
| `global-scripts.js` | Orquestrador: injeta **header**, **barra de acessibilidade** e **footer**; marca nav ativa; inicializa módulos; emite `layout:ready`. |
| `lang-selector.js` | Popula o seletor de idioma (carrega `i18n/{code}.json` sob demanda, cache em memória/session). |

## Layout fixo (não mexer)

- `#barraAcessibilidade` — `position:fixed; top:0; height:36px; background:#1a3e74` (injetada).
- `header` — `position:fixed; top:36px; height:60px; background:#fff` (injetado).
- Mount points reservam o espaço em fluxo:
  - `#global-header-container` (min-height 96px desktop / 60px mobile)
  - `#language-selector-placeholder` (min-height 46px)
  - `#footer-placeholder`
- `.main-content-wrapper` — `max-width:1280px; margin:auto; padding:2rem 1rem`.

## Esqueleto canônico da página

```html
<html lang="pt-BR" data-draft="true" data-content-id="{slug}">
<head>
  … meta/SEO/@graph …
  <link rel="stylesheet" href="…/global-styles.css">
  <link rel="stylesheet" href="…/public/output.css">
  <link rel="stylesheet" href="…/css/pages/{tipo}.css">   <!-- 4ª camada -->
</head>
<body>
  <a href="#conteudo" class="sr-only …">Pular para o conteúdo</a>
  <div id="statusMessage" class="sr-only" role="status" aria-live="polite"></div>
  <div id="draftBanner" hidden>…</div>
  <div id="global-header-container"></div>          <!-- header + barra (script) -->
  <div id="language-selector-placeholder"></div>    <!-- lang-selector -->
  <main id="conteudo" class="main-content-wrapper">…conteúdo…</main>
  <div id="footer-placeholder"></div>                <!-- footer (script) -->
  <script src="…/global-scripts.js" defer></script>
  <script src="…/lang-selector.js" defer></script>
</body>
```

## Paleta e fontes (única fonte de verdade)

- **Navy** `#1a3e74` (primária) · variantes `#16385F` `#122a50` `#0f2a50` `#0a1c36`
- **Azul** `#2563eb` (blue-600) · `#1d4ed8` (blue-700) · claro `#eff6ff`
- **Verde** `#006400` (sucesso) · marca `#0F9D74` · claro `#E3FAF1`
- **Vermelho** `#8b0000` · fundo `#fee2e2`
- **Cinza** `#1f2937` texto · `#4b5563` · `#e5e7eb` borda · `#f9fafb` fundo
- **Fontes** Inter (corpo) · Nunito Sans (títulos, `.font-nunito`) — locais, `size-adjust`.

Qualquer cor/fonte fora desta lista é divergência. A camada de página deve referenciar só estes tokens (ver `css/pages/biblioteca.css`).

## Arquitetura de CSS em 4 camadas

1. `global-styles.css` — tokens + shell + fontes.
2. `public/output.css` — utilitários.
3. `cko-components.css` — componentes compartilhados (~100 seletores).
4. `css/pages/{tipo}.css` — camada fina por tipo de página (**zero CSS inline nas páginas**).

## Classes semânticas disponíveis

`.resultado` (caixa de resultado, navy) · `.input-box-wrapper` · `.btn-primary` (navy) · `.btn-success` (verde) · `.btn-secondary` · `.breadcrumb` (ol/li) · `.title-bar` · `.tooltip-container`/`.tooltip-icon-button`/`.tooltip-text` · `.ref` · `.meta-seguranca` · `.font-nunito`/`.font-inter` · `.sr-only` · modos de acessibilidade `.contraste-alto` `.dark-mode` `.fonte-dislexia`.
