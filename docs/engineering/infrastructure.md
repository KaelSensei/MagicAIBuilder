# MagicAIBuilder — Infrastructure

## Database Architecture

MagicAIBuilder uses **PostgreSQL 16** (via Docker) with **Prisma ORM** for type-safe, migration-driven data access.

### Schema Overview

```prisma
// prisma/schema.prisma

/// A Commander (or Brawl) deck with its metadata
model Deck {
  id            String     @id @default(cuid())   // CUID2 primary key
  name          String
  format        String     @default("commander")   // "commander" | "brawl"
  targetBracket Int        @default(2)             // 1–4 power bracket
  budget        Float?                             // Max price per card (USD)
  commanderId   String?                            // Scryfall ID reference
  partnerId     String?                            // Scryfall ID reference
  cards         DeckCard[]                         // Relation to all cards
  createdAt     DateTime   @default(now())
  updatedAt     DateTime   @updatedAt
}

/// Individual card entry — commander, partner, and the 99
model DeckCard {
  id            String   @id @default(cuid())
  deckId        String                             // FK → Deck (cascades on delete)
  scryfallId    String                             // Scryfall card ID
  name          String
  manaCost      String   @default("")
  cmc           Float    @default(0)
  typeLine      String   @default("")
  oracleText    String   @default("")
  colorIdentity String[]                           // ["W","U","B","R","G"]
  isGameChanger Boolean  @default(false)
  isBanned      Boolean  @default(false)
  price         Float?                             // USD
  imageUri      String   @default("")
  artCropUri    String   @default("")
  category      String   @default("other")        // CardCategory
  quantity      Int      @default(1)
  isCommander   Boolean  @default(false)           // True for commander slot
  isPartner     Boolean  @default(false)           // True for partner slot
}

/// Server-side cache for Scryfall card data (TTL: 24h)
model CardCache {
  scryfallId String   @id                          // Scryfall card ID as PK
  data       Json                                  // Full ScryfallCard JSON
  cachedAt   DateTime @default(now())
}
```

---

## Local Development Setup

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) or Docker Engine
- Node.js 20+, pnpm 10+

### 1. Start PostgreSQL

```bash
pnpm db:up
# or: docker compose up -d
```

Wait for the healthcheck to pass (~5s):

```bash
docker compose ps  # Status should be "healthy"
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

`.env.local` is gitignored. Default values work for local Docker:

```
DATABASE_URL="postgresql://magic:magic@localhost:5432/magicaibuilder"
```

### 3. Run migrations

```bash
pnpm db:migrate
# or: pnpm prisma migrate dev
```

This will:

- Apply all pending migrations from `prisma/migrations/`
- Regenerate the Prisma Client

### 4. Start the dev server

```bash
pnpm dev:local
```

This starts Next.js on `http://127.0.0.1:3000`. Open:

- `http://localhost:3000/fr` for the French UI
- `http://localhost:3000/en` for the default English UI

The landing page can run without Docker. Authenticated deck, collection, and
profile workflows require PostgreSQL to be running and migrated.

---

## Environment Variables

| Variable       | Required | Default | Description                  |
| -------------- | -------- | ------- | ---------------------------- |
| `DATABASE_URL` | ✅ Yes   | —       | PostgreSQL connection string |

---

## Prisma Commands

| Command                                 | Description                                |
| --------------------------------------- | ------------------------------------------ |
| `pnpm db:up`                            | Start Docker Postgres                      |
| `pnpm db:down`                          | Stop Docker Postgres                       |
| `pnpm db:migrate`                       | Run pending migrations & regenerate client |
| `pnpm db:studio`                        | Open Prisma Studio (visual DB browser)     |
| `pnpm db:reset`                         | Drop + recreate DB + re-run all migrations |
| `pnpm prisma generate`                  | Regenerate client only (no migration)      |
| `pnpm prisma migrate dev --name <name>` | Create a named migration                   |
| `pnpm prisma migrate deploy`            | Apply migrations in production             |

---

## API Routes

All CRUD operations go through Next.js App Router API routes:

| Method | Route                            | Description                  |
| ------ | -------------------------------- | ---------------------------- |
| GET    | `/api/decks`                     | List all decks               |
| POST   | `/api/decks`                     | Create a deck                |
| GET    | `/api/decks/[id]`                | Get one deck (with cards)    |
| PATCH  | `/api/decks/[id]`                | Update deck metadata         |
| DELETE | `/api/decks/[id]`                | Delete deck + cascade cards  |
| POST   | `/api/decks/[id]/cards`          | Add a card                   |
| DELETE | `/api/decks/[id]/cards`          | Remove all cards             |
| DELETE | `/api/decks/[id]/cards/[cardId]` | Remove one card              |
| PATCH  | `/api/decks/[id]/cards/[cardId]` | Update card (category, etc.) |
| GET    | `/api/cache/cards?id=<id>`       | Lookup cached Scryfall card  |
| POST   | `/api/cache/cards`               | Store Scryfall card in cache |

---

## Data Flow

```
Browser (Zustand store)
  │  optimistic update (instant UI)
  │
  ▼
API Route (Next.js)
  │  validated input
  │
  ▼
Prisma Client
  │
  ▼
PostgreSQL 16 (Docker)
```

The Zustand store performs **optimistic updates** for instant UI feedback, then fires the API call in the background. On load (`loadDecks()`), the store fetches the full state from the DB and hydrates in-memory.

---

## Production Deployment (Vercel + Supabase)

### 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) → sign in with GitHub → **New project**
2. Choose a strong password (letters and numbers only — avoid `/`, `*`, `@`, `#` to prevent URL encoding issues)
3. Region: pick the closest to your users (e.g. Europe West)
4. Uncheck **Enable Data API** and **Enable automatic RLS** — not needed when using Prisma directly

### 2. Get the connection string

1. In your Supabase project → click **Connect** (top center)
2. Tab **Connection String** → Type: `URI` → Method: **Transaction pooler**

   > **Why Transaction pooler and not the others?**
   >
   > - **Direct connection** (`db.*` host, port 5432): IPv4-only — Vercel runs on IPv6, so this always fails with `Can't reach database server`
   > - **Session pooler** (port 5432 via pooler host): limited concurrent connections — hits `MaxClientsInSessionMode` quickly on serverless because each Vercel function invocation opens a new connection
   > - **Transaction pooler** (port 6543): designed for serverless — connections are released after each transaction, no limit issues

3. Copy the URL — it looks like:
   ```
   postgresql://postgres.[project-ref]:[PASSWORD]@aws-0-eu-west-1.pooler.supabase.com:6543/postgres
   ```
4. Replace `[PASSWORD]` with your database password and append `?pgbouncer=true`:
   ```
   postgresql://postgres.[project-ref]:[PASSWORD]@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true
   ```

> **Important:** never commit this URL. Set it as an environment variable only.
> If your password contains special characters, percent-encode them: `/` → `%2F`, `@` → `%40`, `#` → `%23`, `*` → `%2A`

### 3. Run migrations on Supabase

> **Two different URLs are needed** — one for migrations (run locally), one for the app (Vercel):
>
> | Usage                         | URL type           | Host                                  | Port | Extra             |
> | ----------------------------- | ------------------ | ------------------------------------- | ---- | ----------------- |
> | Migrations from local machine | Direct connection  | `db.[project-ref].supabase.co`        | 5432 | —                 |
> | App on Vercel                 | Transaction pooler | `aws-0-eu-west-1.pooler.supabase.com` | 6543 | `?pgbouncer=true` |
>
> The migration engine does not support `pgbouncer=true` — always use the Direct connection URL for `prisma migrate deploy`.
> The Direct connection works from your local machine (IPv4). Vercel is IPv6-only so it needs the pooler.

Run this once from your local machine:

```bash
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[project-ref].supabase.co:5432/postgres" \
  npx prisma migrate deploy
```

You should see `All migrations have been successfully applied.`

> **Password tip:** use letters and numbers only — no special characters (`'`, `"`, `(`, `/`, `@`, `#`, `*`).
> Special characters break the shell command and require percent-encoding.
> If you already have a password with special characters, reset it in Supabase → Connect → **Reset your database password**.

> If you see `The table 'public.Deck' does not exist`, the migrations were not applied — run the command above.

### 4. Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) → **Add New Project** → import `MagicAIBuilder` from GitHub
2. Before clicking Deploy, expand **Environment Variables** and add:
   - `DATABASE_URL` = your Transaction Pooler URL:
     ```
     postgresql://postgres.[project-ref]:[PASSWORD]@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true
     ```
   - `ANTHROPIC_API_KEY` = your key (if using AI features)
3. Click **Deploy**

> Vercel redeploys automatically on every push to `main`.

### 5. Monitor uptime (once deployed)

See the UptimeRobot instructions in [roadmap.md](./roadmap.md) under **Observability → Level 1**.

---

## Error Reporting

### How errors reach Sentry

Three paths, and all three are needed — the first two were missing entirely, which left server-side failures invisible in production.

| Path             | File                            | Covers                                                         |
| ---------------- | ------------------------------- | -------------------------------------------------------------- |
| `onRequestError` | `src/instrumentation.ts`        | Unhandled errors in route handlers, server components, actions |
| `logger.error`   | `src/lib/logger.ts`             | Errors the app catches and turns into a JSON 500               |
| Error boundaries | `error.tsx`, `global-error.tsx` | Client render failures                                         |

**`src/instrumentation.ts`** exports `register()`, which loads `sentry.server.config.ts` or `sentry.edge.config.ts` depending on `NEXT_RUNTIME`, and `onRequestError = Sentry.captureRequestError`. This is the supported path for App Router server errors with `@sentry/nextjs` v9+; without the file, nothing on the server is reported.

**`src/instrumentation-client.ts`** replaces the deprecated root `sentry.client.config.ts` and adds `onRouterTransitionStart`, so client-side navigations are traced. Do not reintroduce `sentry.client.config.ts` — having both double-initialises the SDK.

**`logger.error` reports to Sentry.** This matters because every API route catches its errors and returns a JSON 500, so `onRequestError` never sees them. The logger recovers the `Error` from either the first argument or the meta list, since call sites use both shapes:

```ts
logger.error(error, "GET /api/decks"); // preferred — carries the stack
logger.error("Unexpected error", "addCard", err); // also reported, same stack
```

If neither yields an `Error`, one is synthesised from the message so the report still groups. `context` becomes a Sentry tag; remaining meta becomes extra context. Reporting is wrapped in a `try/catch`: a Sentry outage must never make a logging call throw.

### Error boundaries

- `src/app/[locale]/error.tsx` — localised, offers retry and a way back to the deck list, shows `error.digest`.
- `src/app/global-error.tsx` — last resort for root-layout failures. It replaces the whole document, so it renders its own `<html>`/`<body>` and stays in English: no provider, and therefore no translations, are available at that point.

### `/api/health`

`GET /api/health` returns `200 {status:"ok", db:"ok", latencyMs}` or `503 {status:"degraded", db:"unreachable", latencyMs}`.

The failure branch deliberately does **not** return the driver's error message — the endpoint is unauthenticated and that message can name hosts, users and credentials. The detail goes to the logs and to Sentry instead.

---

## Applying Schema Changes to Production (without migration history)

When a PR adds new columns or tables to `prisma/schema.prisma` and the production database **has no migration history** (common with Supabase), use `db push` instead of `migrate deploy`:

```bash
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[project-ref].supabase.co:5432/postgres" \
  npx prisma db push
```

This synchronises the Prisma schema with the live database:

- Adds missing columns and tables
- Does **not** drop existing data
- Does **not** require a `_prisma_migrations` table

### When to use which command

| Situation                                                    | Command                     |
| ------------------------------------------------------------ | --------------------------- |
| DB has migration history (`_prisma_migrations` table exists) | `npx prisma migrate deploy` |
| DB has no migration history / baseline error (P3005)         | `npx prisma db push`        |
| First deploy to empty DB                                     | `npx prisma migrate deploy` |
| Dev environment (creates migration files)                    | `npx prisma migrate dev`    |

### ⚠️ Checklist after any schema change

Every PR that modifies `prisma/schema.prisma` **must** include:

1. ✅ Migration SQL file in `prisma/migrations/`
2. ✅ `prisma generate` passes
3. ✅ PR description mentions the schema change
4. ✅ **After merge**: run `db push` or `migrate deploy` on production before the Vercel build goes live
5. ✅ Verify auth still works (sign in with Google) — NextAuth uses `User` table heavily

> **Why this matters:** `prisma generate` (which runs during Vercel build) updates the TypeScript client to expect the new columns. If the database doesn't have them yet, **all auth breaks** with `PrismaClientKnownRequestError: The column X does not exist`. This happened on 2026-03-28 when `User.username` was added but not applied to prod DB.

---

## Resetting the Database

Use this when you need to **wipe all data** and recreate tables from the Prisma schema (e.g., during development or before launch).

### Local (Docker)

```bash
pnpm db:reset
```

This drops and recreates the local database, re-runs all migrations, and regenerates the Prisma Client.

### Production (Supabase / Neon)

```bash
npx prisma db push --force-reset
```

This connects to the database defined in `DATABASE_URL` (from `.env`), drops all tables, and recreates them from the schema.

> **Warning:** This is a destructive operation — all data is permanently deleted. Only run this if you are certain the database has no data you need to keep.

To reset a specific remote database without changing `.env`:

```bash
DATABASE_URL="postgresql://user:password@host:port/dbname" npx prisma db push --force-reset
```

After resetting production, redeploy if needed so the app picks up the clean state.

---

## Production Considerations

- Always use the **Transaction Pooler** URL (port 6543, `?pgbouncer=true`) with Vercel — session and direct connections both fail in serverless
- Use `npx prisma migrate deploy` (not `dev`) in CI/CD pipelines
- Run migrations manually from your local machine when deploying schema changes
- The `CardCache` table should be periodically pruned (rows older than 24h are stale)
