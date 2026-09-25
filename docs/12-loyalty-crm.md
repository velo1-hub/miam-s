# Phase 12: Loyalty, CRM & retention

## 1. Loyalty program design

| Model | Pros | Cons | Fit |
|---|---|---|---|
| Stamps (10th coffee free) | Dead simple | Only rewards coffee; no data on food; easy to fake on paper | Good for coffee-only shops |
| **Points ($1 = 1 point)** ⭐ | Rewards all spend; menu-wide rewards; data-rich | Needs a digital tool | **Best for an all-day café** |
| Tiers only | Status appeal | Slow gratification | Add as a layer on points |

**Recommended: "Le Club Soleil": points plus one status tier.** (Already built into the MIAM OS schema: `loyalty_accounts`, `loyalty_transactions`, points awarded automatically on completed direct-channel orders; tested.)

- **Earn:** 1 point per $1 before tax, in-store and on direct online orders (not on third-party delivery apps: that's the channel-shift incentive).
- **Welcome:** 25 points on signup (≈ a third of the first reward).
- **Birthday:** a free pastry of your choice (birthday week).
- **Status "Soleil d'Or":** reached at 600 points in a calendar year (≈ $600, ≈ 25 visits). Perks: **double points on Tuesdays and Wednesdays** (slowest days), priority brunch booking window (7 days before the public), a "bonne année" gift in January.

**Rewards and cost analysis** (food cost from `data/menu.json`)

| Reward | Points | Retail value | Our cost | Cost as % of spend needed |
|---|---|---|---|---|
| Any filter coffee or allongé | 50 | $3.25–3.75 | $0.50–0.64 | 1.0–1.3 % |
| Any signature latte | 75 | $6.25–6.75 | $1.45–1.92 | 1.9–2.6 % |
| Croissant pistache + latte | 125 | $10.75 | $3.73 | 3.0 % |
| Any brunch or lunch plate | 225 | $13–21 | $3.62–6.89 | 1.6–3.1 % |

**Program cost:** ~2–3 % of member spend, below the typical 5–10 % discounting that attracts the same visits, and it concentrates on high-margin items.

**Tool:** at launch, **the certified POS's native loyalty** (so earn and redeem happen at the till, with receipts; verify the POS includes points, not just stamps). In **MIAM OS V3**, the program moves to MIAM OS (the schema is ready) with an **Apple/Google Wallet pass** for the digital card. Keep the rules identical so members never notice the switch.

## 2. Customer data capture (with consent)

| Touchpoint | What we capture | Consent method | Law 25 / CASL notes |
|---|---|---|---|
| Loyalty signup (till, QR on cup sleeve) | Name, phone or email, birthday (optional) | **Separate, unticked checkbox** for marketing | Loyalty terms ≠ marketing consent; purpose stated at collection |
| Online order | Name, email, phone, order | Checkbox "Recevoir les offres" (unticked) | A purchase creates **implied consent for 2 years** under CASL; we still ask for express consent (it doesn't expire) |
| Reservations | Name, phone, email, party | Provider's checkbox | Use booking data only for the booking unless consent is given |
| Guest Wi-Fi | Email via captive portal (optional) | Checkbox; Wi-Fi works without it | No MAC-address tracking for marketing |
| Catering | Business contact | Business relationship (implied); ask for express | B2B still falls under CASL |
| Newsletter form (site) | Email, language | Checkbox + **double opt-in** | Record wording, timestamp, source (`customer_consents`) |

**Every email/SMS must include:** sender name (Miam's Resto Café + legal name), mailing address, working unsubscribe processed **within 10 business days** (we do it instantly), in French first. **SMS only with express consent.** A privacy officer is named on the website (Phase 6).

## 3. Email & SMS program (full copy)

Tool: **Klaviyo** (flows, segments, SMS, Canadian compliance features) or Mailchimp as a budget option. Sender: `Miam's Resto Café <bonjour@miamsrestocafe.ca>`. Every email is in **French with the English version below** (or sent by language preference once known).

### Flow 1: Welcome (on signup)

**Email 1 (immediately).** Subject: « Bienvenue au Club Soleil ☀️ » / "Welcome to the Club Soleil ☀️"
> FR : Bonjour {prénom},
> Bienvenue chez Miam's ! Vos **25 points de bienvenue** sont déjà sur votre compte. À 75 points, votre latte signature est offert.
> Trois choses à savoir :
> 1. Le brunch se réserve : fini la file. [Réserver]
> 2. Commander en direct, c'est moins cher que les applis, et ça rapporte des points. [Commander]
> 3. Le jeudi et le vendredi soir, on sort les mezzes.
> À très vite. Assieds-toi, c'est prêt.
> {Prénom du propriétaire}, Miam's Resto Café
>
> EN: Hi {name}, welcome to Miam's! Your **25 welcome points** are already in your account. At 75 points, your signature latte is on us. Three things to know: 1. Brunch is bookable, so no more queue. 2. Ordering direct is cheaper than the apps, and it earns points. 3. Thursday and Friday evenings are mezze nights. See you soon. Sit down, it's ready.

**Email 2 (day 3).** Subject: « Ce qu'on fait maison (et pourquoi) » / "What we make in-house (and why)"
> FR : La sauce de notre shakshuka mijote 3 heures. Notre labneh s'égoutte toute la nuit. Nos falafels sont roulés à la main chaque matin. On ne fait pas ça pour faire joli : c'est comme ça qu'on cuisinait à la maison. [Voir le menu]
> EN: Our shakshuka sauce simmers for 3 hours. Our labneh drains overnight. Our falafel is shaped by hand every morning. We don't do it for show; it's how we cooked at home. [See the menu]

**Email 3 (day 10, only if no visit since signup).** Subject: « Votre latte vous attend » / "Your latte is waiting"
> FR : On vous offre **50 points** pour votre prochaine visite cette semaine : de quoi arriver pile à votre latte signature. Valable jusqu'au {date}.
> EN: Here are **50 points** for your next visit this week: enough to land right on your signature latte. Valid until {date}.

### Flow 2: Birthday (7 days before, and on the day)

**Email/SMS (day −7).** Subject: « Votre semaine d'anniversaire commence ici 🎂 » / "Your birthday week starts here 🎂"
> FR : Joyeux anniversaire en avance, {prénom} ! Toute la semaine, **la viennoiserie de votre choix est pour nous**. Et si vous fêtez au brunch, réservez : on ajoute une bougie dans le pain perdu. [Réserver]
> EN: Happy early birthday, {name}! All week, **the pastry of your choice is on us**. Celebrating at brunch? Book, and we'll put a candle in your French toast.

**SMS (day 0, express consent only, 160 characters):**
> FR : Miam's : Joyeux anniversaire {prénom} ! Votre viennoiserie offerte vous attend cette semaine. ☀️ STOP pour arrêter
> EN: Miam's: Happy birthday {name}! Your free pastry is waiting this week. ☀️ Reply STOP to opt out

### Flow 3: Win-back (at-risk 45 days → lost 120 days)

**Email 1 (45 days since last visit).** Subject: « On vous garde votre place au soleil » / "We're saving your sunny seat"
> FR : {prénom}, ça fait un moment ! Depuis votre dernière visite : {nouveauté 1}, {nouveauté 2}. Revenez cette semaine et vos **points comptent double**.
> EN: {name}, it's been a while! Since your last visit: {new item 1}, {new item 2}. Come back this week and your **points count double**.

**Email 2 (60 days).** Subject: « Un latte sur nous ? » / "A latte on us?"
> FR : On aimerait vous revoir. Voici **un latte signature offert** avec tout plat, jusqu'au {date}. Montrez ce courriel ou utilisez le code RETOUR en ligne.
> EN: We'd love to see you again. Here's **a free signature latte** with any dish until {date}. Show this email or use code RETOUR online.

**Email 3 (120 days, last one).** Subject: « Dernière chose, promis » / "One last thing, promise"
> FR : Est-ce qu'on a fait quelque chose de travers ? Répondez à ce courriel : je lis tout personnellement. Et si vous préférez moins de nouvelles de nous, [choisissez vos préférences] ou [désabonnez-vous]. {Prénom}, propriétaire
> EN: Did we get something wrong? Reply to this email; I read every one myself. And if you'd rather hear from us less, [set your preferences] or [unsubscribe]. {Name}, owner

### Flow 4: Post-visit review request (3 h after an online order or booking; consent required)
> FR : Merci d'être venu·e ! Comment c'était ? 😍 [Laisser un avis Google] · 😕 [Dites-le-nous en privé] (lien vers un formulaire → MIAM OS feedback)
> EN: Thanks for coming! How was it? 😍 [Leave a Google review] · 😕 [Tell us privately]
*(Both options go to every guest; there is no review gating. Google prohibits selectively sending only happy guests to review.)*

### Monthly newsletter "La lettre miam" (first Tuesday, 9:30)

**Template:**
> Subject: « {Nouveau plat} arrive + ce qui se passe en {mois} » / "{New dish} is here + what's on in {month}"
> 1. **Le miam du mois:** new or seasonal dish, photo, 40 words, [Réserver]
> 2. **En coulisses:** a 60-word story (a supplier, a team member, a recipe secret)
> 3. **À l'agenda:** mezze nights, workshop, holiday hours
> 4. **Club Soleil:** points reminder, member perk of the month
> 5. **La recette (presque):** one simple home recipe (the chai, the labneh) for sharing
> Footer: address, legal name, unsubscribe, preferences, privacy policy link

**Sample (December):**
> Subject: « Le chocolat chaud au tahini est de retour + nos heures des Fêtes »
> 1. Le miam du mois : notre **chocolat chaud au tahini** revient pour l'hiver : chocolat noir, tahini grillé, pincée de sel. Le réconfort, version sésame.
> 2. En coulisses : notre miel vient de {rucher}, à {x} km de Montréal. On l'a visité en octobre : {1 anecdote}.
> 3. À l'agenda : fermé les 25–26 décembre et 1er–2 janvier ; ouvert jusqu'à 14 h les 24 et 31. Soirée mezze des Fêtes le jeudi 18.
> 4. Club Soleil : cartes-cadeaux = 2× points jusqu'au 24 décembre.
> 5. La recette : notre chaï (presque) complet.

## 4. Referral, gift cards, corporate outreach

**Referral: « Invite un·e ami·e à table »**
- Member shares a personal link or code from the app or email.
- **Friend:** 50 points on signup + first visit. **Referrer:** 75 points (= signature latte) once the friend's first order is completed.
- Cap: 10 referrals per year per member (fraud control); tracked in `loyalty_transactions.reason = 'referral'`.

**Gift cards**
- Digital (POS e-gift) + physical PVC cards (Phase 2 spec). **No expiry, no fees** (Québec consumer protection law).
- Peaks: December (display at the till from Nov 15, "2× points on gift cards" for members), Mother's/Father's Day, Valentine's, graduation (April–May), teachers' gifts (June).
- Corporate bulk: 10+ cards → 5 % bonus value, invoice payment.

**Corporate & catering outreach plan**
1. **List building (month 1):** 60 offices, coworkings, clinics, schools and agencies within 3 km (Google Maps, LinkedIn, SDC directory).
2. **Drop-in sampling (weeks 3–8):** 2 visits per week, bringing a box of 6 pastries + a catering menu + the manager's card, delivered to reception at 9:30.
3. **Email follow-up (day +2):**
   > FR : Objet : « Les croissants de mardi, c'était nous 🥐 » · Bonjour {prénom}, on est passés mardi avec des viennoiseries : j'espère que l'équipe a aimé ! Pour vos réunions et journées d'équipe, on prépare des plateaux du matin (12 pers., 110 $) et des boîtes déjeuner étiquetées avec allergènes (25 $/pers.), livrées avant 11 h 45. Facture d'entreprise et bon de commande acceptés. Est-ce que je peux vous envoyer une soumission pour votre prochaine rencontre ? {Prénom}, Miam's Resto Café · {téléphone}
   > EN: Subject: "Tuesday's croissants were us 🥐" · Hi {name}, we stopped by Tuesday with pastries; hope the team enjoyed them! For meetings and team days we make morning platters (serves 12, $110) and allergen-labelled lunch boxes ($25/person), delivered before 11:45. Company invoices and POs welcome. Can I send you a quote for your next meeting?
4. **Corporate account perks:** monthly invoicing, 5 % off from the 5th order, a named contact, a 24 h quote guarantee.
5. **Pipeline in MIAM OS** (`event_leads` stages) with a weekly follow-up list.

## Phase 12 summary

| | |
|---|---|
| **Deliverables** | Program design with cost analysis, tool plan, consent-compliant data capture map, 4 automated flows + newsletter template and sample with full FR/EN copy, referral program, gift card calendar, corporate outreach plan with scripts |
| **Decisions** | Points + "Soleil d'Or" tier; POS-native loyalty at launch → MIAM OS in V3; Klaviyo |
| **⚠️ Owner actions** | Approve rewards; sign up for Klaviyo in the business's name; name the privacy officer; approve the contest and referral terms |
| **Cost** | Klaviyo $0–60/month at launch (verify tiers) + SMS ~$0.01–0.02 per message · reward cost ~2–3 % of member spend · corporate sampling $150/month in pastries |
| **KPIs** | 1,500 members by month 6 · 35 % of in-store transactions identified to a member by month 6 · email open rate ≥ 40 %, click ≥ 3 % · win-back reactivation ≥ 12 % · 8 corporate accounts by month 6 · catering ≥ 8 % of revenue by month 12 |
| **Next** | Phase 13: launch plan |
