# Website review: proferforge.ca (Pro Fer Forgé)

Reviewed October 1, 2026, in Chrome. Desktop viewport 1364 px, mobile viewport 394 px. Every page in the navigation was visited. The site has only 5 pages. There is no blog, no pricing page and no portfolio/gallery page (`/blog/` and `/en/` return 404).

---

## 1. BUSINESS OVERVIEW

- **What they do:** Painting, restoration and welding of wrought iron (fer forgé): exterior balconies, service stairs, spiral stairs, façade stairs, railings (garde-corps), handrails and fences.
- **Target customers:** Condo associations (copropriétés), housing co-ops and building owners. Medium and large maintenance projects. Quote from the homepage: *"La référence des copropriétés pour l'entretien des escaliers, balcons et garde-corps."* Homepage body: *"Nous offons un service clé en main pour les moyens et gros projets d'entretien de balcons, escaliers, rampes en métal."* (the typo "offons" is on the site). The Contact page states a minimum: *"Veuillez noter que nous avons présentement un montant minimal de 3000$ par projet."*
- **Location / service area:** Montréal "et aux environs". About page heading: *"Basés À Montréal, Nous Desservons Toute La Région"*. The embedded Google Map shows the business pin at **936 Avenue du Mont-Royal E, Montréal, QC H2J 1X2** with **5,0 ★ (55 Google reviews)**. That address is not written anywhere in the site text.
- **Languages:** The site is written in French only (`lang="fr-FR"`). The "EN | FR" switch in the header is the **GTranslate plugin** doing live Google machine translation on the same URL. There is no separate English URL and nothing indexable in English. The machine translation has errors, for example "ACCUEIL" becomes "WELCOME" (should be "Home") and the brand name "PRO FER FORGÉ" becomes "PRO WROUGHT IRON".

---

## 2. SITE STRUCTURE

**Pages (from the Yoast page sitemap and the menus):**

1. Accueil – `/`
2. Peinture de fer forgé – `/peinture-fer-forge-montreal/`
3. Restauration et soudure de fer forgé – `/restauration-soudure-fer-forge-montreal/`
4. À propos – `/a-propos/`
5. Contact / Devis – `/contact-devis/`

**Header navigation on desktop, left to right:**

- Logo (links to home)
- `ACCUEIL`
- `SERVICES ▾` (the parent link is `#` and does not go anywhere). Its dropdown contains:
  - `PEINTURE DE FER FORGÉ`
  - `RESTAURATION ET SOUDURE DE FER FORGÉ`
- `À PROPOS`
- Button `OBTENEZ UNE SOUMISSION` (goes to /contact-devis/)
- `EN | FR` language toggle (GTranslate)

The header is sticky (Elementor Pro sticky). The active page is underlined.

**Header on mobile:** Logo, hamburger button and `EN | FR`. The hamburger opens `ACCUEIL`, `SERVICES ▾`, `À PROPOS`. **On mobile the quote button is not in the header and there is no Contact item in the menu**, so a phone visitor cannot reach the quote page from the menu.

**Footer (identical on every page), dark navy background:**

- White logo on the left
- **LIENS UTILES:** ACCUEIL · PEINTURE DE FER FORGÉ · RESTAURATION ET SOUDURE DE FER FORGÉ · À PROPOS · CONTACT / DEVIS
- **NOUS JOINDRE:** envelope icon `INFO@PROFERFORGE.CA` · phone icon `(438) 815-7232`
- Thin divider line, then `© 2026 PRO Fer Forgé. All rights reserved.` (this line is in English on a French site)
- Not in the footer: address, opening hours, social links, privacy policy, RBQ licence number.

---

## 3. PAGE-BY-PAGE CONTENT

### 3.1 Accueil (Home) – `/`
Screenshots: `01-home-desktop.png`, `06-home-mobile.png`

1. **Hero.** Full-width background photo of Montréal brick buildings with black metal fire-escape stairs and balconies, under a dark overlay (`restauration-fer-forge-header.jpg`). Centred white text:
   - Small H2: **"PRO FER FORGÉ"**
   - H1: **"PEINTURE ET RESTAURATION DE FER FORGÉ À MONTRÉAL"**
   - Text: *"La référence des copropriétés pour l'entretien des escaliers, balcons et garde-corps. / Service complet de peinture et de soudure. / Travail propre et finition soignée."*
   - Navy pill button: **"OBTENEZ UNE SOUMISSION GRATUITE →"** (goes to /contact-devis/)
2. **Intro paragraph** (centred, white background): *"Pro Fer Forgé est spécialisé en peinture et restauration de fer forgé à Montréal et aux environs. Nous offons un service clé en main pour les moyens et gros projets d'entretien de balcons, escaliers, rampes en métal."*
3. **"NOS SERVICES"** (H2): two large image cards, each with a dark overlay, a round navy icon and a white title. Both cards are links.
   - **"Peinture De Fer Forgé"**: paint-brush icon over a photo of a spiral metal staircase. Image `Service-Peinture.png` (1024×1536). Links to the painting page.
   - **"Restauration Et Soudure De Fer Forgé"**: welding-mask icon over a photo of a welder in a navy "PRO FER FORGÉ" cap and t-shirt, welding a railing. Image `Service-Soudre.png`. Links to the restoration page.
4. **"POURQUOI NOUS CHOISIR :"** (H2) on a light grey band. Four white cards in a 2×2 grid. Each has a navy circle icon, a title, text, and a navy offset "hard shadow" on the bottom and right edges:
   - **Service Professionnel**: *"Nos systèmes sont conçus pour assurer une planification et une communication fluides."*
   - **Expertise Locale**: *"Nous utilisons des méthodes et des produits conçus pour résister au climat d'ici"*
   - **Travail Propre Et Durable**: *"Protection des lieux et finition soignée."* / *"Meilleures garanties du marché."*
   - **Solutions Clé En Main**: *"Prise en charge complète du projet, du début à la fin. Soudure au besoin, préparation et peinture."*
5. **"DES CENTAINES DE CLIENTS SATISFAITS À MONTRÉAL"** (H2): testimonial slider (Swiper). It shows 3 cards at a time on desktop and 1 on mobile, with navy circular prev/next arrows. There are 8 testimonials, each with first initial and last name only:
   - *"Communication rapide, travail bien fait et délais respectés. Rien à redire, tout s'est passé comme prévu. C'est rare de nos jours, donc ça mérite d'être mentionné."* – N. Langevin
   - *"Excellent service client et des résultats qui parlent par eux-mêmes. Je recommande!"* – L. Beaulieu
   - *"Très satisfait du service. Travail bien fait et professionnel. Bonne communication et résultat à la hauteur de mes attentes. Je recommande."* – M. Lacroix
   - *"Un travail impeccable et très professionnel. Je recommande fortement"* – A. Turcotte
   - *"J'ai fait affaire avec cette entreprise pour 2 projets dans les dernières années et je vais continuer de le faire. Service professionnel et résultat durable."* – M. Doucet
   - *"Excellent service et qualité A1 Sympathique et honnête! Je recommande à 100%!"* – V. Germain
   - *"La qualité de la finition est excellente et on voit tout de suite leur expertise dans le domaine du fer forgé. Je recommande sans hésiter à anyone qui cherche un service fiable à Montréal."* – Z. Pontbriand (the English word "anyone" is in the French text)
   - There are no stars, no dates, no source ("Google") and no link to the Google reviews.
6. **Closing CTA band** (light grey with a curved top edge): H2 **"UN RÉSULTAT PROPRE, ESTHÉTIQUE ET DURABLE."**, subline **"DEMANDEZ VOTRE SOUMISSION GRATUITE DÈS AUJOURD'HUI!"**, button **"OBTENEZ UNE SOUMISSION"** (goes to /contact-devis/).
7. Footer.

### 3.2 Peinture de fer forgé – `/peinture-fer-forge-montreal/`
Screenshot: `02-peinture-desktop.png`

1. **Hero** with the same Montréal fire-escape photo, shorter. H1 **"PEINTURE DE FER FORGÉ À MONTRÉAL"**. Button **"OBTENEZ UNE SOUMISSION →"**. ⚠ **This button's link is `#`, so it does nothing (broken CTA).**
2. **Intro** (large centred text): *"Nous assurons la peinture et la protection durable de vos structures en fer forgé à Montréal. Chaque projet débute par une préparation minutieuse : protection des surfaces, nettoyage, grattage, sablage et application d'une peinture industrielle résistante qui renforce et protège les surfaces."*
3. **"TYPES DE STRUCTURES EN FER FORGÉ"** on a grey band: 5 photo tiles with rounded corners and captions. The captions are not links.
   - Balcons En Fer Forgé (black balcony on a brick wall)
   - Escaliers De Service (red-painted exterior service stairs)
   - Escaliers En Colimaçon (black ornate spiral stair)
   - Escaliers De Façade (black façade stair and balcony)
   - Garde-Corps Et Clôtures (black ornamental fence)
   - Below the tiles: *"Un rendu durable, esthétique et protégé contre la corrosion."* and the button **"OBTENEZ UNE ESTIMATION GRATUITE →"** (goes to /contact-devis/)
4. **Navy band with a 2×2 grid:**
   - White card **"NOTRE PROCESSUS"** with bullets: *Protection des surfaces avoisinantes · Grattage et brossage de l'écaillement · Meulage de la rouille et nettoyage · Application de primer antirouille · Application de peinture à métal industrielle*
   - Photo: close-up of an angle grinder on an ornamental scroll railing, with sparks (`meulage-fer-forge-1.jpeg`)
   - Photo: cans labelled "2K POLYURETHANE BLACK PAINT" and "2K POLYURETHANE ACTIVATOR HARDENER" (`polyurethane-2-composants-fer-forge.png`). It looks like a generic or AI-generated product image.
   - White card **"PEINTURE DURABLE ET RÉSISTANTE"**: *"Nous utilisons des produits spécialisés pour les structures en acier et en fer forgé, conçus pour résister aux intempéries et assurer une protection durable. Selon l'état des surfaces et le budget, différentes options sont proposées."*
   - Line in white text: *"Si votre structure est endommagée, nous offrons aussi la restauration et soudure de fer forgé à Montréal"*. The last part is an internal link to the restoration page, but it is styled the same as the plain text, so it does not look clickable.
5. **CTA band:** H2 **"UN RÉSULTAT PROPRE, ESTHÉTIQUE ET DURABLE, PROTÉGÉ CONTRE LA CORROSION."** and button **"OBTENEZ UNE SOUMISSION GRATUITE"** (goes to /contact-devis/).
6. Footer.

### 3.3 Restauration et soudure de fer forgé – `/restauration-soudure-fer-forge-montreal/`
Screenshot: `03-restauration-desktop.png`

1. **Hero** with the same photo. H1 **"RESTAURATION ET SOUDURE DE FER FORGÉ À MONTRÉAL"**. Button **"OBTENEZ UNE SOUMISSION RAPIDE →"** (goes to /contact-devis/).
2. H2 **"UN SERVICE COMPLET POUR VOS STRUCTURES EN FER FORGÉ, DE LA RÉPARATION À LA FINITION"** followed by: *"Les conditions climatiques du Québec exposent vos structures en fer forgé à des intempéries importantes qui accélèrent leur détérioration. Notre service de soudure intervient pour remplacer les sections trop dégradées ou renforcer les surfaces fragilisées."*
3. **Two cards that overlap a navy band:**
   - **SOUDURE DE RESTAURATION** (wrench and screwdriver icon): Remplacement de sections dégradées · Redressement de structures
   - **SOUDURE PRÉVENTIVE** (shield icon): Consolidation de sections affaiblies · Renforcement de zones amincies
4. **4 photo tiles with captions:** Consolidation De Main Courante · Renforcement De Limons · Remplacement De Triangles · Renforcement De Base De Garde-Corps. These photos look AI-generated (smooth "rendered" surfaces, generic scenes). Three of the four are PNGs. No real before/after photos are shown.
5. Line: *"Après réparation, nous offrons également la peinture de fer forgé à Montréal pour protéger et uniformiser les surfaces."* The phrase in it is an internal link to the painting page.
6. **CTA band:** H2 **"Une Structure Solide, Sécuritaire Et Durable."** (Title Case here, while the other pages use ALL CAPS), subline *"Obtenez Votre Soumission Gratuite Dès Aujourd'hui"*, button **"OBTENEZ UNE SOUMISSION"** (goes to /contact-devis/).
7. Footer.

### 3.4 À propos – `/a-propos/`
Screenshot: `04-a-propos-desktop.png`

1. **Hero** with a darker variant of the fire-escape photo. H1 **"À PROPOS DE PRO FER FORGÉ"**. No button.
2. **Two columns.** Left: H2 **"VOTRE SPÉCIALISTE DU FER FORGÉ À MONTRÉAL"** and the text:
   - *"Pro Fer Forgé est spécialisé en peinture, restauration et soudure de fer forgé à Montréal et aux environs. Depuis plusieurs années, nous accompagnons copropriétés, coopératives et propriétaires d'immeubles dans l'entretien et la remise en état de leurs structures, en assurant sécurité, conformité et durabilité."*
   - *"Nous intervenons sur les balcons, escaliers, rampes et autres structures métalliques grâce à un service complet de peinture de fer forgé à Montréal et de restauration et soudure de fer forgé"* (no final period). Both service names are internal links.
   - *"Travail propre, méthodes professionnelles et résultats durables."*
   - Right: photo of a white cargo van wrapped with the Pro Fer Forgé logo, "ENTRETIEN DU FER FORGÉ • GARDE-CORPS • ESCALIERS • BALCONS" and "PROFERFORGE.CA", with ladders on the roof, parked on a Montréal street (`Camion-pro-fer-forge.png`; the alt text has the typo "équippement"). It may be a mock-up or render.
3. H2 **"Basés À Montréal, Nous Desservons Toute La Région"**, then a full-width Google Maps embed (Elementor Google Maps widget, iframe title "Pro fer forge") showing the Greater Montréal / South Shore area. The place card reads: Pro Fer Forgé, 936 Avenue du Mont-Royal E, Montréal, QC H2J 1X2, 5,0 ★ (55).
4. **CTA band:** H2 **"UN SERVICE FIABLE POUR VOS STRUCTURES EN FER FORGÉ"**, subline *"OBTENEZ VOTRE SOUMISSION GRATUITE DÈS AUJOURD'HUI"*, button **"OBTENEZ UNE SOUMISSION"** (goes to /contact-devis/).
5. **Hidden content:** a section with the headings **"Notre méthode :"** (Inspection et diagnostic de vos installations · Préparation adaptée à chaque structure · Réalisation de travaux soignés, soudure et peinture incluses · Protection durable contre la corrosion) and **"Nos engagements :"** (Travail soigné et durable · Respect des délais · Satisfaction client garantie) is in the HTML but is set to hidden on desktop, tablet **and** mobile. No visitor ever sees it.
6. Footer.
7. Missing: team, owner name, founding year ("Depuis plusieurs années" is vague), RBQ licence, insurance, and real project photos.

### 3.5 Contact / Devis – `/contact-devis/`
Screenshots: `05-contact-desktop.png`, `07-contact-mobile.png`, `12-closeup-contact-form-desktop.png`

1. H1 **"OBTENEZ UNE SOUMISSION GRATUITE"** on a plain white page (no hero image). Text:
   - *"Obtenez une soumission pour vos travaux de peinture, restauration et soudure de fer forgé à Montréal."*
   - *"Veuillez noter que nous avons présentement un montant minimal de 3000$ par projet."*
   - *"Au plaisir de travailler avec vous!"*
   - 📞 **(438) 815-7232**
2. **Form** (Elementor Pro form named "New Form"), in a white card with a navy hard shadow:
   - NOM COMPLET (text, optional)
   - TÉLÉPHONE * (plain text field, not a `tel` input)
   - EMAIL * (email)
   - CODE POSTAL * (text)
   - ADRESSE (text, optional)
   - MESSAGE / DESCRIPTION DU PROJET (textarea, optional)
   - One hidden field
   - Full-width button **ENVOYER**
   - Missing: photo upload, project type selector (painting / welding / both), property type (condo/co-op), timeline, consent checkbox, and any visible reCAPTCHA or anti-spam. I did not submit the form, so the success message and email delivery were not tested.
3. **"Contactez nous dès maintenant !"** followed by an ✉️ emoji with **info@proferforge.ca** and 📞 **(438) 815-7232**.
4. Footer.

---

## 4. DESIGN & BRAND

- **Colours** (measured from computed styles):
  - Primary navy **#333657** (rgb 51,54,87): buttons, headings, footer background, icon circles, card shadows
  - Body text near-black **#141414**
  - White **#FFFFFF** and off-white **#FCFEFF** for cards and text on navy
  - Light grey band background **#F8F8F8**
  - Red asterisks on required form fields
  - Overall the site is effectively single-colour navy plus neutrals, with no accent colour.
- **Fonts:** **Montserrat** throughout (weights 400, 500, 600, 700). Headings are mostly ALL CAPS in weight 600/700. Card titles use Title Case ("Peinture De Fer Forgé"), which is an English capitalisation style and is not correct in French.
- **Logo:** On the left is a stylised spiral staircase with a vertical newel post topped by a spear/finial point and a decorative scroll at the bottom. On the right is a stacked wordmark: "PRO" (with a line under it), "FER FORGÉ" in a condensed bold sans-serif, and the small tagline "PEINTURE ET RESTAURATION". There are two versions: dark navy for the header and white for the footer. The logo `<img>` tags have **empty alt text**.
  - Dark: `https://proferforge.ca/wp-content/uploads/2026/02/LOGO-Pro-Fer-Forge_ICON-AND-WORD-MARK_Dark-Blue-e1772743373493.png`
  - White: `https://proferforge.ca/wp-content/uploads/2026/02/LOGO-Pro-Fer-Forge_ICON-AND-WORD-MARK_White-e1772743508662-768x327.png`
- **Style and feel:** Clean, modern, slightly corporate trades site. It is calm and readable with a lot of white space. It is built on an Elementor template, so it looks fairly generic. Recurring signature elements:
  - Pill-shaped navy buttons with a → arrow
  - White cards with a 2px navy border and a navy offset "hard shadow" (neo-brutalist touch)
  - Curved / arched section dividers above the CTA bands
- **Layout patterns:**
  - Full-bleed photo hero with a dark overlay and centred text
  - Image cards with an overlay
  - 2×2 icon feature cards
  - Testimonial carousel
  - 5-up and 4-up photo tile rows
  - Repeating closing CTA band on every page
  - There is no gallery, no portfolio and no before/after slider.
- **Key image URLs** (all under `https://proferforge.ca/wp-content/uploads/`):
  - Hero: `2026/02/restauration-fer-forge-header.jpg`
  - Home service cards: `2026/03/Service-Peinture.png`, `2026/03/Service-Soudre.png`
  - About page van: `2026/03/Camion-pro-fer-forge.png`

---

## 5. FEATURES & FUNCTIONALITY

| Feature | Status |
|---|---|
| Contact / quote form | Yes. One form, on /contact-devis/ only (fields listed in 3.5) |
| Booking / scheduling | Not found |
| Live chat / AI assistant | Not found |
| Map | Yes. Google Maps embed on À propos |
| Social links (Facebook, Instagram, etc.) | Not found anywhere |
| Newsletter | Not found |
| E-commerce / pricing | Not found. Only the "minimum 3000$ par projet" note |
| Language switch | GTranslate (client-side machine translation, no English URLs) |
| Click-to-call / mailto | **Not found.** The phone and email are shown as plain text, with no `tel:` or `mailto:` link anywhere on the site |
| Sticky mobile call/quote bar | Not found |
| Analytics | Google tag (gtag.js) present. GoDaddy "wsimg" tracking scripts present |
| Cookie consent banner | Not found |
| Privacy policy page | Not found (`/politique-de-confidentialite/` returns 404) |

**Contact info shown on the site:**

- Email: info@proferforge.ca
- Phone: (438) 815-7232
- Street address: only inside the Google Maps card (936 Avenue du Mont-Royal E, Montréal, QC H2J 1X2), not in the site text
- Opening hours: not found
- RBQ licence number: not found

---

## 6. TECHNICAL & SEO OBSERVATIONS

**Platform:**

- WordPress (generator meta tag: "WordPress 7.1.2")
- Elementor 3.35.6 and Elementor Pro 3.35.1 (page builder, header/footer, sticky header, forms, Swiper slider)
- Yoast SEO (schema graph, sitemaps, robots.txt block)
- GTranslate
- jQuery 3.7.1
- Hosting is very likely **GoDaddy Managed WordPress** (scripts load from `img1.wsimg.com`)
- The theme name was not identifiable from the front end

**Titles and meta descriptions:**

| Page | `<title>` | Meta description |
|---|---|---|
| Accueil | Peinture et restauration de fer forgé à Montréal \| Pro Fer Forgé | Pro Fer Forgé offre des services de peinture et restauration de fer forgé à Montréal. Escaliers, balcons et rampes. Travail durable et soumission rapide. |
| Peinture | Peinture de fer forgé à Montréal \| Pro Fer Forgé | Peinture de fer forgé à Montréal. Escaliers, balcons et rampes. Finition durable et protection contre la rouille. Soumission rapide. |
| Restauration | Restauration et soudure de fer forgé à Montréal \| Pro Fer Forgé | Restauration et soudure de fer forgé à Montréal. Réparation d'escaliers, balcons et rampes. Service durable et soumission rapide. |
| À propos | À propos de Pro Fer Forgé \| Fer forgé à Montréal | Pro Fer Forgé est spécialisé en peinture, restauration et soudure de fer forgé à Montréal. Service professionnel et durable. |
| Contact | Soumission fer forgé Montréal \| Pro Fer Forgé | Obtenez une soumission gratuite pour vos travaux de fer forgé à Montréal. Réponse rapide, service professionnel et durable. |

**Other SEO observations:**

- **What is in place:** Titles and descriptions are unique and keyword-targeted. There is one H1 per page. Canonical tags are set. `robots: index, follow`. Yoast sitemap at `/sitemap_index.xml` (pages only; the post sitemap is empty). Open Graph tags are present. Service-page images have descriptive, local alt text.
- **Problems:**
  - The homepage puts an H2 ("PRO FER FORGÉ") before the H1.
  - The service pages jump from H1 to H3/H6 for the structure-type captions.
  - Footer column titles are H6.
  - The schema is only the generic Yoast WebPage/Organization. There is **no LocalBusiness / HomeAndConstructionBusiness schema** (address, phone, geo, hours, aggregateRating).
  - There are no hreflang tags and no English URLs.
  - The og:image is the 1024×1536 portrait PNG. Social platforms prefer a 1200×630 landscape image.
  - `og:site_name` is "PRO Fer Forgé" while the titles use "Pro Fer Forgé" (inconsistent capitalisation).

**Speed** (homepage, as measured in my browser session):

- TTFB about 0.9 s, DOMContentLoaded about 2.5 s, load about 3.2 s
- 64 requests, about 2.0 MB transferred
- Heaviest files are unoptimised PNG/JPG images:
  - `Service-Peinture.png` 725 KB
  - `Service-Soudre.png` 609 KB
  - Hero `restauration-fer-forge-header.jpg` 377 KB
- No WebP/AVIF is used. jQuery and jQuery Migrate are loaded. The service-card images are CSS backgrounds, so they cannot lazy-load as `<img>` elements.
- These are single-session measurements, not a Lighthouse audit.

**Mobile responsiveness:**

- The layout does stack correctly.
- **The mobile menu has no Contact/Soumission item and the header quote button is hidden on mobile.** On a phone, the only routes to the form are the in-page CTAs and the footer links.
- **The contact page is badly squeezed on mobile.** The intro text and the form card take only about half the screen width, with very narrow inputs and large empty side margins (see `07-contact-mobile.png`).
- The home service cards run edge to edge on mobile, while the other cards have side margins (inconsistent).
- In the testimonial slider, the neighbouring cards are cut off at the edges and the arrows sit over the card edges.
- At a very narrow width (about 280 px) the hero H1 overflows ("RESTAURATIO" gets clipped). It was fine at 394 px.
- The phone number is not tap-to-call.

**Broken links / images:**

- Painting page hero button "OBTENEZ UNE SOUMISSION" → `#` (dead).
- The "SERVICES" parent menu item → `#`. This is normal for a dropdown, but on mobile it has to be tapped open.
- No broken images were seen.
- `/blog/`, `/en/` and `/politique-de-confidentialite/` return 404 (expected, since those pages don't exist).

**Accessibility:**

- Logo images have empty alt text.
- Phone and email are not links.
- Lots of ALL-CAPS text, which is harder to read and can be read letter by letter by some screen readers.
- Heading levels are skipped.
- Body text on the service cards sits over busy photos with a semi-transparent overlay. Contrast is borderline in places.
- A "Aller au contenu" skip link is present (good).
- Form labels are properly associated (good).

**Trust signals:**

- Present:
  - 8 short testimonials (initials only, no source)
  - The claim "Des centaines de clients satisfaits"
  - "Meilleures garanties du marché" (the warranty is not explained)
  - Branded van and uniform photos
- Not found:
  - The Google 5,0 ★ rating with 55 reviews (it is only visible inside the map widget)
  - Project portfolio or before/after photos
  - RBQ licence number
  - Insurance, certifications or associations (APCHQ, etc.)
  - Years in business
  - Team photos
  - Names of condo clients

**Legal / compliance (Québec):**

- No privacy policy and no cookie consent, even though the form collects personal information and Google analytics tags run. Québec's Law 25 requires a published privacy policy and consent for tracking.
- The footer copyright line is in English.

---

## 7. STRENGTHS AND WEAKNESSES

**What works well:**

- Clear, focused positioning: wrought-iron painting and welding for condos, co-ops and building owners in Montréal.
- Strong, consistent CTA: every page ends with a free-quote band, and the header has a quote button on desktop.
- Clean, modern visual identity: a good logo, a consistent navy palette, Montserrat, and distinctive hard-shadow cards. The brand also shows up on the van and uniforms.
- Good on-page local SEO foundations: keyword-rich URLs, titles, metas, H1s and alt text, with internal links between the two service pages.
- The 3000$ minimum on the contact page pre-qualifies leads.

**What is outdated, confusing or missing:**

- Broken hero CTA on the painting page.
- On mobile, there is no path to the quote form from the menu or header, and the phone is not tap-to-call. For a local trades business, mobile calls are the main conversion.
- Machine-translated "English" with errors and no SEO value.
- No real project photos or portfolio. Several images look AI-generated or stock, which weakens credibility for a hands-on trade.
- The 55 five-star Google reviews are not used. The on-site testimonials have no source and can't be verified.
- Missing business info: address in text, hours, RBQ licence, insurance, warranty details, years in business, social links.
- No privacy policy or cookie consent (Law 25).
- Copy and polish issues: "offons", "anyone" in a French testimonial, "équippement", Title Case in French, English copyright line, a missing period on À propos, and the ✉️ emoji used as an icon.
- A hidden "Notre méthode / Nos engagements" section that never displays.
- Heavy unoptimised images (about 1.7 MB in three files on the homepage).
- The quote form has no photo upload, project-type selector or property-type field, which would help qualify leads.

**Top 10 prioritised improvements:**

1. **Fix conversion paths on mobile:** add "Soumission" to the mobile menu, show a compact quote button in the mobile header, and add a sticky bottom bar on mobile with "Appeler" and "Soumission".
2. **Make the phone and email clickable** site-wide (`tel:+14388157232`, `mailto:info@proferforge.ca`).
3. **Fix the broken CTA** on the painting page hero (`#` → `/contact-devis/`).
4. **Add a privacy policy and a cookie-consent banner** (Law 25), link both in the footer, and add a consent line on the form.
5. **Show real social proof:** embed the Google rating (5,0 ★, 55 reviews) with a link to the Google profile, label testimonials as Google reviews, and add the RBQ licence, insurance and warranty details.
6. **Add a "Réalisations" portfolio page** with real before/after photos of condo, balcony and stair projects, and replace the AI-looking images on the service pages with real job photos.
7. **Fix the contact page mobile layout** (full-width form). Improve the form with a project type, property type (copropriété / coop / propriétaire), photo upload and preferred timeline. Change Téléphone to a `tel` input. Add spam protection.
8. **Proper bilingual site:** replace GTranslate with WPML or Polylang and real `/en/` pages with hreflang tags, or remove the EN toggle until real translations exist.
9. **Technical SEO and performance:**
   - Add LocalBusiness schema (address, phone, geo, hours, aggregateRating) and show the address and hours in the footer.
   - Fix the heading hierarchy (no H2 before the H1, no skipped levels).
   - Convert images to WebP and compress them (target under 200 KB each).
   - Supply a 1200×630 og:image.
   - Add alt text to the logo.
10. **Copy cleanup and content:**
    - Fix the typos and Title Case, and translate the copyright line.
    - Either publish or delete the hidden "Notre méthode / Nos engagements" section (publishing is better, since it's good content).
    - Expand À propos with the founder or team, the year founded, and service area cities (Plateau, Rosemont, Laval, Longueuil, etc.).
    - Consider an FAQ (seasonality, product types, warranty, condo process) and a few blog or guide articles for local SEO.

---

## 8. SCREENSHOTS

All files are in the `proferforge-screenshots` folder. The full-page images were stitched from scrolled viewport captures, with the sticky header shown only once at the top. Desktop width is 1364 CSS px (rendered at 1316 px); mobile width is 394 CSS px.

| # | File | Page / device |
|---|---|---|
| 1 | `01-home-desktop.png` | Home, desktop, full page |
| 2 | `02-peinture-desktop.png` | Peinture de fer forgé, desktop, full page |
| 3 | `03-restauration-desktop.png` | Restauration et soudure, desktop, full page |
| 4 | `04-a-propos-desktop.png` | À propos, desktop, full page |
| 5 | `05-contact-desktop.png` | Contact / Devis, desktop, full page |
| 6 | `06-home-mobile.png` | Home, mobile (394 px), full page |
| 7 | `07-contact-mobile.png` | Contact / Devis, mobile, full page (inner page on mobile) |
| 8 | `08-menu-open-mobile.png` | Mobile header with hamburger menu open |
| 9 | `09-closeup-header-nav-dropdown-desktop.png` | Header / navigation close-up with Services dropdown open |
| 10 | `10-closeup-hero-home-desktop.png` | Home hero close-up, desktop |
| 11 | `11-closeup-footer-desktop.png` | Footer close-up, desktop |
| 12 | `12-closeup-contact-form-desktop.png` | Quote form close-up, desktop |
| 13 | `13-closeup-google-map-card-a-propos.png` | Google Map place card (address + 5,0 ★ / 55 reviews) |
| 14 | `14-home-desktop-EN-gtranslate.png` | Home hero after clicking "EN" (machine translation) |
| 15 | `15-logo-dark-blue-crop.png` | Logo, navy version (cropped from screenshot) |
| 16 | `16-logo-white-footer-crop.png` | Logo, white version (cropped from footer) |

The logos and photos are crops from screenshots, so they are low resolution. For original files, use the URLs in section 4.
