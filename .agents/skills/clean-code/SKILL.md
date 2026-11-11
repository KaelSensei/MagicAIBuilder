---
name: clean-code
description:
  Clean Code principles applied to this TypeScript / Next.js / React project, with a strong
  emphasis on duplicated knowledge (DRY), small units and informative comments. Use before writing
  new code, during refactors, when SonarCloud reports duplication, or when reviewing a PR that adds
  similar-looking code to existing modules.
---

# Clean Code Skill

Practical reference for writing and refactoring code in this repo. The baseline is Robert C.
Martin's _Clean Code_ and Kent Beck's _Tidy First?_, adapted to TypeScript, React and the Next.js
App Router. SonarCloud reports duplication and complexity; it is advisory (`CLAUDE.md`), so these
rules apply whether or not it flags anything.

## When to use this skill

- Before writing a new module, component, hook, use case or route handler.
- When SonarCloud reports `duplicated_lines_density`, `duplicated_blocks` or high cognitive
  complexity on a file your PR touches.
- During a refactor, or a review of a PR that looks copied from elsewhere (pair it with
  `/code-review`).

## Non-negotiable rules

1. **Duplicated knowledge is a bug; similar-looking code is a hint.** When the same business rule
   appears twice, extract it now into the context that owns it. When code only looks alike, wait
   for the third occurrence and check it is the same concept. Never share code between two
   contexts because it looks alike; share through the owning context's `index.ts`, or not at all.
2. **SRP: one responsibility per function, component and module.** If you say "and" when you
   describe what it does, split it.
3. **Names reveal intent** and come from the glossary in `CONTEXT.md`. `getFilteredDeckCards`
   beats `process`. If a comment is needed to say what a name means, rename instead.
4. **Early returns.** Prefer guard clauses over nested `if`/`else`. Max nesting depth: 3.
5. **Small units.** Cognitive complexity ≤ 15 per function. Components ≤ 200 lines, other files ≤
   300 lines, comments and blank lines excluded. A file already over the limit must not grow; leave
   it smaller when you touch it.
6. **No commented-out code.** Git keeps history. Delete it.
7. **No magic values.** A named constant, with a comment that says where the value comes from.
8. **Comments carry information, never a paraphrase.** See [Comments](#comments).

## Comments

The owner asked for "a lot of comments". That means a lot of information, never more lines that
repeat the code. The standard is `docs/adr/0006-comment-and-documentation-standard.md`, with
templates in `docs/engineering/code-documentation.md`.

- **Module header.** Every module opens with its purpose, its context and its main
  collaborators, and says what it is not responsible for when that is not obvious.
- **TSDoc contract on every export:** what it does, input constraints, errors and edge cases, and
  why. Add `@param` and `@returns` only when they say more than the name and the type.
- **Game rules cite their Comprehensive Rules number:** `// CR 903.5b: basic lands are exempt from
  the singleton rule`. Check the number in `src/lib/rules/data/MagicCompRules-20260807.txt`.
- **External limits cite their source:** a URL and the date it was read
  (`// Scryfall asks for 50–100 ms between requests: https://scryfall.com/docs/api, read YYYY-MM-DD`).
- **Decisions cite their ADR or PR:** `// ADR 0009: the server re-validates; this is a preview`.
- **Delete** comments that restate the code, author or date stamps, and `TODO`s without an issue
  number.
- When you change code, re-read the comments of the functions you changed and their module
  header, and fix or delete any that became false, in the same commit.

```ts
/**
 * Singleton rule for a Commander deck's main zone.
 *
 * Context: format-rules. Used by the server-side legality report and by the editor preview.
 * Not responsible for colour identity (see color-identity.ts).
 */

/**
 * Lists the cards that break the singleton rule, with how many copies the deck holds.
 * Basic lands and cards whose text allows any number of copies are exempt.
 * Returns an empty list for a legal deck; never throws.
 */
export function findSingletonViolations(
  cards: readonly DeckCard[]
): readonly SingletonViolation[] {
  // CR 903.5b: basic lands are exempt from the singleton rule.
  /* … */
}
```

## DRY: concrete techniques for this repo

### 1. Detecting duplication

- **SonarCloud** lists exact duplicated blocks with file paths:
  `https://sonarcloud.io/component_measures?id=KaelSensei_MagicAIBuilder&metric=duplicated_lines_density&view=list`
- **By hand:** after writing code, search for two or three distinctive identifiers (a literal
  string, a specific `.reduce` shape) across the repo.
- **Ask:** "If this business rule changes, how many files would I edit?" Two or more is a smell.

### 2. Refactor recipes

Destinations use the module layout (`clean-architecture` skill). For a context that has not moved
to `src/modules/` yet, use the folder in brackets.

| Duplication type                              | Refactor                                                                                   |
| --------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Same business rule in two places              | One pure function in the owning context's `domain/` (`src/lib/<area>/`) + unit test         |
| Same validation logic in 2+ Zod schemas       | A shared schema next to the boundary that parses it (`src/lib/validation/`)                 |
| Same provider `fetch` / rate-limit pattern    | The provider's adapter in `infrastructure/` (`src/lib/scryfall/`, `src/lib/http.ts`)        |
| Same Prisma query shape                       | A repository function in the context's `infrastructure/`, typed with domain types          |
| Same `useEffect` + cleanup shape              | A custom hook in the context's `client/` (`src/hooks/`)                                     |
| Same JSX structure with different content     | A presentational component with props                                                      |
| Same enum → label mapping                     | A static `Record<EnumType, Label>`, checked by the compiler                                 |
| Same `reduce` / `groupBy` / `sumBy`           | A pure function with a unit test, in the domain that owns the data                         |
| Same Tailwind class cluster on multiple nodes | A `cn()` variant through `class-variance-authority` (`src/components/ui/`)                  |
| Same request parsing or error mapping in routes | A shared helper in `src/lib/api/` (for example `json-body.ts`)                           |

### 3. What NOT to extract

- **Incidental similarity:** two snippets that look alike today but represent different domain
  concepts. Coupling unrelated rules through a shared helper is worse than a little duplication.
- **Strings that differ by wording:** they belong in the next-intl messages, not in a shared
  function.

## React / Next.js specifics

- **Derived state lives in `useMemo`.** Never recompute the same `.filter().map()` on every render.
- **Callbacks passed as props are `useCallback`** when the child is memoised or the callback is a
  dependency.
- **Server Components for read-only data.** Do not fetch in a client component when a server
  component can; that removes a request, a loading state and an error state.
- **Route-level `loading.tsx` and `error.tsx`** instead of per-component spinners.
- **Custom hooks over HOCs.** If two components share state and effect logic, extract a hook.
- **Small components.** A page or container composes presentational components; logic lives in
  hooks or the domain.

## TypeScript specifics

- **Discriminated unions** instead of several boolean flags.
- **`readonly` by default** on returned arrays and objects.
- **Exhaustive `switch`** with `const _exhaustive: never = value`, so a new case makes the compiler
  point at every switch to update.

## Error handling

- Fail fast at system boundaries (route input, provider responses) with Zod.
- Inside the domain, trust the types. No defensive re-validation.
- Never swallow an error. Log it, wrap it or rethrow it.

## Workflow when reducing duplication in a PR

1. Run `pnpm sonar` locally when credentials are available, or read the SonarCloud report on the
   PR.
2. For each duplicated block, decide **extract, inline or leave**, using rule 1 and "What NOT to
   extract".
3. Extract into the smallest home that owns the knowledge.
4. Add a unit test to the extracted function if it branches.
5. Keep the extraction in its own structural commit, with no behaviour change.

## Anti-patterns to reject

- Four or more primitive parameters in a row → an options object.
- An `if` ladder with five or more branches on the same discriminant → a lookup table or an
  exhaustive `switch`.
- Mutable module-level state shared across requests in server code → almost always a bug under
  the Node.js runtime.
- `console.log` in production code → `src/lib/logger.ts`, or remove it.
- `as` type assertions and non-null `!` → type guards or parsing.

## Sources

- _Clean Code_, 2nd ed. (2025), Robert C. Martin
- _Tidy First?_ (2023), Kent Beck
- _Refactoring_, Martin Fowler (extract function, extract variable, replace conditional with
  polymorphism)
- _A Philosophy of Software Design_, John Ousterhout (interface comments, "why" comments)
- SonarCloud rule set (`typescript:S*`), advisory in this repository
