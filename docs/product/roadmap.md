# MagicAIBuilder: Roadmap

Tracked features and improvements for future development, split into **Technical** (infrastructure, tooling, stack) and **Functional** (user-facing features, gameplay).

---

## Rough weighting (quick prioritization)

This is a **rough** first-pass weighting using a lightweight RICE/MoSCoW hybrid:

- **Weight 5**: Must-have / unblocks core product / high leverage
- **Weight 4**: High value soon, but not blocking
- **Weight 3**: Useful improvement, can wait
- **Weight 2**: Nice-to-have / polish
- **Weight 1**: Experimental / long-term / speculative

Top candidates right now (reviewed 2026-08-17):

- **Finish i18n string extraction** — Weight **4** _(in progress — three components left: `TemplatesModal`, `BulkEditModal`, `ImportFromUrlTab`, ~750 lines)_
- **Diagnose the intermittent e2e failure** — Weight **4**, raised from 3: it now blocks pushes, having taken three attempts to land one branch. The Playwright report finally escapes its container (#436), so the next occurrence leaves evidence. Known: `deck-builder.spec.ts:55` and the community public-deck spec, the click fires and the URL stays on `/builder/<id>`. Two hypotheses already ruled out — see `quality-gate.md`
- **Localized card data via Scryfall `lang`** — Weight **4** _(in progress — PR #415 covers the printing selector; the other card surfaces remain)_
- **UptimeRobot** — Weight **4** (early production safety net, now that a database exists again)
- **Migrate `setRequestLocale` to `next/root-params`** — Weight **2**. next-intl deprecates it, but the replacement ships `unstable_rootParams` and a stub `.d.ts` in Next 15.5.22. The three SonarCloud warnings are marked accepted with that reason. Revisit when it stabilises
- **Structured logging (Pino)** — Weight **3**. `src/lib/logger.ts` already centralises every call site and forwards to Sentry; only the JSON format is missing
- **Visual redesign** — Weight **3** (big surface area, schedule when stable)
- **Local AI model via MageZero** — Weight **1** (very high effort / research)

# Part 1 — Technical Roadmap

## Tech Stack Decisions

Preferred technology choices for new infrastructure. Based on cost, DX, and reliability.

### Database

- [x] **Use Neon (PostgreSQL)** _(done — 2026-08-16)_ — provisioned via the Vercel Marketplace and connected to production, preview and development. Migrated off Supabase, whose project had been deleted or auto-paused: `/api/health` returned `503 ENOTFOUND tenant/user not found`, every sign-in failed, and **all prior production data was lost with it**. Neon also ends the Supabase pooler gymnastics — direct connections were IPv4-only and unreachable from Vercel's IPv6, the session pooler hit `MaxClientsInSessionMode`, and only the transaction pooler on 6543 worked.
  - **Migrations must use `DATABASE_URL_UNPOOLED`.** The pooled URL routes through PgBouncer in transaction mode and breaks Prisma Migrate with errors that never mention pooling.
- **Current**: Prisma 6.x (7.x upgrade pending) + Neon Postgres (prod), Docker Postgres 16 on 5432 (dev).

### Authentication

- [x] **NextAuth.js v5** _(done — 2026-03-27)_: Google OAuth + credentials auth already implemented.
- [ ] **Evaluate Better-Auth** as a future replacement or complement — simpler API, better DX than Clerk or Auth0. Clerk is explicitly not recommended (pricing, complexity, lock-in).

### File Storage

- [ ] **Cloudflare R2** for file/image storage — S3-compatible API, zero egress fees, cheapest option available. Avoid AWS S3 (egress costs) and Supabase Storage (tied to Supabase ecosystem).
- Use cases: deck thumbnails, user avatars, exported deck images, proxy sheet PDFs.

### Domain & DNS

- [ ] **Porkbun or Cloudflare** for domain registration and DNS — better UX, cheaper, faster than Namecheap. Cloudflare also provides free CDN, DDoS protection, and R2 integration.

### Hosting

- Current: Vercel (Next.js native). No change planned.

---

## API & Data

- [x] **Enhance Scryfall API usage** _(done — PR #289)_: server-side search cache (1h TTL), serialized rate limiter, name-based card cache, TanStack Query gcTime fix, shared fetchAllPages utility

- [ ] **Public external API**: expose MagicAIBuilder data and deck operations as a versioned REST (or GraphQL) API, likely in a separate repository; enables third-party integrations, mobile clients, and CLI tooling; requires auth (API keys or OAuth2), rate limiting, OpenAPI documentation, and versioning strategy

---

## Observability

Set up progressively: start with Level 1 immediately, add Level 2 when real users arrive, Level 3 when the product is serious.

### Level 1: Minimum viable (recommended now)

- [x] **Sentry** (`@sentry/nextjs`) _(done — 2026-03-25)_: automatic error capture on frontend and backend; EU data center
- [x] **Health check endpoint** _(done)_: `GET /api/health` returns DB connectivity status (`200 ok` / `503 degraded`)
- [x] **Error reporting wired end to end** _(done — PR #392)_: `src/instrumentation.ts` with `register()` + `onRequestError`, `instrumentation-client.ts` replacing the deprecated root config, `logger.error` forwarding to `Sentry.captureException`, and `error.tsx` / `global-error.tsx` boundaries. Before this, **no server-side error reached Sentry at all** — the routes catch into a JSON 500, so automatic instrumentation never saw them
- [ ] **UptimeRobot** (once deployed): monitor `https://<your-domain>/api/health` every 5 minutes with email/Discord alerts — free plan includes 50 monitors
- [x] **Bundle analyzer** (`@next/bundle-analyzer`) _(already in place)_: wired in `next.config.ts`, run with `pnpm analyze`
- [x] **Dependabot** (GitHub native) _(already in place)_: `.github/dependabot.yml`, weekly, two groups, majors ignored

### Level 2: When you have real users

- [ ] **Vercel Analytics**: real-world performance metrics per page and device: LCP, CLS, INP (Core Web Vitals); free on the hobby plan if deploying to Vercel

- [ ] **PostHog**: open-source product analytics, self-hostable; track which features users actually use, identify abandoned flows (e.g. "80% of users never click AI Suggestions -> UX problem"); free up to 1M events/month — **recommended second: understand how people actually use the tool**

- [ ] **Plausible**: simple, privacy-friendly traffic analytics (GDPR compliant, no cookies); good alternative to PostHog if you only need page views and referrers, not event tracking

- [ ] **LogRocket**: session replay — watch exactly what users did before an error occurred; useful for understanding UX issues in the deck builder; free tier available

- [ ] **Lighthouse CI**: add to GitHub Actions to score performance/accessibility/SEO on every PR; catches regressions before they ship; pairs well with Next.js; **recommended** to keep Next.js perf under control

- [ ] **Chromatic**: visual regression testing — takes screenshots of shadcn/ui components on every PR and diffs them; catches unintended UI changes; free for open-source

- [ ] **Structured logging**: replace `console.error("[GET /api/decks]", error)` with a structured JSON logger (Pino is the Node standard); emit `level`, `timestamp`, `requestId`, `route`, and `error` fields so logs are searchable after the fact

### Level 3: When it's serious

- [ ] **Datadog or Better Uptime**: full-stack monitoring with dashboards, anomaly detection, and SLA tracking; more powerful than UptimeRobot but paid

- [ ] **Snyk**: deeper dependency vulnerability scanning than Dependabot; scans container images and IaC configs too; useful if the project grows beyond a solo hobby

- [ ] **Grafana + Prometheus**: custom monitoring dashboards: Scryfall requests per minute, API route response times, decks created per day; self-hosted, powerful, significant setup cost

- [ ] **OpenTelemetry**: distributed tracing across the full request path (click -> API route -> Prisma query -> Scryfall call -> response); pinpoints exactly where latency comes from; Next.js 15 has experimental native support

- [ ] **PagerDuty / OpsGenie**: serious alerting with on-call rotation and escalation policies; relevant for teams, not needed as a solo developer

---

## SEO & Discoverability

- [x] **SEO optimization** _(done — 2026-03-26, #153)_: `robots.txt` (blocks private routes), dynamic sitemap with shared decks, enriched metadata (keywords, Twitter card, canonical URL), JSON-LD `SoftwareApplication` structured data, dynamic Open Graph image via `/api/og` edge route

---

## Internationalization (i18n)

- [x] **Multi-language support**: next-intl v4, `[locale]` App Router segment, composed middleware (next-intl + NextAuth) _(done — PR #320)_
- [x] **Two locales served, eight dormant** _(done — PR #398)_: `en` and `fr` are routed; `de, it, es, ja, zh, ko, ru, pt` keep their catalogs in `DORMANT_LOCALES` but are not served. They were machine-seeded English copies, and translating the interface around card text that is itself still English would ship a half-translated product in eight languages instead of a coherent one in two. Re-activating one is a single-line move once a speaker has translated it
- [x] **Language switcher** _(already in place)_: `src/components/layout/LocaleSwitcher.tsx`, mounted in the header
- [x] **Key-parity guard** _(done — PR #397)_: `messages.test.ts` fails the unit suite when any locale's key set diverges from `en`. A key present only in `en` renders as its raw dotted path everywhere else
- 🔄 **String extraction** _(in progress)_: 77 of 125 components held hardcoded English. Done: search panel (#397), playtest zones (#406), card and collection (#409), deck stats panels (#428), budget and shopping list (#433), bracket and buy list (#439), proxy export (#445). **Remaining: `TemplatesModal`, `BulkEditModal`, `ImportFromUrlTab`** — ~750 lines.

  Every slice found a defect the hardcoded strings were hiding, which is why this is done in slices rather than one pass: **eight hand-built English plurals** (`card${n === 1 ? "" : "s"}` — invisible while the UI is English, unfixable once it is not); the considering zone named _"Maybeboard"_ in a panel and _"Considering"_ on its tab; `ColorDistribution` duplicating a colour-name table `stats.color.*` already held; a French string in the English UI; and a euro sign on figures that were always USD

- 🔄 **Localized card data** _(in progress — PR #415)_: card name, type line and rules text now read from a printing in the viewer's language, with **per-field** English fallback (Scryfall fills `printed_name` / `printed_type_line` / `printed_text` independently, so an all-or-nothing fallback would blank a card's rules whenever one field was missing). Wired into the printing selector, the one place the app renders raw Scryfall text. **Remaining**: the other card surfaces. Card names stay English in search, storage, import and export — a translated name written into `DeckCard` rows would denormalise a translation into every deck holding the card

---

---

# Part 2 — Functional Roadmap

## Card Type Support

- [x] **MDFC (Modal Double-Faced Cards)** _(done)_: display both faces, player chooses which to show, correct CMC (front face), flexible land-or-spell flagging
- [x] **Double-faced cards (DFC) / Flip / Transform** _(done)_: front face default, flip preview, correct image fetching via Scryfall `card_faces`
- [x] **Hybrid cards** _(done — #200)_: correct color identity parsing, symbol display, 0.5 pip distribution per color

---

## Deck Editor

- [x] **Deck Snapshots** _(done)_: save/restore/diff versioned decks with card count tracking
- [x] **Maybeboard & Sideboard** _(done)_: track cards outside the 99/100, excluded from stats
- [x] **Deck annotations** _(done)_: description (markdown), card notes, tags with home-page filtering
- [x] **Bulk edit** _(done — #199)_: multi-select with bulk move/delete and color identity validation
- [x] **Ikoria Companion (sideboard slot)** _(done — #283)_: dedicated companion zone (not the same as Sideboard pile), **Companion** search mode (`keyword:companion`), rule summaries + warnings (Lurrus / Gyruda / color / Lutri), bracket + `validateDeck` integration — full design & rules notes in [`docs/product/companion-implementation.md`](./companion-implementation.md)

---

## Search & Filtering

- [x] **Advanced filters** _(done)_: color (OR/AND/EXACT), colorless, lands, CMC (exact/min/max/range), price, subtype, keyword, P/T, interaction archetype, saved presets
- [x] **Search By Type tab** _(done)_: Creature, Instant, Sorcery, Enchantment, Artifact, Planeswalker, Land, Battle, MDFC, DFC with OR-joined Scryfall queries

---

## AI

- [x] **Enhanced AI deck builder** _(done — #201)_: 10 archetype templates (Stax, Combo, Voltron, Aristocrats, Tokens, Spellslinger, Reanimator, Ramp, Control, Goodstuff), budget constraints, per-card reasoning
- [ ] **Local AI model via MageZero** _(experimental)_: fine-tune local model for deck building without cloud API dependency

---

## Export / Print / Proxy

- [x] **Proxy sheet PDF export** _(done — #202)_: configurable layout (3×3 A4/Letter, 2×2), client-side generation, 63×88mm cards, optional basic lands/commander
- [x] **Text-only proxy sheets** _(already shipped)_: `includeCardArt: false` in `src/lib/deck/proxy.ts` renders art-free card boxes with name, mana cost, type line, oracle text and P/T; covered by unit and e2e tests. _(If the intent was a literal plain-text list rather than art-free card boxes, that is a separate render mode and still open.)_
- [ ] **Richer export formats**: EDHRec, Goldfish (import only), extended Archidekt

---

## Statistics

- [x] **Deck statistics** _(done)_: mana curve, colour distribution (0.5 pip hybrid), category breakdown, average CMC excluding lands, Game Changers, price and budget checks, theme detection

> **Correction (2026-08-16).** This entry previously claimed _turn 1 playability_, a _mana alignment panel with warnings_ and _per-color land recommendations_ as done. **No code implemented any of the three.** They were reopened below, then built the same day.

- [x] **Turn 1 playability** _(done — PR #412)_: exact hypergeometric odds that the opening seven holds a land and a one-drop, plus a stricter per-colour read requiring a matching source. Computed by inclusion–exclusion rather than sampled, so the figures do not wobble between visits. The two figures are never summed: one hand can satisfy two colours at once, and a hybrid one-drop counts for each colour that casts it
- [x] **Mana alignment panel** _(done — PR #410)_: pips the spells ask for against sources the lands produce, flagged past 15 points of deviation. Scryfall's `produced_mana` is stored nowhere in this codebase, so land production is derived from printed text — subtypes after the em dash, then the land's own "Add …" clauses, then colour identity
- [x] **Per-colour land recommendations** _(done — PR #410)_: each colour's suggested source count, proportional to its share of pips. Same panel as the alignment read — they share the pip distribution, so splitting them would have computed it twice

---

## Playtesting

- [x] **Hand draw & goldfishing** _(done)_: Fisher-Yates shuffle, London mulligan rules, fullscreen modal, fan hand display, library counter
- [x] **Enhanced Playtest Mode** _(done — PR #394)_: turn phases (Untap → End), life tracking with history and 10-step undo, battlefield / graveyard / exile zones with tap and counters, London mulligan, starting life from `FormatConfig`. The engine, store and five zone components already existed and were unit-tested — nothing outside their own tests imported them, and the modal still ran a hand-only hook
- [x] **Playtest session analytics** _(done — PRs #418, #421)_: `PlaytestSession` model, route, recording bar and history panel. `analytics.ts` had held win rate, mulligan distribution, matchup splits and daily trend since US-AG Phase 1, written and tested but reachable from nothing. The result is **user-declared**: the playtest is a solitaire goldfish with no opponent, so turns and mulligans come off the engine but only the player can say how a run went — and skipping records nothing, since an abandoned run is not a loss. Records are private to the account, not the deck
- [ ] **Difficulty on recorded sessions**: the schema and validation accept `budget` / `mid-range` / `cedh` and `getMatchupStats` already groups by it, but the recording bar never asks — so the matchup breakdown has no data to show

---

## Formats

- [x] **Multiple format support** _(done — PR #299)_: 9 formats (Commander, Brawl, Oathbreaker, Standard, Pioneer, Modern, Legacy, Vintage, Pauper) with centralized `FORMAT_CONFIG`, format-aware search queries, banlists, validation (deck size, singleton, max copies), and conditional bracket scoring
- [x] **Format-specific statistics** _(done — PR #395)_: curve, threat density and interaction ratio per format, benchmarked against bands in `FORMAT_CONFIG`. Ratios are taken against non-land cards so a 60-card and a 100-card list are comparable. Also fixed two Commander assumptions leaking into other formats: the card count read `60/100`, and bracket targets were labelled "target for B3" in formats that have no brackets. **The bands are heuristic starting points, not tournament data** — tune them as evidence arrives

---

## User Accounts & Auth

- [x] **User account system** _(done)_: NextAuth.js v5 with Google OAuth + credentials, public profiles, deck ownership, private/public decks
- [ ] **Evaluate Better-Auth**: simpler DX than Clerk; future replacement/complement consideration

---

## Community

- [x] **Ratings, reviews and follows** _(done — PR #389)_: 1–5 stars with written reviews, quality badges, directed user follows
- [x] **Community deck discovery** _(done — PR #396)_: public `/commanders/[slug]/decks`, up/down votes, "Community Favourite" badge. Before this **nothing listed public decks at all** — `/api/decks` never filtered on `isPublic`, so a shared deck was reachable only by its direct link. Votes are deliberately separate from stars: stars answer "how good is this deck", a vote answers "should this deck rank near the top", and only the vote score orders the listing
- [x] **Integration in Meta panel** _(done — PR #396)_: the panel links through to the commander's community decks
- [ ] **Deck comments**: a threaded comment stream. `DeckRating.title`/`body` already carries one written review per user per deck; a separate stream is its own feature, with its own moderation surface
- [ ] **Denormalise the commander on `Deck`**: commander identity lives on the deck's _cards_, so `/api/community/commanders/[slug]/decks` cannot match the slug in SQL and slugs public decks in memory. Fine at current volume, not indefinitely

---

## UI / UX

- [x] **Footer layout** _(done)_: Shortcuts button aligned inline with copyright
- [x] **Mobile-responsive layout** _(done)_: hamburger menu, tab navigation, responsive grid
- [x] **3D Spellbook landing page** _(done — PR #300)_: Three.js/R3F immersive scene for unauthenticated visitors; procedural book on altar, glowing glyphs, mana particles, cinematic camera zoom, bloom/vignette; mobile/a11y static fallback
- [x] **Collection tracking enhancements** _(done — PR #290)_: basic lands owned by default, mark all/reset buttons, quick-add from search, full collection CSV/text export
- [ ] **Visual redesign**: modernize interface, improve card hover interactions, enhance drag-and-drop UX

---

## Partnerships & Integrations

- [ ] **Tool integrations**: explore partnerships or API integrations with Mythic Tool, EDHRec, Moxfield, Commander Spellbook, and other community tools for richer data and cross-platform syncing

---

## Tournament Decks & Meta Analysis

### URL Import Sources (✅ all complete)

- [x] **MTGTop8**, **MTGDecks.net**, **Moxfield**, **Archidekt**, **TappedOut** _(done — #204)_
- [x] **EDHRec** _(meta panel done — #205)_
- [ ] **Goldfish** (`https://mtggoldfish.com`) — future import source

### Implementation (✅ all complete)

- [x] "Import from URL" with auto-detection and parser per domain (#204)
- [x] Rate-limited requests (10/min/IP), respects `robots.txt`
- [x] "Tournament Deck" badge on imported decks
- [x] Commander meta panel — top 20 EDHRec cards + 5 latest tournament decks _(#205)_
- [ ] Show win rate / event context from tournament sources (future)
- [ ] Track meta shifts over time (future)
