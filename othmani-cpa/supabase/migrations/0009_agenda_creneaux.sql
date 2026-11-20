-- Agenda : un rendez-vous confirmé a un responsable et une durée ; le client peut indiquer une date souhaitée.
alter table public.appointment_requests
  add column if not exists assignee text not null default '' check (char_length(assignee) <= 200),
  add column if not exists duration_min integer not null default 30 check (duration_min between 15 and 240),
  add column if not exists wished_date date,
  add column if not exists wished_part text check (wished_part is null or wished_part in ('matin', 'apres_midi', 'indifferent'));
create index if not exists appt_confirmed_idx on public.appointment_requests (confirmed_at) where status = 'confirme';
-- Le client ne choisit ni le responsable ni la durée : ces champs restent à leur valeur par défaut à la création.
drop policy if exists appt_client_add on public.appointment_requests;
create policy appt_client_add on public.appointment_requests for insert to authenticated
  with check (public.owns_dossier(dossier_id) and status = 'demande' and confirmed_at is null and staff_note = '' and assignee = '' and duration_min = 30);
