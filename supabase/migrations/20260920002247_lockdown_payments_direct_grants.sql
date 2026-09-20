-- Keep historical billing data private.
-- All billing/payment access is performed by trusted Edge Functions.
REVOKE ALL ON TABLE public.payments FROM anon, authenticated;
