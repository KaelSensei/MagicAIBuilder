# Changelog

All notable changes to MagicAIBuilder are documented here.

Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
Versioning: [Semantic Versioning](https://semver.org/spec/v2.0.0.html)

---

## [Unreleased]

### Added — Phase 1: Foundation Scaffold

#### Project Setup
- Next.js 15 App Router with TypeScript 5 and `src/` directory structure
- Tailwind CSS 4 with PostCSS integration
- pnpm as package manager
- ESLint 9 + Prettier 3 configuration
- Dark theme by default (CSS custom properties in `globals.css`)
- Design tokens: MTG mana colors, bracket colors, surface/border palette

#### Core Types (`src/lib/deck/types.ts`)
- `DeckCard` interface with full Scryfall data + derived fields
- `Deck` interface with commander, partner, cards, format, targetBracket, budget
- `DeckStats` interface with mana curve, color distribution, category counts
- `BracketScore` interface with overall 1–4 score + 6 dimension breakdown
- `CardCategory` union type (15 categories)
- `SearchFilters` interface for color/type/cmc/price filtering

#### Scryfall Integration (`src/lib/scryfall/`)
- `client.ts` — rate-limited fetch wrapper (100ms minimum between requests, User-Agent header)
- `types.ts` — full Scryfall API response type definitions
- `images.ts` — card image URL helpers for all sizes (normal, large, art_crop, png, border_crop)
- `search.ts` — query builder for filtered searches and commander-specific queries

#### Deck Logic (`src/lib/deck/`)
- `categories.ts` — auto-categorization engine: ramp, board wipe, removal, draw, tutor, win condition, protection detection
- `stats.ts` — `computeDeckStats()` — live stat computation (mana curve, color dist, avg CMC, category counts, price)
- `bracket.ts` — `scoreBracket()` — bracket scoring with 6 weighted dimensions (ramp, draw, removal, tutors, winSpeed, avgCmc); Game Changers force minimum bracket
- `validation.ts` — `validateCardForDeck()` + `validateDeck()` — singleton rule, color identity, banlist, Game Changers detection
- `store.ts` — Zustand 5 store with persist middleware (localStorage); full deck CRUD, card management, commander/partner support
- `import.ts` — plain text decklist parser (`1 Card Name` format) + text export
- `export.ts` — deck export utilities and clipboard support

#### Constants (`src/lib/constants/`)
- `brackets.ts` — bracket definitions (name, color, maxGameChangers, allowsTutors)
- `benchmarks.ts` — EDH heuristic benchmarks for scoring calibration

#### Hooks (`src/hooks/`)
- `useCardSearch.ts` — TanStack Query hook for Scryfall search (5 min cache, debounced, infinite pagination support)
- `useCardLookup.ts` — TanStack Query hook for single card lookup (24h cache)
- `useDeck.ts` — Zustand hook combining deck state + computed stats
- `useBracketScore.ts` — memoized bracket score computation from deck state
- `useGameChangers.ts` — Game Changers list fetching + deck intersection detection

#### Components
- `card/CardImage.tsx` — Framer Motion hover zoom (300ms delay), fallback to card back on error
- `card/CardGrid.tsx` — animated stagger grid for search results
- `card/CardListItem.tsx` — compact list view with remove button, Game Changer/banned flags
- `card/CardTooltip.tsx` — Radix Tooltip with card image + price
- `search/SearchBar.tsx` — debounced input (400ms), loading state, clear button
- `search/SearchFilters.tsx` — color identity toggles, CMC range, price max
- `search/SearchResults.tsx` — unified loading/error/empty/results states
- `deck/DeckEditor.tsx` — collapsible category sections with card counts
- `deck/DeckStats.tsx` — stat rows with OK/warn/error status icons
- `deck/ManaCurve.tsx` — animated bar chart, 0–7+ CMC buckets
- `deck/BracketIndicator.tsx` — bracket score with per-dimension mini bars
- `deck/GameChangersBadge.tsx` — count badge with over-limit warning
- `deck/BanlistAlert.tsx` — animated alert for banned + color violations
- `layout/Header.tsx` — logo, nav, New Deck / Import actions
- `layout/Sidebar.tsx` — placeholder for future sidebar content

#### App Pages
- `app/layout.tsx` — root layout: Geist font, dark theme, Providers
- `app/providers.tsx` — TanStack Query client provider
- `app/page.tsx` — home/deck list with empty state and deck cards grid
- `app/builder/[deckId]/page.tsx` — 3-panel builder: Search | DeckEditor | Stats

#### Tests
- Vitest 3 configured with jsdom + @testing-library/jest-dom
- `__tests__/lib/deck/bracket.test.ts` — 10 test cases for bracket scoring engine
- `__tests__/lib/deck/validation.test.ts` — 12 test cases for banlist/GC/color identity
- `__tests__/lib/deck/categories.test.ts` — 12 test cases for auto-categorization
- `__tests__/lib/scryfall/client.test.ts` — 6 test cases for API client + rate limiting
- Playwright configured for E2E testing
- `e2e/search.spec.ts` — 5 tests for search UI flow
- `e2e/deck-builder.spec.ts` — 6 tests for deck builder layout and navigation

#### Documentation
- `docs/TECHNICAL.md` — stack, architecture, patterns, conventions, local dev guide
- `docs/PROGRESS.md` — Phase 1 user story checklist with P0/P1/P2 breakdown

---

## [0.1.0] — 2026-03-20

### Added
- Initial repository setup with README and project documentation
- Game Changers card list documentation (`docs/game-changers.md`)

[Unreleased]: https://github.com/KaelSensei/MagicAIBuilder/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/KaelSensei/MagicAIBuilder/releases/tag/v0.1.0
