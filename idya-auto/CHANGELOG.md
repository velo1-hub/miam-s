# Changelog

All notable changes to the Idya Auto website. Format follows Keep a Changelog; versions
follow the build phases of `IDYA_AUTO_BRIEF.md` §24 until launch.

## [Unreleased]

## [0.0.1] — Phase 0 — 2026-11-07

### Added
- `IDYA_AUTO_BRIEF.md` v2.0 committed as the functional source of truth.
- Next.js 16.4 / React 19.3 / TypeScript strict / Tailwind CSS v4 scaffold (pnpm, Turbopack,
  Cache Components on), reduced to a minimal French placeholder page.
- Tooling: ESLint flat config, `typecheck` script, Vitest with the first unit tests
  (`lib/format/number.ts`: FR/EN price and km formatting from brief §18).
- `CLAUDE.md` project conventions, `.env.example` (brief §22), `docs/client-todo.md`
  (every `[CLIENT: …]` placeholder and legal text to validate), `docs/phase-0-plan.md`
  (questions, phased plan, technical review of the brief).
