# Pro Fer Forgé website

Static, bilingual (FR default, EN under `/en/`) site for proferforge.ca. No framework, no runtime dependencies. Output is plain HTML, one CSS file (~28 KB) and one JS file (~11 KB), with self-hosted fonts.

```bash
node proferforge/build.mjs              # build → proferforge/dist/
node proferforge/tools/check.mjs        # links, hreflang, JSON-LD, headings, titles, size budget
node proferforge/tools/shots.mjs OUT    # QA screenshots (Playwright) · add "og" as 2nd arg to regenerate the social image
bash proferforge/tools/make-hero-video.sh footage.mov 0 12   # build hero video assets
```

Env vars (all optional, read at build time): `PF_FORM_ENDPOINT`, `PF_GA_ID`, `PF_TURNSTILE_KEY`.

## Structure
- `src/config.mjs` business facts (empty fields are hidden, never faked)
- `src/content.mjs` all copy, FR and EN
- `src/styles.css`, `src/site.js` design system and behaviour
- `build.mjs` page templates, schema, sitemap, headers, redirects
- `TODO.md` what the client must supply

## Deploy (Cloudflare Pages, Netlify or Vercel)
Publish `proferforge/dist/` with build command `node proferforge/build.mjs`. `_headers` (security headers, CSP, caching) and `_redirects` are in Netlify/Cloudflare format.

## Moving from WordPress without losing rankings
1. Keep all five old French URLs (same slugs, already done). New pages are additions.
2. Deploy to a preview URL, run `check.mjs`, review on a phone.
3. Switch DNS, then in Search Console submit the sitemap and use URL Inspection on the home page.
4. Keep the old WordPress site reachable for 2 weeks on a temporary hostname in case of rollback.
5. Remove GTranslate: the English pages are now real pages.

## Notes
- Hero art is an animated ironwork SVG until real footage is added. The "Réalisations" before/after uses a labelled illustration until real photos are added.
- No analytics or third-party scripts load before consent (Law 25).
