-- These scales were made Free before the developer route catalog was seeded.
with target as materialized (
  select path, premium_required, enforcement, source, updated_at
  from public.developer_premium_route_rules
  where premium_required and (
    path in ('braden.html', 'fugulin.html', 'dimensionamento.html')
    or path ~ '^(en|es|fr|it|de|hi|zh|ja|ru|ko|tr|nl|pl|sv|id|vi|uk|ar)/(braden|fugulin)\.html$'
  )
), updated as (
  update public.developer_premium_route_rules r
  set premium_required = false,
      updated_by = 'system:free-plan-reconciliation',
      updated_at = now()
  from target t
  where r.path = t.path
  returning r.path, r.premium_required, r.enforcement, r.source, r.updated_at
)
insert into public.developer_admin_audit_log
  (actor_email, action, target_type, target_key, before_state, after_state)
select 'system:free-plan-reconciliation', 'reconcile_free_route', 'route', u.path,
       to_jsonb(t), to_jsonb(u)
from updated u join target t using (path);
