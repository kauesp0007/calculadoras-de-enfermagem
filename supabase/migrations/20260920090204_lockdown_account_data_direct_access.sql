create policy account_profiles_deny_all on public.account_profiles for all to anon,authenticated using(false) with check(false);
create policy account_favorites_deny_all on public.account_favorites for all to anon,authenticated using(false) with check(false);
create policy account_history_deny_all on public.account_history for all to anon,authenticated using(false) with check(false);