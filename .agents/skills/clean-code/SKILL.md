---
name: clean-code
description:
  Clean Code principles applied to this TypeScript / Next.js / React project, with a strong
  emphasis on eliminating duplication (DRY). Use before writing new code, during refactors, after
  Sonar flags duplicated_lines, or when reviewing a PR that adds similar-looking code to
  existing modules.
---

# Clean Code Skill

Practical reference for writing and refactoring code in this repo. The baseline is Robert C.
Martin's _Clean Code_, adapted to TypeScript + React + Next.js App Router and to this project's
actual code quality gates (SonarCloud).

## When to use this skill

- Before writing a new module, component, hook, or API route.
- When SonarCloud flags `duplicated_lines_density`, `duplicated_blocks`, or the "Critical Issues"
  bucket on a file touched by your PR.
- During a `/refactor` or `/clean-code` command invocation.
- When reviewing a PR that looks "copy-pasted from elsewhere" — pair this with `/audit-code`.

## Non-negotiable rules

1. **DRY — Don't Repeat Yourself.** Two or more copies of the same logic is one bug with several
   homes. Extract the moment duplication is conscious.
2. **SRP — one responsibility per function / component / module.** If you say "and" describing
   what it does, split it.
3. **Names reveal intent.** `getFilteredDeckCards` beats `process`. Renaming a variable should
   _never_ be the reason the code becomes clear.
4. **Early returns.** Prefer guard clauses over nested `if`/`else`. Max nesting depth: 3.
5. **Small functions.** Cognitive complexity ≤ 15 (Sonar default). A function you cannot hold in
   your head at once is too big.
6. **No commented-out code.** Git keeps history. Delete it.
7. **No magic values.** Named constants in `constants/` with a JSDoc `@example` when useful.

## DRY — concrete techniques for this repo

### 1. Detecting duplication

- **Sonar**: the duplication dashboard lists exact duplicated blocks with file paths. Start there.
  `https://sonarcloud.io/component_measures?id=KaelSensei_MagicAIBuilder&metric=duplicated_lines_density&view=list`
- **Manually**: after writing code, search for two or three distinctive identifiers (a literal
  string, a specific `.reduce` shape) via Grep across the repo.
- **Ask yourself**: "If this business rule changes, how many files would I edit?" — answer ≥ 2 is a
  smell.

### 2. Refactor recipes

| Duplication type                              | Refactor                                                    |
| --------------------------------------------- | ----------------------------------------------------------- |
| Same validation logic in 2+ Zod schemas       | Extract a shared `z.object({...})` or a branded type        |
| Same `fetch` / rate-limit pattern             | Move into `lib/scryfall.ts` / `lib/api.ts` wrapper          |
| Same `useEffect` + cleanup shape              | Extract a custom hook under `hooks/`                        |
| Same JSX structure with different content     | Extract a component with props                              |
| Same enum → label mapping                     | Static `Record<EnumType, Label>` with an exhaustive `never` |
| Same `Array.reduce` / `groupBy` / `sumBy`     | Extract a pure function in `lib/collections.ts` + unit test |
| Same Prisma query shape                       | Extract into `lib/db/<domain>.ts` with typed return         |
| Same Tailwind class cluster on multiple nodes | Extract a `cn()`'d variant via `class-variance-authority`   |
| Same error handling in API routes             | Extract a `withApiErrorHandler(handler)` wrapper            |

### 3. What NOT to extract

- **Incidental similarity** — two snippets that happen to look alike _today_ but represent
  different domain concepts. Coupling unrelated rules through a shared helper is worse than a bit
  of duplication. Rule of three: extract at the third real duplication, not the first.
- **Pure string templates that differ by wording** — move them to i18n messages, not to a shared
  function.

## React / Next.js specifics

- **Derived state lives in `useMemo`.** Never recompute the same `.filter().map()` across renders.
- **Callbacks passed as props are `useCallback`.** Prevents children from re-rendering because of
  a new function identity.
- **Server Components (RSC) for read-only data.** Don't fetch in a client component if a server
  component can — that removes a whole class of duplication (request + loading + error UI).
- **Route-level loading / error files** instead of per-component spinners — one `loading.tsx`
  replaces 10 `isLoading` checks.
- **Custom hooks over HOCs.** If two components share state + effect logic, extract a hook.

## TypeScript specifics

- **Discriminated unions** instead of multiple boolean flags. See `CLAUDE.md` → Type Safety.
- **`readonly` by default** on returned arrays / objects so accidental mutation doesn't silently
  share state.
- **Exhaustive `switch` with `const _exhaustive: never = value`** — if a new case is added later,
  the compiler points at every switch that must be updated.

## Error handling

- Fail fast at system boundaries (API input, external fetches). Use Zod schemas.
- Inside the domain, assume validated data. No defensive re-validation.
- Never swallow errors. Log, wrap, or rethrow — not ignore.

## Workflow when reducing duplication in a PR

1. Run `pnpm sonar` locally (or wait for CI).
2. Open the SonarCloud duplication dashboard and sort by duplicated_lines.
3. For each block: decide **extract vs. inline vs. leave** using the "what NOT to extract" rule.
4. Extract into the smallest module that makes sense (`lib/`, `hooks/`, `components/shared/`).
5. Add a unit test to the extracted function if it has any branching.
6. Re-run `pnpm sonar`; confirm `duplicated_lines` dropped and no new smells appeared.
7. Keep the diff focused on duplication — don't sneak unrelated refactors in.

## Anti-patterns to reject

- Parameter list ≥ 4 primitives in a row → introduce an options object.
- `if` ladder with 5+ branches on the same discriminant → table lookup or strategy map.
- Mutable module-level state shared across requests in a server file → almost always a bug under
  Next.js's Node.js runtime.
- `console.log` in production code → use `logger` or remove before commit.
- `as` type assertions and non-null `!` — banned per `CLAUDE.md`. Use type guards.

## Sources

- _Clean Code_ — Robert C. Martin
- _Refactoring_ — Martin Fowler (extract function, extract variable, replace conditional with
  polymorphism)
- SonarCloud rule set (`typescript:S*`) — the CI-enforced baseline
