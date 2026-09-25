# Phase 5: In-store digital menu screens

**Built:** [`site/src/board.html`](../site/src/board.html), deployed at `/screens/board.html`. It reads the same `menu.json` as the website, **switches content automatically by daypart** (Montréal time) and refreshes the menu every 5 minutes. A sold-out flag (`sold_out: true`, set by MIAM OS's 86 button) greys out an item with "épuisé / sold out".

## 1. Screen plan

| Screen | Placement | Orientation | Size | Content URL |
|---|---|---|---|---|
| S1 | Above counter, left | Landscape | 55" 4K (shown at 1080p) | `board.html?screen=main` (current daypart's food) |
| S2 | Above counter, right | Landscape | 55" | `board.html?screen=drinks` |
| S3 | Beside pastry display, facing queue | Portrait | 43" | `board.html?screen=promo&portrait=1` (formulas, signatures) |
| (Optional) S4 | Window, facing street | Portrait, high-brightness (≥ 2,500 nits) | 43" | `board.html?screen=auto&portrait=1` |

**Why three:** a guest's 20–40 seconds in the queue is enough for food + drinks + one offer. More screens split attention. Mount the bottom edge at ≥ 2.1 m, centres 30–35° above eye level from the queue line, max viewing distance 6 m (at 1080p, 44 px text reads from ~6 m).

## 2. Layout templates (1920 × 1080, implemented)

| Template | Structure | Rules |
|---|---|---|
| **Main menu** | Title 96 px Fraunces + bilingual subtitle · 2-column list, max 8 items · price in Safran 40 px right-aligned · English name under French in italic 24 px · badges | ≤ 8 items per screen: beyond that, reading time exceeds queue time |
| **Drinks** | Same, 10 items max, signatures first | Signature lattes are Stars: keep them in the first 3 slots |
| **Combos / specials (promo)** | Left: handwritten kicker (Caveat 84 px), offer title 120 px, 2 lines FR/EN, price 150 px · Right: sun graphic (swap for a 1080 px dish photo when shot) | One offer per slide, one price |
| **Promotional rotation** | S1 in `auto` mode cycles main → drinks → promo every 12 s | 12 s = enough for a 7-word headline + price |

## 3. Content rotation by daypart

| Daypart | Weekdays | Weekends | Main | Drinks | Promo |
|---|---|---|---|---|---|
| Matin | 7:30–11:00 | 8:30–14:00 (brunch) | Brunch | Coffee | **Formule matin 6,25** |
| Midi | 11:00–14:00 | n/a | Lunch | Cold drinks first | **Formule midi +5** |
| Après-midi | 14:00–17:00 (16:00 Mon–Wed) | 14:00–16:00 | Pastries & sweets | Coffee | **Pause d'après-midi 8,50** |
| Soir | 17:00–21:00 Thu–Fri | n/a | Apéro mezze | Drinks | **Trio mezze 29** |

Seasonal overrides (edit `PLAN` in `board.html` or via MIAM OS later): Oct–Mar the promo slot alternates with "Chocolat chaud au tahini", Jun–Aug with "Latte glacé".

## 4. Motion guidelines
- Cross-fade only (0.9 s). No sliding, zooming or particle effects: they hurt legibility and look cheap.
- Maximum 1 motion element per screen (e.g. steam loop on the promo photo when videos exist).
- Contrast: Crème #F6EEDF on Olive #26301F (11.9:1), prices in Safran (6.4:1). Never red on green.
- Minimum text height 24 px at 1080p (≈ 1.3 cm on a 55" screen); item names ≥ 38 px.
- No scrolling text, ever.

## 5. Hardware & software

| Item | Recommendation | Est. cost (CAD, verify) |
|---|---|---|
| Displays | 55" commercial displays (Samsung/LG commercial lines, 16/7 rated), or good consumer TVs with a 3-year warranty on a budget | $700–1,400 each commercial · $450–700 consumer |
| Player | Any device with a full-screen browser: Amazon Fire TV Stick 4K Max + a kiosk browser app, a Chromebox/Chromebit, or a Raspberry Pi 5 in Chromium kiosk mode | $80–250 each |
| Mounts & cabling | Tilting wall mounts, in-wall power by an electrician | $100–250 per screen + electrician $300–800 |
| Software | **Our board page ($0)** or a signage CMS if you want scheduling UI (e.g. Yodeck, ScreenCloud, Rise Vision; they can show a URL) | $0 or $10–30/screen/month |
| **Total (3 screens)** | | **$2,000–5,500** |

Kiosk setup (Raspberry Pi): `chromium --kiosk --noerrdialogs --disable-infobars --incognito https://www.miamsrestocafe.ca/screens/board.html?screen=main`, with the TV's scheduled on/off at 7:15 and 21:15.

## 6. Update workflow (under 5 minutes)

| Change | Today (before MIAM OS) | With MIAM OS (Phase 9) |
|---|---|---|
| Sold out | Manager edits `sold_out: true` in `menu.source.json` → build → deploy (~3 min with Cloudflare Pages Git deploy) | One tap on "86" in the app → board greys it out within 5 min (instantly with realtime) |
| Price | Edit `price` in the source → build → deploy | Price edit in the Menu Manager (owner/manager role only), logged |
| New promo | Edit `PLAN` in `board.html` | Promo scheduler per daypart |

## Phase 5 summary

| | |
|---|---|
| **Deliverables** | Working daypart board (landscape/portrait), screen plan, 4 templates, rotation schedule, motion rules, hardware list, update workflow |
| **Decisions** | 3 screens; browser-based board, no signage subscription |
| **⚠️ Owner actions** | Electrician for in-wall power; confirm mounting positions against the counter plan (`[Q8]`) |
| **Cost** | $2,000–5,500 one-time; $0–90/month |
| **Time** | 1 day install after hardware delivery |
| **KPIs** | Attach rate of the promoted formula by daypart (POS) · pastry attach rate on coffee orders ≥ 20 % · screen uptime 99 % during opening hours |
| **Next** | Phase 6: website |
