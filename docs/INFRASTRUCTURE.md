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
pnpm dev
```

---

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `DATABASE_URL` | ✅ Yes | — | PostgreSQL connection string |

---

## Prisma Commands

| Command | Description |
|---|---|
| `pnpm db:up` | Start Docker Postgres |
| `pnpm db:down` | Stop Docker Postgres |
| `pnpm db:migrate` | Run pending migrations & regenerate client |
| `pnpm db:studio` | Open Prisma Studio (visual DB browser) |
| `pnpm db:reset` | Drop + recreate DB + re-run all migrations |
| `pnpm prisma generate` | Regenerate client only (no migration) |
| `pnpm prisma migrate dev --name <name>` | Create a named migration |
| `pnpm prisma migrate deploy` | Apply migrations in production |

---

## API Routes

All CRUD operations go through Next.js App Router API routes:

| Method | Route | Description |
|---|---|---|
| GET | `/api/decks` | List all decks |
| POST | `/api/decks` | Create a deck |
| GET | `/api/decks/[id]` | Get one deck (with cards) |
| PATCH | `/api/decks/[id]` | Update deck metadata |
| DELETE | `/api/decks/[id]` | Delete deck + cascade cards |
| POST | `/api/decks/[id]/cards` | Add a card |
| DELETE | `/api/decks/[id]/cards` | Remove all cards |
| DELETE | `/api/decks/[id]/cards/[cardId]` | Remove one card |
| PATCH | `/api/decks/[id]/cards/[cardId]` | Update card (category, etc.) |
| GET | `/api/cache/cards?id=<id>` | Lookup cached Scryfall card |
| POST | `/api/cache/cards` | Store Scryfall card in cache |

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

## Production Considerations

- Set `DATABASE_URL` as a secret in your deployment environment
- Use `pnpm prisma migrate deploy` (not `dev`) in CI/CD pipelines
- The `CardCache` table should be periodically pruned (rows older than 24h are stale)
- Consider connection pooling (PgBouncer / Prisma Accelerate) for serverless deployments
