-- Supplies the retained catalogue and announcement screens on fresh installations.
-- Does not import or seed any catalogue, inventory or announcement records.
begin;
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(), name text not null check(length(trim(name))>0),
  description text, price numeric(10,2) not null check(price>=0), image_url text,
  category text not null, is_active boolean not null default true, created_at timestamptz not null default now()
);
create table if not exists public.broadcasts (
  id uuid primary key default gen_random_uuid(), title text not null check(length(trim(title))>0),
  message text not null check(length(trim(message))>0),
  priority text not null default 'NORMAL' check(priority in ('NORMAL','URGENT','CRITICAL')),
  created_by uuid not null references public.profiles(id),
  target_audience text not null default 'ALL_FRANCHISES' check(target_audience='ALL_FRANCHISES'),
  created_at timestamptz not null default now()
);
alter table public.products enable row level security;
alter table public.broadcasts enable row level security;
revoke all on public.products,public.broadcasts from anon;
grant select,insert,update,delete on public.products,public.broadcasts to authenticated;
create policy erp_products_read on public.products for select to authenticated using
  (erp_private.is_admin() or exists(select 1 from public.franchises f where erp_private.has_access(f.id,array['franchise_owner'])));
create policy erp_products_manage on public.products for all to authenticated
using(erp_private.is_admin()) with check(erp_private.is_admin());
create policy erp_broadcasts_read on public.broadcasts for select to authenticated using
  (erp_private.is_admin() or exists(select 1 from public.franchises f where erp_private.has_access(f.id,array['franchise_owner'])));
create policy erp_broadcasts_insert on public.broadcasts for insert to authenticated
with check(erp_private.is_admin() and created_by=auth.uid());
create policy erp_broadcasts_update on public.broadcasts for update to authenticated
using(erp_private.is_admin()) with check(erp_private.is_admin() and created_by=auth.uid());

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('product-images','product-images',true,5242880,array['image/jpeg','image/png','image/webp'])
on conflict(id) do update set file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
create policy erp_product_images_read on storage.objects for select to authenticated using(bucket_id='product-images');
create policy erp_product_images_insert on storage.objects for insert to authenticated
with check(bucket_id='product-images' and erp_private.is_admin());
create policy erp_product_images_update on storage.objects for update to authenticated
using(bucket_id='product-images' and erp_private.is_admin()) with check(bucket_id='product-images' and erp_private.is_admin());
commit;
