# What proferforge.ca is missing

Gap report on the current site, built from the audit in [`proferforge-site-review.md`](proferforge-site-review.md). Each gap is tagged with where the new site fixes it.

Legend: **Built** = fixed in the new site · **Owner** = needs something only the client can supply or do · **Both** = structure built, real content needed.

## 1. Conversion (most revenue lost here)

| Gap on the current site | Impact | New site |
|---|---|---|
| No quote button or Contact link in the mobile menu | Most visitors are on phones and cannot reach the form | **Built**: sticky mobile bar (Call / Quote) plus menu CTA |
| Phone and email are plain text, no `tel:` or `mailto:` | No tap-to-call, the main trades conversion | **Built**: every number and email is a link, with click tracking |
| Painting-page hero button links to `#` | Dead CTA on a money page | **Built** |
| Contact form is squeezed to half the screen on mobile | Abandoned forms | **Built**: full-width, mobile-first |
| Form has no project type, client type, timeline, photo upload | Slow, unqualified leads | **Built**: guided form, up to 5 photos, 3 000 $ minimum shown politely |
| No spam protection, no consent checkbox | Junk leads, Law 25 risk | **Built**: honeypot, Turnstile hook, consent checkbox |
| Form was never confirmed to deliver email | Possible silent lead loss | **Owner**: choose and connect the form backend |

## 2. Trust and proof

| Gap | New site |
|---|---|
| The 5,0 ★ / 55 Google reviews are invisible, only inside a map widget | **Built**: rating strip, review section, link to the Google profile |
| Testimonials have initials only, no source, no date | **Built**: labelled as Google reviews, **Owner** to confirm and add dates |
| No RBQ licence, insurance, years in business, owner name, team | **Both**: slots built, **Owner** supplies the facts |
| "Meilleures garanties du marché" is an unproven claim | **Both**: replaced by a warranty block, **Owner** supplies real terms |
| "Des centaines de clients" unverifiable | Removed until confirmed |
| No portfolio or before/after photos; several images look AI-generated | **Both**: portfolio and before/after slider built, **Owner** supplies real photos. Slider shows labelled illustrations until then |
| No named condo or co-op references | **Owner** (optional, with permission) |

## 3. Google and local SEO

| Gap | New site |
|---|---|
| Only generic Yoast Organization schema, no LocalBusiness | **Built**: LocalBusiness, Service, FAQPage, BreadcrumbList, WebSite, AggregateRating |
| "English" is GTranslate machine translation on the same URL, no hreflang | **Built**: real EN pages under `/en/` with hreflang and x-default |
| Heading order wrong (H2 before H1, skipped levels) | **Built** |
| Street address and hours not in the page text | **Built**: footer, contact page, schema (**Owner** confirms hours) |
| One page for the whole service area | **Built**: service-area page with borough sections and a map link |
| No FAQ, no guides, no long-tail content for condo boards | **Built**: FAQ page, two guides |
| og:image is a portrait PNG | **Built**: 1200×630 social image |
| Sitemap lacks hreflang | **Built** |
| Google Business Profile, citations and review requests not documented | **Built** as a playbook, **Owner** executes |

## 4. Performance and technical

| Gap | New site |
|---|---|
| About 2 MB per page, three unoptimised images over 1.7 MB, no WebP/AVIF | **Built**: no heavy raster assets, SVG and CSS art, size budget check |
| jQuery, jQuery Migrate, Elementor, plugin scripts | **Built**: dependency-free vanilla JS, under 25 KB |
| Service cards are CSS backgrounds, cannot lazy-load | **Built** |
| No security headers or caching rules | **Built**: `_headers`, `_redirects` |
| Logo images have empty alt text | **Built** |

## 5. Compliance (Québec Law 25) and accessibility

| Gap | New site |
|---|---|
| No privacy policy (the URL returns 404) | **Built** in FR and EN, **Owner** names the privacy officer |
| Analytics tags run with no consent | **Built**: consent banner that blocks analytics until accepted |
| All-caps body copy, borderline contrast on photos, skipped headings | **Built**: WCAG 2.2 AA pass |
| Copyright line in English on a French site; typos ("offons", "anyone", "équippement") | **Built**: corrected |
| French Title Case on card titles | **Built**: French sentence case |

## 6. Design and brand

| Gap | New site |
|---|---|
| Generic Elementor template feel, single-colour navy with no accent | **Built**: premium dark/ironwork look with a forged-copper accent |
| No motion, no video, no sense of the craft | **Built**: video hero, scroll storytelling, pinned process, before/after |
| Hidden "Notre méthode / Nos engagements" content nobody sees | **Built**: published |
| No social links | **Owner** supplies profiles, slots built |

## 7. Things only the client can provide

These block "finished", not "built". They are tracked in `proferforge/TODO.md`.

1. Hero video footage (or approval to use the animated fallback)
2. Original logo files (SVG or PNG)
3. Real project photos, before and after
4. RBQ number, insurance, warranty terms, owner name, years in business
5. Opening hours, public address approval, borough list
6. Form backend choice and credentials, Google Analytics and Tag Manager IDs
7. Domain DNS cutover and Search Console access
