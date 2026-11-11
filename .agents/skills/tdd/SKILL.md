---
name: tdd
description: Design features and reproduce bugs through test-first baby steps. Use before changing production behavior, before splitting or moving untested code, or when reviewing whether a claimed TDD cycle has observable Red evidence. Distinguish behavior changes from behavior-preserving refactoring and documentation-only work.
---

# Test-Driven Design

TDD is a software design discipline, not merely a testing technique. Write an
automated test before the corresponding production behavior, observe it fail,
then let small increments drive an emergent design. Tests added after an
implementation can provide regression coverage, but are not evidence of TDD.

The project contract is `docs/engineering/tdd-with-ai.md`. The test strategy
(fakes, contracts, characterization) is
`docs/adr/0005-testing-strategy-fakes-contracts-and-characterization.md`.

## Three Constraints

1. Do not write new production behavior without a failing test requiring it.
2. Write no more test code than needed to expose the next missing behavior.
3. Write no more production behavior than needed to pass that test while
   preserving existing contracts.

A missing symbol or compilation failure can be Red when it directly expresses
the intended missing API. An unavailable runner, dependency, credential or
network service is an environment blocker, not proof of a behavioral Red.

## Test List: plan the behaviors first

Every plan starts with a test list: the behaviors to cover, in domain language
(glossary terms from `CONTEXT.md`), including edge cases and failures. It goes
in the plan and in the PR body.

- Take exactly one item per cycle.
- Add a behavior you discover to the list; do not implement it on the spot.
- An item that nobody asked for is a scope question for the owner, not a test.

## Red -> Super Green -> Refining Refactoring

### Red: establish the next design requirement

- Choose one observable behavior from the list and write the smallest
  deterministic test.
- Complete one test's observed Red, minimal Green and optional refactor before
  introducing the next missing behavior. Do not batch new failing tests or
  distinct parameterized cases and implement them together. Writing tests first
  without these feedback cycles is test-first, not this TDD contract.
- Run it before implementation and inspect the actual failure. Confirm that it
  fails because the behavior is absent, not because the fixture is broken.
- For a bug, reproduce the reported scenario and retain the regression test.
- Record the focused command, test and expected failure. Never invent Red
  evidence or describe an unexecuted test as verified.

### Super Green: satisfy only that requirement

- Implement the simplest sufficient behavior with clear names, correct placement
  and the project's existing safety and quality standards.
- Minimal does not mean deliberately dirty. Clean code does not mean advanced
  architecture: do not add future enum values, factories, interfaces, generic
  extension points or unrequested error cases.
- Progress through small transformations when appropriate (Transformation
  Priority Premise: constant, then scalar, then conditional, then loop), rather
  than jumping to the imagined final design. Keep code quality separate from
  behavioral scope.
- Run the focused test and relevant regressions. If another behavior is needed,
  begin another Red cycle instead of silently extending the implementation.

### Refining Refactoring: improve design without changing behavior

- Start with green tests. Make one coherent structural improvement and rerun the
  affected tests; keep the public behavior unchanged.
- Remove demonstrated duplication or clarify an emerging responsibility. Do not
  create abstractions solely for hypothetical future needs (YAGNI).
- Behavior-preserving refactoring does not require manufacturing a failing test.
  Any newly introduced behavior does require its own Red cycle.

## Test At Stable Boundaries

Prefer sociable unit tests of use cases, route handlers, store actions or visible
component behavior with real in-process collaborators. Assert observable results,
not private method calls, so internal structure can evolve without test rewrites.
Use focused solitary tests for pure algorithms, parsers and domain policies.

- **Outside-in for new features.** The first test calls the use case (or the
  route handler while no use case exists) with in-memory adapters. It drives the
  domain functions it needs.
- **Test names are sentences in domain language**:
  `"rejects a partner pair when one commander lacks partner"`, not a method name.
- **Assert state, not calls.** Check the deck in the fake repository, not
  `toHaveBeenCalledWith` on a collaborator. A recording fake (a list of sent
  emails or published events) is the exception, for outgoing notifications with
  no other observable state.

Add happy paths, relevant edge cases and failure behavior through separate small
cycles.

## Test Doubles

- **Double only the ports you own**: repositories, the card catalog, the
  language model, the clock, ID generation. Write the double by hand as an
  in-memory fake, built by a factory function, in the context's `testing/`
  folder (`src/test/` for today's shared fakes such as
  `src/test/playtest-db-fake.ts`). Reuse it across tests.
- **One contract suite per port** runs against the fake and the real adapter, so
  the fake cannot drift. The real adapter's run is an integration test against
  the Docker PostgreSQL or recorded HTTP fixtures.

  ```ts
  // src/modules/deck-building/testing/deck-repository.contract.ts
  /** Behavior every DeckRepository honours, in memory or in PostgreSQL. */
  export function describeDeckRepositoryContract(
    makeRepository: () => Promise<DeckRepository>
  ): void {
    it("finds no deck for an unknown id", async () => {
      const decks = await makeRepository();
      expect(await decks.findById(aDeckId("missing"))).toBeUndefined();
    });
  }
  // in-memory-deck-repository.test.ts and prisma-deck-repository.int.test.ts
  // both call describeDeckRepositoryContract(...) with their own factory.
  ```

- **HTTP goes through MSW** handlers built from recorded fixtures, adopted file by
  file, instead of new `fetch` stubs. MSW is not installed yet; until it is, keep
  to the file's existing style.
- **No new `vi.mock` of an internal module** (anything under `@/`). Inject a fake
  through the port instead. Existing internal mocks are phased out context by
  context.
- **Remaining mocks use the typed form**, so a moved file fails `tsc` instead of
  leaving the mock silently stale. This applies to framework modules that cannot
  run in jsdom (`next/navigation`, `next/headers`) and to a temporary seam where
  no port exists yet:

  ```ts
  vi.mock(import("next/navigation"), async (importOriginal) => ({
    ...(await importOriginal()),
    useRouter: () => router,
  }));
  ```

- Mock the leaf module that does the I/O, never a barrel.

## Legacy Path: untested or oversized code

Before you split, move or change a large file without tests at its public
surface:

1. Pin its current behavior with **characterization** or **approval** tests at
   that surface: store actions, rendered output, route responses, export text.
   Name them `characterization: …`. They pin what the code does, bugs included;
   a test that pins a known bug says so in its name.
2. Change the structure under that net, in structural commits only.
3. Then start the normal Red cycle for any new behavior. A bug pinned in step 1
   is fixed in its own `fix/` PR, whose Red test replaces the characterization.

The first candidates are the deck store, the builder page, `DeckWizard`, the
playtest engine and the AI routes.

## Forbidden Moves

Never do these to get to green, unless the PR states that the requirement
changed and the owner agreed:

- delete a test or an assertion, or weaken one (`toBeTruthy` or `toBeDefined`
  where a value was checked);
- disable a test: `.skip`, `.todo`, a committed `.only`, or commenting it out;
- paste the actual output into the expected value without checking it, or
  re-approve a snapshot or approval file without explaining the change;
- edit a test and the production code in the same step to make them agree.

## Stop Signals

Stop and report instead of pushing on when you notice:

- the same failure three times in a row;
- functionality nobody asked for, even when it looks like the next step;
- any urge to make one of the forbidden moves above.

## Commits

A commit is either structural (`refactor:`; no assertion changes, tests green
before and after) or behavioral (`feat:` or `fix:`; carries its Red test). Never both.

## Mutation Testing

StrykerJS on `domain/` folders is planned, advisory at first (nightly, then
incremental on changed files). Once it runs, a surviving mutant in changed code
is a missing test-list item: write the test, do not suppress the mutant.

## Verification And Delivery

Run focused tests first, then the relevant regression suite and project gates.
Add integration or E2E coverage for affected journeys according to the project's
validation strategy; unit tests do not establish that a real integration works.
If a Playwright journey fails while no unit or sociable test does, add the
lower-level test before fixing.
Honor the target project's execution-location and permission constraints.
If execution is blocked, report the blocker and do not claim a completed TDD cycle.

Record the test list, the observed Red, the minimal Green, any refining refactor
and the actual verification results in the PR (the template has a section for
each). Documentation-only changes do not require an artificial Red test. This
skill does not authorize commits, pushes or merges.
