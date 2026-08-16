# MagicAIBuilder — Technical Documentation

## Stack

| Layer           | Technology                  | Version | Why                                                                        |
| --------------- | --------------------------- | ------- | -------------------------------------------------------------------------- |
| Framework       | Next.js App Router          | 15.x    | Server components, file-based routing, image optimization                  |
| Language        | TypeScript                  | 5.x     | Strict typing, full project coverage                                       |
| Styling         | Tailwind CSS                | 4.x     | Utility-first, v4 CSS-native (no config file needed)                       |
| Components      | shadcn/ui + Radix           | latest  | Accessible primitives, dark theme ready                                    |
| Animations      | Framer Motion               | 11.x    | Card hover zoom, stagger grids, panel transitions                          |
| State           | Zustand                     | 5.x     | Simple, minimal boilerplate vs. Redux                                      |
| Data Fetching   | TanStack Query              | 5.x     | Built-in caching, deduplication, retry — critical for Scryfall rate limits |
| Drag & Drop     | dnd-kit                     | 6.x     | Actively maintained, better perf than react-beautiful-dnd                  |
| Database        | PostgreSQL 16               | —       | Persistent deck storage via Docker Compose                                 |
| ORM             | Prisma                      | 6.x     | Type-safe DB client, migrations, schema                                    |
| Validation      | Zod                         | 4.x     | Runtime schema validation on API boundaries                                |
| Icons           | Lucide React                | latest  | Consistent, tree-shakeable                                                 |
| Bundle Analysis | @next/bundle-analyzer       | 16.x    | Visual treemap of JS bundles — run `pnpm analyze`                          |
| 3D Engine       | Three.js + R3F + drei       | 0.183.x | Immersive landing page (spellbook scene)                                   |
| Camera Anim     | gsap                        | 3.14.x  | Cinematic zoom on glyph click                                              |
| Post-Processing | @react-three/postprocessing | 3.x     | Bloom + vignette effects                                                   |
| Package Manager | pnpm                        | 10.x    | Fast, disk-efficient                                                       |
| Testing (unit)  | Vitest                      | 3.x     | Vite-native, fast, ESM-compatible                                          |
| Testing (E2E)   | Playwright                  | 1.51.x  | Cross-browser, reliable                                                    |

---

## Directory Architecture

```
src/
  app/                          # Next.js App Router pages
    layout.tsx                  # Root layout: fonts, dark theme, suppressHydrationWarning
    providers.tsx               # TanStack Query client + EnrichmentProvider
    page.tsx                    # Home: 3D spellbook (unauth) or deck list (auth)
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
          snapshots/
            route.ts            # GET/POST /api/decks/[id]/snapshots
            [snapshotId]/
              route.ts          # DELETE /api/decks/[id]/snapshots/[snapshotId]
              restore/
                route.ts        # POST /api/decks/[id]/snapshots/[snapshotId]/restore
      cache/
        cards/
          route.ts              # GET/POST /api/cache/cards
        search/
          route.ts              # GET/POST /api/cache/search (1h TTL)
      ai/
        suggest/
          route.ts              # POST /api/ai/suggest

  components/
    landing/
      SpellbookScene.tsx        # R3F Canvas + scene composition (ssr: false)
      Spellbook.tsx             # Procedural open book model
      Altar.tsx                 # Stone altar base
      GlyphSymbol.tsx           # Interactive glowing runes (Sign In/Up)
      CameraRig.tsx             # Idle sway + gsap cinematic zoom
      ManaParticles.tsx         # Sparkles particle system
      PostEffects.tsx           # Bloom + vignette
      LandingPage.tsx           # Mobile/a11y detection wrapper
      StaticLandingPage.tsx     # 2D fallback
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
      SnapshotsPanel.tsx        # Named deck snapshots — save/restore/delete + diff badge
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
      multiples.ts              # maxQuantity() / allowsMultiples() — Commander singleton rules
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
  decks: Record<string, Deck>; // All decks by ID (loaded from DB)
  activeDeckId: string | null; // Currently edited deck

  // Deck CRUD (all synced to DB via /api/decks)
  createDeck(name: string): Promise<string>;
  deleteDeck(id: string): Promise<void>;
  renameDeck(id: string, name: string): Promise<void>;
  setActiveDeck(id: string): void;
  loadDecks(): Promise<void>; // Hydrate from DB on mount

  // Card management (synced to DB via /api/decks/[id]/cards)
  setCommander(card: ScryfallCard): Promise<void>;
  addCard(
    card: ScryfallCard,
    quantity?: number,
    zone?: "main" | "sideboard" | "maybeboard"
  ): Promise<void>;
  removeCard(cardId: string): Promise<void>;
  updateCardCategory(cardId: string, category: CardCategory): Promise<void>;
  moveCardToZone(
    cardId: string,
    zone: "main" | "sideboard" | "maybeboard"
  ): Promise<void>;

  // View preferences
  deckViewMode: "grid" | "list";
  deckGridCols: 2 | 3 | 4 | 6 | 8; // Default: 6
  setDeckViewMode(mode: "grid" | "list"): void;
  setDeckGridCols(cols: 2 | 3 | 4 | 6 | 8): void;

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

| Hook                           | Query Key                                   | Cache TTL |
| ------------------------------ | ------------------------------------------- | --------- |
| `useCardSearch(query)`         | `["scryfall", "search", query]`             | 5 min     |
| `useCardSearchInfinite(query)` | `["scryfall", "search", "infinite", query]` | 5 min     |
| `useCardLookup(id)`            | `["scryfall", "card", "id", id]`            | 24h       |
| `useCardLookupByName(name)`    | `["scryfall", "card", "name", name]`        | 24h       |
| `useGameChangers()`            | `["scryfall", "game-changers"]`             | 24h       |
| `useBanlist()`                 | `["scryfall", "banlist"]`                   | 24h       |
| `useCombos(commanderName)`     | `["combos", commanderName]`                 | 30 min    |

### Scryfall Rate Limiting

Scryfall allows max 10 requests/second. Strategy:

```typescript
// lib/scryfall/client.ts
let lastRequestTime = 0;

async function rateLimitedFetch(url: string, options?: RequestInit) {
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < 100) {
    await new Promise((resolve) => setTimeout(resolve, 100 - elapsed));
  }
  lastRequestTime = Date.now();
  return fetch(url, {
    ...options,
    headers: { "User-Agent": "MagicAIBuilder/1.0", ...headers },
  });
}
```

TanStack Query's deduplication prevents duplicate concurrent requests. `getCardById()` checks the DB `CardCache` before hitting Scryfall (24h TTL).

### Search Modes (3 tabs)

| Tab      | Scryfall Query                     | Hook            |
| -------- | ---------------------------------- | --------------- |
| By Name  | `name:"{query}"`                   | `useCardSearch` |
| By Set   | `set:{setCode}`                    | `useCardSearch` |
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

3. 2-card infinite combo override (RC rule):
   - If any combo from Spellbook has isInfinite=true AND cards.length===2 → overall = 4
   - Counted as `twoCardInfiniteCombos` in BracketScore

4. Game Changers override (2025 bracket rules):
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
  | "none" // Single commander
  | "partner" // Generic "Partner" keyword
  | "partner_with" // "Partner with [specific name]"
  | "friends_forever" // Doctor Who sets
  | "background" // "Choose a Background" + Background enchantment
  | "doctor"; // "Doctor's companion"
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
  id            String   @id @default(cuid())
  deckId        String
  scryfallId    String
  name          String
  category      String
  quantity      Int      @default(1)
  isCommander   Boolean  @default(false)
  isPartner     Boolean  @default(false)
  isMaybeboard  Boolean  @default(false)  // Considered cards outside the 99
  deck          Deck     @relation(fields: [deckId], references: [id], onDelete: Cascade)
}

model CardCache {
  id          String   @id  // Scryfall card ID
  data        Json         // Full ScryfallCard JSON
  cachedAt    DateTime @default(now())
}

model DeckSnapshot {
  id        String   @id @default(cuid())
  deckId    String
  name      String
  cardList  Json     // Full DeckCard array at snapshot time
  commander String?  // Commander name at snapshot time
  cardCount Int
  createdAt DateTime @default(now())
  deck      Deck     @relation(fields: [deckId], references: [id], onDelete: Cascade)
}
```

---

## API Routes

| Method | Path                                             | Description                                |
| ------ | ------------------------------------------------ | ------------------------------------------ |
| GET    | `/api/decks`                                     | List all decks                             |
| POST   | `/api/decks`                                     | Create new deck                            |
| GET    | `/api/decks/[id]`                                | Get deck with cards                        |
| PATCH  | `/api/decks/[id]`                                | Rename deck                                |
| DELETE | `/api/decks/[id]`                                | Delete deck (cascade cards)                |
| POST   | `/api/decks/[id]/cards`                          | Add card to deck                           |
| DELETE | `/api/decks/[id]/cards/[cardId]`                 | Remove card (uses DB CUID, not scryfallId) |
| PATCH  | `/api/decks/[id]/cards/[cardId]`                 | Update card category                       |
| GET    | `/api/cache/cards`                               | Lookup card in DB cache                    |
| POST   | `/api/cache/cards`                               | Store card in DB cache                     |
| POST   | `/api/ai/suggest`                                | Get AI suggestions for deck                |
| GET    | `/api/decks/[id]/snapshots`                      | List snapshots (newest first, no cardList) |
| POST   | `/api/decks/[id]/snapshots`                      | Create snapshot from current deck state    |
| DELETE | `/api/decks/[id]/snapshots/[snapshotId]`         | Delete a snapshot                          |
| POST   | `/api/decks/[id]/snapshots/[snapshotId]/restore` | Restore deck to snapshot (transactional)   |

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

# Start dev server on http://127.0.0.1:3000
pnpm dev:local
# -> http://localhost:3000
```

Routing is `localePrefix: "as-needed"`: English is served unprefixed at
`http://localhost:3000`, French at `/fr`. Docker/PostgreSQL is required for
authenticated deck, collection, and profile features.

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

### Bundle Analysis

The project includes `@next/bundle-analyzer` to visualize the JavaScript bundle composition. This helps catch oversized dependencies, duplicated modules, and unnecessary client-side code before they impact load times.

```bash
pnpm analyze
```

This runs a production build with the `ANALYZE=true` flag. When the build finishes, two interactive treemap HTML pages open automatically in the browser:

- **Client bundle** — everything shipped to the user's browser. Look for large dependencies that could be lazy-loaded or replaced with lighter alternatives.
- **Server bundle** — code running on the server (API routes, server components). Less critical for user performance but worth checking for accidental client-side library leaks.

**When to run it:**

- After adding a new dependency — verify it doesn't bloat the client bundle unexpectedly
- Before a release — quick sanity check on overall bundle health
- When investigating slow page loads — identify which modules dominate the bundle

**What to look for:**

- Disproportionately large rectangles — a single dependency taking 30%+ of the bundle is worth investigating
- Duplicated modules — the same library appearing in multiple chunks (tree-shaking issue)
- Server-only code in the client bundle — libraries like `prisma` or `@sentry/node` should never appear in the client treemap

The analyzer is disabled by default and has zero impact on normal builds (`pnpm build`).

### Environment Variables

| Variable            | Required    | Description                                                                         |
| ------------------- | ----------- | ----------------------------------------------------------------------------------- |
| `DATABASE_URL`      | ✅ Yes      | PostgreSQL connection string (e.g. `postgresql://user:pass@localhost:5432/magicai`) |
| `ANTHROPIC_API_KEY` | ⚠️ Optional | Enables Claude AI suggestions (falls back to mock)                                  |
| `OPENAI_API_KEY`    | ⚠️ Optional | Secondary AI provider fallback                                                      |

See `docs/engineering/infrastructure.md` for Docker + full infra setup.

---

## External APIs

### Scryfall

| Endpoint                               | Used For                           |
| -------------------------------------- | ---------------------------------- |
| `GET /cards/search?q={query}`          | Card search (name/set/color modes) |
| `GET /cards/named?exact={name}`        | Single card lookup                 |
| `GET /cards/named?fuzzy={name}`        | Fuzzy match                        |
| `POST /cards/collection`               | Batch lookup (up to 75)            |
| `GET /cards/autocomplete?q={partial}`  | Name autocomplete                  |
| `GET /cards/search?q=is:gamechanger`   | Game Changers list                 |
| `GET /cards/search?q=banned:commander` | Commander banlist                  |

Rate limit: 10 req/s (100ms enforced). Scryfall is free and community-supported — be respectful.

**Known limitation**: Scryfall returns 175 cards/page. GC and banlist lists only fetch the first page. For lists > 175 cards, pagination would need to be added.

### Commander Spellbook

| Endpoint                                  | Used For                          |
| ----------------------------------------- | --------------------------------- |
| `GET /api/v2/variants/?commanders={name}` | Combo detection by commander name |

---

## Multi-Format System

All format-specific behavior is driven by `src/lib/deck/formats.ts`:

- `DeckFormat` — union type of 9 supported formats
- `FORMAT_CONFIG` — per-format rules: deckSize, sideboardSize, isSingleton, hasCommander, hasBracketScoring, hasColorIdentity, maxCopiesPerCard, scryfallLegality, recommendedLands, startingLife
- `getFormatConfig(format)` — safe accessor with Commander fallback

**Every layer reads from this single config** instead of hardcoding Commander:

| Layer           | What changes per format                                       |
| --------------- | ------------------------------------------------------------- |
| Search queries  | `legal:{format}` instead of `legal:commander`                 |
| Banlist         | `banned:{format}` with per-format cache key                   |
| Validation      | Deck size (100 vs 60), singleton rule, commander requirement  |
| Card multiples  | maxCopiesPerCard (1 for Commander, 4 for Standard)            |
| Bracket scoring | Only computed for Commander (returns null otherwise)          |
| Playtest        | startingLife (40 Commander, 30 Brawl, 20 elsewhere)           |
| Deck statistics | Card-count target, and the curve / threat / interaction bands |

---

## Internationalisation

**Two locales are served: `en` and `fr`**, via next-intl v4 with `localePrefix: "as-needed"` — English at `/decks`, French at `/fr/decks`. Catalogs live in `src/messages/<locale>/<namespace>.json` and are wired in `src/i18n/request.ts`.

### Dormant locales

`de, it, es, ja, zh, ko, ru, pt` have catalogs on disk, listed in `DORMANT_LOCALES`, but are **not routed**. They were machine-seeded English copies, and translating the interface around card names and oracle text that are themselves still English — Scryfall's `lang` parameter is not wired — would ship a half-translated product in eight languages instead of a coherent one in two.

A dormant prefix is therefore an ordinary unknown path: `/ja` returns a 404 rendered in English, never a partly-translated page.

Their catalogs are still held at key parity with `en` by `messages.test.ts`, so re-activating one is a single-line move from `DORMANT_LOCALES` into `SUPPORTED_LOCALES` — once someone who speaks the language has translated it.

### Adding a translated string

1. Add the key to `src/messages/en/<namespace>.json`, and to `fr` with a real translation.
2. Propagate the key to the remaining eight locales — the value may stay English until the translation pass, but **the key must exist everywhere**. A missing key renders as its raw dotted path in that locale.
3. `src/i18n/messages.test.ts` enforces this: it fails the unit suite when any locale's key set diverges from `en`, or when a namespace file is missing.

### Strings in module-scope tables

`useTranslations` is a hook and cannot run at module scope. Constant tables that carry user-facing labels (filter options, mode lists) therefore store **catalog keys**, resolved at render:

```ts
const CMC_MODES = [{ value: "range", labelKey: "cmcMode.range" }, …];
// …
{CMC_MODES.map((m) => <TabButton key={m.value}>{t(m.labelKey)}</TabButton>)}
```

The same rule applies to error copy held in state: store a flag, not a message, and render the translated string from it.

### Rich text

next-intl's parser does not support self-closing tags — `<br/>` renders as literal text. Write `<br></br>` and supply a tag renderer to `t.rich()`. `messages.test.ts` fails on any self-closing tag in a catalog.

---

## Community Deck Discovery

Two quality signals coexist deliberately:

| Signal              | Model        | Answers                              | Used for           |
| ------------------- | ------------ | ------------------------------------ | ------------------ |
| 1–5 stars + reviews | `DeckRating` | "how good is this deck"              | Per-deck quality   |
| ±1 vote             | `DeckVote`   | "should this deck rank near the top" | Discovery ordering |

`src/lib/community/votes.ts` holds the domain: `isValidVoteValue`, `calculateVoteScore`, `rankDecksByScore`. **Zero is not a valid vote** — clearing a vote deletes the row rather than storing 0, so a stored row always represents a real opinion.

Ranking is score first, then rating count (more ratings means more evidence behind the same score), then recency so a new list is not permanently stuck under an identical older one.

### Routes

| Route                                            | Notes                                                          |
| ------------------------------------------------ | -------------------------------------------------------------- |
| `GET/POST/DELETE /api/community/decks/[id]/vote` | POST upserts, so flipping a vote replaces it. 403 on self-vote |
| `GET /api/community/commanders/[slug]/decks`     | Public decks led by that commander, ranked                     |

Both live under `/api/community` so the edge auth allowlist (`src/lib/auth/edge-config.ts`) can expose `GET` anonymously without opening the protected `/api/decks` tree. `/commanders` is on the page allowlist in both `edge-config.ts` and `middleware.ts`.

> **Known limitation.** Commander identity lives on the deck's _cards_ (`isCommander`), not on the `Deck` row, so the slug cannot be matched in SQL — the route loads public decks with a commander and slugs them in memory. Fine while public decks are few; it needs a denormalised `commanderName` column on `Deck` before that stops being true.

An unknown slug is not a 404: it is a commander nobody has published for yet, so the page renders its empty state.

---

## Format-Specific Statistics

Commander decks are graded by bracket scoring. Every other format had no equivalent read on whether a list is well-proportioned, so `src/lib/deck/format-stats.ts` adds three measures, computed by `computeDeckStats` and surfaced in `DeckStats.tsx`:

| Measure           | Definition                                                        |
| ----------------- | ----------------------------------------------------------------- |
| Curve             | `avgCmc` against the format's `avgCmcTarget` band                 |
| Threat density    | `creature + planeswalker + winCondition`, as a share of non-lands |
| Interaction ratio | `removal + boardWipe + protection`, as a share of non-lands       |

Ratios are taken against **non-land cards**, not the whole deck: a 60-card list with 24 lands and a 100-card list with 38 are not comparable on raw counts, but their spell mix is. `benchmarkStatus` places each value in its band and returns `"below" | "on-target" | "above"`.

`buildFormatStats` returns `null` when `hasFormatStats` is false (Commander only), and `DeckStats.formatStats` carries that through, so the UI renders the panel purely on presence.

> The bands in `FORMAT_CONFIG` are **heuristic starting points, not derived from tournament data**. They are meant to prompt a look at the deck, not to grade it. Tune them as real data arrives.

The same `format` prop also fixes two Commander assumptions in the stats panel: the card-count row now reads `totalCards/deckSize` rather than always `/100`, and the bracket benchmark rows (ramp, draw, removal, lands) are hidden for formats without bracket scoring — a Modern deck previously showed "60/100" and "target for B3".

---

## Mana Base Alignment

`computeDeckStats` already reported the colour distribution of the **spells**, via their pips. It said nothing about what the **lands** actually tap for, so a deck could read as perfectly balanced while being unable to cast half its cards. `src/lib/deck/mana-alignment.ts` supplies the missing half and compares the two.

| Field                     | Definition                                                             |
| ------------------------- | ---------------------------------------------------------------------- |
| `pips` / `pipShare`       | Coloured pips the spells ask for; hybrids count as halves              |
| `sources` / `sourceShare` | Lands that can tap for the colour, as a share of **all** lands         |
| `gap`                     | `sourceShare - pipShare`, in percentage points; negative means starved |
| `status`                  | `"under"` / `"aligned"` / `"over"`, using `MANA_IMBALANCE_THRESHOLD`   |
| `recommendedSources`      | `round(pipShare × totalSources)` — the proportional starting point     |

`MANA_IMBALANCE_THRESHOLD` (15 points, in `constants.ts`) had been declared since the early days and **never referenced**; this is the feature it was written for.

### Two deliberate design decisions

**No `FormatConfig` gate.** `buildFormatStats` is gated on `hasFormatStats`, and the obvious parallel here would be `hasColorIdentity` — but that flag encodes the Commander colour-identity _rule_, not whether mana alignment is worth measuring. Gating on it would switch the panel off for Modern and Standard, where a two-colour manabase needs this read at least as much. The gate is the data instead: no coloured pips, no panel, `null`.

**Lands only.** A mana creature or a signet fixes colours too, but it has to be drawn _and_ cast first. Folding those into the same number would overstate how reliably the deck produces the colour, so `countColorSources` counts `category === "land"` and nothing else.

### Deriving what a land produces

Scryfall's `produced_mana` is **not stored anywhere** in this codebase — not on `ScryfallCard`, not on `DeckCard`, not in the Prisma model. Adding it would be a schema migration, so `colorsProducedBy` derives production from printed text in three passes, most reliable first:

1. **Printed subtypes** — the portion of `typeLine` after the em dash. Only the subtype half is read: `Land — Mountain Valley` taps for nothing red, and matching against the whole line would invent a red source.
2. **The land's own `Add …` clauses** — text following an `Add`, up to the end of that sentence. A land whose activation _costs_ `{W}` does not thereby produce white; scanning the whole oracle text would credit it anyway. `Add one mana of any color` credits all five.
3. **Colour identity**, only when the first two find nothing. It is the weakest signal — on a land it usually does reflect production, but it also picks up activation costs.

> This derivation is a **heuristic**, and the recommendation is proportional, which ignores curve position: a colour needed on turn one deserves more sources than its pip share alone suggests. Treat an `"under"` verdict as a prompt to look, not a verdict.

---

## Playtest Engine

`src/lib/playtest/` is a pure state machine with no framework dependency, wrapped by a Zustand store and rendered by the components in `src/components/playtest/`.

**`engine.ts`** — every transition takes a state and returns a new one:

| Export                                           | Role                                                                              |
| ------------------------------------------------ | --------------------------------------------------------------------------------- |
| `PlaytestEngine`                                 | Turn, phase, life + history, hand/library/battlefield/graveyard/exile, undo stack |
| `createPlaytestState(cards, overrides)`          | Shuffles and deals; `overrides.lifeTotal` carries the format total                |
| `applyMulligan`                                  | Reshuffles and keeps one card fewer, capped at `MAX_MULLIGANS`                    |
| `applyNextPhase` / `applyNextTurn`               | `PHASES` order; End rolls into the next turn and untaps                           |
| `applyDamage` / `applyHeal`                      | Adjusts life and appends a `LifeHistoryEntry`                                     |
| `applyTap` / `applyUntapAll` / `applyAddCounter` | Battlefield permanent state                                                       |
| `applyMoveToZone`                                | Moves a card between any two `CardZone`s, exhaustively checked                    |
| `applyUndo`                                      | Restores the previous state; `pushHistory` caps the stack at 10                   |

Shuffling uses `randomIntBelow` from `src/lib/crypto-random.ts`, not `Math.random()`.

**`store.ts`** — `usePlaytestStore` exposes each `apply*` as an action and holds the deck as it was dealt (`setup`), so `resetPlaytest` re-deals the original deck. Rebuilding it from the live zones instead would carry battlefield state (tapped, counters) back into the library and lose the commander/partner distinction.

**Mulligan model.** London formally draws seven and bottoms N chosen cards. Goldfishing has no opponent and no choice to make, so the engine keeps `7 - N` random cards — the same distribution, without a bottoming UI that would decide nothing.

**`PlaytestModal`** subscribes with fine-grained selectors and clears the session on unmount: the store outlives the modal, so a stale game would otherwise reappear on reopen.

`analytics.ts` (`calculateWinRate`, `getMulliganDistribution`, …) is written and tested but not reachable — there is no `PlaytestSession` Prisma model to feed it.

---

## Scryfall API Caching

Server-side search cache via `ScryfallSearchCache` Prisma model (1h TTL):

- `searchCards()` checks `/api/cache/search` before hitting Scryfall
- Cache key: `sha256(query|page)` computed server-side (browser-safe)
- Rate limiter: serialized Promise queue with error recovery
- Name-based lookups (`getCardByName`, `getCardByNameFuzzy`) store results in `CardCache`

TanStack Query `gcTime` matches `staleTime` (24h for cards/lists, 5min for search) to prevent re-fetches on component remount.

---

## 3D Landing Page Architecture

`src/components/landing/` — Three.js scene for unauthenticated visitors:

```
LandingPage.tsx          # Detects mobile/reduced-motion → static or 3D
  ├── SpellbookScene.tsx # R3F Canvas (dynamic import, ssr: false)
  │     ├── Altar.tsx    # Stone base (BoxGeometry)
  │     ├── Spellbook.tsx# Open book (procedural planes)
  │     ├── GlyphSymbol  # Interactive runes (raycasting + emissive)
  │     ├── CameraRig    # Idle sway + gsap zoom on click
  │     ├── ManaParticles# Sparkles from drei
  │     └── PostEffects  # Bloom + Vignette
  └── StaticLandingPage  # 2D fallback (CSS gradients + buttons)
```

Performance: dpr capped at 1.5, 80 particles, no shadows. Three.js never loads on authenticated pages.

### SonarCloud & React Three Fiber

SonarCloud's `S6747` rule ("Unknown property") does not understand R3F's extended JSX namespace. All R3F intrinsic elements (`<mesh>`, `<boxGeometry>`, `<meshStandardMaterial>`, `<pointLight>`, etc.) use props like `position`, `args`, `roughness`, `emissive`, `intensity` that map to Three.js object properties — not HTML attributes.

These are **verified false positives**: TypeScript and ESLint both pass clean because `@react-three/fiber` provides proper JSX type declarations. The rule is suppressed for `src/components/landing/**` only via `sonar-project.properties`:

```properties
sonar.issue.ignore.multicriteria=r3f
sonar.issue.ignore.multicriteria.r3f.ruleKey=typescript:S6747
sonar.issue.ignore.multicriteria.r3f.resourceKey=src/components/landing/**
```

If R3F components are added outside `src/components/landing/`, the exclusion scope must be extended.

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

### Card Quantity Editor (`feat/card-quantity-editor`)

- `multiples.ts` — encodes Commander singleton rules: `maxQuantity(name, typeLine)` returns 1 by default, 99 for basic lands and special cards, 9 for Nazgûl, 7 for Seven Dwarves
- `+` / `−` buttons appear on hover in list view; `+` only shown when card allows multiples and current qty < max
- `addCard` / `addDeckCard` now call `updateCardQuantity` instead of silently blocking when a card is already present and allows multiples
- `updateCardQuantity(cardId, delta)` — optimistic update + PATCH `/api/decks/:id/cards/:cardId`

### Edition Picker in Deck List (`feat/import-fix-and-edition-picker`)

- Layers icon on hover in list view → `PrintingSelectorModal` (same modal as search results)
- `swapCardPrinting(cardId, ScryfallCard)` — updates `scryfallId`, `imageUri`, `artCropUri` optimistically and persists via PATCH

### Commander in Grid View (`feat/commander-card-in-grid-view`)

- Commander (and partner) pinned at top of card grid with gold ring (`ring-yellow-400/70`) and `CMD` badge

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

| Phase    | Focus                                                                | Status      |
| -------- | -------------------------------------------------------------------- | ----------- |
| Phase 1  | Foundation — Scryfall search, drag & drop, stats, bracket scoring    | ✅ Complete |
| Phase 1+ | Integration — PostgreSQL/Prisma, DnD full pipeline, text import      | ✅ Complete |
| Phase 2  | Intelligence — combo detection, theme analysis, commander pairing    | ✅ Complete |
| Phase 3  | Database & Prisma — persistent storage, migrations, DB cache         | ✅ Complete |
| Phase 4  | AI Suggestions — Anthropic/OpenAI integration, deck analysis         | ✅ Complete |
| Phase 4+ | Polish — UI enhancements, export, companion, legal, light/dark theme | ✅ Complete |
| Phase 5  | Onboarding & Tutorial (planned)                                      | 📋 Planned  |

---

## Infrastructure & Deployment

### Architecture diagram

```mermaid
graph TB
    subgraph Dev["💻 Local Development"]
        DEV[Developer]
        DOCKER[Docker\nPostgreSQL]
        HUSKY[Husky\npre-commit]
        LINT[lint-staged\nnext lint + prettier]
    end

    subgraph CI["⚙️ GitHub Actions CI"]
        LINT_CI[Lint]
        TSC[Typecheck\ntsc --noEmit]
        TEST[Vitest\n+ coverage]
        BUILD[next build]
        SONAR[SonarCloud\nquality gate]
    end

    subgraph GitHub["🐙 GitHub"]
        REPO[Repository\nmain branch]
        PR[Pull Request]
        PROTECT[Branch Protection\nCI must be green]
    end

    subgraph Prod["🚀 Production"]
        VERCEL[Vercel\nNext.js 15]
        SUPABASE[Supabase\nPostgreSQL]
        POOLER[Transaction Pooler\nport 6543]
    end

    subgraph Observability["📡 Observability"]
        SENTRY[Sentry EU\nerror tracking]
        HEALTH[GET /api/health\nDB status]
        UPTIME[UptimeRobot\nping every 5min]
        SCRYFALL[Scryfall API\ncard data]
    end

    DEV -->|git commit| HUSKY
    HUSKY --> LINT
    LINT -->|ok| REPO
    DEV -->|git push branch| PR
    PR --> CI
    CI --> PROTECT
    PROTECT -->|merge| REPO
    REPO -->|push to main| VERCEL
    VERCEL -->|pgbouncer| POOLER
    POOLER --> SUPABASE
    VERCEL -->|errors| SENTRY
    HEALTH -->|200/503| UPTIME
    VERCEL --> SCRYFALL
    DEV -->|prisma migrate deploy\ndirect connection| SUPABASE
```

### Stack

| Layer             | Service     | Plan         | Notes                            |
| ----------------- | ----------- | ------------ | -------------------------------- |
| Hosting           | Vercel      | Hobby (free) | Auto-deploy on push to `main`    |
| Database          | Supabase    | Free         | PostgreSQL 16, West EU (Ireland) |
| Error tracking    | Sentry      | Free         | `@sentry/nextjs`, EU data center |
| Uptime monitoring | UptimeRobot | Free         | Ping `/api/health` every 5 min   |

### Database connections

Two different URLs are required — one for migrations, one for the running app:

| Usage              | URL type           | Host                                  | Port | Extra param       |
| ------------------ | ------------------ | ------------------------------------- | ---- | ----------------- |
| Migrations (local) | Direct connection  | `db.[ref].supabase.co`                | 5432 | —                 |
| App on Vercel      | Transaction pooler | `aws-0-eu-west-1.pooler.supabase.com` | 6543 | `?pgbouncer=true` |

> The migration engine does not support `pgbouncer=true`. Always use Direct connection for `prisma migrate deploy`.
> Vercel is IPv6-only — Direct connection fails. Use Transaction Pooler for the app.
> The username in the Transaction Pooler URL is `postgres.[project-ref]` (not just `postgres`).
> Use alphanumeric-only passwords — special characters (`'`, `"`, `/`, `@`, `#`) break shell commands and require percent-encoding.

### Environment variables

| Variable                 | Where to set                  | Description                                            |
| ------------------------ | ----------------------------- | ------------------------------------------------------ |
| `DATABASE_URL`           | `.env.local` (local) + Vercel | Supabase Transaction Pooler URL with `?pgbouncer=true` |
| `NEXT_PUBLIC_SENTRY_DSN` | `.env.local` (local) + Vercel | Sentry DSN (public, safe to expose)                    |
| `SENTRY_AUTH_TOKEN`      | Vercel only                   | Sentry auth token for source maps upload               |
| `ANTHROPIC_API_KEY`      | `.env.local` (local) + Vercel | AI suggestions (optional)                              |

### CI / Quality gates

- GitHub Actions CI on every push and PR: lint → typecheck → test with coverage → build
- Branch protection on `main`: `CI / Lint, Typecheck, Test, Build` is the **only required** status check
- Pre-commit hooks via Husky + lint-staged: `next lint --fix` + `prettier --write`
- SonarCloud quality gate runs on every PR via `sonar.yml` but is **NOT a required check** in branch protection

> **Do not add `SonarCloud Code Analysis` as a required branch protection check.**
> SonarCloud already runs automatically via `sonar.yml` on every PR and its result appears in the PR
> checks list. Making it "Required" creates a duplicate gate and blocks merges when SonarCloud is slow,
> unavailable, or when the PR was opened before the first Sonar scan completes.
> If you ever reconfigure branch protection, keep only `CI / Lint, Typecheck, Test, Build` as required.

### Health check

`GET /api/health` — returns `200 { status: "ok", db: "ok", latencyMs }` or `503 { status: "degraded" }`.
Used by UptimeRobot (configure once app is deployed).

### Error tracking (Sentry)

- `sentry.client.config.ts` — browser error capture, 10% trace sampling
- `sentry.server.config.ts` — server/API route error capture
- `sentry.edge.config.ts` — edge runtime error capture
- Source maps uploaded automatically on Vercel deploy via `SENTRY_AUTH_TOKEN`
  | Phase 5 | Deck Annotations — description, card notes, tags | ✅ Complete |
  | Phase 6 | Onboarding & Tutorial (planned) | 📋 Planned |
