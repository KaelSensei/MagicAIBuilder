# MagicAIBuilder — Progress Tracker

## Overview

| Field         | Value                                    |
| ------------- | ---------------------------------------- |
| Current Phase | Phase 7 — Infrastructure & Observability |
| Last Updated  | 2026-03-24                               |
| Status        | 🚀 Active Development                    |
| Main Branch   | `main`                                   |

---

## MDFC / DFC Support (2026-03-26)

| Item                                                           | Status      |
| -------------------------------------------------------------- | ----------- |
| CardFace type + DeckCard fields                                | ✅ Complete |
| ScryfallCard.layout + DFC_LAYOUTS                              | ✅ Complete |
| getCardImageUri face param                                     | ✅ Complete |
| categories: isDfcLayout, isMdfcWithLandBack, categorizeDfcCard | ✅ Complete |
| store: buildCardFaces, makeDeckCard DFC fields                 | ✅ Complete |
| stats: flexibleLands count                                     | ✅ Complete |
| CardFlip: 3D Moxfield-style flip animation                     | ✅ Complete |
| CardImage: delegates to CardFlip                               | ✅ Complete |
| CardListItem: Turn Over button + △▽ badge                      | ✅ Complete |
| CardGrid: DFC support                                          | ✅ Complete |
| useCardFlip hook                                               | ✅ Complete |
| CSS: backface-hidden, preserve-3d utilities                    | ✅ Complete |
| Tests: 20 new DFC tests                                        | ✅ Complete |

## Phase Completion Summary

| Phase    | Name                                              | Status         |
| -------- | ------------------------------------------------- | -------------- |
| Phase 1  | Foundation Scaffold                               | ✅ Complete    |
| Phase 1+ | Integration (DB, DnD, Import)                     | ✅ Complete    |
| Phase 2  | Intelligence (Combos, Theme, Pairing)             | ✅ Complete    |
| Phase 3  | Database & Prisma                                 | ✅ Complete    |
| Phase 4  | AI Suggestions                                    | ✅ Complete    |
| Phase 4+ | Polish, Bug Fixes & UI Enhancements               | ✅ Complete    |
| Phase 5  | Collection Mode                                   | ✅ Complete    |
| Phase 6  | UX Polish — Grid Density, Zone D&D, Bracket Rules | ✅ Complete    |
| Phase 7  | Infrastructure & Observability                    | 🔄 In Progress |
| Phase 8  | E2E Docker Testing (feat/e2e-docker-playwright)   | ✅ Complete    |

---

## Phase 4+ AI Builder Improvements

### Status: ✅ Complete

- [x] Streaming NDJSON API response (analysis → suggestions → removals → done)
- [x] Improved prompt with all deck cards, bracket dimensions, themes, gaps
- [x] Cards to Remove (4 removal suggestions per analysis)
- [x] AISuggestionsPanel "Cards to Cut" section with Remove button
- [x] Deck state hash cache to avoid redundant API calls
- [x] BracketScore passed to hook instead of just number
- [x] Animated streaming card entries in panel

---

## Phase 4+ Checklist (Polish & Enhancements)

### Bug Fixes

- [x] Drag from search to empty deck — droppable zones were unmounting when deck empty (dnd-kit)
- [x] removeCard HTTP 404 — `toDeckCard` was using `scryfallId` instead of DB `id`
- [x] Hydration mismatch on `<html>` — `data-theme` set by inline script before React hydrates
- [x] Missing `zod` dependency in package.json
- [x] Card tooltip shown far right — now follows mouse cursor via `createPortal` with viewport clamping

### SEO
- [x] robots.txt (bloque pages privées, autorise pages publiques)
- [x] Sitemap dynamique avec decks partagés
- [x] Metadata enrichie (keywords, Twitter card, canonical)
- [x] JSON-LD structured data (SoftwareApplication)
- [x] Image OG dynamique via edge route `/api/og`

### UI Enhancements

- [x] Inline deck rename in builder title bar (click name → input → Enter/Escape)
- [x] Card printing selector modal with oracle text panel (mana cost, type line, card text, price)
- [x] Search mode tabs: By Name / By Set / By Color
- [x] Dynamic set search — all sets fetched from Scryfall API (replaces static list), 1h cache, sorted newest first
- [x] Mana symbols in color filter — official Scryfall SVGs (W/U/B/R/G/C) replacing emojis
- [x] Commander art crop as background on home deck cards
- [x] Favicon SVG + OG image (1200×630)
- [x] Page metadata: title template, keywords, openGraph
- [x] Light / dark theme toggle with persistence
- [x] Export deck (multiple formats: Moxfield, MTG Arena, MTGO, TappedOut, Archidekt, Manabox, Plain Text)
- [x] Export — companion card included in all formats (was silently dropped before)
- [x] Export — Manabox format added (popular iOS/Android app)
- [x] Export — MTGO companion placed in sideboard correctly
- [x] ExportModal — card count includes companion
- [x] Delete deck with confirmation
- [x] Deck card grid view with card images (alongside list view)
- [x] Commander hover tooltip with full card details
- [x] Card grid hover overlay (name + mana cost + add indicator)
- [x] Game Changer toast warning on addCard
- [x] Mana symbols as official Scryfall SVGs in color filter
- [x] Oracle text panel in printing selector modal

### Security

- [x] Next.js upgraded to patch RCE CVE
- [x] Scryfall image domains restricted in `next.config.ts`
- [x] Security headers (X-Content-Type-Options, X-Frame-Options)
- [x] Input validation with Zod on all API routes

### Features

- [x] Companion card support (sideboard slot, outside the 99)
- [x] Commander pairing types (partner, friends-forever, etc.)
- [x] AI-assisted deck suggestions (Phase 4)
- [x] Combo detection via Commander Spellbook API

### Infrastructure

- [x] Prisma upgraded to v6
- [x] Next.js upgraded to 15.5.14
- [x] `.gitattributes` for LF line ending normalization
- [x] `LEGAL.md` — WotC fan site policy + Scryfall disclaimer
- [x] Footer component with legal notices on home page
- [x] README: banner, legal section, comprehensive docs

---

## Phase 1–3 Checklist (Foundation → Database)

### Infrastructure

- [x] Next.js 15 App Router
- [x] TypeScript 5 strict mode
- [x] Tailwind CSS 4
- [x] pnpm package manager
- [x] ESLint 9 + Prettier 3
- [x] Zustand 5 store
- [x] TanStack Query 5
- [x] dnd-kit 6
- [x] Framer Motion
- [x] Vitest 3 + Testing Library
- [x] Playwright E2E
- [x] Docker Compose + PostgreSQL 16
- [x] Prisma ORM (schema, migrations, client)

### Core Types

- [x] `DeckCard`, `Deck`, `DeckStats`, `BracketScore`
- [x] `CardCategory` (15 categories)
- [x] `SearchFilters`, `ViewMode`
- [x] `CommanderPairingType`
- [x] Scryfall API response types

### Scryfall Integration

- [x] Rate-limited API client (100ms between requests)
- [x] Card search, named lookup, batch collection, autocomplete
- [x] Game Changers list endpoint
- [x] Commander banlist endpoint
- [x] Image URL helpers (all sizes)
- [x] Search query builders (name, commander, set, color)
- [x] 24h DB cache via `CardCache` Prisma model

### Deck Logic

- [x] Auto-categorization engine (15 categories)
- [x] `computeDeckStats()` — mana curve, color distribution, avg CMC
- [x] `scoreBracket()` — 6-dimension scoring
- [x] `validateCardForDeck()` — singleton, color identity, banlist
- [x] Text decklist import/export
- [x] Store enrichment: GC + banlist cross-reference on addCard/setCommander

### API Routes

- [x] `GET/POST /api/decks`
- [x] `GET/PATCH/DELETE /api/decks/[id]`
- [x] `POST/DELETE /api/decks/[id]/cards`
- [x] `DELETE/PATCH /api/decks/[id]/cards/[cardId]`
- [x] `GET/POST /api/cache/cards`
- [x] `POST /api/ai/suggest`

### Hooks

- [x] `useCardSearch` — TanStack Query, 5 min cache
- [x] `useCardLookup` / `useCardLookupByName`
- [x] `useDeck` — Zustand + computed stats
- [x] `useBracketScore` — memoized
- [x] `useGameChangers` — GC list + `isGameChanger()` helper
- [x] `useBanlist` — banlist + `isBanned()` helper
- [x] `useCombos` — Commander Spellbook API
- [x] `useTheme` — dark/light preference store
- [x] `useAISuggestions` — AI analysis with provider fallback

### Components

- [x] `CardImage`, `CardGrid`, `CardListItem`, `CardTooltip`
- [x] `DraggableCard`, `PrintingSelectorModal`
- [x] `SearchBar`, `SearchFilters`, `SearchResults`, `SetAutocomplete`
- [x] `DeckEditor` — droppable categories, list/grid toggle
- [x] `DeckStats`, `ManaCurve`, `ColorDistribution`
- [x] `BracketIndicator`, `GameChangersBadge`, `BanlistAlert`
- [x] `CombosPanel`, `AISuggestionsPanel`
- [x] `ImportDialog`, `ExportModal`
- [x] `Header`, `Footer`
- [x] `EnrichmentProvider`, `ThemeSync`

### Pages

- [x] Root layout with theme + fonts + `suppressHydrationWarning`
- [x] Providers (TanStack Query + EnrichmentProvider)
- [x] Home / deck list page with commander art backgrounds
- [x] Builder page: 3-panel layout (Search | DeckEditor | Stats)
- [x] Search mode tabs (By Name / By Set / By Color)
- [x] Commander mode toggle

---

## P0 User Stories

| #    | User Story                           | Status  |
| ---- | ------------------------------------ | ------- |
| US-1 | Search cards using Scryfall syntax   | ✅ Done |
| US-2 | Pick a commander                     | ✅ Done |
| US-3 | Add cards to deck (click/drag)       | ✅ Done |
| US-4 | See live deck stats                  | ✅ Done |
| US-5 | See bracket score update live        | ✅ Done |
| US-6 | Warn about banned cards              | ✅ Done |
| US-7 | Warn about Game Changers             | ✅ Done |
| US-8 | Warn about color identity violations | ✅ Done |

## P1 User Stories

| #     | User Story                                            | Status  |
| ----- | ----------------------------------------------------- | ------- |
| US-9  | Set a budget with per-card flagging                   | ✅ Done |
| US-10 | Manually recategorize cards (drag between categories) | ✅ Done |
| US-11 | Import decklist from plain text                       | ✅ Done |
| US-12 | Export deck                                           | ✅ Done |
| US-13 | Toggle grid/list view                                 | ✅ Done |
| US-14 | Inline deck rename                                    | ✅ Done |
| US-15 | Choose card printing/art                              | ✅ Done |
| US-16 | Search by set or color                                | ✅ Done |
| US-17 | Companion card support                                | ✅ Done |

## P2 User Stories

| #     | User Story                     | Status               |
| ----- | ------------------------------ | -------------------- |
| US-18 | Hover card to see full-size    | ✅ Done              |
| US-19 | Filter by color/type/CMC/price | ✅ Done              |
| US-20 | Persist multiple decks         | ✅ Done (PostgreSQL) |
| US-21 | Combo detection                | ✅ Done              |
| US-22 | AI deck suggestions            | ✅ Done              |
| US-23 | Light/dark theme               | ✅ Done              |

---

## Known Issues / Next Steps

1. **E2E tests** — Playwright tests need updates for new UI (search tabs, printing selector, companion)
2. **Paginated GC/banlist** — only first page fetched (Scryfall 175 cards/page limit)
3. **Mobile responsiveness** — 3-panel layout not optimized for small screens
4. **AI provider config** — requires `ANTHROPIC_API_KEY` or `OPENAI_API_KEY` env var; falls back to mock

---

## Metrics

| Metric                | Value      |
| --------------------- | ---------- |
| Source files          | ~70        |
| API routes            | 7          |
| Prisma models         | 3          |
| Hooks                 | 9          |
| Components            | ~35        |
| Phase 1 P0 completion | 100%       |
| Phase 1–4 completion  | 100%       |
| Build                 | ✅ Passing |

---

## Phase 5: Collection Mode ✅

### Implemented

- [x] **Prisma model** — CollectionCard with scryfallId, name, quantity, foil, condition, price, acquiredAt, imageUri
- [x] **Migration** — 20260321140000_add_collection_card (unique index on scryfallId+foil)
- [x] **API routes** — GET/POST /api/collection + PATCH/DELETE /api/collection/[id]
- [x] **Zustand store** — collectionStore with collectionCards, collectionCardsFoil maps
- [x] **CollectionProvider** — pre-loads collection at app startup
- [x] **/collection page** — grid/list, search, stats (unique cards, total, value), qty controls
- [x] **AddToCollectionDialog** — search + add with quantity/foil/condition form
- [x] **CollectionBadge** — "In Collection (xN)" on search results (grid + list)
- [x] **DeckCardOwnershipBadge** — "Owned" / "Buy" on deck editor list items
- [x] **Search filter** — "Show only collection cards" toggle
- [x] **Header nav** — Collection link

---

## Phase 6: UX Polish — Grid Density, Zone D&D, Bracket Rules 🔄

### Implemented

- [x] **Grid density selector** — 2/3/4/6/8 columns, default 6, persisted in store
- [x] **Grid view for Sideboard & Maybeboard** — same grid/density as Main zone
- [x] **Active zone–aware card add** — click/D&D adds to current tab (Main/Sideboard/Considering)
- [x] **Drag & drop cross-panel** — `MeasuringStrategy.Always` + `DroppableZone` wrappers
- [x] **Commander/Partner clickable in grid** — opens printing selector like regular cards
- [x] **Bracket 4 for 2-card infinite combos** — RC rule enforced via Spellbook data
- [x] **∞ badge in BracketIndicator** — red badge when 2-card infinite combo detected

### In Progress / Next

- [ ] Mobile responsiveness — 3-panel layout
- [ ] Persist deck zone (sideboard/maybeboard) state to DB
- [ ] E2E tests (Playwright) for new drag & drop flows

---

## Phase 7: Infrastructure & Observability 🔄

### Completed

- [x] **Vercel deployment** — app live, auto-deploy on push to `main`
- [x] **Supabase** — PostgreSQL hosted, Transaction Pooler configured for Vercel (IPv4 compatible)
- [x] **GitHub Actions CI** — lint + typecheck + test coverage + build on every PR
- [x] **Branch protection** — `main` requires CI green before merge
- [x] **Husky pre-commit hooks** — lint-staged runs `next lint --fix` + `prettier --write`
- [x] **Health check endpoint** — `GET /api/health` returns DB status
- [x] **Sentry** — error tracking on frontend + backend (EU data center)

### In Progress / Next

- [ ] UptimeRobot — configure monitor on `/api/health`
- [ ] Sentry source maps — add `SENTRY_AUTH_TOKEN` to Vercel
- [ ] Fix CI typecheck errors in test files

---

## MDFC/DFC Card Flip Support

### Implemented (2026-03-26)

- `CardFace` interface; `cardFaces?`; `isFlexibleLand?`; `flexibleLands` stat
- `isDfcLayout()`, `isMdfcWithLandBack()`, `categorizeDfcCard()`, `MDFC_LAYOUTS`
- `buildCardFaces()` + `computeCmc()` in store; `getCardImageUri` face param
- `CardFlip` 3D component; `useCardFlip` hook; `CardListItem` Turn Over; `CardGrid` cardFaces
- Tests: `useCardFlip.test.ts` (6+), MDFC section in `categories.test.ts`
- `docs/ROADMAP.md`: MDFC and DFC items marked done
