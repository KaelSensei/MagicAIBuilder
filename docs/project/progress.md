# MagicAIBuilder — Progress Tracker

## Overview

| Field         | Value                                  |
| ------------- | -------------------------------------- |
| Current Phase | Phase 15 — Internationalization (i18n) |
| Last Updated  | 2026-04-12                             |
| Status        | 🚀 Active Development                  |
| Main Branch   | `main`                                 |

---

## Phase 15: Internationalization (i18n) — 2026-04-12 🔄 In Progress

### Infrastructure (#320) ✅

- [x] Install `next-intl` v4, wire into `next.config.ts` plugin chain
- [x] Create i18n config: `routing.ts` (10 locales, as-needed prefix), `request.ts` (dynamic message loading), `navigation.ts` (locale-aware Link/redirect/usePathname)
- [x] Restructure all page routes under `src/app/[locale]/`
- [x] `[locale]/layout.tsx` wraps with `NextIntlClientProvider`, sets `lang` on `<html>`, pre-renders all locales via `generateStaticParams()`
- [x] Compose middleware: next-intl locale detection + NextAuth session (edge-compatible)
- [x] Update `edge-config.ts` to strip locale prefix from auth path checks
- [x] Create message stub files: 10 namespaces × 10 locales = 100 JSON files (empty, ready for content)
- [x] 6 unit tests (routing config) + 7 E2E tests (locale routing, fallback, API passthrough)

### Supported Locales

en (default), fr, de, it, es, ja, zh, ko, ru, pt

### Message Namespaces

`common`, `auth`, `builder`, `deck`, `landing`, `onboarding`, `search`, `rules`, `collection`, `profile`

### Remaining Work

- [ ] Extract hardcoded English strings from components → populate `en/*.json` message files
- [ ] Wire `useTranslations()` into client components / `getTranslations()` into server components
- [ ] Add language switcher UI (dropdown in navbar or footer)
- [ ] Translate message files for 9 non-default locales
- [ ] Test dynamic locale switching and message fallback

---

## Phase 14: Landing Page & Performance — 2026-04-06 → 2026-04-12 ✅

### 3D Landing & Marketing Overhaul (#305, #308)

- [x] 3D dark fantasy landing with Three.js (chiaroscuro lighting, parchment spellbook, ember particles)
- [x] Replace 3D scene with full 9-section marketing page: hero, pain points, AI chat mockup, stats, how it works, testimonials, CTA, navbar, footer
- [x] Cinzel + Inter fonts, Scryfall mana SVGs, `useScrollReveal` + `useTypewriter` hooks
- [x] WotC legal disclaimer in footer

### Route Architecture (#311, #312)

- [x] Split `/` (public marketing landing) from `/decks` (auth-protected deck listing)
- [x] CTAs adapt to session state; post-auth redirects → `/decks`

### Performance Optimization (#315–#318)

- [x] Slim down `/api/decks` listing response — lightweight query, commander/partner/companion only
- [x] Add page/limit pagination to deck listing API
- [x] Lazy-load full deck data on `setActiveDeck` via `GET /api/decks/[id]`
- [x] Reduce onboarding, collection, and profile loading latency

### Polish & Fixes (#302–#304, #309, #310, #313, #319)

- [x] Translate remaining French UI strings to English
- [x] Fix companion color identity visual
- [x] Header logo links to landing page
- [x] Git-prune script handles worktrees safely
- [x] Resolve 54+ SonarCloud issues from landing page
- [x] Allow unauthenticated access to `/` for landing page

---

## Phase 13: User Stories — US-A → US-J — 2026-03-30/31 ✅

_(Previously documented as "Phase 13 features" in changelog)_

---

## Phase 12: User Stories — US-I → US-X — 2026-03-29 ✅

### US-I: Advanced Card Sorting & Grouping (#221)

- [x] `sortCards()` with CMC, name, price, color, type + asc/desc direction
- [x] `groupCards()` by type, CMC, color, or none
- [x] `loadSortPreference` / `saveSortPreference` with localStorage persistence per deck
- [x] `SortGroupToolbar` wired into DeckEditor main zone toolbar
- [x] `GenericGroup` component for CMC/color non-DnD groupings
- [x] Compatible with both grid and list view modes

### US-H: Deck Price Tracking (#220 + #221)

- [x] `useDeckPrice` hook: total USD, missingPriceCount, hasCards (via Zustand)
- [x] `DeckPriceDisplay` component in Stats Panel with live total
- [x] Per-card `$X.XX` green badge in `CardListItem`

### US-K: Playtest Mode (#222 + #236)

- [x] **Engine** (`src/lib/playtest/engine.ts`): pure immutable game state machine
  - `createPlaytestState` (shuffle + draw 7), `applyDrawCard`, `applyNextPhase`, `applyNextTurn`
  - `applyDamage`, `applyHeal` with life history log
  - `applyTap`, `applyUntapAll`, `applyMoveToZone`, `applyAddCounter`
  - `applyUndo` (max 10 entries)
- [x] **Store** (`src/lib/playtest/store.ts`): Zustand store isolated from main deck store
- [x] **UI Components**: LifeTracker, PhaseTracker, HandZone, BattlefieldZone, GraveyardZone
- [x] 64 tests total (28 engine + 36 UI) ✅

### US-U: Deck Templates (#223)

- [x] `DeckTemplate` Prisma model added to schema
- [x] `createTemplate`, `applyTemplate`, `getTemplatesForCommander`, `searchTemplates`, `filterByArchetype`, `getPopularTemplates`
- [x] `TemplatesModal` UI: browse, filter, apply
- [x] API `GET /api/templates`, `POST /api/templates` with Zod validation
- [x] 26 tests passing ✅

### US-X: Analytics Dashboard (#225)

- [x] `aggregateDeckStats`: total decks, total value, avg cost, favorite archetype
- [x] `getFormatDistribution`, `getArchetypeDistribution`
- [x] `getBudgetDistribution` (Budget ≤$100 / Mid-range ≤$300 / Optimized ≤$600 / cEDH)
- [x] `getRecentlyModified` with pagination
- [x] 16 tests passing ✅

### US-W: Budget Optimization & Pricing UI (#224 + #237)

- [x] `calculateDeckPrice`, `getPriceBreakdown`, `suggestBudgetReductions`, `getCardsSortedByPrice`, `findCheaperAlternatives`, `generateShoppingListCSV`
- [x] **BudgetOptimizationModal**: current vs target budget, savings-sorted suggestions, Apply per suggestion
- [x] **PricingShoppingListModal**: cost table, subtotal, CSV download, copy to clipboard
- [x] 39 tests total (20 engine + 19 UI) ✅

### Supporting work — 2026-03-29

- [x] `fix`: reconcile authenticated users with Prisma records — race-safe upsert (#233)
- [x] `fix`: stabilize printings hover preview (#235)
- [x] `feat`: hover zoom in printings modal (#234)
- [x] `fix`: replace ReDoS-prone regex in url-import and mana parse (#230)
- [x] `fix`: Web Crypto instead of Math.random for IDs and deck shuffle (#231)
- [x] `fix(sonar)`: resolve open LOW/MEDIUM issues — A11y, Zod v4, nested ternaries (#227)
- [x] `fix(sonar)`: resolve 12 HIGH/MEDIUM impact issues — complexity, reduce, stable keys (#226)
- [x] `test`: raise coverage for meta, import, playtest, templates (#228)
- [x] `test`: expand coverage for onboarding, url-import, sort, rate-limit (#229)

---

## Phase 11: User Stories — US-A → US-F — 2026-03-28 ✅

### US-A: Bulk Select in Sideboard & Maybeboard (#199)

- [x] Checkbox multi-select per card in Sideboard and Maybeboard zones
- [x] Bulk move to Main / Maybeboard / Sideboard
- [x] Bulk remove with single confirmation dialog

### US-B: Hybrid Mana Support (#200)

- [x] Parse `{W/U}`, `{2/W}`, `{B/G}` hybrid symbols in mana costs
- [x] Both colors attributed to card's color identity for validation
- [x] Hybrid pips counted as 0.5 toward each color in mana proportion stats
- [x] Hybrid symbols rendered using official Scryfall SVGs

### US-C: Enhanced AI Deck Builder — Archetypes, Budget & Rationale (#201)

- [x] Archetype templates: stax, combo, voltron, control, aggro, midrange
- [x] Budget constraint parameter passed to AI prompt
- [x] Per-card rationale explaining why each suggestion fits the deck
- [x] Improved prompt with archetype context + budget filter

### US-D: Proxy Sheet Export — Print-Ready PDF (#202)

- [x] Configurable layout: 3×3 (A4/Letter), 2×2, 1×1
- [x] PDF export via browser print API (landscape/portrait)
- [x] Image-only export with card art cropped to proxy size
- [x] Card-by-card HTML rendering fixed (#203)

### US-E: URL Import Extended — 6 Sources + Rate Limiting (#204)

- [x] Added MTGTop8, MTGDecks.net, TappedOut, Goldfish (alongside existing Moxfield & Archidekt)
- [x] Rate limiting on import requests; respects `robots.txt` and source fair-use policies
- [x] "Tournament Deck" badge displayed on imported decks
- [x] Unified error handling for private/deleted/unsupported URLs

### US-F: Commander Meta Analysis Panel — EDHRec + Tournament (#205)

- [x] Fetch and display top cards from EDHRec for current commander
- [x] Aggregate top-played cards from MTGTop8/MTGDecks tournament results
- [x] Card frequency % and meta rank displayed alongside suggestions
- [x] Panel accessible from Stats sidebar in the builder

### Supporting work — 2026-03-28

- [x] `fix(profile)`: case-insensitive username lookup & normalize on save (#196)
- [x] `fix(proxy)`: card-by-card HTML rendering (#203)
- [x] `fix(quality)`: SonarCloud smells — unsafe casts, duplication, coverage (#206)
- [x] `fix(sonar)`: resolve 38 SonarCloud issues across 19 files (#207)
- [x] `fix(security)`: regex backtracking in TappedOut parser — ReDoS prevention (#208)
- [x] `fix(security)`: regex backtracking in decklist parser — ReDoS prevention (#209)
- [x] `fix(security)`: regex backtracking in card name strip pattern — ReDoS prevention (#210)
- [x] `fix(security)`: regex backtracking in deck import parser — ReDoS prevention (#212)
- [x] `docs(infra)`: production schema sync guide + checklist (#211)

---

## Phase 10: User Stories — US-01 → US-04 — 2026-03-27 ✅

### US-01: Paginated Game Changers & Banlist Page

- [x] Dedicated `/rules` route added to main navigation
- [x] Paginated Game Changers list — full dataset fetched (bypasses Scryfall 175-card limit)
- [x] Commander banlist with search/filter UI
- [x] Quality gate metrics updated post-merge (#193)

### US-02: User Accounts & Deck Sharing

- [x] Profile page — avatar, display name, username field
- [x] Case-insensitive username lookup and storage (slug normalised to lowercase)
- [x] Deck sharing — public/private toggle, shareable `/share/[deckId]` links
- [x] Profile API extended (`GET/PATCH` username, display name)

### US-03: URL Import — Moxfield & Archidekt

- [x] `importDeckFromUrl()` helper — detects Moxfield vs. Archidekt from URL structure
- [x] Moxfield URL parser and deck fetch
- [x] Archidekt URL parser and deck fetch
- [x] Error handling for unsupported URLs, private decks, and network failures

### US-04: First-Run Onboarding Wizard

- [x] Onboarding wizard component — step-by-step tour on first login
- [x] Contextual tooltip system — help icons with descriptive popovers
- [x] Replay option — "Show me again" in user settings
- [x] Wizard state persisted in user profile (won't re-trigger unless explicitly replayed)

### Supporting work — 2026-03-27

- [x] `fix(auth)`: force Google account picker on every sign-in (#186)
- [x] `fix(sonar)`: deprecated Zod/React types and a11y warning (#184)
- [x] `fix(sonar)`: 7 SonarCloud issues in auth and card components (#183)
- [x] `test`: coverage raised from 91% to 98% (#188)
- [x] `docs`: database reset instructions in infrastructure.md (#187)
- [x] `docs`: roadmap split into Technical and Functional sections (#185)

---

## Phase 9: Authentication & Multi-User (#181) — 2026-03-26 ✅

### NextAuth.js v5 Integration

- [x] Install `next-auth@beta`, `@auth/prisma-adapter`, `bcryptjs`
- [x] Prisma models: `User`, `Account`, `Session`, `VerificationToken`
- [x] Migration: `20260326000000_add_nextauth_users` (applied to Supabase)
- [x] `userId` FK on `Deck` and `CollectionCard` (nullable for backward compat)
- [x] Cleanup: drop legacy `isMaybeboard` column drift

### Auth Configuration

- [x] `src/lib/auth/config.ts` — NextAuth config with Prisma adapter, JWT strategy
- [x] Google OAuth provider + Credentials (email/password) provider
- [x] JWT callbacks propagate `user.id` to session
- [x] `src/lib/auth/types.ts` — Session type augmentation

### Route Protection

- [x] `src/middleware.ts` — redirects pages to `/auth/signin`, returns 401 JSON for API
- [x] Public endpoints exempted: `/api/auth/*`, `/api/health`, `/api/share/*`, `/share/*`
- [x] `requireAuth()` helper — returns session or 401
- [x] `requireDeckOwner(deckId)` helper — loads deck, verifies ownership or returns 403/404

### API Route Updates

- [x] `GET /api/decks` — filters by `userId`
- [x] `POST /api/decks` — sets `userId` on creation
- [x] All `/api/decks/[id]/*` routes — ownership verification via `requireDeckOwner()`
- [x] All `/api/collection/*` routes — scoped by `userId`
- [x] New: `POST /api/auth/signup` — registration with Zod validation, bcrypt, email normalization
- [x] New: `GET/PATCH/DELETE /api/user/profile` — profile CRUD

### UI Components

- [x] `SignInForm` — Google OAuth button + email/password form, error handling
- [x] `SignUpForm` — registration form, auto sign-in after success
- [x] `UserMenu` — avatar dropdown (initials fallback), profile link, sign out
- [x] `SessionProvider` wrapping app in `providers.tsx`
- [x] Auth pages: `/auth/signin`, `/auth/signup`

### Tests

- [x] `helpers.test.ts` — 7 tests (requireAuth, requireDeckOwner)
- [x] `signup/route.test.ts` — 11 tests (validation, creation, conflict, errors)
- [x] `profile/route.test.ts` — 15 tests (GET, PATCH, DELETE, auth checks)
- [x] All 880 tests passing (33 new)

---

## Bug Fixes — 2026-03-26

### MDFC/DFC flip in search results (#176)

- [x] Fix: `CardGrid` draggable branch now passes `cardFaces` and `isFlexibleLand` to `CardImage`
- [x] MDFC/DFC cards show 3D flip animation in search results grid view (was static single-face)

### MDFC/DFC flip in deck editor (#178)

- [x] Fix: `DeckEditor` now passes `cardFaces` and `isFlexibleLand` to `CardImage` in all 4 grid locations (commander, partner, main zone, sideboard/maybeboard)
- [x] Fix: `rebuildCardFaces()` in store reconstructs face data from DB fields (name `//` split + Scryfall image URLs) so flip persists after page reload
- [x] MDFC/DFC cards show 3D flip animation in deck editor grid view

### cardFaces reconstruction on deck load (#179)

- [x] Fix: `loadDeck` now calls `rebuildCardFaces()` on every loaded card — MDFC/DFC flip persists after page refresh

### SonarCloud cleanup — batch (#168, #169, #170, #171)

- [x] Reduced cognitive complexity in `CardFlip` and `useCardFlip` (#168)
- [x] Resolved LOW issues across 16 files (#169)
- [x] Cleared full SonarCloud backlog — 18 issues (1 HIGH, 4 MEDIUM, 13 LOW) (#170)
- [x] Final 3 issues (2 MEDIUM, 1 LOW) resolved (#171)

### SonarCloud issues (#180)

- [x] S6582 (MEDIUM): optional chain in `store.ts` — `cardFaces?.[1].typeLine` instead of `!== undefined &&`
- [x] S6847 (LOW): `CardNoteInline.tsx` — event listeners moved from `<dialog>` to `<form>` for a11y

### Bundle analyzer (#172)

- [x] `@next/bundle-analyzer` installed as dev dependency
- [x] `ANALYZE=true pnpm build` generates client/edge/nodejs bundle visualisations

---

## Search By Type (#174) — 2026-03-26 ✅

- [x] `CARD_TYPE_FILTERS` constant — 10 card type entries (Creature, Instant, Sorcery, Enchantment, Artifact, Planeswalker, Land, Battle, MDFC, DFC Transform)
- [x] `buildTypeSearchQuery()` — Scryfall query builder with OR-joined type filters + optional name
- [x] "By Type" tab in builder search panel — checkbox grid, optional name search bar
- [x] 11 new tests in `search.test.ts` — 857 total passing

---

## Phase 8: Feature Batch — Deck Tools (2026-03-26) ✅

### Deck Snapshots (#154)

- [x] `DeckSnapshot` Prisma model (cardList JSON, commander, cardCount, createdAt)
- [x] API: `GET/POST /api/decks/[id]/snapshots` + `DELETE` + transactional `/restore`
- [x] `snapshot-api.ts` typed client helper
- [x] `SnapshotsPanel` — save popover, version history list, diff badge (+/- cards), restore/delete with confirmation

### Playtest Mode (#152)

- [x] `usePlaytest` hook — Fisher-Yates shuffle, London mulligan, drawCard, nextTurn
- [x] `PlaytestModal` — fullscreen fan hand display, hover card preview, library pile, control buttons
- [x] Playtest button (Dices icon) in DeckEditor toolbar

### Maybeboard (#155)

- [x] `isMaybeboard Boolean` field on DeckCard (Prisma + migration)
- [x] Store: `addToMaybeboard`, `removeFromMaybeboard`, `moveToMaybeboard`, `moveToDeck`
- [x] API routes: POST/PATCH support `isMaybeboard`
- [x] `MaybeboardPanel` with Move to Deck / Remove per card
- [x] `CardListItem` Bookmark button + In Maybeboard badge
- [x] `CardGrid` Maybeboard overlay badge + bookmark hover button
- [x] Stats: maybeboard cards excluded from all totals
- [x] 20 new tests (stats exclusion + store actions)

### Deck Annotations — Description, Card Notes, Tags (#156)

- [x] `description String?` on `Deck` + `DeckDescriptionEditor` collapsible textarea
- [x] `notes String?` on `DeckCard` + `CardNoteInline` inline popover + export as `// comment`
- [x] `tags String[]` on `Deck` + `DeckTagsEditor` pill UI + home tag filter bar
- [x] 51 new tests (store-notes, export-notes, tags) — 111 total

### Enhanced Deck Statistics (#163)

- [x] `avgCmcWithLands` / `avgCmcWithoutLands` dual CMC rows
- [x] `turn1Playable` — CMC ≤ 1 card count
- [x] Mana Alignment — symbol ratio vs. production ratio, per-colour imbalance flags
- [x] `recommendedLandsByColor` per-colour land recommendations
- [x] Hybrid pip support (0.5 per colour in ratios)
- [x] Collapsible Mana Alignment panel in DeckStats UI

### Enhanced Search Filters (#161)

- [x] Color AND/OR/EXACT mode toggle
- [x] Colorless filter (C symbol, mutually exclusive with WUBRG)
- [x] Lands toggle, CMC mode tabs (Range/Exact/Min/Max)
- [x] Price range (min + max), subtype, keyword filters
- [x] Power/Toughness range (Creature only)
- [x] Interaction archetype presets (Removal, Counterspell, Board Wipe, Tutor, Draw, Ramp)
- [x] Filter presets saved to `localStorage`
- [x] 47 tests in `search.test.ts`

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

---

## Phase 12: Import & Proxy Polish (2026-04-02 → 2026-04-03) ✅

### Scryfall Import & Combos

- [x] **Robust DFC/MDFC name resolution**: `name-index.ts` maps `A // B`, `A//B`, and front-face names to a single Scryfall card
- [x] **Collection API front-face handling**: `scryfallCollectionLookupName()` always sends the front face for `POST /cards/collection`
- [x] **Combo detection stability**: Commander Spellbook batching + Considering zone exclusion to avoid false positives

### Proxy Export (Images + Text-only)

- [x] **CORS-safe image proxy**: `/api/proxy-card-image?url=` loads Scryfall art server-side, exposes data URLs for the print popup
- [x] **Progress + graceful failure**: proxy modal shows loaded/failed counts and falls back to text layout when images fail
- [x] **Text-only mode**: Content toggle (Card art / Text only); text-only skips preload and enables Print / Save PDF immediately
- [x] **Readable fallback layout**: larger fonts for name, type, and oracle text; P/T badge bottom-right using Scryfall power/toughness

### Schema, API, and Quality

- [x] **DeckCard.power / DeckCard.toughness** stored in Prisma + DB with idempotent migrations
- [x] **Deck API pairingType** accepts `character_select` (TMNT Character Select partner mechanic)
- [x] **SonarCloud cleanup**: open issues S7735, S6644, S6582 resolved (ProxyExportModal negated conditions + name-index defaults)

## Phase Completion Summary

| Phase    | Name                                              | Status      |
| -------- | ------------------------------------------------- | ----------- |
| Phase 1  | Foundation Scaffold                               | ✅ Complete |
| Phase 1+ | Integration (DB, DnD, Import)                     | ✅ Complete |
| Phase 2  | Intelligence (Combos, Theme, Pairing)             | ✅ Complete |
| Phase 3  | Database & Prisma                                 | ✅ Complete |
| Phase 4  | AI Suggestions                                    | ✅ Complete |
| Phase 4+ | Polish, Bug Fixes & UI Enhancements               | ✅ Complete |
| Phase 5  | Collection Mode                                   | ✅ Complete |
| Phase 6  | UX Polish — Grid Density, Zone D&D, Bracket Rules | ✅ Complete |
| Phase 7  | Infrastructure & Observability                    | ✅ Complete |
| Phase 8  | Feature Batch — Deck Tools                        | ✅ Complete |
| Phase 9  | Authentication & Multi-User                       | ✅ Complete |
| Phase 10 | User Stories — US-01 → US-04                      | ✅ Complete |
| Phase 11 | User Stories — US-A → US-F                        | ✅ Complete |

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
      | Phase | Name | Status |
      |---|---|---|
      | Phase 1 | Foundation Scaffold | ✅ Complete |
      | Phase 1+ | Integration (DB, DnD, Import) | ✅ Complete |
      | Phase 2 | Intelligence (Combos, Theme, Pairing) | ✅ Complete |
      | Phase 3 | Database & Prisma | ✅ Complete |
      | Phase 4 | AI Suggestions | ✅ Complete |
      | Phase 4+ | Polish, Bug Fixes & UI Enhancements | ✅ Complete |
      | Phase 5 | Deck Annotations (feat/deck-notes-description) | ✅ Complete |

---

## Phase 5 Checklist (Deck Annotations)

### Deck Description

- [x] `description` field on `Deck` (Prisma schema + migration)
- [x] `DeckDescriptionEditor` — collapsible textarea in DeckEditor sidebar
- [x] `updateDeckDescription` store action with optimistic update
- [x] API PATCH sanitisation (max 2000 chars)

### Card Notes

- [x] `notes` field on `DeckCard` (Prisma schema + migration)
- [x] `CardNoteInline` — 📝 icon + inline popover textarea in list view
- [x] Note preview shown below card name (amber text) when non-empty
- [x] `updateCardNotes` store action with optimistic update
- [x] API PATCH sanitisation (max 1000 chars)
- [x] `exportPlainText` emits notes as `// comment` after card line

### Deck Tags

- [x] `tags` field on `Deck` (Prisma schema + migration, PostgreSQL array)
- [x] `DeckTagsEditor` — pill UI with color coding and suggestions
- [x] Tag suggestions: casual / cEDH / WIP / budget / tuned / theme
- [x] `addTag` / `removeTag` store actions with deduplication guard
- [x] API PATCH sanitisation (trim + max 50 chars per tag)
- [x] Home page tag filter bar + tag pills on deck cards

### Tests

- [x] 51 new tests (store-notes, export-notes, tags)
- [x] Total: 111 tests, all passing

---

## Phase 4+ Checklist (Polish & Enhancements)

### Bug Fixes

- [x] Drag from search to empty deck — droppable zones were unmounting when deck empty (dnd-kit)
- [x] removeCard HTTP 404 — `toDeckCard` was using `scryfallId` instead of DB `id`
- [x] Hydration mismatch on `<html>` — `data-theme` set by inline script before React hydrates
- [x] Missing `zod` dependency in package.json
- [x] Card tooltip shown far right — now follows mouse cursor via `createPortal` with viewport clamping

### SEO (#153)

- [x] `robots.txt` — blocks private routes, allows public pages
- [x] Dynamic sitemap with shared decks
- [x] Enriched metadata (keywords, Twitter card, canonical)
- [x] JSON-LD structured data (`SoftwareApplication`)
- [x] Dynamic OG image via `/api/og` edge route

### Footer Fix (#166)

- [x] Shortcuts button aligned inline with copyright in footer (was on a separate row)

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
- [x] Deck description (collapsible editor, markdown-friendly)
- [x] Card notes (inline popover, note preview, export as comments)
- [x] Deck tags (pills, color-coded, home-page tag filter)

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

## P3 User Stories

| #     | User Story                                      | Status  |
| ----- | ----------------------------------------------- | ------- |
| US-24 | Save named snapshots (deck versions)            | ✅ Done |
| US-25 | Playtest — draw hand, mulligan, simulate turns  | ✅ Done |
| US-26 | Maybeboard — track considered cards             | ✅ Done |
| US-27 | Annotate deck with description, notes, and tags | ✅ Done |
| US-28 | Enhanced stats — CMC split, Turn 1, alignment   | ✅ Done |
| US-29 | Advanced search filters with presets            | ✅ Done |

---

## Known Issues / Next Steps

1. **E2E tests** — Playwright tests need updates for new UI (search tabs, printing selector, companion)
2. **Paginated GC/banlist** — only first page fetched (Scryfall 175 cards/page limit)
3. ~~**Mobile responsiveness** — 3-panel layout not optimized for small screens~~ ✅ Fixed in #189
4. **AI provider config** — requires `ANTHROPIC_API_KEY` or `OPENAI_API_KEY` env var; falls back to mock

---

## Metrics

| Metric                | Value      |
| --------------------- | ---------- |
| Source files          | ~85        |
| API routes            | 12         |
| Prisma models         | 5          |
| Hooks                 | 11         |
| Components            | ~45        |
| Test files            | ~14        |
| Tests passing         | 880+       |
| Test coverage         | 98%        |
| Phase 1 P0 completion | 100%       |
| Phase 1–11 completion | 100%       |
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

- [x] **Mobile responsiveness** — header hamburger menu, builder tab navigation, collection grid (#189)
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
- `docs/product/roadmap.md`: MDFC and DFC items marked done
  | Metric | Value |
  |---|---|
  | Source files | ~75 |
  | API routes | 7 |
  | Prisma models | 3 |
  | Hooks | 9 |
  | Components | ~38 |
  | Test files | 9 |
  | Tests passing | 111 |
  | Phase 1 P0 completion | 100% |
  | Phase 1–5 completion | 100% |
  | Build | ✅ Passing |
