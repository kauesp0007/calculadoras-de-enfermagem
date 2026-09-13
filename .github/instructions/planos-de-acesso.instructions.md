---
description: "Use when creating or editing HTML pages. Classify access using the single canonical content policy; never create a global paywall."
applyTo: "**/*.html"
---
# Planos de Acesso — Regra Canônica

## Regra principal

Toda página nova deve ter seu acesso definido pela política de conteúdo. O padrão é `public`.

Quando uma página ou recurso for premium, registre o identificador em `js/access/content-policy.js` no objeto `RESTRICTED_CONTENT` com o requisito `junior`.

Não implementar redirecionamento global de usuários gratuitos para a página de assinatura.

## Planos atuais

| ID | Nome | Anúncios | Acesso |
|---|---|---|---|
| `free` | Gratuito | Sim | Conteúdo público/gratuito e recursos permitidos |
| `junior` | Júnior | Não | Conteúdo gratuito + conteúdo marcado como premium |

Não existem mais `pleno` ou `senior`.

## Conteúdo premium

A lista efetiva está em `js/access/content-policy.js`. O identificador da política corresponde ao nome do conteúdo sem extensão quando a página é derivada do caminho.

Exemplo:

```js
"braden": "junior"
```

## Regras de implementação

- `Auth` cuida de autenticação e carregamento do perfil.
- `Authorization` decide o plano efetivo, considerando `planExpiresAt` e `lifetime`.
- `Access` decide se o conteúdo atual exige autenticação ou `junior`.
- O gateway de pagamento e o webhook são as únicas autoridades capazes de conceder o plano pago.
- Nunca permitir que o frontend escreva `plan = junior` diretamente.
- Nunca usar preço diferente da fonte comercial oficial: **R$ 10,00/mês** no Brasil.

## Assinatura

A página `/conta/assinatura.html` deve:

1. exigir somente login para contratar;
2. usar checkout individualizado;
3. enviar o Firebase ID token ao backend;
4. nunca confiar em callback do navegador como confirmação financeira;
5. manter a configuração de idioma do site sem duplicar a lógica de pagamento.

## Referência

Use `SISTEMA_DE_LOGIN_DO_SITE/CATALOGO_SISTEMA_CONTAS_PAGAMENTOS.md` como documentação operacional da arquitetura atual.
