---
status: accepted
date: 2026-11-10
decision-makers: Project owner; clean-code programme coordinator
---

# Test with in-memory fakes, contract tests and characterization tests

## Context and Problem Statement

The project's TDD contract is **Red → Super Green → Refining Refactoring**, described in
[tdd-with-ai.md](../engineering/tdd-with-ai.md). It prefers sociable tests at stable behavioural
boundaries and solitary tests for pure policies. The contract stays. What it does not yet say is
how to replace collaborators, and that gap now matters, because
[ADR 0001](0001-modular-monolith-by-bounded-context.md) will move most files.

The test suite on `dev` at `872f08ff` (2026-11-10):

- 406 test files, all colocated with their subject (`*.test.ts(x)`).
- 318 `vi.mock` calls with a string path. 274 of them (with `vi.doMock`) target the project's own
  modules, in 138 test files. The most mocked path is `@/lib/db/prisma` (62 files). None uses the
  typed form `vi.mock(import("…"))`.
- 60 test files replace the global `fetch`. No test uses MSW.
- Two hand-written in-memory fakes already exist and work well: `src/test/playtest-db-fake.ts` and
  `src/test/scryfall-cache-db-fake.ts`. Recorded provider fixtures exist for Commander Spellbook
  and Moxfield (`*-v1.ts`).
- The largest files carry the most risk when they are split: the deck store
  (`src/lib/deck/store.ts`, 2,550 lines, imported by 12 test files), the builder page (`src/app/[locale]/builder/[deckId]/page.tsx`, 1,192 lines, only `loading.test.tsx` beside
  it), `DeckWizard.tsx` (1,134 lines), the playtest engine (901 lines) and the AI routes (654 and
  373 lines).
- No mutation testing runs, so nobody knows how many assertions would notice a wrong result.

A `vi.mock` call is keyed on a file path. When the file moves and the string is not updated, the
mock silently stops applying and the real module runs: a real Prisma client or a real network call.
A mock of an internal module also lets a test pass whatever the code does, and couples the test to
the current file layout, which the migration changes.

How should tests replace collaborators, and how should risky code be protected, so that the suite
survives a year of moves and keeps proving behaviour?

## Decision Drivers

- Tests must survive moving files: they assert behaviour, not structure.
- A test double must be trustworthy: it behaves like the real thing on the cases that matter.
- Agents must not be able to make a test pass by mocking the problem away or weakening it.
- Splitting a giant file must not change its behaviour unnoticed.

## Considered Options

- Outside-in sociable tests from the use case, hand-written fakes for owned ports, one shared
  contract suite per port, MSW at the HTTP boundary, characterization tests before splits.
- Keep the current approach: `vi.mock` of internal modules and global `fetch` stubs.
- Mockist (London-school) interaction tests with a mocking library.

## Decision Outcome

Chosen option: "fakes, contracts and characterization tests", because it is the only option whose
doubles are verified against the real adapters and whose tests do not depend on file paths.

These rules add to the TDD contract; they do not replace it:

1. **Every plan starts with a test list:** the behaviours to cover, in domain language, before the
   first Red.
2. **New features are tested outside-in from the use case,** with sociable tests: real domain code,
   in-memory adapters for the ports.
3. **Owned ports get hand-written in-memory fakes** (`InMemoryDeckRepository`), plus **one shared
   contract-test suite** per port that runs against the fake and against the real adapter. A fake
   that passes the contract can be trusted.
4. **HTTP is replaced with MSW** handlers built from recorded fixtures, not with `fetch` stubs.
   MSW is adopted per test file first, because 60 files stub `fetch` today.
5. **No new `vi.mock` of an internal module.** Existing ones are phased out context by context.
   Mocks that remain (framework modules such as `next/navigation`, or a temporary seam where no port
   exists yet) use the typed form `vi.mock(import("…"))`, so a moved file makes `tsc` fail instead
   of leaving the mock silently stale.
6. **Characterization before splitting.** Before a giant file is split, its current behaviour is
   pinned by characterization or approval tests at its public surface: the deck store, the builder
   page, `DeckWizard`, the playtest engine and the AI routes. These tests pin behaviour as it is,
   odd parts included, and say so in their names.
7. **Forbidden moves:** deleting or weakening a test or an assertion to make a change pass, and
   disabling a test (`.skip`, a committed `.only`, commenting it out). Copying
   the actual output into the expected value without checking it is also forbidden.
8. **Mutation testing** (StrykerJS) runs on `domain/` folders, advisory at first: nightly, and
   incremental on changed files.

### Consequences

- Good, because tests written against use cases and fakes survive file moves unchanged.
- Good, because the contract suite proves the fake and the real adapter agree, so sociable tests
  with fakes can be trusted.
- Good, because a moved file can no longer leave a mock silently stale.
- Good, because characterization tests make the big splits safe, and mutation testing measures
  whether assertions catch wrong results.
- Bad, because each port costs a fake and a contract suite. Prisma adapters need a real PostgreSQL
  for their side of the contract, which the Docker Compose setup provides but which is slower.
- Bad, because 274 existing path-bound mocks must be migrated over many pull requests; until then,
  two styles coexist.
- Bad, because characterization tests pin current bugs too. A later fix must change them on
  purpose, in its own `fix/` pull request with its own Red test.
- Bad, because mutation testing is slow on a 400-file suite; it starts scoped and advisory.

### Confirmation

- The pull request records the test list and the Red evidence
  ([definition-of-done.md](../engineering/definition-of-done.md)).
- `@vitest/eslint-plugin` `prefer-import-in-mock` converts and then enforces the typed mock form,
  and a lint rule bans `vi.mock("@/…")` in new code once the flat ESLint config exists
  ([ADR 0007](0007-architecture-enforcement-in-stages.md)).
- A guard test checks that every remaining `vi.mock` specifier resolves to an existing file.

## Pros and Cons of the Options

### Keep `vi.mock` of internal modules and `fetch` stubs

- Good, because it is familiar and needs no new code.
- Bad, because path-keyed mocks go stale when files move, and the failure is silent.
- Bad, because a mocked internal module verifies nothing about the real collaborator, and makes it
  easy to pass a test by mocking the problem away.

### Mockist interaction tests with a mocking library

- Good, because mocks can drive the discovery of roles in outside-in design.
- Bad, because `toHaveBeenCalledWith` on internal collaborators breaks under restructuring, which
  is the main activity of the coming year. Recording fakes still cover outgoing notifications that
  have no observable state (an email sent, an event published).

## More Information

- [tdd-with-ai.md](../engineering/tdd-with-ai.md): the TDD contract and the agent's checklist.
- Kent Beck, [Canon TDD](https://newsletter.kentbeck.com/p/canon-tdd), 2023-12-11 (the test list,
  the forbidden moves).
- Kent Beck, [Augmented Coding: Beyond the Vibes](https://newsletter.kentbeck.com/p/augmented-coding-beyond-the-vibes),
  2025-06-25 (structural and behavioural commits, stop signals).
- Robert C. Martin, [When to Mock](https://blog.cleancoder.com/uncle-bob/2014/05/10/WhenToMock.html), 2014-05-10.
- J. B. Rainsberger, [Getting Started with Contract Tests](https://blog.thecodewhisperer.com/permalink/getting-started-with-contract-tests), 2017-06-25.
- Michael Feathers, _Working Effectively with Legacy Code_ (2004), characterization tests and seams.
- Thomas Pierrain, [Outside-in Diamond TDD](https://tpierrain.blogspot.com/2021/03/outside-in-diamond-tdd-1-style-made.html), 2021-03-12.
- WealCome, [TDD and Clean Architecture with Node.js and TypeScript](https://wealcomecompany.com/wealcome-nodejs-tdd-clean-architecture-formation)
  (outside-in, "mostly classicist", Stryker).
- Vitest, [Mocking modules](https://vitest.dev/guide/mocking/modules) (the typed `import()` form).
- MSW, [Node.js integration](https://mswjs.io/docs/integrations/node).
