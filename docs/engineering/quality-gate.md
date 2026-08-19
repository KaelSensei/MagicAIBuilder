# Quality Gate — MagicAIBuilder 🧪

> Source of truth for project quality. Any regression against the baseline triggers corrective action.

## Baseline (2026-08-15)

| Metric                     | Baseline | Minimum | Status |
| -------------------------- | -------- | ------- | ------ |
| **Coverage**               | 94.5%    | ≥ 90%   | ✅     |
| **Bugs**                   | 0        | = 0     | ✅     |
| **Vulnerabilities**        | 0        | = 0     | ✅     |
| **Open issues**            | 0        | = 0     | ✅     |
| **Duplicated Lines**       | ≤ 3.0%   | ≤ 3.0%  | ✅     |
| **Reliability Rating**     | A        | A       | ✅     |
| **Security Rating**        | A        | A       | ✅     |
| **Maintainability Rating** | A        | A       | ✅     |
| **Unit tests**             | 1764     | —       | ℹ️     |
| **E2E tests**              | 51       | —       | ℹ️     |

## Blocking thresholds

A PR is **blocked** when it regresses any of these:

| Metric             | Hard threshold              |
| ------------------ | --------------------------- |
| Coverage           | Must not fall below **90%** |
| Bugs               | Must stay at **0**          |
| Vulnerabilities    | Must stay at **0**          |
| Reliability Rating | Must stay at **A**          |
| Security Rating    | Must stay at **A**          |
| Duplicated Lines   | Must not exceed **3.0%**    |
| Code Smells        | Must not exceed **10**      |

## Pre-PR checklist

Run in this order — see `CLAUDE.md` for the authoritative list:

```bash
npx tsc --noEmit      # zero errors
pnpm lint             # zero warnings
pnpm test:coverage    # all passing — must run BEFORE sonar
pnpm sonar            # or rely on CI if it hangs locally
```

Then confirm SonarCloud reports **zero open issues**:
<https://sonarcloud.io/api/issues/search?componentKeys=KaelSensei_MagicAIBuilder&statuses=OPEN&ps=100>

> `pnpm sonar` does **not** regenerate coverage. Run `pnpm test:coverage` first, or the quality gate reads a stale `lcov` file.

### Branch protection the settings cannot express

`delete_branch_on_merge` was enabled once and had to be reverted within minutes. It deletes the PR's **head** branch, and on a promotion PR (`staging` → `dev`) the head is `staging`. Merging the first promotion after enabling it deleted `staging` from the remote. It was restored from `dev`, which carried the same commit, so nothing was lost — but the setting cannot distinguish a throwaway feature branch from a permanent one.

`scripts/git-prune.sh` is the right tool: it carries an explicit protected list (`main master develop dev staging production`) and only removes what is not on it.

### The scan must fail, not skip

`sonar.yml` carried `if: env.SONAR_TOKEN != ''` on the scan step. With no secret set, the step was skipped and **the job still reported success** — so every PR displayed a green SonarCloud check while nothing was analysed, and the "open issues = 0" line in the checklist above was reading a months-old snapshot rather than the code under review. Thirteen batches shipped in one day under that green tick; the first real analysis afterwards found five issues, all in that day's code.

It now fails with an explicit error when the token is missing.

**Two `SONAR_TOKEN`s, and they are not the same thing.** The gitignored `.env.sonar` drives `pnpm sonar` on a developer machine. CI reads the **repository secret** of the same name, set under Settings → Secrets and variables → Actions. A local file does nothing for the pipeline, and having one is easy to mistake for having both.

**Fork PRs are the exception.** GitHub withholds secrets from workflows triggered by a fork, so that a modified workflow cannot exfiltrate them. That is a protection, not a misconfiguration, so the run must not fail on it — the workflow emits a `::warning::` instead, which is visible rather than quietly green. Since this repository is public, that path is reachable by any outside contributor.

> Prefer a **project-scoped analysis token** over a personal one: if it leaks it grants analysis on this project alone.

## E2E gate

`.husky/pre-push` runs the full Playwright suite in Docker via `scripts/e2e-pre-push.sh` and blocks the push on failure.

**The verdict always comes from the e2e container's exit code.** An earlier version branched on `claude -p "@e2e-runner ..."`, which exits 0 whenever the CLI ran — the agent's PASS/FAIL was only prose on stdout. The gate printed `✓ E2E passed — push allowed` on a run with 27 failures. The agent is still invoked, but only after a failure and purely to diagnose it; it cannot turn a red run green.

`SKIP_E2E=1` bypasses the gate in an emergency. CI skips it too, having its own job.

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

> **`retries` is 0 here.** `playwright.config.ts` sets `retries: process.env.CI ? 2 : 0`, and `CI` is not set inside the e2e container — nor does the GitHub workflow run e2e at all, so the retry setting has never applied anywhere. The gate that blocks pushes therefore runs in the least forgiving mode, with full parallelism. That is deliberate for now: adding retries would stop a known intermittent failure from blocking, which is the sort of quiet loosening this gate has already been fixed for twice. Fix the flake, do not pad the gate.

### Tests excluded from the blocking run

| Tag         | Rationale                                                                                                                                                   |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@external` | Depends on a third-party service (e.g. the live Moxfield API). A deck going private there turns the gate red with no code change on our side.               |
| `@perf`     | Asserts wall-clock latency against `next dev`, which compiles routes on demand — one endpoint measured 41 ms alone and 5163 ms under full-suite contention. |

Both are opt-out, not silent: `PLAYWRIGHT_GREP_INVERT=""` runs everything. Contract assertions from the same specs still run on every push; only the timing assertions are tagged.

### Toolchain pins

`Dockerfile.playwright` pins the Playwright image tag and pnpm. Playwright resolves browser binaries by a version-stamped path, so an image tag that drifts from `@playwright/test` makes every browser test fail to launch; unpinned pnpm resolves to whatever is latest, and pnpm 11 dropped `pnpm.overrides`, failing the frozen install outright. `src/lib/toolchain.test.ts` fails the unit suite if either pin diverges.

## Review protocol

1. Read the code and the diff.
2. Verify CI (lint / typecheck / tests / build) and SonarCloud.
3. Metrics stable or improved, no regression → merge.
4. Metrics degraded or problems found → list them with a clear explanation, propose fixes, apply simple ones, open comments for structural ones.

### Feedback format

```
❌ Problem: <metric or behaviour>
📍 File: <path>:<line>
🔍 Why it matters: <clear explanation>
✅ Recommended fix: <concrete suggestion, with code if useful>
```

### Common problems

**Coverage dropped** — a new branch in a route handler with no test for the error path. Cover at minimum the nominal case plus the Prisma failure.

**Cognitive complexity too high** — SonarCloud blocks above 15. Extract nested `if`/`switch` blocks into named functions.

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

### S6747 — "Unknown property" in React Three Fiber components

**Scope:** `src/components/landing/**`

SonarCloud flags JSX attributes like `position`, `args`, `roughness`, `emissive`, `intensity` and `decay` as unknown HTML properties. These are **false positives**: they are React Three Fiber intrinsic element props, not HTML.

R3F extends the JSX namespace to map Three.js classes (`mesh`, `boxGeometry`, `meshStandardMaterial`, `pointLight`, …) to JSX elements, with props corresponding to Three.js constructor arguments and object properties. SonarCloud's analyzer has no R3F plugin and cannot resolve those extended types.

**Verification:** `npx tsc --noEmit` and `pnpm lint` both pass on these files, because `@react-three/fiber` ships proper type declarations.

**Config** (`sonar-project.properties`):

```properties
sonar.issue.ignore.multicriteria=r3f
sonar.issue.ignore.multicriteria.r3f.ruleKey=typescript:S6747
sonar.issue.ignore.multicriteria.r3f.resourceKey=src/components/landing/**
```

50 false positives suppressed. The rule remains active everywhere else.
