# Idya Auto — website

Premium dealership website for Idya Auto (Québec), built by Veloria Labs. Functional brief:
[`IDYA_AUTO_BRIEF.md`](IDYA_AUTO_BRIEF.md). Conventions: [`CLAUDE.md`](CLAUDE.md).
Status and history: [`CHANGELOG.md`](CHANGELOG.md).

**Current phase: 0 — Plan.** See [`docs/phase-0-plan.md`](docs/phase-0-plan.md) for the
questions awaiting answers, the phased plan and the technical review of the brief.

## Setup

Requires Node 22 and pnpm 10 (`corepack enable`).

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

## Commands

| Command | What it does |
|---|---|
| `pnpm dev` | Development server |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | TypeScript, no emit |
| `pnpm test` | Vitest unit tests |
| `pnpm build` | Production build |

Sections to be completed in later phases (brief §25): environment variables, deploy, replacing
the hero video, shooting and uploading a 360° set, editing the assistant's knowledge base.
