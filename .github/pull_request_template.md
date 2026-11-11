<!--
English only: plain, precise sentences. Keep every heading; write "n/a" with a reason when a
section does not apply. Delete these guidance comments. Checklist: docs/engineering/definition-of-done.md
-->

## Why

<!-- The problem, with evidence: paths and lines, the behaviour before, the issue or audit ID. -->

## What changed

<!-- What the change does, in domain language (CONTEXT.md). One bullet per meaningful change. -->

## Kind

<!-- Tick every kind present. A single commit is never both structural and behavioural. -->

- [ ] Behavioural (`feat:` / `fix:`): driven by a Red test
- [ ] Structural (`refactor:`): no behaviour change; no assertion changed; tests green before and after
- [ ] Tests only
- [ ] Docs
- [ ] Tooling (CI, lint, scripts, dependencies)

## Test list

<!--
The behaviours, in domain language, written before the first Red. Tick each item this PR covers
and name its test. Characterization tests are named "characterization: …".
-->

- [ ] <behaviour> — `<test file>` › `<test name>`

## Red evidence

<!--
For each behavioural item: the focused command and the actual failing assertion, pasted, not
paraphrased. Write "n/a: docs only" or "n/a: structural only" otherwise.
-->

```text
$ TZ=UTC npx vitest run <file> -t "<test name>"
<the failing assertion>
```

## Verification

<!-- Exact commands and counts. Say what you could not run, and why. -->

- `npx tsc --noEmit`:
- `pnpm lint`:
- `pnpm arch`:
- Focused tests (`<command>`): <N> passed
- `pnpm test`:
- SonarCloud (advisory):
- Pre-push Docker E2E gate: pending, run by the coordinator on push.
- [ ] A feature or fix PR targets `dev`; a promotion PR follows `dev` → `staging` → `main`.
- [ ] UI change: a screenshot or short recording at desktop and mobile widths, when useful.
- [ ] Promotion PR only: critical desktop and responsive mobile-web journeys checked on
      `staging`; native mobile/TestFlight `N/A` until a mobile build exists.

## Docs touched

<!--
CONTEXT.md, ADRs, architecture.md, a module README, a functional doc, the user guide, code
comments. "None" is a valid answer. Feature branches never modify docs/project/changelog.md,
docs/project/progress.md or docs/product/roadmap.md.
-->

## Pending-branch overlap

<!-- Files this PR shares with open PRs or pending branches, and how the overlap is handled. "None" if none. -->

## Follow-ups

<!--
Work found but left out on purpose, with the reason. A behaviour change found during a refactor
becomes its own fix/ PR.
-->
