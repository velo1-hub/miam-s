-- Reçus du quotidien : le client photographie un reçu et demande s'il est déductible.
-- L'indication de l'IA n'est qu'un premier avis ; seul le cabinet valide (status, staff_note).
create table if not exists public.receipts (
  id           uuid primary key default gen_random_uuid(),
  dossier_id   uuid not null references public.dossiers (id) on delete cascade,
  created_at   timestamptz not null default now(),
  path         text not null unique,
  question     text not null default '' check (char_length(question) <= 500),
  vendor       text check (vendor is null or char_length(vendor) <= 160),
  receipt_date date,
  total_cents  integer check (total_cents is null or total_cents between 0 and 100000000),
  gst_cents    integer check (gst_cents is null or gst_cents between 0 and 100000000),
  qst_cents    integer check (qst_cents is null or qst_cents between 0 and 100000000),
  category     text check (category is null or char_length(category) <= 80),
  ai_verdict   text check (ai_verdict is null or ai_verdict in ('probable', 'peu_probable', 'a_verifier')),
  ai_note      text not null default '' check (char_length(ai_note) <= 800),
  status       text not null default 'a_verifier' check (status in ('a_verifier', 'valide', 'refuse')),
  staff_note   text not null default '' check (char_length(staff_note) <= 500)
);
create index if not exists receipts_dossier_idx on public.receipts (dossier_id, created_at desc);
alter table public.receipts enable row level security;
create policy receipts_staff on public.receipts for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy receipts_client_read on public.receipts for select to authenticated using (public.owns_dossier(dossier_id));
create policy receipts_client_add on public.receipts for insert to authenticated
  with check (public.owns_dossier(dossier_id) and status = 'a_verifier' and staff_note = '' and path like dossier_id::text || '/%');
revoke all on public.receipts from anon;
grant select, insert, update, delete on public.receipts to authenticated;
create trigger receipts_stamp before insert on public.receipts for each row execute function public.stamp_row();
