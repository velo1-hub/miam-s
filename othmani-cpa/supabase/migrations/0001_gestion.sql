-- Othmani CPA : système de gestion (demandes, rappels, dossiers, documents, messages).
-- Base Supabase (Postgres), région Canada. Tout est fermé par défaut (RLS) :
--   * le public ne peut QUE déposer une demande ou s'inscrire aux rappels, par deux fonctions ;
--   * l'équipe (table staff) voit et gère tout ;
--   * un client ne voit que les dossiers liés à son courriel (vérifié par lien de connexion).

create extension if not exists pgcrypto;

-- ───────────────────────── Équipe ─────────────────────────
create table if not exists public.staff (
  email      text primary key check (email = lower(email)),
  name       text not null default '',
  created_at timestamptz not null default now()
);
alter table public.staff enable row level security;

create or replace function public.jwt_email() returns text
language sql stable as $$ select lower(coalesce(auth.jwt() ->> 'email', '')) $$;

create or replace function public.is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.staff s where s.email = public.jwt_email())
$$;

create policy staff_read on public.staff for select to authenticated using (public.is_staff());

-- ───────────────────────── Demandes (leads) ─────────────────────────
create table if not exists public.leads (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  source      text not null check (source in ('contact', 'clara', 'telephone', 'autre')),
  lang        text not null default 'fr' check (lang in ('fr', 'en')),
  name        text not null check (char_length(name) between 1 and 120),
  email       text check (email is null or char_length(email) <= 200),
  phone       text check (phone is null or char_length(phone) <= 40),
  audience    text check (audience is null or audience in ('moi', 'entreprise')),
  topic       text check (topic is null or char_length(topic) <= 120),
  message     text not null default '' check (char_length(message) <= 4000),
  status      text not null default 'nouveau'
              check (status in ('nouveau', 'contacte', 'rdv_a_confirmer', 'client', 'ferme')),
  notes       text not null default '',
  consent_at  timestamptz not null default now(),
  check (email is not null or phone is not null)
);
create index if not exists leads_created_idx on public.leads (created_at desc);
alter table public.leads enable row level security;
create policy leads_staff on public.leads for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

-- Dépôt public d'une demande : seule porte d'entrée, avec limites anti-abus.
create or replace function public.submit_lead(
  p_source text, p_lang text, p_name text, p_email text, p_phone text,
  p_audience text, p_topic text, p_message text
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_id uuid;
  v_email text := nullif(lower(btrim(coalesce(p_email, ''))), '');
  v_phone text := nullif(btrim(coalesce(p_phone, '')), '');
begin
  if btrim(coalesce(p_name, '')) = '' then raise exception 'name_required'; end if;
  if v_email is null and v_phone is null then raise exception 'contact_required'; end if;
  if v_email is not null and v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'email_invalid'; end if;
  if (select count(*) from leads where created_at > now() - interval '10 minutes') >= 40 then
    raise exception 'rate_limited';
  end if;
  if (select count(*) from leads
      where created_at > now() - interval '1 hour'
        and ((v_email is not null and email = v_email) or (v_phone is not null and phone = v_phone))) >= 4 then
    raise exception 'rate_limited';
  end if;
  insert into leads (source, lang, name, email, phone, audience, topic, message)
  values (
    case when p_source in ('contact', 'clara') then p_source else 'autre' end,
    case when p_lang = 'en' then 'en' else 'fr' end,
    left(btrim(p_name), 120), v_email, left(v_phone, 40),
    case when p_audience in ('moi', 'entreprise') then p_audience else null end,
    nullif(left(btrim(coalesce(p_topic, '')), 120), ''),
    left(coalesce(p_message, ''), 4000)
  ) returning id into v_id;
  return v_id;
end $$;
revoke all on function public.submit_lead(text, text, text, text, text, text, text, text) from public;
grant execute on function public.submit_lead(text, text, text, text, text, text, text, text) to anon, authenticated;

-- ───────────────────────── Rappels fiscaux ─────────────────────────
create table if not exists public.reminder_subscribers (
  id              uuid primary key default gen_random_uuid(),
  email           text not null unique check (char_length(email) <= 200),
  lang            text not null default 'fr' check (lang in ('fr', 'en')),
  consent_at      timestamptz not null default now(),
  unsubscribed_at timestamptz
);
alter table public.reminder_subscribers enable row level security;
create policy reminders_staff on public.reminder_subscribers for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

create or replace function public.subscribe_reminder(p_email text, p_lang text) returns void
language plpgsql security definer set search_path = public as $$
declare v_email text := lower(btrim(coalesce(p_email, '')));
begin
  if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' or char_length(v_email) > 200 then raise exception 'email_invalid'; end if;
  if (select count(*) from reminder_subscribers where consent_at > now() - interval '10 minutes') >= 40 then
    raise exception 'rate_limited';
  end if;
  insert into reminder_subscribers (email, lang) values (v_email, case when p_lang = 'en' then 'en' else 'fr' end)
  on conflict (email) do update set unsubscribed_at = null, consent_at = now(), lang = excluded.lang;
end $$;
revoke all on function public.subscribe_reminder(text, text) from public;
grant execute on function public.subscribe_reminder(text, text) to anon, authenticated;

-- ───────────────────────── Dossiers ─────────────────────────
create table if not exists public.dossiers (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  client_email text not null check (client_email = lower(client_email) and char_length(client_email) <= 200),
  client_name  text not null check (char_length(client_name) between 1 and 160),
  title        text not null check (char_length(title) between 1 and 160),
  kind         text not null default 'impot_particulier'
               check (kind in ('impot_particulier', 'travailleur_autonome', 'impot_societe', 'taxes',
                               'etats_financiers', 'tenue_de_livres', 'lettre_fisc', 'autre')),
  tax_year     int check (tax_year is null or tax_year between 2000 and 2100),
  status       text not null default 'ouvert'
               check (status in ('ouvert', 'documents_attendus', 'en_preparation', 'en_revision',
                                 'a_signer', 'transmis', 'ferme')),
  next_step    text not null default '' check (char_length(next_step) <= 500), -- visible par le client
  due_date     date,
  lead_id      uuid references public.leads (id) on delete set null
);
create index if not exists dossiers_client_idx on public.dossiers (client_email);
alter table public.dossiers enable row level security;
create policy dossiers_staff on public.dossiers for all to authenticated
  using (public.is_staff()) with check (public.is_staff());
create policy dossiers_client_read on public.dossiers for select to authenticated
  using (client_email = public.jwt_email());

create or replace function public.owns_dossier(p_dossier uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.dossiers d where d.id = p_dossier and d.client_email = public.jwt_email())
$$;

-- Notes internes : jamais visibles par le client.
create table if not exists public.dossier_notes (
  id         uuid primary key default gen_random_uuid(),
  dossier_id uuid not null references public.dossiers (id) on delete cascade,
  created_at timestamptz not null default now(),
  author     text not null default '',
  body       text not null check (char_length(body) between 1 and 4000)
);
alter table public.dossier_notes enable row level security;
create policy notes_staff on public.dossier_notes for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

-- Documents demandés au client (liste à cocher).
create table if not exists public.document_requests (
  id         uuid primary key default gen_random_uuid(),
  dossier_id uuid not null references public.dossiers (id) on delete cascade,
  created_at timestamptz not null default now(),
  label      text not null check (char_length(label) between 1 and 200),
  received   boolean not null default false
);
create index if not exists docreq_dossier_idx on public.document_requests (dossier_id);
alter table public.document_requests enable row level security;
create policy docreq_staff on public.document_requests for all to authenticated
  using (public.is_staff()) with check (public.is_staff());
create policy docreq_client_read on public.document_requests for select to authenticated
  using (public.owns_dossier(dossier_id));

-- Documents déposés (le fichier est dans le stockage privé « documents »).
create table if not exists public.documents (
  id            uuid primary key default gen_random_uuid(),
  dossier_id    uuid not null references public.dossiers (id) on delete cascade,
  created_at    timestamptz not null default now(),
  uploaded_by   uuid not null default auth.uid(),
  uploader_role text not null check (uploader_role in ('client', 'cabinet')),
  path          text not null unique,
  name          text not null check (char_length(name) between 1 and 200),
  size          bigint not null default 0 check (size >= 0)
);
create index if not exists documents_dossier_idx on public.documents (dossier_id, created_at desc);
alter table public.documents enable row level security;
create policy documents_staff on public.documents for all to authenticated
  using (public.is_staff()) with check (public.is_staff());
create policy documents_client_read on public.documents for select to authenticated
  using (public.owns_dossier(dossier_id));
create policy documents_client_add on public.documents for insert to authenticated
  with check (public.owns_dossier(dossier_id) and uploader_role = 'client' and uploaded_by = auth.uid()
              and path like dossier_id::text || '/%');

-- Messages entre le client et le cabinet.
create table if not exists public.messages (
  id          uuid primary key default gen_random_uuid(),
  dossier_id  uuid not null references public.dossiers (id) on delete cascade,
  created_at  timestamptz not null default now(),
  author_id   uuid not null default auth.uid(),
  author_role text not null check (author_role in ('client', 'cabinet')),
  author_name text not null default '' check (char_length(author_name) <= 160),
  body        text not null check (char_length(body) between 1 and 4000)
);
create index if not exists messages_dossier_idx on public.messages (dossier_id, created_at);
alter table public.messages enable row level security;
create policy messages_staff on public.messages for all to authenticated
  using (public.is_staff()) with check (public.is_staff());
create policy messages_client_read on public.messages for select to authenticated
  using (public.owns_dossier(dossier_id));
create policy messages_client_add on public.messages for insert to authenticated
  with check (public.owns_dossier(dossier_id) and author_role = 'client' and author_id = auth.uid());

-- updated_at automatique
create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$ begin new.updated_at := now(); return new; end $$;
drop trigger if exists leads_touch on public.leads;
create trigger leads_touch before update on public.leads for each row execute function public.touch_updated_at();
drop trigger if exists dossiers_touch on public.dossiers;
create trigger dossiers_touch before update on public.dossiers for each row execute function public.touch_updated_at();

-- ───────────────────────── Droits de base ─────────────────────────
revoke all on all tables in schema public from anon;
grant select, insert, update, delete on all tables in schema public to authenticated; -- filtré par les politiques RLS
grant execute on function public.is_staff(), public.jwt_email(), public.owns_dossier(uuid) to authenticated;

-- ───────────────────────── Stockage privé des documents ─────────────────────────
-- Chemin d'un fichier : <id du dossier>/<nom unique>. 25 Mo max, types courants seulement.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('documents', 'documents', false, 26214400,
        array['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/heic',
              'text/csv', 'application/vnd.ms-excel',
              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
on conflict (id) do nothing;

create or replace function public.path_dossier(p_name text) returns uuid
language plpgsql immutable as $$
begin return split_part(p_name, '/', 1)::uuid; exception when others then return null; end $$;

create policy docs_storage_staff on storage.objects for all to authenticated
  using (bucket_id = 'documents' and public.is_staff())
  with check (bucket_id = 'documents' and public.is_staff());
create policy docs_storage_client_read on storage.objects for select to authenticated
  using (bucket_id = 'documents' and public.owns_dossier(public.path_dossier(name)));
create policy docs_storage_client_add on storage.objects for insert to authenticated
  with check (bucket_id = 'documents' and public.owns_dossier(public.path_dossier(name)));

-- ───────────────────────── À faire une fois, à la main ─────────────────────────
-- Ajouter les membres de l'équipe autorisés à ouvrir /gestion :
--   insert into public.staff (email, name) values ('zouhaier@othmanicpa.com', 'Zouhaier Othmani');
