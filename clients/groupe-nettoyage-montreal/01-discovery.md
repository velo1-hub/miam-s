# Phase 0: Discovery — Groupe Nettoyage Montréal

Status: **started 2026-11-18, waiting on the owner.** Everything below that could be done without the owner is done: the working brief, the questionnaire, the access list, the competitor and pricing benchmark, the keyword map, the compliance list and the proposed sitemap. Items marked 🔴 cannot be finalised until the owner answers.

Companion documents: [`00-audit-and-plan.md`](00-audit-and-plan.md) (audit of the current site and the tiered feature plan).

---

## 1. Working brief (what we know, what we assume)

Source legend: **Site** = stated on groupenettoyagemontreal.ca today · **Assumed** = our working assumption until the owner corrects it · 🔴 = blocking for design or launch.

| Field | Working value | Source | Impact if wrong |
|---|---|---|---|
| Legal name | Groupe Nettoyage Montréal (🔴 NEQ and legal form unknown) | Site | Footer, terms, invoices, schema `legalName` |
| Phone | +1 (514) 260-5194 | Site | Call tracking numbers must forward here |
| Email | info@groupenettoyagemontreal.ca | Site | Transactional email domain (SPF/DKIM) |
| Address | 1420 Towers St, Montréal QC H3H 2E1 (🔴 looks residential; confirm whether to publish) | Site | Google Business Profile type (storefront vs service-area), schema, citations |
| Hours | Mon–Sun 7:00–21:00 | Site | After-hours messaging, SMS auto-replies |
| Languages | French first, English second | Site + Loi 96 | All copy written FR first |
| Service area | Montréal island, Laval, Longueuil, Brossard, West Island | Site | Zone pages, ad radius, pricing surcharges |
| Services | Residential regular, deep clean (grand ménage), move-in, move-out, post-construction, condo, Airbnb; commercial: offices, restaurants, property management, commercial deep clean | Site | Quote engine catalogue |
| Primary segment | Property managers ("Le plus populaire" tab) | Site | Homepage lead message |
| Promises already public | Same team every visit · we contact you first · signed visit report · eco products · satisfaction guarantee (free re-clean, then full refund) · no contract · same-day for emergencies · quote in 24 h | Site | These become product features (visit report, re-clean button) or must be removed |
| Insurance | "Entièrement assuré, certificat sur demande" (🔴 carrier and amount unknown) | Site | Competitors publish 5 M$; we need the number |
| Reviews | Schema claims 47 reviews at 5★; 🔴 no Google link found | Site | If real, we feed them live; if not, markup comes off |
| Team size | 🔴 Unknown. Assumed 6–12 cleaners, 1 owner-operator, 1 coordinator | Assumed | Careers page, capacity messaging, cleaner app scope |
| Years in business | 🔴 Unknown. Blog posts dated June 2026, copyright 2026 | Assumed young (< 3 years) | "Depuis 20XX" claim, story page |
| Price positioning | Mid-market, "$$" in schema; blog publishes office ranges 150–800 $/visit | Site | Quote engine defaults (see §5) |
| Existing tech | Next.js on Vercel, GTM container GTM-P3R6LNTK, form posting to `/api/quote` (destination unknown), no CRM visible | Site | Migration, lead routing |
| Current lead volume | 🔴 Unknown | — | Baseline for success metrics |
| Budget | 🔴 Unknown. Assumed build 25 000–45 000 CAD + 400–900 CAD/month tooling | Assumed | Scope of Tier 2 (portal, cleaner app) |
| Launch target | Assumed 10–12 weeks from kickoff, before the spring deep-clean season (April) and well before 1 July moving day | Assumed | Phase plan |
| 12-month goals | Assumed: 3× qualified leads, 40 % of residential leads self-book online, Google 4.8★ with 150+ real reviews, 5 property-management accounts of 10+ units | Assumed | Scorecard |

---

## 2. Owner questionnaire (ready to send, in French)

Send as one email or a shared form. Numbering `[Q#]` is referenced throughout the docs.

**Bloquant : nécessaire avant le design**
1. `[Q1]` Nom légal de l'entreprise, NEQ, forme juridique (inc., enr.), numéros de TPS/TVQ. *(Pied de page, conditions, factures, données structurées.)*
2. `[Q2]` L'adresse 1420 Towers St est-elle une adresse d'affaires à publier, ou préférez-vous être affiché comme « entreprise de service à domicile » sans adresse publique? *(Détermine le type de fiche Google et les citations.)*
3. `[Q3]` Depuis quelle année opérez-vous? Qui a fondé l'entreprise et pourquoi? Combien d'employés (préposés, superviseurs, bureau)? Salariés ou sous-traitants? *(Page À propos, crédibilité, page Carrières.)*
4. `[Q4]` Assurance : assureur, montant de la responsabilité civile (ex. 2 M$ ou 5 M$), cautionnement des employés, numéro CNESST. Pouvez-vous fournir le certificat? *(Les concurrents affichent 5 M$; il faut le chiffre réel.)*
5. `[Q5]` Les 47 avis à 5 étoiles mentionnés sur le site : où sont-ils (Google, Facebook, autre)? Lien vers votre fiche Google. Les 6 témoignages nommés sur le site sont-ils de vrais clients qui ont consenti? *(Sans preuve, le balisage d'avis doit être retiré avant le lancement.)*
6. `[Q6]` Grille de prix réelle par service : tarif horaire, prix par visite selon la taille (3½, 4½, 5½, maison), prix par rotation Airbnb (studio / 1 ch / 2 ch / 3 ch+), prix au pi² ou par passage pour les bureaux, minimum mensuel commercial, post-construction (au pi² ou à l'heure), suppléments (animaux, four, frigo, vitres, lavage de literie, déplacement hors île). *(Moteur de soumission instantanée.)*
7. `[Q7]` Quel segment rapporte le plus aujourd'hui, et lequel voulez-vous faire croître? (gestion immobilière, bureaux, restaurants, Airbnb, résidentiel). *(Message principal de la page d'accueil.)*
8. `[Q8]` Les engagements publics actuels sont-ils tous vrais et tenables : même équipe à chaque visite, rapport de visite signé avec photos, produits écoresponsables (quelle marque / certification?), service le jour même, remboursement complet? *(On les transforme en fonctionnalités ou on les retire.)*
9. `[Q9]` Combien de demandes de soumission recevez-vous par mois actuellement, par quel canal (formulaire, téléphone, bouche-à-oreille, Google), et quel pourcentage devient client? *(Base de référence.)*

**Nécessaire dans les 3 premières semaines**
10. `[Q10]` Accès (voir la liste §3) : registraire du domaine, Vercel, code source du site actuel, GTM/GA4, fiche Google, Meta, téléphonie.
11. `[Q11]` Photos : avez-vous des photos réelles (équipe, uniformes, véhicule, avant/après)? Acceptez-vous une séance photo d'une demi-journée? Les employés acceptent-ils d'apparaître?
12. `[Q12]` Logo : fichier source (AI, SVG, Figma)? Sinon, on le reconstruit en vectoriel.
13. `[Q13]` Paiement : voulez-vous accepter les cartes en ligne (dépôt ou paiement complet) pour le résidentiel et l'Airbnb? Facturation mensuelle pour le commercial? Logiciel comptable actuel (QuickBooks, Sage, autre)?
14. `[Q14]` Comment planifiez-vous les équipes aujourd'hui (papier, Google Agenda, logiciel)? Comment les préposés reçoivent-ils leurs feuilles de route?
15. `[Q15]` Recrutement : combien d'embauches par an, quel est le salaire de départ, exigences (permis de conduire, véhicule, antécédents judiciaires)? *(Page Carrières.)*
16. `[Q16]` Budget approuvé pour le site et les outils, et budget mensuel pour la publicité.
17. `[Q17]` Trois concurrents que vous rencontrez le plus souvent en soumission, et pourquoi vous gagnez ou perdez contre eux.

**Souhaitable**
18. `[Q18]` Clients ou immeubles de référence que l'on peut nommer (ou un cas anonymisé avec des chiffres vérifiables).
19. `[Q19]` Marques dont vous aimez l'image (dans n'importe quel secteur) et celles que vous ne voulez surtout pas imiter.
20. `[Q20]` Qui, dans votre équipe, répondra aux leads en moins de 5 minutes pendant les heures d'ouverture? Par SMS? Par WhatsApp?

---

## 3. Access and assets checklist

| Item | Why | Who grants it | Status |
|---|---|---|---|
| Domain registrar for groupenettoyagemontreal.ca | DNS, email auth (SPF, DKIM, DMARC), staging subdomain | Owner | 🔴 |
| Vercel project | Deploy the new site to the same domain, zero-downtime cutover | Owner or previous developer | 🔴 |
| Source code of the current site | Reuse the `/api/quote` logic if any, confirm what happens to leads today | Previous developer | 🔴 |
| Google Tag Manager GTM-P3R6LNTK and GA4 property | Baseline traffic, keep history, add conversion events | Owner | 🔴 |
| Google Search Console | Baseline queries, submit new sitemap, monitor the migration | Owner | 🔴 |
| Google Business Profile (manager access) | Live reviews feed, posts, call and direction stats, booking link | Owner | 🔴 |
| Meta Business Suite (Facebook page, Instagram, pixel) | Ads, social proof, pixel events | Owner | 🔴 |
| Phone provider | Call forwarding for tracking numbers, SMS-capable line | Owner | 🔴 |
| Email provider (Google Workspace or other) | Sending domain for notifications, shared inbox for leads | Owner | 🔴 |
| Logo source file | SVG rebuild | Owner | 🔴 |
| Insurance certificate and CNESST confirmation | Trust badges, downloadable PDF for property managers | Owner | 🔴 |
| Real photos or a photo shoot date | Replaces stock and AI imagery | Owner | 🔴 |
| Price list | Quote engine rules | Owner | 🔴 |

---

## 4. Competitor benchmark (Montréal, November 2026)

Method: each site was fetched and read on 2026-11-18; prices and claims are what the competitor publishes, not verified market data. Review counts are as displayed on their sites.

| Competitor | Positioning | Publishes prices | Online quote or booking | Trust signals shown | Reviews shown | Weakness we can exploit |
|---|---|---|---|---|---|---|
| **The Montreal Cleaners** (themontrealcleaners.ca) | "Largest commercial cleaning company in the region", residential + commercial, since 2010 | Yes: price table by unit size (3½ regular 80–130 $, 4½ deep 140–350 $, 5½ move-out 250–550 $) | No booking; quote form | Background checks on every cleaner, ISSA, insured, before/after gallery, case studies | 4.9★, 150+ Google reviews | Dense, long pages; dated look; no instant quote; no portal |
| **Ninja Bleu** (ninjableu.ca) | Tech-first commercial cleaning: "film your space, price in 2 minutes", 14-day free trial, app for schedule and check-ins, since 2016 | Yes: market ranges 0.07–0.30 $/sq ft/month, 25–55 $/h, 420 $/month minimum | Yes: video-based instant quote, same-day signup, client app | Timestamped visits in app, consent banner compliant with Loi 25 | 4.9★, 27 Google reviews | Uses independent contractors; commercial only; small review base; informal "tu" tone may not suit property managers |
| **Y Clean** (yclean.ca) | Premium residential + commercial, "50+ cities" | Yes: from 100 $/visit, 45 $ base fee plus per-room, 35–55 $/h, deep clean 250–450 $, post-reno 250–600 $+, move-out 200–400 $ | Yes: online booking, WhatsApp | ISSA, eco products, satisfaction guarantee, referral program | 4.8★ | Generic design, franchise feel, thin local proof |
| **Entretien Ménager Montréal** (entretien.ca) | "Prestige" commercial + residential, Montréal / Gatineau / Québec | Yes: ~125 $/visit for a 3-room apartment biweekly; offices 420–850 $/month for 2 000–4 000 sq ft | Yes: online estimate calculator | 5 M$ liability, CNESST compliance, EcoLogo products, SIMDUT training, no opaque subcontracting | None visible | Very heavy WordPress pages (700 KB HTML); no review proof |
| **Simple Service** (ssimple.ca) | B2B facility maintenance, Greater Montréal, English-first | Yes: 0.08–0.35 $/sq ft by tier | Calculator, quote form | 5 M$ liability, bonded, CNESST, ISSA, timestamped before/after photos every shift, account manager < 24 h, case studies | 5.0★ (count not shown) | English-first in a French market; no residential; no self-serve booking |
| **ITO Services** (itonettoyage.ca) | Airbnb concierge and turnover specialist | Yes: Airbnb from 110 $/visit, residential from 175 $/visit | Quote form, price calculator | Cites 143 public Airbnb guest reviews linked to listings, Google reviews per neighbourhood | 4.8★ Google + Airbnb proof | Narrow niche; no commercial; small team feel |
| **Nettoyage MTL** (nettoyagemtl.ca) | Residential + Airbnb, simple | Yes: 105–135 $ | Online booking | Insured, bonded, background checks | 4.9★ | Very thin site (359 words); no depth |
| **Ménage Go Pro** (menagegopro.com) | Commercial, industrial, post-construction, Montréal + Laval | No | Online booking mention | ISSA, insured, before/after gallery | None shown | WordPress/WPML, slow, no prices |

### What the market has already normalised (table stakes for the new site)
- A published price anchor on the page, even as a range. Six of eight competitors do it; the client does not.
- Insurance amount stated in dollars (5 M$ is becoming the commercial norm), CNESST and ISSA mentioned by name.
- Google rating and review count on the page, linked to the profile.
- Before/after photos of real jobs.
- Satisfaction guarantee with a re-clean window (24 h is common).

### Where nobody is strong yet (the opening)
- **No competitor combines** instant residential pricing, Airbnb calendar-synced turnovers, a property-manager multi-building dashboard and a bilingual, Loi 25-compliant site. Ninja Bleu is closest on self-serve but is commercial-only and contractor-based; ITO owns Airbnb proof but nothing else.
- **Proof of work after each visit** (photo report, signed checklist) is promised by the client and by Simple Service, but only Simple Service shows how. A visible sample report on the site is a differentiator.
- **French-first premium tone for B2B.** Simple Service is English-first, Ninja Bleu uses "tu". A polished French "vous" B2B experience with an English mirror is open.
- **Recruiting.** None of the eight sites has a serious careers page. The client's capacity to grow depends on it.

---

## 5. Pricing benchmark and proposed quote-engine model (🔴 to validate with `[Q6]`)

Montréal, late 2026, before taxes (TPS 5 % + TVQ 9.975 %). Ranges are the union of published competitor prices and the client's own blog.

| Service | Market range observed | Proposed engine default (editable by owner) |
|---|---|---|
| Residential regular, 3½ | 60–130 $/visit | Base 55 $ + 22 $/room + 18 $/bathroom; frequency discount weekly −15 %, biweekly −10 % |
| Residential regular, 4½–5½ | 100–165 $/visit | Same formula (lands 115–150 $) |
| House, 3 bedrooms | 120–220 $/visit | Same formula + 25 $ per extra floor |
| Deep clean (grand ménage) | 140–450 $ | 2.2 × regular price, minimum 180 $ |
| Move-in / move-out | 200–550 $ | 2.5 × regular price, minimum 220 $; add-ons oven 35 $, fridge 35 $, interior windows 6 $/window |
| Post-construction / post-reno | 250–600 $+ small jobs; larger by sq ft | 0.35–0.60 $/sq ft, minimum 300 $; site visit required above 2 500 sq ft |
| Airbnb turnover | 105–175 $/turnover | Studio 95 $, 1 br 115 $, 2 br 145 $, 3 br+ 185 $; linen service +25 $; restocking at cost +15 % |
| Office, recurring | 0.07–0.35 $/sq ft/month; 25–55 $/h; 420 $/month minimum; client's blog: 150–800 $/visit by size | Engine shows a range by sq ft × frequency, states 450 $/month minimum, then books a walkthrough |
| Restaurant | Not published by anyone | Quote-only, hourly 45–60 $/h per agent after hours, mention MAPAQ-ready checklist |
| Property management (multi-building) | Not published | Quote-only; RFP form with building list upload |

Design rule: residential and Airbnb get a **firm price and a booking button**; commercial gets a **range and a walkthrough booking**. The owner can change every number in an admin table (`pricing_rules`), no deploy needed.

---

## 6. Keyword map (FR and EN)

No search-volume tool was reachable from this session, so volumes are not listed. Before Phase 2 copywriting, export volumes from Google Keyword Planner (free with the Ads account) or Search Console once access `[Q10]` is granted. Priority is based on commercial intent and competitor coverage.

| Target page | Primary FR | Primary EN | Secondary / long tail | Intent |
|---|---|---|---|---|
| Home | entretien ménager montréal · compagnie de nettoyage montréal | cleaning company montreal · house cleaning montreal | service de ménage montréal, femme de ménage montréal | Mixed |
| Offices | nettoyage de bureaux montréal · entretien ménager commercial montréal | office cleaning montreal · commercial cleaning montreal | prix nettoyage bureau montréal, nettoyage bureau laval/longueuil/brossard | B2B, high value |
| Property management | nettoyage gestion immobilière montréal · entretien immeuble montréal | property management cleaning montreal · building maintenance cleaning montreal | nettoyage aires communes, nettoyage immeuble à logements | B2B, highest value |
| Restaurants | nettoyage restaurant montréal · nettoyage cuisine commerciale | restaurant cleaning montreal · commercial kitchen cleaning | nettoyage hotte (if offered), MAPAQ nettoyage | B2B |
| Airbnb | ménage airbnb montréal · nettoyage airbnb montréal · conciergerie airbnb montréal | airbnb cleaning montreal · airbnb turnover service montreal | prix ménage airbnb, femme de ménage airbnb | High frequency |
| Residential | entretien ménager résidentiel montréal · femme de ménage montréal | house cleaning montreal · maid service montreal | ménage régulier, ménage hebdomadaire | High volume |
| Deep clean | grand ménage montréal · grand ménage du printemps | deep cleaning montreal · spring cleaning montreal | prix grand ménage | Seasonal (March–May) |
| Move-out / move-in | nettoyage déménagement montréal · ménage fin de bail · ménage 1er juillet | move out cleaning montreal · move in cleaning montreal | nettoyage avant emménagement | Seasonal peak June–July |
| Post-construction | nettoyage après construction montréal · nettoyage après rénovation | post construction cleaning montreal · post renovation cleaning | nettoyage fin de chantier | Project |
| Condo | nettoyage condo montréal · entretien ménager condo | condo cleaning montreal | ménage condo centre-ville, griffintown | Residential premium |
| Zones (6–8 kept) | entretien ménager laval · … longueuil · … brossard · … ouest-de-l'île · … plateau · … centre-ville | cleaning services laval · … west island | service-in-zone combos only where the zone page can carry real local content | Local |
| Careers | emploi préposé à l'entretien ménager montréal · emploi femme de ménage montréal | cleaning jobs montreal · housekeeper jobs montreal | salaire entretien ménager montréal | Recruiting |
| Blog (keep, improve) | combien coûte le nettoyage de bureau à montréal · checklist nettoyage déménagement | office cleaning cost montreal · move out cleaning checklist | | Informational |

---

## 7. Compliance and legal checklist for the build

| Requirement | What it means for the site | Source to confirm |
|---|---|---|
| **Loi 25** (Québec privacy) | Consent banner before any non-essential cookie or pixel (GTM, GA4, Meta, Maps embed), granular categories, easy withdrawal, privacy policy in French naming the **responsable de la protection des renseignements personnels** with contact, data portability on request, breach register. | Commission d'accès à l'information |
| **Loi 96 / Charte de la langue française** | French version at least equivalent to English, French shown by default, French-first social and ads for Québec, trademarks and signage rules for the logo. | OQLF |
| **Consumer protection (LPC)** for residential clients | Clear total price before payment, cancellation and refund terms stated, no hidden fees in the quote engine, written confirmation of recurring plans. | Office de la protection du consommateur |
| **CNESST** | Registration if any employee; the careers page and B2B pages can state "employés déclarés, CNESST". 🔴 Confirm with `[Q4]`. | CNESST |
| **Décret sur le personnel d'entretien d'édifices publics (région de Montréal)** | Minimum wage and conditions for cleaners in public buildings (offices, commercial). Affects wage figures on the careers page and commercial pricing floor. 🔴 Verify current rates with the Comité paritaire. | Comité paritaire de l'entretien d'édifices publics |
| **Insurance and bonding** | No legal minimum, but clients expect 2–5 M$ liability and bonding; publish the real amount and offer the certificate as a PDF behind a form. | Insurer `[Q4]` |
| **Anti-spam (LCAP / CASL)** | Express consent checkbox for marketing email and SMS, separate from the quote request; unsubscribe in every message. | CRTC |
| **Accessibility** | WCAG 2.1 AA target: contrast, keyboard, focus states, reduced motion. Not legally mandated for private SMEs in Québec but expected and good for conversion. | W3C |
| **Reviews markup** | Only real, third-party reviews; no self-serving `aggregateRating` on LocalBusiness. | Google Search Central |

---

## 8. SWOT of the business as it presents itself online

| | |
|---|---|
| **Strengths** | Clear, differentiated promises (same team, proactive communication, visit report); wide service catalogue; bilingual; already ranks with 83 indexed URLs; modern stack to migrate from. |
| **Weaknesses** | No identity (no faces, no story, no real photos); unverifiable social proof; no pricing; single generic form; duplicate template content; legal gaps (consent, reviews markup). |
| **Opportunities** | Instant pricing and booking for residential and Airbnb (few do it well); property-manager reporting dashboard (nobody shows it); real review engine; careers funnel; seasonal campaigns (spring deep clean, 1 July moves, post-construction in autumn). |
| **Threats** | Tech-first entrants (Ninja Bleu) winning small offices on speed; established players (The Montreal Cleaners) with 150+ reviews and 15 years; Google penalising doorway pages and fake-review markup; recruiting shortage limiting capacity. |

---

## 9. Proposed sitemap for the new site (draft, ~36 pages per language)

Down from 83 URLs. Every retired URL gets a 301 to its closest replacement; the redirect map is produced in Phase 5.

```
/                                   Accueil
/services                           Vue d'ensemble + sélecteur « Je suis… »
/services/nettoyage-bureaux         Bureaux et commerces
/services/gestion-immobiliere       Gestionnaires et syndicats de copropriété
/services/nettoyage-restaurants     Restaurants et cuisines commerciales
/services/menage-airbnb             Airbnb et location court terme
/services/entretien-residentiel     Ménage régulier (maison, condo, appartement)
/services/grand-menage              Grand ménage
/services/nettoyage-demenagement    Avant et après déménagement (fusion emménagement + déménagement)
/services/nettoyage-apres-construction
/tarifs                             Grille indicative + lien vers la soumission instantanée
/soumission                         Moteur de soumission instantanée (multi-étapes)
/reserver                           Réservation en ligne (résidentiel, Airbnb)
/zones                              Carte + liste
/zones/montreal · /zones/laval · /zones/longueuil · /zones/brossard · /zones/ouest-de-lile · /zones/plateau-mont-royal · /zones/centre-ville   (8 pages, each with genuinely local content)
/a-propos                           Histoire, équipe, valeurs, assurances, certifications
/notre-methode                      Checklist, rapport de visite (exemple réel), garantie
/avis                               Mur d'avis Google en direct
/realisations                       Avant/après et études de cas
/carrieres                          Postes, salaire, avantages, formulaire 2 minutes
/blogue + 7 articles existants, réécrits avec photos et auteur
/contact
/espace-client                      Portail (Tier 2)
/confidentialite · /conditions · /accessibilite
/en/...                             Mirror of all of the above
```

---

## 10. Baseline metrics to capture before anything changes

Collect these in the first week after access `[Q10]`; they are the "before" in every later report.

- Search Console, last 12 months: clicks, impressions, top 50 queries, top 20 pages, average position for the 12 primary keywords in §6.
- GA4, last 6 months: sessions by channel, mobile share, form submissions (if tracked), calls (if tracked).
- Google Business Profile, last 6 months: searches, calls, direction requests, website clicks, review count and rating.
- Owner's own count: quote requests per month, conversion to client, average first-month revenue per segment `[Q9]`.
- Lighthouse mobile on home, one service page, one zone page (already captured: 87 / 91 / 96 / 100 on home).

---

## 11. Kickoff meeting agenda (60 minutes, with the owner)

1. 5 min: what the audit found, in three sentences, and what "1000 % better" means in leads.
2. 15 min: walk the blocking questions `[Q1]`–`[Q9]` live; fill in on screen.
3. 10 min: show the three competitor sites that matter (The Montreal Cleaners, Ninja Bleu, ITO) and the gap we take.
4. 10 min: pricing model (§5): agree on the defaults and the minimums.
5. 10 min: features by tier; decide what is in launch scope and what waits.
6. 10 min: access checklist (§3), photo shoot date, who answers leads, next meeting.

---

## 12. Decisions needed from you (the agency) now

1. **Budget tier to design for** while the owner's number is unknown: Tier 1 only, or Tier 1 + client portal at launch? This changes Phase 3 design scope.
2. **Keep the Next.js stack** (recommended: keeps URLs, rankings and Vercel) or move to another platform the agency prefers?
3. **Who does the photo shoot** and when; without real photos the design phase ships with placeholders.
4. **Send the questionnaire in §2 to the owner today.** Phase 1 (brand) can start on assumptions; Phase 2 (content) and the quote engine cannot finish without `[Q3]`, `[Q4]`, `[Q5]`, `[Q6]`.

## 13. What Phase 0 still needs to close

| Item | Blocked on |
|---|---|
| Final brief with no 🔴 | Owner answers `[Q1]`–`[Q9]` |
| Baseline metrics | Access `[Q10]` |
| Keyword volumes | Google Ads or Search Console access |
| Verified competitor review counts and the client's own Google profile | Google Maps lookup (not reachable from this session) or owner's link `[Q5]` |
| Décret rates for the careers page | Comité paritaire lookup (to do in Phase 2) |
