-- Pro Fer Forgé: virtual assistant backend (leads, dossiers, appointments, quote drafts).
-- All tables are private: no anonymous access. The assistant Edge Function uses the service role;
-- the staff dashboard signs in with Supabase Auth and is limited by the policies below.
create extension if not exists pgcrypto;

-- ---------- Staff (who may open the dashboard) ----------
create table staff_users (
  auth_user_id uuid primary key,
  email text not null unique,
  role text not null default 'staff' check (role in ('owner', 'staff')),
  created_at timestamptz not null default now()
);
create or replace function is_staff() returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from staff_users where auth_user_id = auth.uid())
$$;

-- ---------- Settings & rate card (owner-editable; prices are NEVER invented) ----------
create table settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);
insert into settings (key, value) values
  ('business', jsonb_build_object(
     'name', 'Pro Fer Forgé', 'timezone', 'America/Montreal', 'minimum_project', 3000,
     'quote_valid_days', 30, 'visit_minutes', 60, 'booking_lead_hours', 24, 'booking_horizon_days', 21,
     'response_time_text_fr', 'dès que possible', 'response_time_text_en', 'as soon as possible',
     'rbq', null, 'warranty_fr', null, 'warranty_en', null,
     'payment_terms_fr', null, 'payment_terms_en', null, 'owner_email', 'info@proferforge.ca',
     'gst_rate', 0.05, 'qst_rate', 0.09975));

create table rate_card (
  key text primary key,
  label_fr text not null,
  label_en text not null,
  unit text not null check (unit in ('unit', 'linear_m', 'storey', 'hour', 'lump_sum')),
  unit_price numeric(10,2) check (unit_price is null or unit_price >= 0),  -- null = owner has not set a price yet
  applies_to text not null check (applies_to in ('paint', 'weld', 'other')),
  structure_type text,
  active boolean not null default true
);
insert into rate_card (key, label_fr, label_en, unit, applies_to, structure_type) values
  ('paint_balcony',        'Peinture de balcon en fer forgé',            'Wrought-iron balcony painting',            'unit',     'paint', 'balcony'),
  ('paint_service_stair',  'Peinture d’escalier de service',             'Service stair painting',                   'storey',   'paint', 'service_stair'),
  ('paint_spiral',         'Peinture d’escalier en colimaçon',           'Spiral staircase painting',                'unit',     'paint', 'spiral'),
  ('paint_facade_stair',   'Peinture d’escalier de façade',              'Front-façade stair painting',              'unit',     'paint', 'facade_stair'),
  ('paint_railing',        'Peinture de garde-corps / rampe',            'Railing / handrail painting',              'linear_m', 'paint', 'railing'),
  ('paint_fence',          'Peinture de clôture',                        'Fence painting',                           'linear_m', 'paint', 'fence'),
  ('weld_hour',            'Soudure de restauration (taux horaire)',     'Restoration welding (hourly rate)',        'hour',     'weld',  null),
  ('weld_material',        'Matériaux de soudure et pièces',             'Welding materials and parts',              'lump_sum', 'weld',  null),
  ('site_protection',      'Protection des lieux et mobilisation',       'Site protection and mobilisation',         'lump_sum', 'other', null);

-- ---------- Availability for site visits ----------
create table availability_rules (
  id bigserial primary key,
  weekday int not null check (weekday between 0 and 6),   -- 0 = Sunday
  start_time time not null,
  end_time time not null check (end_time > start_time),
  active boolean not null default true
);
create table availability_blackouts (
  day date primary key,
  note text
);
-- No rules are inserted: the owner must set real hours first (see TODO.md). Until then the assistant offers
-- "we will confirm a time with you" instead of inventing slots.

-- ---------- Leads & dossiers ----------
create table leads (
  id uuid primary key default gen_random_uuid(),
  session_id text not null unique check (length(session_id) between 16 and 80),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  lang text not null default 'fr' check (lang in ('fr', 'en')),
  status text not null default 'qualifying' check (status in
    ('qualifying', 'qualified', 'visit_booked', 'quote_drafted', 'quote_sent', 'won', 'lost', 'spam')),
  contact_name text,
  phone text,
  email text,
  client_type text,
  dossier jsonb not null default '{}'::jsonb,
  temperature text not null default 'unscored' check (temperature in ('hot', 'warm', 'cold', 'unscored')),
  score int check (score between 0 and 100),
  score_reasons jsonb not null default '[]'::jsonb,
  flags jsonb not null default '[]'::jsonb,
  summary text,
  suggestions jsonb not null default '[]'::jsonb,
  visit_questions jsonb not null default '[]'::jsonb,
  needs_human boolean not null default false,
  consent_at timestamptz,
  source jsonb not null default '{}'::jsonb,
  last_message_at timestamptz,
  owner_notified_at timestamptz,
  owner_notes text
);
create index leads_temperature_idx on leads (temperature, score desc);
create index leads_status_idx on leads (status, updated_at desc);
create index leads_phone_idx on leads (phone) where phone is not null;
create index leads_email_idx on leads (lower(email)) where email is not null;

create table conversation_messages (
  id bigserial primary key,
  lead_id uuid not null references leads(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content jsonb not null,                 -- stored exactly as exchanged with the model (append-only)
  display_text text,                      -- plain text shown in the chat / dashboard
  created_at timestamptz not null default now()
);
create index conversation_messages_lead_idx on conversation_messages (lead_id, id);

create table lead_events (
  id bigserial primary key,
  lead_id uuid not null references leads(id) on delete cascade,
  type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index lead_events_lead_idx on lead_events (lead_id, id desc);

-- ---------- Appointments ----------
create table appointments (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null check (ends_at > starts_at),
  kind text not null default 'visit' check (kind in ('visit', 'call')),
  address text,
  status text not null default 'requested' check (status in ('requested', 'confirmed', 'cancelled', 'done')),
  notes text,
  created_at timestamptz not null default now()
);
-- One crew: a time slot can be held by only one live appointment (prevents double booking under concurrency).
create unique index appointments_one_per_slot on appointments (starts_at) where status in ('requested', 'confirmed');
create index appointments_lead_idx on appointments (lead_id);

-- ---------- Quote drafts (brouillons de soumission) ----------
create table quote_drafts (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads(id) on delete cascade,
  version int not null default 1,
  status text not null default 'draft' check (status in ('draft', 'reviewed', 'sent')),
  lang text not null default 'fr',
  data jsonb not null,                    -- lines, totals, scope, assumptions, exclusions, warnings
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (lead_id, version)
);

-- ---------- updated_at ----------
create or replace function touch_updated_at() returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end $$;
create trigger leads_touch before update on leads for each row execute function touch_updated_at();
create trigger quote_drafts_touch before update on quote_drafts for each row execute function touch_updated_at();
create trigger settings_touch before update on settings for each row execute function touch_updated_at();

-- ---------- Row-level security ----------
alter table staff_users enable row level security;
alter table settings enable row level security;
alter table rate_card enable row level security;
alter table availability_rules enable row level security;
alter table availability_blackouts enable row level security;
alter table leads enable row level security;
alter table conversation_messages enable row level security;
alter table lead_events enable row level security;
alter table appointments enable row level security;
alter table quote_drafts enable row level security;

-- Staff can do everything on business data. Nobody else (anon included) can read or write anything.
create policy staff_all on settings             for all to authenticated using (is_staff()) with check (is_staff());
create policy staff_all on rate_card            for all to authenticated using (is_staff()) with check (is_staff());
create policy staff_all on availability_rules   for all to authenticated using (is_staff()) with check (is_staff());
create policy staff_all on availability_blackouts for all to authenticated using (is_staff()) with check (is_staff());
create policy staff_all on leads                for all to authenticated using (is_staff()) with check (is_staff());
create policy staff_read on conversation_messages for select to authenticated using (is_staff());
create policy staff_read on lead_events         for select to authenticated using (is_staff());
create policy staff_all on appointments         for all to authenticated using (is_staff()) with check (is_staff());
create policy staff_all on quote_drafts         for all to authenticated using (is_staff()) with check (is_staff());
-- staff_users: a signed-in user may only see their own row; rows are managed by the owner via SQL / service role.
create policy self_read on staff_users for select to authenticated using (auth_user_id = auth.uid());

-- Dashboard convenience view (respects the caller's RLS).
create view lead_overview with (security_invoker = true) as
select l.id, l.created_at, l.updated_at, l.last_message_at, l.lang, l.status, l.temperature, l.score,
       l.contact_name, l.phone, l.email, l.client_type, l.needs_human,
       l.dossier #>> '{site,city}' as city, l.dossier #>> '{project,work_type}' as work_type,
       (select min(a.starts_at) from appointments a where a.lead_id = l.id and a.status in ('requested', 'confirmed') and a.starts_at > now()) as next_visit,
       exists (select 1 from quote_drafts q where q.lead_id = l.id) as has_quote
from leads l;

-- Defence in depth: revoke default privileges from the public-facing roles.
revoke all on all tables in schema public from anon;
revoke execute on function is_staff() from anon;
