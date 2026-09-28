# CONTRATO CANÔNICO — LOGIN, ASSINATURAS E ACESSO FREE/PREMIUM

Data: 27/09/2026
Repositório: kauesp0007/calculadoras-de-enfermagem

## Regra de prioridade

Qualquer IA que altere cadastro, login, conta, checkout, billing, entitlement, proteção ou conteúdo Premium deve ler este documento antes de editar.

Não criar uma segunda autoridade.

## Modelo comercial

Somente:
- free
- premium

Não reintroduzir:
- junior
- senior
- pleno
- lifetime
- ad-free

Premium mantém anúncios ativos.

## Identidade

Firebase Authentication é a autoridade da identidade.

O UID do Firebase é a identidade usada no billing identity.

Arquivos principais:
- js/firebase/firebase-init.js
- js/auth/auth-core.js
- js/auth/auth-session.js
- js/auth/auth-providers.js
- js/auth/auth-email.js
- js/auth/auth-google.js

firestore-user.js é somente uma fachada de compatibilidade para account-data. Não restaurar dependência operacional em Firestore.

## Dados da conta

Supabase PostgreSQL armazena os dados de aplicação:
- account_profiles
- account_favorites
- account_history

account-data valida o Firebase ID token e usa service role no backend.

O cliente não deve ler ou gravar essas tabelas diretamente.

## Billing

Tabelas canônicas:
- billing_identities
- billing_subscriptions
- user_entitlements

billing_identities liga Firebase UID à identidade comercial.

billing_subscriptions é o ledger de checkout/assinaturas.

user_entitlements é a autoridade do estado comercial.

O cliente nunca grava entitlement.

## Asaas

Arquivo:
supabase/functions/asaas-checkout/index.ts

Webhook:
supabase/functions/asaas-webhook/index.ts

Regras:
- Firebase token obrigatório no checkout;
- checkout concorrente deve ser bloqueado;
- assinatura começa como checkout_pending;
- pagamento confirmado pelo provedor é processado pelo webhook;
- webhook deve ser autenticado e idempotente;
- Premium só é concedido após evento válido de pagamento/checkout;
- cancelamento, expiração, reembolso e chargeback devem atualizar o entitlement.

## Stripe

Arquivo:
supabase/functions/stripe-checkout/index.ts

Webhook:
supabase/functions/stripe-webhook/index.ts

Regras:
- Firebase token obrigatório no checkout;
- checkout concorrente bloqueado;
- stripe-signature obrigatória no webhook;
- webhook idempotente;
- pagamento válido cria/renova entitlement;
- payment_failed não remove acesso já pago antes do fim do período;
- cancelamento ou expiração encerra o entitlement quando não existir outra assinatura válida.

## Billing access

Arquivo:
supabase/functions/billing-access/index.ts

Somente leitura.

Premium exige:
- token Firebase válido;
- billing identity existente;
- entitlement existente;
- plan = premium;
- premium_expires_at válido.

Falha de billing-access nunca deve virar Premium.

## Conteúdo Premium

Tabela:
premium_content_pages

Edge Function:
supabase/functions/premium-content/index.ts

A tabela é privada e acessível pelo service role.

A função:
- valida Firebase;
- encontra billing identity;
- valida entitlement;
- lê conteúdo privado;
- retorna 403 sem acesso;
- usa Cache-Control private,no-store;
- usa Vary Authorization.

Não colocar conteúdo Premium completo dentro de HTML público.

## Shells

Loader:
js/access/premium-content-loader.js

Páginas Premium públicas são shells.

O loader:
- define __IS_PREMIUM_ROUTE;
- inicializa autenticação;
- obtém Firebase ID token;
- chama premium-content;
- trata 401/403;
- atualiza billing quando necessário;
- pode repetir a requisição.

access-router.js e route-guard.js não são a autoridade final de entrega do Premium.

## Expiração

Campos:
- user_entitlements.premium_expires_at
- billing_subscriptions.current_period_start
- billing_subscriptions.current_period_end

Usar timestamptz.

Nunca usar apenas timer ou localStorage para determinar acesso.

## Cache

localStorage só pode conter dados não sensíveis destinados a UX/cache.

Nunca armazenar como autoridade:
- senha;
- service role key;
- segredo de webhook;
- autorização Premium.

Cache local jamais concede Premium.

## Login

Implementados:
- Google
- e-mail/senha

Microsoft e Apple são placeholders e devem aparecer como indisponíveis enquanto não houver implementação real.

Nunca apresentar fluxo “funcional” se o módulo apenas retorna “em breve”.

## Fórum

Não usar plano comercial para decidir edição/exclusão de post.

Não usar localStorage.admin_mode como privilégio.

Moderação real deve continuar no backend forum-moderation, com autenticação Firebase e autorização administrativa.

## Rotas Free

Exceções documentadas:
- braden.html
- fugulin.html
- dimensionamento.html

Não colocá-las no catálogo Premium sem revisão explícita.

## Publicidade Premium

A remoção de anúncios para Premium é derivada exclusivamente do mesmo entitlement comercial usado pelo restante do sistema.

Regras:
- Firebase Authentication identifica o usuário;
- Supabase billing-access resolve o estado comercial;
- `Auth.billingStatus()` reflete o estado resolvido no frontend;
- `global-scripts.js` é o único carregador do AdSense;
- Premium válido bloqueia o carregamento do `adsbygoogle.js` e neutraliza containers de anúncios;
- Free e visitantes continuam elegíveis a anúncios, respeitando o consentimento;
- billing, checkout, webhooks e `user_entitlements` não são alterados para implementar o benefício;
- não criar `ad-free`, `premiumAds`, tabela, RPC, cookie ou `localStorage` como autoridade paralela;
- não usar módulos legados de publicidade como fonte de decisão.

Receita de bolo operacional: `conta/PLANO_REMOCAO_ANUNCIOS_ASSINANTES_PREMIUM.md`.

## Legado proibido

Não restaurar:
- current_user_plan()
- ensure_user_entitlement()
- grant-access como fonte comercial
- Firestore como fonte de billing
- Mercado Pago como provedor atual
- localStorage.plan
- localStorage.admin_mode para privilégio
- hasPlan('junior')
- planos Junior/Senior/Pleno/lifetime
- ad-free como benefício

Artefatos históricos podem permanecer arquivados, mas não podem participar do fluxo de produção.

## Fluxo obrigatório

Firebase login
→ checkout
→ billing identity
→ billing subscription
→ provedor confirma
→ webhook
→ entitlement
→ billing-access
→ premium-content
→ conteúdo privado.

Não criar um caminho paralelo.

## Liberação rápida

Depois que o provedor confirmar:
1. webhook deve gravar entitlement;
2. billing-access deve refletir imediatamente o novo estado;
3. boas_vindas_assinante.html deve consultar novamente;
4. premium-content-loader deve conseguir atualizar e tentar novamente;
5. nunca exigir segundo pagamento.

## Testes obrigatórios

Sempre verificar:
- cadastro;
- login;
- recuperação de senha;
- billing-access;
- Asaas checkout;
- Stripe checkout;
- webhook;
- idempotência;
- expiração;
- premium-content;
- Free routes;
- 30 printable forms;
- account pages;
- Premium shell audit;
- deploy.

Scripts relevantes:
- scripts/test-account-pages.js
- scripts/test-premium-auth-delivery-flow.js
- scripts/test-premium-simulados-access.js
- scripts/test-premium-content-access.js
- scripts/auditar-bloqueio-escalas.js
- scripts/auditar-premium-triplo.mjs
- scripts/validate-printable-scale-forms.mjs
- scripts/validate-bilingual-library-forms.js

## Deploy

O deploy só está concluído quando:
- sincronização de premium_content_pages passa;
- validações passam;
- shells são gerados;
- auditorias passam;
- upload passa;
- GitHub Pages retorna success.

Nunca desativar a proteção Premium para fazer o deploy passar.

## Arquitetura atual versus antiga

Antigo:
- Firestore para dados de conta/billing;
- funções de plano legado;
- páginas Premium completas em HTML público;
- múltiplos caminhos de decisão.

Atual:
- Firebase como identidade;
- Supabase como autoridade comercial e de conteúdo;
- account-data para dados de conta;
- billing_identity/subscription/entitlement para billing;
- premium-content para entrega;
- shells públicos;
- idempotência e locks de checkout.

## Regra de alteração

Antes de alterar:
1. identificar autoridade atual;
2. consultar migration e documentação;
3. fazer mudança mínima;
4. não tocar no webhook sem teste;
5. executar auditorias;
6. conferir GitHub Actions;
7. registrar a razão da mudança.

