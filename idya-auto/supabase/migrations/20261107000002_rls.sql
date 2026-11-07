-- Idya Auto — row level security and storage (brief §16 "RLS policies").
--
-- Anonymous visitors: read published vehicles and their media. Nothing else.
-- Leads, bookings and chat rows are inserted by Server Actions / route handlers with the service
-- role (after Turnstile verification); the service role bypasses RLS, so no insert policy exists.
-- Staff (rows in `staff`): read everything; `sales` update leads and bookings; `manager` / `owner`
-- manage vehicles, media, settings, closures and the knowledge base; only `owner` manages staff
-- and deletes. Chat and AI tables are staff-read-only.

-- ---------------------------------------------------------------------------------------------
-- Role helpers (security definer so the `staff` lookup works even though `staff` itself is
-- protected by RLS). Stable: evaluated once per statement.
-- ---------------------------------------------------------------------------------------------
create or replace function public.staff_role()
returns staff_role
language sql stable security definer set search_path = public as $$
  select role from public.staff where user_id = auth.uid();
$$;

create or replace function public.is_staff()
returns boolean language sql stable as $$
  select public.staff_role() is not null;
$$;

create or replace function public.is_manager()
returns boolean language sql stable as $$
  select public.staff_role() in ('manager', 'owner');
$$;

create or replace function public.is_owner()
returns boolean language sql stable as $$
  select public.staff_role() = 'owner';
$$;

revoke all on function public.staff_role() from public;
grant execute on function public.staff_role() to anon, authenticated, service_role;
grant execute on function public.is_staff(), public.is_manager(), public.is_owner() to anon, authenticated, service_role;

-- record_ai_usage is service-role only (lib/ai/budget.ts)
revoke all on function public.record_ai_usage(date, numeric, int) from public, anon, authenticated;
grant execute on function public.record_ai_usage(date, numeric, int) to service_role;

-- ---------------------------------------------------------------------------------------------
-- Enable RLS everywhere
-- ---------------------------------------------------------------------------------------------
alter table vehicles            enable row level security;
alter table vehicle_media       enable row level security;
alter table leads               enable row level security;
alter table test_drive_bookings enable row level security;
alter table lead_notes          enable row level security;
alter table staff               enable row level security;
alter table closures            enable row level security;
alter table settings            enable row level security;
alter table audit_log           enable row level security;
alter table chat_sessions       enable row level security;
alter table chat_messages       enable row level security;
alter table knowledge_base      enable row level security;
alter table lead_ai             enable row level security;
alter table ai_usage_daily      enable row level security;
alter table search_cache        enable row level security;

-- ---------------------------------------------------------------------------------------------
-- Vehicles and media
-- ---------------------------------------------------------------------------------------------
-- Anonymous (and any signed-in visitor): published vehicles only. The 60-day window for sold
-- vehicles is applied by the repository (lib/vehicles/types.ts isPubliclyVisible).
create policy "vehicles: public read of published rows" on vehicles
  for select to anon, authenticated
  using (status in ('available', 'pending', 'sold') and published_at is not null and published_at <= now());

create policy "vehicles: staff read all" on vehicles
  for select to authenticated using (public.is_staff());

create policy "vehicles: manager insert" on vehicles
  for insert to authenticated with check (public.is_manager());

create policy "vehicles: manager update" on vehicles
  for update to authenticated using (public.is_manager()) with check (public.is_manager());

create policy "vehicles: owner delete" on vehicles
  for delete to authenticated using (public.is_owner());

create policy "vehicle_media: public read of visible vehicles" on vehicle_media
  for select to anon, authenticated
  using (exists (
    select 1 from vehicles v
    where v.id = vehicle_media.vehicle_id
      and v.status in ('available', 'pending', 'sold')
      and v.published_at is not null and v.published_at <= now()
  ));

create policy "vehicle_media: staff read all" on vehicle_media
  for select to authenticated using (public.is_staff());

create policy "vehicle_media: manager insert" on vehicle_media
  for insert to authenticated with check (public.is_manager());

create policy "vehicle_media: manager update" on vehicle_media
  for update to authenticated using (public.is_manager()) with check (public.is_manager());

create policy "vehicle_media: owner delete" on vehicle_media
  for delete to authenticated using (public.is_owner());

-- ---------------------------------------------------------------------------------------------
-- Leads, bookings, notes, AI briefs — no anonymous access
-- ---------------------------------------------------------------------------------------------
create policy "leads: staff read" on leads
  for select to authenticated using (public.is_staff());

create policy "leads: staff update" on leads
  for update to authenticated using (public.is_staff()) with check (public.is_staff());

create policy "leads: owner delete" on leads
  for delete to authenticated using (public.is_owner());

create policy "bookings: staff read" on test_drive_bookings
  for select to authenticated using (public.is_staff());

create policy "bookings: staff update" on test_drive_bookings
  for update to authenticated using (public.is_staff()) with check (public.is_staff());

create policy "bookings: owner delete" on test_drive_bookings
  for delete to authenticated using (public.is_owner());

create policy "lead_notes: staff read" on lead_notes
  for select to authenticated using (public.is_staff());

create policy "lead_notes: staff insert own" on lead_notes
  for insert to authenticated with check (public.is_staff() and author = auth.uid());

create policy "lead_notes: owner delete" on lead_notes
  for delete to authenticated using (public.is_owner());

create policy "lead_ai: staff read" on lead_ai
  for select to authenticated using (public.is_staff());

-- ---------------------------------------------------------------------------------------------
-- Staff, closures, settings, knowledge base, audit
-- ---------------------------------------------------------------------------------------------
create policy "staff: staff read" on staff
  for select to authenticated using (public.is_staff());

create policy "staff: owner insert" on staff
  for insert to authenticated with check (public.is_owner());

create policy "staff: owner update" on staff
  for update to authenticated using (public.is_owner()) with check (public.is_owner());

create policy "staff: owner delete" on staff
  for delete to authenticated using (public.is_owner());

create policy "closures: staff read" on closures
  for select to authenticated using (public.is_staff());

create policy "closures: manager insert" on closures
  for insert to authenticated with check (public.is_manager());

create policy "closures: manager update" on closures
  for update to authenticated using (public.is_manager()) with check (public.is_manager());

create policy "closures: owner delete" on closures
  for delete to authenticated using (public.is_owner());

create policy "settings: staff read" on settings
  for select to authenticated using (public.is_staff());

create policy "settings: manager insert" on settings
  for insert to authenticated with check (public.is_manager());

create policy "settings: manager update" on settings
  for update to authenticated using (public.is_manager()) with check (public.is_manager());

create policy "knowledge_base: staff read" on knowledge_base
  for select to authenticated using (public.is_staff());

create policy "knowledge_base: manager insert" on knowledge_base
  for insert to authenticated with check (public.is_manager());

create policy "knowledge_base: manager update" on knowledge_base
  for update to authenticated using (public.is_manager()) with check (public.is_manager());

create policy "knowledge_base: owner delete" on knowledge_base
  for delete to authenticated using (public.is_owner());

-- audit_log rows are written by the security-definer trigger only
create policy "audit_log: staff read" on audit_log
  for select to authenticated using (public.is_staff());

-- ---------------------------------------------------------------------------------------------
-- Chat and AI tables: staff-read-only, writes through the service role (§16 comment)
-- ---------------------------------------------------------------------------------------------
create policy "chat_sessions: staff read" on chat_sessions
  for select to authenticated using (public.is_staff());

create policy "chat_messages: staff read" on chat_messages
  for select to authenticated using (public.is_staff());

create policy "ai_usage_daily: staff read" on ai_usage_daily
  for select to authenticated using (public.is_staff());

create policy "search_cache: staff read" on search_cache
  for select to authenticated using (public.is_staff());

-- ---------------------------------------------------------------------------------------------
-- Storage (§10.2): `originals` private (staff resumable uploads), `vehicles` and `demo` public
-- ---------------------------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('originals', 'originals', false, 52428800, array['image/jpeg', 'image/png', 'image/webp', 'image/heic']),
  ('vehicles',  'vehicles',  true,  26214400, array['image/avif', 'image/webp', 'image/jpeg', 'image/png']),
  ('demo',      'demo',      true,  104857600, null)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- originals: staff upload (insert + update for resumable/TUS uploads) and read; owner deletes
create policy "originals: staff read" on storage.objects
  for select to authenticated using (bucket_id = 'originals' and public.is_staff());

create policy "originals: staff upload" on storage.objects
  for insert to authenticated with check (bucket_id = 'originals' and public.is_staff());

create policy "originals: staff update" on storage.objects
  for update to authenticated
  using (bucket_id = 'originals' and public.is_staff())
  with check (bucket_id = 'originals' and public.is_staff());

create policy "originals: owner delete" on storage.objects
  for delete to authenticated using (bucket_id = 'originals' and public.is_owner());

-- vehicles / demo: public read; processed files are written by the service role (route handler),
-- managers may also replace or remove them from the admin
create policy "vehicles bucket: public read" on storage.objects
  for select to anon, authenticated using (bucket_id in ('vehicles', 'demo'));

create policy "vehicles bucket: manager write" on storage.objects
  for insert to authenticated with check (bucket_id in ('vehicles', 'demo') and public.is_manager());

create policy "vehicles bucket: manager update" on storage.objects
  for update to authenticated
  using (bucket_id in ('vehicles', 'demo') and public.is_manager())
  with check (bucket_id in ('vehicles', 'demo') and public.is_manager());

create policy "vehicles bucket: owner delete" on storage.objects
  for delete to authenticated using (bucket_id in ('vehicles', 'demo') and public.is_owner());
