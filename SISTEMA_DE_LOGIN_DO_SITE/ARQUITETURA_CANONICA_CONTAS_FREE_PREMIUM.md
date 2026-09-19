# Arquitetura canônica de contas, acesso e pagamentos

Atualizado em 2026-09-19.

## Modelo comercial

Existem exatamente dois estados de acesso comercial:

- `free`: conteúdo gratuito; anúncios permanecem ativos.
- `premium`: conteúdo premium liberado; anúncios permanecem ativos.

A assinatura Premium não remove anúncios.

## Provedores

- Brasil / pt-BR: Asaas.
- Internacional / 18 idiomas suportados: Stripe.

O provedor processa o pagamento. O Supabase mantém a identidade do usuário, o estado da assinatura e as regras de autorização.

## Autoridade

A confirmação financeira ocorre somente por backend/webhook verificado.

O frontend nunca concede Premium por callback, parâmetro de URL, localStorage, cookie ou metadata editável pelo usuário.

## Regra de acesso

O acesso premium efetivo exige uma assinatura Premium válida segundo os dados persistidos pelo backend.

A classificação de cada página/conteúdo será mantida em um mapa canônico de acesso:

`free` ou `premium`.

Não criar novos níveis comerciais sem revisão explícita desta arquitetura.

## Legado a eliminar da lógica ativa

Não usar na nova arquitetura:

- `junior`
- `júnior`
- `senior`
- `pleno`
- preços comerciais antigos
- benefícios antigos
- lógica de remoção de anúncios por assinatura
- Firebase/Firestore como fonte de verdade de plano
- coleções legadas de assinantes/pedidos para autorização
- funções de teste de billing em produção
- decisões de autorização baseadas em metadata editável pelo usuário

## Preservação

Contas, identidade, histórico financeiro e dados operacionais somente serão removidos após comprovação de que não possuem dependência ou valor de auditoria.

## Escopo

Esta especificação governa somente contas, autenticação, autorização, assinatura e pagamentos. Calculadoras, escalas, conteúdo clínico, SEO, CSS, traduções e demais sistemas permanecem fora do escopo.

## Segurança

RLS deve permanecer habilitado nas tabelas expostas. Dados de autorização não devem depender de `raw_user_meta_data`.

Segredos Asaas/Stripe e chaves de serviço permanecem exclusivamente no ambiente seguro do Supabase.
