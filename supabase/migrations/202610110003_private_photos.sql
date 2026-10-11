-- Requires core and ERP migrations. Student photos must not have public download URLs.
begin;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('student-photos','student-photos',false,5242880,array['image/jpeg','image/png','image/webp'])
on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

create function erp_private.photo_access(object_name text,write_allowed boolean)
returns boolean language plpgsql stable security definer set search_path='' as $$
declare f uuid; s uuid;
begin
  if auth.uid() is null or object_name !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|jpeg|png|webp)$' then return false; end if;
  f=split_part(object_name,'/',1)::uuid;
  s=split_part(split_part(object_name,'/',2),'.',1)::uuid;
  if not exists(select 1 from public.students where id=s and franchise_id=f) then return false; end if;
  if write_allowed then return erp_private.has_access(f,array['franchise_owner']); end if;
  return erp_private.has_access(f,array['franchise_owner','teacher','receptionist']) or erp_private.owns_student(s);
end $$;
revoke all on function erp_private.photo_access(text,boolean) from public,anon;
grant execute on function erp_private.photo_access(text,boolean) to authenticated;

drop policy if exists "Anyone can view student photos" on storage.objects;
drop policy if exists "Authenticated users can upload student photos" on storage.objects;
drop policy if exists "Authenticated users can view student photos from their franchise" on storage.objects;
drop policy if exists "Authenticated users can update their franchise photos" on storage.objects;
drop policy if exists "Authenticated users can delete their franchise photos" on storage.objects;
create policy erp_photos_read on storage.objects for select to authenticated
using(bucket_id='student-photos' and erp_private.photo_access(name,false));
create policy erp_photos_insert on storage.objects for insert to authenticated
with check(bucket_id='student-photos' and erp_private.photo_access(name,true));
create policy erp_photos_update on storage.objects for update to authenticated
using(bucket_id='student-photos' and erp_private.photo_access(name,true))
with check(bucket_id='student-photos' and erp_private.photo_access(name,true));
create policy erp_photos_delete on storage.objects for delete to authenticated
using(bucket_id='student-photos' and erp_private.photo_access(name,true));
commit;
