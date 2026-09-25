// Generates miam-os/supabase/seed.sql from data/menu.json (the same master menu as the website).
//   node miam-os/scripts/generate-seed.mjs
import { readFileSync, writeFileSync } from "node:fs";
const root = new URL("../../", import.meta.url).pathname;
const menu = JSON.parse(readFileSync(root + "data/menu.json", "utf8"));
const q = (s) => (s == null ? "null" : `'${String(s).replace(/'/g, "''")}'`);
const arr = (a) => `array[${a.map(q).join(",")}]::text[]`;
const ORG = "00000000-0000-0000-0000-00000000000a";
const LOC = "00000000-0000-0000-0000-0000000000b1";
const station = (it) => (["cafe", "froid"].includes(it.cat) ? "bar" : it.cat === "viennoiseries" ? "pastry" : "kitchen");
let sql = `-- Generated from data/menu.json. Re-run the generator after menu changes.\n-- Demo organisation + first location. Replace address fields with the real ones.\n\n`;
sql += `insert into organizations (id, name) values ('${ORG}', 'Miam''s Resto Café') on conflict do nothing;\n`;
sql += `insert into locations (id, org_id, name, city, region, country, seats, terrace_seats) values ('${LOC}', '${ORG}', 'Miam''s · Montréal 1', 'Montréal', 'QC', 'CA', 40, 20) on conflict do nothing;\n\n`;
sql += `insert into kitchen_stations (location_id, slug, name) values ('${LOC}','kitchen','Cuisine'),('${LOC}','bar','Bar / café'),('${LOC}','pastry','Pâtisserie') on conflict do nothing;\n\n`;
const dp = { matin: [[1, 2, 3, 4, 5], "07:30", "11:00"], midi: [[1, 2, 3, 4, 5, 6, 7], "11:00", "16:00"], aprem: [[1, 2, 3, 4, 5, 6, 7], "14:00", "17:00"], soir: [[4, 5], "17:00", "21:00"] };
for (const d of menu.dayparts) {
  const [days, s, e] = dp[d.id];
  sql += `insert into dayparts (location_id, slug, name_fr, name_en, days, starts, ends) values ('${LOC}', ${q(d.id)}, ${q(d.fr)}, ${q(d.en)}, array[${days}], '${s}', '${e}') on conflict do nothing;\n`;
}
sql += `insert into dayparts (location_id, slug, name_fr, name_en, days, starts, ends) values ('${LOC}', 'matin', 'Brunch', 'Brunch', array[6,7], '08:30', '16:00') on conflict do nothing;\n\n`;
menu.categories.forEach((c, i) => {
  sql += `insert into categories (org_id, slug, name_fr, name_en, note_fr, note_en, menu_group, sort) values ('${ORG}', ${q(c.id)}, ${q(c.fr)}, ${q(c.en)}, ${q(c.note_fr)}, ${q(c.note_en)}, ${q(c.group)}, ${i}) on conflict do nothing;\n`;
});
sql += "\n";
menu.items.forEach((it, i) => {
  sql += `insert into menu_items (org_id, category_id, slug, name_fr, name_en, desc_fr, desc_en, base_price, allergens, tags, photo_path, station_slug, is_combo, sort)
  select '${ORG}', c.id, ${q(it.id)}, ${q(it.fr)}, ${q(it.en)}, ${q(it.desc_fr || null)}, ${q(it.desc_en || null)}, ${it.price}, ${arr(it.allergens)}, ${arr(it.tags)}, ${q("menu/" + it.photo)}, ${q(station(it))}, ${it.tags.includes("combo")}, ${i}
  from categories c where c.org_id = '${ORG}' and c.slug = ${q(it.cat)} on conflict do nothing;\n`;
  for (const d of it.dayparts) sql += `insert into item_dayparts (item_id, daypart_slug) select id, ${q(d)} from menu_items where org_id = '${ORG}' and slug = ${q(it.id)} on conflict do nothing;\n`;
  const ch = { dine_in: it.channels.dine_in, takeout: it.channels.takeout, online_pickup: it.channels.online_pickup, catering: it.channels.catering };
  for (const [k, v] of Object.entries(ch)) sql += `insert into item_channel_settings (item_id, location_id, channel, price, available) select id, '${LOC}', '${k}', null, ${v} from menu_items where org_id = '${ORG}' and slug = ${q(it.id)} on conflict do nothing;\n`;
  for (const p of ["uber_eats", "doordash", "skip"]) sql += `insert into item_channel_settings (item_id, location_id, channel, price, available) select id, '${LOC}', '${p}', ${it.price_delivery ?? "null"}, ${it.channels.delivery} from menu_items where org_id = '${ORG}' and slug = ${q(it.id)} on conflict do nothing;\n`;
});
// Starter recipe + ingredients for the signature dish (template for the rest; owner completes with real specs).
sql += `
-- Starter ingredients & recipe (Shakshuka Miam's). Costs are estimates; receiving updates them automatically.
insert into ingredients (org_id, name, unit, cost_per_unit, storage, allergens, is_prep, shelf_life_hours) values
  ('${ORG}', 'Œuf gros (Québec)', 'unit', 0.42, 'walk-in', array['eggs'], false, null),
  ('${ORG}', 'Sauce shakshuka (maison)', 'g', 0.0065, 'walk-in', '{}', true, 72),
  ('${ORG}', 'Feta', 'g', 0.021, 'walk-in', array['milk'], false, null),
  ('${ORG}', 'Pain au levain', 'g', 0.009, 'dry', array['gluten'], false, null),
  ('${ORG}', 'Coriandre fraîche', 'g', 0.03, 'walk-in', '{}', false, null)
on conflict do nothing;
insert into recipe_lines (item_id, ingredient_id, qty, yield_pct)
select mi.id, i.id, v.qty, v.y from (values
  ('Œuf gros (Québec)', 2, 100), ('Sauce shakshuka (maison)', 280, 100), ('Feta', 30, 100), ('Pain au levain', 90, 95), ('Coriandre fraîche', 4, 80)
) v(name, qty, y) join ingredients i on i.name = v.name and i.org_id = '${ORG}'
join menu_items mi on mi.slug = 'shakshuka' and mi.org_id = '${ORG}';
insert into stock_levels (location_id, ingredient_id, on_hand, par_level, reorder_point)
select '${LOC}', id, case unit when 'unit' then 360 else 20000 end, case unit when 'unit' then 360 else 20000 end, case unit when 'unit' then 90 else 5000 end
from ingredients where org_id = '${ORG}' on conflict do nothing;

insert into equipment (location_id, name, kind, min_temp, max_temp) values
  ('${LOC}', 'Chambre froide', 'fridge', 0, 4), ('${LOC}', 'Frigo comptoir bar', 'fridge', 0, 4),
  ('${LOC}', 'Congélateur', 'freezer', -25, -18), ('${LOC}', 'Bain-marie', 'hot_holding', 60, 90);

insert into integrations (location_id, provider, kind, needs_platform_approval) values
  ('${LOC}', 'pos', 'official_api', false), ('${LOC}', 'aggregator', 'connector', false),
  ('${LOC}', 'uber_eats', 'connector', true), ('${LOC}', 'doordash', 'connector', true), ('${LOC}', 'skip', 'connector', true),
  ('${LOC}', 'glovo', 'official_api', true), ('${LOC}', 'google_business', 'official_api', true),
  ('${LOC}', 'meta', 'official_api', true), ('${LOC}', 'ga4', 'official_api', false), ('${LOC}', 'libro', 'connector', false),
  ('${LOC}', 'klaviyo', 'official_api', false), ('${LOC}', 'twilio', 'official_api', false),
  ('${LOC}', 'quickbooks', 'official_api', false), ('${LOC}', 'payroll', 'manual', false)
on conflict do nothing;
`;
writeFileSync(root + "miam-os/supabase/seed.sql", sql);
console.log("seed.sql written:", menu.items.length, "items");
