# Phase 4: QR code digital menu

**Built:** `/fr/menu/` and `/en/menu/` in [`site/`](../site/). They're generated from the master menu, so a price changed in `data/menu.source.json` updates print copy, website, QR menu and screens in one build.

## 1. Mobile-first UX (as implemented)

| Feature | Implementation | Why |
|---|---|---|
| Server-rendered list | All items are in the HTML (no JS needed to read the menu) | Loads instantly on weak in-store Wi-Fi; Google indexes every dish |
| Sticky tools bar | Search + diet chips + allergen filter + category chips stay pinned while scrolling | Guests with dietary needs find their options in 1 tap |
| Search | Accent-insensitive ("oeuf" finds "œuf", "zaatar" finds "za'atar") | Bilingual guests type without accents |
| Diet filters | Végane · Végé (includes vegan) · Halal · Sans ingrédient à gluten | The three diets from Persona 2 |
| Allergen exclusion | "Masquer les plats contenant…" toggles for the 11 priority allergens | Safer than "gluten-free" claims; an allergic guest self-serves before asking |
| Category navigation | Horizontal scrolling chips, active one highlighted | Thumb-reachable, no hamburger menu |
| Language switch | Header link to the paired page (same position, hreflang) | FR default, EN one tap away |
| Badges | ★ Signature (Safran), Végane/Végé (Sauge), Halal, 🌶 | Nudges toward Stars and Puzzles (Phase 3) |
| Legal footer | Allergen key, shared-kitchen notice, halal statement, taxes | Compliance |

**Performance budget** (verify with PageSpeed Insights after deploy): HTML < 60 KB gzipped, CSS 8 KB, JS 3 KB, 3 web fonts with `display=swap`, **LCP < 1.8 s on 4G**, CLS < 0.05. Photos (when added) as 800 px WebP, `loading="lazy"`, < 80 KB each.

## 2. Platform recommendation

| Option | Cost (CAD) | Pros | Cons |
|---|---|---|---|
| **A. Built into our website (done)** ⭐ | $0 extra (hosting free–$25/mo) | One master menu, SEO value, our brand, our analytics, no third-party ads | Ordering at the table needs the POS integration (option C) |
| B. Dedicated QR menu SaaS (e.g. MENU TIGER, Menubly, and similar) | $10–40/month | Editor UI for staff, built-in QR analytics | Duplicate menu to maintain, weaker SEO, their branding on free tiers |
| C. POS order-and-pay QR (from the chosen POS: Lightspeed, Square, TouchBistro… **verify features and Québec SRS compatibility**) | Usually included, plus payment fees | Guests order and pay from the table, orders hit the KDS | Changes service model; less hospitality contact |

**Recommendation: A now, C as a pilot on weekday mornings in month 3** (see §5). Our menu is the single source of truth and costs nothing extra.

## 3. QR strategy

**Short links we control** (already generated in `site/dist/_redirects`, which works on Netlify and Cloudflare Pages): the printed QR code points to `miamsrestocafe.ca/m/<placement>`, and we can change the destination at any time without reprinting. That makes these static QR codes behave like dynamic ones, with no subscription.

| Placement | Printed URL | Destination + UTM | Quantity |
|---|---|---|---|
| Table tent | `/m/table` | menu · `utm_content=table` | 16 |
| Front window | `/m/window` | menu · `utm_content=window` | 1 |
| Window "book brunch" | `/m/book` | reservations | 1 |
| Receipt footer | `/m/receipt` | reviews page | every receipt |
| Takeout bag sticker | `/m/bag` | direct ordering | per bag |
| Delivery-app insert | `/m/delivery` | direct ordering, channel shift | per delivery order |
| Cup sleeve | `/m/loyalty` | loyalty signup | per cup |
| Takeout flyer | `/m/flyer` | direct ordering | 1,000 |
| Catering flyer | `/m/catering` | catering page | 250 |

**QR specs:** error correction level **M**, minimum **25 × 25 mm** (tables) and **40 × 40 mm** (window), Olive nuit on Crème (never inverted), 4-module quiet zone, the URL printed in text under the code. Generate with any free QR generator; test on iPhone and Android before printing.

**Placement map**
```
 [Window: menu QR + book QR]      [Door: hours + "Ici, on dit miam."]
 ┌───────────────────────────────────────────────┐
 │ Laptop ledge (5 seats): table tent every 2 seats│
 │ Tables 1–8 (2-tops): tent each                  │
 │ Tables 9–12 (4-tops): tent each                 │
 │ Terrace (seasonal): tents with weights          │
 │ Counter: flyer holder + loyalty QR on the card reader│
 │ Pickup shelf: bag stickers, catering flyers     │
 └───────────────────────────────────────────────┘
```

## 4. Print pieces: final copy and layout

**Table tent** (A6 upright, 105 × 148 mm, 2 sides, 350 gsm, matte)
- Side FR: headline Fraunces 22 pt "Le menu en un scan." · body Inter 10 pt "Photos, allergènes, végane, halal : tout est là. Commandez au comptoir." · QR 30 mm centred · URL `miamsrestocafe.ca/m/table` · footer "Wi-Fi : Miams-Invites · mot de passe : ondimiam"
- Side EN: "The whole menu in one scan." · "Allergens, vegan and halal, all in one place. Order at the counter." · same QR · "Wi-Fi: Miams-Invites · password: ondimiam"

**Window sticker** (200 × 280 mm, white vinyl + printed Crème panel)
- "Le menu · The menu" · menu QR 45 mm · "Réservez le brunch · Book brunch" · book QR 45 mm · hours block FR first.

**Takeout insert** (A7 card, 74 × 105 mm)
- FR: "Merci d'avoir dit miam ! La prochaine fois, commandez en direct : c'est moins cher que les applis, et vos points fidélité s'accumulent." QR `/m/delivery` · "−10 % sur votre 1re commande directe : code DIRECT10" (⚠️ check delivery-platform rules first, see Phase 8 §8)
- EN: "Thanks for saying miam! Next time, order direct: it's cheaper than the apps and you earn loyalty points." Same QR · "10% off your first direct order: DIRECT10"

## 5. Optional: order-and-pay at the table

| | |
|---|---|
| Pros | +10–15 % average ticket from visual upsells (vendor-reported, treat as optimistic), faster turns on weekday mornings, fewer order errors, frees the counter queue |
| Cons | Less human contact (brand value "Soleil"), older guests dislike it, needs a table-number system and runner workflow |
| Tools | The POS's own QR ordering (preferred: no extra integration); otherwise a POS-integrated partner. ⚠️ Must feed the certified SRS POS in Québec; never a standalone app that bypasses it |
| Recommendation | **Pilot, weekday 7:30–11:00 only, month 3.** Keep counter ordering and weekend table service. Decide at day 90 on: ticket +8 % or more, and no drop in review sentiment |

## Phase 4 summary

| | |
|---|---|
| **Deliverables** | Built bilingual QR menu with filters; platform comparison; short-link QR system with UTMs; placement map; final copy and specs for 3 print pieces; order-at-table assessment |
| **Decisions** | Menu built into the website; short links `/m/*`; order-at-table pilot in month 3 |
| **⚠️ Owner actions** | Register the domain; set the real Wi-Fi password; approve print |
| **Cost** | QR codes $0 · printing tents + stickers + inserts $250–600 |
| **Time** | 3 days after domain is live |
| **KPIs** | QR scans per 100 covers ≥ 25 (GA4 `qr_scan` by placement) · menu page LCP < 2 s · filter usage rate · % EN views (language mix) |
| **Next** | Phase 5: screens |
