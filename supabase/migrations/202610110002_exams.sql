begin;
do $$ begin
  if not exists(select 1 from pg_type t join pg_namespace n on n.oid=t.typnamespace where n.nspname='public' and t.typname='certificate_status') then
    create type public.certificate_status as enum ('PENDING','GENERATED','SHIPPED');
  end if;
end $$;
create table if not exists public.exam_results (
  id uuid primary key default gen_random_uuid(), student_id uuid not null references public.students,
  franchise_id uuid not null references public.franchises, level integer not null,
  marks_obtained numeric(5,2) not null, total_marks numeric(5,2) default 100,
  is_passed boolean not null, exam_date date default current_date,
  certificate_status public.certificate_status default 'PENDING',
  created_at timestamptz default now(), updated_at timestamptz default now()
);
alter table public.exam_results enable row level security;
grant select,insert,update on public.exam_results to authenticated;
drop policy if exists "Franchise owners can view their exam results" on public.exam_results;
drop policy if exists "Franchise owners can insert exam results for their students" on public.exam_results;
drop policy if exists "Franchise owners can update their exam results" on public.exam_results;
drop policy if exists "Super admins can manage all exam results" on public.exam_results;
create policy erp_exam_read on public.exam_results for select to authenticated using
  (erp_private.has_access(franchise_id,array['franchise_owner','teacher']) or erp_private.owns_student(student_id));
create policy erp_exam_insert on public.exam_results for insert to authenticated with check
  (erp_private.has_access(franchise_id,array['franchise_owner','teacher']));
create policy erp_exam_update on public.exam_results for update to authenticated using (erp_private.is_admin()) with check (erp_private.is_admin());
create trigger erp_exam_relations before insert or update on public.exam_results for each row execute function erp_private.validate_relations();
create trigger erp_exam_audit after insert or update or delete on public.exam_results for each row execute function erp_private.audit_change();

create function erp_private.validate_exam() returns trigger language plpgsql set search_path='' as $$
begin
  -- Preserve the existing 70/100 exam rule. Attendance progression is a separate approved rule.
  if new.total_marks<>100 or new.marks_obtained<0 or new.marks_obtained>100 or
    new.is_passed is distinct from (new.marks_obtained>=70) then raise exception 'Exam marks must agree with the existing 70/100 pass rule'; end if;
  if TG_OP='INSERT' and new.certificate_status is distinct from (case when new.is_passed then 'PENDING'::public.certificate_status else null end) then
    raise exception 'Certificates must start pending only for passing results';
  end if;
  if TG_OP='UPDATE' and not new.is_passed and new.certificate_status is not null then raise exception 'Only passing results can have certificates'; end if;
  return new;
end $$;
create trigger erp_exam_validation before insert or update on public.exam_results for each row execute function erp_private.validate_exam();
revoke all on function erp_private.validate_exam() from public;
commit;
