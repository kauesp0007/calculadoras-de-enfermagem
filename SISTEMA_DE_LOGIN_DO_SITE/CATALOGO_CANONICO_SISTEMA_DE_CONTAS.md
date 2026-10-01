# Sistema de login, contas, assinaturas e acesso Premium — catálogo canônico

**Corte de auditoria:** 01/10/2026 (America/Sao_Paulo). **Repositório:** kauesp0007/calculadoras-de-enfermagem. **Projeto Supabase:** asjkftjfbkuuhilnqonx. **Site:** https://www.calculadorasdeenfermagem.com.br.

## Uso obrigatório e hierarquia de evidências

Qualquer IA ou pessoa que altere autenticação, conta, perfil, planos, anúncios por plano, pagamentos, webhooks, conteúdo protegido, painel do desenvolvedor, extensões Chrome ou deploy deve ler este arquivo e o inventário de rotas antes da alteração e atualizar ambos após mudar o comportamento. A referência operativa é o código implantado, as configurações vigentes e o banco; este documento registra o estado observado nesta data e não substitui uma nova leitura do estado dinâmico. Em conflito, revalidar antes de editar. Não registrar dados pessoais, tokens, chaves ou conteúdo privado neste catálogo.

**Contrato:** só há planos comerciais Free e Premium. Firebase Authentication autentica; Supabase PostgreSQL decide entitlement e guarda conteúdo; Asaas atende o checkout em português e Stripe os 18 idiomas internacionais. O navegador não concede Premium por retorno de checkout, URL, cookie ou localStorage.

## Mapa das interligações

1. GitHub Pages publica HTML, JavaScript, página de conta e shells; o domínio www.calculadorasdeenfermagem.com.br é a origem do frontend.
2. Firebase Authentication emite ID token do projeto calculadoras-enfermagem após login Google ou e-mail/senha. O frontend chama as Edge Functions Supabase com Bearer. As funções validam assinatura RS256 pela JWKS Google, issuer e audience do projeto.
3. account-data lê/grava account_profiles, account_favorites e account_history pelo UID Firebase; o cliente não usa essas tabelas como autoridade de plano.
4. Checkout autenticado cria/resolve billing_identities (provider=firebase, external_subject=UID), grava billing_subscriptions em checkout_pending e chama Asaas ou Stripe. Callback visual só navega; não autoriza acesso.
5. O provedor envia webhook autenticado. Webhook reivindica event_id por RPC, reconcilia assinatura e escreve user_entitlements. billing-access consulta o entitlement por identity; uma exceção manual ativa por e-mail em developer_premium_email_grants concede Premium sem assinatura.
6. A página Premium pública contém shell/placeholder e premium-content-loader.js. O loader usa o token; premium-content consulta premium_content_pages e developer_premium_route_rules; retorna HTML privado apenas quando a rota exige Premium e o entitlement é válido. Respostas privadas usam Cache-Control private/no-store e Vary Authorization.
7. global-scripts.js consulta o estado comercial para a experiência sem Google AdSense; o card de promoção só aparece para visitante ou Free confirmado. O menu de conta e a área do desenvolvedor usam o mesmo login.
8. A extensão de gasometria inicia Chrome identity WebAuthFlow, passa por conta/extensao-login.html, extension-auth emite código curto com PKCE S256 e extension-access consome o código e consulta o mesmo entitlement. As outras extensões inventariadas não participam desse fluxo.

Fluxo resumido: navegador → Firebase → Edge Function de checkout → provedor → webhook → billing_subscriptions/user_entitlements → billing-access → loader/premium-content. O ramo de perfil usa account-data; o ramo da extensão usa extension-auth/extension-access.

## Entradas, páginas e módulos

| Área | Fonte vigente | Responsabilidade |
|---|---|---|
| Login, recuperação e perfil | conta/login.html, conta/perfil.html, conta/configuracoes.html; js/firebase/firebase-init.js; js/auth/auth-core.js, auth-email.js, auth-google.js, auth-providers.js, auth-session.js, auth-user-profile.js | Identidade Firebase e hidratação do perfil; auth-core chama billing-access e expõe Auth.billingStatus(), Auth.hasPlan(), refreshProfile(). |
| Dados de conta | supabase/functions/account-data/index.ts; js/auth/firestore-user.js | Fachada legada firestore-user delega para account-data; perfil, avatar no bucket avatars-assinantes, favoritos e histórico ficam no Supabase. |
| Assinatura | conta/assinatura.html; js/billing/payment-router.js | Área central /conta/assinatura.html?lang=xx; pt → Asaas, 18 idiomas → Stripe; links e rodapé localizados. |
| Acesso | js/access/premium-content-loader.js; supabase/functions/premium-content/index.ts; premium-content-manifest.json | Shell público, catálogo privado, política dinâmica e entrega do documento. js/access/content-policy.js e access-router.js são camadas genéricas, não a autoridade final do HTML Premium. |
| Desenvolvedor | conta/desenvolvedor.html; supabase/functions/developer-admin/index.ts; conta/developer-route-catalog.json; scripts/developer-premium-requests.mjs | Painel administrativo, catálogo de caminhos válidos, switches, fila, publicação, ajustes de checkout, concessões manuais, auditoria. |
| Gestão | conta/admin-pagamentos.html; supabase/functions/billing-admin/index.ts | Leitura de assinaturas para administradores autorizados. |
| Publicidade | global-scripts.js; js/access/premium-banner-manager.js | AdSense centralizado e card de assinatura; premium-ads-guard.js retorna imediatamente e não governa a publicidade. |
| Extensão Premium | extensao-chrome/manifest.json, service-worker.js, calculator.js; js/auth/extension-login-bridge.js; conta/extensao-login.html; supabase/functions/extension-auth e extension-access | Gasometria exige verificação Premium para preencher/calcular; estado é revalidado ao abrir o painel. |
| Extensões independentes | extensao-escala-braden/*; extensao-gotejamento-medicamento/{pt-BR,en,es}/* | Painéis locais; os service-workers inspecionados não chamam extension-access nem o billing. |

Microsoft e Apple no projeto são opções não operacionais; a auditoria do código mostra Google e e-mail/senha como login implementado. O perfil não deve receber plano ou papel administrativo de metadata editável.

## Tabelas e cruzamentos no Supabase

| Tabela | Chave, relação e uso |
|---|---|
| billing_identities | id UUID; UNIQUE(provider, external_subject), provider firebase/supabase; UID Firebase conecta ao ledger; supabase_user_id opcional referencia auth.users. |
| billing_subscriptions | id UUID; user_id → billing_identities.id ON DELETE CASCADE; UNIQUE(provider, external_id); provider asaas/stripe, plan premium, status, currency, período e metadata de checkout/provedor. É histórico de fluxo, não autorização isolada. |
| user_entitlements | PK user_id → billing_identities.id ON DELETE CASCADE; plan free/premium; premium_expires_at; provider, customer/subscription IDs. Autoridade comercial para billing-access. |
| billing_webhook_claims | (provider,event_id), status, lease, processed_at, last_error; RPCs claim/complete/fail tornam webhook idempotente. |
| billing_checkout_claims | (provider,user_id), status, expiração e erro; lock de checkout via RPC; billing_subscription_guards registra bloqueios por provedor. |
| developer_premium_route_rules | PK path; premium_required, enforcement, source; CHECK exige protected_content quando premium_required=true. |
| developer_premium_activation_requests | PK path, request_id, status, requested_at/completed_at; fila de migração e publicação do shell. |
| premium_content_pages | PK path, content HTML privado, source_sha. Função usa caminho específico e, se ausente, candidato de raiz para idioma conhecido. |
| developer_settings | PK key, JSON enabled para free_global_lockdown, asaas_portal_enabled e stripe_portal_enabled. |
| developer_premium_email_grants | PK e-mail normalizado; active=false revoga; exceção administrativa de acesso. |
| developer_admin_audit_log | Histórico de mudança de configuração, rota e concessão, com antes/depois. |
| account_profiles/favorites/history | PK/chaves por firebase_uid; dados de aplicação via account-data. |
| extension_auth_codes | PK code_hash; code_challenge, firebase_uid, extension_id, expires_at; código curto consumido por DELETE condicional. |
| payments/stripe_events | Estruturas legadas; não são a decisão atual de plano. |

As tabelas centrais consultadas têm RLS habilitada. Em pg_policies observou-se account_profiles_deny_all para anon/authenticated; nas demais tabelas listadas, ausência de política pública significa negar sob RLS. As Edge Functions usam service role no servidor. As concessões de tabela para anon/authenticated em extension_auth_codes ainda existem, apesar da RLS sem política: revisar e revogar como defesa adicional. Não expor service role, ASAAS_API_TOKEN, ASAAS_WEBHOOK_TOKEN, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, ADMIN_EMAIL ou credenciais Firebase privadas.

## Asaas Brasil

asaas-checkout aceita exclusivamente lang=pt e kind=monthly_card (cartão, cobrança mensal RECURRENT) ou kind=pix_30d (Pix, DETACHED por 30 dias). Exige Firebase token, setting asaas_portal_enabled e ASAAS_PRICE_BRL válido, recusa usuário já Premium e fluxo concorrente; cria billing_subscriptions checkout_pending e sessão hospedada em api.asaas.com/v3/checkouts. O frontend anuncia R$ 5,00, mas o valor efetivamente cobrado vem do segredo ASAAS_PRICE_BRL, que não foi lido nesta auditoria.

asaas-webhook exige header asaas-access-token igual ao segredo, reivindica event_id e tenta correlacionar externalReference, checkout, subscription, customer e chamadas à API quando faltam identificadores. CHECKOUT_PAID e PAYMENT_CONFIRMED/RECEIVED concedem/renovam Premium; SUBSCRIPTION_CREATED/UPDATED isolados não dão primeiro acesso sem checkout_paid; PAYMENT_OVERDUE marca past_due. CHECKOUT_CANCELED/EXPIRED, SUBSCRIPTION_INACTIVATED/DELETED, estornos e chargebacks executam setFree, considerando outras assinaturas ativas. Um evento órfão sem assinatura local é concluído como ignored/no_local_subscription e precisa de monitoramento. Registros e guards podem bloquear reativação. Não havia acesso autorizado ao painel ou API de produção do Asaas para confirmar token, preço e entrega de eventos.

## Stripe internacional

stripe-checkout exige lang entre en, es, fr, de, it, hi, zh, ja, ru, ko, tr, nl, pl, sv, id, vi, uk, ar. EUR: tr, nl, pl, ru, fr, es, de, it, uk, sv. USD: en, hi, zh, ja, ko, id, vi, ar. O backend escolhe STRIPE_PRICE_EUR/STRIPE_PRICE_USD; há fallback hardcoded de price IDs, sem garantia de correspondência com a conta conectada. Cria Checkout Session mode=subscription, quantity=1, customer_email, client_reference_id=billing identity, metadata Firebase UID/plano/idioma; success_url localizada e cancel_url em /conta/. O frontend e o card exibem € 5,00 ou US$ 5,00 mensais e aceitam cartão; preço efetivo depende do Price escolhido pelo backend.

stripe-webhook verifica HMAC da stripe-signature com tolerância temporal, reivindica event_id, correlaciona subscription/session/UID, reconcilia assinaturas ausentes em eventos válidos, e trata checkout.session.completed, invoice.paid, invoice.payment_failed, customer.subscription.updated/deleted e checkout.session.expired. Payment_failed marca past_due e preserva período pago; cancelamento só limpa entitlement se não houver outra assinatura ativa. A Edge Function implantada foi comparada byte a byte ao código principal do repositório.

**Conta Stripe acessível nesta auditoria: somente modo de teste, acct_1UEdBrAE0EBt2lxC.** Há dois Prices recorrentes ativos de 200 centavos mensais: EUR price_1UI2ozAE0EBt2lxCDLlUrzdd (produto Premium) e USD price_1UFT82AE0EBt2lxCD2BUcx9E (produto chamado junior). O único endpoint de webhook de teste listado para stripe-webhook está **disabled**. Os IDs fallback no código (USD price_1UEeJeAE0EBt2lxCFI56AWCx, EUR price_1UEf7uAE0EBt2lxCmfLGGmNH) não aparecem entre esses preços de teste. Os segredos STRIPE_PRICE_* podem sobrescrever fallback; sem vê-los e sem conta live, não é possível concluir se a cobrança real coincide com o card de 5 unidades monetárias nem se o webhook de produção está ativo. Três assinaturas de teste listadas estavam canceled. O registro local Supabase contém um caso Stripe active USD e um checkout_failed; a natureza live/test do registro local não foi provada.

## Regras de acesso e publicação de páginas

O catálogo inicial premium-content-manifest.json contém 13 nomes exatos e padrões para simulados, flashcards e formulários, no escopo da raiz e dos 18 idiomas. O painel acrescenta páginas pelo caminho exato. Banco, catálogo privado e shell público devem concordar; a mera exibição de HTML público ou um client_guard redirecionando não protege conteúdo já publicado.

O painel só oferece paths do JSON público; POST set_route confirma admin por e-mail permitido (ADMIN_EMAIL/ADMIN_EMAIL_2) e token Firebase. Se página solicitada já tem conteúdo privado completo e shell publicado, grava premium_required=true, enforcement=protected_content. Se não, cria activation_request pending, mantém premium_required=false/enforcement=catalog_only e informa Aguardando publicação. O switch Pendente representa solicitação, não acesso Premium ativo. O workflow deploy.yml agendado a cada 5 minutos detecta a fila, migra HTML completo para premium_content_pages, gera shell, faz testes, publica GitHub Pages e só então a RPC activate_developer_premium_route finaliza se request_id continuar igual e o shell responder no domínio. Desativar a rota cancela pendência e grava false. Cada alteração de switch/setting é enviada imediatamente; não há botão geral Salvar alterações necessário.

developer-admin GET ?public=policy oferece política de leitura ao global-scripts.js, com cache de sessão de 30 s. Esse guard dá redirecionamento de UX para rota em HTML público, mas a segurança do conteúdo depende do shell e de premium-content. O campo enforcement client_guard representa HTML público e não proteção privada; o CHECK do banco impede uma regra premium_required=true com enforcement client_guard. Rotas por idioma procuram primeiro regra exata e, na falta dela, regra da raiz com o mesmo filename; isto explica aparências de Premium herdado de PT. No conteúdo privado, se falta regra para um path, premium-content presume Premium; caminho private órfão deve ser cadastrado explicitamente. Para regras Free, a função permite conteúdo privado sem autenticação.

**Snapshot do banco:** 347 regras explícitas, sendo 309 Premium e 38 Free; 373 documentos em premium_content_pages, todos não vazios; 26 privados sem regra exata, 38 regras Free com conteúdo privado, zero regras Premium sem conteúdo privado. As 26 sem regra podem herdar regra de raiz se chamadas em idioma; as 26 listadas no inventário são formulários da raiz, para os quais a função assume Premium por padrão. Nove solicitações de ativação concluídas, nenhuma pending observada. Rota raiz ballard.html não tinha regra nem conteúdo privado; não foi convertida. fugulin.html e dimensionamento.html estão Premium no banco após ativação concluída; braden.html permanece Free. medicamentos.html aparece Free apesar de constar no manifest exato. A lista por caminho, com tipo e escopo de cada idioma, está em INVENTARIO_ROTAS_VIGENTES.md. Esse inventário é fotografia e muda ao usar o painel.

## Benefícios, anúncios e promoção

global-scripts.js é o carregador do AdSense. Ele espera Auth.billingStatus() resolvido; se Premium confirmado, não carrega adsbygoogle.js, remove artefatos de anúncios e observa mutações; em indisponibilidade, bloqueia publicidade até resolver. Free e visitantes podem ver anúncios conforme consentimento. O módulo premium-ads-guard.js está desativado por return inicial; comentários legados que afirmam anúncios no Premium não representam o fluxo vigente. premium-banner-manager.js usa ilustração da enfermeira, traduções PT + 18 idiomas, links /conta/assinatura.html?lang=xx, espera 3 minutos, exibe por 10 segundos e repete para visitantes e Free confirmado; não exibe para Premium confirmado. No cartão, preços internacionais são textos fixos de 5, sujeitos à divergência com Stripe verificada acima.

## Extensões Chrome

A extensão de gasometria tem side panel e impede cálculo sem premiumAccess. O service-worker chama chrome.identity.getRedirectURL(gasometria-auth), gera verifier aleatório, challenge SHA-256, abre conta/extensao-login.html no site, recebe code em fragmento e chama extension-access com code/code_verifier/extension_id. extension-auth exige Origin permitido, Firebase token, redirect https://{id}.chromiumapp.org/gasometria-auth, PKCE S256 e emite código com validade 120 s; a tabela armazena hash, não o código bruto. extension-access faz DELETE atômico do código ainda válido com challenge e extension_id, então consulta concessão manual ou user_entitlements. Erro/timeout/Free bloqueia a calculadora; não há entitlement no storage como autoridade. CORS de extension-access é *, mas autorização depende do código one-shot e challenge. A extensão Braden e as três variantes de Gotejamento usam painéis locais sem esse bridge; não inferir assinatura a partir do nome da extensão.

## Segurança, controles e limites conhecidos

- Funções Edge relevantes têm verify_jwt=false na configuração porque verificam Firebase JWT ou segredo de webhook dentro do handler; não significa acesso livre. Conferir Origin, método, token/segredo e autorização de cada função ao alterar.
- developer-admin e billing-admin usam whitelist de e-mails via segredos, não role de frontend. O menu mostra Desenvolvedor para e-mail fixo ciadeenfermagem@gmail.com; a autorização efetiva é no servidor.
- Mudança de role/profile/localStorage não substitui entitlement; tempo de expiração é comparado no servidor. Falha billing-access preserva estado verifying/unavailable no frontend; premium-content volta a validar diretamente.
- billing-access e premium-content incluem concessões por e-mail, que devem ser auditadas e revogadas explicitamente; estavam 2 ativas e 1 inativa na fotografia.
- RLS não dispensa validação dentro de Edge Functions service role. extension_auth_codes ainda possuía GRANTs para anon/authenticated sem política RLS; reforçar privilégios em uma mudança futura.
- O webhook Stripe de teste disabled impede usar a conta de teste como evidência de fluxo completo de ativação. A conta live não foi disponibilizada.
- Divergência documentada do workflow Premium Access Audit mais recente: execução 36842195258 falhou por placeholder Premium em fugulin.html e dimensionamento.html enquanto auditar-premium-triplo.mjs ainda os exige Free. O banco indica ambos Premium e o deploy 36842195329 concluiu success. O teste/contrato de exceção Free está desatualizado frente ao switch do desenvolvedor; não alterar os switches para satisfazer um teste antigo. Há risco adicional de drift entre deploy, shell publicado, regra e conteúdo que exige verificação específica por rota.
- A chamada pública ao site confirmou a página de assinatura e o catálogo de caminhos. Não houve sessão Firebase da pessoa proprietária, cobrança real, alteração de plano, criação de sessão de checkout, acesso ao painel Asaas nem teste com extensão Chrome instalada. Isso delimita o que foi provado.

## Evidências e testes executados nesta auditoria

1. Inspeção do commit main b4aefd883e13b0a46c24b768a25dcce5a239393d e comparação integral de billing-access, premium-content, developer-admin, stripe/asaas checkout/webhooks e extension-auth/access com suas versões implantadas: idênticas.
2. SQL read-only em information_schema, pg_constraint, pg_policies e agregações em tabelas públicas com RLS: 14 billing_identities; 15 billing_subscriptions (13 Asaas, 2 Stripe); 8 entitlements Premium com expiração ainda válida; 6 identities sem entitlement; 105 reivindicações de webhook (Asaas 77 processed, 22 error, 3 processing; Stripe 2 processed, 1 error); 1 checkout claim; 4 subscription guards; 202 perfis; 1695 itens de histórico; extension_auth_codes vazia no momento. Números variam em tempo real.
3. Consulta Stripe test read-only: Prices, produtos, subscriptions e endpoints; resultado e discrepâncias na seção Stripe. Nenhuma mutação financeira.
4. GitHub Actions: deploy mais recente success; Premium Access Audit failure com 40 checks, 327 HTMLs Premium auditados e duas falhas explicitadas. O sucesso do deploy não equivale à aprovação de todas as auditorias.
5. Leitura do HTML/JSON público da assinatura e do catálogo via TinyFish, mais verificação estática de shells de fugulin, dimensionamento, braden e ballard no repositório. A extração de HTML renderizado não substitui inspeção de resposta crua por rota.
6. Testes de comportamento pagos, login de usuário real, revogação em provedor e autorização de extensão dependem de contas/sessões apropriadas e ambiente de teste isolado. Não marcá-los como aprovados sem evidência.

## Verificação operacional antes de uma alteração futura

1. Ler AI_RULES.md, AGENTS.md, este catálogo, INVENTARIO_ROTAS_VIGENTES.md e arquivos da área alterada.
2. Identificar caminho específico, fallback para raiz, regra no banco, presença do HTML completo privado e shell do mesmo path publicado. Antes de converter para Premium, preservar fonte completa e provar que shell + backend protegem a entrega.
3. Se mexer em cobrança, verificar moeda/preço efetivo no provedor e segredo configurado sem copiar valor para logs; fazer testes de webhook duplicado, atraso, falha, cancelamento, reembolso e expiração com contas de teste autorizadas. Nunca usar retorno visual como pagamento aprovado.
4. Se mexer em extensão, testar PKCE, expiração, consumo único, origem e estados Free/Premium/unavailable; se mexer em anúncios, validar consentimento e entitlement resolvido.
5. Executar scripts/test-account-pages.js, scripts/test-billing-final.js, scripts/test-premium-auth-delivery-flow.js, scripts/test-premium-content-access.js, scripts/test-developer-admin.js, scripts/test-developer-premium-activation.mjs, scripts/test-premium-ads-real-state.mjs e scripts/auditar-premium-triplo.mjs conforme impacto; conferir workflow e deploy. Registrar falha antes de declarar concluído.
6. Atualizar este documento com data, commit, versões das funções, configuração observada, resultados e limitações; regenerar o inventário de caminhos por SELECT no banco e registrar alterações do painel, migrations, fornecedores e extensão. Não tratar números deste snapshot como constantes.

## Documentação substituída

Este arquivo substitui o dossiê de contra-auditoria na raiz, o plano de anúncios em conta, a política js/access/ACCESS_POLICY.md, a instrução antiga de ecossistema e os relatórios históricos de contas/Stripe em auditorias removidos nesta consolidação. As instruções de IA remanescentes apontam para este documento. Código, scripts de teste, manifest, migrations e histórico Git continuam como evidência técnica. Não ressuscitar regras antigas de Junior, R$ 10, anúncios para Premium ou lista fixa Free por referência a uma revisão anterior.
