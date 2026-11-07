# Client to-do — Idya Auto

Everything the website needs from Idya Auto, and every statement that must be validated by the
client or their advisor before launch. Each `[CLIENT: …]` placeholder in the code and copy is
listed here (brief §0.3, §17.8, §26). Updated at the end of every phase.

Status: ☐ open · ☑ received / validated

## 1. Brand and identity

| | Item | Where it is used | Brief |
|---|---|---|---|
| ☑ / ☐ | Logo received as a storefront photo (swoosh + « IDYA AUTO », red `#E21F26` sampled); the **vector SVG file** is still needed to replace the traced paths in `components/ui/logo.tsx` and `public/brand/logo.svg` | `<Logo />`, favicon, OG images; logo-sync done on the sampled red (`docs/decisions.md`) | §3.2, §3.9 |
| ☐ | Approval of the assistant's name (default « Assistant Idya ») | Chat launcher and panel header, privacy notice | §26, §27.1 |
| ☐ | Approval of the hero headline (default « Votre prochaine voiture, sous tous ses angles. » / « Your next car, from every angle. »; two alternatives offered in the Phase 1 report) | Home hero | §6.1 |
| ☐ | Approval of the final Higgsfield hero video (Version A loop for the site, Version B logo sting for the pitch and social) | Home hero | §11, §29.1 |

## 2. Business facts (placeholders in copy)

| | Placeholder | Where it is used |
|---|---|---|
| ☐ | `[CLIENT: city]` | Hero eyebrow « Idya Auto · [city], Québec », page titles, AutoDealer schema, OG images |
| ☐ | `[CLIENT: legal business name]` | Footer, Terms, Privacy, AutoDealer schema, email footers |
| ☐ | `[CLIENT: address]` | Footer, « Nous visiter », Contact, directions link, schema `address` and `geo` |
| ☐ | `[CLIENT: phone]` | Nav (mobile menu), footer, vehicle page « Appeler », assistant handoff, schema |
| ☐ | `[CLIENT: email for leads / notification email]` | Lead notifications for every form and booking, footer |
| ☐ | `[CLIENT: opening hours]` | Footer live « Ouvert maintenant / Fermé », « Nous visiter », booking slots, schema `openingHoursSpecification`, assistant after-hours behaviour |
| ☐ | `[CLIENT: holiday closures]` | Booking slot generation, hours display |
| ☐ | `[CLIENT: new / used / both]` | Inventory condition filter defaults, home copy, schema `itemCondition` |
| ☐ | `[CLIENT: Google Business Profile link]` | Reviews section (real Google reviews only; hidden until provided), « Itinéraire » |
| ☐ | `[CLIENT: social links]` | Footer |
| ☐ | `[CLIENT: domain name]` | `NEXT_PUBLIC_SITE_URL`, canonical URLs, sitemap, hreflang, emails |

## 3. Claims that must be confirmed before they ship

Only « Prix tout inclus, sans surprise » ships by default (it is a legal obligation, §17.1).
Everything below is hidden until confirmed in writing.

| | Claim | Where |
|---|---|---|
| ☐ | `[CLIENT: inspection claim]` (e.g. « Inspection en N points ») | Home « Pourquoi Idya Auto » card 2 |
| ☐ | `[CLIENT: financing claim]` (e.g. « Financement pour tous les dossiers de crédit ») | Home « Pourquoi Idya Auto » card 3 |
| ☐ | `[CLIENT: trade-in valuation delay]` (e.g. « Évaluation en 24 h ») | Home « Pourquoi Idya Auto » card 4, trade-in page |
| ☐ | `[CLIENT: years in business, number of clients, awards]` | Never shown unless confirmed; live counter strip shows only the live inventory count |
| ☐ | `[CLIENT: Google reviews]` | Reviews section, Places API or manual entry in admin; section hidden if none |

## 4. Financing and taxes (§14)

| | Item | Where |
|---|---|---|
| ☐ | `[CLIENT: default annual credit rate]` and available terms (36–96 months) | Calculator defaults (Settings), assistant `estimate_payment` |
| ☐ | `[CLIENT: mandatory credit fees]`, if any — included in the displayed credit rate (APR) | Calculator, Settings |
| ☐ | `[CLIENT: à valider]` TPS 5 % + TVQ 9,975 % applied on (price − trade-in) — to confirm with the client's accountant | Calculator, Settings |
| ☐ | `[CLIENT: à valider]` Calculator disclaimer wording: « Estimation à titre indicatif seulement, sous réserve de l'approbation du crédit. Le taux offert dépend de votre dossier. » | Under every payment estimate |

## 5. Legal texts — `[CLIENT: à valider]` by the client or their legal advisor (§17)

| | Text | Where |
|---|---|---|
| ☐ | Privacy policy FR/EN (Law 25) | `/fr/confidentialite`, `/en/privacy`, consent banner, forms, assistant notice |
| ☐ | Terms of use FR/EN | `/fr/conditions`, `/en/terms` |
| ☐ | `[CLIENT: privacy officer name, title and contact]` (person in charge of personal information, Law 25) | Privacy page, footer « Légal » column |
| ☐ | `[CLIENT: lead retention period, default 24 months]` — leads auto-deleted after this unless converted | Privacy policy, scheduled deletion job |
| ☐ | `[CLIENT: chat retention period, default 90 days]` | Assistant notice, privacy policy, scheduled deletion job |
| ☐ | Legal warranty class texts — A: 6 mois ou 10 000 km · B: 3 mois ou 5 000 km · C: 1 mois ou 1 700 km (first limit reached) · D: no warranty of good working order | Vehicle « Garantie » section, Settings |
| ☐ | Confirmation of each used vehicle's warranty class (set per vehicle in admin) | Vehicle editor |
| ☐ | « Prix tout inclus : comprend tous les frais, sauf la TPS et la TVQ. » wording | Vehicle summary panel, cards (« taxes en sus ») |
| ☐ | Consent / purpose statements on every form and in the booking flow | All forms, booking step 3, assistant lead actions |
| ☐ | AI assistant disclosure line (« Assistant IA », conversations recorded to improve service, retention, privacy link) | Assistant first message and panel footer |
| ☐ | Cookie / consent banner wording (essential only by default) | Site-wide |

## 6. Content and data

| | Item | Where |
|---|---|---|
| ☐ | First vehicles with 36-photo spin sets shot to `docs/photo-guide.md` (§10.1) | Inventory, replaces demo media when `DEMO_MODE=false` |
| ☐ | Interior photos (8–15 per vehicle) | Vehicle media stage « Intérieur » |
| ☐ | FAQ answers for the assistant: documents to bring, delivery delay, warranty, financing process, trade-in process | Knowledge base (admin « Assistant »), `search_knowledge_base` tool |
| ☐ | Staff accounts: names, emails, roles (owner / manager / sales) | Admin auth; TOTP 2FA mandatory for owner |
| ☐ | Which vehicle is featured in the home 360° scene | Settings |

## 7. Accounts and services the client (or Veloria Labs on their behalf) must provide

| | Service | Purpose |
|---|---|---|
| ☐ | Vercel project (team) | Hosting, previews, production |
| ☐ | Supabase project (Pro recommended for branching, §2) | Database, auth, storage |
| ☐ | Resend account + verified sending domain | Confirmation and notification emails |
| ☐ | Cloudflare Turnstile site | Form anti-spam |
| ☐ | Anthropic API key + agreed daily budget (`AI_DAILY_BUDGET_USD`, default 15 $) | Assistant, search parsing, lead briefs |
| ☐ | Google Maps Platform key (or decision to use a static map) | « Nous visiter » |
| ☐ | Plausible site | Cookieless analytics |
| ☐ | Photoroom API key (optional) | Background removal in the image pipeline |
| ☐ | SMS provider (optional, e.g. Twilio) | Booking notifications to sales |
| ☐ | Higgsfield credits | Hero video and demo imagery (pitch) |

## 8. Demo mode — to clear before launch

| | Item |
|---|---|
| ☐ | Set `DEMO_MODE=false`, remove `DEMO_ADMIN_*` variables, create real admin accounts in Supabase Auth |
| ☐ | Replace locally rendered placeholder media (`public/media/`, `public/demo/vehicles/`) with the approved hero video and real 360° sets |
| ☐ | Replace the 13 seed vehicles (`demo/seed.json`) with real inventory through the admin |
| ☐ | Review `docs/decisions.md`: each default applied to a Phase 0 question can still be reversed |

