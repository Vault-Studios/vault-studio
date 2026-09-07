begin;

do $$
begin
  if (select public from storage.buckets where id = 'client-galleries') is distinct from false then
    raise exception 'client-galleries bucket must remain private';
  end if;

  if has_table_privilege('anon', 'public.client_gallery_sessions', 'select')
     or has_table_privilege('authenticated', 'public.client_gallery_sessions', 'select')
     or has_table_privilege('anon', 'public.client_gallery_unlock_attempts', 'select')
     or has_table_privilege('authenticated', 'public.client_gallery_unlock_attempts', 'select') then
    raise exception 'browser roles must not read gallery sessions';
  end if;

  if has_function_privilege(
       'anon',
       'public.register_client_gallery_unlock_failure(uuid, text)',
       'execute'
     ) or has_function_privilege(
       'authenticated',
       'public.register_client_gallery_unlock_failure(uuid, text)',
       'execute'
     ) or not has_function_privilege(
       'service_role',
       'public.register_client_gallery_unlock_failure(uuid, text)',
       'execute'
     ) then
    raise exception 'unlock failure function privileges are incorrect';
  end if;

  if has_table_privilege('service_role', 'public.client_galleries', 'insert')
     or has_table_privilege('service_role', 'public.client_galleries', 'delete') then
    raise exception 'gallery gateway has excessive gallery-table privileges';
  end if;

  if not has_column_privilege(
    'service_role',
    'public.client_galleries',
    'selection_submitted_at',
    'update'
  ) then
    raise exception 'gallery gateway cannot finalize a gallery';
  end if;

  if exists (
    select 1
    from pg_proc
    where oid = 'private.enforce_client_gallery_selection()'::regprocedure
      and prosecdef
  ) then
    raise exception 'selection trigger must remain SECURITY INVOKER';
  end if;

  if not exists (
    select 1
    from pg_proc
    where oid = 'private.enforce_client_gallery_selection()'::regprocedure
      and array_position(proconfig, 'search_path=""') is not null
  ) then
    raise exception 'selection trigger must use an empty search_path';
  end if;
end
$$;

insert into public.client_galleries (
  id,
  slug,
  title,
  client_name,
  pin_hash,
  status,
  selection_limit
) values (
  '00000000-0000-4000-8000-000000000001',
  'release-review',
  'Release review',
  'Vault QA',
  'scrypt$00000000000000000000000000000000$0000000000000000000000000000000000000000000000000000000000000000',
  'active',
  1
);

insert into public.client_galleries (
  id,
  slug,
  title,
  client_name,
  pin_hash,
  status
) values (
  '00000000-0000-4000-8000-000000000002',
  'release-review-other',
  'Other release review',
  'Vault QA',
  'scrypt$00000000000000000000000000000000$0000000000000000000000000000000000000000000000000000000000000000',
  'active'
);

insert into public.client_gallery_images (id, gallery_id, storage_path, filename)
values
  (
    '00000000-0000-4000-8000-000000000011',
    '00000000-0000-4000-8000-000000000001',
    'release-review/one.jpg',
    'one.jpg'
  ),
  (
    '00000000-0000-4000-8000-000000000012',
    '00000000-0000-4000-8000-000000000001',
    'release-review/two.jpg',
    'two.jpg'
  ),
  (
    '00000000-0000-4000-8000-000000000013',
    '00000000-0000-4000-8000-000000000002',
    'release-review-other/three.jpg',
    'three.jpg'
  );

insert into public.client_gallery_sessions (gallery_id, token_digest, expires_at)
values (
  '00000000-0000-4000-8000-000000000001',
  repeat('a', 64),
  now() + interval '1 hour'
);

select public.register_client_gallery_unlock_failure(
  '00000000-0000-4000-8000-000000000001',
  repeat('b', 64)
) from generate_series(1, 5);

do $$
begin
  if not exists (
    select 1
    from public.client_gallery_unlock_attempts
    where gallery_id = '00000000-0000-4000-8000-000000000001'
      and client_digest = repeat('b', 64)
      and failure_count = 5
      and locked_until > now()
  ) then
    raise exception 'gallery PIN failure limiter did not lock atomically';
  end if;
end
$$;

insert into public.client_gallery_selections (gallery_id, image_id)
values (
  '00000000-0000-4000-8000-000000000001',
  '00000000-0000-4000-8000-000000000011'
);

do $$
begin
  begin
    insert into public.client_gallery_selections (gallery_id, image_id)
    values (
      '00000000-0000-4000-8000-000000000001',
      '00000000-0000-4000-8000-000000000012'
    );
    raise exception 'selection limit was not enforced';
  exception
    when check_violation then null;
  end;
end
$$;

do $$
begin
  begin
    insert into public.client_gallery_selections (gallery_id, image_id)
    values (
      '00000000-0000-4000-8000-000000000001',
      '00000000-0000-4000-8000-000000000013'
    );
    raise exception 'cross-gallery selection was not rejected';
  exception
    when foreign_key_violation then null;
  end;
end
$$;

update public.client_galleries
set status = 'selection_submitted', selection_submitted_at = now()
where id = '00000000-0000-4000-8000-000000000001';

do $$
begin
  begin
    delete from public.client_gallery_selections
    where gallery_id = '00000000-0000-4000-8000-000000000001';
    raise exception 'finalized selections remained mutable';
  exception
    when check_violation then null;
  end;
end
$$;

update public.client_galleries
set status = 'active', selection_submitted_at = null
where id = '00000000-0000-4000-8000-000000000001';

delete from public.client_galleries
where id in (
  '00000000-0000-4000-8000-000000000001',
  '00000000-0000-4000-8000-000000000002'
);

do $$
begin
  if exists (
    select 1 from public.client_gallery_sessions
    where gallery_id = '00000000-0000-4000-8000-000000000001'
  ) or exists (
    select 1 from public.client_gallery_images
    where gallery_id = '00000000-0000-4000-8000-000000000001'
  ) or exists (
    select 1 from public.client_gallery_selections
    where gallery_id = '00000000-0000-4000-8000-000000000001'
  ) or exists (
    select 1 from public.client_gallery_unlock_attempts
    where gallery_id = '00000000-0000-4000-8000-000000000001'
  ) then
    raise exception 'gallery child rows did not cascade';
  end if;
end
$$;

rollback;
