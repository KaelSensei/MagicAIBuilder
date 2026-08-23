# Production security checklist — 20 points

Status audited against the code on **2026-08-20**. Items marked _fixed 2026-08-20_ were
closed by `fix/security-hardening` the same day; everything else is either already in
place or tracked in **Follow-ups** below. Companion to the fuller
[`audit-2026-07-20.md`](./audit-2026-07-20.md), whose open findings
(CSP, HSTS, COOP/CORP) are closed by the same change.

## Authentication & secrets

| #   | Item                    | Status | Evidence                                                                                                                                             |
| --- | ----------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | API keys only in `.env` | ✅     | No literal keys in `src/`; every provider key is read from `process.env`                                                                             |
| 2   | `.env` gitignored       | ✅     | `.gitignore` `.env*`; only `.env.example` / `.env.sonar.example` are tracked                                                                         |
| 3   | Rate limiting on login  | ✅ ⚠️  | 10 attempts / 15 min per email (`src/lib/auth/config.ts`), signup 5 / 15 min per IP. **In-memory**, so per Vercel instance — see follow-up           |
| 4   | Hashed passwords        | ✅     | bcrypt, 12 rounds (`src/app/api/auth/signup/route.ts`, `src/lib/auth/config.ts`)                                                                     |
| 5   | Expiring sessions       | ✅     | _fixed 2026-08-20_ — JWT `maxAge` 7 days, `updateAge` 24 h (`src/lib/auth/edge-config.ts`). Was the library default of 30 days with nothing asserted |
| 6   | Confirmed email         | ❌     | `emailVerified` and `VerificationToken` exist in the schema but no mail is ever sent; signup creates the account directly — see follow-up            |

## Authorization & permissions

| #   | Item                           | Status | Evidence                                                                                                                                                                                                                       |
| --- | ------------------------------ | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 7   | RLS enabled                    | N/A    | Prisma with a single application role; authorization lives in the app layer, not in Postgres policies                                                                                                                          |
| 8   | Rights verified server-side    | ✅     | `requireAuth` / `requireDeckOwner` (`src/lib/auth/helpers.ts`) on every mutating deck route; comments, votes, ratings and collection check the author. `/api/favorites` is unauthenticated but is a no-op that touches no data |
| 9   | Public keys on the client only | ✅     | No `"use client"` file reads `process.env`; only `NEXT_PUBLIC_*` values cross to the browser                                                                                                                                   |

## Network & transport

| #   | Item             | Status | Evidence                                                                                                                                                                                                         |
| --- | ---------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 10  | HTTPS everywhere | ✅     | _fixed 2026-08-20_ — `Strict-Transport-Security` (2 years, subdomains, preload), a **Content-Security-Policy**, COOP and CORP, all built and unit-tested in `src/lib/security-headers.ts`. Vercel terminates TLS |
| 11  | CORS configured  | ✅     | No `Access-Control-*` header anywhere → same-origin only, which is the whole usage; `proxy-card-image` exists precisely so the browser never fetches cross-origin                                                |
| 12  | Signed webhooks  | N/A    | No webhook endpoint                                                                                                                                                                                              |

## Inputs & uploads

| #   | Item               | Status | Evidence                                                                                                                                                                                          |
| --- | ------------------ | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 13  | Validated inputs   | ✅ ⚠️  | Zod on 18 routes. Four bound their input by hand without a schema (`cache/search`, `cache/cards`, `decks/[id]/snapshots`, `decks/[id]/playtest-sessions`); all are authenticated and rate-limited |
| 14  | Max upload size    | ✅     | No upload endpoint. Cache writes capped at 500 KB / 50 KB → 413. _fixed 2026-08-20_ — `proxy-card-image` now refuses upstream bodies over 5 MB (declared **and** measured)                        |
| 15  | File type verified | ✅     | `proxy-card-image`: https + `cards.scryfall.io` allowlist, `image/*` content-type required                                                                                                        |

## Exposure & logs

| #   | Item                        | Status | Evidence                                                                                                                                                                                                                                                         |
| --- | --------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 16  | Detailed errors off in prod | ✅     | _fixed 2026-08-20_ — the four routes that echoed `error.message` (`ai/build`, `ai/suggest`, `import/url` 500 path, `meta/[slug]`) now log it and answer with a fixed line. `import/url` keeps its parser messages on the 422 path: they are written for the user |
| 17  | Clean `console.log`         | ✅     | None in `src/` outside the logger itself; the one stray `console.error` went with #16                                                                                                                                                                            |
| 18  | Unique auth error message   | ✅     | Credentials provider returns `null` for unknown user, missing hash and wrong password alike; one UI string. Signup does say "email already registered" — a deliberate UX trade                                                                                   |

## Maintenance

| #   | Item                    | Status | Evidence                                                                                                                       |
| --- | ----------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------ |
| 19  | Dependencies up to date | ✅ ⚠️  | Dependabot weekly, grouped, majors held for review (`.github/dependabot.yml`). No `pnpm audit` / CodeQL job — see follow-up    |
| 20  | Auto backup             | ⚠️     | Neon provides point-in-time restore by default; the retention window on this project has **not been verified** — see follow-up |

## Follow-ups (not in this change)

- **Distributed rate limiting (#3).** `src/lib/rate-limit.ts` is an in-process `Map`; each Vercel lambda counts alone. Move to Upstash Redis (or Vercel KV) — small, but needs a provisioned store.
- **Email verification (#6).** Needs a mail provider (Resend is the obvious fit on Vercel), a verification route and a gate on sign-in. Medium effort; the schema is already there.
- **Backups (#20).** Open the Neon console, confirm the restore window on the production branch (free tier is 24 h at the time of writing; paid tiers go to 7–30 days), and record it here.
- **Dependency scanning (#19).** Add a `pnpm audit --prod --audit-level=high` step (or CodeQL) to `ci.yml`.
- **CSP nonces.** `script-src` still carries `'unsafe-inline'` because Next.js hydrates through inline scripts. Removing it needs a per-request nonce threaded through middleware and the root layout.
