-- L'équipe gère elle-même sa liste (on ne peut pas se retirer soi-même), et voit les dossiers
-- dont le dernier message vient du client.
create policy staff_manage on public.staff for insert to authenticated with check (public.is_staff());
create policy staff_remove on public.staff for delete to authenticated using (public.is_staff() and email <> public.jwt_email());

create or replace function public.dossiers_a_repondre() returns setof uuid
language sql stable security invoker set search_path = '' as $$
  select m.dossier_id from (
    select distinct on (dossier_id) dossier_id, author_role from public.messages order by dossier_id, created_at desc
  ) m where m.author_role = 'client'
$$;
revoke all on function public.dossiers_a_repondre() from public, anon;
grant execute on function public.dossiers_a_repondre() to authenticated;
