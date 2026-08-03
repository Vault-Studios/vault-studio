create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  name text not null, company text not null default '', email text not null,
  phone text not null default '', service text not null, preferred_date date,
  location text not null default '', brief text not null,
  status text not null default 'new', created_at timestamptz not null default now()
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(), name text not null,
  company text not null default '', email text not null, project text not null,
  rating smallint not null check (rating between 1 and 5), review text not null,
  consent boolean not null check (consent = true),
  status text not null default 'pending', approved_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.availability (
  id text primary key default 'studio', status text not null default 'available',
  message_en text not null, message_local text not null,
  next_available_date date, updated_at timestamptz not null default now()
);

alter table public.bookings enable row level security;
alter table public.reviews enable row level security;
alter table public.availability enable row level security;

-- Add narrowly scoped INSERT policies for public forms and a SELECT policy only
-- for availability. Publish approved reviews through a view that excludes email.
