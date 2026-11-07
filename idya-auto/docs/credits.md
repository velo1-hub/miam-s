# Media credits and generation plan

## What ships today (demo mode)
- Hero loop (`public/media/hero-*.mp4|avif`) and 13 spin sets + galleries (`public/demo/vehicles/`)
  are **rendered locally** from a parametric three.js scene (`scripts/render/`). No stock footage,
  no third-party imagery, no Higgsfield credits used. They are placeholders with production formats.
- Logo: text wordmark + red bar (`components/ui/logo.tsx`) pending the client's SVG.
- Icons: Lucide (ISC). Font: Inter variable (SIL OFL) via `next/font`.

## Higgsfield plan (brief §11, §29) — not executed
Run only after the client approves the budget. Estimated credits per the brief: one hero master
(Version A 12 s loop, Version B logo sting) plus 12 vehicle hero stills.

1. Hero A: studio dark set, slow dolly around a dark SUV, red rim light, 12 s seamless loop, 4K.
2. Hero B: same set, ends on the Idya Auto wordmark (requires the client's logo SVG).
3. Per vehicle: 1 three-quarter still on the same set, matched to `demo/seed.json` colours.
4. Encode with `scripts/encode-hero.sh`, verify the loop point and the poster frame, replace
   `public/media/`, update `settings.hero` in admin.

Record the generation IDs and prompts here once produced, with the licence terms of the plan used.
