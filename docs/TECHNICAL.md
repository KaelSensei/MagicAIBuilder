# MagicAIBuilder — Technical Documentation

## Stack

| Layer | Technology | Version | Why |
|---|---|---|---|
| Framework | Next.js App Router | 15.x | Server components, file-based routing, image optimization |
| Language | TypeScript | 5.x | Strict typing, full project coverage |
| Styling | Tailwind CSS | 4.x | Utility-first, v4 CSS-native (no config file needed) |
| Components | shadcn/ui + Radix | latest | Accessible primitives, dark theme ready |
| Animations | Framer Motion | 11.x | Card hover zoom, stagger grids, panel transitions |
| State | Zustand | 5.x | Simple, minimal boilerplate vs. Redux |
| Data Fetching | TanStack Query | 5.x | Built-in caching, deduplication, retry — critical for Scryfall rate limits |
| Drag & Drop | dnd-kit | 6.x | Actively maintained, better perf than react-beautiful-dnd |
| Icons | Lucide React | latest | Consistent, tree-shakeable |
| Package Manager | pnpm | 10.x | Fast, disk-efficient |
| Testing (unit) | Vitest | 3.x | Vite-native, fast, ESM-compatible |
| Testing (E2E) | Playwright | 1.51.x | Cross-browser, reliable |

---

## Directory Architecture

```
src/
  app/                      # Next.js App Router pages
    layout.tsx              # Root layout: fonts, dark theme, Providers
    providers.tsx           # TanStack Query client
    page.tsx                # Home / deck list
    builder/[deckId]/
      page.tsx              # 3-panel builder view

  components/
    ui/
      utils.ts              # cn() helper (clsx + tailwind-merge)
    card/
      CardImage.tsx         # Image + hover zoom (Framer Motion)
      CardTooltip.tsx       # Radix Tooltip with card detail
      CardGrid.tsx          # Animated stagger grid
      CardListItem.tsx      # Compact row with flags + remove
    search/
      SearchBar.tsx         # Debounced input (400ms)
      SearchFilters.tsx     # Color/CMC/price filters
      SearchResults.tsx     # Loading / error / results
    deck/
      DeckEditor.tsx        # Collapsible category groups
      DeckStats.tsx         # Stat rows with status icons
      ManaCurve.tsx         # Animated bar chart
      BracketIndicator.tsx  # Score + dimension mini bars
      GameChangersBadge.tsx # GC count + over-limit warning
      BanlistAlert.tsx      # Animated banned/color alert
    layout/
      Header.tsx            # Logo, nav, actions
      Sidebar.tsx           # Future sidebar

  lib/
    db/
      prisma.ts             # PrismaClient singleton (dev-safe)
      deck-api.ts           # HTTP client for /api/deck* routes
    scryfall/
      client.ts             # Rate-limited fetch (100ms min) + DB cache
      types.ts              # ScryfallCard, response types
      images.ts             # Image URL helpers
      search.ts             # Query builder
    deck/
      types.ts              # Core domain types
      store.ts              # Zustand store (DB-synced, no localStorage)
      categories.ts         # Auto-categorization engine
      stats.ts              # computeDeckStats()
      bracket.ts            # scoreBracket() engine
      validation.ts         # validateCardForDeck() / validateDeck()
      import.ts             # Text decklist parser
      export.ts             # Export utilities
    constants/
      brackets.ts           # Bracket definitions + colors
      benchmarks.ts         # EDH heuristic thresholds

  hooks/
    useCardSearch.ts        # TanStack Query search (5 min cache)
    useCardLookup.ts        # TanStack Query single card (24h)
    useDeck.ts              # Zustand + computed stats
    useBracketScore.ts      # Memoized bracket score
    useGameChangers.ts      # GC list + deck intersection

  styles/
    globals.css             # Tailwind 4 + CSS custom properties

__tests__/                  # Vitest unit tests
  lib/deck/
    bracket.test.ts
    validation.test.ts
    categories.test.ts
  lib/scryfall/
    client.test.ts

e2e/                        # Playwright E2E tests
  search.spec.ts
  deck-builder.spec.ts
```

---

## Key Patterns

### Zustand Store Shape

```typescript
// lib/deck/store.ts
interface DeckStore {
  // State
  decks: Record<string, Deck>;      // All decks by ID
  activeDeckId: string | null;      // Currently edited deck

  // Deck CRUD
  createDeck(name: string): string;
  deleteDeck(id: string): void;
  renameDeck(id: string, name: string): void;
  setActiveDeck(id: string): void;

  // Card management
  setCommander(card: ScryfallCard): void;
  addCard(card: ScryfallCard): void;
  removeCard(cardId: string): void;
  updateCardCategory(cardId: string, category: CardCategory): void;

  // Settings
  setTargetBracket(bracket: 1 | 2 | 3 | 4): void;
  setBudget(budget: number | null): void;

  // Computed
  getActiveDeck(): Deck | null;
}
```

Persistence: `zustand/middleware/persist` → `localStorage` key `magic-ai-builder-decks`. Dates are revived on rehydration.

### TanStack Query Keys

| Hook | Query Key | Cache TTL |
|---|---|---|
| `useCardSearch(query)` | `["scryfall", "search", query]` | 5 min |
| `useCardSearchInfinite(query)` | `["scryfall", "search", "infinite", query]` | 5 min |
| `useCardAutocomplete(partial)` | `["scryfall", "autocomplete", partial]` | 5 min |
| `useCardLookup(id)` | `["scryfall", "card", "id", id]` | 24h |
| `useCardLookupByName(name)` | `["scryfall", "card", "name", name]` | 24h |
| `useGameChangersList()` | `["scryfall", "game-changers"]` | 24h |

### Scryfall Rate Limiting

Scryfall allows max 10 requests/second. Strategy:

```typescript
// lib/scryfall/client.ts
let lastRequestTime = 0;

async function rateLimitedFetch(url: string, options?: RequestInit) {
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < 100) {
    await new Promise(resolve => setTimeout(resolve, 100 - elapsed));
  }
  lastRequestTime = Date.now();
  return fetch(url, { ...options, headers: { "User-Agent": "MagicAIBuilder/1.0", ...headers } });
}
```

TanStack Query's deduplication prevents multiple identical requests from firing concurrently, complementing the rate limiter.

### Bracket Scoring Algorithm

```
scoreBracket(deck, stats) → BracketScore

1. Compute 6 dimensions (each scored 1–4):
   - ramp:     ramp count + avg CMC inverse
   - draw:     draw piece count
   - removal:  removal + boardWipes × 1.5
   - tutors:   non-land library searches
   - winSpeed: explicit win cons + fast win combos
   - avgCmc:   lower = higher bracket

2. overall = round(average(dimensions))

3. Game Changers override:
   - count > 3 → overall = max(overall, 4)
   - count > 0 → overall = max(overall, 3)

4. Clamp overall to [1, 4]

5. Generate human-readable warnings
```

### Card Auto-Categorization

Priority order (first match wins):

1. `land` — type line contains "land"
2. `planeswalker` — type line contains "planeswalker"
3. `winCondition` — oracle text: "win the game", "take an extra turn", "storm count"
4. `ramp` — oracle text: "add {", "search for a land", "put a land" + CMC ≤ 4
5. `boardWipe` — oracle text: "destroy all", "exile all", "damage to each creature"
6. `removal` — oracle text: "destroy target", "exile target", "damage to target"
7. `draw` — oracle text: "draw a card", "draw X cards", library tutors
8. `protection` — hexproof/shroud + low CMC, counterspells
9. Type fallbacks: `creature`, `instant`, `sorcery`, `artifact`, `enchantment`
10. `other` — catch-all

---

## Code Conventions

### TypeScript
- Strict mode enabled
- `interface` for object shapes, `type` for unions/aliases
- No `any` — use `unknown` + type guards
- All exported functions have explicit return types

### Components
- `"use client"` directive where needed (all interactive components)
- Props interfaces defined inline above the component
- `cn()` (clsx + tailwind-merge) for conditional class names
- CSS custom properties for theme colors — never hardcoded hex in className

### Naming
- Files: `PascalCase` for components, `camelCase` for utilities/hooks
- Hooks: prefix `use`
- Test files: `*.test.ts` for unit, `*.spec.ts` for E2E

### Commits
- Conventional Commits format: `type(scope): description`
- Types: `feat`, `fix`, `docs`, `chore`, `test`, `refactor`, `style`
- Examples:
  - `feat(bracket): implement scoring engine`
  - `test(validation): add color identity tests`
  - `docs: add TECHNICAL.md`

---

## Local Development

### Prerequisites

- Node.js 22+
- pnpm 10+

### Setup

```bash
# Install dependencies
pnpm install

# Start dev server
pnpm dev
# → http://localhost:3000
```

### Testing

```bash
# Unit tests
pnpm test

# Unit tests (watch mode)
pnpm test:watch

# Coverage report
pnpm test:coverage

# E2E tests (requires running dev server OR uses webServer config)
pnpm test:e2e

# Install Playwright browsers (first time)
npx playwright install chromium
```

### Build

```bash
pnpm build    # Production build
pnpm start    # Start production server
pnpm lint     # ESLint check
```

### Environment

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ Yes | PostgreSQL connection string |

See `docs/INFRASTRUCTURE.md` for full infra setup instructions.

---

## Database Layer

MagicAIBuilder uses **PostgreSQL + Prisma** for persistent storage. The Zustand store no longer persists to `localStorage` — all deck state is synced to the DB.

### Architecture

```
Zustand (in-memory, optimistic)
    ↕ fetch
Next.js API Routes (/api/decks/*)
    ↕ Prisma Client
PostgreSQL 16
```

### Prisma Client

`src/lib/db/prisma.ts` exports a singleton `PrismaClient` instance, safe for Next.js hot-reload in development.

### API Client

`src/lib/db/deck-api.ts` provides typed async functions:
- `fetchDecks()`, `createDeck()`, `updateDeck()`, `deleteDeck()`
- `addCard()`, `removeCard()`, `updateCardCategory()`, `removeAllCards()`
- `lookupCardCache()`, `storeCardCache()` — for Scryfall DB cache

### Scryfall Cache

`getCardById()` in `src/lib/scryfall/client.ts` now checks the DB `CardCache` before hitting Scryfall. Cache entries expire after 24h.

---

## Scryfall API Reference

| Endpoint | Used For |
|---|---|
| `GET /cards/search?q={query}` | Main card search |
| `GET /cards/named?exact={name}` | Single card lookup |
| `GET /cards/named?fuzzy={name}` | Fuzzy match |
| `POST /cards/collection` | Batch lookup (up to 75) |
| `GET /cards/autocomplete?q={partial}` | Name autocomplete |
| `GET /cards/search?q=is:gamechanger` | Game Changers list |
| `GET /cards/search?q=banned:commander` | Commander banlist |

Rate limit: 10 req/s. Be respectful — Scryfall is a free, community-supported service.

---

## Phase Roadmap

| Phase | Focus | Status |
|---|---|---|
| Phase 1 | Free Build mode — Scryfall search, drag & drop, stats, bracket scoring | 🚧 In Progress |
| Phase 2 | Import/Export, multi-deck management, budget tracking, Moxfield sync | Planned |
| Phase 3 | AI-assisted build — recommendations, archetype detection, optimization | Planned |
