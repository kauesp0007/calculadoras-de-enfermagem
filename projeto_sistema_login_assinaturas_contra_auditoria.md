# Sistema de Contas, Login, Assinaturas, Entitlements e Conteúdo Premium
## Dossiê técnico para contra-auditoria independente

**Projeto:** Calculadoras de Enfermagem  
**Repositório:** `kauesp0007/calculadoras-de-enfermagem`  
**Site:** `https://www.calculadorasdeenfermagem.com.br/`  
**Pull Request de reconstrução:** #29 — `refactor: reconstruir contas e billing FREE/PREMIUM`  
**Branch:** `refactor/contas-free-premium`  
**Head verificado:** `327376df79b433f7b761786db3868967c9175a7e`  
**Base:** `main` (`3c9821f364ab05679e921e3037c2db4eeb6f2651`)  
**Data do snapshot desta documentação:** 2026-09-19/20  
**Status do PR no momento da documentação:** OPEN, DRAFT, não mergeado.

> **Objetivo deste documento**
>
> Este arquivo é um dossiê para ser entregue a outra IA/agente no Visual Studio Code para uma segunda auditoria independente. Ele descreve a arquitetura projetada, o que foi implementado na branch, o que foi verificado em produção, o que permanece legado e os gates que ainda impedem declarar o sistema comercialmente homologado.
>
> **Regra fundamental:** não tratar este documento como substituto de inspeção do código. A contra-auditoria deve comparar este documento com o estado real do repositório, banco Supabase, Edge Functions, Firebase, Stripe, Asaas e GitHub.

---

# 1. RESUMO EXECUTIVO

O projeto reconstrói o domínio de contas e assinatura do site para abandonar a arquitetura comercial antiga baseada em campos de plano no Firebase/Firestore e adotar um modelo canônico de apenas dois estados comerciais:

- `free`
- `premium`

A arquitetura pretendida é:

```text
USUÁRIO
   │
   ▼
Firebase Authentication
   │
   │ Firebase ID Token
   ▼
Supabase Edge Functions
   │
   ├── billing-access
   │       │
   │       ▼
   │   billing_identities
   │       │
   │       ▼
   │   user_entitlements
   │
   ├── Asaas (pt-BR)
   │       │
   │       ▼
   │   Asaas Webhook
   │
   └── Stripe (18 idiomas internacionais)
           │
           ▼
       Stripe Webhook

Somente eventos financeiros confirmados
alteram o entitlement Premium.

Frontend:
Firebase = identidade
Supabase = autoridade comercial
localStorage/cookie/query string = NÃO são autoridade
```

O conteúdo Premium recebeu uma segunda camada arquitetural:

```text
GitHub Pages
   │
   └── shell público da página Premium
           │
           ▼
   premium-content-loader.js
           │
           ▼
   Firebase ID Token
           │
           ▼
   Supabase Edge Function
   premium-content
           │
           ├── valida identidade
           ├── resolve billing identity
           ├── verifica entitlement Premium
           └── somente então lê:
                 premium_content_pages
           │
           ▼
      HTML Premium privado
```

Isso é importante porque GitHub Pages é estático. Um JavaScript de bloqueio sozinho não constitui proteção forte contra extração HTTP. A proteção arquitetural real do conteúdo Premium é o armazenamento privado + entrega autenticada pelo backend.

---

# 2. MODELO COMERCIAL CANÔNICO

## 2.1 Estados comerciais

O modelo novo possui somente:

### FREE

Características:

- acesso ao conteúdo gratuito;
- anúncios permanecem ativos;
- não possui acesso aos recursos classificados como Premium;
- não pode obter Premium alterando browser storage;
- não pode obter Premium alterando query string;
- não pode obter Premium por callback de pagamento;
- não pode obter Premium alterando metadata de usuário;
- não pode obter Premium escrevendo diretamente no banco.

### PREMIUM

Características:

- acesso ao conteúdo gratuito;
- acesso ao conteúdo Premium;
- anúncios permanecem ativos;
- Premium NÃO é ad-free;
- acesso depende de entitlement comercial válido;
- o entitlement é resolvido no backend;
- a página Premium protegida é entregue pelo backend autenticado.

## 2.2 Estados comerciais antigos

Os níveis antigos não fazem parte do modelo comercial novo:

- `junior`
- `senior`
- `pleno`
- `lifetime`

Registros históricos podem continuar armazenados para auditoria/migração, mas não devem conceder acesso no modelo canônico.

**Ponto crítico para a contra-auditoria:** procurar no repositório e nas Edge Functions qualquer lógica que ainda trate `junior`, `senior`, `pleno` ou `lifetime` como autorização Premium.

---

# 3. PARTICIPANTES DO SISTEMA

## 3.1 Site / frontend

`calculadorasdeenfermagem.com.br`

Responsabilidades:

- interface;
- login;
- apresentação da conta;
- apresentação da assinatura;
- proteção de navegação;
- obtenção do Firebase ID token;
- chamada das Edge Functions;
- carregamento do conteúdo Premium depois da autorização.

O frontend NÃO deve ser a autoridade financeira.

---

## 3.2 GitHub / GitHub Pages

Responsabilidades:

- versionamento;
- CI/CD;
- publicação do frontend estático;
- scripts de migração;
- shells públicos das páginas Premium.

Limitação:

GitHub Pages não fornece autorização por usuário para HTML estático.

Portanto:

```text
GitHub Pages = publicação
Supabase = proteção/entrega Premium
```

---

## 3.3 Firebase Authentication

Responsabilidade atual:

- identidade;
- login;
- sessão;
- Firebase UID;
- emissão do Firebase ID token.

O Firebase Authentication continua temporariamente porque existem contas existentes e outros módulos do site ainda dependem do ecossistema Firebase.

O Firebase/Firestore NÃO deve ser a autoridade comercial do novo sistema.

---

## 3.4 Firebase/Firestore legado

Ainda existe por compatibilidade com módulos que não foram migrados.

Módulos legados podem continuar utilizando Firebase/Firestore para:

- favoritos;
- histórico;
- fórum;
- outras funcionalidades existentes.

O objetivo desta fase não é apagar Firebase/Firestore inteiro.

O objetivo é retirar o domínio comercial do Firebase/Firestore.

---

## 3.5 Supabase

Projeto verificado:

`asjkftjfbkuuhilnqonx`

Responsabilidade:

- billing identity;
- subscriptions;
- entitlements;
- conteúdo Premium privado;
- locks transacionais;
- idempotência de webhooks;
- backend comercial;
- Edge Functions.

---

## 3.6 Asaas

Responsabilidade:

- pagamentos do Brasil / pt-BR;
- cartão de crédito recorrente;
- Pix com acesso temporário, conforme desenho atual.

Regra arquitetural:

```text
pt / pt-BR → Asaas
```

---

## 3.7 Stripe

Responsabilidade:

- pagamentos internacionais;
- 18 idiomas internacionais.

Idiomas:

```text
en
es
fr
de
it
hi
zh
ja
ru
ko
tr
nl
pl
sv
id
vi
uk
ar
```

Regra:

```text
18 idiomas internacionais → Stripe
```

---

# 4. PREÇOS E VALORES

## 4.1 Asaas

A Edge Function de checkout de produção atualmente contém:

```text
PRICE_BRL = 10.00
```

Ou seja:

**R$ 10,00**

No desenho:

- `monthly_card`: recorrente mensal;
- `pix_30d`: pagamento avulso com 30 dias de acesso.

### Atenção — discrepância a ser auditada

Existe também um componente promocional documentado no branch que exibe:

```text
R$ 5,00/mês
```

Portanto, há uma divergência documental/operacional que a contra-auditoria DEVE resolver:

```text
Checkout Asaas atual: R$ 10,00
Banner promocional do frontend: R$ 5,00/mês
```

Não assumir que R$ 5,00 seja o preço comercial definitivo sem verificar o checkout real, dashboard do Asaas e regras promocionais.

---

## 4.2 Stripe

O desenho documentado usa:

```text
USD 5/mês
EUR 5/mês
```

Price IDs documentados anteriormente no projeto:

```text
USD:
price_1UEeJeAE0EBt2lxCFI56AWCx

EUR:
price_1UEf7uAE0EBt2lxCmfLGGmNH
```

A Edge Function atual usa secrets/configuração de ambiente:

```text
STRIPE_PRICE_ID
STRIPE_PRICE_USD
STRIPE_PRICE_EUR
```

O frontend não deve escolher arbitrariamente o preço.

A seleção é feita no backend a partir do idioma.

### EUR

Idiomas documentados para EUR:

```text
tr
nl
pl
ru
fr
es
de
it
uk
sv
```

Os demais idiomas internacionais utilizam USD no desenho atual.

**A contra-auditoria deve verificar no Stripe Dashboard se esses Price IDs ainda existem, estão ativos, possuem a moeda correta e representam exatamente a periodicidade e valor anunciados.**

---

# 5. MODELO DE IDENTIDADE COMERCIAL

## 5.1 billing_identities

Tabela:

```text
public.billing_identities
```

Colunas verificadas:

```text
id                  uuid
provider            text
external_subject    text
email               text nullable
supabase_user_id    uuid nullable
created_at          timestamptz
updated_at          timestamptz
```

Função:

Criar uma identidade interna estável para billing.

No estágio atual:

```text
Firebase UID
      │
      ▼
billing_identities.external_subject
```

Existe também:

```text
supabase_user_id
```

para uma eventual migração controlada da identidade para Supabase Auth.

---

# 6. ENTITLEMENT

Tabela:

```text
public.user_entitlements
```

Colunas verificadas:

```text
user_id
plan
premium_expires_at
provider
provider_customer_id
provider_subscription_id
updated_at
created_at
```

Valor default de `plan`:

```text
free
```

Valores canônicos:

```text
free
premium
```

O entitlement é a representação efetiva de acesso comercial.

---

# 7. SUBSCRIPTIONS

Tabela:

```text
public.billing_subscriptions
```

Colunas verificadas:

```text
id
user_id
provider
external_id
status
plan
currency
current_period_start
current_period_end
cancel_at_period_end
metadata
created_at
updated_at
```

Default de `plan`:

```text
premium
```

A tabela funciona como ledger operacional das assinaturas.

---

# 8. DADOS HISTÓRICOS

Tabela histórica verificada:

```text
public.payments
```

Ela foi preservada.

Não apagar dados financeiros históricos simplesmente para limpar a arquitetura.

Colunas verificadas:

```text
id
user_id
plan_id
status
mp_payment_id
mp_preference_id
created_at
updated_at
```

Esses dados não devem ser interpretados automaticamente como autorização atual.

---

# 9. CONTEÚDO PREMIUM PRIVADO

Tabela:

```text
public.premium_content_pages
```

Colunas:

```text
path
content
source_sha
updated_at
```

Características verificadas:

- RLS habilitado;
- nenhum grant direto para `anon`;
- nenhum grant direto para `authenticated`;
- conteúdo armazenado no backend;
- leitura operacional pelo backend com `service_role`.

Snapshot verificado:

```text
229 registros
0 conteúdos vazios
0 chaves contendo ".."
0 chaves absolutas indevidas
0 chaves não-HTML
0 grants diretos para anon/authenticated
```

Esse modelo evita publicar o conteúdo Premium completo no GitHub Pages.

---

# 10. COMO FUNCIONA O LOGIN

Fluxo:

```text
Usuário
   │
   ▼
conta/login.html
   │
   ▼
Firebase Authentication
   │
   ▼
Firebase User
   │
   ▼
Firebase ID Token
   │
   ▼
frontend Auth
```

O módulo central é:

```text
js/auth/auth-core.js
```

Responsabilidades principais:

- inicializar Firebase;
- observar `onAuthStateChanged`;
- guardar usuário atual;
- buscar estado comercial via `billing-access`;
- disponibilizar `Auth.hasPlan("premium")`;
- disponibilizar `Auth.billingStatus()`;
- refresh de billing;
- logout;
- limpar caches locais.

---

# 11. AUTH-CORE — REGRA COMERCIAL

O fluxo relevante é conceitualmente:

```javascript
const token = await user.getIdToken(false);

fetch(BILLING_ACCESS_URL, {
  headers: {
    Authorization: "Bearer " + token,
    Accept: "application/json"
  },
  cache: "no-store"
});
```

Se o backend retornar:

```json
{
  "plan": "premium"
}
```

o estado passa a Premium.

Caso contrário, o estado comercial normal é Free.

### Correção importante implementada

Antes havia risco de uma falha temporária de `billing-access` ser interpretada como:

```text
billing falhou
      ↓
Free
      ↓
assinante Premium bloqueado
```

Isso foi corrigido.

Agora a indisponibilidade de billing é representada como estado distinto:

```text
billingUnavailable = true
```

Assim:

```text
falha de billing
≠
Free confirmado
```

O usuário não é automaticamente rebaixado para Free por uma falha transitória do serviço.

---

# 12. BILLING-ACCESS

Edge Function:

```text
billing-access
```

Status verificado:

```text
ACTIVE
version 6
```

A função é usada pelo frontend para resolver o entitlement.

Regra:

```text
Firebase ID token
        ↓
billing-access
        ↓
billing identity
        ↓
user_entitlements
        ↓
plan
```

O frontend não grava o entitlement.

---

# 13. AUTORIZAÇÃO NO FRONTEND

Arquivo:

```text
js/auth/auth-permissions.js
```

Mapa principal:

```text
free:
  canAccessPremium = false
  canDownload = false
  canViewCertificates = false
  canSaveFavorites = true
  canViewHistory = true

premium:
  canAccessPremium = true
  canDownload = true
  canViewCertificates = true
  canSaveFavorites = true
  canViewHistory = true
```

Isso significa que Free continua podendo utilizar funcionalidades gratuitas como favoritos e histórico, quando aplicável.

Premium amplia o conjunto de permissões.

---

# 14. POLÍTICA DE CONTEÚDO

Arquivo:

```text
js/access/content-policy.js
```

Categorias Premium explícitas incluem:

```text
braden
fugulin
dimensionamento
perroca
medicacao
meem
moca
zarit
morse
elpo
glasgow
```

Tipos Premium:

```text
simulados
biblioteca-provas
formularios-em-branco-de-escalas
formularios_de_escalas_assistenciais
simulado
provas
formularios
```

Também existem classificações por padrão de nome para:

```text
simulado*.html
flashcards_quiz.html
formulario*.html
fotmulario_*.html
biblioteca-provas.html
formularios-em-branco-de-escalas.html
```

A classificação retorna:

```text
requiredPlan = premium
```

---

# 15. GATE CENTRAL DE ROTAS

O `global-scripts.js` contém o gate central.

Ele normaliza a URL e remove o prefixo de idioma:

```text
/en/braden.html
```

é tratado como:

```text
/braden.html
```

O mesmo mecanismo funciona para as 18 pastas de idioma.

### Visitante não autenticado

```text
Premium URL
    ↓
não autenticado
    ↓
login
    ↓
returnUrl preservado
```

### Usuário autenticado Free

```text
Premium URL
    ↓
Firebase autenticado
    ↓
billing = free
    ↓
assinatura
    ↓
returnUrl preservado
```

### Usuário Premium

```text
Premium URL
    ↓
Firebase autenticado
    ↓
billing = premium
    ↓
pode continuar
```

### Billing indisponível

```text
Premium URL
    ↓
Firebase autenticado
    ↓
billingUnavailable = true
    ↓
NÃO rebaixar para Free
    ↓
tela de tentativa novamente
```

---

# 16. REDIRECIONAMENTO E RETURN URL

O sistema preserva a URL de origem.

Exemplo conceitual:

```text
/braden.html
      ↓
/conta/login.html?...&returnUrl=/braden.html
      ↓
login
      ↓
volta para /braden.html
```

Para Free autenticado:

```text
/braden.html
      ↓
/conta/assinatura.html?...&returnUrl=/braden.html
```

A finalidade é impedir que o usuário perca o recurso que tentou acessar.

---

# 17. PROTEÇÃO SERVER-SIDE DO CONTEÚDO PREMIUM

Arquivo frontend:

```text
js/access/premium-content-loader.js
```

Endpoint:

```text
https://asjkftjfbkuuhilnqonx.supabase.co/functions/v1/premium-content
```

Fluxo:

```text
Página shell Premium
       │
       ▼
premium-content-loader.js
       │
       ▼
espera Auth inicializar
       │
       ▼
obtém Firebase ID Token
       │
       ▼
GET premium-content?path=...
       │
       ▼
Supabase valida usuário/entitlement
       │
       ├── 401 → login
       │
       ├── 403 → assinatura
       │
       ├── 5xx → retry
       │
       └── 200 → HTML Premium
```

O loader faz refresh do token uma vez se receber 401.

Também faz tentativas adicionais em erros 5xx.

Após receber o HTML, valida se o documento parece realmente HTML antes de substituir o documento:

```javascript
document.open();
document.write(html);
document.close();
```

---

# 18. POR QUE O PREMIUM-CONTENT É NECESSÁRIO

A seguinte arquitetura seria insuficiente:

```text
HTML Premium público
+
JavaScript que redireciona Free
```

Porque:

```text
HTTP GET direto
      ↓
HTML poderia ser extraído
      ↓
JavaScript não é uma barreira server-side
```

A arquitetura correta adotada é:

```text
HTML público
=
shell

Conteúdo real
=
Supabase privado

Acesso
=
Firebase token + entitlement

Entrega
=
Edge Function
```

Essa é uma diferença estrutural de segurança.

---

# 19. MIGRAÇÃO DO CONTEÚDO PREMIUM

Script:

```text
scripts/migrate-premium-content.mjs
```

Características:

- audit-first;
- suporta `--dry-run`;
- somente substitui shell com `--apply`;
- grava o conteúdo no Supabase antes de substituir o HTML público;
- trabalha somente com root + 18 idiomas;
- ignora pastas proibidas;
- classifica apenas rotas Premium.

A ordem crítica é:

```text
ler HTML original
      ↓
gravar no Supabase
      ↓
confirmar escrita
      ↓
substituir HTML público por shell
```

Isso evita perder conteúdo caso a gravação no banco falhe.

---

# 20. PASTAS PROIBIDAS PELO MIGRADOR

O migrador não deve tocar:

```text
.git
node_modules
downloads
biblioteca
blog
blog-templates
locales
fonts
public
img
automacoes
assets
css
font
js
admin
src
dist
.vscode
institucionais
```

A regra é importante porque a operação é destrutiva apenas no sentido de substituir HTML Premium público por shell.

---

# 21. SHELL GUARD

Workflow:

```text
.github/workflows/premium-public-shell-guard.yml
```

Função:

- executa no PR;
- checkout da branch;
- executa o shellifier;
- verifica se páginas Premium continuam como shells;
- pode commitar automaticamente a correção no branch.

Workflow verificado:

```text
Premium Public Shell Guard
run #7
status: success
```

---

# 22. QUANTIDADE DE CONTEÚDO PREMIUM

Há duas contagens que precisam ser diferenciadas.

### Rotas Premium ativas auditadas

```text
210 rotas
210 correspondências privadas
0 faltantes
```

### Registros na tabela privada

```text
229 registros
```

Os 19 registros adicionais foram tratados como registros históricos/excedentes privados e não devem ser apagados automaticamente sem uma política de retenção.

**Contra-auditoria:** explicar qualquer diferença 210 × 229 e verificar se os 19 registros extras ainda possuem uso ou precisam de retenção formal.

---

# 23. IDIOMAS

Idiomas internacionais:

```text
en
es
fr
de
it
hi
zh
ja
ru
ko
tr
nl
pl
sv
id
vi
uk
ar
```

Mais:

```text
pt / pt-BR
```

Total:

```text
19 localizações do site
```

O billing separa:

```text
pt-BR → Asaas
18 internacionais → Stripe
```

A proteção Premium não depende do menu de cada idioma; o gate central remove o prefixo de idioma e aplica a política comum.

---

# 24. FORMULÁRIOS E SIMULADOS

A auditoria encontrou padrões Premium além das escalas principais.

Categorias:

```text
simulados
flashcards_quiz
formulários
biblioteca de provas
formulários de escalas
```

O gate central também utiliza padrões de nome.

Isso cria defesa em profundidade:

```text
menu
  +
content-policy
  +
route gate
  +
premium-content backend
```

---

# 25. SISTEMA DE BLOQUEIO FREE

O bloqueio possui múltiplas camadas.

## Camada 1 — classificação

```text
URL → content-policy → requiredPlan=premium
```

## Camada 2 — identidade

```text
Firebase
```

## Camada 3 — entitlement

```text
billing-access
```

## Camada 4 — gate de navegação

```text
Free → assinatura
```

## Camada 5 — backend de conteúdo

```text
premium-content
```

## Camada 6 — banco privado

```text
premium_content_pages
```

Sem entitlement Premium, o backend não deve devolver o conteúdo.

---

# 26. SISTEMA DE DESBLOQUEIO PREMIUM

O desbloqueio NÃO acontece no browser simplesmente porque:

```text
checkout=success
```

ou:

```text
?success=true
```

ou:

```text
localStorage.plan = premium
```

O fluxo pretendido é:

```text
Pagamento
   ↓
PSP
   ↓
Webhook autenticado
   ↓
processamento idempotente
   ↓
billing_subscriptions
   ↓
user_entitlements
   ↓
plan = premium
   ↓
billing-access
   ↓
frontend Auth
   ↓
premium-content
   ↓
conteúdo liberado
```

---

# 27. ASAAS — FLUXO

Para pt-BR:

```text
Usuário autenticado
       ↓
asaas-checkout
       ↓
validação Firebase ID token
       ↓
validação lang=pt
       ↓
validação kind
       ↓
claim_billing_checkout
       ↓
lock
       ↓
criação checkout Asaas
       ↓
usuário paga
       ↓
Asaas webhook
       ↓
validação asaas-access-token
       ↓
claim de idempotência
       ↓
processamento
       ↓
entitlement
```

Tipos:

```text
monthly_card
pix_30d
```

---

# 28. ASAAS — SEGURANÇA

A função de checkout valida o Firebase ID token no backend usando JWKS oficial.

Elementos:

```text
alg = RS256
issuer = https://securetoken.google.com/<project>
audience = Firebase project
```

O token não é simplesmente confiado por estar presente.

A função também possui lock transacional para impedir checkouts concorrentes.

---

# 29. ASAAS — WEBHOOK

O webhook valida:

```text
asaas-access-token
```

antes de processar.

Também usa idempotência por:

```text
event.id
```

Eventos relevantes documentados:

```text
CHECKOUT_CREATED
CHECKOUT_PAID
CHECKOUT_CANCELED
CHECKOUT_EXPIRED
SUBSCRIPTION_CREATED
SUBSCRIPTION_UPDATED
SUBSCRIPTION_INACTIVATED
SUBSCRIPTION_DELETED
PAYMENT_CONFIRMED
PAYMENT_RECEIVED
PAYMENT_REFUNDED
chargeback
```

O evento deve ser processado somente uma vez.

---

# 30. STRIPE — FLUXO

Para idiomas internacionais:

```text
Usuário
  ↓
stripe-checkout
  ↓
Firebase ID token
  ↓
validação UID
  ↓
validação idioma
  ↓
seleção Price ID server-side
  ↓
lock de checkout
  ↓
Stripe Checkout Session
  ↓
pagamento
  ↓
Stripe webhook
  ↓
validação Stripe-Signature
  ↓
idempotência
  ↓
subscription
  ↓
entitlement
```

---

# 31. STRIPE — SEGURANÇA

A função verifica manualmente o Firebase ID token.

Valida:

```text
alg
kid
exp
iat
auth_time
aud
iss
assinatura
```

As chaves públicas Firebase são obtidas do endpoint oficial e possuem cache temporário.

O Price ID não deve ser aceito livremente do browser.

---

# 32. STRIPE — WEBHOOK

O webhook usa:

```text
stripe-signature
```

e:

```text
STRIPE_WEBHOOK_SECRET
```

O corpo bruto deve ser usado na verificação.

Também existe idempotência por:

```text
event.id
```

Eventos principais do desenho:

```text
checkout.session.completed
invoice.paid
invoice.payment_failed
customer.subscription.updated
customer.subscription.deleted
```

---

# 33. CONDIÇÃO DE PAGAMENTO FALHO

Há uma decisão arquitetural importante documentada para a nova arquitetura:

```text
invoice.payment_failed
```

não deve necessariamente remover imediatamente o acesso já pago.

A ideia é:

```text
falha de cobrança
      ↓
past_due
      ↓
assinatura ainda pode estar dentro de período válido
      ↓
acesso continua até decisão definitiva
```

O cancelamento efetivo deve ocorrer conforme o estado final da assinatura.

**IMPORTANTE:** a contra-auditoria deve verificar a implementação real de produção, porque versões legadas existentes podem ainda possuir comportamento diferente.

---

# 34. LOCK DE CHECKOUT

O backend utiliza funções RPC de controle de concorrência, incluindo:

```text
claim_billing_checkout
release_billing_checkout
complete_billing_checkout
```

Objetivo:

```text
Usuário
  ↓
inicia checkout
  ↓
lock
  ↓
outro checkout simultâneo
  ↓
bloqueado
```

Foi criado também mecanismo de proteção para evitar fluxos abertos simultâneos entre provedores.

A arquitetura pretendida impede:

```text
Stripe checkout aberto
+
Asaas checkout aberto
```

para o mesmo usuário.

---

# 35. IDEMPOTÊNCIA DE WEBHOOK

Funções RPC:

```text
claim_billing_webhook
complete_billing_webhook
fail_billing_webhook
```

Objetivo:

```text
Webhook recebido
      ↓
event ID
      ↓
claim
      ↓
se já processado → duplicate
      ↓
se novo → processa
      ↓
complete
```

Isso evita duplicação de:

- entitlement;
- assinaturas;
- efeitos financeiros;
- atualizações repetidas.

---

# 36. RLS

As tabelas comerciais são protegidas por RLS.

Modelo:

```text
browser
  ↓
não acessa diretamente tabelas comerciais
```

O backend utiliza:

```text
service_role
```

para operações internas.

Não colocar `service_role` no frontend.

---

# 37. GRANTS VERIFICADOS

Para:

```text
premium_content_pages
```

foi verificado:

```text
anon grants = 0
authenticated grants = 0
```

Isso é intencional.

Não criar uma policy pública apenas para fazer desaparecer um aviso INFO do Security Advisor.

---

# 38. SECURITY DEFINER

O projeto utiliza funções privilegiadas/RPCs em partes do billing.

Regra de segurança:

- não expor funções internas como API pública;
- revogar `EXECUTE` de roles públicas quando aplicável;
- validar autorização dentro de funções privilegiadas;
- evitar `SECURITY DEFINER` desnecessário;
- manter lógica sensível no backend.

A contra-auditoria deve listar todas as funções `SECURITY DEFINER` do schema e confirmar seus grants.

---

# 39. SEGREDOS

Nunca devem aparecer no GitHub ou frontend:

```text
ASAAS_API_TOKEN
ASAAS_WEBHOOK_TOKEN
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
SUPABASE_SERVICE_ROLE_KEY
FIREBASE_SERVICE_ACCOUNT
```

Também devem ser auditadas:

```text
SUPABASE_URL
FIREBASE_PROJECT_ID
STRIPE_PRICE_USD
STRIPE_PRICE_EUR
STRIPE_PRICE_ID
```

Valores públicos não são equivalentes a secrets.

---

# 40. CONFIGURAÇÃO SUPABASE EDGE FUNCTIONS

O `supabase/config.toml` atualmente define funções de billing com:

```toml
verify_jwt = false
```

Isso ocorre porque o backend utiliza Firebase ID tokens e/ou webhooks externos, não JWT Supabase padrão.

Funções relevantes:

```text
asaas-checkout
asaas-webhook
stripe-checkout
stripe-webhook
asaas-admin
billing-access
billing-admin
premium-content
```

Portanto:

```text
verify_jwt=false
```

NÃO significa “sem autenticação”.

Significa que a própria função deve validar a credencial adequada.

Exemplos:

```text
Firebase ID token
Asaas webhook token
Stripe webhook signature
```

A contra-auditoria deve verificar cada função individualmente.

---

# 41. EDGE FUNCTIONS VERIFICADAS EM PRODUÇÃO

Snapshot verificado no projeto Supabase:

```text
asaas-checkout       ACTIVE   v100
asaas-webhook        ACTIVE   v103
asaas-admin          ACTIVE   v99
stripe-checkout      ACTIVE   v32
stripe-webhook       ACTIVE   v102
billing-admin        ACTIVE   v6
billing-access       ACTIVE   v6
premium-content      ACTIVE   v1
grant-access         ACTIVE   v19
```

Também existem funções de teste:

```text
stripe-checkout-test
stripe-webhook-test
```

e outras funções não pertencentes diretamente ao billing.

---

# 42. ENDPOINTS LEGADOS DESATIVADOS

Foi aplicado em produção:

```text
grant-access → HTTP 410 legacy_endpoint_disabled
asaas-admin  → HTTP 410 legacy_endpoint_disabled
```

Objetivo:

impedir que a arquitetura antiga continue concedendo ou administrando acesso comercial por caminhos legados.

Isso foi uma correção deliberada antes do merge.

---

# 43. ATENÇÃO: PRODUÇÃO AINDA NÃO É IGUAL À ARQUITETURA FINAL DA BRANCH

Este é um dos pontos mais importantes desta documentação.

O branch contém a arquitetura canônica nova.

Porém o ambiente de produção ainda possui Edge Functions de checkout/webhook com código legado em partes do fluxo.

Por exemplo, versões atualmente implantadas de:

```text
asaas-checkout
asaas-webhook
stripe-checkout
stripe-webhook
```

ainda possuem referências ao modelo antigo `junior`/Firestore em trechos de implementação.

Portanto:

```text
branch canônica
≠
cutover comercial de produção concluído
```

O projeto foi deliberadamente mantido em estado de transição para evitar ativar um checkout novo sem homologação.

**A contra-auditoria deve tratar essa diferença como um gate crítico, não como detalhe.**

---

# 44. ESTADO DO PR

PR:

```text
#29
```

Estado:

```text
OPEN
DRAFT
merged = false
mergeable = true
```

Não houve merge.

A branch possui aproximadamente:

```text
116 commits
252 arquivos alterados
2843 additions
27168 deletions
```

O tamanho da alteração aumenta a necessidade de auditoria independente.

---

# 45. O QUE JÁ FOI CORRIGIDO

## Billing outage

Corrigido:

```text
billing failure ≠ Free
```

## Premium gate

Corrigido para não enviar assinante potencialmente Premium diretamente para contratação durante indisponibilidade de billing.

## Legacy grant

Desativado:

```text
grant-access
```

## Legacy admin

Desativado:

```text
asaas-admin
```

## Conteúdo Premium

Proteção server-side iniciada e ampliada.

## Shell Guard

Workflow funcionando.

## Conteúdo privado

Tabela privada validada.

## Grants

Nenhum grant direto para browser roles em `premium_content_pages`.

## Cobertura

210 rotas Premium ativas anteriormente auditadas com correspondência privada 1:1.

---

# 46. O QUE AINDA NÃO DEVE SER DECLARADO COMO HOMOLOGADO

Não declarar:

```text
“sistema 100% certificado”
```

nem:

```text
“pagamento de produção totalmente homologado”
```

antes de completar:

1. conta Free real;
2. conta Premium real;
3. login;
4. billing-access;
5. checkout Asaas;
6. webhook Asaas;
7. entitlement;
8. premium-content;
9. checkout Stripe;
10. webhook Stripe;
11. renovação;
12. cancelamento;
13. expiração;
14. falha de pagamento;
15. reembolso;
16. chargeback;
17. refresh de token;
18. token expirado;
19. troca de idioma;
20. tentativa de checkout duplicado;
21. tentativa cross-provider;
22. acesso direto à URL;
23. acesso sem token;
24. manipulação de localStorage;
25. manipulação de cookie;
26. manipulação de query string;
27. revogação;
28. restauração de acesso;
29. retorno do checkout;
30. comportamento durante indisponibilidade do billing.

---

# 47. MATRIZ DE COMPORTAMENTO ESPERADO

| Situação | Resultado esperado |
|---|---|
| visitante → página Free | acesso |
| visitante → Premium | login |
| usuário Free → Premium | assinatura |
| Premium → Premium | acesso |
| billing indisponível | não rebaixar para Free |
| token expirado | refresh/reautenticação |
| token inválido | 401 |
| sem token no premium-content | 401 |
| Free no premium-content | 403 |
| Premium no premium-content | 200 |
| localStorage alterado | não muda entitlement |
| cookie alterado | não muda entitlement |
| query string alterada | não muda entitlement |
| callback `success` | não concede sozinho |
| webhook válido | altera estado conforme evento |
| webhook duplicado | idempotente |
| checkout duplicado | bloqueado |
| conteúdo Premium inexistente no privado | erro seguro, nunca conteúdo Free |
| conteúdo Premium vazio | falha de integridade |
| usuário revogado | não deve receber Premium |
| anúncio para Premium | continua ativo |

---

# 48. MODELO DE FALHA

Princípio:

```text
fail closed
```

Exemplos:

```text
sem identidade
→ sem acesso Premium

token inválido
→ sem acesso Premium

billing não resolvido
→ não conceder Premium

conteúdo privado não encontrado
→ não inventar conteúdo

webhook inválido
→ não alterar entitlement

assinatura de webhook inválida
→ rejeitar

evento duplicado
→ não repetir efeito
```

Exceção de UX:

```text
billing temporariamente indisponível
```

não deve ser interpretado como Free.

O sistema mostra uma tela de tentativa novamente.

---

# 49. POR QUE NÃO USAR LOCALSTORAGE PARA PLANO

Nunca confiar em:

```javascript
localStorage.setItem("plan", "premium");
```

porque o usuário controla o browser.

LocalStorage é apenas armazenamento do cliente.

O sistema novo retirou a dependência comercial do cache local `plan`.

---

# 50. POR QUE NÃO USAR FIRESTORE PROFILE COMO AUTORIDADE

Um perfil como:

```json
{
  "plan": "premium"
}
```

no cliente/Firestore não deve ser suficiente para liberar conteúdo.

O novo desenho separa:

```text
identidade
```

de:

```text
billing entitlement
```

Isso reduz a superfície de manipulação e dependência do modelo legado.

---

# 51. WEBHOOK COMO AUTORIDADE FINANCEIRA

O browser pode dizer:

```text
“pagamento realizado”
```

mas isso não é prova financeira.

A autoridade é:

```text
Stripe/Asaas
      ↓
webhook autenticado
      ↓
backend
```

Portanto:

```text
checkout callback
≠
confirmação financeira
```

---

# 52. CUIDADO COM CALLBACKS

URLs como:

```text
?asaas=success
?asaas=cancel
?asaas=expired
```

servem para UX.

Não devem conceder entitlement.

O desbloqueio deve depender do webhook/ledger.

---

# 53. ANÚNCIOS

Regra comercial:

```text
FREE → anúncios
PREMIUM → anúncios
```

Premium não é ad-free.

Qualquer código que remova AdSense/Ads automaticamente para Premium deve ser considerado residual ou bug, caso contrarie a regra comercial atual.

---

# 54. CTA E PROMOÇÃO

Foi implementado:

- CTA “Assine já”;
- banner promocional;
- exibição após aproximadamente 4 segundos;
- ciclo de exibição limitado;
- remoção imediata quando Premium é detectado;
- não exibir em páginas de conta;
- banner separado do root de widgets para evitar sobrescrita.

Valor documentado no componente promocional:

```text
R$ 5,00/mês
```

Como já mencionado, isso precisa ser reconciliado com o checkout Asaas que contém `PRICE_BRL = 10.00`.

---

# 55. SEGURANÇA DE URL

O sistema evita alguns vetores de URL malformada no login:

- URL deve começar por `/`;
- rejeita `//` no início;
- rejeita `\`;
- evita retorno para a própria página de login.

Isso reduz risco de open redirect em parte do fluxo.

A contra-auditoria deve testar:

```text
returnUrl=https://evil.example
returnUrl=//evil.example
returnUrl=\\evil
returnUrl=/conta/login.html
```

---

# 56. SERVICE ROLE

O `SUPABASE_SERVICE_ROLE_KEY` existe somente no backend.

Não deve aparecer:

```text
HTML
JS público
GitHub Pages
localStorage
cookie
URL
console.log
```

Se for encontrado em qualquer arquivo público, considerar incidente de segurança.

---

# 57. FIREBASE SERVICE ACCOUNT

Também é secretíssimo:

```text
FIREBASE_SERVICE_ACCOUNT
```

Usado pelas funções que ainda precisam falar com Firestore legado.

Não deve aparecer no GitHub.

---

# 58. AUDITORIA DE SEGREDOS

A contra-auditoria deve pesquisar:

```text
ASAAS_API_TOKEN
ASAAS_WEBHOOK_TOKEN
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
SUPABASE_SERVICE_ROLE_KEY
FIREBASE_SERVICE_ACCOUNT
private_key
client_email
-----BEGIN PRIVATE KEY-----
sk_live_
whsec_
```

E pesquisar também variantes minificadas/JSON.

---

# 59. TESTES DE PENETRAÇÃO FUNCIONAL RECOMENDADOS

## Teste A — Free

1. criar/login conta Free;
2. abrir Premium diretamente;
3. confirmar redirecionamento;
4. alterar localStorage;
5. alterar cookie;
6. alterar query;
7. tentar chamar `premium-content`;
8. confirmar 403.

## Teste B — Premium

1. login;
2. obter token;
3. `billing-access`;
4. confirmar Premium;
5. chamar `premium-content`;
6. confirmar 200;
7. validar HTML;
8. atualizar página;
9. trocar idioma;
10. abrir URL diretamente.

## Teste C — token expirado

1. token expirado;
2. chamar endpoint;
3. observar 401;
4. renovar token;
5. repetir;
6. confirmar acesso.

## Teste D — billing indisponível

Simular 500/timeout:

```text
billing-access
```

Resultado esperado:

```text
não rebaixar para Free
```

## Teste E — webhook duplicado

Enviar mesmo `event.id` duas vezes.

Resultado:

```text
primeiro = processado
segundo = duplicate
```

## Teste F — webhook falsificado

Enviar:

```text
assinatura inválida
```

Resultado:

```text
401/400
sem alteração de entitlement
```

---

# 60. TESTE CROSS-PROVIDER

O mesmo usuário não deve conseguir manter dois fluxos comerciais concorrentes:

```text
Asaas checkout pending
+
Stripe checkout pending
```

Foi criada proteção para impedir essa race condition.

A contra-auditoria deve testar:

```text
pt → Asaas
troca para en → Stripe
inicia segundo checkout
```

e confirmar bloqueio.

---

# 61. EXPIRAÇÃO

Para Premium com data:

```text
premium_expires_at
```

A regra deve ser:

```text
now < premium_expires_at
    → Premium

now >= premium_expires_at
    → Free
```

Mas a fonte final deve ser o entitlement backend, não o relógio manipulável do cliente.

---

# 62. REVOGAÇÃO

Revogação deve acontecer no backend quando o evento financeiro indicar encerramento definitivo.

Exemplos:

```text
subscription deleted
subscription inactive
cancelamento efetivo
fim de período
reembolso/chargeback conforme política comercial
```

Depois:

```text
user_entitlements.plan = free
```

ou equivalente de acesso expirado.

---

# 63. RESTAURAÇÃO

Se a assinatura for renovada/reativada:

```text
webhook
   ↓
billing_subscriptions
   ↓
user_entitlements = premium
```

Depois:

```text
billing-access
   ↓
Premium
```

Não exigir que o usuário “compre novamente” apenas porque o frontend ainda está com cache antigo.

---

# 64. CACHE

Regras importantes:

```text
billing-access
cache: no-store
```

e:

```text
premium-content
private, no-store
```

Isso reduz risco de entregar conteúdo Premium ou entitlement incorreto por cache intermediário.

---

# 65. CONTEÚDO PRIVADO — INTEGRIDADE

Cada registro possui:

```text
source_sha
```

Objetivo:

permitir comparação entre conteúdo privado e fonte original.

A contra-auditoria deve verificar se o SHA é realmente derivado do conteúdo original ou se está sendo preenchido com valor estático como:

```text
local-migration
```

O script atual mostrado no branch usa:

```javascript
source_sha: "local-migration"
```

Portanto, **isso é uma pendência técnica de integridade** se a intenção for usar `source_sha` como hash criptográfico real.

Não tratar `source_sha` atual como garantia criptográfica sem corrigir/validar essa implementação.

---

# 66. PONTO CRÍTICO: MIGRADOR E CONTEÚDO PRIVADO

O script:

```text
migrate-premium-content.mjs
```

tem a ordem correta de segurança operacional:

```text
DB primeiro
shell depois
```

Mas a contra-auditoria deve verificar:

- atomicidade;
- rollback;
- conteúdo duplicado;
- SHA real;
- arquivo já shellificado;
- banco sem conteúdo correspondente;
- banco com conteúdo sem rota;
- diferenças de idioma;
- HTML corrompido;
- charset;
- scripts relativos;
- caminhos de imagens;
- links relativos;
- canonical/hreflang.

---

# 67. 210 × 229

Não confundir:

```text
210 = rotas Premium ativas auditadas
229 = registros privados existentes
```

O excesso de 19 registros não deve ser apagado sem descobrir:

- se são históricos;
- se correspondem a rotas antigas;
- se correspondem a aliases;
- se correspondem a páginas removidas;
- se são duplicatas;
- se possuem valor de auditoria.

---

# 68. SEGURANÇA DO SUPABASE ADVISOR

O Security Advisor apresentou avisos INFO relacionados a:

```text
RLS Enabled No Policy
```

para tabelas privadas.

No caso de:

```text
premium_content_pages
```

isso é deliberado porque:

```text
RLS = enabled
anon grants = 0
authenticated grants = 0
service_role = backend
```

Não criar policy pública apenas para remover o INFO.

---

# 69. FUNÇÕES LEGADAS

A contra-auditoria deve localizar qualquer ocorrência de:

```text
grant-access
asaas-admin
premiumOrders
asaasCustomers
asaasSubscribers
stripeSubscribers
users/{uid}.plan
planExpiresAt
junior
lifetime
senior
pleno
```

e classificar:

```text
legado legítimo
compatibilidade
migração
risco de autorização
```

A existência de código legado não é automaticamente uma falha; a falha é ele continuar tendo poder de conceder Premium no sistema canônico.

---

# 70. FIREBASE / FIRESTORE — O QUE AINDA EXISTE

O sistema não eliminou Firebase/Firestore completamente.

Isso é intencional.

Motivo:

outros módulos ainda dependem de Firebase.

O objetivo da reconstrução é:

```text
Firebase Auth
= identidade

Supabase
= billing
```

e não:

```text
Firebase removido imediatamente
```

---

# 71. ESTRUTURA DE AUTORIDADE

A hierarquia correta é:

```text
NÍVEL 1
Firebase Authentication
→ “quem é o usuário?”

NÍVEL 2
Supabase billing identity
→ “qual identidade comercial pertence a ele?”

NÍVEL 3
billing_subscriptions
→ “qual é o histórico operacional?”

NÍVEL 4
user_entitlements
→ “qual é o acesso efetivo?”

NÍVEL 5
premium-content
→ “pode receber o conteúdo?”

NÍVEL 6
premium_content_pages
→ “qual HTML protegido deve ser entregue?”
```

---

# 72. O QUE O FRONTEND PODE E NÃO PODE FAZER

## Pode

- solicitar login;
- mostrar Free;
- mostrar Premium retornado pelo backend;
- iniciar checkout;
- redirecionar;
- pedir refresh;
- solicitar conteúdo.

## Não pode

- conceder Premium;
- escrever entitlement;
- alterar plano no banco;
- confirmar pagamento;
- considerar callback como pagamento;
- acessar conteúdo privado diretamente;
- usar localStorage como autoridade.

---

# 73. O QUE O WEBHOOK PODE FAZER

Pode:

- confirmar evento;
- atualizar subscription;
- atualizar entitlement;
- registrar evento;
- registrar erro;
- executar reconciliação.

Não deve:

- aceitar evento sem autenticação;
- processar evento duplicado duas vezes;
- confiar em e-mail como única identidade;
- aceitar UID arbitrário vindo do browser;
- conceder Premium sem prova do provedor.

---

# 74. O QUE O USUÁRIO PREMIUM DEVE EXPERIMENTAR

Experiência esperada:

```text
Cadastro/login
      ↓
compra
      ↓
provedor confirma
      ↓
webhook
      ↓
Premium
      ↓
usuário volta ao site
      ↓
billing-access
      ↓
Premium
      ↓
abre página
      ↓
premium-content
      ↓
conteúdo aparece
```

Se ocorrer falha temporária:

```text
assinatura NÃO deve ser transformada em Free
```

e deve existir recuperação por retry/refresh.

---

# 75. GARANTIA DE ACESSO AO ASSINANTE

Para declarar que um assinante “tem acesso a todo o conteúdo que comprou”, a contra-auditoria precisa provar simultaneamente:

```text
1. entitlement correto
2. rota correta
3. conteúdo privado correspondente
4. token válido
5. backend autorizando
6. conteúdo retornando
7. shell carregando
8. idioma correto
9. links internos funcionando
10. renovação funcionando
11. revogação funcionando
```

Somente ter:

```text
plan=premium
```

não é suficiente.

---

# 76. MATRIZ DE CONTROLE

| Controle | Implementado | Verificado |
|---|---:|---:|
| Firebase Auth | sim | sim |
| Supabase billing authority | sim | sim |
| FREE/PREMIUM | sim | sim |
| Legacy grant desativado | sim | sim |
| Billing outage ≠ Free | sim | sim |
| Premium content privado | sim | sim |
| RLS Premium content | sim | sim |
| Grants anon/authenticated | 0 | sim |
| Premium route gate | sim | sim |
| 18 idiomas | sim | sim |
| Shell Guard | sim | sim |
| Asaas checkout novo | branch/produção transitória | requer E2E |
| Asaas webhook novo | branch/produção transitória | requer E2E |
| Stripe checkout novo | branch/produção transitória | requer E2E |
| Stripe webhook novo | branch/produção transitória | requer E2E |
| Free E2E | pendente | não |
| Premium E2E real | pendente | não |
| Renovação E2E | pendente | não |
| Revogação E2E | pendente | não |
| Reembolso/chargeback E2E | pendente | não |
| Preços finais | discrepância | não |
| source_sha criptográfico | pendente | não |

---

# 77. PRINCIPAIS RISCOS PARA A CONTRA-AUDITORIA

## Risco 1 — produção ainda parcialmente legada

Prioridade:

**CRÍTICA**

Verificar se checkout/webhooks de produção ainda gravam Firestore/`junior`.

---

## Risco 2 — preço divergente

Prioridade:

**ALTA**

```text
R$ 5 promocional
vs
R$ 10 checkout Asaas
```

---

## Risco 3 — E2E comercial real não realizado

Prioridade:

**CRÍTICA**

Sem isso não declarar homologação.

---

## Risco 4 — source_sha não é hash real

Prioridade:

**MÉDIA/ALTA**

O script atual registra:

```text
local-migration
```

e não um SHA real do conteúdo.

---

## Risco 5 — legado residual

Prioridade:

**ALTA**

Pesquisar todo código que ainda possa escrever:

```text
users/{uid}.plan
```

---

## Risco 6 — conteúdo privado excedente

Prioridade:

**MÉDIA**

229 registros versus 210 rotas ativas.

---

# 78. CHECKLIST DE CONTRA-AUDITORIA PARA A OUTRA IA

A outra IA deve executar:

```text
[ ] ler PR #29 inteiro
[ ] ler todos os commits
[ ] comparar branch com main
[ ] localizar todos os arquivos de auth
[ ] localizar todos os arquivos de billing
[ ] localizar todas as Edge Functions
[ ] localizar todas as RPCs
[ ] localizar todas as migrations
[ ] localizar todas as referências a plan
[ ] localizar junior
[ ] localizar senior
[ ] localizar pleno
[ ] localizar lifetime
[ ] localizar premium
[ ] localizar Firestore billing
[ ] localizar localStorage plan
[ ] localizar cookies de plano
[ ] localizar query strings de pagamento
[ ] localizar callbacks
[ ] auditar webhook
[ ] auditar idempotência
[ ] auditar locks
[ ] auditar RLS
[ ] auditar grants
[ ] auditar SECURITY DEFINER
[ ] auditar service_role
[ ] auditar secrets
[ ] auditar CORS
[ ] auditar open redirects
[ ] auditar premium-content
[ ] auditar conteúdo privado
[ ] auditar 19 localizações
[ ] auditar todos os simulados
[ ] auditar todos os formulários
[ ] auditar Biblioteca de Provas
[ ] testar Free
[ ] testar Premium
[ ] testar token expirado
[ ] testar billing outage
[ ] testar webhook duplicado
[ ] testar webhook inválido
[ ] testar checkout duplicado
[ ] testar cross-provider
[ ] testar cancelamento
[ ] testar renovação
[ ] testar expiração
[ ] testar reembolso
[ ] testar chargeback
[ ] testar troca de idioma
[ ] testar URL direta
[ ] testar conteúdo privado
[ ] validar preço
[ ] validar moeda
[ ] validar Price IDs
[ ] validar Asaas
[ ] validar Stripe
[ ] validar Firebase
[ ] validar Supabase
[ ] validar GitHub Actions
```

---

# 79. COMANDOS/CONSULTAS QUE A CONTRA-AUDITORIA DEVE FAZER

Pesquisar no repositório:

```text
plan
planId
planExpiresAt
premium
junior
senior
pleno
lifetime
grant-access
asaas-admin
premiumOrders
stripeSubscribers
asaasSubscribers
asaasCustomers
localStorage
sessionStorage
cookie
callback
success
checkout
webhook
service_role
SUPABASE_SERVICE_ROLE_KEY
FIREBASE_SERVICE_ACCOUNT
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
ASAAS_API_TOKEN
ASAAS_WEBHOOK_TOKEN
```

No PostgreSQL:

```sql
select *
from public.user_entitlements;

select *
from public.billing_subscriptions;

select *
from public.billing_identities;

select *
from public.premium_content_pages;
```

E também:

```sql
select *
from pg_proc
where pronamespace = 'public'::regnamespace;
```

para catalogar RPCs.

---

# 80. O QUE NÃO DEVE SER FEITO DURANTE A CONTRA-AUDITORIA

Não:

- alterar produção sem aprovação;
- mudar entitlement real sem conta de teste;
- apagar dados;
- apagar registros históricos;
- ativar webhook novo sem rollback;
- alterar preços sem validar dashboard;
- expor secrets;
- copiar service_role para arquivos públicos;
- desativar Firebase antes de migrar módulos dependentes;
- criar policies públicas apenas para eliminar warnings;
- fazer merge do PR automaticamente.

---

# 81. PRINCÍPIO DE NÃO-MERGE

O PR permanece Draft até que:

```text
arquitetura
+
código
+
banco
+
provedores
+
E2E
+
segurança
+
conteúdo
```

estejam coerentes.

O fato de o PR estar:

```text
mergeable = true
```

não significa:

```text
homologado
```

---

# 82. DEFINIÇÃO DE “PRONTO”

O sistema somente deve ser considerado pronto quando:

### Identidade

```text
login funcionando
logout funcionando
refresh funcionando
```

### Billing

```text
Asaas funcionando
Stripe funcionando
```

### Entitlement

```text
Free correto
Premium correto
expiração correta
revogação correta
renovação correta
```

### Conteúdo

```text
Premium privado
0 rotas faltantes
0 conteúdo público indevido
```

### Segurança

```text
sem secret leak
sem grant público indevido
sem webhook não autenticado
sem bypass por frontend
sem bypass por callback
sem bypass por localStorage
sem bypass por cookie
sem bypass por query string
```

### Operação

```text
logs
idempotência
retry
rollback
```

### Comercial

```text
preços confirmados
moedas confirmadas
Price IDs confirmados
webhooks confirmados
```

---

# 83. ARQUITETURA FINAL PRETENDIDA

```text
                         ┌─────────────────────┐
                         │      USUÁRIO        │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │ Firebase Auth       │
                         │ identidade/login    │
                         └──────────┬──────────┘
                                    │
                             Firebase ID Token
                                    │
                                    ▼
                    ┌───────────────────────────────┐
                    │     Supabase Edge Functions  │
                    └──────────────┬────────────────┘
                                   │
              ┌────────────────────┼────────────────────┐
              │                    │                    │
              ▼                    ▼                    ▼
      billing-access         checkout             premium-content
              │                    │                    │
              ▼                    ▼                    ▼
     billing_identities     Asaas / Stripe       entitlement
              │                    │                    │
              ▼                    ▼                    ▼
     user_entitlements       webhooks          premium_content_pages
              │                    │                    │
              └──────────────┬─────┴────────────────────┘
                             ▼
                       acesso Premium
```

---

# 84. ARQUITETURA DE AUTORIDADE — FRASE-CHAVE

A regra mais importante para a outra IA é:

> **Firebase responde “quem é o usuário”; Supabase responde “qual é o direito comercial”; o provedor de pagamento responde “o evento financeiro ocorreu”; o backend decide “qual conteúdo pode ser entregue”; o frontend apenas apresenta e solicita.**

---

# 85. ESTADO REAL NO MOMENTO DESTE DOCUMENTO

### Confirmado

- PR #29 aberto e Draft.
- Não houve merge.
- Firebase continua como identidade.
- Supabase possui estrutura de billing.
- `billing-access` ativo.
- `premium-content` ativo.
- `premium_content_pages` privada.
- 229 registros privados.
- 210 rotas Premium auditadas com correspondência privada.
- grants browser em `premium_content_pages` = 0.
- legacy `grant-access` desativado com HTTP 410.
- legacy `asaas-admin` desativado com HTTP 410.
- billing outage não é mais automaticamente convertido em Free no frontend.
- Premium mantém anúncios.
- Shell Guard teve execução bem-sucedida.

### Ainda não certificado

- E2E real completo de Free.
- E2E real completo de Premium.
- E2E Asaas completo.
- E2E Stripe completo.
- renovação.
- cancelamento.
- expiração.
- reembolso.
- chargeback.
- reconciliação de preço.
- reconciliação R$5 vs R$10.
- cutover definitivo das funções de pagamento.
- remoção completa da autoridade comercial legada.
- validação final do `source_sha`.

---

# 86. ORIENTAÇÃO FINAL PARA A OUTRA IA

A auditoria independente deve assumir uma postura adversarial:

```text
“Não confie no comentário do PR.
Não confie neste MD.
Não confie no frontend.
Não confie no nome da função.
Não confie no status ACTIVE.
Não confie no localStorage.
Não confie no callback.
Não confie no e-mail.
Não confie em uma única tabela.
Não confie em uma única camada.
Prove cada caminho.”
```

O objetivo não é apenas descobrir se:

```text
Free está bloqueado.
```

O objetivo principal é provar simultaneamente:

```text
Free não consegue entrar
E
Premium legítimo consegue entrar
E
Premium legítimo continua conseguindo entrar após refresh
E
Premium legítimo consegue entrar em todas as rotas contratadas
E
Premium não perde acesso por indisponibilidade transitória
E
Free não consegue falsificar Premium
E
webhook falso não concede Premium
E
webhook duplicado não duplica efeito
E
conteúdo Premium não está público
E
legado não consegue conceder Premium
E
o preço cobrado é o preço anunciado
E
a revogação funciona
E
a renovação funciona.
```

---

# 87. REFERÊNCIA DE ARQUIVOS PRINCIPAIS

Arquivos relevantes da branch:

```text
js/auth/auth-core.js
js/auth/auth-permissions.js

js/access/content-policy.js
js/access/access-router.js
js/access/premium-content-loader.js

global-scripts.js

scripts/migrate-premium-content.mjs
scripts/shellify-premium-public-pages.mjs

supabase/config.toml

supabase/functions/billing-access/
supabase/functions/billing-admin/
supabase/functions/premium-content/

supabase/functions/asaas-checkout/
supabase/functions/asaas-webhook/

supabase/functions/stripe-checkout/
supabase/functions/stripe-webhook/

supabase/migrations/
```

---

# 88. CHECKSUM / IDENTIFICAÇÃO DO SNAPSHOT

Branch:

```text
refactor/contas-free-premium
```

Head:

```text
327376df79b433f7b761786db3868967c9175a7e
```

Base:

```text
3c9821f364ab05679e921e3037c2db4eeb6f2651
```

Esses identificadores devem ser usados pela contra-auditoria para evitar comparar versões diferentes do projeto.

---

# 89. CONCLUSÃO TÉCNICA

O projeto foi reconstruído em torno de uma separação clara:

```text
IDENTIDADE
Firebase

BILLING
Supabase

PAGAMENTO
Asaas / Stripe

ENTITLEMENT
user_entitlements

SUBSCRIPTIONS
billing_subscriptions

CONTEÚDO PREMIUM
premium_content_pages

AUTORIZAÇÃO DE CONTEÚDO
premium-content Edge Function

INTERFACE
GitHub Pages + JavaScript
```

A arquitetura possui defesa em profundidade e já recebeu correções importantes para evitar que falhas temporárias de billing derrubem assinantes legítimos para Free.

Entretanto, a auditoria independente deve manter uma distinção rigorosa entre:

```text
arquitetura planejada
implementação da branch
produção atualmente implantada
homologação E2E
```

Essas quatro coisas não são automaticamente iguais.

O principal gate restante é comprovar, com contas controladas e provedores reais/test mode apropriados, a cadeia completa:

```text
LOGIN
→ CHECKOUT
→ PAGAMENTO
→ WEBHOOK
→ ENTITLEMENT
→ BILLING-ACCESS
→ FIREBASE TOKEN
→ PREMIUM-CONTENT
→ CONTEÚDO PREMIUM
```

e também a cadeia reversa:

```text
CANCELAMENTO/EXPIRAÇÃO/REVOGAÇÃO
→ ENTITLEMENT FREE
→ BLOQUEIO PREMIUM
```

Somente depois dessas provas é apropriado retirar o estado Draft do PR e considerar o sistema comercialmente homologado.
