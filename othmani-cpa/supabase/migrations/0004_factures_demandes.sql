-- Honoraires par dossier (le client voit ses factures à payer et payées) et lien document ↔ document demandé.
create table if not exists public.invoices (
  id           uuid primary key default gen_random_uuid(),
  dossier_id   uuid not null references public.dossiers (id) on delete cascade,
  created_at   timestamptz not null default now(),
  label        text not null check (char_length(label) between 1 and 200),
  amount_cents integer not null check (amount_cents between 1 and 100000000),
  status       text not null default 'a_payer' check (status in ('brouillon', 'a_payer', 'payee', 'annulee')),
  pay_url      text check (pay_url is null or (char_length(pay_url) <= 600 and pay_url like 'https://%')),
  paid_at      timestamptz
);
create index if not exists invoices_dossier_idx on public.invoices (dossier_id);
alter table public.invoices enable row level security;
create policy invoices_staff on public.invoices for all to authenticated
  using (public.is_staff()) with check (public.is_staff());
create policy invoices_client_read on public.invoices for select to authenticated
  using (public.owns_dossier(dossier_id) and status in ('a_payer', 'payee'));
revoke all on public.invoices from anon;
grant select, insert, update, delete on public.invoices to authenticated;

alter table public.documents add column if not exists request_id uuid references public.document_requests (id) on delete set null;
create index if not exists documents_request_idx on public.documents (request_id);
