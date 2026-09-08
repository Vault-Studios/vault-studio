-- Admin-curated imagery for the public editorial landing page.
-- This table stores references to existing CMS records only; no media is copied.

create table public.site_media_slots (
  slot_key text primary key,
  project_id uuid references public.projects(id) on delete set null,
  image_id uuid references public.project_images(id) on delete set null,
  alt_text_en text check (alt_text_en is null or char_length(alt_text_en) <= 300),
  alt_text_sw text check (alt_text_sw is null or char_length(alt_text_sw) <= 300),
  sort_order smallint not null default 0 check (sort_order >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint site_media_slots_key_check check (
    slot_key in (
      'hero',
      'service_photography',
      'service_film',
      'service_commercial',
      'parallax_1',
      'parallax_2',
      'parallax_3',
      'studio_story',
      'featured_project',
      'featured_takeover_image',
      'closing_background'
    )
  )
);

create index site_media_slots_project_id_idx
  on public.site_media_slots (project_id)
  where project_id is not null;

create index site_media_slots_image_id_idx
  on public.site_media_slots (image_id)
  where image_id is not null;

alter table public.site_media_slots enable row level security;

revoke all on table public.site_media_slots from public, anon, authenticated;
grant select on table public.site_media_slots to anon;
grant select, insert, update, delete on table public.site_media_slots to authenticated;

create policy "public reads active landing media"
on public.site_media_slots
for select
to anon, authenticated
using (active = true);

create policy "vault admins read all landing media"
on public.site_media_slots
for select
to authenticated
using (
  exists (
    select 1
    from public.admin_users as admin
    where admin.user_id = (select auth.uid())
  )
);

create policy "vault admins insert landing media"
on public.site_media_slots
for insert
to authenticated
with check (
  exists (
    select 1
    from public.admin_users as admin
    where admin.user_id = (select auth.uid())
  )
);

create policy "vault admins update landing media"
on public.site_media_slots
for update
to authenticated
using (
  exists (
    select 1
    from public.admin_users as admin
    where admin.user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.admin_users as admin
    where admin.user_id = (select auth.uid())
  )
);

create policy "vault admins delete landing media"
on public.site_media_slots
for delete
to authenticated
using (
  exists (
    select 1
    from public.admin_users as admin
    where admin.user_id = (select auth.uid())
  )
);
