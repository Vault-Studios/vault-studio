begin;

do $$
begin
  if not (select relrowsecurity from pg_class where oid = 'public.site_media_slots'::regclass) then
    raise exception 'site_media_slots must have RLS enabled';
  end if;

  if not has_table_privilege('anon', 'public.site_media_slots', 'select')
     or has_table_privilege('anon', 'public.site_media_slots', 'insert')
     or has_table_privilege('anon', 'public.site_media_slots', 'update')
     or has_table_privilege('anon', 'public.site_media_slots', 'delete') then
    raise exception 'anon landing-slot privileges are incorrect';
  end if;

  if not has_table_privilege('authenticated', 'public.site_media_slots', 'select')
     or not has_table_privilege('authenticated', 'public.site_media_slots', 'insert')
     or not has_table_privilege('authenticated', 'public.site_media_slots', 'update')
     or not has_table_privilege('authenticated', 'public.site_media_slots', 'delete') then
    raise exception 'authenticated landing-slot grants are incomplete';
  end if;

  if exists (
    select 1
    from pg_policy
    where polrelid = 'public.site_media_slots'::regclass
      and pg_get_expr(polqual, polrelid) ilike '%user_metadata%'
  ) then
    raise exception 'landing-slot authorization must not trust user metadata';
  end if;
end
$$;

insert into public.site_media_slots (slot_key, active)
values ('hero', true), ('parallax_1', false);

set local role anon;

do $$
begin
  if (select count(*) from public.site_media_slots) <> 1 then
    raise exception 'anon must only read active landing slots';
  end if;

  begin
    insert into public.site_media_slots (slot_key) values ('service_film');
    raise exception 'anon unexpectedly inserted a landing slot';
  exception
    when insufficient_privilege then null;
  end;
end
$$;

reset role;
rollback;
