---
status: accepted
date: 2026-11-10
decision-makers: Project owner; clean-code programme coordinator
---

# Enforce the architecture with tools, introduced in stages

## Context and Problem Statement

The house rules already describe layers and dependency directions, and the clean-architecture
skill calls them "enforced by convention + Sonar" (`.agents/skills/clean-architecture/SKILL.md:75`).
Nothing enforces them. Rules that live only in prose erode, and agents, which write most of the
code, follow whatever the tools let through.

The state on `dev` at `872f08ff` (2026-11-10):

- **Linting.** `.eslintrc.json` extends only `next/core-web-vitals` and `next/typescript`, plus one
  rule. `pnpm lint` runs `next lint`, which Next.js 15.5 deprecated and Next.js 16 removed.
  `.lintstagedrc.cjs` notes that running `eslint --fix` directly fails in flat-config mode.
- **No boundary tooling.** No dependency-cruiser, no `eslint-plugin-boundaries`, no `server-only`
  import, no architecture test.
- **Known violations.** 11 imports break the intended layer rules: 5 type-only imports from
  `src/lib/ai/*` into `src/app/api/ai/**`, 3 imports from `src/lib` into `src/hooks`
  (`src/lib/deck/store.ts:13`, `src/lib/deck/commander-save-recovery.ts:1`,
  `src/lib/ai/suggestion-review.ts:1`) and 3 type-only imports from components and hooks into
  `src/app/api/ai/build/types.ts`.
- **Cycles.** No runtime import cycle exists. Three cycles exist when type-only imports count; the
  largest runs from `src/lib/deck/types.ts` through analysis modules and the playtest engine back to
  the deck types.
- **Size.** 32 non-test modules exceed 300 lines; the largest is `src/lib/deck/store.ts` with
  2,550.

Turning every rule on at `error` today would fail the build on day one; never turning them on
would leave the architecture to discipline. How should the rules become checks without stopping
daily work?

## Decision Drivers

- Each rule should be checked by a tool, with a message that tells the author what to do.
- Existing violations must not block unrelated work, but must not grow.
- The checks must run locally and in CI, with zero warnings in `pnpm lint` (the pre-PR gate).
- The prerequisite migrations (ESLint flat config) must happen first.

## Considered Options

- Staged enforcement: flat config first, then `server-only`, dependency-cruiser with a shrinking
  baseline, ESLint size and complexity limits with bulk suppressions, Knip, and finally `pnpm arch`
  in the pre-PR gate.
- `eslint-plugin-boundaries` alone.
- A home-made Vitest guard test that parses imports with regular expressions.
- Every rule at `error` immediately.

## Decision Outcome

Chosen option: "staged enforcement", because it turns each rule into a check as soon as the check
can pass, and uses a baseline that may only shrink for the debt that exists.

The stages, in order:

1. **ESLint flat config.** Migrate from `next lint` and `.eslintrc.json` to an ESLint 9
   `eslint.config.mjs`. This is a prerequisite for every ESLint-based rule below, and `next lint`
   disappears in Next.js 16.
2. **`server-only`.** Add the package and a Vitest alias to an empty stub, then mark the
   server-only modules ([ADR 0002](0002-module-entry-points-index-server-client.md)).
3. **dependency-cruiser.**
   - The cycle rule is an `error` from the start. There is no runtime cycle, but there are three
     type-only cycles; they are recorded in the baseline, like the layer violations, and leave it
     once broken. The largest runs through `src/lib/deck/types.ts` and is broken in phase 1 by
     moving `DeckStats` to deck analysis and `OPENING_HAND_SIZE` upstream; the other two are
     type-only loops inside `src/lib/import/` and `src/lib/meta/`. A new cycle, runtime or
     type-only, fails.
   - Layer and context rules start from a recorded baseline of known violations
     (`--ignore-known`). The baseline may only shrink. When a context finishes its move series, its
     rules go to `error` and its baseline entries are deleted.
   - dependency-cruiser also generates the Mermaid dependency graphs for the docs.
4. **ESLint size and complexity limits.** `max-lines`, `max-lines-per-function` and `complexity`,
   with comments excluded from line counts so the comment standard is never penalised. Existing
   breaches are recorded with ESLint bulk suppressions, a ratchet that only goes down.
5. **Knip.** An advisory report of unused files, exports and dependencies.
6. **`pnpm arch`.** Once it exists, it joins the pre-PR gate in `CLAUDE.md`.

`eslint-plugin-jsdoc` ([ADR 0006](0006-comment-and-documentation-standard.md)) and the typed
`vi.mock(import(…))` rule ([ADR 0005](0005-testing-strategy-fakes-contracts-and-characterization.md))
follow the same pattern once the flat config exists.

### Consequences

- Good, because the architecture is checked on every change, by the same tools for humans and
  agents, with messages that say what to do.
- Good, because the baseline lets work continue while forbidding new violations, and records the
  debt in one file.
- Good, because each stage is a small, separate pull request that can land independently.
- Bad, because the rules are only partly enforced for months; until a context's rules reach
  `error`, review still has to catch some violations.
- Bad, because the baseline and suppression files are new artefacts that must be kept honest: a
  pull request must never add entries to them without a stated reason. The baseline starts with
  the 11 layer violations and the 3 type-only cycles.
- Bad, because dependency-cruiser runs as a separate CI step, outside the editor; ESLint
  `no-restricted-imports` covers the two rules agents break most (framework imports in `domain/`,
  server imports in `ui/` and `client/`) for in-editor feedback.

### Confirmation

- CI runs `pnpm lint` and, from stage 3, `pnpm arch`; both must pass.
- A pull request that grows the dependency-cruiser baseline or the ESLint suppressions file
  explains why in its description ([definition-of-done.md](../engineering/definition-of-done.md)).

## Pros and Cons of the Options

### `eslint-plugin-boundaries` alone

- Good, because errors appear in the editor, where agents see them.
- Bad, because it does not detect cycles, has no baseline mechanism and cannot generate diagrams.
  It can be added later for editor feedback if `no-restricted-imports` proves too coarse.

### A home-made Vitest guard test

- Good, because it adds no dependency and follows the repository's existing guard tests
  (`src/lib/toolchain.test.ts`, `src/lib/dependency-manifest.test.ts`).
- Bad, because a regular-expression parser misses import forms, cannot follow re-exports and
  reports no cycles. It stays the fallback if no new development dependency is wanted.

### Every rule at `error` immediately

- Good, because it is simple and unambiguous.
- Bad, because it fails on the known violations and on every file that has not moved yet, which
  would block all other work until the migration ends.

## More Information

- Birgitta Böckeler, [Harness engineering for coding agent users](https://martinfowler.com/articles/harness-engineering.html),
  2026-04-02 (guides and sensors; dependency-cruiser and mutation testing as sensors).
- Mark Seemann, [Curb code rot with thresholds](https://blog.ploeh.dk/2020/04/13/curb-code-rot-with-thresholds/),
  2020-04-13.
- Simon Brown, [Layers, hexagons, features and components](https://www.goodreads.com/author_blog_posts/14401770-layers-hexagons-features-and-components),
  2016-04-25 (conventions without tool enforcement erode).
- [dependency-cruiser](https://github.com/sverweij/dependency-cruiser) (rules, `--baseline`,
  `--ignore-known`, Mermaid output).
- ESLint, [Bulk suppressions](https://eslint.org/docs/latest/use/suppressions).
- Next.js, [Next.js 15.5 release notes](https://nextjs.org/blog/next-15-5) (`next lint`
  deprecation).
