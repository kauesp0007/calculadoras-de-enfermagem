revoke all on function public.claim_billing_webhook(text, text) from public;
revoke all on function public.claim_billing_webhook(text, text) from anon;
revoke all on function public.claim_billing_webhook(text, text) from authenticated;
grant execute on function public.claim_billing_webhook(text, text) to service_role;
