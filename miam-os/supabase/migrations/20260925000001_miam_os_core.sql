-- MIAM OS: core data model (Phase 9 §9.4)
-- Target: Supabase (PostgreSQL 15+). Card data is NEVER stored here: payments keep only the
-- certified provider's reference ids. Sales are recorded by the certified POS (Québec SRS);
-- MIAM OS mirrors them for operations, inventory, CRM and reporting.
--
-- Conventions: uuid PKs, timestamptz in UTC, money as numeric(10,2) CAD, every table has RLS on.

create extension if not exists pgcrypto;

-- ───────────────────────── Enums ─────────────────────────
create type app_role as enum ('owner','manager','cashier','kitchen','barista','expo','accountant');
create type sales_channel as enum ('dine_in','takeout','online_pickup','delivery_own','uber_eats','doordash','skip','glovo','catering');
create type order_status as enum ('open','sent','ready','completed','voided','refunded');
create type item_status as enum ('pending','fired','ready','served','voided');
create type pay_method as enum ('card','cash','gift_card','platform','invoice','other');
create type consent_channel as enum ('email','sms');
create type consent_type as enum ('express','implied');
create type stock_reason as enum ('sale','receiving','waste','count_adjustment','transfer','prep_in','prep_out');
create type waste_reason as enum ('expired','spoiled','overproduction','dropped','returned','staff_meal','comp','other');
create type integration_kind as enum ('official_api','connector','manual');
create type approval_kind as enum ('review_reply','social_post','purchase_order','schedule_change','refund','discount','price_change');
create type approval_status as enum ('pending','approved','rejected','expired');
create type alert_priority as enum ('urgent','today','fyi');
create type lead_stage as enum ('inquiry','quoted','deposit_paid','confirmed','completed','invoiced','lost');

-- ───────────────────────── Organisation & people ─────────────────────────
create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table locations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  street text, city text, region text, postal_code text, country text default 'CA',
  timezone text not null default 'America/Montreal',
  phone text, email text,
  gst_number text, qst_number text,
  seats int, terrace_seats int,
  targets jsonb not null default '{"food_cost_pct":29,"labor_cost_pct":30,"prime_cost_pct":60,"avg_ticket":24,"rating":4.7}',
  created_at timestamptz not null default now()
);

-- One row per person. auth_user_id links to Supabase Auth for full logins (owner/manager/accountant);
-- floor staff sign in on shared devices with a PIN (hashed with bcrypt via pgcrypto).
create table staff (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  auth_user_id uuid unique,
  first_name text not null, last_name text,
  email text, phone text,
  preferred_language text not null default 'fr' check (preferred_language in ('fr','en')),
  pin_hash text,
  hourly_rate numeric(8,2),
  hired_on date, active boolean not null default true,
  availability jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table staff_roles (
  staff_id uuid not null references staff(id) on delete cascade,
  location_id uuid not null references locations(id) on delete cascade,
  role app_role not null,
  primary key (staff_id, location_id, role)
);

-- Permission matrix (Phase 9 §9.2), data not code, so the owner can adjust it.
create table role_permissions (
  role app_role not null,
  permission text not null,
  primary key (role, permission)
);

create table certifications (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references staff(id) on delete cascade,
  kind text not null,                          -- e.g. 'MAPAQ food handler', 'first aid'
  issued_on date, expires_on date,
  document_path text                            -- storage bucket path
);

-- Shared devices (POS terminals, KDS screens, kiosk boards)
create table devices (
  id uuid primary key default gen_random_uuid(),
  location_id uuid not null references locations(id) on delete cascade,
  name text not null,
  kind text not null check (kind in ('pos','kds','expo','board','manager_tablet','time_clock')),
  station_id uuid,
  auth_user_id uuid unique,                    -- device account (one per device)
  last_seen_at timestamptz,
  revoked boolean not null default false
);

-- ───────────────────────── Access helpers (used by RLS) ─────────────────────────
-- Stub for local testing lives in tests/local_shim.sql; on Supabase, auth.uid() exists.
create or replace function current_staff_id() returns uuid
language sql stable security definer set search_path = public as $$
  select id from staff where auth_user_id = auth.uid() and active
$$;

create or replace function current_device_location() returns uuid
language sql stable security definer set search_path = public as $$
  select location_id from devices where auth_user_id = auth.uid() and not revoked
$$;

create or replace function has_loc_role(loc uuid, roles app_role[]) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from staff_roles sr join staff s on s.id = sr.staff_id
    where s.auth_user_id = auth.uid() and s.active and sr.location_id = loc and sr.role = any(roles))
$$;

-- Members = any role at the location, or a registered device of that location.
create or replace function is_loc_member(loc uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from staff_roles sr join staff s on s.id = sr.staff_id
                 where s.auth_user_id = auth.uid() and s.active and sr.location_id = loc)
      or current_device_location() = loc
$$;

create or replace function is_org_member(org uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from staff_roles sr join locations l on l.id = sr.location_id
                 join staff s on s.id = sr.staff_id
                 where s.auth_user_id = auth.uid() and s.active and l.org_id = org)
      or exists (select 1 from devices d join locations l on l.id = d.location_id
                 where d.auth_user_id = auth.uid() and not d.revoked and l.org_id = org)
$$;

create or replace function has_org_role(org uuid, roles app_role[]) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from staff_roles sr join locations l on l.id = sr.location_id
                 join staff s on s.id = sr.staff_id
                 where s.auth_user_id = auth.uid() and s.active and l.org_id = org and sr.role = any(roles))
$$;

create or replace function has_permission(loc uuid, perm text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from staff_roles sr join staff s on s.id = sr.staff_id
                 join role_permissions rp on rp.role = sr.role
                 where s.auth_user_id = auth.uid() and s.active and sr.location_id = loc and rp.permission = perm)
$$;

-- PIN check for shared devices: returns the staff id if the PIN matches someone with a role at the device's location.
create or replace function verify_staff_pin(pin text) returns uuid
language sql stable security definer set search_path = public as $$
  select s.id from staff s join staff_roles sr on sr.staff_id = s.id
  where sr.location_id = current_device_location() and s.active and s.pin_hash is not null
    and s.pin_hash = crypt(pin, s.pin_hash)
  limit 1
$$;

-- ───────────────────────── Audit log (every sensitive action) ─────────────────────────
create table audit_logs (
  id bigint generated always as identity primary key,
  location_id uuid references locations(id) on delete set null,
  actor_staff_id uuid references staff(id),
  actor_auth_id uuid default auth.uid(),
  device_id uuid references devices(id),
  action text not null,                        -- 'void','refund','discount','drawer_open','price_change','86', ...
  entity text not null, entity_id text,
  before jsonb, after jsonb,
  reason text,
  created_at timestamptz not null default now()
);

-- ───────────────────────── Menu (single source of truth) ─────────────────────────
create table categories (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  slug text not null,
  name_fr text not null, name_en text not null,
  note_fr text, note_en text,
  menu_group text,                             -- boissons, douceurs, plats, soir… (menu engineering groups)
  sort int not null default 0,
  unique (org_id, slug)
);

create table menu_items (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  category_id uuid not null references categories(id),
  slug text not null,                          -- stable id shared with data/menu.json, POS and platforms
  name_fr text not null, name_en text not null,
  desc_fr text, desc_en text,
  base_price numeric(10,2) not null check (base_price >= 0),
  allergens text[] not null default '{}',      -- gluten, milk, eggs, tree_nuts, peanuts, sesame, soy, fish, shellfish, mustard, sulphites
  tags text[] not null default '{}',           -- vegan, vegetarian, halal, signature, spicy_mild, modifier, combo...
  photo_path text,
  station_slug text,                           -- default KDS routing: kitchen | bar | pastry
  is_combo boolean not null default false,
  active boolean not null default true,
  sort int not null default 0,
  pos_external_id text,                        -- id in the certified POS
  updated_at timestamptz not null default now(),
  unique (org_id, slug)
);

create table combo_components (
  combo_id uuid not null references menu_items(id) on delete cascade,
  item_id uuid not null references menu_items(id),
  qty numeric(6,2) not null default 1,
  choice_group text,                           -- items sharing a group are alternatives
  primary key (combo_id, item_id)
);

create table modifier_groups (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  name_fr text not null, name_en text not null,
  min_select int not null default 0, max_select int not null default 1
);

create table modifiers (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references modifier_groups(id) on delete cascade,
  name_fr text not null, name_en text not null,
  price_delta numeric(10,2) not null default 0,
  linked_item_id uuid references menu_items(id),  -- e.g. "+halloumi" deducts the halloumi recipe
  allergens text[] not null default '{}',
  sort int not null default 0
);

create table item_modifier_groups (
  item_id uuid not null references menu_items(id) on delete cascade,
  group_id uuid not null references modifier_groups(id) on delete cascade,
  primary key (item_id, group_id)
);

create table dayparts (
  id uuid primary key default gen_random_uuid(),
  location_id uuid not null references locations(id) on delete cascade,
  slug text not null,                          -- matin, midi, aprem, soir
  name_fr text not null, name_en text not null,
  days int[] not null,                          -- ISO 1=Mon … 7=Sun
  starts time not null, ends time not null,
  unique (location_id, slug, days)
);

create table item_dayparts (
  item_id uuid not null references menu_items(id) on delete cascade,
  daypart_slug text not null,
  primary key (item_id, daypart_slug)
);

-- Per-location, per-channel price & availability (e.g. +15 % delivery; dine-in-only items)
create table item_channel_settings (
  item_id uuid not null references menu_items(id) on delete cascade,
  location_id uuid not null references locations(id) on delete cascade,
  channel sales_channel not null,
  price numeric(10,2),                         -- null = base_price
  available boolean not null default true,
  external_id text,                            -- id on the platform (via aggregator)
  primary key (item_id, location_id, channel)
);

-- "86": one row per sold-out item and location; hides it on every channel.
create table item_86 (
  item_id uuid not null references menu_items(id) on delete cascade,
  location_id uuid not null references locations(id) on delete cascade,
  sold_out boolean not null default true,
  until timestamptz,                           -- auto-return (e.g. tomorrow 06:00)
  set_by uuid references staff(id),
  set_at timestamptz not null default now(),
  primary key (item_id, location_id)
);

-- Outbox: every menu/86/price/store-status change queues a sync to website, screens, POS and platforms.
create table sync_outbox (
  id bigint generated always as identity primary key,
  location_id uuid references locations(id) on delete cascade,
  target text not null,                        -- website | screens | pos | aggregator | uber_eats | doordash | skip | glovo
  kind text not null,                          -- menu_publish | item_86 | price | store_status
  payload jsonb not null,
  status text not null default 'queued' check (status in ('queued','sent','failed','skipped')),
  attempts int not null default 0,
  last_error text,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

-- ───────────────────────── Floor, orders & payments ─────────────────────────
create table dining_tables (
  id uuid primary key default gen_random_uuid(),
  location_id uuid not null references locations(id) on delete cascade,
  label text not null, seats int not null,
  zone text not null default 'salle',          -- salle | ledge | terrasse
  pos_x int, pos_y int,                        -- table-map coordinates
  status text not null default 'free' check (status in ('free','seated','ordered','paying','dirty','reserved')),
  unique (location_id, label)
);

create table kitchen_stations (
  id uuid primary key default gen_random_uuid(),
  location_id uuid not null references locations(id) on delete cascade,
  slug text not null, name text not null,
  unique (location_id, slug)
);
alter table devices add constraint devices_station_fk foreign key (station_id) references kitchen_stations(id);

create table customers (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  first_name text, last_name text,
  email text, phone text,
  preferred_language text default 'fr',
  birthday date,
  allergies text[] not null default '{}',
  notes text,
  source text,                                 -- wifi, online_order, loyalty, reservation, catering
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz,
  deleted_at timestamptz,                      -- Law 25 deletion requests: anonymise then mark
  unique (org_id, email), unique (org_id, phone)
);

create table orders (
  id uuid primary key default gen_random_uuid(),
  location_id uuid not null references locations(id) on delete cascade,
  number int not null,                         -- daily ticket number shown on KDS / pickup screen
  channel sales_channel not null,
  status order_status not null default 'open',
  table_id uuid references dining_tables(id),
  customer_id uuid references customers(id),
  guest_count int,
  opened_by uuid references staff(id),
  external_ref text,                           -- POS sale id / platform order id
  pickup_name text, promised_at timestamptz,
  notes text,
  subtotal numeric(10,2) not null default 0,
  discount_total numeric(10,2) not null default 0,
  gst numeric(10,2) not null default 0,        -- 5 %
  qst numeric(10,2) not null default 0,        -- 9.975 %
  tip_total numeric(10,2) not null default 0,
  total numeric(10,2) not null default 0,
  platform_commission numeric(10,2) not null default 0,
  platform_fees numeric(10,2) not null default 0,
  promo_code text,
  utm jsonb,                                   -- campaign / QR placement attribution
  created_at timestamptz not null default now(),
  sent_at timestamptz, ready_at timestamptz, completed_at timestamptz,
  unique (location_id, channel, external_ref)
);
create index on orders (location_id, created_at);
create index on orders (customer_id);

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  item_id uuid not null references menu_items(id),
  qty numeric(6,2) not null default 1 check (qty > 0),
  unit_price numeric(10,2) not null,
  modifiers jsonb not null default '[]',       -- [{modifier_id, name_fr, price_delta}]
  notes text,
  allergy_alert boolean not null default false,
  seat int,
  station_id uuid references kitchen_stations(id),
  status item_status not null default 'pending',
  fired_at timestamptz, ready_at timestamptz, served_at timestamptz,
  voided_by uuid references staff(id), void_reason text
);
create index on order_items (order_id);
create index on order_items (station_id, status);

create table discounts_applied (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  order_item_id uuid references order_items(id) on delete cascade,
  kind text not null,                          -- promo_code | staff_meal | comp | loyalty_reward | manager
  amount numeric(10,2) not null,
  applied_by uuid references staff(id),
  reason text,
  created_at timestamptz not null default now()
);

create table promo_codes (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  code text not null,
  description text,
  pct_off numeric(5,2), amount_off numeric(10,2),
  channels sales_channel[] not null default '{online_pickup}',
  campaign text,                               -- links to ads / QR placement for ROI
  starts_at timestamptz, ends_at timestamptz,
  max_uses int, uses int not null default 0,
  unique (org_id, code)
);

-- Payment references only: never PAN, CVV or track data.
create table payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  method pay_method not null,
  amount numeric(10,2) not null,
  tip numeric(10,2) not null default 0,
  provider text,                               -- e.g. the certified POS / payment processor
  provider_payment_id text,
  card_brand text, card_last4 text check (card_last4 ~ '^[0-9]{4}$'),
  created_at timestamptz not null default now()
);

create table refunds (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references payments(id),
  amount numeric(10,2) not null,
  reason text not null,
  approved_by uuid references staff(id),
  provider_refund_id text,
  created_at timestamptz not null default now()
);

create table gift_cards (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  provider_ref text not null,                  -- balance of record lives with the POS provider
  last_known_balance numeric(10,2),
  customer_id uuid references customers(id),
  issued_at timestamptz not null default now()
);

-- ───────────────────────── Reservations, waitlist, events ─────────────────────────
create table reservations (
  id uuid primary key default gen_random_uuid(),
  location_id uuid not null references locations(id) on delete cascade,
  customer_id uuid references customers(id),
  name text not null, phone text, email text,
  party_size int not null check (party_size > 0),
  starts_at timestamptz not null,
  duration_min int not null default 90,
  table_id uuid references dining_tables(id),
  status text not null default 'booked' check (status in ('booked','confirmed','seated','completed','no_show','cancelled')),
  source text,                                 -- website, google, instagram, phone, libro
  external_ref text,
  deposit_amount numeric(10,2), deposit_payment_ref text,
  notes text, high_chair boolean default false,
  created_at timestamptz not null default now()
);
create index on reservations (location_id, starts_at);

create table waitlist_entries (
  id uuid primary key default gen_random_uuid(),
  location_id uuid not null references locations(id) on delete cascade,
  name text not null, phone text not null, party_size int not null,
  quoted_wait_min int,
  status text not null default 'waiting' check (status in ('waiting','notified','seated','left')),
  notified_at timestamptz, seated_at timestamptz,
  created_at timestamptz not null default now()
);

create table event_leads (
  id uuid primary key default gen_random_uuid(),
  location_id uuid not null references locations(id) on delete cascade,
  customer_id uuid references customers(id),
  company text, contact_name text not null, email text, phone text,
  event_type text,                             -- catering | private_event
  event_date date, guests int,
  stage lead_stage not null default 'inquiry',
  quote_amount numeric(10,2), deposit_amount numeric(10,2),
  event_sheet jsonb,                           -- menu, timings, allergies, delivery address
  invoice_id uuid,
  created_at timestamptz not null default now()
);

-- ───────────────────────── CRM, consent & loyalty ─────────────────────────
-- CASL: keep proof of consent (who, what, when, how). Law 25: purpose and source.
create table customer_consents (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id) on delete cascade,
  channel consent_channel not null,
  type consent_type not null,
  granted boolean not null,
  wording text not null,                       -- exact checkbox text shown
  source text not null,                        -- form / device / page
  ip inet,
  captured_at timestamptz not null default now(),
  expires_at timestamptz                       -- implied consent (purchase) expires after 2 years under CASL
);

create table loyalty_accounts (
  customer_id uuid primary key references customers(id) on delete cascade,
  points int not null default 0,
  tier text not null default 'soleil',         -- soleil | or (Phase 12)
  visits int not null default 0,
  lifetime_spend numeric(12,2) not null default 0,
  joined_at timestamptz not null default now()
);

create table loyalty_transactions (
  id bigint generated always as identity primary key,
  customer_id uuid not null references customers(id) on delete cascade,
  order_id uuid references orders(id),
  points int not null,                         -- + earn, − redeem
  reason text not null,                        -- purchase | reward | birthday | referral | adjustment
  created_at timestamptz not null default now()
);

create table feedback (
  id uuid primary key default gen_random_uuid(),
  location_id uuid not null references locations(id) on delete cascade,
  customer_id uuid references customers(id),
  order_id uuid references orders(id),
  source text not null,                        -- google | email | in_person | platform
  rating int check (rating between 1 and 5),
  body text,
  category text,                               -- food | service | wait | cleanliness | price | allergy
  status text not null default 'open' check (status in ('open','in_progress','resolved')),
  resolution text, resolved_by uuid references staff(id), resolved_at timestamptz,
  created_at timestamptz not null default now()
);

-- ───────────────────────── Inventory, recipes, purchasing ─────────────────────────
create table suppliers (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  name text not null, contact text, email text, phone text,
  order_days int[], lead_time_days int default 1, min_order numeric(10,2)
);

create table ingredients (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  unit text not null check (unit in ('g','ml','unit')),   -- base unit for recipes and stock
  purchase_unit text, units_per_purchase numeric(12,3),   -- e.g. case of 180 eggs → 180 unit
  cost_per_unit numeric(12,5) not null default 0,         -- CAD per base unit (updated on receiving)
  preferred_supplier_id uuid references suppliers(id),
  storage text,                                           -- walk-in, freezer, dry, bar
  allergens text[] not null default '{}',
  is_prep boolean not null default false,                 -- produced in-house (sauces, labneh)
  shelf_life_hours int,
  unique (org_id, name)
);

create table recipe_lines (
  id uuid primary key default gen_random_uuid(),
  item_id uuid references menu_items(id) on delete cascade,      -- menu item recipe
  prep_ingredient_id uuid references ingredients(id) on delete cascade, -- or a prep recipe (batch)
  ingredient_id uuid not null references ingredients(id),
  qty numeric(12,3) not null check (qty > 0),                   -- in ingredient base unit
  yield_pct numeric(5,2) not null default 100,                  -- trim loss
  check ((item_id is null) <> (prep_ingredient_id is null))
);

create table stock_levels (
  location_id uuid not null references locations(id) on delete cascade,
  ingredient_id uuid not null references ingredients(id) on delete cascade,
  on_hand numeric(14,3) not null default 0,
  par_level numeric(14,3),
  reorder_point numeric(14,3),
  primary key (location_id, ingredient_id)
);

create table stock_movements (
  id bigint generated always as identity primary key,
  location_id uuid not null references locations(id) on delete cascade,
  ingredient_id uuid not null references ingredients(id),
  qty numeric(14,3) not null,                  -- negative = out
  reason stock_reason not null,
  ref_id uuid,                                  -- order / PO / waste log / count
  unit_cost numeric(12,5),
  created_by uuid references staff(id),
  created_at timestamptz not null default now()
);
create index on stock_movements (location_id, ingredient_id, created_at);

create table purchase_orders (
  id uuid primary key default gen_random_uuid(),
  location_id uuid not null references locations(id) on delete cascade,
  supplier_id uuid not null references suppliers(id),
  status text not null default 'draft' check (status in ('draft','pending_approval','sent','partially_received','received','cancelled')),
  expected_on date,
  created_by uuid references staff(id), approved_by uuid references staff(id),
  total numeric(10,2),
  created_at timestamptz not null default now()
);

create table purchase_order_lines (
  id uuid primary key default gen_random_uuid(),
  po_id uuid not null references purchase_orders(id) on delete cascade,
  ingredient_id uuid not null references ingredients(id),
  qty_ordered numeric(14,3) not null,
  unit_cost_expected numeric(12,5),
  qty_received numeric(14,3),
  unit_cost_received numeric(12,5)             -- differs from expected → price-change alert
);

create table stock_counts (
  id uuid primary key default gen_random_uuid(),
  location_id uuid not null references locations(id) on delete cascade,
  counted_by uuid references staff(id),
  counted_at timestamptz not null default now(),
  status text not null default 'in_progress' check (status in ('in_progress','submitted','approved'))
);

create table stock_count_lines (
  count_id uuid not null references stock_counts(id) on delete cascade,
  ingredient_id uuid not null references ingredients(id),
  counted_qty numeric(14,3) not null,
  theoretical_qty numeric(14,3),
  primary key (count_id, ingredient_id)
);

create table waste_logs (
  id uuid primary key default gen_random_uuid(),
  location_id uuid not null references locations(id) on delete cascade,
  ingredient_id uuid references ingredients(id),
  item_id uuid references menu_items(id),
  qty numeric(14,3) not null,
  reason waste_reason not null,
  note text,
  logged_by uuid references staff(id),
  created_at timestamptz not null default now()
);

create table prep_batches (
  id uuid primary key default gen_random_uuid(),
  location_id uuid not null references locations(id) on delete cascade,
  ingredient_id uuid not null references ingredients(id),   -- the prep item (e.g. shakshuka sauce)
  qty numeric(14,3) not null,
  made_by uuid references staff(id),
  made_at timestamptz not null default now(),
  expires_at timestamptz not null,
  label_printed boolean not null default false,
  discarded_at timestamptz
);

-- ───────────────────────── Staff operations ─────────────────────────
create table shifts (
  id uuid primary key default gen_random_uuid(),
  location_id uuid not null references locations(id) on delete cascade,
  staff_id uuid references staff(id) on delete set null,     -- null = open shift
  role app_role not null,
  starts_at timestamptz not null, ends_at timestamptz not null,
  break_min int not null default 30,
  published boolean not null default false,
  notes text,
  check (ends_at > starts_at)
);

create table shift_swaps (
  id uuid primary key default gen_random_uuid(),
  shift_id uuid not null references shifts(id) on delete cascade,
  from_staff uuid not null references staff(id), to_staff uuid references staff(id),
  status text not null default 'requested' check (status in ('requested','accepted','approved','rejected')),
  created_at timestamptz not null default now()
);

create table time_entries (
  id uuid primary key default gen_random_uuid(),
  location_id uuid not null references locations(id) on delete cascade,
  staff_id uuid not null references staff(id),
  shift_id uuid references shifts(id),
  clock_in timestamptz not null, clock_out timestamptz,
  break_min int not null default 0,
  device_id uuid references devices(id),
  edited_by uuid references staff(id), edit_reason text
);

create table tip_pools (
  id uuid primary key default gen_random_uuid(),
  location_id uuid not null references locations(id) on delete cascade,
  business_date date not null,
  total_tips numeric(10,2) not null,
  rule jsonb not null default '{"basis":"hours","floor_share":0.7,"kitchen_share":0.3}',
  status text not null default 'draft' check (status in ('draft','approved','paid')),
  unique (location_id, business_date)
);

create table tip_distributions (
  pool_id uuid not null references tip_pools(id) on delete cascade,
  staff_id uuid not null references staff(id),
  hours numeric(6,2), amount numeric(10,2) not null,
  primary key (pool_id, staff_id)
);

create table tasks (
  id uuid primary key default gen_random_uuid(),
  location_id uuid not null references locations(id) on delete cascade,
  title text not null, details text,
  assigned_to uuid references staff(id), role app_role,
  due_at timestamptz, done_at timestamptz, done_by uuid references staff(id),
  created_by uuid references staff(id),
  created_at timestamptz not null default now()
);

create table announcements (
  id uuid primary key default gen_random_uuid(),
  location_id uuid not null references locations(id) on delete cascade,
  body_fr text not null, body_en text,
  pinned boolean not null default false,
  created_by uuid references staff(id),
  created_at timestamptz not null default now()
);

create table training_records (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references staff(id) on delete cascade,
  module text not null,                        -- sop_opening, menu_quiz_brunch, allergen_training…
  score int, passed boolean,
  completed_at timestamptz not null default now()
);

-- ───────────────────────── Finance & closing ─────────────────────────
create table drawer_sessions (
  id uuid primary key default gen_random_uuid(),
  location_id uuid not null references locations(id) on delete cascade,
  device_id uuid references devices(id),
  opened_by uuid references staff(id), opened_at timestamptz not null default now(),
  opening_float numeric(10,2) not null,
  closed_by uuid references staff(id), closed_at timestamptz,
  counted_cash numeric(10,2), expected_cash numeric(10,2),
  variance numeric(10,2) generated always as (counted_cash - expected_cash) stored
);

create table daily_closings (
  id uuid primary key default gen_random_uuid(),
  location_id uuid not null references locations(id) on delete cascade,
  business_date date not null,
  summary jsonb not null,                      -- sales by channel/method, taxes, tips, voids, discounts, covers
  closed_by uuid references staff(id),
  closed_at timestamptz not null default now(),
  unique (location_id, business_date)
);

create table expenses (
  id uuid primary key default gen_random_uuid(),
  location_id uuid not null references locations(id) on delete cascade,
  category text not null,                      -- rent, utilities, marketing, packaging, repairs, software…
  vendor text, amount numeric(10,2) not null, gst numeric(10,2) default 0, qst numeric(10,2) default 0,
  spent_on date not null,
  receipt_path text,
  entered_by uuid references staff(id),
  exported_at timestamptz                      -- to QuickBooks / Xero
);

create table invoices (
  id uuid primary key default gen_random_uuid(),
  location_id uuid not null references locations(id) on delete cascade,
  direction text not null check (direction in ('payable','receivable')),
  counterparty text not null,
  supplier_id uuid references suppliers(id),
  event_lead_id uuid references event_leads(id),
  number text, issued_on date, due_on date,
  subtotal numeric(10,2), gst numeric(10,2), qst numeric(10,2), total numeric(10,2),
  status text not null default 'open' check (status in ('open','paid','void')),
  file_path text
);
alter table event_leads add constraint event_leads_invoice_fk foreign key (invoice_id) references invoices(id);

-- ───────────────────────── Food safety & compliance ─────────────────────────
create table equipment (
  id uuid primary key default gen_random_uuid(),
  location_id uuid not null references locations(id) on delete cascade,
  name text not null,
  kind text not null,                          -- fridge, freezer, hot_holding, espresso, oven, hood
  min_temp numeric(5,1), max_temp numeric(5,1),
  service_interval_days int, last_serviced_on date
);

create table temperature_logs (
  id bigint generated always as identity primary key,
  equipment_id uuid not null references equipment(id) on delete cascade,
  temp_c numeric(5,1) not null,
  out_of_range boolean not null default false,
  corrective_action text,
  logged_by uuid references staff(id),
  source text not null default 'manual' check (source in ('manual','sensor')),
  logged_at timestamptz not null default now()
);

create table checklists (
  id uuid primary key default gen_random_uuid(),
  location_id uuid not null references locations(id) on delete cascade,
  name text not null,                          -- Ouverture, Fermeture, Nettoyage hebdo…
  kind text not null check (kind in ('opening','closing','cleaning','haccp','other')),
  items jsonb not null                         -- [{label_fr,label_en,required}]
);

create table checklist_runs (
  id uuid primary key default gen_random_uuid(),
  checklist_id uuid not null references checklists(id) on delete cascade,
  business_date date not null,
  results jsonb not null default '[]',
  completed_by uuid references staff(id), completed_at timestamptz
);

create table compliance_records (
  id uuid primary key default gen_random_uuid(),
  location_id uuid not null references locations(id) on delete cascade,
  kind text not null,                          -- pest_control, mapaq_inspection, hood_cleaning, fire_extinguisher, permit
  performed_on date not null, next_due_on date,
  vendor text, notes text, file_path text
);

-- ───────────────────────── Ecosystem command centre ─────────────────────────
create table integrations (
  id uuid primary key default gen_random_uuid(),
  location_id uuid not null references locations(id) on delete cascade,
  provider text not null,                      -- pos, aggregator, uber_eats, doordash, skip, glovo, google_business, meta, ga4, libro, klaviyo, twilio, quickbooks, payroll
  kind integration_kind not null,
  needs_platform_approval boolean not null default false,
  status text not null default 'not_connected' check (status in ('not_connected','pending_approval','connected','error','disabled')),
  config jsonb not null default '{}',          -- non-secret settings only; secrets live in Supabase Vault
  last_sync_at timestamptz, last_error text,
  unique (location_id, provider)
);

-- Raw webhook inbox (idempotent): platform/aggregator/POS events land here first.
create table integration_events (
  id bigint generated always as identity primary key,
  location_id uuid references locations(id) on delete cascade,
  provider text not null,
  event_type text not null,
  external_id text not null,
  payload jsonb not null,
  processed_at timestamptz, error text,
  received_at timestamptz not null default now(),
  unique (provider, event_type, external_id)
);

create table platform_store_status (
  location_id uuid not null references locations(id) on delete cascade,
  channel sales_channel not null,
  state text not null check (state in ('open','closed','busy','paused')),
  paused_until timestamptz,
  rating numeric(3,2), rating_count int,
  prep_time_min int,
  updated_at timestamptz not null default now(),
  primary key (location_id, channel)
);

create table reviews (
  id uuid primary key default gen_random_uuid(),
  location_id uuid not null references locations(id) on delete cascade,
  source text not null,                        -- google, uber_eats, doordash, yelp, tripadvisor
  external_id text not null,
  author text, rating int, body text, language text,
  published_at timestamptz,
  draft_reply text, reply text, replied_at timestamptz, replied_by uuid references staff(id),
  unique (source, external_id)
);

create table social_posts (
  id uuid primary key default gen_random_uuid(),
  location_id uuid not null references locations(id) on delete cascade,
  platform text not null,                      -- instagram, facebook, tiktok, google
  format text,                                 -- reel, carousel, story, post
  scheduled_at timestamptz, published_at timestamptz,
  caption_fr text, caption_en text, media_paths text[],
  status text not null default 'draft' check (status in ('draft','pending_approval','scheduled','published','failed')),
  metrics jsonb
);

create table ad_campaign_daily (
  location_id uuid not null references locations(id) on delete cascade,
  platform text not null default 'meta',
  campaign_id text not null, campaign_name text,
  day date not null,
  spend numeric(10,2), impressions int, clicks int, results int, result_type text,
  attributed_revenue numeric(10,2),
  primary key (location_id, platform, campaign_id, day)
);

create table approvals (
  id uuid primary key default gen_random_uuid(),
  location_id uuid not null references locations(id) on delete cascade,
  kind approval_kind not null,
  entity_id uuid,
  summary text not null,
  payload jsonb,
  requested_by uuid references staff(id),
  status approval_status not null default 'pending',
  decided_by uuid references staff(id), decided_at timestamptz,
  created_at timestamptz not null default now()
);

create table alerts (
  id bigint generated always as identity primary key,
  location_id uuid not null references locations(id) on delete cascade,
  kind text not null,                          -- low_stock, high_voids, labor_over, negative_review, temperature, sales_below_forecast, ads_cpa, price_increase
  priority alert_priority not null,
  title text not null, body text, entity_id text,
  acknowledged_by uuid references staff(id), acknowledged_at timestamptz,
  created_at timestamptz not null default now()
);

create table sales_forecasts (
  location_id uuid not null references locations(id) on delete cascade,
  day date not null, hour int not null check (hour between 0 and 23),
  expected_sales numeric(10,2) not null, expected_covers int,
  primary key (location_id, day, hour)
);
