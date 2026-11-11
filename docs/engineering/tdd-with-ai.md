# TDD with an AI

TDD remains the same contract: the test describes an expected behaviour, the code answers that
need, then the design improves without changing the behaviour. The AI mainly changes how the Green
is obtained.

> This document was translated from the French original on 2026-11-10
> ([ADR 0008](../adr/0008-english-only.md)) and extended with the testing decisions of
> [ADR 0005](../adr/0005-testing-strategy-fakes-contracts-and-characterization.md): the test list,
> outside-in tests from the use case, fakes and contract tests, the mocking policy,
> characterization tests, structural and behavioural commits, and the forbidden moves. The cycle
> and its three names are unchanged. The `tdd` skill (`.agents/skills/tdd/SKILL.md`) applies this
> method; when they disagree, this document wins.

## The work cycle

### Before the cycle: the test list

Before the first Red, write the **test list**: the behaviours the change must cover, one line
each, in domain words ([CONTEXT.md](../../CONTEXT.md)). Include the happy path, the edge cases and
the failure behaviour. The list is a plan, not code: turn **one** item at a time into a test.

The list goes into the plan and into the pull request. When the cycle reveals a new behaviour, add
it to the list rather than to the code under way. When an item turns out to be unnecessary, strike
it out and say why.

### Red

State a single observable behaviour, then write the smallest possible test. Run that test and
check that it fails for the right reason. For a bug, this test is first a reproduction and becomes
the regression test.

Record the focused command and the failure line, for example
`npx vitest run src/lib/playtest/engine.test.ts -t "first mulligan is free"` followed by the
failing assertion. The pull request must show this Red evidence
([definition-of-done.md](definition-of-done.md)). Never describe a test as failing without having
run it.

### Super Green

Ask the AI for a minimal implementation, but clean from the start: good naming, right placement,
clear responsibility, strict typing and consistent error handling. This does not mean designing
the final state of the system. An enum, a factory or an abstraction exists only once a test makes
it useful.

Super Green therefore does not abolish the TPP (Transformation Priority Premise). The structure can
be clean while the behaviour still progresses by small transformations: constant, scalar,
invariant, conditional, then loop.

### Refining Refactoring

When the tests are green, the design can improve: clarify a business boundary, isolate a
responsibility that has really emerged, remove duplication or simplify a flow. Each step preserves
behaviour and stays verifiable. Do not deliberately create a dirty Green to justify a second
tidying pass.

A refactoring step is a **structural** change: it needs no new Red, and the tests stay green and
unchanged before and after it. If a step changes behaviour, it is not a refactoring; start a new
Red.

## Which tests to write?

By default, MagicAIBuilder favours sociable tests: they cross a stable boundary, such as a store
action, a use case, a route or the visible behaviour of a component, with in-memory collaborators.
They survive the AI moving classes and methods around much better.

Solitary tests remain suited to pure functions, parsers and isolated algorithmic policies. External
dependencies are simulated at their boundary, but internal collaborators are not mocked to impose a
structure.

**New features are tested outside-in, from the use case.** The first test calls the use case (or,
until a context has use cases, the route handler or the store action that plays that role) with
in-memory adapters, and states the behaviour the player sees. That test drives the domain functions
the use case needs; write solitary tests only for the policies that are complex on their own. The
adapter (Prisma, provider client) comes last, with its contract test.

| What you test                         | Style                                                     | Collaborators                                 |
| ------------------------------------- | --------------------------------------------------------- | --------------------------------------------- |
| Pure rule or calculation (`domain/`)  | Solitary, examples and tables                             | None                                          |
| Use case (`application/`)             | Sociable, outside-in                                      | In-memory fakes of its ports                  |
| Prisma repository (`infrastructure/`) | Contract test                                             | Real PostgreSQL                               |
| Provider adapter (`infrastructure/`)  | Adapter test on a recorded fixture                        | MSW                                           |
| Route handler                         | Sociable: call the exported `GET`/`POST` with a `Request` | Fakes, or the boundary mocks that exist today |
| Component                             | Testing Library: roles, user events, visible behaviour    | MSW or an injected store                      |
| User journey                          | Playwright (`e2e/`)                                       | The real stack                                |

## Replacing collaborators

- **Owned ports get hand-written in-memory fakes.** A fake is a small, readable implementation of
  the port, such as `src/test/playtest-db-fake.ts`. Tests assert on the fake's resulting state, not
  on which methods were called.
- **Each port has one shared contract suite** that runs against the fake and against the real
  adapter. A fake that passes the contract can be trusted; one that does not is a liability.
- **HTTP is replaced with MSW** handlers built from recorded provider responses (`*-v1.ts`
  fixtures), not with `fetch` stubs. Adopt MSW per test file: many existing files stub the global
  `fetch`, and a global server would intercept underneath them. See
  [Network in tests](#network-in-tests).
- **No new `vi.mock` of an internal module.** A `vi.mock("@/lib/…")` is keyed on a file path: when
  the file moves, the mock silently stops applying and the real module runs. It also lets a test
  pass whatever the code does. Existing internal mocks are phased out context by context.
- **Mocks that remain use the typed form**, so a moved or renamed file makes `tsc` fail instead of
  leaving the mock stale:

  ```ts
  vi.mock(import("next/navigation"), async (importOriginal) => ({
    ...(await importOriginal()),
    useRouter: () => router,
  }));
  ```

  Mocks remain acceptable for framework modules that cannot run in jsdom (`next/navigation`,
  `next/headers`, `next/cache`) and, temporarily, where no port exists yet.

- **Outgoing notifications** with no observable state (an email sent, an event published) use a
  recording fake that keeps a list of what was sent.

## Network in tests

Pick the double by who owns the other side of the port:

| The code talks to                                                                         | Replace it with                                                                     |
| ----------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| A third party over HTTP (Commander Spellbook, Scryfall, EDHREC, MTGTop8, model providers) | MSW handlers that serve a recorded response                                         |
| A port this project owns (a repository, a store, a cache)                                 | A hand-written in-memory fake (`src/test/*-fake.ts`), never MSW and never `vi.mock` |

For HTTP, call `useMsw` from `src/test/msw.ts` once per test file, at the top of the file or of
its outer `describe`:

```ts
const server = useMsw(
  http.post(SPELLBOOK_FIND_MY_COMBOS_URL, () =>
    HttpResponse.json(FIND_MY_COMBOS_RECORDED)
  )
);

it("degrades to 502 when Spellbook fails", async () => {
  server.use(
    http.post(SPELLBOOK_FIND_MY_COMBOS_URL, () =>
      HttpResponse.json({}, { status: 500 })
    )
  );
  // …
});
```

- The handlers serve a recorded response (a `*-v1.ts` fixture that says where and when it was
  recorded), not a shape written from memory.
- A request no handler serves never reaches the network, and it fails the test that sent it, even
  when the code under test catches the error. Add a handler, or find out why the request was sent.
- A handler added with `server.use` lasts one test. To assert on what was sent, record the
  `request` in the handler and assert on the list, not on a `fetch` spy.
- The helper works in both the `node` and `jsdom` environments. MSW 3 no longer patches timers:
  to test a timeout, fire the client's abort signal from the handler instead of waiting.
- New tests never stub the global `fetch` (`vi.stubGlobal("fetch", …)`) and never `vi.mock` an
  internal module. Existing `fetch` stubs move to MSW file by file;
  `src/app/api/combos/route.test.ts` is the first converted file and the example to copy.

## Changing code that has no tests

Before restructuring code that lacks tests at its public surface, pin its current behaviour with
**characterization tests** (or approval tests for large outputs such as exports and prompts). They
record what the code does today, odd behaviour included, so that the restructuring cannot change it
unnoticed. Name them so a reader knows they pin current behaviour, for example
`it("characterization: keeps the partner row when the commander is removed", …)`.

This is required before splitting the giant files: the deck store (`src/lib/deck/store.ts`), the
builder page (`src/app/[locale]/builder/[deckId]/page.tsx`), `DeckWizard`
(`src/components/deck/DeckWizard.tsx`), the playtest engine (`src/lib/playtest/engine.ts`) and the
AI routes (`src/app/api/ai/**`).

A characterization test that pins a bug stays until a separate `fix/` pull request changes the
behaviour on purpose, with its own Red test.

## Commits: structural or behavioural

Never mix structural and behavioural changes in one commit.

- A **structural** commit (rename, move, extract, inline, delete dead code, reformat) keeps
  behaviour. The tests pass unchanged before and after it. Its message says so, for example
  `refactor(playtest): extract the bottom choice into its own function`.
- A **behavioural** commit (`feat:`, `fix:`) adds or changes behaviour and comes with its Red test.
- A pull request may hold both kinds, as separate commits. A structural change larger than about
  200 changed lines, or one that moves files between contexts, gets its own pull request.
- A behaviour change discovered during a refactor gets its own `fix/` pull request. It is never
  hidden inside the refactor.

## Forbidden moves

- Deleting a test, or weakening an assertion, to make a change pass.
- Disabling a test: `.skip`, a committed `.only`, or commenting it out.
- Copying the actual output into the expected value without checking that it is right, including
  re-approving a snapshot without saying why the new output is correct.
- Rewriting a test so that it passes against the new code when the requirement did not change.
- Adding a `vi.mock` of an internal module.
- Writing several failing tests and making them pass together.

If a test seems wrong, say so and stop; change it only when the requirement changed, and say which.

## Contract for the agent

At each increment, the agent must:

1. write or update the test list, and name the targeted behaviour and the test file;
2. write and run the Red, and record the command and the failure;
3. produce the smallest clean Super Green;
4. run the targeted test, then the tests of the touched files and their neighbours;
5. propose a Refining Refactoring separately, as a structural commit, if the design justifies it.

The agent must not anticipate future needs, rewrite the tests to make its code pass, or mix a
feature with a general overhaul. E2E tests complement this cycle when a real journey or an
integration requires it.

The agent stops and asks for direction when:

- it goes round in circles: the same failure after several attempts;
- the next step would add functionality nobody asked for, even a reasonable one;
- making a test pass seems to require one of the forbidden moves.

## Measuring test quality

Coverage says which lines ran, not whether a wrong result would be noticed. Mutation testing does:
it changes the code in small ways and checks that a test fails. StrykerJS runs on the `domain/`
folders, advisory at first (nightly and incremental on changed files). A surviving mutant is a
missing or weak assertion.

## Further reading

- Kent Beck, [Canon TDD](https://newsletter.kentbeck.com/p/canon-tdd), 2023-12-11.
- Kent Beck, [Augmented Coding: Beyond the Vibes](https://newsletter.kentbeck.com/p/augmented-coding-beyond-the-vibes),
  2025-06-25.
- Robert C. Martin, [The Transformation Priority Premise](https://blog.cleancoder.com/uncle-bob/2013/05/27/TheTransformationPriorityPremise.html),
  2013-05-27.
- WealCome (Michaël Azerhad), [TDD and Clean Architecture with Node.js and TypeScript](https://wealcomecompany.com/wealcome-nodejs-tdd-clean-architecture-formation):
  outside-in on a hexagonal architecture, "mostly classicist".
- J. B. Rainsberger, [Getting Started with Contract Tests](https://blog.thecodewhisperer.com/permalink/getting-started-with-contract-tests),
  2017-06-25.
- Michael Feathers, _Working Effectively with Legacy Code_ (2004): characterization tests.
- Vitest, [Mocking modules](https://vitest.dev/guide/mocking/modules).
