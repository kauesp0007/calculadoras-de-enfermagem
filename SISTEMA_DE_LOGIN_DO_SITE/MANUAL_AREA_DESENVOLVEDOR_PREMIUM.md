# Manual da Area do Desenvolvedor Premium

## Objetivo

A Area do Desenvolvedor e um painel administrativo interno para `ciadeenfermagem@gmail.com`. Ela cria atalhos dinamicos para recursos ja existentes no sistema Premium, sem substituir o modelo atual de assinatura.

## Acesso

- URL: `/conta/desenvolvedor.html`
- Link visivel: aparece em `/conta/perfil.html` somente quando o usuario logado tem o e-mail `ciadeenfermagem@gmail.com`.
- Protecao real: a Edge Function `developer-admin` valida o token Firebase e o e-mail admin antes de listar ou alterar dados.

## Controles globais

- `Bloqueio Global Free`: bloqueia usuarios Free fora da area de conta usando o guard global em `global-scripts.js`.
- `Portal Asaas`: quando desativado, `asaas-checkout` bloqueia a criacao de novas assinaturas nacionais.
- `Portal Stripe`: quando desativado, `stripe-checkout` bloqueia a criacao de novas assinaturas internacionais.

Usuarios Premium ativos continuam acessando normalmente quando apenas os portais de pagamento estao pausados.

## Paginas Premium

Cada pagina tem um deslize:

- Verde: Free bloqueado; pagina exclusiva Premium.
- Vermelho: Free liberado.

O painel lista os HTMLs de paginas da raiz e dos 18 idiomas, inclusive os que nao possuem regra no banco (Free por padrao). O catalogo `conta/developer-route-catalog.json` e gerado de novo em cada deploy por `scripts/generate-developer-route-catalog.mjs`. Filtros por idioma e pesquisa consultam o catalogo completo; a lista aparece em lotes de 100 paginas. Uma pagina de idioma sem regra propria pode herdar a regra da rota portuguesa de mesmo caminho; o painel a identifica como `herdado de PT`.

Braden, Fugulin e Dimensionamento permanecem Free conforme `mapa_planos_conteudo.md`, inclusive Braden e Fugulin nas traducoes existentes. Alteracoes manuais posteriores no painel prevalecem ate outra migracao explicita.

Existem dois niveis de aplicacao:

- `protected_content`: protecao forte. A pagina publica e um shell e o HTML real fica em `premium_content_pages`, entregue por `premium-content`.
- `client_guard`: protecao de navegacao. Usada para HTMLs que ainda sao publicos no GitHub Pages. Bloqueia o usuario no navegador, mas nao substitui a migracao para shell privado quando for necessario esconder o HTML de forma forte.

Para transformar uma pagina publica em protecao forte, use o fluxo vigente de migracao para `premium_content_pages` e shell publico.

## Excecoes Premium por e-mail

A caixa "Liberar Area Premium" grava o e-mail em `developer_premium_email_grants`.

Quando ativo:

- `billing-access` reconhece o e-mail como Premium com `provider = admin_exception`.
- `premium-content` tambem reconhece a excecao antes de bloquear conteudo.

Ao excluir o e-mail no painel, a excecao fica inativa e o usuario volta ao estado real de assinatura.

## Listagens de assinantes

O painel separa:

- Clientes Premium ativos: `user_entitlements` com plano Premium vigente.
- Aguardando aprovacao: `billing_subscriptions.status = checkout_pending`.
- Tentativas falharam: `checkout_failed` ou `failed`.
- Expirados: Premium com `premium_expires_at` vencido.

## Tabelas administrativas

- `developer_settings`
- `developer_premium_route_rules`
- `developer_premium_email_grants`
- `developer_admin_audit_log`

Todas ficam com RLS ligado e acesso revogado para `anon` e `authenticated`; somente Edge Functions com service role operam nelas.

## Auditoria

Toda alteracao feita pelo painel registra:

- e-mail do admin
- acao
- alvo
- estado anterior
- estado novo
- data/hora

## Testes

Teste local principal:

```bash
node scripts/test-developer-admin.js
```

Testes complementares recomendados:

```bash
node scripts/test-premium-content-access.js
node scripts/test-premium-ads.js
node scripts/test-billing-final.js
```

## Ordem segura de deploy

1. Aplicar a migracao Supabase.
2. Publicar `developer-admin`.
3. Publicar as funcoes atualizadas: `billing-access`, `premium-content`, `asaas-checkout`, `stripe-checkout`.
4. Publicar o site com `conta/desenvolvedor.html`, `global-scripts.js`, `premium-content-loader.js` e `conta/perfil.html`.
5. Entrar com `ciadeenfermagem@gmail.com` e validar a leitura do painel antes de alterar interruptores.
