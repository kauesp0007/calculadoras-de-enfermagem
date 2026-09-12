# Catálogo do Sistema de Contas e Pagamentos

> Documento-mãe que consolida **tudo o que foi implementado** no sistema de
> contas, assinaturas e pagamentos do site "Calculadoras de Enfermagem".
> Complementa os arquivos de auditoria por fase (`auditoria_fase2.txt` a
> `auditoria_fase7.txt`), o `SISTEMA_CONTAS_COMPLETO.txt` (Fase 1) e o
> `mapa_planos_conteudo.md`.
>
> **Objetivo**: permitir que qualquer agente de IA (ou pessoa) leia este
> arquivo e entenda a arquitetura completa, os serviços externos, o
> armazenamento e as ligações entre as partes — sem precisar rastrear o código.

---

## 1. Visão geral em uma frase

O site é **estático (HTML/CSS/JS vanilla, Tailwind) hospedado no GitHub Pages**,
com um sistema de **contas** (Firebase Authentication + Firestore) e de
**assinatura premium** (pagamento real via **Asaas** para o Brasil e **Stripe**
para o exterior), ativado de forma **100% automática** por **webhooks** que
rodam em **Edge Functions do Supabase** e atualizam o plano do usuário no
**Firestore**. Assinantes premium ficam **sem anúncios**.

---

## 2. Serviços externos usados

| Serviço | Para que serve | Conta/identificador |
|---|---|---|
| **Firebase** (Authentication + Firestore) | Login (Google/Email), perfis, favoritos, histórico, assinaturas, registro de assinantes | Projeto `calculadoras-enfermagem` |
| **Supabase** (Edge Functions, Deno/TS) | Lógica de backend (webhooks, checkout, painel admin) | Project ref `asjkftjfbkuuhilnqonx` |
| **Asaas** | Pagamentos do Brasil (cartão, boleto, Pix) | Conta PJ (CNPJ) do dono |
| **Stripe** | Pagamentos internacionais (cartão internacional, USD/EUR) | Conta do dono |
| **Resend** | E-mail de notificação (usado no Pix manual — **aposentado**) | Domínio verificado |

### Detalhes do Firebase
- **apiKey**: `AIzaSyAbWwuA8pq6bTI9T8ht5f-X65yMbw6iQ_I`
- **projectId**: `calculadoras-enfermagem`
- **authDomain**: `calculadoras-enfermagem.firebaseapp.com`
- Provedores: Google + Email/Senha.
- Config fica em `js/firebase/firebase-init.js` (singleton + lazy loading).

### Detalhes do Supabase
- Project ref: `asjkftjfbkuuhilnqonx`.
- Anon key pública (usada no front): ver `conta/assinatura.html` e `conta/admin-pagamentos.html`.
- Edge Functions ativas (5): ver seção 5.

---

## 3. Onde os dados são armazenados

### Firestore (Firebase) — fonte oficial de verdade

| Coleção/documento | Conteúdo | Escrita por |
|---|---|---|
| `users/{uid}` | perfil + `plan` (`free`/`junior`/`pleno`/`senior`) + `planExpiresAt` + `role` + `permissions` | `auth-user-profile.js` (perfil) e webhooks (plano) |
| `users/{uid}/subscriptions/{id}` | histórico de assinatura (`planId`, `status`, `provider`, `providerSubscriptionId`) | webhooks |
| `users/{uid}/favorites/{pageId}` | favoritos | `js/favorites/` |
| `users/{uid}/history/{id}` | histórico de navegação | `js/history/` |
| `asaasSubscribers/{id}` | **registro de assinantes** (nome, e-mail, plano, `provider`, data/hora) — alimenta o painel admin | `asaas-webhook` e `stripe-webhook` |
| `asaasEvents/{paymentId}` | idempotência do webhook Asaas (`processedAt`) | `asaas-webhook` |

> ⚠️ `asaasSubscribers` também recebe assinantes do Stripe (campo `provider`
> diferencia: `"asaas"` ou `"stripe"`).

### localStorage (cache, não é fonte de verdade)

| Chave | Conteúdo | TTL |
|---|---|---|
| `auth_user_profile_cache` | perfil (espelho do Firestore) | 5 min |
| `auth_profile` | perfil resumido (nome, foto, plano) | sessão |
| `sub_*` | assinaturas (cache) | 5 min |
| `conta.language` | idioma do painel de conta | persistente |

---

## 4. Arquitetura em camadas (front → back)

```mermaid
flowchart TD
    subgraph Front["Frontend (páginas estáticas)"]
        A["conta/assinatura.html<br/>(planos + botão assinar)"]
        B["conta/admin-pagamentos.html<br/>(registro de assinantes)"]
        C["global-scripts.js<br/>(menu, ads, auth lazy)"]
        D["js/auth/* + js/subscriptions/* + js/access/*"]
    end

    subgraph Auth["Firebase"]
        F1["Firebase Auth<br/>(Google / Email)"]
        F2["Firestore<br/>(users, subscriptions, asaasSubscribers)"]
    end

    subgraph Supa["Supabase Edge Functions"]
        S1["stripe-checkout"]
        S2["stripe-webhook"]
        S3["asaas-webhook"]
        S4["asaas-admin"]
        S5["translate-forum-message"]
    end

    subgraph Pg["Gateways de pagamento"]
        G1["Stripe<br/>(cartão internacional USD/EUR)"]
        G2["Asaas<br/>(cartão/boleto/Pix Brasil)"]
    end

    A -->|"POST {uid, lang}"| S1
    S1 -->|"cria Checkout Session"| G1
    G1 -->|"webhook checkout.session.completed"| S2
    S2 -->|"grava users/{uid}.plan"| F2
    S2 -->|"grava asaasSubscribers"| F2

    A -->|"window.open link /c/..."| G2
    G2 -->|"webhook PAYMENT_RECEIVED/CONFIRMED"| S3
    S3 -->|"grava users/{uid}.plan"| F2
    S3 -->|"grava asaasSubscribers"| F2

    B -->|"POST {adminEmail}"| S4
    S4 -->|"lê asaasSubscribers"| F2

    C -->|"auth lazy load"| F1
    D -->|"lê/grava perfil"| F2
```

---

## 5. Edge Functions do Supabase (ativas)

Local: `supabase/functions/`. Deploy com `--no-verify-jwt` (o front chama com a anon key; os gateways chamam sem JWT).

| Função | Gatilho | O que faz | Secrets (nomes) |
|---|---|---|---|
| `stripe-checkout` | `POST /stripe-checkout {uid, lang}` | Escolhe price (USD/EUR) pelo idioma e cria Checkout Session (`client_reference_id=uid`, `subscription_data.metadata.uid=uid`). Devolve `{url}`. | `STRIPE_SECRET_KEY`, `STRIPE_PRICE_USD`, `STRIPE_PRICE_EUR` |
| `stripe-webhook` | Stripe → `POST /stripe-webhook` (header `stripe-signature`) | Verifica assinatura HMAC. `checkout.session.completed` → ativa `junior` (+30d) e grava assinante. `customer.subscription.deleted` → `free`. | `FIREBASE_SERVICE_ACCOUNT`, `STRIPE_WEBHOOK_SECRET` |
| `asaas-webhook` | Asaas → `POST /asaas-webhook` (header `asaas-access-token`) | Verifica token. `PAYMENT_CONFIRMED` (cartão/boleto) e `PAYMENT_RECEIVED` (Pix) → busca pagamento/cliente na API Asaas, localiza UID por **e-mail** (`users` where `email == X`), ativa `junior` e grava assinante. `SUBSCRIPTION_DELETED/INACTIVATED` → `free`. | `FIREBASE_SERVICE_ACCOUNT`, `ASAAS_API_TOKEN`, `ASAAS_WEBHOOK_TOKEN` |
| `asaas-admin` | `POST /asaas-admin {adminEmail}` | Verifica `adminEmail` (2 contas admin). Lista `asaasSubscribers` ordenado por `createdAt` desc. | `FIREBASE_SERVICE_ACCOUNT`, `ADMIN_EMAIL`, `ADMIN_EMAIL_2` |
| `translate-forum-message` | Fórum (`forum-enfermagem.html`, todos os idiomas) | Traduz mensagens (Google Translation API, fallback DeepSeek). | `GOOGLE_TRANSLATION_API_KEY`, `DEEPSEEK_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `FORUM_ALLOWED_ORIGINS` |

> `FIREBASE_SERVICE_ACCOUNT` = JSON single-line da service account do Firebase
> (usado para gerar JWT RS256 e autenticar no Firestore REST). `FIREBASE_PROJECT_ID`
> tem fallback `"calculadoras-enfermagem"`.

---

## 6. Fluxo completo de assinatura (passo a passo)

### 6.1. Assinatura mensal (Brasil — Asaas)

1. Usuário logado acessa `/conta/assinatura.html`.
2. A página detecta o idioma: **pt-BR** → mostra os cards do **Asaas**.
3. Botão "Assinar (cartão ou boleto)" → `window.open("https://www.asaas.com/c/vcnk68nigacrape5")` (assinatura mensal R$ 10, cartão + boleto).
4. Botão "Pagar com Pix" → `window.open("https://www.asaas.com/c/z89jgzlk57nb354p")` (Pix avulsa R$ 10 = 30 dias, renova pagando de novo).
5. Usuário paga. Asaas dispara o webhook.
6. `asaas-webhook`:
   - Busca o pagamento na API Asaas (`GET /v3/payments/{id}`) → `billingType` e `customer`.
   - Busca o cliente (`GET /v3/customers/{id}`) → `email` e `name`.
   - Localiza o UID: query Firestore `users` where `email == X`.
   - Grava `users/{uid}.plan = "junior"`, `planExpiresAt` (+30 dias) e `asaasSubscribers/{paymentId}`.
   - Idempotência: `asaasEvents/{paymentId}`.

### 6.2. Assinatura mensal (internacional — Stripe)

1. Usuário logado acessa `/conta/assinatura.html?lang=xx` (ou o idioma é detectado).
2. A página detecta idioma **não-pt-BR** → mostra o card do **Stripe** (US$ 5 ou € 5).
3. Botão "Assinar" → chama `stripe-checkout` (`POST {uid, lang}`).
4. `stripe-checkout` escolhe o price (USD para `en,id,hi,ja,zh,ko,vi,ar`; EUR para `tr,nl,pl,ru,fr,es,de,it,uk,sv`) e cria a Checkout Session, devolvendo a URL.
5. Front redireciona (`window.open`) para o checkout da Stripe.
6. Usuário paga (cartão internacional). Stripe dispara o webhook.
7. `stripe-webhook` (evento `checkout.session.completed`):
   - Lê `client_reference_id` (o UID).
   - Grava `users/{uid}.plan = "junior"` + `asaasSubscribers/stripe_{sessionId}` (provider `"stripe"`).

### 6.3. Ativação do benefício (sem anúncios)

Depois que o webhook grava `plan = "junior"`, o `global-scripts.js`:
- `isPremiumSubscriber()` → `Authorization.hasPlan("premium")` (true para junior/pleno/senior) ou cache.
- `hideAdsForPremium()` → adiciona classe `premium-no-ads` no `<html>`, esconde anúncios (multiplex + auto-placed) e instala um `MutationObserver` para pegar anúncios inseridos depois.

---

## 7. Bloqueio de anúncios (resumo)

- `global-scripts.js` controla os anúncios:
  - **Anúncios automáticos** (AdSense) carregados em `loadAdSenseOnce()`, **gateado** por `isPremiumSubscriber()`.
  - **Anúncio multiplex** (`ins.adsbygoogle` antes do rodapé) inicializado em `initializeMultiplexAds()`, também gateado.
  - **CSS de segurança** `html.premium-no-ads` esconde tudo com `!important` (fallback).
  - `MutationObserver` re-oculta anúncios inseridos depois (auto-placed).
- Idiomas com AdSense fora do `global-scripts.js` (blog, concurso, downloads) usam `isPremiumLocal()` (checa cache).
- Assinante premium → zero anúncios. Usuário gratuito → anúncios normais.

---

## 8. Painel admin (registro de assinantes)

- Página: `conta/admin-pagamentos.html` (noindex).
- Consome `asaas-admin` (somente leitura).
- Lista `asaasSubscribers` em ordem cronológica (mais recente primeiro): nome, e-mail, plano, data/hora.
- **Não há mais aprovação manual** (ativação é automática). O painel é só um **registro**.
- Admin (2 contas): `kauepg18@gmail.com` e `kauesp07@hotmail.com` (em `_isAdmin()` no `global-scripts.js`, `asaas-admin` e `pix-admin`).

---

## 9. Preços ativos

| Gateway | Produto/Plano | Valor | Moeda | Link / ID |
|---|---|---|---|---|
| Asaas | Assinatura mensal (cartão + boleto) | R$ 10,00 | BRL | `https://www.asaas.com/c/vcnk68nigacrape5` |
| Asaas | Pix avulsa (30 dias) | R$ 10,00 | BRL | `https://www.asaas.com/c/z89jgzlk57nb354p` |
| Stripe | "Premium Plan" (mensal) | US$ 5,00 | USD | `price_1UEeJeAE0EBt2lxCFI56AWCx` |
| Stripe | "Premium Plan" (mensal) | € 5,00 | EUR | `price_1UEf7uAE0EBt2lxCmfLGGmNH` |

### Mapeamento idioma → moeda (Stripe)

- **US$ 5**: `en, id, hi, ja, zh, ko, vi, ar` (inglês + Ásia).
- **€ 5**: `tr, nl, pl, ru, fr, es, de, it, uk, sv` (Europa).
- **pt-BR** (raiz): usa **Asaas** (R$ 10).

---

## 10. Estado atual (ativo vs aposentado)

### ✅ Ativo
- Auth: Firebase (Google + Email).
- Perfil/Favoritos/Histórico no Firestore.
- RBAC (`Authorization`) + Content Access (`Access`).
- Assinaturas (`Subscription`).
- Pagamentos: **Asaas** (BR) + **Stripe** (internacional).
- Painel admin (registro de assinantes).
- Bloqueio de anúncios p/ premium.
- `translate-forum-message` (fórum).

### 🗑️ Aposentado / removido (para não confundir um agente futuro)

| Item | Motivo |
|---|---|
| PayPal (paypal-*) | exige CNPJ; descartado |
| Lemon Squeezy (lemon-webhook) | bloqueado (payout Stripe) |
| Mercado Pago (mercadopago-*) | rejeitado pelo dono |
| Pix manual PicPay (pix-order, pix-admin) | substituído pelo Asaas |
| `conta/cobranca.html` | página órfã do Mercado Pago (deletada) |

> Essas funções foram **deletadas do Supabase** e do repositório. Backup em
> `backups-temporarios/fn-backup-20260911/`.

---

## 11. Como um agente de IA deve ler este sistema

1. **Comece por aqui** (este catálogo) para o panorama geral.
2. Para detalhes de cada fase, leia `SISTEMA_CONTAS_COMPLETO.txt` (Fase 1) e
   `auditoria_fase2.txt` … `auditoria_fase7.txt` (Fases 2–7).
3. **Camadas de código** (fonte de verdade):
   - Front de conta: `conta/*.html`.
   - Auth: `js/auth/auth-core.js` (facade `window.Auth`).
   - Autorização: `js/auth/authorization.js` (facade `window.Authorization`).
   - Planos: `js/auth/plan-service.js` (preços/rótulos).
   - Assinaturas: `js/subscriptions/subscription-manager.js` (facade `window.Subscription`).
   - Acesso a conteúdo: `js/access/` (facade `window.Access`).
   - Anúncios + menu: `global-scripts.js`.
   - Backend: `supabase/functions/*/index.ts`.
4. **Comandos úteis**:
   - Deploy de função: `supabase functions deploy <nome> --no-verify-jwt --project-ref asjkftjfbkuuhilnqonx`
   - Segredos: `supabase secrets set <CHAVE>='<valor>' --project-ref asjkftjfbkuuhilnqonx`
   - Build do site: `.\node_modules\.bin\tailwindcss -i ./src/input.css -o ./public/output.css --minify ; node gerar-sw.js`

---

## 12. Armadilhas conhecidas (para evitar repetir erros)

- Service account do Firebase deve ser **JSON single-line** (sem quebras de linha).
- Testar webhook no PowerShell 5.1 com `curl -d` remove aspas → usar `node fetch`.
- Firestore REST v1: **PATCH** (não POST) para criar doc com documentId.
- `supabase functions logs` e `invoke` **não existem** no CLI v2.116.
- Firestore no plano **Spark (grátis)** tem cota diária (50k leituras) → erro `429 Quota exceeded`. Solução: plano **Blaze**.
- E-mail de e-mail do Firebase Auth é sempre **minúsculas** (normalizar antes de comparar).
