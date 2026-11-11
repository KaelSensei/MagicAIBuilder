# Quality Gate — MagicAIBuilder 🧪

> What blocks a merge today, what is only reported, and what is planned. The pre-PR gate itself is in [`CLAUDE.md`](../../CLAUDE.md); this page explains it and must agree with it. The Definition of Done is [definition-of-done.md](definition-of-done.md).

## What blocks today

| Gate                                                    | Where it runs                                                   | What fails it                                                 |
| ------------------------------------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------- |
| `pnpm audit --prod --audit-level=high`                  | `.github/workflows/ci.yml`                                      | a high or critical advisory in the production dependency tree |
| `pnpm lint` (ESLint 9 flat config, `eslint.config.mjs`) | `ci.yml`; `eslint --fix` on staged files in the pre-commit hook | any lint error or warning (`--max-warnings 0`)                |
| `pnpm arch` (dependency-cruiser)                        | `ci.yml`                                                        | a cycle or a new boundary violation                           |
| `npx tsc --noEmit`                                      | `ci.yml`                                                        | a type error                                                  |
| `pnpm test:coverage`                                    | `ci.yml`                                                        | a failing test. No coverage threshold is enforced             |
| `pnpm build`                                            | `ci.yml`                                                        | a build error                                                 |
| Playwright suite in Docker (`scripts/e2e-pre-push.sh`)  | `.husky/pre-push`, on the developer's machine only              | a failing E2E test blocks the push. No CI workflow runs it    |

Branch protection, read with `gh api` on 2026-11-10: `main` requires the check `Lint, Typecheck, Test, Build` and an up-to-date branch. `dev` and `staging` have no protection rule; their PRs run the same check, and it must be green before a merge.

## What is reported but does not block

| Report                                     | Where                                       | Status                                                                                       |
| ------------------------------------------ | ------------------------------------------- | -------------------------------------------------------------------------------------------- |
| SonarCloud analysis                        | `sonar.yml` (job `continue-on-error: true`) | **Advisory** while the repository integration is repaired (`CLAUDE.md`). Record it in the PR |
| `pnpm audit --prod --audit-level=moderate` | `ci.yml` (step `continue-on-error: true`)   | Report only                                                                                  |
| Lighthouse CI (`lighthouserc.yml`)         | `lighthouse.yml`                            | Fails its own workflow below a category threshold; not a required check                      |

**One local hook still treats Sonar as blocking.** `.claude/settings.json` runs `scripts/pre-pr-sonar-gate.sh` before every `gh pr create`, and the script refuses while SonarCloud reports any open issue. Until it is changed to warn, use its escape `SONAR_GATE_OVERRIDE=1` and give the reason in the PR body.

### SonarCloud targets (advisory)

A regression against these targets is a finding to fix or to explain in the PR. It does not block the merge while Sonar is advisory. When the owner makes Sonar blocking again, this table and `CLAUDE.md` change in the same PR.

| Metric                                         | Target | Last recorded (2026-08-15) |
| ---------------------------------------------- | ------ | -------------------------- |
| Coverage, SonarCloud scope                     | ≥ 90%  | 94.5%                      |
| Bugs                                           | 0      | 0                          |
| Vulnerabilities                                | 0      | 0                          |
| Open issues                                    | 0      | 0                          |
| Code smells                                    | ≤ 10   | —                          |
| Duplicated lines                               | ≤ 3.0% | ≤ 3.0%                     |
| Reliability, security, maintainability ratings | A      | A                          |

**The SonarCloud coverage figure is not the repository's coverage.** `sonar-project.properties` excludes `src/app/**` and `src/components/**` from it. Vitest measures all of `src`: 48.5% on 2026-08-23 (the breakdown is in the comment in `vitest.config.ts`).

## Pre-PR checklist

Run in this order — see `CLAUDE.md` for the authoritative list:

```bash
npx tsc --noEmit      # zero errors
pnpm lint             # zero warnings
pnpm arch             # zero errors
pnpm test:coverage    # all passing — must run BEFORE sonar
pnpm sonar            # or rely on CI if it hangs locally
```

Then record the SonarCloud result in the PR. It is advisory, so open issues do not block the merge:
<https://sonarcloud.io/api/issues/search?componentKeys=KaelSensei_MagicAIBuilder&statuses=OPEN&ps=100>

> `pnpm sonar` does **not** regenerate coverage. Run `pnpm test:coverage` first, or the quality gate reads a stale `lcov` file.

## Architecture gate

`pnpm arch` runs dependency-cruiser twice on `src/`, test files excluded ([ADR 0007](../adr/0007-architecture-enforcement-in-stages.md), stage 3). Each rule's message says how to fix a breach.

| Half | Configuration                     | Graph                                                      | Fails on                                                                                                                                                                                                                                                         |
| ---- | --------------------------------- | ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | `.dependency-cruiser.cjs`         | every import, type-only ones included                      | a cycle; `src/lib` importing `src/components`, `src/hooks` or `src/app`; a component or hook importing `src/app` or Prisma; a breach of the `src/modules/<context>/` layers or entry points ([ADR 0002](../adr/0002-module-entry-points-index-server-client.md)) |
| 2    | `.dependency-cruiser.runtime.cjs` | the imports left once TypeScript erases the type-only ones | a runtime cycle; a `"use client"` module that reaches a module marked `server-only`, directly or through other imports                                                                                                                                           |

The layer rules are the ones ESLint checks import by import; dependency-cruiser adds cycles and the transitive view. The `src/modules/` rules match nothing until the first context moves in.

**Known violations.** The first half ignores the violations recorded in `.dependency-cruiser-known-violations.json`: the 11 layer violations and the 3 type-only cycles that existed when the gate arrived (21 entries, because the cycle through `src/lib/deck/types.ts` is a knot of 8 loops). Any other violation fails. A recorded violation that no longer occurs fails too, so the file shrinks in the pull request that fixes it:

```bash
pnpm exec depcruise src --config .dependency-cruiser.cjs --baseline --baseline-mode shrink-only
```

Never grow the file to get a change through; a pull request that adds an entry says why. The second half reads no baseline: both of its rules hold today.

**Information only.** A module that imports nothing and that nothing imports is listed under `no-orphans`. It never fails the run; deleting a feature is an owner decision.

**The graph.** `pnpm arch:graph` regenerates [dependency-graph.generated.md](dependency-graph.generated.md), the folder-level import graph in Mermaid.

## Planned gates

A gate marked `planned` does not exist yet. The gates land in stages ([ADR 0007](../adr/0007-architecture-enforcement-in-stages.md)), each in its own PR, which updates this table, `CLAUDE.md` and the agent rules. Until a gate exists, review checks its rule by hand.

| Stage | Gate                                                                                                                                                                                                                                               | Will block                                      | Status  |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- | ------- |
| 1     | ESLint 9 flat config replaces `next lint` and `.eslintrc.json` (`next lint` is deprecated, and removed in Next 16). A prerequisite for stages 3–4. Done in #1351                                                                                   | as today                                        | done    |
| 2     | The `server-only` package, with a Vitest stub. Done in #1356                                                                                                                                                                                       | a build that pulls server code into the browser | done    |
| 3     | dependency-cruiser (`pnpm arch`). Runtime cycles fail at once (there are none); the 3 existing type-only cycles and the known layer and context violations start in a recorded baseline that may only shrink. It also generates the Mermaid graphs | a cycle or a new violation                      | done    |
| 4     | ESLint `max-lines`, `max-lines-per-function` and `complexity`, with bulk suppressions as a ratchet                                                                                                                                                 | a new file over a limit, or a file that grows   | done    |
| 5     | Knip: unused files, dependencies and exports                                                                                                                                                                                                       | nothing: an advisory report                     | planned |
| 6     | `pnpm arch` joins the pre-PR gate in `CLAUDE.md`                                                                                                                                                                                                   | as stage 3                                      | done    |
| —     | `eslint-plugin-jsdoc`: `require-jsdoc` on exports, then `informative-docs`, starting in `src/modules/**` ([ADR 0006](../adr/0006-comment-and-documentation-standard.md))                                                                           | a missing or restating doc comment              | planned |
| —     | A lint rule for the typed `vi.mock(import("…"))` form and against new `vi.mock` of internal modules ([ADR 0005](../adr/0005-testing-strategy-fakes-contracts-and-characterization.md))                                                             | a string-path or internal mock                  | planned |
| —     | StrykerJS mutation testing on `domain/` folders: nightly, then incremental on changed files ([ADR 0005](../adr/0005-testing-strategy-fakes-contracts-and-characterization.md))                                                                     | nothing at first: advisory                      | planned |
| —     | Docs drift tests: glossary terms exist in code, the ADR index is complete, the dependency graph is generated ([ADR 0006](../adr/0006-comment-and-documentation-standard.md))                                                                       | a stale glossary, index or graph                | planned |

## Promotion gate

Feature and fix PRs target `dev`. Only a promotion PR from `dev` may target `staging`, and only a validated `staging` promotion may target `main`. The `staging` promotion is the QA alpha and colleague-validation checkpoint; `main` is release-only. QA currently validates the web app at desktop and mobile responsive viewports because no native mobile/TestFlight build exists yet.

Do not skip a branch, merge feature work directly into `staging` or `main`, or promote while a required quality check or QA sign-off is missing.

### Branch protection the settings cannot express

`delete_branch_on_merge` was enabled once and had to be reverted within minutes. It deletes the PR's **head** branch, and on a promotion PR (`staging` → `main`) the head is `staging`. Merging the first promotion after enabling it deleted `staging` from the remote. It was restored from `dev`, which carried the same commit, so nothing was lost — but the setting cannot distinguish a throwaway feature branch from a permanent one.

`scripts/git-prune.sh` is the right tool: it carries an explicit protected list (`main master develop dev staging production`) and only removes what is not on it.

### The scan must fail, not skip

`sonar.yml` carried `if: env.SONAR_TOKEN != ''` on the scan step. With no secret set, the step was skipped and **the job still reported success** — so every PR displayed a green SonarCloud check while nothing was analysed, and the "open issues = 0" line the checklist then carried was reading a months-old snapshot rather than the code under review. Thirteen batches shipped in one day under that green tick; the first real analysis afterwards found five issues, all in that day's code.

It now fails with an explicit error when the token is missing.

**Two `SONAR_TOKEN`s, and they are not the same thing.** The gitignored `.env.sonar` drives `pnpm sonar` on a developer machine. CI reads the **repository secret** of the same name, set under Settings → Secrets and variables → Actions. A local file does nothing for the pipeline, and having one is easy to mistake for having both.

**Fork PRs are the exception.** GitHub withholds secrets from workflows triggered by a fork, so that a modified workflow cannot exfiltrate them. That is a protection, not a misconfiguration, so the run must not fail on it — the workflow emits a `::warning::` instead, which is visible rather than quietly green. Since this repository is public, that path is reachable by any outside contributor.

> Prefer a **project-scoped analysis token** over a personal one: if it leaks it grants analysis on this project alone.

## E2E gate

`.husky/pre-push` runs the full Playwright suite in Docker via `scripts/e2e-pre-push.sh` and blocks the push on failure.

**The verdict always comes from the e2e container's exit code.** An earlier version branched on `claude -p "@e2e-runner ..."`, which exits 0 whenever the CLI ran — the agent's PASS/FAIL was only prose on stdout. The gate printed `✓ E2E passed — push allowed` on a run with 27 failures. The agent is still invoked, but only after a failure and purely to diagnose it; it cannot turn a red run green.

`SKIP_E2E=1` bypasses the gate in an emergency; say so in the PR. The script also exits early when `CI` is set, but **no GitHub workflow runs Playwright** (`ci.yml`, `sonar.yml` and `lighthouse.yml` were checked on 2026-11-10). The pre-push hook is therefore the only place the suite runs. Anything that reaches a branch without a local push — a Dependabot PR, a promotion merged on GitHub — or a push made with `SKIP_E2E=1` has had no E2E run.

### The report has to leave the container

The `e2e` service now bind-mounts `playwright-report/` and `test-results/`. Without them the report was written **inside** the container and destroyed by the `down -v` in the cleanup, so what remained on the host was whatever an older local run had left there. When this was found, the on-disk report was **six days old** while the script was telling the reader to check it for details of a run that had just failed.

The reporter is `[["list"], ["html", { open: "never" }]]`. `html` alone writes nothing to stdout, so a container log showed a run failing without naming a single failing test — the detail existed only in the report that never escaped. `list` puts it in the log, which is the one place a reader always has.

The pre-push script clears both directories before each run. Playwright overwrites `index.html` but leaves older attachments in `data/`, so without clearing, a reader browsing the folder can still open evidence from a previous run — a smaller version of the same lie.

### What the fresh report revealed

The first run after mounting caught the intermittent failure and, for the first time, named it:

- `deck-builder.spec.ts:55` — _back navigation returns to home_
- `community.spec.ts` — _public deck page, signed-out viewer_

The mechanism: `await page.locator('a[href$="/decks"]').first().click()` fires, and the URL **stays on `/builder/<id>`**. The navigation is started and then aborted, which lines up with the `useTranslations` context error in the dev-server log — the render for the destination throws, so the navigation never commits.

Two things ruled out along the way:

- **Not a missing provider in the tree.** `[locale]/layout.tsx` wraps everything, and `[locale]/not-found.tsx` supplies its own for the case where the layout bailed on an unsupported locale.
- **Not a missing `setRequestLocale` on the destination page.** That call is next-intl's documented requirement for static rendering and is currently in the layout only — but `/decks` is a `"use client"` page, and `setRequestLocale` is a server API, so it cannot be the fix there. Worth adding to the nine server pages on its own merits; it is not this bug.

**Hypothesis 3 (2026-08-19, mitigated): dev-mode on-demand compilation.** The gate's web server is `next dev` (`playwright.config.ts` → `pnpm dev`), so route segments compile on first visit — during the run, under full parallel load. A navigation that lands mid-compile can render a client component against a different instance of the next-intl context module than the one the provider captured, which is exactly "context from `NextIntlClientProvider` was not found": React logs it, retries on the client, and the in-flight navigation aborts. This fits every observed trait — intermittent, load-dependent, never reproducible deliberately (it is compile _timing_), always alongside that log line, and touching whichever spec happens to navigate first.

Mitigation: a `warmup` Playwright project (`e2e/warmup.setup.ts`) that the `chromium` project depends on visits every route segment the suite navigates before any test runs, so all compilation happens up front and nothing recompiles mid-run. Deliberately a dependency project, not `globalSetup` — it appears in the report, and project dependencies are guaranteed to run before the dependent project regardless of `PLAYWRIGHT_SPEC` narrowing.

The definitive fix would be testing a production build (`next build && next start`), which also would make `@perf` meaningful — but the auth bypass is deliberately dead when `NODE_ENV === "production"` (`requireAuth` checks it), so that requires redesigning the bypass gate first. Tracked, not done.

If the failure recurs _with_ the warmup in place, hypothesis 3 is wrong or incomplete — say so here rather than quietly re-running.

**Recurred — hypothesis 3 falsified as stated (2026-08-19, same day).** A later gate run failed 3 specs across unrelated files (community, deck-builder, playtest) with seven intl-context errors in the log, warmup active. Two observations survive: the run took 2.1 minutes against the usual ~1.4 — the host was visibly loaded (multiple Docker gate runs that day) — and the error still always accompanies the failures. So compile-timing may be _a_ trigger but is not _the_ mechanism; whatever it is, load widens it. The remaining credible path is the one already recorded: stop testing `next dev` and run the gate against a production build, which requires un-tying the auth bypass from `NODE_ENV` first — a security-relevant redesign that should not be done casually. Until then the flake is understood to be load-sensitive: avoid running other Docker builds while the gate runs.

**The gate no longer runs `next dev` (2026-11-11).** It builds the app once and serves the build with `next start` (see _E2E environment_), so nothing compiles during a run. The build is a _development_ build, so the auth bypass and its `NODE_ENV` guard are unchanged. A production build still needs the bypass redesign above. The same day, the `next dev` server of the gate had reached 3.9 GB RSS on the 7.7 GB host. The first run on the prebuilt server (sampled every 3 s): 83 passed in 3.8 minutes, against 6.8 + 2.3 minutes for the two `next dev` invocations in the gate run recorded in #1364; `next-server` peaked at 730 MB RSS; `next build` peaked at 3.3 GB for about a minute before the tests started; the whole gate took 5.8 minutes.

> **`retries` is 0 here, and stays 0.** Adding retries would stop a known intermittent failure from blocking, which is the sort of quiet loosening this gate has already been fixed for twice. Fix the flake, do not pad the gate.
>
> **The config no longer keys anything on `CI` (2026-08-22).** It read `retries: process.env.CI ? 2 : 0`, `workers: process.env.CI ? 1 : undefined` and `forbidOnly: !!process.env.CI` — and `CI` is set nowhere: not in the e2e container, and no GitHub workflow runs Playwright at all. **Every one of those branches was dead code that never took its intended value.** The retries side happened to land on the value this doc wanted, which is why it went unnoticed; the other two did not.
>
> - **`forbidOnly` was never enforced.** A single stray `test.only` would have narrowed the gate to one test and still reported green — the same shape as the hardcoded `PLAYWRIGHT_SPEC` that once ran 1 of 8 spec files while reporting a full green. It is now `true` outright.
> - **`trace: "on-first-retry"` could never fire**, since retries are 0. That is why the only forensic artifact any gate failure has ever produced is an aria snapshot — no network log, no DOM timeline, which is exactly what made the 2026-08-22 ratings failure undiagnosable from the report. Now `retain-on-failure`: a trace for a failing test, without adding retries.
> - **The suite now runs on one worker**, which is a fix for the flake rather than padding for it. Measured 2026-08-22 across the same 58 tests: **8–13 s per test under parallel load against ~2.5 s each serially** — a fourfold inflation the suite was inflicting on itself. Total wall clock rises only from 1m36 to **2m24**. This doc already recorded that a visibly loaded host stretched a run from ~1.4 to 2.1 minutes and told readers to avoid other Docker builds during the gate; that advice addressed _external_ load and never the load the run generated internally.
>
> **Correction — the real serial cost is ~3.4 minutes, not 2m24 (2026-08-22).** The 2m24 above was a projection from per-test timings, not a stopwatch on a full serial run. The first gate to actually run under `workers: 1` reported **58 passed, 1 skipped, 3.4m**. The direction of the change holds and the flake it removes is worth the minute, but budget the gate at ~3.5 minutes rather than 2.5. This is the second time on this change that a number taken from per-test durations proved optimistic — measure the whole run, do not extrapolate from its parts.

### Tests excluded from the blocking run

| Tag         | Rationale                                                                                                                                                   |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@external` | Depends on a third-party service (e.g. the live Moxfield API). A deck going private there turns the gate red with no code change on our side.               |
| `@perf`     | Asserts wall-clock latency. Under `next dev` one endpoint took 41 ms alone, 5163 ms under load. A prebuilt server on a busy host or CI runner still varies. |

Both are opt-out, not silent: `PLAYWRIGHT_GREP_INVERT=""` runs everything. Contract assertions from the same specs still run on every push; only the timing assertions are tagged.

### Toolchain pins

`Dockerfile.playwright` pins the Playwright image tag and pnpm. Playwright resolves browser binaries by a version-stamped path, so an image tag that drifts from `@playwright/test` makes every browser test fail to launch; unpinned pnpm resolves to whatever is latest, and pnpm 11 dropped `pnpm.overrides`, failing the frozen install outright. `src/lib/toolchain.test.ts` fails the unit suite if either pin diverges.

### E2E environment

`docker-compose.e2e.yml` runs as its own Compose project (`magicaibuilder-e2e`), so it never replaces the development `db` container. The `db` service starts Postgres 16 on a throwaway `pgdata_e2e` volume, removed by the `down -v` cleanup after every run. The `e2e` service waits for a TCP-level `pg_isready`, applies `prisma migrate deploy`, runs `next build`, then runs Playwright once for the `chromium` and `authenticated` projects, which serves that build with `next start`. Any non-zero exit fails the run.

The build is a development build: `next.config.ts` sets `experimental.allowDevelopmentBuild` when `E2E_DEVELOPMENT_BUILD=1` and `NODE_ENV=development`. A production build inlines `NODE_ENV="production"` into every bundle and so compiles out the `PLAYWRIGHT_TEST` bypass the specs seed their data through. The same settings skip the type check; `next build --no-lint` skips lint. CI and the pre-PR gate check both.

Every value below is a local test fixture, not a secret. No variable has to be exported on the host: the two `PLAYWRIGHT_*` controls are the only ones read from the host shell, and both have defaults.

| Variable                 | Service | Value                                                      | Purpose                                                                                                             |
| ------------------------ | ------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `POSTGRES_DB`            | `db`    | `magicaibuilder`                                           | Database created on the fresh volume.                                                                               |
| `POSTGRES_USER`          | `db`    | `magic`                                                    | Owner role used by the app and the health check.                                                                    |
| `POSTGRES_PASSWORD`      | `db`    | `magic_dev_only`                                           | Fixture password for that role; never reused outside the e2e stack.                                                 |
| `DATABASE_URL`           | `e2e`   | `postgresql://magic:magic_dev_only@db:5432/magicaibuilder` | Prisma connection for migrations and the app under test, addressed by the `db` service name.                        |
| `NEXT_PUBLIC_APP_URL`    | `e2e`   | `http://localhost:3000`                                    | Public base URL of the server Playwright drives.                                                                    |
| `AUTH_SECRET`            | `e2e`   | `playwright-test-secret`                                   | NextAuth signing secret; a fixed fixture because sessions are bypassed in test mode.                                |
| `GOOGLE_CLIENT_ID`       | `e2e`   | `playwright`                                               | Placeholder so the Google provider initialises; never contacted.                                                    |
| `GOOGLE_CLIENT_SECRET`   | `e2e`   | `playwright`                                               | Placeholder paired with the client ID.                                                                              |
| `PLAYWRIGHT_TEST`        | `e2e`   | `1`                                                        | Enables the auth bypass. `requireAuth` keeps it dead when `NODE_ENV` is `production`.                               |
| `NODE_ENV`               | `e2e`   | `development`                                              | Required by `allowDevelopmentBuild` at `next build` and `next start`; keeps the bypass compiled in.                 |
| `E2E_DEVELOPMENT_BUILD`  | `e2e`   | `1`                                                        | Makes `next.config.ts` allow the development build and `playwright.config.ts` serve it with `next start`.           |
| `PLAYWRIGHT_SPEC`        | `e2e`   | host value, default empty                                  | Narrows the run to one spec file. Empty means the full suite; the pre-push gate always forces it empty.             |
| `PLAYWRIGHT_GREP_INVERT` | `e2e`   | host value, default `@external\|@perf`                     | Tags excluded from the blocking run (see _Tests excluded from the blocking run_). Set it to `""` to run everything. |

`src/lib/toolchain.test.ts` fails the unit suite when the Compose file sets a variable this table does not list, so a new variable cannot ship undocumented.

## Lint ratchet

`eslint.config.mjs` enforces rules that the existing code does not meet yet (stage 4 of [ADR 0007](../adr/0007-architecture-enforcement-in-stages.md)). Each one is an `error`. The breaches that existed when a rule arrived are recorded in `eslint-suppressions.json` with [ESLint bulk suppressions](https://eslint.org/docs/latest/use/suppressions), which count breaches per file and per rule:

- a new file must meet every rule;
- a file with recorded breaches fails as soon as it has one more breach of the same rule;
- a file with fewer breaches than recorded also fails, with "There are suppressions left that do not occur anymore", until the count is pruned. The baseline can only go down.

| Rule                                            | Limit                                                    |
| ----------------------------------------------- | -------------------------------------------------------- |
| `max-lines`                                     | 300 code lines in a `.ts` module, 200 in a `.tsx` module |
| `max-lines-per-function`                        | 80 code lines                                            |
| `complexity`                                    | 15                                                       |
| `max-depth`                                     | 3 nested blocks                                          |
| `@typescript-eslint/max-params`                 | 3 parameters                                             |
| `@typescript-eslint/consistent-type-assertions` | no cast (`x as T`, `<T>x`); `as const` stays allowed     |
| `@typescript-eslint/no-non-null-assertion`      | no non-null assertion (`x!`)                             |
| `no-restricted-imports`                         | the import boundaries below                              |

Comments and blank lines never count toward a line limit, so the comment standard cannot push a module over one. The rules apply to shipped code: every `src/**/*.{ts,tsx}` file except `*.test.{ts,tsx}`, `src/test/**` and the `testing/` and `fixtures/` folders. Tests keep the preset rules, except for the `../` ban below.

The import boundaries, phase 1. `no-restricted-imports` matches the specifier as written, which is enough because cross-folder imports use the `@/` alias; dependency-cruiser adds the transitive view in stage 3.

- `src/lib` does not import `@/components`, `@/hooks` or `@/app`.
- `src/components` and `src/hooks` do not import `@/app`, `@/lib/db/prisma` or `@prisma/client`.
- Shipped code does not import `@/test` or a `testing/` folder.
- No file under `src`, tests included, imports a `../` path, which would slip past the rules above.
- `src/modules/*/domain/` and `index.ts` do not import React, Next.js, Zustand, Prisma or an outer layer; `src/modules/*/client/`, `ui/` and `client.ts` do not import Prisma, `server-only`, a `server.ts`, `application/` or `infrastructure/`. No module exists yet, so these bans start with no breach.

`next build` does not lint (`eslint.ignoreDuringBuilds` in `next.config.ts`): it calls the ESLint Node.js API, which ignores the suppressions file in ESLint 9. `pnpm lint` in CI and lint-staged on commit run the ESLint CLI, which applies it.

### Shrinking the baseline

1. Fix the breach: split the module, extract the function, flatten the nesting, replace the cast or the `!` with a type guard, a Zod parse at the boundary or `satisfies`, move the shared type down to the layer that owns it.
2. Run `pnpm lint --prune-suppressions`. It lowers the counts in `eslint-suppressions.json`, deletes the entries that reached zero and drops the paths that no longer exist.
3. Commit the smaller `eslint-suppressions.json` with the fix. The pre-commit hook lints staged files against it, so the commit fails until step 2 is done.

Never grow the file to get a change through. A pull request that adds or raises an entry says why in its description ([ADR 0007](../adr/0007-architecture-enforcement-in-stages.md), "Consequences").

A file move is the one routine case that re-records entries. They are keyed by path, so the moved file fails until `npx eslint <new paths> --suppress-all` records it again; `pnpm lint --prune-suppressions` then drops the old paths. The counts stay the same.

## Review protocol

1. Read the code and the diff.
2. Verify CI (audit, lint, typecheck, tests, build) and read the SonarCloud report (advisory).
3. Answer the review questions in `.agents/rules/tech-lead-skill.mdc` and check the [Definition of Done](definition-of-done.md).
4. No blocking gate red and no open finding → merge (a squash merge into `dev`).
5. Problems found → list them with a clear explanation, propose fixes, apply simple ones, open comments for structural ones.

### Feedback format

```
❌ Problem: <metric or behaviour>
📍 File: <path>:<line>
🔍 Why it matters: <clear explanation>
✅ Recommended fix: <concrete suggestion, with code if useful>
```

### Common problems

**Coverage dropped** — a new branch in a route handler with no test for the error path. Cover at minimum the nominal case plus the Prisma failure.

**Cognitive complexity too high** — SonarCloud flags a function above 15 (advisory, but the `clean-code` skill sets the same limit). Extract nested `if`/`switch` blocks into named functions.

**Duplication** — near-identical Zod validation across routes belongs in a shared schema under `src/lib/validation/`.

## Open QA backlog

Not blocking current merges, but to be addressed:

| Priority | Target                              | Description                                                                                     |
| -------- | ----------------------------------- | ----------------------------------------------------------------------------------------------- |
| ⚠️ P1    | `src/app/api/collection/route.ts`   | No auth or user-isolation tests                                                                 |
| ⚠️ P1    | `src/app/api/decks/route.ts`        | User isolation untested on GET                                                                  |
| ℹ️ P2    | `src/app/api/user/profile/route.ts` | Empty PATCH body and Prisma 500 untested                                                        |
| ℹ️ P2    | Builder deck hydration              | A cold page load of a seeded deck reaches the builder with an empty `cards` array — see PR #394 |

---

## SonarCloud rule exclusions

### S6747 — "Unknown property" (no longer suppressed)

`S6747` was suppressed for `src/components/landing/**` while that folder held a React Three Fiber scene, whose JSX props (`position`, `args`, `roughness`, …) SonarCloud cannot resolve. The scene left the page in #308 and its packages were removed later, so the suppression was removed too. The rule now applies to the whole repository.
