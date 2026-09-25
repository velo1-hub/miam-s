-- MIAM OS: behaviour & row-level security tests. Run with miam-os/scripts/test-local.sh
-- Each block raises an exception (and stops psql with ON_ERROR_STOP) if an expectation fails.
\set ON_ERROR_STOP on
\set QUIET on

grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage on all sequences in schema public to authenticated;
grant execute on all functions in schema public to authenticated;

-- People: owner (A), cashier (B), accountant (C), counter POS device (D), owner of ANOTHER org (E)
insert into staff (id, org_id, auth_user_id, first_name, hourly_rate, pin_hash) values
  ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-00000000000a', '11111111-1111-1111-1111-111111111111', 'Owner', null, null),
  ('00000000-0000-0000-0000-0000000000a2', '00000000-0000-0000-0000-00000000000a', '22222222-2222-2222-2222-222222222222', 'Cashier', 18.50, crypt('4321', gen_salt('bf'))),
  ('00000000-0000-0000-0000-0000000000a3', '00000000-0000-0000-0000-00000000000a', '33333333-3333-3333-3333-333333333333', 'Accountant', null, null);
insert into staff_roles values
  ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000b1', 'owner'),
  ('00000000-0000-0000-0000-0000000000a2', '00000000-0000-0000-0000-0000000000b1', 'cashier'),
  ('00000000-0000-0000-0000-0000000000a3', '00000000-0000-0000-0000-0000000000b1', 'accountant');
insert into devices (id, location_id, name, kind, auth_user_id) values
  ('00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-0000000000b1', 'POS comptoir', 'pos', '44444444-4444-4444-4444-444444444444');
insert into organizations (id, name) values ('00000000-0000-0000-0000-00000000000e', 'Autre café');
insert into locations (id, org_id, name) values ('00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-00000000000e', 'Autre');
insert into staff (id, org_id, auth_user_id, first_name) values ('00000000-0000-0000-0000-0000000000e2', '00000000-0000-0000-0000-00000000000e', '55555555-5555-5555-5555-555555555555', 'Other owner');
insert into staff_roles values ('00000000-0000-0000-0000-0000000000e2', '00000000-0000-0000-0000-0000000000e1', 'owner');
insert into expenses (location_id, category, amount, spent_on) values ('00000000-0000-0000-0000-0000000000b1', 'packaging', 312.40, current_date);

set role authenticated;

-- 1. Owner sees the whole menu and can change a price (audited + queued for sync)
set request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
do $$ begin
  if (select count(*) from menu_items) <> 57 then raise exception 'owner should see 57 menu items, got %', (select count(*) from menu_items); end if;
  update menu_items set base_price = 19 where slug = 'shakshuka';
  if not exists (select 1 from audit_logs where action = 'price_change' and entity = 'menu_items') then raise exception 'price change not audited'; end if;
  if (select count(*) from sync_outbox where kind = 'price') < 4 then raise exception 'price change not queued for sync'; end if;
  update menu_items set base_price = 18 where slug = 'shakshuka';
  raise notice 'PASS 1 owner menu + audited price change';
end $$;

-- 2. Other organisation's owner sees nothing of Miam's
set request.jwt.claim.sub = '55555555-5555-5555-5555-555555555555';
do $$ begin
  if (select count(*) from menu_items) <> 0 then raise exception 'cross-org menu leak'; end if;
  if (select count(*) from orders) <> 0 or (select count(*) from customers) <> 0 or (select count(*) from expenses) <> 0 then raise exception 'cross-org data leak'; end if;
  raise notice 'PASS 2 organisations are isolated';
end $$;

-- 3. Cashier: can read the menu, cannot change prices, cannot see financials
set request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
do $$ declare n int; begin
  if (select count(*) from menu_items) <> 57 then raise exception 'cashier should read menu'; end if;
  update menu_items set base_price = 1 where slug = 'latte';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'cashier changed a price'; end if;
  if (select count(*) from expenses) <> 0 then raise exception 'cashier can read expenses'; end if;
  if (select count(*) from staff where hourly_rate is not null and auth_user_id <> auth.uid()) <> 0 then raise exception 'cashier can read colleagues pay'; end if;
  raise notice 'PASS 3 cashier: menu read-only, no financials, no colleague pay';
end $$;

-- 4. Accountant: reads financials, cannot 86 or edit menu
set request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';
do $$ begin
  if (select count(*) from expenses) <> 1 then raise exception 'accountant should read expenses'; end if;
  begin
    perform set_item_86((select id from menu_items where slug = 'croissant'), '00000000-0000-0000-0000-0000000000b1', true);
    raise exception 'accountant was allowed to 86';
  exception when insufficient_privilege then null; end;
  raise notice 'PASS 4 accountant: financials read, no operations';
end $$;

-- 5. POS device: PIN login, take an order, totals with GST/QST, 86 fans out, cashier cannot give a 50 % discount
set request.jwt.claim.sub = '44444444-4444-4444-4444-444444444444';
do $$ declare v_staff uuid; v_order uuid; v_total numeric; begin
  v_staff := verify_staff_pin('4321');
  if v_staff is distinct from '00000000-0000-0000-0000-0000000000a2' then raise exception 'PIN login failed'; end if;
  if verify_staff_pin('0000') is not null then raise exception 'wrong PIN accepted'; end if;

  insert into orders (location_id, number, channel, opened_by, guest_count) values ('00000000-0000-0000-0000-0000000000b1', 1, 'dine_in', v_staff, 2) returning id into v_order;
  insert into order_items (order_id, item_id, qty, unit_price)
    select v_order, id, 2, base_price from menu_items where slug = 'shakshuka';
  insert into order_items (order_id, item_id, qty, unit_price, modifiers)
    select v_order, id, 1, base_price, '[{"name_fr":"Lait d''avoine","price_delta":0.75}]' from menu_items where slug = 'latte';
  select total into v_total from orders where id = v_order;
  -- (2×18 + 5.25 + 0.75) = 42.00 → GST 2.10, QST 4.19 → 48.29
  if v_total <> 48.29 then raise exception 'order total wrong: %', v_total; end if;

  perform set_item_86((select id from menu_items where slug = 'croissant_pistache'), '00000000-0000-0000-0000-0000000000b1', true);
  if not exists (select 1 from item_86 i join menu_items m on m.id = i.item_id where m.slug = 'croissant_pistache' and i.sold_out) then raise exception '86 not saved'; end if;
  if (select count(*) from sync_outbox) <> 0 then raise exception 'device can read the management sync queue'; end if;

  begin
    insert into discounts_applied (order_id, kind, amount, reason) values (v_order, 'manager', 21, 'test');
    raise exception 'cashier device applied a large manager discount';
  exception when insufficient_privilege then null; end;

  update orders set status = 'completed' where id = v_order;
  raise notice 'PASS 5 device PIN, order totals (GST+QST), 86 fan-out, discount guard';
end $$;

-- 6. Completing the order deducted recipe stock (2 shakshukas × 2 eggs = 4 eggs)
reset role;
do $$ declare v numeric; begin
  select sl.on_hand into v from stock_levels sl join ingredients i on i.id = sl.ingredient_id where i.name = 'Œuf gros (Québec)';
  if v <> 356 then raise exception 'egg stock should be 356, got %', v; end if;
  if (select count(*) from sync_outbox where kind = 'item_86') < 3 then raise exception '86 not fanned out to website/screens/pos'; end if;
  raise notice 'PASS 6 automatic stock deduction from recipes; 86 queued for website, screens and POS';
end $$;

-- 7. Cashier cannot refund; owner can, and it is audited
set role authenticated;
set request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
insert into payments (order_id, method, amount, provider) select id, 'card', 48.29, 'certified-pos' from orders where number = 1;
do $$ begin
  begin
    insert into refunds (payment_id, amount, reason) select id, 5, 'test' from payments limit 1;
    raise exception 'cashier refunded';
  exception when insufficient_privilege then null; end;
  raise notice 'PASS 7a cashier cannot refund';
end $$;
set request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
do $$ begin
  insert into refunds (payment_id, amount, reason) select id, 5, 'Plat froid' from payments limit 1;
  if not exists (select 1 from audit_logs where action = 'refund') then raise exception 'refund not audited'; end if;
  raise notice 'PASS 7b owner refund audited';
end $$;

-- 8. Food safety and review alerts
reset role;
do $$ begin
  insert into temperature_logs (equipment_id, temp_c) select id, 7.5 from equipment where name = 'Chambre froide';
  if not exists (select 1 from alerts where kind = 'temperature' and priority = 'urgent') then raise exception 'no temperature alert'; end if;
  insert into reviews (location_id, source, external_id, author, rating, body, draft_reply)
    values ('00000000-0000-0000-0000-0000000000b1', 'google', 'r1', 'Alex', 2, 'Attente trop longue', 'Vous avez raison…');
  if not exists (select 1 from alerts where kind = 'negative_review') then raise exception 'no review alert'; end if;
  if not exists (select 1 from approvals where kind = 'review_reply' and status = 'pending') then raise exception 'no approval for reply'; end if;
  raise notice 'PASS 8 temperature + negative review alerts, reply sent to owner approval inbox';
end $$;

-- 9. Views compute
do $$ begin
  if (select food_cost_pct from v_item_cost where slug = 'shakshuka') is null then raise exception 'item cost view empty'; end if;
  if not exists (select 1 from v_allergen_matrix where slug = 'shakshuka' and 'eggs' = any(allergens)) then raise exception 'allergen matrix missing eggs'; end if;
  if (select net_sales from v_daily_sales where channel = 'dine_in') <> 42 then raise exception 'daily sales wrong'; end if;
  perform * from v_menu_engineering; perform * from v_weekly_prime_cost; perform * from v_customer_segments;
  raise notice 'PASS 9 reporting views (item cost %, allergen matrix, daily sales, engineering, prime cost, segments)', (select food_cost_pct from v_item_cost where slug = 'shakshuka');
end $$;

\echo 'ALL MIAM OS TESTS PASSED'
