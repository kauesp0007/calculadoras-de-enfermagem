# Manual de Anúncios do AdSense — Manual Principal e Mapa do Tesouro

**Projeto:** Calculadoras de Enfermagem
**Corte:** 03/10/2026
**Publisher:** `ca-pub-6472730056006847`

---

## 1. Visão geral da estratégia

O site usa **publicidade manual controlada** — **NÃO** usa AdSense Auto Ads.

- Existem **3 unidades de anúncio oficiais** (controladas), criadas e configuradas no AdSense.
- O JavaScript central (`global-scripts.js`) é o **único ponto de carregamento** do AdSense.
  Nenhuma página individual carrega `adsbygoogle.js` por conta própria.
- Os blocos `<ins class="adsbygoogle">` existem **hardcoded** em muitas páginas (os "snippets
  oficiais"), mas o `global-scripts.js` **normaliza, reposiciona e injeta** as unidades
  dinamicamente em toda página elegível.

> **Regra de ouro:** `global-scripts.js` é o único carregador do AdSense. Páginas que já
> têm o bloco oficial não recebem uma segunda cópia (deduplicação por `data-ad-slot`).

---

## 2. Mapa do tesouro — onde está cada coisa

### 2.1 Constantes de configuração (em `global-scripts.js`)

```js
const CONTROLLED_AD_CLIENT        = "ca-pub-6472730056006847"; // publisher
const CONTROLLED_POST_HERO_SLOT   = "2979726942"; // Display Pós-Hero
const CONTROLLED_RESULT_SLOT      = "5690484911"; // Display Pré-Resultado ("Botão Calcular")
const CONTROLLED_MULTIPLEX_SLOT   = "3341197364"; // Multiplex (final da página)
```

### 2.2 As 3 unidades oficiais (o "tesouro")

| Unidade | Slot | Formato | Posição na página | Injeção |
|---|---|---|---|---|
| **Display Pós-Hero** | `2979726942` | `horizontal` | Logo abaixo do card do H1 (hero) | JS (`placeControlledAds`) — hardcoded em só 2 páginas |
| **Display Pré-Resultado** | `5690484911` | `horizontal` | Entre o formulário/calculadora e o container de resultado | Hardcoded em 1042 páginas + JS |
| **Multiplex** | `3341197364` | `autorelaxed` | Fim da jornada, antes do `<footer>` | Hardcoded em ~1903 páginas + JS |

### 2.3 Funções-chave no `global-scripts.js`

| Função | Papel |
|---|---|
| `CONTROLLED_AD_CLIENT` / `*_SLOT` | Constantes com publisher e slots oficiais. |
| `isAdsExcludedPage()` | Lista de páginas que **não** recebem anúncio. |
| `placeControlledAds()` | Cria/reposiciona os 3 blocos controlados na página. |
| `createDisplayAd()` / `createMultiplexAd()` | Montam o `<aside>` + `<ins class="adsbygoogle">`. |
| `normalizeExistingAd()` | Normaliza um bloco já hardcoded para o padrão oficial. |
| `initializeManualAds()` | Empurra todos os `ins.adsbygoogle` para `window.adsbygoogle.push({})`. |
| `loadAdSenseOnce()` | Injetor do `adsbygoogle.js` (único). |
| `initLazyLoadServices()` | Bootstrap lazy: consent + analytics + AdSense. |
| `styleControlledAds()` | CSS dos containers `.controlled-display-ad` / `.controlled-multiplex-ad`. |

---

## 3. Fluxo de carregamento (passo a passo)

1. `initLazyLoadServices()` roda e dispara `resolvePremiumAdState()` + `hideAdsForPremium()`.
2. **Modo Admin** (`localStorage.admin_mode === "true"` ou `?admin=1`) → bloqueia tudo.
3. **Consentimento LGPD**: `cookieConsent === "refused"` → bloqueia; `"managed"` com
   `ad_storage === "denied"` → bloqueia.
4. O AdSense só carrega **após a primeira interação do usuário** (scroll/mousemove/touch/keydown)
   ou após ~8,5s (via `requestIdleCallback`). Isso protege LCP/CLS.
5. `loadAdSenseOnce()`:
   - Se página excluída ou consentimento negado → retorna.
   - Resolve o estado Premium (`resolvePremiumAdState`). **Fail-closed**: enquanto não
     resolver, não carrega publicidade.
   - Se Premium → `hideAdsForPremium()` e retorna.
   - Injeta `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6472730056006847`.
   - No `load` → `initializeManualAds()` (posiciona + push dos blocos).

---

## 4. Regras de bloqueio de anúncios para assinantes Premium

Premium sem anúncios é uma **capacidade derivada** do entitlement comercial válido.
**Não existe** um terceiro plano "ad-free".

### 4.1 Decisão (`evaluatePremiumAdState`)

| Cenário | `resolved` | `allowAds` | Resultado |
|---|---|---|---|
| Visitante (não autenticado) | `true` | `true` | Anúncios carregam |
| Billing não resolvido / indisponível | `false` | `false` | **Fail-closed**: anúncios NÃO carregam |
| `plan === "premium"` **e** `premium_expires_at` válido/futuro | `true` | `false` | Anúncios bloqueados |
| Free confirmado / Premium expirado | `true` | `true` | Anúncios carregam |

> **Invariante:** `plan === "premium"` sozinho **NÃO basta** — exige `premium_expires_at`
> válido e futuro. A única fonte frontend é `Auth.billingStatus()`.

### 4.2 Neutralização (`neutralizePremiumAdArtifacts`)

Quando Premium é confirmado, o JS:
1. Esconde `.controlled-display-ad`, `.controlled-multiplex-ad` e `#multiplex-ad-reserved`
   (marca `data-premium-ads-hidden`).
2. Esconde todos os `ins.adsbygoogle` (`display:none` + `aria-hidden`).
3. **Remove** o `<script>` do `adsbygoogle.js`.
4. Zera `window.__adsenseLoaded`.

### 4.3 Vigilância

- `installPremiumAdMutationObserver()` observa o DOM e **re-neutraliza** qualquer anúncio
  re-injetado enquanto o estado Premium estiver ativo.
- `bindPremiumAdWatch()` re-resolve o estado quando `onProfileChange`/`onAuthChange` disparam:
  - Premium → `hideAdsForPremium()`
  - Free/visitante resolvido → `__LOAD_ADS_IF_ELIGIBLE()` (recarrega anúncios).

### 4.4 Legado PROIBIDO (não reativar)

`premium-ads-guard.js`, `premium-banner-manager.js`, `PREMIUM_AD_FREE_PLANS`,
`isPremiumLocal()`, `localStorage.plan`, `hasPlan('junior')`, Firestore para plano,
benefício por query string. (Veja `SISTEMA_DE_LOGIN_DO_SITE/CATALOGO_CANONICO_SISTEMA_DE_CONTAS.md`.)

---

## 5. Páginas excluídas de anúncios (`isAdsExcludedPage`)

Nestas rotas **nenhum** anúncio é carregado (mesmo que exista `<ins>` no HTML):

- Shells Premium (`premium-content-loader.js` / `__IS_PREMIUM_ROUTE`).
- `diagnosticosnanda.html` e `classificacao_intervencoes-enfermagem.html` (bancos de dados NANDA/NIC).
- `metricas.html` e páginas terminando em `/metricas.html`.
- Páginas de conta/autenticação: `/conta/`, `/assinatura`, `/configuracoes`, `/perfil`,
  `/favoritos`, `/historico`, `/login`, `/cadastro`.

---

## 6. Como adicionar um novo anúncio (procedimento)

1. **Criar a unidade no AdSense** (Display) e obter o `data-ad-slot`.
2. **Decidir a zona** (ver `MAPEAMENTO_DE_ZONAS_DE_ANUNCIOS.txt`).
3. **Não** adicionar `<script adsbygoogle.js>` manualmente — o `global-scripts.js` já injeta.
4. Opção A (hardcoded): inserir `<ins class="adsbygoogle" data-ad-client="ca-pub-6472730056006847" data-ad-slot="XXXX" data-ad-format="auto" data-full-width-responsive="true"></ins>` no HTML da página.
   O `normalizeExistingAd`/`initializeManualAds` reconhece e inicializa.
5. Opção B (controlado/dinâmico): registrar o novo slot nas constantes do `global-scripts.js`
   e criar um ponto de inserção em `placeControlledAds()`.
6. Rodar o build (Tailwind + service worker) e o scan (`node MANUAL_DE_ANUNCIOS_DO_AD_SENSE/_scan_ads.js`).

> ⚠️ Alterações em `global-scripts.js` são **protegidas** (hook `block-protected-files`):
> exigem autorização explícita do desenvolvedor.
