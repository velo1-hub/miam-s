# Prompt: build the new Pro Fer Forgé website

Copy everything below the line into a new Claude Code session in this repo.
Before sending, fill in every `[FILL IN]` and attach the files listed in section 12.

---

## 1. Role and goal

You are a senior web designer, front-end engineer and local-SEO specialist. Build a new, super-professional, bilingual (FR default, EN) marketing website for **Pro Fer Forgé**, a wrought-iron painting, restoration and welding company in Montréal. The site replaces proferforge.ca (WordPress/Elementor). Its job is to rank on Google for local searches and turn visitors into quote requests and phone calls, mostly from phones.

Work in a new folder `proferforge/` at the repo root. Do not touch the Miam's files. Follow the structure and tooling style of `site/` where it helps (static output, a build script in `tools/`), but this is a separate project.

## 2. The business (facts, do not invent others)

- **Name:** Pro Fer Forgé. Tagline on logo: "Peinture et restauration".
- **Services:** (1) Peinture de fer forgé, (2) Restauration et soudure de fer forgé. Structures: balcons, escaliers de service, escaliers en colimaçon, escaliers de façade, garde-corps, clôtures, mains courantes.
- **Customers:** copropriétés (condo associations), coopératives d'habitation, propriétaires d'immeubles. Medium and large maintenance projects.
- **Area:** Montréal and surroundings. Address on Google: 936 Avenue du Mont-Royal E, Montréal, QC H2J 1X2. [FILL IN: confirm the address may be shown publicly, and list the cities and boroughs served.]
- **Contact:** (438) 815-7232, info@proferforge.ca. [FILL IN: opening hours.]
- **Rules:** minimum project amount 3000 $. Free quotes. Warranty is advertised as "Meilleures garanties du marché". [FILL IN: real warranty terms.]
- **Process (painting):** protect surroundings, scrape and brush flaking paint, grind rust and clean, rust-inhibiting primer, industrial metal paint (2K polyurethane).
- **Welding:** replace degraded sections, straighten structures, reinforce weakened or thinned areas, consolidate handrails, stringers, base of railings.
- **Trust:** Google rating 5,0 ★ from 55 reviews. [FILL IN: RBQ licence number, insurance, years in business, owner name, associations.]
- **Existing testimonials (real, from the old site; use these only):** N. Langevin, L. Beaulieu, M. Lacroix, A. Turcotte, M. Doucet, V. Germain, Z. Pontbriand. Texts are in section 3.1 of `docs/proferforge-site-review.md`. Fix typos only.

Never invent reviews, certifications, years, project counts, client names or photos. Where a fact is missing, leave a clearly marked `TODO` in a single `proferforge/TODO.md` list and use neutral wording meanwhile. Do not claim "des centaines de clients" unless I confirm it.

## 3. Brand and design

- **Logo:** navy spiral-staircase icon plus stacked wordmark "PRO / FER FORGÉ / PEINTURE ET RESTAURATION". Use the original files I attach. If only low-resolution crops exist, rebuild the logo as clean SVG and tell me.
- **Colours:** primary navy `#333657` (confirm against the original logo), white, off-white `#F8F8F8`, near-black `#141414`. The old site has no accent colour. Propose one restrained accent that suits wrought iron (for example a warm copper or forge-orange used sparingly for CTAs and highlights) and justify it in one line. Check WCAG AA contrast on every pair.
- **Type:** a strong, premium pairing. Montserrat is the current font; you may keep it for continuity or propose a better heading font with Montserrat or Inter for body. Self-host fonts, `font-display: swap`.
- **Feel:** premium, solid, trustworthy trades brand. Dark, cinematic hero; generous white space; sharp details that echo ironwork (thin scroll ornaments, fine rules). Not a generic template look. Keep the "offset hard-shadow card" idea only if it fits the new design.
- **Responsive:** mobile-first. Test at 320, 390, 768, 1024, 1440 px. No horizontal scroll. 16px side gutters.

## 4. Home page: video hero and scroll effects

- **Hero:** full-viewport background video, autoplay, muted, loop, `playsinline`, with a dark gradient overlay so the H1 stays readable. Provide a poster image (LCP element), an `.mp4` (H.264) and `.webm` source, 1080p max, under about 4 MB, 8 to 15 seconds seamless loop. On mobile data-saver, `prefers-reduced-motion`, or slow connections: show the poster only and do not load the video.
- **Video content:** real footage of the team grinding, welding and painting is strongly preferred. [FILL IN: do I have footage? yes/no.] If not, build the hero with a placeholder poster and tell me exactly which shots to film (list 6 shots, vertical and horizontal). Do not pass AI-generated video off as real job footage; if you generate any, label it internally as a placeholder to replace.
- **H1 (FR):** "Peinture et restauration de fer forgé à Montréal". Subline for copropriétés. Two CTAs: "Obtenir une soumission gratuite" and "Appeler le (438) 815-7232".
- **Scroll effects** (vanilla JS with IntersectionObserver, or GSAP ScrollTrigger if you justify the weight; no jQuery):
  - Fade and rise reveals on sections, with small staggers on card groups
  - Subtle hero parallax and a scroll cue
  - Sticky header that shrinks and gains a background after scroll
  - Count-up numbers for the real stats only (rating, reviews)
  - A horizontal-scroll or pinned "Notre processus" sequence showing the painting steps in order
  - Before/after drag slider in the portfolio
  - Smooth anchor scrolling
  - All motion disabled or reduced under `prefers-reduced-motion`. No scroll-jacking. No layout shift.
- **Home sections, in order:** hero · short intro and trust strip (Google 5,0 ★ · 55 avis, RBQ, assurance, garantie) · two services · structure types · process · why us · réalisations (before/after) · Google reviews · service area with map · FAQ preview · final quote CTA.

## 5. Pages and URLs

French at the root, English under `/en/`, one real translation per page (no machine-translation widget), with `hreflang` pairs and `x-default`.

- `/` Accueil · `/peinture-fer-forge-montreal/` · `/restauration-soudure-fer-forge-montreal/` · `/realisations/` · `/a-propos/` · `/faq/` · `/contact-devis/` · `/zones-desservies/` · `/politique-de-confidentialite/` · 404 page
- Keep the existing URL slugs so current rankings are preserved. Provide a `_redirects` or `.htaccess`-style redirect map for anything that changes.
- **Area pages:** short, genuinely useful pages for the main boroughs and nearby cities [FILL IN: list], each with unique content, not copy-paste. Only create as many as you can make non-duplicate.
- **Blog or guides:** two or three starter articles for condo boards, for example "Quand repeindre ou restaurer les escaliers de votre copropriété" and "Combien coûte la peinture de fer forgé à Montréal". Only publish pricing statements I approve.
- Each page: unique title (under 60 characters), meta description (under 155), one H1, logical H2/H3, internal links, descriptive alt text.

## 6. SEO (Google) requirements

- Technical: semantic HTML, canonical tags, `sitemap.xml` (with hreflang), `robots.txt`, clean URLs, 404 page, correct `lang`, Open Graph and Twitter cards with a 1200×630 image.
- **Schema.org JSON-LD:** `HomeAndConstructionBusiness` (or `GeneralContractor`) with name, logo, address, geo, phone, email, opening hours, areaServed, sameAs, `aggregateRating` (5,0 and 55 only if still true), `hasOfferCatalog` for the two services; `Service` on each service page; `FAQPage` on the FAQ; `BreadcrumbList`; `WebSite`. Validate all JSON-LD with a script.
- Core Web Vitals targets on mobile: LCP under 2.5 s, CLS under 0.1, INP under 200 ms; Lighthouse 95+ for Performance, Accessibility, Best Practices and SEO. Run Lighthouse and report real numbers. Do not claim a score you did not measure.
- Images: WebP/AVIF with JPG fallback, `srcset`/`sizes`, explicit width and height, lazy-load below the fold, hero preloaded. Compress to roughly 200 KB or less each.
- Local SEO helpers (as docs, not code): a Google Business Profile checklist, NAP consistency rules, a review-request message template for Google, and a short citations list for Québec.
- Provide a keyword map (page → primary and secondary keywords in French, plus English) before writing copy.

## 7. Conversion

- Click-to-call (`tel:+14388157232`) and `mailto:` everywhere the phone or email appears.
- **Mobile sticky bar:** "Appeler" and "Soumission" always visible.
- Quote form on `/contact-devis/` and a short version on the home page. Fields: nom, téléphone (tel input), courriel, code postal, adresse, type de client (copropriété / coopérative / propriétaire), type de travaux (peinture / soudure / les deux / je ne sais pas), type de structure, échéancier, description, **photo upload (up to 5 images)**, and a consent checkbox linked to the privacy policy. Show the 3000 $ minimum politely before submit.
- Spam protection (honeypot plus a privacy-friendly CAPTCHA such as Cloudflare Turnstile). Inline validation, clear success message, accessible errors.
- **Form backend:** [FILL IN: choose one: Supabase (we already use it for MIAM OS), Formspree, Netlify Forms, or a small serverless function sending email]. Do not put secrets in the repo; read them from environment variables and document them in `docs/owner-actions.md` style.
- Analytics: GA4 and Google Tag Manager only after consent. Track form submits, phone taps and quote-button clicks as events.

## 8. Compliance (Québec, Law 25) and accessibility

- Privacy policy in FR and EN, naming a privacy officer [FILL IN: name and contact], listing what the form collects, purposes, retention, third parties and how to withdraw consent.
- Cookie banner with accept/refuse that actually blocks analytics until accepted.
- French is the primary legal language. Use correct French typography (non-breaking spaces before `:`, `;`, `?`, `!` and in "3 000 $"). Sentence case in French, not English-style Title Case.
- WCAG 2.2 AA: keyboard navigation, visible focus, skip link, alt text, form labels, sufficient contrast, video has no essential audio.

## 9. Content rules

- Write the French copy first, in a professional, direct tone aimed at condo boards (clarity, safety, durability, clean work, deadlines). Then the English.
- No filler and no unverifiable superlatives. Replace the old "Meilleures garanties du marché" with real warranty terms once I provide them.
- Fix the old-site errors: "offons", "anyone" in a French testimonial, "équippement", English copyright line.
- Publish the hidden "Notre méthode" and "Nos engagements" content from the old site.
- Real project photos only. Until I supply them, use clearly marked placeholders and list the exact shots needed in `TODO.md`. Do not use AI-generated images as proof of work.

## 10. Tech and delivery

- Static site, no framework required unless you justify one. Plain HTML, CSS (custom properties for tokens, light on dependencies) and small JS modules. A Node build script in `tools/` for templating FR/EN pages, sitemap and schema. No build step needed to deploy the output.
- Output folder `proferforge/dist/`. Deployable to Cloudflare Pages, Netlify or Vercel. Include deploy notes and the DNS/redirect plan for moving from WordPress to avoid losing rankings.
- Tests/checks as scripts: HTML validation, broken-link check, JSON-LD validation, hreflang pair check, image-size budget, Lighthouse run, and screenshots at the five widths (follow the `tools/` screenshot approach already in the repo).
- Use git on the current branch with small, clear commits. Do not open a pull request unless I ask.

## 11. How to work

1. Read `docs/proferforge-site-review.md` (the audit of the old site), look at the attached screenshots, and read the existing `site/` and `tools/` for conventions.
2. Before writing code, reply with: the keyword map, the sitemap, the colour/type proposal, the video plan, and the list of every `[FILL IN]` still open. Wait for my answers.
3. Build in this order: design system and layout → home (hero video, scroll effects) → service pages → forms and conversion → portfolio, FAQ, area pages → SEO, schema, compliance → performance and QA.
4. After each stage, run the checks, show screenshots, and report honestly what passed, what failed and what is still a placeholder.
5. At the end give me a final checklist of everything only the owner can do (domain, DNS, Google Business Profile, Search Console, Tag Manager, photos, video, RBQ number).

## 12. Files I will attach

- Original logo files (SVG or PNG, navy and white versions)
- The audit `docs/proferforge-site-review.md` and the 16 screenshots
- Any real photos and video of finished projects, team and van
- RBQ licence, insurance, warranty text, owner name, opening hours
- Google Business Profile link and Search Console access (if available)
