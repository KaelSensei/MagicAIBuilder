# Changelog

All notable changes to MagicAIBuilder are documented here.

Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
Versioning: [Semantic Versioning](https://semver.org/spec/v2.0.0.html)

---

## [Unreleased]

### Added — 2026-03-30/31: Phase 13 features — Challenges, Deck Branching, Archetypes, Playtest Analytics, Social, Keyboard Shortcuts, Ratings, Favorites

- `feat(usai): challenges — validation, scoring, ranking, status (#247)` — deck building challenges system with pure functions `validateChallenge`, `scoreChallenge`, `getRankings`; challenge completion tracking with badge rewards; 308 tests
- `feat(usaj): deck branching — create, diff, merge, conflict detection (#246)` — deck versioning: create branches from deck states, diff (added/removed/changed cards), merge with conflict detection; 222 tests
- `feat(usaf): archetypes library — 10 official archetypes` — Control, Aggro, Combo, Midrange, Ramp, Stax, Voltron, Tokens, Reanimator, Lands; archetype metadata, helpers `getArchetypesForCommander()`, `filterDeckByArchetype()`; 97 tests
- `feat(usag): Playtest Analytics — win rate, mulligan stats, matchup stats, trends` — advanced playtest statistics: win rate calculation, historical trends, mulligan metrics, matchup performance; 217 tests
- `feat(usah): social follow system — follow/unfollow + player badges` — follow other players, "Following" badge on profiles, notifications when followed players publish decks; 110 tests
- `feat(usab): deck ratings & reviews — pure logic + validation` — 5-star rating system + text reviews, review validation (length, profanity filtering), aggregate ratings; 131 tests
- `feat(usaa): card favorites & wishlist` — favorite cards across decks, wishlist for planned acquisitions; 183 tests
- `feat(usac+usad): stats export + smart recommendations engine (#241)` — export deck stats to CSV/JSON, recommendation engine with `getSmartRecommendations` and `rankRecommendationsByMetaplay`; 166 tests
- `feat(usae): keyboard shortcuts — definitions + utilities` — 15+ keyboard shortcuts, shortcut help modal (`?` key), `useKeyboardShortcuts` hook; 127 tests
- `feat: polish color identity banner symbols (#254)` — color identity mana symbols (W/U/B/R/G circles) in deck headers
- `feat: add mana symbols to home deck cards (#256)` — mana symbols on deck preview cards in home view

### Fixed — 2026-03-30/31: UI Polish, Sonar Hardening

- `fix: neutralize color identity banner background (#255)` — color banner contrast/legibility
- `fix: make builder warnings dismissible (#252)` — users can close non-critical alerts
- `fix: resolve remaining Sonar issues (#249)` — 8+ MEDIUM/LOW issues resolved
- `fix: resolve Sonar low bugs and harden ids (#248)` — crypto-random ID generation, no insecure random

### Chore — 2026-03-30: Infrastructure & Documentation

- `chore(docs): reorganize docs and update references (#251)` — docs split into `/engineering` (INFRASTRUCTURE, TECHNICAL, dx-ci-overview), `/product` (ROADMAP, PROJECT_SPEC, USER_GUIDE), `/project` (CHANGELOG, PROGRESS), `/security`; cross-references updated
- `chore(deps): bump @sentry/nextjs in production-dependencies (#250)` — error tracking dependency upgrade

### Added — 2026-03-29: Phase 12 — Playtest mode, Deck Templates, Analytics Dashboard, Pricing UI

- `feat(usk): playtest mode — engine + store foundation (#222)` — full playtest game engine built with TDD:
  - Pure immutable state machine: `createPlaytestState`, `applyDrawCard`, `applyNextPhase`, `applyNextTurn`
  - Life tracking with history log and undo support (max 10 entries)
  - Zone management: hand, battlefield, graveyard, exile; `applyMoveToZone`, `applyTap`, `applyUntapAll`, `applyAddCounter`
  - Zustand store (`usePlaytestStore`) isolated from main deck store
  - 28 tests passing ✅ (1107 total)
- `feat(usk): playtest UI — LifeTracker, PhaseTracker, HandZone, BattlefieldZone, GraveyardZone (#236)` — full UI for playtest mode:
  - **LifeTracker**: life total display, ±1/±5 buttons, custom input, game over state, life history with undo
  - **PhaseTracker**: turn badge, 7-phase list with active highlight, Next Phase / Next Turn buttons
  - **HandZone**: hand + library counts, draw button, show/hide toggle, card context menu (→ Battlefield / → Graveyard)
  - **BattlefieldZone**: responsive grid, tap/untap with rotate animation, +1/-1 counters, remove button
  - **GraveyardZone**: graveyard + exile collapsible zones, restore to hand / battlefield
  - 36 tests passing ✅ (1297 total)
- `feat(usu): deck templates — library and application system (#223)` — template management system:
  - `DeckTemplate` interface with commander, archetype, deck list (99 cards), upvotes, source (official/community)
  - Pure functions: `createTemplate`, `applyTemplate`, `getTemplatesForCommander`, `searchTemplates`, `filterByArchetype`, `getPopularTemplates`
  - `TemplatesModal` UI component: browse, filter, apply templates
  - API routes: `GET /api/templates` (list by commander), `POST /api/templates` (create from deck)
  - `DeckTemplate` Prisma model added to schema
  - 26 tests passing ✅ (1131 total)
- `feat(usx): analytics dashboard — aggregated deck statistics (#225)` — deck analytics with TDD:
  - `aggregateDeckStats`: total decks, total value, avg cost, favorite archetype
  - `getFormatDistribution`, `getArchetypeDistribution`, `getBudgetDistribution` (Budget/Mid-range/Optimized/cEDH tiers)
  - `getRecentlyModified` with pagination support
  - 16 tests passing ✅ (1195 total)
- `feat(usw): pricing — deck price tracking and budget optimization (#224)` — Scryfall-powered pricing engine:
  - `calculateDeckPrice`, `getPriceBreakdown` (by card type with percentages)
  - `suggestBudgetReductions` (sorted by savings impact), `getCardsSortedByPrice`, `findCheaperAlternatives`
  - `generateShoppingListCSV` export helper
  - `useDeckPrice` hook: total USD value, missingPriceCount, hasCards
  - `DeckPriceDisplay` component in Stats Panel with live total + missing-price notice
  - Per-card green `$X.XX` badge in `CardListItem`
  - 20 tests passing ✅
- `feat(usw): pricing UI — BudgetOptimizationModal + PricingShoppingListModal (#237)` — pricing UI components:
  - **BudgetOptimizationModal**: current vs target budget, suggestions sorted by savings, per-suggestion Apply button, "Budget goal reached!" empty state
  - **PricingShoppingListModal**: card table sorted by total cost, subtotal display, missing-price count, CSV download (`deck-name-shopping.csv`), copy to clipboard
  - 19 tests passing ✅ (1316 total)
- `feat: US-I — Advanced card sorting & grouping (#221)` — powerful sorting and grouping in the deck editor:
  - `sortCards()`: CMC, name, price, color, type with asc/desc direction
  - `groupCards()`: by type, CMC, color, or none
  - `loadSortPreference` / `saveSortPreference` with localStorage persistence per deck
  - `SortGroupToolbar` wired into DeckEditor; `GenericGroup` component for dynamic groupings
  - 18 tests passing ✅

### Fixed — 2026-03-29: Security hardening, auth reconciliation, Sonar cleanup

- `fix: reconcile authenticated users with Prisma records (#233)` — race-safe auth reconciliation: upsert on first login prevents duplicate user records; test mocks updated for strict typing
- `fix: stabilize printings hover preview (#235)` — resolved flickering/instability in the printings modal hover card preview
- `fix: add hover zoom in printings modal (#234)` — card zoom on hover in the printings modal for better print selection UX
- `fix: replace ReDoS-prone regex in url-import and mana parse (#230)` — strip MDFC/pipe suffixes and set codes via linear `indexOf` loops (Sonar S5852); `parseManaCost` refactored to avoid catastrophic backtracking
- `fix: use Web Crypto instead of Math.random for ids and shuffle (#231)` — `crypto.getRandomValues`-backed `randomIntBelow` and `randomAlphanumericId` helpers; Fisher–Yates shuffle via unbiased CSPRNG (Sonar pseudorandom hotspot)
- `fix(sonar): resolve open LOW/MEDIUM issues (#227)` — A11y, Zod v4 migration (`z.uuid`, `z.url`, `z.flattenError`), nested ternary removal, `globalThis.window` guard, proxy print via `Blob` + `load`
- `fix(sonar): resolve 12 HIGH/MEDIUM impact issues (#226)` — reduce complexity in meta route, EDHRec fetch, AI stream parsing; fix `reduce` initial value; stable list keys in MetaPanel; A11y fixes (GameChangers modal backdrop, CardNoteInline role)

### Tests — 2026-03-29

- `test: raise coverage for meta, import, playtest, templates (#228)` — `usePlaytestStore` Zustand tests, `useMetaAnalysis` hook with fetch mocks, fetch edge cases, templates helpers, `importFromUrl` Moxfield/Archidekt paths
- `test: expand coverage for onboarding, url-import, sort, rate-limit (#229)` — `useOnboarding` Session mock fixes, url-import/sort preference/`getClientIp` edge cases

### Added — 2026-03-28: Phase 11 features — bulk edit, hybrid mana, AI archetypes, proxy PDF, URL import, meta panel

- `feat(editor): bulk select in sideboard & maybeboard (#199) [US-A]` — select multiple cards at once in the Sideboard and Maybeboard zones:
  - Checkbox multi-select per card in both zones
  - Bulk move to Main / Maybeboard / Sideboard
  - Bulk remove with single confirmation
- `feat(mana): hybrid mana support (#200) [US-B]` — full hybrid mana cost handling:
  - Parse `{W/U}`, `{2/W}`, `{B/G}` hybrid symbols in mana costs
  - Both colors attributed to card's color identity
  - Hybrid pips counted as 0.5 toward each color in mana proportion statistics
  - Hybrid symbols rendered using official Scryfall SVGs
- `feat(ai): enhanced AI deck builder — archetypes, budget & rationale (#201) [US-C]` — improved AI deck suggestions:
  - Archetype templates: stax, combo, voltron, control, aggro, midrange
  - Budget constraint parameter passed to AI prompt
  - Per-card rationale explaining why each suggestion fits the deck
  - Improved prompt with archetype context + budget filter
- `feat(export): proxy sheet export — print-ready PDF (#202) [US-D]` — print-ready proxy sheet generation:
  - Configurable layout: 3×3 (A4/Letter), 2×2, 1×1
  - PDF export via browser print API (landscape/portrait)
  - Image-only export with card art cropped to proxy size
  - Card-by-card HTML rendering fixed (follow-up from #203)
- `feat(import): URL import extended — 6 sources + rate limiting (#204) [US-E]` — deck URL import extended:
  - Added support for: MTGTop8, MTGDecks.net, TappedOut, Goldfish (alongside Moxfield & Archidekt)
  - Rate limiting on import requests (respect `robots.txt` and source fair-use policies)
  - "Tournament Deck" badge displayed on imported decks
  - Unified error handling for private/deleted/unsupported URLs
- `feat(meta): commander meta analysis panel — EDHRec + tournament (#205) [US-F]` — new Commander meta panel in deck editor:
  - Fetch and display top cards from EDHRec for the current commander
  - Aggregate top-played cards across recent MTGTop8/MTGDecks tournament results
  - Show card frequency % and meta rank alongside deck-builder suggestions
  - Panel accessible from the Stats sidebar in the builder

### Fixed — 2026-03-28: proxy rendering, SonarCloud batch, regex ReDoS

- `fix(profile): case-insensitive username lookup & normalize on save (#196)` — username now normalized to lowercase on both read and write paths; prevents duplicate profiles differing only in casing
- `fix(proxy): card-by-card HTML rendering (#203)` — corrected card rendering in proxy sheet HTML output; each card now generates an independent `<figure>` block with correct image URL and layout
- `fix(quality): SonarCloud smells — unsafe casts, duplication, coverage (#206)` — resolved code smell batch: replaced unsafe `as` type casts, eliminated duplicated utility logic, increased branch coverage for flagged paths
- `fix(sonar): resolve 38 SonarCloud issues across 19 files (#207)` — batch fix clearing 38 issues (MEDIUM + LOW) across 19 source files: dead code, async patterns, missing return types, optional chain, unnecessary spread
- `fix(security): regex backtracking in TappedOut parser (#208)` — replaced vulnerable regex with linear-time alternative; prevents ReDoS on crafted deck import input
- `fix(security): regex backtracking in decklist parser (#209)` — refactored plain-text decklist parser regex; catastrophic backtracking eliminated
- `fix(security): regex backtracking in card name strip pattern (#210)` — replaced strip-name regex with possessive quantifier pattern; safe under all inputs
- `fix(security): regex backtracking in deck import parser (#212)` — final ReDoS fix pass on the deck import orchestration layer; all import parsers now use linear-time patterns

### Docs — 2026-03-28

- `docs(infra): production schema sync guide + checklist (#211)` — new `docs/INFRASTRUCTURE.md` section covering:
  - Step-by-step Supabase ↔ Prisma schema sync procedure
  - Pre-deploy checklist for schema migrations in production
  - Rollback instructions and migration verification queries

### Added — 2026-03-27: Onboarding wizard, URL import & user profile [Phase 10 — US-02, US-03, US-04]

- `feat(onboarding): first-run wizard, tooltips & replay [US-04]` — guided onboarding experience for new users:
  - **First-run wizard**: step-by-step tour triggered on first login, covers key app sections
  - **Tooltips**: contextual help icons throughout the UI with descriptive popovers
  - **Replay**: "Show me again" option in user settings to re-run the onboarding flow
- `feat(import): URL import from Moxfield & Archidekt [US-03]` — import decks directly from external services:
  - **Moxfield** URL parsing and deck import
  - **Archidekt** URL parsing and deck import
  - Unified `importDeckFromUrl()` helper; error handling for unsupported or private decks
- `feat(profile): user accounts & deck sharing [US-02]` — extended user profile and public deck sharing:
  - **Profile page** with avatar, display name, and username (case-insensitive lookup)
  - **Deck sharing**: public/private toggle on decks; shareable `/share/[deckId]` link
  - **Username storage**: case-insensitive slug stored and resolved via profile API

### Added — 2026-03-27: Paginated Game Changers & Banlist page [US-01]

- `feat(rules): paginated Game Changers & Banlist page [US-01]` — dedicated rules reference page:
  - Paginated display of all Game Changer cards (bypasses Scryfall 175-card page limit)
  - Full Commander banlist with search and filter
  - Accessible at `/rules` route in main navigation

### Added — 2026-03-27: Mobile-responsive layout (#189)

- `feat: mobile-responsive layout — header hamburger menu, builder tab navigation, collection grid (#189)` — full mobile-first responsive redesign:
  - **Header**: hamburger menu for small screens, navigation links collapse into a mobile drawer
  - **Builder**: tab navigation for the 3-panel layout on mobile (Search / Editor / Stats)
  - **Collection**: responsive grid adapts columns to screen width

### Fixed — 2026-03-27: Profile username lookup and SonarCloud issues

- `fix(profile): case-insensitive username lookup and storage` — username lookups now normalised to lowercase at read and write time; prevents duplicate profiles differing only in casing
- `fix(auth): force Google account picker on every sign-in (#186)` — added `prompt: "select_account"` to Google OAuth provider so users can switch accounts without signing out first
- `fix(sonar): resolve deprecated Zod/React types and a11y warning (#184)` — updated Zod v3 API usage, fixed React type deprecations, resolved accessibility warning flagged by SonarCloud
- `fix(sonar): resolve 7 SonarCloud issues in auth and card components (#183)` — addressed 7 issues (dead code, type safety, async patterns) in auth helpers and card-related components

### Changed — 2026-03-27: Test coverage & docs

- `test: increase unit test coverage from 91% to 98% (#188)` — added tests for previously uncovered paths; 98% line coverage across all source files
- `docs: add database reset instructions to INFRASTRUCTURE.md (#187)` — step-by-step guide for resetting the Supabase database in dev and production environments
- `docs: split roadmap into Technical and Functional sections (#185)` — `docs/product/ROADMAP.md` restructured with separate Technical Roadmap and Functional Roadmap sections for clarity
- `chore(qa): update quality gate history — PR #192 merged (US-01) (#193)` — `docs/engineering/QUALITY_GATE.md` updated with metrics snapshot after US-01 merge
- `chore(qa): quality gate baseline and metrics tracking` — established baseline metrics snapshot in `docs/engineering/QUALITY_GATE.md` for ongoing Phase 10 tracking

### Added — 2026-03-26: NextAuth.js v5 Authentication (#181)

- `feat: NextAuth.js v5 authentication (Google OAuth + credentials)` — full multi-user auth system:
  - **Prisma models**: `User`, `Account`, `Session`, `VerificationToken` with Prisma adapter
  - **Providers**: Google OAuth + email/password (bcryptjs hashed, cost 12)
  - **JWT sessions** with `userId` propagated to all routes via callbacks
  - **Middleware** — page routes redirect to `/auth/signin`, API routes return 401
  - **Ownership enforcement** on all deck and collection API routes (`requireAuth()`, `requireDeckOwner()`)
  - **Sign-in / Sign-up pages** with Google button + email/password form, responsive design
  - **UserMenu** dropdown in Header (avatar, profile link, sign out)
  - **User profile API** — `GET/PATCH/DELETE /api/user/profile`
  - **Registration API** — `POST /api/auth/signup` with Zod validation, email normalization
  - **`userId` FK** on `Deck` and `CollectionCard` (nullable for backward compat)
  - **Public endpoints** preserved: `/api/share/*`, `/api/health`, `/api/auth/*`
  - **33 new unit tests** (helpers, signup, profile) — 880 total passing

### Fixed — 2026-03-26: cardFaces reconstruction on deck load (#179)

- `fix: reconstruct cardFaces from DB fields on deck load (#179)` — `loadDeck` now calls `rebuildCardFaces()` for every card after fetching from the API, ensuring MDFC/DFC flip data is correctly rebuilt from stored `name //` split + Scryfall image URLs when a deck is loaded or the page is refreshed

### Fixed — 2026-03-26: SonarCloud issues — batch (#168, #169, #170, #171)

- `fix: reduce cognitive complexity in CardFlip and useCardFlip (#168)` — extracted helpers to keep cyclomatic complexity below 15; avoids SonarCloud maintainability warnings
- `fix: resolve SonarCloud LOW issues across 16 files (#169)` — addressed 13 LOW-severity issues (unused variables, prefer-optional-chain, missing return types) flagged across the codebase
- `fix: resolve all 18 SonarCloud issues (1 HIGH, 4 MEDIUM, 13 LOW) (#170)` — batch fix clearing full SonarCloud backlog: removed dead code, fixed async patterns, corrected type annotations
- `fix: resolve remaining 3 SonarCloud issues (2 MEDIUM, 1 LOW) (#171)` — final pass on SonarCloud queue: addressed 2 MEDIUM (redundant null checks) and 1 LOW (missing accessibility attribute)

### Fixed — 2026-03-26: SonarCloud issues (#180)

- `fix: resolve 2 SonarCloud issues (1 MEDIUM, 1 LOW)` — S6582: use optional chain in `store.ts` instead of explicit undefined check; S6847: move event listeners from non-interactive `<dialog>` to interactive `<form>` in `CardNoteInline.tsx` for accessibility

### Changed — 2026-03-26: Bundle analyzer (#172)

- `chore: add @next/bundle-analyzer (#172)` — `@next/bundle-analyzer` added as dev dependency; `ANALYZE=true pnpm build` generates webpack bundle visualisations for `client.html`, `edge.html`, and `nodejs.html`

### Fixed — 2026-03-26: MDFC/DFC flip in search results & deck editor (#176, #178)

- `fix: MDFC/DFC cards not showing flip in search results (#176)` — the draggable code path in `CardGrid` computed `dfcFaces` but never passed `cardFaces` or `isFlexibleLand` to `CardImage`, so MDFC/DFC cards displayed as static single-face images in search results grid view
- `fix: MDFC/DFC flip missing in deck editor grid views (#178)` — `DeckEditor` had `cardFaces` data on each `DeckCard` but never passed it to `CardImage`; fixed in all 4 grid locations: commander, partner, main zone, sideboard/maybeboard; also added `rebuildCardFaces()` in store to reconstruct face data from DB-stored fields (name `//` split + Scryfall image URLs) so flip works after page reload

### Added — 2026-03-26: Search By Type tab (#174)

- `feat: add "By Type" search tab with card type checkboxes` — new search mode in builder alongside Name / By Set / By Color; 10 checkboxes in a 2-column grid (Creature, Instant, Sorcery, Enchantment, Artifact, Planeswalker, Land, Battle, MDFC, DFC Transform); OR-joined Scryfall queries; optional name filter; `buildTypeSearchQuery()` + `CARD_TYPE_FILTERS` constant; 11 new tests

---

### Added — 2026-03-26: MDFC/DFC, SEO, Footer Fix

- `feat: MDFC/DFC support with 3D flip animation (#162)` — Modal Double-Faced Cards and transform cards with Moxfield-style 3D CSS flip animation, `CardFlip` component, `useCardFlip` hook, `isDfcLayout`/`isMdfcWithLandBack` utilities, flexible land detection, 20 new tests
- `feat: SEO optimization — robots.txt, sitemap, metadata, JSON-LD, OG image (#153)` — `robots.txt` blocking private routes, dynamic sitemap with shared decks, enriched metadata (keywords, Twitter card, canonical), JSON-LD `SoftwareApplication` structured data, dynamic OG image via `/api/og` edge route
- `fix: align Shortcuts button inline with copyright in footer (#166)` — Shortcuts button is now inline with the copyright line in the footer instead of being on a separate row

---

### Added — 2026-03-26: Batch — Deck Snapshots, Playtest Mode, Maybeboard, Deck Annotations, Enhanced Stats, Advanced Filters

#### Deck Snapshots (#154)

- **`DeckSnapshot` Prisma model** — stores named versions of a deck (cardList JSON, commander, cardCount, createdAt)
- **API** — `GET/POST /api/decks/[id]/snapshots`, `DELETE /api/decks/[id]/snapshots/[snapshotId]`, `POST /api/decks/[id]/snapshots/[snapshotId]/restore` (transactional restore)
- **`snapshot-api.ts`** — typed client helper for snapshot operations
- **`SnapshotsPanel`** — collapsible save popover, versioned history list with diff badge (+/- cards vs current deck), restore and delete with confirmation

#### Playtest Mode (#152)

- **`usePlaytest` hook** — Fisher-Yates shuffle, `startPlaytest`, London mulligan, `drawCard`, `nextTurn` actions
- **`PlaytestModal`** — fullscreen overlay with fan hand display, card hover preview, library pile counter, and control buttons (Draw, Mulligan, Next Turn, End)
- **London mulligan** implemented — auto-keep all drawn cards for simplicity
- **Playtest button** (Dices icon) added to `DeckEditor` toolbar

#### Maybeboard (#155)

- **`isMaybeboard` field** on `DeckCard` Prisma model + migration
- **Store** — `addToMaybeboard`, `removeFromMaybeboard`, `moveToMaybeboard`, `moveToDeck` actions
- **API** — `POST /cards` and `PATCH /cards/:id` accept `isMaybeboard`
- **`MaybeboardPanel`** — list with Move to Deck / Remove actions per card
- **`CardListItem`** — Bookmark button to move card to Maybeboard (hover), In Maybeboard badge
- **`CardGrid`** — Maybeboard overlay badge + bookmark hover button
- **Stats** — maybeboard cards excluded from all totals (totalCards, price, mana curve)
- **Tests** — 20 new tests (8 stats exclusion + 12 store actions)

#### Deck Description, Card Notes & Tags (#156)

- **Deck description** — `description String?` on `Deck`; collapsible `DeckDescriptionEditor` textarea below deck name; first-line preview when collapsed; Ctrl+Enter to save, Esc to cancel; API sanitisation (max 2000 chars)
- **Card notes** — `notes String?` on `DeckCard`; `CardNoteInline` 📝 icon + inline popover per card; amber note preview below card name; exported as `// comment` in plain text format; API sanitisation (max 1000 chars)
- **Deck tags** — `tags String[]` on `Deck`; `DeckTagsEditor` pill UI with colour coding; suggestions: casual / cEDH / WIP / budget / tuned / theme; Tab autocompletes first suggestion; home page tag filter bar + clickable tag pills on deck cards; API sanitisation (trim + max 50 chars per tag)
- **51 new tests** — store-notes, export-notes, tags (111 total, all passing)

#### Enhanced Deck Statistics (#163)

- **Dual CMC rows** — `avgCmcWithLands` and `avgCmcWithoutLands` (non-land average); `avgCmc` kept as deprecated backward-compat alias
- **Turn 1 Playable** — count of cards with CMC ≤ 1 (castable turn 1)
- **Mana Alignment** — per-colour symbol ratio vs. land production ratio; flags colour imbalances (e.g. 48% blue symbols but only 30% blue mana produced); collapsible panel in DeckStats UI
- **`recommendedLandsByColor`** — per-colour land recommendations based on mana requirements
- **Hybrid pips** — counted as 0.5 toward each colour in symbol ratios
- **`MDFC_LAYOUTS` / `MANA_IMBALANCE_THRESHOLD`** constants extracted

#### Enhanced Search Filters (#161)

- **Color AND/OR/EXACT mode toggle** — _Any_ (OR, default), _All_ (AND), _Exact_ matching when 2+ colors selected
- **Colorless filter** (C symbol) — mutually exclusive with WUBRG, filters `c:c`
- **Lands toggle** — `t:land`, composable with color/colorless
- **CMC mode tabs** — Range / Exact / Min / Max with appropriate inputs
- **Price range** — `priceMin` + `priceMax` (`usd>=N` / `usd<=N`)
- **Subtype** — free-text → `t:<subtype>` (e.g. Elf, Dragon)
- **Keyword** — free-text → `keyword:<keyword>` (e.g. Flying, Trample)
- **Power/Toughness range** — shown only when Creature type selected
- **Interaction archetype** — Removal, Counterspell, Board Wipe, Tutor, Draw, Ramp presets
- **Filter presets** — save/load named filter configurations to `localStorage`
- **47 tests** in `search.test.ts` covering all new filter behaviors

### Documentation — 2026-03-26

- `chore: no changelog/progress/roadmap edits in feature branches (#164)` — policy documented in git workflow
- `chore: add documentation discipline rule to CLAUDE.md (#165)` — docs-only PRs mandated after each feature batch
- `docs: comprehensive MTG competitive landscape report (#159)` — competitive analysis added to docs
- `docs: add tournament decks import roadmap section (#158)` — MTGTop8, MTGDecks, Moxfield, EDHRec import plan
- `docs: add DX/CI-CD overview document (#150)` — CI pipeline and DX tooling documented

### Changed — 2026-03-26

- `chore(deps): bump production-dependencies group (#149)` — two production dependency bumps
- `chore(deps-dev): bump dev-dependencies group (#148)` — two dev dependency bumps
- `chore: restrict Dependabot to minor/patch updates only (#147)` — major version bumps now require manual review

### Added — 2026-03-26: MDFC / DFC Support with 3D Flip Animation

- **Modal Double-Faced Cards (MDFC)**: e.g. _Shatterskull Smashing // Shatterskull, the Hammer Pass_ — both faces display with a Moxfield-style 3D CSS flip animation (350ms `rotateY`)
- **Transform cards (DFC)**: e.g. _Delver of Secrets // Insectile Aberration_ — front face shown by default, flip button reveals back face
- **CardFlip component**: circular `↻` button overlay in bottom-right corner of card image (visible on hover), triggers 3D flip
- **CardListItem**: "Turn Over" outlined secondary button + `△▽` badge for DFC/MDFC cards
- **CardGrid**: passes `cardFaces`/`isFlexibleLand` props to `CardImage`
- **`CardFace` type** and `cardFaces?: [CardFace, CardFace]` field on `DeckCard`
- **`isFlexibleLand`** flag on MDFC cards with a Land back face (e.g. spell//land MDFCs)
- **`categorizeDfcCard()`**: categorizes by front face only — MDFCs with land backs are NOT classified as lands
- **`isDfcLayout()`, `isMdfcWithLandBack()`** utility functions in `categories.ts`
- **`buildCardFaces()`** in store — populates DFC fields when adding cards from Scryfall
- **`flexibleLands`** count in `DeckStats` — MDFCs with land back for mana-base flexibility display
- **`getCardImageUri()`** now accepts `face: "front" | "back"` parameter for per-face image fetching
- **`DFC_LAYOUTS`** constant (`modal_dfc`, `transform`, `reversible_card`, `double_faced_token`)
- **`useCardFlip` hook**: reusable flip state management for any component
- **CSS utilities**: `backface-hidden` and `preserve-3d` Tailwind `@utility` classes
- **Tests**: 20 new tests — `isDfcLayout`, `isMdfcWithLandBack`, `categorizeDfcCard`, CMC correctness, `useCardFlip` hook

### Added — feat/advanced-search-filters (2026-03-26)

- **Color AND/OR/EXACT mode toggle** — when 2+ colors selected, a "Match:" row appears:
  - _Any_ (OR, default): `id<=WUBRG` — cards within the selected color identity
  - _All_ (AND): `c>=WUBRG` — cards containing all selected colors
  - _Exact_: `c=WUBRG` — cards with precisely these colors, nothing more
- **Colorless filter** (C mana symbol) — filters truly colorless cards (`c:c`), mutually exclusive with WUBRG
- **Lands toggle** — filter to lands (`t:land`), composable with color/colorless filters
- **CMC mode tabs** — Range / Exact / Min / Max; each mode renders appropriate input(s)
- **Price range** — `priceMin` added alongside existing `priceMax` (`usd>=N`, `usd<=N`)
- **Subtype filter** — free-text → Scryfall `t:<subtype>` (e.g. Elf, Dragon)
- **Keyword filter** — free-text → Scryfall `keyword:<keyword>` (e.g. Flying, Trample)
- **Power/Toughness range** — min/max inputs for `pow>=` / `pow<=` / `tou>=` / `tou<=`, shown only when Creature type is selected
- **Interaction archetype dropdown** — Removal, Counterspell, Board Wipe, Tutor, Draw, Ramp → oracle-text Scryfall queries
- **Filter presets** — save/load named filter configurations to `localStorage` (`magicaibuilder:filter-presets`)
- New `SearchFilters` type fields: `colorMode`, `colorlessFilter`, `landFilter`, `cmcMode`, `cmcExact`, `priceMin`, `subtype`, `keyword`, `powerMin/Max`, `toughnessMin/Max`, `interactionType`
- New exported types: `ColorMode`, `CmcMode`, `InteractionType`
- New exported helpers: `buildInteractionQuery()`, `buildColorQuery()`
- `buildSearchQuery()` split into `buildCmcParts()`, `buildPriceParts()`, `buildPowerToughnessParts()` — cognitive complexity below 15
- All React sub-components (`TabButton`, `NumInput`, `SearchFilters`) have explicit `displayName`
- `PRESETS_STORAGE_KEY` named constant (no magic strings)
- docs/product/ROADMAP.md: "Enhanced deck-building filters" marked ✅ done
- 47 tests in `src/lib/scryfall/search.test.ts` covering all new filter behaviors

### Added — 2026-04-03: Text-only proxy mode and P/T fallback

- Proxy export modal now has a **Content: Card art / Text only** toggle
- Text-only mode skips Scryfall image preloading and prints readable oracle-text placeholders only
- DeckCard `power` / `toughness` fields added (Scryfall-backed) so P/T is always shown bottom-right on fallback proxies
- Prisma schema + migrations updated to persist power/toughness safely (idempotent deploy migrations)
- Deck API validation accepts `character_select` pairing type for TMNT “Partner — Character select” commanders
- SonarCloud issues (S7735, S6644, S6582) fixed in `ProxyExportModal` and `scryfall/name-index.ts`

### Fixed — 2026-04-02: DFC import + combo detection

- Name-index for Scryfall now maps front-face names (`A`) and full `A // B` strings to the same card
- Import from Moxfield and other deck sources correctly resolves MDFC/DFC names when hitting Scryfall’s collection API
- Commander Spellbook combo fetch stabilized (batching / retry) and now ignores Considering zone cards

### Fixed — 2026-04-02: Proxy export with Scryfall art

- Proxy export uses a Next.js API route to fetch Scryfall images server-side and embed them as data URLs (no more CORS failures)
- Progress indicator shows loaded/failed art count; failed images fall back to text-only card faces instead of blank slots
- Proxy placeholders upgraded: oracle text shown in a readable block, type line italicized, P/T badge rendered bottom-right when known

### Added — 2026-03-22: Grid density selector

- Deck grid view now has a density picker (2 / 3 / 4 / 6 / 8 columns) in the toolbar, visible in grid mode only
- Default changed from 4 → **6 columns**
- `deckGridCols` state + `setDeckGridCols` action added to deck store

### Added — 2026-03-22: Grid view for Sideboard and Maybeboard

- Sideboard and Considering tabs now support grid/list toggle with the same density selector as Main
- Hover overlay shows remove (×) and quick move (→M) buttons in grid mode

### Fixed — 2026-03-22: Add card respects active zone

- Clicking or drag-dropping a card while on Sideboard/Considering now adds it to the active zone instead of always Main
- `addCard()` accepts optional `zone` parameter (default: `"main"`)
- `activeZone` state lifted from `DeckEditor` to `BuilderPage`

### Fixed — 2026-03-22: Drag & drop cross-panel reliability

- `MeasuringStrategy.Always` on `DndContext` — drop targets remeasured continuously during drag
- `DroppableZone` wrapper on Sideboard and Maybeboard — visual highlight on hover + proper target detection
- `deck-panel-{zone}` droppable on the full deck panel as fallback

### Fixed — 2026-03-22: Commander/Partner clickable in grid view

- Commander and partner cards in grid view now open the printing selector on click (same as regular cards)
- Remove button has `stopPropagation` to avoid triggering the printing selector

### Added — 2026-03-22: Bracket 4 forced for infinite 2-card combos

- `scoreBracket()` now accepts `combos: SpellbookVariant[]` — if any combo is infinite and uses exactly 2 cards, bracket is forced to 4 (RC rule)
- New `twoCardInfiniteCombos` field on `BracketScore`
- Warning added: _"N infinite 2-card combo(s) detected — deck is Bracket 4 (RC rule)"_
- Red ∞ badge in `BracketIndicator`
- `useBracketScore(deck, combos)` — combos passed from `useCombos` in BuilderPage

### Added — 2026-03-21: SonarCloud CI

- `sonar-project.properties` — SonarCloud project config (sources, exclusions, coverage path)
- `.github/workflows/sonar.yml` — GitHub Actions: runs on push/PR to main, installs deps, runs coverage, uploads to SonarCloud

### Changed — 2026-03-21: pairing.ts refactor

- `src/lib/deck/pairing.ts` — `detectPairingType()` simplifié: helper `has()` extrait, double check em-dash supprimé

### Added — 2026-03-21: Remove Commander / Partner

- **✕ button on commander and partner** — hover in grid view (on the card image) or list view (next to the name) to remove
- **`clearCommander()`** action in DeckStore — removes both commander and partner, resets pairingType to "none"
- **`setPartner(null)`** removes only the partner without affecting the commander

### Fixed — 2026-03-21: Partner & Pairing Bugs

- **Partner search now filters by pairing type** — Character Select TMNT shows only other Character Select cards; generic Partner shows only Partner keyword cards (not Character Select)
- **Self-partner bug fixed** — if commander and partner have the same name (import artifact), the duplicate is hidden in grid and list view, and filtered out at hydration time
- **`clearCommander` clears partner too** — can't have a partner without a commander
- **`setCommander` clears self-partner** — if partner name equals commander name, partner is reset to null

### Added — 2026-03-21: TMNT Character Select Partner Type

- New `character_select` value in `CommanderPairingType` for TMNT "Partner—Character select" mechanic
- `detectPairingType()` detects `partner—character select` in oracle text
- `canPairWith()` only allows character_select + character_select (not with generic Partner)
- Partner button label shows "Character Select Partner" for these commanders

### Fixed — 2026-03-21: Partner Search Mode

- **Partner mode stays active** after selecting a partner (consistent with Commander mode behavior)
- **Partner button appears** next to Commander button when current commander supports a pairing type
- Partner mode and Commander mode are mutually exclusive

### Fixed — 2026-03-21: Color Identity with Partner

- `stats.ts` was only checking `commander.colorIdentity`, ignoring `partner.colorIdentity`
- Combined identity now used for violation checks — Tymna + Reyhan = 5-color

### Fixed — 2026-03-21: Import Formats

- Import parser now strips trailing `(SET) collector_number` suffix (Moxfield/Archidekt format)
- No Commander section required — works without it
- Handles promo suffixes: 123p, 123s, 123★

### Added — 2026-03-21: Set as Commander from Deck

- **Crown icon** on hover in list view → removes card from deck and sets it as commander
- **`promoteToCommander(cardId)`** action in DeckStore

### Fixed — 2026-03-21: Multiples Detection via Oracle Text

- `maxQuantity()` now reads oracle text for "a deck can have any number of cards named"
- Replaces hardcoded name list — works for any language and future cards automatically
- Nazgûl (×9) and Seven Dwarves (×7) remain as capped exceptions

### Fixed — 2026-03-21: Mana Symbols in Color Filter

- Color filter (Show Filters) now uses Scryfall SVG mana symbols instead of emoji

### Added — 2026-03-21: Card Quantity Editor

- **+/- quantity buttons** in list view (hover to reveal) — basic lands and Commander-legal multiples can be adjusted
- **`multiples.ts`** — encodes Commander multi-copy rules: Relentless Rats, Shadowborn Apostle, Persistent Petitioners, Nazgûl (max 9), Seven Dwarves (max 7), etc.
- **`addCard` now increments** quantity instead of silently blocking when a card allows multiples

### Added — 2026-03-21: Commander in Grid View + Build Fixes

- **Commander visible in grid view** — commander (and partner) now appear pinned first in the card grid with a gold ring and `CMD` badge
- **`updateDeckDescription`, `addTag`, `removeTag`** actions added to DeckStore
- **`PlaytestState`** type added to `types.ts`
- **`DeckSnapshot`** model added to Prisma schema
- **`description` / `tags`** fields added to Deck Prisma model + API
- **`shareToken` / `shareEnabled`** fields added to Prisma schema (were in migration but missing from schema)
- **Card PATCH route** now accepts `notes`, `scryfallId`, `imageUri`, `artCropUri`
- **Deck PATCH route** now accepts `description` and `tags`

### Fixed — 2026-03-21: Edition Picker + Import

- **Edition picker in list view** — hover a card in list view → Layers icon → opens printing selector; swaps `scryfallId` + image optimistically and persists to DB
- **Import dialog** now shows a clear error message when no deck is active instead of silently doing nothing
- **`analyzeAI` call signature** fixed (was passing a raw number instead of `BracketScore | null`)
- **`onRemoveCard` prop** added to `AISuggestionsPanel` usage
- **Duplicate init migration** (`20260321002006_init`) removed — was causing `P3018` errors on `prisma migrate reset`

### Added — feat/export-audit-fix: Export audit & companion support

- **Companion in all export formats** — companion card was silently dropped from every format; now included:
  - Plain Text / Moxfield: `Companion` / `// Companion` section before `Deck`
  - MTG Arena: `Companion` section (spec-compliant for Brawl/Standard companion import)
  - MTGO `.dek`: companion placed in `Sideboard="true"` element per MTGO convention
  - TappedOut: companion marked with `*SB*` tag
  - Archidekt: companion gets its own `Companion (1)` section
- **Manabox format** — added export support for Manabox (popular iOS/Android MTG collection app); Arena-compatible layout with Commander/Companion/Deck sections
- **ExportModal card count fix** — total card count in export modal preview now includes the companion

### Added — 2026-03-21: AI Builder Improvements

- **Streaming suggestions** — API now streams NDJSON events instead of blocking; cards appear one-by-one as they arrive
- **Full deck context** — prompt now sends ALL cards (removed 60-card cap), bracket dimension scores, detected themes, game changers list, and detected gaps
- **Cards to Remove** — AI now suggests 4 cards to CUT in addition to 8 cards to add (least synergistic / bracket-pushing cards)
- **Contextual prompt** — commander-specific synergy focus instead of generic staples, respects bracket targets
- **Remove from deck button** — "Cards to Cut" section in AISuggestionsPanel with a red remove button per card
- **Suggestion cache** — deck state hash prevents redundant API calls when deck hasn't changed
- **Streaming UX** — animated card entries, loading skeleton while waiting for first stream event, spinner in header

### Added — 2026-03-21: Collection Mode

- **CollectionCard Prisma model** — tracks owned cards with scryfallId, name, quantity, foil, condition, price, acquiredAt
- **Database migration** — 20260321140000_add_collection_card with unique index on (scryfallId, foil)
- **GET /api/collection** — list all collection cards
- **POST /api/collection** — add card (upserts by scryfallId+foil, increments quantity if exists)
- **PATCH /api/collection/[id]** — update quantity/condition/foil (quantity=0 auto-deletes)
- **DELETE /api/collection/[id]** — remove card from collection
- **collectionStore (Zustand)** — collectionCards + collectionCardsFoil maps; actions: addToCollection, removeFromCollection, updateQuantity, updateCondition, getTotalOwned
- **CollectionProvider** — loads collection from DB on app startup
- **/collection page** — grid/list view, search, stat cards (unique cards, total cards, total value), quantity controls
- **AddToCollectionDialog** — search for any card, set quantity/condition/foil, add to collection
- **CollectionBadge** — shows "In Collection (xN)" badge on search result cards (grid and list views)
- **DeckCardOwnershipBadge** — shows "Owned" or "Buy" badge on deck editor card list items
- **Collection filter** — "Show only collection cards" toggle in SearchFilters (only visible when collection is non-empty)
- **Header nav** — Collection link added next to My Decks

### Added — feat/deck-notes-description

#### Deck Description

- `prisma/schema.prisma` — `description String? @default("")` field on `Deck`
- `src/components/deck/DeckDescriptionEditor.tsx` — collapsible textarea below deck name; collapsed by default with first-line preview; supports Ctrl+Enter to save, Esc to cancel
- `src/lib/deck/store.ts` — `updateDeckDescription(deckId, description)` action with optimistic update
- `src/lib/db/deck-api.ts` — `description` field in `updateDeck()` patch type and `ApiDeck` type
- `src/app/api/decks/[id]/route.ts` — PATCH handler accepts and sanitizes `description` (max 2000 chars)

#### Card Notes

- `prisma/schema.prisma` — `notes String?` field on `DeckCard`
- `src/components/card/CardNoteInline.tsx` — 📝 icon on each card in list view; click opens inline textarea popover; note preview shown below card name when non-empty
- `src/components/card/CardListItem.tsx` — `showNotes` prop wires up `CardNoteInline`; note preview line in amber below card name
- `src/lib/deck/store.ts` — `updateCardNotes(cardId, notes)` action with optimistic update
- `src/lib/db/deck-api.ts` — `updateCardNotes()` function; `notes` field in `ApiDeckCard`
- `src/app/api/decks/[id]/cards/[cardId]/route.ts` — PATCH handler accepts `notes` (max 1000 chars)
- `src/lib/deck/export.ts` — `exportPlainText()` emits card notes as `// note` comment lines

#### Deck Tags

- `prisma/schema.prisma` — `tags String[] @default([])` field on `Deck`
- `src/components/deck/DeckTagsEditor.tsx` — pill tags with color coding; suggestions: casual / cEDH / WIP / budget / tuned / theme; Tab autocompletes first suggestion; X removes tag
- `src/lib/deck/store.ts` — `addTag(deckId, tag)` and `removeTag(deckId, tag)` with optimistic updates and deduplication guard
- `src/lib/db/deck-api.ts` — `tags` field in `updateDeck()` patch type and `ApiDeck` type
- `src/app/api/decks/[id]/route.ts` — PATCH handler accepts `tags` array with per-tag sanitization (trim + max 50 chars)
- `src/app/page.tsx` — tag filter bar on home page; tag pills on deck cards (clickable to filter); active tag highlighting

#### Migration & Tests

- `prisma/migrations/20260321140000_feat_deck_description_notes_tags/migration.sql` — ALTER TABLE adds description, tags, notes
- `__tests__/lib/deck/store-notes.test.ts` — 20 tests: updateDeckDescription, addTag, removeTag, updateCardNotes (with mocked deck-api)
- `__tests__/lib/deck/export-notes.test.ts` — 10 tests: note export as comments, edge cases (null/empty/whitespace notes)
- `__tests__/lib/deck/tags.test.ts` — 21 tests: normaliseTag, shouldAddTag, sanitiseTags, suggestions coverage
- **Total tests: 111 (all passing)**

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

- Full details in `docs/project/PROGRESS.md`

---

## [0.1.0] — 2026-03-20

### Added

- Initial repository setup with README and project documentation
- Game Changers card list documentation (`docs/game-changers.md`)

[Unreleased]: https://github.com/KaelSensei/MagicAIBuilder/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/KaelSensei/MagicAIBuilder/releases/tag/v0.1.0
