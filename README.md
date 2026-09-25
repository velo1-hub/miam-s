# Miam's Resto Café: brand & digital ecosystem

Everything needed to launch and run Miam's Resto Café: strategy, identity, menu, website, QR menu, in-store screens, local SEO, delivery, social, ads, loyalty, the MIAM OS management system, and the 90-day launch plan.

> **Read this first.** The client brief was submitted with every field blank, and the owner then asked for the whole engagement to be delivered in one pass. Every deliverable is therefore built on **one explicit, consistent set of assumptions**, listed in [`docs/00-discovery.md` §1](docs/00-discovery.md#1-assumed-brief). If an assumption is wrong (the city above all), change it there. The items that depend on it are cross-referenced so they can be updated.

## Where everything is

| # | Phase | Deliverable | Ready-to-use assets |
|---|---|---|---|
| 0 | Discovery & audit | [docs/00-discovery.md](docs/00-discovery.md) | Question list, competitor matrix, SWOT |
| 1 | Brand strategy | [docs/01-brand-strategy.md](docs/01-brand-strategy.md) | Positioning, taglines, tone of voice, brand stories FR/EN |
| 2 | Visual identity | [docs/02-visual-identity.md](docs/02-visual-identity.md) | Palette, type, logo brief + AI prompts, shot list, brand book |
| 3 | Menu engineering | [docs/03-menu.md](docs/03-menu.md) | [`data/menu.source.json`](data/menu.source.json) (master), [`data/menu.json`](data/menu.json), [`data/menu.csv`](data/menu.csv), [engineering matrix](docs/generated/menu-engineering.md) |
| 4 | QR digital menu | [docs/04-qr-menu.md](docs/04-qr-menu.md) | Built: `site/dist/fr/menu/` and `site/dist/en/menu/` |
| 5 | In-store screens | [docs/05-screens.md](docs/05-screens.md) | Built: `site/dist/screens/board.html` |
| 6 | Website | [docs/06-website.md](docs/06-website.md) | Built static site in [`site/`](site/) (FR/EN, schema, sitemap) |
| 7 | Google profile & local SEO | [docs/07-local-seo.md](docs/07-local-seo.md) | GBP copy, 15 Q&As, 30-day posts, review replies, citations |
| 8 | Delivery platforms | [docs/08-delivery.md](docs/08-delivery.md) | Listing copy, delivery menu, ranking playbook |
| 9 | MIAM OS | [docs/09-miam-os.md](docs/09-miam-os.md) | [`miam-os/`](miam-os/): database schema with row-level security (Supabase/Postgres) |
| 10 | Social media | [docs/10-social.md](docs/10-social.md) | 30-day calendar, 20 Reels scripts, launch campaign |
| 11 | Meta Ads | [docs/11-meta-ads.md](docs/11-meta-ads.md) | Campaign structure, 10 ad concepts FR/EN, reporting template |
| 12 | Loyalty & CRM | [docs/12-loyalty-crm.md](docs/12-loyalty-crm.md) | Program design, email/SMS flows with full copy |
| 13 | Launch & 90 days | [docs/13-launch-roadmap.md](docs/13-launch-roadmap.md) | Timeline, RACI, budget tiers, scorecard, risks |
| ⚠️ | All owner-only actions | [docs/owner-actions.md](docs/owner-actions.md) | One checklist of everything only the owner can do |

## Commands

```bash
node tools/build-menu.mjs     # after editing data/menu.source.json: regenerates menu.json, menu.csv, engineering matrix
node site/build.mjs           # regenerates the website, QR menu and screen board into site/dist
npx serve site/dist           # preview locally (any static server works)
```

`site/dist` is a plain static folder. Deploy it to Cloudflare Pages, Netlify or any web host, with no server and no database. The master menu flows from `data/menu.source.json` into the print menu text, website, QR menu, screens and delivery CSV. **Change a price in one place.**

## Status of what's built vs. specified

| Built and working in this repo | Specified, to be built or configured with providers |
|---|---|
| Bilingual website (FR default, EN), menu pages with search, filters and allergen display, JSON-LD, sitemap, robots, hreflang | Online ordering and reservations: embedded from the chosen POS / reservations provider (see Phase 6 §7) |
| In-store menu board that switches by daypart | Screen hardware and signage player |
| Master menu database + menu engineering generator | Custom MIAM OS application (MVP plan in Phase 9 §9.6) |
| MIAM OS database schema with roles and row-level security | POS, delivery aggregator, accounting and payroll connections |
