# CLAUDE.md — Idya Auto

Project conventions for every contributor, human or agent. The functional source of truth is
`IDYA_AUTO_BRIEF.md` (v2.0). When this file and the brief disagree, the brief wins unless the
decision is recorded in `docs/decisions.md` (approved answers to the Phase 0 questions).

## Working rules (from brief §0)

- Work **phase by phase** (brief §24). End each phase with lint, typecheck, tests, production
  build, Lighthouse, screenshots at 390 px and 1440 px, then stop and wait for feedback.
- **Never invent dealership facts.** Use `[CLIENT: …]` placeholders in copy and record every
  one in `docs/client-todo.md`.
- **French first.** Québec French copy is written first and is always complete; English mirrors
  it. Vocabulary: VUS, camionnette, traction intégrale, essai routier, échange, inventaire, km.
- "Apple-inspired" is a feel. No Apple fonts, logos, icons, imagery or copy.
- No Lorem ipsum in shipped pages. No `any`. No magic numbers outside tokens. No disabled
  lint rule without a comment saying why.
- Taste: no custom cursor, no sound, no scroll-jacking except the home 360° scene, no
  parallax on text, no confetti.

## Stack

Next.js 16 (App Router, Cache Components, Turbopack) · React 19.3 · TypeScript strict ·
Tailwind CSS v4 (`@theme` tokens) · Radix / shadcn primitives restyled · Motion ·
next-intl (localized pathnames) · Supabase · Zod + react-hook-form · nuqs · Resend +
React Email · Vercel AI SDK + `@ai-sdk/anthropic` · Vitest · Playwright · pnpm.

Next.js 16 differs from older training data. Before touching routing, caching, proxy or
images, read `node_modules/next/dist/docs/01-app/` (see `AGENTS.md`). Key points:

- `proxy.ts` replaces `middleware.ts`.
- `cacheComponents: true` is on. Cache with `'use cache'` + `cacheLife` + `cacheTag`;
  invalidate with `updateTag` (in Server Actions) or `revalidateTag`.
- Request APIs (`params`, `searchParams`, `cookies`, `headers`) are async.
- React 19.3 `<ViewTransition>` is available for the card → vehicle page morph.

## Repository layout

This project lives in the `idya-auto/` folder of the `velo1-hub/miam-s` repository (see
Phase 0 question 1). All commands below run from `idya-auto/`. Target structure is brief §22.

```
app/[locale]/(site)/   public pages        components/ui/        design-system primitives
app/admin/             dashboard           components/car360/    viewer, loader, scroll scene
app/api/               route handlers      components/vehicle/   card, specs, gallery, calculator
app/dev/ui             component gallery   components/assistant/ launcher, panel, rich cards
lib/{ai,supabase,finance,format,seo,booking}/                   messages/{fr,en}.json
demo/                  demo seed + media   supabase/{migrations,seed.sql}
emails/                React Email FR/EN   scripts/              encode-hero.sh, render-spin.ts…
docs/                  client-todo.md, photo-guide.md, decisions.md, phase reports
```

## Commands

```bash
pnpm dev          # next dev
pnpm lint         # eslint
pnpm typecheck    # tsc --noEmit
pnpm test         # vitest run
pnpm build        # next build (production)
```

## Design tokens

- Every colour, radius, duration, easing, type size and spacing value is a CSS variable
  declared in `app/globals.css` under `@theme`. Components reference tokens only.
- Single dark theme. Palette, glass levels, type scale, motion tokens: brief §3.
- **Red budget:** ≤ 3% of a view. One primary (red) button per view. Red never tints glass.
- **No-red zones:** prices, financing calculator, financing and trade-in forms, legal text,
  form focus states. Use the Light button there.
- `--text-3` is 0.50 alpha, not 0.44 (0.44 fails WCAG AA at 4.07:1; see Phase 0 review).
- Icons: Lucide, `strokeWidth={1.5}`. Font: Inter variable via `next/font`, `opsz` axis.
- Prices, km and specs use `tabular-nums`. Eyebrows are the only uppercase text.

## Code conventions

- TypeScript `strict`, no `any`, no non-null assertions without a comment.
- Server Components by default. `'use client'` only at the leaf that needs state or effects.
- Zod schemas live next to the feature and are shared by the form and its Server Action.
- Animate only `transform`, `opacity`, `filter`. Respect `prefers-reduced-motion` everywhere.
- Every `next/image` has exact `sizes`. Canvas frames (Car360) are the only exception.
- Data access goes through repository interfaces in `lib/` so seed JSON (pitch) and
  Supabase (production) are swappable without touching UI or AI tools.
- All user-facing strings come from `messages/{fr,en}.json` through next-intl. Never inline.
- Numbers and dates: `lib/format` (`fr-CA` / `en-CA`, `America/Toronto`).
- Analytics events: names from brief §21, via one `track()` helper.

## Git

- Branch: `claude/vigilant-feynman-p7sbfe`. Small commits, Conventional Commits
  (`feat:`, `fix:`, `docs:`, `chore:`, `test:`, `refactor:`), scope optional, e.g.
  `feat(car360): bisection frame loader`.
- Update `CHANGELOG.md` with each phase.
- Never commit `.env*` files. Secrets only through the environment.
