# Phase 8: Delivery platforms

## 1. Which platforms operate in Montréal, and in what order

| Platform | Operates in Montréal? | Recommendation |
|---|---|---|
| **Uber Eats** | Yes, the largest share in Montréal | **Join first**, from opening week 2 |
| **DoorDash** | Yes, strong and growing | **Join second**, at week 4 once prep times are stable |
| **SkipTheDishes** | Yes, Canadian, strong outside the core and with some demographics | **Join third**, at week 8 if kitchen capacity allows |
| **Glovo** | ⚠️ **Not in Canada** (Glovo operates in Europe, Africa and Central Asia; verify at glovoapp.com) | Not applicable in Montréal. MIAM OS is designed to add Glovo through an aggregator if a location opens in a Glovo market (Phase 9 §8) |
| Local/other | Some local couriers and "click and collect" apps; low volume | Skip at launch |

**Why staged:** each new platform adds 15–25 % more orders at peaks. Adding them one at a time protects prep times and ratings, which drive ranking.

## 2. ⚠️ OWNER ACTION: documents and setup

Needed for each platform (sign up at `merchants.ubereats.com`, `get.doordash.com`, `skipthedishes.com/partner`):
- [ ] Legal business name and **NEQ** (Registraire des entreprises du Québec)
- [ ] **GST and QST numbers** (platforms collect and remit tax on some orders; confirm the current treatment with your accountant)
- [ ] **MAPAQ** food establishment permit (restaurant permit number)
- [ ] Owner's government ID (identity verification)
- [ ] Business bank account (void cheque or direct-deposit form) for payouts
- [ ] Menu with prices (upload `data/menu.csv`, delivery columns) and photos (§5)
- [ ] Logo (square 1:1) and cover image (platform specs, §5)
- [ ] Opening hours per platform (delivery from 8:00; stop 30 min before close)
- [ ] Signed merchant agreement: **read the commission tier, marketing fees, cancellation liability and price-parity clauses**
- [ ] Tablet or integration choice (§10)

## 3. Platform comparison

> ⚠️ **All figures must be checked against each platform's current Canadian terms before signing.** They change frequently and are negotiable for some merchants. Figures below reflect typical published plans as last known.

| | Uber Eats | DoorDash | SkipTheDishes |
|---|---|---|---|
| Commission plans (delivery) | Tiered, typically ~15 % (Lite) / ~25 % (Plus) / ~30 % (Premium), trading reach for commission | Tiered: Basic ~15 % / Plus ~25 % / Premium ~30 % | Custom, typically ~15–30 % |
| Pickup orders commission | Lower, typically ~6–12 % | Lower, typically ~6 % | Varies |
| Marketing tools | Offers (BOGO, $ off, free delivery), sponsored listings (ads, pay per click) | Promotions, sponsored listings, DashPass exposure | Promotions, featured placement |
| Membership programme | Uber One | DashPass | n/a |
| Contract | Month-to-month typically; check auto-renew and minimum terms | Month-to-month typically | Check term |
| Integration API | Via POS partners / aggregators | Via POS partners / aggregators | Via partners |

**Recommendation:** start on the **mid tier (~25 %)** on Uber Eats for the first 60 days (launch visibility), then **move to the lowest tier** once ratings and repeat customers are established. Use pickup (lower commission) as the in-app default where possible.

## 4. Delivery menu strategy

**Travel-safe menu: 35 items** (automatic: `channels.delivery` in `data/menu.json`). Excluded, with reasons:

| Excluded | Why |
|---|---|
| Espresso, cappuccino | Foam and crema collapse in 10 minutes |
| Turkish eggs, green shakshuka, soft-boiled egg | Runny eggs overcook in transit; keep one hero egg dish only (Shakshuka, packed with eggs set medium) |
| Madeleines, brick pastry, za'atar fries | Lose crispness in under 15 min |
| Mezze board, brunch for two | Presentation dishes that are low-margin after commission |
| Pan-bagnat | Menu "Dog" (Phase 3) |
| Mint tea, ayran, oat milk as item | Spill risk; oat milk stays available as a modifier |

**Delivery pricing: +15 % rounded up to the next 0.25** (field `price_delivery`). Example: Shakshuka 18 → 20.75, Bol poulet 20 → 23. At a 25 % commission, the markup keeps contribution per dish within ~$1 of the dine-in margin. ⚠️ Check price-parity clauses; if a platform forbids higher prices, remove the markup there and rely on bundles.

**Delivery bundles (configure in each platform):**
| Bundle | Contents | Price (delivery) | Why |
|---|---|---|---|
| Brunch à la maison | Shakshuka + pain perdu + 2 lattes miel-cardamome | 55 | Raises ticket above the free-delivery threshold |
| Midi complet | Any bowl or pita + soupe + limonade + cookie | Item + 7.50 | Formula attach |
| Mezze night (Thu/Fri) | Houmous + falafels + halloumi + 2 pains plats | 42 | Evening revenue without the board |
| Pause sucrée | 2 croissants pistache + 2 lattes | 27 | Afternoon trough |

**Modifiers and upsells:** +œuf, +halloumi, +avocat, +poulet, extra sauce tahini/toum (0.75), "Ajoutez un biscuit tahini (4.75)" as a checkout upsell, drink size.

## 5. Listing optimization

**Store name:** `Miam's Resto Café · Brunch & méditerranéen` (verify platform rules; some allow a descriptor, others only the legal name).

**Store description**
> FR : Café-brunch méditerranéen de {quartier}. Shakshuka mijotée 3 heures, bols poulet chermoula halal, bol mezze végane et lattes signature. Tout est fait maison, emballé pour voyager.
> EN : Mediterranean café-brunch from {neighbourhood}. 3-hour shakshuka, halal chermoula chicken bowls, vegan mezze bowl and signature lattes. Homemade and packed to travel.

**Category tags:** Brunch, Breakfast, Mediterranean, Middle Eastern, Healthy, Vegan-friendly, Halal, Coffee & tea, Bakery.

**Item titles written for in-app search (lead with the searched word):**
| Menu name | App title |
|---|---|
| Shakshuka Miam's | Shakshuka, œufs pochés & feta (Brunch signature) |
| Bol poulet chermoula | Bol poulet halal chermoula, riz & houmous |
| Bol mezze | Bol végane mezze: falafels, houmous, taboulé |
| Pita poulet chermoula | Pita poulet halal, toum & frites dedans |
| Wrap falafel | Wrap falafel végane, tahini |
| Pain perdu brioché | Pain perdu brioche (French toast) fleur d'oranger & pistache |
| Latte miel & cardamome | Latte miel & cardamome (signature) |

Descriptions: reuse `desc_fr` from the master menu (EN in the platform's English field), ending with allergens.

**Photo specs:** 1:1 and 16:9 versions, min 1200 px wide (verify each platform's current spec), **overhead on Crème or linen, packaging-true** (show the food in our delivery bowl for at least the hero items: what arrives should match the photo, which protects ratings). No text, no watermarks.

## 6. Packaging

| Need | Solution | Est. unit cost (CAD) |
|---|---|---|
| Bowls, shakshuka | Kraft compostable bowls with vented lids (heat without steam sogginess); shakshuka in a 32 oz round container, bread in a separate paper sleeve | $0.45–0.80 |
| Sauces | 2 oz portion cups with lids (tahini, toum, harissa mayo) | $0.06–0.10 |
| Drinks | Cup + lid + sip-stopper + 2-cup carrier | $0.25–0.45 |
| Pastries | Window bag with folded top | $0.10–0.18 |
| Tamper-evident seal | 50 mm round sticker "Scellé avec amour / Sealed with love" + QR `/m/delivery` | $0.04 |
| Bag | Kraft bag, 1-colour logo, handles | $0.25–0.40 |
| Insert | "Merci d'avoir dit miam !" card (Phase 4 §4) with direct-order QR | $0.05 |
| **Total per order** | | **~$1.10–2.00**: budget into the delivery markup |

## 7. Ranking playbook (what the algorithms reward)

| Lever | Target | How |
|---|---|---|
| Rating | ≥ 4.7 | Photo-true packaging; order-check station (a second person checks every bag against the ticket) |
| Accuracy / missing items | < 2 % | Sticker checklist on every bag; drinks sealed |
| Prep time | Set honestly: 12 min (weekday), 18 min (weekend brunch). Update via MIAM OS from real KDS data (Phase 9) | Drivers waiting and late orders both hurt ranking |
| Acceptance rate | ≥ 98 % | Auto-accept via integration; pause the store instead of rejecting orders |
| Cancellations | < 1 % | 86 items everywhere at once (MIAM OS) so no one orders sold-out dishes |
| Store uptime | 100 % of listed hours | Don't close early without updating hours |
| Promotions | Launch offers (§8), then a monthly rotation | New and repeat customers boost ranking |
| In-app ads | $15–25/day, only at lunch and brunch peaks, only once rating is ≥ 4.6 | Pay to amplify a good store, never to hide a weak one |

## 8. Launch promo plan (first 30 days per platform)

| Days | Promotion | Goal |
|---|---|---|
| 1–14 | **Free delivery on orders over $25** (platform-funded share if offered to new stores; verify) | Trial, bigger baskets |
| 1–30 | **20 % off the Shakshuka and Bol poulet** (max $5) | Make the Stars the first taste |
| 15–30 | **BOGO latte miel-cardamome** (7:30–11:00) | Morning delivery habit |
| Always | **"Ajoutez un croissant pistache pour 4 $"** | Upsell |

Budget: cap platform promos at **$600–900 per platform for the first month**. Stop any promo whose effective cost exceeds 30 % of attributed sales.

## 9. Channel shift strategy (within platform rules)

1. **The bag insert** invites the next order direct, with a first-order code (`DIRECT10`). ⚠️ Some platforms restrict marketing material that solicits their customers. Keep the insert brand-led ("Commandez direct la prochaine fois") and check each agreement's clause on inserts. Never use customer contact data received from the platform for marketing.
2. **Price advantage** is visible on our site: "Moins cher qu'en livraison" (true because of the +15 %).
3. **Pickup is faster**: promote 15-minute pickup on Google, the website and Instagram.
4. **Loyalty** (Phase 12) only earns on direct orders and in-store.
5. **Own delivery later** (month 6+): if direct demand justifies it, use an on-demand courier for direct orders (e.g. DoorDash Drive, Uber Direct: white-label delivery at a flat fee, typically cheaper than marketplace commission; verify pricing), dispatched from MIAM OS.

## 10. Tablet management

| Option | How | Monthly (verify) | Recommendation |
|---|---|---|---|
| 3 platform tablets | Each platform's own tablet | $0–15 each | ❌ Counter clutter, missed orders, manual POS re-entry (sales recording issue in Québec) |
| Direct POS integrations | Some POS systems integrate Uber Eats/DoorDash directly | $0–60 | ✅ if the chosen certified POS supports all platforms used |
| **Aggregator** (e.g. **Otter**, **Deliverect**, **Cuboh** (Canadian)) | All platforms → one feed → POS + KDS; menu and 86 sync | $80–250 per location | ⭐ **Recommended** when on 2+ platforms; also the bridge that MIAM OS reads (Phase 9) |

⚠️ Every delivery sale must be recorded through the certified POS (Québec SRS rules; confirm with your accountant how third-party delivery sales are treated). An integration that pushes orders into the POS solves this cleanly.

## Phase 8 summary

| | |
|---|---|
| **Deliverables** | Platform availability and order, onboarding checklist, comparison (flagged for verification), 35-item delivery menu with automatic +15 % prices, bundles, listing copy, photo specs, packaging spec and cost, ranking playbook, 30-day promo plan, channel-shift plan, tablet strategy |
| **Decisions** | Uber Eats → DoorDash → Skip; no Glovo in Montréal; aggregator from platform #2 |
| **⚠️ Owner actions** | Accounts, identity verification, bank details, contract signature, tax treatment with accountant |
| **Cost** | Packaging ~$1.10–2.00/order · aggregator $80–250/month · launch promos $600–900/platform |
| **Time** | Uber Eats onboarding ~1–2 weeks (verify) |
| **KPIs** | Delivery = 12–18 % of sales · rating ≥ 4.7 · error rate < 2 % · net margin after commission per delivery order ≥ 55 % of dine-in margin · 10 % of delivery customers make a direct order within 90 days (DIRECT10 code redemptions) |
| **Next** | Phase 9: MIAM OS |
