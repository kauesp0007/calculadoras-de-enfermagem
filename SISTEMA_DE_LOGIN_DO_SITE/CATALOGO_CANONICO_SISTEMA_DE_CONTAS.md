# Sistema de login, contas, assinaturas e acesso Premium — catálogo canônico

**Corte de auditoria:** 02/10/2026 (America/Sao_Paulo). **Atualização estrutural do método de acesso:** após deploy 37039229385. **Repositório:** kauesp0007/calculadoras-de-enfermagem. **Projeto Supabase:** asjkftjfbkuuhilnqonx. **Site:** https://www.calculadorasdeenfermagem.com.br.

## Uso obrigatório e hierarquia de evidências

Qualquer IA ou pessoa que altere autenticação, conta, perfil, planos, anúncios por plano, pagamentos, webhooks, conteúdo Premium, botões protegidos, impressão/PDF, painel do desenvolvedor, extensões Chrome ou deploy DEVE ler este arquivo, `INVENTARIO_ROTAS_VIGENTES.md` e `PROTOCOLO_DECISOES_DO_DESENVOLVEDOR.md` antes da alteração. **Este arquivo é a única fonte documental do método de autorização e bloqueio.** Os demais arquivos de IA devem apenas apontar para ele, sem copiar regras completas. A referência operativa continua sendo o código implantado + banco + configuração vigente; em conflito, revalidar o estado dinâmico antes de editar. Não registrar dados pessoais, tokens, chaves ou conteúdo privado neste catálogo.

**Contrato:** só há planos comerciais Free e Premium. Firebase Authentication autentica; Supabase PostgreSQL decide entitlement e guarda conteúdo; Asaas atende o checkout em português e Stripe os 18 idiomas internacionais. O navegador não concede Premium por retorno de checkout, URL, cookie ou localStorage.

## Mapa das interligações

1. GitHub Pages publica HTML, JavaScript, página de conta e shells; o domínio www.calculadorasdeenfermagem.com.br é a origem do frontend.
2. Firebase Authentication emite ID token do projeto calculadoras-enfermagem após login Google ou e-mail/senha. O frontend chama as Edge Functions Supabase com Bearer. As funções validam assinatura RS256 pela JWKS Google, issuer e audience do projeto.
3. account-data lê/grava account_profiles, account_favorites e account_history pelo UID Firebase; o cliente não usa essas tabelas como autoridade de plano.
4. Checkout autenticado cria/resolve billing_identities (provider=firebase, external_subject=UID), grava billing_subscriptions em checkout_pending e chama Asaas ou Stripe. Callback visual só navega; não autoriza acesso.
5. O provedor envia webhook autenticado. Webhook reivindica event_id por RPC, reconcilia assinatura e escreve user_entitlements. billing-access consulta o entitlement por identity; uma exceção manual ativa por e-mail em developer_premium_email_grants concede Premium sem assinatura.
6. A página classificada pelo sistema pode publicar um shell com `premium-content-loader.js`. O loader solicita o documento em `premium-content`, que consulta `premium_content_pages` e `developer_premium_route_rules`. **No método vigente, o HTML pode ser entregue como demonstração pública; a autorização Premium é aplicada às ações protegidas** (cálculo, resultado, interpretação, download, impressão, geração de PDF, simulados/quiz e submissões) por `?access=check`. Downloads de arquivos sensíveis, como os PDFs do catálogo assistencial, têm uma validação server-side adicional independente da consulta da página. Respostas usam `private/no-store` e `Vary: Authorization` quando aplicável.
7. global-scripts.js consulta o estado comercial para a experiência sem Google AdSense; o card de promoção só aparece para visitante ou Free confirmado. O menu de conta e a área do desenvolvedor usam o mesmo login.
8. A extensão de gasometria inicia Chrome identity WebAuthFlow, passa por conta/extensao-login.html, extension-auth emite código curto com PKCE S256 e extension-access consome o código e consulta o mesmo entitlement. As outras extensões inventariadas não participam desse fluxo.

Fluxo resumido: navegador → Firebase → Edge Function de checkout → provedor → webhook → billing_subscriptions/user_entitlements → billing-access → loader/premium-content. O ramo de perfil usa account-data; o ramo da extensão usa extension-auth/extension-access.

## Entradas, páginas e módulos

| Área | Fonte vigente | Responsabilidade |
|---|---|---|
| Login, recuperação e perfil | conta/login.html, conta/perfil.html, conta/configuracoes.html; js/firebase/firebase-init.js; js/auth/auth-core.js, auth-email.js, auth-google.js, auth-providers.js, auth-session.js, auth-user-profile.js | Identidade Firebase e hidratação do perfil; auth-core chama billing-access e expõe Auth.billingStatus(), Auth.hasPlan(), refreshProfile(). |
| Dados de conta | supabase/functions/account-data/index.ts; js/auth/firestore-user.js | Fachada legada firestore-user delega para account-data; perfil, avatar no bucket avatars-assinantes, favoritos e histórico ficam no Supabase. |
| Assinatura | conta/assinatura.html; js/billing/payment-router.js | Área central /conta/assinatura.html?lang=xx; pt → Asaas, 18 idiomas → Stripe; links e rodapé localizados. |
| Acesso | `js/access/premium-content-loader.js`; `js/access/premium-print-guard.js`; `js/access/assistential-forms-catalog.js`; `js/auth/permission-service.js`; `js/auth/plan-service.js`; `supabase/functions/premium-content/index.ts`; `premium-content-manifest.json` | Shell/documento, gate de ações, bloqueio de impressão/PDF, downloads assistenciais, política dinâmica e permissões. `content-policy.js` e `access-router.js` são auxiliares; a autorização efetiva depende de Firebase + Supabase + Edge Functions. |
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
| developer_premium_route_rules | PK path; `premium_required`, `enforcement`, `source` e metadados de decisão. No corte atual, Premium usa `client_guard` e Free usa `catalog_only`; consultar o banco porque o painel pode alterar o estado. |
| developer_premium_activation_requests | PK path, request_id, status, requested_at/completed_at; fila de migração e publicação do shell. |
| premium_content_pages | PK path, fonte HTML usada por `premium-content`, com `source_sha`. No método atual esse HTML pode servir demonstração pública; ações sensíveis continuam condicionadas à autorização server-side. |
| developer_settings | PK key, JSON enabled para free_global_lockdown, asaas_portal_enabled e stripe_portal_enabled. |
| developer_premium_email_grants | PK e-mail normalizado; active=false revoga; exceção administrativa de acesso. |
| developer_admin_audit_log | Histórico de mudança de configuração, rota e concessão, com antes/depois. |
| account_profiles/favorites/history | PK/chaves por firebase_uid; dados de aplicação via account-data. |
| extension_auth_codes | PK code_hash; code_challenge, firebase_uid, extension_id, expires_at; código curto consumido por DELETE condicional. |
| payments/stripe_events | Estruturas legadas; não são a decisão atual de plano. |

As tabelas centrais consultadas têm RLS habilitada. Em pg_policies observou-se account_profiles_deny_all para anon/authenticated; nas demais tabelas listadas, ausência de política pública significa negar sob RLS. As Edge Functions usam service role no servidor. As concessões de tabela para anon/authenticated em extension_auth_codes ainda existem, apesar da RLS sem política: revisar e revogar como defesa adicional. Não expor service role, ASAAS_API_TOKEN, ASAAS_WEBHOOK_TOKEN, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, ADMIN_EMAIL ou credenciais Firebase privadas.

## Asaas Brasil

asaas-checkout aceita exclusivamente lang=pt e kind=monthly_card (cartão, cobrança mensal RECURRENT) ou kind=pix_30d (Pix, DETACHED por 30 dias). Exige Firebase token, setting asaas_portal_enabled e ASAAS_PRICE_BRL válido, recusa usuário já Premium e fluxo concorrente; cria billing_subscriptions checkout_pending e sessão hospedada em api.asaas.com/v3/checkouts. O frontend anuncia R$ 5,00, mas o valor efetivamente cobrado vem do segredo ASAAS_PRICE_BRL, que não foi lido nesta auditoria.

**Contrato de datas e primeira cobrança (corrigido em 01/10/2026):** no cartão recorrente, a primeira mensalidade vence na data em que o checkout é criado, calculada em `America/Sao_Paulo`. Não acrescentar 24 horas e não usar uma data futura de renovação como prova de pagamento inicial. O payload envia `subscription.cycle=MONTHLY`; esse ciclo governa as cobranças posteriores. Os metadados `first_charge_policy=immediate`, `first_charge_due_date` e `recurrence_cycle=MONTHLY` registram essa intenção. O registro local permanece `checkout_pending` até confirmação financeira real.

asaas-webhook exige header asaas-access-token igual ao segredo, reivindica event_id e tenta correlacionar externalReference, checkout, subscription, customer e chamadas à API quando faltam identificadores. CHECKOUT_PAID e PAYMENT_CONFIRMED/RECEIVED concedem/renovam Premium; SUBSCRIPTION_CREATED/UPDATED isolados nunca comprovam o primeiro pagamento e devem manter `checkout_pending` enquanto `checkout_paid` não for verdadeiro. `nextDueDate` representa a próxima cobrança/limite do período somente depois da ativação. O parser aceita `YYYY-MM-DD` e timestamps completos, testa validade antes de `toISOString()` e jamais deve concatenar horário a um timestamp já completo. Erros de processamento chamam `fail_billing_webhook`, evitando claims abandonados em `processing`.

PAYMENT_OVERDUE marca past_due. CHECKOUT_CANCELED/EXPIRED, SUBSCRIPTION_INACTIVATED/DELETED, estornos e chargebacks executam setFree, considerando outras assinaturas ativas. Um evento órfão sem assinatura local é concluído como ignored/no_local_subscription e precisa de monitoramento. Registros e guards podem bloquear reativação. Exceção administrativa temporária deve usar `developer_premium_email_grants`, manter a cobrança em seu estado financeiro verdadeiro e registrar motivo, responsável e posterior revogação; nunca marcar pagamento como recebido apenas para liberar acesso.

**Incidente e correção:** um checkout de cartão criado em 01/10/2026 gerou cobrança futura porque `asaas-checkout` adicionava 24 horas à primeira data. Em paralelo, o webhook recebeu uma data que causou `RangeError: Invalid time value`. PR #124 (commit `c439bfeaa15f808cb4b59298fee17a9809ac849f`) publicou `asaas-webhook` v252 com parser seguro e separação entre assinatura criada e primeiro pagamento. PR #125 (commit `a04599e8ee7fc8f794d86b37bcdac358803e665e`) publicou `asaas-checkout` v257 com primeira cobrança imediata e recorrência mensal posterior. Checkouts criados antes da v257 não são retroativamente remarcados.

## Stripe internacional

stripe-checkout exige lang entre en, es, fr, de, it, hi, zh, ja, ru, ko, tr, nl, pl, sv, id, vi, uk, ar. EUR: tr, nl, pl, ru, fr, es, de, it, uk, sv. USD: en, hi, zh, ja, ko, id, vi, ar. O backend escolhe STRIPE_PRICE_EUR/STRIPE_PRICE_USD; há fallback hardcoded de price IDs, sem garantia de correspondência com a conta conectada. Cria Checkout Session mode=subscription, quantity=1, customer_email, client_reference_id=billing identity, metadata Firebase UID/plano/idioma; success_url localizada e cancel_url em /conta/. O frontend e o card exibem € 5,00 ou US$ 5,00 mensais e aceitam cartão; preço efetivo depende do Price escolhido pelo backend.

stripe-webhook verifica HMAC da stripe-signature com tolerância temporal, reivindica event_id, correlaciona subscription/session/UID, reconcilia assinaturas ausentes em eventos válidos, e trata checkout.session.completed, invoice.paid, invoice.payment_failed, customer.subscription.updated/deleted e checkout.session.expired. Payment_failed marca past_due e preserva período pago; cancelamento só limpa entitlement se não houver outra assinatura ativa. A Edge Function implantada foi comparada byte a byte ao código principal do repositório.

**Conta Stripe acessível nesta auditoria: somente modo de teste, acct_1UEdBrAE0EBt2lxC.** Há dois Prices recorrentes ativos de 200 centavos mensais: EUR price_1UI2ozAE0EBt2lxCDLlUrzdd (produto Premium) e USD price_1UFT82AE0EBt2lxCD2BUcx9E (produto chamado junior). O único endpoint de webhook de teste listado para stripe-webhook está **disabled**. Os IDs fallback no código (USD price_1UEeJeAE0EBt2lxCFI56AWCx, EUR price_1UEf7uAE0EBt2lxCmfLGGmNH) não aparecem entre esses preços de teste. Os segredos STRIPE_PRICE_* podem sobrescrever fallback; sem vê-los e sem conta live, não é possível concluir se a cobrança real coincide com o card de 5 unidades monetárias nem se o webhook de produção está ativo. Três assinaturas de teste listadas estavam canceled. O registro local Supabase contém um caso Stripe active USD e um checkout_failed; a natureza live/test do registro local não foi provada.

## Método canônico de verificação, validação e proteção vigente

### Autoridade de identidade e plano

A autenticação é Firebase; o plano é decidido no servidor. O caminho canônico é: **Firebase UID → `billing_identities` → `user_entitlements`**. Um entitlement Premium é válido quando `plan='premium'` e `premium_expires_at` é nulo ou futuro. `developer_premium_email_grants` é a única exceção administrativa vigente; `billing-access` e `premium-content` verificam tanto o e-mail do token quanto, quando necessário, o e-mail normalizado da identidade Firebase no banco. URL de retorno de checkout, localStorage, cookie, perfil editável, texto do botão ou metadata do navegador nunca concedem Premium.

No frontend, `Auth.billingStatus()`, `Auth.hasPlan("premium")` e `Auth.refreshProfile()` refletem o resultado de `billing-access`. Quando uma ação exige Premium, o backend é novamente consultado por `premium-content?path=...&access=check`; uma decisão Free não fica cacheada indefinidamente, porque pagamento, reconciliação ou concessão administrativa podem mudar durante a sessão. Token 401 força renovação antes de nova tentativa; falha de infraestrutura não deve ser tratada como pagamento aprovado.

Versões implantadas neste corte: `premium-content` v146, `billing-access` v146, `developer-admin` v5, `asaas-checkout` v257, `asaas-webhook` v252, `stripe-checkout` v187 e `stripe-webhook` v261.

### Política de rotas e significado de Free/Premium

`developer_premium_route_rules` é a política dinâmica. A IA NÃO deve decidir o plano pela presença no manifest, pelo nome do arquivo, por um PR antigo ou por uma lista histórica. Deve consultar a rota exata e sua decisão administrativa conforme `PROTOCOLO_DECISOES_DO_DESENVOLVEDOR.md`.

- `premium_required=true`: a rota é Premium para as ações protegidas. No estado atual, essas regras usam `enforcement=client_guard`; o HTML pode ser carregado como demonstração, mas o gate impede as ações Premium até o servidor confirmar o entitlement.
- `premium_required=false` + `enforcement=catalog_only`: a consulta da página é Free. Ações especiais podem continuar Premium quando possuem gate dedicado, como os PDFs do catálogo assistencial.
- Rotas de idioma procuram primeiro a regra exata; quando a implementação permitir fallback, a raiz pode servir como referência. Nunca criar um segundo catálogo de plano no JavaScript.
- `premium_content_pages` guarda a fonte usada pela Edge Function. No snapshot atual existem 473 regras e 473 conteúdos não vazios: 432 rotas Premium e 41 Free. `free_global_lockdown=false`.

**Importante:** o método vigente protege **funcionalidades e entregas server-side**, não promete sigilo absoluto do HTML demonstrativo. Se uma futura regra exigir que o texto/conteúdo completo não seja entregue a Free, isso é uma mudança arquitetural: `premium-content` deverá exigir entitlement também no GET do documento, com teste e migração próprios. Não assumir que `client_guard` sozinho torna bytes já enviados secretos.

### Gate de botões, links e formulários

`premium-content-loader.js` instala um gate em captura antes dos handlers da página. Ele protege controles dentro do conteúdo principal e reexecuta a ação apenas depois de acesso confirmado. A identificação é feita por:

- `data-premium-action="block"`: marca explícita e preferida para nova ação Premium;
- links com atributo `download`;
- links cujo `href` termina em `.pdf`;
- botões/links/inputs cujo id, classe, nome, `aria-label`, `title`, `value`, `href`, `onclick` ou texto contenha vocabulário de **calcular/compute, resultado, interpretar, baixar/download, imprimir/print, simulado/quiz/iniciar e gerar PDF**, com variantes dos 18 idiomas;
- qualquer `submit` dentro de `main`, `.main-content` ou `#main-content`.

Controles do menu global, seletor de idioma, footer, barra de acessibilidade, cookies e overlays estruturais são excluídos para não bloquear navegação. `data-premium-action="allow"` é exceção explícita e só deve ser usada quando o desenvolvedor autorizar aquela ação como Free; não usar para “fazer funcionar” um botão que falhou no gate.

Quando o servidor confirma Premium, o clique/submissão original é reproduzido. Se a rota exige Premium e o usuário não tem acesso, ele é encaminhado para a assinatura preservando `returnUrl` e idioma. Não criar handlers paralelos que decidam plano pelo frontend.

### Reidratação dos componentes globais após entrega do documento

O loader conserva as instâncias globais do shell e reidrata menu, rodapé e barra de acessibilidade após `document.write()`. Em seguida chama `window.__INIT_LANGUAGE_SELECTOR()` para montar o seletor de idiomas e o botão do fórum no DOM atual, sem esperar o fallback defensivo de 12 segundos. O seletor reutiliza o markup, distingue a raiz atual do documento, ignora respostas obsoletas e evita registrar eventos duplicados. O observer acompanha `document`, que permanece durante a substituição da raiz. O gerador canônico dos shells versiona as URLs de `premium-content-loader.js` e `lang-selector.js` pelo hash dos arquivos, incluindo shells existentes, para impedir que caches da CDN ou do navegador mantenham versões anteriores.

Formulários da raiz e dos 18 idiomas com `main.main-content > header.hero` recebem o reparo localizado de layout: posição relativa, altura automática e `z-index:0!important`, mantendo o menu global acima do hero. O ajuste não altera regras de plano, conteúdo clínico, catálogo de PDFs nem autorização das ações.

### Permissões canônicas

`permission-service.js` e `plan-service.js` reconhecem, entre outras, as permissões Premium `viewPremium`, `downloadPremium` e `printPremium`. A presença de uma permissão no cliente não substitui a autorização do servidor; serve para coerência de interface. Ações com efeito protegido devem continuar passando pelo gate/Edge Function correspondente.

### Bloqueio de Imprimir, Ctrl+P e Salvar como PDF

A impressão tem duas implementações coordenadas, sem sistema paralelo:

1. **Páginas públicas comuns:** `global-scripts.js` carrega `js/access/premium-print-guard.js`.
2. **Páginas que usam `premium-content-loader.js`:** o próprio loader aplica a mesma decisão de acesso, para evitar dois gates concorrentes.

O estado de impressão é **fail-closed**. Até existir confirmação Premium, o `<html>` recebe `data-premium-print-access="free"`. A auditoria `scripts/ensure-premium-print-guard.mjs` injeta nas páginas imprimíveis uma regra `@media print` que oculta o conteúdo quando esse atributo não é `premium` e mostra somente uma mensagem localizada. Quando o entitlement é confirmado, o atributo passa para `premium` e a folha normal é liberada.

O sistema cobre:

- botão de imprimir detectado por `data-action="print"`, `data-form-action="print"`, `data-premium-print="block"`, `onclick`, nome/label/texto ou função de impressão;
- links internos para outra página `.html` são navegação, mesmo quando a descrição menciona “print”/“imprimir”; o guard não os intercepta somente pelo texto. Controles explicitamente marcados com ação de impressão ou `data-premium-print="block"` continuam protegidos, assim como a impressão executada por `window.print()`. Os índices EN/ES e o carregador do guard usam versões de cache para receber essa identificação atualizada;
- chamadas `window.print()`, que são interceptadas nas páginas públicas protegidas;
- `Ctrl+P` no Windows/Linux e `Cmd+P` no macOS;
- evento `beforeprint`/ `afterprint`, usado quando a pessoa abre **Imprimir** pelo menu nativo do navegador;
- **Salvar como PDF**, porque o navegador usa a mesma renderização `@media print`.

O menu nativo do navegador não pode ser cancelado de forma universal pelo site; por isso a proteção real é a folha fail-closed. Um usuário Free pode abrir o diálogo, mas o conteúdo protegido não deve compor a folha/PDF. Depois da tentativa, o fluxo pode direcionar para a assinatura. `data-premium-print="allow"` é uma exceção técnica e não deve ser usada sem decisão explícita.

**Limite de segurança:** nenhum site pode impedir de forma absoluta screenshot, câmera, inspeção/modificação via DevTools, navegador alterado ou captura de bytes já entregues ao cliente. A documentação deve distinguir “bloqueio do fluxo normal de impressão/PDF” de “DRM absoluto”, que não existe no navegador.

### Catálogo de formulários assistenciais: consulta Free, PDF Premium

`formularios_de_escalas_assistenciais.html`, `en/formularios_de_escalas_assistenciais.html` e `es/formularios_de_escalas_assistenciais.html` estão explicitamente `premium_required=false`, `enforcement=catalog_only`. A grade pode ser consultada por Free/visitante. Desde 03/10/2026, os cards levam à página HTML correspondente por links “Clique para acessar” / “Click to access” / “Haz clic para acceder”, sem download ou impressão no catálogo. A exceção `data-premium-action="allow"` foi autorizada pelo desenvolvedor exclusivamente para esses links de navegação. As ações de download e impressão seguem a autorização vigente na página de destino; a classificação dessas rotas não foi alterada.

Os três catálogos não carregam mais `js/access/assistential-forms-catalog.js`; o fluxo antigo de download não é acionado pelos cards. `scripts/assistential-catalog-navigation.mjs` registra o mapa de navegação e valida 66/63/63 destinos. Na raiz, Cornell/GDS/Katz/WIfI/CRIES seguem as páginas de escala solicitadas, sem formulário dedicado. Esses cinco destinos públicos possuem uma lacuna preexistente no gate de geração PDF e não devem ser descritos como downloads Premium garantidos; corrigir isso exige revisão específica do guard canônico, sem mudar o plano da rota. EN/ES utilizam formulários dedicados, incluindo WIfI e CRIES. O registro privado no Supabase contém 66 formulários na raiz, 63 em EN e 63 em ES. O backend v146 aceita apenas caminhos controlados em `/FORMULARIOS_DE_ESCALAS/`, `/FORMULARIOS_DE_ESCALAS/EN/` e `/FORMULARIOS_DE_ESCALAS/ES/`, recusa traversal/URL arbitrária, valida `%PDF-`, tamanho e `Content-Type`, e entrega com `private, no-store`, `Vary: Authorization` e `nosniff`. O endpoint legado protegido continua aceitando apenas `form-NNN`, nunca uma URL de PDF, mas não é acionado pela navegação atual dos cards.

A correção de 02/10/2026 eliminou o erro em que ES consultava a raiz/EN: há 63 PDFs físicos em ES, 63 em EN, os pares têm nomes de arquivo correspondentes e nenhum PDF ES é byte a byte idêntico ao EN. `scripts/test-localized-assistential-catalog.mjs` impede regressão. Os demais idiomas atualmente não possuem catálogo privado próprio de PDFs; quando a página existe, não inventar tradução de arquivo nem redirecionar para EN sem requisito explícito.

### Como criar ou atualizar uma página a partir de agora

Para **qualquer HTML novo ou modernizado**, uma IA deve seguir esta sequência:

1. Perguntar/consultar a decisão Free ou Premium; se houver regra existente, preservar a decisão mais recente do painel.
2. Garantir o bootstrap padrão do projeto, incluindo `/global-scripts.js`. Não criar um segundo bootstrap Firebase/Auth.
3. Se a rota for Premium, registrar/ativar pelo sistema vigente (`developer-admin` + regra + `premium_content_pages` + shell/loader quando aplicável). Não hardcodar listas locais de Premium.
4. Para botão que deve exigir Premium, preferir `data-premium-action="block"`. Para download, usar o endpoint server-side apropriado; não expor segredo ou URL protegida no HTML público.
5. Para botão de impressão, usar `data-action="print"` ou `data-premium-print="block"` e o mecanismo normal de impressão da página. **Não implementar uma checagem de plano própria** e não liberar `window.print()` fora do guard.
6. Para “Gerar PDF”/“Baixar PDF” Premium, marcar a ação explicitamente e, quando houver arquivo original, entregar por endpoint autorizado. Um `a href="arquivo.pdf"` público não é proteção.
7. Nunca usar `data-premium-action="allow"` ou `data-premium-print="allow"` como correção de bug sem decisão explícita de produto.
8. Rodar auditorias de impressão e Premium; só depois atualizar inventário/documentação e declarar concluído.

### Verificação e testes obrigatórios

O método de validação é em camadas:

- **Código:** `node --check` dos arquivos alterados e testes unitários relacionados.
- **Rotas:** `scripts/auditar-premium-triplo.mjs` e política dinâmica do Supabase.
- **Conta/entitlement:** `scripts/test-account-pages.js`, `scripts/test-billing-final.js`, `scripts/test-premium-auth-delivery-flow.js`, `scripts/test-premium-content-access.js`, `scripts/test-developer-admin.js` e `scripts/test-developer-premium-activation.mjs`, conforme impacto.
- **Impressão:** `node scripts/ensure-premium-print-guard.mjs --apply` seguido de `--audit`. Toda página imprimível da raiz/18 idiomas deve carregar o mecanismo global e o bloqueio fail-closed.
- **Catálogo assistencial:** `scripts/test-assistential-forms-catalog.mjs` e `scripts/test-localized-assistential-catalog.mjs`.
- **Anúncios/plano:** `scripts/test-premium-ads-real-state.mjs` quando a mudança tocar publicidade/card.
- **Banco:** conferir regra exata, conteúdo privado correspondente, entitlements órfãos, expiração, grants administrativos e, em incidente de acesso, correlacionar 401/403 de `premium-content` com UIDs que realmente possuam entitlement ativo.
- **Deploy:** Premium Access Audit e deploy do GitHub Pages precisam concluir sem falha antes de marcar a alteração como publicada.

No corte atual: 17 identidades Firebase, 9 entitlements Premium ativos, 4 concessões administrativas ativas, 0 entitlement órfão observado na auditoria de 02/10/2026. O último cruzamento de logs das últimas 24h não encontrou 401/403 de `premium-content` associados aos 9 UIDs com entitlement Premium ativo. Esses números são fotografia e não substituem consulta futura.

## Benefícios, publicidade e promoção Premium

`global-scripts.js` aguarda o estado comercial antes de decidir AdSense. Premium confirmado não deve carregar anúncios e os artefatos existentes são removidos; em estado de billing indisponível, a publicidade não deve ser liberada por suposição. Free/visitante segue consentimento e política de anúncios.

`js/access/premium-banner-manager.js` é o card promocional único. Ele possui PT-BR + 18 idiomas, usa a arte da enfermeira azul aprovada, aparece apenas para visitante/Free, não para Premium, fica no quadrante superior direito, permanece **20 segundos** e repete a cada **2 minutos**. Ao entrar em uma rota Premium, o agendamento usa a condição de rota para reapresentar a oferta conforme a regra vigente. Não criar cards paralelos por idioma; a localização é centralizada no manager.

## Extensões Chrome

A extensão de gasometria tem side panel e impede cálculo sem premiumAccess. O service-worker chama chrome.identity.getRedirectURL(gasometria-auth), gera verifier aleatório, challenge SHA-256, abre conta/extensao-login.html no site, recebe code em fragmento e chama extension-access com code/code_verifier/extension_id. extension-auth exige Origin permitido, Firebase token, redirect https://{id}.chromiumapp.org/gasometria-auth, PKCE S256 e emite código com validade 120 s; a tabela armazena hash, não o código bruto. extension-access faz DELETE atômico do código ainda válido com challenge e extension_id, então consulta concessão manual ou user_entitlements. Erro/timeout/Free bloqueia a calculadora; não há entitlement no storage como autoridade. CORS de extension-access é *, mas autorização depende do código one-shot e challenge. A extensão Braden e as três variantes de Gotejamento usam painéis locais sem esse bridge; não inferir assinatura a partir do nome da extensão.

## Segurança, controles e limites conhecidos

- Edge Functions com `verify_jwt=false` podem continuar seguras quando verificam Firebase JWT/segredo dentro do handler; não interpretar esse flag isoladamente como “função pública”.
- `developer-admin` e `billing-admin` autorizam no servidor. Mostrar um botão de desenvolvedor no frontend não concede privilégio.
- `billing-access` e `premium-content` usam a mesma identidade Firebase, entitlement e grants administrativos. Alterações nessa lógica devem manter paridade entre as duas funções.
- `premium_content_pages` contém HTML de aplicação; no método atual o GET pode servir demonstração pública. Segredo real deve ficar fora do HTML entregue e ações sensíveis devem depender do servidor.
- Arquivos PDF estáticos publicados continuam potencialmente acessíveis por URL direta. Se o requisito for proteção absoluta do arquivo, ele precisa sair da publicação estática e ser entregue apenas por endpoint autenticado.
- O guard de impressão protege o fluxo normal de impressão/PDF; não impede captura de tela, câmera, DevTools ou cliente modificado.
- RLS não substitui autorização dentro de Edge Functions que usam service role.
- Exceções administrativas devem ser registradas, revisadas e revogadas; nunca transformar grant manual em pagamento fictício.
- Uma rota Free/Premium pode mudar pelo painel sem commit. Toda IA deve consultar o estado vigente antes de “corrigir” uma divergência.

## Evidências do corte atual — 02/10/2026

- Banco: 473 regras explícitas; 432 Premium; 41 Free; 473 documentos em `premium_content_pages`, nenhum vazio; 9 activation requests concluídos e nenhum pending observado.
- Enforcement vigente: 432 `client_guard` e 41 `catalog_only`.
- Billing: 17 identidades Firebase; 9 entitlements Premium ativos; 4 grants administrativos ativos; 0 entitlement órfão no cruzamento executado.
- Settings: `free_global_lockdown=false`, portal Asaas ativo e portal Stripe ativo.
- Catálogo assistencial: raiz 66; EN 63; ES 63; raiz/EN/ES em `catalog_only`; PDFs ES e EN distintos.
- Edge Functions: `premium-content` v146 e `billing-access` v146 implantadas com suporte a catálogo ES e validação de grant pela identidade.
- CI: Premium Access Audit da correção localizada concluiu success; deploy GitHub Pages 37039229385 concluiu success.
- Não usar estes totais como constante. Eles existem para auditoria do corte e devem ser reconsultados numa alteração futura.

## Verificação operacional antes de uma alteração futura

1. Ler este catálogo, `INVENTARIO_ROTAS_VIGENTES.md` e `PROTOCOLO_DECISOES_DO_DESENVOLVEDOR.md`.
2. Consultar política exata da rota, conteúdo em `premium_content_pages`, decisão administrativa e, se houver incidente de assinante, entitlement/expiração/grant e logs da Edge Function.
3. Identificar se o requisito é: consulta Free, ação Premium, download Premium, impressão Premium ou conteúdo integral não entregável a Free. Não misturar esses modelos.
4. Reutilizar `premium-content-loader.js`, `premium-print-guard.js` e endpoints existentes. Não criar autenticação paralela.
5. Rodar apenas os testes relevantes mais os bloqueadores obrigatórios do deploy. Em mudança de impressão, executar `ensure-premium-print-guard.mjs --apply --audit`; em formulários localizados, executar os dois testes de catálogo.
6. Reconsultar banco depois do deploy, porque o workflow pode migrar/shellificar conteúdo e o painel pode alterar regras.
7. Atualizar este documento somente quando o **método** mudar. Atualizar o inventário quando o **estado dinâmico** mudar. Não copiar o mesmo procedimento para AGENTS/Copilot/DeepSeek; esses arquivos devem apontar para esta fonte.
8. Não declarar “assinante corrigido” apenas porque uma página abriu: provar entitlement, resposta do `access=check`/download e ausência de 401/403 indevido para usuários Premium ativos.

## Documentação substituída

Este arquivo substitui instruções antigas ou parciais sobre login, Premium, anúncios por plano, gate de ações, download, impressão e PDF. Não ressuscitar regras antigas a partir de relatórios, PRs, manifestos ou snapshots anteriores.

Os arquivos `AGENTS.md`, `.github/copilot-instructions.md`, `.github/instructions/ecossistema-login-assinaturas.instructions.md`, `.github/instructions/planos-de-acesso.instructions.md` e `AI_ORCHESTRATION/ADAPTER_DEEPSEEK.md` são apenas **ponteiros** para esta fonte e não devem manter uma segunda descrição do método.

### Decisões administrativas

A origem e precedência das mudanças feitas em `conta/desenvolvedor.html` estão documentadas em `PROTOCOLO_DECISOES_DO_DESENVOLVEDOR.md`. O histórico `developer_admin_audit_log` e a política vigente devem ser consultados antes de qualquer alteração de Free/Premium. Uma execução de deploy, uma auditoria ou uma IA não substitui a decisão do desenvolvedor.

### Regra final para agentes

Quando uma nova página ou funcionalidade for criada, a IA deve primeiro classificar **o que está sendo protegido**: acesso à página, ação de cálculo/resultado, download, impressão/PDF ou entrega de arquivo. Em seguida deve reutilizar o sistema existente descrito neste catálogo. É proibido criar uma segunda fonte de verdade, um segundo Auth, uma lista Premium local ou um bypass de impressão para resolver um problema pontual.

