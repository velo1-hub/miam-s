-- Vague 2 : questionnaire annuel (chaque « oui » ajoute un document à la liste du client) et avis privé de fin de dossier.
-- Les libellés ci-dessous sont repris dans lib/questionnaire.ts ; cette fonction fait foi.
create table if not exists public.questionnaires (
  id           uuid primary key default gen_random_uuid(),
  dossier_id   uuid not null unique references public.dossiers (id) on delete cascade,
  submitted_at timestamptz not null default now(),
  answers      jsonb not null default '{}'::jsonb check (pg_column_size(answers) < 8000),
  note         text not null default '' check (char_length(note) <= 1000)
);
alter table public.questionnaires enable row level security;
create policy questionnaires_staff on public.questionnaires for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy questionnaires_client_read on public.questionnaires for select to authenticated using (public.owns_dossier(dossier_id));
revoke all on public.questionnaires from anon;
grant select, insert, update, delete on public.questionnaires to authenticated;

create or replace function public.submit_questionnaire(p_dossier uuid, p_answers jsonb, p_note text) returns integer
language plpgsql security definer set search_path = '' as $$
declare
  v_added integer := 0;
  v_key text;
  v_label text;
  v_map constant jsonb := '{
    "emploi": "Feuillets T4 et Relevé 1 de chaque employeur",
    "autonome": "Revenus et dépenses de travail autonome, avec les reçus",
    "pension": "Feuillets de pension et de retraite (T4A, T4A(P), T4A(OAS), Relevé 2)",
    "placements": "Feuillets de placements (T5, T3, Relevés 3 et 16)",
    "locatif": "Revenus et dépenses de location, avec les reçus",
    "garde": "Reçus de frais de garde (Relevé 24)",
    "etudes": "Frais de scolarité (T2202 et Relevé 8)",
    "medicaux": "Reçus de frais médicaux",
    "achat_maison": "Acte d''achat et état des débours du notaire",
    "vente_immeuble": "Documents de la vente de l''immeuble",
    "demenagement": "Reçus de frais de déménagement",
    "teletravail": "Formulaires T2200 et TP-64.3 signés par l''employeur",
    "reer": "Reçus de cotisations REER",
    "celiapp": "Feuillet du CELIAPP (T4FHSA)",
    "dons": "Reçus de dons de bienfaisance",
    "etranger": "Relevés des biens ou des revenus à l''étranger"
  }'::jsonb;
begin
  if not public.owns_dossier(p_dossier) then raise exception 'not_allowed'; end if;
  if jsonb_typeof(coalesce(p_answers, '{}'::jsonb)) <> 'object' then raise exception 'bad_answers'; end if;
  insert into public.questionnaires (dossier_id, answers, note)
  values (p_dossier, p_answers, left(coalesce(p_note, ''), 1000))
  on conflict (dossier_id) do update set answers = excluded.answers, note = excluded.note, submitted_at = now();
  for v_key, v_label in select key, value from jsonb_each_text(v_map) loop
    if coalesce(p_answers ->> v_key, '') = 'true'
       and not exists (select 1 from public.document_requests r where r.dossier_id = p_dossier and r.label = v_label) then
      insert into public.document_requests (dossier_id, label) values (p_dossier, v_label);
      v_added := v_added + 1;
    end if;
  end loop;
  insert into public.activity (dossier_id, actor, actor_role, kind, detail)
  values (p_dossier, public.jwt_email(), 'client', 'questionnaire', v_added || ' document(s) ajouté(s) à la liste');
  return v_added;
end $$;
revoke all on function public.submit_questionnaire(uuid, jsonb, text) from public, anon;
grant execute on function public.submit_questionnaire(uuid, jsonb, text) to authenticated;

create table if not exists public.feedback (
  id         uuid primary key default gen_random_uuid(),
  dossier_id uuid not null unique references public.dossiers (id) on delete cascade,
  created_at timestamptz not null default now(),
  rating     smallint not null check (rating between 1 and 5),
  comment    text not null default '' check (char_length(comment) <= 1500)
);
alter table public.feedback enable row level security;
create policy feedback_staff_read on public.feedback for select to authenticated using (public.is_staff());
create policy feedback_client_read on public.feedback for select to authenticated using (public.owns_dossier(dossier_id));
create policy feedback_client_add on public.feedback for insert to authenticated with check (public.owns_dossier(dossier_id));
revoke all on public.feedback from anon;
grant select, insert on public.feedback to authenticated;
