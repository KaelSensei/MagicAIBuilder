# MagicAIBuilder — Phase 1 Progress

## Overview

| Field | Value |
|---|---|
| Phase | 1 — Free Build Mode (Foundation) |
| Start Date | 2026-03-20 |
| Status | ✅ Phase 1 Complete |
| Branch | `feat/phase-1-integration` |

---

## Phase 1 Checklist

### Infrastructure

- [x] Next.js 15 App Router project initialized
- [x] TypeScript 5 with strict mode
- [x] Tailwind CSS 4 + PostCSS config
- [x] shadcn/ui (Radix UI) installed
- [x] Framer Motion installed
- [x] Zustand 5 store with persistence
- [x] TanStack Query 5 provider
- [x] dnd-kit 6 installed
- [x] Lucide React icons
- [x] ESLint 9 + Prettier configured
- [x] Dark theme by default (CSS custom properties)
- [x] Design tokens: mana colors, bracket colors, surface/border
- [x] pnpm as package manager
- [x] Vitest 3 unit test setup
- [x] @testing-library/react configured
- [x] Playwright E2E test setup

### Core Types

- [x] `DeckCard` interface
- [x] `Deck` interface with commander + partner support
- [x] `DeckStats` interface
- [x] `BracketScore` interface
- [x] `CardCategory` union (15 categories)
- [x] `SearchFilters` interface
- [x] Scryfall API response types
- [x] `ViewMode` type ("grid" | "list")

### Scryfall Integration

- [x] Rate-limited API client (100ms between requests)
- [x] `User-Agent: MagicAIBuilder/1.0` header
- [x] Card search endpoint
- [x] Named card lookup (exact + fuzzy)
- [x] Card by ID lookup
- [x] Batch collection lookup (POST)
- [x] Autocomplete endpoint
- [x] Game Changers list endpoint
- [x] Commander banlist endpoint
- [x] Image URL helpers (all sizes)
- [x] Search query builder with filter support
- [x] Commander search query builder (is:commander filter)

### Deck Logic

- [x] Auto-categorization engine (ramp, removal, board wipe, draw, tutors, win conditions, protection)
- [x] `computeDeckStats()` — mana curve, color distribution, avg CMC
- [x] `scoreBracket()` — 6-dimension scoring with Game Changers override
- [x] `validateCardForDeck()` — singleton, color identity, banlist
- [x] `validateDeck()` — full deck validation
- [x] Zustand store with persist middleware
- [x] Text decklist import/export parser
- [x] Store enrichment: `setGameChangerNames` / `setBannedNames`
- [x] Store enrichment: cross-reference on `addCard` and `setCommander`
- [x] View mode preferences persisted in store (searchViewMode, deckViewMode)

### Hooks

- [x] `useCardSearch` — TanStack Query, 5 min cache, infinite pagination
- [x] `useCardLookup` / `useCardLookupByName` — 24h cache
- [x] `useDeck` — Zustand + computed stats
- [x] `useBracketScore` — memoized
- [x] `useGameChangers` — GC list + deck intersection + `isGameChanger()` helper
- [x] `useBanlist` — banlist + `isBanned()` helper

### Components

- [x] `CardImage` — hover zoom with Framer Motion, fallback image
- [x] `CardGrid` — animated stagger grid (with optional `draggable` prop)
- [x] `CardListItem` — compact row with flags
- [x] `CardSearchListItem` — list row for search results (with optional `draggable` prop)
- [x] `DraggableCard` — dnd-kit useDraggable wrapper for search cards
- [x] `CardTooltip` — Radix Tooltip with price
- [x] `SearchBar` — debounced, loading state, clear button
- [x] `SearchFilters` — color identity, CMC range, price max
- [x] `SearchResults` — loading/error/empty/results states + grid/list toggle
- [x] `DeckEditor` — collapsible categories with droppable zones + list/grid toggle
- [x] `DeckStats` — stat rows with status icons
- [x] `ManaCurve` — animated bar chart
- [x] `ColorDistribution` — CSS bar chart for W/U/B/R/G/C pips
- [x] `BracketIndicator` — score + dimensions
- [x] `GameChangersBadge` — over-limit warning
- [x] `BanlistAlert` — banned + color violations
- [x] `ImportDialog` — Radix Dialog with textarea, Scryfall batch validation, adds to deck
- [x] `Header` — logo, nav, Import button (triggers ImportDialog in builder context)
- [x] `EnrichmentProvider` — syncs GC + banlist Sets into Zustand at startup
- [x] `Sidebar` — placeholder

### Pages

- [x] Root layout with dark theme + fonts
- [x] Providers (TanStack Query + EnrichmentProvider)
- [x] Home / deck list page
- [x] Builder page with 3-panel layout
- [x] Commander mode toggle in builder search panel
- [x] DndContext wrapping entire builder page

### Tests

- [x] `bracket.test.ts` — 10 test cases
- [x] `validation.test.ts` — 12 test cases
- [x] `categories.test.ts` — 12 test cases
- [x] `client.test.ts` — 6 test cases (rate limiting, endpoints)
- [x] `e2e/search.spec.ts` — 5 Playwright tests
- [x] `e2e/deck-builder.spec.ts` — 6 Playwright tests

### Documentation

- [x] `CHANGELOG.md` (Keep a Changelog format)
- [x] `docs/TECHNICAL.md` (stack, architecture, patterns)
- [x] `docs/PROGRESS.md` (this file)

---

## P0 User Stories (Must Have)

| # | User Story | Status | Notes |
|---|---|---|---|
| US-1 | Search cards using Scryfall syntax | ✅ Done | `SearchBar` + `useCardSearch` + `SearchResults` |
| US-2 | Pick a commander | ✅ Done | Commander mode toggle (Crown button) + `setCommander()` in store |
| US-3 | Add cards to deck (click/drag) | ✅ Done | Click-to-add + dnd-kit drag from search → droppable category zones |
| US-4 | See live deck stats | ✅ Done | `DeckStats` + `ManaCurve` + `ColorDistribution` + `computeDeckStats()` |
| US-5 | See bracket score update live | ✅ Done | `BracketIndicator` + `useBracketScore` + `scoreBracket()` |
| US-6 | Warn about banned cards | ✅ Done | `BanlistAlert` + real banlist via `useBanlist` + enrichment on `addCard` |
| US-7 | Warn about Game Changers | ✅ Done | `GameChangersBadge` + real GC list via `useGameChangers` + enrichment on `addCard` |
| US-8 | Warn about color identity violations | ✅ Done | `BanlistAlert` + `validateCardForDeck()` |

---

## P1 User Stories (Should Have)

| # | User Story | Status | Notes |
|---|---|---|---|
| US-9 | Set a budget with per-card flagging | ✅ Done | `setBudget()` in store, `overBudgetCards` in stats |
| US-10 | Manually recategorize cards | 🚧 Partial | `updateCardCategory()` exists; UI drag between categories pending |
| US-11 | Import decklist from plain text | ✅ Done | `ImportDialog` — dialog with textarea, Scryfall batch lookup |
| US-12 | Export deck to plain text | ✅ Done | `exportDeckToText()` + clipboard copy |
| US-13 | Toggle grid/list view | ✅ Done | Toggle in `SearchResults` and `DeckEditor`, persisted in Zustand store |

---

## P2 User Stories (Nice to Have)

| # | User Story | Status | Notes |
|---|---|---|---|
| US-14 | Hover card to see full-size | ✅ Done | `CardImage` zoom + `CardTooltip` |
| US-15 | Filter by color/type/CMC/price | ✅ Done | `SearchFilters` + `buildSearchQuery()` |
| US-16 | Save multiple decks locally | ✅ Done | Zustand persist → localStorage |

---

## Known Issues / TODO

All Phase 1 known issues resolved. Remaining work for Phase 2:

1. **Manual category drag** — drag cards between categories within DeckEditor (US-10 partial)
2. **Commander color identity warning toast** — UI toast on add when color violation detected
3. **Paginated GC/banlist** — only first page fetched (Scryfall returns 175 cards max per page)
4. **E2E test updates** — Playwright tests need updates for new UI interactions

---

## Metrics

| Metric | Value |
|---|---|
| Source files | ~45 |
| Total LOC | ~3,800 |
| Unit tests | 40 test cases |
| E2E tests | 11 scenarios |
| Build | ✅ Passing (pnpm build) |
| Phase 1 P0 completion | 100% |
| Phase 1 P1 completion | ~90% (US-10 partial) |
