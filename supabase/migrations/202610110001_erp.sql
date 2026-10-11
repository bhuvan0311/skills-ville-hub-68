-- Requires the existing franchises, profiles, user_roles, students and batches tables.
-- Apply to staging first. This migration never seeds business records or monetary rules.
begin;

create schema if not exists erp_private;
revoke all on schema erp_private from public;
grant usage on schema erp_private to authenticated;

create table public.erp_memberships (
  id uuid primary key default gen_random_uuid(),
  franchise_id uuid not null references public.franchises(id),
  user_id uuid not null references auth.users(id),
  role text not null check (role in ('franchise_owner','teacher','receptionist','parent')),
  display_name text not null check (length(trim(display_name)) > 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique(franchise_id,user_id)
);

create function erp_private.is_admin() returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.user_roles where user_id=auth.uid() and role::text='super_admin');
$$;
create function erp_private.has_access(f uuid, roles text[]) returns boolean language sql stable security definer set search_path = '' as $$
  select auth.uid() is not null and (
    erp_private.is_admin() or
    (exists(select 1 from public.franchises where id=f and is_active) and (
      ('franchise_owner'=any(roles) and exists(select 1 from public.profiles p join public.user_roles r on r.user_id=p.id
        where p.id=auth.uid() and p.franchise_id=f and r.role::text='franchise_owner') and
        not exists(select 1 from public.erp_memberships where user_id=auth.uid() and franchise_id=f)) or
      exists(select 1 from public.erp_memberships m where m.franchise_id=f and m.user_id=auth.uid() and m.active and m.role=any(roles))
    ))
  );
$$;

-- A self-service profile update may not change tenancy, even if an older RLS policy permits it.
create function erp_private.protect_profile_scope() returns trigger language plpgsql set search_path='' as $$
begin
  if auth.uid() is not null and not erp_private.is_admin() and
    (new.id is distinct from old.id or new.franchise_id is distinct from old.franchise_id) then
    raise exception 'Only Head Office can change account franchise assignment';
  end if;
  return new;
end $$;
create trigger erp_protect_profile_scope before update on public.profiles for each row execute function erp_private.protect_profile_scope();

create table public.erp_parent_links (
  id uuid primary key default gen_random_uuid(), franchise_id uuid not null references public.franchises,
  parent_user_id uuid not null references auth.users, student_id uuid not null references public.students,
  created_at timestamptz not null default now(), unique(parent_user_id, student_id)
);
create function erp_private.owns_student(s uuid) returns boolean language sql stable security definer set search_path='' as $$
  select exists(select 1 from public.erp_parent_links l join public.erp_memberships m
    on m.user_id=l.parent_user_id and m.franchise_id=l.franchise_id and m.role='parent' and m.active
    join public.franchises f on f.id=l.franchise_id and f.is_active
    where l.parent_user_id=auth.uid() and l.student_id=s);
$$;

create table public.erp_leads (
  id uuid primary key default gen_random_uuid(), franchise_id uuid not null references public.franchises,
  full_name text not null, parent_name text not null, phone text not null,
  status text not null default 'NEW' check(status in ('NEW','TRIAL','FOLLOW_UP','ENROLLED','LOST')),
  next_follow_up date, notes text, student_id uuid references public.students,
  created_at timestamptz not null default now()
);
create table public.erp_fee_plans (
  id uuid primary key default gen_random_uuid(), franchise_id uuid not null references public.franchises,
  label text not null, amount_paise bigint not null check(amount_paise between 1 and 99999999999),
  installments integer not null check(installments between 1 and 24 and installments<=amount_paise),
  active boolean not null default true, created_at timestamptz not null default now()
);
create table public.erp_invoices (
  id uuid primary key default gen_random_uuid(), franchise_id uuid not null references public.franchises,
  student_id uuid not null references public.students, plan_id uuid not null references public.erp_fee_plans,
  installment integer not null, label text not null, amount_paise bigint not null check(amount_paise>0),
  discount_paise bigint not null default 0 check(discount_paise>=0 and discount_paise<=amount_paise),
  due_date date not null, created_at timestamptz not null default now(), unique(student_id,plan_id,installment)
);
create table public.erp_payment_claims (
  id uuid primary key default gen_random_uuid(), franchise_id uuid not null references public.franchises,
  invoice_id uuid not null references public.erp_invoices, amount_paise bigint not null check(amount_paise>0),
  reference text not null check(length(trim(reference)) between 6 and 100),
  method text not null check(method in ('UPI','BANK_TRANSFER','CASH')),
  status text not null default 'PENDING' check(status in ('PENDING','VERIFIED','REJECTED')),
  submitted_by uuid not null default auth.uid() references auth.users,
  created_at timestamptz not null default now(), unique(franchise_id,reference)
);
create table public.erp_payments (
  id uuid primary key default gen_random_uuid(), franchise_id uuid not null references public.franchises,
  invoice_id uuid not null references public.erp_invoices, claim_id uuid not null unique references public.erp_payment_claims,
  amount_paise bigint not null check(amount_paise>0), reference text not null,
  receipt_no text not null unique default ('SV-' || replace(gen_random_uuid()::text,'-','')),
  verified_by uuid not null references auth.users, created_at timestamptz not null default now()
);
create table public.erp_discount_requests (
  id uuid primary key default gen_random_uuid(), franchise_id uuid not null references public.franchises,
  invoice_id uuid not null references public.erp_invoices,
  amount_paise bigint not null check(amount_paise>0), reason text not null,
  status text not null default 'PENDING' check(status in ('PENDING','APPROVED','REJECTED')),
  created_at timestamptz not null default now()
);
create table public.erp_payment_settings (
  id uuid primary key default gen_random_uuid(), franchise_id uuid not null unique references public.franchises,
  payee_name text not null, upi_id text, bank_instructions text, whatsapp_phone text,
  created_at timestamptz not null default now(),
  check(upi_id is null or upi_id ~ '^[A-Za-z0-9._-]+@[A-Za-z0-9.-]+$')
);
create table public.erp_class_sessions (
  id uuid primary key default gen_random_uuid(), franchise_id uuid not null references public.franchises,
  batch_id uuid not null references public.batches, teacher_user_id uuid not null references auth.users,
  room text not null, level integer not null check(level>0), starts_at timestamptz not null, ends_at timestamptz not null,
  status text not null default 'SCHEDULED' check(status in ('SCHEDULED','COMPLETED','CANCELLED')),
  created_at timestamptz not null default now(), check(ends_at>starts_at)
);
create table public.erp_attendance (
  id uuid primary key default gen_random_uuid(), franchise_id uuid not null references public.franchises,
  session_id uuid not null references public.erp_class_sessions, student_id uuid not null references public.students,
  level integer not null check(level>0), present boolean not null,
  created_at timestamptz not null default now(), unique(session_id,student_id)
);
create table public.erp_assessments (
  id uuid primary key default gen_random_uuid(), franchise_id uuid not null references public.franchises,
  student_id uuid not null references public.students, level integer not null check(level>0),
  skill text not null, score integer not null check(score between 0 and 100), notes text,
  assessed_on date not null, created_at timestamptz not null default now()
);
create table public.erp_practice (
  id uuid primary key default gen_random_uuid(), franchise_id uuid not null references public.franchises,
  student_id uuid not null references public.students, task text not null, due_date date not null,
  status text not null default 'ASSIGNED' check(status in ('ASSIGNED','COMPLETED','REVIEWED')),
  notes text, created_at timestamptz not null default now()
);
create table public.erp_progressions (
  id uuid primary key default gen_random_uuid(), franchise_id uuid not null references public.franchises,
  student_id uuid not null references public.students, from_level integer not null, to_level integer not null,
  classes_attended integer not null check(classes_attended>=12), approved_by uuid not null references auth.users,
  created_at timestamptz not null default now(), unique(student_id,from_level)
);
create table public.erp_teacher_training (
  id uuid primary key default gen_random_uuid(), franchise_id uuid not null references public.franchises,
  teacher_user_id uuid not null references auth.users, title text not null, level integer not null check(level>0),
  status text not null default 'PLANNED' check(status in ('PLANNED','SCHEDULED','COMPLETED')),
  training_date date not null, evidence text not null, created_at timestamptz not null default now()
);
create table public.erp_expenses (
  id uuid primary key default gen_random_uuid(), franchise_id uuid not null references public.franchises,
  category text not null, description text not null, amount_paise bigint not null check(amount_paise>0),
  expense_date date not null, reference text not null, created_at timestamptz not null default now()
);
create table public.erp_royalty_rules (
  id uuid primary key default gen_random_uuid(), franchise_id uuid not null references public.franchises,
  label text not null, basis_points integer not null check(basis_points between 0 and 10000),
  fixed_paise bigint not null default 0 check(fixed_paise>=0),
  effective_from date not null, effective_to date, created_at timestamptz not null default now(),
  check(effective_to is null or effective_to>=effective_from)
);
create table public.erp_royalty_statements (
  id uuid primary key default gen_random_uuid(), franchise_id uuid not null references public.franchises,
  rule_id uuid not null references public.erp_royalty_rules, period_start date not null, period_end date not null,
  collected_paise bigint not null, amount_paise bigint not null,
  created_at timestamptz not null default now(), unique(franchise_id,period_start,period_end), check(period_end>=period_start)
);
create table public.erp_stock_items (
  id uuid primary key default gen_random_uuid(), franchise_id uuid not null references public.franchises,
  sku text not null, name text not null, unit_price_paise bigint not null check(unit_price_paise>=0),
  reorder_level integer not null default 0 check(reorder_level>=0), created_at timestamptz not null default now(),
  unique(franchise_id,sku)
);
create table public.erp_stock_movements (
  id uuid primary key default gen_random_uuid(), franchise_id uuid not null references public.franchises,
  item_id uuid not null references public.erp_stock_items, quantity_delta integer not null check(quantity_delta<>0),
  reason text not null, reference text not null, created_at timestamptz not null default now(),
  unique(item_id,reference)
);
create table public.erp_procurement (
  id uuid primary key default gen_random_uuid(), franchise_id uuid not null references public.franchises,
  item_id uuid not null references public.erp_stock_items, quantity integer not null check(quantity>0),
  status text not null default 'REQUESTED' check(status in ('REQUESTED','APPROVED','RECEIVED','REJECTED')),
  notes text, created_at timestamptz not null default now()
);
create table public.erp_contracts (
  id uuid primary key default gen_random_uuid(), franchise_id uuid not null references public.franchises,
  label text not null, starts_on date not null, renews_on date not null,
  status text not null check(status in ('ONBOARDING','ACTIVE','RENEWAL_DUE','CLOSED')),
  checklist text not null, created_at timestamptz not null default now(), check(renews_on>starts_on)
);
create table public.erp_message_templates (
  id uuid primary key default gen_random_uuid(), franchise_id uuid not null references public.franchises,
  label text not null, body text not null, active boolean not null default true,
  created_at timestamptz not null default now()
);
create table public.erp_contacts (
  id uuid primary key default gen_random_uuid(), franchise_id uuid not null references public.franchises,
  student_id uuid not null references public.students, phone text not null check(phone ~ '^[1-9][0-9]{7,14}$'),
  whatsapp_consent boolean not null default false, consent_note text not null,
  created_at timestamptz not null default now(), unique(student_id,phone)
);
create table public.erp_appointments (
  id uuid primary key default gen_random_uuid(), franchise_id uuid not null references public.franchises,
  student_id uuid not null references public.students, requested_by uuid not null default auth.uid() references auth.users,
  requested_at timestamptz not null, reason text not null,
  status text not null default 'REQUESTED' check(status in ('REQUESTED','CONFIRMED','CANCELLED')),
  created_at timestamptz not null default now()
);
create table public.erp_audit (
  id uuid primary key default gen_random_uuid(), franchise_id uuid not null references public.franchises,
  actor_id uuid references auth.users, entity text not null, record_id uuid not null,
  operation text not null, changed_fields text[] not null, created_at timestamptz not null default now()
);

-- Resolve relation IDs inside the database; client franchise IDs are never trusted.
create function erp_private.validate_relations() returns trigger language plpgsql security definer set search_path='' as $$
declare payload jsonb=to_jsonb(new); relation text; target_table text; target uuid; actual uuid;
begin
  if TG_OP='UPDATE' and new.franchise_id is distinct from old.franchise_id then raise exception 'Franchise assignment is immutable'; end if;
  foreach relation in array array['student_id','batch_id','invoice_id','plan_id','session_id','item_id','rule_id'] loop
    if payload->>relation is not null then
      target=(payload->>relation)::uuid;
      target_table=case relation when 'student_id' then 'students' when 'batch_id' then 'batches'
        when 'invoice_id' then 'erp_invoices' when 'plan_id' then 'erp_fee_plans' when 'session_id' then 'erp_class_sessions'
        when 'item_id' then 'erp_stock_items' when 'rule_id' then 'erp_royalty_rules' end;
      execute format('select franchise_id from public.%I where id=$1',target_table) into actual using target;
      if actual is distinct from new.franchise_id then raise exception 'Related record belongs to another franchise'; end if;
    end if;
  end loop;
  if TG_TABLE_NAME='erp_parent_links' then
    if not exists(select 1 from public.erp_memberships where user_id=new.parent_user_id and franchise_id=new.franchise_id and role='parent' and active) then raise exception 'Assign an active parent membership first'; end if;
  end if;
  if TG_TABLE_NAME='erp_class_sessions' then
    if not exists(select 1 from public.batches where id=new.batch_id and level=new.level and is_active) then raise exception 'Class level must match an active batch'; end if;
    if not exists(select 1 from public.erp_memberships where user_id=new.teacher_user_id and franchise_id=new.franchise_id and role='teacher' and active) then raise exception 'Assign an active teacher first'; end if;
    -- The franchise row serializes concurrent timetable writes.
    perform 1 from public.franchises where id=new.franchise_id for update;
    if new.status<>'CANCELLED' and exists(select 1 from public.erp_class_sessions s where s.franchise_id=new.franchise_id
      and s.id<>new.id and s.status<>'CANCELLED' and s.starts_at<new.ends_at and new.starts_at<s.ends_at
      and (s.teacher_user_id=new.teacher_user_id or lower(trim(s.room))=lower(trim(new.room)) or s.batch_id=new.batch_id)) then
      raise exception 'Teacher, batch or classroom timetable conflict';
    end if;
  end if;
  if TG_TABLE_NAME='students' then
    if TG_OP='INSERT' and auth.uid() is not null and new.level<>1 then raise exception 'New students start at level 1'; end if;
    if new.batch_id is not null and not exists(select 1 from public.batches where id=new.batch_id and level=new.level and is_active) then raise exception 'Assign a batch matching the student current level'; end if;
    if new.batch_id is not null and new.status::text in ('ACTIVE','PENDING') then
      perform 1 from public.batches where id=new.batch_id for update;
      if (select count(*) from public.students where batch_id=new.batch_id and id<>new.id and status::text in ('ACTIVE','PENDING')) >=
        (select max_students from public.batches where id=new.batch_id) then raise exception 'Batch enrolment capacity reached'; end if;
    end if;
  end if;
  if TG_TABLE_NAME='erp_appointments' then
    if TG_OP='INSERT' and new.requested_by is distinct from auth.uid() then raise exception 'Appointment requester must match the signed-in account'; end if;
  end if;
  if TG_TABLE_NAME='erp_teacher_training' then
    if not exists(select 1 from public.erp_memberships where user_id=new.teacher_user_id and franchise_id=new.franchise_id and role='teacher' and active) then raise exception 'Assign an active teacher first'; end if;
    if new.status='COMPLETED' and length(trim(new.evidence))=0 then raise exception 'Completion evidence required'; end if;
  end if;
  if TG_TABLE_NAME='erp_attendance' then
    if not exists(select 1 from public.erp_class_sessions c join public.students s on s.batch_id=c.batch_id
      where c.id=new.session_id and s.id=new.student_id and c.level=new.level and s.level=new.level
      and c.status<>'CANCELLED' and c.ends_at<=now()) then raise exception 'Attendance requires a completed class at the student current level'; end if;
    if TG_OP='UPDATE' and new.level is distinct from old.level then raise exception 'Attendance level is immutable'; end if;
  end if;
  if TG_TABLE_NAME='erp_payment_claims' then
    if TG_OP='INSERT' and (new.status<>'PENDING' or new.submitted_by is distinct from auth.uid()) then raise exception 'Claims must start pending for the signed-in account'; end if;
  end if;
  if TG_TABLE_NAME='erp_discount_requests' then
    if TG_OP='INSERT' and new.status<>'PENDING' then raise exception 'Discount requests must start pending'; end if;
  end if;
  if TG_TABLE_NAME='erp_procurement' then
    if TG_OP='INSERT' and new.status<>'REQUESTED' then raise exception 'Procurement must start requested'; end if;
  end if;
  if TG_TABLE_NAME='erp_stock_movements' then
    perform 1 from public.erp_stock_items where id=new.item_id for update;
    if coalesce((select sum(quantity_delta) from public.erp_stock_movements where item_id=new.item_id),0)+new.quantity_delta<0 then
      raise exception 'Stock cannot become negative'; end if;
  end if;
  return new;
end $$;

create function erp_private.audit_change() returns trigger language plpgsql security definer set search_path='' as $$
declare fields text[]; payload jsonb;
begin
  payload=case when TG_OP='DELETE' then to_jsonb(old) else to_jsonb(new) end;
  if TG_OP='UPDATE' then
    select array_agg(key order by key) into fields from jsonb_each(payload) where value is distinct from to_jsonb(old)->key;
  else select array_agg(key order by key) into fields from jsonb_each(payload); end if;
  insert into public.erp_audit(franchise_id,actor_id,entity,record_id,operation,changed_fields)
    values((payload->>'franchise_id')::uuid,auth.uid(),TG_TABLE_NAME,(payload->>'id')::uuid,TG_OP,coalesce(fields,array[]::text[]));
  return coalesce(new,old);
end $$;

-- Parent-safe and staff-scoped access. Function definitions live outside exposed public schema.
do $$
declare table_name text; write_roles text[]; read_roles text[]; parent_clause text;
begin
  foreach table_name in array array['erp_memberships','erp_parent_links','erp_leads','erp_fee_plans','erp_invoices','erp_payment_claims','erp_payments',
    'erp_discount_requests','erp_payment_settings','erp_class_sessions','erp_attendance','erp_assessments','erp_practice','erp_progressions',
    'erp_teacher_training','erp_expenses','erp_royalty_rules','erp_royalty_statements','erp_stock_items','erp_stock_movements','erp_procurement','erp_contracts',
    'erp_message_templates','erp_contacts','erp_appointments','erp_audit'] loop
    execute format('alter table public.%I enable row level security',table_name);
    execute format('create index on public.%I(franchise_id)',table_name);
    execute format('grant select on public.%I to authenticated',table_name);
    read_roles=array['franchise_owner']; write_roles=array['franchise_owner']; parent_clause='';
    if table_name in ('erp_leads','erp_fee_plans','erp_invoices','erp_payment_claims','erp_payments','erp_discount_requests','erp_payment_settings',
      'erp_stock_items','erp_stock_movements','erp_procurement','erp_message_templates','erp_contacts') then read_roles=read_roles||'receptionist'::text; end if;
    if table_name in ('erp_leads','erp_payment_claims','erp_discount_requests','erp_procurement','erp_contacts') then write_roles=write_roles||'receptionist'::text; end if;
    if table_name in ('erp_class_sessions','erp_attendance','erp_assessments','erp_practice','erp_progressions','erp_appointments') then
      read_roles=read_roles||array['teacher','receptionist'];
      if table_name<>'erp_progressions' then write_roles=write_roles||'teacher'::text; end if;
    end if;
    if table_name='erp_appointments' then write_roles=write_roles||'receptionist'::text; end if;
    if table_name in ('erp_memberships','erp_parent_links','erp_payments','erp_progressions','erp_stock_movements','erp_royalty_statements','erp_audit') then
      write_roles=array[]::text[];
    end if;
    if table_name in ('erp_fee_plans','erp_payment_settings','erp_royalty_rules','erp_contracts','erp_stock_items','erp_message_templates') then write_roles=array[]::text[]; end if;
    if table_name in ('erp_invoices','erp_attendance','erp_assessments','erp_practice','erp_progressions','erp_appointments','erp_contacts') then
      parent_clause=' or erp_private.owns_student(student_id)';
    elsif table_name='erp_payments' then parent_clause=' or exists(select 1 from public.erp_invoices i where i.id=invoice_id and erp_private.owns_student(i.student_id))';
    elsif table_name='erp_parent_links' then parent_clause=' or parent_user_id=auth.uid()';
    elsif table_name='erp_memberships' then parent_clause=' or user_id=auth.uid()';
    elsif table_name='erp_payment_claims' then parent_clause=' or submitted_by=auth.uid()';
    elsif table_name='erp_payment_settings' then parent_clause=' or erp_private.has_access(franchise_id,array[''parent''])'; end if;
    execute format('create policy erp_read on public.%I for select to authenticated using (erp_private.has_access(franchise_id,%L::text[])%s)',table_name,read_roles,parent_clause);
    if table_name not in ('erp_invoices','erp_payments','erp_progressions','erp_stock_movements','erp_royalty_statements','erp_audit') then
      execute format('grant insert on public.%I to authenticated',table_name);
      execute format('create policy erp_insert on public.%I for insert to authenticated with check (erp_private.has_access(franchise_id,%L::text[]))',table_name,write_roles);
    end if;
    if table_name in ('erp_leads','erp_fee_plans','erp_payment_settings','erp_class_sessions','erp_assessments','erp_practice','erp_teacher_training','erp_expenses','erp_royalty_rules','erp_contracts','erp_message_templates','erp_contacts','erp_appointments') then
      execute format('grant update on public.%I to authenticated',table_name);
      execute format('create policy erp_update on public.%I for update to authenticated using (erp_private.has_access(franchise_id,%L::text[])) with check (erp_private.has_access(franchise_id,%L::text[]))',table_name,write_roles,write_roles);
    end if;
    if table_name<>'erp_audit' then
      execute format('create trigger erp_validate before insert or update on public.%I for each row execute function erp_private.validate_relations()',table_name);
      execute format('create trigger erp_audit after insert or update or delete on public.%I for each row execute function erp_private.audit_change()',table_name);
    end if;
  end loop;
end $$;

create policy erp_students_read on public.students for select to authenticated using
  (erp_private.has_access(franchise_id,array['franchise_owner','teacher','receptionist']) or erp_private.owns_student(id));
drop policy if exists "Franchise owners can view their own students" on public.students;
drop policy if exists "Franchise owners can view their own batches" on public.batches;
drop policy if exists "Users can view their own franchise" on public.franchises;
drop policy if exists "Franchise owners can view their own ledger" on public.finance_ledger;
create policy erp_legacy_ledger_read on public.finance_ledger for select to authenticated using
  (erp_private.has_access(franchise_id,array['franchise_owner']));
-- Replace the inspected legacy policies that inferred an owner role from profile assignment alone.
drop policy if exists "Franchise owners can insert students in their franchise" on public.students;
drop policy if exists "Franchise owners can update their own students" on public.students;
drop policy if exists "Franchise owners can delete their own students" on public.students;
create policy erp_students_insert on public.students for insert to authenticated with check
  (erp_private.has_access(franchise_id,array['franchise_owner','receptionist']));
create policy erp_students_update on public.students for update to authenticated using
  (erp_private.has_access(franchise_id,array['franchise_owner','receptionist'])) with check
  (erp_private.has_access(franchise_id,array['franchise_owner','receptionist']));
create policy erp_students_delete on public.students for delete to authenticated using
  (erp_private.has_access(franchise_id,array['franchise_owner']));
drop policy if exists "Franchise owners can manage their own batches" on public.batches;
create policy erp_batches_manage on public.batches for all to authenticated using
  (erp_private.has_access(franchise_id,array['franchise_owner'])) with check
  (erp_private.has_access(franchise_id,array['franchise_owner']));
create policy erp_batches_read on public.batches for select to authenticated using
  (erp_private.has_access(franchise_id,array['franchise_owner','teacher','receptionist']));
create policy erp_staff_directory on public.erp_memberships for select to authenticated using
  (role<>'parent' and erp_private.has_access(franchise_id,array['teacher','receptionist']));
create policy erp_own_training on public.erp_teacher_training for select to authenticated using
  (teacher_user_id=auth.uid() and erp_private.has_access(franchise_id,array['teacher']));
create policy erp_parent_sessions on public.erp_class_sessions for select to authenticated using
  (exists(select 1 from public.students s where s.batch_id=erp_class_sessions.batch_id and erp_private.owns_student(s.id)));
create policy erp_franchises_read on public.franchises for select to authenticated using
  (erp_private.has_access(id,array['franchise_owner','teacher','receptionist','parent']));
create policy erp_parent_claim on public.erp_payment_claims for insert to authenticated with check
  (submitted_by=auth.uid() and status='PENDING' and method<>'CASH' and exists(select 1 from public.erp_invoices i where i.id=invoice_id and i.franchise_id=erp_payment_claims.franchise_id and erp_private.owns_student(i.student_id)));
create policy erp_parent_appointment on public.erp_appointments for insert to authenticated with check
  (requested_by=auth.uid() and status='REQUESTED' and erp_private.owns_student(student_id));

create function public.erp_assign_fee_plan(p_student uuid,p_plan uuid,p_first_due date) returns integer language plpgsql security definer set search_path='' as $$
declare plan public.erp_fee_plans; student public.students; idx integer; amount bigint;
begin
  select * into strict plan from public.erp_fee_plans where id=p_plan and active;
  select * into strict student from public.students where id=p_student for update;
  if not erp_private.has_access(plan.franchise_id,array['franchise_owner','receptionist']) or plan.franchise_id<>student.franchise_id then raise exception 'Access denied'; end if;
  if p_first_due is null then raise exception 'First due date required'; end if;
  for idx in 1..plan.installments loop
    amount=plan.amount_paise/plan.installments+case when idx<=plan.amount_paise%plan.installments then 1 else 0 end;
    insert into public.erp_invoices(franchise_id,student_id,plan_id,installment,label,amount_paise,due_date)
      values(plan.franchise_id,p_student,p_plan,idx,plan.label||' · Instalment '||idx,amount,(p_first_due+(idx-1)*interval '1 month')::date);
  end loop;
  return plan.installments;
end $$;

create function public.erp_enroll_lead(p_lead uuid) returns uuid language plpgsql security definer set search_path='' as $$
declare lead public.erp_leads; enrolled_student uuid;
begin
  select * into strict lead from public.erp_leads where id=p_lead for update;
  if not erp_private.has_access(lead.franchise_id,array['franchise_owner','receptionist']) then raise exception 'Access denied'; end if;
  if lead.student_id is not null then return lead.student_id; end if;
  if lead.status='LOST' then raise exception 'Reopen the lead before enrolling'; end if;
  insert into public.students(franchise_id,full_name,parent_name,parent_phone,level,status,joining_date,notes)
    values(lead.franchise_id,lead.full_name,lead.parent_name,lead.phone,1,'PENDING',current_date,lead.notes) returning id into enrolled_student;
  update public.erp_leads set student_id=enrolled_student,status='ENROLLED' where id=p_lead;
  return enrolled_student;
end $$;

create function public.erp_verify_payment(p_claim uuid,p_accept boolean) returns uuid language plpgsql security definer set search_path='' as $$
declare claim public.erp_payment_claims; invoice public.erp_invoices; balance bigint; payment_id uuid;
begin
  select * into strict claim from public.erp_payment_claims where id=p_claim for update;
  if not erp_private.has_access(claim.franchise_id,array['franchise_owner']) then raise exception 'Access denied'; end if;
  if claim.status='VERIFIED' then select id into payment_id from public.erp_payments where claim_id=p_claim; return payment_id; end if;
  if claim.status<>'PENDING' then raise exception 'Claim already rejected'; end if;
  if not p_accept then update public.erp_payment_claims set status='REJECTED' where id=p_claim; return null; end if;
  select * into strict invoice from public.erp_invoices where id=claim.invoice_id for update;
  select invoice.amount_paise-invoice.discount_paise-coalesce(sum(amount_paise),0) into balance from public.erp_payments where invoice_id=invoice.id;
  if claim.amount_paise>balance then raise exception 'Payment exceeds outstanding balance'; end if;
  insert into public.erp_payments(franchise_id,invoice_id,claim_id,amount_paise,reference,verified_by)
    values(claim.franchise_id,invoice.id,claim.id,claim.amount_paise,claim.reference,auth.uid()) returning id into payment_id;
  update public.erp_payment_claims set status='VERIFIED' where id=p_claim;
  return payment_id;
end $$;

create function public.erp_decide_discount(p_request uuid,p_accept boolean) returns void language plpgsql security definer set search_path='' as $$
declare request public.erp_discount_requests; invoice public.erp_invoices; paid bigint;
begin
  select * into strict request from public.erp_discount_requests where id=p_request for update;
  if not erp_private.is_admin() then raise exception 'Only Head Office can approve discounts'; end if;
  if request.status<>'PENDING' then raise exception 'Discount already decided'; end if;
  if p_accept then
    select * into strict invoice from public.erp_invoices where id=request.invoice_id for update;
    select coalesce(sum(amount_paise),0) into paid from public.erp_payments where invoice_id=invoice.id;
    if request.amount_paise+invoice.discount_paise+paid>invoice.amount_paise then raise exception 'Discount exceeds unpaid balance'; end if;
    update public.erp_invoices set discount_paise=discount_paise+request.amount_paise where id=invoice.id;
  end if;
  update public.erp_discount_requests set status=case when p_accept then 'APPROVED' else 'REJECTED' end where id=request.id;
end $$;

create function public.erp_progress_student(p_student uuid) returns integer language plpgsql security definer set search_path='' as $$
declare student public.students; attended integer;
begin
  select * into strict student from public.students where id=p_student for update;
  if not erp_private.has_access(student.franchise_id,array['franchise_owner']) then raise exception 'Only an owner or Head Office can approve progression'; end if;
  if student.status::text<>'ACTIVE' then raise exception 'Only active students can progress'; end if;
  select count(distinct a.session_id) into attended from public.erp_attendance a join public.erp_class_sessions c on c.id=a.session_id
    where a.student_id=p_student and a.level=student.level and a.present and c.status<>'CANCELLED' and c.ends_at<=now();
  if attended<12 then raise exception '12 attended classes at this level are required'; end if;
  insert into public.erp_progressions(franchise_id,student_id,from_level,to_level,classes_attended,approved_by)
    values(student.franchise_id,p_student,student.level,student.level+1,attended,auth.uid());
  update public.students set level=level+1,batch_id=null,updated_at=now() where id=p_student;
  return student.level+1;
end $$;

create function public.erp_record_stock(p_item uuid,p_delta integer,p_reason text,p_reference text) returns uuid language plpgsql security definer set search_path='' as $$
declare item public.erp_stock_items; movement_id uuid;
begin
  select * into strict item from public.erp_stock_items where id=p_item for update;
  if not erp_private.has_access(item.franchise_id,array['franchise_owner']) then raise exception 'Access denied'; end if;
  if length(trim(p_reason))=0 or length(trim(p_reference))=0 then raise exception 'Reason and reference required'; end if;
  insert into public.erp_stock_movements(franchise_id,item_id,quantity_delta,reason,reference)
    values(item.franchise_id,p_item,p_delta,p_reason,p_reference) returning id into movement_id;
  return movement_id;
end $$;

create function public.erp_decide_procurement(p_request uuid,p_action text) returns void language plpgsql security definer set search_path='' as $$
declare request public.erp_procurement;
begin
  select * into strict request from public.erp_procurement where id=p_request for update;
  if not erp_private.has_access(request.franchise_id,array['franchise_owner']) then raise exception 'Access denied'; end if;
  if p_action='RECEIVED' and request.status='APPROVED' then
    insert into public.erp_stock_movements(franchise_id,item_id,quantity_delta,reason,reference)
      values(request.franchise_id,request.item_id,request.quantity,'Procurement received',request.id::text);
  elsif not (request.status='REQUESTED' and p_action in ('APPROVED','REJECTED')) then raise exception 'Invalid procurement transition'; end if;
  update public.erp_procurement set status=p_action where id=request.id;
end $$;

create function public.erp_generate_royalty(p_rule uuid,p_start date,p_end date) returns uuid language plpgsql security definer set search_path='' as $$
declare rule public.erp_royalty_rules; collected bigint; statement_id uuid;
begin
  select * into strict rule from public.erp_royalty_rules where id=p_rule;
  if not erp_private.is_admin() then raise exception 'Only Head Office can issue royalty statements'; end if;
  if p_end<p_start or p_start<rule.effective_from or (rule.effective_to is not null and p_end>rule.effective_to) then raise exception 'Period outside rule dates'; end if;
  perform 1 from public.franchises where id=rule.franchise_id for update;
  if exists(select 1 from public.erp_royalty_statements where franchise_id=rule.franchise_id and period_start<=p_end and period_end>=p_start) then raise exception 'Royalty period overlaps an issued statement'; end if;
  select coalesce(sum(amount_paise),0) into collected from public.erp_payments
    where franchise_id=rule.franchise_id and (created_at at time zone 'Asia/Kolkata')::date between p_start and p_end;
  insert into public.erp_royalty_statements(franchise_id,rule_id,period_start,period_end,collected_paise,amount_paise)
    values(rule.franchise_id,p_rule,p_start,p_end,collected,round(collected::numeric*rule.basis_points/10000)::bigint+rule.fixed_paise)
    returning id into statement_id;
  return statement_id;
end $$;

create function public.erp_manage_membership(p_franchise uuid,p_user uuid,p_role text,p_name text,p_active boolean) returns void language plpgsql security definer set search_path='' as $$
begin
  if not erp_private.has_access(p_franchise,array['franchise_owner']) then raise exception 'Access denied'; end if;
  if not erp_private.is_admin() and (p_role='franchise_owner' or exists(select 1 from public.erp_memberships where franchise_id=p_franchise and user_id=p_user and role='franchise_owner')) then raise exception 'Only Head Office can manage owners'; end if;
  insert into public.erp_memberships(franchise_id,user_id,role,display_name,active) values(p_franchise,p_user,p_role,p_name,p_active)
    on conflict(franchise_id,user_id) do update set role=excluded.role,display_name=excluded.display_name,active=excluded.active;
end $$;

create function erp_private.protect_student_level() returns trigger language plpgsql set search_path='' as $$
begin
  if new.level is distinct from old.level and current_user not in ('postgres','service_role') then
    raise exception 'Use the verified 12-class progression workflow';
  end if;
  return new;
end $$;
create trigger erp_protect_student_level before update on public.students for each row execute function erp_private.protect_student_level();
create trigger erp_student_scope before insert or update on public.students for each row execute function erp_private.validate_relations();
create trigger erp_student_audit after insert or update or delete on public.students for each row execute function erp_private.audit_change();
create trigger erp_batch_audit after insert or update or delete on public.batches for each row execute function erp_private.audit_change();

create function public.erp_link_parent(p_franchise uuid,p_parent uuid,p_student uuid) returns void language plpgsql security definer set search_path='' as $$
begin
  if not erp_private.has_access(p_franchise,array['franchise_owner']) then raise exception 'Access denied'; end if;
  insert into public.erp_parent_links(franchise_id,parent_user_id,student_id) values(p_franchise,p_parent,p_student);
end $$;

-- SECURITY DEFINER RPCs are authenticated-only; RLS helpers have no caller-supplied user ID.
do $$ declare fn record;
begin
  for fn in select p.oid::regprocedure sig from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='erp_private' or (n.nspname='public' and p.proname like 'erp_%') loop
    execute format('revoke all on function %s from public',fn.sig);
    execute format('grant execute on function %s to authenticated',fn.sig);
  end loop;
end $$;
commit;
