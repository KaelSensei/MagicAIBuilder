# MagicAIBuilder — Project Instructions

Stack: Next.js 15 (App Router) · React 19 · TypeScript strict · Prisma · Zustand · Vitest · SonarCloud

## Skills — load these for the right job

| Task                                  | Skill                            |
| ------------------------------------- | -------------------------------- |
| Writing/reviewing TypeScript or React | `typescript-craftsmanship`       |
| Refactoring, DRY, code smells         | `clean-code`                     |
| Where does this code live? Layers     | `clean-architecture`             |
| Test-first / TDD                      | `tdd`                            |
| Auditing a file or PR                 | `code-audit` + `security-review` |
| Perf / Core Web Vitals                | `web-performance`                |

Skills own the coding standards — no `any`/`as`/`!`, exhaustive `never` guards, discriminated unions, `readonly` by default, single-pass algorithms, Map/Set for lookups, memoization, fine-grained Zustand selectors, serialized async, error boundaries, file-size limits, naming conventions, JSDoc on exports, etc. **Do not duplicate those rules in this file.** If a rule is missing from a skill, add it to the skill, not here.

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

Feature branches merge into `dev` normally. Promotion branches are long-lived and must preserve the branch order above.

**Never enable `delete_branch_on_merge` on this repository.** It deletes the PR's _head_ branch, and on a promotion PR the head is `staging` or `dev`. Turning it on deleted `staging` outright the first time a promotion merged; it was restored from `dev`, which held the same commit, but the setting is fundamentally incompatible with promoting long-lived branches through PRs. Use `scripts/git-prune.sh` for cleanup instead — it has an explicit protected list.

### Documentation discipline

Feature branches MUST NOT modify `docs/project/changelog.md`, `docs/project/progress.md`, or `docs/product/roadmap.md`. These are updated in a dedicated `chore/docs` PR after each merge batch to avoid rebase conflicts.

### Pre-PR gate — mandatory

1. `npx tsc --noEmit` — zero errors
2. `pnpm lint` — zero warnings
3. `pnpm test` — all passing
4. `pnpm sonar` — runs successfully (or rely on CI if it hangs locally)
5. SonarCloud open issues **= 0**:
   - https://sonarcloud.io/project/issues?issueStatuses=OPEN&id=KaelSensei_MagicAIBuilder
   - API: https://sonarcloud.io/api/issues/search?componentKeys=KaelSensei_MagicAIBuilder&statuses=OPEN&ps=100

## Deep reference

For the full pattern catalog with before/after examples and the audit of existing issues, read `docs/references/typescript-patterns.md`.
