# Better-Auth — evaluation against the current NextAuth v5 setup

_Evaluated 2026-08-22 against Better-Auth's own documentation and this repository's auth layer. Closes the roadmap's "Evaluate Better-Auth" line._

**Recommendation: do not migrate. Revisit only after this app moves to Next.js 16.**

The reasoning is not "NextAuth is fine" — it is that Better-Auth's own documentation labels its Next.js 15 middleware pattern insecure, and this codebase currently relies on a middleware check that is not.

---

## What is actually in use here

Auth is 1,024 lines across seven files, plus 41 files that call `useSession`, `signIn`, `signOut` or `auth()`.

| Piece         | File                          | What it does                                                                                                  |
| ------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Server config | `src/lib/auth/config.ts`      | Google OAuth + credentials, `PrismaAdapter`, bcrypt compare, per-email login rate limit (10 / 15 min)         |
| Edge config   | `src/lib/auth/edge-config.ts` | JWT sessions (7-day life, re-issued daily), the `authorized` callback, public-route list                      |
| Middleware    | `src/middleware.ts`           | Composes NextAuth with next-intl; protected pages redirect to a **locale-aware** sign-in with a `callbackUrl` |
| Helpers       | `src/lib/auth/helpers.ts`     | `requireAuth()` — the single gate every protected route handler calls                                         |
| Schema        | `prisma/schema.prisma`        | Auth.js's `User` / `Account` / `Session` / `VerificationToken`                                                |

Two properties of this setup matter for the comparison, and both are easy to overlook:

1. **The middleware performs a real check, not a cookie sniff.** The session strategy is JWT, and NextAuth verifies the token's signature on the Edge runtime before `authorized` ever runs. A forged or tampered cookie does not reach the callback.
2. **`User` is the hub of the data model.** Thirteen relations hang off it. Eleven are application data — decks, collection, favourites, favourite lists, ratings, votes, playtests, comments, both sides of follows, and now API keys — and two, `accounts` and `sessions`, are owned by the auth adapter itself. Its `id` is a foreign key across the whole schema.

---

## The finding that decides it

Better-Auth's Next.js integration page states, about middleware on Next.js 13 – 15.1.x:

> "THIS IS NOT SECURE! This is the recommended approach to optimistically redirect users. We recommend handling auth checks in each page/route."

The recommended helper, `getSessionCookie()`, **only checks that a cookie exists**. It does not validate it. Full database validation in middleware is documented as available on **Next.js 16+**, using the Node.js runtime.

This project is on **Next.js 15.5.23**.

So a migration today would replace a middleware that cryptographically verifies a session with one that checks for the presence of a cookie, and would push the real check down into every page and route handler. That is not a theoretical downgrade:

- `src/middleware.ts` is the only thing standing in front of every protected **page**. Route handlers have `requireAuth()`; pages do not.
- The redirect it produces is locale-aware and carries `callbackUrl`. Rebuilding that per-page is 41 call sites' worth of surface for the same behaviour.

The honest summary is that Better-Auth is not worse at security — it is explicit that middleware is the wrong place for the check, which is a defensible position. But adopting it **on Next 15** means either accepting a weaker middleware or writing per-page guards that do not exist today. Neither is worth doing for a library swap with no user-visible benefit.

---

## The second cost: the schema

Better-Auth generates its own schema and does not use the Auth.js model shape. Its documentation covers schema **generation** (`npx auth@latest generate`) and explicitly notes that **migration is not supported** for Prisma — and says nothing about migrating from an existing Auth.js schema.

For this repository that means a hand-written data migration touching `User`, `Account`, `Session` and `VerificationToken`, while preserving every `User.id` value because eleven tables of application data point at them. Against a live production database on Neon, with real accounts and Google OAuth links in `Account`.

That is the kind of migration that is done for a reason, not for developer experience.

---

## What Better-Auth would genuinely bring

Stated fairly, because the roadmap entry asked whether it is a _complement_, not only a replacement:

| Feature                                      | Status here today                                                                                   |
| -------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Two-factor authentication                    | Absent. Would need building on NextAuth.                                                            |
| Passkeys / WebAuthn                          | Absent.                                                                                             |
| Organizations, access control, multi-tenancy | Absent, and not on the roadmap.                                                                     |
| Enterprise SSO                               | Absent, and not wanted for a hobby project.                                                         |
| Built-in rate limiter                        | This repo already has one (`src/lib/rate-limit.ts`), applied to login, the meta route and API keys. |
| Automatic schema management                  | Prisma Migrate already does this.                                                                   |
| Prisma joins (2–3× on the adapter, ≥1.4.0)   | Real, but auth queries are not this app's bottleneck — Scryfall is.                                 |
| Framework-agnostic                           | No value here; this app is Next.js and will stay Next.js.                                           |

**Only two-factor and passkeys are things this project lacks and might one day want.** Neither is on the roadmap, and neither justifies a credential-store migration on its own.

---

## Clerk, for completeness

The roadmap already rules Clerk out on pricing, complexity and lock-in. Nothing found here contradicts that, and the argument gets stronger with the public API: keys are now minted and verified against `User` in this database. A hosted identity provider would split the credential story across two systems.

---

## When to revisit

Reopen this evaluation if **any** of these becomes true:

1. **The app moves to Next.js 16+.** This removes the entire middleware objection — Better-Auth can then validate sessions against the database in the proxy, and the comparison becomes a fair one about ergonomics.
2. **Two-factor or passkeys become a requirement.** At that point compare "build it on NextAuth" against "migrate to Better-Auth and get both", with the schema migration counted honestly as part of the cost.
3. **NextAuth v5 stalls or drops Next.js support.** It has been in beta for a long time; if it stops tracking Next.js releases, the calculus inverts regardless of anything above.

Until then the current setup is not technical debt. It is 1,024 lines that work, are tested, and put a verified check in front of every protected page.
