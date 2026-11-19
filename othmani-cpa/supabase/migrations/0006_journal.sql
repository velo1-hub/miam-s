-- Journal d'activité par dossier, écrit par la base (déclencheurs) : lecture réservée à l'équipe,
-- aucune écriture possible depuis l'application.
create table if not exists public.activity (
  id         bigint generated always as identity primary key,
  dossier_id uuid not null references public.dossiers (id) on delete cascade,
  created_at timestamptz not null default now(),
  actor      text not null default '',
  actor_role text not null default 'cabinet' check (actor_role in ('client', 'cabinet', 'systeme')),
  kind       text not null,
  detail     text not null default ''
);
create index if not exists activity_dossier_idx on public.activity (dossier_id, created_at desc);
alter table public.activity enable row level security;
create policy activity_staff_read on public.activity for select to authenticated using (public.is_staff());
revoke all on public.activity from anon, authenticated;
grant select on public.activity to authenticated;

create or replace function public.log_activity() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_staff boolean := public.is_staff();
  v_email text := public.jwt_email();
  v_actor text := coalesce((select nullif(s.name, '') from public.staff s where s.email = v_email), nullif(v_email, ''), 'Système');
  v_role  text := case when v_email = '' then 'systeme' when v_staff then 'cabinet' else 'client' end;
  v_dossier uuid;
  v_kind text;
  v_detail text := '';
begin
  if tg_table_name = 'dossiers' then
    v_dossier := new.id;
    if tg_op = 'INSERT' then v_kind := 'dossier_ouvert'; v_detail := new.title;
    elsif new.status is distinct from old.status then v_kind := 'etape'; v_detail := old.status || ' → ' || new.status;
    elsif new.assignee is distinct from old.assignee then v_kind := 'responsable'; v_detail := coalesce(nullif(new.assignee, ''), 'non attribué');
    elsif new.due_date is distinct from old.due_date then v_kind := 'echeance'; v_detail := coalesce(new.due_date::text, 'retirée');
    elsif new.next_step is distinct from old.next_step then v_kind := 'message_suite'; v_detail := left(new.next_step, 200);
    elsif new.client_email is distinct from old.client_email then v_kind := 'courriel_client'; v_detail := old.client_email || ' → ' || new.client_email;
    else return new; end if;
  elsif tg_table_name = 'documents' then
    if tg_op = 'DELETE' then v_dossier := old.dossier_id; v_kind := 'document_supprime'; v_detail := old.name;
    else v_dossier := new.dossier_id; v_kind := 'document_depose'; v_detail := new.name; end if;
  elsif tg_table_name = 'messages' then
    v_dossier := new.dossier_id; v_kind := 'message'; v_detail := left(new.body, 120);
  elsif tg_table_name = 'invoices' then
    v_dossier := new.dossier_id;
    if tg_op = 'INSERT' then v_kind := 'facture_creee'; v_detail := new.label || ' · ' || to_char(new.amount_cents / 100.0, 'FM999G999G990D00') || ' $';
    elsif new.status is distinct from old.status then v_kind := 'facture_statut'; v_detail := new.label || ' : ' || old.status || ' → ' || new.status;
    else return new; end if;
  elsif tg_table_name = 'document_requests' then
    v_dossier := new.dossier_id;
    if tg_op = 'UPDATE' and new.received is distinct from old.received and new.received then v_kind := 'document_recu'; v_detail := new.label;
    else return new; end if;
  end if;
  if exists (select 1 from public.dossiers d where d.id = v_dossier) then
    insert into public.activity (dossier_id, actor, actor_role, kind, detail) values (v_dossier, v_actor, v_role, v_kind, v_detail);
  end if;
  return coalesce(new, old);
end $$;
revoke all on function public.log_activity() from public, anon, authenticated;

create trigger dossiers_log after insert or update on public.dossiers for each row execute function public.log_activity();
create trigger documents_log after insert on public.documents for each row execute function public.log_activity();
create trigger documents_log_del before delete on public.documents for each row execute function public.log_activity();
create trigger messages_log after insert on public.messages for each row execute function public.log_activity();
create trigger invoices_log after insert or update on public.invoices for each row execute function public.log_activity();
create trigger docreq_log after update on public.document_requests for each row execute function public.log_activity();
