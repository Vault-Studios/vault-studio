create table if not exists public.booking_submissions (
  id uuid primary key,
  name text not null check (char_length(name) between 2 and 120),
  company text not null default '' check (char_length(company) <= 160),
  email text not null check (char_length(email) between 5 and 200),
  phone text not null default '' check (char_length(phone) <= 80),
  service text not null check (char_length(service) between 2 and 120),
  preferred_date date,
  location text not null default '' check (char_length(location) <= 200),
  brief text not null check (char_length(brief) between 10 and 4000),
  status text not null default 'new',
  created_at timestamptz not null default now()
);

create index if not exists booking_submissions_created_at_idx
on public.booking_submissions (created_at desc);

create index if not exists booking_submissions_status_idx
on public.booking_submissions (status);

alter table public.booking_submissions enable row level security;

revoke all on table public.booking_submissions from anon, authenticated;
grant insert on table public.booking_submissions to anon, authenticated;

drop policy if exists "Public can submit booking enquiries" on public.booking_submissions;
create policy "Public can submit booking enquiries"
on public.booking_submissions
for insert
to anon, authenticated
with check (status = 'new');
