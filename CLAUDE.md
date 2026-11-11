# MagicAIBuilder — Project Instructions

Stack: Next.js 15 (App Router) · React 19 · TypeScript strict · Prisma + PostgreSQL · Zustand · TanStack Query · next-intl · Auth.js · Vitest · Playwright · SonarCloud (advisory)

**English only.** Code, identifiers, comments, docs, ADRs, commits and PR bodies are in English. Locale files under `src/messages/<locale>/` are the only exception ([ADR 0008](docs/adr/0008-english-only.md)).

## Before you start, before you finish

Before you start:

1. Read the always-on rules in [`.agents/rules/`](.agents/rules/) (`alwaysApply: true`) and load the skill for the job (table below).
2. Branch from `origin/dev`. Check whether an open PR or a pending branch edits the files you plan to touch.
3. Check the task against the [Definition of Ready](docs/engineering/definition-of-done.md), then write the test list in domain language.

Before you finish:

1. Run the pre-PR gate below.
2. Check every item of the [Definition of Done](docs/engineering/definition-of-done.md).
3. Fill every section of the [PR template](.github/pull_request_template.md): test list, Red evidence, verification, docs touched.
4. Push, open a PR or merge only when the owner asks.

## Skills — load these for the right job

| Task                                  | Skill                                                                                          |
| ------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Writing/reviewing TypeScript or React | `typescript-craftsmanship`                                                                     |
| Refactoring, DRY, code smells         | `clean-code`                                                                                   |
| Where does this code live? Layers     | `clean-architecture`                                                                           |
| Test-first / TDD                      | `tdd`                                                                                          |
| Auditing a file or PR                 | `/code-review` + `/security-review`, with the questions in `.agents/rules/tech-lead-skill.mdc` |
| Perf / Core Web Vitals                | `web-performance`                                                                              |

Skills own the coding standards — no `any`/`as`/`!`, exhaustive `never` guards, discriminated unions, `readonly` by default, single-pass algorithms, Map/Set for lookups, memoization, fine-grained Zustand selectors, serialized async, error boundaries, file-size limits, naming conventions, JSDoc on exports, etc. **Do not duplicate those rules in this file.** If a rule is missing from a skill, add it to the skill, not here.

### Module structure

Code moves, one bounded context at a time, to `src/modules/<context>/` with the layers `domain/`, `application/`, `infrastructure/`, `client/` and `ui/`, and three entry points: `index.ts` (pure), `server.ts` (`import "server-only"`) and `client.ts`.
`src/app/**` only parses input, calls one use case and maps the result. Map and rules: [architecture.md](docs/engineering/architecture.md), [ADR 0001](docs/adr/0001-modular-monolith-by-bounded-context.md), [ADR 0002](docs/adr/0002-module-entry-points-index-server-client.md).

### Comment standard

Comments carry information, never paraphrase: a module header, a TSDoc contract on every export (what, input constraints, errors, why), a CR number on every game rule, a URL and date on every external limit.
Templates: [code-documentation.md](docs/engineering/code-documentation.md); decision: [ADR 0006](docs/adr/0006-comment-and-documentation-standard.md).

### TDD contract

The authoritative method is [`docs/engineering/tdd-with-ai.md`](docs/engineering/tdd-with-ai.md)
and [`.agents/rules/tdd-skill.mdc`](.agents/rules/tdd-skill.mdc):
**Red -> Super Green -> Refining Refactoring**. Prefer sociable tests at stable
behavioral boundaries; use solitary tests for pure policies and algorithms.
Super Green means production-quality structure now, not speculative final
architecture. A PR must record the focused Red failure and the verification
performed after implementation.

Every plan starts with a test list. Owned ports get hand-written in-memory fakes plus one shared contract suite; no new `vi.mock` of an internal module, and remaining mocks use the typed `vi.mock(import("…"))` form.
Pin a large file with characterization tests before splitting it. Never delete, skip or weaken a test to get green. Keep structural and behavioural changes in separate commits.
Details: the `tdd` skill and [ADR 0005](docs/adr/0005-testing-strategy-fakes-contracts-and-characterization.md).

## Project-specific rules (not covered by any skill)

### Branch flow — dev → staging → main

The branches have distinct release roles:

- `dev`: daily integration of features and fixes.
- `staging`: QA alpha candidate and colleague validation. Mobile QA currently means responsive web viewport checks; there is no native mobile/TestFlight build yet.
- `main`: validated release code only.

PRs follow this promotion chain:

1. `feature/*` / `fix/*` PRs target **`dev`** (never `staging` or `main` directly).
2. A reviewed promotion PR moves `dev` into **`staging`** for the QA alpha cycle.
3. QA validates desktop and mobile viewport journeys on `staging`; TestFlight is conditional on a future native mobile build.
4. After QA and colleague validation, a reviewed promotion PR moves `staging` into **`main`**.
5. Never skip a branch or merge a feature directly into `staging` or `main`.

**Promote with `gh pr merge --rebase`, not a merge commit.** A merge commit is created _on the target_, so `dev` gained commits `staging` never received and `main` gained commits neither had. Content stayed identical while the histories drifted — after fifteen batches in one day, GitHub reported `staging` as **26 commits behind `main`** with zero files different. Rebasing the promotion keeps all three branches on the same commit.

Feature and fix PRs are squash-merged into `dev`. Promotion branches are long-lived and must preserve the branch order above.

**Never enable `delete_branch_on_merge` on this repository.** It deletes the PR's _head_ branch, and on a promotion PR the head is `staging` or `dev`. Turning it on deleted `staging` outright the first time a promotion merged; it was restored from `dev`, which held the same commit, but the setting is fundamentally incompatible with promoting long-lived branches through PRs. Use `scripts/git-prune.sh` for cleanup instead — it has an explicit protected list.

### Documentation discipline

Feature branches MUST NOT modify `docs/project/changelog.md`, `docs/project/progress.md`, or `docs/product/roadmap.md`. These are updated in a dedicated `chore/docs` PR after each merge batch to avoid rebase conflicts.

### Pre-PR gate — mandatory, with advisory Sonar

1. `npx tsc --noEmit` — zero errors
2. `pnpm lint` — zero warnings
3. `pnpm arch` — zero errors: dependency-cruiser checks cycles, the layer rules and the browser/server boundary ([quality-gate.md](docs/engineering/quality-gate.md#architecture-gate))
4. `pnpm test` — all passing
5. `pnpm sonar` — run when credentials and the local environment are available; otherwise document the limitation and rely on CI
6. SonarCloud status — record the result, but it is **advisory** while the repository integration is being repaired:
   - https://sonarcloud.io/project/issues?issueStatuses=OPEN&id=KaelSensei_MagicAIBuilder
   - API: https://sonarcloud.io/api/issues/search?componentKeys=KaelSensei_MagicAIBuilder&statuses=OPEN&ps=100

The gates still to come are listed in [quality-gate.md](docs/engineering/quality-gate.md#planned-gates) ([ADR 0007](docs/adr/0007-architecture-enforcement-in-stages.md)).

## Deep reference

- [docs/engineering/architecture.md](docs/engineering/architecture.md): the context map, the layers and where code goes.
- [docs/adr/README.md](docs/adr/README.md): every architecture decision, and when to write a new one.
- [CONTEXT.md](CONTEXT.md): the ubiquitous language of each bounded context.
- [docs/engineering/quality-gate.md](docs/engineering/quality-gate.md): what blocks a merge today, and what is planned.
- `docs/references/typescript-patterns.md`: the pattern catalog with before/after examples. Its "Known Issues" list predates the current code; check each item before acting on it.
