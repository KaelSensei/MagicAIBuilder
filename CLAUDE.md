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
