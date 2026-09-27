# Relatório de Auditoria — Login, Assinaturas e Acesso FREE/PREMIUM

Data: 27/09/2026
Repositório: kauesp0007/calculadoras-de-enfermagem
Supabase: asjkftjfbkuuhilnqonx

## 1. Resultado executivo

O núcleo atual do sistema está operacional e o último deploy de produção foi confirmado como success.

GitHub Actions:
- Deploy: run 36330503459 — success.
- Premium Access Audit: run 36330503470 — success.
- O deploy passou por sincronização privada, validação dos 30 formulários, shellificação, validação pública, auditoria de acesso, geração do Service Worker, upload e publicação no GitHub Pages.

Cadeia canônica:
Firebase Authentication → billing_identities → billing_subscriptions → user_entitlements → billing-access/premium-content → conteúdo Premium privado.

A identidade é mantida no Firebase. A autoridade comercial e o conteúdo Premium estão no Supabase. O navegador não é autoridade para conceder Premium.

## 2. Cadastro e login

O cadastro por e-mail e senha usa Firebase Authentication. Google também possui implementação operacional.

O perfil da aplicação foi centralizado no Supabase por meio de account-data. O arquivo js/auth/firestore-user.js permanece somente como fachada de compatibilidade histórica; ele chama account-data e não representa uma dependência operacional do Firestore.

Account-data valida o Firebase ID token antes de acessar perfil, favoritos e histórico.

Há políticas de banco que bloqueiam acesso direto às tabelas de conta para anon/authenticated.

## 3. Estado comercial

O catálogo comercial atual contém somente:
- free
- premium

O plan-service.js confirma apenas esses dois planos.

As documentações canônicas também proíbem:
- junior
- senior
- pleno
- lifetime
- ad-free

Premium mantém os anúncios ativos.

## 4. Fluxo de assinatura nacional

Asaas é o provedor da raiz em português.

asaas-checkout:
- valida Firebase;
- cria ou atualiza billing identity;
- impede checkout concorrente;
- cria billing_subscriptions como checkout_pending;
- cria checkout hospedado no Asaas.

asaas-webhook:
- valida segredo do webhook;
- usa idempotência;
- localiza a assinatura;
- atualiza billing_subscriptions;
- cria/atualiza user_entitlements;
- define premium_expires_at;
- processa cancelamento, expiração, reembolso e chargeback;
- não concede Premium apenas por existir uma assinatura.

## 5. Fluxo de assinatura internacional

Stripe é o provedor internacional.

stripe-checkout:
- valida Firebase;
- cria a identidade comercial;
- impede fluxos concorrentes;
- cria a sessão Stripe;
- grava referências e metadados.

stripe-webhook:
- valida stripe-signature;
- usa idempotência;
- resolve a assinatura;
- concede/renova entitlement;
- mantém acesso já pago até o fim do período em falhas de cobrança;
- encerra o acesso quando a assinatura deixa de ser válida e não existe outra assinatura vigente.

## 6. Entitlement

user_entitlements é a autoridade comercial.

billing-access é somente leitura e retorna Premium somente quando:
1. Firebase ID token é válido;
2. billing identity existe;
3. entitlement existe;
4. plan = premium;
5. premium_expires_at é nulo ou está no futuro.

Não existe concessão por localStorage, cookie, query string ou callback do checkout.

## 7. Conteúdo Premium

premium_content_pages é uma tabela privada de conteúdo.

O cliente não possui leitura direta.

premium-content:
- valida Firebase;
- resolve billing identity;
- verifica entitlement;
- lê conteúdo privado;
- devolve 403 sem entitlement;
- usa Cache-Control: private, no-store;
- usa Vary: Authorization.

As páginas públicas Premium são shells e usam premium-content-loader.js.

## 8. Regras FREE

Usuário Free deve:
- acessar todo o conteúdo gratuito;
- poder usar os recursos de conta autorizados;
- não receber viewPremium/downloadPremium;
- ser impedido de receber conteúdo de premium_content_pages.

Existem exceções explícitas documentadas como gratuitas:
- braden.html
- fugulin.html
- dimensionamento.html

## 9. Regras PREMIUM

Usuário Premium com entitlement válido:
- mantém tudo que o Free possui;
- recebe o conteúdo Premium;
- pode abrir os shells protegidos;
- recebe o conteúdo real apenas pelo backend autenticado.

O acesso não depende de cache local.

## 10. Liberação rápida após pagamento

O sistema foi desenhado para eventualidade assíncrona.

Sequência:
Firebase login
→ checkout
→ billing identity
→ checkout_pending
→ confirmação do provedor
→ webhook autenticado/idempotente
→ billing_subscriptions
→ user_entitlements
→ billing-access
→ premium-content
→ conteúdo liberado.

boas_vindas_assinante.html faz nova verificação após o retorno do checkout e aguarda a confirmação comercial sem exigir um segundo pagamento.

O premium-content-loader também possui tratamento de 403 e refresh/retry do estado comercial.

## 11. Expiração e armazenamento de datas

Os campos comerciais utilizam timestamptz:
- user_entitlements.premium_expires_at
- billing_subscriptions.current_period_start
- billing_subscriptions.current_period_end
- created_at
- updated_at

O backend compara a data de expiração com o horário atual. O frontend não é a autoridade de expiração.

## 12. Segurança

Foram confirmados:
- validação de Firebase ID token nas funções críticas;
- validação própria dos webhooks;
- conteúdo Premium privado;
- REVOKE/RLS para impedir acesso direto;
- idempotência de webhook;
- proteção contra checkout concorrente;
- no-store no conteúdo protegido;
- separação entre identidade e autorização comercial.

O Supabase reporta avisos de RLS sem policies em várias tabelas. Isso é compatível com tabelas deliberadamente service-role-only e não deve ser interpretado isoladamente como exposição pública.

## 13. Banco e capacidade

A organização Supabase está atualmente no plano Free.

Estado observado:
- projeto ACTIVE_HEALTHY;
- PostgreSQL aproximadamente 24 MB;
- WAL observado aproximadamente 80 MB;
- premium_content_pages aproximadamente 337–338 registros;
- billing_identities: 18;
- billing_subscriptions: 18;
- user_entitlements: 1;
- account_profiles: 155;
- account_history: 663;
- billing_webhook_claims: 69;
- billing_checkout_claims: 0.

O banco está muito abaixo do limite documentado de 500 MB do plano Free que pode tornar o projeto read-only.

Não é seguro transformar o tamanho atual em um número fixo de membros suportados. O crescimento de histórico, perfil e outras tabelas deve ser acompanhado.

Importante: o banco auditado possui apenas uma assinatura atualmente ativa. Portanto a auditoria não pode afirmar que várias assinaturas ativas reais foram simultaneamente exercitadas hoje.

## 14. Logs

A fonte de logs unificada do Supabase está acessível, mas uma consulta de filtragem textual apresentou erro do backend de logs. Isso foi registrado como limitação e não foi interpretado como ausência de erros.

O diagnóstico utilizou:
- estados persistidos no banco;
- migrations;
- código das Edge Functions;
- GitHub Actions;
- auditorias automatizadas.

## 15. Resíduos legados encontrados

### Junior
Ainda existiam referências a hasPlan('junior') em páginas do fórum. Essas referências são incompatíveis com o catálogo comercial atual.

### admin_mode
Fóruns ainda possuíam leitura de localStorage.admin_mode para um caminho de UI administrativo. O backend de moderação exige Firebase e autorização administrativa, portanto esse localStorage não concede privilégio real no servidor, mas deve ser removido do frontend.

### concurso_publico
A página tinha uma regra que interpretava junior em localStorage como Premium para evitar anúncios. Essa regra foi neutralizada. Premium não remove anúncios.

### Microsoft e Apple
Os módulos eram placeholders que retornavam isAvailable=true apesar de não implementarem login. Eles foram alterados para isAvailable=false.

### Mercado Pago
Existem artefatos antigos:
- public.payments;
- deploy-mercadopago.ps1;
- deploy-mercadopago.bat.

Eles não fazem parte do ledger atual e não devem ser usados para produção.

### Test endpoints
stripe-checkout-test e stripe-webhook-test permanecem como funções presentes no projeto. Não são fonte comercial e não devem ser ativadas no fluxo de produção.

## 16. Mudanças de arquitetura encontradas

O fluxo atual foi aperfeiçoado em relação ao sistema antigo:

1. Firebase continua como autoridade de identidade para preservar contas.
2. Dados de conta foram centralizados no Supabase via account-data.
3. Billing migrou para billing_identities, billing_subscriptions e user_entitlements.
4. RPCs antigos current_user_plan e ensure_user_entitlement foram removidos.
5. Conteúdo Premium foi retirado do HTML público e migrado para premium_content_pages.
6. premium-content passou a ser a autoridade de entrega.
7. access-router e route-guard deixaram de ser a autoridade final das páginas Premium.
8. Webhooks passaram a usar idempotência.
9. Foram criadas proteções contra checkout concorrente.
10. O deploy exige que um shell Premium tenha conteúdo privado correspondente antes de publicar.
11. A auditoria Premium foi corrigida para aceitar corretamente a fase pré-shell do pipeline.

## 17. O que já foi corrigido durante esta auditoria

- isPlanExpired deixou de ser um método que sempre retornava false e passou a verificar premiumExpiresAt.
- comentários de caches foram alinhados para Supabase PostgreSQL.
- Microsoft e Apple agora se declaram indisponíveis enquanto não houver implementação real.
- concurso_publico deixou de considerar junior/localStorage para decidir anúncios.
- parte das páginas de fórum já foi atualizada para remover o bypass admin_mode e a dependência Junior.

Ainda restam idiomas do fórum a limpar. Isso foi deliberadamente deixado para uma etapa seguinte porque o lote de alterações atingiu o limite operacional do conector.

## 18. Plano de ação global sem interromper billing

Fase 1:
Finalizar a limpeza das páginas de fórum restantes.

Fase 2:
Validar a UX dos botões Microsoft/Apple para que não apareçam como métodos disponíveis.

Fase 3:
Arquivar/isol ar claramente os artefatos Mercado Pago e endpoints de teste sem alterar o ledger atual.

Fase 4:
Consolidar todas as instruções das IAs em um único contrato canônico.

Fase 5:
Criar uma rotina de regressão para:
- cadastro;
- login;
- billing-access;
- Asaas checkout;
- Stripe checkout;
- webhook;
- idempotência;
- expiração;
- premium-content;
- páginas Free;
- páginas Premium;
- account-data;
- deploy.

Nenhuma fase acima deve alterar as tabelas de entitlement ou webhooks sem teste primeiro.

## 19. Limitações da prova E2E

A auditoria não efetuou uma nova cobrança real em cartão/Pix. Portanto:

Comprovado:
- arquitetura;
- código;
- banco;
- integrações;
- auditorias automáticas;
- caminho de entitlement;
- proteção do conteúdo;
- deploy.

Ainda não comprovado por uma transação nova:
- tempo real exato entre pagamento de um cliente novo e atualização pelo provedor;
- comportamento de um novo cliente internacional em produção usando cartão real;
- comportamento de vários pagamentos simultâneos em volume real.

Esses pontos devem ser testados em ambiente controlado do provedor antes de qualquer alteração adicional no checkout.

## 20. Conclusão

A separação de responsabilidades atual é:

O navegador identifica a pessoa.
O provedor confirma o pagamento.
O webhook autentica a confirmação.
O ledger registra a assinatura.
O entitlement representa a autorização comercial.
O backend decide se o cliente tem acesso.
O backend entrega o conteúdo privado.
O frontend apresenta o resultado.

Esse é o contrato que deve ser preservado.

O sistema não precisa ser reconstruído do zero. Os principais riscos atuais estão na limpeza de legados e na documentação distribuída, não no núcleo do entitlement já validado em produção.
