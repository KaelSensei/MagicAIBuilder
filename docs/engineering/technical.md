# MagicAIBuilder — Technical Documentation

> **Start with [architecture.md](architecture.md)** for the structure: the bounded contexts, the
> layers, where code goes, and a map from today's folders to the target modules. Decisions are in
> [docs/adr/](../adr/README.md), domain words in [CONTEXT.md](../../CONTEXT.md). This file covers
> the stack, local development and notes on individual features.

## Stack

| Layer           | Technology            | Version | Why                                                                        |
| --------------- | --------------------- | ------- | -------------------------------------------------------------------------- |
| Framework       | Next.js App Router    | 15.x    | Server components, file-based routing, image optimization                  |
| Language        | TypeScript            | 5.x     | Strict typing, full project coverage                                       |
| Styling         | Tailwind CSS          | 4.x     | Utility-first, v4 CSS-native (no config file needed)                       |
| Components      | shadcn/ui + Radix     | latest  | Accessible primitives, dark theme ready                                    |
| Animations      | Framer Motion         | 11.x    | Card hover zoom, stagger grids, panel transitions                          |
| State           | Zustand               | 5.x     | Simple, minimal boilerplate vs. Redux                                      |
| Data Fetching   | TanStack Query        | 5.x     | Built-in caching, deduplication, retry — critical for Scryfall rate limits |
| Drag & Drop     | dnd-kit               | 6.x     | Actively maintained, better perf than react-beautiful-dnd                  |
| Database        | PostgreSQL 16         | —       | Persistent deck storage via Docker Compose                                 |
| ORM             | Prisma                | 6.x     | Type-safe DB client, migrations, schema                                    |
| Validation      | Zod                   | 4.x     | Runtime schema validation on API boundaries                                |
| Icons           | Lucide React          | latest  | Consistent, tree-shakeable                                                 |
| Bundle Analysis | @next/bundle-analyzer | 16.x    | Visual treemap of JS bundles — run `pnpm analyze`                          |
| Package Manager | pnpm                  | 10.x    | Fast, disk-efficient                                                       |
| Testing (unit)  | Vitest                | 3.x     | Vite-native, fast, ESM-compatible                                          |
| Testing (E2E)   | Playwright            | 1.51.x  | Cross-browser, reliable                                                    |

---

## Directory Architecture

The tree as it is today (2026-11-10). The target layout, one module per bounded context under
`src/modules/`, and a map from these folders to the contexts are in
[architecture.md](architecture.md#how-to-read-the-code-base-today).

```
src/
  middleware.ts                 # Edge: locale routing and the Auth.js session gate (pages only)
  instrumentation*.ts           # Sentry, server and browser
  app/
    layout.tsx, sitemap.ts, robots.ts, global-error.tsx, not-found.tsx
    [locale]/                   # every page sits under the locale segment
      layout.tsx, providers.tsx # providers: TanStack Query, session, init, theme, toasts
      page.tsx                  # landing for visitors, deck list for signed-in players
      builder/[deckId]/         # the builder (a client page)
      decks/, collection/, deck/[id]/, share/[token]/, u/[username]/,
      commanders/[slug]/decks/, saved-decks/, settings/, moderation/, rules/, auth/
    api/                        # 65 route handlers, by URL family:
                                #   decks/ 15, community/ 13, user/ 7, collection/ 4,
                                #   v1/ 4 (public API, API keys), 2 each: ai/, auth/, cache/,
                                #   deck-folders/, import/, meta/, moderation/;
                                #   1 each: combos/, deck/, health/, og/, proxy-card-image/,
                                #   share/, users/
  components/                   # React components, by screen: deck/ (72 files), card/,
                                # search/, builder/, playtest/, collection/, community/,
                                # profile/, moderation/, settings/, landing/, rules/,
                                # layout/ (app shell), ui/ (primitives), providers/
  lib/                          # rules, analysis, client stores, provider clients, server helpers
    deck/                       # deck types, format rules, analysis, editing, the deck store
    playtest/                   # the pure game engine, keep advice, session analytics
    scryfall/                   # Scryfall client, shared server cache, images, localised text
    ai/, combos/, meta/, import/, collection/, community/, ratings/, social/, rules/, seo/
    auth/, api/                 # Auth.js configuration, API keys and scopes, request helpers
    db/                         # prisma.ts, plus deck-api.ts and snapshot-api.ts, which are
                                # browser HTTP clients despite the folder name
    validation/                 # Zod schemas for request bodies
  hooks/                        # 29 hooks, one per file
  i18n/                         # next-intl routing and request configuration
  messages/<locale>/            # UI strings, one JSON file per namespace, 10 locales
  styles/globals.css            # Tailwind 4 and the theme tokens
  test/                         # shared test helpers and in-memory fakes
e2e/                            # Playwright specs
prisma/
  schema.prisma                 # 30 models
  migrations/
```

Tests sit next to the file they test (`foo.test.ts` beside `foo.ts`); there is no `__tests__/`
folder.

---

## Key Patterns

### Zustand Stores

| Store                                       | File                          | Holds                                                                                                                                                       |
| ------------------------------------------- | ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `useDeckStore`                              | `src/lib/deck/store.ts`       | Decks by id, the active deck, undo, view and sort preferences. Every edit is optimistic and saved through the browser HTTP client `src/lib/db/deck-api.ts`. |
| `useCollectionStore`                        | `src/lib/collection/store.ts` | The signed-in player's collection                                                                                                                           |
| `usePlaytestStore`                          | `src/lib/playtest/store.ts`   | The running playtest game and the deck as it was dealt                                                                                                      |
| `useUIStore`, `useShortcutPreferencesStore` | `src/lib/ui/`                 | Modal visibility, keyboard navigation, shortcut preferences                                                                                                 |
| `useThemeStore`                             | `src/hooks/useTheme.ts`       | Light or dark theme                                                                                                                                         |
| `useToastStore`                             | `src/hooks/useToast.ts`       | Toast messages                                                                                                                                              |

**Persistence**: a signed-in player's decks live in PostgreSQL and are loaded by `loadDecks()`. A
guest's single deck lives in `localStorage` (`src/lib/deck/guest-deck.ts`) until it is claimed into
an account, and the deck list's sort and grouping preferences are kept in `localStorage` too.

**Enrichment**: the builder page loads the Game Changers and banlist name sets
(`useGameChangersSet`, `useBanlistSet`) and passes them to the store (`setGameChangerNames`,
`setBannedNames`), which sets each card's `isGameChanger` and `isBanned` flags.

### TanStack Query Keys

| Hook                   | Query Key                           | Cache TTL |
| ---------------------- | ----------------------------------- | --------- |
| `useCardSearch(query)` | `["scryfall", "search", query]`     | 5 min     |
| `useGameChangers()`    | `["scryfall", "game-changers"]`     | 24h       |
| `useBanlist(format)`   | `["scryfall", "banlist", format]`   | 24h       |
| `useCombos(deck)`      | `["combos", "spellbook", queryKey]` | 1h        |

### Scryfall Rate Limiting

Every request to `api.scryfall.com`, from the browser or the server, waits its turn in one queue
per runtime: `scheduleScryfallRequest` in `src/lib/scryfall/request-queue.ts` starts one request
at a time, at least 100 ms apart. Scryfall requires a `User-Agent` and an `Accept` header on every
request ([API documentation](https://scryfall.com/docs/api), read 2026-11-10). The server sends
the app's one `USER_AGENT` (`src/lib/http.ts`); the browser keeps its own, as Scryfall asks of
on-page JavaScript. A request that has not answered after 10 seconds is aborted
(`SCRYFALL_TIMEOUT_MS` in `src/lib/scryfall/client.ts`), so a hung request cannot hold the queue.

Scryfall's published hard limits are stricter for card endpoints: 2 requests per second (500 ms)
on `/cards/search`, `/cards/named`, `/cards/random` and `/cards/collection`, 10 per minute on
`/cards/manifest`, and 10 per second on other methods
([rate limits](https://scryfall.com/docs/api/rate-limits), read 2026-11-10). The queue spaces a
request to one of those endpoints from the previous request to the same endpoint
(`ENDPOINT_SPACING_MS`: 500 ms, or 6 s for the manifest), on top of the 100 ms between any two.

TanStack Query's deduplication prevents duplicate concurrent requests. `getCardById()` reads the
shared server cache first (see [Scryfall API Caching](#scryfall-api-caching)).

### Search Modes (3 tabs)

| Tab      | Scryfall Query                     | Hook            |
| -------- | ---------------------------------- | --------------- |
| By Name  | `name:"{query}"`                   | `useCardSearch` |
| By Set   | `set:{setCode}`                    | `useCardSearch` |
| By Color | `id<={colorString} commander:true` | `useCardSearch` |

### Bracket Scoring Algorithm

```
scoreBracket(deck, stats) → BracketScore

1. Compute 5 dimensions (each scored 1–4):
   - ramp:     ramp count + avg CMC inverse
   - draw:     draw piece count
   - removal:  removal + boardWipes × 1.5
   - winSpeed: explicit win cons + fast win combos
   - avgCmc:   lower = higher bracket
   Tutors are not a dimension: Wizards removed the tutor restriction on
   2025-10-21 and relies on the Game Changers list to catch efficient tutors.

2. overall = round(average(dimensions))

3. Official floor (minimumBracket, src/lib/deck/bracket-floor.ts), read from
   BRACKET_DEFINITIONS (src/lib/constants/brackets.ts):
   - the lowest bracket whose Game Changer limit admits the deck's count
     (B1/B2 none, B3 up to 3, B4/B5 unlimited)
   - and whose two-card combo rule admits the deck's two-card infinites
     (B1/B2 none, B3 none before turn 6, B4/B5 unrestricted). A list cannot
     show how early a combo comes up, so a two-card infinite sets B3, not B4.
   - overall = max(overall, floor)

4. Clamp overall to [1, 4]. Brackets 4 and 5 share one rule set; only the
   cEDH metagame separates them, so the estimate never outputs 5. Players set
   Bracket 5 as a target or a manual override.

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
  | "doctor" // "Doctor's companion"
  | "character_select" // "Partner—Character select"
  | "father_son"; // "Partner—Father & son"
```

### dnd-kit Drag & Drop Architecture

- `DndContext` at builder page root (single context, no nesting)
- Search results: `useDraggable` on each `DraggableCard`
- Deck categories: `useDroppable` on each `DroppableCategory`
  - **Critical**: droppable zones must always render their `ref` div — never return `null` when empty, or the zone unregisters from dnd-kit and drag events stop firing
- Intra-deck drag: cards are both draggable and droppable for category reordering

### AI Suggestions Pattern

```typescript
// POST /api/ai/suggest  (src/app/api/ai/suggest/route.ts)
// Body: the deck, its stats and bracket, an optional deck brief and deck question
// Response: application/x-ndjson stream of StreamEvent lines:
//   { type: "analysis", content, provider } | { type: "suggestion", data }
//   | { type: "removal", data } | { type: "done" }

// Provider fallback order:
// 1. ANTHROPIC_API_KEY → claude-haiku-4-5
// 2. OPENAI_API_KEY → gpt-4o-mini
// 3. Mock response (no key configured)
```

`POST /api/ai/build` streams an AI-built deck the same way. Both cap the reply at 4,096 output
tokens. The behaviour is specified in [I-02](../product/specs/i02-checkable-ai-copilot.md).

### Theme Toggle Pattern

```typescript
// useTheme.ts — Zustand store
// ThemeSync.tsx — syncs store → document.documentElement.dataset.theme
// layout.tsx — inline <script> sets data-theme before React hydrates (prevents flash)
// <html suppressHydrationWarning> — suppresses server/client mismatch on data-theme attr
```

---

## Prisma Schema

`prisma/schema.prisma` holds 29 models. Grouped by the bounded context that owns them (see
[architecture.md](architecture.md#bounded-contexts)):

| Context       | Models                                                                                                                                       |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Deck building | `Deck`, `DeckCard`, `DeckFolder`, `DeckSnapshot`                                                                                             |
| Playtest      | `PlaytestSession`                                                                                                                            |
| Card catalog  | `CardCache`, `ScryfallSearchCache`                                                                                                           |
| Meta insights | `MetaCache`, `MetaSnapshot`                                                                                                                  |
| Collection    | `CollectionCard`, `AcquisitionIntent`                                                                                                        |
| Community     | `DeckVote`, `DeckRating`, `DeckComment`, `DeckReport`, `SavedPublicDeck`, `PublicDeckFolder`, `CardPackage`, `CardPackageCard`, `UserFollow` |
| Identity      | `User`, `Account`, `Session`, `VerificationToken`, `ApiKey`, `NotificationPreference`                                                        |

---

## API Routes

There are 65 route handlers under `src/app/api/`. Each URL family belongs to one bounded context:

| URL family                                                                               | Context          | Notes                                                                                                             |
| ---------------------------------------------------------------------------------------- | ---------------- | ----------------------------------------------------------------------------------------------------------------- |
| `/api/decks/**`, `/api/deck/[id]`, `/api/deck-folders/**`                                | Deck building    | `/api/deck/[id]` is the public read of one deck; `/api/decks/[id]/legality` returns the server's legality verdict |
| `/api/decks/[id]/playtest-sessions`                                                      | Playtest         | Recorded goldfish runs                                                                                            |
| `/api/decks/[id]/acquisition-intent`, `/api/collection/**`                               | Collection       |                                                                                                                   |
| `/api/ai/suggest`, `/api/ai/build`                                                       | AI copilot       | Streamed as NDJSON                                                                                                |
| `/api/cache/cards`, `/api/cache/search`, `/api/proxy-card-image`                         | Card catalog     | Read-through Scryfall cache                                                                                       |
| `/api/combos`                                                                            | Combos           | Commander Spellbook lookup                                                                                        |
| `/api/meta/**`                                                                           | Meta insights    | EDHREC and MTGTop8                                                                                                |
| `/api/import/**`                                                                         | Deck interchange | Moxfield profile and URL import                                                                                   |
| `/api/community/**`, `/api/users/[username]`, `/api/share/[token]`, `/api/moderation/**` | Community        |                                                                                                                   |
| `/api/auth/**`, `/api/user/**`, `/api/v1/**`                                             | Identity         | `/api/v1` is the public API, authenticated by API key                                                             |
| `/api/og`, `/api/health`                                                                 | Site             | Open Graph images; the health check                                                                               |

URLs are a public contract: they stay when the code behind them moves.

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

| Variable                | Required    | Description                                                                                                                                                                                                                                                                |
| ----------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`          | ✅ Yes      | PostgreSQL connection string (e.g. `postgresql://user:pass@localhost:5432/magicai`)                                                                                                                                                                                        |
| `ANTHROPIC_API_KEY`     | ⚠️ Optional | Enables Claude AI suggestions (falls back to mock)                                                                                                                                                                                                                         |
| `OPENAI_API_KEY`        | ⚠️ Optional | Secondary AI provider fallback                                                                                                                                                                                                                                             |
| `SCRYFALL_API_BASE_URL` | ⚠️ Optional | Origin of the Scryfall API the server calls; default `https://api.scryfall.com`. Must be an absolute http(s) URL or the server refuses to start. Set only by the E2E stack, which points it at a fixture stand-in (`docs/engineering/quality-gate.md`, _E2E environment_). |

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

Rate limits: see [Scryfall Rate Limiting](#scryfall-rate-limiting). Scryfall is free and community-supported — be respectful.

Scryfall returns 175 cards per page; the Game Changers and banlist hooks fetch every page (`fetchAllPages`).

### Commander Spellbook

| Endpoint                                                     | Used For                                          |
| ------------------------------------------------------------ | ------------------------------------------------- |
| `POST https://backend.commanderspellbook.com/find-my-combos` | Combos contained in a decklist, via `/api/combos` |

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
| Playtest        | startingLife per table size (Brawl 25 or 30, Commander 40)    |
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

### Extraction is a review, not a transcription

Every slice so far has turned up a defect that the hardcoded strings were hiding. Copying a string into the catalog unchanged preserves the bug; the rule is to check whether the wording is already stated somewhere authoritative first.

Two kinds recur:

**The same thing under two names.** `MaybeboardPanel` (an unmounted panel, deleted in P1-31) labelled the zone "Maybeboard" while the tab the user clicks says "Considering" (`builder.zones.considering`) — the same zone had two names depending on where you looked. `CardListItem` had the same split in #409. It now reads the builder catalog, which is where the tab that shows the name is defined. A component reaching into another namespace is the right trade when the alternative is a second copy that drifts.

Likewise `ColorDistribution` carried its own `White` / `Blue` / … table while `stats.color.*` already held those names for the mana alignment panel. The table now keeps only what is genuinely its own — the CSS variables and fallback hex.

**Hand-built English plurals.** `card${count === 1 ? "" : "s"}` appeared in `ManaCurve` (twice), `DeckPriceDisplay` and `PrintingSelectorModal`. It is invisible while the UI is English and unfixable once it is not: no other language pluralises on that rule. All are ICU plurals now.

Domain jargon is deliberately **not** extracted. Archetype names (`Tokens`, `Aristocrats`) and format names come from domain data and stay as they are, for the same reason card names do.

### Money

Card prices come from Scryfall's **`prices.usd`** on every ingest path — `PrintingSelectorModal`, `AddToCollectionDialog`, `QuickAddCollectionButton`, `CollectionPageClient`. The currency is USD and nothing converts it.

Two unmounted modals (`BudgetOptimizationModal` and `PricingShoppingListModal`, both deleted in P1-31) and the shopping-list CSV nonetheless printed a **euro sign**, so the same figure read as `$12.50` in the stats panel and `€12.50` in the budget modal, and an exported file named a currency its numbers were never in. A user setting a "€50" budget was setting $50.

Amounts are now formatted, never concatenated with a symbol:

```ts
const money = (value: number) =>
  useFormatter().number(value, { style: "currency", currency: "USD" });
```

That states the currency once, and lets the locale decide how to write it — `$12.50` in English, `12,50 $US` in French. A hardcoded symbol cannot do either, which is how the euro sign survived this long.

`generateShoppingListCSV` is a plain module rather than a component, so it formats with `$` directly; the same rule applies — the symbol matches the data.

### Rich-text renderers belong at module scope

A `t.rich` tag renderer written inline in the render body is a new function identity on every render, and static analysis reads it as a component defined inside a component. Hoist it:

```tsx
const RICH_TAGS = {
  strong: (chunks: ReactNode) => <span className="font-medium">{chunks}</span>,
};
// …
{
  t.rich("companion.emptyHint", RICH_TAGS);
}
```

### What the first real Sonar run found

`SONAR_TOKEN` lives in the gitignored `.env.sonar` and drives `pnpm sonar` locally. It is **not** the same as the GitHub Actions secret of the same name, which is what CI reads — so a local file does nothing for the pipeline.

The first local analysis after a full day of merges surfaced **five issues, all in code written that day**, none of which CI had ever seen: a `t.rich` renderer read as a nested component, a nested template literal in the Scryfall query builder, an `if (!x || x.y !== z)` that wanted optional chaining, and two `waitFor` + `getByText` pairs that should be `findByText`. All fixed; back to zero, verified by re-running the analysis rather than re-reading the API.

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

> **Commander slug in SQL.** `Deck.commanderName` is denormalised from the commander row (migration `20260819210000_denormalise_deck_commander`), so the route matches the slug in SQL, backed by the partial expression index `Deck_commanderSlug_v2_public_idx` (migration `20261111210000_commander_slug_transliterates_accents`). The SQL expression transliterates accents and treats whitespace as `commanderToSlug` does, under any database ctype; `src/lib/meta/commander-slug-parity.test.ts` holds the two together.

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

## Turn-One Playability

A low curve looks healthy in `manaCurve`, and a solid land count looks healthy in the stats panel, but neither says whether the two arrive **together**. `src/lib/deck/turn-one.ts` answers that as a probability over the opening seven.

### The maths

`chanceOfBoth(deckSize, groupA, groupB, handSize)` is exact, not sampled — inclusion–exclusion on the complements:

```
P(both) = 1 − P(no A) − P(no B) + P(neither)
```

with each term a hypergeometric ratio of binomials. The two groups **must be disjoint**, which they always are here: lands versus spells, or sources versus the spells they cast.

`binomial(n, k)` multiplies and divides in alternation so the running value stays small — the factorials themselves overflow a double long before a 100-card deck. Edge cases are handled explicitly: a hand larger than the deck is capped to the deck (you simply draw all of it), and an empty group short-circuits to 0 rather than dividing by zero.

### Two figures, deliberately not merged

| Figure    | Meaning                                                               |
| --------- | --------------------------------------------------------------------- |
| `anyPlay` | A land plus a one-drop, ignoring colour                               |
| `byColor` | A **matching source** plus a one-drop of that colour — the truer read |

They are never combined into a single number. The per-colour events overlap — one hand can satisfy green and blue at once — so summing the rows would double-count. Each row is exact on its own terms; the _gap_ between `anyPlay` and the colour rows is itself the signal, since a wide gap means the mana, not the curve, is what stops the deck acting.

A hybrid one-drop is counted for **every** colour on its cost, since either will cast it. That is the other reason the rows overlap.

### Scoping details that matter

- **Library only.** `computeDeckStats` passes `mainCards`, not `allCards`: the commander is cast from the command zone and is never drawn, so including it would both inflate the deck size and add a card that cannot appear in an opening hand.
- **Lands are never one-drops.** A land is played, not cast, so `card.cmc === 1` is filtered by `category !== "land"` first. Some lands do carry a non-zero mana value.

> The model is the **opening hand only** — no mulligans, no scry, no cantrips, no mana cheating. It is a floor, not a forecast.

---

## Localised Card Text

A translated interface wrapped around English card text is only half a product, so Scryfall printings are read in the viewer's language where one exists. `src/lib/scryfall/localized.ts` owns the resolution.

### How Scryfall models it

Every printing keeps `name` / `type_line` / `oracle_text` as the **oracle (English)** values, and adds `printed_name` / `printed_type_line` / `printed_text` carrying what is actually printed on that physical card. Two properties of those fields drive the module:

1. **They are filled independently.** A printing can carry a printed name with no printed text. Falling back as a unit would blank a card's rules the moment one field was missing, so `resolveLocalizedText` falls back **per field**.
2. **They are not proof of translation.** Scryfall emits them on some English printings too, where they are simply the English text again. `isLocalized` therefore keys off `lang`, never off the presence of the fields.

### Preference order

Every **translated** candidate is preferred over every **English** one, and the face is preferred within each tier:

```
face.printed_* → card.printed_* → face.<english> → card.<english>
```

Ordering by level instead (face before card) would show an English face name in place of a translated card name — the wrong trade, since a viewer reading French would rather have the combined "A // B" French name than an English face. An empty string counts as absent throughout, so `printed_text: ""` shows the English rules rather than nothing.

### Fetching

`searchCardPrintings(name, lang)` adds `lang:xx` **and** `include_multilingual=true` together. Scryfall hides non-English cards from search unless the flag is set, so sending the filter alone returns nothing at all — which reads as "no translation exists" rather than as the mistake it is.

`useCardPrintings` falls back to English when no printing exists in the requested language. Scryfall answers a search with no matches by **404-ing** rather than returning an empty list, so the miss arrives as a thrown error and is caught, not tested for. The language is part of the React Query key: the same card in two languages is two results.

### Scope

Wired into `PrintingSelectorModal`, which is where the app renders raw Scryfall text to the user. The text panel now reads the **previewed printing** rather than the card the modal was opened with — with localised printings in the list, picking one has to change the text shown.

> Card **names stay English** for search and deck storage. Translating stored `DeckCard` rows would denormalise a translation into every deck that holds the card; display is resolved at render time instead. Extending this to the rest of the card surfaces is follow-up work.

---

## Playtest Session Analytics

`src/lib/playtest/analytics.ts` has held the pure statistics — win rate, mulligan distribution, matchup splits, daily trend — since US-AG Phase 1, **written and tested but reachable from nothing**: there was no `PlaytestSession` model, so no session could ever be recorded. This closes that gap.

### Why the result is user-declared

The playtest is a solitaire goldfish with no opponent. `turns` and `mulliganCount` are read straight off the engine, but **nothing in the app can decide whether a run was a win** — the player has to say. A session is therefore only stored when they do, and skipping is a first-class option: an abandoned run is not a loss, and recording it as one would poison the win rate it feeds.

### Storage

`PlaytestSession` carries no unique constraint, unlike `DeckVote` and `DeckRating` which both upsert on `@@unique([userId, deckId])`. Every run is its own row — that is what makes a trend possible at all. Indexed on `deckId` and on `[deckId, createdAt]` for the chronological read.

`result` and `difficulty` are plain string columns, so `parseSessionInput` is the only thing standing between a typo and a row that quietly breaks every aggregate reading it. It validates the three results, rejects a turn count below 1 (a game always has a first turn), caps `mulliganCount` at `maxMulligans` with a free first mulligan, eight (CR 103.5 allows mulligans "until their opening hand would be zero cards", seven counted ones, and CR 103.5c adds the free one), and treats whitespace-only notes as absent.

### Route

Mounted at `/api/decks/[id]/playtest-sessions`, **not** under `/api/community`. A playtest record is private practice data, not something other viewers of a public deck should read. Both verbs require a session and scope every query to the caller, so two players practising the same public deck never see each other's results.

Access is checked on **ownership**, not visibility: you may read a public deck, but you may only record playtests against your own. A deck you do not own returns **404 rather than 403**, so the endpoint cannot be used to confirm which deck ids exist.

Reads are capped at `MAX_SESSIONS = 500` so one enthusiastic tester cannot make the panel unbounded.

### Aggregation

`summarizeSessions` wraps the existing pure functions. Turn count is averaged over **wins only**: a twenty-turn loss says nothing about how fast the deck closes a game, and folding it in would answer a different question than the panel asks.

### Reading the history back

`src/lib/playtest/summary-view.ts` answers the one question the aggregates do not: **is the deck getting better?**

`trendDirection` splits the daily history in half chronologically and compares the two halves, rather than first point against last — a single bad day in the middle should not read as a decline. With an odd number of days the middle one falls into neither half, so it cannot pull the verdict either way.

Two guards keep it honest:

- **`MIN_TREND_POINTS = 4`.** Fewer would mean calling a trend off one day on each side, where a single lucky game decides the answer. Below it the verdict is `"insufficient"`, not a direction.
- **Days are weighted by games played.** One lucky game at 100% must not count for as much as twenty games at 40%, which is exactly what a plain mean of the daily rates would do. `TrendPoint` carries a rate rather than a win count, so the count is recovered before averaging.

Movement under `TREND_THRESHOLD` (10 points) reports as `"steady"`. Win rates over a handful of games are noisy, and a direction the player might act on should not come out of noise.

`PlaytestHistoryPanel` renders **nothing at all** until at least one session exists. A panel of zeroes would read as "this deck loses every game" rather than "you have not recorded anything yet" — the opposite of the truth. The same applies per-figure: average win turns shows a dash rather than `0.0` when the deck has never won.

Recording invalidates the `["playtest", "history", deckId]` query. Without it the run just recorded would be missing from the panel the next time the modal opened.

`matchupRows` sorts by **opponent strength**, not alphabetically — alphabetical would read budget, cedh, mid-range, putting the strongest opponent in the middle. A difficulty the list does not recognise is kept and sorted after the known ones rather than dropped: silently discarding recorded games is worse than showing an unfamiliar label, and the panel renders such a value as stored rather than guessing a translation for it.

"Not saying" is a legitimate answer. The recording bar **omits the key entirely** rather than sending `""`, which would fail validation — absent is what "not saying" means to the route, and the column is nullable. Those runs simply do not appear in the matchup breakdown, and the breakdown itself stays hidden until at least one run has named an opponent.

---

## Playtest Engine

`src/lib/playtest/` is a pure state machine with no framework dependency, wrapped by a Zustand store and rendered by the components in `src/components/playtest/`.

**`engine.ts`** — every transition takes a state and returns a new one:

| Export                                           | Role                                                                              |
| ------------------------------------------------ | --------------------------------------------------------------------------------- |
| `PlaytestEngine`                                 | Turn, phase, life + history, hand/library/battlefield/graveyard/exile, undo stack |
| `createPlaytestState(cards, overrides)`          | Shuffles and deals; overrides carry the life total, table size and mulligan rule  |
| `applyMulligan`                                  | Reshuffles, draws seven, sets `cardsToBottom`; capped at `maxMulligans(rule)`     |
| `applyBottomCards`                               | Puts the chosen hand cards on the library bottom, in the order chosen             |
| `applyNextPhase` / `applyNextTurn`               | `PHASES` order; End rolls into the next turn and untaps; see "First-turn draw"    |
| `applyDamage` / `applyHeal`                      | Adjusts life and appends a `LifeHistoryEntry`                                     |
| `applyTap` / `applyUntapAll` / `applyAddCounter` | Battlefield permanent state                                                       |
| `applyMoveToZone`                                | Moves a card between `CardZone`s, exhaustively; only a commander enters `command` |
| `applyUndo`                                      | Restores the previous state; `pushHistory` caps the stack at 10                   |

Shuffling uses `randomIntBelow` from `src/lib/crypto-random.ts`, not `Math.random()`.

**Dealing.** `buildSetup` in `store.ts` deals each main-deck row `quantity` times, so a row of fifteen Forests is fifteen cards. Zones find, tap and key cards by id, so the first copy keeps the row id and each further copy gets `<row id>#<n>`. Sideboard and maybeboard rows are not dealt. In a format with `hasCommander` (Commander, Brawl, Oathbreaker), the commander and partner start in `commandZone`, never in the library (CR 903.6). `commanderIds` records them: only those cards may return to the command zone (CR 903.9), `analyzeEngineDrawProgress` leaves them out of the cards seen, and a mulligan sends a commander in the hand to the command zone rather than the library (CR 903.9b).

**First-turn draw.** The deal waits in the Draw step of turn 1 so the player can mulligan there. In a two-player game the starting player skips the turn-1 draw (CR 103.8a); in a multiplayer game nobody does (CR 103.8c). So when a multiplayer game (`PlaytestEngine.multiplayer`) leaves that step, by Next phase or by Next turn, it first draws the turn-1 card, logged as "Drew a card for turn 1" on its own line and undone with the move. `analyzeDrawProgress` counts one natural draw per turn in a multiplayer game and one per turn after the first in a two-player game. The app stores no pod size: the start screen's multiplayer question, defaulting to the format's usual table (`isMultiplayerByDefault`), decides it.

**`store.ts`** — `usePlaytestStore` exposes each `apply*` as an action and holds the deck as it was dealt (`setup`), so `resetPlaytest` re-deals the original deck. Rebuilding it from the live zones instead would carry battlefield state (tapped, counters) back into the library and lose the commander/partner distinction.

**Mulligan model.** London mulligan (CR 103.5): every mulligan shuffles the hand back and draws seven, then the player chooses which cards to put on the bottom, one per mulligan taken. The choice is the point: the player keeps the cards that fit the hand, so it is not the same as keeping `7 − N` at random. In a multiplayer game and in any Brawl game the first mulligan does not count (CR 103.5c); `FORMAT_CONFIG.firstMulliganFree` carries that per format (Commander, Brawl and Oathbreaker free; constructed duels not). While `cardsToBottom > 0` (`isChoosingBottom`) every action except `applyBottomCards` and `applyUndo` is a no-op, and the modal disables the rest of the board. `mulliganCount` still means mulligans taken; derive hand size with `keptOpeningHandSize`, never `7 − mulliganCount`.

**Opening-hand advice.** `keep-rules.ts` holds the keep tables of the [opening-hands guide](../product/guides/commander-mulligans-curves-and-play-style.md#how-picky-to-be-keep-rules-by-hand) as data: per-bracket margins for the first and free seven, plus the rules the guide states for every shell. Margins within ±2% are judgment calls. A hand is classed by lands and ramp at mana value 2 or less, using the deck's own `ramp` category. The keep rules apply to Commander only, since the guide's model simulates 99 cards plus a commander. A duel's first seven is judged against a six, like a free seven. At six cards or fewer the guide publishes no table, and the panel says so. `keep-rules.test.ts` parses the guide's table and fails if the copied data drifts.

**`PlaytestModal`** subscribes with fine-grained selectors and clears the session on unmount: the store outlives the modal, so a stale game would otherwise reappear on reopen.

---

## Scryfall API Caching

Shared server-side caches: `ScryfallSearchCache` (search pages, 1h TTL) and `CardCache` (cards by id, 24h TTL).

- Only the server writes them. `GET /api/cache/search` and `GET /api/cache/cards` are read-through: on a miss the server fetches Scryfall itself (`src/lib/scryfall/server-fetch.ts`, `httpGet` with the app's User-Agent), stores its own copy and returns it. There is no write route; clients never send cache bodies.
- A 200 answer, hit or fill, carries `Cache-Control: public, s-maxage=<TTL>, stale-while-revalidate=60` (`src/app/api/cache/read-through-response.ts`), so Vercel's CDN answers a repeat lookup of the same URL with no function call and no database read. A stored row and its CDN copy each live one TTL, so a page or card can reach the browser up to two TTLs plus 60 seconds after Scryfall served it. A 400, 404, 429 or 502 carries no caching header.
- `searchCards()` and `getCardById()` read through those routes. When the server cannot answer (400, 429, 5xx), the browser asks Scryfall directly and does not store the result.
- Keys are namespaced (`srv1:`): `sha256(multilingual|page|query)` for searches and the Scryfall id for cards. Rows written before the server became the only writer are never read and are pruned on the next write.
- Bounds (`src/lib/cache-limits.ts`): query 1–1000 characters of letters, digits, punctuation, symbols and spaces; page 1–100; 500 KB per page, 50 KB per card; 200 search rows and 2,000 card rows; Scryfall fills limited per client IP.
- Rate limiter: one serialized Promise queue per runtime (`src/lib/scryfall/request-queue.ts`), shared by the browser client and the server's Scryfall requests

TanStack Query `gcTime` matches `staleTime` (24h for cards/lists, 5min for search) to prevent re-fetches on component remount.

---

## Landing Page Architecture

`src/components/landing/` is a static marketing page for unauthenticated visitors: plain React, Tailwind and design tokens, with no WebGL.

```
LandingPage.tsx            # Entry point rendered by src/app/[locale]/page.tsx
  └── MarketingLanding.tsx # LandingNavbar, Hero (+ HeroPreview), CapabilityAtlas (+ CapabilityCard), FinalCta, LandingFooter
```

The earlier 3D spellbook scene (Three.js, React Three Fiber, gsap) was removed from the page in #308. Its packages, its `public/textures/` maps and the SonarCloud `S6747` suppression that only R3F props needed were removed later. The [I-13 visual direction](../product/specs/i13-visual-direction.md) replaces the 3D landing rather than reviving it.

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

> **Current state (2026-11-10).** The fields and the API described below exist, but
> `DeckDescriptionEditor`, `DeckTagsEditor` and `CardNoteInline` have no importer, so their editors
> are not reachable in the interface. Rewiring or removing them is an owner decision.

### Deck Description

Field `description String? @default("")` on `Deck`. Stored in DB and synced via `PATCH /api/decks/[id]`. The `DeckDescriptionEditor` component is a collapsible textarea in the builder's **Deck details** panel (`DeckDetailsPanel`), collapsed by default showing the first line as a preview. Supports Ctrl+Enter to save and Esc to cancel. Max 2000 chars (server-enforced).

### Card Notes

Field `notes String?` on `DeckCard`. Synced via `PATCH /api/decks/[id]/cards/[cardId]`. The `CardNoteInline` component renders a 📝 icon (amber when note exists, invisible until hover when empty) on each list-view card. Clicking opens an inline textarea popover. Note text is shown below the card name in amber. Max 1000 chars (server-enforced).

**Export**: `exportPlainText()` emits notes as `// comment` lines immediately after the card line. Other formats (Moxfield, Arena, MTGO) do not include notes.

### Deck Tags

Field `tags String[] @default([])` on `Deck` (PostgreSQL array). Tags are synced via `PATCH /api/decks/[id]` with the full updated array (at most 20 tags of 50 characters, `patchDeckSchema`). The `DeckTagsEditor` component, in the builder's **Deck details** panel (`DeckDetailsPanel`, top of the analysis sidebar), shows pill-shaped tags with color coding per tag value. Predefined suggestions: `casual`, `cEDH`, `WIP`, `budget`, `tuned`, `theme`. Tab in the input autocompletes the first suggestion. No other screen reads the tags yet: the deck list has no tag filter.

### Target Bracket

Field `targetBracket Int @default(3)` on `Deck`: the official Commander Bracket (1 Exhibition to 5 cEDH, `BRACKET_LEVELS` in `src/lib/constants/brackets.ts`) the player builds for. `DeckTargetBracketPicker`, in the **Deck details** panel, sets it through `setTargetBracket`, which writes to the store's active deck. It is shown only for formats with `hasBracketScoring` (Commander). `GameChangersBadge` and the `DeckStats` benchmarks measure the deck against it; `BracketIndicator` shows it beside the bracket estimate when they differ.

### Budget per Card

Field `budget` on `Deck`: the most the player wants to pay for one card, in US dollars, or `null` for no limit. `PATCH /api/decks/[id]` accepts a positive number or `null`. `DeckBudgetInput`, in the **Deck details** panel, saves it through `setBudget` (on the active deck) when the player presses Enter or leaves the field with a changed amount; an empty field saves `null`, and zero, a negative amount or text is refused in the field with a message. `computeDeckStats` lists the cards priced above it as over budget, and the deck wizard and `POST /api/ai/build` treat it as a maximum per card.

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
        LINT[lint-staged\neslint + prettier]
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
- Pre-commit hooks via Husky + lint-staged: `eslint --fix` + `prettier --write`
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
