# Groupe Nettoyage Montréal — audit of the current site and plan for the new one

Site reviewed: https://www.groupenettoyagemontreal.ca (reviewed 2026-11-18, desktop 1440px and mobile 390px, FR and EN, 83 URLs in the sitemap).
Screenshots: `audit-screenshots/`.

## 1. Verdict in one paragraph

The current site is **not a disaster**. It is a modern Next.js build on Vercel with a sensible page structure, bilingual URLs, structured data and 100/100 on Lighthouse SEO. What it lacks is **credibility and conversion machinery**: no About page, no real team, stock and AI photos, testimonials that cannot be verified, a plain 4-field form as the only way to buy, no pricing signal, no booking, no reviews feed, no consent banner (Loi 25), a broken social-share image, and a template feel where 60+ pages say the same thing with the city name swapped. "1000 % better" is less about a prettier homepage and more about turning a brochure into a lead-generation and operations system.

## 2. What the current site does well (keep these)

| Area | What they got right |
|---|---|
| Stack | Next.js on Vercel, server-rendered HTML, HTTP/2, HSTS, security headers, 1 H1 per page, `lang` set, DM Sans font self-hosted. |
| Information architecture | Services × Zones matrix: 22 service pages, 12 zone pages, 7 blog posts, each mirrored in EN under `/en/`. Clean slugs. |
| International SEO | `hreflang` fr-CA / en-CA / x-default on every page, each FR page points to its EN twin. Canonicals correct. Sitemap and robots fine. |
| Structured data | LocalBusiness + CleaningService, OfferCatalog, FAQPage, BreadcrumbList, Article on blog posts. Geo coordinates, hours, phone, email. |
| Messaging | The positioning is sharp: "same team every visit", "we contact you first", "nothing is forgotten", satisfaction guarantee, no contract. Segment tabs (property managers, offices, restaurants, Airbnb, owners). Good French copy, conversational "on". |
| Lighthouse mobile | Performance 87 · Accessibility 91 · Best practices 96 · SEO 100. FCP 1.0 s, CLS 0. |
| Conversion basics | Phone in header and hero, click-to-call, sticky "Soumission gratuite" button, form at the bottom of every page. |

## 3. What is wrong (ranked by business impact)

### Trust and credibility
1. **No About / Team / Company page.** Nothing says who runs the company, since when, how many cleaners, what training, what insurance carrier. The footer and schema give a residential address (1420 Towers St, H3H 2E1). For a B2B buyer (property manager, restaurant) this is the first thing they look for.
2. **Stock and AI imagery.** The hero is a generated image (`/images/image.png`, 790 KB). The "Équipe Groupe Nettoyage Montréal au travail" photo is an Unsplash stock photo. There is not one real photo of the team, a van, a uniform, or a finished job.
3. **Unverifiable social proof.** Schema claims `aggregateRating 5/5, 47 reviews`, but the page shows 6 text testimonials with initials, no link to Google, no Google review count, no date. Google's guidelines forbid self-serving `LocalBusiness` review markup, so this is both a credibility problem and a rich-result penalty risk. The "tenant complaints dropped 85 % in the first month" claim has no source.
4. **No certifications, no insurance proof, no partner logos, no client logos, no case studies.**

### Conversion
5. **One generic form** (name, email, phone optional, free-text). No service picker, no property type, no square footage, no frequency, no preferred date, no file upload, no instant estimate. The buyer has to write an essay; the owner has to call back to qualify.
6. **No pricing signal anywhere.** Not even "à partir de". The blog post about office cleaning cost gives ranges, but the service pages do not. Visitors who want a number leave for a competitor who gives one.
7. **No online booking**, no calendar, no "book a walkthrough", no WhatsApp / SMS, no live chat. Hours say 7 h–21 h, 7 days, but after-hours visitors can only email.
8. **Form backend is a black box.** Posts to `/api/quote`; no confirmation page, no email autoresponder visible, no CRM, no lead tracking. GTM container is installed but there is no sign of conversion events on call clicks or form submits.
9. **Mobile hero** pushes the CTA below the fold on a 390×844 screen (long subhead + second paragraph).

### Content quality
10. **Template duplication.** Service and zone pages share the same paragraphs with the location swapped ("La plupart des plaintes en nettoyage se résument aux mêmes choses…" appears on all three sampled pages). 22 service pages + 12 zone pages at 600–1000 words each, mostly interchangeable. Google calls these doorway pages; at best they cannibalise each other.
11. **Blog**: 7 posts, all dated 2026-06-01, author "Équipe", no images, no author bio. Reads as generated in one batch.
12. **Keyword-stuffed titles.** Home `<title>` is 120 characters: "Meilleur service de nettoyage à Montréal | Groupe Nettoyage Montréal | Nettoyage résidentiel et commercial près de chez moi". EN version starts with "BEST House cleaning service Montreal". Google truncates at ~60 and will rewrite it.
13. **Missing pages**: À propos, Équipe, Carrières / Emplois (cleaning companies live or die on recruiting), Galerie / Avant-après, Tarifs, Avis, Études de cas, Entreprise / Devenir partenaire, Checklists downloadable.

### Technical and legal
14. **Open Graph image is a 404** (`/images/og-image.png`). Every share on Facebook, LinkedIn, iMessage, WhatsApp shows a blank card. The same URL is used as the schema `logo` and `image`.
15. **Scroll-reveal animations hide content.** 8 blocks on the home page and 3 of 9 H2s on service pages are `opacity: 0` until scrolled into view, and stay invisible with JavaScript off. Full-page screenshots, print, reader mode and some crawlers see blank sections.
16. **No consent banner.** GTM and a Google Maps iframe load on first paint with no consent. Quebec's Loi 25 requires opt-in for non-essential cookies and a privacy officer named in the policy.
17. **Accessibility**: 35 colour-contrast failures (grey #999/#aaa text, white at 35–45 % opacity on navy), 4 touch targets too small, heading order skipped (H3 before H2 in sections), 2 images with empty alt (the logo).
18. **Performance**: LCP 3.0 s on mobile caused by the 790 KB hero PNG; TTI 5.3 s; 650 KB of JS; logo shipped as a 1491×1449 PNG scaled down to 36 px.
19. **Contact page** is half empty on desktop: the "Nous joindre" column renders blank until scrolled, leaving the form floating on the right with nothing on the left.

## 4. Who the new site has to win

| Segment | What they need to see in 10 seconds | What converts them |
|---|---|---|
| Property managers (their "most popular") | Multi-building capability, one contact, reporting, insurance certificate, references | Case study, RFP-ready PDF, "book a walkthrough" |
| Offices / commerces | After-hours service, security-screened staff, consistent checklist, WSIB/CNESST compliance | Price-per-visit estimator, sample checklist, contract-free trial |
| Restaurants | MAPAQ-aware deep cleaning, hood/grease, photo reports for inspections | Inspection-ready checklist, same-day emergency line |
| Airbnb / STR hosts | 4-hour turnovers, linen, photo report, calendar sync | Per-turnover pricing, iCal/Airbnb sync, host portal |
| Homeowners / condos | Same cleaner every time, eco products, easy rebooking | Instant online quote and booking, recurring discounts |

## 5. The new site: feature plan

### Tier 1 — must ship at launch
- **Real brand**: photo shoot (team, uniforms, vehicle, before/after), founder story, "À propos" and "Notre équipe" pages, insurance and CNESST badges, Google Business Profile embedded with live rating and review count.
- **Instant quote engine**: multi-step quote (service → property type → size → frequency → extras → contact) that returns a price range on screen, emails the lead a PDF, and pushes the lead to the CRM with UTM source. Residential gets a firm price and can book directly; commercial gets a range plus "book a walkthrough".
- **Online booking** for residential and Airbnb (date, time window, recurring), with Stripe deposit or card-on-file, SMS confirmation and reminders.
- **Lead capture everywhere**: sticky mobile bar (Call · Texto · Soumission), WhatsApp / SMS click, callback request, exit-intent offer, after-hours "we reply by 7 h" message.
- **Speed-to-lead automation**: instant SMS + email to the lead, instant alert to the owner, auto-follow-up sequence at 1 h / 24 h / 72 h if no reply.
- **Reviews system**: post-job SMS asking for a Google review, review wall on the site fed from the Google API, schema generated from real reviews only.
- **Rewritten content**: one strong page per service with real differentiators, checklists and pricing signals; zone pages consolidated to the 6–8 that matter, each with genuinely local content (landmarks, building types served, real jobs done there). Short, honest titles.
- **Fix the technical list**: OG image, animations that never hide content (`prefers-reduced-motion` respected), contrast, heading order, alt text, hero image as optimised WebP/AVIF under 150 KB, logo as SVG, consent banner compliant with Loi 25 with GTM gated on consent, conversion events (call, SMS, form, booking) in GA4 and Meta.
- **Careers page** with a 2-minute application form. Recruiting is the bottleneck of every cleaning company.

### Tier 2 — first 90 days after launch
- **Client portal**: upcoming visits, visit reports with photos and the signed checklist, invoices, rebooking, add-ons, one-click "something was missed" that triggers the free re-clean promise.
- **Property-manager dashboard**: all buildings, per-building checklists and reports, monthly PDF for owners, incident log.
- **Airbnb host tools**: iCal / Airbnb / Booking sync, auto-scheduled turnovers between check-out and check-in, restocking checklist, damage photos.
- **Cleaner app (PWA)**: today's jobs, address and access notes, checklist with mandatory photos, clock in/out, report auto-sent to the client.
- **Downloadable assets** as lead magnets: move-out checklist, office cleaning RFP template, Airbnb turnover checklist, MAPAQ cleaning log.
- **Case studies** with numbers the client signs off on, replacing the unsourced "85 %" claim.

### Tier 3 — growth
- Referral program (give 25 $, get 25 $), recurring-plan upsells, seasonal campaigns (grand ménage du printemps, post-déménagement 1er juillet), landing pages per Meta/Google Ads campaign, email/SMS nurture for unconverted quotes, French and English blog on a real editorial calendar with photos from real jobs.

## 6. Recommended build

- **Front end**: Next.js 15 App Router (keep the stack the client already has, so the URL structure, hreflang and existing rankings carry over), Tailwind, server components, zero scroll-gated content, images via `next/image` with AVIF.
- **Back end**: Supabase (Postgres, Auth, Storage, Row Level Security) for leads, quotes, bookings, clients, buildings, visits, checklists, photos, reviews. Edge functions for pricing, notifications and the Google Reviews sync.
- **Payments**: Stripe (deposits, recurring plans, invoices).
- **Messaging**: Twilio or Telnyx for SMS, Resend for email, WhatsApp Business API optional.
- **Analytics**: GA4 + Meta Pixel + server-side conversions, all behind the consent layer; call tracking numbers per channel.
- **Hosting**: Vercel (unchanged), 301 map from any URL that changes.
- **Data model** (core tables): `leads`, `quotes`, `quote_items`, `pricing_rules`, `clients`, `properties`, `bookings`, `visits`, `checklists`, `checklist_items`, `visit_photos`, `cleaners`, `assignments`, `invoices`, `reviews`, `review_requests`, `referrals`.

## 7. Suggested phases and order of work

| Phase | Deliverable | Depends on |
|---|---|---|
| 0 | Discovery with the owner: real services and prices, zones actually served, team size, insurance, photos, Google Business Profile access, GTM access, current lead volume | — |
| 1 | Brand refresh: logo cleanup as SVG, palette, type, photo shoot brief, tone guide | 0 |
| 2 | Content: sitemap of ~35 pages (down from 83), page-by-page copy FR/EN, pricing model, FAQs, checklists | 0 |
| 3 | Design: homepage, service, zone, quote flow, booking flow, portal, careers, mobile-first | 1, 2 |
| 4 | Build: site, quote engine, booking, CRM, notifications, consent, analytics | 3 |
| 5 | Migration: 301 map, schema, OG images, Search Console, launch QA (Lighthouse ≥ 95 all four, axe clean) | 4 |
| 6 | Post-launch: portal, PM dashboard, cleaner PWA, reviews automation, ads landing pages | 5 |

## 8. Open questions for the client

1. Is 1420 Towers St a real business address, or should the site show "service area business" only?
2. How many cleaners and vehicles? Any real client logos or references we may show?
3. Do the 47 reviews exist on Google? If yes, we feed them live; if not, the rating markup must come off before launch.
4. Real price list by service and frequency, and the minimum charge.
5. Which segment makes the most money today? The site says property managers; the design will lead with that unless told otherwise.
6. Does the owner want online payment and deposits, or quote-only for commercial?
7. GTM container GTM-P3R6LNTK: who owns it, and is anything configured inside?
