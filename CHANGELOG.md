# Changelog

All notable changes to MagicAIBuilder are documented here.

Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
Versioning: [Semantic Versioning](https://semver.org/spec/v2.0.0.html)

---

## [Unreleased]

### Added — 2026-03-21: Playtest Mode

- **`PlaytestState` type** — `src/lib/deck/types.ts`: `{ hand, library, turn, mulliganCount }`
- **`usePlaytest` hook** — `src/hooks/usePlaytest.ts`:
  - `startPlaytest(deck)` — Fisher-Yates shuffle, draw 7 into hand
  - `mulligan(state, deck)` — London mulligan: reshuffle full deck, draw `7 - mulliganCount`
  - `drawCard(state)` — draw 1 from library into hand
  - `nextTurn(state)` — increment turn + draw a card
- **`PlaytestModal`** — `src/components/playtest/PlaytestModal.tsx`:
  - Fullscreen overlay with animated card fan (Fisher-Yates spread)
  - Hover card preview (full-size image tooltip)
  - Library pile with face-down stack visual and count
  - Control buttons: Mulligan (up to 6), Draw Card, End Turn
  - Stats bar: hand count, library count, turn number, mulligan count
  - Restart button to re-draw opening hand
- **Playtest button** in deck builder toolbar (Dices icon, next to Export)

### Fixed — 2026-03-21
- **Card tooltip position** — tooltip now follows the mouse cursor via `createPortal` instead of anchoring to the right edge of the full-width list item row (which landed it in the stats panel)

### Added — 2026-03-21: Oracle text in printing selector
- `src/components/card/PrintingSelectorModal.tsx` — two-column layout: oracle text panel (mana cost, type line, card text, price) on the left, printings grid on the right; handles double-faced cards via `card_faces[0]` fallback

### Changed — 2026-03-21: Mana symbols in color filter
- **By Color search** — remplacé les emojis (☀️💧💀🔥🌲) par les vrais SVGs officiels Scryfall (`svgs.scryfall.io/card-symbols/{W,U,B,R,G,C}.svg`); colorless intégré dans la liste principale

### Added — feat/set-search-all-sets
- **SetAutocomplete** — replaced static hardcoded list (~35 sets) with dynamic fetch from Scryfall `GET /sets`; filters to Commander-relevant set types (core, expansion, masters, commander…), sorted newest first, in-memory 1h cache
- **SetAutocomplete** — scroll container (max-h-64), year badge per set, loading spinner, "X sets available — type to search" footer hint

### Added — 2026-03-21: Legal & Documentation

- `src/components/layout/Footer.tsx` — legal footer component with WotC fan site policy + Scryfall disclaimer
- `LEGAL.md` — dedicated legal notices file at repo root (WotC trademarks, Scryfall data)
- `README.md` — Legal section added, links to LEGAL.md, banner image added at top
- `assets/banner.png` — updated banner image

### Added — 2026-03-21: Companion Support

- `src/lib/deck/types.ts` — `companion` field on `Deck` type (sideboard slot, outside the 99)
- Full Companion card support: stored separately, not counted in the 99, shown in builder

### Added — 2026-03-21: Inline Deck Rename

- `src/app/builder/[deckId]/page.tsx` — click deck name in title bar to edit inline (Enter to save, Escape to cancel)
- `src/lib/deck/store.ts` — `renameDeck(deckId, name)` action synced to DB via PATCH

### Added — 2026-03-21: Favicon, OG Image & Page Metadata

- `public/favicon.svg` — custom SVG favicon
- `public/og-image.svg` — Open Graph image (1200×630)
- `src/app/layout.tsx` — `icons`, `openGraph`, `keywords` metadata fields
- Page title template `%s | MagicAIBuilder`

### Added — 2026-03-21: Home Page Deck Card Art

- `src/app/page.tsx` — commander art crop shown as background on home deck cards

### Added — 2026-03-21: Search Mode Tabs

- `src/app/builder/[deckId]/page.tsx` — By Name / By Set / By Color mode tabs in search panel
- `src/components/search/SetAutocomplete.tsx` — set name autocomplete for set search
- `src/lib/scryfall/search.ts` — `buildSetSearchQuery()` and `buildColorSearchQuery()` builders

### Added — 2026-03-21: Card Printing Selector

- `src/components/card/PrintingSelectorModal.tsx` — modal to pick preferred art/printing before adding to deck
- Clicking a search result now opens the printing selector instead of adding the default print

### Added — 2026-03-21: Phase 4 — AI Suggestions

- `src/hooks/useAISuggestions.ts` — AI deck analysis hook (Anthropic/OpenAI with mock fallback)
- `src/components/deck/AISuggestionsPanel.tsx` — panel in stats column with analyze button + suggestions
- `src/app/api/ai/suggest/route.ts` — Next.js API route proxying AI provider calls
- Requires commander to be set before AI analysis is available

### Fixed — 2026-03-21: Security (#29)
- `next.config.ts` — upgrade Next.js to patch RCE CVE, restrict `images.remotePatterns` to Scryfall domains only, add `X-Content-Type-Options` / `X-Frame-Options` security headers
- `src/app/api/**` — input validation with Zod on all API routes, log sanitization to prevent log injection

### Added — 2026-03-21: Card Grid Hover Overlay (#28)
- `src/components/card/CardImage.tsx` — hover overlay shows card name, mana cost, and "+" add-to-deck indicator on search result grid cards
- `src/components/card/CardGrid.tsx` — overlay wired to grid items

### Added — 2026-03-21: Deck Grid View + Commander Hover Tooltip (#23)
- `src/components/deck/DeckEditor.tsx` — deck card grid view with card images (alongside existing list view)
- Commander card shows hover tooltip with full card details

### Added — 2026-03-21: Game Changer Toast Warning (#21)
- `src/lib/deck/store.ts` — `addCard` triggers toast notification when a Game Changer card is added
- `src/hooks/useToast.ts` — toast hook extended with GC-specific warning

### Added — Phase 3: Database & Prisma Integration

- `docker-compose.yml` — Postgres 16-alpine service
- `prisma/schema.prisma` — `Deck`, `DeckCard`, `CardCache` models
- `src/lib/db/prisma.ts` — PrismaClient singleton
- Full REST API: `GET/POST /api/decks`, `GET/PATCH/DELETE /api/decks/[id]`, card routes, cache routes
- `src/lib/db/deck-api.ts` — typed HTTP client
- `src/lib/deck/store.ts` — migrated from localStorage to DB sync with optimistic updates
- `docs/INFRASTRUCTURE.md` — full infra documentation

### Added — Phase 2: Intelligence Layer

- Commander pairing types (`pairingType` field: none / partner / friends-forever / etc.)
- `src/lib/deck/pairing.ts` — pairing type detection logic
- Combo detection via Commander Spellbook API (`useCombos`, `CombosPanel`)
- `src/hooks/useTheme.ts` — theme store (dark/light)
- `src/components/providers/ThemeSync.tsx` — syncs theme to `data-theme` on `<html>`
- Light theme CSS variables in `globals.css`
- Theme toggle in `Header`
- Delete deck action with confirmation

---

### Fixed — 2026-03-21

- **Hydration mismatch** — `suppressHydrationWarning` on `<html>` in `layout.tsx`; inline theme script sets `data-theme` before React hydration causing server/client attribute diff
- **removeCard HTTP 404** — `toDeckCard` in `loadDecks` was mapping `id: c.scryfallId` instead of `id: c.id` (DB CUID); DELETE sent wrong ID to API
- **Drag to empty deck** — `DroppableCategory` returned `null` when empty, unregistering dnd-kit droppable zones; fix: always render `<div ref={setNodeRef} />` to keep zone registered
- **Missing zod dependency** — `zod` was imported in API routes but not in `package.json`

---

### Changed — 2026-03-21

- Prisma upgraded from `^5.22.0` to `^6.19.2`; moved `prisma` CLI to devDependencies
- Next.js upgraded from `15.2.4` to `15.5.14`
- `.gitattributes` added for LF line ending normalization across Windows/Linux
- `src/app/layout.tsx` — `suppressHydrationWarning` on `<html>` element

---

### Added — Phase 1: Integration (feat/phase-1-integration)

#### Game Changers & Banlist Enrichment
- `useBanlist.ts` — new hook fetching `banned:commander` cards from Scryfall (24h cache)
- `useGameChangers.ts` — extended with `useGameChangersSet()` exposing `isGameChanger(name)` helper
- `EnrichmentProvider.tsx` — syncs GC and banlist Sets into Zustand store at startup
- `store.ts` — `addCard` and `setCommander` auto-mark `isGameChanger` and `isBanned`

#### dnd-kit Drag-and-Drop
- `DraggableCard.tsx` — search cards wrapped with `useDraggable` (8px activation distance)
- `DeckEditor.tsx` — category sections use `useDroppable` with visual highlight on drag-over
- `builder/[deckId]/page.tsx` — `DndContext` + `DragOverlay` wrapping entire page

#### Import UI
- `ImportDialog.tsx` — Radix Dialog, plain text format, Scryfall batch lookup

#### Color Distribution Chart
- `ColorDistribution.tsx` — CSS-only bar chart for W/U/B/R/G/C color pips

#### Commander Auto-Detection
- Commander mode toggle (Crown icon): filters search with `is:commander`, clicking sets commander

#### Grid/List View Toggle
- `SearchResults.tsx` + `DeckEditor.tsx` — grid/list toggle, persisted in Zustand store

---

### Added — Phase 1: Foundation Scaffold

#### Project Setup
- Next.js 15 App Router, TypeScript 5, Tailwind CSS 4, pnpm, ESLint 9 + Prettier 3
- Dark theme (CSS custom properties), MTG design tokens

#### Core Types, Scryfall Integration, Deck Logic, Hooks, Components
- Full details in `docs/PROGRESS.md`

---

## [0.1.0] — 2026-03-20

### Added
- Initial repository setup with README and project documentation
- Game Changers card list documentation (`docs/game-changers.md`)

[Unreleased]: https://github.com/KaelSensei/MagicAIBuilder/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/KaelSensei/MagicAIBuilder/releases/tag/v0.1.0
