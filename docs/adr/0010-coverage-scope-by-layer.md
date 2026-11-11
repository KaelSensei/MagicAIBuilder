---
status: accepted
date: 2026-11-11
decision-makers: Project owner; clean-code programme coordinator (owner decision OD-10, taken under the owner's carte blanche of 2026-11-10)
---

# Scope coverage by layer: keep module UI out of the Sonar figure, and set floors on domain and application

## Context and Problem Statement

Two tools report coverage. They measure different scopes, and neither blocks a merge on it.

|              | Vitest                                                                                                                                                                                                                                          | SonarCloud                                                                                                                                                                                                                |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Produced by  | `pnpm test:coverage` (`vitest run --coverage`, v8 provider), the step "Test with coverage" in `.github/workflows/ci.yml`                                                                                                                        | `.github/workflows/sonar.yml` runs `pnpm test:coverage` again and uploads `coverage/lcov.info`. `pnpm sonar` (`scripts/sonar.mjs`) does the same from a developer machine                                                 |
| Source scope | `src/**/*.{ts,tsx}`, minus `src/generated/**`, `*.d.ts`, four type-only files, `src/lib/db/prisma.ts` and `src/middleware.ts` (`vitest.config.ts`). Test files are left out automatically. The shared test helpers in `src/test/**` are counted | `sonar.sources=src` minus test files, then `sonar.coverage.exclusions=src/app/**,src/components/**,src/generated/**` (`sonar-project.properties`). `src/middleware.ts` counts, at 0%, because the lcov has no data for it |
| Last figure  | 83.01% lines, 86.19% branches, 88.74% functions. CI run 43040973372 (PR #1386, 2026-11-11), whose `src` is the `dev` tree at `de2bedff`                                                                                                         | 93.8% coverage (95.7% lines, 88.4% branches, 14,251 lines to cover). The CI analysis of `main` at `a6db8d1b`, 2026-11-08                                                                                                  |
| Floor        | None                                                                                                                                                                                                                                            | None that blocks: the job has `continue-on-error: true`, and `CLAUDE.md` makes Sonar advisory                                                                                                                             |

The Vitest run, by top-level folder (lines; the method is under "More Information"):

| Folder           | Lines covered | Files at 0% |
| ---------------- | ------------: | ----------: |
| `src/lib`        |          ~98% |    3 of 206 |
| `src/hooks`      |          ~95% |     0 of 33 |
| `src/components` |          ~75% |   32 of 201 |
| `src/app`        |          ~71% |   17 of 108 |
| **All of `src`** |    **83.01%** |   57 of 566 |

The documentation had drifted from both figures. `docs/engineering/quality-gate.md` quoted 94.5% for
Sonar (2026-08-15) and 48.5% for Vitest (2026-08-23). The Vitest figure rose because tests were
added: in August, 79 of 125 component files and 48 of 69 app files were at 0%.

Three facts make the scope a decision now:

1. **Sonar's coverage exclusions are keyed on paths.** [ADR 0001](0001-modular-monolith-by-bounded-context.md)
   moves `src/components/**` into `src/modules/<context>/ui/`. With no matching exclusion, each
   component move silently adds UI code to the Sonar figure and to its new-code condition. The
   figure would change meaning one pull request at a time (tests and tooling audit, §3.4 item 5).
2. **Nothing stops coverage from falling.** Vitest sets no threshold and Sonar is advisory (tests
   and tooling audit, S15).
3. **The domain layer is the cheapest code to test and carries the rules.**
   [ADR 0003](0003-domain-as-readonly-data-and-pure-functions.md) makes it readonly data and pure
   functions, and [ADR 0005](0005-testing-strategy-fakes-contracts-and-characterization.md) runs
   mutation testing on it. A floor there costs little.

Once code lives in `src/modules/<context>/<layer>/`, which coverage figure measures which layer, and
which layers must meet a floor?

## Decision Drivers

- The Sonar figure must mean the same thing before, during and after the migration. A move must not
  change it on its own.
- One figure must still cover every line of `src`, so untested UI stays visible.
- Floors go where tests are cheap and the code carries the rules: the domain first, then the use
  cases.
- Nothing may fail on the day the rule lands. A pure move may fail only when the moved code really is
  under-tested.
- Use the tools already installed: no new dependency, `package.json` untouched.

## Considered Options

- Mirror the UI exclusion in Sonar, and add floors per layer in Vitest.
- Measure everything in Sonar: drop the `src/app/**` and `src/components/**` exclusions, and add none
  for module UI.
- Mirror the UI exclusion, with no floor.
- One global Vitest floor over all of `src`.

## Decision Outcome

Chosen option: "mirror the UI exclusion and add floors per layer", because it is the only option
that keeps the Sonar figure stable through the moves and also stops domain coverage from falling, at
no cost on the day it lands.

1. **Vitest measures all of `src`,** as today. `src/modules/*/ui/**` is measured exactly like
   `src/components/**`. The Vitest figure is the repository's coverage.
2. **SonarCloud keeps UI and routes out of its coverage figure.** `src/modules/*/ui/**` joins
   `sonar.coverage.exclusions`, next to `src/app/**` and `src/components/**`. Sonar still analyses
   these files for bugs, code smells and duplication; only its coverage ignores them. The Sonar
   figure keeps one meaning: the coverage of the code that is neither UI nor a route.
3. **Floors per layer,** enforced by `coverage.thresholds` with glob keys in `vitest.config.ts`:

   | Layer                                             | Glob                           | Lines | Branches | Treated like today's                        |
   | ------------------------------------------------- | ------------------------------ | ----: | -------: | ------------------------------------------- |
   | `domain/`                                         | `src/modules/*/domain/**`      | ≥ 90% |    ≥ 90% | `src/lib`, plus the floor                   |
   | `application/`                                    | `src/modules/*/application/**` | ≥ 80% |    ≥ 80% | `src/lib`, plus the floor                   |
   | `infrastructure/`                                 | none                           |     — |        — | the adapters in `src/lib`                   |
   | `client/`                                         | none                           |     — |        — | `src/hooks`, the stores and the API clients |
   | `ui/`                                             | none; out of the Sonar figure  |     — |        — | `src/components`                            |
   | Entry points `index.ts`, `server.ts`, `client.ts` | none                           |     — |        — | re-exports only                             |

4. **How a floor is checked.** Vitest adds up every file a glob matches, across all contexts, and
   compares the total with the floor at the end of `pnpm test:coverage`. Below the floor the command
   exits with code 1, so the CI check "Lint, Typecheck, Test, Build" fails.
5. **Floors only go up.** Raising a floor, or adding a stricter glob for one context (for example
   when its move series ends), is an ordinary pull request. Lowering a floor, or excluding a file
   under `domain/` or `application/` from coverage, needs a new ADR that supersedes this one.
6. **Tests come before the move.** A move that would push a layer under its floor gets its missing
   tests first, in a `tests` slice. It never lowers the floor and never excludes the file.
7. **What may be excluded.** A file leaves the coverage scope only when it carries no runtime
   behaviour (a type-only file) or needs a runtime a unit test cannot provide, and the reason is
   written next to the exclusion. Being untested is never a reason.

### Consequences

- Good, because the Sonar figure stays comparable across the whole migration: moving a component
  changes neither its scope nor its new-code condition.
- Good, because a floor binds from the first file that moves into its layer, with no switch to
  remember.
- Good, because the Vitest figure still shows every untested component and route.
- Good, because Vitest 3.2.7, the installed version, supports glob thresholds; no tool is added.
- Bad, because UI has no floor anywhere, and Sonar's new-code coverage condition never sees a new
  untested component or route. Untested UI shows only in the Vitest report, where 32 component files
  and 17 app files are at 0% today. The Playwright suite covers part of it, outside both figures.
- Bad, because a floor applies to a whole layer, not to one context: a well-tested context can hide a
  weak one. A stricter glob per context is the remedy (rule 5).
- Bad, because the floors bind only where coverage runs: `pnpm test:coverage` in CI and inside
  `pnpm sonar`. `pnpm test`, the pre-push hook and focused runs do not check them. A local coverage
  run over part of the suite counts every domain file it did not run at 0%, and fails the floor;
  narrow it with `--coverage.include='src/modules/<context>/**'`.
- Bad, because `sonar.yml` runs the same command: a floor failure fails its test step, so the scan is
  skipped for that run. This lasts until Sonar reuses the CI coverage (master plan P0-22).
- Bad, because the branch floor is tight. Sonar measured 88.4% branch coverage over `src/lib` on
  2026-11-08, under 90%. Some domain moves will need branch tests first (rule 6). That pressure is
  intended, but it costs time.
- Bad, because there are still two figures with two scopes. Every document that quotes one must name
  its scope and its date.

### Confirmation

- `vitest.config.ts` holds the two glob thresholds, and `sonar-project.properties` holds
  `src/modules/*/ui/**`. The CI step "Test with coverage" enforces the floors.
- Checked on 2026-11-11, on `dev` at `de2bedff`, with Vitest 3.2.7:
  - With no `src/modules/` folder, `vitest run --coverage src/lib/combos` exits with code 0. A glob
    that matches no file has no percentage to compare (istanbul-lib-coverage reports it as
    `Unknown`), so it passes.
  - With a throwaway module, removed afterwards, a domain file at 44.44% lines and 50% branches
    failed both floors, and the run exited with code 1. A fully covered application file passed. An
    untested `ui/` file at 0% failed nothing. Vitest printed:

    ```text
    ERROR: Coverage for lines (44.44%) does not meet "src/modules/*/domain/**" threshold (90%)
    ERROR: Coverage for branches (50%) does not meet "src/modules/*/domain/**" threshold (90%)
    ```
- The move codemod's config pass (master plan P0-08) rewrites file paths in both configs when a
  listed file moves. The globs name no file, so they need no rewrite.
- Review question: does the pull request lower a floor or exclude a file under `domain/` or
  `application/`? Then it needs an ADR.

## Pros and Cons of the Options

### Measure everything in Sonar

- Good, because there is one scope, and Sonar's new-code condition would see new untested UI and
  routes.
- Bad, because the figure would fall by the weight of the UI, and the new-code condition would very
  likely go red on the next pull requests. The comment in `sonar-project.properties` calls that "a
  deliberate decision with a cost to schedule": it deserves its own decision, with the missing tests
  landing alongside it, not a side effect of moving folders. This ADR keeps that choice open.
- Bad, because Sonar is advisory today, so the extra signal would block nothing.

### Mirror the UI exclusion, with no floor

- Good, because it is the smallest change.
- Bad, because coverage can still fall unnoticed, and the domain gets no protection at the very time
  hundreds of files move.

### One global Vitest floor over all of `src`

- Good, because it is one number, and simple.
- Bad, because a floor under today's 83% protects nothing in the domain, and a floor at 83% fails on
  any untested UI line, which rewards tests written for the number. One figure mixes code whose cost
  to test differs by an order of magnitude.

## More Information

- [ADR 0001](0001-modular-monolith-by-bounded-context.md) (the layers),
  [ADR 0003](0003-domain-as-readonly-data-and-pure-functions.md),
  [ADR 0005](0005-testing-strategy-fakes-contracts-and-characterization.md) (mutation testing on
  `domain/`, which measures what coverage cannot), and
  [ADR 0007](0007-architecture-enforcement-in-stages.md) (thresholds as a ratchet).
- [quality-gate.md](../engineering/quality-gate.md), section "Coverage", keeps the current figures.
- **How the folder figures were derived.** The CI text report gives each file's line percentage but
  no line counts, so the shares come from two sources. The percentages come from CI run 43040973372.
  The line count of each file comes from a local JSON report of the same tree
  (`vitest run --coverage --coverage.reporter=json`, which lists every file in `src`). Weighted that
  way, the total comes out at 83.11% against the 83.01% CI printed, so the folder figures are
  rounded to whole percentages. The counts of files at 0% are exact.
- **The Sonar figure of 2026-11-11 is not `main`.** SonarCloud lists three analyses of `main` on
  2026-11-11. All three came from a developer checkout (`work/mab-nl-search-20261111`, revision
  `995482f3` of `cursor/verifiable-natural-language-search-887a`), because `scripts/sonar.mjs` sets
  no branch name. Their 95.3% describes that branch. The last analysis of `main` itself is the one
  of 2026-11-08 quoted above.
- Vitest, [`coverage.thresholds`](https://v3.vitest.dev/config/#coverage-thresholds), glob patterns
  (Vitest 3.2, read 2026-11-11). Files matched by a glob also count towards a global threshold;
  this configuration sets none.
- SonarQube Cloud, [Analysis scope](https://docs.sonarsource.com/sonarqube-cloud/advanced-setup/analysis-scope/)
  (read 2026-11-11): coverage exclusions leave the files in the issue analysis.
- Martin Fowler, [TestCoverage](https://martinfowler.com/bliki/TestCoverage.html), 2012-04-17:
  coverage finds untested code; it is a poor target in itself.
- Carlos Arguelles, Marko Ivanković and Adam Bender,
  [Code Coverage Best Practices](https://testing.googleblog.com/2020/08/code-coverage-best-practices.html),
  Google Testing Blog, 2020-08-07: 60% "acceptable", 75% "commendable", 90% "exemplary".
- Mark Seemann, [Curb code rot with thresholds](https://blog.ploeh.dk/2020/04/13/curb-code-rot-with-thresholds/),
  2020-04-13.
- Revisit when the first context finishes its series (a stricter floor for it), when the owner makes
  Sonar blocking again (rule 2 against measuring everything), and when Stryker reports a mutation
  score for `domain/`.
