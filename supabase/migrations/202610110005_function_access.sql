-- Supabase may grant EXECUTE directly through default privileges: revoke PUBLIC and anon.
begin;
do $$ declare fn record;
begin
  for fn in select p.oid::regprocedure sig,p.prorettype='trigger'::regtype as is_trigger
    from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='erp_private' or (n.nspname='public' and p.proname ~ '^erp_') loop
    execute format('revoke all on function %s from public,anon',fn.sig);
    if fn.is_trigger then execute format('revoke all on function %s from authenticated',fn.sig);
    else execute format('grant execute on function %s to authenticated',fn.sig); end if;
  end loop;
  for fn in select p.oid::regprocedure sig from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and p.proname in ('handle_new_user','rls_auto_enable') loop
    execute format('revoke all on function %s from public,anon,authenticated',fn.sig);
  end loop;
end $$;

-- Policy helpers cannot enumerate other accounts; Head Office retains its scope.
create or replace function public.has_role(_user_id uuid,_role public.app_role)
returns boolean language sql stable security definer set search_path='' as $$
  select (_user_id=auth.uid() or erp_private.is_admin()) and exists(
    select 1 from public.user_roles where user_id=_user_id and role=_role);
$$;
create or replace function public.get_user_franchise_id(_user_id uuid)
returns uuid language sql stable security definer set search_path='' as $$
  select franchise_id from public.profiles where id=_user_id and (_user_id=auth.uid() or erp_private.is_admin());
$$;
revoke all on function public.has_role(uuid,public.app_role),public.get_user_franchise_id(uuid) from public,anon;
grant execute on function public.has_role(uuid,public.app_role),public.get_user_franchise_id(uuid) to authenticated;
commit;
