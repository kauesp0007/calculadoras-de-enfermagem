================================================================================
  MAPA DE PLANOS × CONTEÚDO — CALCULADORAS DE ENFERMAGEM
  Fonte canônica de acesso. O modelo comercial atual possui somente FREE e PREMIUM.
  Atualizado: 13/09/2026
================================================================================

A decisão técnica de acesso fica em:
  js/access/content-policy.js -> RESTRICTED_CONTENT

A regra fundamental é simples: usuários gratuitos continuam navegando normalmente
no conteúdo público. Somente conteúdos marcados como premium exigem o plano Premium.

-------------------------------------------------------------------------------
1. PLANOS
-------------------------------------------------------------------------------
| ID      | Nome     | Anúncios | Disponibilidade |
|---------|----------|----------|-----------------|
| free    | Gratuito | Sim      | Ativo           |
| premium | Premium  | Sim      | Ativo           |

Não existem mais planos `pleno` ou `senior`.

-------------------------------------------------------------------------------
2. REGRAS DE ACESSO
-------------------------------------------------------------------------------
free (Gratuito):
  - Acesso normal ao conteúdo público/gratuito.
  - Exibe anúncios.
  - Ao tentar abrir conteúdo premium, recebe a proteção de acesso premium.

premium (Premium):
  - Acesso ao conteúdo gratuito e a todo conteúdo marcado como `premium`.
  - Anúncios permanecem ativos; o acesso Premium é válido enquanto o entitlement comercial estiver ativo.

Não existe redirecionamento global de todo usuário gratuito para a página de
assinatura.

-------------------------------------------------------------------------------
3. CONTEÚDO RESTRITO
-------------------------------------------------------------------------------
A lista efetiva é mantida exclusivamente por `js/access/content-policy.js`.

Exemplos atualmente marcados para `junior`:
  morse, braden, fugulin, dimensionamento, meem, balancohidrico,
  medicamentos, glasgow e formulários identificados pela regra canônica.

Para adicionar um conteúdo premium:
  o arquivo deve entrar na política Premium e no catálogo privado `premium_content_pages`.

Não criar novas categorias de plano sem alterar primeiro a arquitetura de
autorização e a documentação central.

-------------------------------------------------------------------------------
4. PAGAMENTOS E ACESSO
-------------------------------------------------------------------------------
Brasil — Asaas:
  - Cartão: R$ 10,00/mês, assinatura recorrente.
  - Pix: R$ 10,00 por 30 dias, pagamento avulso.
  - Checkout individualizado, vinculado ao pedido por `externalReference`.

Internacional — Stripe:
  - US$ 5/mês ou € 5/mês conforme o idioma.
  - UID enviado em `client_reference_id` e `subscription_data.metadata.uid`.
  - Métodos de pagamento gerenciados dinamicamente pelo Dashboard.

O plano somente é concedido por webhook/serviço de backend.

-------------------------------------------------------------------------------
5. ONDE FICA CADA RESPONSABILIDADE
-------------------------------------------------------------------------------
- Autenticação/perfil: `js/auth/auth-core.js` + `js/auth/auth-user-profile.js`
- Planos: `js/auth/plan-service.js`
- Plano efetivo/expiração: `js/auth/auth-core.js` + `js/auth/authorization.js`
- Política do conteúdo: `js/access/content-policy.js`
- Roteamento de acesso: `js/access/access-router.js`
- Remoção de anúncios: `global-scripts.js`
- Página de assinatura: `conta/assinatura.html`
- Checkout Asaas: `supabase/functions/asaas-checkout/index.ts`
- Webhook Asaas: `supabase/functions/asaas-webhook/index.ts`
- Checkout Stripe: `supabase/functions/stripe-checkout/index.ts`
- Webhook Stripe: `supabase/functions/stripe-webhook/index.ts`

================================================================================
