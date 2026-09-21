create table if not exists public.billing_checkout_claims (
  provider text not null,
  user_id text not null,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  completed_at timestamptz null,
  last_error text null,
  constraint billing_checkout_claims_pkey primary key (provider, user_id),
  constraint billing_checkout_claims_provider_check check (provider in ('stripe','asaas')),
  constraint billing_checkout_claims_status_check check (status in ('active','completed','failed'))
);

alter table public.billing_checkout_claims enable row level security;

create or replace function public.claim_billing_checkout(p_provider text,p_user_id text,p_lease_seconds integer default 1800) returns boolean language plpgsql security definer set search_path=public as $$
declare v_now timestamptz:=clock_timestamp(); v_expires timestamptz:=v_now+make_interval(secs=>greatest(60,least(coalesce(p_lease_seconds,1800),7200))); v_existing public.billing_checkout_claims%rowtype;
begin
 if p_provider not in ('stripe','asaas') or nullif(trim(p_user_id),'') is null then raise exception 'invalid_checkout_claim'; end if;
 select * into v_existing from public.billing_checkout_claims where provider=p_provider and user_id=trim(p_user_id) for update;
 if found and v_existing.status='active' and v_existing.expires_at>v_now then return false; end if;
 if found then update public.billing_checkout_claims set status='active',created_at=v_now,expires_at=v_expires,completed_at=null,last_error=null where provider=p_provider and user_id=trim(p_user_id); else insert into public.billing_checkout_claims(provider,user_id,status,created_at,expires_at) values(p_provider,trim(p_user_id),'active',v_now,v_expires); end if;
 return true;
end;
$$;

create or replace function public.release_billing_checkout(p_provider text,p_user_id text,p_error text default null) returns boolean language plpgsql security definer set search_path=public as $$
begin update public.billing_checkout_claims set status='failed',completed_at=clock_timestamp(),expires_at=clock_timestamp(),last_error=left(coalesce(p_error,''),2000) where provider=p_provider and user_id=trim(p_user_id) and status='active'; return found; end;
$$;

create or replace function public.complete_billing_checkout(p_provider text,p_user_id text) returns boolean language plpgsql security definer set search_path=public as $$
begin update public.billing_checkout_claims set status='completed',completed_at=clock_timestamp() where provider=p_provider and user_id=trim(p_user_id) and status='active'; return found; end;
$$;

revoke all on function public.claim_billing_checkout(text,text,integer) from public,anon,authenticated;
revoke all on function public.release_billing_checkout(text,text,text) from public,anon,authenticated;
revoke all on function public.complete_billing_checkout(text,text) from public,anon,authenticated;
grant execute on function public.claim_billing_checkout(text,text,integer) to service_role;
grant execute on function public.release_billing_checkout(text,text,text) to service_role;
grant execute on function public.complete_billing_checkout(text,text) to service_role;
