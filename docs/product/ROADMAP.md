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

Top candidates right now (subject to change):

- **Dependabot** — Weight **5** (low effort, high security value)
- **Enhance Scryfall API usage (caching/batching/error recovery)** — Weight **5** (core perf + UX)
- **UptimeRobot** — Weight **4** (early production safety net)
- **Structured logging (Pino)** — Weight **4** (debuggability once real users arrive)
- **Bundle analyzer (monthly)** — Weight **3**
- **Visual redesign** — Weight **3** (big surface area, schedule when stable)
- **Multi-language support (i18n)** — Weight **2** (valuable, but big effort; after MVP traction)
- **Local AI model via MageZero** — Weight **1** (very high effort / research)

# Part 1 — Technical Roadmap

## Tech Stack Decisions

Preferred technology choices for new infrastructure. Based on cost, DX, and reliability.

### Database

- [ ] **Use Neon (PostgreSQL)** for managed database — serverless Postgres, generous free tier, branches for preview environments. Avoid Supabase (vendor lock-in, mixed reviews on scaling) and MongoDB (poor fit for relational deck/card data).
- Current: Prisma + SQLite (dev) / PostgreSQL (prod). Neon is the recommended hosted Postgres provider.

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

- [ ] **Enhance Scryfall API usage**: smarter caching, request batching, better error recovery, and rate-limit handling to reduce redundant calls and improve load times

- [ ] **Public external API**: expose MagicAIBuilder data and deck operations as a versioned REST (or GraphQL) API, likely in a separate repository; enables third-party integrations, mobile clients, and CLI tooling; requires auth (API keys or OAuth2), rate limiting, OpenAPI documentation, and versioning strategy

---

## Observability

Set up progressively: start with Level 1 immediately, add Level 2 when real users arrive, Level 3 when the product is serious.

### Level 1: Minimum viable (recommended now)

- [x] **Sentry** (`@sentry/nextjs`) _(done — 2026-03-25)_: automatic error capture on frontend and backend; EU data center

- [x] **Health check endpoint**: `GET /api/health` returns DB connectivity status (`200 ok` / `503 degraded`)
- [ ] **UptimeRobot** (once deployed): go to uptimerobot.com, create a free account, add a new HTTP(s) monitor pointing to `https://<your-domain>/api/health`, set interval to 5 minutes, and add an alert contact (email or Discord webhook) — free plan includes 50 monitors

- [ ] **Bundle analyzer** (`@next/bundle-analyzer`): visual map of JS bundle size per dependency; run once a month to catch bloat before it impacts load times

- [ ] **Dependabot** (GitHub native, zero config): add `.github/dependabot.yml` to get automatic PRs when npm dependencies have security vulnerabilities; free, catches CVEs before they become problems — **recommended first for a solo project**

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

- [ ] **Multi-language support**: add i18n support (next-intl or next-i18next) covering the languages Magic: The Gathering is officially printed in; base set: English, Japanese, Simplified Chinese, French, Italian, German, Spanish, Portuguese; to be added later: Russian, Korean
- [ ] **Localized card data**: fetch and display card names, oracle text, and type lines in the user's language via Scryfall's `lang` parameter
- [ ] **UI translations**: translate all interface labels, tooltips, error messages, and navigation using a locale file system; keep English as the fallback

---

---

# Part 2 — Functional Roadmap

## Card Type Support

- [x] **MDFC (Modal Double-Faced Cards)**: full support for MDFCs (e.g. Shatterskull Smashing // Shatterskull, the Hammer Pass): display both faces, let the player choose which face to show in the deck list and grid, count CMC correctly (front face only), and flag them in mana curve/statistics as flexible land-or-spell cards

- [x] **Double-faced cards (DFC): flip/transform**: cards with two faces where only one is playable at a given time (e.g. Delver of Secrets // Insectile Aberration, werewolves): show the front face by default, allow flipping the preview, and correctly handle image fetching for both faces via Scryfall (`card_faces`)

- [x] **Hybrid cards** _(done — 2026-03-28, #200)_: cards with hybrid mana costs (e.g. {W/U}, {2/W}) where the caster can pay either color: correctly parse hybrid symbols in mana cost display, attribute both colors to the color identity, and account for hybrid pips in mana symbol proportion statistics (each hybrid pip counts as 0.5 toward each color, or as the chosen color)

---

## Deck Editor

- [x] **Deck Snapshots** _(done — 2026-03-26)_: save named versions of a deck with full card list; restore any snapshot transactionally; diff badge shows +/- cards vs. current deck

- [x] **Maybeboard** _(done — 2026-03-26)_: track considered cards outside the 99; move cards between Maybeboard and Main; excluded from all stats and export totals

- [x] **Deck annotations** _(done — 2026-03-26)_: deck description (collapsible textarea), card notes (inline popover, exported as comments), deck tags (pill UI, home-page filter bar)

- [x] **Bulk edit on Sideboard & Maybeboard** _(done — 2026-03-28, #199)_: select multiple cards at once and move/remove them in bulk; checkbox multi-select with bulk move to Main / Maybeboard / Sideboard and bulk remove

---

## Search & Filtering

- [x] **Enhanced deck-building filters**: filter cards by subtype, keyword, power/toughness, price range, set legality, and interaction type while building; add saved filter presets _(done — color OR/AND/EXACT modes, colorless filter, lands toggle, CMC exact/min/max/range modes, price range, subtype, keyword, power/toughness, interaction archetypes, localStorage presets)_

- [x] **Search By Type tab** _(done — 2026-03-26, #174)_: new "By Type" search mode in the builder with checkbox filters for Creature, Instant, Sorcery, Enchantment, Artifact, Planeswalker, Land, Battle, MDFC, and DFC (Transform); OR-joined Scryfall queries; optional name filter

---

## AI

- [x] **Enhance AI deck builder** _(done — 2026-03-28, #201)_: archetype templates (stax, combo, voltron, control, aggro, midrange), budget constraint parameter, per-card rationale explaining each suggestion

- [ ] **Local AI model for deck building via MageZero**: use [MageZero](https://github.com/WillWroble/MageZero) — a reinforcement-learning engine that plays Magic — to generate training data (game states, card evaluations, winning lines) and fine-tune a local model (Ollama or equivalent) specialized in Commander deck building; the local model would power card suggestions, synergy detection, and archetype recommendations without relying on a cloud API

---

## Export / Print / Proxy

- [x] **Proxy sheet export — print-ready PDF** _(done — 2026-03-28, #202)_: configurable layout (3×3 A4/Letter, 2×2, 1×1), PDF via browser print API, image-only export with cropped card art
- [ ] **Richer export format options**: EDHRec, Goldfish (import only), extended Archidekt import/export

---

## Statistics

- [x] **Enhanced deck statistics** _(done — 2026-03-26)_:
  - Cards playable on turn 1 (`turn1Playable` stat)
  - Corrected CMC split: `avgCmcWithLands` and `avgCmcWithoutLands`
  - Mana Alignment panel: per-colour symbol ratio vs. land production ratio with imbalance warnings
  - `recommendedLandsByColor` per-colour land recommendations
  - Hybrid pips counted as 0.5 toward each colour

---

## Playtesting

- [x] **Hand draw & goldfishing** _(done — 2026-03-26)_: `usePlaytest` hook with Fisher-Yates shuffle, London mulligan, `drawCard`, `nextTurn`; `PlaytestModal` fullscreen with fan hand display, hover card preview, library pile counter

---

## Formats

- [ ] **Support all MTG formats**: not only Commander/Multiplayer; add Standard, Pioneer, Modern, Legacy, Vintage, Pauper, Brawl, Oathbreaker, etc. with correct deck size and banlist enforcement per format

- [ ] **Per-format deck statistics**: bracket scoring is Commander-specific; provide relevant stats for each format (curve quality, threat density, interaction ratio, etc.)

---

## User Accounts

- [ ] **User account system**: registration, login, profile management (CRUD), secure authentication (OAuth2 / JWT), deck ownership and private/public visibility, GDPR compliance

---

## Community

- [ ] **Deck suggestions from other players**: for a given commander, show community-submitted decks; filter by bracket, strategy, budget; upvote/comment system

---

## UI / UX

- [x] **Footer layout** _(done — 2026-03-26, #166)_: Shortcuts button aligned inline with copyright line in footer

- [x] **Mobile-responsive layout** _(done — 2026-03-27, #189)_: header hamburger menu, builder tab navigation, collection grid
- [ ] **Visual redesign**: modernize the interface; improve card hover interactions, drag-and-drop UX, and overall polish

---

## Partnerships & Integrations

- [ ] **Tool integrations**: explore partnerships or API integrations with Mythic Tool, EDHRec, Moxfield, Commander Spellbook, and other community tools for richer data and cross-platform syncing

---

## Tournament Decks Import

Import competitive decklists directly from tournament databases to use as references, inspiration, or starting points for deck building.

### Sources to support

- [x] **MTGTop8** (`https://www.mtgtop8.com`) _(done — 2026-03-28, #204)_
- [x] **MTGDecks.net** (`https://mtgdecks.net`) _(done — 2026-03-28, #204)_
- [x] **Moxfield** (`https://www.moxfield.com`) _(done — 2026-03-27, #198)_
- [x] **EDHRec** (`https://edhrec.com`) _(meta panel done — 2026-03-28, #205)_
- [x] **Archidekt** (`https://archidekt.com`) _(done — 2026-03-27, #198)_
- [x] **TappedOut** (`https://tappedout.net`) _(done — 2026-03-28, #204)_
- [ ] **Goldfish** (`https://mtggoldfish.com`) — import by URL (planned)

### Implementation approach

- [x] "Import from URL" field in import dialog alongside plain text import
- [x] Source detection from URL (regex match per domain) with appropriate parser/fetcher
- [x] Rate-limited requests, respecting `robots.txt` and fair-use policies (#204)
- [x] "Tournament Deck" badge displayed on imported decks (#204)
- Optionally show win rate / event context if available from the source (future)

### Tournament meta analysis

- [x] Commander meta analysis panel — EDHRec + tournament aggregation _(done — 2026-03-28, #205)_
- [x] Most popular cards across meta decks shown as complement to AI suggestions
- [ ] Track meta shifts over time (card frequency in/out) — future
