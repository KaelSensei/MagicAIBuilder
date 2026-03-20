# MagicAIBuilder — Phase 1 Progress

## Overview

| Field | Value |
|---|---|
| Phase | 1 — Free Build Mode (Foundation) |
| Start Date | 2026-03-20 |
| Status | 🚧 Scaffold Complete — Integration Pending |
| Branch | `feat/phase-1-scaffold` |

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

### Deck Logic

- [x] Auto-categorization engine (ramp, removal, board wipe, draw, tutors, win conditions, protection)
- [x] `computeDeckStats()` — mana curve, color distribution, avg CMC
- [x] `scoreBracket()` — 6-dimension scoring with Game Changers override
- [x] `validateCardForDeck()` — singleton, color identity, banlist
- [x] `validateDeck()` — full deck validation
- [x] Zustand store with persist middleware
- [x] Text decklist import/export parser

### Hooks

- [x] `useCardSearch` — TanStack Query, 5 min cache, infinite pagination
- [x] `useCardLookup` / `useCardLookupByName` — 24h cache
- [x] `useDeck` — Zustand + computed stats
- [x] `useBracketScore` — memoized
- [x] `useGameChangers` — GC list + deck intersection

### Components

- [x] `CardImage` — hover zoom with Framer Motion, fallback image
- [x] `CardGrid` — animated stagger grid
- [x] `CardListItem` — compact row with flags
- [x] `CardTooltip` — Radix Tooltip with price
- [x] `SearchBar` — debounced, loading state, clear button
- [x] `SearchFilters` — color identity, CMC range, price max
- [x] `SearchResults` — loading/error/empty/results states
- [x] `DeckEditor` — collapsible categories
- [x] `DeckStats` — stat rows with status icons
- [x] `ManaCurve` — animated bar chart
- [x] `BracketIndicator` — score + dimensions
- [x] `GameChangersBadge` — over-limit warning
- [x] `BanlistAlert` — banned + color violations
- [x] `Header` — logo, nav, actions
- [x] `Sidebar` — placeholder

### Pages

- [x] Root layout with dark theme + fonts
- [x] Providers (TanStack Query)
- [x] Home / deck list page
- [x] Builder page with 3-panel layout

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
| US-1 | Search cards using Scryfall syntax | ✅ Scaffolded | `SearchBar` + `useCardSearch` + `SearchResults` |
| US-2 | Pick a commander | ✅ Scaffolded | Commander zone in `DeckEditor`; `setCommander()` in store |
| US-3 | Add cards to deck (click/drag) | ✅ Scaffolded | Click-to-add wired in builder page; dnd-kit installed for drag |
| US-4 | See live deck stats | ✅ Scaffolded | `DeckStats` + `ManaCurve` + `computeDeckStats()` |
| US-5 | See bracket score update live | ✅ Scaffolded | `BracketIndicator` + `useBracketScore` + `scoreBracket()` |
| US-6 | Warn about banned cards | ✅ Scaffolded | `BanlistAlert` + `validateDeck()` banlist check |
| US-7 | Warn about Game Changers | ✅ Scaffolded | `GameChangersBadge` + `useGameChangers` |
| US-8 | Warn about color identity violations | ✅ Scaffolded | `BanlistAlert` + `validateCardForDeck()` |

### P0 Remaining Work
- [ ] Drag-and-drop between search → deck (dnd-kit integration in `DeckEditor`)
- [ ] Commander color identity enforcement on add (UI warning toast)
- [ ] Real Game Changers enrichment (mark cards after fetch)
- [ ] Real banlist enrichment (mark cards after fetch)

---

## P1 User Stories (Should Have)

| # | User Story | Status | Notes |
|---|---|---|---|
| US-9 | Set a budget with per-card flagging | ✅ Scaffolded | `setBudget()` in store, `overBudgetCards` in stats |
| US-10 | Manually recategorize cards | 🚧 Partial | `updateCardCategory()` exists; UI drag between categories pending |
| US-11 | Import decklist from plain text | ✅ Scaffolded | `parseTextDecklist()` in `import.ts` |
| US-12 | Export deck to plain text | ✅ Scaffolded | `exportDeckToText()` + clipboard copy |
| US-13 | Toggle grid/list view | ⬜ Not started | ViewMode type defined; UI toggle pending |

---

## P2 User Stories (Nice to Have)

| # | User Story | Status | Notes |
|---|---|---|---|
| US-14 | Hover card to see full-size | ✅ Scaffolded | `CardImage` zoom + `CardTooltip` |
| US-15 | Filter by color/type/CMC/price | ✅ Scaffolded | `SearchFilters` + `buildSearchQuery()` |
| US-16 | Save multiple decks locally | ✅ Scaffolded | Zustand persist → localStorage |

---

## Known Issues / TODO

1. **dnd-kit drag-and-drop** — `DndContext` not yet wired in `DeckEditor`. Cards can be added via click; drag from search to deck pending.
2. **Game Changers enrichment** — `isGameChanger` is always `false` on new cards. Need to cross-reference the GC list on add.
3. **Banlist enrichment** — `isBanned` always `false`. Need to check against `getCommanderBanlist()` on add.
4. **Import UI** — `parseTextDecklist()` exists but no UI dialog to trigger it.
5. **Color pie chart** — `ColorDistribution` component mentioned in spec but not yet implemented.
6. **Commander auto-detection** — `buildCommanderSearchQuery()` exists but builder doesn't separate commander search from card search.
7. **pnpm build** — build verification pending (requires `@radix-ui/react-badge` removal workaround applied).

---

## Metrics

| Metric | Value |
|---|---|
| Source files | ~35 |
| Total LOC | ~2,800 |
| Unit tests | 40 test cases |
| E2E tests | 11 scenarios |
| Estimated completion (P0) | ~85% scaffolded |
