-- Run by proferforge/backend/scripts/test-db.sh (plain PostgreSQL + the shim from miam-os).
\set ON_ERROR_STOP on
\set QUIET on
grant usage on schema public to authenticated, anon;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage on all sequences in schema public to authenticated;
grant execute on all functions in schema public to authenticated;

insert into staff_users (auth_user_id, email, role) values ('11111111-1111-1111-1111-111111111111', 'owner@example.com', 'owner');
insert into leads (id, session_id, contact_name, phone) values ('00000000-0000-0000-0000-0000000000a1', 'session-aaaaaaaaaaaaaaaa', 'Test', '+15145550000');
insert into appointments (lead_id, starts_at, ends_at) values ('00000000-0000-0000-0000-0000000000a1', now() + interval '3 days', now() + interval '3 days 1 hour');

-- 1. Anonymous cannot read or write anything
set role anon;
do $$ begin
  begin perform 1 from leads; raise exception 'anon read leads should fail'; exception when insufficient_privilege then null; end;
  begin insert into leads (session_id) values ('session-bbbbbbbbbbbbbbbb'); raise exception 'anon insert should fail'; exception when insufficient_privilege then null; end;
  raise notice 'PASS 1 anon has no access';
end $$;

-- 2. An authenticated user who is NOT staff sees nothing (RLS) and cannot insert
reset role; set role authenticated; set request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
do $$ begin
  if (select count(*) from leads) <> 0 then raise exception 'non-staff must see 0 leads'; end if;
  if (select count(*) from settings) <> 0 then raise exception 'non-staff must see 0 settings'; end if;
  begin insert into leads (session_id) values ('session-cccccccccccccccc'); raise exception 'non-staff insert should fail'; exception when insufficient_privilege or check_violation then null; end;
  raise notice 'PASS 2 non-staff sees nothing';
end $$;

-- 3. Staff sees and edits everything, including the overview view
reset role; set role authenticated; set request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
do $$ begin
  if (select count(*) from leads) <> 1 then raise exception 'staff must see the lead'; end if;
  if (select count(*) from lead_overview where next_visit is not null) <> 1 then raise exception 'overview should show next visit'; end if;
  update rate_card set unit_price = 100 where key = 'weld_hour';
  update leads set status = 'quote_sent' where id = '00000000-0000-0000-0000-0000000000a1';
  if (select updated_at from leads) is null then raise exception 'updated_at'; end if;
  raise notice 'PASS 3 staff full access';
end $$;

-- 4. Double booking of the same slot is impossible; a cancelled slot can be rebooked
reset role;
do $$ declare t timestamptz := now() + interval '5 days'; begin
  insert into appointments (lead_id, starts_at, ends_at) values ('00000000-0000-0000-0000-0000000000a1', t, t + interval '1 hour');
  begin insert into appointments (lead_id, starts_at, ends_at) values ('00000000-0000-0000-0000-0000000000a1', t, t + interval '1 hour'); raise exception 'double booking allowed';
  exception when unique_violation then null; end;
  update appointments set status = 'cancelled' where starts_at = t;
  insert into appointments (lead_id, starts_at, ends_at) values ('00000000-0000-0000-0000-0000000000a1', t, t + interval '1 hour');
  raise notice 'PASS 4 no double booking, cancelled slot reusable';
end $$;

-- 5. Seeds: rate card has NO invented prices; no availability invented
reset role;
do $$ begin
  if (select count(*) from rate_card where unit_price is not null and key <> 'weld_hour') <> 0 then raise exception 'rate card must ship without prices'; end if;
  if (select count(*) from availability_rules) <> 0 then raise exception 'availability must ship empty'; end if;
  raise notice 'PASS 5 no invented prices or hours';
end $$;
