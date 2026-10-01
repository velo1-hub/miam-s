# Owner checklist: what only the client can supply or do

Nothing below is invented on the site. Each item is either hidden until provided or clearly neutral.

## Content to send (then edit `src/config.mjs`, rebuild)
| Item | Where it appears once filled in |
|---|---|
| RBQ licence number (`BIZ.rbq`) | Trust strip, About, footer |
| Insurance details (`BIZ.insurance`) | Trust strip, About |
| Real warranty terms (`BIZ.warranty`) | Home "Notre garantie" section |
| Year founded (`BIZ.founded`) | Trust strip (years of experience), About, schema |
| Owner / manager name (`BIZ.owner`) | About |
| Opening hours (`BIZ.hours`) | Schema (LocalBusiness) |
| Social profiles (`BIZ.social`) | Footer, schema `sameAs` |
| Privacy officer name (`BIZ.privacyOfficer`) | Privacy policy |
| Confirm the address may be public, and confirm map coordinates (`BIZ.geo`) | Footer, schema |
| Confirm the list of boroughs and cities (`BIZ.areas`) | Service-area page, home, schema |
| Confirm the 7 reviews are real Google reviews, add dates | Home reviews |
| Confirm 5,0 ★ / 55 reviews is still current (`BIZ.rating`) | Trust strip, schema |

## Media
- [ ] **AI-generated brand images are in use** (Higgsfield): hero, spiral, welding, street, before/after (`proferforge/src/assets/img/*.webp`). They are mood imagery, **not the client's work**; the before/after slider is labelled "Image illustrative". Replace them with real project photos (same file names, same aspect ratios) before launch, and do not describe them as the client's projects.
- [ ] **Hero video:** 8 to 15 s of real footage. Run `bash proferforge/tools/make-hero-video.sh footage.mov 0 12`; the build picks up `hero.mp4`, `hero.webm` and `hero-poster.jpg` automatically. Until then the hero uses an animated ironwork backdrop.
  Shots to film (horizontal, steady, no audio needed): 1) grinder with sparks on a railing, 2) welder at work, 3) brush or roller on a spiral stair, 4) wide shot of a finished façade stair, 5) before/after of the same balcony, 6) the van on a Montréal street.
- [ ] **Real project photos**, before and after, for the Réalisations page (replace the labelled illustration in `build.mjs` → `beforeAfter()` with real images).
- [ ] **Original logo files** (SVG or PNG). The logo on the site is a faithful redraw (`logo()` in `build.mjs`).
- [ ] Team and van photos for About.

## Accounts and setup (owner)
- [ ] **Form backend:** set `PF_FORM_ENDPOINT` (Formspree, Netlify Forms, or a Supabase function). Until set, the form opens the visitor's email app (photos must be attached by hand).
- [ ] **Cloudflare Turnstile:** set `PF_TURNSTILE_KEY`.
- [ ] **Google Analytics 4:** set `PF_GA_ID`. It only loads after the visitor accepts cookies.
- [ ] **Google Search Console:** add the domain, submit `https://proferforge.ca/sitemap.xml`.
- [ ] **Google Business Profile:** see `docs/proferforge-seo-playbook.md`.
- [ ] **Domain and DNS cutover** from WordPress to the new host (see README).
