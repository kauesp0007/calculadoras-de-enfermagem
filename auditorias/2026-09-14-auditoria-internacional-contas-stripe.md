# Auditoria internacional — contas, assinatura, Stripe e tradução

**Data:** 2026-09-14  
**Branch:** `audit/billing-ads-hardening-20260914`  
**PR:** #17  
**Objetivo:** fechar os riscos de internacionalização da área de conta e garantir isolamento absoluto entre Asaas (Brasil) e Stripe (internacional), sem perda de histórico financeiro.

## 1. Pré-condições cumpridas

- Regras canônicas `AI_RULES.md`, `HTML_RULES.md`, `HTML_PAGE_TEMPLATE_RULES.md` e `AGENTS.md` lidas antes das alterações.
- Manifesto de backup registrado em `backups-temporarios/2026-09-14-auditoria-internacional-pre-edit.md` antes da implementação.
- Nenhum registro financeiro foi apagado.

## 2. Matriz de arquitetura de rotas

A arquitetura atual possui uma única área física `/conta/` e seleciona idioma por `?lang=`. Não foram encontradas rotas físicas `/en/conta/`, `/es/conta/`, `/fr/conta/`, `/de/conta/`, `/it/conta/`, `/hi/conta/`, `/zh/conta/`, `/ja/conta/`, `/ru/conta/`, `/ko/conta/`, `/tr/conta/`, `/nl/conta/`, `/pl/conta/`, `/sv/conta/`, `/id/conta/`, `/vi/conta/`, `/uk/conta/` e `/ar/conta/` na busca de código da branch auditada.

A escolha é: manter a área de conta centralizada para evitar 18 cópias de cada tela, mas tornar o idioma uma propriedade determinística da URL e do seletor, preservando navegação e localização.

## 3. Problemas encontrados

### P0 — isolamento de PSP
O roteamento estava espalhado na página de assinatura e não havia uma camada única de decisão. O frontend deveria garantir explicitamente `pt -> Asaas` e `18 idiomas -> Stripe`.

### P0 — Stripe aceitava qualquer idioma não reconhecido como USD
`stripe-checkout` usava USD para qualquer `lang` que não estivesse em `EUR_LANGS`, inclusive `pt`. Isso precisava ser fail-closed.

### P0 — callback Stripe não preservava idioma
`success_url` e `cancel_url` apontavam sempre para `/conta/assinatura.html` sem `lang`.

### P1 — localização incompleta da assinatura
`conta/assinatura.html` possuía texto completo apenas para `pt` e `en`; os demais 17 idiomas caíam em inglês.

### P1 — localização do menu autenticado
`global-scripts.js` montava `Meu Perfil`, `Favoritos`, `Histórico`, `Configurações`, `Sair`, `Entrar` e `Plano` em português, inclusive em páginas internacionais.

### P1 — localização das telas de perfil/configurações/favoritos/histórico
As telas centrais tinham texto HTML e/ou rótulos JS em português, apesar de `conta-i18n.js` possuir dicionários para os 19 idiomas.

### P1 — `conta-i18n.js` traduzia apenas o catálogo conhecido
A tradução automática por comparação de texto não cobre strings dinâmicas fora do catálogo; rótulos fixos nas páginas e menus precisavam ser explicitamente ligados ao catálogo.

### P1 — links internos de conta
O caminho central `/conta/*?lang=` precisa ser preservado de forma consistente em login, perfil, favoritos, histórico, configurações, assinatura e retornos pós-login.

### P1 — guardas de acesso
`route-guard.js` e `access-router.js` usavam destinos fixos em `/conta/*`, sem preservar idioma quando o usuário chegava de uma pasta internacional.

### P1 — Asaas backend sem parâmetro de contexto internacional
`asaas-checkout` não exigia `lang` e, apesar de ser chamado pelo fluxo brasileiro atual, uma camada explícita de servidor deve impedir uso indevido para outros idiomas.

### P2 — segurança de criação de perfil
A criação concorrente já possui tratamento `ALREADY_EXISTS`; a regra de Firestore da conta está corretamente orientada a preservar `uid`, `email` e `provider` após criação.

### P2 — histórico financeiro legado
A tabela `public.payments` mantém 13 registros, com 2 usuários distintos; 1 aprovado e 12 pendentes. Não há base para exclusão destrutiva. O histórico deve permanecer intacto.

### P2 — Stripe live ledger
`public.stripe_events` está atualmente vazio. Isso não prova ausência de pagamentos Stripe externos; apenas mostra que nenhum evento foi registrado nessa tabela nesta base até a consulta da auditoria.

## 4. Regra canônica definida

- `pt` / `pt-BR`: Asaas.
- `en`, `es`, `fr`, `de`, `it`, `hi`, `zh`, `ja`, `ru`, `ko`, `tr`, `nl`, `pl`, `sv`, `id`, `vi`, `uk`, `ar`: Stripe.
- Pix: somente Brasil / Asaas.
- Checkout internacional: somente Stripe.
- Nenhum segredo de gateway deve aparecer em código cliente.

## 5. Evidências estruturais

- `lang-selector.js` atualmente trata `/conta/` como rota central com `?lang=`.
- `conta/assinatura.html` usa Asaas para `pt` e Stripe para os demais, mas seu catálogo de textos não cobre todos os idiomas.
- `stripe-checkout/index.ts` recebe `uid` e `lang`, valida o token Firebase, escolhe preço EUR/USD e cria a sessão Stripe.
- `stripe-webhook/index.ts` valida assinatura Stripe e usa claim transacional em Postgres antes dos efeitos financeiros.
- `firestore.rules` bloqueia escrita de `premiumOrders`, `stripeEvents`, `asaasEvents`, `asaasPayments`, assinaturas e campos financeiros por cliente.

## 6. Critério de conclusão desta fase

A fase somente pode ser considerada concluída quando:

1. o PSP for determinado por uma única regra canônica;
2. o backend rejeitar combinações inválidas de idioma/PSP;
3. os retornos de Stripe preservarem o idioma;
4. o menu autenticado e as telas de conta usarem o catálogo internacional;
5. os fluxos de acesso preservarem o idioma;
6. nenhum histórico financeiro for removido;
7. auditoria pós-implementação e contra-prova independente forem registradas.
