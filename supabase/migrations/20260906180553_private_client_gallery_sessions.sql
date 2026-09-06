-- Server-mediated sessions for PIN-protected client galleries.
-- Browser roles receive no access. The narrowly scoped gallery gateway uses a
-- server-only Supabase secret key and still performs application authorization
-- before each operation.

alter table public.client_galleries
  add column if not exists selection_submitted_at timestamptz;

create table if not exists public.client_gallery_sessions (
  id uuid primary key default gen_random_uuid(),
  gallery_id uuid not null references public.client_galleries(id) on delete cascade,
  token_digest text not null unique check (token_digest ~ '^[a-f0-9]{64}$'),
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  revoked_at timestamptz,
  constraint client_gallery_sessions_expiry_check check (expires_at > created_at)
);

create index if not exists client_gallery_sessions_gallery_idx
  on public.client_gallery_sessions (gallery_id, expires_at desc);

create index if not exists client_gallery_sessions_active_expiry_idx
  on public.client_gallery_sessions (expires_at)
  where revoked_at is null;

alter table public.client_gallery_sessions enable row level security;
revoke all on public.client_gallery_sessions from public, anon, authenticated;

-- Remove possible Supabase default privileges before granting only the columns
-- and operations used by the private gallery gateway. RLS remains enabled;
-- Supabase secret keys map to service_role and bypass it server-side.
revoke all on public.client_galleries from service_role;
revoke all on public.client_gallery_images from service_role;
revoke all on public.client_gallery_selections from service_role;
revoke all on public.client_gallery_sessions from service_role;

grant select on public.client_galleries to service_role;
grant update (status, selection_submitted_at, updated_at)
  on public.client_galleries to service_role;
grant select on public.client_gallery_images to service_role;
grant select, delete on public.client_gallery_selections to service_role;
grant insert (gallery_id, image_id)
  on public.client_gallery_selections to service_role;
grant select on public.client_gallery_sessions to service_role;
grant insert (gallery_id, token_digest, expires_at)
  on public.client_gallery_sessions to service_role;
grant update (revoked_at)
  on public.client_gallery_sessions to service_role;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create or replace function private.enforce_client_gallery_selection()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  target_gallery_id uuid;
  target_image_id uuid;
  gallery_status text;
  gallery_expires_at timestamptz;
  gallery_selection_limit integer;
  current_selection_count integer;
begin
  if tg_op = 'DELETE' then
    target_gallery_id := old.gallery_id;
    target_image_id := old.image_id;
  else
    target_gallery_id := new.gallery_id;
    target_image_id := new.image_id;
  end if;

  select status, expires_at, selection_limit
    into gallery_status, gallery_expires_at, gallery_selection_limit
  from public.client_galleries
  where id = target_gallery_id
  for update;

  -- A parent gallery deletion intentionally cascades to its sessions, images,
  -- and selections. At that point the parent row is no longer visible, so let
  -- the FK cascade complete while continuing to reject every other orphaned
  -- mutation.
  if not found and tg_op = 'DELETE' then
    return old;
  end if;

  if not found or gallery_status <> 'active' then
    raise exception 'Gallery selections are closed.' using errcode = 'check_violation';
  end if;

  if gallery_expires_at is not null and gallery_expires_at <= now() then
    raise exception 'Gallery has expired.' using errcode = 'check_violation';
  end if;

  if not exists (
    select 1
    from public.client_gallery_images
    where id = target_image_id and gallery_id = target_gallery_id
  ) then
    raise exception 'Image does not belong to gallery.' using errcode = 'foreign_key_violation';
  end if;

  if tg_op = 'INSERT' and gallery_selection_limit is not null then
    if not exists (
      select 1
      from public.client_gallery_selections
      where gallery_id = target_gallery_id and image_id = target_image_id
    ) then
      select count(*) into current_selection_count
      from public.client_gallery_selections
      where gallery_id = target_gallery_id;

      if current_selection_count >= gallery_selection_limit then
        raise exception 'Gallery selection limit reached.' using errcode = 'check_violation';
      end if;
    end if;
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

revoke execute on function private.enforce_client_gallery_selection()
  from public, anon, authenticated;

drop trigger if exists enforce_client_gallery_selection_scope
  on public.client_gallery_selections;
create trigger enforce_client_gallery_selection_scope
before insert or update or delete on public.client_gallery_selections
for each row execute function private.enforce_client_gallery_selection();
