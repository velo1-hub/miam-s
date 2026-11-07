-- Idya Auto — schema (brief §16 with the Phase 0 C4 corrections, docs/phase-0-plan.md).
--
-- C4.1  vin / price_cad / body_type / condition / odometer_km are nullable so autosaved drafts can
--       exist; a CHECK enforces them as soon as status <> 'draft'. VIN is text (length 17) with a
--       unique partial index instead of char(17) unique not null.
-- C4.2  `trim` is renamed `trim_level` (the API field stays `trim`).
-- C4.3  `demo boolean` on vehicles (§28.1) and a gin(features) index for the feature filters.
-- C4.4  ai_usage_daily (daily AI budget, §27.1) and search_cache (§27.2, A10).
-- C4.5  test_drive_bookings: index on starts_at and unique (vehicle_id, starts_at, lead_id).
--
-- Deviation from §16: chat_sessions.id is text, not uuid. The assistant generates an opaque
-- session id in the browser (components/assistant/assistant-context.tsx, `s-…`, ≤ 64 chars) that is
-- sent with every message; the table stores it as is.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------------------------
create type vehicle_status    as enum ('draft','available','pending','sold','archived');
create type vehicle_condition as enum ('new','used','certified');
create type body_type         as enum ('suv','sedan','truck','coupe','hatchback','wagon','minivan','convertible','van');
create type drivetrain        as enum ('fwd','rwd','awd','4wd');
create type transmission      as enum ('automatic','manual','cvt','dct');
create type fuel_type         as enum ('gasoline','hybrid','plug_in_hybrid','electric','diesel');
create type warranty_class    as enum ('A','B','C','D');
create type media_kind        as enum ('spin','interior','gallery','panorama');
create type lead_type         as enum ('test_drive','question','financing','trade_in','contact','inventory_alert');
create type lead_status       as enum ('new','contacted','qualified','won','lost','spam');
create type staff_role        as enum ('owner','manager','sales');

-- ---------------------------------------------------------------------------------------------
-- Vehicles
-- ---------------------------------------------------------------------------------------------
create table vehicles (
  id                       uuid primary key default gen_random_uuid(),
  slug                     text unique not null,
  stock_number             text unique not null,
  vin                      text check (vin is null or length(vin) = 17),            -- C4.1
  status                   vehicle_status not null default 'draft',
  condition                vehicle_condition,                                        -- C4.1
  year                     smallint not null,
  make                     text not null,
  model                    text not null,
  trim_level               text,                                                     -- C4.2
  body_type                body_type,                                                -- C4.1
  drivetrain               drivetrain,
  transmission             transmission,
  fuel_type                fuel_type,
  engine                   text,
  horsepower               smallint,
  electric_range_km        smallint,
  odometer_km              integer check (odometer_km is null or odometer_km >= 0),  -- C4.1
  exterior_color           text,
  exterior_color_hex       char(7),
  interior_color           text,
  doors                    smallint,
  seats                    smallint,
  -- all-in price, taxes excluded, whole dollars (§17.1)
  price_cad                integer check (price_cad is null or price_cad > 0),       -- C4.1
  previous_price_cad       integer,
  description_fr           text not null default '',
  description_en           text,
  features                 text[] not null default '{}',
  carfax_url               text,
  accident_free            boolean,
  owners_count             smallint,
  warranty_class           warranty_class,
  manufacturer_warranty_fr text,
  manufacturer_warranty_en text,
  featured                 boolean not null default false,
  demo                     boolean not null default false,                           -- C4.3
  -- 360° spin set (§9): frame layout lives in columns, delivery details in spin_meta
  spin_frame_count         smallint check (spin_frame_count is null or spin_frame_count in (24, 36, 48, 72)),
  spin_cover_frame         smallint not null default 0,
  spin_reverse             boolean not null default false,
  spin_version             integer not null default 1,
  -- { "sizes": ["sm","md","lg","xl"], "formats": ["avif","webp"], "lqip": "data:…", "width": 1600, "height": 900 }
  spin_meta                jsonb,
  published_at             timestamptz,
  sold_at                  timestamptz,
  search tsvector generated always as (
    to_tsvector('simple',
      coalesce(make, '') || ' ' || coalesce(model, '') || ' ' || coalesce(trim_level, '') || ' ' ||
      coalesce(year::text, '') || ' ' || coalesce(exterior_color, '') || ' ' ||
      stock_number || ' ' || coalesce(vin, ''))
  ) stored,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  -- C4.1: publish validation at the database level (admin validates before, this is the backstop)
  constraint vehicles_publish_requirements check (
    status = 'draft'
    or (vin is not null and price_cad is not null and body_type is not null and condition is not null and odometer_km is not null)
  )
);

create unique index vehicles_vin_key          on vehicles (vin) where vin is not null;        -- C4.1
create index vehicles_status_published_idx    on vehicles (status, published_at desc);
create index vehicles_make_model_idx          on vehicles (make, model);
create index vehicles_price_idx               on vehicles (price_cad);
create index vehicles_odometer_idx            on vehicles (odometer_km);
create index vehicles_search_idx              on vehicles using gin (search);
create index vehicles_features_idx            on vehicles using gin (features);                 -- C4.3

create table vehicle_media (
  id         uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references vehicles on delete cascade,
  kind       media_kind not null,
  position   smallint not null,
  -- object path inside the public `vehicles` bucket, e.g. vehicles/{id}/gallery/v1/md/01.webp
  path       text not null,
  width      int,
  height     int,
  lqip       text,
  alt_fr     text,
  alt_en     text,
  unique (vehicle_id, kind, position)
);
create index vehicle_media_vehicle_idx on vehicle_media (vehicle_id);

-- ---------------------------------------------------------------------------------------------
-- Leads, bookings, notes (§12, §13, §15)
-- ---------------------------------------------------------------------------------------------
create table leads (
  id                uuid primary key default gen_random_uuid(),
  type              lead_type not null,
  status            lead_status not null default 'new',
  vehicle_id        uuid references vehicles on delete set null,
  first_name        text,
  last_name         text,
  email             text,
  phone             text,
  locale            text not null default 'fr' check (locale in ('fr', 'en')),
  preferred_contact text check (preferred_contact is null or preferred_contact in ('email', 'phone', 'sms')),
  message           text,
  payload           jsonb not null default '{}',
  consent_text      text not null,
  consent_at        timestamptz not null,
  assigned_to       uuid references auth.users,
  utm               jsonb,
  created_at        timestamptz not null default now()
);
create index leads_created_idx  on leads (created_at desc);
create index leads_status_idx   on leads (status);
create index leads_type_idx     on leads (type);
create index leads_vehicle_idx  on leads (vehicle_id);

create table test_drive_bookings (
  id         uuid primary key default gen_random_uuid(),
  lead_id    uuid not null references leads on delete cascade,
  vehicle_id uuid references vehicles on delete set null,
  starts_at  timestamptz not null,
  status     text not null default 'new' check (status in ('new','confirmed','completed','cancelled','no_show')),
  created_at timestamptz not null default now(),
  -- C4.5: one booking per lead per slot per vehicle (nulls treated as equal for vehicle-less slots)
  unique nulls not distinct (vehicle_id, starts_at, lead_id)
);
create index test_drive_bookings_starts_idx on test_drive_bookings (starts_at);                -- C4.5
create index test_drive_bookings_lead_idx   on test_drive_bookings (lead_id);

create table lead_notes (
  id         uuid primary key default gen_random_uuid(),
  lead_id    uuid references leads on delete cascade,
  author     uuid references auth.users,
  body       text not null,
  created_at timestamptz default now()
);
create index lead_notes_lead_idx on lead_notes (lead_id);

-- ---------------------------------------------------------------------------------------------
-- Staff, closures, settings, audit
-- ---------------------------------------------------------------------------------------------
create table staff (
  user_id   uuid primary key references auth.users on delete cascade,
  role      staff_role not null,
  full_name text
);

create table closures (
  day    date primary key,
  reason text
);

create table settings (
  id   int primary key default 1 check (id = 1),
  data jsonb not null
);

create table audit_log (
  id         bigserial primary key,
  actor      uuid,
  table_name text,
  row_id     uuid,
  action     text,
  diff       jsonb,
  created_at timestamptz default now()
);
create index audit_log_row_idx on audit_log (table_name, row_id);

-- ---------------------------------------------------------------------------------------------
-- Intelligence layer (§27)
-- ---------------------------------------------------------------------------------------------
create table chat_sessions (
  id              text primary key check (length(id) between 8 and 64),  -- see header note
  locale          text not null default 'fr' check (locale in ('fr', 'en')),
  page_url        text,
  vehicle_id      uuid references vehicles on delete set null,
  lead_id         uuid references leads on delete set null,
  started_at      timestamptz not null default now(),
  last_message_at timestamptz,
  message_count   int not null default 0
);
create index chat_sessions_last_message_idx on chat_sessions (last_message_at desc nulls last);

create table chat_messages (
  id         bigserial primary key,
  session_id text not null references chat_sessions on delete cascade,
  role       text not null check (role in ('user','assistant','tool')),
  content    jsonb not null,
  tokens_in  int,
  tokens_out int,
  created_at timestamptz not null default now()
);
create index chat_messages_session_idx on chat_messages (session_id, created_at);
create index chat_messages_created_idx on chat_messages (created_at);

-- Leads created from the assistant keep a pointer to the transcript (lib/leads/types.ts chatSessionId)
alter table leads add column chat_session_id text references chat_sessions on delete set null;

create table knowledge_base (
  id          uuid primary key default gen_random_uuid(),
  question_fr text not null,
  answer_fr   text not null,
  question_en text,
  answer_en   text,
  active      boolean not null default true,
  updated_at  timestamptz not null default now()
);

create table lead_ai (
  lead_id              uuid primary key references leads on delete cascade,
  summary              text,
  intent               text check (intent in ('hot','warm','cold')),
  score                smallint,
  reasons              text[],
  vehicles_of_interest text[],
  suggested_reply_fr   text,
  suggested_reply_en   text,
  model                text,
  created_at           timestamptz not null default now()
);

-- C4.4: hard daily AI budget (§27.1) — one row per UTC day, written by the service role only
create table ai_usage_daily (
  day   date primary key,
  usd   numeric(10, 4) not null default 0,
  calls int not null default 0
);

-- C4.4: natural-language search cache (§27.2) — identical queries are cached 24 h
create table search_cache (
  query_key  text primary key,
  result     jsonb not null,
  created_at timestamptz not null default now()
);
create index search_cache_created_idx on search_cache (created_at);

-- ---------------------------------------------------------------------------------------------
-- Functions and triggers (§16 "Triggers")
-- ---------------------------------------------------------------------------------------------

-- updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

create trigger vehicles_set_updated_at
  before update on vehicles
  for each row execute function public.set_updated_at();

create trigger knowledge_base_set_updated_at
  before update on knowledge_base
  for each row execute function public.set_updated_at();

-- sold_at is stamped the first time a vehicle becomes 'sold' (the 60-day public window starts here)
create or replace function public.vehicles_set_sold_at()
returns trigger language plpgsql as $$
begin
  if new.status = 'sold' and (old.status is distinct from 'sold') then
    new.sold_at := coalesce(new.sold_at, now());
  end if;
  return new;
end $$;

create trigger vehicles_set_sold_at
  before update of status on vehicles
  for each row execute function public.vehicles_set_sold_at();

-- audit log on price / status changes; actor = auth.uid() (null for the service role).
-- security definer so the insert works for staff even though audit_log has no insert policy.
create or replace function public.vehicles_audit()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  changes jsonb := '{}'::jsonb;
begin
  if new.price_cad is distinct from old.price_cad then
    changes := changes || jsonb_build_object('price_cad', jsonb_build_object('from', old.price_cad, 'to', new.price_cad));
  end if;
  if new.status is distinct from old.status then
    changes := changes || jsonb_build_object('status', jsonb_build_object('from', old.status, 'to', new.status));
  end if;
  if changes <> '{}'::jsonb then
    insert into audit_log (actor, table_name, row_id, action, diff)
    values (auth.uid(), 'vehicles', new.id, 'update', changes);
  end if;
  return new;
end $$;

create trigger vehicles_audit
  after update of price_cad, status on vehicles
  for each row execute function public.vehicles_audit();

-- chat session counters are maintained by the database so appends stay a single insert
create or replace function public.chat_messages_bump_session()
returns trigger language plpgsql as $$
begin
  update chat_sessions
     set last_message_at = new.created_at,
         message_count   = message_count + (case when new.role <> 'tool' then 1 else 0 end)
   where id = new.session_id;
  return new;
end $$;

create trigger chat_messages_bump_session
  after insert on chat_messages
  for each row execute function public.chat_messages_bump_session();

-- atomic increment of the daily AI spend (lib/ai/budget.ts); returns the day's new totals
create or replace function public.record_ai_usage(p_day date, p_usd numeric, p_calls int)
returns setof ai_usage_daily
language sql as $$
  insert into ai_usage_daily as a (day, usd, calls)
  values (p_day, p_usd, p_calls)
  on conflict (day) do update
    set usd = a.usd + excluded.usd,
        calls = a.calls + excluded.calls
  returning a.day, a.usd, a.calls;
$$;
