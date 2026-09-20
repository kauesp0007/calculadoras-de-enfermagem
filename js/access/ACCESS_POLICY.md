# Política canônica de acesso — FREE / PREMIUM

Data: 2026-09-19.

## Estados

`free`
- Usuário visitante ou autenticado sem assinatura Premium válida.
- Pode acessar somente conteúdo marcado como `free`.
- Anúncios permanecem habilitados.

`premium`
- Usuário autenticado com assinatura Premium válida.
- Pode acessar conteúdo `free` e `premium`.
- Anúncios permanecem habilitados.

## Conteúdo

Cada recurso pago deve declarar explicitamente `premium`.

Não existe hierarquia entre planos pagos.

## Pagamentos

`pt` / `pt-BR` → Asaas.

`en`, `es`, `fr`, `de`, `it`, `hi`, `zh`, `ja`, `ru`, `ko`, `tr`, `nl`, `pl`, `sv`, `id`, `vi`, `uk`, `ar` → Stripe.

O roteamento depende do idioma/localização de cobrança e nunca do plano legado.

## Anúncios

Não existe condição comercial de "sem anúncios".

O sistema de anúncios não deve consultar o status Premium para decidir se carrega ou remove anúncios.

## Segurança

Somente backend/webhook verificado pode ativar ou revogar Premium.
O navegador não é autoridade financeira.
