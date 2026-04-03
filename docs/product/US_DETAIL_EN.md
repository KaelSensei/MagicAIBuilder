# US_DETAIL_EN.md — All MagicAIBuilder User Stories

> Document maintained by PeeWy 📋
> Updated after each US sent to Joyce.
> Transmitted to Léa on request.

---

## Global Status

| US    | Title                                         | Sprint   | PR   | Status         |
| ----- | --------------------------------------------- | -------- | ---- | -------------- |
| US-01 | Game Changers / Banlist Pagination            | Phase 9  | #192 | ✅ Merged      |
| US-02 | User accounts & deck sharing                  | Phase 9  | #194 | ✅ Merged      |
| US-03 | Moxfield / Archidekt import URL               | Phase 9  | #195 | ✅ Merged      |
| US-04 | Onboarding tutorial first-run                 | Phase 9  | #197 | ✅ Merged      |
| US-A  | Bulk edit Sideboard & Maybeboard              | Sprint 2 | #199 | ✅ Merged      |
| US-B  | Hybrid mana cards support                     | Sprint 2 | #200 | ✅ Merged      |
| US-C  | Enhanced AI deck builder                      | Sprint 2 | #201 | ✅ Merged      |
| US-D  | Proxy sheets PDF export                       | Sprint 2 | #202 | ✅ Merged      |
| US-E  | Import from URL tournament (6 sources)        | Sprint 3 | #204 | ✅ Merged      |
| US-F  | Meta Analysis — top cards for commander       | Sprint 3 | #205 | ✅ Merged      |
| US-G  | Collection tracking + shopping list           | Sprint 4 | —    | 🔄 In Progress |
| US-H  | Multiple format support (Standard, Modern...) | Sprint 4 | —    | ⏳ Waiting     |
| US-I  | Community deck suggestions                    | Sprint 4 | —    | ⏳ Waiting     |
| US-J  | i18n multi-language                           | Sprint 4 | —    | ⏳ Waiting     |
| US-K  | Enhanced Playtest Mode                        | Sprint 5 | —    | 🔄 In Progress |
| US-L  | Advanced Deck Analytics                       | Sprint 5 | —    | ⏳ Waiting     |

---

## Phase 9

---

### US-01 — Game Changers / Banlist Pagination

**PR #192** | ✅ Merged on 2026-03-27

**User story**
As a MagicAIBuilder user, I want to navigate the Game Changers / banlist card list via pagination, so I don't get overwhelmed by 175+ cards displayed at once.

**Context**
Current list exceeds 175 cards. Single-block display degrades performance and UX. Scope decision: new page `/rules/game-changers`, reuse existing hooks `useGameChangersList()` and `useBanlistQuery()`. Badge and alert in builder remain intact.

**Acceptance Criteria**

- Pagination 25 cards/page
- Shareable URL `?page=N`
- Game Changers / Banlist tabs
- Search within list
- Lazy-loaded thumbnails
- "Rules" link in desktop + mobile header
- Scroll returns to top on page change
- No regression on GameChangersBadge and BanlistAlert in builder

**Delivered**

- `/rules/game-changers` — pagination 25/page, tabs GC/Banlist, search, shareable URL `?page=N`
- "Rules" link in desktop + mobile header
- 952/952 tests green, SonarCloud stable

---

### US-02 — User accounts & deck sharing

**PR #194** | ✅ Merged on 2026-03-27

**User story**
As a logged-in user, I want to have a public profile and share my decks with other users.

**Context**
NextAuth auth already in place. Capitalize on existing infrastructure to create public profiles and deck sharing.

**Acceptance Criteria**

- Public profile `/u/[username]`
- Public/private toggle per deck in builder
- Shareable URL `/deck/[id]` without login required
- Public deck page: name, description, card list, author
- Private decks invisible to non-owners
- No regression on existing auth

---

### US-03 — Moxfield / Archidekt import URL

**PR #195** | ✅ Merged on 2026-03-27

**User story**
As a user, I want to import a deck from a Moxfield or Archidekt URL.

**Acceptance Criteria**

- "Import from URL" field in builder
- Automatic source detection from URL
- Cards imported and displayed in builder
- Missing cards reported to user
- Error message if invalid URL or deck inaccessible
- Import accessible without login

---

### US-04 — Onboarding tutorial first-run

**PR #197** | ✅ Merged on 2026-03-27

**User story**
As a new user, I want to be guided on first login via a wizard and contextual tooltips.

**Acceptance Criteria**

- Wizard triggered on first login (flag `onboardingDone`)
- 3–5 steps: create deck, add card, use builder
- Contextual tooltips on key elements
- Skip anytime
- "Review tutorial" option in settings
- Flag `onboardingDone` set to true after completion or skip
- No regression on auth flow

---

## Sprint 2

---

### US-A — Bulk edit Sideboard & Maybeboard

**PR #199** | ✅ Merged on 2026-03-28

**User story**
As a Commander player iterating on my deck, I want to select multiple cards at once in my Sideboard or Maybeboard and apply grouped actions (move to deck or delete).

**Product Context**
Moxfield already has multi-select. Archidekt has a dedicated Edit mode. Our approach: checkboxes on hover + inline action bar, no mode switch — lighter than Archidekt, more complete than Moxfield.

**Acceptance Criteria**

- Checkbox per card (hover on desktop, always visible on mobile)
- Shift+click range select
- BulkSelectBar: Select all / Deselect all / counter / Move / Delete
- "Add to deck" with color identity validation (invalid cards ignored with toast)
- "Delete" with undo toast 5s
- Maybeboard: "Move to Sideboard" action
- Selection reset after each action
- Confirmation toast with ignored cards detail
- Independent selection between Sideboard and Maybeboard
- No regression on per-card actions

**Delivered**

- `bulkMoveToZone` + `bulkRemoveCards` in store (optimistic update)
- CI ✅ SonarCloud ✅

---

### US-B — Hybrid mana cards support

**PR #200** | ✅ Merged on 2026-03-28

**User story**
As a Commander player building a deck with hybrid cards, I want MagicAIBuilder to correctly detect color identity, display hybrid symbols, and calculate mana statistics accurately.

**Product Context**
Moxfield, Archidekt, TappedOut handle hybrids correctly. Current bug: incorrect color identity, faulty stats. Affected cards: Unmake, Dimir Infiltrator, Kitchen Finks, Reaper King (5 colors).

**Acceptance Criteria**

- `{W/U}` → color identity W + U
- `{2/W}` → color identity W only
- Reaper King `{W/U}{U/B}{B/R}{R/G}{G/W}` → 5 colors
- Hybrid symbols display correctly (icons, not plain text)
- Color distribution: `{W/U}` = 0.5W + 0.5U, `{2/W}` = 1W
- Mana Alignment panel integrates hybrids
- DFC/MDFC: each face analyzed
- No regression on mono-color cards

**Delivered**

- Tests with real MTG cases (Reaper King, Kitchen Finks, Unmake)
- CI ✅ SonarCloud ✅

---

### US-C — Enhanced AI Deck Builder

**PR #201** | ✅ Merged on 2026-03-28

**User story**
As a Commander player building a deck, I want the AI to understand my archetype, respect my budget, and explain each suggestion with clear reasoning.

**Product Context**
EDHRec offers statistical suggestions without reasoning. No competitor does native AI. MagicAIBuilder with Claude/GPT can: understand deck, identify archetype, propose cuts AND adds with reasoned explanation, within budget.

**Acceptance Criteria**

- Automatic archetype detection (Combo, Stax, Voltron, Aristocrats, Tokens, Spellslinger, Reanimator, Ramp, Control, Goodstuff)
- Archetype selector to override detection
- "Max budget per card" field (uses deck budget by default)
- Suggestions respect budget — budget alternative if ideal card too expensive
- Each suggestion: 2–4 line explanation + cut card + priority score (High/Medium/Low)
- Grouped suggestions: Adds / Cuts
- Archetype prompt templates in `src/lib/ai/archetypes.ts`
- Skeleton loader during analysis
- "Analyzed X minutes ago"
- "Add to deck" from suggestion (one click)
- "Ignore" suggestion (won't reappear)
- No banned/out-of-color-identity cards suggested

**Delivered**

- Prompt injection mitigated, archetype validation type-safe, cache invalidation correct
- CI ✅ SonarCloud ✅

---

### US-D — Proxy Sheets PDF Export

**PR #202** | ✅ Merged on 2026-03-28

**User story**
As a Commander player wanting to test my deck physically, I want to export it as printable proxy sheets (PDF or image).

**Product Context**
Moxfield has basic export, Archidekt and TappedOut nothing. MagicAIBuilder can become the print-and-play Commander reference.

**Acceptance Criteria**

- "Export Proxies" button in export menu
- Config modal: format (A4/Letter), layout (3×3 / 2×2), quality (Standard/High), basic lands yes/no, commander yes/no
- PDF generated client-side (no server)
- Magic-standard card size: 63×88mm
- Preview before download
- File named `[DeckName]-proxies.pdf`
- Footer: "Unofficial proxy — Not for sale — MagicAIBuilder"
- DFC/MDFC: front face only
- Placeholder if image unavailable
- Progress indicator during image loading
- Page count estimate in modal
- `@page { size: A4; margin: 5mm; }`, `width: 63mm; height: 88mm;`
- No regression on other exports

---

## Sprint 3

---

### US-E — Import from URL tournament (6 sources)

**PR #204** | ✅ Merged on 2026-03-28

**User story**
As a Commander player wanting inspiration from competitive decks, I want to paste a deck URL (MTGTop8, MTGDecks, EDHRec, Moxfield, Archidekt, TappedOut) and automatically import all cards.

**Product Context**
Moxfield offers import from Moxfield only. MagicAIBuilder supports 6 sources in one unified modal.

**Acceptance Criteria**

- "Import from URL" tab in existing import modal
- Automatic source detection (badge "Moxfield detected ✓")
- Sources: Moxfield, Archidekt, TappedOut, MTGTop8, MTGDecks, EDHRec
- Proxied calls via `/api/import/[source]` (no direct client calls)
- Import report: "98 cards imported, 2 not found: [list]"
- Commander auto-detected and placed in commander slot
- "Deck imported — [Source]" badge on deck
- Rate limiting: 10 imports/min/IP
- Zod URL validation
- Error messages per case (private deck, not found, timeout, non-Commander format)

**Delivered**

- 6 sources + rate limiting, slug validation, timeouts
- CI ✅ SonarCloud ✅

---

### US-F — Meta Analysis — Top cards & decks for Commander

**PR #205** | ✅ Merged on 2026-03-28

**User story**
As a Commander player building around a specific commander, I want to see the most popular cards and competitive decks using that commander, right in the builder.

**Product Context**
EDHRec is the community reference but external. MTGTop8/MTGDecks add tournament dimension. MagicAIBuilder integrates both in the builder, with one-click add.

**Acceptance Criteria**

- "Meta" tab in right panel (active if commander selected)
- "Popular" section: top 20 EDHRec cards, % of decks playing each
- Cards already in deck: ✓ green
- "+ Add" button (color identity validation)
- "Competitive" section: 5 latest tournament decks, "Import this deck" button
- DB cache (TTL 24h): `meta_cache` table
- Skeleton loader
- "Refresh" button
- Partner commanders: aggregate both
- API down: cached data with date badge

**Delivered**

- Prisma cache with stale-on-error, distinct rate limit, slug validation, timeouts
- CI ✅ SonarCloud ✅

---

## Sprint 4 (in progress)

---

### US-G — Collection Tracking + Shopping List

**PR —** | 🔄 In Progress

**User story**
As a Commander player building decks on a budget with a partial collection, I want to mark cards I already own and see what I'm missing with total price, so I can generate accurate shopping lists.

**Product Context**
Feature absent from Moxfield, partial in Archidekt and Deckbox. Strong retention differentiator: users return regularly to update collection.

**Acceptance Criteria**

- Owned/missing icon on each deck card
- Click toggle, persisted in DB (`collection` table: `userId`, `scryfallId`, `quantity`)
- "Mark all as owned" + "Reset"
- "Collection" section in Stats panel: "73/99 cards", progress bar, missing cost
- Shopping list modal: missing cards, unit price, sort by price desc, total
- CSV export + "Copy list"
- `/collection` page: all owned cards across all decks
- Unlogged user → feature disabled
- Cards without price → "Price unknown", excluded from total
- Owned state is **global** (same card in multiple decks)
- Basic lands → owned by default

**Architecture**

- Prisma `collection` table: `(userId, scryfallId)` unique
- Routes: `POST /api/collection/toggle`, `GET /api/collection/shopping-list/[deckId]`
- Zustand store: `collectionMap: Record<scryfallId, boolean>`

---

### US-H — Support multiple formats

**PR —** | ⏳ Waiting

**User story**
As an MTG player playing multiple formats, I want to use MagicAIBuilder to build Standard, Pioneer, Modern, Legacy, Vintage, Pauper, Brawl, and Oathbreaker decks with correct rules and banlists per format.

**Product Context**
MagicAIBuilder is Commander-only. Moxfield, Archidekt, TappedOut support all formats. Major gap for non-Commander user acquisition.

**Acceptance Criteria**

- Format selector at deck creation (Commander default)
- Deck size rules per format: Commander 100, Standard/Pioneer/Modern/Legacy 60, Pauper 60, Brawl 60, Oathbreaker 60, Vintage 60
- Correct banlist per format (via Scryfall `legalities` per card)
- Format-adapted stats (no bracket scoring outside Commander)
- Search filters cards legal in selected format
- Standard deck cannot contain Commander-only cards
- No regression on Commander

---

### US-I — Community deck suggestions

**PR —** | ⏳ Waiting

**User story**
As a Commander player, I want to see community-submitted decks for a given commander, rate and comment, to inspire and share my creations.

**Product Context**
EDHRec dominates this space but is external. TappedOut has community sharing. MagicAIBuilder can integrate natively with public decks already created by users (US-02).

**Acceptance Criteria**

- `/commanders/[slug]/decks` page: public decks for this commander
- Sort: recent, popular (upvotes), budget
- Upvote/downvote per deck (1 vote per user)
- Comments on public deck (free text, basic moderation)
- "Community Favorite" badge if > 10 upvotes
- Integration in builder Meta panel (US-F): "Community Decks" section

---

### US-J — i18n multi-language

**PR —** | ⏳ Waiting

**User story**
As a non-English MTG player, I want to use MagicAIBuilder in my language, with card names, oracle text, and UI translated.

**Product Context**
MTG printed in 11 languages. Moxfield is English-only. Massive acquisition opportunity — Japanese, French, Spanish, Portuguese players are huge markets.

**Acceptance Criteria**

- Initial support: EN (default), FR, JA, DE, ES, PT, ZH-Hans, IT
- `next-intl` for UI translations
- Card names and oracle text via Scryfall `lang` parameter
- Auto-detect browser language
- Language selector in settings
- Fallback to EN if translation missing
- Localized URLs (`/fr/`, `/ja/`) optional (v2)

---

## Sprint 5 (planned)

---

### US-K — Enhanced Playtest Mode

**PR —** | 🔄 In Progress

**User story**
As a Commander player, I want a richer playtesting experience with hand management, library draw simulation, and turn management.

**Acceptance Criteria**

- Hand draw with Fisher-Yates shuffle
- London mulligan rules
- Turn management with phase tracking
- Full-screen playtest modal
- Library pile counter

---

### US-L — Advanced Deck Analytics

**PR —** | ⏳ Waiting

**User story**
As a deck builder, I want deeper analytics: card synergies, threat density, interaction ratio, and format-specific recommendations.

**Acceptance Criteria**

- Synergy scoring per card
- Threat density ratio
- Interaction-to-ramp ratio
- Format-specific stats
- Recommendations based on meta

---

_Last updated: 2026-04-03 — PeeWy 📋_
