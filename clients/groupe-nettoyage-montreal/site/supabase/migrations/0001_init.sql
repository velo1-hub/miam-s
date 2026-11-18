-- Groupe Nettoyage Montréal · core tables. Service role only; no anon access.
create extension if not exists pgcrypto;
create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  locale text not null check (locale in ('fr','en')),
  type text not null check (type in ('quote','contact','career','assistant','booking')),
  name text not null, email text not null, phone text, message text,
  service text, segment text, source text,
  quote jsonb, meta jsonb,
  status text not null default 'new' check (status in ('new','contacted','won','lost'))
);
create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  ref text not null unique,
  created_at timestamptz not null default now(),
  lead_id uuid references leads(id),
  locale text not null check (locale in ('fr','en')),
  kind text not null check (kind in ('cleaning','walkthrough')),
  service text not null,
  date date not null, slot_start text not null, slot_end text not null,
  name text not null, email text not null, phone text not null, address text not null, notes text,
  price_min numeric, price_max numeric, quote jsonb,
  status text not null default 'confirmed' check (status in ('confirmed','cancelled','completed'))
);
create index if not exists bookings_date_idx on bookings(date, kind, slot_start) where status = 'confirmed';
create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  author text not null, rating int not null check (rating between 1 and 5),
  text text not null, source text not null default 'google', date date not null,
  locale text not null default 'both', url text, published boolean not null default false
);
create table if not exists pricing_rules (
  id text primary key default 'default', rules jsonb not null, updated_at timestamptz not null default now()
);
alter table leads enable row level security;
alter table bookings enable row level security;
alter table reviews enable row level security;
alter table pricing_rules enable row level security;
-- No policies: only the service role (server) reads and writes. Add policies when the client portal ships.
