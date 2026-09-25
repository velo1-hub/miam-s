# Phase 11: Meta Ads (Facebook & Instagram)

## 1. ⚠️ OWNER ACTION: accounts
1. Create a **Meta Business portfolio** (business.facebook.com) under the owner's personal Facebook account with 2FA; add a second admin (manager) as a backup.
2. Add the Facebook Page and Instagram account to the portfolio (owned, not "partner").
3. Create **one ad account** (currency **CAD**, time zone **America/Toronto (Eastern)**; ⚠️ neither can be changed later).
4. Add a **business credit card** as the payment method; set an account spending limit equal to the monthly budget + 10 %.
5. **Business verification** (legal name, NEQ, address, phone, domain) and **domain verification** of `miamsrestocafe.ca` (DNS TXT record) so Conversions API events are trusted.
6. Give the agency or freelancer access as a **partner**, never with the owner's login.

## 2. Tracking setup
- **Meta Pixel via Google Tag Manager, fired only after consent** (the site's banner already gates GTM, per Law 25).
- **Conversions API (CAPI)** server-side from MIAM OS / the ordering platform for `Purchase` (direct online orders) and `Schedule` (reservations), deduplicated with the browser event using the same `event_id`.
- **Standard events**

| Event | Trigger | Value |
|---|---|---|
| `ViewContent` | Menu page view (`/menu/`) | n/a |
| `Search` | Menu search/filter (`menu_filter`) | n/a |
| `InitiateCheckout` | Click "Commander" (`click_order`) | n/a |
| `Purchase` | Online order confirmed (CAPI from the POS/MIAM OS webhook) | order value, CAD |
| `Schedule` | Reservation confirmed (Libro webhook/CAPI; verify availability) | party size × $24 estimated |
| `Lead` | Catering quote request / newsletter signup | $300 / $5 estimated |
| `Contact` | Click-to-call, directions | n/a |

- **UTM conventions:** `utm_source=meta` · `utm_medium=paid_social` · `utm_campaign={objective}_{audience}_{yyyymm}` (e.g. `awareness_local_202612`) · `utm_content={concept_id}_{format}` (e.g. `c01_reel`). Promo codes per campaign (`BRUNCH-META`, `DIRECT10`) for offline attribution in MIAM OS.

## 3. Campaign architecture (full funnel)

| Stage | Campaign | Objective | Optimization event | Audience | Creative |
|---|---|---|---|---|---|
| Awareness | **A1 Local reach** | Awareness | Reach (frequency cap 3/7 days) | 2–3 km radius, 18–55 | Reels #1, #3, #19 |
| Engagement | **E1 Reel views** | Engagement | ThruPlay | Radius + interest stacks | Best organic Reels (boost winners) |
| Traffic / orders | **C1 Book brunch** | Sales (or Leads) | `Schedule` (fallback: landing page views until 50 conversions/week) | Radius + personas 1 and 2 | Concepts 2, 5, 7 |
| Traffic / orders | **C2 Order direct** | Sales | `Purchase` | 3 km radius, weekday 10:30–13:00 and 17:00–19:00 | Concepts 4, 8 |
| Catering | **C3 Office catering** | Leads | `Lead` | Office workers 25–55 within 5 km of offices + "event planning", "human resources" interests | Concept 9 |
| Retargeting | **R1 Warm audiences** | Sales | `Schedule`/`Purchase` | Site visitors 30 days, IG engagers 60 days, video viewers 50 %, excluding purchasers 7 days | Concepts 6, 10 (proof, reviews, offer) |
| Loyalty | **L1 Come back** | Sales | `Purchase` | Customer list (consented), lookalike exclusion | Seasonal launches, mezze nights |

## 4. Audiences
- **Radius:** 2 km around the café for awareness (walk-in); 3 km for orders/pickup; 5 km for catering. ⚠️ Meta has a minimum radius and may auto-expand small audiences; check the estimated audience size (target 50k–250k).
- **Interest stacks by persona**
  - *Camille (hybrid worker):* coffee, specialty coffee, remote work, coworking, Mediterranean cuisine, brunch.
  - *Karim (brunch group):* brunch, Middle Eastern cuisine, halal food, veganism, university interests (age 19–30).
  - *Sophie (parent/organiser):* parents with young children, family activities, event planning, human resources (for catering).
- **Custom audiences:** website visitors (30/90 days), menu viewers, IG and FB engagers (60/365 days), Reel viewers 50 %+, **customer list only with express marketing consent** (hashed, from MIAM OS).
- **Lookalikes:** 1 % Canada, filtered to Montréal by radius, from purchasers + bookers (once ≥ 100 matched people).
- **Advantage+ audience:** test against manual stacks from month 2 (Meta's automated audiences often win with enough conversion data).

## 5. Budget

**Launch (weeks −1 to +6), CAD**

| Campaign | Weekly | 7 weeks |
|---|---|---|
| A1 Local reach | $120 | $840 |
| E1 Reel boosts | $60 | $420 |
| C1 Book brunch | $100 | $700 |
| C2 Order direct | $40 | $280 |
| R1 Retargeting | $40 | $280 |
| **Total** | **$360** | **$2,520** |

**Always-on (month 3+), CAD $1,000–1,400/month:** A1 20 % · C1 30 % · C2 20 % · C3 10 % · R1 15 % · L1 5 %.

**Expected results (assumptions: Montréal restaurant CPMs of $6–12, CTR 0.8–1.5 %; verify with your first 2 weeks of data)**

| Metric | Range |
|---|---|
| Reach per month (launch) | 60,000–120,000 people |
| Cost per landing page view | $0.40–1.00 |
| Cost per reservation | $4–12 |
| Cost per direct online order | $6–15 |
| Cost per catering lead | $15–40 |
| Blended ROAS on trackable conversions | 3–6× (plus unmeasured walk-ins) |

## 6. Creative: 10 ad concepts

| # | Concept | Format | Visual brief | Hook | Primary text (FR · EN) | Headline | CTA |
|---|---|---|---|---|---|---|---|
| 1 | Yolk break | Reel 9:16, 10 s | Shakshuka pan, yolk break, bread dip | « Attendez… » · "Wait for it…" | Shakshuka mijotée 3 heures, à deux pas de chez vous. · 3-hour shakshuka, right around the corner. | Nouveau à {quartier} · New in {neighbourhood} | Réserver / Book now |
| 2 | No-queue brunch | Reel 9:16, 12 s | Walk past a (drawn) queue straight to a sunny table | « Faire la file pour bruncher ? Non merci. » · "Queue for brunch? No thanks." | Chez Miam's, le brunch se réserve en 30 secondes. · At Miam's, brunch is bookable in 30 seconds. | Brunch sans file · No-queue brunch | Réserver / Book now |
| 3 | Signature latte | Reel, 8 s | Cardamom grind + honey + pour | ASMR sound | Latte miel & cardamome. Vous allez comprendre. · Honey & cardamom latte. You'll get it. | Le latte du quartier · The neighbourhood latte | Itinéraire / Get directions |
| 4 | Order direct | Static 4:5 | Pita + bowl on Crème; "15 min" badge | « Prêt en 15 minutes. » · "Ready in 15 minutes." | Commandez en direct : moins cher que les applis, prêt en 15 min. · Order direct: cheaper than the apps, ready in 15 min. | −10 % 1re commande · 10% off 1st order | Commander / Order now |
| 5 | Diet-inclusive group | Carousel 1:1 | Slides: vegan bowl, halal chicken, kids' plate, shakshuka | « Végane, halal, enfants : tout le monde à table. » | Une seule réservation, des plats pour chacun. · One booking, a dish for everyone. | Brunch pour tous · Brunch for everyone | Réserver / Book now |
| 6 | Review proof (UGC-style) | Reel, 15 s | Real guest to camera (consented) + review text overlay | « Honnêtement… » · "Honestly…" | 4,8★ sur Google après {n} avis. Venez voir pourquoi. · 4.8★ on Google after {n} reviews. Come see why. | Les voisins adorent · The neighbours love it | Réserver / Book now |
| 7 | Brunch for two | Static 4:5 | Overhead table for two, 2 lattes, 2 plates, croissant | « Le brunch pour deux, 49 $. » | Deux plats, deux lattes signature, un croissant pistache à partager. · Two plates, two signature lattes, a pistachio croissant to share. | Samedi, c'est réglé · Saturday, sorted | Réserver / Book now |
| 8 | Lunch formula | Reel, 10 s | Assembly of bowl + soup + cookie, "+5" sticker | « Le midi, on ajoute 5 $. » · "At lunch, add $5." | Soupe ou limonade + biscuit tahini avec tout bol ou pita. · Soup or lemonade + tahini cookie with any bowl or pita. | Formule midi +5 · Lunch combo +5 | Commander / Order now |
| 9 | Office catering | Carousel | Labelled boxes, platter, office table | « Votre équipe mérite mieux qu'une pizza. » · "Your team deserves better than pizza." | Boîtes étiquetées avec allergènes, livrées avant 11 h 45. · Allergen-labelled boxes, delivered before 11:45. | Soumission en 4 h · Quote in 4 hours | En savoir plus / Get quote |
| 10 | Mezze Thursday | Reel, 12 s | Board build, candles, friends' hands | « Jeudi soir, on partage. » · "Thursday night, we share." | Mezzes à partager, jeudi et vendredi dès 17 h. · Mezze to share, Thursday & Friday from 5 pm. | Soirées mezze · Mezze nights | Réserver / Book now |

UGC-style variants: concepts 1, 2 and 6 recut as handheld, phone-shot, with creator voice-over (whitelisted creator ads from Phase 10 §8). Offer-led variants: 4 (DIRECT10), 7 (bundle price), 8 (+5).

## 7. Testing plan
1. **Weeks 1–2: creative test** in C1: 5 concepts (1, 2, 5, 6, 7), equal budget via one ad set each or Advantage+ creative with dynamic distribution. **Decision rule:** after ≥ $80 spend and ≥ 2,000 impressions per ad, kill any ad with cost per landing page view > 1.5× the median.
2. **Weeks 3–4: hook test** on the winner: 3 new first-2-second openings. Winner = highest 3-second view rate and CTR.
3. **Weeks 5–6: audience test:** manual persona stacks vs Advantage+ audience. Winner = lowest cost per `Schedule` with ≥ 20 conversions.
4. **Month 2+: offer test** (no offer vs DIRECT10 vs bundle) on C2. Winner = lowest cost per order *after* discount cost.
One variable at a time; minimum 7 days per test (full weekly cycle).

## 8. Optimization routine

**Weekly checklist (Monday, 20 min, in the MIAM OS Ads view):**
- [ ] Spend vs plan (± 10 %)
- [ ] Frequency (awareness ≤ 3/week; retargeting ≤ 6/week) → refresh creative if exceeded
- [ ] CTR per ad (< 0.7 % → replace hook)
- [ ] Cost per result vs target (table below)
- [ ] Comments on ads answered (Phase 10 templates)
- [ ] Promo code redemptions in POS match attributed results (sanity check)

| KPI | Target | Scale when | Pause when |
|---|---|---|---|
| CPM | $6–12 | n/a | > $18 for 7 days (audience too narrow) |
| CTR (link) | ≥ 1 % | n/a | < 0.6 % after 3,000 impressions |
| CPC (link) | ≤ $1.20 | n/a | > $2 |
| Cost per reservation | ≤ $10 | < $7 for 7 days → +20 % budget | > $15 for 7 days |
| Cost per direct order | ≤ $12 | < $8 → +20 % | > $18 |
| ROAS (trackable) | ≥ 3× | ≥ 5× → +20 % every 3 days | < 1.5× for 14 days |

**Creative refresh:** at least 2 new ads every 2 weeks (from the monthly production day).

## 9. Monthly reporting template

```
MIAM'S · META ADS · {MONTH YYYY}
1. Summary (3 lines): what worked, what didn't, next month's focus
2. Spend: $___ of $___ budget
3. Results by campaign
   | Campaign | Spend | Reach | Freq | CTR | Results | Cost/result | Revenue (CAPI + codes) | ROAS |
4. Top 3 ads (thumbnail, hook, CTR, cost/result) · bottom 3 ads (why)
5. Audience learnings (persona, age, placement, time of day)
6. Offline impact: promo code redemptions, bookings with "Instagram/Facebook" source, Google branded-search trend
7. Tests run → result → decision
8. Next month: budget split, tests, creative needs for the production day
```

## Phase 11 summary

| | |
|---|---|
| **Deliverables** | Account setup steps, Pixel + CAPI plan with events and UTMs, 7-campaign funnel, audiences, budgets with result ranges, 10 bilingual ad concepts, testing plan with decision rules, weekly routine, KPI thresholds, monthly report template |
| **⚠️ Owner actions** | Business portfolio, ad account (currency/time zone), payment method, business and domain verification |
| **Cost** | Launch $2,520 over 7 weeks · always-on $1,000–1,400/month · management (freelancer) $300–700/month |
| **KPIs** | Cost per reservation ≤ $10 · cost per direct order ≤ $12 · ROAS ≥ 3× · 25 % of new customers in month 1 cite Instagram/Facebook (ask at booking) |
| **Next** | Phase 12: loyalty & CRM |
