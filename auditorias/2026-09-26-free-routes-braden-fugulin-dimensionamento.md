# Auditoria — Braden, Fugulin e Dimensionamento como conteúdo FREE

Data: 2026-09-26
Branch: fix/free-braden-fugulin-dimensionamento

## Alterações
- Removidas do manifesto Premium as rotas `braden.html`, `fugulin.html` e `dimensionamento.html`.
- Restauradas as versões completas dos três HTMLs a partir do conteúdo privado versionado no Supabase / histórico do repositório.
- Removido das três páginas o `premium-content-loader.js` e o placeholder de conteúdo protegido.
- Mantida a arquitetura Premium das demais rotas.
- Atualizado o teste de acesso para não classificar as três páginas como Premium.
- Adicionada auditoria explícita para garantir ausência de marcador/loader Premium nessas três páginas.

## Supabase
A tabela `public.premium_content_pages` contém atualmente as cópias privadas históricas das três rotas. Elas não são necessárias para a entrega pública após esta alteração porque a versão pública passa a ser servida diretamente pelo GitHub Pages.

Nenhum entitlement, assinatura ou registro financeiro foi alterado.
Foi adicionada somente uma documentação de intenção no comentário da tabela para registrar que essas três rotas são públicas no catálogo da aplicação.

## Verificações executadas
- Manifesto: as três rotas não aparecem no catálogo Premium.
- HTML público: os três arquivos existem e não contêm `premium-content-loader.js`, placeholder Premium ou marcador explícito de rota Premium.
- `js/access/content-policy.js`: não há catálogo legado explícito das três rotas.
- Edge Function `premium-content`: continua exigindo entitlement Premium para o restante do conteúdo privado.
- Supabase: os registros históricos das três rotas permanecem na tabela privada; nenhum dado financeiro foi modificado.

## Resultado da auditoria estática
- Branch sem alterações pendentes no escopo funcional além das rotas e documentação relacionadas.
- Os três HTMLs restaurados contêm formulário/conteúdo e não contêm o loader/placeholder Premium.
- `perroca.html`, `simulado-de-enfermagem.html` e `formularios-em-branco-de-escalas.html` continuam como shells Premium com loader e placeholder.
- A Edge Function de produção `premium-content` permanece ativa (versão 140), validando token + entitlement e exigindo `plan="premium"`.
- `premium_content_pages` continua sem privilégios para `anon`/`authenticated`; somente `service_role` possui acesso direto, portanto a tabela privada não libera conteúdo a usuários FREE.
- A migração/documentação no Supabase foi registrada remotamente como `20260927024622_document_free_routes_braden_fugulin_dimensionamento`.

## Limitação desta etapa
A auditoria estática foi executada sobre o código e o banco. O acesso visual em um navegador anônimo/conta FREE e a execução interativa dos cálculos dependem da publicação/deploy da branch e não podem ser simulados integralmente pelo conector GitHub/Supabase neste ambiente.
