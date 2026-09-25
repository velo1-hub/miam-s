-- MIAM OS: business logic, reporting views and row-level security.

-- ───────────────────────── Permission matrix seed (Phase 9 §9.2) ─────────────────────────
insert into role_permissions (role, permission) values
  -- owner: everything
  ('owner','refund'),('owner','discount'),('owner','void'),('owner','price_change'),('owner','inventory_edit'),
  ('owner','schedule_edit'),('owner','view_financials'),('owner','export_data'),('owner','menu_86'),('owner','drawer_open'),
  ('owner','approve'),('owner','manage_staff'),('owner','manage_integrations'),('owner','reply_reviews'),
  -- manager: everything except integrations, staff pay and export
  ('manager','refund'),('manager','discount'),('manager','void'),('manager','price_change'),('manager','inventory_edit'),
  ('manager','schedule_edit'),('manager','view_financials'),('manager','menu_86'),('manager','drawer_open'),('manager','approve'),
  ('manager','reply_reviews'),
  -- cashier/server: small discounts and voids before sending, drawer, 86
  ('cashier','discount'),('cashier','void'),('cashier','drawer_open'),('cashier','menu_86'),
  -- kitchen & barista: 86 and waste
  ('kitchen','menu_86'),('kitchen','inventory_edit'),('barista','menu_86'),('barista','inventory_edit'),
  ('expo','menu_86'),
  -- accountant: read-only finance + export
  ('accountant','view_financials'),('accountant','export_data');

-- ───────────────────────── Generic helpers ─────────────────────────
create or replace function touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end $$;
create trigger menu_items_touch before update on menu_items for each row execute function touch_updated_at();

create or replace function write_audit(loc uuid, act text, ent text, ent_id text, b jsonb, a jsonb, why text default null)
returns void language sql security definer set search_path = public as $$
  insert into audit_logs (location_id, actor_staff_id, action, entity, entity_id, before, after, reason)
  values (loc, current_staff_id(), act, ent, ent_id, b, a, why)
$$;

-- Price changes on the master menu are always audited.
create or replace function audit_menu_price() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.base_price is distinct from old.base_price then
    -- menu is org-wide: one audit row per location so each location's managers see it
    insert into audit_logs (location_id, actor_staff_id, action, entity, entity_id, before, after)
      select l.id, current_staff_id(), 'price_change', 'menu_items', new.id::text,
             jsonb_build_object('base_price', old.base_price), jsonb_build_object('base_price', new.base_price)
      from locations l where l.org_id = new.org_id;
    insert into sync_outbox (location_id, target, kind, payload)
      select l.id, t.target, 'price', jsonb_build_object('item', new.slug, 'price', new.base_price)
      from locations l cross join (values ('website'),('screens'),('pos'),('aggregator')) t(target)
      where l.org_id = new.org_id;
  end if;
  return new;
end $$;
create trigger menu_items_price_audit after update of base_price on menu_items for each row execute function audit_menu_price();

create or replace function audit_channel_price() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' or new.price is distinct from old.price or new.available is distinct from old.available then
    perform write_audit(new.location_id, 'price_change', 'item_channel_settings', new.item_id::text || ':' || new.channel,
      case when tg_op = 'UPDATE' then to_jsonb(old) end, to_jsonb(new));
  end if;
  return new;
end $$;
create trigger item_channel_settings_audit after insert or update on item_channel_settings for each row execute function audit_channel_price();

-- ───────────────────────── 86 everywhere (one tap) ─────────────────────────
create or replace function set_item_86(p_item uuid, p_location uuid, p_sold_out boolean, p_until timestamptz default null)
returns void language plpgsql security definer set search_path = public as $$
declare v_slug text;
begin
  if not has_permission(p_location, 'menu_86') and current_device_location() is distinct from p_location then
    raise exception 'not allowed: menu_86' using errcode = '42501';
  end if;
  select slug into v_slug from menu_items where id = p_item;
  insert into item_86 (item_id, location_id, sold_out, until, set_by, set_at)
    values (p_item, p_location, p_sold_out, p_until, current_staff_id(), now())
    on conflict (item_id, location_id) do update set sold_out = excluded.sold_out, until = excluded.until,
      set_by = excluded.set_by, set_at = now();
  perform write_audit(p_location, '86', 'menu_items', p_item::text, null,
    jsonb_build_object('sold_out', p_sold_out, 'until', p_until));
  -- Fan out to every surface: website/QR, screens, POS, and each connected delivery channel.
  insert into sync_outbox (location_id, target, kind, payload)
  select p_location, t, 'item_86', jsonb_build_object('item', v_slug, 'sold_out', p_sold_out, 'until', p_until)
  from unnest(array['website','screens','pos']) t
  union all
  select p_location, i.provider, 'item_86', jsonb_build_object('item', v_slug, 'sold_out', p_sold_out, 'until', p_until)
  from integrations i
  where i.location_id = p_location and i.status = 'connected'
    and i.provider in ('aggregator','uber_eats','doordash','skip','glovo');
end $$;

-- Pause / resume a delivery channel when the kitchen is overloaded.
create or replace function set_store_status(p_location uuid, p_channel sales_channel, p_state text, p_minutes int default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not has_loc_role(p_location, array['owner','manager']::app_role[]) then
    raise exception 'not allowed: store status' using errcode = '42501';
  end if;
  insert into platform_store_status (location_id, channel, state, paused_until, updated_at)
    values (p_location, p_channel, p_state, case when p_minutes is not null then now() + make_interval(mins => p_minutes) end, now())
    on conflict (location_id, channel) do update set state = excluded.state, paused_until = excluded.paused_until, updated_at = now();
  perform write_audit(p_location, 'store_status', 'platform_store_status', p_channel::text, null,
    jsonb_build_object('state', p_state, 'minutes', p_minutes));
  insert into sync_outbox (location_id, target, kind, payload)
    values (p_location, p_channel::text, 'store_status', jsonb_build_object('state', p_state, 'minutes', p_minutes));
end $$;

-- ───────────────────────── Orders: totals, stock, loyalty ─────────────────────────
-- Québec: GST 5 %, QST 9.975 % on the discounted subtotal (verify exemptions with your accountant).
create or replace function recalc_order(p_order uuid) returns void language plpgsql security definer set search_path = public as $$
declare v_sub numeric(10,2); v_disc numeric(10,2); v_base numeric(10,2);
begin
  select coalesce(sum(oi.qty * (oi.unit_price + coalesce((select sum((m->>'price_delta')::numeric) from jsonb_array_elements(oi.modifiers) m), 0))), 0)
    into v_sub from order_items oi where oi.order_id = p_order and oi.status <> 'voided';
  select coalesce(sum(amount), 0) into v_disc from discounts_applied where order_id = p_order;
  v_base := greatest(v_sub - v_disc, 0);
  update orders set subtotal = v_sub, discount_total = v_disc,
    gst = round(v_base * 0.05, 2), qst = round(v_base * 0.09975, 2),
    total = v_base + round(v_base * 0.05, 2) + round(v_base * 0.09975, 2)
  where id = p_order;
end $$;

create or replace function order_items_changed() returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform recalc_order(coalesce(new.order_id, old.order_id));
  if tg_op = 'UPDATE' and new.status = 'voided' and old.status <> 'voided' then
    perform write_audit((select location_id from orders where id = new.order_id), 'void', 'order_items', new.id::text,
      to_jsonb(old), to_jsonb(new), new.void_reason);
  end if;
  return null;
end $$;
create trigger order_items_totals after insert or update or delete on order_items for each row execute function order_items_changed();

create or replace function discounts_changed() returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform recalc_order(coalesce(new.order_id, old.order_id));
  if tg_op = 'INSERT' then
    perform write_audit((select location_id from orders where id = new.order_id), 'discount', 'orders', new.order_id::text,
      null, to_jsonb(new), new.reason);
  end if;
  return null;
end $$;
create trigger discounts_totals after insert or delete on discounts_applied for each row execute function discounts_changed();

create or replace function refunds_audit() returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform write_audit((select o.location_id from payments p join orders o on o.id = p.order_id where p.id = new.payment_id),
    'refund', 'payments', new.payment_id::text, null, to_jsonb(new), new.reason);
  return null;
end $$;
create trigger refunds_audit after insert on refunds for each row execute function refunds_audit();

create or replace function drawer_audit() returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform write_audit(new.location_id, case when tg_op = 'INSERT' then 'drawer_open' else 'drawer_close' end,
    'drawer_sessions', new.id::text, null, to_jsonb(new));
  return null;
end $$;
create trigger drawer_audit after insert or update of closed_at on drawer_sessions for each row execute function drawer_audit();

-- When an order completes: deduct theoretical stock from recipes (incl. linked modifiers), update loyalty & customer.
create or replace function on_order_completed() returns trigger language plpgsql security definer set search_path = public as $$
declare v_points int;
begin
  if new.status = 'completed' and old.status is distinct from 'completed' then
    new.completed_at := coalesce(new.completed_at, now());

    with usage as (
      select rl.ingredient_id, oi.qty * rl.qty / (rl.yield_pct / 100) as qty
      from order_items oi join recipe_lines rl on rl.item_id = oi.item_id
      where oi.order_id = new.id and oi.status <> 'voided'
      union all
      select rl.ingredient_id, oi.qty * rl.qty / (rl.yield_pct / 100)
      from order_items oi
      cross join lateral jsonb_array_elements(oi.modifiers) m
      join modifiers md on md.id = (m->>'modifier_id')::uuid
      join recipe_lines rl on rl.item_id = md.linked_item_id
      where oi.order_id = new.id and oi.status <> 'voided'
    ), agg as (
      select u.ingredient_id, sum(u.qty) as qty from usage u group by u.ingredient_id
    ), mv as (
      insert into stock_movements (location_id, ingredient_id, qty, reason, ref_id, unit_cost)
      select new.location_id, a.ingredient_id, -a.qty, 'sale', new.id, i.cost_per_unit
      from agg a join ingredients i on i.id = a.ingredient_id
      returning ingredient_id, qty
    )
    insert into stock_levels (location_id, ingredient_id, on_hand)
    select new.location_id, ingredient_id, qty from mv
    on conflict (location_id, ingredient_id) do update set on_hand = stock_levels.on_hand + excluded.on_hand;

    if new.customer_id is not null then
      update customers set last_seen_at = now() where id = new.customer_id;
      if new.channel in ('dine_in','takeout','online_pickup','delivery_own','catering')
         and exists (select 1 from loyalty_accounts where customer_id = new.customer_id) then
        v_points := floor(new.subtotal - new.discount_total)::int;
        insert into loyalty_transactions (customer_id, order_id, points, reason) values (new.customer_id, new.id, v_points, 'purchase');
        update loyalty_accounts set points = points + v_points, visits = visits + 1, lifetime_spend = lifetime_spend + new.total
          where customer_id = new.customer_id;
      end if;
    end if;
  end if;
  return new;
end $$;
create trigger orders_completed before update of status on orders for each row execute function on_order_completed();

-- Low-stock alert whenever on_hand crosses below the reorder point.
create or replace function low_stock_alert() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.reorder_point is not null and new.on_hand < new.reorder_point
     and (old.on_hand is null or old.on_hand >= new.reorder_point) then
    insert into alerts (location_id, kind, priority, title, entity_id)
    select new.location_id, 'low_stock', 'today', 'Stock bas : ' || i.name, new.ingredient_id::text
    from ingredients i where i.id = new.ingredient_id;
  end if;
  return new;
end $$;
create trigger stock_levels_low after update of on_hand on stock_levels for each row execute function low_stock_alert();

-- Receiving: supplier price change > 5 % raises an alert and updates ingredient cost.
create or replace function po_line_received() returns trigger language plpgsql security definer set search_path = public as $$
declare v_loc uuid; v_old numeric;
begin
  if new.qty_received is not null and old.qty_received is null then
    select po.location_id into v_loc from purchase_orders po where po.id = new.po_id;
    select cost_per_unit into v_old from ingredients where id = new.ingredient_id;
    insert into stock_movements (location_id, ingredient_id, qty, reason, ref_id, unit_cost)
      values (v_loc, new.ingredient_id, new.qty_received, 'receiving', new.po_id, new.unit_cost_received);
    insert into stock_levels (location_id, ingredient_id, on_hand) values (v_loc, new.ingredient_id, new.qty_received)
      on conflict (location_id, ingredient_id) do update set on_hand = stock_levels.on_hand + excluded.on_hand;
    if new.unit_cost_received is not null then
      if v_old > 0 and abs(new.unit_cost_received - v_old) / v_old > 0.05 then
        insert into alerts (location_id, kind, priority, title, body, entity_id)
        select v_loc, 'price_increase', 'today', 'Prix fournisseur modifié : ' || i.name,
               format('%s → %s par %s', round(v_old, 4), round(new.unit_cost_received, 4), i.unit), i.id::text
        from ingredients i where i.id = new.ingredient_id;
      end if;
      update ingredients set cost_per_unit = new.unit_cost_received where id = new.ingredient_id;
    end if;
  end if;
  return new;
end $$;
create trigger po_lines_received after update of qty_received on purchase_order_lines for each row execute function po_line_received();

-- Waste reduces stock.
create or replace function waste_logged() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.ingredient_id is not null then
    insert into stock_movements (location_id, ingredient_id, qty, reason, ref_id, created_by)
      values (new.location_id, new.ingredient_id, -new.qty, 'waste', new.id, new.logged_by);
    insert into stock_levels (location_id, ingredient_id, on_hand) values (new.location_id, new.ingredient_id, -new.qty)
      on conflict (location_id, ingredient_id) do update set on_hand = stock_levels.on_hand + excluded.on_hand;
  end if;
  return new;
end $$;
create trigger waste_logs_stock after insert on waste_logs for each row execute function waste_logged();

-- Temperature out of range → urgent alert.
create or replace function temperature_check() returns trigger language plpgsql security definer set search_path = public as $$
declare e equipment;
begin
  select * into e from equipment where id = new.equipment_id;
  new.out_of_range := (e.min_temp is not null and new.temp_c < e.min_temp) or (e.max_temp is not null and new.temp_c > e.max_temp);
  if new.out_of_range then
    insert into alerts (location_id, kind, priority, title, body, entity_id)
      values (e.location_id, 'temperature', 'urgent', 'Température hors norme : ' || e.name,
              format('%s °C (plage %s à %s)', new.temp_c, e.min_temp, e.max_temp), e.id::text);
  end if;
  return new;
end $$;
create trigger temperature_logs_check before insert on temperature_logs for each row execute function temperature_check();

-- Negative review → urgent alert + approval request for the drafted reply.
create or replace function review_received() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.rating is not null and new.rating <= 3 then
    insert into alerts (location_id, kind, priority, title, body, entity_id)
      values (new.location_id, 'negative_review', 'urgent', format('Avis %s★ sur %s', new.rating, new.source), left(new.body, 280), new.id::text);
  end if;
  if new.draft_reply is not null then
    insert into approvals (location_id, kind, entity_id, summary, payload)
      values (new.location_id, 'review_reply', new.id, format('Réponse à l''avis %s★ de %s', new.rating, coalesce(new.author, '—')),
              jsonb_build_object('draft', new.draft_reply));
  end if;
  return new;
end $$;
create trigger reviews_received after insert on reviews for each row execute function review_received();

-- ───────────────────────── Reporting views ─────────────────────────
-- Recipe cost per menu item (the live food cost that feeds menu engineering).
create or replace view v_item_cost with (security_invoker = true) as
select mi.id as item_id, mi.org_id, mi.slug, mi.name_fr, mi.base_price,
       round(coalesce(sum(rl.qty / (rl.yield_pct / 100) * i.cost_per_unit), 0), 2) as recipe_cost,
       case when mi.base_price > 0 then round(100 * coalesce(sum(rl.qty / (rl.yield_pct / 100) * i.cost_per_unit), 0) / mi.base_price, 1) end as food_cost_pct
from menu_items mi
left join recipe_lines rl on rl.item_id = mi.id
left join ingredients i on i.id = rl.ingredient_id
group by mi.id;

-- Allergen matrix generated from recipes (ingredient allergens ∪ declared item allergens).
create or replace view v_allergen_matrix with (security_invoker = true) as
select mi.id as item_id, mi.org_id, mi.slug, mi.name_fr, mi.name_en,
       (select array_agg(distinct a order by a) from (
          select unnest(mi.allergens) a
          union select unnest(i.allergens) from recipe_lines rl join ingredients i on i.id = rl.ingredient_id where rl.item_id = mi.id
        ) s) as allergens
from menu_items mi;

create or replace view v_daily_sales with (security_invoker = true) as
select o.location_id, (o.created_at at time zone l.timezone)::date as business_date, o.channel,
       count(*) filter (where o.status = 'completed') as orders,
       sum(o.subtotal - o.discount_total) filter (where o.status = 'completed') as net_sales,
       sum(o.guest_count) filter (where o.status = 'completed') as covers,
       sum(o.platform_commission + o.platform_fees) filter (where o.status = 'completed') as platform_costs,
       sum(o.subtotal - o.discount_total - o.platform_commission - o.platform_fees) filter (where o.status = 'completed') as net_after_platform,
       count(*) filter (where o.status = 'voided') as voided_orders,
       sum(o.discount_total) as discounts
from orders o join locations l on l.id = o.location_id
group by 1, 2, 3;

create or replace view v_item_sales with (security_invoker = true) as
select o.location_id, (o.created_at at time zone l.timezone)::date as business_date, oi.item_id,
       sum(oi.qty) as units, sum(oi.qty * oi.unit_price) as revenue
from order_items oi join orders o on o.id = oi.order_id join locations l on l.id = o.location_id
where o.status = 'completed' and oi.status <> 'voided'
group by 1, 2, 3;

-- Menu engineering matrix over the last 56 days, same method as tools/build-menu.mjs.
create or replace view v_menu_engineering with (security_invoker = true) as
with s as (
  select v.location_id, v.item_id, sum(v.units) as units
  from v_item_sales v where v.business_date >= current_date - 56 group by 1, 2
), j as (
  select s.location_id, s.item_id, c.menu_group, s.units, ic.base_price - ic.recipe_cost as margin
  from s join menu_items mi on mi.id = s.item_id join categories c on c.id = mi.category_id
  join v_item_cost ic on ic.item_id = s.item_id
  where not ('modifier' = any(mi.tags) or 'combo' = any(mi.tags))
), g as (
  select location_id, menu_group, sum(units) as total_units, sum(units * margin) / nullif(sum(units), 0) as avg_margin, count(*) as n
  from j group by 1, 2
)
select j.location_id, j.item_id, j.menu_group, j.units, round(j.margin, 2) as margin,
       round(100.0 * j.units / g.total_units, 1) as mix_pct,
       case
         when j.units / g.total_units >= 0.7 / g.n and j.margin >= g.avg_margin then 'Star'
         when j.units / g.total_units >= 0.7 / g.n then 'Plowhorse'
         when j.margin >= g.avg_margin then 'Puzzle'
         else 'Dog' end as class
from j join g using (location_id, menu_group);

-- Weekly prime cost: theoretical food cost from sales + labour from time entries.
create or replace view v_weekly_prime_cost with (security_invoker = true) as
with sales as (
  select location_id, date_trunc('week', business_date)::date as week, sum(net_sales) as net_sales
  from v_daily_sales group by 1, 2
), food as (
  select sm.location_id, date_trunc('week', sm.created_at)::date as week, -sum(sm.qty * sm.unit_cost) as food_cost
  from stock_movements sm where sm.reason in ('sale','waste') group by 1, 2
), labor as (
  select te.location_id, date_trunc('week', te.clock_in)::date as week,
         sum((extract(epoch from (coalesce(te.clock_out, now()) - te.clock_in)) / 3600 - te.break_min / 60.0) * s.hourly_rate) as labor_cost
  from time_entries te join staff s on s.id = te.staff_id group by 1, 2
)
select s.location_id, s.week, s.net_sales, round(f.food_cost, 2) as food_cost, round(l.labor_cost, 2) as labor_cost,
       round(100 * f.food_cost / nullif(s.net_sales, 0), 1) as food_cost_pct,
       round(100 * l.labor_cost / nullif(s.net_sales, 0), 1) as labor_cost_pct,
       round(100 * (coalesce(f.food_cost, 0) + coalesce(l.labor_cost, 0)) / nullif(s.net_sales, 0), 1) as prime_cost_pct
from sales s left join food f using (location_id, week) left join labor l using (location_id, week);

-- Inventory variance: theoretical on-hand vs. last approved count.
create or replace view v_inventory_variance with (security_invoker = true) as
select sc.location_id, sc.id as count_id, sc.counted_at, scl.ingredient_id, i.name,
       scl.theoretical_qty, scl.counted_qty, scl.counted_qty - scl.theoretical_qty as variance_qty,
       round((scl.counted_qty - scl.theoretical_qty) * i.cost_per_unit, 2) as variance_value
from stock_counts sc join stock_count_lines scl on scl.count_id = sc.id join ingredients i on i.id = scl.ingredient_id
where sc.status = 'approved';

-- Customer segments for CRM automations (Phase 12).
create or replace view v_customer_segments with (security_invoker = true) as
select c.id as customer_id, c.org_id,
       count(o.id) filter (where o.status = 'completed') as orders,
       max(o.created_at) as last_order_at,
       coalesce(sum(o.total) filter (where o.status = 'completed'), 0) as spend,
       case
         when count(o.id) filter (where o.status = 'completed') = 0 then 'lead'
         when max(o.created_at) < now() - interval '120 days' then 'lost'
         when max(o.created_at) < now() - interval '45 days' then 'at_risk'
         when count(o.id) filter (where o.status = 'completed' and o.created_at > now() - interval '60 days') >= 8 then 'vip'
         when count(o.id) filter (where o.status = 'completed') >= 3 then 'regular'
         else 'new' end as segment
from customers c left join orders o on o.customer_id = c.id
where c.deleted_at is null
group by c.id;

-- ───────────────────────── Row-level security ─────────────────────────
-- Applies a standard policy set to a location-scoped table:
--   read  : any member of the location (staff role or registered device)
--   write : roles listed in p_write
-- Finance tables pass p_read_roles so only owner/manager/accountant can read.
create or replace function apply_location_policies(p_table text, p_write app_role[], p_read_roles app_role[] default null)
returns void language plpgsql as $$
begin
  execute format('alter table %I enable row level security', p_table);
  if p_read_roles is null then
    execute format('create policy %I on %I for select using (is_loc_member(location_id))', p_table || '_read', p_table);
  else
    execute format('create policy %I on %I for select using (has_loc_role(location_id, %L::app_role[]))', p_table || '_read', p_table, p_read_roles);
  end if;
  execute format('create policy %I on %I for insert with check (has_loc_role(location_id, %L::app_role[]) or current_device_location() = location_id)', p_table || '_ins', p_table, p_write);
  execute format('create policy %I on %I for update using (has_loc_role(location_id, %L::app_role[]) or current_device_location() = location_id)', p_table || '_upd', p_table, p_write);
  execute format('create policy %I on %I for delete using (has_loc_role(location_id, %L::app_role[]))', p_table || '_del', p_table, array['owner','manager']::app_role[]);
end $$;

do $$
declare
  all_ops constant app_role[] := array['owner','manager','cashier','kitchen','barista','expo'];
  mgmt constant app_role[] := array['owner','manager'];
  fin_read constant app_role[] := array['owner','manager','accountant'];
begin
  -- operational (every staff member / device can read and write)
  perform apply_location_policies('orders', all_ops);
  perform apply_location_policies('dining_tables', all_ops);
  perform apply_location_policies('waitlist_entries', all_ops);
  perform apply_location_policies('reservations', all_ops);
  perform apply_location_policies('item_86', all_ops);
  perform apply_location_policies('waste_logs', all_ops);
  perform apply_location_policies('prep_batches', all_ops);
  perform apply_location_policies('checklists', mgmt);
  perform apply_location_policies('time_entries', all_ops);
  perform apply_location_policies('tasks', all_ops);
  perform apply_location_policies('announcements', mgmt);
  perform apply_location_policies('feedback', all_ops);
  perform apply_location_policies('equipment', mgmt);
  perform apply_location_policies('kitchen_stations', mgmt);
  perform apply_location_policies('dayparts', mgmt);
  perform apply_location_policies('stock_counts', array['owner','manager','kitchen','barista']::app_role[]);
  -- management
  perform apply_location_policies('shifts', mgmt);
  perform apply_location_policies('stock_levels', array['owner','manager','kitchen','barista']::app_role[]);
  perform apply_location_policies('stock_movements', mgmt);
  perform apply_location_policies('purchase_orders', array['owner','manager','kitchen']::app_role[]);
  perform apply_location_policies('item_channel_settings', mgmt);
  perform apply_location_policies('platform_store_status', mgmt);
  perform apply_location_policies('reviews', mgmt, mgmt);
  perform apply_location_policies('social_posts', mgmt, mgmt);
  perform apply_location_policies('approvals', mgmt, mgmt);
  perform apply_location_policies('alerts', mgmt);
  perform apply_location_policies('event_leads', mgmt);
  perform apply_location_policies('compliance_records', mgmt);
  perform apply_location_policies('integrations', array['owner']::app_role[], mgmt);
  perform apply_location_policies('integration_events', array['owner']::app_role[], mgmt);
  perform apply_location_policies('sync_outbox', mgmt, mgmt);
  perform apply_location_policies('sales_forecasts', mgmt);
  -- finance: readable only by owner/manager/accountant
  perform apply_location_policies('drawer_sessions', all_ops, fin_read);
  perform apply_location_policies('daily_closings', mgmt, fin_read);
  perform apply_location_policies('expenses', mgmt, fin_read);
  perform apply_location_policies('invoices', mgmt, fin_read);
  perform apply_location_policies('tip_pools', mgmt, fin_read);
  perform apply_location_policies('ad_campaign_daily', mgmt, fin_read);
  perform apply_location_policies('audit_logs', mgmt, fin_read);
end $$;

-- Org-scoped tables (menu, recipes, customers, suppliers).
do $$
declare t text;
begin
  foreach t in array array['categories','menu_items','modifier_groups','ingredients','suppliers','promo_codes'] loop
    execute format('alter table %I enable row level security', t);
    execute format('create policy %I on %I for select using (is_org_member(org_id))', t || '_read', t);
    execute format('create policy %I on %I for all using (has_org_role(org_id, array[''owner'',''manager'']::app_role[])) with check (has_org_role(org_id, array[''owner'',''manager'']::app_role[]))', t || '_write', t);
  end loop;
end $$;

-- Customers: personal information (Law 25). Floor staff can look up and create; only management can export/delete.
alter table customers enable row level security;
create policy customers_read on customers for select using (is_org_member(org_id));
create policy customers_ins on customers for insert with check (is_org_member(org_id));
create policy customers_upd on customers for update using (is_org_member(org_id));
create policy customers_del on customers for delete using (has_org_role(org_id, array['owner']::app_role[]));

-- Child tables inherit access from their parent.
alter table organizations enable row level security;
create policy organizations_read on organizations for select using (is_org_member(id));
create policy organizations_upd on organizations for update using (has_org_role(id, array['owner']::app_role[]));

alter table locations enable row level security;
create policy locations_read on locations for select using (is_loc_member(id));
create policy locations_upd on locations for update using (has_loc_role(id, array['owner']::app_role[]));

alter table staff enable row level security;
create policy staff_read on staff for select using (auth_user_id = auth.uid() or has_org_role(org_id, array['owner','manager']::app_role[]));
create policy staff_write on staff for all using (has_org_role(org_id, array['owner','manager']::app_role[])) with check (has_org_role(org_id, array['owner','manager']::app_role[]));
-- Colleagues' names for schedules without pay data:
create or replace view v_staff_directory with (security_invoker = false) as
  select s.id, s.first_name, sr.location_id, sr.role from staff s join staff_roles sr on sr.staff_id = s.id
  where s.active and is_loc_member(sr.location_id);

alter table staff_roles enable row level security;
create policy staff_roles_read on staff_roles for select using (is_loc_member(location_id));
create policy staff_roles_write on staff_roles for all using (has_loc_role(location_id, array['owner']::app_role[])) with check (has_loc_role(location_id, array['owner']::app_role[]));

alter table role_permissions enable row level security;
create policy role_permissions_read on role_permissions for select using (auth.uid() is not null);

alter table devices enable row level security;
create policy devices_read on devices for select using (is_loc_member(location_id));
create policy devices_write on devices for all using (has_loc_role(location_id, array['owner','manager']::app_role[])) with check (has_loc_role(location_id, array['owner','manager']::app_role[]));

alter table certifications enable row level security;
create policy certifications_read on certifications for select using (
  staff_id = current_staff_id() or exists (select 1 from staff s where s.id = staff_id and has_org_role(s.org_id, array['owner','manager']::app_role[])));
create policy certifications_write on certifications for all using (
  exists (select 1 from staff s where s.id = staff_id and has_org_role(s.org_id, array['owner','manager']::app_role[])));

alter table training_records enable row level security;
create policy training_read on training_records for select using (
  staff_id = current_staff_id() or exists (select 1 from staff s where s.id = staff_id and has_org_role(s.org_id, array['owner','manager']::app_role[])));
create policy training_ins on training_records for insert with check (staff_id = current_staff_id() or
  exists (select 1 from staff s where s.id = staff_id and has_org_role(s.org_id, array['owner','manager']::app_role[])));

alter table shift_swaps enable row level security;
create policy shift_swaps_all on shift_swaps for all using (
  exists (select 1 from shifts sh where sh.id = shift_id and is_loc_member(sh.location_id)));

alter table tip_distributions enable row level security;
create policy tip_dist_read on tip_distributions for select using (
  staff_id = current_staff_id() or exists (select 1 from tip_pools p where p.id = pool_id and has_loc_role(p.location_id, array['owner','manager','accountant']::app_role[])));
create policy tip_dist_write on tip_distributions for all using (
  exists (select 1 from tip_pools p where p.id = pool_id and has_loc_role(p.location_id, array['owner','manager']::app_role[])));

-- Menu children
do $$
declare t text; parent_sql text;
begin
  for t, parent_sql in values
    ('combo_components', 'exists (select 1 from menu_items m where m.id = combo_id and %s(m.org_id%s))'),
    ('item_modifier_groups', 'exists (select 1 from menu_items m where m.id = item_id and %s(m.org_id%s))'),
    ('item_dayparts', 'exists (select 1 from menu_items m where m.id = item_id and %s(m.org_id%s))'),
    ('modifiers', 'exists (select 1 from modifier_groups g where g.id = group_id and %s(g.org_id%s))'),
    ('recipe_lines', 'exists (select 1 from ingredients i where i.id = ingredient_id and %s(i.org_id%s))'),
    ('gift_cards', '%s(org_id%s)')
  loop
    execute format('alter table %I enable row level security', t);
    execute format('create policy %I on %I for select using (' || parent_sql || ')', t || '_read', t, 'is_org_member', '');
    execute format('create policy %I on %I for all using (' || parent_sql || ') with check (' || parent_sql || ')', t || '_write', t,
      'has_org_role', ', array[''owner'',''manager'']::app_role[]', 'has_org_role', ', array[''owner'',''manager'']::app_role[]');
  end loop;
end $$;

-- Order children & payments: through the parent order's location.
do $$
declare t text;
begin
  foreach t in array array['order_items','discounts_applied','payments'] loop
    execute format('alter table %I enable row level security', t);
    execute format('create policy %I on %I for select using (exists (select 1 from orders o where o.id = order_id and is_loc_member(o.location_id)))', t || '_read', t);
    execute format('create policy %I on %I for insert with check (exists (select 1 from orders o where o.id = order_id and is_loc_member(o.location_id)))', t || '_ins', t);
    execute format('create policy %I on %I for update using (exists (select 1 from orders o where o.id = order_id and is_loc_member(o.location_id)))', t || '_upd', t);
  end loop;
end $$;

-- Refunds need the 'refund' permission (manager/owner), never a device alone.
alter table refunds enable row level security;
create policy refunds_read on refunds for select using (exists (select 1 from payments p join orders o on o.id = p.order_id where p.id = payment_id and has_loc_role(o.location_id, array['owner','manager','accountant']::app_role[])));
create policy refunds_ins on refunds for insert with check (exists (select 1 from payments p join orders o on o.id = p.order_id where p.id = payment_id and has_permission(o.location_id, 'refund')));

-- Large discounts (> 20 % of subtotal or comps) require a manager; cashiers can apply promo codes and small discounts.
create or replace function check_discount_permission() returns trigger language plpgsql security definer set search_path = public as $$
declare v_loc uuid; v_sub numeric;
begin
  select location_id, subtotal into v_loc, v_sub from orders where id = new.order_id;
  if (new.kind in ('comp','manager') or new.amount > 0.2 * greatest(v_sub, 0.01))
     and not has_loc_role(v_loc, array['owner','manager']::app_role[]) then
    raise exception 'manager approval required for this discount' using errcode = '42501';
  end if;
  return new;
end $$;
create trigger discounts_permission before insert on discounts_applied for each row execute function check_discount_permission();

alter table purchase_order_lines enable row level security;
create policy po_lines_all on purchase_order_lines for all using (exists (select 1 from purchase_orders po where po.id = po_id and has_loc_role(po.location_id, array['owner','manager','kitchen']::app_role[])));

alter table stock_count_lines enable row level security;
create policy count_lines_all on stock_count_lines for all using (exists (select 1 from stock_counts sc where sc.id = count_id and is_loc_member(sc.location_id)));

alter table checklist_runs enable row level security;
create policy checklist_runs_all on checklist_runs for all using (exists (select 1 from checklists c where c.id = checklist_id and is_loc_member(c.location_id)));

alter table temperature_logs enable row level security;
create policy temp_logs_read on temperature_logs for select using (exists (select 1 from equipment e where e.id = equipment_id and is_loc_member(e.location_id)));
create policy temp_logs_ins on temperature_logs for insert with check (exists (select 1 from equipment e where e.id = equipment_id and is_loc_member(e.location_id)));

-- CRM children (customer data)
do $$
declare t text;
begin
  foreach t in array array['customer_consents','loyalty_accounts','loyalty_transactions'] loop
    execute format('alter table %I enable row level security', t);
    execute format('create policy %I on %I for select using (exists (select 1 from customers c where c.id = customer_id and is_org_member(c.org_id)))', t || '_read', t);
    execute format('create policy %I on %I for insert with check (exists (select 1 from customers c where c.id = customer_id and is_org_member(c.org_id)))', t || '_ins', t);
  end loop;
end $$;
-- Consent rows are append-only (proof). Loyalty balance updates happen in triggers (security definer).

-- Realtime: KDS, expo and dashboard subscribe to these tables (Supabase only).
do $$ begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table orders, order_items, item_86, alerts, approvals, platform_store_status, waitlist_entries;
  end if;
end $$;
