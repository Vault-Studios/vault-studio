-- Vault Studio private client gallery foundation.
-- Applied to Supabase production as migration: private_client_gallery_foundation.
-- Client-facing access is intentionally NOT granted here. Client PIN/session access
-- must be mediated by the application and short-lived signed Storage URLs.

create extension if not exists pgcrypto;

create table if not exists public.client_galleries (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  title text not null,
  client_name text not null,
  client_email text not null default '',
  event_date date,
  description text not null default '',
  pin_hash text not null,
  status text not null default 'draft' check (status in ('draft','active','selection_submitted','archived')),
  selection_limit integer check (selection_limit is null or selection_limit > 0),
  allow_downloads boolean not null default false,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.client_gallery_images (
  id uuid primary key default gen_random_uuid(),
  gallery_id uuid not null references public.client_galleries(id) on delete cascade,
  storage_path text not null,
  filename text not null,
  alt_text text not null default '',
  sort_order integer not null default 0,
  is_downloadable boolean not null default false,
  created_at timestamptz not null default now(),
  unique (gallery_id, storage_path)
);

create table if not exists public.client_gallery_selections (
  gallery_id uuid not null references public.client_galleries(id) on delete cascade,
  image_id uuid not null references public.client_gallery_images(id) on delete cascade,
  selected_at timestamptz not null default now(),
  primary key (gallery_id, image_id)
);

create index if not exists client_gallery_images_gallery_sort_idx on public.client_gallery_images(gallery_id, sort_order, created_at);
create index if not exists client_gallery_selections_gallery_idx on public.client_gallery_selections(gallery_id, selected_at);

alter table public.client_galleries enable row level security;
alter table public.client_gallery_images enable row level security;
alter table public.client_gallery_selections enable row level security;

revoke all on public.client_galleries from anon, authenticated;
revoke all on public.client_gallery_images from anon, authenticated;
revoke all on public.client_gallery_selections from anon, authenticated;
grant select, insert, update, delete on public.client_galleries to authenticated;
grant select, insert, update, delete on public.client_gallery_images to authenticated;
grant select, insert, update, delete on public.client_gallery_selections to authenticated;

create policy "vault admins manage client galleries" on public.client_galleries for all to authenticated
using (exists (select 1 from public.admin_users a where a.user_id = (select auth.uid())))
with check (exists (select 1 from public.admin_users a where a.user_id = (select auth.uid())));

create policy "vault admins manage client gallery images" on public.client_gallery_images for all to authenticated
using (exists (select 1 from public.admin_users a where a.user_id = (select auth.uid())))
with check (exists (select 1 from public.admin_users a where a.user_id = (select auth.uid())));

create policy "vault admins manage client gallery selections" on public.client_gallery_selections for all to authenticated
using (exists (select 1 from public.admin_users a where a.user_id = (select auth.uid())))
with check (exists (select 1 from public.admin_users a where a.user_id = (select auth.uid())));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('client-galleries', 'client-galleries', false, 15728640, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy "vault admins read private gallery files" on storage.objects for select to authenticated
using (bucket_id = 'client-galleries' and exists (select 1 from public.admin_users a where a.user_id = (select auth.uid())));
create policy "vault admins upload private gallery files" on storage.objects for insert to authenticated
with check (bucket_id = 'client-galleries' and exists (select 1 from public.admin_users a where a.user_id = (select auth.uid())));
create policy "vault admins update private gallery files" on storage.objects for update to authenticated
using (bucket_id = 'client-galleries' and exists (select 1 from public.admin_users a where a.user_id = (select auth.uid())))
with check (bucket_id = 'client-galleries' and exists (select 1 from public.admin_users a where a.user_id = (select auth.uid())));
create policy "vault admins delete private gallery files" on storage.objects for delete to authenticated
using (bucket_id = 'client-galleries' and exists (select 1 from public.admin_users a where a.user_id = (select auth.uid())));