-- Run only on the designated staging project after all migrations.
-- Exercises real PostgreSQL permissions with simulated authenticated identities.
-- All fixtures, including temporary auth rows without credentials, are rolled back.
-- This is not a test of Auth login, email delivery or the Storage HTTP service.
begin;
do $test$
declare
  a uuid=gen_random_uuid(); o uuid=gen_random_uuid(); b uuid=gen_random_uuid();
  t uuid=gen_random_uuid(); p uuid=gen_random_uuid();
  fa uuid=gen_random_uuid(); fb uuid=gen_random_uuid();
  sa uuid=gen_random_uuid(); sb uuid=gen_random_uuid(); batch uuid=gen_random_uuid();
  plan uuid; inv uuid; claim uuid; receipt uuid; item uuid; session uuid;
  blocked boolean; i integer; affected integer; exact_total bigint;
begin
  insert into auth.users(id,raw_user_meta_data) values
    (a,'{"full_name":"Staging test admin"}'),(o,'{"full_name":"Staging test owner"}'),
    (b,'{"full_name":"Staging test other owner"}'),(t,'{"full_name":"Staging test teacher"}'),
    (p,'{"full_name":"Staging test parent"}');
  insert into public.user_roles(user_id,role) values(a,'super_admin');
  insert into public.franchises(id,franchise_code,name,city) values
    (fa,'TEST-'||fa,'Staging test A','Test'),(fb,'TEST-'||fb,'Staging test B','Test');
  perform set_config('request.jwt.claim.sub',a::text,true);
  execute 'set local role authenticated';
  perform public.erp_manage_membership(fa,o,'franchise_owner','Test owner',true);
  perform public.erp_manage_membership(fb,b,'franchise_owner','Test other',true);
  perform public.erp_manage_membership(fa,t,'teacher','Test teacher',true);
  perform public.erp_manage_membership(fa,p,'parent','Test parent',true);
  insert into public.batches(id,franchise_id,name,level) values(batch,fa,'Test batch',1);
  insert into public.students(id,franchise_id,batch_id,full_name,parent_phone,level,status) values
    (sa,fa,batch,'Staging test student A','TEST',1,'ACTIVE'),
    (sb,fb,null,'Staging test student B','TEST',1,'ACTIVE');
  perform public.erp_link_parent(fa,p,sa);
  insert into public.erp_fee_plans(franchise_id,label,amount_paise,installments)
    values(fa,'Staging test plan',10001,3) returning id into plan;
  perform public.erp_assign_fee_plan(sa,plan,current_date);
  select sum(amount_paise) into exact_total from public.erp_invoices where student_id=sa and plan_id=plan;
  if exact_total<>10001 then raise exception 'Instalment total mismatch'; end if;
  select id into inv from public.erp_invoices where student_id=sa and installment=1;
  insert into public.erp_stock_items(franchise_id,sku,name,unit_price_paise)
    values(fa,'TEST','Staging test item',100) returning id into item;

  perform set_config('request.jwt.claim.sub',b::text,true);
  if exists(select 1 from public.erp_invoices where student_id=sa) then raise exception 'Cross-franchise invoice leak'; end if;
  blocked=false;
  begin perform public.erp_assign_fee_plan(sa,plan,current_date); exception when others then blocked=true; end;
  if not blocked then raise exception 'Cross-franchise RPC accepted'; end if;

  perform set_config('request.jwt.claim.sub',p::text,true);
  if not exists(select 1 from public.students where id=sa) or exists(select 1 from public.students where id=sb) then
    raise exception 'Parent linked-child scope mismatch';
  end if;
  insert into public.erp_payment_claims(franchise_id,invoice_id,amount_paise,reference,method)
    values(fa,inv,100,'TEST-'||gen_random_uuid(),'BANK_TRANSFER') returning id into claim;
  blocked=false;
  begin perform public.erp_verify_payment(claim,true); exception when others then blocked=true; end;
  if not blocked then raise exception 'Parent verified own payment'; end if;

  perform set_config('request.jwt.claim.sub',o::text,true);
  receipt=public.erp_verify_payment(claim,true);
  if public.erp_verify_payment(claim,true)<>receipt or (select count(*) from public.erp_payments where claim_id=claim)<>1 then
    raise exception 'Receipt idempotency failure';
  end if;
  blocked=false;
  begin perform public.erp_progress_student(sa); exception when others then blocked=true; end;
  if not blocked then raise exception 'Progression accepted before twelve classes'; end if;
  blocked=false;
  begin perform public.erp_record_stock(item,-1,'TEST','TEST-'||gen_random_uuid()); exception when others then blocked=true; end;
  if not blocked then raise exception 'Negative stock accepted'; end if;

  for i in 1..12 loop
    insert into public.erp_class_sessions(franchise_id,batch_id,teacher_user_id,room,level,starts_at,ends_at,status)
      values(fa,batch,t,'Test room',1,now()-interval '2 days'+i*interval '1 hour',
        now()-interval '2 days'+i*interval '1 hour'+interval '30 minutes','COMPLETED') returning id into session;
    insert into public.erp_attendance(franchise_id,session_id,student_id,level,present) values(fa,session,sa,1,true);
  end loop;
  if public.erp_progress_student(sa)<>2 then raise exception 'Twelve-class progression failed'; end if;
  blocked=false;
  begin update public.students set level=3 where id=sa; exception when others then blocked=true; end;
  if not blocked then raise exception 'Direct progression bypass accepted'; end if;
  blocked=false;
  begin
    delete from public.erp_audit where franchise_id=fa;
    get diagnostics affected=row_count;
    blocked=affected=0;
  exception when insufficient_privilege then blocked=true; end;
  if not blocked then raise exception 'Audit records were deleted'; end if;
  if not erp_private.photo_access(fa::text||'/'||sa::text||'.jpg',true) or
    erp_private.photo_access(fb::text||'/'||sb::text||'.jpg',false) then raise exception 'Photo tenant permission mismatch'; end if;

  execute 'reset role';
  if has_function_privilege('anon','public.erp_verify_payment(uuid,boolean)','execute') then raise exception 'Anonymous RPC grant'; end if;
  if exists(select 1 from storage.buckets where id='student-photos' and public) then raise exception 'Student photos public'; end if;
  if exists(select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace
    where n.nspname='public' and c.relkind='r' and not c.relrowsecurity) then raise exception 'Table without RLS'; end if;
end $test$;
select 'PASS: instalments, tenant and parent scope, verified receipt, negative stock, twelve-class progression, immutable audit, photo permissions and anonymous RPC denial' as staging_sql_checks;
rollback;
