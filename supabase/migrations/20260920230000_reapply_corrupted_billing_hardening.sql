-- Reaplica em produção o conteúdo pretendido das migrations
-- 20260920002247 e 20260920002459, que foram gravadas no repositório com
-- quebras de linha escapadas literalmente ("\n") em vez de novas linhas
-- reais. Isso fazia o corpo inteiro do arquivo virar um único comentário
-- SQL, então o Postgres nunca executava o REVOKE nem o CREATE INDEX,
-- mesmo com as duas migrations já marcadas como aplicadas no histórico.
-- Ambas as instruções abaixo são idempotentes e seguras para reexecução.

REVOKE ALL ON TABLE public.payments FROM anon, authenticated;

CREATE UNIQUE INDEX IF NOT EXISTS billing_subscriptions_one_open_per_user
  ON public.billing_subscriptions (user_id)
  WHERE status IN ('checkout_pending','active','past_due');
