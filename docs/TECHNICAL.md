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
| Database | PostgreSQL 16 | — | Persistent deck storage via Docker Compose |
| ORM | Prisma | 6.x | Type-safe DB client, migrations, schema |
| Validation | Zod | 3.x | Runtime schema validation on API boundaries |
| Icons | Lucide React | latest | Consistent, tree-shakeable |
| Package Manager | pnpm | 10.x | Fast, disk-efficient |
| Testing (unit) | Vitest | 3.x | Vite-native, fast, ESM-compatible |
| Testing (E2E) | Playwright | 1.51.x | Cross-browser, reliable |

---

## Directory Architecture

```
src/
  app/                          # Next.js App Router pages
    layout.tsx                  # Root layout: fonts, dark theme, suppressHydrationWarning
    providers.tsx               # TanStack Query client + EnrichmentProvider
    page.tsx                    # Home / deck list (commander art card backgrounds)
    builder/[deckId]/
      page.tsx                  # 3-panel builder view (Search | DeckEditor | Stats)
    api/
      decks/
        route.ts                # GET /api/decks, POST /api/decks
        [id]/
          route.ts              # GET/PATCH/DELETE /api/decks/[id]
          cards/
            route.ts            # POST /api/decks/[id]/cards
            [cardId]/
              route.ts          # DELETE/PATCH /api/decks/[id]/cards/[cardId]
      cache/
        cards/
          route.ts              # GET/POST /api/cache/cards
      ai/
        suggest/
          route.ts              # POST /api/ai/suggest

  components/
    ui/
      utils.ts                  # cn() helper (clsx + tailwind-merge)
    card/
      CardImage.tsx             # Image + hover zoom (Framer Motion)
      CardTooltip.tsx           # Radix Tooltip with card detail
      CardGrid.tsx              # Animated stagger grid
      CardListItem.tsx          # Compact row with flags + remove
      DraggableCard.tsx         # dnd-kit draggable wrapper
      PrintingSelectorModal.tsx # Choose printing/art before adding to deck
    search/
      SearchBar.tsx             # Debounced input (400ms)
      SearchFilters.tsx         # Color/CMC/price filters
      SearchResults.tsx         # Loading / error / results
      SetAutocomplete.tsx       # Set code autocomplete for set search
    deck/
      DeckEditor.tsx            # Collapsible category groups + droppable zones
      DeckStats.tsx             # Stat rows with status icons
      ManaCurve.tsx             # Animated bar chart
      ColorDistribution.tsx     # Color distribution display
      BracketIndicator.tsx      # Score + dimension mini bars
      GameChangersBadge.tsx     # GC count + over-limit warning
      BanlistAlert.tsx          # Animated banned/color identity alert
      CombosPanel.tsx           # Commander Spellbook combo detection
      AISuggestionsPanel.tsx    # AI-assisted deck suggestions
      ImportDialog.tsx          # Text decklist import modal
      ExportModal.tsx           # Multi-format export (MTGO, Arena, plain text)
    layout/
      Header.tsx                # Logo, nav, theme toggle, actions
      Footer.tsx                # Legal notices (WotC + Scryfall disclaimers)
    providers/
      EnrichmentProvider.tsx    # Background GC + banlist enrichment on load
      ThemeSync.tsx             # Syncs CSS data-theme with Zustand theme store

  lib/
    db/
      prisma.ts                 # PrismaClient singleton (dev hot-reload safe)
      deck-api.ts               # HTTP client for /api/deck* routes
    scryfall/
      client.ts                 # Rate-limited fetch (100ms min) + DB CardCache
      types.ts                  # ScryfallCard, response types
      images.ts                 # Image URL helpers (normal/large/art_crop)
      search.ts                 # Query builder (name/set/color modes)
    deck/
      types.ts                  # Core domain types (DeckCard, Deck, BracketScore…)
      store.ts                  # Zustand store — DB-synced, no localStorage
      categories.ts             # Auto-categorization engine (15 categories)
      stats.ts                  # computeDeckStats()
      bracket.ts                # scoreBracket() — 6-dimension engine
      validation.ts             # validateCardForDeck() / validateDeck()
      import.ts                 # Text decklist parser
      export.ts                 # MTGO / Arena / plain text export
    constants/
      brackets.ts               # Bracket definitions + colors
      benchmarks.ts             # EDH heuristic thresholds

  hooks/
    useCardSearch.ts            # TanStack Query search (5 min cache)
    useCardSearchInfinite.ts    # Paginated card search
    useCardLookup.ts            # TanStack Query single card by ID (24h)
    useCardLookupByName.ts      # TanStack Query single card by name (24h)
    useDeck.ts                  # Zustand + computed stats
    useBracketScore.ts          # Memoized bracket score
    useGameChangers.ts          # GC list + isGameChanger() helper
    useBanlist.ts               # Banlist + isBanned() helper
    useCombos.ts                # Commander Spellbook API combo detection
    useTheme.ts                 # Dark/light theme preference store
    useAISuggestions.ts         # AI analysis with Anthropic/OpenAI provider fallback

  styles/
    globals.css                 # Tailwind 4 + CSS custom properties (theme tokens)

__tests__/                      # Vitest unit tests
  lib/deck/
    bracket.test.ts
    validation.test.ts
    categories.test.ts
  lib/scryfall/
    client.test.ts

e2e/                            # Playwright E2E tests
  search.spec.ts
  deck-builder.spec.ts

prisma/
  schema.prisma                 # Deck, DeckCard, CardCache models
  migrations/                   # Auto-generated Prisma migrations
```

---

## Key Patterns

### Zustand Store Shape

```typescript
// lib/deck/store.ts
interface DeckStore {
  // State
  decks: Record<string, Deck>;      // All decks by ID (loaded from DB)
  activeDeckId: string | null;      // Currently edited deck

  // Deck CRUD (all synced to DB via /api/decks)
  createDeck(name: string): Promise<string>;
  deleteDeck(id: string): Promise<void>;
  renameDeck(id: string, name: string): Promise<void>;
  setActiveDeck(id: string): void;
  loadDecks(): Promise<void>;       // Hydrate from DB on mount

  // Card management (synced to DB via /api/decks/[id]/cards)
  setCommander(card: ScryfallCard): Promise<void>;
  addCard(card: ScryfallCard): Promise<void>;
  removeCard(cardId: string): Promise<void>;
  updateCardCategory(cardId: string, category: CardCategory): Promise<void>;

  // Settings
  setTargetBracket(bracket: 1 | 2 | 3 | 4): void;
  setBudget(budget: number | null): void;

  // Computed
  getActiveDeck(): Deck | null;
}
```

**Persistence**: PostgreSQL via Prisma. No localStorage. State is loaded on mount via `loadDecks()`.

**Enrichment**: On `addCard` and `setCommander`, the store cross-references GC list and banlist to set `isGameChanger` and `isBanned` flags. This happens via `EnrichmentProvider` on app start.

### TanStack Query Keys

| Hook | Query Key | Cache TTL |
|---|---|---|
| `useCardSearch(query)` | `["scryfall", "search", query]` | 5 min |
| `useCardSearchInfinite(query)` | `["scryfall", "search", "infinite", query]` | 5 min |
| `useCardLookup(id)` | `["scryfall", "card", "id", id]` | 24h |
| `useCardLookupByName(name)` | `["scryfall", "card", "name", name]` | 24h |
| `useGameChangers()` | `["scryfall", "game-changers"]` | 24h |
| `useBanlist()` | `["scryfall", "banlist"]` | 24h |
| `useCombos(commanderName)` | `["combos", commanderName]` | 30 min |

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

TanStack Query's deduplication prevents duplicate concurrent requests. `getCardById()` checks the DB `CardCache` before hitting Scryfall (24h TTL).

### Search Modes (3 tabs)

| Tab | Scryfall Query | Hook |
|---|---|---|
| By Name | `name:"{query}"` | `useCardSearch` |
| By Set | `set:{setCode}` | `useCardSearch` |
| By Color | `id<={colorString} commander:true` | `useCardSearch` |

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

3. Game Changers override (2025 bracket rules):
   - B1/B2 → 0 GC allowed
   - B3    → max 3 GC
   - count > 3 → overall = max(overall, 4)
   - count > 0 → overall = max(overall, 3)

4. Clamp overall to [1, 4]

5. Generate human-readable warnings
```

### Commander Pairing Types

```typescript
type CommanderPairingType =
  | "none"           // Single commander
  | "partner"        // Generic "Partner" keyword
  | "partner_with"   // "Partner with [specific name]"
  | "friends_forever" // Doctor Who sets
  | "background"     // "Choose a Background" + Background enchantment
  | "doctor";        // "Doctor's companion"
```

### dnd-kit Drag & Drop Architecture

- `DndContext` at builder page root (single context, no nesting)
- Search results: `useDraggable` on each `DraggableCard`
- Deck categories: `useDroppable` on each `DroppableCategory`
  - **Critical**: droppable zones must always render their `ref` div — never return `null` when empty, or the zone unregisters from dnd-kit and drag events stop firing
- Intra-deck drag: cards are both draggable and droppable for category reordering

### AI Suggestions Pattern

```typescript
// POST /api/ai/suggest
// Body: { deck: Deck, stats: DeckStats, bracketScore: BracketScore }
// Response: { suggestions: string[], reasoning: string }

// Provider fallback order:
// 1. ANTHROPIC_API_KEY → claude-sonnet-4-6
// 2. OPENAI_API_KEY → gpt-4o
// 3. Mock response (no key configured)
```

### Theme Toggle Pattern

```typescript
// useTheme.ts — Zustand store
// ThemeSync.tsx — syncs store → document.documentElement.dataset.theme
// layout.tsx — inline <script> sets data-theme before React hydrates (prevents flash)
// <html suppressHydrationWarning> — suppresses server/client mismatch on data-theme attr
```

---

## Prisma Schema

```prisma
model Deck {
  id          String     @id @default(cuid())
  name        String
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
  cards       DeckCard[]
}

model DeckCard {
  id          String   @id @default(cuid())
  deckId      String
  scryfallId  String
  name        String
  category    String
  quantity    Int      @default(1)
  cardData    Json     // Full ScryfallCard snapshot
  deck        Deck     @relation(fields: [deckId], references: [id], onDelete: Cascade)
}

model CardCache {
  id          String   @id  // Scryfall card ID
  data        Json         // Full ScryfallCard JSON
  cachedAt    DateTime @default(now())
}
```

---

## API Routes

| Method | Path | Description |
|---|---|---|
| GET | `/api/decks` | List all decks |
| POST | `/api/decks` | Create new deck |
| GET | `/api/decks/[id]` | Get deck with cards |
| PATCH | `/api/decks/[id]` | Rename deck |
| DELETE | `/api/decks/[id]` | Delete deck (cascade cards) |
| POST | `/api/decks/[id]/cards` | Add card to deck |
| DELETE | `/api/decks/[id]/cards/[cardId]` | Remove card (uses DB CUID, not scryfallId) |
| PATCH | `/api/decks/[id]/cards/[cardId]` | Update card category |
| GET | `/api/cache/cards` | Lookup card in DB cache |
| POST | `/api/cache/cards` | Store card in DB cache |
| POST | `/api/ai/suggest` | Get AI suggestions for deck |

---

## Code Conventions

### TypeScript
- Strict mode enabled
- `interface` for object shapes, `type` for unions/aliases
- No `any` — use `unknown` + type guards
- All exported functions have explicit return types
- Zod for API boundary validation

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
- Conventional Commits: `type(scope): description`
- Types: `feat`, `fix`, `docs`, `chore`, `test`, `refactor`, `style`

---

## Local Development

### Prerequisites

- Node.js 22+
- pnpm 10+
- Docker (for PostgreSQL)

### Setup

```bash
# Start database
docker compose up -d

# Install dependencies
pnpm install

# Run DB migrations
pnpm prisma migrate dev

# Start dev server
pnpm dev
# → http://localhost:3000
```

### Testing

```bash
pnpm test           # Unit tests (Vitest)
pnpm test:watch     # Watch mode
pnpm test:coverage  # Coverage report
pnpm test:e2e       # Playwright E2E (needs running dev server)
```

### Build

```bash
pnpm build    # Production build
pnpm start    # Start production server
pnpm lint     # ESLint check
```

### Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ Yes | PostgreSQL connection string (e.g. `postgresql://user:pass@localhost:5432/magicai`) |
| `ANTHROPIC_API_KEY` | ⚠️ Optional | Enables Claude AI suggestions (falls back to mock) |
| `OPENAI_API_KEY` | ⚠️ Optional | Secondary AI provider fallback |

See `docs/INFRASTRUCTURE.md` for Docker + full infra setup.

---

## External APIs

### Scryfall

| Endpoint | Used For |
|---|---|
| `GET /cards/search?q={query}` | Card search (name/set/color modes) |
| `GET /cards/named?exact={name}` | Single card lookup |
| `GET /cards/named?fuzzy={name}` | Fuzzy match |
| `POST /cards/collection` | Batch lookup (up to 75) |
| `GET /cards/autocomplete?q={partial}` | Name autocomplete |
| `GET /cards/search?q=is:gamechanger` | Game Changers list |
| `GET /cards/search?q=banned:commander` | Commander banlist |

Rate limit: 10 req/s (100ms enforced). Scryfall is free and community-supported — be respectful.

**Known limitation**: Scryfall returns 175 cards/page. GC and banlist lists only fetch the first page. For lists > 175 cards, pagination would need to be added.

### Commander Spellbook

| Endpoint | Used For |
|---|---|
| `GET /api/v2/variants/?commanders={name}` | Combo detection by commander name |

---

## Recent Features (post Phase 4+)

### Card Tooltip — Cursor-Following (`fix/tooltip-follows-cursor`)
- `CardTooltip.tsx` rewritten with `createPortal` to render tooltip in `document.body`
- Tooltip position tracks mouse `clientX/Y` with viewport clamping (never overflows screen edges)
- Replaces previous Radix Tooltip anchor which was pinned to the list row right edge (landing in stats panel)

### Oracle Text Panel in Printing Selector (`feat/oracle-text-in-printing-modal`)
- `PrintingSelectorModal.tsx` — two-column layout: left panel shows mana cost, type line, oracle text, price; right panel shows printings grid
- Handles double-faced cards via `card_faces[0]` fallback for oracle text and mana cost

### Dynamic Set Search (`feat/set-search-all-sets`)
- `SetAutocomplete.tsx` — fetches all sets from `GET /sets` on first focus; module-level in-memory 1h cache
- Filters to Commander-relevant set types; sorted newest first; year badge per entry

### Mana Symbols in Color Filter (`feat/mana-symbols-color-filter`)
- By Color mode buttons now use `<img src="https://svgs.scryfall.io/card-symbols/{code}.svg">`
- Replaces emoji fallbacks (☀️💧💀🔥🌲); colorless (C) merged into the main color list

---

## Deck Annotations (feat/deck-notes-description)

### Deck Description
Field `description String? @default("")` on `Deck`. Stored in DB and synced via `PATCH /api/decks/[id]`. The `DeckDescriptionEditor` component is a collapsible textarea in the deck sidebar, collapsed by default showing the first line as a preview. Supports Ctrl+Enter to save and Esc to cancel. Max 2000 chars (server-enforced).

### Card Notes
Field `notes String?` on `DeckCard`. Synced via `PATCH /api/decks/[id]/cards/[cardId]`. The `CardNoteInline` component renders a 📝 icon (amber when note exists, invisible until hover when empty) on each list-view card. Clicking opens an inline textarea popover. Note text is shown below the card name in amber. Max 1000 chars (server-enforced).

**Export**: `exportPlainText()` emits notes as `// comment` lines immediately after the card line. Other formats (Moxfield, Arena, MTGO) do not include notes.

### Deck Tags
Field `tags String[] @default([])` on `Deck` (PostgreSQL array). Tags are synced via `PATCH /api/decks/[id]` with the full updated array. The `DeckTagsEditor` component shows pill-shaped tags with color coding per tag value. Predefined suggestions: `casual`, `cEDH`, `WIP`, `budget`, `tuned`, `theme`. Tab in the input autocompletes the first suggestion. The home page renders a tag filter bar when any decks have tags, and tag pills on deck cards are clickable to activate filtering.

---

## Phase Roadmap

| Phase | Focus | Status |
|---|---|---|
| Phase 1 | Foundation — Scryfall search, drag & drop, stats, bracket scoring | ✅ Complete |
| Phase 1+ | Integration — PostgreSQL/Prisma, DnD full pipeline, text import | ✅ Complete |
| Phase 2 | Intelligence — combo detection, theme analysis, commander pairing | ✅ Complete |
| Phase 3 | Database & Prisma — persistent storage, migrations, DB cache | ✅ Complete |
| Phase 4 | AI Suggestions — Anthropic/OpenAI integration, deck analysis | ✅ Complete |
| Phase 4+ | Polish — UI enhancements, export, companion, legal, light/dark theme | ✅ Complete |
| Phase 5 | Deck Annotations — description, card notes, tags | ✅ Complete |
| Phase 6 | Onboarding & Tutorial (planned) | 📋 Planned |
