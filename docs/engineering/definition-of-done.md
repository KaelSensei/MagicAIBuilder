# Definition of Ready and Definition of Done

A **slice** is one pull request's worth of change: a feature, a fix, a refactoring or a
documentation change, small enough to review in one sitting. These two lists say when a slice may
start and when it is finished. They apply to humans and agents alike.

- The **Definition of Ready** protects the work from unclear goals. No tool can check a change
  against a requirement nobody wrote down.
- The **Definition of Done** protects the code base from half-finished work: untested behaviour,
  stale comments, unrecorded decisions.

Related: [tdd-with-ai.md](tdd-with-ai.md) (the method), [code-documentation.md](code-documentation.md)
(the comment standard), [architecture.md](architecture.md) (where code goes),
[quality-gate.md](quality-gate.md) (quality thresholds), `CLAUDE.md` (the pre-PR gate and the branch
flow).

## Definition of Ready

A slice is ready to start when every item below holds. An agent that finds an item missing asks
for it, or writes its assumption into the plan so the reviewer can check it.

|   # | Item                       | What it means                                                                                                                                                                                                                                    |
| --: | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
|   1 | **Domain language**        | The goal is written with the words of [CONTEXT.md](../../CONTEXT.md). A new term comes with a proposed definition.                                                                                                                               |
|   2 | **One primary context**    | The slice names the bounded context it changes. If it touches several, the point where they meet is stated.                                                                                                                                      |
|   3 | **Kind of change**         | Behavioural (`feat`, `fix`), structural (`refactor`, moves, renames) or documentation. A slice that needs both a behaviour change and a restructuring plans them as separate commits, or separate pull requests when the restructuring is large. |
|   4 | **Examples and test list** | Three to seven concrete examples ("given this deck, when the player does this, then that happens") that become the test list. Open questions are answered or explicitly deferred. Not required for a documentation-only slice.                   |
|   5 | **Entry point**            | The use case, route handler, store action or component where the outside-in test starts.                                                                                                                                                         |
|   6 | **Failure behaviour**      | What happens on invalid input, missing data, unauthorised access and an unavailable provider.                                                                                                                                                    |
|   7 | **States and viewports**   | For UI work: the empty, loading, error, partial and success states, on desktop and on a mobile viewport; the i18n keys needed, in English and French at least.                                                                                   |
|   8 | **Constraints**            | Authentication and ownership rules, performance expectations, and any external limit with its source.                                                                                                                                            |
|   9 | **Decision check**         | Whether the slice needs an ADR ([when to write one](../adr/README.md#when-to-write-an-adr)).                                                                                                                                                     |
|  10 | **Size**                   | About 400 changed production lines or fewer, renames excluded. Otherwise split into thinner vertical slices.                                                                                                                                     |
|  11 | **Safe ground**            | The files the slice will touch are checked against the pending branches; overlaps are listed. Before a giant file is split, characterization tests pin its behaviour, or writing them is the first step of the slice.                            |
|  12 | **Base branch**            | A `feature/*`, `fix/*`, `refactor/*` or `docs/*` branch created from `dev`.                                                                                                                                                                      |

## Definition of Done

A slice is done when every item below holds, or the pull request says why an item does not apply.

### Behaviour and tests

|   # | Item                                                                                                                                                                                                                                                         |
| --: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
|   1 | Every item of the test list is covered by a test that was seen failing first. The pull request shows the Red evidence: the focused command and the failure line, pasted, not paraphrased.                                                                    |
|   2 | A refactoring kept the tests green and unchanged before and after. A behaviour change found during a refactoring went into its own `fix/` pull request.                                                                                                      |
|   3 | No forbidden move: no deleted or weakened test or assertion, no `.skip` or committed `.only`, no actual output copied into an expected value without checking it, no new `vi.mock` of an internal module ([tdd-with-ai.md](tdd-with-ai.md#forbidden-moves)). |
|   4 | Remaining mocks use the typed `vi.mock(import("…"))` form; new ports have an in-memory fake and a contract suite.                                                                                                                                            |
|   5 | If a user journey changed, the Playwright spec covering it changed too.                                                                                                                                                                                      |

### Code

|   # | Item                                                                                                                                                                                                                |
| --: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|   6 | Structural and behavioural changes are in separate commits, and each commit message says which kind it is.                                                                                                          |
|   7 | New code sits in the context and layer that owns it ([architecture.md](architecture.md#where-does-this-code-go)). No new import against the layer rules.                                                            |
|   8 | The house TypeScript rules hold: no `any`, no `as`, no non-null `!`, exhaustive `never` guards, `readonly` by default.                                                                                              |
|   9 | User-facing strings go through next-intl, in every locale under `src/messages/<locale>/` (English and French written properly).                                                                                     |
|  10 | Once the tools exist: the dependency-cruiser baseline and the ESLint suppressions did not grow, or the pull request justifies each new entry; the mutation score of changed `domain/` files is reported (advisory). |

### Documentation

|   # | Item                                                                                                                                                                                                                                                          |
| --: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|  11 | Every new or touched module has a header; every new or changed export has a contract comment; every game rule cites its Comprehensive Rules number; every external limit cites its source and the date read ([code-documentation.md](code-documentation.md)). |
|  12 | Comments in the changed functions and their module headers are still true.                                                                                                                                                                                    |
|  13 | New or renamed domain terms are in [CONTEXT.md](../../CONTEXT.md). A decision that met the ADR test has an ADR, and the [ADR index](../adr/README.md) lists it.                                                                                               |
|  14 | When behaviour changed: the context's functional document (`docs/functional/<context>.md`, once it exists) and, for a visible change, the [user guide](../product/user-guide.md) are updated.                                                                 |
|  15 | `docs/project/changelog.md`, `docs/project/progress.md` and `docs/product/roadmap.md` are untouched; they change only in the `chore/docs` pull request after a merge batch.                                                                                   |

### Verification

|   # | Item                                                                                                                                                |
| --: | --------------------------------------------------------------------------------------------------------------------------------------------------- |
|  16 | The pre-PR gate of `CLAUDE.md` passes: `npx tsc --noEmit` with zero errors, `pnpm lint` with zero warnings, `pnpm test` passing.                    |
|  17 | `pnpm sonar` was run when credentials allow, and the SonarCloud status is recorded. It is advisory.                                                 |
|  18 | The pre-push Docker E2E gate passed, or its exception is documented.                                                                                |
|  19 | For a documentation-only slice: Prettier formatted the files, every relative link resolves and every Mermaid block parses. No Red test is required. |

### Pull request

|   # | Item                                                                                                                                                                                                                                                         |
| --: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
|  20 | The pull request targets `dev`. Its body states why (with evidence), what changed, the test list, the Red evidence, the verification commands and their results, whether the change is structural or behavioural, the documents touched, and any follow-ups. |
|  21 | Review findings are fixed or answered.                                                                                                                                                                                                                       |

Promotion to `staging` and `main`, and the QA validation on desktop and mobile viewports, happen
after merge, on the promotion pull requests described in `CLAUDE.md`.
