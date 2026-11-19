-- Vague 1 de la présentation Pilote Fiscal : économies et météo fiscale (saisies par le cabinet, jamais
-- inventées), demandes de rendez-vous (le client demande, le cabinet confirme), documents à signer
-- (approbation horodatée et journalisée), liste de documents qui se coche toute seule.
alter table public.dossiers
  add column if not exists savings_cents integer check (savings_cents is null or savings_cents between 0 and 100000000),
  add column if not exists weather text check (weather is null or weather in ('degage', 'nuageux', 'orage')),
  add column if not exists weather_note text not null default '' check (char_length(weather_note) <= 200);

create table if not exists public.appointment_requests (
  id           uuid primary key default gen_random_uuid(),
  dossier_id   uuid not null references public.dossiers (id) on delete cascade,
  created_at   timestamptz not null default now(),
  preference   text not null default '' check (char_length(preference) <= 300),
  mode         text not null default 'bureau' check (mode in ('bureau', 'telephone', 'video')),
  status       text not null default 'demande' check (status in ('demande', 'confirme', 'annule')),
  confirmed_at timestamptz,
  staff_note   text not null default '' check (char_length(staff_note) <= 300)
);
create index if not exists appt_dossier_idx on public.appointment_requests (dossier_id);
alter table public.appointment_requests enable row level security;
create policy appt_staff on public.appointment_requests for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy appt_client_read on public.appointment_requests for select to authenticated using (public.owns_dossier(dossier_id));
create policy appt_client_add on public.appointment_requests for insert to authenticated
  with check (public.owns_dossier(dossier_id) and status = 'demande' and confirmed_at is null and staff_note = '');
revoke all on public.appointment_requests from anon;
grant select, insert, update, delete on public.appointment_requests to authenticated;

create table if not exists public.signatures (
  id          uuid primary key default gen_random_uuid(),
  dossier_id  uuid not null references public.dossiers (id) on delete cascade,
  created_at  timestamptz not null default now(),
  title       text not null check (char_length(title) between 1 and 200),
  body        text not null default '' check (char_length(body) <= 6000),
  status      text not null default 'a_signer' check (status in ('a_signer', 'signe', 'annule')),
  signed_at   timestamptz,
  signed_name text,
  signed_by   uuid
);
create index if not exists signatures_dossier_idx on public.signatures (dossier_id);
alter table public.signatures enable row level security;
create policy signatures_staff on public.signatures for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy signatures_client_read on public.signatures for select to authenticated
  using (public.owns_dossier(dossier_id) and status in ('a_signer', 'signe'));
revoke all on public.signatures from anon;
grant select, insert, update, delete on public.signatures to authenticated;

create or replace function public.sign_document(p_id uuid, p_name text) returns void
language plpgsql security definer set search_path = '' as $$
declare v_dossier uuid;
begin
  if char_length(btrim(coalesce(p_name, ''))) < 3 then raise exception 'name_required'; end if;
  select s.dossier_id into v_dossier from public.signatures s where s.id = p_id and s.status = 'a_signer';
  if v_dossier is null or not public.owns_dossier(v_dossier) then raise exception 'not_allowed'; end if;
  update public.signatures set status = 'signe', signed_at = now(), signed_name = left(btrim(p_name), 160), signed_by = auth.uid() where id = p_id;
  insert into public.activity (dossier_id, actor, actor_role, kind, detail)
  values (v_dossier, left(btrim(p_name), 160), 'client', 'signature', (select title from public.signatures where id = p_id));
end $$;
revoke all on function public.sign_document(uuid, text) from public, anon;
grant execute on function public.sign_document(uuid, text) to authenticated;

create or replace function public.tick_request() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.request_id is not null then
    update public.document_requests set received = true where id = new.request_id and dossier_id = new.dossier_id;
  end if;
  return new;
end $$;
revoke all on function public.tick_request() from public, anon, authenticated;
drop trigger if exists documents_tick on public.documents;
create trigger documents_tick after insert on public.documents for each row execute function public.tick_request();
