# Phase 9: MIAM OS, the restaurant management system

MIAM OS runs the business and the whole ecosystem from one place. The owner opens one app on their phone, sees everything, and acts in a few taps.

**Built in this repo:** [`miam-os/`](../miam-os/)
- [`supabase/migrations/…_core.sql`](../miam-os/supabase/migrations/20260925000001_miam_os_core.sql): **73 tables** covering menu, orders, KDS, inventory, recipes, staff, CRM, finance, compliance and the ecosystem hub
- [`supabase/migrations/…_logic_rls.sql`](../miam-os/supabase/migrations/20260925000002_miam_os_logic_rls.sql): permission matrix, 86-everywhere, automatic stock deduction, GST/QST totals, audit triggers, alerts, 9 reporting views, **row-level security on every table**
- [`supabase/seed.sql`](../miam-os/supabase/seed.sql): generated from the same master menu as the website (`node miam-os/scripts/generate-seed.mjs`)
- [`supabase/tests/rls_test.sql`](../miam-os/supabase/tests/rls_test.sql): 10 behaviour and security tests; run `bash miam-os/scripts/test-local.sh` (**all passing**)

## 9.1 Buy, build or hybrid

> ⚠️ **Québec rule that decides this:** restaurants in Québec must record sales with a **sales recording system (SRS) certified by Revenu Québec** that transmits to Revenu Québec's web service (the mandatory billing measures, which have been moving to the "WEB-SRM" model). A custom POS would need its own certification, a long and costly process. **Verify the current requirements, deadlines and the certified-product list on revenuquebec.ca with your accountant before choosing a POS.**

| | A) Off-the-shelf stack | B) Fully custom | **C) Hybrid** ⭐ |
|---|---|---|---|
| What | Certified POS + add-ons (7shifts scheduling, MarketMan inventory, Otter/Deliverect aggregation, Libro, Klaviyo…) | Everything built for Miam's, including POS and payments | **Certified POS + payments** for order-taking and SRS; **custom MIAM OS layer** for menu master, KDS extras, inventory/recipes, CRM, dashboard and ecosystem hub |
| Setup cost | $3,000–8,000 (hardware + onboarding) | $120,000–250,000 + Québec SRS certification | $3,000–8,000 (POS) + $35,000–70,000 MVP (custom layer) |
| Monthly cost | $600–1,200 (5–8 subscriptions) | $800–2,000 hosting + support | $300–600 (POS) + $150–400 (hosting and services) + support retainer |
| Time to launch | 2–4 weeks | 9–15 months | POS 2–4 weeks; MIAM OS MVP 10–12 weeks, running alongside |
| Flexibility | Low: data split across 8 apps; no single dashboard | Total | High where it matters (menu, ops, CRM, dashboard) |
| Reliability | High (proven) | Unproven, and you own every outage | High: payments and order capture stay on proven, certified systems |
| Support | Vendors (8 of them) | Your developer | POS vendor + one agency/developer |
| Data ownership | Fragmented; export limits | Full | **Full for the MIAM OS layer**; POS data synced in |
| Second location | Add licences | Built in | Built in (`org → locations` model, per-location RLS) |
| Compliance | Vendor-certified | You must certify | **POS certified; MIAM OS never takes card data or replaces SRS** |

**Recommendation: C (Hybrid).** It is the only option that is compliant on day 1, gives the owner one app, and keeps Miam's data ownable and portable. Card payments stay entirely with the certified provider: **MIAM OS stores payment references only** (`payments.provider_payment_id`, last 4 digits at most; enforced by the schema).

**POS shortlist to check against Revenu Québec's certified list, with an open API** (needed for MIAM OS sync): Lightspeed Restaurant (K-Series), TouchBistro, Maitre'D, Veloce, Square for Restaurants. Selection criteria, in order: (1) SRS-certified for Québec, (2) open API with order webhooks, (3) native Uber Eats/DoorDash or aggregator support, (4) online ordering + gift cards included, (5) French interface.

## 9.2 Users, roles & permissions

Roles: Owner · Manager · Cashier/Server · Kitchen · Barista · Delivery/Expo · Accountant (read-only). Stored as **data** (`role_permissions`), so the owner can adjust them without a developer.

| Permission | Owner | Manager | Cashier | Kitchen | Barista | Expo | Accountant |
|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| Take orders, table map | ✅ | ✅ | ✅ | n/a | ✅ | ✅ | n/a |
| Void item before sending | ✅ | ✅ | ✅ | n/a | ✅ | n/a | n/a |
| Void after sending / comp | ✅ | ✅ | 🔐 manager PIN | n/a | n/a | n/a | n/a |
| Discount ≤ 20 % / promo code | ✅ | ✅ | ✅ | n/a | ✅ | n/a | n/a |
| Discount > 20 % / manager discount | ✅ | ✅ | 🔐 | n/a | n/a | n/a | n/a |
| Refund | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Open cash drawer (no sale) | ✅ | ✅ | ✅ (logged) | n/a | n/a | n/a | n/a |
| 86 / sold out | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Price changes | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Inventory counts, waste, receiving | ✅ | ✅ | n/a | ✅ | ✅ | n/a | 👁 |
| Recipes & costs | ✅ | ✅ | n/a | 👁 recipe only | 👁 recipe only | n/a | 👁 |
| Schedule edits / publish | ✅ | ✅ | request swap | request swap | request swap | request swap | n/a |
| View financials (P&L, sales, labour %) | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | 👁 |
| Export data | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Staff pay rates | ✅ | ❌ | own only | own only | own only | own only | ✅ via payroll export |
| Integrations & API keys | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Approve review replies, posts, POs | ✅ | ✅ (not POs > $1,500) | ❌ | ❌ | ❌ | ❌ | ❌ |

**Login model:** shared devices (POS, KDS, time clock) sign in as a **device account**, then each staff member enters a **4–6 digit PIN** (bcrypt-hashed, `verify_staff_pin`). Owner, manager and accountant use a **full login with 2FA** on their own phone. **Activity log:** every void, refund, discount, drawer open, price change, 86 and store pause writes to `audit_logs` with who, what, before/after and reason (tested).

## 9.3 Core modules: functional specification

### 1. Orders & POS
- **Where:** in the certified POS (order capture, payments, receipts, SRS). MIAM OS mirrors every sale by webhook into `orders`/`order_items` for operations and reporting.
- Order types: dine-in with table map and status (free, seated, ordered, paying, dirty, reserved), takeout, online pickup, delivery (own + platforms), catering.
- Modifiers, combos (`combo_components`), notes, seat numbers, split and merge (POS), tips, discounts and promo codes (`promo_codes` with campaign for ROI), gift cards (POS balance of record), refunds.
- **Taxes:** GST 5 % + QST 9.975 % on the discounted subtotal (`recalc_order`, tested: $42.00 → $48.29). ⚠️ Confirm zero-rated items (some basic groceries sold unprepared) with the accountant.
- **Receipts** (print/email/SMS from the POS) with the QR footer `/m/receipt` (review) and loyalty signup.
- **Offline mode:** the POS's own offline mode for payments (verify offline card acceptance limits); the MIAM OS PWA queues writes in IndexedDB and syncs when back online.

### 2. Kitchen Display System (KDS)
- Tickets routed by `menu_items.station_slug` → **Cuisine**, **Bar/café**, **Pâtisserie**. Colour timers: white < 8 min, Safran 8–12, Terracotta > 12 (weekend brunch thresholds +3 min).
- Bump / recall, **all-day counts** ("Shakshuka × 7"), **allergy alerts in red** (`order_items.allergy_alert`, triggered by a customer allergy profile or a note keyword).
- Expo screen (all stations per order) + **customer "Prêt / Ready" screen** at pickup, with ticket number and first name.
- Prep-time tracking per item (`fired_at → ready_at`), whose weekly median feeds each delivery platform's prep-time setting.

### 3. Central Menu Manager (single source of truth)
- Master menu = `menu_items` (same slugs as `data/menu.json`). Publishing writes `menu.json` for the **website, QR menu and screens**, and pushes to the **POS** and **aggregator → platforms** through `sync_outbox`.
- Per-channel price and availability (`item_channel_settings`, e.g. delivery +15 %, dine-in-only items).
- **Daypart menus** with automatic switching (`dayparts`, `item_dayparts`).
- **One-tap 86** (`set_item_86`) hides the item on POS, QR, website, screens and every connected platform, with an optional auto-return time (tested fan-out).
- Photos, FR/EN names and descriptions, allergens, dietary tags.

### 4. Inventory, recipes & purchasing
- Ingredient database (unit, supplier, cost, storage, allergens, shelf life). Recipe cards (`recipe_lines` with yield %) → **live cost per portion and food cost %** (`v_item_cost`; e.g. Shakshuka 23.8 % on the starter recipe).
- **Automatic stock deduction** at order completion, including modifiers linked to items (tested: 2 shakshukas → −4 eggs).
- Par levels and reorder points → low-stock alerts → **suggested purchase orders** (par − on hand, rounded to the supplier's pack size).
- Suppliers, POs (approval over $1,500), **receiving with price-change alerts** (> 5 %) that update ingredient costs automatically.
- Weekly mobile stock count; waste log with reasons; **variance report** (theoretical vs actual, `v_inventory_variance`).
- Prep batches with printed labels (item, made at, by, expires at) and expiry tracking.

### 5. Staff management
- Profiles, availability, documents and **certifications with expiry alerts** (MAPAQ food hygiene training for the manager and handlers).
- Drag-and-drop scheduling with **labour cost forecast vs sales forecast** (`sales_forecasts` by hour).
- Time clock on the POS or phone (geofenced for phones), breaks, overtime alert at 40 h/week (the Québec overtime threshold under the *Act respecting labour standards*; verify).
- **Tip pooling** by rule (default 70 % floor / 30 % kitchen by hours; ⚠️ Québec rules on tip sharing: employer and managers can't take part; confirm the pool design with CNESST guidance).
- **Payroll export** (hours, tips) to Nethris / Employeur D / other (CSV matching the provider's import format).
- Shift notes, tasks, announcements (FR/EN), **training** (SOPs, menu and allergen quizzes, onboarding checklist).

### 6. Reservations, waitlist & events
- Booking via Libro (website, Reserve with Google, Instagram) → mirrored in `reservations` for the table map.
- Walk-in **waitlist with SMS "votre table est prête"** (Twilio; text in the guest's language).
- Private events and catering pipeline: **inquiry → quote → deposit → event sheet → invoice** (`event_leads.stage`).

### 7. Customers, CRM & loyalty
- Unified profile: orders across channels, visits, spend, favourites, allergies, birthday, language, **consent records with proof** (`customer_consents`: wording, source, timestamp, CASL implied-consent expiry).
- Loyalty (Phase 12): points, tiers, digital card; earned automatically on direct channels only (tested).
- Segments: new, regular, VIP, at-risk, lost (`v_customer_segments`).
- Automations: welcome, birthday, win-back, post-visit review request (email/SMS with consent checks).
- Feedback and complaint tracking through to resolution.

### 8. Delivery & online orders hub (Uber Eats, DoorDash, Skip, Glovo, direct)
- **Direct ordering** (POS online ordering, commission-free) with pickup; own delivery via on-demand couriers later.
- **One order queue:** platform orders → aggregator → POS → KDS, and MIAM OS mirrors them. No three tablets.
- **Glovo** (Glovo does not operate in Canada; this is for future locations in Glovo markets):
  - **Option A (fastest, recommended):** connect Glovo through an aggregator that already integrates it (e.g. Deliverect; verify current Glovo support), then aggregator webhooks → MIAM OS `integration_events` → orders.
  - **Option B (direct):** apply as an integration partner on the Glovo Partners API to receive orders by webhook, accept/reject, update status, sync menu/prices/availability and open/close the store.
  - ⚠️ OWNER ACTION: Glovo must approve API access and provide store IDs and credentials; confirm current requirements with the Glovo partner team.
- **Two-way sync:** menu change or 86 in MIAM OS → platforms (through `sync_outbox`); platform order → stock, sales and dashboard in real time.
- **Delivery dashboard per platform:** orders, revenue, **commission paid, net revenue**, average prep time, cancellations, ratings, promotions running (`orders.platform_commission`, `platform_store_status`).
- Delivery zones, fees, minimum order and ETA for direct delivery; dispatch via on-demand courier API.
- **Channel profitability:** `v_daily_sales.net_after_platform` by channel, with a weekly recommendation ("DoorDash net margin per order is 31 % lower than direct pickup: promote pickup this week").

### 9. Finance & daily closing
- **End-of-day closing** (`daily_closings`): sales by channel and payment method, taxes, tips, voids, discounts, covers, **cash drawer count and variance** (`drawer_sessions.variance`).
- Expenses with receipt photo upload and categories, GST/QST split (input tax credits).
- Supplier invoices (payable) and catering invoices (receivable).
- Tax summaries; **accounting export to QuickBooks Online** (API) or CSV for others.
- **Weekly P&L snapshot:** revenue, food cost, labour cost, **prime cost** (`v_weekly_prime_cost`), operating expenses, profit.

### 10. Food safety & compliance
- Digital temperature logs (manual or sensor), **out-of-range urgent alert** (tested).
- Cleaning schedules, opening/closing checklists with sign-off (`checklists`, `checklist_runs`).
- **Allergen matrix generated from recipes** (`v_allergen_matrix`, tested).
- Pest control, MAPAQ inspection records, hood cleaning, extinguishers, equipment maintenance reminders (`compliance_records`, `equipment.service_interval_days`).

### 11. Dashboard, reports & alerts
- **Owner dashboard (mobile first):** today's sales vs forecast and same day last week, orders by channel, average ticket, covers, food cost %, labour cost %, prime cost, top/bottom 5 items, Google rating, new vs returning customers.
- Reports: sales by hour/day/item/category/channel/staff; **menu engineering matrix auto-updated** (`v_menu_engineering`, same method as Phase 3); inventory variance; labour vs sales.
- **Alerts** with priority: low stock (today), high voids/discounts (> 2 % of sales; today), labour over target (today), negative review (urgent), temperature (urgent), sales < 80 % of forecast by 13:00 (today), ad cost above target (FYI).
- Scheduled emails: daily flash at 21:30, weekly on Monday 7:00.

### 12. Marketing connections
- Meta Pixel + **Conversions API** and GA4 events from online orders and reservations (server-side from MIAM OS, deduplicated by event ID).
- Customer lists synced **with consent only** to Meta Custom Audiences (hashed).
- Promo code and QR placement tracking (`promo_codes.campaign`, `orders.utm`) → real ROI of ads and print.

### 13. Ecosystem command centre

| Surface | What the owner sees and does | Connection type | Platform approval needed? |
|---|---|---|---|
| Website | Edit menu, hours, banners, promos (publishes `menu.json` + rebuild hook); visits, online orders, conversion | Official (our code + Cloudflare deploy hook + GA4 Data API) | No |
| QR menu | Scans by placement, most-viewed items, language used | GA4 Data API (official) | No |
| In-store screens | Change slides, prices, specials; schedule by daypart | Our code (`menu.json` + board config) | No |
| Google Business Profile | Rating, new reviews with **AI-drafted replies approved by the owner before posting**, views, calls, directions; holiday hours; Google Posts | **Official Business Profile APIs** | ⚠️ Yes: Google requires API access approval for Business Profile APIs |
| Social media | Calendar, scheduled posts, approvals, comments and DMs needing a reply, follower growth | Official Meta Graph API (Instagram/Facebook); TikTok via its official API or a scheduler (e.g. Later, Buffer) as a connector | ⚠️ Meta app review for some permissions |
| Meta Ads | Spend, results, cost per order/reservation, ROAS by campaign; pause/boost; cost alerts | Official Marketing API | ⚠️ Meta app review / business verification |
| Delivery platforms | Store status (open/closed/busy), ratings, orders and payouts for Uber Eats, DoorDash, Skip (+ Glovo future) | **Third-party connector** (aggregator API); direct platform APIs are partner-gated | ⚠️ Yes for direct APIs; aggregator handles approvals |
| POS | Orders, payments (references), menu push, 86 | Official POS API | Depends on vendor (developer account) |
| Reservations | Bookings, no-shows, covers | Libro API/webhooks if available, otherwise export or manual view (verify) | Vendor approval |
| Accounting / payroll | Exports | QuickBooks API (official); payroll CSV (manual) | No |
| **Tasks & approvals inbox** | Everything waiting for the owner: review replies, posts, POs, schedule changes, refunds, discounts (`approvals`) | Internal | n/a |
| **Weekly AI business summary** | Monday 7:00: what went well, what went wrong, 3 actions for the week, generated from the views above by an LLM (Claude via the Anthropic API) with numbers quoted from the data, never invented | Official API | No |

## 9.4 Technical specification

**Architecture**
```
 Certified POS (+payments, SRS) ──webhooks──┐          ┌── Website / QR / Screens (static, menu.json)
 Aggregator (Uber, DoorDash, Skip, Glovo) ──┤          │
 Libro, Google, Meta, GA4, Klaviyo, Twilio ─┼─► Edge Functions (ingest, idempotent) ─► PostgreSQL (Supabase)
                                            │            ▲        │  RLS, triggers, views
                                            │            │        ▼
                                            └── sync_outbox worker (cron, retries) ◄── Realtime channels
                                                                  │
                          MIAM OS PWA (Next.js): Owner app · Manager tablet · KDS · Expo · Time clock · Staff app
```
- **Web app + installable PWA**, one codebase for phone, tablet, KDS screens. Offline-first on order-taking devices (service worker + IndexedDB queue; POS remains the fallback for payments).
- **Real-time:** Supabase Realtime on `orders`, `order_items`, `item_86`, `alerts`, `approvals`, `platform_store_status`, `waitlist_entries` (enabled in the migration).

**Recommended stack**

| Layer | Choice | Why | Monthly (verify) |
|---|---|---|---|
| Front end | **Next.js (React) + TypeScript**, Tailwind with Phase 2 tokens, PWA | One codebase, great offline and PWA support, large hiring pool | n/a |
| Backend / DB | **Supabase** (PostgreSQL, Auth with 2FA, RLS, Realtime, Storage, Edge Functions, Vault for secrets) | Row-level security for our role model, realtime KDS, low ops | $25–75 (Pro) |
| Hosting | Vercel (app) + Cloudflare Pages (website) | Global CDN, preview deploys | $0–20 |
| Jobs | Supabase cron + Edge Functions (sync worker, daily closing, reports) | No extra server | included |
| Email / SMS | Klaviyo (marketing) · Resend or Postmark (transactional) · Twilio (SMS) | CASL-compliant consent handling | $30–120 |
| AI | Anthropic API (review reply drafts, weekly summary) | Owner approves every public reply | $5–30 |
| Monitoring | Sentry + Supabase logs + uptime check | Alerts on sync failures | $0–26 |
| **Total** | | | **≈ $90–350/month** for the custom layer |

**Data model:** the full list is in the migration. Main tables: `organizations, locations, staff, staff_roles, role_permissions, devices, certifications, categories, menu_items, combo_components, modifier_groups, modifiers, item_modifier_groups, dayparts, item_dayparts, item_channel_settings, item_86, sync_outbox, dining_tables, kitchen_stations, customers, orders, order_items, discounts_applied, promo_codes, payments, refunds, gift_cards, reservations, waitlist_entries, event_leads, customer_consents, loyalty_accounts, loyalty_transactions, feedback, suppliers, ingredients, recipe_lines, stock_levels, stock_movements, purchase_orders, purchase_order_lines, stock_counts, stock_count_lines, waste_logs, prep_batches, shifts, shift_swaps, time_entries, tip_pools, tip_distributions, tasks, announcements, training_records, drawer_sessions, daily_closings, expenses, invoices, equipment, temperature_logs, checklists, checklist_runs, compliance_records, integrations, integration_events, platform_store_status, reviews, social_posts, ad_campaign_daily, approvals, alerts, sales_forecasts, audit_logs`. Key relationships: `org 1─n locations 1─n (orders, stock, shifts…)`; `menu_items n─n ingredients` via `recipe_lines`; `orders 1─n order_items`, `orders 1─n payments 1─n refunds`; `customers 1─n (orders, consents, loyalty_transactions)`.

**Integrations list:** certified POS + payment processor · receipt printers and cash drawer (driven by the POS) · delivery aggregator (Otter/Deliverect/Cuboh) · QuickBooks Online · payroll (Nethris/Employeur D export) · Klaviyo, Resend/Postmark, Twilio · Google Business Profile APIs · Meta Graph + Marketing + Conversions API · GA4 Data API · Libro · Anthropic API.

**Security**
- **RBAC + row-level security on every table** (tested: cross-org isolation, cashier cannot see financials, colleague pay or refund; accountant is read-only; devices can't read management queues).
- Supabase Auth with **TOTP 2FA mandatory for owner/manager/accountant**; device accounts revocable (`devices.revoked`, i.e. remote logout of a lost tablet or phone).
- Encryption in transit (TLS) and at rest (Supabase); secrets in **Vault**, never in `integrations.config`.
- **Audit logs** for sensitive actions; **daily backups** + point-in-time recovery (Supabase Pro add-on); quarterly restore test.
- **No card data** (schema constraint on `card_last4`, no PAN fields).
- **Law 25:** privacy officer named; consent records; retention jobs (reservations 12 months, marketing 3 years inactive); `customers.deleted_at` anonymisation routine; privacy impact assessment before sending data outside Québec (Supabase region: choose **Canada (Central)** if available on your plan; verify).

**Hardware**

| Item | Qty | Est. cost (CAD, verify) |
|---|---|---|
| POS terminals (from the chosen POS vendor, or iPads with stands) | 2 | $1,200–3,000 |
| Card readers (tap/chip, vendor-certified) | 2 | $400–1,000 |
| Kitchen display screens (22–24" touchscreen or tablets with wall mounts, grease-resistant) | 3 (cuisine, bar, expo) | $900–2,400 |
| Customer "ready" screen (32" TV + stick) | 1 | $250–450 |
| Receipt printers (thermal, Ethernet) | 2 | $500–900 |
| Kitchen impact printer (backup tickets) | 1 | $350–600 |
| Label printer (prep labels, delivery stickers) | 1 | $150–350 |
| Cash drawer | 1 | $150–300 |
| Business router + managed Wi-Fi (separate guest network) | 1 | $300–700 |
| **Backup internet: 4G/5G router with automatic failover** | 1 | $250–500 + $30–60/mo |
| Owner/manager tablet | 1 | $400–900 |
| Temperature sensors (optional, wireless) | 4 | $300–800 |
| **Total** | | **$5,150–11,900** |

**Multi-language & multi-location:** every label, SOP and announcement has FR/EN fields; staff choose their language (`staff.preferred_language`); all data is location-scoped, so location #2 is a new `locations` row plus role assignments.

## 9.5 Screens & user experience

**Speed rule (acceptance criterion for every build):** take an order, bump a ticket, mark sold out, clock in: **≤ 3 taps each.**

| Role | Screens |
|---|---|
| Owner (phone) | Home dashboard · Live feed · Approvals inbox · Menu & 86 · Channels (platforms + pause) · Reviews · Social calendar · Ads · Reports · Staff & schedule · Finance (closing, P&L) · Settings & integrations |
| Manager (tablet) | Shift overview · Table map · 86 manager · Waitlist · Reservations · Inventory count · Receiving · Purchase orders · Waste log · Schedule builder · Time-clock edits · Daily closing · Checklists · Temperature logs · Alerts |
| Cashier/Server | (POS for orders) · MIAM OS: table map, waitlist, 86, customer lookup (loyalty, allergies), tasks |
| Kitchen | KDS station view · all-day counts · recipe card viewer · prep list & labels · waste log · temperature log |
| Barista | Bar KDS · 86 · milk and bean stock quick count |
| Expo | Expo view · pickup "Ready" screen control · bag checklist |
| Accountant | Sales & tax reports · closings · expenses & invoices · exports |
| Staff app | My schedule · swaps · clock in/out · tasks & checklists · training · announcements · my tips |

**Key screen wireframes**

1. **Owner home (phone):** top: date + location switcher · hero card "Ventes aujourd'hui $3,480 · prévision $3,300 (+5 %) · vs mardi dernier +12 %" · chips: covers, avg ticket, labour %, food cost %, rating · stacked bar "par canal" (Salle, Emporter, Site, Uber, DoorDash, Skip) · "À approuver (3)" card · "Alertes (1 urgente)" card · bottom nav: Accueil · Fil · Approuver · Menu · Plus.
2. **86 manager:** search bar + category chips; each item row has a big toggle "Disponible / Épuisé"; tapping Épuisé offers "jusqu'à la fermeture / demain 6 h / manuel" (**2 taps**); banner shows "Masqué sur : caisse, site, écrans, Uber Eats, DoorDash ✓".
3. **KDS station:** tickets as columns sorted by age; header = ticket #, channel icon, table/name, timer colour; red allergy band across the top of the ticket; tap item = done, tap header = bump (**1 tap**); swipe-down = recall; right rail: all-day counts.
4. **Inventory count (phone):** grouped by storage location in walking order; each ingredient row: last count, theoretical, numeric pad input; progress bar; "Soumettre" → variance summary.
5. **Time clock (shared tablet):** PIN pad → "Bonjour Sam ! Quart 7:00–15:00" → big "Pointer l'arrivée" (**2 taps**); shows break reminder.
6. **Daily closing (manager):** checklist wizard: count drawer (denominations) → variance → tips pool → voids/discounts review → notes → submit → PDF emailed to the owner and accountant.
7. **Approvals inbox:** cards with type icon, summary, preview (review + AI draft editable), buttons **Approuver / Modifier / Refuser**.
8. **Channels:** one row per platform with state pill (Ouvert/Occupé/Pause), rating, orders today, prep time; "Pause 20 min" button (**2 taps**) with auto-resume.

Visual system: Phase 2 tokens (Crème background, Olive text, Terracotta primary, Safran highlights); KDS uses dark mode (Olive background) for glare; minimum touch target 48 px; numbers in tabular Inter.

## 9.6 Build plan

### MVP (launch-critical), weeks 1–10 · $35,000–55,000
Scope: POS integration (orders mirror) + KDS + central menu + 86 everywhere + online ordering (POS) + delivery order hub via aggregator + daily closing + owner dashboard in the mobile PWA.

| User story | Acceptance criteria |
|---|---|
| As a barista, I see drink tickets on the bar KDS the moment they're paid | Ticket appears < 2 s after POS payment (p95); routed by station; bump in 1 tap |
| As a cook, allergy orders are unmistakable | Any order with an allergy note or profile shows a red band + allergen names; can't bump without acknowledging |
| As a manager, I mark an item sold out everywhere | ≤ 2 taps; hidden on POS, website, QR, screens and each platform within 60 s (aggregator permitting); audit entry |
| As the owner, I change a price once | Price propagates to POS and `menu.json`; delivery price recalculated (+15 %); audit entry; takes effect at next build (< 5 min) |
| As the owner, I see today's sales by channel on my phone | Dashboard loads < 2 s on 4G; figures match POS end-of-day ± $0.01 |
| As a manager, I close the day in < 10 min | Wizard complete; drawer variance calculated; PDF emailed |
| As expo, Uber Eats/DoorDash orders arrive in the same queue | No platform tablet needed; order appears in POS + KDS < 30 s after acceptance |

### Version 2, weeks 11–18 · $25,000–40,000
Inventory and recipe costing, purchasing and receiving, waste, counts, variance · staff scheduling, time clock, tip pooling, payroll export · reservations/waitlist with SMS.

### Version 3, weeks 19–28 · $25,000–45,000
CRM, loyalty and automations (Phase 12) · advanced delivery dashboard and channel profitability · advanced reports and menu engineering · food-safety logs and compliance · ecosystem command centre (GBP, Meta, social, ads) · weekly AI summary.

**Testing plan (every version):** unit tests on SQL functions (as in `rls_test.sql`), RLS tests per role, end-to-end tests on the PWA (Playwright), load test at 3× projected peak, and a **full rush-hour simulation before go-live**: 90 minutes, 6 staff, 120 scripted orders across all channels (including allergy orders, 86 mid-rush, a platform pause, internet cut-over to 4G, a printer failure).

**Go-live plan:** import menu (seed generator, done), recipes (template), staff, suppliers → 2 training sessions of 2 h per role (FR/EN) → **parallel run 1 week** (paper backup tickets + POS reports as reference) → cut-over on a Monday → **rollback:** POS continues standalone; KDS falls back to kitchen printer tickets; MIAM OS disabled via feature flag without data loss.

**Maintenance:** monthly dependency updates, security patches within 72 h, quarterly restore test, support retainer **$500–1,500/month** (SLA: urgent < 2 h during opening hours).

## 9.7 MIAM OS mobile app

| | **PWA** ⭐ | Native iOS/Android |
|---|---|---|
| Cost | Included in the web build | +$30,000–60,000 |
| Time | Same release | +8–12 weeks, plus app-store review |
| Push notifications | Yes (Android; iOS 16.4+ when installed to the home screen) | Yes |
| Face ID / fingerprint | Yes, via WebAuthn passkeys | Yes |
| Updates | Instant | Store review |
| **Recommendation** | **PWA first**; revisit native only if iOS push or background features prove insufficient | |

- **Home:** live sales, orders by channel (salle, emporter, site, Glovo*, Uber Eats, DoorDash, Skip), vs yesterday and last week, labour %, food cost %, rating. *(Glovo appears once a location in a Glovo market exists.)*
- **Live feed:** every order, review, low stock, void/refund, clock-in and ad alert, filterable.
- **One-tap actions:** 86 everywhere · pause a platform · approve refund/discount · approve post · reply to a review · change a price · approve a PO · message the team.
- **Notifications with priority:** 🔴 urgent (temperature, negative review, platform offline, allergy complaint) immediate · 🟠 today (low stock, labour over target, sales below forecast) batched at 11:00 and 15:00 · ⚪ FYI in the Monday summary. **Quiet hours 22:00–7:00** except urgent.
- **Staff app mode:** schedule, swaps, clock in/out, tasks and checklists, training, tips.
- **Security:** passkey (Face ID/fingerprint) login, 2FA, remote logout, financials visible to owner/manager/accountant only (RLS).
- **Poor connection:** cached dashboard (stale badge with timestamp), queued actions retried on reconnect.
- **Navigation map:** `Accueil → (Ventes détail, Canaux, Alertes)` · `Fil` · `Approuver` · `Menu → (86, Prix, Daypart)` · `Plus → (Équipe, Horaires, Inventaire, Finances, Avis, Réseaux, Pubs, Réglages)`.

## 9.8 Operations playbook

**Role descriptions (summary)**
- **Owner:** vision, finances, approvals, brand voice, key relationships; 30-minute daily MIAM OS review.
- **Manager:** runs shifts, schedule, inventory, closing, training, first line on complaints.
- **Cooks:** prep lists, line, labelling, temperature logs, waste logging.
- **Baristas:** coffee quality (dial-in at opening), bar KDS, pastry display, cashier backup.
- **Floor/cashier:** greeting within 10 s, orders, table turns, waitlist, upsell, review ask.
- **Dish/prep:** dishwashing, prep batches, cleaning checklist.

**Opening checklist (7:00, manager/opener):** alarm off, lights, music (morning playlist) · temperatures logged (4 units) · espresso dial-in (2 test shots, log recipe) · pastry display full by 7:20 · check 86 list from yesterday · POS/KDS/screens on, internet + 4G backup test · drawer float counted · terrace set (season) · reservations and catering for the day reviewed · team huddle 7:20 (specials, 86s, VIPs, allergies).

**Closing checklist:** last orders 15 min before close · 86 perishables for tomorrow's prep · waste logged · temperature log · clean per schedule · drawer count and closing wizard · tips pool · lock-up checklist + alarm.

**Service standards:** greet in < 10 s ("Bonjour / Hi!", bilingual Montréal standard) · menu explained for first-timers · drinks in < 4 min, food < 12 min (weekday) / < 18 min (weekend) · check-back within 2 bites · bread refill offered for shakshuka · table cleared within 3 min · goodbye at the door.

**Brand-voice scripts**
- Greeting: « Bonjour ! Première fois chez Miam's ? Je vous fais le tour du menu en 20 secondes ? » / "Hi! First time at Miam's? Want the 20-second menu tour?"
- Upsell: « Avec ça, un latte miel-cardamome ? C'est notre signature. » / "Would you like our honey-cardamom latte with that? It's our signature." · « On ajoute un œuf ? » / "Add an egg?"
- Complaint (LAST: Listen, Apologise, Solve, Thank): « Merci de me le dire, et désolé. Je vous refais ça tout de suite / je vous propose… Merci de votre patience. » / "Thanks for telling me, and I'm sorry. I'll remake it right away / Here's what I can do… Thank you for your patience."

**Top 15 SOPs** (each is a MIAM OS training module with a quiz)

| # | SOP | Key steps |
|---|---|---|
| 1 | Allergy order | Ask → note in POS as allergy → check matrix → tell kitchen verbally → clean board/utensils → deliver by the person who took the order → confirm with guest |
| 2 | Espresso dial-in | Dose 18 g → yield 36–38 g in 26–30 s → taste → adjust grind → log |
| 3 | Shakshuka sauce batch | Recipe card → 3-hour simmer → cool to 4 °C within 6 h (2-stage cooling) → label (made, by, expires +72 h) |
| 4 | Receiving deliveries | Check temperature (cold ≤ 4 °C) → count vs PO → quality → enter received qty and price in MIAM OS → store FIFO |
| 5 | 86 an item | Tell expo → tap 86 in MIAM OS → confirm platforms hidden → update chalkboard |
| 6 | Pausing a delivery platform | Ticket times > 20 min → manager pauses 20 min in MIAM OS → notify team |
| 7 | Waitlist | Name + phone + size → quoted time (honest +5 min) → SMS when ready → hold 10 min |
| 8 | Daily closing | Wizard in MIAM OS (see §9.5 #6) |
| 9 | Cash handling | Float $200 → no-sale opens logged → mid-day drop > $500 → close count by two people |
| 10 | Temperature logs | 3×/day (7:00, 12:00, 16:00) → out of range → move product → call manager → corrective action logged |
| 11 | Delivery bag check | Ticket vs bag, seal sticker, utensils/sauces, insert card, name on bag |
| 12 | Handling a complaint | LAST script → log feedback in MIAM OS → manager follows up |
| 13 | Review ask | Only after a compliment → script → QR card |
| 14 | Weekly stock count | Sunday close → count by storage route → submit → manager reviews variance > 3 % |
| 15 | Onboarding a new hire | Day 1 tour + SOPs 1, 5, 12 → shadow 3 shifts → quizzes ≥ 80 % → first solo shift |

**KPI targets and actions when off target**

| KPI | Target | If off target |
|---|---|---|
| Food cost % | 28–30 % actual | > 31 % two weeks: check variance report → portioning audit → re-cost top 10 → reprice Plowhorses |
| Labour cost % | 28–32 % | > 33 %: compare schedule to hourly forecast → cut the lowest-sales hour → cross-train |
| Prime cost % | ≤ 60 % | > 62 %: owner review of both above in the Monday meeting |
| Average ticket | ≥ $24 (brunch/lunch) | Coach upsell scripts; screen promos; formula visibility |
| Table turn (weekend brunch) | ≤ 75 min | Pre-bus, drop the bill with the last coffee, laptop policy |
| Ticket time | ≤ 12 min weekday / 18 weekend | Prep list review, station rebalance, simplify slowest dish |
| Google rating | ≥ 4.7 | Review themes → fix top complaint → staff huddle |
| Delivery rating | ≥ 4.7 | Bag-check compliance, packaging audit |

**Management rhythm**

| When | Who | In MIAM OS |
|---|---|---|
| Daily 7:15 | Manager | Alerts, 86 carry-over, reservations, catering, prep list |
| Daily 21:30 | Owner | Flash report (auto email), approvals inbox |
| Weekly Monday 8:00 | Owner + manager (30 min) | AI summary, prime cost, menu engineering movers, schedule for next week, 3 actions |
| Weekly Sunday | Manager | Stock count, variance review, POs |
| Monthly | Owner + accountant | P&L, channel profitability, price review, marketing ROI |
| Quarterly | Owner | Menu engineering re-run, supplier review, SOP refresh, restore test |

## Phase 9 summary

| | |
|---|---|
| **Deliverables** | Buy/build/hybrid decision, permission matrix, 13 module specs, architecture, stack, **working database schema with RLS and tests**, integrations map, security, hardware list, screen list + wireframes, build plan with user stories, PWA spec, operations playbook with 15 SOPs and KPI actions |
| **Decisions** | Hybrid: certified POS + MIAM OS on Supabase/Next.js; PWA; aggregator for delivery; Glovo via aggregator in future Glovo markets |
| **⚠️ Owner actions** | Choose a POS from Revenu Québec's certified list; sign up for Supabase/Vercel **in the owner's name**; apply for Google Business Profile API, Meta app review; payment provider KYC; name the privacy officer |
| **Cost** | Hardware $5,150–11,900 · MVP $35,000–55,000 · V2 $25,000–40,000 · V3 $25,000–45,000 · running $390–950/month + support $500–1,500/month |
| **Time** | POS live before opening; MVP by week 10 after opening (parallel with the POS) |
| **KPIs** | Speed rule ≤ 3 taps (tested per release) · 100 % of platform orders flow through without manual re-entry · 86 propagation < 60 s · daily closing < 10 min · owner opens ≤ 1 app for daily status |
| **Next** | Phase 10: social media |
