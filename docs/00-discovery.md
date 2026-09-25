# Phase 0: Discovery & audit

## 1. Assumed brief

The brief arrived blank, and the owner then asked for the full engagement. Rather than stop, we set one coherent working brief. **Every later phase depends on these assumptions.** Items marked 🔴 change the most if they're wrong.

| Field | Working assumption | Why this assumption | Impact if wrong |
|---|---|---|---|
| 🔴 City / market | **Montréal, Québec, Canada**: a central, mixed neighbourhood (residential + offices + students), e.g. Plateau / Mile-End / Rosemont / Villeray type | The brief's own examples (GST/QST, French-first rules, CASL, province, postal code) all point to Québec | Changes language law, taxes, delivery platforms (Glovo does not operate in Canada), privacy law, payroll, POS certification |
| Address | `[civic number] rue [street], Montréal (Québec) H2X 0X0`, written as `{ADDRESS}` in all copy | Unknown | Search-and-replace `{ADDRESS}`, `{PHONE}` and `{NEIGHBOURHOOD}` in `site/src/content.mjs` and the docs |
| 🔴 Concept | **French-Mediterranean all-day café-brunch**: specialty coffee and pastries in the morning, brunch, lunch bowls and pitas, and mezze evenings Thursday and Friday | First example in the brief; strongest fit for the name ("miam" is the French "yum") | Menu (Phase 3) and visual direction (Phase 2) |
| Status | New opening, grand opening in **~10 weeks** (target: week of 2026-12-07) | Brief lists "new opening" first | Launch timeline (Phase 13) |
| Hours | Mon–Wed 7:30–16:00 · Thu–Fri 7:30–21:00 · Sat–Sun 8:30–16:00 | Café-brunch norms; evenings only where demand is proven (Thu/Fri after-work) | Daypart menus, labour plan, screens |
| Seats | 40 inside + 20 on a seasonal terrace (May–Oct) | Typical 1,400–1,800 sq ft Montréal storefront | Revenue model, table map |
| Services | Dine-in, takeout, online pickup, delivery apps, office catering, small private events (≤ 30) | Diversifies revenue on weekdays | Website sitemap, MIAM OS modules |
| Languages | **French first**, English second | Charter of the French Language (as amended by Bill 96) | All copy is written FR first |
| Alcohol | **Not at launch.** Wine/beer for mezze evenings once a RACJ restaurant permit is granted | Permit takes months; don't let it block opening | Ads (alcohol rules), menu |
| Story | "Miam" = the sound everyone makes at a good bite; a family table where Mediterranean home cooking met Montréal café culture | No story given; name-led story is authentic and flexible | 🔴 **Owner must supply the real personal story** (Phase 1 §8 has fill-in points) |
| 3 words | Généreux · Solaire · Complice (generous, sunny, warm and familiar) | Derived from concept | Tone of voice |
| Never | Prétentieux · Froid · Industriel (pretentious, cold, industrial) | | |
| Existing assets | None: no logo, no photos, no signage | New opening | Full identity build (Phase 2) |
| Primary customers | Neighbourhood residents 28–45, remote/hybrid workers, students 19–25 | Mixed central neighbourhood | Personas (Phase 1) |
| Secondary | Office teams (catering), weekend brunch groups, young families | | |
| Average ticket | $7–9 coffee + pastry · $22–26 brunch/lunch per person · $30–38 mezze evening per person (before tax/tip) | Montréal 2026 café-brunch pricing | Pricing (Phase 3) |
| POS | None yet → Phase 9 recommends a **Revenu Québec-certified POS** + MIAM OS layer | Québec requires certified sales-recording for restaurants | Phase 9 |
| Team | Owner-operator + 1 manager + 2 cooks + 1 prep/dish + 2 baristas + 2–3 part-time floor | 40-seat all-day café | Labour model |
| Launch marketing & tech budget | **$28,000–$45,000 CAD** (excluding construction and kitchen equipment) | Mid-range for a premium independent opening | Budget tiers (Phase 13) |
| Monthly marketing | **$2,000–$3,000 CAD**, of which $900–$1,400 is paid ads | ~3 % of projected revenue | Phase 11 budget |
| Social media | Owner + a part-time content freelancer (1 production day/month) | Common and sustainable | Phase 10 workload |
| Payroll / accounting | Nethris or Employeur D (payroll), QuickBooks Online (accounting) | Common Québec SMB stack | MIAM OS integrations |
| 12-month goals | $700–780k revenue · Google 4.7★ with 400+ reviews · 6,000 Instagram followers · channel mix 65 % in-store / 15 % delivery apps / 20 % direct online + catering | Consistent with a 40-seat all-day café model (see Phase 3 projection) | Scorecards |

## 2. Missing information: questions for the owner

Please answer in one reply. Numbering matches the tag used in the docs, e.g. `[Q7]`.

**Must have before print or launch (blocking)**
1. `[Q1]` Exact address, postal code and neighbourhood. *(Drives local SEO, schema, citations, ad radius, competitor set.)*
2. `[Q2]` Is the city Montréal? If not, which city and country? *(Changes platforms, laws and taxes.)*
3. `[Q3]` Legal business name and NEQ (Québec enterprise number), and whether "Miam's" is already registered as a trademark. *(Needed for signage compliance and platform sign-ups.)*
4. `[Q4]` Public phone number and email. Will they be dedicated to the business? *(They have to be the same everywhere: NAP consistency.)*
5. `[Q5]` The real origin story: who founded it, their roots, why "Miam's", one real family dish. *(Phase 1 §8 has the drafts ready to personalise.)*
6. `[Q6]` Confirm or correct the concept and menu in `data/menu.source.json`: dishes you will not make, supplier-based costs, halal sourcing (certificate available?).
7. `[Q7]` Confirmed opening date and hours.
8. `[Q8]` Floor plan: number of tables and sizes, counter position, terrace permit status.

**Needed within the first 3 weeks**
9. `[Q9]` Kitchen equipment constraints (hood? oven? plancha?). *(Some items, like the brick pastry and fries, need a fryer.)*
10. `[Q10]` Coffee roaster and pastry supplier (in-house baking vs. supplier). *(Changes cost and story.)*
11. `[Q11]` Alcohol plans and RACJ permit status.
12. `[Q12]` Budget confirmation: launch and monthly.
13. `[Q13]` Existing Instagram, Facebook or Google profiles, even empty ones (to claim rather than duplicate).
14. `[Q14]` Brands you admire and brands you dislike.
15. `[Q15]` The 3–5 cafés you consider direct competitors (we'll audit them precisely using the method in §3.1).

**Nice to have**
16. `[Q16]` Personal values or causes (local sourcing, zero waste, community) that you're willing to act on every day.
17. `[Q17]` Who will do day-to-day social media, and how many hours a week.
18. `[Q18]` Any partner already chosen (accountant, designer, photographer, contractor).

## 3. Competitor audit

### 3.1 Method (90 minutes, repeatable)
The exact address is unknown, so the audit below profiles the **five competitor types found within 1 km of any central Montréal café-brunch location**. Once `[Q1]` is answered, fill in the real names in the template and it becomes a named audit. For each competitor:
1. Google Maps: rating, review count, and the 3 most-repeated praise and complaint themes (sort by "Newest"; read 30 reviews).
2. Menu and prices: 3 anchor items (latte, signature brunch plate, lunch bowl or sandwich).
3. Website: mobile speed (PageSpeed Insights), online ordering (direct or apps only), reservations.
4. Instagram: followers, posts per week, Reels share, engagement on the last 9 posts.
5. Delivery apps: present on Uber Eats / DoorDash / SkipTheDishes? Rating, price markup vs. in-store.

### 3.2 Comparison table (competitor types)

| | A. Brunch institution (lineups on weekends) | B. Third-wave specialty coffee bar | C. Breakfast chain (e.g. national breakfast franchises) | D. Mediterranean / Lebanese fast-casual | E. Neighbourhood bakery-café |
|---|---|---|---|---|---|
| Positioning | "The weekend brunch everyone knows" | Coffee quality, design, laptop-friendly | Predictable, family, value | Fast, filling, cheap shawarma/falafel | Bread, viennoiseries, takeaway |
| Price anchors (typical) | Latte $5.50 · brunch plate $19–25 | Latte $5.25–6.50 · pastry $4–6 | Plate $15–21, coffee refills | Plate $15–19 · wrap $11–14 | Croissant $3.50–4.75 · sandwich $11–14 |
| Menu strength | Generous plates, hype | Coffee, minimal food | Choice, kids | Flavour, speed, value | Fresh bread, pastry |
| Menu weakness | Same egg-benedict formula everywhere; closes mid-afternoon | Little or no real food | Generic, industrial feel | No coffee culture, no brunch, fluorescent atmosphere | No seating comfort, little hot food |
| Google review themes (+) | "Worth the wait", portions | Coffee, vibe, staff | Fast, kid-friendly | Tasty, good value | Croissants, smell of bread |
| Google review themes (−) | 45–60 min waits, rushed service, noise | Pricey, cold staff, no food | Bland, dated | Dry chicken, messy, no ambience | Sold out by noon, few seats |
| Website | Basic, menu PDF | Nice design, e-shop for beans | Corporate, strong ordering | Weak or none; apps only | Often none |
| Social | Big following, user-generated content | Aesthetic Instagram | Corporate | Low effort | Low to medium |
| Delivery apps | Rarely (brunch travels badly) | Rare | Yes | **Heavy** (main channel) | Rare |
| Threat to Miam's | High on weekends | High on weekday mornings | Low | Medium at lunch/delivery | Medium in mornings |

**Named-audit template** (fill in after `[Q1]`/`[Q15]`):

| Competitor | Distance | ★ / # reviews | Latte | Signature plate | Top praise | Top complaint | Instagram / posts per week | Apps | What we take from them | Where we beat them |
|---|---|---|---|---|---|---|---|---|---|---|
| | | | | | | | | | | |

### 3.3 What the audit tells us
- **Nobody combines serious coffee, Mediterranean home cooking and an all-day, sit-down welcome.** Coffee bars don't cook, Mediterranean fast-casual doesn't do coffee or ambience, and brunch spots close at 3 pm and are all serving the same eggs benedict.
- **Brunch spots lose customers to waiting times.** A bookable weekend brunch (reservations for 4+, a waitlist by SMS for walk-ins) is a real advantage.
- **Mediterranean flavours sell well on delivery apps**, but the incumbents compete on price. Miam's should compete on quality and packaging, not price.

## 4. Local market snapshot (central Montréal)

| Driver | Detail | What we do about it |
|---|---|---|
| Foot traffic | Weekday peaks 7:45–9:15 (commute), 12:00–13:30 (lunch); weekend peak 10:00–13:30 | Staff and screen dayparts follow these peaks (Phase 5, Phase 9) |
| Hybrid work | Remote workers occupy tables 10:00–15:00 on weekdays | A "laptop-friendly zone" at the bar ledge, no laptops at weekend brunch tables 10–14 (protects turnover) |
| Seasonality | Terraces from May to October nearly double summer capacity; January–March is the slowest period | Winter campaigns: soups, hot chocolate, "brunch cocooning", loyalty double points (Phase 12) |
| Events | Montréal en Lumière (Feb), Grand Prix (June), Jazz Fest/Francos (June–July), Fête nationale (June 24), Canada Day/Moving Day (July 1), Christmas markets, back to school (late Aug) | Content calendar hooks (Phase 10) |
| Search demand themes | "brunch montréal", "brunch près de moi", "café près de moi", "shakshuka montréal", "meilleur brunch [quartier]", "brunch végane", "halal brunch", "traiteur bureau montréal" | Keyword map (Phase 7 §7) |
| Language | Majority French-speaking with a significant English-speaking and allophone population; students often English-speaking | FR first, EN available everywhere |
| Rules | Charter of the French Language (signage, menus, website, contracts), Law 25 (privacy), CASL (email/SMS), MAPAQ food permit, GST 5 % + QST 9.975 %, mandatory sales-recording module (SRS) for restaurants | Built into every phase |

## 5. SWOT

| Strengths | Weaknesses |
|---|---|
| Distinct concept: café + Mediterranean home cooking, all day | New brand: no reviews, no following, no track record |
| Memorable, bilingual-friendly name ("miam" is understood by everyone in Québec) | "Miam's" uses an English possessive, so signage must follow French-predominance rules (see Phase 2 §7) |
| Photogenic signature dishes (shakshuka in a cast-iron pan, pistachio latte, mezze board) | Mezze evenings are unproven demand |
| Menu with many vegetarian, vegan and halal options serves under-served diets | Owner-operator bandwidth: social, ops and admin all at once |
| Dishes that work across dayparts (bowls at lunch and in the evening) | Brunch is labour-intensive at weekend peaks |

| Opportunities | Threats |
|---|---|
| Bookable brunch, where competitors make people queue | Food inflation (eggs, avocados, pistachios, olive oil) |
| Office catering in hybrid-work Montréal (team days) | Delivery commissions eroding margin |
| Direct online ordering: capture customer data rather than pay 20–30 % commission | Copycat menus: shakshuka is spreading |
| AI search and "near me" queries favour well-structured local businesses | Winter slowdown |
| Terrace season | Staffing shortages in Montréal hospitality |
| Community tie-ins (markets, schools, local roasters, Ramadan iftar boxes, Christmas) | Language-law or permit non-compliance leading to fines or delays |

## 6. The opportunity

> **Miam's owns "the Mediterranean kitchen table of the neighbourhood, open all day."** It is the only place nearby where you get excellent coffee *and* real, generous home cooking, from the 7:30 latte to the Thursday-evening mezze board. You can book it, it's welcoming in French and English, and it has as much sunshine as a brunch spot without the queue.

Why this gap is winnable:
1. **Coverage gap.** Competitor types A–E each own one moment. None owns the whole day with Mediterranean food.
2. **Pain gap.** The #1 brunch complaint is waiting. Reservations and SMS waitlists turn that into our reason to choose.
3. **Diet gap.** Vegetarian, vegan and halal-friendly without being a "health café" appeals to groups where one person has constraints and the others don't want to compromise.
4. **Margin logic.** Coffee (≈ 15–25 % beverage cost) and eggs, pulses and grains (≈ 20–28 % food cost) are among the highest-margin categories in food service.

## Phase 0 summary

| | |
|---|---|
| **Deliverables** | Assumed brief, 18 questions, competitor-type audit + named template, market snapshot, SWOT, opportunity statement |
| **Decisions made** | Montréal, French-Mediterranean all-day café-brunch, FR-first bilingual, opening in ~10 weeks |
| **⚠️ Owner actions** | Answer Q1–Q8 (blocking); run the named audit (§3.1) or send us the 3–5 competitor names |
| **Cost / time** | Agency time only · owner 2–3 h to answer |
| **KPIs for this phase** | 100 % of blocking questions answered before print files are produced |
| **Next** | Phase 1: brand strategy |
