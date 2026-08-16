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

### Branch flow — staging → dev → main

Every feature or fix branch is merged into `staging` first. Promotion follows the chain `staging` → `dev` → `main`:

1. `feature/*` / `fix/*` PRs target **`staging`** (never `dev` or `main` directly).
2. Only a dev may request the merge from `staging` into `dev`.
3. Only a dev may request the merge from `dev` into `main`.

**Promote with `gh pr merge --rebase`, not a merge commit.** A merge commit is created _on the target_, so `dev` gained commits `staging` never received and `main` gained commits neither had. Content stayed identical while the histories drifted — after fifteen batches in one day, GitHub reported `staging` as **26 commits behind `main`** with zero files different. Rebasing the promotion keeps all three branches on the same commit.

Feature branches still merge into `staging` normally; the merge commit is only a problem when the source branch is long-lived and has to stay level with the target.

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
