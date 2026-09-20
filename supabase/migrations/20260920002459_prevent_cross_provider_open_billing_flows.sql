-- A user may have only one open billing flow at a time, regardless of provider.
-- This closes the race where a language/provider change could create concurrent Asaas and Stripe flows.
CREATE UNIQUE INDEX IF NOT EXISTS billing_subscriptions_one_open_per_user
  ON public.billing_subscriptions (user_id)
  WHERE status IN ('checkout_pending','active','past_due');
