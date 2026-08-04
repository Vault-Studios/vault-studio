-- Run once in Supabase SQL Editor. Existing rows are preserved.
create table if not exists public.availability_status (
  id text primary key default 'studio',
  status text not null default 'available' check (status in ('available', 'limited', 'engaged', 'unavailable')),
  message_en text not null default 'Now booking new commissions.',
  message_sw text not null default 'Tunapokea kazi mpya.',
  next_available_date date,
  updated_at timestamptz not null default now()
);

insert into public.availability_status (id) values ('studio')
on conflict (id) do nothing;

alter table public.availability_status enable row level security;
grant select on public.availability_status to anon, authenticated;
drop policy if exists "Public can view studio availability" on public.availability_status;
create policy "Public can view studio availability" on public.availability_status
for select to anon, authenticated using (true);

-- If this table existed before the unavailable state was added, refresh its
-- status constraint. The Supabase dashboard remains the private update control.
alter table public.availability_status drop constraint if exists availability_status_status_check;
alter table public.availability_status add constraint availability_status_status_check
check (status in ('available', 'limited', 'engaged', 'unavailable'));

-- Reviews stay private until approved. The public view excludes client email.
create table if not exists public.review_submissions (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 120),
  company text not null default '' check (char_length(company) <= 160),
  email text not null check (char_length(email) between 5 and 200),
  project text not null check (char_length(project) between 2 and 160),
  rating smallint not null check (rating between 1 and 5),
  review text not null check (char_length(review) between 30 and 1600),
  consent boolean not null default false check (consent = true),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  approved_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.review_submissions enable row level security;
revoke all on public.review_submissions from anon, authenticated;
grant insert on public.review_submissions to anon, authenticated;
drop policy if exists "Public can submit genuine reviews" on public.review_submissions;
create policy "Public can submit genuine reviews" on public.review_submissions
for insert to anon, authenticated with check (status = 'pending' and consent = true);

create or replace view public.reviews_public as
select id, name, company, project, rating, review, approved_at
from public.review_submissions where status = 'approved';

grant select on public.reviews_public to anon, authenticated;

