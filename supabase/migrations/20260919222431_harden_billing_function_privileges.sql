revoke all on function public.current_user_plan() from public, anon, authenticated;
revoke all on function public.ensure_user_entitlement() from public, anon, authenticated;
grant execute on function public.current_user_plan() to service_role;
grant execute on function public.ensure_user_entitlement() to service_role;
