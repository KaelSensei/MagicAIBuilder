# MagicAIBuilder — DX / CI-CD Overview

> Quality stack, deployment, and observability setup for the project.

---

## Tech Stack

| Layer           | Tech                    | Notes                 |
| --------------- | ----------------------- | --------------------- |
| Framework       | Next.js 15 (App Router) |                       |
| Language        | TypeScript 5 strict     | Zero `any`, zero `as` |
| Styling         | Tailwind CSS 4          |                       |
| State           | Zustand 5               |                       |
| ORM             | Prisma 6                | PostgreSQL            |
| Tests           | Vitest 3 + Playwright   |                       |
| Package manager | pnpm 10                 |                       |

---

## Deployment

| Component | Service                       | Plan               |
| --------- | ----------------------------- | ------------------ |
| App       | Vercel                        | Hobby (free)       |
| Database  | Supabase                      | Free tier (500 MB) |
| URL       | `magic-ai-builder.vercel.app` | No custom domain   |

**DB connection:**

- Local: Docker PostgreSQL (`localhost:5432`)
- Production: Supabase Transaction Pooler (`pooler.supabase.com:6543?pgbouncer=true`)
- Auto-deploy on every push to `main`; `dev` and `staging` deployments are validation environments.

---

## Branch workflow

| Branch    | Role                                        | Entry condition                         | Exit condition                                  |
| --------- | ------------------------------------------- | --------------------------------------- | ----------------------------------------------- |
| `dev`     | Daily integration of features and fixes     | Feature/fix PR reviewed and checks pass | Candidate is selected for alpha validation      |
| `staging` | QA alpha candidate and colleague validation | Promotion PR from `dev`                 | QA and colleague validation complete            |
| `main`    | Validated release code                      | Promotion PR from `staging`             | Release is deployed through the production path |

Feature and fix PRs target `dev`. Promotion PRs are the only way to move code from `dev` to `staging`, then from `staging` to `main`. Do not skip a branch or merge feature work directly into `staging` or `main`.

The `staging` checkpoint includes QA sign-off for the critical desktop and responsive mobile-web journeys, plus colleague validation. The project does not currently have a native mobile or TestFlight build, so TestFlight validation becomes active only after that build exists.

## CI / GitHub Actions

Three workflows run on every push to `main` and every PR targeting `dev`, `staging` or `main`. A fourth, `e2e.yml`, runs the Playwright suite on PRs targeting `staging` or `main`, nightly on `dev` and on demand. Every push also runs the suite locally first (see [Local DX](#local-dx) and [quality-gate.md](quality-gate.md#e2e-gate)).

### `ci.yml` — Main pipeline (required on `main`)

```
pnpm install --frozen-lockfile
→ pnpm audit --prod --audit-level=high       (blocks)
→ pnpm audit --prod --audit-level=moderate   (report only)
→ pnpm lint                                  (eslint flat config; any warning fails)
→ pnpm arch                                  (dependency-cruiser; a cycle or a new boundary violation fails)
→ npx tsc --noEmit
→ pnpm test:coverage                         (vitest; no coverage threshold)
→ pnpm build
```

### `sonar.yml` — Quality analysis (advisory)

The job has `continue-on-error: true`: a failed scan never blocks a merge.

```
pnpm install --frozen-lockfile
→ pnpm test:coverage   (generates lcov.info)
→ SonarCloud scan      (uploads coverage + analysis)
```

It fails loudly when `SONAR_TOKEN` is missing, and only warns on fork and Dependabot PRs, which GitHub runs without repository secrets.

### `lighthouse.yml` — Performance, accessibility and SEO audit

```
pnpm install --frozen-lockfile
→ pnpm build
→ pnpm lighthouse      (lhci autorun; URLs and thresholds in lighthouserc.yml)
→ upload .lighthouseci/ as an artifact
```

It fails its own workflow when a category drops below its threshold. It is not a required check.

### `e2e.yml` — Playwright suite in Docker

Runs on PRs targeting `staging` or `main`, nightly on `dev` (03:17 UTC) and on demand; not on PRs targeting `dev`, to save CI minutes. It is not a required check.

```
docker compose -f docker-compose.e2e.yml up --build --exit-code-from e2e
  (Postgres → prisma migrate deploy → next build → Playwright against next start)
→ upload playwright-report/ and test-results/ as an artifact
→ docker compose down -v
```

---

## Branch Protection

Read with `gh api` on 2026-11-10: only `main` is protected. It requires the check `Lint, Typecheck, Test, Build` and a branch that is up to date with `main`. `dev` and `staging` have no protection rule; their PRs run the same checks, and the CI check must be green before a merge.

SonarCloud also runs on PRs, as an advisory report. Record its result in the PR; it does not block a merge while the integration is repaired (see `CLAUDE.md`).

---

## Local DX

### Pre-commit (Husky + lint-staged)

On every `git commit`, automatically runs:

- `eslint --fix` on staged `.ts` / `.tsx` files (rules in `eslint.config.mjs`)
- `prettier --write` on `.json`, `.md`, `.yml`, `.yaml`

### Pre-push (Husky)

On every `git push`, `.husky/pre-push` runs `scripts/e2e-pre-push.sh`: the full Playwright suite in Docker (`docker-compose.e2e.yml`). A failing test blocks the push. `SKIP_E2E=1` skips it in an emergency. CI runs the same stack in `e2e.yml`; see [quality-gate.md](quality-gate.md#e2e-gate).

### Useful scripts

```bash
pnpm dev              # local dev server
pnpm dev:local        # local dev server on 127.0.0.1:3000
pnpm lint             # full lint
pnpm arch             # architecture gate (dependency-cruiser)
pnpm arch:graph       # regenerate docs/engineering/dependency-graph.generated.md
pnpm test             # unit tests
pnpm test:coverage    # tests + coverage report
pnpm build            # production build
pnpm git:prune        # owner only: delete every non-protected branch (local + remote) and extra worktrees
```

### Environment variables

| Variable                 | Where                 | Purpose                   |
| ------------------------ | --------------------- | ------------------------- |
| `DATABASE_URL`           | `.env.local` + Vercel | PostgreSQL connection     |
| `ANTHROPIC_API_KEY`      | `.env.local` + Vercel | AI suggestions (optional) |
| `NEXT_PUBLIC_SENTRY_DSN` | `.env.local` + Vercel | Sentry error tracking     |
| `SENTRY_AUTH_TOKEN`      | Vercel only           | Source maps upload        |
| `SONAR_TOKEN`            | GitHub Secrets        | SonarCloud analysis       |

---

## Code Quality

### SonarCloud

- Analysis on every PR, **advisory** (`continue-on-error: true` in `sonar.yml`)
- Coverage uploaded from CI (lcov format); SonarCloud's coverage scope excludes `src/app/**` and `src/components/**`
- Targets: see [quality-gate.md](quality-gate.md#sonarcloud-targets-advisory)

### Test coverage (Vitest)

Vitest measures coverage over all of `src`; no threshold is enforced. Last measured on 2026-08-23 (breakdown in `vitest.config.ts`):

| Area          | Coverage |
| ------------- | -------- |
| All of `src`  | 48.5%    |
| `lib/`        | 96.6%    |
| `hooks/`      | 87.4%    |
| `components/` | 25.2%    |
| `app/`        | 25.1%    |

### Dependabot

Automated updates every Monday — **minor and patch only**.
Major versions are upgraded manually to avoid breaking changes
(TypeScript, Prisma, ESLint, Next.js all have non-trivial migration guides).

---

## Observability

| Tool          | Purpose                                 | Plan     |
| ------------- | --------------------------------------- | -------- |
| Sentry        | Error tracking — client + server + edge | Free     |
| `/api/health` | DB connectivity check + latency         | Internal |
| UptimeRobot   | Monitors `/api/health` every 5 minutes  | Free     |

### Health check

`GET /api/health` returns:

```json
{ "status": "ok", "db": "ok", "latencyMs": 12 }
```

or `503` if the database is unreachable.

### Sentry

- `sentry.client.config.ts` — browser errors, 10% trace sampling
- `sentry.server.config.ts` — API route errors
- `sentry.edge.config.ts` — edge runtime errors
- Source maps uploaded automatically on every Vercel deploy

---

## Remaining work

- [ ] Increase `lib/deck/store.ts` coverage (82% → 90%)
- [ ] Missing tests: `forceSave`, `promoteToCommander`, `swapCardPrinting`
- [x] Run the Playwright suite in CI (`e2e.yml`, on PRs targeting `staging` or `main` and nightly on `dev`)
- [ ] Posthog or Plausible for user analytics
- [ ] Document UptimeRobot setup in technical.md
