# Phase 3: Menu engineering & menu design

**Single source of truth:** [`data/menu.source.json`](../data/menu.source.json). Run `node tools/build-menu.mjs` and every output regenerates:
- [`data/menu.json`](../data/menu.json): enriched master database (feeds the website, QR menu and screens)
- [`data/menu.csv`](../data/menu.csv): import file for the POS and delivery platforms
- [`docs/generated/menu-engineering.md`](generated/menu-engineering.md): Stars / Plowhorses / Puzzles / Dogs matrix
- [`docs/generated/print-menu.md`](generated/print-menu.md): final print copy for the designer

> **Data status.** Food costs are **estimated from 2026 Montréal wholesale prices** (±15 %); unit sales are a **pre-opening projection**. ⚠️ OWNER ACTION: replace each `cost` with your recipe-costed figure from real supplier invoices (MIAM OS computes it automatically once recipes are entered, see Phase 9) and re-run the matrix after 8 weeks of sales.

## 1. Menu engineering analysis

Projected model: **~$14,460/week at menu prices (~$750k/yr), theoretical food and beverage cost 28.5 %.** Full matrix: [generated/menu-engineering.md](generated/menu-engineering.md).

### Actions by item

> The table below analyses the **v0 draft menu**. Its price, rename, move and remove decisions are **already applied** to the launch menu (v1) in `menu.source.json` (see `meta.changelog`). The 8-week "remove if still a Dog" reviews stay open. The generated matrix now shows v1, so re-running it after 8 weeks of real sales gives the next round of decisions.

| Item | Class | Action | Why |
|---|---|---|---|
| Shakshuka Miam's | ⭐ Star | **Keep, hero it.** Top-right of the brunch section, photo, ★ badge. Test 18 → 19 after 8 weeks if demand holds | The brand's signature and highest contribution; it will carry reviews and Reels |
| Bol poulet chermoula | ⭐ Star | Keep; first item of Lunch; offer the "+5 formule" | Highest-margin lunch main |
| Grande assiette du matin | ⭐ Star | Keep; highest price in section acts as the **anchor** that makes 17–18 feel fair | Anchor + high margin |
| Pain perdu brioché | ⭐ Star | Keep; ★ badge; the sweet brunch hero | Photogenic, high margin |
| Bol mezze | ⭐ Star | Keep; label **VÉGANE** prominently | Serves the vegan persona in groups |
| Shakshuka verte | ⭐ Star (low end) | Keep as a variant listed *under* the main shakshuka ("Version verte +0") | Adds choice without adding a line |
| Toast avocat-labneh | 🐎 Plowhorse | Re-cost (avocado volatility): portion ½ avocado, price 16.5 → **17**; suggest "+ œuf 2.25" | Avocado runs 30 %+ of the dish cost; the add-on lifts the margin |
| Pita poulet chermoula | 🐎 Plowhorse | Keep price, **push the +5 formule**, place it second in Lunch | Volume driver; margin comes from the formula |
| Brioche œuf-halloumi-harissa | 🐎 Plowhorse | Keep at 13 as the **sub-$15 value item** (brand value "Ouverture"); push with coffee "+3 latte" | Takeaway morning volume |
| Wrap falafel | 🐎 Plowhorse | Price 15 → **15.50**, pair with the formula | Low cost, room to grow the margin |
| Soupe lentilles-citron | 🐎 Plowhorse | Keep, mainly as a formula component | Very low cost; makes the formula feel generous |
| Œufs turcs (çılbır) | 🧩 Puzzle | **Rename to "Œufs pochés au yogourt & beurre d'Alep (çılbır)"**, add a photo on the QR menu, staff recommendation | Unfamiliar name hides a high-margin dish |
| Fattouch & halloumi | 🧩 Puzzle | Move into the golden-triangle box as "Le frais du midi", seasonal summer push | High margin, needs visibility |
| Pan-bagnat | 🐕 Dog | **Remove at the 8-week review if still a Dog**; swap for a rotating "sandwich du mois" | Off-concept (Niçoise), low mix |
| Bol granola | 🐕 Dog | Keep as a lighter, cheaper breakfast option (strategic), move to Pastries & sweets as "À emporter du matin" at 11 | Serves the light-breakfast need; takeaway |
| Latte miel-cardamome, pistache, glacé | ⭐ Stars | Signature badge; screens feature; the pistachio latte is the upsell target (+1.50 over a latte) | Beverage margins 70–78 % |
| Cappuccino, allongé, filtre, espresso | 🐎 Plowhorses | Keep prices (competitive references); upsell pastry via the **formule matin** | Customers compare these prices; don't overprice |
| Thé à la menthe | ⭐ Star | Keep; serve in a pot with glasses (the experience justifies the price) | High margin |
| Chaï, chocolat tahini | 🧩 Puzzles | Seasonal feature Oct–Mar on screens and chalkboard; "boisson de saison" badge | High margin, seasonal appeal |
| Jus d'orange pressé | 🐕 Dog | Keep for brunch (expected), **reprice 6.50 → 7** | Guests expect it; the cost is volatile |
| Ayran | 🐕 Dog | **Remove from the printed menu**; keep as an evening off-menu drink or drop it | Low mix |
| Croissant | 🐎 Plowhorse | Keep at 3.75; sell through the formule matin at 6.25 | Traffic driver |
| Biscuit tahini | 🐎 Plowhorse | Keep; place at the till (impulse buy) | Impulse item |
| Croissant pistache, gâteau orange-amande | ⭐ Stars | Front row of the display, labels with ★ | High-margin sweets |
| Baklava cigars, madeleines | 🧩 Puzzles | Madeleines: "cuites à la commande, 8 min", suggest with afternoon coffee; baklava: pair with mint tea as "Pause d'après-midi 8.50" | Build afternoon traffic (14–17 h) |
| Planche mezze | ⭐ Star | Hero of the evening, ★ badge | Highest contribution per order |
| Houmous, halloumi, falafels, pain plat | 🐎 Plowhorses | Bundle into "**Mezze trio + pain plat 29**" (saves ~4) | Raises the evening ticket |
| Brick à l'œuf & thon | 🐕 Dog | Keep for 8 weeks as a "family dish" story item; remove if still a Dog | Heritage story value |

## 2. Pricing strategy

1. **No currency symbols, no trailing zeros**: "18" not "$18.00". Research on menu-price formats (Cornell, 2009) found guests spent more with numeral-only prices. French format with a comma (6,25) on the FR menu; 6.25 on EN screens.
2. **Right-aligned with the description, never in a price column.** A column invites price shopping; prices sit immediately after the description.
3. **Anchoring:** the *Grande assiette* (21) opens Brunch and the *Planche mezze* (34) opens the evening, so the next items feel reasonable.
4. **Charm vs. round:** round and half prices (17, 16.5) for food signal quality; the .25/.75 steps on coffee are industry standard and read as precise.
5. **Bundles:** Formule matin (6.25, saves 0.75); Formule midi (+5 adds soup/lemonade + cookie, ~9 value); Brunch pour deux (49, saves ~5); Pause d'après-midi (8.50); Mezze trio (29).
6. **Add-ons (margins 60–80 %):** +œuf 2.25 · +halloumi 4 · +avocat 3 · +poulet 5.50 · lait d'avoine 0.75 · extra shot 1.25 · sirop maison 0.75.
7. **Upsell scripts:** the barista always offers the signature ("Avec un latte miel-cardamome ?"); the server offers bread refills (free, builds generosity) and "+ un œuf ?" on toasts.
8. **Delivery prices: +15 %, rounded up to the next 0.25** (automatic in `menu.json` → `price_delivery`). ⚠️ Verify each platform's current terms on price parity before publishing.
9. **Price reviews:** quarterly, triggered by MIAM OS when an item's food cost % goes 3 points above target.

## 3. Menu architecture

**Main table menu (A3 folded to A4, 4 panels)**

```
 Panel 1 (cover)          Panel 2 (left inside)        Panel 3 (right inside)          Panel 4 (back)
 ─────────────────        ──────────────────────       ─────────────────────────       ─────────────────
 Logo, tagline,           BRUNCH                        MIDI / LUNCH                    CAFÉ & BOISSONS
 "Assieds-toi,            (Grande assiette = anchor,    [golden-triangle box:           VIENNOISERIES
 c'est prêt."             Shakshuka ★ in photo box,      Bol poulet chermoula ★,        FORMULES
 Hours, Wi-Fi,            Pain perdu ★, …)               Formule midi]                  APÉRO MEZZE (jeu–ven)
 QR (menu EN/allergens)                                  Bol mezze, Pita, Wrap,         Allergen key, taxes,
                                                         Fattouch box (Puzzle),         halal statement,
                                                         Soupe, À côté                  "Fait maison" list
```

- **Golden triangle:** the eye lands at the centre of the open spread, then top-right, then top-left. Centre-right holds the **Bol poulet chermoula** box and the formula; top-right holds the **Shakshuka photo box**; top-left holds the anchor **Grande assiette**.
- **Order within sections:** best-margin items in positions 1–2 and last (primacy/recency); Plowhorses in the middle.
- **Highlight system (max 1 in 5 items):** ★ Signature badge (Safran pill), a boxed "À découvrir" for Puzzles, and a photo for at most 2 items per spread.
- **Dietary icons:** VÉGANE / VÉGÉ (Sauge text pills), HALAL (text pill), 🌶 mild heat, allergen letters in small circles after each description.

## 4. Item names & descriptions

All 55 items have final FR/EN names and sensory descriptions in [`data/menu.source.json`](../data/menu.source.json) and ready to paste in [`generated/print-menu.md`](generated/print-menu.md). Rules followed: 12–25 words, one technique word (mijotée, grillé, pressé), one origin or homemade cue, no adjectives like "délicieux".

**Allergen compliance.** Canada's priority food allergens (peanuts, tree nuts, sesame, milk, eggs, fish, crustaceans/shellfish, soy, wheat and triticale / gluten cereals, mustard, sulphites) are tracked per item. Restaurants aren't subject to prepackaged labelling rules for plated food, but **pre-packaged items sold from a display (grab-and-go, catering boxes) are**. ⚠️ Have your grab-and-go labels checked against CFIA requirements. "Gluten-free" is not claimed anywhere; the tag used is "sans ingrédient à gluten / no gluten ingredients" + the shared-kitchen notice.
**Halal statement (menu back):** « Notre poulet est certifié halal par [organisme]. Nos cuisines ne sont pas exclusivement halal. » / "Our chicken is halal-certified by [body]. Our kitchen is not exclusively halal." ⚠️ OWNER ACTION: keep supplier certificates on file.

## 5. Print menu layout spec

| Spec | Value |
|---|---|
| Format | A3 (297 × 420 mm) folded to A4, or 11 × 17" folded to 8.5 × 11" (printer's choice) |
| Paper | 350 gsm uncoated recycled, warm white (matches Crème), matte anti-grease lamination OR 2 sets of 20-panel menus reprinted monthly (cheaper updates) |
| Grid | 2 columns per panel, 10 mm margins, 6 mm gutter, 4 mm baseline |
| Type | Section titles Fraunces 700 22 pt Terracotta · item names Fraunces 600 12.5 pt Olive · FR description Inter 9 pt · EN name + description Inter Italic 8 pt (85 %) Olive at 80 % · prices Inter 600 10 pt tnum |
| Colour | Background Crème, text Olive nuit, accents Terracotta and Safran; print CMYK + 1 spot (Terracotta) if offset |
| Photos | 2 maximum inside (Shakshuka, Bol poulet), 60 × 60 mm, rounded 3 mm |
| Legal | Allergen key + shared-kitchen notice + taxes line + halal statement on the back panel |
| Text | [`generated/print-menu.md`](generated/print-menu.md) |

## 6. Additional menus (final copy)

### Table tent (A6 folded, 105 × 148 mm per side)
> **FR:** **Le menu en un scan.** Photos, allergènes, végane, halal : tout est là. *Scannez, choisissez, commandez au comptoir.*
> **Réservez votre brunch** : fini la file sur le trottoir. [QR réservations]
> **EN:** **The whole menu in one scan.** Photos, allergens, vegan, halal, all in one place. *Scan, choose, order at the counter.* **Book your brunch.** No more sidewalk queue.

### Takeout flyer (DL 99 × 210 mm, 2 sides)
> Front: **Miam's à emporter / Miam's to go**: « Commandez direct, c'est plus rapide et moins cher que les applis. » / "Order direct: faster and cheaper than the apps." · QR → `/fr/commander` · 6 best-sellers with prices · hours.
> Back: Formules · Catering teaser "Nourrir le bureau ? / Feeding the office?" · social handles.

### Kids' menu (A5, colouring side)
> **Pour les petits (12 ans et moins) / For little ones (12 and under)**: Petit pain perdu & fruits 9 · Œuf à la coque & mouillettes 8 · Chocolat chaud doux 3.50 · Lait ou jus 2.50. Back: "Dessine ton assiette miam ! / Draw your miam plate!" colouring frame with the sun icon. Crayons in a jar on the table.

### Drinks card (A5 single, Crème)
> Hot drinks, cold drinks, "Nos signatures" box at the top (honey-cardamom, pistachio, iced), seasonal drink slot, milk alternatives and extras line, "Vins & bières bientôt / Wine & beer coming soon" (only once the permit is confirmed).

### Chalkboard template (A-frame, 600 × 900 mm)
```
 ┌──────────────────────────────┐
 │  ICI, ON DIT MIAM.  (Caveat) │
 │  ── Aujourd'hui / Today ──   │
 │  Soupe : ____________  8     │
 │  Sandwich du mois : ___ 15   │
 │  Douceur : __________   5    │
 │  ─────────────────────────   │
 │  Brunch sans file → réservez │
 │  [QR sticker]                │
 └──────────────────────────────┘
```
Rules: max 5 lines, prices whole, one drawing, rewritten daily before 7:15.

### Catering menu (PDF + web page, A4 2 pages)
> **Traiteur Miam's: nourrir le bureau, sans stress.** / **Miam's Catering: feed the office, stress-free.**
> - Plateau du matin (12 pers.) 110 · Boîte déjeuner bureau 25/pers. (min. 8) · Grand plateau mezze (10 pers.) 145 · Bols individuels 18–20 · Pitas en plateau (10) 150 · Biscuits tahini (12) 42 · Limonade maison 4 L 38
> - Commandes 48 h à l'avance · livraison avant 11 h 45 dans un rayon de 5 km (frais selon zone) · étiquetage individuel avec allergènes · facture et bon de commande acceptés · compte entreprise disponible.
> - EN mirror on page 2.

## 7. Master menu database

| Field | Example | Used by |
|---|---|---|
| `id` | `shakshuka` | Every system (stable key; never rename) |
| `cat` | `matin` | Category ordering everywhere |
| `fr` / `en` | Shakshuka Miam's / Miam's shakshuka | All channels |
| `desc_fr` / `desc_en` | … | Print, web, QR, delivery |
| `price` / `price_delivery` | 18 / 20.75 | POS, web; delivery apps |
| `cost`, `food_cost_pct`, `contribution_margin` | 4.76 / 26.4 / 13.24 | Engineering, MIAM OS alerts |
| `allergens`, `tags` | eggs, milk, gluten / vegetarian, signature | Icons, filters, allergen matrix |
| `dayparts` | matin, midi | Screens, QR, POS menus |
| `photo` | `shakshuka.jpg` | Web, apps, screens |
| `channels` | dine_in, takeout, online_pickup, delivery, catering, screens | Channel availability |

## Phase 3 summary

| | |
|---|---|
| **Deliverables** | 55-item master database (JSON + CSV), engineering matrix with per-item actions, pricing strategy, menu architecture, print spec + final copy, 6 additional menus |
| **Decisions** | No $ signs; delivery +15 %; formulas; remove Ayran from print; 8-week review for Pan-bagnat/Brick; rename çılbır |
| **⚠️ Owner actions** | Real recipe costs; halal certificates; CFIA check of grab-and-go labels; approve prices |
| **Cost** | Menu layout (designer) $600–1,500 · print run 60 menus + tents + flyers $500–1,200 |
| **Time** | 1 week for layout after owner approval |
| **KPIs** | Theoretical food cost ≤ 29 %, actual ≤ 32 % · average ticket brunch ≥ $24 · formula attach rate ≥ 25 % of lunch mains · signature latte ≥ 30 % of milk drinks |
| **Next** | Phase 4: QR menu |
