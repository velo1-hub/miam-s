-- Durcissement après audit de sécurité.
-- Réglages à faire aussi dans Supabase → Authentication : Confirm email ON, Secure email change ON,
-- connexions anonymes OFF, téléphone OFF, expiration du code ≤ 10 minutes.

-- Le courriel vient du compte vérifié (auth.users), plus du jeton.
create or replace function public.jwt_email() returns text
language sql stable security definer set search_path = '' as $$
  select coalesce((select lower(u.email) from auth.users u
    where u.id = auth.uid() and u.email_confirmed_at is not null
      and coalesce(u.is_anonymous, false) = false), '')
$$;
revoke all on function public.jwt_email() from public, anon;
grant execute on function public.jwt_email() to authenticated;
alter table public.staff add constraint staff_email_format check (email ~ '^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$');
alter table public.dossiers add constraint dossiers_email_format check (client_email ~ '^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$');

-- Seul un administrateur gère l'équipe.
alter table public.staff add column if not exists is_admin boolean not null default false;
update public.staff set is_admin = true where email = 'zouhaier@othmanicpa.com';
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.staff s where s.email = public.jwt_email() and s.is_admin)
$$;
revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;
drop policy if exists staff_manage on public.staff;
drop policy if exists staff_remove on public.staff;
create policy staff_manage on public.staff for insert to authenticated with check (public.is_admin() and not is_admin);
create policy staff_remove on public.staff for delete to authenticated using (public.is_admin() and email <> public.jwt_email());

-- Un client ne peut plus choisir la date, l'identifiant ni le nom affiché de ses envois.
create or replace function public.stamp_row() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  new.id := gen_random_uuid();
  new.created_at := now();
  if not public.is_staff() and tg_table_name = 'messages' then
    new.author_name := coalesce((select d.client_name from public.dossiers d where d.id = new.dossier_id), '');
  end if;
  return new;
end $$;
revoke all on function public.stamp_row() from public, anon, authenticated;
drop trigger if exists messages_stamp on public.messages;
create trigger messages_stamp before insert on public.messages for each row execute function public.stamp_row();
drop trigger if exists documents_stamp on public.documents;
create trigger documents_stamp before insert on public.documents for each row execute function public.stamp_row();

-- Fonctions publiques : courriel strict, limite par personne insensible au format du téléphone,
-- plafond global en simple coupe-circuit, pas de réinscription forcée.
create or replace function public.submit_lead(
  p_source text, p_lang text, p_name text, p_email text, p_phone text,
  p_audience text, p_topic text, p_message text
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_id uuid;
  v_email text := nullif(lower(btrim(coalesce(p_email, ''))), '');
  v_phone text := nullif(btrim(coalesce(p_phone, '')), '');
  v_digits text := regexp_replace(coalesce(p_phone, ''), '\D', '', 'g');
begin
  if btrim(coalesce(p_name, '')) = '' then raise exception 'name_required'; end if;
  if v_email is null and v_phone is null then raise exception 'contact_required'; end if;
  if v_email is not null and v_email !~ '^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$' then raise exception 'email_invalid'; end if;
  if (select count(*) from leads where created_at > now() - interval '10 minutes') >= 600 then
    raise exception 'rate_limited';
  end if;
  if (select count(*) from leads
      where created_at > now() - interval '1 hour'
        and ((v_email is not null and email = v_email)
          or (v_digits <> '' and right(regexp_replace(coalesce(phone, ''), '\D', '', 'g'), 10) = right(v_digits, 10)))) >= 4 then
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

create or replace function public.subscribe_reminder(p_email text, p_lang text) returns void
language plpgsql security definer set search_path = public as $$
declare v_email text := lower(btrim(coalesce(p_email, '')));
begin
  if v_email !~ '^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$' or char_length(v_email) > 200 then raise exception 'email_invalid'; end if;
  if (select count(*) from reminder_subscribers where consent_at > now() - interval '10 minutes') >= 600 then
    raise exception 'rate_limited';
  end if;
  insert into reminder_subscribers (email, lang) values (v_email, case when p_lang = 'en' then 'en' else 'fr' end)
  on conflict (email) do nothing; -- une personne désinscrite ne peut pas être réinscrite par un tiers
end $$;
