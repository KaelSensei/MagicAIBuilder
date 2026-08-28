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
| Database  | Supabase                      | Free tier (512 MB) |
| URL       | `magic-ai-builder.vercel.app` | No custom domain   |

**DB connection:**

- Local: Docker PostgreSQL (`localhost:5432`)
- Production: Supabase Transaction Pooler (`pooler.supabase.com:6543?pgbouncer=true`)
- Auto-deploy on every push to `main`; `dev` and `staging` deployments are validation environments.

---

## Branch workflow

| Branch | Role | Entry condition | Exit condition |
| ------ | ---- | --------------- | -------------- |
| `dev` | Daily integration of features and fixes | Feature/fix PR reviewed and checks pass | Candidate is selected for alpha validation |
| `staging` | Alpha candidate, TestFlight build and colleague validation | Promotion PR from `dev` | Alpha and colleague validation complete |
| `main` | Validated release code | Promotion PR from `staging` | Release is deployed through the production path |

Feature and fix PRs target `dev`. Promotion PRs are the only way to move code from `dev` to `staging`, then from `staging` to `main`. Do not skip a branch or merge feature work directly into `staging` or `main`.

## CI / GitHub Actions

Two workflows:

### `ci.yml` — Main pipeline (Required)

Runs on every push to `main` and every PR targeting `dev`, `staging` or `main`.

```
pnpm install
→ next lint
→ tsc --noEmit
→ vitest --coverage
→ next build
```

### `sonar.yml` — Quality analysis

Runs on every push to `main` and every PR targeting `dev`, `staging` or `main`.

```
pnpm install
→ vitest --coverage   (generates lcov.info)
→ SonarCloud scan     (uploads coverage + analysis)
```

---

## Branch Protection

The **Required** check for integration and promotion merges is `CI / Lint, Typecheck, Test, Build`.

SonarCloud also runs on PRs. A merge must not be used to hide a failed analysis; a failure must be resolved or explicitly documented before promotion to `main`.

---

## Local DX

### Pre-commit (Husky + lint-staged)

On every `git commit`, automatically runs:

- `next lint --fix` on staged `.ts` / `.tsx` files
- `prettier --write` on `.json`, `.md`, `.yml`, `.yaml`

> Note: `next lint --fix` is used instead of `eslint --fix` directly — ESLint v9 cannot locate
> `.eslintrc.json` when called standalone, but Next.js resolves it correctly.

### Useful scripts

```bash
pnpm dev              # local dev server
pnpm dev:local        # local dev server on 127.0.0.1:3000
pnpm lint             # full lint
pnpm test             # unit tests
pnpm test:coverage    # tests + coverage report
pnpm build            # production build
pnpm git:prune        # delete all branches except main (local + remote)
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

- Quality gate on every PR
- Coverage uploaded from CI (lcov format)
- Target: 0 HIGH/MEDIUM issues, coverage > 80%

### Test coverage (Vitest)

| Area                | Coverage                 |
| ------------------- | ------------------------ |
| Overall             | ~92%                     |
| `lib/deck/store.ts` | ~82% (needs improvement) |
| `lib/validation/`   | 100%                     |
| `hooks/`            | ~93%                     |

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
- [ ] Lighthouse CI in `ci.yml` (perf/accessibility score on every PR)
- [ ] Posthog or Plausible for user analytics
- [ ] Document UptimeRobot setup in technical.md
